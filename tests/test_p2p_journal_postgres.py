"""PostgreSQL integration for the P2P money journal. Skipped unless BETTON_TEST_DATABASE_URL is set."""
import os
import uuid
from threading import Barrier, local
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.engine import make_url

from app.database import SessionLocal, ensure_schema
from app.models import P2PMoneyEntry, P2POrder, User
from app.services import p2p_ledger as ledger
from tests.test_p2p import balance, ready, submit, total

pytestmark = pytest.mark.skipif(
    not os.environ.get("BETTON_TEST_DATABASE_URL", "").startswith("postgresql"),
    reason="PostgreSQL journal tests require BETTON_TEST_DATABASE_URL",
)

_PG_URL = os.environ.get("BETTON_TEST_DATABASE_URL", "").strip()


def _engine():
    from app.database import engine

    assert engine.dialect.name == "postgresql", engine.dialect.name
    return engine


def test_pg_reports_server_version(client):
    with _engine().connect() as conn:
        version = conn.execute(text("SHOW server_version")).scalar()
    assert version
    print(f"PostgreSQL server_version={version}")


def test_pg_ensure_schema_creates_journal_unique_and_is_idempotent(client):
    engine = _engine()
    ensure_schema()
    ensure_schema()
    insp = inspect(engine)
    assert "p2p_money_entries" in insp.get_table_names()
    names = {c["name"] for c in insp.get_columns("p2p_money_entries")}
    assert {"entry_key", "amount", "op_type", "market_id"} <= names
    unique = {item["name"] for item in insp.get_unique_constraints("p2p_money_entries")}
    assert "uq_p2p_money_entry_key" in unique
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT conname, contype FROM pg_constraint "
                "WHERE conrelid = 'p2p_money_entries'::regclass"
            )
        ).all()
    by_type = {kind: name for name, kind in rows}
    assert by_type.get("u") == "uq_p2p_money_entry_key"
    assert "p" in by_type
    indexes = inspect(engine).get_indexes("p2p_money_entries")
    assert any("market_id" in (item.get("column_names") or []) for item in indexes)


def test_pg_old_p2p_market_marked_incomplete(monkeypatch):
    from app import database

    # Only create/drop a database owned by this test run, never a fixed name.
    name = "betton_journal_migrate_" + uuid.uuid4().hex
    admin_url = make_url(_PG_URL).set(database="postgres")
    migrate_url = make_url(_PG_URL).set(database=name)
    admin = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'CREATE DATABASE "{name}"'))
    admin.dispose()
    old = create_engine(migrate_url)
    with old.begin() as conn:
        conn.execute(
            text(
                "CREATE TABLE users ("
                "id INTEGER PRIMARY KEY, telegram_id INTEGER, username VARCHAR(64), "
                "balance DOUBLE PRECISION, created_at TIMESTAMP)"
            )
        )
        conn.execute(
            text(
                "CREATE TABLE markets ("
                "id INTEGER PRIMARY KEY, question VARCHAR(512), description TEXT, "
                "creator_id INTEGER, category VARCHAR(32), b DOUBLE PRECISION, "
                "q_yes DOUBLE PRECISION, q_no DOUBLE PRECISION, outcomes TEXT, q TEXT, "
                "lock_ton DOUBLE PRECISION, pot DOUBLE PRECISION, close_at TIMESTAMP, "
                "lock_returned BOOLEAN, status VARCHAR(16), winning_outcome VARCHAR(128), "
                "created_at TIMESTAMP, resolved_at TIMESTAMP, settlement_kind VARCHAR(16), "
                "mechanism VARCHAR(16) DEFAULT 'p2p')"
            )
        )
        conn.execute(text("INSERT INTO users VALUES (1, 1, 'existing', 1000, '2026-01-01')"))
        conn.execute(
            text(
                "INSERT INTO markets VALUES ("
                "1, 'Old P2P?', '', 1, 'unique', 1, 0, 0, '[\"A\",\"B\"]', '[0,0]', "
                "0, 10, '2030-01-01', TRUE, 'open', NULL, '2026-01-01', NULL, NULL, 'p2p')"
            )
        )
    monkeypatch.setattr(database, "engine", old)
    try:
        database.ensure_schema()
        with old.connect() as conn:
            coverage = conn.execute(text("SELECT p2p_journal_coverage FROM markets")).scalar_one()
            assert coverage == "incomplete"
            pot, lock_ton = conn.execute(text("SELECT pot, lock_ton FROM markets")).one()
            assert float(pot) == 10 and float(lock_ton) == 0
            assert conn.execute(text("SELECT count(*) FROM p2p_money_entries")).scalar_one() == 0
            assert (
                conn.execute(
                    text(
                        "SELECT 1 FROM pg_constraint "
                        "WHERE conname = 'uq_p2p_money_entry_key' "
                        "AND conrelid = 'p2p_money_entries'::regclass"
                    )
                ).scalar()
                == 1
            )
    finally:
        old.dispose()
        admin = create_engine(admin_url, isolation_level="AUTOCOMMIT")
        with admin.connect() as conn:
            conn.execute(text(f'DROP DATABASE "{name}"'))
        admin.dispose()


