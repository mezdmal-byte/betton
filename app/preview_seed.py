from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import Market, MarketStatus, P2PFill, P2POrder, User
from app.money import to_nano

PREVIEW_CREATOR = "preview_creator"
PREVIEW_TRADER = "preview_trader"


def _user(db, username: str, telegram_username: str, display_name: str) -> User:
    user = db.query(User).filter(User.username == username).one_or_none()
    if user is None:
        user = User(
            telegram_id=None,
            username=username,
            telegram_username=telegram_username,
            display_name=display_name,
            balance_nano=to_nano(100_000),
            balance_legacy=100_000.0,
        )
        db.add(user)
        db.flush()
    else:
        user.telegram_username = telegram_username
        user.display_name = display_name
    return user


def _market(
    db,
    creator: User,
    *,
    question: str,
    description: str,
    category: str,
    close_at: datetime,
    status: MarketStatus = MarketStatus.open,
) -> Market:
    market = (
        db.query(Market)
        .filter(Market.creator_id == creator.id, Market.question == question)
        .one_or_none()
    )
    values = dict(
        creator_id=creator.id,
        mechanism="p2p",
        b=1.0,
        q_yes=0.0,
        q_no=0.0,
        q=[0.0, 0.0],
        lock_ton=0,
        pot=0,
        lock_returned=True,
        visibility="public",
        p2p_journal_coverage="incomplete",
        question=question,
        description=description,
        category=category,
        outcomes=["Да", "Нет"],
        close_at=close_at,
        status=status,
    )
    if market is None:
        market = Market(**values)
        db.add(market)
        db.flush()
    else:
        for key, value in values.items():
            setattr(market, key, value)
    return market


def _order(
    db,
    *,
    market: Market,
    user: User,
    request_id: str,
    outcome: int,
    price: int,
    amount_ton: float,
    remaining_ton: float,
    filled_ton: float,
    kind: str,
    status: str,
    created_at: datetime,
) -> P2POrder:
    order = (
        db.query(P2POrder)
        .filter(P2POrder.user_id == user.id, P2POrder.request_id == request_id)
        .one_or_none()
    )
    values = dict(
        market_id=market.id,
        user_id=user.id,
        request_id=request_id,
        outcome=outcome,
        price=price,
        amount=to_nano(amount_ton),
        remaining=to_nano(remaining_ton),
        filled=to_nano(filled_ton),
        refunded=0,
        kind=kind,
        status=status,
        created_at=created_at,
    )
    if order is None:
        order = P2POrder(**values)
        db.add(order)
        db.flush()
    else:
        for key, value in values.items():
            setattr(order, key, value)
    return order


def _fill(
    db,
    *,
    market: Market,
    maker_user: User,
    taker_user: User,
    key: str,
    maker_outcome: int,
    price: int,
    maker_stake_ton: float,
    taker_stake_ton: float,
    created_at: datetime,
) -> None:
    maker = _order(
        db,
        market=market,
        user=maker_user,
        request_id=f"{key}-maker",
        outcome=maker_outcome,
        price=price,
        amount_ton=maker_stake_ton,
        remaining_ton=0,
        filled_ton=maker_stake_ton,
        kind="limit",
        status="filled",
        created_at=created_at,
    )
    taker = _order(
        db,
        market=market,
        user=taker_user,
        request_id=f"{key}-taker",
        outcome=1 - maker_outcome,
        price=1_000_000 - price,
        amount_ton=taker_stake_ton,
        remaining_ton=0,
        filled_ton=taker_stake_ton,
        kind="ioc",
        status="filled",
        created_at=created_at,
    )
    row = (
        db.query(P2PFill)
        .filter(P2PFill.maker_order_id == maker.id, P2PFill.taker_order_id == taker.id)
        .one_or_none()
    )
    values = dict(
        market_id=market.id,
        maker_order_id=maker.id,
        taker_order_id=taker.id,
        maker_user_id=maker_user.id,
        taker_user_id=taker_user.id,
        maker_outcome=maker_outcome,
        maker_stake=to_nano(maker_stake_ton),
        taker_stake=to_nano(taker_stake_ton),
        price=price,
        created_at=created_at,
    )
    if row is None:
        db.add(P2PFill(**values))
    else:
        for field, value in values.items():
            setattr(row, field, value)


def _depth(
    db,
    *,
    market: Market,
    maker: User,
    prefix: str,
    outcome: int,
    rows: list[tuple[int, float]],
    now: datetime,
) -> None:
    for index, (price, amount) in enumerate(rows):
        _order(
            db,
            market=market,
            user=maker,
            request_id=f"{prefix}-{index}",
            outcome=outcome,
            price=price,
            amount_ton=amount,
            remaining_ton=amount,
            filled_ton=0,
            kind="limit",
            status="open",
            created_at=now - timedelta(minutes=4 + index * 3),
        )


