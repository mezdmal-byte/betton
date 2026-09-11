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


def test_sprint2_shell_search_empty_states_and_no_nanoton():
    html = HTML.read_text(encoding="utf-8")
    css = html[html.index("<style>") : html.index("</style>")]
    p2p = P2P.read_text(encoding="utf-8")
    assert 'id="feed-search"' in html
    assert 'for="feed-search"' in html
    assert 'id="status-filter"' in html
    assert 'id="status-filters"' not in html
    assert "function filterFeedMarkets" in html
    assert "Активных заявок пока нет." in html
    assert "У вас пока нет исполненных ставок." in html
    assert "Завершённых событий пока нет." in html
    assert "Вы ещё не создавали события." in html
    assert "Остаток вернётся на доступный баланс." in p2p
    assert "Отменить остаток" in p2p
    assert "Ожидает контрагента" in p2p
    assert "Частично исполнена" in p2p
    assert "Исполнена" in p2p
    assert "Отменена" in p2p
    assert "Приём завершён" in p2p
    assert "Событие отменено · средства возвращены" in html
    assert "Возврат " in html
    assert "nanoTON" not in p2p
    assert html.count("nanoTON") == 1
    assert "overflow-x: hidden" in css
    assert "min-width: 92px" not in css
    assert "white-space: nowrap" not in css
    assert not re.search(r"(?<!max-)width:\s*[5-9]\d{2,}px", css)
    assert not re.search(r"(?<!@media \()min-width:\s*(?:[1-9]\d{2,}|9\d)px", css)


def test_event_page_order_and_book_in_details():
    p2p = P2P.read_text(encoding="utf-8")
    body = p2p[p2p.index("function p2pCard") : p2p.index("function p2pPreviewModel")]
    assert body.index("status-pill") < body.index("question")
    assert body.index("event-deadline") < body.index("outcome-pair")
    assert body.index("outcome-pair") < body.index("event-offers")
    assert body.index("event-offers") < body.index("event-bet")
    assert body.index("p2p-preview") < body.index('data-act="p2p-limit"')
    assert body.index("event-bet") < body.index("p2p-depth")
    assert "<details" in body and "Все предложения" in body


def _harness_html() -> str:
    return (
        """<!doctype html><meta charset="utf-8"><pre id="out"></pre><script>
const CAT_LABEL = { sport: "Спорт", politics: "Политика", unique: "Уникальное" };
let me = { id: 1, is_admin: false, balance: 1000 };
let myPositions = {};
"""
        + _chunk()
        + r"""
const statuses = {
  wait: orderStatusText({status: "open", filled: 0, remaining: 10}),
  partial: orderStatusText({status: "open", filled: 4, remaining: 6}),
  filled: orderStatusText({status: "filled", filled: 10, remaining: 0}),
  cancelled: orderStatusText({status: "cancelled", filled: 2, remaining: 0}),
  expired: orderStatusText({status: "expired", filled: 0, remaining: 8})
};
const grouped = renderMineOrders([
  {id: 1, market_id: 5, question: "Один матч?", outcome_name: "Да", odds: 2, amount: 10, filled: 0, remaining: 10, refunded: 0, status: "open"},
  {id: 2, market_id: 5, question: "Один матч?", outcome_name: "Нет", odds: 1.8, amount: 5, filled: 5, remaining: 0, refunded: 0, status: "filled"}
]);
const emptyOrders = renderMineOrders([]);
const openOrder = orderCard({
  id: 9, market_id: 5, question: "Один матч?", outcome_name: "Да", odds: 2.5,
  amount: 12.5, filled: 4, remaining: 8.5, refunded: 0, status: "open"
});
const posP2P = positionCard({
  market_id: 8, costs: [10, 0], shares: [22, 0], claimed: false,
  market: {id: 8, question: "P2P позиция?", mechanism: "p2p", status: "open",
    outcomes: ["Да", "Нет"], accepting_bets: true}
});
const win = settlementCard({
  market_id: 3, question: "Кто победит?", winning_outcome: "Да",
  chosen_outcomes: ["Да"], stakes_total: 10, payout: 18.2, tip: 0.08,
  credited: 18.12, result: 8.12, lock_ton: 0, residual_returned: 0,
  resolved_at: "2026-09-10T12:00:00", is_loss: false, settlement_kind: "auto"
});
const loss = settlementCard({
  market_id: 4, question: "Кто победит?", winning_outcome: "Нет",
  chosen_outcomes: ["Да"], stakes_total: 15, payout: 0, tip: 0,
  credited: 0, result: -15, lock_ton: 0, residual_returned: 0,
  resolved_at: "2026-09-10T12:00:00", is_loss: true
});
const voided = settlementCard({
  market_id: 12, question: "Уже отменено?", winning_outcome: "Отменено",
  chosen_outcomes: ["A"], stakes_total: 41.67, payout: 41.67, tip: 0,
  credited: 100, result: 0, lock_ton: 0, residual_returned: 58.33,
  resolved_at: "2026-09-10T12:00:00", is_loss: false, settlement_kind: "void",
  cancellation_reason: "Источник не подтвердился"
});
const found = filterFeedMarkets([
  {question: "Будет дождь?"},
  {question: "Кто чемпион?"}
], "дожд");
const none = filterFeedMarkets([{question: "Будет дождь?"}], "чемпион");
const previewWait = p2pPreviewLines(
  {requested: {matched: 0, remaining: 10, payout: null}, available: {matched: 0}},
  {money: 10, odds: 2, outcomeName: "Да"},
  80
);
const previewWaitHtml = p2pPreviewHtml(
  {requested: {matched: 0, remaining: 10, payout: null}, available: {matched: 0}},
  {money: 10, odds: 2, outcomeName: "Да"},
  80
);
const data = {
  statuses, grouped, emptyOrders, openOrder, posP2P, win, loss, voided, found, none,
  previewWait, previewWaitHtml
};
if (typeof window !== "undefined") window.__SPRINT2_UI__ = data;
if (typeof document !== "undefined") {
  const out = document.getElementById("out");
  if (out) out.textContent = JSON.stringify(data);
}
if (typeof process !== "undefined" && process.stdout) process.stdout.write(JSON.stringify(data));
</script>"""
    )


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
        assert proc.returncode == 0, proc.stderr or proc.stdout
        return json.loads(proc.stdout)
    browser = _browser_bin()
    if browser is None:
        pytest.skip("Нет Node.js и браузера для исполнения JS интерфейса")
    harness = tmp_path / "sprint2_ui.html"
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


