"""Final live UI polish: dates, fees, back button, best-odds prefill, nav."""
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
P2P = HTML.with_name("p2p.js")


def _chunk() -> str:
    html = HTML.read_text(encoding="utf-8")
    return (
        P2P.read_text(encoding="utf-8")
        + "\n"
        + html[html.index("function odds(") : html.index("async function loadMarkets")]
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


def test_live_polish_copy_and_nav_source():
    html = HTML.read_text(encoding="utf-8")
    css = html[html.index("<style>") : html.index("</style>")]
    p2p = P2P.read_text(encoding="utf-8")
    assert "#23001E" not in css
    assert "linear-gradient" not in css
    assert "--brand: #171717" in css
    assert "--yes: #20A39E" in css
    assert 'hidden>Проверка</button>' in html
    assert 'hidden>Модерация</button>' not in html
    assert "flex-wrap: nowrap" in css
    assert "white-space: nowrap" in css[css.index(".tab {") : css.index(".tab.active")]
    assert "function formatCloseAt" in html
    assert "ru-RU" in html
    assert "telegramBackBound" in html
    assert "BackButton.onClick(closeEvent)" in html
    assert "BackButton.show()" in html
    assert "BackButton.hide()" in html
    assert html.count("BackButton.onClick") == 1
    assert "data-prefill-outcome" in p2p
    assert "function applyBestOddsPrefill" in p2p
    assert "function executableLiquidity" in p2p
    assert "available_to_me" in p2p
    assert "Доступно вам сейчас" in p2p
    assert "Оставить заявку" in p2p
    assert 'class="gold"' in p2p
    assert "Сервисный сбор" in html
    assert "Сервисный сбор" in p2p
    assert "чаевые" not in html.lower()
    assert "чаевые" not in p2p.lower()
    assert "без комиссии" not in html.lower()
    assert "0% за создание события и размещение заявки" in html
    assert "1% только с чистой прибыли победителя" in html
    assert "function feedBestOffersHtml" in html
    assert "Нет предложений" in html
    assert "Нет предложений" in p2p


def _run_js(script: str, tmp_path: Path) -> dict:
    node = shutil.which("node")
    if node:
        proc = subprocess.run(
            [node, "-e", script],
            capture_output=True,
            text=True,
            timeout=20,
            encoding="utf-8",
        )
        assert proc.returncode == 0, proc.stderr or proc.stdout
        return json.loads(proc.stdout)
    browser = _browser_bin()
    if browser is None:
        pytest.skip("Нет Node.js и браузера для исполнения JS интерфейса")
    harness = tmp_path / "live_polish.html"
    harness.write_text(
        "<!doctype html><meta charset='utf-8'><pre id='out'></pre><script>" + script + "</script>",
        encoding="utf-8",
    )
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
    return json.loads(proc.stdout[start:proc.stdout.find("</pre>", start)])


def test_format_close_at_local_ru_and_invalid(tmp_path: Path):
    script = (
        "const CAT_LABEL = {unique:'Уникальное'}; let me=null; let myPositions={};\n"
        + _chunk()
        + r"""
const invalid = formatCloseAt('not-a-date');
const empty = formatCloseAt('');
const local = formatCloseAt('2024-09-12T12:07:00Z', new Date('2026-01-01T00:00:00Z'));
const sameYear = formatCloseAt('2026-09-12T12:07:00Z', new Date('2026-01-01T00:00:00Z'));
const data = {invalid, empty, local, sameYear};
if (typeof process !== 'undefined' && process.stdout) process.stdout.write(JSON.stringify(data));
if (typeof document !== 'undefined') {
  const out = document.getElementById('out');
  if (out) out.textContent = JSON.stringify(data);
}
"""
    )
    data = _run_js(script, tmp_path)
    assert data["empty"] == ""
    assert "UTC" not in data["invalid"]
    assert "not-a-date" in data["invalid"] or data["invalid"]
    assert "UTC" not in data["local"]
    assert "сентябр" in data["local"].lower()
    assert "2024" in data["local"]
    assert "UTC" not in data["sameYear"]
    assert "сентябр" in data["sameYear"].lower()


def test_feed_best_offers_and_prefill_and_own_liquidity(tmp_path: Path):
    script = (
        """
const CAT_LABEL = {unique:'Уникальное'};
let me = {id:1, is_admin:false, balance:1000};
let myPositions = {};
"""
        + _chunk()
        + r"""
const two = feedCard({
  id: 1, question: 'Будет дождь?', category: 'unique', status: 'open',
  mechanism: 'p2p', pot: 0, outcomes: ['Да', 'Нет'], accepting_bets: true,
  close_at: '2026-09-12T12:07:00Z',
  best_offers: [{odds: 1.91, available: 11}, {odds: 2, available: 10}]
});
const empty = feedCard({
  id: 2, question: 'Пустой рынок?', category: 'unique', status: 'open',
  mechanism: 'p2p', pot: 0, outcomes: ['Да', 'Нет'], accepting_bets: true,
  close_at: '2026-09-12T12:07:00Z',
  best_offers: [null, null]
});
const closed = feedCard({
  id: 3, question: 'Закрыто?', category: 'unique', status: 'closed',
  mechanism: 'p2p', pot: 40, outcomes: ['Да', 'Нет'], accepting_bets: false,
  close_at: '2026-09-12T12:07:00Z',
  best_offers: null
});
const win = settlementCard({
  market_id: 3, question: 'Кто победит?', winning_outcome: 'Да',
  chosen_outcomes: ['Да'], stakes_total: 100, payout: 180, tip: 0.8,
  credited: 179.2, result: 79.2, lock_ton: 0, residual_returned: 0,
  resolved_at: '2026-09-10T12:00:00', is_loss: false, settlement_kind: 'auto'
});
const ownBook = bestOfferCell('Нет', {odds:2, available:20}, null, 1, true);
const otherBook = bestOfferCell('Нет', {odds:2, available:20}, {odds:2, available:20}, 1, true);
const card = {
  querySelector(sel) {
    if (sel === '.p2p-side') return this.select;
    if (sel === '.p2p-odds') return this.odds;
    return null;
  },
  querySelectorAll(sel) { return sel === '.side-pick' ? this.picks : []; },
  select: {value: '0'},
  odds: {value: '3'},
  picks: [
    {dataset:{outcome:'0'}, classList:{onYes:true, onNo:false, toggle(name, on){ if(name==='on-yes') this.onYes=on; if(name==='on-no') this.onNo=on; }}},
    {dataset:{outcome:'1'}, classList:{onYes:false, onNo:false, toggle(name, on){ if(name==='on-yes') this.onYes=on; if(name==='on-no') this.onNo=on; }}}
  ]
};
applyBestOddsPrefill(card, 1, 1.91);
const data = {
  two, empty, closed, win, ownBook, otherBook,
  outcome: card.select.value,
  odds: card.odds.value,
  pick0: card.picks[0].classList,
  pick1: card.picks[1].classList,
  execOwn: executableLiquidity({available_to_me:[[], []]}, 1),
  execOther: executableLiquidity({available_to_me:[[], [{odds:2, available:20}]]}, 1)
};
if (typeof process !== 'undefined' && process.stdout) process.stdout.write(JSON.stringify(data));
if (typeof document !== 'undefined') {
  const out = document.getElementById('out');
  if (out) out.textContent = JSON.stringify(data);
}
"""
    )
    data = _run_js(script, tmp_path)
    assert "1.91" in data["two"]
    assert "11.00 TON" in data["two"]
    assert "2.00" in data["two"]
    assert "10.00 TON" in data["two"]
    assert "Нет предложений" in data["empty"]
    assert "1.91" not in data["empty"]
    assert "Нет предложений" not in data["closed"]
    assert "Приём завершён" in data["closed"]
    assert "Сервисный сбор 0.80 TON" in data["win"]
    assert "чаевые" not in data["win"].lower()
    assert "Доступно вам сейчас: нет предложений" in data["ownBook"]
    assert "data-prefill-odds" in data["ownBook"]
    assert "Доступно вам сейчас" not in data["otherBook"]
    assert data["outcome"] == "1"
    assert data["odds"] == "1.91"
    assert data["pick1"]["onNo"] is True
    assert data["pick0"]["onYes"] is False
    assert data["execOwn"] is False
    assert data["execOther"] is True


def test_telegram_back_button_binds_once(tmp_path: Path):
    html = HTML.read_text(encoding="utf-8")
    start = html.index("function setTelegramBack")
    end = html.index("function closeEvent")
    body = html[start:end]
    script = r"""
const calls = [];
const tg = { BackButton: {
  show() { calls.push('show'); },
  hide() { calls.push('hide'); },
  onClick(fn) { calls.push('on'); this.fn = fn; },
  offClick() { calls.push('off'); }
}};
let telegramBackBound = false;
function closeEvent() { calls.push('close'); }
""" + body + r"""
setTelegramBack(true);
setTelegramBack(true);
setTelegramBack(false);
setTelegramBack(true);
tg.BackButton.fn();
const data = {calls, bound: telegramBackBound};
if (typeof process !== 'undefined' && process.stdout) process.stdout.write(JSON.stringify(data));
if (typeof document !== 'undefined') {
  const out = document.getElementById('out');
  if (out) out.textContent = JSON.stringify(data);
}
"""
    data = _run_js(script, tmp_path)
    assert data["calls"].count("on") == 1
    assert data["calls"].count("show") == 3
    assert data["calls"].count("hide") == 1
    assert "close" in data["calls"]
    assert data["bound"] is True
    assert "off" not in data["calls"]
