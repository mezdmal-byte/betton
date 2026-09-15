from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import settings
from app.database import ensure_schema
from tests.test_markets_api import _admin
from tests.test_p2p import submit
from tests.test_profile_creators import _login


def _close_at(hours=3):
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def _create(client: TestClient, headers, question="Will the private match finish on time?", visibility="public", **extra):
    body = {
        "question": question,
        "category": extra.pop("category", "unique"),
        "outcomes": extra.pop("outcomes", ["Yes", "No"]),
        "close_at": extra.pop("close_at", _close_at()),
        "visibility": visibility,
    }
    body.update(extra)
    res = client.post("/markets", headers=headers, json=body)
    assert res.status_code == 200, res.text
    return res.json()


def test_ensure_schema_adds_visibility_and_share_token(client: TestClient):
    ensure_schema()
    ensure_schema()
    from sqlalchemy import inspect
    from app.database import engine

    cols = {c["name"] for c in inspect(engine).get_columns("markets")}
    assert "visibility" in cols
    assert "share_token" in cols


def test_public_market_still_pending_until_moderation(client: TestClient, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    maker, hm = _login(client, username="pubmaker", first_name="Pub")
    created = _create(client, hm, "Will the public cup final go to extra time?")
    assert created["status"] == "pending"
    assert created["visibility"] == "public"
    assert created.get("share_token") in (None, "")
    assert all(m["id"] != created["id"] for m in client.get("/markets").json())
    assert client.get(f"/markets/{created['id']}").status_code == 404
    queue = client.get("/moderation/markets", headers=ah).json()
    assert any(m["id"] == created["id"] for m in queue)
    assert client.post(f"/markets/{created['id']}/approve", headers=ah).status_code == 200
    listed = client.get("/markets").json()
    assert any(m["id"] == created["id"] for m in listed)


def test_unlisted_opens_immediately_and_stays_out_of_public_surfaces(client: TestClient, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    maker, hm = _login(client, username="hidemaker", first_name="Hide")
    trader, ht = _login(client)
    public = _create(client, hm, "Will it rain during the public festival tonight?")
    assert client.post(f"/markets/{public['id']}/approve", headers=ah).status_code == 200

    private = _create(
        client,
        hm,
        "Secret club championship winner this weekend?",
        visibility="unlisted",
        category="sport",
    )
    assert private["status"] == "open"
    assert private["visibility"] == "unlisted"
    token = private["share_token"]
    assert token
    assert token != str(private["id"])
    assert len(token) >= 16
    assert private["id"] != token

    listed_ids = {m["id"] for m in client.get("/markets").json()}
    assert public["id"] in listed_ids
    assert private["id"] not in listed_ids
    assert all(not m.get("share_token") for m in client.get("/markets").json())

    for params in (
        {"q": "secret club championship"},
        {"sort": "popular"},
        {"sort": "new"},
        {"sort": "closing"},
        {"category": "sport", "q": "championship"},
    ):
        ids = {m["id"] for m in client.get("/markets", params=params).json()}
        assert private["id"] not in ids, params

    assert client.get(f"/markets/{private['id']}").status_code == 404
    assert client.get(f"/markets/{private['id']}/orderbook").status_code == 404
    book = client.get(f"/markets/{private['id']}/orderbook", headers=ht)
    assert book.status_code == 200

    queue_ids = {m["id"] for m in client.get("/moderation/markets", headers=ah).json()}
    assert private["id"] not in queue_ids

    profile = client.get(f"/creators/{maker['id']}").json()
    profile_ids = {m["id"] for m in profile["markets"]}
    assert public["id"] in profile_ids
    assert private["id"] not in profile_ids

    mine = client.get(f"/users/{maker['id']}/markets", headers=hm).json()
    mine_private = next(m for m in mine if m["id"] == private["id"])
    assert mine_private["share_token"] == token


def test_share_token_resolve_auth_and_isolation(client: TestClient):
    maker, hm = _login(client, username="sharemaker", first_name="Share")
    visitor, hv = _login(client)
    first = _create(client, hm, "Hidden opening ceremony delayed again?", visibility="unlisted")
    second = _create(client, hm, "Hidden afterparty cancelled by weather?", visibility="unlisted")
    token = first["share_token"]
    other = second["share_token"]
    assert token != other

    assert client.get(f"/markets/share/{token}").status_code == 401
    missing = client.get("/markets/share/not-a-real-share-token-zzzz", headers=hv)
    assert missing.status_code == 404
    short = client.get("/markets/share/ab", headers=hv)
    assert short.status_code == 404

    resolved = client.get(f"/markets/share/{token}", headers=hv)
    assert resolved.status_code == 200, resolved.text
    body = resolved.json()
    assert body["id"] == first["id"]
    assert body["share_token"] == token
    assert body["visibility"] == "unlisted"
    assert body["question"] == first["question"]
    assert second["id"] != body["id"]

    other_resolved = client.get(f"/markets/share/{other}", headers=hv).json()
    assert other_resolved["id"] == second["id"]

    placed = submit(client, first["id"], hv, 0, 25, 2)
    assert placed.status_code == 200, placed.text


def test_bot_share_deep_link_uses_current_webapp_base(monkeypatch):
    from bot.main import share_webapp_url, start_payload_token

    monkeypatch.setattr(settings, "public_base_url", "https://fresh-tunnel.trycloudflare.com")
    monkeypatch.setattr(settings, "mini_app_url", "")
    monkeypatch.setattr(settings, "render_external_url", "")
    token = "AbCdefGhIjkLmNopqRstUvWx"
    assert start_payload_token("market_" + token) == token
    assert start_payload_token("market_") is None
    assert start_payload_token("help") is None
    assert share_webapp_url(token) == "https://fresh-tunnel.trycloudflare.com/?share=" + token

    monkeypatch.setattr(settings, "public_base_url", "https://other-tunnel.trycloudflare.com/")
    assert share_webapp_url(token) == "https://other-tunnel.trycloudflare.com/?share=" + token


def test_health_exposes_bot_username(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "telegram_bot_username", "@SobakaPesBot")
    health = client.get("/health").json()
    assert health["bot_username"] == "SobakaPesBot"


def test_private_share_ui_boot_and_create_chips():
    html = (Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html").read_text(encoding="utf-8")
    p2p = (Path(__file__).resolve().parents[1] / "app" / "static" / "p2p.js").read_text(encoding="utf-8")
    assert 'data-vis="public"' in html
    assert 'data-vis="unlisted"' in html
    assert "visibility: createVisibility" in html
    assert "/markets/share/" in html
    assert 'params.get("share")' in html
    assert "start=market_" in html
    assert "bot_username" in html
    assert "Приватное" in p2p
    assert 'data-act="share"' in p2p
    assert "Тип: По ссылке" in p2p
    assert "Поделиться" in p2p
