from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.config import settings
from app.services import sports_provider
from tests.auth_helpers import tma_headers


def test_parse_pandascore_cs2_match():
    parsed = sports_provider._parse_match(
        {
            "id": 12345,
            "scheduled_at": "2026-09-27T15:30:00Z",
            "status": "not_started",
            "number_of_games": 3,
            "opponents": [
                {"opponent": {"id": 10, "name": "NAVI", "acronym": "NAVI", "image_url": "a.png"}},
                {"opponent": {"id": 20, "name": "Vitality", "acronym": "VIT", "image_url": "b.png"}},
            ],
            "league": {"name": "ESL Pro League"},
            "serie": {"full_name": "Season 99"},
            "tournament": {"name": "Playoffs"},
        }
    )
    assert parsed is not None
    assert parsed["id"] == 12345
    assert parsed["team_a"]["name"] == "NAVI"
    assert parsed["team_b"]["name"] == "Vitality"
    assert parsed["best_of"] == 3
    assert parsed["scheduled_at"] == datetime.fromisoformat("2026-09-27T15:30:00+00:00")


def test_cs2_endpoint_reports_unconfigured_provider(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "pandascore_token", "")
    headers = tma_headers(991234, username="cs2_fixture_user")
    auth = client.post("/auth/telegram", headers=headers)
    assert auth.status_code == 200, auth.text

    response = client.get("/sports/cs2/matches/upcoming", headers=headers)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["configured"] is False
    assert payload["provider"] == "pandascore"
    assert payload["items"] == []



def test_admin_can_bulk_import_cs2_and_duplicates_are_skipped(client: TestClient, monkeypatch):
    admin_tg = 991235
    monkeypatch.setattr(settings, "admin_telegram_id", admin_tg)
    headers = tma_headers(admin_tg, username="cs2_admin")
    auth = client.post("/auth/telegram", headers=headers)
    assert auth.status_code == 200, auth.text

    scheduled = datetime.now(timezone.utc) + timedelta(hours=4)

    async def fake_upcoming(*, limit=40):
        _ = limit
        return {
            "configured": True,
            "provider": "pandascore",
            "items": [
                {
                    "id": 777001,
                    "scheduled_at": scheduled,
                    "status": "not_started",
                    "team_a": {"id": 1, "name": "NAVI", "acronym": "NAVI", "image_url": None},
                    "team_b": {"id": 2, "name": "Vitality", "acronym": "VIT", "image_url": None},
                    "league_name": "ESL Pro League",
                    "serie_name": "Season 99",
                    "tournament_name": "Playoffs",
                    "best_of": 3,
                    "provider": "pandascore",
                }
            ],
        }

    monkeypatch.setattr(sports_provider, "upcoming_cs2_matches", fake_upcoming)

    first = client.post("/sports/cs2/import-upcoming", headers=headers)
    assert first.status_code == 200, first.text
    assert first.json()["created"] == 1
    assert first.json()["skipped"] == 0

    market_id = first.json()["created_market_ids"][0]
    market = client.get(f"/markets/{market_id}", headers=headers)
    assert market.status_code == 200, market.text
    payload = market.json()
    assert payload["category"] == "esports"
    assert payload["status"] == "open"
    assert payload["outcomes"] == ["NAVI", "Vitality"]
    assert "PandaScore API · CS2 match #777001" in payload["description"]

    close_at = datetime.fromisoformat(payload["close_at"].replace("Z", "+00:00"))
    expected = scheduled - timedelta(minutes=1)
    assert abs((close_at - expected).total_seconds()) < 1

    second = client.post("/sports/cs2/import-upcoming", headers=headers)
    assert second.status_code == 200, second.text
    assert second.json()["created"] == 0
    assert second.json()["skipped"] == 1