def test_pg_unique_entry_key_enforced(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    with SessionLocal() as db:
        row = db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type="reserve").one()
        key = row.entry_key
    with _engine().connect() as conn:
        with pytest.raises(IntegrityError):
            with conn.begin():
                conn.execute(
                    text(
                        "INSERT INTO p2p_money_entries "
                        "(entry_key, op_type, market_id, from_kind, to_kind, amount) "
                        "VALUES (:key, 'reserve', :mid, 'user_balance', 'order_reserve', 1)"
                    ),
                    dict(key=key, mid=mid),
                )
    with SessionLocal() as db:
        assert db.query(P2PMoneyEntry).filter_by(entry_key=key).count() == 1


def test_pg_repeat_record_same_identity_one_row(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    with SessionLocal() as db:
        row = db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type="reserve").one()
        again = ledger.record(
            db,
            entry_key=row.entry_key,
            op_type=row.op_type,
            market_id=row.market_id,
            amount=int(row.amount),
            from_kind=row.from_kind,
            to_kind=row.to_kind,
            from_user_id=row.from_user_id,
            to_user_id=row.to_user_id,
            to_order_id=row.to_order_id,
            order_id=row.order_id,
            origin_key=row.origin_key,
            reason=row.reason,
        )
        assert again.id == row.id
        db.commit()
        assert db.query(P2PMoneyEntry).filter_by(entry_key=row.entry_key).count() == 1


def test_pg_same_key_different_content_is_http_409(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    with SessionLocal() as db:
        row = db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type="reserve").one()
        with pytest.raises(HTTPException) as err:
            ledger.record(
                db,
                entry_key=row.entry_key,
                op_type=row.op_type,
                market_id=row.market_id,
                amount=int(row.amount),
                from_kind=row.from_kind,
                to_kind=row.to_kind,
                from_user_id=b["id"],
                to_user_id=b["id"],
                to_order_id=row.to_order_id,
                order_id=row.order_id,
                origin_key=row.origin_key,
                reason=row.reason,
            )
        assert err.value.status_code == 409
        db.rollback()
        same = db.query(P2PMoneyEntry).filter_by(entry_key=row.entry_key).one()
        assert same.to_user_id == a["id"]


def _record_outcome(entry_key, mid, amount, uid):
    db = SessionLocal()
    try:
        ledger.record(
            db,
            entry_key=entry_key,
            op_type=ledger.OP_RESERVE,
            market_id=mid,
            amount=amount,
            from_kind=ledger.KIND_BALANCE,
            to_kind=ledger.KIND_RESERVE,
            from_user_id=uid,
            to_user_id=uid,
        )
        db.commit()
        return "committed"
    except HTTPException as err:
        db.rollback()
        return f"http-{err.status_code}"
    except IntegrityError as err:
        db.rollback()
        orig = getattr(err, "orig", err)
        return f"integrity:{type(orig).__name__}:{getattr(orig, 'pgcode', None)}"
    except Exception as err:
        db.rollback()
        return f"other:{type(err).__name__}:{str(err)[:160]}"
    finally:
        db.close()


