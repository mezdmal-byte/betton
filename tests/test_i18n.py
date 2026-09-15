from pathlib import Path
from types import SimpleNamespace

from bot.main import TEXTS, bot_copy, bot_lang, HELP_TEXT, START_TEXT

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "app" / "static" / "miniapp.html"
I18N = ROOT / "app" / "static" / "i18n.js"


def test_i18n_dictionaries_cover_ru_en_zh_and_fallback():
    text = I18N.read_text(encoding="utf-8")
    assert 'const I18N = {' in text
    assert "ru:" in text and "en:" in text and "zh:" in text
    assert "function detectLang" in text
    assert "function setLang" in text
    assert "function applyI18n" in text
    ru_fee = 'Сервисный сбор — 1% только с чистой прибыли победителя'
    assert ru_fee in text
    assert "без комиссии" not in text.lower()
    assert "Service fee is 1%" in text
    assert "服务费仅为获胜者净利润的 1%" in text
    html = HTML.read_text(encoding="utf-8")
    assert "/static/i18n.js" in html
    assert 'id="lang-switch"' in html
    assert 'data-lang="ru"' in html
    assert 'data-lang="en"' in html
    assert 'data-lang="zh"' in html
    assert 'data-i18n="nav.feed"' in html
    assert "function detectLang" in text


def test_onboarding_has_honest_fee_copy_and_no_zero_fee_claim():
    html = HTML.read_text(encoding="utf-8")
    assert 'id="onboarding"' in html
    assert "BetTON — P2P рынок прогнозов." in html
    assert "Создавай события или находи готовые." in html
    assert "0% за создание и размещение заявки." in html
    assert "Сервисный сбор — 1% только с чистой прибыли победителя." in html
    assert "Посмотреть события" in html
    assert "Создать событие" in html
    assert "Как это работает" in html
    assert "betton-onboard-v1" in html
    assert "без комиссии" not in html.lower()
    assert "без комиссий" not in html.lower()


def test_create_form_is_compact_with_expandable_fees():
    html = HTML.read_text(encoding="utf-8")
    create = html[html.index('data-panel="create"') : html.index('data-panel="mine"')]
    assert "<details" in create
    assert "Условия и сборы" in create
    assert create.count("Пример: ставка 100 TON") == 1
    assert create.index("<details") < create.index("Пример: ставка 100 TON")
    assert 'data-vis="public"' in create
    assert 'data-vis="unlisted"' in create


def test_user_generated_questions_are_not_in_i18n_dict():
    text = I18N.read_text(encoding="utf-8")
    assert "Will it rain" not in text
    assert "Будет ли завтра дождь" not in text


def test_responsive_desktop_container_and_compact_nav():
    html = HTML.read_text(encoding="utf-8")
    css = html[html.index("<style>") : html.index("</style>")]
    assert "--app-max: 480px" in css
    assert "@media (width >= 768px)" in css
    assert "@media (width >= 1024px)" in css
    assert "@media (width >= 1280px)" in css
    assert "grid-template-columns: 1fr 1fr" in css
    assert "account-desktop" in css
    assert html.count('data-tab="') == 4
    assert 'data-tab="feed">Лента</button>' in html or 'data-i18n="nav.feed">Лента</button>' in html


def test_bot_start_help_follow_language_code_with_en_fallback():
    assert "сервисный сбор" in START_TEXT.lower()
    assert "без комиссии" not in START_TEXT.lower()
    ru = bot_copy(SimpleNamespace(from_user=SimpleNamespace(language_code="ru")))
    en = bot_copy(SimpleNamespace(from_user=SimpleNamespace(language_code="en-US")))
    zh = bot_copy(SimpleNamespace(from_user=SimpleNamespace(language_code="zh-hans")))
    fallback = bot_copy(SimpleNamespace(from_user=SimpleNamespace(language_code="es")))
    unknown = bot_copy(SimpleNamespace(from_user=None))
    assert ru["start"] == TEXTS["ru"]["start"]
    assert en["start"] == TEXTS["en"]["start"]
    assert zh["help"] == TEXTS["zh"]["help"]
    assert fallback["start"] == TEXTS["en"]["start"]
    assert unknown["start"] == TEXTS["en"]["start"]
    assert bot_lang(SimpleNamespace(from_user=SimpleNamespace(language_code="ru-RU"))) == "ru"
    assert HELP_TEXT == TEXTS["ru"]["help"]
