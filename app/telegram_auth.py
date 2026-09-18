from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any
from urllib.parse import parse_qsl

import httpx

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

AUTH_MAX_AGE_SECONDS = 3600
AUTH_FUTURE_SKEW_SECONDS = 30


class TelegramAuthError(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def parse_tma_authorization(header_value: str | None) -> str:
    if not header_value or not isinstance(header_value, str):
        raise TelegramAuthError()
    scheme, sep, rest = header_value.partition(" ")
    if not sep or scheme.lower() != "tma":
        raise TelegramAuthError()
    init_data = rest.strip()
    if not init_data:
        raise TelegramAuthError()
    return init_data


_HEX_SHA256 = frozenset("0123456789abcdefABCDEF")


def _is_hex_sha256(value: Any) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and value.isascii()
        and _HEX_SHA256.issuperset(value)
    )


def _require_positive_int(value: Any) -> int:
    if isinstance(value, bool) or type(value) is not int:
        raise TelegramAuthError()
    if value <= 0:
        raise TelegramAuthError()
    return value


def validate_init_data(
    init_data: str,
    bot_token: str | None,
    *,
    now: float | None = None,
) -> dict[str, Any]:
    token = (bot_token or "").strip()
    if not token:
        raise TelegramAuthError()
    if not isinstance(init_data, str) or not init_data.strip():
        raise TelegramAuthError()

    try:
        pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
    except ValueError:
        raise TelegramAuthError() from None

    keys = [key for key, _ in pairs]
    if not keys or len(keys) != len(set(keys)):
        raise TelegramAuthError()

    data = dict(pairs)
    received_hash = data.pop("hash", None)
    if not _is_hex_sha256(received_hash):
        raise TelegramAuthError()

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(data.items()))
    secret_key = hmac.new(b"WebAppData", token.encode("utf-8"), hashlib.sha256).digest()
    computed = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(computed, received_hash):
        raise TelegramAuthError()

    auth_date_raw = data.get("auth_date")
    if not isinstance(auth_date_raw, str) or not auth_date_raw.isdigit():
        raise TelegramAuthError()
    auth_date = int(auth_date_raw)
    current = int(now if now is not None else time.time())
    if auth_date - current > AUTH_FUTURE_SKEW_SECONDS:
        raise TelegramAuthError()
    if current - auth_date > AUTH_MAX_AGE_SECONDS:
        raise TelegramAuthError()

    user_raw = data.get("user")
    if not user_raw or not isinstance(user_raw, str):
        raise TelegramAuthError()
    try:
        user_obj = json.loads(user_raw)
    except json.JSONDecodeError:
        raise TelegramAuthError() from None
    if not isinstance(user_obj, dict):
        raise TelegramAuthError()

    user_id = _require_positive_int(user_obj.get("id"))
    username = user_obj.get("username")
    first_name = user_obj.get("first_name")
    last_name = user_obj.get("last_name")
    photo_url = user_obj.get("photo_url")
    language_code = user_obj.get("language_code")
    return {
        "id": user_id,
        "username": username if isinstance(username, str) else None,
        "first_name": first_name if isinstance(first_name, str) else None,
        "last_name": last_name if isinstance(last_name, str) else None,
        "photo_url": photo_url if isinstance(photo_url, str) else None,
        "language_code": language_code if isinstance(language_code, str) else None,
        "user": user_obj,
    }


def _validate_via_proxy(init_data: str) -> dict[str, Any]:
    base = (settings.telegram_auth_proxy_url or "").strip().rstrip("/")
    if not base:
        raise TelegramAuthError()
    if not base.startswith("https://"):
        raise TelegramAuthError()
    try:
        response = httpx.post(
            base + "/auth/telegram",
            headers={"Authorization": f"tma {init_data}"},
            timeout=5.0,
        )
    except httpx.HTTPError:
        raise TelegramAuthError() from None
    if response.status_code != 200:
        raise TelegramAuthError()
    try:
        payload = response.json()
    except ValueError:
        raise TelegramAuthError() from None
    if not isinstance(payload, dict):
        raise TelegramAuthError()
    telegram_id = _require_positive_int(payload.get("telegram_id"))
    return {
        "id": telegram_id,
        "username": payload.get("telegram_username") if isinstance(payload.get("telegram_username"), str) else None,
        "display_name": payload.get("display_name") if isinstance(payload.get("display_name"), str) else None,
        "photo_url": payload.get("photo_url") if isinstance(payload.get("photo_url"), str) else None,
        "is_admin": bool(payload.get("is_admin")),
    }


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    from app.services import market_service

    init_data = parse_tma_authorization(request.headers.get("Authorization"))
    token = (settings.bot_token or "").strip()
    using_proxy = not token
    if token:
        tg_user = validate_init_data(init_data, token)
    else:
        tg_user = _validate_via_proxy(init_data)

    user = market_service.get_or_create_telegram_user(
        db,
        telegram_id=tg_user["id"],
        username=tg_user.get("username"),
        first_name=tg_user.get("first_name"),
        last_name=tg_user.get("last_name"),
        photo_url=tg_user.get("photo_url"),
    )

    if using_proxy:
        changed = False
        display_name = tg_user.get("display_name")
        if isinstance(display_name, str) and display_name.strip() and user.display_name != display_name.strip():
            user.display_name = display_name.strip()
            changed = True
        photo_url = tg_user.get("photo_url")
        if isinstance(photo_url, str) and photo_url.strip().startswith("https://") and user.photo_url != photo_url.strip():
            user.photo_url = photo_url.strip()
            changed = True
        if changed:
            db.commit()
            db.refresh(user)

    # Preview-only: production's /auth/telegram is authoritative for admin status.
    # Persist the verified admin Telegram ID in this process so service functions
    # that reload the local user still see the same admin identity.
    if settings.telegram_auth_proxy_url and tg_user.get("is_admin"):
        settings.admin_telegram_id = int(tg_user["id"])

    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    header = request.headers.get("Authorization")
    if not header or not str(header).strip():
        return None
    return get_current_user(request, db)
