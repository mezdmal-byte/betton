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
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("betton.bot")

dp = Dispatcher()
bot: Bot | None = None

TEXTS = {
    "ru": {
        "start": (
            "<b>BetTON</b> — P2P рынок прогнозов.\n\n"
            "• Пользователи сами предлагают коэффициенты\n"
            "• 0% за создание события и размещение заявки\n"
            "• Сервисный сбор 1% только с чистой прибыли победителя\n"
            "• Неисполненная заявка ждёт контрагента\n\n"
            "Откройте Mini App."
        ),
        "help": (
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
        ),
        "open": "Открыть BetTON",
        "open_event": "Открыть событие",
    },
    "en": {
        "start": (
            "<b>BetTON</b> is a P2P prediction market.\n\n"
            "• Users post their own odds\n"
            "• 0% to create an event or place an order\n"
            "• Service fee is 1% of the winner’s net profit only\n"
            "• An unmatched order waits for a counterparty\n\n"
            "Open the Mini App."
        ),
        "help": (
            "<b>How BetTON works</b>\n\n"
            "Users set odds with limit orders. Fills depend on a counterparty: "
            "partial fills are possible, and unmatched remainder can be cancelled. "
            "There is no guaranteed instant liquidity.\n\n"
            "• A limit order reserves funds and waits for a counterparty\n"
            "• A crossing order fills overlapping size\n"
            "• A partial fill is normal, not an error\n"
            "• You can cancel the remainder — funds return to your balance\n"
            "• After settlement, payouts are credited automatically\n"
            "• Service fee is 1% of the winner’s net profit only\n\n"
            "/start — open the Mini App"
        ),
        "open": "Open BetTON",
        "open_event": "Open event",
    },
    "zh": {
        "start": (
            "<b>BetTON</b> 是点对点预测市场。\n\n"
            "• 用户自行报价\n"
            "• 创建事件和下单均为 0%\n"
            "• 服务费仅为获胜者净利润的 1%\n"
            "• 未成交订单会等待对手盘\n\n"
            "请打开 Mini App。"
        ),
        "help": (
            "<b>BetTON 如何运作</b>\n\n"
            "用户用限价单自行设定赔率。成交取决于对手盘：可能部分成交，"
            "未成交余额可以取消。没有保证的即时流动性。\n\n"
            "• 限价单会冻结金额并等待对手\n"
            "• 交叉订单会成交重叠部分\n"
            "• 部分成交是正常情况，不是错误\n"
            "• 可以取消剩余部分，资金回到余额\n"
            "• 结算后赔付自动入账\n"
            "• 服务费仅为获胜者净利润的 1%\n\n"
            "/start — 打开 Mini App"
        ),
        "open": "打开 BetTON",
        "open_event": "打开事件",
    },
}

START_TEXT = TEXTS["ru"]["start"]
HELP_TEXT = TEXTS["ru"]["help"]


def bot_lang(message: Message) -> str:
    user = getattr(message, "from_user", None)
    code = str(getattr(user, "language_code", "") or "").lower()
    if code.startswith("ru"):
        return "ru"
    if code.startswith("zh"):
        return "zh"
    return "en"


def bot_copy(message: Message) -> dict[str, str]:
    return TEXTS.get(bot_lang(message)) or TEXTS["en"]


def get_bot() -> Bot:
    global bot
    token = (settings.bot_token or os.getenv("BOT_TOKEN") or "").strip()
    if not token:
        raise RuntimeError("Нет BOT_TOKEN. Добавьте его в .env или в переменные Render.")
    if bot is None:
        bot = Bot(token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    return bot


def mini_app_url() -> str:
    return settings.webapp_base().rstrip("/") + "/v2/"


MENU_BUTTON_TEXT = "BetTON v2"


async def sync_menu_button(bot: Bot) -> None:
    """Point Telegram's persistent chat menu at the current Mini App /v2/ URL."""
    url = mini_app_url()
    menu = MenuButtonWebApp(text=MENU_BUTTON_TEXT, web_app=WebAppInfo(url=url))
    try:
        await bot.set_chat_menu_button(menu_button=menu)
        logger.info("Telegram default menu button -> %s", url)
    except Exception:
        logger.warning("Could not sync default Telegram menu button to %s", url, exc_info=True)

    admin_id = settings.admin_tg_id()
    if admin_id is None:
        return
    try:
        await bot.set_chat_menu_button(chat_id=admin_id, menu_button=menu)
        logger.info("Telegram admin chat menu button -> %s", url)
    except Exception:
        logger.warning("Could not sync admin chat Telegram menu button to %s", url, exc_info=True)


def share_webapp_url(token: str) -> str:
    return settings.webapp_base().rstrip("/") + "/v2/?share=" + token


def start_payload_token(payload: str | None) -> str | None:
    text = (payload or "").strip()
    if text.startswith("market_"):
        token = text[7:].strip()
        return token or None
    return None


def mini_app_keyboard(url: str | None = None, label: str = "Открыть BetTON") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=label,
                    web_app=WebAppInfo(url=url or mini_app_url()),
                )
            ]
        ]
    )


@dp.message(CommandStart())
async def cmd_start(message: Message, command: CommandObject | None = None) -> None:
    payload = command.args if command is not None else None
    token = start_payload_token(payload)
    copy = bot_copy(message)
    if token:
        await message.answer(
            copy["start"],
            reply_markup=mini_app_keyboard(share_webapp_url(token), copy["open_event"]),
        )
        return
    await message.answer(copy["start"], reply_markup=mini_app_keyboard(label=copy["open"]))


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    copy = bot_copy(message)
    await message.answer(copy["help"], reply_markup=mini_app_keyboard(label=copy["open"]))


def build_dispatcher() -> Dispatcher:
    return dp


async def run_bot() -> None:
    instance = get_bot()
    try:
        await instance.delete_webhook(drop_pending_updates=False)
    except Exception:
        logger.warning("Не удалось снять webhook перед polling")
    await sync_menu_button(instance)
    logger.info("Mini App URL: %s", mini_app_url())
    await dp.start_polling(instance)


if __name__ == "__main__":
    asyncio.run(run_bot())