def test_sprint2_mine_history_search_and_preview_js(tmp_path: Path):
    data = _run_ui_js(tmp_path)
    assert data["statuses"] == {
        "wait": "Ожидает контрагента",
        "partial": "Частично исполнена",
        "filled": "Исполнена",
        "cancelled": "Отменена",
        "expired": "Приём завершён",
    }
    assert data["grouped"].count("mine-group-title") == 1
    assert data["grouped"].count("Один матч?") == 1
    assert "Заявка" in data["grouped"]
    assert "Да" in data["grouped"] and "Нет" in data["grouped"]
    assert "Активных заявок пока нет." in data["emptyOrders"]
    assert "Отменить остаток" in data["openOrder"]
    assert "Остаток вернётся на доступный баланс." in data["openOrder"]
    assert "Исходная сумма" in data["openOrder"]
    assert "В резерве" in data["openOrder"]
    assert "nano" not in data["openOrder"].lower()
    assert "P2P позиция?" in data["posP2P"]
    assert "Исполненная ставка" in data["posP2P"]
    assert "Поставлено" in data["posP2P"]
    assert "Средний коэффициент" in data["posP2P"]
    assert "Возможная выплата" in data["posP2P"]
    assert "долей" not in data["posP2P"]
    assert "shares" not in data["posP2P"]
    assert "+8.12 TON" in data["win"]
    assert "комиссия / чаевые 0.08 TON" in data["win"]
    assert "Проигрыш" not in data["win"]
    assert "-15.00 TON" in data["loss"]
    assert "Проигрыш" in data["loss"]
    assert "Событие отменено · средства возвращены" in data["voided"]
    assert "Проигрыш" not in data["voided"]
    assert "Возврат 100.00 TON" in data["voided"]
    assert [m["question"] for m in data["found"]] == ["Будет дождь?"]
    assert data["none"] == []
    assert any("Сейчас встречного предложения нет" in line for line in data["previewWait"])
    assert "preview-error" not in data["previewWaitHtml"]
    assert "Ваша сумма" in data["previewWaitHtml"]
    assert "Исполнится сейчас" in data["previewWaitHtml"]
    assert "Останется заявкой" in data["previewWaitHtml"]
    assert "Коэффициент" in data["previewWaitHtml"]
