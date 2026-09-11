from pathlib import Path
import json
import os
import shutil
import subprocess

import pytest

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
P2P = HTML.with_name("p2p.js")


def test_beta_visual_language_and_shell():
    html = HTML.read_text(encoding="utf-8")
    css = html[html.index("<style>") : html.index("</style>")]
    assert "--bg: #FFFFFF" in css
    assert "--surface: #F4F5F7" in css
    assert "--text: #2F2F2F" in css
    assert "--yes: #20A39E" in css
    assert "--no: #EF5B5B" in css
    assert "--brand: #23001E" in css
    assert "#d4af37" not in css.lower()
    assert "linear-gradient" not in css
    assert 'data-tab="feed">Лента</button>' in html
    assert 'data-tab="create">Создать</button>' in html
    assert 'data-tab="mine">Мои</button>' in html
    assert 'data-panel="event"' in html
    assert 'id="event-root"' in html
    assert "Доступно" in html
    assert html.index("<main>") < html.index('class="tabs"')
    assert "position: fixed" in css
    assert "Сумма слишком маленькая." in html
    assert "Минимальная сумма — 1 nanoTON" not in html
    p2p = P2P.read_text(encoding="utf-8")
    assert "nanoTON" not in p2p
    assert "function p2pPreviewLines" in p2p
    assert "ждать встречного предложения" in p2p
    assert "function p2pPlaceToast" in p2p
    assert "function feedCard" in html


def test_feed_and_event_keep_existing_actions():
    html = HTML.read_text(encoding="utf-8")
    p2p = P2P.read_text(encoding="utf-8")
    assert "Оставить заявку" in p2p
    assert "data-act=\"p2p-limit\"" in p2p
    assert "data-act=\"claim\"" in html
    assert "async function openEvent" in html
    assert "function friendlyError" in html
    assert "me ? fmtTon(me.balance) : \"—\"" in html


def test_p2p_feed_does_not_infer_empty_book_from_zero_pot():
    html = HTML.read_text(encoding="utf-8")
    body = html[html.index("function feedSituation") : html.index("function feedCard")]
    assert "Нет встречных заявок" not in body
    assert "Сделок пока нет" in body
    assert "Объём сделок" in body
    assert "откройте событие" in body
    assert "orderbook" not in body


def _browser_bin():
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


def test_reload_after_funds_refreshes_user_before_event_preview(tmp_path: Path):
    html = HTML.read_text(encoding="utf-8")
    helper = html[
        html.index("async function reloadAfterFundsChange()") : html.index("document.querySelector(\".tabs\")")
    ]
    click = html[html.index("async function onCardClick") : html.index("document.getElementById(\"markets\").onclick")]
    assert "await reloadAfterFundsChange()" in click
    assert "await openEvent(activeEventId)" not in click
    assert helper.index("await refreshMe()") < helper.index("await openEvent(activeEventId)")
    stubs = (
        "let me = {id: 1, balance: 1000};\n"
        "let authBlocked = false;\n"
        "let activeEventId = 11;\n"
        "const calls = [];\n"
        "const quoteBalances = [];\n"
        "async function refreshMe() {\n"
        "  calls.push('refreshMe-before:' + me.balance);\n"
        "  me = {id: 1, balance: 880.5};\n"
        "  calls.push('refreshMe-after:' + me.balance);\n"
        "}\n"
        "async function p2pQuote() { quoteBalances.push(me.balance); calls.push('p2pQuote:' + me.balance); }\n"
        "async function openEvent(id) {\n"
        "  calls.push('openEvent:' + id + ':' + me.balance);\n"
        "  await p2pQuote();\n"
        "}\n"
        "async function loadMine() { calls.push('loadMine:' + me.balance); }\n"
        "async function loadModeration() { calls.push('loadModeration'); }\n"
        "async function loadMarkets() { calls.push('loadMarkets'); }\n"
    )
    finish = (
        "calls.push('p2pPlace:' + me.balance);\n"
        "reloadAfterFundsChange().then(function() {\n"
        "  const data = {calls: calls, quoteBalances: quoteBalances, balance: me.balance};\n"
        "  if (typeof process !== 'undefined' && process.stdout && process.stdout.write) process.stdout.write(JSON.stringify(data));\n"
        "  const out = typeof document !== 'undefined' && document.getElementById && document.getElementById('out');\n"
        "  if (out) out.textContent = JSON.stringify(data);\n"
        "});\n"
    )
    node = shutil.which("node")
    if node:
        fake_doc = (
            "var document = {querySelector: function(sel) {"
            " if (sel === '[data-panel]:not([hidden])') return {dataset: {panel: 'event'}};"
            " return null; }, getElementById: function() { return null; }};\n"
        )
        proc = subprocess.run(
            [node, "-e", fake_doc + stubs + helper + finish],
            capture_output=True, text=True, timeout=20, encoding="utf-8",
        )
        assert proc.returncode == 0, proc.stderr or proc.stdout
        data = json.loads(proc.stdout)
    else:
        browser = _browser_bin()
        if browser is None:
            pytest.skip("Нет Node.js и браузера для исполнения порядка refreshMe")
        browser_js = (
            "const _q = document.querySelector.bind(document);\n"
            "document.querySelector = function(sel) {"
            " if (sel === '[data-panel]:not([hidden])') return {dataset: {panel: 'event'}};"
            " return _q(sel); };\n"
            + stubs + helper + finish
        )
        harness = tmp_path / "funds_order.html"
        harness.write_text(
            "<!doctype html><meta charset='utf-8'><pre id='out'></pre><script>" + browser_js + "</script>",
            encoding="utf-8",
        )
        proc = subprocess.run(
            [str(browser), "--headless=new", "--disable-gpu", "--dump-dom", harness.resolve().as_uri()],
            check=False, capture_output=True, text=True, encoding="utf-8", timeout=60,
        )
        assert proc.returncode == 0, proc.stderr or proc.stdout
        start = proc.stdout.find('<pre id="out">')
        assert start != -1, proc.stdout[:2000]
        start = proc.stdout.find(">", start) + 1
        data = json.loads(proc.stdout[start:proc.stdout.find("</pre>", start)])
    assert data["calls"] == [
        "p2pPlace:1000",
        "refreshMe-before:1000",
        "refreshMe-after:880.5",
        "openEvent:11:880.5",
        "p2pQuote:880.5",
    ]
    assert data["quoteBalances"] == [880.5]
    assert data["balance"] == 880.5
