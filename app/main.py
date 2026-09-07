import sys
import os
import asyncio
# Принудительно добавляем корень проекта в пути поиска Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from sqlalchemy.orm import Session
from aiogram import types

from app.database import engine, Base, SessionLocal
from bot.main import bot, dp

# Импортируем наши рабочие функции из сервиса
from app.services import market_service
from app.schemas import UserCreate, MarketCreate, BuySharesRequest, ClaimWinningsRequest

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Выносим установку вебхука в отдельную фоновую функцию
async def setup_webhook_task():
    try:
        await asyncio.sleep(2) # Даем серверу uvicorn 2 секунды, чтобы спокойно открыть порт
        server_url = "https://onrender.com"
        webhook_url = f"{server_url}/webhook"
        await bot.set_webhook(url=webhook_url)
        print(f"Вебхук Telegram бота успешно установлен на адрес: {webhook_url}")
    except Exception as e:
        print(f"Ошибка при установке вебхука: {e}")

@asynccontextmanager
async def async_lifespan(app: FastAPI):
    # При старте создаем таблицы
    Base.metadata.create_all(bind=engine)
    
    # Запускаем привязку вебхука асинхронно в фоне, чтобы НЕ БЛОКИРОВАТЬ запуск портов Render
    asyncio.create_task(setup_webhook_task())
    
    yield
    
    # При выключении удаляем вебхук
    try:
        await bot.delete_webhook()
    except:
        pass
    await bot.session.close()

app = FastAPI(
    title="BetTON API",
    description="P2P-платформа предсказаний на базе LMSR маркетмейкера",
    lifespan=async_lifespan
)

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
    return {"status": "BetTON API работает"}
