import uuid

from app.config import settings
from tests.auth_helpers import tma_headers


def _auth(client, telegram_id: int, *, username: str, first_name: str):
    headers = tma_headers(telegram_id, username=username, first_name=first_name)
    response = client.post("/auth/telegram", headers=headers)
    assert response.status_code == 200, response.text
    return response.json(), headers


def test_market_search_matches_title_category_and_author(client, monkeypatch):
    admin_tg = int(uuid.uuid4().int % 1_000_000_000) + 50_000_000
    monkeypatch.setattr(settings, "admin_telegram_id", admin_tg)
    _admin, admin_headers = _auth(
        client, admin_tg, username="search_admin", first_name="Админ"
    )
    _creator, creator_headers = _auth(
        client, admin_tg + 1, username="crypto_author", first_name="Мария"
    )

    created = client.post(
        "/markets",
        headers=creator_headers,
        json={
            "question": "Bitcoin превысит контрольную отметку?",
            "description": "Публичный тест полнотекстового поиска.",
            "category": "crypto",
            "outcomes": ["Да", "Нет"],
            "close_at": "2030-01-01T00:00:00+00:00",
        },
    )
    assert created.status_code == 200, created.text
    market_id = created.json()["id"]
    approved = client.post(f"/markets/{market_id}/approve", headers=admin_headers)
    assert approved.status_code == 200, approved.text

    for query in ("Bitcoin", "Крипто", "crypto", "@crypto_author", "Мария"):
        response = client.get("/markets", params={"q": query, "status": "open"})
        assert response.status_code == 200, response.text
        assert market_id in [row["id"] for row in response.json()], query

    filtered = client.get("/markets", params={"category": "crypto", "status": "open"})
    assert filtered.status_code == 200, filtered.text
    assert market_id in [row["id"] for row in filtered.json()]
