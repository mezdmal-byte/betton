from datetime import datetime, timedelta, timezone
import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import ADMIN_BANKROLL, settings
from tests.auth_helpers import tma_headers


def _close_at(hours=2):
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def _login(client: TestClient, telegram_id: int | None = None) -> tuple[dict, dict]:
    telegram_id = telegram_id or (int(uuid.uuid4().int % 1_000_000_000) + 1)
    headers = tma_headers(telegram_id)
    res = client.post("/auth/telegram", headers=headers)
    assert res.status_code == 200, res.text
    return res.json(), headers


def _admin(client: TestClient, monkeypatch) -> tuple[dict, dict]:
    telegram_id = int(uuid.uuid4().int % 1_000_000_000) + 10_000_000
    monkeypatch.setattr(settings, "admin_telegram_id", telegram_id)
    user, headers = _login(client, telegram_id)
    assert user["is_admin"] is True
    assert user["balance"] == pytest.approx(ADMIN_BANKROLL)
    return user, headers


def test_webhook_still_there(client: TestClient):
    paths = [getattr(r, "path", None) for r in client.app.routes]
    assert "/webhook" in paths
    methods = []
    for r in client.app.routes:
        if getattr(r, "path", None) == "/webhook":
            methods.extend(getattr(r, "methods", []) or [])
    assert "POST" in methods


