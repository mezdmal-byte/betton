"""Access-controlled, non-production BetTON UX v3 demonstration on Render.

Uses ONLY an isolated SQLite database, synthetic Telegram identities and
a synthetic bot token. The production Telegram webhook is never started.
"""
from __future__ import annotations

import asyncio
import hmac
import os
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import quote, urlsplit

from fastapi import Request
from fastapi.responses import JSONResponse, RedirectResponse

from scripts import ux_v3_preview as local

ACCESS_TOKEN = os.environ.get("BETTON_DEMO_ACCESS_TOKEN", "")
if len(ACCESS_TOKEN) < 32:
    raise RuntimeError("Set a random BETTON_DEMO_ACCESS_TOKEN of 32+ characters")

# The existing LOCAL sandbox is intentionally loopback-only. Use its real
# backend/seed/Telegram simulator, but replace loopback-only network middleware
# with cookie-gated access on a separate public demo service.
local.DATABASE_NAME = "betton-demo-render.sqlite"
_orig_configure = local.configure_process


def _configure_demo(state_dir: Path) -> None:
    _orig_configure(state_dir)
    os.environ["BETTON_ENVIRONMENT"] = "demo"
    os.environ["BETTON_DEMO_AUTOMATION"] = "true"
    os.environ["BETTON_PREVIEW_SEED"] = "false"


local.configure_process = _configure_demo
app = local.create_preview(local.SANDBOX_ROOT / "render-demo")
app.user_middleware.clear()
app.middleware_stack = None
_orig_lifespan = app.router.lifespan_context


@asynccontextmanager
async def _demo_lifespan(application):
    from app.database import SessionLocal, ensure_schema
    from app.models import DemoEnvironment, Market, User
    from app.services import demo_guarantors
    from app.main import demo_guarantors_task

    ensure_schema()
    with SessionLocal() as db:
        if db.get(DemoEnvironment, 1) is None:
            if db.query(User.id).first() or db.query(Market.id).first():
                raise RuntimeError("Refusing unmarked database with existing users/markets")
            demo_guarantors.initialize_empty_database(db)

    async with _orig_lifespan(application):
        with SessionLocal() as db:
            moderator = db.query(User).filter_by(
                telegram_id=local.ACTORS["moderator"]["id"]
            ).one()
            demo_guarantors.install(db, moderator)
        worker = asyncio.create_task(demo_guarantors_task())
        try:
            yield
        finally:
            worker.cancel()
            await asyncio.gather(worker, return_exceptions=True)


app.router.lifespan_context = _demo_lifespan


@app.middleware("http")
async def _guard_demo(request: Request, call_next):
    path = request.url.path
    if path == "/demo-health":
        return JSONResponse({"status": "ok", "environment": "isolated-demo"})

    if path == "/demo-enter":
        supplied = request.query_params.get("key", "")
        if not hmac.compare_digest(supplied, ACCESS_TOKEN):
            return JSONResponse({"detail": "Not found"}, status_code=404)
        actor = request.query_params.get("actor", "creator")
        if actor not in local.ACTORS:
            actor = "creator"
        response = RedirectResponse("/sandbox/?actor=" + quote(actor), status_code=303)
        response.set_cookie("__Host-betton-demo", ACCESS_TOKEN,
            secure=True, httponly=True, samesite="lax", path="/", max_age=86400)
        response.headers["Cache-Control"] = "no-store"
        response.headers["Referrer-Policy"] = "no-referrer"
        return response

    if not hmac.compare_digest(request.cookies.get("__Host-betton-demo", ""), ACCESS_TOKEN):
        return JSONResponse({"detail": "Demo access required"}, status_code=403)

    if path == "/webhook" or path.startswith("/static/"):
        return JSONResponse({"detail": "Disabled in demo"}, status_code=404)
    if path == "/":
        return RedirectResponse("/sandbox/?actor=creator", status_code=307)

    origin = request.headers.get("origin")
    if origin and urlsplit(origin).netloc != request.headers.get("host"):
        return JSONResponse({"detail": "Cross-origin blocked"}, status_code=403)
    if request.headers.get("sec-fetch-site") == "cross-site":
        return JSONResponse({"detail": "Cross-site blocked"}, status_code=403)

    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; connect-src 'self'; img-src 'self' data:; "
        "script-src 'self'; style-src 'self' 'unsafe-inline'; "
        "font-src 'self' data:; object-src 'none'; "
        "frame-ancestors 'none'; base-uri 'self'"
    )
    return response
