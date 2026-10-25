import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock
from app.config import settings
from bot import main as bot


def test_explicit_main_url_and_default_react_menu_share(monkeypatch):
    monkeypatch.setattr(settings,'public_base_url','https://backend.example')
    monkeypatch.setattr(settings,'mini_app_url','')
    assert bot.mini_app_url()=='https://backend.example/v2/'
    monkeypatch.setattr(settings,'mini_app_url','https://frontend.example/app?source=bot')
    assert bot.mini_app_url()=='https://frontend.example/app/?source=bot'
    assert bot.share_webapp_url('example_token')=='https://frontend.example/app/?source=bot&share=example_token'
    monkeypatch.setattr(settings,'mini_app_url','https://legacy.example/')
    assert bot.mini_app_url()=='https://legacy.example/'


def test_existing_demo_command_and_button_do_not_replace_real_app(monkeypatch):
    monkeypatch.setattr(settings,'mini_app_url','https://app.example/v2/')
    monkeypatch.setenv('BETTON_UX_V3_DEMO_URL','https://betton-ux-v3-demo.onrender.com/demo-enter?key=synthetic_test_only')
    keys=bot.mini_app_keyboard().inline_keyboard
    assert len(keys)==2
    assert keys[0][0].web_app.url=='https://app.example/v2/'
    assert keys[1][0].web_app.url==bot.demo_url()
    message=SimpleNamespace(answer=AsyncMock())
    asyncio.run(bot.cmd_demo(message))
    message.answer.assert_awaited_once()
    monkeypatch.delenv('BETTON_UX_V3_DEMO_URL')
    assert len(bot.mini_app_keyboard().inline_keyboard)==1
    message.answer.reset_mock()
    asyncio.run(bot.cmd_demo(message))
    assert 'недоступна' in message.answer.await_args.args[0]


def test_start_deep_link_localization_survives_main_merge(monkeypatch):
    monkeypatch.setattr(settings,'mini_app_url','https://app.example/v2/')
    monkeypatch.delenv('BETTON_UX_V3_DEMO_URL',raising=False)
    message=SimpleNamespace(from_user=SimpleNamespace(language_code='en'),answer=AsyncMock())
    asyncio.run(bot.cmd_start(message,SimpleNamespace(args='market_saved_token')))
    assert message.answer.await_args.kwargs['reply_markup'].inline_keyboard[0][0].web_app.url=='https://app.example/v2/?share=saved_token'
    assert 'P2P' in message.answer.await_args.args[0]
