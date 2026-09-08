import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import ensure_schema, get_db
from app.models import MarketStatus
from app.schemas import (
    BuySharesRequest,
    ClaimWinningsRequest,
    CloseMarketRequest,
    CollectResidualRequest,
    MarketCreate,
    MarketOut,
    PositionOut,
    QuoteOut,
    QuoteRequest,
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
    ensure_schema()
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


def _validation_detail_ru(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Некорректный запрос"
    err = errors[0]
    loc = [str(x) for x in err.get("loc", ()) if x not in {"body", "query", "path"}]
    field = loc[-1] if loc else ""
    labels = {
        "money": "сумма",
        "outcome": "исход",
        "question": "вопрос",
        "user_id": "пользователь",
        "winning_outcome": "исход",
        "tip_rate": "чаевые",
        "category": "категория",
        "creator_id": "создатель",
        "status": "статус",
        "lock_ton": "залог",
        "close_at": "конец приёма",
        "outcomes": "исходы",
    }
    label = labels.get(field, field)
    msg = str(err.get("msg", "")).lower()
    if "required" in msg:
        return f"Не указано: {label}" if label else "Не указано обязательное поле"
    if "greater than" in msg or "greater_than" in msg:
        return f"Значение «{label}» должно быть больше минимума" if label else "Значение слишком маленькое"
    if "less than" in msg:
        return "Чаевые не больше 1%"
    if field == "category":
        return "Категория: sport, politics или unique"
    if field in {"outcome", "winning_outcome"}:
        return "Укажите исход по имени или индексу"
    if field == "status":
        return "Статус: open, closed или resolved"
    if field == "close_at":
        return "Укажите дату и время конца приёма"
    return "Некорректный запрос"


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"detail": _validation_detail_ru(exc)})


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


@app.get("/users/{user_id}/positions", response_model=list[PositionOut])
def list_user_positions_endpoint(user_id: int, db: Session = Depends(get_db)):
    return market_service.list_positions_out(db, user_id)


@app.post("/markets", response_model=MarketOut)
def create_market_endpoint(market_in: MarketCreate, db: Session = Depends(get_db)):
    market = market_service.create_market(
        db,
        creator_id=market_in.creator_id,
        question=market_in.question,
        description=market_in.description or "",
        category=market_in.category,
        outcomes=market_in.outcomes,
        lock_ton=market_in.lock_ton,
        close_at=market_in.close_at,
        target_odds=market_in.target_odds,
        target_probs=market_in.target_probs,
    )
    return market_service.market_to_out(market)


@app.get("/markets", response_model=list[MarketOut])
def list_markets_endpoint(
    category: str | None = None,
    status: MarketStatus | None = None,
    db: Session = Depends(get_db),
):
    cat = (category or "").strip() or None
    return [
        market_service.market_to_out(m)
        for m in market_service.list_markets(db, category=cat, status=status)
    ]


@app.get("/markets/{market_id}", response_model=MarketOut)
def get_market_endpoint(market_id: int, db: Session = Depends(get_db)):
    return market_service.market_to_out(market_service.get_market(db, market_id))


@app.post("/markets/{market_id}/quote", response_model=QuoteOut)
def quote_endpoint(market_id: int, req: QuoteRequest, db: Session = Depends(get_db)):
    return market_service.quote_buy(db, market_id, req.outcome, req.money)


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
        "outcome": res["outcome"],
    }


@app.post("/markets/{market_id}/close", response_model=MarketOut)
def close_market_endpoint(market_id: int, req: CloseMarketRequest, db: Session = Depends(get_db)):
    market = market_service.close_market(db, market_id, user_id=req.user_id)
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/resolve", response_model=MarketOut)
def resolve_market_endpoint(market_id: int, req: ResolveRequest, db: Session = Depends(get_db)):
    market = market_service.resolve_market(
        db, market_id, req.winning_outcome, user_id=req.user_id
    )
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/collect-residual")
def collect_residual_endpoint(
    market_id: int, req: CollectResidualRequest, db: Session = Depends(get_db)
):
    return market_service.collect_residual(db, market_id, user_id=req.user_id)


@app.post("/markets/{market_id}/claim")
def claim_winnings_endpoint(market_id: int, req: ClaimWinningsRequest, db: Session = Depends(get_db)):
    return market_service.claim_winnings(
        db,
        market_id=market_id,
        user_id=req.user_id,
        tip_rate=req.tip_rate,
    )
