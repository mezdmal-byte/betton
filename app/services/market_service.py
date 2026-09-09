import math
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import ADMIN_BANKROLL, TIP_CREATOR_SHARE, TIP_PLATFORM_SHARE, settings
from app.lmsr import apply_buy, cost, max_tip, prices
from app.models import Market, MarketStatus, Position, SettlementRecord, Trade, User
from app.schemas import MarketOut, PositionOut, QuoteOut, SettlementOut

ALLOWED_CATEGORIES = ("sport", "politics", "unique")
MIN_LOCK_TON = 10.0
MIN_OUTCOMES = 2
MAX_OUTCOMES = 8
SETTLEMENT_EPS = 1e-9
SETTLEMENT_AUTO = "auto"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _naive_utc(dt: datetime) -> datetime:
    aware = as_utc(dt)
    assert aware is not None
    return aware.replace(tzinfo=None)


def market_outcomes(market: Market) -> list[str]:
    raw = market.outcomes or []
    names = [str(x).strip() for x in raw if str(x).strip()]
    if len(names) >= 2:
        return names
    return ["Да", "Нет"]


def _quantities(market: Market) -> list[float]:
    names = market_outcomes(market)
    raw = market.q or []
    if isinstance(raw, list) and len(raw) == len(names):
        return [float(x) for x in raw]
    if len(names) == 2:
        return [float(market.q_yes or 0.0), float(market.q_no or 0.0)]
    return [0.0] * len(names)


def _set_quantities(market: Market, q: list[float]) -> None:
    market.q = [float(x) for x in q]
    if len(q) >= 1:
        market.q_yes = float(q[0])
    if len(q) >= 2:
        market.q_no = float(q[1])


def _pos_vectors(position: Position, n: int) -> tuple[list[float], list[float]]:
    shares = [float(x) for x in (position.shares or [])]
    costs = [float(x) for x in (position.costs or [])]
    if len(shares) != n:
        shares = [0.0] * n
        if n >= 1:
            shares[0] = float(position.shares_yes or 0.0)
        if n >= 2:
            shares[1] = float(position.shares_no or 0.0)
    if len(costs) != n:
        costs = [0.0] * n
        if n >= 1:
            costs[0] = float(position.cost_yes or 0.0)
        if n >= 2:
            costs[1] = float(position.cost_no or 0.0)
    while len(shares) < n:
        shares.append(0.0)
    while len(costs) < n:
        costs.append(0.0)
    return shares[:n], costs[:n]


def _set_pos_vectors(position: Position, shares: list[float], costs: list[float]) -> None:
    position.shares = [float(x) for x in shares]
    position.costs = [float(x) for x in costs]
    if len(shares) >= 1:
        position.shares_yes = float(shares[0])
        position.cost_yes = float(costs[0]) if costs else 0.0
    if len(shares) >= 2:
        position.shares_no = float(shares[1])
        position.cost_no = float(costs[1]) if len(costs) > 1 else 0.0


def parse_outcome(outcomes: list[str], ref) -> int:
    if isinstance(ref, bool):
        raise HTTPException(status_code=400, detail="Неизвестный исход")
    if isinstance(ref, int):
        if 0 <= ref < len(outcomes):
            return ref
        raise HTTPException(status_code=400, detail="Неизвестный исход")
    text = str(ref).strip()
    low = text.lower()
    for i, name in enumerate(outcomes):
        if name.strip().lower() == low:
            return i
    if text.isdigit() or (text.startswith("-") and text[1:].isdigit()):
        return parse_outcome(outcomes, int(text))
    aliases = {"yes": 0, "да": 0, "true": 0, "no": 1, "нет": 1, "false": 1}
    if low in aliases and aliases[low] < len(outcomes):
        return aliases[low]
    raise HTTPException(status_code=400, detail="Неизвестный исход")


def winning_name(market: Market) -> str | None:
    raw = market.winning_outcome
    if raw is None or raw == "":
        return None
    value = raw.value if hasattr(raw, "value") else str(raw)
    names = market_outcomes(market)
    if value in ("yes", "Outcome.yes") and names:
        return names[0]
    if value in ("no", "Outcome.no") and len(names) > 1:
        return names[1]
    return value


