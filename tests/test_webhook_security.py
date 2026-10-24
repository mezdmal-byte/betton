import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from starlette.requests import Request
from app.config import settings
from app.webhook_security import HEADER, require_webhook_secret, register_webhook, proxy_headers


def request(secret=None):
    headers = [] if secret is None else [(HEADER.lower().encode(), secret.encode())]
    return Request({'type': 'http', 'headers': headers})


@pytest.mark.parametrize('secret', [None, 'incorrect', 'c' * 43, 'секрет'])
def test_reject_before_parsing_update(client, monkeypatch, secret):
    monkeypatch.setattr(settings, 'telegram_webhook_secret', 'a' * 43)
    # Unicode is not a valid HTTP header: directly test its decoded equivalent.
    if secret == 'секрет':
        with pytest.raises(HTTPException) as exc:
            require_webhook_secret(request(secret))
        assert exc.value.status_code == 403
    else:
        headers = {} if secret is None else {HEADER: secret}
        assert client.post('/webhook', content='not JSON', headers=headers).status_code == 403


def test_missing_config_fails_closed(monkeypatch):
    monkeypatch.setattr(settings, 'telegram_webhook_secret', '')
    with pytest.raises(HTTPException) as exc:
        require_webhook_secret(request('a' * 43))
    assert exc.value.status_code == 503


def test_rotation_duplicate_headers_and_revocation(monkeypatch):
    monkeypatch.setattr(settings, 'telegram_webhook_secret', 'a' * 43)
    monkeypatch.setattr(settings, 'telegram_webhook_previous_secret', 'b' * 43)
    require_webhook_secret(request('a' * 43))
    require_webhook_secret(request('b' * 43))
    duplicate = request('a' * 43)
    duplicate.scope['headers'] *= 2
    with pytest.raises(HTTPException):
        require_webhook_secret(duplicate)
    monkeypatch.setattr(settings, 'telegram_webhook_previous_secret', '')
    with pytest.raises(HTTPException):
        require_webhook_secret(request('b' * 43))


def test_authenticated_repeated_delivery(client, monkeypatch):
    import app.main as main
    monkeypatch.setattr(settings, 'telegram_webhook_secret', 'a' * 43)
    dp = SimpleNamespace(feed_update=AsyncMock())
    monkeypatch.setattr(main, '_maybe_bot', lambda: (object(), dp))
    for _ in range(2):
        assert client.post('/webhook', json={'update_id': 123}, headers={HEADER: 'a' * 43}).status_code == 200
    # Telegram is at-least-once: money mutations must keep their own persistent idempotency.
    assert dp.feed_update.await_count == 2
    monkeypatch.setattr(main, '_maybe_bot', lambda: (None, None))


def test_explicit_registration(monkeypatch):
    monkeypatch.setattr(settings, 'telegram_webhook_secret', 'a' * 43)
    monkeypatch.setattr(settings, 'public_base_url', 'https://example.test')
    bot = SimpleNamespace(set_webhook=AsyncMock())
    asyncio.run(register_webhook(bot))
    bot.set_webhook.assert_awaited_once_with(url='https://example.test/webhook', secret_token='a' * 43, drop_pending_updates=False, max_connections=1)


def test_replica_shutdown_does_not_remove_webhook(monkeypatch):
    import app.main as main
    bot = SimpleNamespace(set_webhook=AsyncMock(), delete_webhook=AsyncMock(), session=SimpleNamespace(close=AsyncMock()))
    monkeypatch.setattr(main, '_maybe_bot', lambda: (bot, None))
    monkeypatch.setattr(main, 'assert_schema_ready', lambda: None)
    if hasattr(main, 'assert_money_ready'):
        monkeypatch.setattr(main, 'assert_money_ready', lambda: None)
    async def lifecycle():
        async with main.async_lifespan(main.app):
            pass
    asyncio.run(lifecycle())
    bot.set_webhook.assert_not_awaited()
    bot.delete_webhook.assert_not_awaited()
    bot.session.close.assert_awaited_once()


def test_proxy_uses_separate_secret(monkeypatch):
    monkeypatch.setattr(settings, 'telegram_webhook_secret', 'a' * 43)
    monkeypatch.setattr(settings, 'telegram_webhook_proxy_secret', 'b' * 43)
    assert proxy_headers() == {HEADER: 'b' * 43}
    monkeypatch.setattr(settings, 'telegram_webhook_proxy_secret', '')
    with pytest.raises(HTTPException):
        proxy_headers()
