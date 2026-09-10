import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"


def _chunk() -> str:
    html = HTML.read_text(encoding="utf-8")
    return (HTML.with_name("p2p.js").read_text(encoding="utf-8") + "\n" + html[html.index("function odds(") : html.index("async function loadMarkets")])


def _harness_html() -> str:
    return (
        """<!doctype html><meta charset="utf-8"><pre id="out"></pre><script>
const CAT_LABEL = { sport: "Спорт", politics: "Политика", unique: "Уникальное" };
let me = { id: 1, is_admin: true, balance: 1000 };
let myPositions = {
  7: { claimed: false, shares: [2, 0], shares_yes: 2, shares_no: 0 }
};
"""
        + _chunk()
        + r"""
const autoCard = marketCard({
  id: 7, question: "Авто?", category: "unique", status: "resolved",
  settlement_kind: "auto", pot: 0, winning_outcome: "Да",
  outcomes: ["Да", "Нет"], prices: [1, 0], accepting_bets: false
});
const legacyCard = marketCard({
  id: 7, question: "Старый?", category: "unique", status: "resolved",
  settlement_kind: null, pot: 12, winning_outcome: "Да",
  outcomes: ["Да", "Нет"], prices: [1, 0], accepting_bets: false
});
const loss = settlementCard({
  market_id: 3, question: "Кто победит?", winning_outcome: "Нет",
  chosen_outcomes: ["Нет"], stakes_total: 15, payout: 0, tip: 0,
  credited: 0, result: -15, lock_ton: 0, residual_returned: 0,
  resolved_at: "2026-09-10T12:00:00", is_loss: true
});
const creator = settlementCard({
  market_id: 4, question: "Моё событие", winning_outcome: "Да",
  chosen_outcomes: [], stakes_total: 0, payout: 0, tip: 0, credited: 0,
  result: 0, lock_ton: 50, residual_returned: 12.5,
  resolved_at: "2026-09-10T12:00:00", is_loss: false
});
const adminOpen = p2pCard({
  id: 11, question: "Отменить открытое?", category: "unique", status: "open",
  mechanism: "p2p", pot: 91.66, outcomes: ["A", "B"], accepting_bets: true,
  close_at: "2026-09-10T12:00:00"
});
const cancelledCard = p2pCard({
  id: 12, question: "Уже отменено?", category: "unique", status: "cancelled",
  mechanism: "p2p", pot: 0, cancellation_reason: "Источник не подтвердился",
  outcomes: ["A", "B"], accepting_bets: false, close_at: "2026-09-10T12:00:00"
});
me.is_admin = false;
const userOpen = p2pCard({
  id: 11, question: "Отменить открытое?", category: "unique", status: "open",
  mechanism: "p2p", pot: 91.66, outcomes: ["A", "B"], accepting_bets: true,
  close_at: "2026-09-10T12:00:00"
});
me.is_admin = true;
const refund = settlementCard({
  market_id: 12, question: "Уже отменено?", winning_outcome: "Отменено",
  chosen_outcomes: ["A"], stakes_total: 41.67, payout: 41.67, tip: 0,
  credited: 100, result: 0, lock_ton: 0, residual_returned: 58.33,
  resolved_at: "2026-09-10T12:00:00", is_loss: false, settlement_kind: "void",
  cancellation_reason: "Источник не подтвердился"
});
let confirmText = "";
try { confirmText = p2pCancelConfirmText("Источник не подтвердился"); } catch (e) { confirmText = e.message; }
let emptyReason = "";
try { p2pCancelPayload("  "); } catch (e) { emptyReason = e.message; }
const data = { autoCard, legacyCard, loss, creator, adminOpen, cancelledCard, userOpen, refund, confirmText, emptyReason };
if (typeof window !== "undefined") window.__SETTLEMENT_UI__ = data;
if (typeof document !== "undefined") {
  const out = document.getElementById("out");
  if (out) out.textContent = JSON.stringify(data);
}
if (typeof process !== "undefined" && process.stdout) process.stdout.write(JSON.stringify(data));
</script>"""
    )


def _browser_bin() -> Path | None:
    roots = [
        Path(os.environ.get("ProgramFiles", r"C:\Program Files")),
        Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")),
        Path(os.environ.get("LOCALAPPDATA", "")),
    ]
    names = [
        Path("Microsoft/Edge/Application/msedge.exe"),
        Path("Google/Chrome/Application/chrome.exe"),
    ]
    for root in roots:
        for name in names:
            candidate = root / name
            if candidate.is_file():
                return candidate
    return None


