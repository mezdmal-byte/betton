import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.config import settings
from bot.main import HELP_TEXT, START_TEXT, sync_menu_button


def test_bot_texts_describe_p2p_not_guaranteed_lmsr():
    start = START_TEXT.lower()
    help_text = HELP_TEXT.lower()
    assert "p2p" in start
    assert "lmsr" not in start
    assert "lmsr" not in help_text
    assert "чаевые" not in start
    assert "чаевые" not in help_text
    assert "без комиссии" not in start
    assert "ликвидность всегда есть" not in help_text
    assert "сервисный сбор" in start
    assert "встречн" in help_text
    assert "частичн" in help_text
    assert "отмен" in help_text
    assert "лимитн" in help_text


def test_sync_menu_button_points_at_current_v2(monkeypatch):
    monkeypatch.setattr(settings, "public_base_url", "https://fresh-tunnel.trycloudflare.com")
    monkeypatch.setattr(settings, "mini_app_url", "")
    monkeypatch.setattr(settings, "render_external_url", "")
    monkeypatch.setattr(settings, "admin_telegram_id", 12345)

    bot = MagicMock()
    bot.set_chat_menu_button = AsyncMock(return_value=True)
    asyncio.run(sync_menu_button(bot))

    assert bot.set_chat_menu_button.await_count == 2
    default_call, admin_call = bot.set_chat_menu_button.await_args_list
    assert "chat_id" not in default_call.kwargs
    assert default_call.kwargs["menu_button"].text == "BetTON v2"
    assert default_call.kwargs["menu_button"].web_app.url == "https://fresh-tunnel.trycloudflare.com/v2/"
    assert admin_call.kwargs["chat_id"] == 12345
    assert admin_call.kwargs["menu_button"].web_app.url == "https://fresh-tunnel.trycloudflare.com/v2/"


def test_sync_menu_button_swallows_api_errors(monkeypatch):
    monkeypatch.setattr(settings, "admin_telegram_id", None)
    bot = MagicMock()
    bot.set_chat_menu_button = AsyncMock(side_effect=RuntimeError("telegram down"))
    asyncio.run(sync_menu_button(bot))
    bot.set_chat_menu_button.assert_awaited()
