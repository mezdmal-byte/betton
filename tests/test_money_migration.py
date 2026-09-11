import os
import sqlite3
import uuid
from pathlib import Path

import pytest
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import DBAPIError

from app.money_migrate import fingerprint, migrate_connection, run_migration


@pytest.fixture
def old_money_db(tmp_path):
    pg = os.environ.get('BETTON_TEST_DATABASE_URL')
    admin = None
    name = 'betton_money_' + uuid.uuid4().hex
    if pg:
        parsed = make_url(pg)
        admin = create_engine(parsed.set(database='postgres'), isolation_level='AUTOCOMMIT')
        with admin.connect() as conn:
            conn.exec_driver_sql(f'CREATE DATABASE "{name}"')
        url = parsed.set(database=name)
    else:
        url = 'sqlite:///' + str(tmp_path / 'old.db')
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.exec_driver_sql('CREATE TABLE users (id INTEGER PRIMARY KEY, balance FLOAT)')
        conn.exec_driver_sql('CREATE TABLE markets (id INTEGER PRIMARY KEY, mechanism TEXT, status TEXT, pot FLOAT, lock_ton FLOAT)')
        conn.exec_driver_sql('CREATE TABLE p2p_orders (id INTEGER PRIMARY KEY, market_id INTEGER, amount BIGINT, filled BIGINT, remaining BIGINT, refunded BIGINT)')
        conn.exec_driver_sql('CREATE TABLE p2p_fills (id INTEGER PRIMARY KEY, market_id INTEGER, maker_order_id INTEGER, taker_order_id INTEGER, maker_stake BIGINT, taker_stake BIGINT)')
        conn.exec_driver_sql('INSERT INTO users VALUES (1, 900), (2, 950)')
        conn.exec_driver_sql("INSERT INTO markets VALUES (1, 'p2p', 'open', 100, 0)")
        conn.exec_driver_sql('INSERT INTO p2p_orders VALUES (1, 1, 100000000000, 50000000000, 50000000000, 0), (2, 1, 50000000000, 50000000000, 0, 0)')
        conn.exec_driver_sql('INSERT INTO p2p_fills VALUES (1, 1, 1, 2, 50000000000, 50000000000)')
    try:
        yield url, engine
    finally:
        engine.dispose()
        if admin is not None:
            with admin.connect() as conn:
                conn.exec_driver_sql(f'DROP DATABASE "{name}"')
            admin.dispose()


def test_backup_restore_migration_and_idempotency(old_money_db, tmp_path):
    url, engine = old_money_db
    with engine.connect() as conn:
        original = fingerprint(conn)
    backup = tmp_path / 'before.backup'
    report = run_migration(url, backup)
    assert backup.stat().st_size > 0
    assert report['version'] == 'integer_money_v1'
    with engine.connect() as conn:
        assert conn.execute(text('SELECT balance, balance_nano FROM users WHERE id=1')).one() == (900, 900000000000)
        assert conn.execute(text('SELECT pot_nano, lock_nano FROM markets')).one() == (100000000000, 0)
        assert conn.execute(text('SELECT COUNT(*) FROM money_conversion_entries')).scalar_one() == 4
    with engine.begin() as conn:
        conn.execute(text('UPDATE users SET balance_nano=balance_nano+1 WHERE id=1'))
        assert migrate_connection(conn)['already_applied']
        assert conn.execute(text('SELECT balance_nano FROM users WHERE id=1')).scalar_one() == 900000000001
    if engine.dialect.name == 'sqlite':
        restored = tmp_path / 'restored.db'
        with sqlite3.connect(backup) as src, sqlite3.connect(restored) as dst:
            src.backup(dst)
        restore_engine = create_engine('sqlite:///' + str(restored))
        with restore_engine.connect() as conn:
            assert fingerprint(conn) == original
        restore_engine.dispose()
    # PG run_migration already restored the full dump to a disposable database.


@pytest.mark.parametrize('sql', ['UPDATE users SET balance=901 WHERE id=1',
    'UPDATE markets SET pot=99', 'UPDATE markets SET lock_ton=1',
    'UPDATE users SET balance_nano=NULL', 'UPDATE users SET balance_nano=-1',
    'INSERT INTO users (id,balance) VALUES (3,1000)'])
def test_old_writer_and_invalid_values_blocked(old_money_db, tmp_path, sql):
    url, engine = old_money_db
    run_migration(url, tmp_path / 'backup')
    with pytest.raises(DBAPIError):
        with engine.begin() as conn:
            conn.execute(text(sql))


@pytest.mark.parametrize('sql', ['UPDATE markets SET pot=99.999999999',
    'UPDATE users SET balance=-1', 'UPDATE users SET balance=NULL',
    'UPDATE p2p_orders SET remaining=1'])
def test_invalid_source_is_unchanged(old_money_db, tmp_path, sql):
    url, engine = old_money_db
    with engine.begin() as conn:
        conn.execute(text(sql))
    with engine.connect() as conn:
        before = fingerprint(conn)
    with pytest.raises(ValueError, match='Preflight failed'):
        run_migration(url, tmp_path / 'backup')
    with engine.connect() as conn:
        assert fingerprint(conn) == before


