"""Loopback-only BetTON integration sandbox. Never imports the production .env.

Run from the repository: python scripts/ux_v3_preview.py
All seeded records are confined to a marked .ux-preview/ database. This is a
browser Telegram-host simulator, not verification inside the actual Telegram app.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import hmac
import ipaddress
import json
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
SANDBOX_ROOT = ROOT / ".ux-preview"
LOCAL_TOKEN = "999999999:BetTON_local_only_not_a_real_bot_token"
MARKER_KIND = "betton-ux-v3-isolated-sandbox-v1"
DATABASE_NAME = "betton-test.sqlite"
ACTORS = {
    "creator": {
        "id": 991000001,
        "first_name": "Создатель · тест",
        "username": "sandbox_creator",
    },
    "guarantor": {
        "id": 991000002,
        "first_name": "Гарант · тест",
        "username": "sandbox_guarantor",
    },
    "moderator": {
        "id": 991000003,
        "first_name": "Модератор · тест",
        "username": "sandbox_moderator",
    },
    "participant": {
        "id": 991000004,
        "first_name": "Участник · тест",
        "username": "sandbox_participant",
    },
}


def signed_init_data(actor: str, *, now: int | None = None) -> str:
    user = {**ACTORS[actor], "language_code": "ru"}
    values = {
        "auth_date": str(int(time.time()) if now is None else now),
        "query_id": f"local-sandbox-{actor}",
        "user": json.dumps(user, ensure_ascii=False, separators=(",", ":")),
    }
    secret = hmac.new(b"WebAppData", LOCAL_TOKEN.encode(), hashlib.sha256).digest()
    check = "\n".join(f"{key}={value}" for key, value in sorted(values.items()))
    values["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(values)


def prepare_state(state_dir: Path, database_name: str = DATABASE_NAME) -> tuple[Path, dict]:
    """Refuse arbitrary databases, symlink escapes and unmarked existing files."""
    state_dir = state_dir.absolute()
    if not state_dir.resolve().is_relative_to(SANDBOX_ROOT.resolve()):
        raise RuntimeError(
            "State directory must be inside this checkout's .ux-preview/"
        )
    if state_dir.is_symlink():
        raise RuntimeError("Sandbox directory may not be a symlink")
    state_dir.mkdir(parents=True, exist_ok=True)
    database = state_dir / database_name
    marker = state_dir / "ux-v3-sandbox.json"
    if any(path.is_symlink() for path in (database, marker)):
        raise RuntimeError("Sandbox database and marker may not be symlinks")
    if (state_dir / ".env").exists():
        raise RuntimeError(
            "Remove the .env from the sandbox directory; it must never load external settings"
        )
    if database.exists() and not marker.is_file():
        raise RuntimeError(
            "Refusing existing unmarked database; choose a new .ux-preview/ subdirectory"
        )
    if marker.exists():
        try:
            data = json.loads(marker.read_text(encoding="utf-8"))
        except (ValueError, OSError) as exc:
            raise RuntimeError("Invalid sandbox marker") from exc
        if data.get("kind") != MARKER_KIND or data.get("database") != database_name:
            raise RuntimeError("Unrecognized sandbox marker")
        if data.get("seeded") and not database.is_file():
            raise RuntimeError(
                "Sandbox database is missing; choose a fresh sandbox directory"
            )
    else:
        data = {"kind": MARKER_KIND, "database": database_name, "seeded": False}
        with marker.open("x", encoding="utf-8") as stream:
            json.dump(data, stream)
    return state_dir, data


def configure_process(state_dir: Path, *, full_demo: bool = False, database_name: str = DATABASE_NAME) -> None:
    if "app.config" in sys.modules or "app.database" in sys.modules:
        raise RuntimeError(
            "Run the sandbox in a separate process before importing app modules"
        )
    # Explicitly override every application setting, including secrets/proxies.
    # Changing cwd prevents Settings(env_file='.env') from discovering repo .env.
    overrides = {
        "DATABASE_URL": "sqlite:///" + (state_dir / database_name).as_posix(),
        "BOT_TOKEN": LOCAL_TOKEN,
        "TELEGRAM_BOT_USERNAME": "",
        "MINI_APP_URL": "http://127.0.0.1:8877",
        "PUBLIC_BASE_URL": "http://127.0.0.1:8877",
        "RENDER_EXTERNAL_URL": "",
        "TIP_CAP": "0.01",
        "STARTING_BALANCE": "1000",
        "ADMIN_TELEGRAM_ID": str(ACTORS["moderator"]["id"]),
        "ADMIN_TELEGRAM_USERNAMES": "",
        "BETTON_PREVIEW_SEED": "false",
        "TELEGRAM_AUTH_PROXY_URL": "",
        "TELEGRAM_WEBHOOK_PROXY_URL": "",
        "PREVIEW_ROOT_TO_V2": "false",
        "PANDASCORE_TOKEN": "",
        "ADMIN_TELEGRAM_IDS": "",
        "ADMIN_TELEGRAM_REVOKED_IDS": "",
        "TELEGRAM_WEBHOOK_SECRET": "sandbox_only_synthetic_secret_not_a_real_webhook_123",
        "TELEGRAM_WEBHOOK_PREVIOUS_SECRET": "",
        "TELEGRAM_WEBHOOK_PROXY_SECRET": "",
        "BETTON_ENVIRONMENT": "test",
        "BETTON_DEMO_AUTOMATION": "true" if full_demo else "false",
        "ALLOW_UNKEYED_LEGACY_BUY": "false",
    }
    # Windows environment names are case-insensitive; Linux may contain both.
    for key in list(os.environ):
        if key.upper() in overrides:
            del os.environ[key]
    os.environ.update(overrides)
    sys.path.insert(0, str(ROOT))
    os.chdir(state_dir)


async def seed_via_api(application) -> dict:
    """Create fixtures through the actual authenticated application contracts."""
    import httpx

    users = {}
    headers = {
        actor: {"Authorization": "tma " + signed_init_data(actor)} for actor in ACTORS
    }
    transport = httpx.ASGITransport(app=application, client=("127.0.0.1", 12345))
    async with httpx.AsyncClient(
        transport=transport, base_url="http://127.0.0.1:8877"
    ) as client:

        async def request(method, path, actor="creator", **kwargs):
            response = await client.request(
                method, path, headers=headers[actor], **kwargs
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"Sandbox seed failed at {path}: {response.status_code} {response.text}"
                )
            return response.json()

        for actor in ACTORS:
            users[actor] = await request("POST", "/auth/telegram", actor)
        await request(
            "PUT",
            "/guarantors/me",
            "guarantor",
            json={
                "bio": "Тестовый профиль в изолированной локальной базе",
                "topics": "Тестовые события",
                "accept_rules": True,
            },
        )
        await request(
            "POST",
            f"/guarantors/{users['guarantor']['id']}/approval",
            "moderator",
            json={"approved": True},
        )
        await request(
            "POST", "/guarantors/me/availability", "guarantor", json={"available": True}
        )
        close = datetime.now(UTC) + timedelta(days=7)
        base = {
            "request_id": str(uuid.uuid4()),
            "event_type": "public",
            "question": "Тест: кто победит в финальном матче?",
            "outcomes": ["Альфа", "Бета"],
            "category": "sport",
            "description": "Локальные тестовые данные; не реальное событие платформы.",
            "rules": "Победитель по итоговому протоколу. При отмене матча — возврат ставок.",
            "criteria": ["Победила команда Альфа", "Победила команда Бета"],
            "resolution_method": "Сравнить итоговый протокол с условиями события",
            "unverifiable": "Если результат установить невозможно, событие отменяется с возвратом ставок",
            "primary_source": {
                "name": "Тестовый источник",
                "url": "https://example.com/test-result",
            },
            "close_at": close.isoformat(),
            "ends_at": (close + timedelta(hours=2)).isoformat(),
        }
        event = await request("POST", "/ux-v3/events", json=base)
        await request("POST", f"/markets/{event['id']}/approve", "moderator")
        # Real funded proposals and one partial fill, not fabricated API responses.
        for actor, outcome, amount in (
            ("creator", 0, 100),
            ("participant", 1, 40),
            ("moderator", 0, 50),
        ):
            await request(
                "POST",
                f"/markets/{event['id']}/orders",
                actor,
                json={
                    "outcome": outcome,
                    "money": amount,
                    "odds": 2,
                    "kind": "limit",
                    "request_id": str(uuid.uuid4()),
                },
            )
        pending = await request(
            "POST",
            "/ux-v3/events",
            json={**base, "request_id": str(uuid.uuid4()), "question": "Тест: заявка для проверки модератором"},
        )
    return {
        "users": {actor: row["id"] for actor, row in users.items()},
        "public_event_id": event["id"],
        "pending_event_id": pending["id"],
    }


def create_preview(state_dir: Path | None = None, *, full_demo: bool = False):
    database_name = 'betton-test-simulation.sqlite' if full_demo else DATABASE_NAME
    state_dir, marker_data = prepare_state(state_dir or SANDBOX_ROOT, database_name)
    configure_process(state_dir, full_demo=full_demo, database_name=database_name)
    if marker_data.get('seeded') and bool(marker_data.get('full_demo')) != full_demo:
        raise RuntimeError('Choose a fresh state directory for the requested demo mode; existing data was not changed')
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response

    from app.database import SessionLocal, assert_money_ready, ensure_schema
    from app.main import app as backend
    from app.main import expire_orders_task
    from app.models import User

    @asynccontextmanager
    async def lifespan(_application):
        ensure_schema()
        assert_money_ready()
        if not marker_data.get("seeded"):
            with SessionLocal() as db:
                if db.query(User).count():
                    raise RuntimeError(
                        "Incomplete sandbox seed; choose a fresh .ux-preview/ subdirectory, not an existing database"
                    )
            if full_demo:
                from app.services.demo_guarantors import initialize_empty_database
                with SessionLocal() as db:
                    initialize_empty_database(db)
            result = await seed_via_api(backend)
            if full_demo:
                from scripts.seed_demo_markets import seed_scenarios
                result.update(await seed_scenarios(backend, result))
            marker_data.update(result, seeded=True, full_demo=full_demo)
            (state_dir / "ux-v3-sandbox.json").write_text(
                json.dumps(marker_data, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        # Run only the local deadline worker, never the production lifecycle.
        expiry = asyncio.create_task(expire_orders_task())
        from app.main import demo_guarantors_task
        automation = asyncio.create_task(demo_guarantors_task()) if full_demo else None
        try:
            yield
        finally:
            expiry.cancel()
            if automation:
                automation.cancel()
            await asyncio.gather(expiry, *([automation] if automation else []), return_exceptions=True)

    application = FastAPI(title="BetTON local isolated UX sandbox", lifespan=lifespan)

    @application.middleware("http")
    async def loopback_only(request: Request, call_next):
        try:
            peer_ok = bool(
                request.client and ipaddress.ip_address(request.client.host).is_loopback
            )
        except ValueError:
            peer_ok = False
        host_ok = request.url.hostname in {"127.0.0.1", "localhost", "::1"}
        origin = request.headers.get("origin")
        allowed_origin = (
            origin is None
            or origin == f"{request.url.scheme}://{request.headers.get('host')}"
        )
        if (
            not peer_ok
            or not host_ok
            or not allowed_origin
            or request.headers.get("sec-fetch-site") == "cross-site"
        ):
            return JSONResponse(
                {"detail": "Local sandbox access only"}, status_code=403
            )
        if request.url.path in {"/webhook", "/static/miniapp.html", "/"}:
            return (
                RedirectResponse("/sandbox/")
                if request.method == "GET"
                else Response(status_code=404)
            )
        response = await call_next(request)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        # Even a stale build with an external VITE_API_BASE_URL cannot send
        # requests to a production API or load the real Telegram host script.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; connect-src 'self'; img-src 'self' data:; "
            "script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "font-src 'self' data:; object-src 'none'; frame-ancestors 'none'"
        )
        return response

    def actor_or_404(actor):
        if actor not in ACTORS:
            raise HTTPException(404, "Unknown local test actor")
        return actor

    @application.get('/sandbox/scenarios')
    def scenario_map():
        if not full_demo:
            raise HTTPException(404, 'Start a full demo to use the scenario map')
        return HTMLResponse((ROOT / 'scripts' / 'sandbox_scenarios.html').read_text(encoding='utf-8'))

    @application.get('/sandbox/scenarios.js')
    def scenario_map_script():
        if not full_demo:
            raise HTTPException(404, 'Full demo only')
        return Response((ROOT / 'scripts' / 'sandbox_scenarios.js').read_text(encoding='utf-8'), media_type='text/javascript')

    @application.get("/sandbox/session")
    def sandbox_session(actor: str = "creator"):
        actor_or_404(actor)
        return {
            "actor": actor,
            "init_data": signed_init_data(actor),
            "telegram_user": ACTORS[actor],
            "sandbox": marker_data,
        }

    @application.get("/sandbox/host.js")
    def sandbox_host(actor: str = "creator"):
        actor_or_404(actor)
        data = json.dumps(
            {
                "initData": signed_init_data(actor),
                "initDataUnsafe": {"user": ACTORS[actor]},
            },
            ensure_ascii=True,
        )
        script = """(() => {
          const data = __DATA__; const callbacks = new Set(); const events = new Map();
          const back = document.createElement('button'); back.type='button'; back.id='sandbox-telegram-back';
          back.textContent='← Telegram Back'; back.setAttribute('aria-label','Telegram Back');
          back.style.cssText='position:fixed;top:0;right:0;z-index:9999;display:none;font:11px sans-serif;padding:4px;color:#fff;background:#444;border:0';
          back.onclick=()=>{for(const callback of [...callbacks])callback()};
          document.addEventListener('DOMContentLoaded',()=>document.body.append(back));
          const noop=()=>{};
          window.Telegram={WebApp:{...data,ready:noop,expand:noop,disableVerticalSwipes:noop,
            close:()=>alert('Локальный симулятор: окно Telegram закрыто'),colorScheme:'light',themeParams:{},
            onEvent:(event,callback)=>{if(!events.has(event))events.set(event,new Set());events.get(event).add(callback)},
            offEvent:(event,callback)=>events.get(event)?.delete(callback),
            BackButton:{show:()=>{back.style.display='block'},hide:()=>{back.style.display='none'},
              onClick:callback=>callbacks.add(callback),offClick:callback=>callbacks.delete(callback)},
            HapticFeedback:{notificationOccurred:noop,impactOccurred:noop},setHeaderColor:noop,setBackgroundColor:noop,
            openLink:url=>window.open(url,'_blank','noopener,noreferrer'),openTelegramLink:noop}};
          window.__BETTON_SANDBOX__={actor:__ACTOR__,simulatedTelegram:true,realLocalAPI:true};
        })();""".replace("__DATA__", data).replace("__ACTOR__", json.dumps(actor))
        return Response(script, media_type="text/javascript")

    @application.get("/sandbox/")
    def sandbox_index(actor: str = "creator"):
        actor_or_404(actor)
        index = ROOT / "frontend" / "dist" / "index.html"
        if not index.is_file():
            raise HTTPException(
                503, "Build React first: cd frontend && npm ci && npm run build"
            )
        html = index.read_text(encoding="utf-8")
        # Never contact Telegram in the simulator, and install auth before bundle.
        html = html.replace(
            '<script src="https://telegram.org/js/telegram-web-app.js"></script>', ""
        )
        html = html.replace(
            "<head>",
            '<head><script src="/sandbox/host.js?actor=' + actor + '"></script>',
            1,
        )
        html = html.replace(
            "<title>BetTON</title>", "<title>BetTON · локальная тестовая база</title>"
        )
        return HTMLResponse(html)

    application.mount("/", backend)
    return application


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--full-demo', action='store_true', help='Curated scenarios and guarded automatic demo guarantors; use a NEW state directory')
    parser.add_argument(
        "--state-dir",
        type=Path,
        default=SANDBOX_ROOT,
        help="New sandbox directory under .ux-preview/ only",
    )
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Initialize isolated database and verify real auth/feed; exit",
    )
    args = parser.parse_args()
    application = create_preview(args.state_dir, full_demo=args.full_demo)
    if args.smoke:

        async def smoke():
            import httpx

            async with application.router.lifespan_context(application):
                transport = httpx.ASGITransport(
                    app=application, client=("127.0.0.1", 12345)
                )
                async with httpx.AsyncClient(
                    transport=transport, base_url="http://127.0.0.1:8877"
                ) as client:
                    response = await client.post(
                        "/auth/telegram",
                        headers={"Authorization": "tma " + signed_init_data("creator")},
                    )
                    assert response.status_code == 200, response.text
                    feed = await client.get("/feed/stats")
                    assert feed.status_code == 200, feed.text
                    assert (await client.post("/webhook", json={})).status_code == 404
                    assert (
                        await client.get(
                            "/sandbox/session",
                            headers={"Origin": "https://evil.example"},
                        )
                    ).status_code == 403
                    assert (
                        await client.get(
                            "/sandbox/session", headers={"Host": "evil.example"}
                        )
                    ).status_code == 403
                    assert (await client.post("/auth/telegram")).status_code == 401
                    assert (
                        await client.get("/sandbox/session?actor=unknown")
                    ).status_code == 404
                    assert "bot.main" not in sys.modules, (
                        "Sandbox must never initialize Telegram bot"
                    )
                    print(
                        json.dumps(
                            {
                                "auth_user": response.json(),
                                "feed": feed.json(),
                                "sandbox": str(args.state_dir),
                            },
                            ensure_ascii=False,
                        )
                    )

        asyncio.run(smoke())
        return
    import uvicorn

    print("LOCAL TEST DATA ONLY — no real wallets or Telegram bot. Ctrl+C to stop.")
    for actor in ACTORS:
        print(f"{actor}: http://127.0.0.1:8877/sandbox/?actor={actor}")
    uvicorn.run(application, host="127.0.0.1", port=8877, proxy_headers=False)


if __name__ == "__main__":
    main()
