from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.config import settings
from tests.auth_helpers import tma_headers
from tests.legacy_helpers import post_legacy_market


def _login(client: TestClient, telegram_id: int, username: str):
    headers = tma_headers(telegram_id, username=username)
    response = client.post("/auth/telegram", headers=headers)
    assert response.status_code == 200, response.text
    return response.json(), headers


def _market(client: TestClient, headers: dict, question: str = "Чат рынка работает?") -> dict:
    response = post_legacy_market(
        client,
        "/markets",
        headers=headers,
        json={
            "question": question,
            "outcomes": ["Да", "Нет"],
            "lock_ton": 10,
            "close_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_lobby_reply_badge_only_for_direct_reply(client: TestClient):
    alice, alice_headers = _login(client, 781001, "alice_chat")
    bob, bob_headers = _login(client, 781002, "bob_chat")

    first = client.post("/chat/lobby", headers=alice_headers, json={"text": "Кто готов взять Нет?"})
    assert first.status_code == 200, first.text
    first_id = first.json()["id"]

    ordinary = client.post("/chat/lobby", headers=bob_headers, json={"text": "Обычное сообщение"})
    assert ordinary.status_code == 200

    unread = client.get("/chat/unread-replies", headers=alice_headers)
    assert unread.status_code == 200
    assert unread.json()["lobby"] == 0

    reply = client.post(
        "/chat/lobby",
        headers=bob_headers,
        json={"text": "Я готов", "reply_to_id": first_id},
    )
    assert reply.status_code == 200, reply.text

    unread = client.get("/chat/unread-replies", headers=alice_headers)
    assert unread.json()["lobby"] == 1
    assert unread.json()["total"] == 1

    read = client.post("/chat/lobby/read", headers=alice_headers)
    assert read.status_code == 200
    assert client.get("/chat/unread-replies", headers=alice_headers).json()["lobby"] == 0
    assert client.get("/chat/unread-replies", headers=bob_headers).json()["total"] == 0


def test_market_chat_reply_badge_and_scope(client: TestClient):
    alice, alice_headers = _login(client, 782001, "alice_market_chat")
    bob, bob_headers = _login(client, 782002, "bob_market_chat")
    market = _market(client, alice_headers)
    market_id = market["id"]

    first = client.post(
        f"/markets/{market_id}/chat",
        headers=alice_headers,
        json={"text": "Как считаете, будет Да?"},
    )
    assert first.status_code == 200, first.text

    reply = client.post(
        f"/markets/{market_id}/chat",
        headers=bob_headers,
        json={"text": "Думаю, да", "reply_to_id": first.json()["id"]},
    )
    assert reply.status_code == 200, reply.text

    unread = client.get("/chat/unread-replies", headers=alice_headers).json()
    assert unread["lobby"] == 0
    assert unread["markets"][str(market_id)] == 1

    page = client.get(f"/markets/{market_id}/chat?limit=50", headers=alice_headers)
    assert page.status_code == 200
    assert [row["text"] for row in page.json()["items"]][-2:] == [
        "Как считаете, будет Да?",
        "Думаю, да",
    ]

    assert client.post(f"/markets/{market_id}/chat/read", headers=alice_headers).status_code == 200
    assert str(market_id) not in client.get("/chat/unread-replies", headers=alice_headers).json()["markets"]


def test_lobby_can_attach_public_market_and_reply_scope_is_checked(client: TestClient):
    alice, alice_headers = _login(client, 783001, "alice_attach")
    market = _market(client, alice_headers, "Прикрепляем это событие?")
    message = client.post(
        "/chat/lobby",
        headers=alice_headers,
        json={"text": "Посмотрите это пари", "attached_market_id": market["id"]},
    )
    assert message.status_code == 200, message.text
    assert message.json()["attached_market"]["id"] == market["id"]

    market_message = client.post(
        f"/markets/{market['id']}/chat",
        headers=alice_headers,
        json={"text": "Сообщение рынка"},
    )
    assert market_message.status_code == 200
    wrong_scope = client.post(
        "/chat/lobby",
        headers=alice_headers,
        json={"text": "Неверный ответ", "reply_to_id": market_message.json()["id"]},
    )
    assert wrong_scope.status_code == 400


def test_author_or_admin_can_delete_chat_message(client: TestClient, monkeypatch):
    alice, alice_headers = _login(client, 784001, "alice_delete")
    bob, bob_headers = _login(client, 784002, "bob_delete")
    created = client.post("/chat/lobby", headers=alice_headers, json={"text": "Удаляемое"})
    message_id = created.json()["id"]

    forbidden = client.delete(f"/chat/messages/{message_id}", headers=bob_headers)
    assert forbidden.status_code == 403

    own = client.delete(f"/chat/messages/{message_id}", headers=alice_headers)
    assert own.status_code == 200
    assert own.json()["deleted"] is True
    assert own.json()["text"] == "Сообщение удалено"

    second = client.post("/chat/lobby", headers=alice_headers, json={"text": "Админ удалит"}).json()
    monkeypatch.setattr(settings, "admin_telegram_id", 784003)
    _admin, admin_headers = _login(client, 784003, "chat_admin")
    deleted = client.delete(f"/chat/messages/{second['id']}", headers=admin_headers)
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True