def test_quote_and_resolve_only_admin(client: TestClient, monkeypatch):
    admin, admin_headers = _admin(client, monkeypatch)
    creator, creator_headers = _login(client)
    other, other_headers = _login(client)
    created = client.post(
        "/markets",
        headers=creator_headers,
        json={
            "creator_id": other["id"],
            "question": "Победит ли фаворит в финале?",
            "category": "sport",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 50,
            "close_at": _close_at(),
        },
    )
    assert created.status_code == 200, created.text
    market = created.json()
    assert market["category"] == "sport"
    assert market["outcomes"] == ["Да", "Нет"]
    assert market["creator_id"] == creator["id"]
    assert abs(market["prices"][0] - 0.5) < 1e-9
    assert abs(market["price_yes"] - 0.5) < 1e-9
    mid = market["id"]
    after_create = client.get(f"/users/{creator['id']}", headers=creator_headers).json()
    assert after_create["balance"] == pytest.approx(creator["balance"] - 50)

    quote = client.post(f"/markets/{mid}/quote", json={"outcome": "yes", "money": 10})
    assert quote.status_code == 200, quote.text
    body = quote.json()
    assert body["shares"] > 0
    assert body["avg_price"] > 0
    assert abs(body["odds"] - 1 / body["avg_price"]) < 1e-6
    after_quote = client.get(f"/markets/{mid}").json()
    assert after_quote["q"] == market["q"]
    assert client.get(f"/users/{creator['id']}", headers=creator_headers).json()["balance"] == after_create["balance"]

    yes = client.post(
        f"/markets/{mid}/buy",
        headers=creator_headers,
        json={"user_id": other["id"], "outcome": "yes", "money": 20},
    )
    assert yes.status_code == 200, yes.text
    no = client.post(
        f"/markets/{mid}/buy",
        headers=other_headers,
        json={"user_id": creator["id"], "outcome": "no", "money": 10},
    )
    assert no.status_code == 200, no.text
    priced = client.get(f"/markets/{mid}").json()
    assert priced["prices"][0] > priced["prices"][1]

    sport = client.get("/markets", params={"category": "sport", "status": "open"})
    assert sport.status_code == 200
    assert any(m["id"] == mid for m in sport.json())

    forbidden_other = client.post(
        f"/markets/{mid}/resolve",
        headers=other_headers,
        json={"winning_outcome": "yes", "user_id": admin["id"]},
    )
    assert forbidden_other.status_code == 403
    assert "админ" in forbidden_other.json()["detail"].lower()

    forbidden_creator = client.post(
        f"/markets/{mid}/resolve",
        headers=creator_headers,
        json={"winning_outcome": "Да", "user_id": admin["id"]},
    )
    assert forbidden_creator.status_code == 403
    assert     forbidden_creator.json()["detail"] == "Только админ может рассчитать событие"

    closed = client.post(f"/markets/{mid}/close", headers=admin_headers, json={})
    assert closed.status_code == 200, closed.text

    before_yes = client.get(f"/users/{creator['id']}", headers=creator_headers).json()["balance"]
    before_no = client.get(f"/users/{other['id']}", headers=other_headers).json()["balance"]
    ok = client.post(
        f"/markets/{mid}/resolve",
        headers=admin_headers,
        json={"winning_outcome": 0, "user_id": other["id"]},
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["status"] == "resolved"
    assert ok.json()["winning_outcome"] == "Да"
    assert ok.json()["settlement_kind"] == "auto"
    assert ok.json()["pot"] == pytest.approx(0.0, abs=1e-8)

    after_yes = client.get(f"/users/{creator['id']}", headers=creator_headers).json()["balance"]
    after_no = client.get(f"/users/{other['id']}", headers=other_headers).json()["balance"]
    assert after_yes > before_yes
    assert after_no == pytest.approx(before_no)

    claim = client.post(
        f"/markets/{mid}/claim",
        headers=creator_headers,
        json={"user_id": other["id"]},
    )
    assert claim.status_code == 400
    assert client.get(f"/users/{creator['id']}", headers=creator_headers).json()["balance"] == pytest.approx(after_yes)


def test_demo_admin_three_outcomes_tips(client: TestClient, monkeypatch):
    admin, admin_headers = _admin(client, monkeypatch)
    user, user_headers = _login(client)
    assert user["balance"] == settings.starting_balance
    assert user["is_admin"] is False

    created = client.post(
        "/markets",
        headers=admin_headers,
        json={
            "creator_id": user["id"],
            "question": "Кто возьмёт титул в этом сезоне?",
            "category": "sport",
            "outcomes": ["Альфа", "Бета", "Ничья"],
            "lock_ton": 50,
            "close_at": _close_at(),
            "target_odds": [3, 3, 3],
        },
    )
    assert created.status_code == 200, created.text
    market = created.json()
    assert market["creator_id"] == admin["id"]
    assert len(market["outcomes"]) == 3
    assert abs(sum(market["prices"]) - 1) < 1e-9
    assert all(abs(p - 1 / 3) < 1e-6 for p in market["prices"])
    admin_after = client.get(f"/users/{admin['id']}", headers=admin_headers).json()
    assert admin_after["balance"] == pytest.approx(admin["balance"] - 50)

    buy = client.post(
        f"/markets/{market['id']}/buy",
        headers=user_headers,
        json={"user_id": admin["id"], "outcome": "Альфа", "money": 40},
    )
    assert buy.status_code == 200, buy.text
    user_after_bet = client.get(f"/users/{user['id']}", headers=user_headers).json()
    assert user_after_bet["balance"] == pytest.approx(user["balance"] - 40)
    admin_after_bet = client.get(f"/users/{admin['id']}", headers=admin_headers).json()
    assert admin_after_bet["balance"] == pytest.approx(admin["balance"] - 50)

    closed = client.post(
        f"/markets/{market['id']}/close",
        headers=admin_headers,
        json={"user_id": user["id"]},
    )
    assert closed.status_code == 200
    assert closed.json()["status"] == "closed"

    blocked = client.post(
        f"/markets/{market['id']}/buy",
        headers=user_headers,
        json={"user_id": user["id"], "outcome": 1, "money": 5},
    )
    assert blocked.status_code == 400
    assert "закрыт" in blocked.json()["detail"].lower()

    resolved = client.post(
        f"/markets/{market['id']}/resolve",
        headers=admin_headers,
        json={"winning_outcome": "Альфа", "user_id": user["id"]},
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"
    assert resolved.json()["settlement_kind"] == "auto"

    user_after_resolve = client.get(f"/users/{user['id']}", headers=user_headers).json()
    assert user_after_resolve["balance"] > user_after_bet["balance"]
    admin_after_resolve = client.get(f"/users/{admin['id']}", headers=admin_headers).json()["balance"]
    settlements = client.get(f"/users/{user['id']}/settlements", headers=user_headers).json()
    assert settlements
    tip = settlements[0]["tip"]
    assert tip == pytest.approx(max(0.0, settlements[0]["payout"] - settlements[0]["stakes_total"]) * 0.01, rel=1e-6)
    admin_hist = client.get(f"/users/{admin['id']}/settlements", headers=admin_headers).json()
    residual = admin_hist[0]["residual_returned"] if admin_hist else 0.0
    assert admin_after_resolve == pytest.approx(admin_after_bet["balance"] + tip + residual, abs=1e-6)

    claim = client.post(f"/markets/{market['id']}/claim", headers=user_headers, json={"user_id": admin["id"]})
    assert claim.status_code == 400
    assert client.get(f"/users/{user['id']}", headers=user_headers).json()["balance"] == pytest.approx(user_after_resolve["balance"])


def test_tip_split_when_creator_is_not_admin(client: TestClient, monkeypatch):
    admin, admin_headers = _admin(client, monkeypatch)
    creator, creator_headers = _login(client)
    winner, winner_headers = _login(client)
    created = client.post(
        "/markets",
        headers=creator_headers,
        json={
            "creator_id": admin["id"],
            "question": "Будет ли дождь в субботу вечером?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 20,
            "close_at": _close_at(),
        },
    )
    mid = created.json()["id"]
    client.post(
        f"/markets/{mid}/buy",
        headers=winner_headers,
        json={"user_id": creator["id"], "outcome": 0, "money": 30},
    )
    closed = client.post(f"/markets/{mid}/close", headers=admin_headers, json={})
    assert closed.status_code == 200
    creator_before = client.get(f"/users/{creator['id']}", headers=creator_headers).json()["balance"]
    admin_before = client.get(f"/users/{admin['id']}", headers=admin_headers).json()["balance"]
    resolved = client.post(
        f"/markets/{mid}/resolve",
        headers=admin_headers,
        json={"winning_outcome": 0, "user_id": creator["id"]},
    )
    assert resolved.status_code == 200, resolved.text
    history = client.get(f"/users/{winner['id']}/settlements", headers=winner_headers).json()
    tip = history[0]["tip"]
    creator_hist = client.get(f"/users/{creator['id']}/settlements", headers=creator_headers).json()
    residual = creator_hist[0]["residual_returned"] if creator_hist else 0.0
    creator_after = client.get(f"/users/{creator['id']}", headers=creator_headers).json()["balance"]
    admin_after = client.get(f"/users/{admin['id']}", headers=admin_headers).json()["balance"]
    assert creator_after == pytest.approx(creator_before + tip * 0.75 + residual, abs=1e-6)
    assert admin_after == pytest.approx(admin_before + tip * 0.25, abs=1e-6)
    claim = client.post(
        f"/markets/{mid}/claim",
        headers=winner_headers,
        json={"user_id": creator["id"]},
    )
    assert claim.status_code == 400


def test_liquidity_lock_survives_reauth(client: TestClient, monkeypatch):
    admin, admin_headers = _admin(client, monkeypatch)
    start = admin["balance"]
    telegram_id = admin["telegram_id"]
    created = client.post(
        "/markets",
        headers=admin_headers,
        json={
            "creator_id": admin["id"],
            "question": "Сохранится ли залог после обновления страницы?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 50,
            "close_at": _close_at(),
        },
    )
    assert created.status_code == 200, created.text
    assert created.json()["question"] == "Сохранится ли залог после обновления страницы?"
    listed = client.get("/markets").json()
    assert any(m["id"] == created.json()["id"] and m["question"] == created.json()["question"] for m in listed)
    after = client.get(f"/users/{admin['id']}", headers=admin_headers).json()
    assert after["balance"] == pytest.approx(start - 50)
    again = client.post("/auth/telegram", headers=tma_headers(telegram_id)).json()
    assert again["id"] == admin["id"]
    assert again["balance"] == pytest.approx(start - 50)


def test_lock_insufficient(client: TestClient):
    user, headers = _login(client)
    res = client.post(
        "/markets",
        headers=headers,
        json={
            "creator_id": user["id"],
            "question": "Хватит ли залога на этот рынок сегодня?",
            "lock_ton": 5000,
            "close_at": _close_at(),
            "outcomes": ["Да", "Нет"],
        },
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Недостаточно TON на залог"
