import app.telegram_auth as telegram_auth
from app.config import settings


class _ProxyResponse:
    status_code = 200

    def json(self):
        return {
            "id": 999,
            "username": "ignored-local-id",
            "telegram_id": 42424242,
            "balance": 1000.0,
            "is_admin": True,
            "telegram_username": "preview_admin",
            "display_name": "Preview Admin",
            "photo_url": "https://example.com/avatar.jpg",
        }


def test_preview_auth_can_delegate_to_production_verifier(client, monkeypatch):
    monkeypatch.setattr(settings, "bot_token", "")
    monkeypatch.setattr(settings, "telegram_auth_proxy_url", "https://production.example")
    monkeypatch.setattr(settings, "admin_telegram_id", "")
    monkeypatch.setattr(telegram_auth.httpx, "post", lambda *args, **kwargs: _ProxyResponse())

    response = client.post(
        "/auth/telegram",
        headers={"Authorization": "tma proxy-signed-init-data"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["telegram_id"] == 42424242
    assert body["telegram_username"] == "preview_admin"
    assert body["display_name"] == "Preview Admin"
    assert body["is_admin"] is True

    moderation = client.get(
        "/moderation/markets",
        headers={"Authorization": "tma proxy-signed-init-data"},
    )
    assert moderation.status_code == 200


def test_preview_auth_proxy_requires_https(client, monkeypatch):
    monkeypatch.setattr(settings, "bot_token", "")
    monkeypatch.setattr(settings, "telegram_auth_proxy_url", "http://production.example")

    response = client.post(
        "/auth/telegram",
        headers={"Authorization": "tma proxy-signed-init-data"},
    )

    assert response.status_code == 401
