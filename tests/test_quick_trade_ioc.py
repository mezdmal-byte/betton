"""Quick Trade IOC: multi-level preview, locked worst odds, refund, self-match, stale book."""
import uuid

import pytest

from app.database import SessionLocal
from app.models import P2POrder, P2PFill
from app.services import p2p_service as p2p
from tests.test_markets_api import _login
from tests.test_p2p import ready, submit, total, balance

# Discovery preview may walk from the protocol floor. Place locks displayed worst_odds.
IOC_FLOOR = 1.00001


def quote_ioc(client, mid, headers, outcome, amount, odds=IOC_FLOOR):
    return client.post(
        f"/markets/{mid}/orders/quote",
        headers=headers,
        json={"outcome": outcome, "money": amount, "odds": odds, "kind": "ioc"},
    )


def place_ioc(client, mid, headers, outcome, amount, odds=IOC_FLOOR):
    return client.post(
        f"/markets/{mid}/orders",
        headers=headers,
        json={
            "outcome": outcome,
            "money": amount,
            "odds": odds,
            "kind": "ioc",
            "request_id": str(uuid.uuid4()),
        },
    )


def taker_open_orders(client, user, headers):
    return [row for row in client.get(f"/users/{user['id']}/orders", headers=headers).json() if row["status"] == "open"]


def taker_odds(fill):
    return p2p.PRICE / (p2p.PRICE - fill.price)


def _two_level_yes_book(client, mid, headers):
    """Maker NO: 66 @ 2.00 and 50 @ ~2.010101 so YES taker sees 66 @ 2.00 then 1.99+."""
    first = submit(client, mid, headers, 1, 66, 2)
    assert first.status_code == 200, first.text
    second = submit(client, mid, headers, 1, 50, "2.010101")
    assert second.status_code == 200, second.text
    return first.json(), second.json()


