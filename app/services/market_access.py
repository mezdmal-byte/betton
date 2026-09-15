"""Access rules for unlisted markets. Does not change matching or money."""
from __future__ import annotations

import hmac

from fastapi import HTTPException, Request

from app.models import Market, User

SHARE_TOKEN_HEADER = "X-Market-Share-Token"
_NOT_FOUND = HTTPException(status_code=404, detail="Рынок не найден")


def share_token_from_request(request: Request | None) -> str | None:
    if request is None:
        return None
    raw = request.headers.get(SHARE_TOKEN_HEADER)
    if raw is None:
        return None
    text = str(raw).strip()
    return text or None


def _tokens_match(offered: str | None, actual: str | None) -> bool:
    a = (offered or "").strip().encode("utf-8")
    b = (actual or "").strip().encode("utf-8")
    if not a or not b or len(a) != len(b):
        return False
    return hmac.compare_digest(a, b)


def require_unlisted_access(market: Market, *, viewer: User | None = None, share_token: str | None = None) -> None:
    visibility = getattr(market, "visibility", None) or "public"
    if visibility != "unlisted":
        return
    if viewer is not None:
        if int(viewer.id) == int(market.creator_id):
            return
        if viewer.is_admin:
            return
    if _tokens_match(share_token, getattr(market, "share_token", None)):
        return
    raise _NOT_FOUND
