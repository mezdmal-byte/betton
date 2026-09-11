"""Immutable P2P money journal and read-only event reconciliation.

Records existing balance/reserve/pot movements. Does not move funds, does not
pay, and does not reconstruct history that predates the journal.
"""
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Market, MarketStatus, P2PFill, P2PMoneyEntry, P2POrder, SettlementRecord

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


ALLOWED_DIRECTIONS = {
    OP_RESERVE: (KIND_BALANCE, KIND_RESERVE),
    OP_FILL_ESCROW: (KIND_RESERVE, KIND_POT),
    OP_REFUND: (KIND_RESERVE, KIND_BALANCE),
    OP_PAYOUT: (KIND_POT, KIND_BALANCE),
    OP_TIP: (KIND_POT, KIND_BALANCE),
    OP_VOID_RETURN: (KIND_POT, KIND_BALANCE),
}


def tip_shares_by_recipient(winner_id: int, creator_id: int, admin_id: int | None, tip: int) -> dict[int, int]:
    """Group the existing 75/25 split by actual recipient. Does not change credits."""
    if not tip or admin_id is None:
        return {}
    creator_tip = 0 if int(winner_id) == int(creator_id) else tip * 75 // 100
    admin_tip = tip - creator_tip
    shares: dict[int, int] = defaultdict(int)
    if creator_tip:
        shares[int(creator_id)] += creator_tip
    if admin_tip:
        shares[int(admin_id)] += admin_tip
    return dict(shares)


def _identity(values: dict) -> tuple:
    return (
        values.get("op_type"),
        int(values["market_id"]) if values.get("market_id") is not None else None,
        int(values["amount"]) if values.get("amount") is not None else None,
        values.get("from_kind"),
        values.get("to_kind"),
        values.get("from_user_id"),
        values.get("from_order_id"),
        values.get("to_user_id"),
        values.get("to_order_id"),
        values.get("order_id"),
        values.get("fill_id"),
        values.get("origin_key"),
        values.get("reason"),
    )


def _entry_identity(row: P2PMoneyEntry) -> tuple:
    return _identity(
        dict(
            op_type=row.op_type,
            market_id=row.market_id,
            amount=row.amount,
            from_kind=row.from_kind,
            to_kind=row.to_kind,
            from_user_id=row.from_user_id,
            from_order_id=row.from_order_id,
            to_user_id=row.to_user_id,
            to_order_id=row.to_order_id,
            order_id=row.order_id,
            fill_id=row.fill_id,
            origin_key=row.origin_key,
            reason=row.reason,
        )
    )


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
    incoming = dict(
        op_type=op_type,
        market_id=market_id,
        amount=amount,
        from_kind=from_kind,
        to_kind=to_kind,
        from_user_id=from_user_id,
        from_order_id=from_order_id,
        to_user_id=to_user_id,
        to_order_id=to_order_id,
        order_id=order_id,
        fill_id=fill_id,
        origin_key=origin_key,
        reason=reason,
    )
    if existing is not None:
        if _entry_identity(existing) != _identity(incoming):
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
        # Rolling back the savepoint already removes its new objects from the
        # session. Expunging row here raises InvalidRequestError and masks the
        # unique-key conflict we are trying to handle.
        existing = db.query(P2PMoneyEntry).filter_by(entry_key=entry_key).one_or_none()
        if existing is not None:
            if _entry_identity(existing) == _identity(incoming):
                return existing
            raise HTTPException(409, "Конфликт записи журнала")
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


def _match_rows(fills, win_idx: int | None):
    rows = defaultdict(lambda: dict(cost=0, payout=0, chosen=set(), stake=0))
    for fill in fills:
        total = int(fill.maker_stake) + int(fill.taker_stake)
        for uid, side, stake in (
            (fill.maker_user_id, fill.maker_outcome, int(fill.maker_stake)),
            (fill.taker_user_id, 1 - fill.maker_outcome, int(fill.taker_stake)),
        ):
            rows[uid]["cost"] += stake
            rows[uid]["stake"] += stake
            rows[uid]["chosen"].add(side)
            if win_idx is not None and side == win_idx:
                rows[uid]["payout"] += total
    return rows


