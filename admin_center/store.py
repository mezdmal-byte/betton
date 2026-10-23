"""Read-only projections for the existing BetTON schema (no ORM mutations)."""

from __future__ import annotations

from pathlib import Path
import sqlite3
from threading import RLock
from urllib.parse import quote

from fastapi import HTTPException
from sqlalchemy import MetaData, Table, create_engine, event, func, or_, select
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session
from sqlalchemy.pool import NullPool

NANO = 1_000_000_000
REQUIRED_COLUMNS = {
    "users": {"id", "username", "telegram_id", "balance_nano"},
    "markets": {"id", "creator_id", "question", "status"},
    "p2p_orders": {"id", "user_id", "market_id", "status", "remaining"},
    "p2p_fills": {"id", "market_id", "maker_user_id", "taker_user_id", "maker_order_id", "taker_order_id"},
    "p2p_money_entries": {"id", "market_id", "order_id", "fill_id", "from_order_id", "to_order_id", "from_user_id", "to_user_id", "amount"},
    "settlement_records": {"id", "market_id", "user_id"},
}


def read_only_engine(url: str) -> Engine:
    """Require an explicit DB URL. SQLite: native ro=1; Postgres: read-only transactions.

    PostgreSQL should ALSO have a SELECT-only DB role; session read-only is not
    an access-control boundary. DB schema migrations aren't executed here.
    """
    if url.startswith("sqlite:///"):
        path_str = url[len("sqlite:///") :]
        if (
            path_str in {":memory:", ""}
            or path_str.startswith("file:")
            or "?" in path_str
        ):
            raise RuntimeError("Admin Center requires a file-backed SQLite database")
        path = Path(path_str).expanduser().resolve(strict=True)
        if not path.is_file():
            raise RuntimeError("Database must be an existing SQLite file")
        uri = "file:" + quote(path.as_posix(), safe="/:\\") + "?mode=ro"

        def connect():
            connection = sqlite3.connect(
                uri, uri=True, check_same_thread=False, timeout=5
            )
            connection.execute("PRAGMA query_only=ON")
            return connection

        engine = create_engine("sqlite://", poolclass=NullPool, creator=connect)
    elif url.startswith(("postgresql://", "postgresql+psycopg2://")):
        parsed = make_url(url)
        if parsed.host not in {"localhost", "127.0.0.1", "::1"} or parsed.query:
            raise RuntimeError("PostgreSQL must be local; URL options are not allowed")
        if not parsed.database or not any(
            word in parsed.database.lower() for word in ("test", "sandbox")
        ):
            raise RuntimeError("Use a local PostgreSQL test/sandbox database")
        engine = create_engine(
            url,
            poolclass=NullPool,
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 5,
                "options": "-c default_transaction_read_only=on -c statement_timeout=5000",
            },
        )

        @event.listens_for(engine, "connect")
        def check_role(connection, _):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user"
                )
                if any(cursor.fetchone()):
                    raise RuntimeError("Use an unprivileged SELECT-only database role")
                cursor.execute("""SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                    AND (has_table_privilege(quote_ident(table_schema) || '.' || quote_ident(table_name), 'INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER')
                    OR EXISTS (SELECT 1 FROM pg_tables p WHERE p.schemaname=table_schema
                               AND p.tablename=table_name AND p.tableowner=current_user)))""")
                if cursor.fetchone()[0]:
                    raise RuntimeError(
                        "Database role has write/owner privileges; use SELECT-only"
                    )
            connection.rollback()
    else:
        raise RuntimeError(
            "Unsupported admin database URL. Use file SQLite or local test PostgreSQL"
        )

    @event.listens_for(engine, "before_cursor_execute")
    def only_reads(_connection, _cursor, statement, _parameters, _context, _many):
        # Additional fail-closed guard. Native SQLite mode=ro / PG read-only remain in force.
        command = statement.lstrip().split(None, 1)[0].upper()
        if command not in {
            "SELECT",
            "SHOW",
        } and not statement.lstrip().upper().startswith(
            (
                "PRAGMA MAIN.",
                "PRAGMA TEMP.",
                "PRAGMA TABLE_",
                "PRAGMA INDEX_",
                "PRAGMA FOREIGN_KEY_",
                "PRAGMA DATABASE_LIST",
            )
        ):
            raise RuntimeError(
                "Admin Center permits SELECT and schema introspection only"
            )

    engine._betton_admin_readonly = True
    return engine


