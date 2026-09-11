from app.money import adjust_balance_nano, add_pot_nano
"""Binary, fully funded orders. Stakes use nanoTON integers; price ticks are 1e-6."""
import math
from collections import defaultdict
from decimal import Decimal, InvalidOperation, ROUND_FLOOR

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Market, MarketStatus, P2POrder, P2PFill, Position, SettlementRecord, User
from app.services import market_service as legacy
from app.services import p2p_ledger as ledger

ATOM = 1_000_000_000
PRICE = 1_000_000


def parse_terms(amount, odds):
    try:
        money, k = Decimal(str(amount)), Decimal(str(odds))
        if not money.is_finite() or not k.is_finite() or not Decimal('0.01') <= money <= 1_000_000 or not Decimal('1.00001') <= k <= 10000:
            raise ValueError()
        atomic = money * ATOM
        if atomic != atomic.to_integral_value():
            raise ValueError()
        # Lower price means equal or better odds than the requested minimum.
        tick = int((Decimal(PRICE) / k).to_integral_value(rounding=ROUND_FLOOR))
        return int(atomic), tick
    except (InvalidOperation, ValueError, OverflowError):
        raise HTTPException(400, 'Сумма: 0.01–1000000 TON, до 9 знаков; коэффициент: 1.00001–10000')


def create_market(db, user_id, req):
    names = legacy._normalize_outcomes(req.outcomes)
    if len(names) != 2:
        raise HTTPException(400, 'P2P пока поддерживает ровно два исхода')
    if not 8 <= len(req.question.strip()) <= 512:
        raise HTTPException(400, 'Вопрос должен содержать от 8 до 512 символов')
    if legacy.as_utc(req.close_at) <= legacy.utcnow():
        raise HTTPException(400, 'Конец приёма не может быть в прошлом')
    market = Market(question=req.question.strip(), description=req.description or '',
                    creator_id=user_id, category=req.category, outcomes=names,
                    mechanism='p2p', b=1, q=[0, 0], q_yes=0, q_no=0,
                    lock_ton=0, pot=0, lock_returned=True,
                    close_at=legacy._naive_utc(req.close_at), status=MarketStatus.pending,
                    p2p_journal_coverage=ledger.COVERAGE_FULL)
    db.add(market)
    db.commit()
    db.refresh(market)
    return market


def require_p2p(market):
    if market.mechanism != 'p2p':
        raise HTTPException(409, 'Этот рынок использует LMSR')


def order_out(order):
    return dict(id=order.id, market_id=order.market_id, outcome=order.outcome,
                odds=PRICE/order.price, amount=order.amount/ATOM,
                remaining=order.remaining/ATOM, filled=order.filled/ATOM,
                refunded=order.refunded/ATOM, kind=order.kind, status=order.status,
                request_id=order.request_id, created_at=order.created_at)


def candidates(db, market, outcome, user_id):
    return db.query(P2POrder).filter(
        P2POrder.market_id == market.id, P2POrder.outcome != outcome,
        P2POrder.user_id != user_id, P2POrder.status == 'open',
        P2POrder.remaining > 0).order_by(P2POrder.price.desc(), P2POrder.id).all()


