from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from fastapi import Depends, FastAPI
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.lmsr import prices
from app.models import Outcome
from bot.main import build_dispatcher
from app.schemas import (
    BuySharesRequest,
    BuySharesResponse,
    ClaimRequest,
    ClaimResponse,
    MarketCreate,
    MarketOut,
    ResolveRequest,
    UserCreate,
    UserOut,
)
from app.services import market_service

logger = logging.getLogger("betton")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)

    bot: Bot | None = None
    dp = None
    polling_task: asyncio.Task | None = None
    token = (settings.bot_token or "").strip()
    if token:
        bot = Bot(token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
        dp = build_dispatcher()
        polling_task = asyncio.create_task(
            dp.start_polling(bot, handle_signals=False),
            name="betton-telegram-polling",
        )
        logger.info("Telegram polling started, Mini App: %s", settings.mini_app_url)
    else:
        logger.warning("BOT_TOKEN пустой — polling бота не запущен")

    yield

    if dp is not None and polling_task is not None:
        await dp.stop_polling()
        with suppress(asyncio.CancelledError):
            await polling_task
    if bot is not None:
        await bot.session.close()
        logger.info("Telegram polling stopped")


app = FastAPI(
    title="Betton",
    description="P2P-платформа предсказаний с LMSR AMM. Комиссия ставок 0%, монетизация — чаевые до 1%.",
    lifespan=lifespan,
)


@app.get("/", response_class=HTMLResponse)
def mini_app_home():
    return """<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>BetTON</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1020; color: #f4f1ea;
           margin: 0; min-height: 100vh; display: grid; place-items: center; }
    main { max-width: 28rem; padding: 2rem; }
    h1 { letter-spacing: .12em; margin: 0 0 .5rem; }
    p { line-height: 1.5; color: #c9c4b8; }
    a { color: #d4af37; }
  </style>
</head>
<body>
  <main>
    <h1>BetTON</h1>
    <p>P2P-ставки без комиссии. Маркетмейкер LMSR. Чаевые победителей — до 1%.</p>
    <p>API: <a href="/docs">/docs</a></p>
  </main>
</body>
</html>"""


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/users", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    return market_service.create_user(db, payload.username, payload.telegram_id)


@app.post("/markets", response_model=MarketOut)
def create_market(payload: MarketCreate, db: Session = Depends(get_db)):
    market = market_service.create_market(
        db,
        creator_id=payload.creator_id,
        question=payload.question,
        b=payload.b,
        description=payload.description,
    )
    return market_service.market_to_out(market)


@app.get("/markets", response_model=list[MarketOut])
def list_markets(db: Session = Depends(get_db)):
    return [market_service.market_to_out(m) for m in market_service.list_markets(db)]


@app.get("/markets/{market_id}", response_model=MarketOut)
def get_market(market_id: int, db: Session = Depends(get_db)):
    return market_service.market_to_out(market_service.get_market(db, market_id))


@app.post("/markets/{market_id}/buy", response_model=BuySharesResponse)
def buy_shares(market_id: int, payload: BuySharesRequest, db: Session = Depends(get_db)):
    result = market_service.buy_shares(
        db,
        market_id=market_id,
        user_id=payload.user_id,
        outcome=payload.outcome,
        money=payload.money,
    )
    shares = result["shares"]
    paid = result["paid"]
    p = result["prices"]
    return BuySharesResponse(
        market_id=market_id,
        outcome=payload.outcome,
        money=paid,
        shares=shares,
        avg_price=paid / shares if shares else 0.0,
        price_yes=p[0],
        price_no=p[1],
        balance=result["user"].balance,
    )


@app.post("/markets/{market_id}/resolve", response_model=MarketOut)
def resolve_market(market_id: int, payload: ResolveRequest, db: Session = Depends(get_db)):
    market = market_service.resolve_market(db, market_id, payload.winning_outcome)
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/claim", response_model=ClaimResponse)
def claim(market_id: int, payload: ClaimRequest, db: Session = Depends(get_db)):
    result = market_service.claim_winnings(
        db, market_id, payload.user_id, tip_rate=payload.tip_rate
    )
    return ClaimResponse(**result)


@app.get("/markets/{market_id}/book")
def order_book_prices(market_id: int, db: Session = Depends(get_db)):
    market = market_service.get_market(db, market_id)
    p = prices([market.q_yes, market.q_no], market.b)
    return {"yes": p[0], "no": p[1], "b": market.b}


# Чтобы `uvicorn main:app` из корня тоже работал
__all__ = ["app", "Outcome"]
