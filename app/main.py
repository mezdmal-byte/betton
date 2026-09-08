import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine, get_db
from app.schemas import (
    BuySharesRequest,
    ClaimWinningsRequest,
    MarketCreate,
    MarketOut,
    ResolveRequest,
    TelegramAuth,
    UserCreate,
    UserOut,
)
from app.services import market_service

STATIC_DIR = Path(__file__).resolve().parent / "static"


def _maybe_bot():
    from bot.main import dp, get_bot

    try:
        return get_bot(), dp
    except RuntimeError:
        return None, None


async def setup_webhook_task():
    await asyncio.sleep(1)
    bot, _dp = _maybe_bot()
    if bot is None or not settings.is_public_https():
        print("Webhook пропущен: нужен BOT_TOKEN и публичный HTTPS (MINI_APP_URL / RENDER_EXTERNAL_URL).")
        return
    url = settings.webapp_base() + "/webhook"
    await bot.set_webhook(url=url)
    print(f"Вебхук Telegram: {url}")
    print(f"Mini App: {settings.webapp_base()}/")


@asynccontextmanager
async def async_lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    task = asyncio.create_task(setup_webhook_task())
    yield
    task.cancel()
    bot, _dp = _maybe_bot()
    if bot is not None:
        try:
            if settings.is_public_https():
                await bot.delete_webhook()
        except Exception:
            pass
        await bot.session.close()


app = FastAPI(
    title="BetTON API",
    description="P2P-платформа предсказаний на базе LMSR. Mini App открывается с корня /",
    lifespan=async_lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def mini_app():
    return FileResponse(STATIC_DIR / "miniapp.html")


@app.get("/health")
def health():
    return {"status": "ok", "webapp": settings.webapp_base()}


@app.post("/webhook")
async def telegram_webhook(request: Request):
    from aiogram import types

    bot, dp = _maybe_bot()
    if bot is None or dp is None:
        return {"status": "bot_disabled"}
    update = types.Update.model_validate(await request.json(), context={"bot": bot})
    await dp.feed_update(bot, update)
    return {"status": "ok"}


@app.post("/auth/telegram", response_model=UserOut)
def auth_telegram(payload: TelegramAuth, db: Session = Depends(get_db)):
    return market_service.get_or_create_telegram_user(
        db, telegram_id=payload.telegram_id, username=payload.username
    )


@app.post("/users", response_model=UserOut, status_code=201)
def create_user_endpoint(user_in: UserCreate, db: Session = Depends(get_db)):
    return market_service.create_user(db, username=user_in.username, telegram_id=user_in.telegram_id)


@app.get("/users/{user_id}", response_model=UserOut)
def get_user_endpoint(user_id: int, db: Session = Depends(get_db)):
    return market_service.get_user(db, user_id)


@app.post("/markets", response_model=MarketOut)
def create_market_endpoint(market_in: MarketCreate, db: Session = Depends(get_db)):
    market = market_service.create_market(
        db,
        creator_id=market_in.creator_id,
        question=market_in.question,
        b=market_in.b,
        description=market_in.description or "",
    )
    return market_service.market_to_out(market)


@app.get("/markets", response_model=list[MarketOut])
def list_markets_endpoint(db: Session = Depends(get_db)):
    return [market_service.market_to_out(m) for m in market_service.list_markets(db)]


@app.get("/markets/{market_id}", response_model=MarketOut)
def get_market_endpoint(market_id: int, db: Session = Depends(get_db)):
    return market_service.market_to_out(market_service.get_market(db, market_id))


@app.post("/markets/{market_id}/buy")
def buy_shares_endpoint(market_id: int, req: BuySharesRequest, db: Session = Depends(get_db)):
    res = market_service.buy_shares(
        db,
        market_id=market_id,
        user_id=req.user_id,
        outcome=req.outcome,
        money=req.money,
    )
    return {
        "market": market_service.market_to_out(res["market"]),
        "shares": res["shares"],
        "paid": res["paid"],
        "prices": res["prices"],
        "balance": res["user"].balance,
    }


@app.post("/markets/{market_id}/resolve", response_model=MarketOut)
def resolve_market_endpoint(market_id: int, req: ResolveRequest, db: Session = Depends(get_db)):
    market = market_service.resolve_market(db, market_id, req.winning_outcome)
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/claim")
def claim_winnings_endpoint(market_id: int, req: ClaimWinningsRequest, db: Session = Depends(get_db)):
    return market_service.claim_winnings(
        db,
        market_id=market_id,
        user_id=req.user_id,
        tip_rate=req.tip_rate,
    )
