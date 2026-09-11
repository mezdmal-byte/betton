import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import ensure_schema, get_db, assert_money_ready
from app.models import MarketStatus, User
from app.telegram_auth import get_current_user, get_optional_user
from app.schemas import (
    BuySharesRequest,
    ClaimWinningsRequest,
    CloseMarketRequest,
    CollectResidualRequest,
    CancelMarketRequest,
    MarketCreate,
    MarketOut,
    PositionOut,
    QuoteOut,
    QuoteRequest,
    ResolveRequest,
    RejectMarketRequest,
    OrderRequest,
    OrderPreviewRequest,
    P2PReconciliationOut,
    SettlementOut,
    UserOut,
)
from app.services import market_service, p2p_service
from app.services import p2p_ledger

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


async def expire_orders_task():
    while True:
        try:
            await asyncio.to_thread(p2p_service.expire_due_orders)
        except Exception:
            logging.getLogger(__name__).exception("P2P expiration failed")
        await asyncio.sleep(15)


@asynccontextmanager
async def async_lifespan(app: FastAPI):
    ensure_schema()
    assert_money_ready()
    task = asyncio.create_task(setup_webhook_task())
    expiry = asyncio.create_task(expire_orders_task())
    yield
    task.cancel()
    expiry.cancel()
    await asyncio.gather(expiry, return_exceptions=True)
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
    description="P2P-заявки для новых событий, LMSR для прежних рынков. Mini App открывается с корня /",
    lifespan=async_lifespan,
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

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
        "reason": "причина",
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
        return "Статус: open, closed, resolved или cancelled"
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
def auth_telegram(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/users", response_model=UserOut)
def create_user_endpoint(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/users/{user_id}", response_model=UserOut)
def get_user_endpoint(user_id: int, current_user: User = Depends(get_current_user)):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return current_user


@app.get("/users/{user_id}/positions", response_model=list[PositionOut])
def list_user_positions_endpoint(
    user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return market_service.list_positions_out(db, current_user.id)


@app.get("/users/{user_id}/settlements", response_model=list[SettlementOut])
def list_user_settlements_endpoint(
    user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return market_service.list_settlements_out(db, current_user.id)


@app.get("/users/{user_id}/markets", response_model=list[MarketOut])
def list_created_markets_endpoint(
    user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return [market_service.market_to_out(m) for m in market_service.list_created_markets(db, user_id)]


@app.get("/moderation/markets", response_model=list[MarketOut])
def moderation_queue_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [market_service.market_to_out(m) for m in market_service.list_pending_markets(db, current_user)]


@app.post("/markets/{market_id}/approve", response_model=MarketOut)
def approve_market_endpoint(market_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return market_service.market_to_out(market_service.moderate_market(db, market_id, current_user.id))


@app.post("/markets/{market_id}/reject", response_model=MarketOut)
def reject_market_endpoint(market_id: int, req: RejectMarketRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return market_service.market_to_out(market_service.moderate_market(db, market_id, current_user.id, reason=req.reason))


@app.post("/markets", response_model=MarketOut)
def create_market_endpoint(
    market_in: MarketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if market_in.mechanism == "p2p":
        return market_service.market_to_out(p2p_service.create_market(db, current_user.id, market_in))
    market = market_service.create_market(
        db,
        creator_id=current_user.id,
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


def _markets_to_out(db: Session, markets) -> list[MarketOut]:
    offers = p2p_service.best_offers_map(db, markets)
    return [market_service.market_to_out(m, best_offers=offers.get(m.id)) for m in markets]


@app.get("/markets", response_model=list[MarketOut])
def list_markets_endpoint(
    category: str | None = None,
    status: MarketStatus | None = None,
    db: Session = Depends(get_db),
):
    cat = (category or "").strip() or None
    return _markets_to_out(db, market_service.list_markets(db, category=cat, status=status))


@app.get("/markets/{market_id}", response_model=MarketOut)
def get_market_endpoint(market_id: int, db: Session = Depends(get_db)):
    market = market_service.get_market(db, market_id)
    if market.status in (MarketStatus.pending, MarketStatus.rejected):
        raise HTTPException(status_code=404, detail="Рынок не найден")
    offers = p2p_service.best_offers_map(db, [market])
    return market_service.market_to_out(market, best_offers=offers.get(market.id))


@app.post("/markets/{market_id}/quote", response_model=QuoteOut)
def quote_endpoint(market_id: int, req: QuoteRequest, db: Session = Depends(get_db)):
    return market_service.quote_buy(db, market_id, req.outcome, req.money)


@app.post("/markets/{market_id}/buy")
def buy_shares_endpoint(
    market_id: int,
    req: BuySharesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    res = market_service.buy_shares(
        db,
        market_id=market_id,
        user_id=current_user.id,
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
def close_market_endpoint(
    market_id: int,
    req: CloseMarketRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = req
    market_service.require_admin(current_user, "Только админ может остановить приём ставок")
    market = market_service.close_market(db, market_id, user_id=current_user.id)
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/cancel", response_model=MarketOut)
def cancel_market_endpoint(
    market_id: int,
    req: CancelMarketRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    market_service.require_admin(current_user, "Только админ может отменить событие")
    market = p2p_service.void_market(db, market_id, current_user.id, req.reason)
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/resolve", response_model=MarketOut)
def resolve_market_endpoint(
    market_id: int,
    req: ResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    market_service.require_admin(current_user)
    market = market_service.resolve_market(
        db, market_id, req.winning_outcome, user_id=current_user.id
    )
    return market_service.market_to_out(market)


@app.post("/markets/{market_id}/collect-residual")
def collect_residual_endpoint(
    market_id: int,
    req: CollectResidualRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _ = req
    market_service.require_admin(current_user, "Только админ может забрать остаток залога")
    return market_service.collect_residual(db, market_id, user_id=current_user.id)


@app.post("/markets/{market_id}/claim")
def claim_winnings_endpoint(
    market_id: int,
    req: ClaimWinningsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return market_service.claim_winnings(
        db,
        market_id=market_id,
        user_id=current_user.id,
        tip_rate=req.tip_rate,
    )


@app.get("/markets/{market_id}/p2p-reconciliation", response_model=P2PReconciliationOut)
def p2p_reconciliation_endpoint(
    market_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    market_service.require_admin(current_user, "Только админ может сверять журнал P2P")
    return p2p_ledger.reconcile(db, market_id)


@app.get("/markets/{market_id}/orderbook")
def orderbook_endpoint(
    market_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    viewer_id = current_user.id if current_user is not None else None
    return p2p_service.book(db, market_id, viewer_id=viewer_id)


@app.post("/markets/{market_id}/orders/quote")
def order_quote_endpoint(market_id: int, req: OrderPreviewRequest,
                         current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return p2p_service.preview(db, market_id, current_user.id, req.outcome, req.money, req.odds)


@app.post("/markets/{market_id}/orders")
def place_order_endpoint(market_id: int, req: OrderRequest,
                         current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return p2p_service.place(db, market_id, current_user.id, req.outcome, req.money, req.odds, req.kind, req.request_id)


@app.post("/orders/{order_id}/cancel")
def cancel_order_endpoint(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return p2p_service.cancel(db, order_id, current_user.id)


@app.get("/users/{user_id}/orders")
def list_orders_endpoint(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user_id != current_user.id:
        raise HTTPException(403, "Недостаточно прав")
    return p2p_service.list_orders(db, user_id)