def _expected_payouts_and_tips(market, fills, admin_id: int | None, win_idx: int | None):
    payouts: dict[int, int] = defaultdict(int)
    tips: dict[tuple[int, int], int] = defaultdict(int)
    if win_idx is None:
        return payouts, tips
    for uid, row in _match_rows(fills, win_idx).items():
        tip = max(0, row["payout"] - row["cost"]) // 100
        net = row["payout"] - tip
        if net:
            payouts[int(uid)] += net
        for recipient, share in tip_shares_by_recipient(uid, market.creator_id, admin_id, tip).items():
            tips[(int(uid), int(recipient))] += share
    return payouts, tips


def _expected_voids(fills) -> dict[int, int]:
    voids: dict[int, int] = defaultdict(int)
    for fill in fills:
        voids[int(fill.maker_user_id)] += int(fill.maker_stake)
        voids[int(fill.taker_user_id)] += int(fill.taker_stake)
    return voids


def _compare_named_amounts(note, discrepancies, *, missing_kind, mismatch_kind, unexpected_kind, expected: dict, actual: dict, key_name: str):
    for key, amount in expected.items():
        got = actual.get(key, 0)
        extra = {key_name: key} if not isinstance(key, tuple) else dict(winner_id=key[0], recipient_id=key[1])
        if got == 0 and amount:
            note(missing_kind, "в журнале нет ожидаемого движения", expected_nano=amount, actual_nano=got, **extra)
        elif got != amount:
            discrepancies.append(
                dict(kind=mismatch_kind, message="сумма или получатель журнала не совпадают с расчётом", expected_nano=amount, actual_nano=got, **extra)
            )
    for key, amount in actual.items():
        if amount and key not in expected:
            extra = {key_name: key} if not isinstance(key, tuple) else dict(winner_id=key[0], recipient_id=key[1])
            discrepancies.append(
                dict(kind=unexpected_kind, message="журнал содержит движение, которого нет в расчёте", actual_nano=amount, **extra)
            )


