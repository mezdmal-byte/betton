"""Read-only creator and market activity aggregates from existing P2P fills."""

from __future__ import annotations

from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Market, MarketStatus, P2PFill, P2PMoneyEntry, P2POrder, Position, User
from app.money import as_ton, to_nano
from app.schemas import AccountOut, CreatorBriefOut, CreatorStatsOut, MarketActivityOut
from app.services import market_service as legacy
from app.services import p2p_ledger as ledger

PUBLIC_STATUSES = (
    MarketStatus.open,
    MarketStatus.closed,
    MarketStatus.resolved,
    MarketStatus.cancelled,
)
LIVE_POSITION_STATUSES = (MarketStatus.open, MarketStatus.closed)


def _as_int(value) -> int:
    if value is None:
        return 0
    return int(value)


def public_display_name(user: User) -> str:
    display = (user.display_name or "").strip()
    if display:
        return display
    handle = (user.telegram_username or "").strip()
    if handle:
        return f"@{handle}"
    fallback = (user.username or "").strip()
    if fallback:
        return fallback
    return f"user {user.id}"


def creator_brief(user: User) -> CreatorBriefOut:
    handle = (user.telegram_username or "").strip() or None
    return CreatorBriefOut(
        id=user.id,
        display_name=public_display_name(user),
        telegram_username=handle,
    )


def creator_briefs_map(db: Session, user_ids: list[int]) -> dict[int, CreatorBriefOut]:
    ids = sorted({int(uid) for uid in user_ids if uid is not None})
    if not ids:
        return {}
    rows = db.query(User).filter(User.id.in_(ids)).all()
    return {user.id: creator_brief(user) for user in rows}


def _empty_activity() -> MarketActivityOut:
    return MarketActivityOut()


def market_activity_map(db: Session, market_ids: list[int]) -> dict[int, MarketActivityOut]:
    ids = sorted({int(mid) for mid in market_ids if mid is not None})
    result = {mid: _empty_activity() for mid in ids}
    if not ids:
        return result
    totals = (
        db.query(
            P2PFill.market_id,
            func.count(P2PFill.id),
            func.coalesce(func.sum(P2PFill.maker_stake + P2PFill.taker_stake), 0),
        )
        .filter(P2PFill.market_id.in_(ids))
        .group_by(P2PFill.market_id)
        .all()
    )
    volume_by_market = {}
    fills_by_market = {}
    for market_id, fills, volume in totals:
        fills_by_market[int(market_id)] = _as_int(fills)
        volume_by_market[int(market_id)] = _as_int(volume)

    maker = db.query(P2PFill.market_id.label("market_id"), P2PFill.maker_user_id.label("uid")).filter(
        P2PFill.market_id.in_(ids)
    )
    taker = db.query(P2PFill.market_id.label("market_id"), P2PFill.taker_user_id.label("uid")).filter(
        P2PFill.market_id.in_(ids)
    )
    unioned = maker.union(taker).subquery()
    unique_rows = (
        db.query(unioned.c.market_id, func.count(func.distinct(unioned.c.uid)))
        .group_by(unioned.c.market_id)
        .all()
    )
    unique_by_market = {int(market_id): _as_int(count) for market_id, count in unique_rows}

    for mid in ids:
        volume_nano = volume_by_market.get(mid, 0)
        result[mid] = MarketActivityOut(
            volume=as_ton(volume_nano) if volume_nano else 0.0,
            volume_nano=volume_nano,
            fills=fills_by_market.get(mid, 0),
            unique_participants=unique_by_market.get(mid, 0),
        )
    return result


def _public_market_query(db: Session):
    query = db.query(Market).filter(Market.status.in_(PUBLIC_STATUSES))
    if hasattr(Market, "visibility"):
        query = query.filter(Market.visibility == "public")
    return query


