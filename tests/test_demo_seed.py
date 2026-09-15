import importlib.util
import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import settings
from app.database import SessionLocal

ROOT = Path(__file__).resolve().parents[1]


def _seed_mod():
    path = ROOT / "scripts" / "seed_demo_markets.py"
    spec = importlib.util.spec_from_file_location("seed_demo_markets", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def test_seed_refuses_unsafe_and_default_app_db():
    seed = _seed_mod()
    try:
        seed.assert_safe_database("postgresql://user:pw@dpg-xxxx.onrender.com/betton")
        raise AssertionError("render host must be refused")
    except SystemExit as exc:
        assert "production" in str(exc).lower() or "render" in str(exc).lower() or "refusing" in str(exc).lower()
    try:
        seed.assert_safe_database("sqlite:///./betton.db")
        raise AssertionError("default betton.db must be refused")
    except SystemExit:
        pass
    seed.assert_safe_database("sqlite:///./betton-demo.db")
    seed.assert_safe_database("postgresql+psycopg2://betton:x@localhost:5432/betton_test")
    seed.assert_safe_database("sqlite:///./betton.db", allow_local_demo=True)


def test_seed_refuses_render_env(monkeypatch):
    seed = _seed_mod()
    monkeypatch.setenv("RENDER", "true")
    try:
        seed.assert_safe_database("sqlite:///./betton-demo.db")
        raise AssertionError("RENDER env must block seeding")
    except SystemExit as exc:
        assert "render" in str(exc).lower()


def test_seed_creates_requested_count_and_useful_states(client: TestClient, monkeypatch):
    seed = _seed_mod()
    monkeypatch.setattr(settings, "admin_telegram_id", 9_000_001)
    with SessionLocal() as db:
        summary = seed.seed_markets(db, count=16)
    assert summary["count"] == 16
    assert summary["unlisted"] >= 1
    assert summary["pending"] >= 1
    assert summary["public_open"] >= 1

    listed = client.get("/markets").json()
    questions = [m["question"] for m in listed]
    assert len(set(questions)) >= 8
    assert all("Event #" not in q for q in questions)
    assert all(m.get("visibility", "public") != "unlisted" for m in listed)
    token = next(part for part in questions[0].replace("?", "").split() if len(part) > 4)
    search = client.get("/markets", params={"q": token})
    assert search.status_code == 200
    assert any(m["id"] == listed[0]["id"] for m in search.json())

    popular = client.get("/markets", params={"sort": "popular"}).json()
    closing = client.get("/markets", params={"sort": "closing"}).json()
    newest = client.get("/markets", params={"sort": "new"}).json()
    assert popular and closing and newest
    sport = client.get("/markets", params={"category": "sport"}).json()
    assert sport
    page = client.get("/markets", params={"limit": 5, "offset": 0})
    assert page.status_code == 200
    assert len(page.json()) <= 5


def test_seed_is_idempotent_for_the_same_demo_tag(client: TestClient, monkeypatch):
    seed = _seed_mod()
    monkeypatch.setattr(settings, "admin_telegram_id", 9_000_001)
    from app.models import Market, User

    with SessionLocal() as db:
        planted = User(username="real-telegram-tester", telegram_id=1_234_567, balance=1000)
        db.add(planted)
        db.commit()
        planted_id = planted.id
        first = seed.seed_markets(db, count=16, demo_tag="idemp")
        second = seed.seed_markets(db, count=16, demo_tag="idemp")
        tagged = db.query(Market).filter(Market.description.like("%DEMO[idemp]%")).count()
        still = db.get(User, planted_id)
    assert first["created"] == 16
    assert second["created"] == 0
    assert second["skipped"] == 16
    assert tagged == 16
    assert still is not None
    assert still.telegram_id == 1_234_567
    assert still.username == "real-telegram-tester"


def test_seed_100_markets_varied_odds_volumes_and_states(client: TestClient, monkeypatch):
    seed = _seed_mod()
    monkeypatch.setattr(settings, "admin_telegram_id", 9_000_001)
    from app.models import Market, P2POrder
    from app.services.p2p_service import PRICE

    with SessionLocal() as db:
        summary = seed.seed_markets(db, count=100, demo_tag="full100")
        markets = db.query(Market).filter(Market.description.like("%DEMO[full100]%")).all()
        orders = db.query(P2POrder).all()
        creators = {m.creator_id for m in markets}
        cats = {}
        for m in markets:
            cats[m.category] = cats.get(m.category, 0) + 1
        odds = sorted({round(PRICE / row.price, 2) for row in orders})
        volumes = [int(m.pot_nano or 0) for m in markets]
    assert summary["count"] == 100
    assert summary["created"] == 100
    assert len(markets) == 100
    assert len(creators) >= 8
    assert cats.get("sport") == 35
    assert cats.get("politics") == 30
    assert cats.get("unique") == 35
    assert summary["unlisted"] >= 3
    assert summary["pending"] >= 3
    statuses = {m.status.value for m in markets}
    assert "open" in statuses
    assert "closed" in statuses
    assert "resolved" in statuses
    assert "cancelled" in statuses
    assert "pending" in statuses
    assert len(odds) >= 6
    assert any(k <= 1.5 for k in odds)
    assert any(k >= 3.0 for k in odds)
    assert max(volumes) > min(v for v in volumes if v > 0) * 5
    listed = client.get("/markets", params={"sort": "popular"}).json()
    newest = client.get("/markets", params={"sort": "new"}).json()
    assert listed and newest
    assert [m["id"] for m in listed[:5]] != [m["id"] for m in newest[:5]]
    top = client.get("/creators/top?limit=10").json()
    assert len(top) >= 3
    assert len(top) <= 10
    vols = [row["volume_nano"] for row in top]
    assert vols == sorted(vols, reverse=True)
    assert len(set(vols)) >= 2


def test_seed_safety_guards_source_unchanged():
    source = (ROOT / "scripts" / "seed_demo_markets.py").read_text(encoding="utf-8")
    assert "Refusing to seed: Render environment detected." in source
    assert "production-like database host" in source
    assert "without --allow-local-demo" in source
    assert "RENDER_SERVICE_ID" in source
    assert "onrender.com" in source
