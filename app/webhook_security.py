"""Webhook authentication and explicit deployment-time registration."""
import hmac
import re
from fastapi import HTTPException, Request
from app.config import settings

HEADER = "X-Telegram-Bot-Api-Secret-Token"


def valid_secret(value: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_-]{32,256}", value))


def require_webhook_secret(request: Request) -> None:
    current = settings.telegram_webhook_secret
    previous = settings.telegram_webhook_previous_secret
    if not valid_secret(current) or (previous and not valid_secret(previous)):
        raise HTTPException(503, "Webhook authentication is not configured")
    values = request.headers.getlist(HEADER)
    if len(values) != 1 or not valid_secret(values[0]):
        raise HTTPException(403, "Invalid webhook authentication")
    accepted = hmac.compare_digest(values[0], current)
    if previous:
        accepted = hmac.compare_digest(values[0], previous) or accepted
    if not accepted:
        raise HTTPException(403, "Invalid webhook authentication")


def proxy_headers() -> dict[str, str]:
    secret = settings.telegram_webhook_proxy_secret
    if not valid_secret(secret):
        raise HTTPException(503, "Webhook proxy authentication is not configured")
    return {HEADER: secret}


async def register_webhook(bot) -> None:
    if not settings.is_public_https() or not valid_secret(settings.telegram_webhook_secret):
        raise RuntimeError("HTTPS URL and webhook secret must be configured")
    await bot.set_webhook(
        url=settings.webapp_base() + "/webhook",
        secret_token=settings.telegram_webhook_secret,
        drop_pending_updates=False,
        max_connections=1,
    )


async def _register() -> None:
    from bot.main import get_bot
    bot = get_bot()
    try:
        await register_webhook(bot)
    finally:
        await bot.session.close()


if __name__ == "__main__":
    import argparse
    import asyncio
    parser = argparse.ArgumentParser(description="Explicitly register authenticated Telegram webhook")
    parser.add_argument("action", choices=["register"])
    parser.parse_args()
    try:
        asyncio.run(_register())
    except Exception:
        raise SystemExit("Webhook registration failed; check protected configuration and connectivity") from None
