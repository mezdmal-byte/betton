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
    assert "Вознаграждение автора — 75% сервисного сбора" in text
    assert "Автор события получает 75% сервисного сбора" in text
    assert "Creator reward — 75% of the service fee" in text
    assert "作者奖励 — 服务费的 75%" in text
    assert "Автор получает 1%" not in text
    assert "creator gets 1%" not in text.lower()
    html = HTML.read_text(encoding="utf-8")
    account = (ROOT / "app" / "static" / "account.js").read_text(encoding="utf-8")
    blob = html + "\n" + account
    assert "/static/i18n.js" in html
    assert 'id="lang-switch"' in blob
    assert 'data-lang="ru"' in blob
    assert 'data-lang="en"' in blob
    assert 'data-lang="zh"' in blob
    assert 'data-i18n="nav.feed"' in html
    assert "function detectLang" in text


def test_onboarding_has_honest_fee_copy_and_no_zero_fee_claim():
    html = HTML.read_text(encoding="utf-8")
    onboard = html[html.index('id="onboarding"') : html.index('class="feed-toolbar"')]
    assert "BetTON — P2P рынок прогнозов" in onboard
    assert "Создавай события или находи готовые." in onboard
    assert "Посмотреть события" in onboard
    assert "Создать событие" in onboard
    assert "Как это работает · Сбор 1% ⓘ" in onboard
    assert "0% за создание и размещение заявки." not in onboard
    assert "Автор события получает 75%" not in onboard
    assert "betton-onboard-v1" in html
    assert "без комиссии" not in html.lower()
    assert "без комиссий" not in html.lower()


def test_create_form_is_compact_with_expandable_fees():
    html = HTML.read_text(encoding="utf-8")
    create = html[html.index('data-panel="create"') : html.index('data-panel="mine"')]
    assert "<details" in create
    assert "Правила и сборы" in create
    assert create.count("Пример: ставка 100 TON") == 1
    assert create.index("<details") < create.index("Пример: ставка 100 TON")
    assert 'data-vis="public"' in create
    assert 'data-vis="unlisted"' in create
    assert "Вознаграждение автора — 75% сервисного сбора" in create
    assert "Автор события получает 75% сервисного сбора" in create
    assert "Автор получает 1%" not in create


def test_user_generated_questions_are_not_in_i18n_dict():
    text = I18N.read_text(encoding="utf-8")
    assert "Will it rain" not in text
    assert "Будет ли завтра дождь" not in text


def test_responsive_desktop_container_and_compact_nav():
    html = HTML.read_text(encoding="utf-8")
    css = (ROOT / "app" / "static" / "ui.css").read_text(encoding="utf-8")
    assert "--app-max: 480px" in css
    assert "@media (width >= 768px)" in css
    assert "@media (width >= 1024px)" in css
    assert "grid-template-columns: 1fr 1fr" in css
    assert "account-desktop" in css
    assert html.count('data-tab="') == 3
    assert 'data-tab="feed"' in html
    assert "Рынки" in html


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


def _i18n_keys(source: str, lang: str) -> set[str]:
    start = source.index(f"{lang}: {{")
    depth = 0
    end = None
    for index, ch in enumerate(source[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = index
                break
    block = source[start:end]
    return set(__import__("re").findall(r'"([^"]+)":\s*"', block))


def test_i18n_key_parity_across_ru_en_zh():
    text = I18N.read_text(encoding="utf-8")
    ru = _i18n_keys(text, "ru")
    en = _i18n_keys(text, "en")
    zh = _i18n_keys(text, "zh")
    assert ru
    assert ru == en == zh


def test_account_overview_rerenders_without_russian_after_lang_switch(tmp_path):
    from tests.node_harness import run_node_script

    account = (ROOT / "app" / "static" / "account.js").read_text(encoding="utf-8")
    i18n = I18N.read_text(encoding="utf-8")
    start = account.index("function paintAccountHeader")
    end = account.index("function paintProfileHeader")
    header_fn = account[start:end]
    script = (
        i18n
        + r"""
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fmtTon(v) { return Number(v).toFixed(2) + ' TON'; }
function displayName() { return 'Dmitry'; }
let me = { id: 1, balance: 12.5, telegram_username: 'dmitry' };
let accountState = { reserved: 1, in_positions: 2, creator_earnings: 1.25, creator_earnings_nano: 1250000000 };
let headerHtml = '';
global.document = {
  documentElement: { lang: 'ru' },
  querySelectorAll() { return []; },
  getElementById(id) {
    if (id !== 'account-header') return null;
    return { set innerHTML(v) { headerHtml = v; }, get innerHTML() { return headerHtml; } };
  }
};
"""
        + header_fn
        + r"""
setLang('ru', false);
paintAccountHeader(accountState);
const ru = headerHtml;
setLang('zh', false);
paintAccountHeader(accountState);
const zh = headerHtml;
setLang('en', false);
paintAccountHeader(accountState);
const en = headerHtml;
const data = { ru, zh, en };
if (typeof process !== 'undefined' && process.stdout) process.stdout.write(JSON.stringify(data));
"""
    )
    proc = run_node_script(script, tmp_path, name="i18n_overview.js")
    if proc is None:
        import pytest
        pytest.skip("Node.js required for live i18n rerender")
    assert proc.returncode == 0, proc.stderr or proc.stdout
    import json
    data = json.loads(proc.stdout)
    assert "Портфель" in data["ru"]
    assert "Доход автора" in data["ru"]
    assert "В резерве" in data["ru"]
    assert not __import__("re").search(r"[А-Яа-яЁё]", data["zh"])
    assert not __import__("re").search(r"[А-Яа-яЁё]", data["en"])
    assert "Creator earnings" in data["en"] or "earnings" in data["en"].lower()
    assert "1.25 TON" in data["zh"]
    assert "Портфель" not in data["zh"]
    assert "Портфель" not in data["en"]
    assert "Доход автора" not in data["en"]