def _maybe_auto_close(market: Market) -> bool:
    if market.status != MarketStatus.open:
        return False
    close_at = as_utc(market.close_at)
    if close_at is None:
        return False
    if utcnow() >= close_at:
        market.status = MarketStatus.closed
        return True
    return False


def is_accepting_bets(market: Market) -> bool:
    if market.status != MarketStatus.open:
        return False
    close_at = as_utc(market.close_at)
    if close_at is not None and utcnow() >= close_at:
        return False
    return True


def require_accepting(market: Market) -> None:
    _maybe_auto_close(market)
    if not is_accepting_bets(market):
        raise HTTPException(status_code=400, detail="Приём ставок закрыт")


def require_admin(user: User, message: str = "Только админ может рассчитать событие") -> None:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail=message)


def find_admin_user(db: Session) -> User | None:
    admin_id = settings.admin_tg_id()
    if admin_id is None:
        return None
    return db.query(User).filter(User.telegram_id == admin_id).one_or_none()


def _is_sqlite(db: Session) -> bool:
    return db.get_bind().dialect.name == "sqlite"


def _lock_market(db: Session, market_id: int) -> Market:
    if _is_sqlite(db):
        db.execute(text("UPDATE markets SET question = question WHERE id = :id"), {"id": market_id})
        market = db.get(Market, market_id)
    else:
        market = (
            db.query(Market)
            .filter(Market.id == market_id)
            .with_for_update()
            .one_or_none()
        )
    if market is None:
        raise HTTPException(status_code=404, detail="Рынок не найден")
    db.refresh(market)
    return market


def _lock_users(db: Session, user_ids: list[int]) -> None:
    ids = sorted({int(uid) for uid in user_ids if uid is not None})
    if not ids:
        return
    if _is_sqlite(db):
        for uid in ids:
            db.execute(text("UPDATE users SET balance = balance WHERE id = :id"), {"id": uid})
        return
    (
        db.query(User)
        .filter(User.id.in_(ids))
        .order_by(User.id)
        .with_for_update()
        .all()
    )


def _adjust_balance(
    db: Session,
    user_id: int,
    delta: float,
    *,
    require_funds: bool = False,
    funds_detail: str = "Недостаточно средств",
) -> None:
    if not math.isfinite(delta) or abs(delta) <= SETTLEMENT_EPS:
        return
    if require_funds and delta < 0:
        result = db.execute(
            text(
                "UPDATE users SET balance = balance + :delta "
                "WHERE id = :id AND balance >= :need"
            ),
            {"delta": delta, "id": user_id, "need": -delta},
        )
        if result.rowcount != 1:
            raise HTTPException(status_code=400, detail=funds_detail)
        user = db.get(User, user_id)
        if user is not None:
            db.expire(user)
        return
    result = db.execute(
        text("UPDATE users SET balance = balance + :delta WHERE id = :id"),
        {"delta": delta, "id": user_id},
    )
    if result.rowcount != 1:
        raise HTTPException(status_code=400, detail="Не удалось зачислить средства")
    user = db.get(User, user_id)
    if user is not None:
        db.expire(user)


def _near_zero(value: float) -> bool:
    return abs(value) <= SETTLEMENT_EPS


def q_from_target_probs(probs: list[float], b: float) -> list[float]:
    cleaned = [max(1e-12, float(p)) for p in probs]
    total = sum(cleaned)
    if total <= 0:
        raise HTTPException(status_code=400, detail="Сумма вероятностей должна быть > 0")
    norm = [p / total for p in cleaned]
    return [b * math.log(p) for p in norm]


def _normalize_outcomes(raw: list[str] | None) -> list[str]:
    names = [str(x).strip() for x in (raw or []) if str(x).strip()]
    if len(names) < MIN_OUTCOMES:
        raise HTTPException(status_code=400, detail="Нужно минимум два исхода")
    if len(names) > MAX_OUTCOMES:
        raise HTTPException(status_code=400, detail="Максимум 8 исходов")
    seen: set[str] = set()
    for name in names:
        key = name.lower()
        if key in seen:
            raise HTTPException(status_code=400, detail="Имена исходов должны быть уникальными")
        seen.add(key)
    return names


