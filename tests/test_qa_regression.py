"""QA pass regressions: exact simple-bet odds, wallet DOM, back nav, preselect, auth overlay."""
from html.parser import HTMLParser
from pathlib import Path

import pytest

from tests.node_harness import run_node_script

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "app" / "static" / "miniapp.html"
P2P = ROOT / "app" / "static" / "p2p.js"
ACCOUNT = ROOT / "app" / "static" / "account.js"
I18N = ROOT / "app" / "static" / "i18n.js"


def _run(script: str, tmp_path: Path, name: str) -> dict:
    import json

    proc = run_node_script(script, tmp_path, name=name)
    if proc is None:
        pytest.skip("Node.js required for QA regression JS")
    assert proc.returncode == 0, proc.stderr or proc.stdout
    return json.loads(proc.stdout)


class _Tree(HTMLParser):
    VOID = {"br", "img", "input", "hr", "meta", "link", "span"}  # span is not void; keep real voids only

    def __init__(self):
        super().__init__()
        self.root = {"tag": "root", "id": None, "class": None, "children": []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        node = {"tag": tag, "id": attrs.get("id"), "class": attrs.get("class"), "children": []}
        self.stack[-1]["children"].append(node)
        if tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i]["tag"] == tag:
                del self.stack[i:]
                break


def _find(node, **pred):
    if all(node.get(k) == v for k, v in pred.items()):
        return node
    for child in node.get("children") or []:
        found = _find(child, **pred)
        if found:
            return found
    return None


def _parent_of(node, target_id, parent=None):
    if node.get("id") == target_id:
        return parent
    for child in node.get("children") or []:
        found = _parent_of(child, target_id, node)
        if found is not None:
            return found
    return None


def test_simple_bet_keeps_canonical_odds_and_places_ioc(tmp_path: Path):
    exact = 2.111110970359
    p2p = P2P.read_text(encoding="utf-8")
    script = (
        p2p
        + r"""
let me = {id:2, balance:1000};
let authBlocked = false;
const placed = [];
async function api(path, options) {
  const body = JSON.parse(options.body);
  if (String(path).includes('/orders/quote')) {
    return {
      requested: {matched: 40, remaining: 0, payout: 84.444},
      available: {matched: 40, remaining: 0, worst_odds: body.odds}
    };
  }
  placed.push(body);
  return {filled: 40, remaining: 0, refunded: 60, status: 'filled'};
}
function requireLogin() {}
function toast() {}
function escapeHtml(s) { return String(s); }
function localeTag() { return "en-US"; }
function friendlyError(m) { return m; }
const side = {value:'1', selectedIndex:1, options:[{textContent:'Да'},{textContent:'Нет'}]};
const money = {value:'100'};
const odds = {value:'2', type:'hidden'};
const preview = {textContent:'', innerHTML:'', classList:{remove(){}}};
const button = {disabled:true, textContent:'', dataset:{}};
const card = {
  dataset: {id:'7', tradeMode:'simple'},
  quoteVersion: 0,
  availableQuote: null,
  classList: {add(){}, remove(){}},
  orderbookData: {available_to_me:[[], [{odds: EXACT, available:40}]]},
  querySelector(sel) {
    if (sel === '.p2p-side') return side;
    if (sel === '.p2p-money') return money;
    if (sel === '.p2p-odds') return odds;
    if (sel === '.p2p-preview') return preview;
    if (sel === "[data-act='p2p-simple']") return button;
    return null;
  }
};
(async () => {
  await p2pSimpleQuote(card);
  const displayCta = button.textContent;
  const hidden = odds.value;
  const quoted = JSON.parse(card.availableQuote.terms);
  odds.value = String(Math.round(EXACT * 100) / 100);
  let error = null;
  try { await p2pPlace(card, 'ioc'); } catch (e) { error = String(e.message || e); }
  const data = {
    hidden, displayCta, quotedOdds: quoted.odds, placed: placed[0], error,
    preview: preview.innerHTML, rounded: Math.round(EXACT * 100) / 100,
    takeOdds: card.availableQuote && card.availableQuote.odds
  };
  process.stdout.write(JSON.stringify(data));
})();
""".replace("EXACT", repr(exact))
    )
    data = _run(script, tmp_path, "qa_odds.js")
    assert data["error"] is None
    assert "Обновите предложение" not in str(data["error"] or "")
    assert abs(float(data["hidden"]) - exact) < 1e-12
    assert abs(float(data["hidden"]) - data["rounded"]) > 1e-9
    assert "2.11" in data["displayCta"]
    assert abs(data["quotedOdds"] - exact) < 1e-12
    assert data["placed"]["outcome"] == 1
    assert str(data["placed"]["money"]) == "100"
    assert abs(float(data["placed"]["odds"]) - float(data["takeOdds"])) < 1e-12
    assert "40" in data["preview"] and "60" in data["preview"]