def seed_preview_data() -> None:
    """Idempotent demo data for the isolated Render preview only."""
    db = SessionLocal()
    try:
        creator = _user(db, PREVIEW_CREATOR, "betton_preview", "BetTON Preview")
        trader = _user(db, PREVIEW_TRADER, "market_maker", "Market Maker")
        trader_b = _user(db, "preview_trader_b", "depth_maker", "Depth Maker")

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        bitcoin = _market(
            db,
            creator,
            question="Bitcoin будет выше $120,000 через 7 дней?",
            description=(
                "Демо-событие для проверки быстрого входа, стакана и истории фактически "
                "исполненных сделок. Данные созданы только в preview."
            ),
            category="crypto",
            close_at=now + timedelta(days=7),
        )
        rain = _market(
            db,
            creator,
            question="Дождь в Москве будет завтра после 18:00?",
            description=(
                "Демо-событие с другим профилем коэффициентов и объёмов, чтобы сравнить "
                "график и многоуровневый стакан."
            ),
            category="unique",
            close_at=now + timedelta(days=1),
        )

        # Nine visible price levels on each side. Opposing maker prices are
        # intentionally kept below PRICE in every combination, so the demo book
        # is not crossed: these orders could coexist without matching each other.
        # The UI initially shows five levels and can expand to the full depth.
        _depth(
            db,
            market=bitcoin,
            maker=trader,
            prefix="preview-btc-a-depth",
            outcome=1,
            rows=[
                (460_000, 92),
                (450_000, 118),
                (440_000, 76),
                (430_000, 144),
                (420_000, 88),
                (410_000, 132),
                (400_000, 64),
                (390_000, 105),
                (380_000, 81),
            ],
            now=now,
        )
        _depth(
            db,
            market=bitcoin,
            maker=trader_b,
            prefix="preview-btc-b-depth",
            outcome=0,
            rows=[
                (520_000, 126),
                (510_000, 84),
                (500_000, 138),
                (490_000, 74),
                (480_000, 112),
                (470_000, 96),
                (460_000, 68),
                (450_000, 121),
                (440_000, 79),
            ],
            now=now,
        )
        _depth(
            db,
            market=rain,
            maker=trader,
            prefix="preview-rain-a-depth",
            outcome=1,
            rows=[
                (430_000, 86),
                (420_000, 104),
                (410_000, 73),
                (400_000, 129),
                (390_000, 91),
                (380_000, 115),
                (370_000, 67),
                (360_000, 99),
                (350_000, 78),
            ],
            now=now,
        )
        _depth(
            db,
            market=rain,
            maker=trader_b,
            prefix="preview-rain-b-depth",
            outcome=0,
            rows=[
                (550_000, 119),
                (540_000, 82),
                (530_000, 136),
                (520_000, 76),
                (510_000, 108),
                (500_000, 94),
                (490_000, 71),
                (480_000, 124),
                (470_000, 80),
            ],
            now=now,
        )

        btc_history = [
            (650_000, 65, 35),
            (600_000, 90, 60),
            (560_000, 70, 55),
            (520_000, 130, 120),
            (500_000, 90, 90),
            (540_000, 108, 92),
            (580_000, 87, 63),
            (620_000, 124, 76),
        ]
        for index, (price, maker_stake, taker_stake) in enumerate(btc_history):
            _fill(
                db,
                market=bitcoin,
                maker_user=trader,
                taker_user=creator,
                key=f"preview-btc-history-{index}",
                maker_outcome=0,
                price=price,
                maker_stake_ton=maker_stake,
                taker_stake_ton=taker_stake,
                created_at=now - timedelta(hours=16 - index * 2),
            )

        rain_history = [
            (430_000, 43, 57),
            (460_000, 69, 81),
            (500_000, 60, 60),
            (540_000, 108, 92),
            (570_000, 57, 43),
            (530_000, 106, 94),
            (490_000, 73.5, 76.5),
            (450_000, 90, 110),
        ]
        for index, (price, maker_stake, taker_stake) in enumerate(rain_history):
            _fill(
                db,
                market=rain,
                maker_user=trader_b,
                taker_user=creator,
                key=f"preview-rain-history-{index}",
                maker_outcome=0,
                price=price,
                maker_stake_ton=maker_stake,
                taker_stake_ton=taker_stake,
                created_at=now - timedelta(hours=18 - index * 2),
            )

        # Keep non-open states available for spot-checking other UI without
        # cluttering the default open-market feed.
        resolved = _market(
            db,
            creator,
            question="TON закрыл предыдущий день выше контрольной отметки?",
            description="Preview resolved state.",
            category="crypto",
            close_at=now - timedelta(days=1),
            status=MarketStatus.resolved,
        )
        resolved.winning_outcome = "Да"
        resolved.resolved_at = now - timedelta(hours=12)
        resolved.settlement_kind = "auto"

        cancelled = _market(
            db,
            creator,
            question="Тестовое событие было отменено организатором?",
            description="Preview cancelled state.",
            category="unique",
            close_at=now - timedelta(hours=2),
            status=MarketStatus.cancelled,
        )
        cancelled.cancellation_reason = "Источник результата оказался недоступен."
        cancelled.cancelled_at = now - timedelta(hours=1)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