def _probs_from_create(
    n: int,
    target_odds: list[float] | None,
    target_probs: list[float] | None,
) -> list[float]:
    if target_probs:
        if len(target_probs) != n:
            raise HTTPException(status_code=400, detail="Число вероятностей должно совпадать с исходами")
        cleaned = [max(1e-12, float(p)) for p in target_probs]
        total = sum(cleaned)
        if total <= 0:
            raise HTTPException(status_code=400, detail="Сумма вероятностей должна быть > 0")
        return [p / total for p in cleaned]
    if target_odds:
        if len(target_odds) != n:
            raise HTTPException(status_code=400, detail="Число коэффициентов должно совпадать с исходами")
        inv = []
        for k in target_odds:
            if not math.isfinite(k) or k <= 1:
                raise HTTPException(status_code=400, detail="Коэффициент каждого исхода должен быть > 1")
            inv.append(1.0 / float(k))
        total = sum(inv)
        return [x / total for x in inv]
    return [1.0 / n] * n


def market_to_out(market: Market) -> MarketOut:
    _maybe_auto_close(market)
    names = market_outcomes(market)
    q = _quantities(market)
    p = prices(q, market.b)
    odds = [(1.0 / pi) if pi > 0 else 0.0 for pi in p]
    win = winning_name(market)
    return MarketOut(
        id=market.id,
        question=market.question,
        description=market.description or "",
        creator_id=market.creator_id,
        category=market.category or "unique",
        b=market.b,
        q=q,
        outcomes=names,
        prices=p,
        odds=odds,
        lock_ton=float(market.lock_ton or 0.0),
        pot=float(market.pot or 0.0),
        close_at=as_utc(market.close_at),
        q_yes=q[0] if q else 0.0,
        q_no=q[1] if len(q) > 1 else 0.0,
        price_yes=p[0] if p else 0.0,
        price_no=p[1] if len(p) > 1 else 0.0,
        cost_c=cost(q, market.b),
        status=market.status,
        winning_outcome=win,
        created_at=market.created_at,
        accepting_bets=is_accepting_bets(market),
        settlement_kind=market.settlement_kind,
    )


def get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


def create_user(db: Session, username: str, telegram_id: int | None = None) -> User:
    start = ADMIN_BANKROLL if settings.is_admin_telegram(telegram_id) else settings.starting_balance
    user = User(username=username, telegram_id=telegram_id, balance=start)
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
    _ = username
    uname = f"tg{telegram_id}"
    # Never attach Telegram to an existing account by username match alone.
    while db.query(User).filter(User.username == uname).one_or_none() is not None:
        uname = f"tg{telegram_id}_{uuid.uuid4().hex[:8]}"
    return create_user(db, username=uname, telegram_id=telegram_id)


def _normalize_category(category: str | None) -> str:
    cat = (category or "unique").strip().lower()
    if cat not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail="Категория должна быть sport, politics или unique",
        )
    return cat


def create_market(
    db: Session,
    creator_id: int,
    question: str,
    description: str = "",
    category: str = "unique",
    outcomes: list[str] | None = None,
    lock_ton: float = 50.0,
    close_at: datetime | None = None,
    target_odds: list[float] | None = None,
    target_probs: list[float] | None = None,
    b: float | None = None,
) -> Market:
    creator = get_user(db, creator_id)
    names = _normalize_outcomes(outcomes)
    if lock_ton < MIN_LOCK_TON:
        raise HTTPException(status_code=400, detail="Залог не меньше 10 TON")
    if close_at is None:
        raise HTTPException(status_code=400, detail="Укажите время конца приёма ставок")
    close_utc = as_utc(close_at)
    if close_utc is None or close_utc <= utcnow():
        raise HTTPException(status_code=400, detail="Конец приёма не может быть в прошлом")

    n = len(names)
    liquidity = float(lock_ton) / math.log(n)
    if b is not None and b > 0 and abs(b - liquidity) < 1e-9:
        liquidity = float(b)
    if liquidity <= 0 or not math.isfinite(liquidity):
        raise HTTPException(status_code=400, detail="Некорректный залог для расчёта глубины")

    probs = _probs_from_create(n, target_odds, target_probs)
    q = q_from_target_probs(probs, liquidity)

    _lock_users(db, [creator.id])
    _adjust_balance(
        db,
        creator.id,
        -float(lock_ton),
        require_funds=True,
        funds_detail="Недостаточно TON на залог",
    )
    market = Market(
        question=question,
        description=description,
        creator_id=creator.id,
        category=_normalize_category(category),
        b=liquidity,
        outcomes=names,
        lock_ton=float(lock_ton),
        pot=float(lock_ton),
        close_at=_naive_utc(close_utc),
        lock_returned=False,
        status=MarketStatus.open,
    )
    _set_quantities(market, q)
    db.add(market)
    db.commit()
    db.refresh(market)
    return market