def _run_ui_js(tmp_path: Path) -> dict:
    node = shutil.which("node")
    if node:
        proc = subprocess.run(
            [node, "-e", _harness_html().split("<script>", 1)[1].rsplit("</script>", 1)[0]],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        assert proc.returncode == 0, proc.stderr
        return json.loads(proc.stdout)
    browser = _browser_bin()
    if browser is None:
        pytest.skip("Нет Node.js и браузера для исполнения JS интерфейса")
    harness = tmp_path / "settlement_ui.html"
    harness.write_text(_harness_html(), encoding="utf-8")
    proc = subprocess.run(
        [str(browser), "--headless=new", "--disable-gpu", "--dump-dom", harness.resolve().as_uri()],
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=60,
    )
    assert proc.returncode == 0, proc.stderr or proc.stdout
    start = proc.stdout.find('<pre id="out">')
    assert start != -1, proc.stdout[:2000]
    start = proc.stdout.find(">", start) + 1
    end = proc.stdout.find("</pre>", start)
    return json.loads(proc.stdout[start:end])


def test_settlement_ui_js_hides_auto_claim_and_shows_loss(tmp_path: Path):
    data = _run_ui_js(tmp_path)
    assert "Забрать выигрыш" not in data["autoCard"]
    assert "Забрать остаток залога" not in data["autoCard"]
    assert "Забрать выигрыш" in data["legacyCard"]
    assert "Забрать остаток залога" in data["legacyCard"]
    assert "Проигрыш" in data["loss"]
    assert "Выигрыш получен" not in data["loss"]
    assert "Кто победит?" in data["loss"]
    assert "залог 50.00 TON" in data["creator"]
    assert "возврат остатка 12.50 TON" in data["creator"]
    assert "Отменить событие" in data["adminOpen"]
    assert "Оставить заявку" in data["adminOpen"]
    assert "Отменить событие" not in data["userOpen"]
    assert "Отменено" in data["cancelledCard"]
    assert "Источник не подтвердился" in data["cancelledCard"]
    assert "Оставить заявку" not in data["cancelledCard"]
    assert "Принять доступное" not in data["cancelledCard"]
    assert "Рассчитать:" not in data["cancelledCard"]
    assert "Отменить событие" not in data["cancelledCard"]
    assert "Забрать выигрыш" not in data["cancelledCard"]
    assert "возврат исполненной ставки 41.67 TON" in data["refund"]
    assert "освобождённый остаток заявки 58.33 TON" in data["refund"]
    assert "всего возвращено 100.00 TON" in data["refund"]
    assert "Все ставки по событию будут возвращены. Чаевые не удерживаются" in data["confirmText"]
    assert "Причина: Источник не подтвердился" in data["confirmText"]
    assert data["emptyReason"] == "Укажите причину отмены"


@pytest.mark.parametrize("unauthorized", [None, "/users/1", "/users/1/positions", "/users/1/settlements"])
def test_load_mine_refreshes_balance_and_keeps_legacy_results(unauthorized):
    node = shutil.which("node")
    if not node:
        pytest.skip("Node.js required to execute async loadMine regression")
    html = HTML.read_text(encoding="utf-8")
    load_mine = html[html.index("async function loadMine()") : html.index("async function previewQuote")]
    script = r'''
const assert = require('node:assert/strict');
const CAT_LABEL = {unique: "Уникальное"};
const AUTH_REOPEN = "AUTH_REOPEN", OPEN_IN_TG = "OPEN_IN_TG", inTelegram = true;
let authBlocked = false, me = {id: 1, balance: 900}, myPositions = {};
const nodes = {};
const document = {getElementById(id) {
  return nodes[id] ||= {innerHTML: '', textContent: '', querySelectorAll() {return []}, addEventListener() {}};
}};
function getInitData() {return 'signed-data'}
function displayName() {return 'Player'}
function showError(message) {document.getElementById('error').textContent = message}
async function previewQuote() {}
const calls = [];
const market = id => ({id, question: 'legacy-' + id, status: 'resolved', creator_id: 2,
  settlement_kind: null, outcomes: ['Да', 'Нет'], winning_outcome: 'Да'});
const positions = [
  {market_id: 7, market: market(7), shares: [10, 0], claimed: false},
  {market_id: 8, market: market(8), shares: [10, 0], claimed: true},
  {market_id: 9, market: market(9), shares: [0, 10], claimed: false},
  {market_id: 10, market: {...market(10), settlement_kind: 'auto'}, shares: [10, 0], claimed: true}
];
async function fetch(path) {
  calls.push(path);
  const data = path === '/users/1' ? {id: 1, balance: 1049.5} :
    path.endsWith('/positions') ? positions : [];
  return {status: path === unauthorized ? 401 : 200, ok: path !== unauthorized,
    async json() {return data}};
}
'''
    script += "\nconst unauthorized = " + json.dumps(unauthorized) + ";\n" + _chunk() + load_mine
    script += "\nfunction onCardClick() {}\n" + html[
        html.index('    document.getElementById("markets").onclick'):
        html.index('    document.getElementById("markets").addEventListener')
    ]
    script += r'''
(async () => {
  assert.equal(document.getElementById('mine-results').onclick, onCardClick);
  if (unauthorized) {
    await assert.rejects(loadMine(), {message: AUTH_REOPEN});
    assert.equal(me, null);
    assert.deepEqual(myPositions, {});
    assert.equal(document.getElementById('balance').textContent, '—');
    assert.equal(document.getElementById('create').disabled, true);
    assert.equal(document.getElementById('error').textContent, AUTH_REOPEN);
    assert.equal(calls.includes('/auth/telegram'), false);
    if (unauthorized === '/users/1') assert.deepEqual(calls, ['/users/1']);
  } else {
    await loadMine();
    assert.equal(calls[0], '/users/1');
    assert.equal(document.getElementById('balance').textContent, '1049.50 TON');
    const results = document.getElementById('mine-results').innerHTML;
    for (const id of [7,8,9]) assert.ok(results.includes('legacy-' + id));
    assert.equal(results.includes('legacy-10'), false);
    assert.equal((results.match(/data-act="claim"/g) || []).length, 1);
    assert.ok(results.includes('Выигрыш уже получен'));
    assert.ok(results.includes('Проигрыш'));
    assert.equal(document.getElementById('mine-bets').innerHTML.includes('legacy-'), false);
  }
})().catch(error => {console.error(error); process.exitCode = 1});
'''
    proc = subprocess.run([node, "-e", script], capture_output=True, text=True, timeout=20)
    assert proc.returncode == 0, proc.stderr
