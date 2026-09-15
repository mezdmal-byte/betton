"""Consumer UX architecture: feed, simple bet, portfolio/profile, auth, i18n."""
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "app" / "static" / "miniapp.html"
P2P = ROOT / "app" / "static" / "p2p.js"
ACCOUNT = ROOT / "app" / "static" / "account.js"
I18N = ROOT / "app" / "static" / "i18n.js"
CSS = ROOT / "app" / "static" / "ui.css"


def _src():
    return {
        "html": HTML.read_text(encoding="utf-8"),
        "p2p": P2P.read_text(encoding="utf-8"),
        "account": ACCOUNT.read_text(encoding="utf-8"),
        "i18n": I18N.read_text(encoding="utf-8"),
        "css": CSS.read_text(encoding="utf-8"),
    }


def test_bottom_nav_is_three_consumer_tabs():
    html = _src()["html"]
    assert html.count('data-tab="') == 3
    assert 'data-tab="feed"' in html
    assert 'data-tab="create"' in html
    assert 'data-tab="mine"' in html
    assert "Рынки" in html
    assert "Портфель" in html
    assert "Создать" in html
    assert 'data-tab="moderation"' not in html
    assert ">Лента<" not in html
    assert 'data-i18n="nav.feed">Мои' not in html


def test_feed_order_search_sort_categories_then_cards():
    html = _src()["html"]
    feed = html[html.index('data-panel="feed"') : html.index('data-panel="help"')]
    assert feed.index('id="feed-search"') < feed.index('id="sort-filters"')
    assert feed.index('id="sort-filters"') < feed.index('id="cat-filters"')
    assert feed.index('id="cat-filters"') < feed.index('id="markets"')
    assert 'id="status-filter"' not in html
    assert "<select" not in feed
    assert 'id="status-filters"' in html
    assert 'id="feed-filters-sheet"' in html
    assert html.index('id="markets"') < html.index('id="feed-filters-sheet"')
    assert "Поиск рынков, тем или авторов" in html
    assert "Поиск по вопросу" not in html


def test_top_creators_preview_after_cards_and_max_three():
    html = _src()["html"]
    paint = html[html.index("function paintFeed") : html.index("function feedBestOffersHtml")]
    assert "topCreatorsBlockHtml()" in paint
    assert "Math.min(6, cards.length)" in paint
    assert "cards.splice(at, 0, preview)" in paint
    preview = html[html.index("function topCreatorsBlockHtml") : html.index("function paintFeed")]
    assert "slice(0, 3)" in preview
    assert 'data-panel="top-creators"' in html


def test_feed_yes_no_best_offers_without_fake_odds():
    html = _src()["html"]
    p2p = _src()["p2p"]
    offers = html[html.index("function feedBestOffersHtml") : html.index("function feedCard")]
    assert "best_offers" in offers
    assert "Нет предложений" in offers
    assert "off.odds" in offers
    assert "1.50" not in offers
    assert "/orderbook" not in offers
    load = html[html.index("async function loadMarkets") : html.index("async function loadTopCreators")]
    assert "orderbook" not in load
    assert "available_to_me" in p2p
    assert "function executableBest" in p2p
    assert "paintQuoteCell" in p2p


def test_market_simple_advanced_and_no_liquidity_copy():
    p2p = _src()["p2p"]
    simple = p2p[p2p.index("function simpleP2PCard") : p2p.index("function advancedP2PCard")]
    advanced = p2p[p2p.index("function advancedP2PCard") : p2p.index("function p2pCard")]
    assert "data-simple-outcome" in simple
    assert "p2p-simple" in simple
    assert "open-advanced" in simple
    assert "market.ownOdds" in simple
    assert "p2p-limit" in advanced
    assert "advanced.title" in advanced
    assert "Сейчас нет встречного предложения" in p2p
    assert "simplePreviewHtml" in p2p
    assert 'kind === "ioc"' in p2p
    assert "available_to_me" in p2p
    assert "market.how" in p2p


def test_closed_resolved_cancelled_hide_trading_controls():
    p2p = _src()["p2p"]
    closed = p2p[p2p.index("function closedMarketCard") : p2p.index("function resolvedMarketCard")]
    resolved = p2p[p2p.index("function resolvedMarketCard") : p2p.index("function cancelledMarketCard")]
    cancelled = p2p[p2p.index("function cancelledMarketCard") : p2p.index("function simpleP2PCard")]
    for blob in (closed, resolved, cancelled):
        assert "p2p-simple" not in blob
        assert "p2p-limit" not in blob
        assert "p2p-money" not in blob
        assert "data-simple-outcome" not in blob
    assert "Приём завершён" in closed
    assert "Ожидается результат" in closed
    assert "Завершено" in resolved
    assert "Победил:" in resolved
    assert "Событие отменено" in cancelled
    assert "Средства возвращены" in cancelled


