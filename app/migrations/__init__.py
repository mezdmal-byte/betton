"""Explicit, serialized schema upgrades; HTTP startup only checks the revision."""
from sqlalchemy import inspect, text

CURRENT_REVISION = 3
LOCK_ID = 682031024


def revision(conn):
    if 'betton_schema_version' not in inspect(conn).get_table_names():
        return 0
    return conn.execute(text('SELECT revision FROM betton_schema_version WHERE id=1')).scalar_one_or_none() or 0


def assert_schema_ready(target_engine=None):
    if target_engine is None:
        from app.database import engine
        target_engine = engine
    with target_engine.connect() as conn:
        if revision(conn) != CURRENT_REVISION:
            raise RuntimeError('Schema upgrade required: back up the database and run python -m app.migrations upgrade before starting replicas')


def upgrade(target_engine=None):
    if target_engine is None:
        from app.database import engine
        target_engine = engine
    from app.database import assert_sqlite_foreign_keys
    assert_sqlite_foreign_keys(target_engine)
    with target_engine.connect() as conn:
        try:
            if conn.dialect.name == 'sqlite':
                conn.exec_driver_sql('BEGIN IMMEDIATE')
            elif conn.dialect.name == 'postgresql':
                conn.exec_driver_sql("SET LOCAL lock_timeout='10s'")
                conn.exec_driver_sql("SET LOCAL statement_timeout='30s'")
                conn.execute(text('SELECT pg_advisory_xact_lock(:key)'), {'key': LOCK_ID})
            else:
                raise RuntimeError('Unsupported database dialect')
            current = revision(conn)
            if current > CURRENT_REVISION:
                raise RuntimeError('Database schema is newer than this application')
            if current == CURRENT_REVISION:
                conn.rollback()
                return
            conn.exec_driver_sql('CREATE TABLE IF NOT EXISTS betton_schema_version (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL)')
            if current < 1:
                from .baseline import upgrade as baseline_upgrade
                baseline_upgrade(conn)
            if current < 2 and conn.dialect.name == 'postgresql':
                conn.exec_driver_sql('ALTER TABLE users ALTER COLUMN telegram_id TYPE BIGINT USING telegram_id::bigint')
            if current < 3:
                from .event_intents import upgrade as event_intents_upgrade
                event_intents_upgrade(conn)
            conn.execute(text('DELETE FROM betton_schema_version WHERE id=1'))
            conn.execute(text('INSERT INTO betton_schema_version (id, revision) VALUES (1, :revision)'), {'revision': CURRENT_REVISION})
            conn.commit()
        except Exception:
            conn.rollback()
            raise