def _creator_activity_rows(db: Session, creator_ids: list[int] | None = None) -> dict[int, dict]:
    query = db.query(Market.id, Market.creator_id, Market.status).filter(
        Market.status.in_(PUBLIC_STATUSES)
    )
    if hasattr(Market, "visibility"):
        query = query.filter(Market.visibility == "public")
    if creator_ids is not None:
        ids = sorted({int(uid) for uid in creator_ids})
        if not ids:
            return {}
        query = query.filter(Market.creator_id.in_(ids))
    markets = query.all()
    if not markets:
        return {}

    stats: dict[int, dict] = defaultdict(
        lambda: {
            "markets_created": 0,
            "active_markets": 0,
            "completed_markets": 0,
            "volume_nano": 0,
            "fills": 0,
            "unique_participants": 0,
        }
    )
    market_ids = []
    creator_by_market = {}
    for market_id, creator_id, status in markets:
        cid = int(creator_id)
        row = stats[cid]
        row["markets_created"] += 1
        if status in (MarketStatus.open, MarketStatus.closed):
            row["active_markets"] += 1
        elif status == MarketStatus.resolved:
            row["completed_markets"] += 1
        market_ids.append(int(market_id))
        creator_by_market[int(market_id)] = cid

    activity = market_activity_map(db, market_ids)
    participants: dict[int, set[int]] = defaultdict(set)
    fills = (
        db.query(P2PFill.market_id, P2PFill.maker_user_id, P2PFill.taker_user_id)
        .filter(P2PFill.market_id.in_(market_ids))
        .all()
    )
    for market_id, maker_id, taker_id in fills:
        cid = creator_by_market.get(int(market_id))
        if cid is None:
            continue
        if maker_id is not None:
            participants[cid].add(int(maker_id))
        if taker_id is not None:
            participants[cid].add(int(taker_id))

    for market_id, act in activity.items():
        cid = creator_by_market.get(int(market_id))
        if cid is None:
            continue
        stats[cid]["volume_nano"] += int(act.volume_nano)
        stats[cid]["fills"] += int(act.fills)
    for cid, users in participants.items():
        stats[cid]["unique_participants"] = len(users)
    return dict(stats)


def _stats_out(user: User, raw: dict, rank: int | None = None) -> CreatorStatsOut:
    volume_nano = _as_int(raw.get("volume_nano"))
    handle = (user.telegram_username or "").strip() or None
    return CreatorStatsOut(
        id=user.id,
        display_name=public_display_name(user),
        telegram_username=handle,
        photo_url=user.photo_url,
        rank=rank,
        markets_created=_as_int(raw.get("markets_created")),
        volume=as_ton(volume_nano) if volume_nano else 0.0,
        volume_nano=volume_nano,
        fills=_as_int(raw.get("fills")),
        unique_participants=_as_int(raw.get("unique_participants")),
        active_markets=_as_int(raw.get("active_markets")),
        completed_markets=_as_int(raw.get("completed_markets")),
    )


def list_top_creators(db: Session, limit: int = 10) -> list[CreatorStatsOut]:
    cap = max(1, min(int(limit or 10), 10))
    raw = _creator_activity_rows(db)
    if not raw:
        return []
    ranked = sorted(
        raw.items(),
        key=lambda item: (
            -int(item[1]["volume_nano"]),
            -int(item[1]["fills"]),
            -int(item[1]["unique_participants"]),
            int(item[0]),
        ),
    )[:cap]
    users = creator_users_map(db, [cid for cid, _ in ranked])
    out = []
    for index, (cid, stats) in enumerate(ranked, start=1):
        user = users.get(cid)
        if user is None:
            continue
        out.append(_stats_out(user, stats, rank=index))
    return out


def creator_users_map(db: Session, user_ids: list[int]) -> dict[int, User]:
    ids = sorted({int(uid) for uid in user_ids if uid is not None})
    if not ids:
        return {}
    return {user.id: user for user in db.query(User).filter(User.id.in_(ids)).all()}


