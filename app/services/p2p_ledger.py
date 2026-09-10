"""Immutable P2P money journal and read-only event reconciliation.

Records existing balance/reserve/pot movements. Does not move funds, does not
pay, and does not reconstruct history that predates the journal.
"""
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Market, MarketStatus, P2PFill, P2PMoneyEntry, P2POrder

NANO_PER_TON = 1_000_000_000
FLOAT_TOLERANCE_TON = 1e-7

COVERAGE_FULL = "full"
COVERAGE_INCOMPLETE = "incomplete"
COVERAGE_NA = "not_applicable"

OP_RESERVE = "reserve"
OP_FILL_ESCROW = "fill_escrow"
OP_REFUND = "refund"
OP_PAYOUT = "payout"
OP_TIP = "tip"
OP_VOID_RETURN = "void_return"

KIND_BALANCE = "user_balance"
KIND_RESERVE = "order_reserve"
KIND_POT = "market_pot"

FLOAT_MONEY_FIELDS = (
    "User.balance",
    "Market.pot",
    "Market.lock_ton",
    "Market.b",
    "Market.q / q_yes / q_no",
    "Position.shares / costs / shares_yes / shares_no / cost_yes / cost_no / tip_paid",
    "Trade.money / shares / price_after",
    "SettlementRecord.stakes_total / payout / tip / credited / result / lock_ton / residual_returned",
)


def key_reserve(order_id: int) -> str:
    return f"reserve:{int(order_id)}"


def key_fill(fill_id: int, side: str) -> str:
    return f"fill:{int(fill_id)}:{side}"


def key_refund(order_id: int) -> str:
    return f"refund:{int(order_id)}"


def key_payout(market_id: int, user_id: int) -> str:
    return f"payout:{int(market_id)}:{int(user_id)}"


def key_tip(market_id: int, winner_id: int, recipient_id: int) -> str:
    return f"tip:{int(market_id)}:{int(winner_id)}:{int(recipient_id)}"


def key_void_return(market_id: int, user_id: int) -> str:
    return f"void:{int(market_id)}:{int(user_id)}"


def record(
    db: Session,
    *,
    entry_key: str,
    op_type: str,
    market_id: int,
    amount: int,
    from_kind: str,
    to_kind: str,
    order_id: int | None = None,
    fill_id: int | None = None,
    from_user_id: int | None = None,
    from_order_id: int | None = None,
    to_user_id: int | None = None,
    to_order_id: int | None = None,
    origin_key: str | None = None,
    reason: str | None = None,
) -> P2PMoneyEntry | None:
    """Insert a journal row. Zero amounts are skipped. Duplicate keys reuse the existing row."""
    if not amount:
        return None
    if amount < 0:
        raise HTTPException(409, "Отрицательная сумма в журнале")
    existing = db.query(P2PMoneyEntry).filter_by(entry_key=entry_key).one_or_none()
    if existing is not None:
        if int(existing.amount) != int(amount) or existing.op_type != op_type:
            raise HTTPException(409, "Конфликт записи журнала")
        return existing
    row = P2PMoneyEntry(
        entry_key=entry_key,
        op_type=op_type,
        market_id=market_id,
        order_id=order_id,
        fill_id=fill_id,
        from_kind=from_kind,
        from_user_id=from_user_id,
        from_order_id=from_order_id,
        to_kind=to_kind,
        to_user_id=to_user_id,
        to_order_id=to_order_id,
        amount=int(amount),
        origin_key=origin_key,
        reason=reason,
    )
    nested = db.begin_nested()
    try:
        db.add(row)
        db.flush()
        nested.commit()
        return row
    except IntegrityError:
        nested.rollback()
        db.expunge(row)
        existing = db.query(P2PMoneyEntry).filter_by(entry_key=entry_key).one_or_none()
        if existing is not None and int(existing.amount) == int(amount) and existing.op_type == op_type:
            return existing
        raise


def record_reserve(db: Session, order: P2POrder) -> P2PMoneyEntry | None:
    return record(
        db,
        entry_key=key_reserve(order.id),
        op_type=OP_RESERVE,
        market_id=order.market_id,
        amount=int(order.amount),
        from_kind=KIND_BALANCE,
        from_user_id=order.user_id,
        to_kind=KIND_RESERVE,
        to_user_id=order.user_id,
        to_order_id=order.id,
        order_id=order.id,
        reason="place",
    )


