from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def _engine_kwargs(url: str) -> dict:
    kwargs: dict = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    return kwargs


engine = create_engine(settings.database_url, **_engine_kwargs(settings.database_url))
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_schema() -> None:
    """create_all + колонка category на уже существующих SQLite/Postgres таблицах."""
    from app import models as _models  # noqa: F401 — регистрация таблиц на Base.metadata

    Base.metadata.create_all(bind=engine)
    insp = inspect(engine)
    if "markets" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("markets")}
    if "category" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE markets ADD COLUMN category VARCHAR(32) DEFAULT 'unique'"))
    with engine.begin() as conn:
        conn.execute(text("UPDATE markets SET category = 'unique' WHERE category IS NULL"))
