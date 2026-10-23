"""Standalone BetTON Admin Center. Do not mount this into app.main."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, Query, Path as ApiPath
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from admin_center.security import auth_middleware, valid_password_hash
from admin_center.store import Store, read_only_engine

STATIC = Path(__file__).parent / "static"
ObjectId = Annotated[int, ApiPath(ge=1, le=2**63 - 1)]


def create_app(
    *,
    engine: Engine | None = None,
    username: str | None = None,
    password_hash: str | None = None,
    allow_testclient: bool = False,
) -> FastAPI:
    # Explicit configuration rather than using the user-facing application's DB URL.
    username = username or os.environ.get("BETTON_ADMIN_USERNAME", "")
    password_hash = password_hash or os.environ.get("BETTON_ADMIN_PASSWORD_HASH", "")
    if not username or ":" in username or not valid_password_hash(password_hash):
        raise RuntimeError(
            "Configure BETTON_ADMIN_USERNAME and BETTON_ADMIN_PASSWORD_HASH"
        )
    if engine is None:
        if os.environ.get("BETTON_ADMIN_ENVIRONMENT") != "test":
            raise RuntimeError(
                "Set BETTON_ADMIN_ENVIRONMENT=test; only a local test database is permitted"
            )
        db_url = os.environ.get("BETTON_ADMIN_DATABASE_URL", "")
        if not db_url:
            raise RuntimeError(
                "BETTON_ADMIN_DATABASE_URL must explicitly point to a read-only database"
            )
        engine = read_only_engine(db_url)
    if not getattr(engine, "_betton_admin_readonly", False):
        raise RuntimeError(
            "Use read_only_engine; arbitrary writable engines are forbidden"
        )
    store = Store(engine)
    app = FastAPI(
        title="BetTON Admin Center", docs_url=None, redoc_url=None, openapi_url=None
    )
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "[::1]"]
        + (["testserver"] if allow_testclient else []),
    )
    app.middleware("http")(
        auth_middleware(username, password_hash, allow_testclient=allow_testclient)
    )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_request, _exc):
        # SQL exceptions may contain credentials, SQL text and personal data.
        return JSONResponse(
            {
                "detail": "База недоступна или её схема несовместима. Проверьте локальную тестовую БД."
            },
            status_code=503,
        )

    # Each request gets its own SQLAlchemy session. No commits/flush/create_all.
    def session():
        with Session(engine, autoflush=False, expire_on_commit=False) as db:
            yield db

    from fastapi import Depends

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(STATIC / "index.html", media_type="text/html")

    @app.get("/assets/style.css", include_in_schema=False)
    def css():
        return FileResponse(STATIC / "style.css", media_type="text/css")

    @app.get("/assets/app.js", include_in_schema=False)
    def js():
        return FileResponse(STATIC / "app.js", media_type="application/javascript")

    @app.get("/assets/dot.svg", include_in_schema=False)
    def dot():
        return FileResponse(STATIC / "dot.svg", media_type="image/svg+xml")

    @app.get("/api/overview")
    def overview(db: Session = Depends(session)):
        return store.overview(db)

    @app.get("/api/users")
    def users(
        q: str = Query("", max_length=64),
        limit: int = Query(30, ge=1, le=100),
        offset: int = Query(0, ge=0, le=100_000),
        db: Session = Depends(session),
    ):
        return {
            "items": store.users(db, q.strip(), limit, offset),
            "limit": limit,
            "offset": offset,
        }

    @app.get("/api/users/{user_id}")
    def user(user_id: ObjectId, db: Session = Depends(session)):
        return store.user(db, user_id)

    @app.get("/api/events")
    def events(
        q: str = Query("", max_length=64),
        limit: int = Query(30, ge=1, le=100),
        offset: int = Query(0, ge=0, le=100_000),
        db: Session = Depends(session),
    ):
        return {
            "items": store.events(db, q.strip(), limit, offset),
            "limit": limit,
            "offset": offset,
        }

    @app.get("/api/events/{event_id}")
    def event(event_id: ObjectId, db: Session = Depends(session)):
        return store.event(db, event_id)

    @app.get("/api/orders")
    def orders(
        limit: int = Query(30, ge=1, le=100),
        offset: int = Query(0, ge=0, le=100_000),
        user_id: int | None = Query(None, ge=1, le=2**63 - 1),
        market_id: int | None = Query(None, ge=1, le=2**63 - 1),
        order_id: int | None = Query(None, ge=1, le=2**63 - 1),
        db: Session = Depends(session),
    ):
        return {
            "items": store.orders(
                db,
                limit,
                offset,
                market_id=market_id,
                user_id=user_id,
                order_id=order_id,
            ),
            "limit": limit,
            "offset": offset,
        }

    @app.get("/api/orders/{order_id}")
    def order(order_id: ObjectId, db: Session = Depends(session)):
        return store.order(db, order_id)

    @app.get("/api/fills")
    def fills(
        limit: int = Query(30, ge=1, le=100),
        offset: int = Query(0, ge=0, le=100_000),
        user_id: int | None = Query(None, ge=1, le=2**63 - 1),
        market_id: int | None = Query(None, ge=1, le=2**63 - 1),
        order_id: int | None = Query(None, ge=1, le=2**63 - 1),
        db: Session = Depends(session),
    ):
        return {
            "items": store.fills(db, limit, offset, market_id, user_id, order_id),
            "limit": limit,
            "offset": offset,
        }

    @app.get("/api/fills/{fill_id}")
    def fill(fill_id: ObjectId, db: Session = Depends(session)):
        return store.fill(db, fill_id)

    @app.get("/api/settlements")
    def settlements(
        limit: int = Query(30, ge=1, le=100),
        offset: int = Query(0, ge=0, le=100_000),
        user_id: int | None = Query(None, ge=1, le=2**63 - 1),
        market_id: int | None = Query(None, ge=1, le=2**63 - 1),
        db: Session = Depends(session),
    ):
        return {
            "items": store.settlements(db, limit, offset, market_id, user_id),
            "limit": limit,
            "offset": offset,
        }

    @app.get("/api/ledger")
    def ledger(
        limit: int = Query(30, ge=1, le=100),
        offset: int = Query(0, ge=0, le=100_000),
        user_id: int | None = Query(None, ge=1, le=2**63 - 1),
        market_id: int | None = Query(None, ge=1, le=2**63 - 1),
        order_id: int | None = Query(None, ge=1, le=2**63 - 1),
        fill_id: int | None = Query(None, ge=1, le=2**63 - 1),
        db: Session = Depends(session),
    ):
        return {
            "items": store.ledger(
                db,
                limit,
                offset,
                market_id=market_id,
                user_id=user_id,
                order_id=order_id,
                fill_id=fill_id,
            ),
            "limit": limit,
            "offset": offset,
        }

    @app.get("/api/ledger/{entry_id}")
    def entry(entry_id: ObjectId, db: Session = Depends(session)):
        return store.entry(db, entry_id)

    @app.get("/api/monitoring")
    def monitoring():
        # Do NOT report green healthy states without connected metrics/monitoring.
        return {
            "connected": False,
            "technical_logs": False,
            "backup_monitoring": False,
            "onchain": False,
            "audit_trail": False,
            "note": "Отдельные источники мониторинга ещё не подключены",
        }

    return app


# Run with: uvicorn admin_center.app:create_app --factory --host 127.0.0.1 --port 8765
# Importing this module never starts a server or connects to any database.