def test_portfolio_profile_split_and_admin_moderation_in_profile():
    html = _src()["html"]
    account = _src()["account"]
    mine = html[html.index('data-panel="mine"') : html.index('data-panel="profile"')]
    profile = html[html.index('data-panel="profile"') : html.index('data-panel="wallet"')]
    assert "Портфель" in html
    assert 'data-account="positions"' in mine
    assert 'data-account="orders"' in mine
    assert 'data-account="history"' in mine
    assert 'id="lang-switch"' not in mine
    assert "Как это работает" not in mine or "onboard" in mine
    assert 'id="lang-switch"' in profile or "paintProfileHeader" in account
    assert "data-profile-act=\"moderation\"" in account
    assert "Проверка событий" in account
    assert 'data-panel="moderation"' in html
    assert html.index('data-panel="moderation"') > html.index('class="tabs"') or 'data-tab="moderation"' not in html
    assert "function paintAccountHeader" in account
    assert "Доход автора" in account
    assert "function paintProfileHeader" in account


def test_auth_expired_blocking_overlay():
    html = _src()["html"]
    apply_fn = html[html.index("function applyUnauthorized()") : html.index("async function api(")]
    assert 'id="auth-block"' in html
    assert "Сессия закончилась" in html
    assert "Перезапустить BetTON" in html
    assert "auth-block" in apply_fn
    assert "block.hidden = false" in apply_fn
    assert "tg.close" in html


def test_i18n_key_parity_and_live_rerender_hooks():
    i18n = _src()["i18n"]
    html = _src()["html"]
    ru = _keys(i18n, "ru")
    en = _keys(i18n, "en")
    zh = _keys(i18n, "zh")
    assert ru == en == zh
    for key in (
        "nav.feed", "nav.mine", "market.ownOdds", "market.noLiq", "advanced.title",
        "portfolio.title", "profile.public", "auth.expiredTitle", "empty.ordersTitle",
        "order.atOdds",
    ):
        assert key in ru
    assert "function rerenderLiveUi" in html
    assert "window.onLangChange = refreshDynamicLang" in html
    assert "paintAccountHeader" in html
    assert "paintProfileHeader" in html
    assert "paintFeed" in html


def _keys(source: str, lang: str) -> set[str]:
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
    return set(__import__("re").findall(r'"([^"]+)":\s*"', source[start:end]))


def test_no_react_or_css_framework_migration():
    html = _src()["html"]
    css = _src()["css"]
    assert "react" not in html.lower()
    assert "next/router" not in html.lower()
    assert "tailwind" not in css.lower()
    assert "bootstrap" not in html.lower()
    assert "--teal: #20a39e" in css or "--teal: #20A39E" in css.lower()
    assert "--bg: #f7f8fa" in css
    assert "ui.css" in html
    assert "icons.js" in html


