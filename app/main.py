import sys
import os
# Принудительно добавляем корень проекта в пути поиска Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from aiogram import types
from app.database import engine, Base
from bot.main import bot, dp

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте сервера автоматически создаем таблицы в базе
    Base.metadata.create_all(bind=engine)
    
    # Автоматически привязываем Вебхук к нашему серверу в интернетах
    server_url = "https://onrender.com"
    webhook_url = f"{server_url}/webhook"
    await bot.set_webhook(url=webhook_url)
    print(f"Вебхук Telegram бота успешно установлен на адрес: {webhook_url}")
    
    yield
    
    # При выключении сервера удаляем вебхук
    await bot.delete_webhook()
    await bot.session.close()

app = FastAPI(
    title="BetTON API",
    description="P2P-платформа предсказаний на базе LMSR маркетмейкера",
    lifespan=lifespan
)

# Сюда Дуров будет мгновенно пересылать сообщения пользователей из ТГ чата
@app.post("/webhook")
async def telegram_webhook(request: Request):
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}

from app.services.market_service import router as market_router
app.include_router(market_router)

@app.get("/")
def read_root():
    return {"status": "BetTON API работает"}
