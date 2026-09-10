from tests.legacy_helpers import post_legacy_market
import json
import time
import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import SessionLocal
from app.models import Market, Position, User
from tests.auth_helpers import TEST_BOT_TOKEN, make_init_data, tma_headers


def _close_at(hours=2):
    from datetime import datetime, timedelta, timezone

    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def _login(client: TestClient, telegram_id: int | None = None) -> tuple[dict, dict]:
    telegram_id = telegram_id or (int(uuid.uuid4().int % 1_000_000_000) + 1)
    headers = tma_headers(telegram_id)
    res = client.post("/auth/telegram", headers=headers)
    assert res.status_code == 200, res.text
    return res.json(), headers


def _counts():
    db = SessionLocal()
    try:
        return {
            "users": db.query(User).count(),
            "markets": db.query(Market).count(),
            "positions": db.query(Position).count(),
        }
    finally:
        db.close()


def _user_balance(user_id: int) -> float:
    db = SessionLocal()
    try:
        user = db.get(User, user_id)
        assert user is not None
        return float(user.balance)
    finally:
        db.close()


def _assert_unauthorized(res, init_data: str | None = None):
    assert res.status_code == 401
    body = res.text
    assert TEST_BOT_TOKEN not in body
    assert "WebAppData" not in body
    if init_data:
        assert init_data not in body
        assert "hash=" not in body


def test_signed_init_data_grants_access(client: TestClient):
    telegram_id = 88001
    init_data = make_init_data(telegram_id, username="alice")
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {init_data}"})
    assert res.status_code == 200, res.text
    user = res.json()
    assert user["telegram_id"] == telegram_id
    assert user["balance"] == pytest.approx(settings.starting_balance)
    assert user["is_admin"] is False


def test_relogin_keeps_account_and_balance(client: TestClient):
    user, headers = _login(client)
    created = post_legacy_market(client,
        "/markets",
        headers=headers,
        json={
            "question": "Повторный вход сохраняет баланс?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 50,
            "close_at": _close_at(),
        },
    )
    assert created.status_code == 200, created.text
    mid = created.json()["id"]
    buy = client.post(
        f"/markets/{mid}/buy",
        headers=headers,
        json={"outcome": 0, "money": 15},
    )
    assert buy.status_code == 200, buy.text
    after = client.get(f"/users/{user['id']}", headers=headers).json()
    again = client.post("/auth/telegram", headers=headers)
    assert again.status_code == 200
    same = again.json()
    assert same["id"] == user["id"]
    assert same["telegram_id"] == user["telegram_id"]
    assert same["balance"] == pytest.approx(after["balance"])
    assert same["balance"] == pytest.approx(user["balance"] - 50 - 15)


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"Authorization": "Bearer nope"},
        {"Authorization": "tma "},
        {"Authorization": f"tma {make_init_data(90001, include_hash=False)}"},
        {"Authorization": f"tma {make_init_data(90002, token='999999:WRONG_TOKEN')}"},
    ],
)
def test_missing_or_wrong_signature_is_rejected(client: TestClient, headers):
    init_data = None
    auth = headers.get("Authorization")
    if auth and auth.startswith("tma "):
        init_data = auth[4:]
    before = _counts()
    res = client.post("/auth/telegram", headers=headers, json={"telegram_id": 1, "username": "hack"})
    _assert_unauthorized(res, init_data)
    assert _counts() == before


def test_tampered_user_id_is_rejected(client: TestClient):
    from urllib.parse import parse_qsl, urlencode

    init_data = make_init_data(91001)
    fields = dict(parse_qsl(init_data, keep_blank_values=True))
    user = json.loads(fields["user"])
    user["id"] = 91002
    fields["user"] = json.dumps(user, separators=(",", ":"))
    tampered = urlencode(fields)
    before = _counts()
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {tampered}"})
    _assert_unauthorized(res, init_data)
    assert _counts() == before


def test_expired_auth_date_is_rejected(client: TestClient):
    init_data = make_init_data(92001, auth_date=int(time.time()) - 3601)
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {init_data}"})
    _assert_unauthorized(res, init_data)


def test_future_auth_date_is_rejected(client: TestClient):
    init_data = make_init_data(92002, auth_date=int(time.time()) + 60)
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {init_data}"})
    _assert_unauthorized(res, init_data)


def test_invalid_user_json_is_rejected(client: TestClient):
    init_data = make_init_data(93001, user_json="{not-json")
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {init_data}"})
    _assert_unauthorized(res, init_data)


def test_missing_user_and_auth_date_are_rejected(client: TestClient):
    missing_user = make_init_data(93002, omit={"user"})
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {missing_user}"})
    _assert_unauthorized(res, missing_user)

    missing_date = make_init_data(93003, omit={"auth_date"})
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {missing_date}"})
    _assert_unauthorized(res, missing_date)


