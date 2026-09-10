import json
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def _engine_kwargs(url: str) -> dict:
    kwargs: dict = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
    return kwargs


engine = create_engine(settings.database_url, **_engine_kwargs(settings.database_url))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _add_column_if_missing(conn, table: str, name: str, ddl: str, existing: set[str]) -> None:
    if name in existing:
        return
    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def ensure_schema() -> None:
    """create_all + колонки n-исходов / pot / close_at на уже существующих таблицах."""
    from app import models as _models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    tables = set(insp.get_table_names())
    if "markets" not in tables:
        return

    market_cols = {c["name"] for c in insp.get_columns("markets")}
    with engine.begin() as conn:
        _add_column_if_missing(conn, "markets", "category", "VARCHAR(32) DEFAULT 'unique'", market_cols)
        _add_column_if_missing(conn, "markets", "outcomes", "TEXT", market_cols)
        _add_column_if_missing(conn, "markets", "q", "TEXT", market_cols)
        _add_column_if_missing(conn, "markets", "lock_ton", "FLOAT DEFAULT 0", market_cols)
        _add_column_if_missing(conn, "markets", "pot", "FLOAT DEFAULT 0", market_cols)
        _add_column_if_missing(conn, "markets", "close_at", "DATETIME", market_cols)
        _add_column_if_missing(conn, "markets", "lock_returned", "BOOLEAN DEFAULT 0", market_cols)
        _add_column_if_missing(conn, "markets", "mechanism", "VARCHAR(16) NOT NULL DEFAULT 'lmsr'", market_cols)
        _add_column_if_missing(conn, "markets", "settlement_kind", "VARCHAR(16)", market_cols)
        _add_column_if_missing(conn, "markets", "rejection_reason", "VARCHAR(1000)", market_cols)
        _add_column_if_missing(conn, "markets", "moderated_at", "TIMESTAMP", market_cols)
        _add_column_if_missing(conn, "markets", "moderated_by", "INTEGER", market_cols)
        conn.execute(text("UPDATE markets SET category = 'unique' WHERE category IS NULL"))

        if "positions" in tables:
            pos_cols = {c["name"] for c in insp.get_columns("positions")}
            _add_column_if_missing(conn, "positions", "shares", "TEXT", pos_cols)
            _add_column_if_missing(conn, "positions", "costs", "TEXT", pos_cols)

        rows = conn.execute(
            text(
                "SELECT id, q_yes, q_no, b, outcomes, q, lock_ton, pot, close_at, "
                "winning_outcome, created_at FROM markets"
            )
        ).mappings().all()
        for row in rows:
            outcomes = _as_json_list(row["outcomes"])
            q_vec = _as_json_list(row["q"])
            q_yes = float(row["q_yes"] or 0)
            q_no = float(row["q_no"] or 0)
            if not outcomes or len(outcomes) < 2:
                outcomes = ["Да", "Нет"]
            if not q_vec or len(q_vec) != len(outcomes):
                q_vec = [q_yes, q_no] if len(outcomes) == 2 else [0.0] * len(outcomes)
            lock_ton = row["lock_ton"]
            if lock_ton is None:
                n = max(2, len(outcomes))
                b = float(row["b"] or 0)
                lock_ton = (b * math.log(n)) if b > 0 else 50.0
            pot = row["pot"]
            if pot is None:
                pot = float(lock_ton)
            close_at = row["close_at"]
            if close_at is None:
                created = row["created_at"] or datetime.now(timezone.utc)
                if isinstance(created, str):
                    close_at = None
                else:
                    close_at = created + timedelta(days=7)
            winning = row["winning_outcome"]
            if winning in ("yes", "Outcome.yes"):
                winning = outcomes[0]
            elif winning in ("no", "Outcome.no"):
                winning = outcomes[1] if len(outcomes) > 1 else winning
            conn.execute(
                text(
                    "UPDATE markets SET outcomes = :outcomes, q = :q, lock_ton = :lock_ton, "
                    "pot = :pot, close_at = :close_at, winning_outcome = :winning WHERE id = :id"
                ),
                {
                    "id": row["id"],
                    "outcomes": json.dumps(outcomes, ensure_ascii=False),
                    "q": json.dumps([float(x) for x in q_vec]),
                    "lock_ton": float(lock_ton),
                    "pot": float(pot),
                    "close_at": close_at,
                    "winning": winning,
                },
            )

        if "positions" in tables:
            pos_rows = conn.execute(
                text("SELECT id, shares_yes, shares_no, cost_yes, cost_no, shares, costs FROM positions")
            ).mappings().all()
            for prow in pos_rows:
                shares = _as_json_list(prow["shares"])
                costs = _as_json_list(prow["costs"])
                if len(shares) < 2:
                    shares = [float(prow["shares_yes"] or 0), float(prow["shares_no"] or 0)]
                if len(costs) < 2:
                    costs = [float(prow["cost_yes"] or 0), float(prow["cost_no"] or 0)]
                conn.execute(
                    text("UPDATE positions SET shares = :shares, costs = :costs WHERE id = :id"),
                    {
                        "id": prow["id"],
                        "shares": json.dumps([float(x) for x in shares]),
                        "costs": json.dumps([float(x) for x in costs]),
                    },
                )


def _as_json_list(value) -> list:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
        except json.JSONDecodeError:
            return []
        return parsed if isinstance(parsed, list) else []
    return []