def test_wallet_balance_card_is_closed_and_does_not_wrap_controls(tmp_path: Path):
    account = ACCOUNT.read_text(encoding="utf-8")
    start = account.index("function paintWalletSummary")
    end = account.index("function paintAccountOverview")
    script = (
        "function escapeHtml(s){return String(s);}\n"
        "function tt(k,f){return f;}\n"
        "function fmtTon(v){return Number(v).toFixed(2)+' TON';}\n"
        "let me={balance:12.5};\n"
        "const summary={innerHTML:''};\n"
        "const nets={id:'wallet-nets'};\n"
        "global.document={getElementById(id){ if(id==='wallet-summary') return summary; return null; }};\n"
        + account[start:end]
        + r"""
paintWalletSummary({reserved:1, in_positions:2});
const painted = summary.innerHTML;
const fragment = '<div id="wallet-page">' + painted + '<div id="wallet-nets"></div><div id="wallet-tabs"></div></div>';
process.stdout.write(JSON.stringify({painted, fragment}));
"""
    )
    data = _run(script, tmp_path, "qa_wallet.js")
    parser = _Tree()
    parser.feed(data["fragment"])
    card = _find(parser.root, id="wallet-balance-card")
    assert card is not None
    assert card["class"] == "balance-card"
    classes = [c.get("class") for c in card["children"]]
    assert "kicker" in classes and "lead" in classes and "balance-sub" in classes
    nets_parent = _parent_of(parser.root, "wallet-nets")
    tabs_parent = _parent_of(parser.root, "wallet-tabs")
    assert nets_parent is not None and nets_parent.get("id") != "wallet-balance-card"
    assert tabs_parent is not None and tabs_parent.get("id") != "wallet-balance-card"
    assert nets_parent.get("id") == "wallet-page"
    assert "</div>" in data["painted"]
    assert data["painted"].count("<div") == data["painted"].count("</div>")


def test_visible_and_telegram_back_share_close_event():
    html = HTML.read_text(encoding="utf-8")
    assert 'id="creator-back"' in html
    assert 'id="help-back"' in html
    assert 'document.getElementById("creator-back").onclick = () => closeEvent();' in html
    assert 'document.getElementById("help-back").onclick = () => closeEvent();' in html
    assert 'document.getElementById("creator-back").onclick = () => showTab("feed");' not in html
    close_fn = html[html.index("function closeEvent()") : html.index("async function openEvent")]
    assert "helpReturnTab === \"event\"" in close_fn
    assert "creatorReturnTab === \"top-creators\"" in close_fn
    assert "showTab(creatorReturnTab === \"create\" || creatorReturnTab === \"mine\" || creatorReturnTab === \"profile\"" in close_fn


def test_close_event_navigation_matrix(tmp_path: Path):
    html = HTML.read_text(encoding="utf-8")
    close_fn = html[html.index("function closeEvent()") : html.index("async function openEvent")]
    script = (
        r"""
const tabs = [];
const opened = [];
const tops = [];
let eventTradeMode = 'simple';
let activeEventId = 11;
let creatorReturnTab = 'feed';
let helpReturnTab = 'feed';
let helpReturnEventId = null;
let eventReturnTab = 'feed';
let eventPreselect = 0;
function showTab(name) { tabs.push(name); }
function showTopCreators() { tops.push('top'); }
function openEvent(id) { opened.push(id); }
function setTelegramBack() {}
let panelName = 'creator';
const document = { querySelector() { return { dataset: { panel: panelName } }; } };
"""
        + close_fn
        + r"""
const results = {};
panelName = 'creator'; creatorReturnTab = 'feed'; closeEvent(); results.feed = tabs.slice();
tabs.length = 0; tops.length = 0;
panelName = 'creator'; creatorReturnTab = 'top-creators'; closeEvent(); results.top = tops.slice();
tabs.length = 0;
panelName = 'creator'; creatorReturnTab = 'profile'; closeEvent(); results.profile = tabs.slice();
tabs.length = 0; opened.length = 0;
panelName = 'help'; helpReturnTab = 'profile'; helpReturnEventId = null; closeEvent(); results.helpProfile = tabs.slice();
tabs.length = 0; opened.length = 0;
panelName = 'help'; helpReturnTab = 'event'; helpReturnEventId = 42; closeEvent(); results.helpMarket = opened.slice();
process.stdout.write(JSON.stringify(results));
"""
    )
    data = _run(script, tmp_path, "qa_back.js")
    assert data["feed"] == ["feed"]
    assert data["top"] == ["top"]
    assert data["profile"] == ["profile"]
    assert data["helpProfile"] == ["profile"]
    assert data["helpMarket"] == [42]


