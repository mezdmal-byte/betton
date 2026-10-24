from datetime import datetime, timedelta, timezone

from app.schemas import MarketCreate


def test_crypto_market_category_is_supported():
    payload = MarketCreate(
        question="Bitcoin выше $100,000 к концу месяца?",
        category="crypto",
        outcomes=["Да", "Нет"],
        close_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    assert payload.category == "crypto"
