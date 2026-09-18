from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import Market, MarketStatus, P2PFill, P2POrder, User
from app.money import to_nano

PREVIEW_CREATOR = "preview_creator"
PREVIEW_TRADER = "preview_trader"


def seed_preview_data() -> None:
    """Idempotent demo data for an explicitly enabled isolated preview database."""
    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == PREVIEW_CREATOR).one_or_none() is not None:
            return

        creator = User(
            telegram_id=None,
            username=PREVIEW_CREATOR,
            telegram_username="betton_preview",
            display_name="BetTON Preview",
            balance_nano=to_nano(10_000),
            balance_legacy=10_000.0,
        )
        trader = User(
            telegram_id=None,
            username=PREVIEW_TRADER,
            telegram_username="market_maker",
            display_name="Market Maker",
            balance_nano=to_nano(10_000),
            balance_legacy=10_000.0,
        )
        db.add_all([creator, trader])
        db.flush()

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        common = dict(
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
        )

        liquid = Market(
            **common,
            question="Bitcoin будет выше $120,000 через 7 дней?",
            description="Preview-событие для проверки стакана, графика и read-only сценариев.",
            category="crypto",
            outcomes=["Да", "Нет"],
            close_at=now + timedelta(days=7),
            status=MarketStatus.open,
        )
        no_liquidity = Market(
            **common,
            question="Дождь в Москве будет завтра после 18:00?",
            description="Preview-событие без встречных заявок.",
            category="unique",
            outcomes=["Да", "Нет"],
            close_at=now + timedelta(days=1),
            status=MarketStatus.open,
        )
        resolved = Market(
            **common,
            question="TON закрыл предыдущий день выше контрольной отметки?",
            description="Preview resolved state.",
            category="crypto",
            outcomes=["Да", "Нет"],
            close_at=now - timedelta(days=1),
            status=MarketStatus.resolved,
            winning_outcome="Да",
            resolved_at=now - timedelta(hours=12),
            settlement_kind="auto",
        )
        cancelled = Market(
            **common,
            question="Тестовое событие было отменено организатором?",
            description="Preview cancelled state.",
            category="unique",
            outcomes=["Да", "Нет"],
            close_at=now - timedelta(hours=2),
            status=MarketStatus.cancelled,
            cancellation_reason="Источник результата оказался недоступен.",
            cancelled_at=now - timedelta(hours=1),
        )
        db.add_all([liquid, no_liquidity, resolved, cancelled])
        db.flush()

        # Open maker orders create visible executable depth on both outcomes.
        open_a = P2POrder(
            market_id=liquid.id,
            user_id=trader.id,
            request_id="preview-open-a",
            outcome=1,
            price=450_000,
            amount=to_nano(120),
            remaining=to_nano(120),
            filled=0,
            refunded=0,
            kind="limit",
            status="open",
            created_at=now - timedelta(minutes=18),
        )
        open_b = P2POrder(
            market_id=liquid.id,
            user_id=creator.id,
            request_id="preview-open-b",
            outcome=0,
            price=520_000,
            amount=to_nano(90),
            remaining=to_nano(90),
            filled=0,
            refunded=0,
            kind="limit",
            status="open",
            created_at=now - timedelta(minutes=12),
        )

        # Closed historical pair gives the chart/recent-trades view a real fill.
        hist_maker = P2POrder(
            market_id=liquid.id,
            user_id=trader.id,
            request_id="preview-fill-maker",
            outcome=0,
            price=550_000,
            amount=to_nano(55),
            remaining=0,
            filled=to_nano(55),
            refunded=0,
            kind="limit",
            status="filled",
            created_at=now - timedelta(hours=3),
        )
        hist_taker = P2POrder(
            market_id=liquid.id,
            user_id=creator.id,
            request_id="preview-fill-taker",
            outcome=1,
            price=450_000,
            amount=to_nano(45),
            remaining=0,
            filled=to_nano(45),
            refunded=0,
            kind="ioc",
            status="filled",
            created_at=now - timedelta(hours=3),
        )
        db.add_all([open_a, open_b, hist_maker, hist_taker])
        db.flush()

        db.add(
            P2PFill(
                market_id=liquid.id,
                maker_order_id=hist_maker.id,
                taker_order_id=hist_taker.id,
                maker_user_id=trader.id,
                taker_user_id=creator.id,
                maker_outcome=0,
                maker_stake=to_nano(55),
                taker_stake=to_nano(45),
                price=550_000,
                created_at=now - timedelta(hours=3),
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
