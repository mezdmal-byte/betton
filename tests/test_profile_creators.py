from datetime import datetime, timedelta, timezone
import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import SessionLocal, ensure_schema
from app.models import User
from tests.auth_helpers import tma_headers
from tests.test_p2p import market, ready, submit


def _login(
    client: TestClient,
    telegram_id: int | None = None,
    **kwargs,
) -> tuple[dict, dict]:
    telegram_id = telegram_id or (int(uuid.uuid4().int % 1_000_000_000) + 1)
    headers = tma_headers(telegram_id, **kwargs)
    res = client.post("/auth/telegram", headers=headers)
    assert res.status_code == 200, res.text
    return res.json(), headers


def test_ensure_schema_adds_profile_columns(client: TestClient):
    ensure_schema()
    ensure_schema()
    from sqlalchemy import inspect
    from app.database import engine

    cols = {c["name"] for c in inspect(engine).get_columns("users")}
    assert {"telegram_username", "display_name", "photo_url"} <= cols


def test_telegram_profile_fields_update_without_touching_money(client: TestClient):
    telegram_id = int(uuid.uuid4().int % 1_000_000_000) + 50_000
    first = client.post(
        "/auth/telegram",
        headers=tma_headers(
            telegram_id,
            username="alice",
            first_name="Alice",
            last_name="Ivanova",
            photo_url="https://cdn.telegram.example/alice.jpg",
        ),
    )
    assert first.status_code == 200, first.text
    user = first.json()
    assert user["username"] == f"tg{telegram_id}"
    assert user["telegram_username"] == "alice"
    assert user["display_name"] == "Alice Ivanova"
    assert user["photo_url"] == "https://cdn.telegram.example/alice.jpg"
    assert user["balance"] == pytest.approx(settings.starting_balance)

    spent = client.post(
        "/markets",
        headers=tma_headers(telegram_id, username="alice", first_name="Alice"),
        json={
            "question": "Profile update keeps money?",
            "close_at": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
            "outcomes": ["Да", "Нет"],
        },
    )
    assert spent.status_code == 200, spent.text
    after_create = client.get(
        f"/users/{user['id']}",
        headers=tma_headers(telegram_id, username="alice", first_name="Alice"),
    ).json()
    assert after_create["balance"] == pytest.approx(settings.starting_balance)

    renamed = client.post(
        "/auth/telegram",
        headers=tma_headers(
            telegram_id,
            username="alice_new",
            first_name="Alisa",
            last_name="Petrova",
            photo_url="http://insecure.example/x.png",
        ),
    )
    assert renamed.status_code == 200, renamed.text
    body = renamed.json()
    assert body["id"] == user["id"]
    assert body["username"] == f"tg{telegram_id}"
    assert body["telegram_username"] == "alice_new"
    assert body["display_name"] == "Alisa Petrova"
    assert body["photo_url"] == "https://cdn.telegram.example/alice.jpg"
    assert body["balance"] == pytest.approx(after_create["balance"])


def test_profile_fallback_names_and_own_account(client: TestClient, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 40, 2)
    submit(client, mid, hb, 1, 40, 2)
    account = client.get(f"/users/{a['id']}/account", headers=ha)
    assert account.status_code == 200, account.text
    body = account.json()
    assert body["id"] == a["id"]
    assert body["balance_nano"] == pytest.approx(round(body["balance"] * 1_000_000_000))
    assert body["reserved_nano"] >= 0
    assert body["in_positions_nano"] > 0
    assert client.get(f"/users/{a['id']}/account", headers=hb).status_code == 403

    db = SessionLocal()
    try:
        planted = User(username=f"tg{uuid.uuid4().hex[:10]}", telegram_id=None, balance=1000)
        db.add(planted)
        db.commit()
        db.refresh(planted)
        planted_id = planted.id
    finally:
        db.close()
    profile = client.get(f"/creators/{planted_id}")
    assert profile.status_code == 200, profile.text
    creator = profile.json()["creator"]
    assert creator["display_name"].startswith("tg")
    assert creator["telegram_username"] is None
    assert creator["markets_created"] == 0


def test_public_creator_profile_and_top_ranking(client: TestClient, monkeypatch):
    admin, ah = _admin_local(client, monkeypatch)
    maker_a, ha = _login(client, username="vasya", first_name="Vasya")
    maker_b, hb = _login(client, username="petya", first_name="Petya")
    trader_x, hx = _login(client)
    trader_y, hy = _login(client)
    idle, _hi = _login(client, username="idle", first_name="Idle")

    m1 = market(client, ha)
    m2 = market(client, ha)
    m3 = market(client, hb)
    empty = market(client, hb)
    for mid in (m1["id"], m2["id"], m3["id"], empty["id"]):
        assert client.post(f"/markets/{mid}/approve", headers=ah).status_code == 200

    submit(client, m1["id"], hx, 0, 200, 2)
    submit(client, m1["id"], hy, 1, 200, 2)
    submit(client, m2["id"], hx, 0, 150, 2)
    submit(client, m2["id"], hy, 1, 150, 2)
    submit(client, m3["id"], hx, 0, 10, 2)
    submit(client, m3["id"], hy, 1, 10, 2)

    profile_a = client.get(f"/creators/{maker_a['id']}").json()["creator"]
    profile_b = client.get(f"/creators/{maker_b['id']}").json()["creator"]
    assert profile_a["telegram_username"] == "vasya"
    assert profile_a["display_name"] == "Vasya"
    assert profile_a["markets_created"] == 2
    assert profile_a["fills"] == 2
    assert profile_a["unique_participants"] == 2
    assert profile_b["fills"] == 1
    assert profile_b["markets_created"] == 2
    assert profile_a["volume_nano"] > profile_b["volume_nano"]

    top = client.get("/creators/top")
    assert top.status_code == 200, top.text
    rows = top.json()
    assert len(rows) <= 10
    volumes = [row["volume_nano"] for row in rows]
    assert volumes == sorted(volumes, reverse=True)
    fills = [(row["volume_nano"], row["fills"], row["unique_participants"]) for row in rows]
    assert fills == sorted(fills, reverse=True)
    by_id = {row["id"]: row for row in rows}
    assert maker_a["id"] in by_id
    assert idle["id"] not in by_id
    assert trader_x["id"] not in by_id
    if maker_b["id"] in by_id:
        assert by_id[maker_a["id"]]["rank"] < by_id[maker_b["id"]]["rank"]

    profile = client.get(f"/creators/{maker_a['id']}")
    assert profile.status_code == 200, profile.text
    payload = profile.json()
    assert payload["creator"]["id"] == maker_a["id"]
    assert payload["creator"]["telegram_username"] == "vasya"
    market_ids = {m["id"] for m in payload["markets"]}
    assert market_ids == {m1["id"], m2["id"]}
    for card in payload["markets"]:
        assert card["creator"]["id"] == maker_a["id"]
        assert card["creator"]["telegram_username"] == "vasya"
        assert "volume_nano" in card["activity"]

    own = client.get(f"/creators/{maker_a['id']}", headers=ha)
    assert own.status_code == 200
    other = client.get(f"/users/{maker_a['id']}", headers=hb)
    assert other.status_code == 403
    assert client.get("/creators/999999999").status_code == 404

    feed = client.get("/markets")
    assert feed.status_code == 200
    by_id = {m["id"]: m for m in feed.json()}
    assert by_id[m1["id"]]["creator"]["display_name"] == "Vasya"
    assert by_id[m1["id"]]["activity"]["fills"] == 1


def _admin_local(client: TestClient, monkeypatch):
    from tests.test_markets_api import _admin

    return _admin(client, monkeypatch)
