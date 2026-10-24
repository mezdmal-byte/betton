"""Read-only user-facing money history from the P2P journal and settlements."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Market, P2PMoneyEntry, SettlementRecord
from app.money import as_ton, to_nano
from app.services import p2p_ledger as ledger
from app.services.market_service import as_utc

TX_RESERVE = "reserve"
TX_FILL = "fill"
TX_REFUND = "refund"
TX_CANCEL = "cancel"
TX_WIN = "win"
TX_LOSS = "loss"
TX_FEE = "fee"
TX_VOID = "void"
TX_CREDIT = "credit"
TX_DEPOSIT = "deposit"
TX_WITHDRAW = "withdraw"

FILTERS = {
    "all": None,
    "bets": {TX_RESERVE, TX_FILL},
    "wins": {TX_WIN},
    "refunds": {TX_REFUND, TX_CANCEL, TX_VOID},
    "deposits": {TX_DEPOSIT},
    "withdrawals": {TX_WITHDRAW},
}


def _nano(value) -> int:
    if value is None:
        return 0
    if isinstance(value, int):
        return value
    return to_nano(value)


def _row(
    *,
    key: str,
    tx_type: str,
    market_id: int | None,
    question: str,
    created_at: datetime | None,
    amount_nano: int,
    display_nano: int | None = None,
    informational: bool = False,
) -> dict:
    display = amount_nano if display_nano is None else display_nano
    return {
        "id": key,
        "type": tx_type,
        "market_id": market_id,
        "question": question or "",
        "created_at": as_utc(created_at),
        "amount_nano": int(amount_nano),
        "amount": as_ton(abs(int(amount_nano))) * (1 if amount_nano >= 0 else -1) if amount_nano else 0.0,
        "display_nano": int(display),
        "display_amount": as_ton(abs(int(display))) * (1 if display >= 0 else -1) if display else 0.0,
        "informational": bool(informational),
    }


def list_transactions(db: Session, user_id: int, kind: str | None = None) -> list[dict]:
    wanted = FILTERS.get((kind or "all").strip().lower(), FILTERS["all"])
    entries = (
        db.query(P2PMoneyEntry)
        .filter(
            or_(
                P2PMoneyEntry.from_user_id == user_id,
                P2PMoneyEntry.to_user_id == user_id,
            )
        )
        .order_by(P2PMoneyEntry.id.desc())
        .all()
    )
    settlements = (
        db.query(SettlementRecord)
        .filter(SettlementRecord.user_id == user_id)
        .order_by(SettlementRecord.id.desc())
        .all()
    )
    market_ids = {int(entry.market_id) for entry in entries} | {int(row.market_id) for row in settlements}
    markets = (
        {m.id: m for m in db.query(Market).filter(Market.id.in_(market_ids)).all()}
        if market_ids
        else {}
    )
    questions = {mid: (m.question or "") for mid, m in markets.items()}
    settled_markets = {int(row.market_id) for row in settlements}

    rows: list[dict] = []
    for entry in entries:
        mid = int(entry.market_id)
        question = questions.get(mid, "")
        created = entry.created_at
        amount = int(entry.amount)
        if entry.op_type == ledger.OP_RESERVE and entry.from_user_id == user_id:
            rows.append(
                _row(
                    key=f"reserve:{entry.id}",
                    tx_type=TX_RESERVE,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=-amount,
                )
            )
        elif entry.op_type == ledger.OP_FILL_ESCROW and entry.from_user_id == user_id:
            rows.append(
                _row(
                    key=f"fill:{entry.id}",
                    tx_type=TX_FILL,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=0,
                    display_nano=-amount,
                    informational=True,
                )
            )
        elif entry.op_type == ledger.OP_REFUND and entry.to_user_id == user_id:
            reason = (entry.reason or "").strip()
            tx_type = TX_CANCEL if reason in {"cancel", "ioc", "close"} else TX_REFUND
            rows.append(
                _row(
                    key=f"refund:{entry.id}",
                    tx_type=tx_type,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=amount,
                )
            )
        elif entry.op_type == ledger.OP_VOID_RETURN and entry.to_user_id == user_id:
            rows.append(
                _row(
                    key=f"void:{entry.id}",
                    tx_type=TX_VOID,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=amount,
                )
            )
        elif entry.op_type == ledger.OP_PAYOUT and entry.to_user_id == user_id:
            if mid in settled_markets:
                continue
            rows.append(
                _row(
                    key=f"payout:{entry.id}",
                    tx_type=TX_WIN,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=amount,
                )
            )
        elif entry.op_type == ledger.OP_TIP and entry.to_user_id == user_id and entry.from_user_id != user_id:
            rows.append(
                _row(
                    key=f"credit:{entry.id}",
                    tx_type=TX_CREDIT,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=amount,
                )
            )

    for rec in settlements:
        mid = int(rec.market_id)
        question = rec.question or questions.get(mid, "")
        created = rec.resolved_at
        market = markets.get(mid)
        voided = bool(market and market.settlement_kind == "void")
        payout_nano = _nano(rec.payout)
        tip_nano = _nano(rec.tip)
        credited_nano = _nano(rec.credited)
        stakes_nano = _nano(rec.stakes_total)
        if voided:
            continue
        if payout_nano > 0:
            rows.append(
                _row(
                    key=f"win:{rec.id}",
                    tx_type=TX_WIN,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=payout_nano,
                )
            )
            if tip_nano > 0:
                rows.append(
                    _row(
                        key=f"fee:{rec.id}",
                        tx_type=TX_FEE,
                        market_id=mid,
                        question=question,
                        created_at=created,
                        amount_nano=-tip_nano,
                    )
                )
        elif stakes_nano > 0:
            rows.append(
                _row(
                    key=f"loss:{rec.id}",
                    tx_type=TX_LOSS,
                    market_id=mid,
                    question=question,
                    created_at=created,
                    amount_nano=0,
                    display_nano=-stakes_nano,
                    informational=True,
                )
            )
        _ = credited_nano

    rows.sort(
        key=lambda item: (item["created_at"] or datetime.min.replace(tzinfo=timezone.utc), item["id"]),
        reverse=True,
    )
    if wanted is not None:
        rows = [row for row in rows if row["type"] in wanted]
    return rows
