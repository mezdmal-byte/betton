import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"


def _chunk() -> str:
    html = HTML.read_text(encoding="utf-8")
    return html[html.index("function odds(") : html.index("async function loadMarkets")]


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
const data = { autoCard, legacyCard, loss, creator };
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