def list_markets(
    db: Session,
    category: str | None = None,
    status: MarketStatus | None = None,
) -> list[Market]:
    query = db.query(Market)
    if category:
        query = query.filter(Market.category == _normalize_category(category))
    rows = query.order_by(Market.id.desc()).all()
    changed = False
    for market in rows:
        if _maybe_auto_close(market):
            changed = True
    if changed:
        db.commit()
    if status is not None:
        rows = [m for m in rows if m.status == status]
    return rows


def get_market(db: Session, market_id: int) -> Market:
    market = db.get(Market, market_id)
    if market is None:
        raise HTTPException(status_code=404, detail="Рынок не найден")
    if _maybe_auto_close(market):
        db.commit()
        db.refresh(market)
    return market


def _get_or_create_position(db: Session, user_id: int, market_id: int, n: int) -> Position:
    position = (
        db.query(Position)
        .filter(Position.user_id == user_id, Position.market_id == market_id)
        .one_or_none()
    )
    if position is None:
        position = Position(user_id=user_id, market_id=market_id)
        db.add(position)
        db.flush()
        _set_pos_vectors(position, [0.0] * n, [0.0] * n)
    return position


def buy_shares(db: Session, market_id: int, user_id: int, outcome, money: float):
    market = _lock_market(db, market_id)
    if _maybe_auto_close(market):
        db.flush()
    require_accepting(market)
    get_user(db, user_id)
    if money <= 0:
        raise HTTPException(status_code=400, detail="Сумма ставки должна быть > 0")

    names = market_outcomes(market)
    idx = parse_outcome(names, outcome)
    new_q, shares, paid = apply_buy(_quantities(market), market.b, idx, money)

    _lock_users(db, [user_id])
    _adjust_balance(db, user_id, -paid, require_funds=True)
    market.pot = float(market.pot or 0.0) + paid
    _set_quantities(market, new_q)
    position = _get_or_create_position(db, user_id, market.id, len(names))
    pos_shares, pos_costs = _pos_vectors(position, len(names))
    pos_shares[idx] += shares
    pos_costs[idx] += paid
    _set_pos_vectors(position, pos_shares, pos_costs)

    p = prices(new_q, market.b)
    trade = Trade(
        user_id=user_id,
        market_id=market.id,
        outcome=names[idx],
        money=paid,
        shares=shares,
        price_after=p[idx],
    )
    db.add(trade)
    db.commit()
    user = get_user(db, user_id)
    db.refresh(market)
    return {
        "market": market,
        "user": user,
        "shares": shares,
        "paid": paid,
        "prices": p,
        "outcome": names[idx],
        "outcome_index": idx,
    }


def quote_buy(db: Session, market_id: int, outcome, money: float) -> QuoteOut:
    market = get_market(db, market_id)
    require_accepting(market)
    if money <= 0:
        raise HTTPException(status_code=400, detail="Сумма ставки должна быть > 0")
    names = market_outcomes(market)
    idx = parse_outcome(names, outcome)
    _new_q, shares, paid = apply_buy(_quantities(market), market.b, idx, money)
    avg_price = (paid / shares) if shares > 0 else 0.0
    odds = (shares / paid) if paid > 0 and shares > 0 else 0.0
    return QuoteOut(
        shares=shares,
        avg_price=avg_price,
        odds=odds,
        outcome=names[idx],
        outcome_index=idx,
    )


