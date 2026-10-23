"""Telegram-бот BetTON. WebApp открывает тот же бэкенд, что и API."""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("betton.bot")

dp = Dispatcher()
bot: Bot | None = None

START_TEXT = (
    "<b>BetTON</b> — P2P-ставки без комиссии\n"
    "Маркетмейкер LMSR, как у Polymarket.\n\n"
    "• Комиссия за рынки и ставки — <b>0%</b>\n"
    "• Чаевые победителя — до <b>1%</b> чистой прибыли\n\n"
    "Откройте Mini App — оно ходит напрямую в наш бэкенд."
)

HELP_TEXT = (
    "<b>Как устроен BetTON</b>\n\n"
    "Цены считает LMSR. Ликвидность всегда есть, коэффициенты двигаются "
    "от покупок акций Да/Нет.\n\n"
    "• Ставки и создание рынков — <b>0%</b>\n"
    "• При выплате можно оставить чаевые до <b>1%</b> от чистой прибыли\n\n"
    "/start — открыть Mini App"
)


def get_bot() -> Bot:
    global bot
    token = (settings.bot_token or os.getenv("BOT_TOKEN") or "").strip()
    if not token:
        raise RuntimeError("Нет BOT_TOKEN. Добавьте его в .env или в переменные Render.")
    if bot is None:
        bot = Bot(token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    return bot


def mini_app_url() -> str:
    configured = (settings.mini_app_url or "").strip().rstrip("/")
    return (configured or settings.webapp_base()) + "/"


def demo_url() -> str:
    """Optional isolated preview; never changes the regular Mini App link."""
    url = (os.getenv("BETTON_UX_V3_DEMO_URL") or "").strip()
    prefix = "https://betton-ux-v3-demo.onrender.com/demo-enter?key="
    return url if url.startswith(prefix) and len(url) > len(prefix) else ""


def mini_app_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [
            InlineKeyboardButton(
                text="Открыть BetTON",
                web_app=WebAppInfo(url=mini_app_url()),
            )
        ]
    ]
    if demo_url():
        keyboard.append([
            InlineKeyboardButton(
                text="🧪 BetTON UX v3 · тестовая версия",
                web_app=WebAppInfo(url=demo_url()),
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(START_TEXT, reply_markup=mini_app_keyboard())


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(HELP_TEXT, reply_markup=mini_app_keyboard())


@dp.message(Command("demo"))
async def cmd_demo(message: Message) -> None:
    """Launch the separately hosted fake-money UI with the existing BetTON bot."""
    if not demo_url():
        await message.answer("Тестовая версия временно недоступна.")
        return
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🧪 Открыть тестовый BetTON UX v3",
            web_app=WebAppInfo(url=demo_url()),
        )
    ]])
    await message.answer(
        "Тестовая версия UX v3: только демонстрационные пользователи и TON. "
        "Основное приложение не изменено.",
        reply_markup=keyboard,
    )


def build_dispatcher() -> Dispatcher:
    return dp


async def run_bot() -> None:
    instance = get_bot()
    try:
        await instance.delete_webhook(drop_pending_updates=False)
    except Exception:
        logger.warning("Не удалось снять webhook перед polling")
    logger.info("Mini App URL: %s", mini_app_url())
    await dp.start_polling(instance)


if __name__ == "__main__":
    asyncio.run(run_bot())
