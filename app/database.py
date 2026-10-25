import json
import math
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine, inspect, text, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def _engine_kwargs(url: str) -> dict:
    kwargs: dict = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False, "timeout": 30}
    return kwargs


def enforce_sqlite_foreign_keys(target_engine) -> None:
    """Enable SQLite FK enforcement on every new connection, before transactions."""
    if target_engine.dialect.name != "sqlite":
        return

    @event.listens_for(target_engine, "connect")
    def _enable_foreign_keys(connection, _record):
        cursor = connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            if cursor.execute("PRAGMA foreign_keys").fetchone()[0] != 1:
                raise RuntimeError("SQLite foreign key enforcement could not be enabled")
        finally:
            cursor.close()


def assert_sqlite_foreign_keys(target_engine=None) -> None:
    target_engine = target_engine if target_engine is not None else engine
    if target_engine.dialect.name != "sqlite":
        return
    with target_engine.connect() as conn:
        # Do not repair/delete historical orphan rows automatically.
        if conn.exec_driver_sql("PRAGMA foreign_key_check").first() is not None:
            raise RuntimeError("SQLite foreign key violations: audit an isolated backup before migration")


engine = create_engine(settings.database_url, **_engine_kwargs(settings.database_url))
enforce_sqlite_foreign_keys(engine)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """Explicit maintenance compatibility entry point; never called by app startup."""
    from app.migrations import upgrade
    upgrade(engine)


def assert_money_ready():
    with engine.connect() as conn:
        for table, condition in [('users', 'balance_nano IS NULL'),
                                 ('markets', 'pot_nano IS NULL OR lock_nano IS NULL')]:
            if conn.execute(text(f'SELECT COUNT(*) FROM {table} WHERE {condition}')).scalar_one():
                raise RuntimeError('Integer money migration required; stop writes and run app.money_migrate on a backed-up database')