def test_rounding_requires_explicit_policy_and_is_audited(old_money_db, tmp_path):
    url, engine = old_money_db
    with engine.begin() as conn:
        conn.execute(text('UPDATE users SET balance=:v WHERE id=1'), {'v': .1 + .2})
    with pytest.raises(ValueError, match='Rounding requires'):
        run_migration(url, tmp_path / 'backup1')
    run_migration(url, tmp_path / 'backup2', accept_rounding=True)
    with engine.connect() as conn:
        row = conn.execute(text("SELECT amount_nano,delta_ton FROM money_conversion_entries WHERE table_name='users' AND row_id=1")).one()
        assert row == (300000000, '-4E-17')


def test_failure_after_backfill_rolls_back_schema_and_money(old_money_db, tmp_path, monkeypatch):
    from app import money_migrate
    url, engine = old_money_db
    with engine.connect() as conn:
        before = fingerprint(conn)
    def fail(conn):
        raise RuntimeError('Injected failure after backfill')
    monkeypatch.setattr(money_migrate, '_protect_columns', fail)
    with pytest.raises(RuntimeError, match='Injected failure'):
        run_migration(url, tmp_path / 'backup')
    with engine.connect() as conn:
        assert fingerprint(conn) == before


def test_writes_since_backup_abort(old_money_db, tmp_path, monkeypatch):
    from contextlib import contextmanager
    from app import money_migrate
    url, engine = old_money_db
    original = money_migrate.verified_backup
    @contextmanager
    def changed(*args):
        with original(*args) as digest:
            with engine.begin() as conn:
                conn.execute(text('UPDATE users SET balance=901 WHERE id=1'))
            yield digest
    monkeypatch.setattr(money_migrate, 'verified_backup', changed)
    with pytest.raises(ValueError, match='changed since backup'):
        run_migration(url, tmp_path / 'backup')
    assert 'money_migrations' not in inspect(engine).get_table_names()


def test_migration_startup_guard(old_money_db, monkeypatch):
    from app import database
    _, engine = old_money_db
    with engine.begin() as conn:
        conn.exec_driver_sql('ALTER TABLE users ADD COLUMN balance_nano BIGINT')
        conn.exec_driver_sql('ALTER TABLE markets ADD COLUMN pot_nano BIGINT')
        conn.exec_driver_sql('ALTER TABLE markets ADD COLUMN lock_nano BIGINT')
    monkeypatch.setattr(database, 'engine', engine)
    with pytest.raises(RuntimeError, match='migration required'):
        database.assert_money_ready()


def test_full_legacy_schema_migrates_and_runs_lmsr(old_money_db, tmp_path, monkeypatch):
    """Exercise the real ORM/startup adapters after converting a populated old schema."""
    from datetime import datetime, timedelta
    from sqlalchemy.schema import CreateTable
    from sqlalchemy.orm import Session
    from app import database
    from app.config import settings
    from app.models import Market, User
    from app.services import market_service as service
    url, engine = old_money_db
    with engine.begin() as conn:
        for table in ('p2p_fills', 'p2p_orders', 'markets', 'users'):
            conn.exec_driver_sql(f'DROP TABLE {table}')
        for table in database.Base.metadata.sorted_tables:
            ddl = str(CreateTable(table).compile(engine))
            if table.name in ('users', 'markets'):
                ddl = '\n'.join(line for line in ddl.splitlines() if '_nano' not in line)
            conn.exec_driver_sql(ddl)
        conn.execute(User.__table__.insert(), [dict(id=1, telegram_id=101, username='creator', balance=950),
                                               dict(id=2, telegram_id=102, username='admin', balance=1000000)])
        conn.execute(Market.__table__.insert(), dict(id=1, question='Old market', creator_id=1,
            mechanism='lmsr', status='pending', b=50/0.6931471805599453,
            outcomes=['Да', 'Нет'], q=[0, 0], pot=50, lock_ton=50,
            close_at=datetime.now()+timedelta(days=1)))
    run_migration(url, tmp_path / 'full-backup')
    monkeypatch.setattr(database, 'engine', engine)
    monkeypatch.setattr(settings, 'admin_telegram_id', 102)
    database.ensure_schema()
    database.assert_money_ready()
    with Session(engine, autoflush=False) as db:
        def total():
            return sum(u.balance_nano for u in db.query(User)) + sum(m.pot_nano for m in db.query(Market))
        before = total()
        service.moderate_market(db, 1, 2)
        service.buy_shares(db, 1, 1, 0, 10.000000001)
        service.close_market(db, 1, 2)
        service.resolve_market(db, 1, 0, 2)
        assert total() == before
        assert db.get(Market, 1).pot_nano == 0
        assert db.execute(text('SELECT pot FROM markets WHERE id=1')).scalar_one() == 50
