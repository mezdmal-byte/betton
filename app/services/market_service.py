from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.lmsr import YES, apply_buy, cost, max_tip, outcome_index, prices
from app.models import Market, MarketStatus, Outcome, Position, Trade, User
from app.schemas import MarketOut


def _quantities(market: Market) -> list[float]:
    return [market.q_yes, market.q_no]


def market_to_out(market: Market) -> MarketOut:
    q = _quantities(market)
    p = prices(q, market.b)
    return MarketOut(
        id=market.id,
        question=market.question,
        description=market.description,
        creator_id=market.creator_id,
        b=market.b,
        q_yes=market.q_yes,
        q_no=market.q_no,
        price_yes=p[0],
        price_no=p[1],
        cost_c=cost(q, market.b),
        status=market.status,
        winning_outcome=market.winning_outcome,
        created_at=market.created_at,
    )


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


def create_user(db: Session, username: str, telegram_id: int | None = None) -> User:
    user = User(
        username=username,
        telegram_id=telegram_id,
        balance=settings.starting_balance,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_telegram_user(
    db: Session,
    telegram_id: int,
    username: str | None = None,
) -> User:
    user = db.query(User).filter(User.telegram_id == telegram_id).one_or_none()
    if user is not None:
        return user
    uname = f"tg{telegram_id}"
    existing = db.query(User).filter(User.username == uname).one_or_none()
    if existing is not None:
        if existing.telegram_id is None:
            existing.telegram_id = telegram_id
            db.commit()
            db.refresh(existing)
        return existing
    _ = username
    return create_user(db, username=uname, telegram_id=telegram_id)


def create_market(
    db: Session,
    creator_id: int,
    question: str,
    b: float,
    description: str = "",
) -> Market:
    creator = get_user(db, creator_id)
    if b <= 0:
        raise HTTPException(status_code=400, detail="b должен быть > 0")
    market = Market(
        question=question,
        description=description,
        creator_id=creator.id,
        b=b,
        q_yes=0.0,
        q_no=0.0,
        status=MarketStatus.open,
    )
    db.add(market)
    db.commit()
    db.refresh(market)
    return market


def list_markets(db: Session) -> list[Market]:
    return db.query(Market).order_by(Market.id.desc()).all()


def get_market(db: Session, market_id: int) -> Market:
    market = db.get(Market, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Рынок не найден")
    return market


def _get_or_create_position(db: Session, user_id: int, market_id: int) -> Position:
    position = (
        db.query(Position)
        .filter(Position.user_id == user_id, Position.market_id == market_id)
        .one_or_none()
    )
    if position is None:
        position = Position(user_id=user_id, market_id=market_id)
        db.add(position)
        db.flush()
    return position


def buy_shares(db: Session, market_id: int, user_id: int, outcome: Outcome, money: float):
    market = get_market(db, market_id)
    if market.status != MarketStatus.open:
        raise HTTPException(status_code=400, detail="Рынок закрыт")
    user = get_user(db, user_id)
    if money <= 0:
        raise HTTPException(status_code=400, detail="Сумма ставки должна быть > 0")
    if user.balance < money:
        raise HTTPException(status_code=400, detail="Недостаточно средств")

    idx = outcome_index(outcome.value)
    new_q, shares, paid = apply_buy(_quantities(market), market.b, idx, money)

    user.balance -= paid
    market.q_yes, market.q_no = new_q
    position = _get_or_create_position(db, user.id, market.id)
    if idx == YES:
        position.shares_yes += shares
        position.cost_yes += paid
    else:
        position.shares_no += shares
        position.cost_no += paid

    p = prices(new_q, market.b)
    trade = Trade(
        user_id=user.id,
        market_id=market.id,
        outcome=outcome,
        money=paid,
        shares=shares,
        price_after=p[idx],
    )
    db.add(trade)
    db.commit()
    db.refresh(user)
    db.refresh(market)
    return {
        "market": market,
        "user": user,
        "shares": shares,
        "paid": paid,
        "prices": p,
    }


def resolve_market(db: Session, market_id: int, winning_outcome: Outcome) -> Market:
    market = get_market(db, market_id)
    if market.status != MarketStatus.open:
        raise HTTPException(status_code=400, detail="Рынок уже разрешён")
    market.status = MarketStatus.resolved
    market.winning_outcome = winning_outcome
    market.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(market)
    return market


def claim_winnings(db: Session, market_id: int, user_id: int, tip_rate: float = 0.0):
    market = get_market(db, market_id)
    if market.status != MarketStatus.resolved or market.winning_outcome is None:
        raise HTTPException(status_code=400, detail="Рынок ещё не разрешён")
    if tip_rate < 0 or tip_rate > settings.tip_cap:
        raise HTTPException(
            status_code=400,
            detail=f"Чаевые не больше {settings.tip_cap:.0%} чистой прибыли",
        )

    user = get_user(db, user_id)
    position = (
        db.query(Position)
        .filter(Position.user_id == user_id, Position.market_id == market_id)
        .one_or_none()
    )
    if position is None:
        raise HTTPException(status_code=404, detail="Позиция не найдена")
    if position.claimed:
        raise HTTPException(status_code=400, detail="Выигрыш уже получен")

    if market.winning_outcome == Outcome.yes:
        winning_shares = position.shares_yes
        cost_basis = position.cost_yes
    else:
        winning_shares = position.shares_no
        cost_basis = position.cost_no

    payout = winning_shares  # 1 единица валюты за акцию победившего исхода
    net_profit = payout - cost_basis
    tip = min(max_tip(net_profit, settings.tip_cap), max(0.0, net_profit) * tip_rate)
    credited = payout - tip

    user.balance += credited
    position.claimed = True
    position.tip_paid = tip
    db.commit()
    db.refresh(user)
    return {
        "payout": payout,
        "net_profit": net_profit,
        "tip": tip,
        "credited": credited,
        "balance": user.balance,
    }