def _audit_movement_semantics(
    market,
    orders,
    fills,
    entries,
    settlements,
    expected_payouts,
    expected_tips,
    expected_voids,
    win_idx,
    note,
    discrepancies,
):
    orders_by_id = {o.id: o for o in orders}
    fills_by_id = {f.id: f for f in fills}

    for row in entries:
        allowed = ALLOWED_DIRECTIONS.get(row.op_type)
        if allowed is None:
            discrepancies.append(dict(kind="unknown_op_type", message="неизвестный тип операции журнала", entry_key=row.entry_key, op_type=row.op_type))
            continue
        if (row.from_kind, row.to_kind) != allowed:
            discrepancies.append(
                dict(
                    kind="direction",
                    message="недопустимое направление для типа операции",
                    entry_key=row.entry_key,
                    op_type=row.op_type,
                    from_kind=row.from_kind,
                    to_kind=row.to_kind,
                )
            )
        if row.order_id is not None:
            order = orders_by_id.get(row.order_id)
            if order is None or int(order.market_id) != int(market.id):
                discrepancies.append(
                    dict(kind="order_market", message="заявка журнала не принадлежит событию", entry_key=row.entry_key, order_id=row.order_id)
                )
        if row.fill_id is not None:
            fill = fills_by_id.get(row.fill_id)
            if fill is None or int(fill.market_id) != int(market.id):
                discrepancies.append(
                    dict(kind="fill_market", message="сделка журнала не принадлежит событию", entry_key=row.entry_key, fill_id=row.fill_id)
                )
        if row.from_order_id is not None:
            source = orders_by_id.get(row.from_order_id)
            if source is None or int(source.market_id) != int(market.id):
                discrepancies.append(
                    dict(kind="source_order", message="исходная заявка не принадлежит событию", entry_key=row.entry_key, from_order_id=row.from_order_id)
                )
            elif row.from_user_id is not None and int(row.from_user_id) != int(source.user_id):
                discrepancies.append(
                    dict(
                        kind="source_user",
                        message="источник не совпадает с владельцем заявки",
                        entry_key=row.entry_key,
                        from_user_id=row.from_user_id,
                        order_user_id=source.user_id,
                    )
                )
        if row.to_order_id is not None:
            dest = orders_by_id.get(row.to_order_id)
            if dest is None or int(dest.market_id) != int(market.id):
                discrepancies.append(
                    dict(kind="dest_order", message="заявка-получатель не принадлежит событию", entry_key=row.entry_key, to_order_id=row.to_order_id)
                )

        if row.op_type == OP_RESERVE:
            order = orders_by_id.get(row.order_id)
            if order is not None and (
                row.from_user_id != order.user_id
                or row.to_user_id != order.user_id
                or row.to_order_id != order.id
            ):
                discrepancies.append(
                    dict(
                        kind="reserve_party",
                        message="резерв должен списывать баланс владельца заявки",
                        entry_key=row.entry_key,
                        order_id=order.id,
                        order_user_id=order.user_id,
                        from_user_id=row.from_user_id,
                        to_user_id=row.to_user_id,
                    )
                )
        elif row.op_type == OP_FILL_ESCROW:
            fill = fills_by_id.get(row.fill_id)
            if fill is not None:
                if row.from_order_id == fill.maker_order_id:
                    owner, stake = fill.maker_user_id, int(fill.maker_stake)
                elif row.from_order_id == fill.taker_order_id:
                    owner, stake = fill.taker_user_id, int(fill.taker_stake)
                else:
                    discrepancies.append(
                        dict(kind="fill_party", message="перевод в банк не привязан к сторонам сделки", entry_key=row.entry_key, fill_id=fill.id)
                    )
                    owner, stake = None, None
                if owner is not None and (row.from_user_id != owner or int(row.amount) != stake):
                    discrepancies.append(
                        dict(
                            kind="fill_party",
                            message="источник или сумма перевода в банк не совпадают со сделкой",
                            entry_key=row.entry_key,
                            fill_id=fill.id,
                            from_user_id=row.from_user_id,
                            expected_user_id=owner,
                            amount_nano=int(row.amount),
                            expected_nano=stake,
                        )
                    )
        elif row.op_type == OP_REFUND:
            order = orders_by_id.get(row.order_id or row.from_order_id)
            if order is not None and (row.from_user_id != order.user_id or row.to_user_id != order.user_id):
                discrepancies.append(
                    dict(
                        kind="refund_party",
                        message="возврат резерва должен идти владельцу заявки",
                        entry_key=row.entry_key,
                        order_id=order.id,
                        order_user_id=order.user_id,
                        to_user_id=row.to_user_id,
                    )
                )

    journal_payouts = defaultdict(int)
    journal_tips = defaultdict(int)
    journal_voids = defaultdict(int)
    for row in entries:
        if row.op_type == OP_PAYOUT and row.to_user_id is not None:
            journal_payouts[int(row.to_user_id)] += int(row.amount)
        elif row.op_type == OP_TIP and row.to_user_id is not None:
            winner = int(row.from_user_id) if row.from_user_id is not None else None
            journal_tips[(winner, int(row.to_user_id))] += int(row.amount)
        elif row.op_type == OP_VOID_RETURN and row.to_user_id is not None:
            journal_voids[int(row.to_user_id)] += int(row.amount)

    if market.status == MarketStatus.resolved:
        _compare_named_amounts(
            note, discrepancies,
            missing_kind="missing_journal_payout",
            mismatch_kind="payout_recipient",
            unexpected_kind="payout_recipient",
            expected=dict(expected_payouts),
            actual=dict(journal_payouts),
            key_name="user_id",
        )
        _compare_named_amounts(
            note, discrepancies,
            missing_kind="missing_journal_tip",
            mismatch_kind="tip_recipient",
            unexpected_kind="tip_recipient",
            expected=dict(expected_tips),
            actual=dict(journal_tips),
            key_name="recipient_id",
        )
        credited_users = {
            rec.user_id
            for rec in settlements
            if float(rec.credited or 0) > FLOAT_TOLERANCE_TON
        }
        if credited_users != set(expected_payouts):
            discrepancies.append(
                dict(
                    kind="settlement_recipients",
                    message="получатели сохранённого расчёта не совпадают со сделками",
                    settlement_user_ids=sorted(credited_users),
                    expected_user_ids=sorted(expected_payouts),
                )
            )
        if win_idx is not None:
            for rec in settlements:
                row = _match_rows(fills, win_idx).get(rec.user_id, dict(payout=0, cost=0))
                tip = max(0, row["payout"] - row["cost"]) // 100
                net = row["payout"] - tip
                if abs(float(rec.credited or 0) - net / NANO_PER_TON) > FLOAT_TOLERANCE_TON:
                    discrepancies.append(
                        dict(
                            kind="settlement_credited",
                            message="сохранённое зачисление не совпадает со сделками",
                            user_id=rec.user_id,
                            credited_ton=float(rec.credited or 0),
                            expected_ton=net / NANO_PER_TON,
                        )
                    )
    if market.status == MarketStatus.cancelled:
        _compare_named_amounts(
            note, discrepancies,
            missing_kind="missing_journal_void",
            mismatch_kind="void_recipient",
            unexpected_kind="void_recipient",
            expected=dict(expected_voids),
            actual=dict(journal_voids),
            key_name="user_id",
        )


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

    from app.services import market_service as legacy
    win_idx = None
    if market.status == MarketStatus.resolved and market.winning_outcome:
        try:
            win_idx = legacy.parse_outcome(legacy.market_outcomes(market), market.winning_outcome)
        except HTTPException:
            discrepancies.append(
                dict(kind="winning_outcome", message="не удалось разобрать победивший исход")
            )
    admin = legacy.find_admin_user(db)
    admin_id = admin.id if admin else None
    expected_payouts, expected_tips = _expected_payouts_and_tips(market, fills, admin_id, win_idx)
    expected_voids = _expected_voids(fills) if market.status == MarketStatus.cancelled else {}
    settlements = (
        db.query(SettlementRecord).filter_by(market_id=market.id).order_by(SettlementRecord.id).all()
    )
    _audit_movement_semantics(
        market,
        orders,
        fills,
        entries,
        settlements,
        expected_payouts,
        expected_tips,
        expected_voids,
        win_idx,
        note,
        discrepancies,
    )

    payouts = _sum(entries, OP_PAYOUT)
    tips = _sum(entries, OP_TIP)
    voids = _sum(entries, OP_VOID_RETURN)
    expected_out = sum(expected_payouts.values()) + sum(expected_tips.values()) + sum(expected_voids.values())
    if market.status in (MarketStatus.resolved, MarketStatus.cancelled):
        expected_pot = bank_from_fills - expected_out
    else:
        expected_pot = bank_from_fills
    actual_pot_ton = float(market.pot or 0)
    pot_float_ok = abs(actual_pot_ton - expected_pot / NANO_PER_TON) <= FLOAT_TOLERANCE_TON
    if not pot_float_ok:
        discrepancies.append(
            dict(
                kind="pot_mismatch",
                message="остаток банка не совпадает с заявками, сделками и расчётом",
                expected_nano=expected_pot,
                actual_ton=actual_pot_ton,
                float_tolerance_ton=FLOAT_TOLERANCE_TON,
            )
        )

    if market.status in (MarketStatus.open, MarketStatus.closed):
        if abs(actual_pot_ton - bank_from_fills / NANO_PER_TON) > FLOAT_TOLERANCE_TON:
            discrepancies.append(
                dict(
                    kind="pot_vs_fills",
                    message="банк не равен сумме сделок",
                    fills_nano=bank_from_fills,
                    actual_ton=actual_pot_ton,
                    float_tolerance_ton=FLOAT_TOLERANCE_TON,
                )
            )
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
        if sum(expected_payouts.values()) + sum(expected_tips.values()) != bank_from_fills:
            discrepancies.append(
                dict(
                    kind="settlement_outflow",
                    message="ожидаемые выплаты и чаевые не равны банку сделок",
                    payouts_nano=sum(expected_payouts.values()),
                    tips_nano=sum(expected_tips.values()),
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
        if sum(expected_voids.values()) != bank_from_fills:
            discrepancies.append(
                dict(
                    kind="void_outflow",
                    message="ожидаемый возврат исполненного не равен банку сделок",
                    voids_nano=sum(expected_voids.values()),
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
