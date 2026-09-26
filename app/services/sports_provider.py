from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings


PANDASCORE_BASE_URL = "https://api.pandascore.co"
_CACHE_TTL_SECONDS = 60.0
_cache_at = 0.0
_cache_items: list[dict] = []


class SportsProviderError(RuntimeError):
    pass


def _team(raw: dict | None) -> dict | None:
    if not isinstance(raw, dict):
        return None
    opponent = raw.get("opponent")
    if isinstance(opponent, dict):
        raw = opponent
    team_id = raw.get("id")
    name = str(raw.get("name") or "").strip()
    if not isinstance(team_id, int) or not name:
        return None
    return {
        "id": team_id,
        "name": name,
        "acronym": (str(raw.get("acronym") or "").strip() or None),
        "image_url": (str(raw.get("image_url") or "").strip() or None),
    }


def _parse_match(raw: dict) -> dict | None:
    opponents = raw.get("opponents")
    if not isinstance(opponents, list) or len(opponents) != 2:
        return None
    team_a = _team(opponents[0])
    team_b = _team(opponents[1])
    if team_a is None or team_b is None:
        return None

    scheduled_raw = raw.get("scheduled_at") or raw.get("begin_at")
    if not isinstance(scheduled_raw, str) or not scheduled_raw.strip():
        return None
    try:
        scheduled_at = datetime.fromisoformat(scheduled_raw.replace("Z", "+00:00"))
    except ValueError:
        return None

    match_id = raw.get("id")
    if not isinstance(match_id, int):
        return None

    league = raw.get("league") if isinstance(raw.get("league"), dict) else {}
    serie = raw.get("serie") if isinstance(raw.get("serie"), dict) else {}
    tournament = raw.get("tournament") if isinstance(raw.get("tournament"), dict) else {}
    best_of = raw.get("number_of_games")
    if not isinstance(best_of, int):
        best_of = None

    return {
        "id": match_id,
        "scheduled_at": scheduled_at,
        "status": str(raw.get("status") or "not_started"),
        "team_a": team_a,
        "team_b": team_b,
        "league_name": str(league.get("name") or "").strip(),
        "serie_name": str(serie.get("full_name") or serie.get("name") or "").strip(),
        "tournament_name": str(tournament.get("name") or "").strip(),
        "best_of": best_of,
        "provider": "pandascore",
    }


async def upcoming_cs2_matches(*, limit: int = 40) -> dict:
    global _cache_at, _cache_items

    token = (settings.pandascore_token or "").strip()
    if not token:
        return {"configured": False, "provider": "pandascore", "items": []}

    now = time.monotonic()
    if _cache_items and now - _cache_at < _CACHE_TTL_SECONDS:
        return {
            "configured": True,
            "provider": "pandascore",
            "items": _cache_items[: max(1, min(limit, 100))],
        }

    per_page = max(1, min(int(limit), 100))
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(
                f"{PANDASCORE_BASE_URL}/csgo/matches/upcoming",
                params={"per_page": per_page, "sort": "scheduled_at"},
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError as exc:
        raise SportsProviderError("Не удалось связаться с PandaScore") from exc

    if response.status_code in (401, 403):
        raise SportsProviderError("PandaScore отклонил API token")
    if response.status_code >= 400:
        raise SportsProviderError(f"PandaScore вернул ошибку {response.status_code}")

    try:
        payload = response.json()
    except ValueError as exc:
        raise SportsProviderError("PandaScore вернул некорректный ответ") from exc

    if not isinstance(payload, list):
        raise SportsProviderError("PandaScore вернул неожиданный формат данных")

    now_utc = datetime.now(timezone.utc)
    cutoff = now_utc + timedelta(minutes=2)
    items = [
        parsed
        for row in payload
        if isinstance(row, dict)
        if (parsed := _parse_match(row))
        if parsed["status"] in ("not_started", "pre_match")
        if parsed["scheduled_at"].astimezone(timezone.utc) > cutoff
    ]
    items.sort(key=lambda item: item["scheduled_at"])
    _cache_items = items
    _cache_at = now
    return {"configured": True, "provider": "pandascore", "items": items[:per_page]}
