"""Local/CI demo seeder. Never targets production or Render automatically."""
from __future__ import annotations

import argparse
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

UNSAFE_HOST_MARKERS = (
    "onrender.com",
    "render.com",
    "amazonaws.com",
    "neon.tech",
    "supabase.co",
    "azure.com",
    "cloudsql",
)
ALLOWED_PG_HOSTS = {"localhost", "127.0.0.1", "postgres", "::1", "host.docker.internal"}
RENDER_ENV_KEYS = ("RENDER", "RENDER_SERVICE_ID", "RENDER_EXTERNAL_URL")


def _parse_url(url: str):
    raw = (url or "").strip()
    if not raw:
        raise ValueError("database url is empty")
    if raw.startswith("sqlite:"):
        rest = raw.split(":///", 1)[-1] if ":///" in raw else ""
        return "sqlite", None, rest
    parsed = urlparse(raw.replace("postgresql+psycopg2", "postgresql"))
    return parsed.scheme, (parsed.hostname or "").lower(), parsed.path


def looks_like_render_env() -> bool:
    for key in RENDER_ENV_KEYS:
        value = (os.environ.get(key) or "").strip()
        if value:
            return True
    return False


def assert_safe_database(url: str, *, allow_local_demo: bool = False) -> None:
    if looks_like_render_env():
        raise SystemExit("Refusing to seed: Render environment detected.")
    kind, host, path = _parse_url(url)
    blob = f"{url} {host or ''} {path or ''}".lower()
    if any(marker in blob for marker in UNSAFE_HOST_MARKERS):
        raise SystemExit("Refusing to seed: production-like database host.")
    if kind.startswith("sqlite"):
        name = Path(path or "").name.lower()
        if name in {"betton.db", "production.db"} and not allow_local_demo:
            raise SystemExit(
                "Refusing to seed the default local app database without --allow-local-demo."
            )
        return
    if kind.startswith("postgres"):
        if host in ALLOWED_PG_HOSTS:
            return
        if allow_local_demo and host and not any(marker in host for marker in UNSAFE_HOST_MARKERS):
            return
        raise SystemExit(
            "Refusing to seed this PostgreSQL host. Use localhost/CI or pass --allow-local-demo."
        )
    raise SystemExit("Only SQLite and PostgreSQL demo databases are supported.")


SPORT = [
    "Who wins {a} vs {b} this weekend?",
    "Will {a} cover the handicap against {b}?",
    "Does {a} score first against {b}?",
]
POLITICS = [
    "Will the {topic} bill pass this session?",
    "Does {place} keep the current majority after the vote?",
    "Will turnout in {place} exceed last cycle?",
]
UNIQUE = [
    "Will it rain in {city} tomorrow evening?",
    "Does the {thing} launch before month end?",
    "Will {city} see snow before December?",
]
TEAMS = [
    "Lions", "Sharks", "Eagles", "Wolves", "Tigers", "Bears", "Falcons", "Dragons",
    "Foxes", "Hawks", "Bulls", "Cobras", "Ravens", "Otters", "Pandas", "Vipers",
]
PLACES = [
    "Berlin", "Oslo", "Kyiv", "Lisbon", "Riga", "Seoul", "Cairo", "Lima",
    "Accra", "Perth", "Quebec", "Hanoi",
]
TOPICS = [
    "housing", "energy", "transit", "education", "tax", "health", "digital ID", "farming",
]
THINGS = [
    "chess championship", "mars probe", "city marathon", "film festival",
    "open-source release", "museum night", "river festival", "eclipse watch",
]
CITIES = [
    "Berlin", "Tokyo", "Sahara Station", "Reykjavik", "Cape Town", "Montreal",
    "Tbilisi", "Valencia", "Helsinki", "Nairobi",
]
CREATORS = [
    ("vasya", "Vasya"),
    ("petya", "Petya"),
    ("masha", "Masha"),
    ("kenji", "Kenji"),
    ("lin", "Lin Wei"),
    ("nina", "Nina"),
    ("omar", "Omar"),
    ("ira", "Ira"),
]


def demo_questions(count: int) -> list[dict]:
    rows: list[dict] = []
    i = 0
    while len(rows) < count:
        bucket = len(rows) % 3
        if bucket == 0:
            a = TEAMS[i % len(TEAMS)]
            b = TEAMS[(i + 3) % len(TEAMS)]
            question = SPORT[i % len(SPORT)].format(a=a, b=b)
            category = "sport"
            outcomes = [a, b] if "Who wins" in question else ["Yes", "No"]
        elif bucket == 1:
            question = POLITICS[i % len(POLITICS)].format(topic=TOPICS[i % len(TOPICS)], place=PLACES[i % len(PLACES)])
            category = "politics"
            outcomes = ["Yes", "No"]
        else:
            question = UNIQUE[i % len(UNIQUE)].format(city=CITIES[i % len(CITIES)], thing=THINGS[i % len(THINGS)])
            category = "unique"
            outcomes = ["Yes", "No"]
        rows.append({"question": question, "category": category, "outcomes": outcomes})
        i += 1
    return rows