def record_fill_escrow(db: Session, fill: P2PFill) -> None:
    origin_maker = key_reserve(fill.maker_order_id)
    origin_taker = key_reserve(fill.taker_order_id)
    record(
        db,
        entry_key=key_fill(fill.id, "maker"),
        op_type=OP_FILL_ESCROW,
        market_id=fill.market_id,
        amount=int(fill.maker_stake),
        from_kind=KIND_RESERVE,
        from_user_id=fill.maker_user_id,
        from_order_id=fill.maker_order_id,
        to_kind=KIND_POT,
        order_id=fill.maker_order_id,
        fill_id=fill.id,
        origin_key=origin_maker,
        reason="match",
    )
    record(
        db,
        entry_key=key_fill(fill.id, "taker"),
        op_type=OP_FILL_ESCROW,
        market_id=fill.market_id,
        amount=int(fill.taker_stake),
        from_kind=KIND_RESERVE,
        from_user_id=fill.taker_user_id,
        from_order_id=fill.taker_order_id,
        to_kind=KIND_POT,
        order_id=fill.taker_order_id,
        fill_id=fill.id,
        origin_key=origin_taker,
        reason="match",
    )


def record_refund(db: Session, order: P2POrder, amount: int, reason: str) -> P2PMoneyEntry | None:
    return record(
        db,
        entry_key=key_refund(order.id),
        op_type=OP_REFUND,
        market_id=order.market_id,
        amount=int(amount),
        from_kind=KIND_RESERVE,
        from_user_id=order.user_id,
        from_order_id=order.id,
        to_kind=KIND_BALANCE,
        to_user_id=order.user_id,
        order_id=order.id,
        origin_key=key_reserve(order.id),
        reason=reason,
    )


def record_payout(db: Session, market_id: int, user_id: int, amount: int) -> P2PMoneyEntry | None:
    return record(
        db,
        entry_key=key_payout(market_id, user_id),
        op_type=OP_PAYOUT,
        market_id=market_id,
        amount=int(amount),
        from_kind=KIND_POT,
        to_kind=KIND_BALANCE,
        to_user_id=user_id,
        origin_key=f"settlement:{int(market_id)}",
        reason="payout",
    )


def record_tip(
    db: Session, market_id: int, winner_id: int, recipient_id: int, amount: int
) -> P2PMoneyEntry | None:
    return record(
        db,
        entry_key=key_tip(market_id, winner_id, recipient_id),
        op_type=OP_TIP,
        market_id=market_id,
        amount=int(amount),
        from_kind=KIND_POT,
        to_kind=KIND_BALANCE,
        from_user_id=winner_id,
        to_user_id=recipient_id,
        origin_key=key_payout(market_id, winner_id),
        reason="tip",
    )


def record_void_return(db: Session, market_id: int, user_id: int, amount: int) -> P2PMoneyEntry | None:
    return record(
        db,
        entry_key=key_void_return(market_id, user_id),
        op_type=OP_VOID_RETURN,
        market_id=market_id,
        amount=int(amount),
        from_kind=KIND_POT,
        to_kind=KIND_BALANCE,
        to_user_id=user_id,
        origin_key=f"void:{int(market_id)}",
        reason="void",
    )


def _entry_out(row: P2PMoneyEntry) -> dict:
    return dict(
        id=row.id,
        entry_key=row.entry_key,
        op_type=row.op_type,
        market_id=row.market_id,
        order_id=row.order_id,
        fill_id=row.fill_id,
        from_kind=row.from_kind,
        from_user_id=row.from_user_id,
        from_order_id=row.from_order_id,
        to_kind=row.to_kind,
        to_user_id=row.to_user_id,
        to_order_id=row.to_order_id,
        amount_nano=int(row.amount),
        origin_key=row.origin_key,
        reason=row.reason,
        created_at=row.created_at,
    )


def _sum(entries, op_type=None, order_id=None, fill_id=None, side_order_id=None) -> int:
    total = 0
    for row in entries:
        if op_type is not None and row.op_type != op_type:
            continue
        if order_id is not None and row.order_id != order_id:
            continue
        if fill_id is not None and row.fill_id != fill_id:
            continue
        if side_order_id is not None and row.from_order_id != side_order_id:
            continue
        total += int(row.amount)
    return total