def test_quick_trade_walks_two_levels_preview_matches_place(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    _two_level_yes_book(client, mid, ha)
    book = client.get(f"/markets/{mid}/orderbook", headers=hb).json()
    levels = book["available_to_me"][0]
    assert levels[0]["odds"] == pytest.approx(2.0)
    assert levels[0]["available"] == pytest.approx(66)
    assert levels[1]["available"] >= 34

    top_only = quote_ioc(client, mid, hb, 0, 100, odds=levels[0]["odds"]).json()
    assert top_only["requested"]["matched"] == pytest.approx(66, abs=0.001)
    assert top_only["requested"]["remaining"] == pytest.approx(34, abs=0.001)

    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    requested = quoted["requested"]
    assert requested["matched"] == pytest.approx(100, abs=0.001)
    assert requested["remaining"] == pytest.approx(0, abs=0.001)
    assert requested["worst_odds"] == pytest.approx(levels[1]["odds"], rel=1e-5)
    assert 1.99 <= requested["average_odds"] <= 2.0
    assert requested["average_odds"] >= requested["worst_odds"]
    assert len(requested["fills"]) >= 2
    assert requested["fills"][0]["odds"] == pytest.approx(2.0)
    assert requested["fills"][0]["matched"] == pytest.approx(66, abs=0.001)
    assert requested["fills"][1]["matched"] == pytest.approx(34, abs=0.001)

    initial = total()
    placed = place_ioc(client, mid, hb, 0, 100, odds=requested["worst_odds"])
    assert placed.status_code == 200, placed.text
    taken = placed.json()
    assert taken["filled"] == pytest.approx(requested["matched"], abs=0.001)
    assert taken["remaining"] == 0
    assert taken["refunded"] == pytest.approx(0, abs=0.001)
    assert taken["kind"] == "ioc"
    assert taken["status"] in ("filled", "cancelled")
    assert taker_open_orders(client, b, hb) == []
    assert total() == pytest.approx(initial, abs=1e-7)


def test_quick_trade_partial_ioc_refunds_and_does_not_rest(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    maker = submit(client, mid, ha, 1, 66, 2)
    assert maker.status_code == 200, maker.text

    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    assert quoted["requested"]["matched"] == pytest.approx(66, abs=0.001)
    assert quoted["requested"]["remaining"] == pytest.approx(34, abs=0.001)
    assert quoted["available"]["matched"] == pytest.approx(quoted["requested"]["matched"], abs=0.001)

    before = balance(client, b, hb)
    initial = total()
    placed = place_ioc(client, mid, hb, 0, 100, odds=quoted["requested"]["worst_odds"])
    assert placed.status_code == 200, placed.text
    taken = placed.json()
    assert taken["filled"] == pytest.approx(66, abs=0.001)
    assert taken["refunded"] == pytest.approx(34, abs=0.001)
    assert taken["remaining"] == 0
    assert taken["status"] == "filled"
    assert taker_open_orders(client, b, hb) == []
    assert balance(client, b, hb) == pytest.approx(before - 66, abs=0.001)
    with SessionLocal() as db:
        row = db.get(P2POrder, taken["id"])
        assert row.kind == "ioc"
        assert row.remaining == 0
        assert row.status != "open"
        assert row.filled + row.refunded + row.remaining == row.amount
    assert total() == pytest.approx(initial, abs=1e-7)


def test_quick_trade_own_liquidity_is_not_executable(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    maker = submit(client, mid, ha, 0, 66, 2)
    assert maker.status_code == 200, maker.text

    own_book = client.get(f"/markets/{mid}/orderbook", headers=ha).json()
    assert own_book["available_to_me"][1] == []
    other_book = client.get(f"/markets/{mid}/orderbook", headers=hb).json()
    assert other_book["available_to_me"][1][0]["available"] == pytest.approx(66)

    quoted = quote_ioc(client, mid, ha, 1, 100).json()
    assert quoted["requested"]["matched"] == 0
    assert quoted["available"]["matched"] == 0
    assert quoted["requested"]["payout"] == 0
    assert quoted["requested"]["worst_odds"] is None

    before = balance(client, a, ha)
    taken = place_ioc(client, mid, ha, 1, 100).json()
    assert taken["filled"] == 0
    assert taken["refunded"] == pytest.approx(100)
    assert taken["remaining"] == 0
    assert taken["status"] == "cancelled"
    orders = client.get(f"/users/{a['id']}/orders", headers=ha).json()
    ioc_rows = [row for row in orders if row["kind"] == "ioc"]
    assert ioc_rows and all(row["remaining"] == 0 and row["status"] != "open" for row in ioc_rows)
    assert any(row["id"] == maker.json()["id"] and row["status"] == "open" for row in orders)
    assert balance(client, a, ha) == pytest.approx(before)


def test_quick_trade_stale_liquidity_between_preview_and_place(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    c, hc = _login(client)
    maker = submit(client, mid, ha, 1, 66, 2)
    assert maker.status_code == 200, maker.text

    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    assert quoted["requested"]["matched"] == pytest.approx(66, abs=0.001)
    worst = quoted["requested"]["worst_odds"]

    sniped = place_ioc(client, mid, hc, 0, 66, odds=worst)
    assert sniped.status_code == 200, sniped.text
    assert sniped.json()["filled"] == pytest.approx(66, abs=0.001)

    before = balance(client, b, hb)
    initial = total()
    live = quote_ioc(client, mid, hb, 0, 100, odds=worst).json()
    assert live["requested"]["matched"] == 0

    taken = place_ioc(client, mid, hb, 0, 100, odds=worst).json()
    assert taken["filled"] == 0
    assert taken["refunded"] == pytest.approx(100)
    assert taken["remaining"] == 0
    assert taken["kind"] == "ioc"
    assert taker_open_orders(client, b, hb) == []
    assert balance(client, b, hb) == pytest.approx(before)
    assert total() == pytest.approx(initial, abs=1e-7)


def test_quick_trade_place_does_not_fill_worse_than_displayed_worst(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    first, second = _two_level_yes_book(client, mid, ha)
    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    requested = quoted["requested"]
    assert requested["matched"] == pytest.approx(100, abs=0.001)
    worst = requested["worst_odds"]
    assert worst == pytest.approx(1.99, rel=1e-3)

    assert client.post(f"/orders/{first['id']}/cancel", headers=ha).status_code == 200
    assert client.post(f"/orders/{second['id']}/cancel", headers=ha).status_code == 200
    assert submit(client, mid, ha, 1, 40, 2).status_code == 200
    assert submit(client, mid, ha, 1, 10, "2.010101").status_code == 200
    worse = submit(client, mid, ha, 1, 100, 2.25)
    assert worse.status_code == 200, worse.text

    live_floor = quote_ioc(client, mid, hb, 0, 100).json()
    assert live_floor["requested"]["matched"] == pytest.approx(100, abs=0.001)
    assert live_floor["requested"]["worst_odds"] < worst

    book = client.get(f"/markets/{mid}/orderbook", headers=hb).json()
    accepted = [lvl for lvl in book["available_to_me"][0] if lvl["odds"] + 1e-9 >= worst]
    expected = sum(lvl["available"] for lvl in accepted)

    taken = place_ioc(client, mid, hb, 0, 100, odds=worst).json()
    assert taken["filled"] == pytest.approx(min(100, expected), abs=0.001)
    assert taken["refunded"] == pytest.approx(100 - taken["filled"], abs=0.001)
    assert taken["remaining"] == 0
    assert taker_open_orders(client, b, hb) == []
    with SessionLocal() as db:
        fills = db.query(P2PFill).filter_by(taker_order_id=taken["id"]).all()
        assert fills
        for fill in fills:
            assert taker_odds(fill) + 1e-9 >= worst
        assert db.get(P2POrder, worse.json()["id"]).filled == 0


def test_quick_trade_may_fill_better_liquidity_after_preview(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    _two_level_yes_book(client, mid, ha)
    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    worst = quoted["requested"]["worst_odds"]
    better = submit(client, mid, ha, 1, 50, 1.90)
    assert better.status_code == 200, better.text

    taken = place_ioc(client, mid, hb, 0, 100, odds=worst).json()
    assert taken["filled"] == pytest.approx(100, abs=0.001)
    assert taken["remaining"] == 0
    assert taken["refunded"] == pytest.approx(0, abs=0.001)
    with SessionLocal() as db:
        fills = db.query(P2PFill).filter_by(taker_order_id=taken["id"]).all()
        assert fills
        for fill in fills:
            assert taker_odds(fill) + 1e-9 >= worst
        assert db.get(P2POrder, better.json()["id"]).filled > 0


def test_quick_trade_partial_fill_inside_locked_range_refunds(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    first, second = _two_level_yes_book(client, mid, ha)
    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    worst = quoted["requested"]["worst_odds"]

    assert client.post(f"/orders/{first['id']}/cancel", headers=ha).status_code == 200
    assert client.post(f"/orders/{second['id']}/cancel", headers=ha).status_code == 200
    assert submit(client, mid, ha, 1, 40, 2).status_code == 200

    before = balance(client, b, hb)
    taken = place_ioc(client, mid, hb, 0, 100, odds=worst).json()
    assert taken["filled"] == pytest.approx(40, abs=0.001)
    assert taken["refunded"] == pytest.approx(60, abs=0.001)
    assert taken["remaining"] == 0
    assert taker_open_orders(client, b, hb) == []
    assert balance(client, b, hb) == pytest.approx(before - 40, abs=0.001)


def test_quick_trade_displayed_worst_odds_round_trips_price_tick(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    maker = submit(client, mid, ha, 1, 40, 1.90)
    assert maker.status_code == 200, maker.text
    book = client.get(f"/markets/{mid}/orderbook", headers=hb).json()
    best = book["available_to_me"][0][0]
    quoted = quote_ioc(client, mid, hb, 0, 100).json()
    worst = quoted["requested"]["worst_odds"]
    _atomic, tick = p2p.parse_terms(100, worst)
    with SessionLocal() as db:
        row = db.get(P2POrder, maker.json()["id"])
        assert tick == p2p.PRICE - row.price
    taken = place_ioc(client, mid, hb, 0, 100, odds=worst).json()
    assert taken["filled"] == pytest.approx(quoted["requested"]["matched"], abs=0.001)
    assert taken["filled"] == pytest.approx(best["available"], abs=0.001)
    assert taken["remaining"] == 0
    assert taken["refunded"] == pytest.approx(100 - taken["filled"], abs=0.001)
    with SessionLocal() as db:
        fill = db.query(P2PFill).filter_by(taker_order_id=taken["id"]).one()
        assert fill.maker_order_id == maker.json()["id"]
        assert taker_odds(fill) + 1e-9 >= worst
        assert p2p.PRICE - fill.price == tick
