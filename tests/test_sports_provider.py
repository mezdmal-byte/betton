from datetime import datetime

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