def test_feed_and_market_js_render_quotes_and_states(tmp_path):
    from tests.node_harness import run_node_script

    html = HTML.read_text(encoding="utf-8")
    p2p = P2P.read_text(encoding="utf-8")
    chunk = p2p + "\n" + html[html.index("function odds(") : html.index("async function loadMarkets")]
    script = (
        "const CAT_LABEL = {unique:'Уникальное', sport:'Спорт'}; let me={id:1,is_admin:false,balance:1000}; let myPositions={};\n"
        "function catLabel(key) { return CAT_LABEL[key] || key; }\n"
        "function creatorHandle(row) { return row.telegram_username ? ('@' + row.telegram_username) : (row.display_name || ''); }\n"
        "let eventTradeMode='simple'; let topCreatorsRows=["
        "{id:1,rank:1,telegram_username:'vasya',volume:12400},"
        "{id:2,rank:2,telegram_username:'masha',volume:8700},"
        "{id:3,rank:3,telegram_username:'artem',volume:6200},"
        "{id:4,rank:4,telegram_username:'extra',volume:100}"
        "]; let feedMarkets=[]; let feedTotal=8;\n"
        + chunk
        + r"""
const live = feedCard({
  id: 1, question: 'Будет дождь?', category: 'unique', status: 'open',
  mechanism: 'p2p', pot: 320, outcomes: ['Да', 'Нет'], accepting_bets: true,
  close_at: '2026-09-17T12:00:00Z',
  creator: {id: 9, telegram_username: 'vasya', display_name: 'Vasya'},
  activity: {volume: 320, unique_participants: 124},
  best_offers: [{odds: 1.82, available: 320}, {odds: 2.18, available: 190}]
});
const empty = feedCard({
  id: 2, question: 'Пустой?', category: 'sport', status: 'open',
  mechanism: 'p2p', pot: 0, outcomes: ['Да', 'Нет'], accepting_bets: true,
  close_at: '2026-09-17T12:00:00Z', best_offers: [null, null]
});
eventTradeMode = 'simple';
const simple = p2pCard({
  id: 3, question: 'Простой рынок?', category: 'unique', status: 'open',
  mechanism: 'p2p', pot: 10, outcomes: ['Да', 'Нет'], accepting_bets: true,
  close_at: '2026-09-17T12:00:00Z'
});
eventTradeMode = 'advanced';
const advanced = p2pCard({
  id: 3, question: 'Простой рынок?', category: 'unique', status: 'open',
  mechanism: 'p2p', pot: 10, outcomes: ['Да', 'Нет'], accepting_bets: true,
  close_at: '2026-09-17T12:00:00Z'
});
const closed = p2pCard({
  id: 4, question: 'Закрыто?', category: 'unique', status: 'closed',
  mechanism: 'p2p', pot: 40, outcomes: ['Да', 'Нет'], accepting_bets: false
});
const resolved = p2pCard({
  id: 5, question: 'Готово?', category: 'unique', status: 'resolved',
  mechanism: 'p2p', pot: 40, outcomes: ['Да', 'Нет'], accepting_bets: false,
  winning_outcome: 'Да'
});
const cancelled = p2pCard({
  id: 6, question: 'Отмена?', category: 'unique', status: 'cancelled',
  mechanism: 'p2p', pot: 0, outcomes: ['Да', 'Нет'], accepting_bets: false,
  cancellation_reason: 'Источник не подтвердился'
});
const noLiq = simplePreviewHtml({requested:{matched:0, remaining:100}}, {money:100, outcomeName:'Да'});
const partial = simplePreviewHtml({requested:{matched:40, remaining:60, payout:72.8}}, {money:100, outcomeName:'Да'});
const own = executableLiquidity({available_to_me:[[], []]}, 1);
const other = executableLiquidity({available_to_me:[[], [{odds:2, available:20}]]}, 1);
feedMarkets = Array.from({length: 8}, (_, i) => ({
  id: i+1, question: 'Q'+i, category: 'unique', status: 'open', mechanism: 'p2p',
  pot: 1, outcomes: ['Да','Нет'], accepting_bets: true, close_at: '2026-09-17T12:00:00Z',
  best_offers: [null, null]
}));
const nodes = {markets:{innerHTML:''}, 'feed-more':{hidden:true}};
global.document = { getElementById(id){ return nodes[id] || null; } };
paintFeed();
const feedHtml = nodes.markets.innerHTML;
const creatorsAt = feedHtml.indexOf('top-creators-block');
const firstCard = feedHtml.indexOf('feed-card');
const extra = (feedHtml.match(/@extra/g) || []).length;
const data = {live, empty, simple, advanced, closed, resolved, cancelled, noLiq, partial, own, other, creatorsAt, firstCard, extra, feedHtml};
if (typeof process !== 'undefined' && process.stdout) process.stdout.write(JSON.stringify(data));
"""
    )
    proc = run_node_script(script, tmp_path, name="consumer_ux.js")
    if proc is None:
        pytest.skip("Node.js required for consumer UX render")
    assert proc.returncode == 0, proc.stderr or proc.stdout
    import json
    data = json.loads(proc.stdout)
    assert "1.82" in data["live"] and "2.18" in data["live"]
    assert "320.00 TON" in data["live"]
    assert "Нет предложений" in data["empty"]
    assert "1.82" not in data["empty"]
    assert "data-simple-outcome" in data["simple"]
    assert "p2p-simple" in data["simple"]
    assert "advanced.title" in data["advanced"] or "Свой коэффициент" in data["advanced"]
    assert "p2p-limit" in data["advanced"]
    assert "p2p-simple" not in data["closed"]
    assert "Приём завершён" in data["closed"]
    assert "Победил" in data["resolved"]
    assert "Событие отменено" in data["cancelled"]
    assert "p2p-money" not in data["cancelled"]
    assert "Сейчас нет встречного предложения" in data["noLiq"]
    assert "Исполнится сейчас" in data["partial"]
    assert "40" in data["partial"] and "TON" in data["partial"]
    assert data["own"] is False
    assert data["other"] is True
    assert data["firstCard"] >= 0
    assert data["creatorsAt"] > data["firstCard"]
    assert data["extra"] == 0
    assert data["feedHtml"].count("top-chip") == 3
    assert data["feedHtml"].count("feed-card") == 8