def list_positions_out(db: Session, user_id: int) -> list[PositionOut]:
    get_user(db, user_id)
    rows = (
        db.query(Position)
        .filter(Position.user_id == user_id)
        .order_by(Position.id.desc())
        .all()
    )
    result: list[PositionOut] = []
    for pos in rows:
        market = get_market(db, pos.market_id)
        n = len(market_outcomes(market))
        shares, costs = _pos_vectors(pos, n)
        result.append(
            PositionOut(
                market_id=pos.market_id,
                shares=shares,
                costs=costs,
                shares_yes=shares[0] if shares else 0.0,
                shares_no=shares[1] if len(shares) > 1 else 0.0,
                cost_yes=costs[0] if costs else 0.0,
                cost_no=costs[1] if len(costs) > 1 else 0.0,
                claimed=pos.claimed,
                tip_paid=pos.tip_paid,
                market=market_to_out(market),
            )
        )
    return result


def close_market(db: Session, market_id: int, user_id: int) -> Market:
    actor = get_user(db, user_id)
    require_admin(actor, "Только админ может остановить приём ставок")
    market = _lock_market(db, market_id)
    _maybe_auto_close(market)
    if market.status == MarketStatus.resolved:
        raise HTTPException(status_code=400, detail="Рынок уже рассчитан")
    market.status = MarketStatus.closed
    db.commit()
    db.refresh(market)
    return market


def _player_payout(shares: list[float], costs: list[float], names: list[str], win_idx: int) -> dict:
    payout = float(shares[win_idx] if win_idx < len(shares) else 0.0)
    stakes_total = float(sum(costs))
    profit = max(0.0, payout - stakes_total)
    tip = max_tip(profit, settings.tip_cap)
    credited = payout - tip
    chosen = [names[i] for i, qty in enumerate(shares) if i < len(names) and qty > SETTLEMENT_EPS]
    return {
        "payout": payout,
        "stakes_total": stakes_total,
        "tip": tip,
        "credited": credited,
        "result": credited - stakes_total,
        "chosen_outcomes": chosen,
    }


def _plan_auto_settlement(db: Session, market: Market, win_idx: int, names: list[str]) -> dict:
    positions = (
        db.query(Position)
        .filter(Position.market_id == market.id)
        .order_by(Position.id)
        .all()
    )
    unpaid = [pos for pos in positions if not pos.claimed]
    payouts_total = 0.0
    player_rows: list[dict] = []
    credits: dict[int, float] = {}
    platform_tips = 0.0
    creator_id = market.creator_id
    creator = get_user(db, creator_id)

    for pos in unpaid:
        shares, costs = _pos_vectors(pos, len(names))
        row = _player_payout(shares, costs, names, win_idx)
        payouts_total += row["payout"]
        player_rows.append({"position": pos, "user_id": pos.user_id, **row})
        if row["credited"] > SETTLEMENT_EPS:
            credits[pos.user_id] = credits.get(pos.user_id, 0.0) + row["credited"]
        tip = row["tip"]
        if tip <= SETTLEMENT_EPS:
            continue
        winner_id = pos.user_id
        if winner_id == creator_id:
            platform_tips += tip
        elif creator.is_admin:
            credits[creator_id] = credits.get(creator_id, 0.0) + tip
        else:
            credits[creator_id] = credits.get(creator_id, 0.0) + tip * TIP_CREATOR_SHARE
            platform_tips += tip * TIP_PLATFORM_SHARE

    pot = float(market.pot or 0.0)
    if payouts_total > pot + SETTLEMENT_EPS:
        raise HTTPException(
            status_code=409,
            detail="Недостаточно средств в банке для выплаты всех выигрышей",
        )

    leftover = pot - payouts_total
    if leftover < -SETTLEMENT_EPS:
        raise HTTPException(
            status_code=409,
            detail="Недостаточно средств в банке для выплаты всех выигрышей",
        )
    if leftover < 0:
        leftover = 0.0

    admin = find_admin_user(db)
    if platform_tips > SETTLEMENT_EPS:
        if admin is None:
            raise HTTPException(
                status_code=409,
                detail="Нет аккаунта платформы для зачисления чаевых",
            )
        credits[admin.id] = credits.get(admin.id, 0.0) + platform_tips

    if leftover > SETTLEMENT_EPS:
        credits[creator_id] = credits.get(creator_id, 0.0) + leftover
    else:
        leftover = 0.0

    return {
        "player_rows": player_rows,
        "credits": credits,
        "leftover": leftover,
        "payouts_total": payouts_total,
        "claimed_ids": {pos.id for pos in unpaid},
        "all_positions": positions,
    }


