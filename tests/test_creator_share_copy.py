from pathlib import Path

from app.config import TIP_CREATOR_SHARE, TIP_PLATFORM_SHARE, settings
from app.money import tip_nano

ROOT = Path(__file__).resolve().parents[1]


def test_existing_one_percent_fee_and_75_25_split_unchanged():
    assert TIP_CREATOR_SHARE == 0.75
    assert TIP_PLATFORM_SHARE == 0.25
    assert settings.tip_cap == 0.01
    assert tip_nano(10_000_000_000) == 100_000_000
    assert tip_nano(80_000_000_000) == 800_000_000

    config = (ROOT / "app" / "config.py").read_text(encoding="utf-8")
    money = (ROOT / "app" / "money.py").read_text(encoding="utf-8")
    ledger = (ROOT / "app" / "services" / "p2p_ledger.py").read_text(encoding="utf-8")
    market = (ROOT / "app" / "services" / "market_service.py").read_text(encoding="utf-8")
    p2p = (ROOT / "app" / "services" / "p2p_service.py").read_text(encoding="utf-8")

    assert "TIP_CREATOR_SHARE = 0.75" in config
    assert "TIP_PLATFORM_SHARE = 0.25" in config
    assert "def tip_nano(profit_nano, rate=0.01):" in money
    assert "creator_tip = 0 if int(winner_id) == int(creator_id) else tip * 75 // 100" in ledger
    assert "creator_tip = tip * 75 // 100" in market
    assert "credits[creator.id] = credits.get(creator.id, 0) + tip * 75 // 100" in market
    assert "tip * 75 // 100" in market
    assert "tip*75//100" in p2p


def test_ui_explains_existing_75_25_and_not_an_extra_fee():
    i18n = (ROOT / "app" / "static" / "i18n.js").read_text(encoding="utf-8")
    html = (ROOT / "app" / "static" / "miniapp.html").read_text(encoding="utf-8")
    account = (ROOT / "app" / "static" / "account.js").read_text(encoding="utf-8")
    blob = "\n".join([i18n, html, account])

    assert "Сервисный сбор — 1% только с чистой прибыли победителя" in blob
    assert "Вознаграждение автору: 75% сервисного сбора" in blob
    assert "Автор события получает 75% сервисного сбора, начисленного с выигрыша другого пользователя. 25% получает платформа." in blob
    assert "Это не дополнительная комиссия: общий сбор остаётся 1% от чистой прибыли победителя." in blob
    assert "Creator reward: 75% of the service fee" in i18n
    assert "The platform receives 25%" in i18n
    assert "作者奖励：服务费的 75%" in i18n
    assert "平台获得 25%" in i18n
    assert "Автор получает 1%" not in blob
    assert "дополнительный 1%" not in blob.lower()
    assert "an extra 1%" not in blob.lower()
    assert "额外的 1%" not in blob