@pytest.mark.parametrize("same_identity", [False, True])
def test_pg_concurrent_same_key_is_controlled(client, monkeypatch, same_identity):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    key = "reserve:pg-race:" + str(mid)
    barrier = Barrier(2)
    seen = local()

    def pause_initial_read(conn, cursor, statement, parameters, context, executemany):
        if not statement.lstrip().upper().startswith("SELECT") or "p2p_money_entries" not in statement:
            return
        values = parameters.values() if isinstance(parameters, dict) else parameters
        if key not in values or getattr(seen, "paused", False):
            return
        seen.paused = True
        # Both initial reads must finish before either INSERT is allowed.
        barrier.wait(timeout=10)

    engine = _engine()
    event.listen(engine, "after_cursor_execute", pause_initial_read)
    try:
        with ThreadPoolExecutor(max_workers=2) as pool:
            first = pool.submit(_record_outcome, key, mid, 10 * 1_000_000_000, a["id"])
            second = pool.submit(_record_outcome, key, mid,
                                 (10 if same_identity else 20) * 1_000_000_000,
                                 a["id"] if same_identity else b["id"])
            observed = sorted([first.result(timeout=30), second.result(timeout=30)])
    finally:
        event.remove(engine, "after_cursor_execute", pause_initial_read)
    expected = ["committed", "committed"] if same_identity else ["committed", "http-409"]
    assert observed == expected
    with SessionLocal() as db:
        assert db.query(P2PMoneyEntry).filter_by(entry_key=key).count() == 1


def test_pg_place_integrityerror_rolls_back_and_is_409(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    before = balance(client, a, ha)

    def boom(*args, **kwargs):
        raise IntegrityError("INSERT", {}, Exception("journal unique"))

    monkeypatch.setattr(ledger, "record", boom)
    result = submit(client, mid, ha, 0, 100, 2)
    assert result.status_code == 409, result.text
    assert balance(client, a, ha) == pytest.approx(before)
    with SessionLocal() as db:
        assert db.query(P2POrder).filter_by(market_id=mid).count() == 0
        assert db.query(P2PMoneyEntry).filter_by(market_id=mid).count() == 0


def test_pg_journal_write_failure_rolls_back_place(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    before = balance(client, a, ha)
    conserved = total()
    user_id = a["id"]

    def fail(*args, **kwargs):
        raise RuntimeError("journal down")

    monkeypatch.setattr(ledger, "record", fail)
    with pytest.raises(RuntimeError):
        submit(client, mid, ha, 0, 100, 2)
    assert balance(client, a, ha) == pytest.approx(before)
    assert total() == pytest.approx(conserved, abs=1e-7)
    with SessionLocal() as db:
        assert db.query(P2POrder).filter_by(market_id=mid).count() == 0
        assert db.query(P2PMoneyEntry).filter_by(market_id=mid).count() == 0
        assert db.get(User, user_id).balance == pytest.approx(before)


def test_pg_successful_place_commits_reserve(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    before = balance(client, a, ha)
    placed = submit(client, mid, ha, 0, 100, 2)
    assert placed.status_code == 200, placed.text
    assert balance(client, a, ha) == pytest.approx(before - 100)
    oid = placed.json()["id"]
    with SessionLocal() as db:
        order = db.get(P2POrder, oid)
        assert order is not None
        assert int(order.amount) == 100 * 1_000_000_000
        row = db.query(P2PMoneyEntry).filter_by(entry_key=ledger.key_reserve(oid)).one()
        assert row.op_type == "reserve"
        assert row.from_user_id == a["id"] == row.to_user_id
        assert int(row.amount) == 100 * 1_000_000_000
        assert row.from_kind == "user_balance"
        assert row.to_kind == "order_reserve"
    body = client.get(f"/markets/{mid}/p2p-reconciliation", headers=ah).json()
    assert body["fully_verified"] is True
    assert body["discrepancies"] == []