def test_duplicate_params_and_bool_id_are_rejected(client: TestClient):
    init_data = make_init_data(94001)
    duplicated = init_data + "&auth_date=1"
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {duplicated}"})
    _assert_unauthorized(res, duplicated)

    bool_id = make_init_data(94002, user_json=json.dumps({"id": True, "first_name": "Nope"}))
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {bool_id}"})
    _assert_unauthorized(res, bool_id)

    string_id = make_init_data(94003, user_json=json.dumps({"id": "94003", "first_name": "Nope"}))
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {string_id}"})
    _assert_unauthorized(res, string_id)


def test_non_ascii_and_non_hex_hash_returns_401(client: TestClient):
    from urllib.parse import unquote

    cyrillic_hash = "абвгдежзийклмнопрстуфхцчшщъыьэюя" * 2
    assert len(cyrillic_hash) == 64
    encoded = make_init_data(96001, hash_override=cyrillic_hash)
    assert "%D0%" in encoded.upper()
    assert len(unquote(encoded.split("hash=")[-1].split("&")[0])) == 64
    before = _counts()
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {encoded}"})
    _assert_unauthorized(res, encoded)
    assert "TypeError" not in res.text
    assert "Internal Server Error" not in res.text
    assert _counts() == before

    ascii_not_hex = make_init_data(96002, hash_override="z" * 64)
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {ascii_not_hex}"})
    _assert_unauthorized(res, ascii_not_hex)
    assert res.status_code == 401


def test_missing_bot_token_keeps_access_closed(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "bot_token", "")
    init_data = make_init_data(95001)
    before = _counts()
    res = client.post("/auth/telegram", headers={"Authorization": f"tma {init_data}"})
    _assert_unauthorized(res, init_data)
    assert _counts() == before


def test_old_users_and_auth_paths_cannot_bypass(client: TestClient):
    victim, victim_headers = _login(client)
    attacker, attacker_headers = _login(client)

    no_auth_users = client.post(
        "/users",
        json={"username": "stolen", "telegram_id": victim["telegram_id"]},
    )
    _assert_unauthorized(no_auth_users)

    no_auth_login = client.post(
        "/auth/telegram",
        json={"telegram_id": victim["telegram_id"], "username": "admin"},
    )
    _assert_unauthorized(no_auth_login)

    spoof_users = client.post(
        "/users",
        headers=attacker_headers,
        json={"username": "stolen", "telegram_id": victim["telegram_id"]},
    )
    assert spoof_users.status_code == 200
    assert spoof_users.json()["id"] == attacker["id"]
    assert spoof_users.json()["telegram_id"] == attacker["telegram_id"]

    spoof_auth = client.post(
        "/auth/telegram",
        headers=attacker_headers,
        json={"telegram_id": victim["telegram_id"], "username": "admin"},
    )
    assert spoof_auth.status_code == 200
    assert spoof_auth.json()["id"] == attacker["id"]
    assert spoof_auth.json()["telegram_id"] != victim["telegram_id"]


def test_foreign_user_id_cannot_spend_create_or_read(client: TestClient):
    victim, victim_headers = _login(client)
    attacker, attacker_headers = _login(client)
    victim_start = victim["balance"]
    attacker_start = attacker["balance"]

    created = post_legacy_market(client,
        "/markets",
        headers=attacker_headers,
        json={
            "creator_id": victim["id"],
            "question": "Чужой creator_id не должен списать жертву?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 50,
            "close_at": _close_at(),
        },
    )
    assert created.status_code == 200, created.text
    market = created.json()
    assert market["creator_id"] == attacker["id"]
    assert _user_balance(victim["id"]) == pytest.approx(victim_start)
    assert _user_balance(attacker["id"]) == pytest.approx(attacker_start - 50)

    buy = client.post(
        f"/markets/{market['id']}/buy",
        headers=attacker_headers,
        json={"user_id": victim["id"], "outcome": 0, "money": 20},
    )
    assert buy.status_code == 200, buy.text
    assert _user_balance(victim["id"]) == pytest.approx(victim_start)
    assert _user_balance(attacker["id"]) == pytest.approx(attacker_start - 50 - 20)

    other_user = client.get(f"/users/{victim['id']}", headers=attacker_headers)
    assert other_user.status_code == 403
    assert "balance" not in other_user.json() or other_user.json().get("id") != victim["id"]
    assert str(victim["telegram_id"]) not in other_user.text

    other_pos = client.get(f"/users/{victim['id']}/positions", headers=attacker_headers)
    assert other_pos.status_code == 403

    own = client.get(f"/users/{attacker['id']}", headers=attacker_headers)
    assert own.status_code == 200
    assert own.json()["id"] == attacker["id"]