class Store:
    def __init__(self, engine: Engine):
        self.engine = engine
        self.metadata = MetaData()
        self.tables: dict[str, Table] = {}
        self.lock = RLock()

    def table(self, name: str) -> Table:
        with self.lock:
            if name not in self.tables:
                try:
                    self.tables[name] = Table(
                        name,
                        self.metadata,
                        autoload_with=self.engine,
                        resolve_fks=False,
                    )
                except Exception as exc:
                    raise HTTPException(
                        503, f"Missing or unreadable table: {name}"
                    ) from exc
        table = self.tables[name]
        if not REQUIRED_COLUMNS.get(name, set()).issubset(table.c.keys()):
            raise HTTPException(503, f"Incompatible schema in table: {name}")
        return table

    @staticmethod
    def fields(table: Table, names: tuple[str, ...]):
        return [table.c[n] for n in names if n in table.c]

    @staticmethod
    def row(data) -> dict:
        result = dict(data._mapping)
        for key in (
            "balance_nano",
            "pot_nano",
            "lock_nano",
            "amount",
            "remaining",
            "filled",
            "refunded",
            "maker_stake",
            "taker_stake",
        ):
            if result.get(key) is not None:
                result[key] = str(result[key])
        return result

    def page(
        self,
        db: Session,
        name: str,
        names: tuple[str, ...],
        *,
        limit: int,
        offset: int,
        predicate=None,
        descending: str = "id",
    ) -> list[dict]:
        table = self.table(name)
        columns = self.fields(table, names)
        if not columns:
            raise HTTPException(503, f"Missing columns in table: {name}")
        stmt = select(*columns)
        if predicate is not None:
            condition = predicate(table)
            if condition is not None:
                stmt = stmt.where(condition)
        if descending in table.c:
            stmt = stmt.order_by(table.c[descending].desc())
        return [self.row(r) for r in db.execute(stmt.limit(limit).offset(offset))]

    def single(
        self,
        db: Session,
        name: str,
        names: tuple[str, ...],
        id: int,
        *,
        key: str = "id",
    ) -> dict:
        t = self.table(name)
        r = db.execute(select(*self.fields(t, names)).where(t.c[key] == id)).first()
        if r is None:
            raise HTTPException(404, "Not found")
        return self.row(r)

    def overview(self, db: Session) -> dict:
        u, m, o = (self.table(s) for s in ("users", "markets", "p2p_orders"))
        users = db.scalar(select(func.count()).select_from(u))
        events = db.scalar(select(func.count()).select_from(m))
        # This is committed stake of *remaining active orders* — not market pot/payout.
        # Do not include closed/cancelled event reserves or already-filled portions.
        live = (o.c.status == "open") & (m.c.status == "open")
        remaining = db.scalar(
            select(func.sum(o.c.remaining))
            .select_from(o.join(m, o.c.market_id == m.c.id))
            .where(live)
        )
        return {
            "users": users,
            "events": events,
            "open_offers_nano": str(int(remaining or 0)),
            "open_offers_ton": format_nano(int(remaining or 0)),
            "live": True,
            "notes": [
                "Includes only unfilled parts of open orders in open events",
                "This is not the sum of already matched stakes",
            ],
        }

    def users(self, db: Session, q: str, limit: int, offset: int):
        def where(t):
            if not q:
                return None
            parts = []
            numeric = numeric_id(q)
            if numeric is not None:
                parts.extend((t.c.id == numeric, t.c.telegram_id == numeric))
            needle = q.removeprefix("@")
            escaped = (
                needle.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            )
            parts.append(t.c.username.ilike("%" + escaped + "%", escape="\\"))
            if "telegram_username" in t.c:
                parts.append(
                    t.c.telegram_username.ilike("%" + escaped + "%", escape="\\")
                )
            return or_(*parts)

        return self.page(
            db,
            "users",
            (
                "id",
                "username",
                "telegram_id",
                "telegram_username",
                "display_name",
                "balance_nano",
                "created_at",
            ),
            limit=limit,
            offset=offset,
            predicate=where,
        )

    def user(self, db: Session, id: int):
        usr = self.single(
            db,
            "users",
            (
                "id",
                "username",
                "telegram_id",
                "telegram_username",
                "display_name",
                "balance_nano",
                "created_at",
            ),
            id,
        )
        orders = self.page(
            db,
            "p2p_orders",
            ORDER_FIELDS,
            limit=50,
            offset=0,
            predicate=lambda t: t.c.user_id == id,
        )
        markets = self.page(
            db,
            "markets",
            MARKET_FIELDS,
            limit=30,
            offset=0,
            predicate=lambda t: t.c.creator_id == id,
        )
        entries = self.ledger(db, limit=50, offset=0, user_id=id)
        fills = self.page(
            db,
            "p2p_fills",
            FILL_FIELDS,
            limit=50,
            offset=0,
            predicate=lambda t: or_(t.c.maker_user_id == id, t.c.taker_user_id == id),
        )
        return {
            "user": usr,
            "orders": orders,
            "created_events": markets,
            "ledger": entries,
            "fills": fills,
            "truncated": {
                "orders": len(orders) == 50,
                "events": len(markets) == 30,
                "ledger": len(entries) == 50,
                "fills": len(fills) == 50,
            },
        }

    def events(self, db: Session, q: str, limit: int, offset: int):
        def where(t):
            if not q:
                return None
            escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            terms = [t.c.question.ilike("%" + escaped + "%", escape="\\")]
            if numeric_id(q) is not None:
                terms.append(t.c.id == numeric_id(q))
            return or_(*terms)

        return self.page(
            db, "markets", MARKET_FIELDS, limit=limit, offset=offset, predicate=where
        )

    def event(self, db: Session, id: int):
        event = self.single(db, "markets", MARKET_FIELDS, id)
        orders = self.page(
            db,
            "p2p_orders",
            ORDER_FIELDS,
            limit=100,
            offset=0,
            predicate=lambda t: t.c.market_id == id,
        )
        fills = self.page(
            db,
            "p2p_fills",
            FILL_FIELDS,
            limit=100,
            offset=0,
            predicate=lambda t: t.c.market_id == id,
        )
        entries = self.ledger(db, limit=100, offset=0, market_id=id)
        settlements = self.page(
            db,
            "settlement_records",
            SETTLEMENT_FIELDS,
            limit=100,
            offset=0,
            predicate=lambda t: t.c.market_id == id,
        )
        case = None
        try:
            case = self.single(db, "guarantor_cases", CASE_FIELDS, id, key="market_id")
        except HTTPException as exc:
            if exc.status_code not in (404, 503):
                raise
        return {
            "event": event,
            "orders": orders,
            "fills": fills,
            "ledger": entries,
            "settlements": settlements,
            "guarantor": case,
            "coverage": event.get("p2p_journal_coverage"),
            "truncated": any(
                len(rows) == 100 for rows in (orders, fills, entries, settlements)
            ),
        }

    def orders(
        self,
        db: Session,
        limit: int,
        offset: int,
        market_id: int | None = None,
        user_id: int | None = None,
        order_id: int | None = None,
    ):
        def where(t):
            expressions = []
            if market_id is not None:
                expressions.append(t.c.market_id == market_id)
            if user_id is not None:
                expressions.append(t.c.user_id == user_id)
            if order_id is not None:
                expressions.append(t.c.id == order_id)
            from sqlalchemy import and_

            return and_(*expressions) if expressions else None

        return self.page(
            db, "p2p_orders", ORDER_FIELDS, limit=limit, offset=offset, predicate=where
        )

    def ledger(
        self,
        db: Session,
        limit: int,
        offset: int,
        market_id: int | None = None,
        user_id: int | None = None,
        order_id: int | None = None,
        fill_id: int | None = None,
    ):
        def where(t):
            from sqlalchemy import and_

            expressions = []
            if market_id is not None:
                expressions.append(t.c.market_id == market_id)
            if user_id is not None:
                expressions.append(
                    or_(t.c.from_user_id == user_id, t.c.to_user_id == user_id)
                )
            if order_id is not None:
                expressions.append(
                    or_(
                        t.c.order_id == order_id,
                        t.c.from_order_id == order_id,
                        t.c.to_order_id == order_id,
                    )
                )
            if fill_id is not None:
                expressions.append(t.c.fill_id == fill_id)
            return and_(*expressions) if expressions else None

        return self.page(
            db,
            "p2p_money_entries",
            LEDGER_FIELDS,
            limit=limit,
            offset=offset,
            predicate=where,
        )

    def fills(self, db, limit, offset, market_id=None, user_id=None, order_id=None):
        def where(t):
            from sqlalchemy import and_

            conditions = []
            if market_id is not None:
                conditions.append(t.c.market_id == market_id)
            if user_id is not None:
                conditions.append(
                    or_(t.c.maker_user_id == user_id, t.c.taker_user_id == user_id)
                )
            if order_id is not None:
                conditions.append(
                    or_(t.c.maker_order_id == order_id, t.c.taker_order_id == order_id)
                )
            return and_(*conditions) if conditions else None

        return self.page(
            db, "p2p_fills", FILL_FIELDS, limit=limit, offset=offset, predicate=where
        )

    def settlements(self, db, limit, offset, market_id=None, user_id=None):
        def where(t):
            from sqlalchemy import and_

            conditions = []
            if market_id is not None:
                conditions.append(t.c.market_id == market_id)
            if user_id is not None:
                conditions.append(t.c.user_id == user_id)
            return and_(*conditions) if conditions else None

        return self.page(
            db,
            "settlement_records",
            SETTLEMENT_FIELDS,
            limit=limit,
            offset=offset,
            predicate=where,
        )

    def order(self, db, id):
        return {
            "order": self.single(db, "p2p_orders", ORDER_FIELDS, id),
            "fills": self.fills(db, 50, 0, order_id=id),
            "ledger": self.ledger(db, 50, 0, order_id=id),
        }

    def fill(self, db, id):
        return {
            "fill": self.single(db, "p2p_fills", FILL_FIELDS, id),
            "ledger": self.ledger(db, 50, 0, fill_id=id),
        }

    def entry(self, db, id):
        return self.single(db, "p2p_money_entries", LEDGER_FIELDS, id)


