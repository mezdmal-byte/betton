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