def _now():
    return datetime.now(timezone.utc)


def seed_markets(db, *, count: int = 100, rng_seed: int = 42) -> dict:
    from app.models import MarketStatus, User
    from app.schemas import MarketCreate
    from app.services import market_service, p2p_service

    count = max(1, min(int(count), 300))
    questions = demo_questions(count)
    admin = market_service.get_or_create_telegram_user(
        db, telegram_id=9_000_001, username="demo_admin", first_name="Demo", last_name="Admin"
    )
    makers = []
    for index, (username, name) in enumerate(CREATORS):
        user = market_service.get_or_create_telegram_user(
            db,
            telegram_id=9_100_000 + index,
            username=username,
            first_name=name.split()[0],
            last_name=" ".join(name.split()[1:]) or None,
        )
        user.balance = 50_000
        makers.append(user)
    traders = []
    for index in range(6):
        user = market_service.get_or_create_telegram_user(
            db, telegram_id=9_200_000 + index, username=f"trader{index}", first_name=f"Trader{index}"
        )
        user.balance = 50_000
        traders.append(user)
    db.commit()

    created = []
    now = _now()
    for index, spec in enumerate(questions):
        maker = makers[index % len(makers)]
        role = index % 8
        unlisted = index % 17 == 0
        hours = 2 if role == 4 else (24 + (index % 20) * 12)
        close_at = now + timedelta(hours=hours)
        req = MarketCreate(
            question=spec["question"],
            description="DEMO seed — not production data.",
            category=spec["category"],
            outcomes=spec["outcomes"],
            close_at=close_at,
            visibility="unlisted" if unlisted else "public",
        )
        market = p2p_service.create_market(db, maker.id, req)
        market.created_at = (now - timedelta(days=(count - index), hours=index % 11)).replace(tzinfo=None)
        db.commit()
        if not unlisted and role != 0:
            market = market_service.moderate_market(db, market.id, admin.id)
        db.refresh(market)
        if role in (2, 3, 4, 5, 6, 7) and not unlisted and market.status == MarketStatus.open:
            taker_a, taker_b = traders[index % len(traders)], traders[(index + 1) % len(traders)]
            amount = 40 + (index % 7) * 20
            if role == 3:
                amount = 180 + (index % 5) * 40
            p2p_service.place(db, market.id, taker_a.id, 0, amount, 2.0, "limit", f"demo-{market.id}-a-{uuid.uuid4().hex[:10]}")
            if role != 2:
                p2p_service.place(db, market.id, taker_b.id, 1, amount, 2.0, "limit", f"demo-{market.id}-b-{uuid.uuid4().hex[:10]}")
        db.refresh(market)
        if role == 5 and market.status == MarketStatus.open:
            market_service.close_market(db, market.id, admin.id)
        if role == 6 and market.status == MarketStatus.open:
            market_service.close_market(db, market.id, admin.id)
            market_service.resolve_market(db, market.id, 0, admin.id)
        if role == 7 and market.status == MarketStatus.open:
            p2p_service.void_market(db, market.id, admin.id, "DEMO cancellation for variety")
        db.refresh(market)
        created.append(market)
    return {
        "count": len(created),
        "public_open": sum(1 for m in created if (getattr(m, "visibility", "public") or "public") == "public" and m.status == MarketStatus.open),
        "unlisted": sum(1 for m in created if (getattr(m, "visibility", "public") or "public") == "unlisted"),
        "pending": sum(1 for m in created if m.status == MarketStatus.pending),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed a local/CI demo database with P2P markets.")
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--database-url", default="")
    parser.add_argument("--allow-local-demo", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    url = (args.database_url or os.environ.get("DATABASE_URL") or "").strip()
    if not url:
        print(
            "Pass --database-url explicitly, for example:\n"
            "  python scripts/seed_demo_markets.py --count 100 --database-url sqlite:///./betton-demo.db",
            file=sys.stderr,
        )
        return 2
    try:
        assert_safe_database(url, allow_local_demo=args.allow_local_demo)
    except SystemExit as exc:
        print(exc, file=sys.stderr)
        return 2
    os.environ["DATABASE_URL"] = url
    if not os.environ.get("ADMIN_TELEGRAM_ID"):
        os.environ["ADMIN_TELEGRAM_ID"] = "9000001"
    from app.config import settings
    from app.database import SessionLocal, ensure_schema

    settings.database_url = url
    settings.admin_telegram_id = os.environ["ADMIN_TELEGRAM_ID"]
    ensure_schema()
    with SessionLocal() as db:
        summary = seed_markets(db, count=args.count)
    print(f"Seeded {summary['count']} DEMO markets (open public={summary['public_open']}, unlisted={summary['unlisted']}, pending={summary['pending']}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
