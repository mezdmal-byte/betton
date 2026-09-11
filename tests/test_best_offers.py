"""GET /markets best_offers and authenticated orderbook available_to_me."""
import uuid

import pytest

from app.services import p2p_service as p2p
from tests.test_p2p import market, ready, submit


def _listed(client, mid):
    rows = client.get("/markets").json()
    return next(item for item in rows if item["id"] == mid)


def test_best_offers_empty_one_side_two_side_and_closed(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    empty = _listed(client, mid)
    assert empty["best_offers"] == [None, None]
    assert empty["accepting_bets"] is True

    submit(client, mid, ha, 0, 10, 2)
    one = _listed(client, mid)
    assert one["best_offers"][0] is None
    assert one["best_offers"][1]["odds"] == pytest.approx(2.0)
    assert one["best_offers"][1]["available"] == pytest.approx(10.0)
    book = client.get(f"/markets/{mid}/orderbook").json()
    assert one["best_offers"][1]["odds"] == pytest.approx(book["sides"][1][0]["odds"])
    assert one["best_offers"][1]["available"] == pytest.approx(book["sides"][1][0]["available"])

    submit(client, mid, hb, 1, 11, 3)
    two = _listed(client, mid)
    assert two["best_offers"][0] is not None
    assert two["best_offers"][1] is not None
    assert two["best_offers"][0]["odds"] == pytest.approx(1.5)
    assert two["best_offers"][1]["odds"] == pytest.approx(2.0)
    detail = client.get(f"/markets/{mid}").json()
    assert detail["best_offers"] == two["best_offers"]

    assert client.post(f"/markets/{mid}/close", headers=ah).status_code == 200
    closed = _listed(client, mid)
    assert closed["best_offers"] is None
    assert closed["accepting_bets"] is False
    resolved = client.post(f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 0})
    assert resolved.status_code == 200
    done = _listed(client, mid)
    assert done["best_offers"] is None
    assert done["status"] == "resolved"


def test_list_markets_best_offers_does_not_n_plus_one_book(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    other = market(client, ha)
    assert client.post(f"/markets/{other['id']}/approve", headers=ah).status_code == 200
    submit(client, mid, ha, 0, 10, 2)
    submit(client, other["id"], hb, 1, 5, 2)
    calls = []
    real = p2p.book

    def wrapped(*args, **kwargs):
        calls.append(1)
        return real(*args, **kwargs)

    monkeypatch.setattr(p2p, "book", wrapped)
    listed = client.get("/markets").json()
    ids = {row["id"] for row in listed}
    assert mid in ids and other["id"] in ids
    first = next(row for row in listed if row["id"] == mid)
    second = next(row for row in listed if row["id"] == other["id"])
    assert first["best_offers"][1] is not None
    assert second["best_offers"][0] is not None
    assert calls == []


def test_own_resting_order_is_not_executable_liquidity_for_same_user(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 20, 2)
    public = client.get(f"/markets/{mid}/orderbook").json()
    assert "available_to_me" not in public
    assert public["sides"][1]
    own = client.get(f"/markets/{mid}/orderbook", headers=ha).json()
    assert own["sides"][1]
    assert own["available_to_me"][1] == []
    assert own["available_to_me"][0] == []
    other = client.get(f"/markets/{mid}/orderbook", headers=hb).json()
    assert other["available_to_me"][1]
    assert other["available_to_me"][1][0]["available"] == pytest.approx(public["sides"][1][0]["available"])
    quote_own = client.post(
        f"/markets/{mid}/orders/quote",
        headers=ha,
        json={"outcome": 1, "money": 10, "odds": 3},
    ).json()
    assert quote_own["available"]["matched"] == 0
    quote_other = client.post(
        f"/markets/{mid}/orders/quote",
        headers=hb,
        json={"outcome": 1, "money": 10, "odds": 3},
    ).json()
    assert quote_other["available"]["matched"] > 0
    ioc = client.post(
        f"/markets/{mid}/orders",
        headers=ha,
        json={
            "outcome": 1,
            "money": 10,
            "odds": 2,
            "kind": "ioc",
            "request_id": str(uuid.uuid4()),
        },
    ).json()
    assert ioc["filled"] == 0
    assert ioc["refunded"] == pytest.approx(10)