def reconcile(db: Session, market_id: int) -> dict:
    """Read-only audit of a P2P market. Does not credit, debit, expire, or rewrite rows."""
    market = db.get(Market, market_id)
    if market is None:
        raise HTTPException(404, "Рынок не найден")
    if market.mechanism != "p2p":
        raise HTTPException(409, "Сверка журнала доступна только для P2P-событий")

    coverage = market.p2p_journal_coverage or COVERAGE_INCOMPLETE
    if coverage == COVERAGE_NA:
        coverage = COVERAGE_INCOMPLETE
    orders = db.query(P2POrder).filter_by(market_id=market.id).order_by(P2POrder.id).all()
    fills = db.query(P2PFill).filter_by(market_id=market.id).order_by(P2PFill.id).all()
    entries = (
        db.query(P2PMoneyEntry)
        .filter_by(market_id=market.id)
        .order_by(P2PMoneyEntry.id)
        .all()
    )

    discrepancies: list[dict] = []
    coverage_gaps: list[dict] = []

    def note(kind: str, message: str, **extra):
        item = dict(kind=kind, message=message, **extra)
        if coverage == COVERAGE_FULL:
            discrepancies.append(item)
        elif kind.startswith("missing_journal"):
            coverage_gaps.append(item)
        else:
            discrepancies.append(item)

    filled_from_fills = defaultdict(int)
    bank_from_fills = 0
    for fill in fills:
        bank_from_fills += int(fill.maker_stake) + int(fill.taker_stake)
        filled_from_fills[fill.maker_order_id] += int(fill.maker_stake)
        filled_from_fills[fill.taker_order_id] += int(fill.taker_stake)

    amount_identity_ok = True
    fills_match_orders_ok = True
    for order in orders:
        parts = int(order.filled) + int(order.remaining) + int(order.refunded)
        if parts != int(order.amount):
            amount_identity_ok = False
            discrepancies.append(
                dict(
                    kind="order_identity",
                    message="amount ≠ filled + remaining + refunded",
                    order_id=order.id,
                    amount=int(order.amount),
                    filled=int(order.filled),
                    remaining=int(order.remaining),
                    refunded=int(order.refunded),
                )
            )
        fill_sum = filled_from_fills.get(order.id, 0)
        if fill_sum != int(order.filled):
            fills_match_orders_ok = False
            discrepancies.append(
                dict(
                    kind="order_fills",
                    message="filled не совпадает с суммой сделок",
                    order_id=order.id,
                    filled=int(order.filled),
                    fills_sum=fill_sum,
                )
            )

        reserved = _sum(entries, OP_RESERVE, order_id=order.id)
        escrowed = _sum(entries, OP_FILL_ESCROW, side_order_id=order.id)
        refunded = _sum(entries, OP_REFUND, order_id=order.id)
        if reserved != int(order.amount):
            note(
                "missing_journal_reserve" if reserved == 0 else "reserve_mismatch",
                "резерв в журнале не совпадает с суммой заявки",
                order_id=order.id,
                journal_reserve=reserved,
                amount=int(order.amount),
            )
        if escrowed != int(order.filled):
            note(
                "missing_journal_fill" if escrowed == 0 and order.filled else "fill_escrow_mismatch",
                "перевод в банк по журналу не совпадает с исполненным",
                order_id=order.id,
                journal_escrow=escrowed,
                filled=int(order.filled),
            )
        if refunded != int(order.refunded):
            note(
                "missing_journal_refund" if refunded == 0 and order.refunded else "refund_mismatch",
                "возврат в журнале не совпадает с заявкой",
                order_id=order.id,
                journal_refund=refunded,
                refunded=int(order.refunded),
            )
        journal_remaining = reserved - escrowed - refunded
        if reserved and journal_remaining != int(order.remaining):
            discrepancies.append(
                dict(
                    kind="reserve_remaining",
                    message="остаток резерва в журнале не совпадает с заявкой",
                    order_id=order.id,
                    journal_remaining=journal_remaining,
                    remaining=int(order.remaining),
                )
            )

    for fill in fills:
        maker_amt = _sum(entries, OP_FILL_ESCROW, fill_id=fill.id, side_order_id=fill.maker_order_id)
        taker_amt = _sum(entries, OP_FILL_ESCROW, fill_id=fill.id, side_order_id=fill.taker_order_id)
        if maker_amt != int(fill.maker_stake) or taker_amt != int(fill.taker_stake):
            note(
                "missing_journal_fill" if maker_amt == 0 and taker_amt == 0 else "fill_row_mismatch",
                "сделка не совпадает с журналом резерв→банк",
                fill_id=fill.id,
                maker_stake=int(fill.maker_stake),
                taker_stake=int(fill.taker_stake),
                journal_maker=maker_amt,
                journal_taker=taker_amt,
            )

    escrow_in = _sum(entries, OP_FILL_ESCROW)
    payouts = _sum(entries, OP_PAYOUT)
    tips = _sum(entries, OP_TIP)
    voids = _sum(entries, OP_VOID_RETURN)
    expected_pot = escrow_in - payouts - tips - voids
    actual_pot_ton = float(market.pot or 0)
    pot_float_ok = abs(actual_pot_ton - expected_pot / NANO_PER_TON) <= FLOAT_TOLERANCE_TON
    if not pot_float_ok:
        discrepancies.append(
            dict(
                kind="pot_mismatch",
                message="остаток банка не совпадает с журналом",
                expected_nano=expected_pot,
                actual_ton=actual_pot_ton,
                float_tolerance_ton=FLOAT_TOLERANCE_TON,
            )
        )

    if abs(actual_pot_ton - bank_from_fills / NANO_PER_TON) > FLOAT_TOLERANCE_TON:
        if market.status in (MarketStatus.open, MarketStatus.closed):
            discrepancies.append(
                dict(
                    kind="pot_vs_fills",
                    message="банк не равен сумме сделок",
                    fills_nano=bank_from_fills,
                    actual_ton=actual_pot_ton,
                    float_tolerance_ton=FLOAT_TOLERANCE_TON,
                )
            )
        elif market.status in (MarketStatus.resolved, MarketStatus.cancelled) and abs(actual_pot_ton) > FLOAT_TOLERANCE_TON:
            discrepancies.append(
                dict(
                    kind="pot_not_cleared",
                    message="после расчёта или отмены банк должен быть пуст",
                    actual_ton=actual_pot_ton,
                    float_tolerance_ton=FLOAT_TOLERANCE_TON,
                )
            )

    if market.status == MarketStatus.resolved:
        if payouts + tips != bank_from_fills and coverage == COVERAGE_FULL:
            discrepancies.append(
                dict(
                    kind="settlement_outflow",
                    message="выплаты и чаевые не равны банку сделок",
                    payouts_nano=payouts,
                    tips_nano=tips,
                    fills_nano=bank_from_fills,
                )
            )
        if voids:
            discrepancies.append(
                dict(
                    kind="resolved_has_void",
                    message="у рассчитанного события есть возвраты отмены из банка",
                    voids_nano=voids,
                )
            )
    if market.status == MarketStatus.cancelled:
        if voids != bank_from_fills and coverage == COVERAGE_FULL:
            discrepancies.append(
                dict(
                    kind="void_outflow",
                    message="возврат исполненного не равен банку сделок",
                    voids_nano=voids,
                    fills_nano=bank_from_fills,
                )
            )
        if payouts or tips:
            discrepancies.append(
                dict(
                    kind="cancelled_has_payout",
                    message="у отменённого события есть выплаты или чаевые",
                    payouts_nano=payouts,
                    tips_nano=tips,
                )
            )
    if market.status in (MarketStatus.open, MarketStatus.closed):
        if payouts or tips or voids:
            discrepancies.append(
                dict(
                    kind="open_has_settlement",
                    message="у незавершённого события есть выплаты, чаевые или возврат банка",
                    payouts_nano=payouts,
                    tips_nano=tips,
                    voids_nano=voids,
                )
            )

    counts = defaultdict(int)
    for row in entries:
        counts[row.op_type] += 1

    fully_verified = coverage == COVERAGE_FULL and not discrepancies and not coverage_gaps
    if coverage == COVERAGE_FULL:
        coverage_note = "Журнал ведётся с создания события."
    else:
        coverage_note = (
            "Событие существовало до внедрения журнала. Исторические движения не восстанавливались. "
            "Последующие операции могут быть в журнале. Полная сверка жизненного цикла невозможна."
        )

    return dict(
        market_id=market.id,
        status=market.status.value if hasattr(market.status, "value") else str(market.status),
        journal_coverage=coverage,
        fully_verified=fully_verified,
        coverage_note=coverage_note,
        float_tolerance_ton=FLOAT_TOLERANCE_TON,
        float_fields=list(FLOAT_MONEY_FIELDS),
        integer_fields=[
            "P2POrder.amount / filled / remaining / refunded",
            "P2PFill.maker_stake / taker_stake",
            "P2PMoneyEntry.amount",
        ],
        orders=dict(
            checked=len(orders),
            amount_identity_ok=amount_identity_ok,
            fills_match_orders_ok=fills_match_orders_ok,
        ),
        pot=dict(
            expected_nano=expected_pot,
            actual_ton=actual_pot_ton,
            fills_nano=bank_from_fills,
            payouts_nano=payouts,
            tips_nano=tips,
            void_returns_nano=voids,
            consistent=pot_float_ok,
            float_tolerance_ton=FLOAT_TOLERANCE_TON,
        ),
        entry_counts=dict(counts),
        coverage_gaps=coverage_gaps,
        discrepancies=discrepancies,
        entries=[_entry_out(row) for row in entries],
    )
