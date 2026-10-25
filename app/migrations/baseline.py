"""Frozen 2026-10-24 legacy schema upgrade. Do not edit after release."""
import json
import math
from pathlib import Path
from contextlib import nullcontext
from datetime import datetime, timedelta, timezone
from sqlalchemy import inspect, text

def _add_column_if_missing(conn, table: str, name: str, ddl: str, existing: set[str]) -> None:
    if name in existing:
        return
    if conn.dialect.name == "postgresql" and ddl == "DATETIME":
        ddl = "TIMESTAMP"
    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


def _ensure_varchar_capacity(conn, table: str, column: str, length: int) -> None:
    """PostgreSQL enforces VARCHAR(n); SQLite does not. Widen without rewriting rows."""
    if conn.dialect.name != "postgresql":
        return
    conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE VARCHAR({length})"))


def upgrade(conn) -> None:
    """create_all + колонки n-исходов / pot / close_at на уже существующих таблицах."""
    snapshot = json.loads(Path(__file__).with_name("baseline_20261024.json").read_text())
    existing = set(inspect(conn).get_table_names())
    for table in snapshot[conn.dialect.name]:
        if table['table'] not in existing:
            conn.exec_driver_sql(table['ddl'])
            for index in table['indexes']:
                conn.exec_driver_sql(index)
    insp = inspect(conn)
    tables = set(insp.get_table_names())
    if "markets" not in tables:
        return

    market_cols = {c["name"] for c in insp.get_columns("markets")}
    user_cols = {c["name"] for c in insp.get_columns("users")}
    with nullcontext(conn):
        for table, name, columns in [('users', 'balance_nano', user_cols),
                                     ('markets', 'pot_nano', market_cols),
                                     ('markets', 'lock_nano', market_cols)]:
            _add_column_if_missing(conn, table, name,
                f'BIGINT CHECK ({name} BETWEEN 0 AND 9223372036854775807)', columns)
        _add_column_if_missing(conn, "users", "telegram_username", "VARCHAR(64)", user_cols)
        _add_column_if_missing(conn, "users", "display_name", "VARCHAR(128)", user_cols)
        _add_column_if_missing(conn, "users", "photo_url", "VARCHAR(1024)", user_cols)
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
        _add_column_if_missing(conn, "markets", "cancellation_reason", "VARCHAR(1000)", market_cols)
        _add_column_if_missing(conn, "markets", "cancelled_at", "TIMESTAMP", market_cols)
        _add_column_if_missing(conn, "markets", "cancelled_by", "INTEGER", market_cols)
        _add_column_if_missing(conn, "markets", "p2p_journal_coverage", "VARCHAR(16)", market_cols)
        _add_column_if_missing(conn, "markets", "visibility", "VARCHAR(16) DEFAULT 'public'", market_cols)
        _add_column_if_missing(conn, "markets", "share_token", "VARCHAR(64)", market_cols)
        conn.execute(text("UPDATE markets SET visibility = 'public' WHERE visibility IS NULL"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_markets_share_token ON markets (share_token)"))
        conn.execute(
            text(
                "UPDATE markets SET p2p_journal_coverage = 'incomplete' "
                "WHERE p2p_journal_coverage IS NULL AND mechanism = 'p2p'"
            )
        )
        conn.execute(
            text(
                "UPDATE markets SET p2p_journal_coverage = 'not_applicable' "
                "WHERE p2p_journal_coverage IS NULL"
            )
        )
        conn.execute(text("UPDATE markets SET category = 'unique' WHERE category IS NULL"))
        _ensure_varchar_capacity(conn, "markets", "status", 16)

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


