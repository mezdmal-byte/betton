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
    "<b>BetTON</b> — P2P рынок прогнозов.\n\n"
    "• Пользователи сами предлагают коэффициенты\n"
    "• 0% за создание события и размещение заявки\n"
    "• Сервисный сбор 1% только с чистой прибыли победителя\n"
    "• Неисполненная заявка ждёт контрагента\n\n"
    "Откройте Mini App."
)

HELP_TEXT = (
    "<b>Как устроен BetTON</b>\n\n"
    "Коэффициенты задают сами пользователи лимитными заявками. "
    "Исполнение зависит от встречной заявки: частичное исполнение возможно, "
    "неисполненный остаток можно отменить. Гарантированной мгновенной "
    "ликвидности нет.\n\n"
    "• Лимитная заявка резервирует сумму и ждёт контрагента\n"
    "• Встречная заявка исполняет пересекающиеся объёмы\n"
    "• Частичное исполнение — нормальная ситуация, не ошибка\n"
    "• Остаток заявки можно отменить — деньги вернутся на баланс\n"
    "• После расчёта события выплаты зачисляются автоматически\n"
    "• Сервисный сбор 1% только с чистой прибыли победителя\n\n"
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
    return settings.webapp_base() + "/"


def mini_app_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть BetTON",
                    web_app=WebAppInfo(url=mini_app_url()),
                )
            ]
        ]
    )


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(START_TEXT, reply_markup=mini_app_keyboard())


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(HELP_TEXT, reply_markup=mini_app_keyboard())


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
