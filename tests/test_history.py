import pytest
from fastapi.testclient import TestClient

from app.services import history as history_service
from tests.test_p2p import ready, submit


def test_transaction_history_reserve_fill_refund_settlement(client: TestClient, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    first = submit(client, mid, ha, 0, 100, 2).json()
    submit(client, mid, hb, 1, 40, 2)
    assert client.post(f"/orders/{first['id']}/cancel", headers=ha).status_code == 200
    client.post(f"/markets/{mid}/close", headers=ah)
    resolved = client.post(f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 0})
    assert resolved.status_code == 200, resolved.text

    rows = client.get(f"/users/{a['id']}/transactions", headers=ha).json()
    types = [row["type"] for row in rows]
    assert "reserve" in types
    assert "fill" in types
    assert "refund" in types or "cancel" in types
    assert "win" in types
    assert "fee" in types
    assert "deposit" not in types
    assert "withdraw" not in types
    settlement = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    win = next(row for row in rows if row["type"] == "win")
    fee = next(row for row in rows if row["type"] == "fee")
    assert win["amount_nano"] > 0
    assert fee["amount_nano"] < 0
    assert win["display_amount"] == pytest.approx(settlement["payout"])
    assert fee["display_amount"] == pytest.approx(-settlement["tip"])
    assert win["question"] == settlement["question"]

    loser = client.get(f"/users/{b['id']}/transactions", headers=hb).json()
    assert any(row["type"] == "loss" for row in loser)
    assert any(row["type"] == "reserve" for row in loser)
    assert not any(row["type"] == "deposit" for row in loser)
    assert client.get(f"/users/{a['id']}/transactions", headers=hb).status_code == 403

    bets = client.get(f"/users/{a['id']}/transactions", params={"kind": "bets"}, headers=ha).json()
    assert bets and all(row["type"] in {"reserve", "fill"} for row in bets)
    wins = client.get(f"/users/{a['id']}/transactions", params={"kind": "wins"}, headers=ha).json()
    assert wins and all(row["type"] == "win" for row in wins)
    refunds = client.get(f"/users/{a['id']}/transactions", params={"kind": "refunds"}, headers=ha).json()
    assert refunds and all(row["type"] in {"refund", "cancel", "void"} for row in refunds)
    deposits = client.get(f"/users/{a['id']}/transactions", params={"kind": "deposits"}, headers=ha).json()
    withdrawals = client.get(f"/users/{a['id']}/transactions", params={"kind": "withdrawals"}, headers=ha).json()
    assert deposits == []
    assert withdrawals == []


def test_void_history_has_event_return_not_fake_crypto(client: TestClient, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 80, 2)
    submit(client, mid, hb, 1, 20, 2)
    cancelled = client.post(
        f"/markets/{mid}/cancel",
        headers=ah,
        json={"reason": "Тестовая отмена для истории"},
    )
    assert cancelled.status_code == 200, cancelled.text
    rows = client.get(f"/users/{a['id']}/transactions", headers=ha).json()
    types = {row["type"] for row in rows}
    assert "void" in types
    assert "win" not in types
    assert "fee" not in types
    assert history_service.TX_DEPOSIT not in types
    assert history_service.TX_WITHDRAW not in types
