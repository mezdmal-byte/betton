import sys
import os
# Добавляем корень проекта в пути поиска, чтобы не было ошибок модулей
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://onrender.com")

if not BOT_TOKEN:
    raise ValueError("Переменная BOT_TOKEN не найдена в окружении!")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

START_TEXT = (
    "🚀 **Добро пожаловать в BetTON Platform!**\n\n"
    "Это первая децентрализованная P2P-платформа предсказаний в Telegram "
    "на базе автоматического маркетмейкера LMSR (как в Polymarket).\n\n"
    "🔹 **0% комиссий** на создание рынков и ставки\n"
    "🔹 **До 1% чаевых** от чистой прибыли победителей\n\n"
    "Нажми кнопку ниже, чтобы запустить Mini App и сделать свою 'бетонную' ставку!"
)

def mini_app_keyboard():
    button = InlineKeyboardButton(text="📊 Запустить BetTON", web_app=types.WebAppInfo(url=MINI_APP_URL))
    return InlineKeyboardMarkup(inline_keyboard=[[button]])

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(START_TEXT, reply_markup=mini_app_keyboard(), parse_mode="Markdown")

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    help_text = (
        "⚙️ **Как устроена платформа BetTON:**\n\n"
        "1. Коэффициенты меняются динамически по формуле логарифмического маркетмейкера LMSR.\n"
        "2. Вы можете ставить в любой момент, ликвидность гарантирована алгоритмом.\n"
        "3. Платформа удерживает лишь до 1% в качестве чаевых от ЧИСТОЙ прибыли в момент закрытия рынка."
    )
    await message.answer(help_text, parse_mode="Markdown")