def test_regular_user_cannot_admin_even_with_admin_id_in_body(client: TestClient, monkeypatch):
    admin_tg = int(uuid.uuid4().int % 1_000_000_000) + 20_000_000
    monkeypatch.setattr(settings, "admin_telegram_id", admin_tg)
    admin, admin_headers = _login(client, admin_tg)
    user, user_headers = _login(client)

    created = post_legacy_market(client,
        "/markets",
        headers=user_headers,
        json={
            "question": "Обычный пользователь не админ?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 20,
            "close_at": _close_at(),
        },
    )
    mid = created.json()["id"]
    client.post(
        f"/markets/{mid}/buy",
        headers=user_headers,
        json={"outcome": 0, "money": 10},
    )
    before_status = client.get(f"/markets/{mid}").json()["status"]
    before_q = client.get(f"/markets/{mid}").json()["q"]
    before_user = _user_balance(user["id"])
    before_admin = _user_balance(admin["id"])

    closed = client.post(
        f"/markets/{mid}/close",
        headers=user_headers,
        json={"user_id": admin["id"]},
    )
    assert closed.status_code == 403
    assert client.get(f"/markets/{mid}").json()["status"] == before_status

    resolved = client.post(
        f"/markets/{mid}/resolve",
        headers=user_headers,
        json={"winning_outcome": 0, "user_id": admin["id"]},
    )
    assert resolved.status_code == 403
    assert client.get(f"/markets/{mid}").json()["status"] == before_status
    assert client.get(f"/markets/{mid}").json()["q"] == before_q

    residual = client.post(
        f"/markets/{mid}/collect-residual",
        headers=user_headers,
        json={"user_id": admin["id"]},
    )
    assert residual.status_code == 403
    assert _user_balance(user["id"]) == pytest.approx(before_user)
    assert _user_balance(admin["id"]) == pytest.approx(before_admin)

    ok_close = client.post(f"/markets/{mid}/close", headers=admin_headers, json={})
    assert ok_close.status_code == 200
    assert ok_close.json()["status"] == "closed"

    ok_resolve = client.post(
        f"/markets/{mid}/resolve",
        headers=admin_headers,
        json={"winning_outcome": 0},
    )
    assert ok_resolve.status_code == 200
    assert ok_resolve.json()["status"] == "resolved"

    leftover = client.post(f"/markets/{mid}/collect-residual", headers=admin_headers, json={})
    assert leftover.status_code == 400


def test_auth_failure_does_not_change_state(client: TestClient):
    user, headers = _login(client)
    created = post_legacy_market(client,
        "/markets",
        headers=headers,
        json={
            "question": "Отказ в авторизации не меняет рынок?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 30,
            "close_at": _close_at(),
        },
    )
    mid = created.json()["id"]
    client.post(f"/markets/{mid}/buy", headers=headers, json={"outcome": 0, "money": 12})
    snapshot = {
        "counts": _counts(),
        "balance": _user_balance(user["id"]),
        "market": client.get(f"/markets/{mid}").json(),
    }
    bad = make_init_data(user["telegram_id"], include_hash=False)
    res = client.post(
        f"/markets/{mid}/buy",
        headers={"Authorization": f"tma {bad}"},
        json={"outcome": 1, "money": 8, "user_id": user["id"]},
    )
    _assert_unauthorized(res, bad)
    assert _counts() == snapshot["counts"]
    assert _user_balance(user["id"]) == pytest.approx(snapshot["balance"])
    after = client.get(f"/markets/{mid}").json()
    assert after["q"] == snapshot["market"]["q"]
    assert after["pot"] == pytest.approx(snapshot["market"]["pot"])


def test_username_match_does_not_take_over_account(client: TestClient):
    victim_tg = int(uuid.uuid4().int % 1_000_000_000) + 30_000
    db = SessionLocal()
    planted = User(username=f"tg{victim_tg}", telegram_id=None, balance=777.0)
    db.add(planted)
    db.commit()
    planted_id = planted.id
    db.close()

    res = client.post("/auth/telegram", headers=tma_headers(victim_tg))
    assert res.status_code == 200, res.text
    created = res.json()
    assert created["id"] != planted_id
    assert created["telegram_id"] == victim_tg
    assert created["balance"] == pytest.approx(settings.starting_balance)

    db = SessionLocal()
    planted = db.get(User, planted_id)
    assert planted is not None
    assert planted.telegram_id is None
    assert planted.balance == pytest.approx(777.0)
    db.close()