def resolve_market(db: Session, market_id: int, winning_outcome, user_id: int) -> Market:
    actor = get_user(db, user_id)
    require_admin(actor)
    try:
        market = _lock_market(db, market_id)
        _maybe_auto_close(market)
        if market.status == MarketStatus.resolved:
            raise HTTPException(status_code=400, detail="Рынок уже рассчитан")
        if market.status != MarketStatus.closed:
            raise HTTPException(status_code=400, detail="Сначала остановите приём ставок")

        names = market_outcomes(market)
        idx = parse_outcome(names, winning_outcome)
        plan = _plan_auto_settlement(db, market, idx, names)

        user_ids = sorted(set(plan["credits"]) | {market.creator_id} | {pos.user_id for pos in plan["all_positions"]})
        _lock_users(db, user_ids)
        for uid in sorted(plan["credits"]):
            _adjust_balance(db, uid, plan["credits"][uid])

        resolved_at = _naive_utc(utcnow())
        win_name = names[idx]
        seen_users: set[int] = set()
        for row in plan["player_rows"]:
            pos: Position = row["position"]
            pos.claimed = True
            pos.tip_paid = row["tip"]
            record = SettlementRecord(
                market_id=market.id,
                user_id=pos.user_id,
                question=market.question,
                winning_outcome=win_name,
                chosen_outcomes=row["chosen_outcomes"],
                stakes_total=row["stakes_total"],
                payout=row["payout"],
                tip=row["tip"],
                credited=row["credited"],
                result=row["result"],
                lock_ton=float(market.lock_ton or 0.0) if pos.user_id == market.creator_id else 0.0,
                residual_returned=plan["leftover"] if pos.user_id == market.creator_id else 0.0,
                resolved_at=resolved_at,
            )
            db.add(record)
            seen_users.add(pos.user_id)

        if market.creator_id not in seen_users:
            db.add(
                SettlementRecord(
                    market_id=market.id,
                    user_id=market.creator_id,
                    question=market.question,
                    winning_outcome=win_name,
                    chosen_outcomes=[],
                    stakes_total=0.0,
                    payout=0.0,
                    tip=0.0,
                    credited=0.0,
                    result=0.0,
                    lock_ton=float(market.lock_ton or 0.0),
                    residual_returned=plan["leftover"],
                    resolved_at=resolved_at,
                )
            )

        market.status = MarketStatus.resolved
        market.winning_outcome = win_name
        market.resolved_at = resolved_at
        market.settlement_kind = SETTLEMENT_AUTO
        market.pot = 0.0
        market.lock_returned = True
        db.commit()
        db.refresh(market)
        return market
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


def collect_residual(db: Session, market_id: int, user_id: int) -> dict:
    actor = get_user(db, user_id)
    require_admin(actor, "Только админ может забрать остаток залога")
    market = _lock_market(db, market_id)
    if market.status != MarketStatus.resolved:
        raise HTTPException(status_code=400, detail="Сначала рассчитайте событие")
    if market.settlement_kind == SETTLEMENT_AUTO:
        raise HTTPException(status_code=400, detail="Остаток уже возвращён при расчёте")

    names = market_outcomes(market)
    win = winning_name(market)
    idx = parse_outcome(names, win) if win else 0
    unpaid = 0.0
    for pos in db.query(Position).filter(Position.market_id == market.id).all():
        if pos.claimed:
            continue
        shares, _costs = _pos_vectors(pos, len(names))
        unpaid += float(shares[idx] if win else 0.0)
    leftover = float(market.pot or 0.0) - unpaid
    if leftover <= SETTLEMENT_EPS:
        return {"returned": 0.0, "pot": float(market.pot or 0.0), "balance": get_user(db, market.creator_id).balance}

    try:
        _lock_users(db, [market.creator_id])
        _adjust_balance(db, market.creator_id, leftover)
        market.pot = float(market.pot or 0.0) - leftover
        if _near_zero(market.pot):
            market.pot = 0.0
        market.lock_returned = True
        db.commit()
        creator = get_user(db, market.creator_id)
        return {"returned": leftover, "pot": float(market.pot or 0.0), "balance": creator.balance}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