def plan_matches(orders, amount, limit_price):
    remaining = amount
    plan = []
    for maker in orders:
        if maker.price + limit_price < PRICE:
            break
        divisor = math.gcd(maker.price, PRICE)
        maker_lot, taker_lot = maker.price//divisor, (PRICE-maker.price)//divisor
        lots = min(maker.remaining//maker_lot, remaining//taker_lot)
        if not lots:
            continue
        maker_stake, taker_stake = lots*maker_lot, lots*taker_lot
        plan.append((maker, maker_stake, taker_stake))
        remaining -= taker_stake
    return plan, remaining


def preview(db, market_id, user_id, outcome, amount, odds):
    market = legacy.get_market(db, market_id)
    require_p2p(market)
    legacy.require_accepting(market)
    idx = legacy.parse_outcome(legacy.market_outcomes(market), outcome)
    atomic, tick = parse_terms(amount, odds)
    orders = candidates(db, market, idx, user_id)
    plan, remaining = plan_matches(orders, atomic, tick)
    best, best_remaining = plan_matches(orders, atomic, PRICE-1)
    def stats(plan, left):
        spent = atomic-left
        payout = sum(a+b for _, a, b in plan)
        return dict(matched=spent/ATOM, remaining=left/ATOM,
                    payout=payout/ATOM, average_odds=payout/spent if spent else None,
                    worst_odds=min((PRICE/(PRICE-m.price) for m, _, _ in plan), default=None))
    return dict(limit_odds=PRICE/tick, requested=stats(plan, remaining), available=stats(best, best_remaining))


def _refund(db, order, status='cancelled', reason='cancel'):
    if order.remaining:
        leftover = order.remaining
        adjust_atoms(db, order.user_id, leftover)
        ledger.record_refund(db, order, leftover, reason)
        order.refunded += leftover
        order.remaining = 0
    order.status = status


def _finish_order(db, order):
    minimum = order.price // math.gcd(order.price, PRICE)
    if order.remaining < minimum:
        _refund(db, order, 'filled' if order.filled else 'cancelled', reason='remainder')


def place(db, market_id, user_id, outcome, amount, odds, kind, request_id):
    atomic, tick = parse_terms(amount, odds)
    if kind not in ('limit', 'ioc') or not 8 <= len(request_id) <= 64:
        raise HTTPException(400, 'Некорректный тип или идентификатор заявки')
    # Persist any due expiration/refunds before starting the placement transaction.
    legacy.get_market(db, market_id)
    try:
        market = legacy._lock_market(db, market_id)
        require_p2p(market)
        idx = legacy.parse_outcome(legacy.market_outcomes(market), outcome)
        existing = db.query(P2POrder).filter_by(user_id=user_id, request_id=request_id).first()
        if existing:
            if (existing.market_id, existing.outcome, existing.amount, existing.price, existing.kind) != (market_id, idx, atomic, tick, kind):
                raise HTTPException(409, 'Идентификатор уже использован для другой заявки')
            return order_out(existing)
        legacy.require_accepting(market)
        orders = candidates(db, market, idx, user_id)
        plan, _ = plan_matches(orders, atomic, tick)
        legacy._lock_users(db, [user_id] + [m.user_id for m, _, _ in plan])
        adjust_atoms(db, user_id, -atomic)
        order = P2POrder(market_id=market_id, user_id=user_id, request_id=request_id,
                         outcome=idx, price=tick, amount=atomic, remaining=atomic,
                         filled=0, refunded=0, kind=kind, status='open')
        db.add(order)
        db.flush()
        ledger.record_reserve(db, order)
        for maker, maker_stake, taker_stake in plan:
            maker.remaining -= maker_stake
            maker.filled += maker_stake
            order.remaining -= taker_stake
            order.filled += taker_stake
            payout = maker_stake+taker_stake
            add_pot_nano(market, payout)
            fill = P2PFill(market_id=market_id, maker_order_id=maker.id, taker_order_id=order.id,
                          maker_user_id=maker.user_id, taker_user_id=user_id,
                          maker_outcome=maker.outcome, maker_stake=maker_stake,
                          taker_stake=taker_stake, price=maker.price)
            db.add(fill)
            db.flush()
            ledger.record_fill_escrow(db, fill)
            for uid, side, stake in [(maker.user_id, maker.outcome, maker_stake), (user_id, idx, taker_stake)]:
                pos = legacy._get_or_create_position(db, uid, market_id, 2)
                shares, costs = legacy._pos_vectors(pos, 2)
                shares[side] += payout/ATOM
                costs[side] += stake/ATOM
                legacy._set_pos_vectors(pos, shares, costs)
                # Subsequent matches must see a newly created position with autoflush=False.
                db.flush()
            _finish_order(db, maker)
        if kind == 'ioc':
            _refund(db, order, 'filled' if order.filled else 'cancelled', reason='ioc')
        else:
            _finish_order(db, order)
        db.commit()
        return order_out(order)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Идентификатор заявки уже использован; обновите список заявок')
    except Exception:
        db.rollback()
        raise


def cancel(db, order_id, user_id):
    initial = db.get(P2POrder, order_id)
    if initial is None or initial.user_id != user_id:
        raise HTTPException(404, 'Заявка не найдена')
    try:
        legacy._lock_market(db, initial.market_id)
        db.refresh(initial)
        if initial.status == 'open':
            legacy._lock_users(db, [user_id])
            _refund(db, initial)
        db.commit()
        return order_out(initial)
    except Exception:
        db.rollback()
        raise


def cancel_all(db, market):
    orders = db.query(P2POrder).filter_by(market_id=market.id, status='open').all()
    legacy._lock_users(db, [o.user_id for o in orders])
    for order in orders:
        _refund(db, order, 'expired', reason='close')


def void_market(db, market_id, user_id, reason):
    actor = legacy.get_user(db, user_id)
    legacy.require_admin(actor, 'Только админ может отменить событие')
    reason = (reason or '').strip()
    try:
        market = legacy._lock_market(db, market_id)
        if market.mechanism != 'p2p':
            raise HTTPException(409, 'Этот рынок использует LMSR')
        if market.status == MarketStatus.cancelled:
            return market
        if not reason or len(reason) > 1000:
            raise HTTPException(422, 'Укажите причину отмены (до 1000 символов)')
        if market.status == MarketStatus.pending:
            raise HTTPException(400, 'Для непроверенного события используйте отклонение модерацией')
        if market.status == MarketStatus.resolved:
            raise HTTPException(400, 'Рассчитанное событие нельзя отменить')
        if market.status not in (MarketStatus.open, MarketStatus.closed):
            raise HTTPException(400, 'Отменить можно только открытое или закрытое событие')

        orders = db.query(P2POrder).filter_by(market_id=market.id).all()
        fills = db.query(P2PFill).filter_by(market_id=market.id).all()
        filled_from_fills = defaultdict(int)
        stake_from_fills = defaultdict(int)
        chosen = defaultdict(set)
        bank = 0
        for fill in fills:
            total = fill.maker_stake + fill.taker_stake
            bank += total
            filled_from_fills[fill.maker_order_id] += fill.maker_stake
            filled_from_fills[fill.taker_order_id] += fill.taker_stake
            stake_from_fills[fill.maker_user_id] += fill.maker_stake
            stake_from_fills[fill.taker_user_id] += fill.taker_stake
            chosen[fill.maker_user_id].add(fill.maker_outcome)
            chosen[fill.taker_user_id].add(1 - fill.maker_outcome)

        for order in orders:
            if order.filled + order.remaining + order.refunded != order.amount:
                raise HTTPException(409, 'Несогласованность учёта заявок')
            if filled_from_fills[order.id] != order.filled:
                raise HTTPException(409, 'Несогласованность учёта сделок')

        if market.pot_nano != bank:
            raise HTTPException(409, 'Банк не соответствует обеспечению сделок')

        remainder = defaultdict(int)
        remainder_outcomes = defaultdict(set)
        for order in orders:
            if order.remaining:
                remainder[order.user_id] += order.remaining
                remainder_outcomes[order.user_id].add(order.outcome)

        users = (
            set(stake_from_fills)
            | set(remainder)
            | {market.creator_id}
            | {order.user_id for order in orders}
            | {pos.user_id for pos in db.query(Position).filter_by(market_id=market.id)}
        )
        legacy._lock_users(db, list(users))
        for order in orders:
            if order.remaining:
                _refund(db, order, 'cancelled', reason='void')
        for uid in sorted(stake_from_fills):
            adjust_atoms(db, uid, stake_from_fills[uid])
            ledger.record_void_return(db, market.id, uid, stake_from_fills[uid])

        when = legacy._naive_utc(legacy.utcnow())
        names = legacy.market_outcomes(market)
        for uid in set(stake_from_fills) | set(remainder):
            executed = stake_from_fills.get(uid, 0)
            leftover = remainder.get(uid, 0)
            sides = chosen.get(uid, set()) | remainder_outcomes.get(uid, set())
            db.add(SettlementRecord(
                market_id=market.id, user_id=uid, question=market.question,
                winning_outcome='Отменено',
                chosen_outcomes=[names[i] for i in sorted(sides) if i < len(names)],
                stakes_total=executed / ATOM, payout=executed / ATOM, tip=0,
                credited=(executed + leftover) / ATOM, result=0, lock_ton=0,
                residual_returned=leftover / ATOM, resolved_at=when,
            ))
        for pos in db.query(Position).filter_by(market_id=market.id):
            pos.claimed = True
            pos.tip_paid = 0
        market.status = MarketStatus.cancelled
        market.settlement_kind = legacy.SETTLEMENT_VOID
        market.cancellation_reason = reason
        market.cancelled_at = when
        market.cancelled_by = actor.id
        market.pot_nano = 0
        market.lock_returned = True
        market.winning_outcome = None
        db.commit()
        db.refresh(market)
        return market
    except Exception:
        db.rollback()
        raise


def list_orders(db, user_id):
    orders = db.query(P2POrder).filter_by(user_id=user_id).order_by(P2POrder.id.desc()).all()
    for mid in sorted({o.market_id for o in orders if o.status == 'open'}):
        legacy.get_market(db, mid)
    result = []
    for order in orders:
        m = db.get(Market, order.market_id)
        result.append(dict(order_out(order), question=m.question,
                           outcome_name=legacy.market_outcomes(m)[order.outcome]))
    return result


def book(db, market_id):
    market = legacy.get_market(db, market_id)
    require_p2p(market)
    if market.status in (MarketStatus.pending, MarketStatus.rejected):
        raise HTTPException(404, 'Рынок не найден')
    orders = db.query(P2POrder).filter_by(market_id=market_id, status='open').all()
    sides = [defaultdict(int), defaultdict(int)]
    queued = [0, 0]
    if legacy.is_accepting_bets(market):
        for o in orders:
            divisor = math.gcd(o.price, PRICE)
            lots = o.remaining // (o.price//divisor)
            sides[1-o.outcome][PRICE-o.price] += lots*((PRICE-o.price)//divisor)
            queued[o.outcome] += o.remaining
    last = db.query(P2PFill).filter_by(market_id=market_id).order_by(P2PFill.id.desc()).first()
    last_prices = None
    if last:
        last_prices = [0, 0]
        last_prices[last.maker_outcome] = last.price/PRICE
        last_prices[1-last.maker_outcome] = (PRICE-last.price)/PRICE
    return dict(sides=[[dict(odds=PRICE/p, available=a/ATOM) for p, a in sorted(side.items()) if a] for side in sides],
                queued=[v/ATOM for v in queued], last_prices=last_prices,
                forming=last is None and market.status == MarketStatus.open)


def settle(db, market, winning_outcome):
    """Called with the market locked, within legacy resolve's rollback boundary."""
    win = legacy.parse_outcome(legacy.market_outcomes(market), winning_outcome)
    fills = db.query(P2PFill).filter_by(market_id=market.id).all()
    rows = defaultdict(lambda: dict(cost=0, payout=0, chosen=set()))
    bank = 0
    for fill in fills:
        total = fill.maker_stake+fill.taker_stake
        bank += total
        for uid, side, stake in [(fill.maker_user_id, fill.maker_outcome, fill.maker_stake),
                                 (fill.taker_user_id, 1-fill.maker_outcome, fill.taker_stake)]:
            rows[uid]['cost'] += stake
            rows[uid]['chosen'].add(side)
            if side == win:
                rows[uid]['payout'] += total
    if market.pot_nano != bank:
        raise HTTPException(409, 'Банк не соответствует обеспечению сделок')
    admin = legacy.find_admin_user(db)
    users = list(rows) + [market.creator_id]
    if admin:
        users.append(admin.id)
    users += [o.user_id for o in db.query(P2POrder).filter_by(market_id=market.id, status='open')]
    legacy._lock_users(db, users)
    cancel_all(db, market)
    credits = defaultdict(int)
    names = legacy.market_outcomes(market)
    when = legacy._naive_utc(legacy.utcnow())
    for uid, row in rows.items():
        tip = max(0, row['payout']-row['cost']) // 100
        if tip and admin is None:
            raise HTTPException(409, 'Нет аккаунта платформы для чаевых')
        if tip:
            creator_tip = 0 if uid == market.creator_id else tip*75//100
            credits[market.creator_id] += creator_tip
            credits[admin.id] += tip-creator_tip
            for recipient, share in ledger.tip_shares_by_recipient(
                uid, market.creator_id, admin.id, tip
            ).items():
                ledger.record_tip(db, market.id, uid, recipient, share)
        net = row['payout']-tip
        credits[uid] += net
        if net:
            ledger.record_payout(db, market.id, uid, net)
        db.add(SettlementRecord(market_id=market.id, user_id=uid, question=market.question,
            winning_outcome=names[win], chosen_outcomes=[names[i] for i in sorted(row['chosen'])],
            stakes_total=row['cost']/ATOM, payout=row['payout']/ATOM, tip=tip/ATOM,
            credited=(row['payout']-tip)/ATOM, result=(row['payout']-tip-row['cost'])/ATOM,
            lock_ton=0, residual_returned=0, resolved_at=when))
    for uid in sorted(credits):
        adjust_atoms(db, uid, credits[uid])
    for pos in db.query(Position).filter_by(market_id=market.id):
        pos.claimed = True
        row = rows[pos.user_id]
        pos.tip_paid = max(0, row['payout']-row['cost'])//100/ATOM
    market.status = MarketStatus.resolved
    market.winning_outcome = names[win]
    market.resolved_at = when
    market.settlement_kind = 'auto'
    market.lock_returned = True
    market.pot_nano = 0
    db.commit()
    db.refresh(market)
    return market


def adjust_atoms(db, user_id, atoms):
    adjust_balance_nano(db, user_id, atoms)


def expire_due_orders():
    from app.database import SessionLocal
    with SessionLocal() as db:
        ids = [row[0] for row in db.query(Market.id).filter(
            Market.mechanism == 'p2p', Market.status == MarketStatus.open,
            Market.close_at <= legacy._naive_utc(legacy.utcnow())).all()]
        for mid in ids:
            legacy.get_market(db, mid)