def get_creator_profile(db: Session, user_id: int) -> tuple[CreatorStatsOut, list[Market]]:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    raw = _creator_activity_rows(db, [user_id]).get(user_id) or {
        "markets_created": 0,
        "active_markets": 0,
        "completed_markets": 0,
        "volume_nano": 0,
        "fills": 0,
        "unique_participants": 0,
    }
    query = (
        db.query(Market)
        .filter(Market.creator_id == user_id, Market.status.in_(PUBLIC_STATUSES))
        .order_by(Market.id.desc())
    )
    if hasattr(Market, "visibility"):
        query = query.filter(Market.visibility == "public")
    markets = query.all()
    for market in markets:
        if legacy._maybe_auto_close(db, market):
            db.commit()
    return _stats_out(user, raw), markets


def creator_earnings_nano(db: Session, user_id: int) -> int:
    """Sum existing creator tip credits from the P2P journal. Read-only; does not move funds."""
    total = (
        db.query(func.coalesce(func.sum(P2PMoneyEntry.amount), 0))
        .join(Market, Market.id == P2PMoneyEntry.market_id)
        .filter(
            P2PMoneyEntry.op_type == ledger.OP_TIP,
            P2PMoneyEntry.to_user_id == int(user_id),
            Market.creator_id == int(user_id),
        )
        .scalar()
    )
    return _as_int(total)


def account_summary(db: Session, user: User) -> AccountOut:
    reserved_nano = _as_int(
        db.query(func.coalesce(func.sum(P2POrder.remaining), 0))
        .filter(
            P2POrder.user_id == user.id,
            P2POrder.status == "open",
            P2POrder.remaining > 0,
        )
        .scalar()
    )
    live_ids = [row[0] for row in db.query(Market.id).filter(Market.status.in_(LIVE_POSITION_STATUSES)).all()]
    in_positions_nano = 0
    if live_ids:
        in_positions_nano = _as_int(
            db.query(func.coalesce(func.sum(P2POrder.filled), 0))
            .filter(P2POrder.user_id == user.id, P2POrder.filled > 0, P2POrder.market_id.in_(live_ids))
            .scalar()
        )
        positions = (
            db.query(Position)
            .filter(Position.user_id == user.id, Position.market_id.in_(live_ids), Position.claimed.is_(False))
            .all()
        )
        p2p_live = {
            int(mid)
            for (mid,) in db.query(Market.id).filter(
                Market.id.in_(live_ids), Market.mechanism == "p2p"
            ).all()
        }
        for pos in positions:
            if int(pos.market_id) in p2p_live:
                continue
            costs = list(pos.costs or [])
            if len(costs) < 2:
                costs = [float(pos.cost_yes or 0), float(pos.cost_no or 0)]
            in_positions_nano += to_nano(sum(float(x or 0) for x in costs))
    balance_nano = int(user.balance_nano or 0)
    earnings_nano = creator_earnings_nano(db, user.id)
    return AccountOut(
        id=user.id,
        username=user.username,
        telegram_id=user.telegram_id,
        telegram_username=user.telegram_username,
        display_name=user.display_name,
        photo_url=user.photo_url,
        is_admin=user.is_admin,
        balance=as_ton(balance_nano),
        balance_nano=balance_nano,
        reserved=as_ton(reserved_nano) if reserved_nano else 0.0,
        reserved_nano=reserved_nano,
        in_positions=as_ton(in_positions_nano) if in_positions_nano else 0.0,
        in_positions_nano=in_positions_nano,
        creator_earnings=as_ton(earnings_nano) if earnings_nano else 0.0,
        creator_earnings_nano=earnings_nano,
    )


def attach_market_views(db: Session, markets: list[Market], include_share_token: bool = False) -> list:
    from app.services import p2p_service

    offers = p2p_service.best_offers_map(db, markets)
    creators = creator_briefs_map(db, [m.creator_id for m in markets])
    activity = market_activity_map(db, [m.id for m in markets])
    return [
        legacy.market_to_out(
            market,
            best_offers=offers.get(market.id),
            creator=creators.get(market.creator_id),
            activity=activity.get(market.id),
            include_share_token=include_share_token,
        )
        for market in markets
    ]