def test_feed_preselect_is_not_sticky_after_manual_switch(tmp_path: Path):
    html = HTML.read_text(encoding="utf-8")
    open_fn = html[html.index("async function openEvent") : html.index("function showTab(")]
    assert "if (opts.preselect != null) eventPreselect = Number(opts.preselect);" in open_fn
    assert "eventPreselect = Number(simple.dataset.simpleOutcome)" in html
    assert "eventPreselect = Number(pick.dataset.outcome)" in html
    rerender = html[html.index("function rerenderLiveUi") : html.index("window.onLangChange")]
    assert "applyBestOddsPrefill(card, eventPreselect)" in rerender
    script = r"""
let eventPreselect = null;
let activeEventId = null;
let eventTradeMode = 'simple';
function openLike(id, opts) {
  opts = opts || {};
  if (opts.mode) eventTradeMode = opts.mode;
  if (opts.preselect != null) eventPreselect = Number(opts.preselect);
  activeEventId = id;
}
openLike(9, {preselect: 0});
const afterFeed = eventPreselect;
eventPreselect = Number(1);
openLike(9, {mode: 'advanced'});
const afterAdvanced = eventPreselect;
openLike(9, {});
const afterReload = eventPreselect;
process.stdout.write(JSON.stringify({afterFeed, afterAdvanced, afterReload, mode: eventTradeMode}));
"""
    data = _run(script, tmp_path, "qa_preselect.js")
    assert data["afterFeed"] == 0
    assert data["afterAdvanced"] == 1
    assert data["afterReload"] == 1
    assert data["mode"] == "advanced"


def test_stale_auth_overlay_clears_session_and_honest_close_copy(tmp_path: Path):
    html = HTML.read_text(encoding="utf-8")
    i18n = I18N.read_text(encoding="utf-8")
    apply_fn = html[html.index("function applyUnauthorized()") : html.index("async function api(")]
    api_fn = html[html.index("async function api(") : html.index("function paintUser(")]
    assert "authBlocked = true" in apply_fn
    assert "me = null" in apply_fn
    assert "block.hidden = false" in apply_fn
    assert "applyUnauthorized();" in api_fn
    assert "Закрыть BetTON" in html
    assert "Перезапустить BetTON" not in html
    assert '"auth.reopen": "Закрыть BetTON"' in i18n
    assert '"auth.reopen": "Close BetTON"' in i18n
    assert "tg.close" in html
    script = (
        apply_fn
        + r"""
let authBlocked = false;
let me = {id: 4, balance: 80};
let myPositions = {1: {market_id: 1}};
const cleared = {};
const nodes = {
  'auth-block': {hidden: true},
  'mine-orders': {innerHTML: 'orders'},
  'profile-header': {innerHTML: 'profile'},
  'tx-list': {innerHTML: 'tx'},
  'wallet-history': {innerHTML: 'wh'},
  error: {textContent: ''}
};
const document = { getElementById(id) { return nodes[id] || (cleared[id] = {innerHTML: 'x'}, cleared[id]); } };
function paintUser() { nodes.painted = !me; }
function showError(m) { nodes.error.textContent = m; }
const AUTH_REOPEN = 'Сессия недействительна. Закройте Mini App и откройте его заново';
applyUnauthorized();
process.stdout.write(JSON.stringify({
  authBlocked, me, myPositions,
  blockHidden: nodes['auth-block'].hidden,
  orders: nodes['mine-orders'].innerHTML,
  profile: nodes['profile-header'].innerHTML,
  error: nodes.error.textContent,
  painted: nodes.painted
}));
"""
    )
    data = _run(script, tmp_path, "qa_auth.js")
    assert data["authBlocked"] is True
    assert data["me"] is None
    assert data["myPositions"] == {}
    assert data["blockHidden"] is False
    assert data["orders"] == ""
    assert data["profile"] == ""
    assert data["painted"] is True
    assert "Сессия недействительна" in data["error"]
