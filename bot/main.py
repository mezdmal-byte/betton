"""Telegram-бот BetTON. Запуск рядом с API: python -m bot.main"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("betton.bot")

START_TEXT = (
    "<b>BetTON</b> — P2P-ставки без комиссии\n"
    "Рынки предсказаний с маркетмейкером <b>LMSR</b>\n"
    "\n"
    "Покупайте акции исходов <b>Да / Нет</b>. Цена всегда есть, "
    "комиссии за вход и ставки — <b>0%</b>. Платформа живёт на чаевых "
    "победителей — до 1% от чистой прибыли.\n"
    "\n"
    "<b>Как начать</b>\n"
    "1. Откройте Mini App кнопкой ниже\n"
    "2. Создайте событие и задайте ликвидность <code>b</code>\n"
    "3. Ставьте на исход — LMSR сам посчитает акции и цену\n"
    "\n"
    "Команда /help — как устроена экономика платформы."
)

HELP_TEXT = (
    "<b>Как устроен BetTON</b>\n"
    "\n"
    "Это не букмекерская контора: вы торгуете с автоматическим "
    "маркетмейкером по формуле LMSR (Logarithmic Market Scoring Rule). "
    "Чем больше параметр ликвидности <code>b</code>, тем спокойнее двигается цена.\n"
    "\n"
    "<b>Комиссии</b>\n"
    "• Ставки и вход — <b>0%</b>\n"
    "• Монетизация — чаевые победителя до <b>1%</b> от чистой прибыли "
    "(выплата минус то, что потратили на победивший исход)\n"
    "\n"
    "<b>Резолюция</b>\n"
    "Акция верного исхода = 1, неверного = 0. Дальше можно забрать выигрыш "
    "и по желанию оставить чаевые.\n"
    "\n"
    "/start — приветствие и Mini App"
)


def mini_app_keyboard() -> InlineKeyboardMarkup:
    url = settings.mini_app_url
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть Mini App",
                    web_app=WebAppInfo(url=url),
                )
            ]
        ]
    )


async def cmd_start(message: Message) -> None:
    await message.answer(START_TEXT, reply_markup=mini_app_keyboard())


async def cmd_help(message: Message) -> None:
    await message.answer(HELP_TEXT, reply_markup=mini_app_keyboard())


def build_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.message.register(cmd_start, CommandStart())
    dp.message.register(cmd_help, Command("help"))
    return dp


async def run_bot() -> None:
    token = (settings.bot_token or "").strip()
    if not token:
        raise RuntimeError(
            "Нет BOT_TOKEN. Создайте бота в @BotFather и впишите токен в .env"
        )
    bot = Bot(token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = build_dispatcher()
    logger.info("BetTON bot polling, Mini App: %s", settings.mini_app_url)
    await dp.start_polling(bot)


def main() -> None:
    asyncio.run(run_bot())


if __name__ == "__main__":
    main()
