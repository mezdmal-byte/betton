import sys
import os
# Принудительно добавляем корень проекта в пути поиска Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from aiogram import types

from app.database import engine, Base, SessionLocal
from bot.main import bot, dp

# Импортируем наши рабочие функции из сервиса
from app.services import market_service
from app.schemas import UserCreate, MarketCreate, BuySharesRequest, ClaimWinningsRequest
from app.models import Outcome

# Функция получения сессии базы данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # При старте сервера автоматически создаем таблицы в базе SQLite
    Base.metadata.create_all(bind=engine)
    
    # Автоматически привязываем Вебхук к нашему серверу в интернетах
    server_url = "https://betton-630y.onrender.com"
    webhook_url = f"{server_url}/webhook"
    await bot.set_webhook(url=webhook_url)
    print(f"Вебхук Telegram бота успешно установлен на адрес: {webhook_url}")
    
    yield
    
    # При выключении сервера удаляем вебхук
    await bot.delete_webhook()
    await bot.session.close()

app = FastAPI(
    title="BetTON API",
    description="P2P-платформа предсказаний на базе LMSR маркетмейкера. Комиссия 0%, чаевые платформе до 1%.",
    lifespan=lifespan
)

# Эндпоинт Вебхука для Telegram
@app.post("/webhook")
async def telegram_webhook(request: Request):
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}

# --- ЭНДПОИНТЫ ПЛАТФОРМЫ СТАВОК ---

@app.post("/users", status_code=201)
def create_user_endpoint(user_in: UserCreate, db: Session = Depends(get_db)):
    return market_service.create_user(db, username=user_in.username, telegram_id=user_in.telegram_id)

@app.post("/markets")
def create_market_endpoint(market_in: MarketCreate, db: Session = Depends(get_db)):
    market = market_service.create_market(
        db, 
        creator_id=market_in.creator_id, 
        question=market_in.question, 
        b=market_in.b, 
        description=market_in.description
    )
    return market_service.market_to_out(market)

@app.get("/markets")
def list_markets_endpoint(db: Session = Depends(get_db)):
    markets = market_service.list_markets(db)
    return [market_service.market_to_out(m) for m in markets]

@app.get("/markets/{market_id}")
def get_market_endpoint(market_id: int, db: Session = Depends(get_db)):
    market = market_service.get_market(db, market_id)
    return market_service.market_to_out(market)

@app.post("/markets/{market_id}/buy")
def buy_shares_endpoint(market_id: int, req: BuySharesRequest, db: Session = Depends(get_db)):
    res = market_service.buy_shares(
        db, 
        market_id=market_id, 
        user_id=req.user_id, 
        outcome=req.outcome, 
        money=req.money
    )
    return {
        "market": market_service.market_to_out(res["market"]),
        "shares": res["shares"],
        "paid": res["paid"],
        "prices": res["prices"]
    }

@app.post("/markets/{market_id}/claim")
def claim_winnings_endpoint(market_id: int, req: ClaimWinningsRequest, db: Session = Depends(get_db)):
    return market_service.claim_winnings(
        db, 
        market_id=market_id, 
        user_id=req.user_id, 
        tip_rate=req.tip_rate
    )

@app.get("/")
def read_root():
    return {"status": "BetTON API работает", "info": "Перейдите на /docs для тестов Mini App"}