def _distribute_tip_legacy(db: Session, market: Market, winner: User, tip: float) -> None:
    if tip <= SETTLEMENT_EPS:
        return
    credits: dict[int, float] = {}
    creator = get_user(db, market.creator_id)
    admin = find_admin_user(db)
    if winner.id == creator.id:
        if admin is None:
            raise HTTPException(status_code=409, detail="Нет аккаунта платформы для зачисления чаевых")
        credits[admin.id] = credits.get(admin.id, 0.0) + tip
    elif creator.is_admin:
        credits[creator.id] = credits.get(creator.id, 0.0) + tip
    else:
        credits[creator.id] = credits.get(creator.id, 0.0) + tip * TIP_CREATOR_SHARE
        platform = tip * TIP_PLATFORM_SHARE
        if platform > SETTLEMENT_EPS:
            if admin is None:
                raise HTTPException(
                    status_code=409,
                    detail="Нет аккаунта платформы для зачисления чаевых",
                )
            credits[admin.id] = credits.get(admin.id, 0.0) + platform
    _lock_users(db, list(credits))
    for uid in sorted(credits):
        _adjust_balance(db, uid, credits[uid])


def claim_winnings(db: Session, market_id: int, user_id: int, tip_rate: float = 0.01):
    _ = tip_rate
    market = _lock_market(db, market_id)
    if market.status != MarketStatus.resolved or not winning_name(market):
        raise HTTPException(status_code=400, detail="Рынок ещё не рассчитан")
    if market.settlement_kind == SETTLEMENT_AUTO:
        raise HTTPException(status_code=400, detail="Выигрыш уже зачислен")

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

    names = market_outcomes(market)
    idx = parse_outcome(names, winning_name(market))
    shares, costs = _pos_vectors(position, len(names))
    winning_shares = shares[idx]
    cost_basis = costs[idx]

    payout = float(winning_shares)
    available = max(0.0, float(market.pot or 0.0))
    if payout > available:
        payout = available
    net_profit = payout - cost_basis
    tip = max_tip(net_profit, settings.tip_cap)
    credited = payout - tip
    admin = find_admin_user(db)
    if tip > SETTLEMENT_EPS:
        creator = get_user(db, market.creator_id)
        needs_platform = user.id == creator.id or (
            not creator.is_admin and tip * TIP_PLATFORM_SHARE > SETTLEMENT_EPS
        )
        if needs_platform and admin is None:
            raise HTTPException(status_code=409, detail="Нет аккаунта платформы для зачисления чаевых")
    lock_ids = [user.id, market.creator_id]
    if admin is not None:
        lock_ids.append(admin.id)
    try:
        _lock_users(db, lock_ids)
        _adjust_balance(db, user.id, credited)
        _distribute_tip_legacy(db, market, user, tip)
        market.pot = max(0.0, available - payout)
        position.claimed = True
        position.tip_paid = tip
        db.commit()
        db.refresh(user)
        return {
            "payout": payout,
            "net_profit": net_profit,
            "tip": tip,
            "credited": credited,
            "balance": get_user(db, user.id).balance,
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


def list_settlements_out(db: Session, user_id: int) -> list[SettlementOut]:
    get_user(db, user_id)
    rows = (
        db.query(SettlementRecord)
        .filter(SettlementRecord.user_id == user_id)
        .order_by(SettlementRecord.id.desc())
        .all()
    )
    out: list[SettlementOut] = []
    for row in rows:
        market = db.get(Market, row.market_id)
        kind = market.settlement_kind if market is not None else SETTLEMENT_AUTO
        out.append(
            SettlementOut(
                market_id=row.market_id,
                question=row.question,
                winning_outcome=row.winning_outcome,
                chosen_outcomes=list(row.chosen_outcomes or []),
                stakes_total=float(row.stakes_total or 0.0),
                payout=float(row.payout or 0.0),
                tip=float(row.tip or 0.0),
                credited=float(row.credited or 0.0),
                result=float(row.result or 0.0),
                lock_ton=float(row.lock_ton or 0.0),
                residual_returned=float(row.residual_returned or 0.0),
                resolved_at=as_utc(row.resolved_at),
                is_loss=float(row.result or 0.0) < -SETTLEMENT_EPS or (
                    float(row.payout or 0.0) <= SETTLEMENT_EPS and float(row.stakes_total or 0.0) > SETTLEMENT_EPS
                ),
                settlement_kind=kind,
            )
        )
    return out

