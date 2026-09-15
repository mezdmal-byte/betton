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
    stranger_book = client.get(f"/markets/{private['id']}/orderbook", headers=ht)
    assert stranger_book.status_code == 404
    assert stranger_book.status_code != 403
    creator_book = client.get(f"/markets/{private['id']}/orderbook", headers=hm)
    assert creator_book.status_code == 200, creator_book.text
    admin_book = client.get(f"/markets/{private['id']}/orderbook", headers=ah)
    assert admin_book.status_code == 200, admin_book.text

    queue_ids = {m["id"] for m in client.get("/moderation/markets", headers=ah).json()}
    assert private["id"] not in queue_ids

    profile = client.get(f"/creators/{maker['id']}").json()
    profile_ids = {m["id"] for m in profile["markets"]}
    assert public["id"] in profile_ids
    assert private["id"] not in profile_ids
    assert profile["creator"]["markets_created"] == 1
    only, ho = _login(client, username="onlyunlisted", first_name="Only")
    sole = _create(client, ho, "Only the invited club sees this kickoff time?", visibility="unlisted")
    assert sole["id"] not in {m["id"] for m in client.get(f"/creators/{only['id']}").json()["markets"]}
    assert only["id"] not in {row["id"] for row in client.get("/creators/top").json()}

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

    placed = submit(client, first["id"], {**hv, "X-Market-Share-Token": token}, 0, 25, 2)
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
    assert "X-Market-Share-Token" in html
    assert "eventShareById" in html
    assert "shareHeadersFor" in html
    assert "rememberShareToken" in html
    assert "/markets/share/" in html
    assert 'params.get("share")' in html
    assert "start=market_" in html
    assert "bot_username" in html
    assert "Тип: По ссылке" not in p2p or "private.badge" in p2p
    assert "Приватное" in p2p
    assert 'data-act="share"' in p2p
    assert "Поделиться" in p2p
    access = (Path(__file__).resolve().parents[1] / "app" / "services" / "market_access.py").read_text(encoding="utf-8")
    assert "logging" not in access
    assert "print(" not in access


QUOTE = {"outcome": 0, "money": 10, "odds": 2}


def _share(headers, token):
    return {**headers, "X-Market-Share-Token": token}


def test_unlisted_numeric_id_requires_share_token(client: TestClient, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    maker, hm = _login(client, username="gatekeeper", first_name="Gate")
    trader, ht = _login(client, username="stranger", first_name="Stranger")
    public = _create(client, hm, "Will the listed derby finish after extra time?")
    assert client.post(f"/markets/{public['id']}/approve", headers=ah).status_code == 200
    private = _create(client, hm, "Hidden derby kickoff stays invite only?", visibility="unlisted")
    token = private["share_token"]
    other = _create(client, hm, "Second hidden derby also invite only?", visibility="unlisted")["share_token"]
    mid = private["id"]
    pub = public["id"]

    assert client.get(f"/markets/{pub}/orderbook").status_code == 200
    assert client.get(f"/markets/{pub}/orderbook", headers=ht).status_code == 200
    assert client.post(f"/markets/{pub}/orders/quote", headers=ht, json=QUOTE).status_code == 200
    assert submit(client, pub, ht, 0, 10, 2).status_code == 200

    for path, method, kwargs in (
        (f"/markets/{mid}", "get", {}),
        (f"/markets/{mid}/orderbook", "get", {}),
        (f"/markets/{mid}/orders/quote", "post", {"json": QUOTE}),
        (f"/markets/{mid}/orders", "post", {"json": {**QUOTE, "request_id": "no-token-place-abcdefgh"}}),
    ):
        res = getattr(client, method)(path, headers=ht, **kwargs)
        assert res.status_code == 404, (path, res.status_code, res.text)
        assert res.status_code != 403

    wrong = _share(ht, other)
    assert client.get(f"/markets/{mid}", headers=wrong).status_code == 404
    assert client.get(f"/markets/{mid}/orderbook", headers=wrong).status_code == 404
    assert client.post(f"/markets/{mid}/orders/quote", headers=wrong, json=QUOTE).status_code == 404
    assert submit(client, mid, wrong, 0, 10, 2).status_code == 404

    ok = _share(ht, token)
    assert client.get(f"/markets/{mid}", headers=ok).status_code == 200
    assert client.get(f"/markets/{mid}/orderbook", headers=ok).status_code == 200
    quoted = client.post(f"/markets/{mid}/orders/quote", headers=ok, json=QUOTE)
    assert quoted.status_code == 200, quoted.text
    placed = submit(client, mid, ok, 0, 12, 2)
    assert placed.status_code == 200, placed.text
    cancelled = client.post(f"/orders/{placed.json()['id']}/cancel", headers=ht)
    assert cancelled.status_code == 200, cancelled.text

    assert client.get(f"/markets/{mid}", headers=hm).status_code == 200
    assert client.get(f"/markets/{mid}/orderbook", headers=hm).status_code == 200
    assert client.post(f"/markets/{mid}/orders/quote", headers=hm, json=QUOTE).status_code == 200
    assert submit(client, mid, hm, 0, 8, 2).status_code == 200

    assert client.get(f"/markets/{mid}", headers=ah).status_code == 200
    assert client.get(f"/markets/{mid}/orderbook", headers=ah).status_code == 200
    assert client.post(f"/markets/{mid}/orders/quote", headers=ah, json=QUOTE).status_code == 200
    assert submit(client, mid, ah, 0, 9, 2).status_code == 200

    assert client.get(f"/markets/share/{token}", headers=ht).status_code == 200
    assert client.get("/markets/share/not-a-real-share-token-zzzz", headers=ht).status_code == 404
