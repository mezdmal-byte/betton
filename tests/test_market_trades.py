"""Read-only GET /markets/{id}/trades — executed P2P fills, no money side effects."""
import pytest

from tests.legacy_helpers import post_legacy_market
from tests.test_markets_api import _close_at, _login
from tests.test_p2p import balance, ready, submit


def test_trades_list_executed_fills_without_identities(client, monkeypatch):
    _admin, _ah, a, ha, _b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2.2)
    submit(client, mid, hb, 1, 50, 1.83)
    before_a = balance(client, a, ha)

    rows = client.get(f"/markets/{mid}/trades").json()
    assert len(rows) == 1
    trade = rows[0]
    assert trade["id"] > 0
    assert trade["created_at"]
    assert trade["maker_outcome"] == 0
    assert trade["taker_outcome"] == 1
    assert trade["maker_odds"] == pytest.approx(2.2, rel=1e-4)
    assert trade["taker_odds"] == pytest.approx(1.83333, rel=1e-4)
    assert trade["taker_stake"] == pytest.approx(50, abs=0.001)
    assert trade["maker_stake"] == pytest.approx(41.6667, abs=0.001)
    assert trade["maker_stake_nano"] == int(round(trade["maker_stake"] * 1_000_000_000))
    assert "maker_user_id" not in trade
    assert "taker_user_id" not in trade
    assert "user_id" not in trade
    assert balance(client, a, ha) == before_a


def test_trades_empty_and_lmsr_rejected(client, monkeypatch):
    _admin, ah, _a, ha, _b, _hb, mid = ready(client, monkeypatch)
    assert client.get(f"/markets/{mid}/trades").json() == []

    lmsr = post_legacy_market(
        client,
        "/markets",
        headers=ha,
        json={
            "question": "Legacy LMSR market?",
            "close_at": _close_at(),
            "outcomes": ["A", "B"],
            "lock_ton": 50,
        },
    )
    assert lmsr.status_code == 200, lmsr.text
    blocked = client.get(f"/markets/{lmsr.json()['id']}/trades")
    assert blocked.status_code == 409


def test_trades_obey_unlisted_share_access(client, monkeypatch):
    _admin, _ah, a, ha, _b, _hb, _mid = ready(client, monkeypatch)
    created = client.post(
        "/markets",
        headers=ha,
        json={
            "question": "Unlisted trade history?",
            "close_at": _close_at(),
            "outcomes": ["A", "B"],
            "visibility": "unlisted",
        },
    )
    assert created.status_code == 200, created.text
    market = created.json()
    token = market["share_token"]
    mid = market["id"]
    _stranger, sh = _login(client)

    missing = client.get(f"/markets/{mid}/trades", headers=sh)
    assert missing.status_code == 404
    allowed = client.get(
        f"/markets/{mid}/trades",
        headers={**sh, "X-Market-Share-Token": token},
    )
    assert allowed.status_code == 200
    assert allowed.json() == []
    creator = client.get(f"/markets/{mid}/trades", headers=ha)
    assert creator.status_code == 200
    _ = a