def numeric_id(value: str) -> int | None:
    return (
        int(value)
        if value.isascii() and value.isdecimal() and int(value) <= 2**63 - 1
        else None
    )


def format_nano(amount: int) -> str:
    sign = "-" if amount < 0 else ""
    whole, frac = divmod(abs(amount), NANO)
    return sign + str(whole) + (("." + str(frac).zfill(9).rstrip("0")) if frac else "")


MARKET_FIELDS = (
    "id",
    "question",
    "description",
    "creator_id",
    "mechanism",
    "category",
    "visibility",
    "status",
    "close_at",
    "created_at",
    "resolved_at",
    "winning_outcome",
    "p2p_journal_coverage",
    "outcomes",
    "pot_nano",
    "lock_nano",
)
ORDER_FIELDS = (
    "id",
    "market_id",
    "user_id",
    "request_id",
    "outcome",
    "price",
    "amount",
    "remaining",
    "filled",
    "refunded",
    "kind",
    "status",
    "created_at",
)
FILL_FIELDS = (
    "id",
    "market_id",
    "maker_order_id",
    "taker_order_id",
    "maker_user_id",
    "taker_user_id",
    "maker_outcome",
    "maker_stake",
    "taker_stake",
    "price",
    "created_at",
)
LEDGER_FIELDS = (
    "id",
    "entry_key",
    "op_type",
    "market_id",
    "order_id",
    "fill_id",
    "from_kind",
    "from_user_id",
    "from_order_id",
    "to_kind",
    "to_user_id",
    "to_order_id",
    "amount",
    "reason",
    "created_at",
)
SETTLEMENT_FIELDS = (
    "id",
    "market_id",
    "user_id",
    "question",
    "winning_outcome",
    "stakes_total",
    "payout",
    "tip",
    "credited",
    "resolved_at",
)
CASE_FIELDS = (
    "market_id",
    "guarantor_id",
    "state",
    "revision",
    "criteria",
    "source",
    "result_due_at",
    "deadline",
    "proposed_outcome",
    "decision_reason",
)
