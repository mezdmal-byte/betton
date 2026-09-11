"""Sprint 3: product-level beta E2E on an isolated test DB.

Walks real FastAPI endpoints and matching/settlement services with three
distinct accounts (admin, user A, user B). Money is checked in nanoTON
before and after each critical step. Live API payloads are rendered through
the Mini App JS — not hardcoded UI strings.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

from app.database import SessionLocal
from app.models import Market, P2PFill, P2PMoneyEntry, P2POrder, Position, User
from app.services import p2p_service as p2p
from tests.legacy_helpers import post_legacy_market
from tests.test_markets_api import _admin, _close_at, _login
from tests.test_p2p import submit

HTML = Path(__file__).resolve().parents[1] / "app" / "static" / "miniapp.html"
P2P_JS = HTML.with_name("p2p.js")
ATOM = p2p.ATOM


def _chunk() -> str:
    html = HTML.read_text(encoding="utf-8")
    return (
        P2P_JS.read_text(encoding="utf-8")
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


def render_live_ui(tmp_path: Path, snapshot: dict) -> dict:
    """Execute real Mini App renderers against API JSON from this test run."""
    payload = json.dumps(snapshot, default=str, ensure_ascii=False)
    script = (
        "const CAT_LABEL = {sport:'Спорт',politics:'Политика',unique:'Уникальное'};\n"
        "const SNAP = " + payload + ";\n"
        "let me = SNAP.me || {id:0,is_admin:false,balance:0};\n"
        "let myPositions = {};\n"
        + _chunk()
        + r"""
const data = {
  restingMine: SNAP.restingOrder ? renderMineOrders([SNAP.restingOrder]) : '',
  restingStatus: SNAP.restingOrder ? orderStatusText(SNAP.restingOrder) : '',
  restingCard: SNAP.restingOrder ? orderCard(SNAP.restingOrder) : '',
  preview: SNAP.quote ? p2pPreviewLines(SNAP.quote, SNAP.quoteTerms, SNAP.me.balance) : [],
  toast: SNAP.placeResult ? p2pPlaceToast(SNAP.placeResult) : '',
  partialMineA: SNAP.partialOrderA ? renderMineOrders([SNAP.partialOrderA]) : '',
  partialStatusA: SNAP.partialOrderA ? orderStatusText(SNAP.partialOrderA) : '',
  partialMineB: SNAP.partialOrderB ? renderMineOrders([SNAP.partialOrderB]) : '',
  positionA: SNAP.positionA ? positionCard(SNAP.positionA) : '',
  positionB: SNAP.positionB ? positionCard(SNAP.positionB) : '',
  eventOpen: SNAP.eventOpen ? p2pCard(SNAP.eventOpen) : '',
  eventResolved: SNAP.eventResolved ? p2pCard(SNAP.eventResolved) : '',
  eventVoid: SNAP.eventVoid ? p2pCard(SNAP.eventVoid) : '',
  historyWin: SNAP.historyWin ? settlementCard(SNAP.historyWin) : '',
  historyLoss: SNAP.historyLoss ? settlementCard(SNAP.historyLoss) : '',
  historyVoid: SNAP.historyVoid ? settlementCard(SNAP.historyVoid) : '',
  feedResolved: SNAP.feedResolved ? feedCard(SNAP.feedResolved) : '',
  feedVoid: SNAP.feedVoid ? feedCard(SNAP.feedVoid) : '',
  resolvedPosA: SNAP.resolvedPosA ? positionCard(SNAP.resolvedPosA) : '',
  resolvedPosB: SNAP.resolvedPosB ? positionCard(SNAP.resolvedPosB) : '',
  cancelledMine: SNAP.cancelledOrder ? orderCard(SNAP.cancelledOrder) : '',
  cancelledStatus: SNAP.cancelledOrder ? orderStatusText(SNAP.cancelledOrder) : '',
  fullMine: SNAP.fullOrder ? orderCard(SNAP.fullOrder) : '',
  fullStatus: SNAP.fullOrder ? orderStatusText(SNAP.fullOrder) : ''
};
if (typeof process !== 'undefined' && process.stdout) process.stdout.write(JSON.stringify(data));
if (typeof document !== 'undefined') {
  const out = document.getElementById('out');
  if (out) out.textContent = JSON.stringify(data);
}
"""
    )
    node = shutil.which("node")
    if node:
        path = tmp_path / "beta_e2e_ui.js"
        path.write_text(script, encoding="utf-8")
        proc = subprocess.run(
            [node, str(path)],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        assert proc.returncode == 0, proc.stderr or proc.stdout
        return json.loads(proc.stdout)
    browser = _browser_bin()
    if browser is None:
        pytest.skip("Нет Node.js и браузера для исполнения JS интерфейса")
    harness = tmp_path / "beta_e2e_ui.html"
    harness.write_text(
        "<!doctype html><meta charset='utf-8'><pre id='out'></pre><script>\n"
        + script
        + "\n</script>",
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
    end = proc.stdout.find("</pre>", start)
    return json.loads(proc.stdout[start:end])


def nano_ledger():
    with SessionLocal() as db:
        users = {u.id: int(u.balance_nano) for u in db.query(User)}
        pots = {m.id: int(m.pot_nano) for m in db.query(Market)}
        reserved = sum(int(o.remaining or 0) for o in db.query(P2POrder))
        return dict(
            users=users,
            pots=pots,
            reserved=reserved,
            total=sum(users.values()) + sum(pots.values()) + reserved,
        )


def assert_conserved(before, after, step):
    assert after["total"] == before["total"], (
        f"money leaked at {step}: {before['total']} -> {after['total']}"
    )


def user_nano(user_id):
    with SessionLocal() as db:
        return int(db.get(User, user_id).balance_nano)


def fills_of(mid):
    with SessionLocal() as db:
        return db.query(P2PFill).filter_by(market_id=mid).order_by(P2PFill.id).all()


def journal_of(mid):
    with SessionLocal() as db:
        return db.query(P2PMoneyEntry).filter_by(market_id=mid).order_by(P2PMoneyEntry.id).all()


def assert_order_split(oid):
    with SessionLocal() as db:
        row = db.get(P2POrder, oid)
        assert row.amount == row.filled + row.remaining + row.refunded


def api_balance(client, user, headers):
    body = client.get(f"/users/{user['id']}", headers=headers).json()
    return body["balance"], to_nano_exact(body["balance"])


def to_nano_exact(value):
    from app.money import to_nano
    return to_nano(value)


def create_p2p(client, headers, question):
    response = client.post(
        "/markets",
        headers=headers,
        json={"question": question, "close_at": _close_at(), "outcomes": ["Да", "Нет"]},
    )
    assert response.status_code == 200, response.text
    return response.json()


def audit(client, mid, headers):
    return client.get(f"/markets/{mid}/p2p-reconciliation", headers=headers)


def test_beta_e2e_partial_cancel_full_resolve(client, monkeypatch, tmp_path):
    admin, ah = _admin(client, monkeypatch)
    a, ha = _login(client)
    b, hb = _login(client)
    assert admin["id"] != a["id"] != b["id"]
    assert admin["is_admin"] is True
    assert a["is_admin"] is False and b["is_admin"] is False

    start = nano_ledger()
    a0, a0n = api_balance(client, a, ha)
    b0, b0n = api_balance(client, b, hb)
    admin0n = user_nano(admin["id"])
    assert a0n == 1000 * ATOM and b0n == 1000 * ATOM

    created = create_p2p(client, ha, "Sprint3: будет дождь в субботу?")
    mid = created["id"]
    assert created["mechanism"] == "p2p"
    assert created["status"] == "pending"
    assert created["pot"] == 0
    assert created["lock_ton"] == 0
    assert created["outcomes"] == ["Да", "Нет"]
    assert api_balance(client, a, ha)[1] == a0n
    assert all(item["id"] != mid for item in client.get("/markets").json())
    assert client.get(f"/markets/{mid}").status_code == 404
    assert client.get(f"/markets/{mid}/orderbook").status_code == 404
    assert submit(client, mid, ha, 0, 100, 2).status_code == 400
    assert any(item["id"] == mid for item in client.get(f"/users/{a['id']}/markets", headers=ha).json())
    assert any(item["id"] == mid for item in client.get("/moderation/markets", headers=ah).json())
    assert_conserved(start, nano_ledger(), "create-pending")

    approved = client.post(f"/markets/{mid}/approve", headers=ah)
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "open"
    assert approved.json()["accepting_bets"] is True
    assert any(item["id"] == mid for item in client.get("/markets").json())
    event = client.get(f"/markets/{mid}").json()
    assert event["status"] == "open"
    assert_conserved(start, nano_ledger(), "approve")

    rid = "sprint3-resting-order-aaaa"
    resting = client.post(
        f"/markets/{mid}/orders",
        headers=ha,
        json={"outcome": 0, "money": 100, "odds": 2, "request_id": rid},
    )
    assert resting.status_code == 200, resting.text
    first = resting.json()
    assert first["filled"] == 0 and first["remaining"] == 100 and first["refunded"] == 0
    assert first["status"] == "open"
    assert api_balance(client, a, ha)[1] == a0n - 100 * ATOM
    assert user_nano(a["id"]) == a0n - 100 * ATOM
    assert_order_split(first["id"])
    mine = client.get(f"/users/{a['id']}/orders", headers=ha).json()
    assert mine[0]["id"] == first["id"]
    assert mine[0]["question"] == created["question"]
    assert mine[0]["outcome_name"] == "Да"
    book = client.get(f"/markets/{mid}/orderbook").json()
    assert book["forming"] is True
    assert book["sides"][1][0]["odds"] == pytest.approx(2)
    assert book["sides"][1][0]["available"] == pytest.approx(100)
    quote = client.post(
        f"/markets/{mid}/orders/quote",
        headers=hb,
        json={"outcome": 1, "money": 40, "odds": 2},
    )
    assert quote.status_code == 200, quote.text
    assert quote.json()["requested"]["matched"] == 40
    retry = client.post(
        f"/markets/{mid}/orders",
        headers=ha,
        json={"outcome": 0, "money": 100, "odds": 2, "request_id": rid},
    )
    assert retry.status_code == 200
    assert retry.json()["id"] == first["id"]
    assert api_balance(client, a, ha)[1] == a0n - 100 * ATOM
    assert_conserved(start, nano_ledger(), "first-limit")

    taker = submit(client, mid, hb, 1, 40, 2)
    assert taker.status_code == 200, taker.text
    second = taker.json()
    assert second["filled"] == 40 and second["remaining"] == 0
    own = client.get(f"/users/{a['id']}/orders", headers=ha).json()
    maker = next(item for item in own if item["id"] == first["id"])
    assert maker["filled"] == 40 and maker["remaining"] == 60
    assert maker["status"] == "open"
    assert api_balance(client, a, ha)[1] == a0n - 100 * ATOM
    assert api_balance(client, b, hb)[1] == b0n - 40 * ATOM
    with SessionLocal() as db:
        market = db.get(Market, mid)
        assert market.pot_nano == 80 * ATOM
        pos_a = db.query(Position).filter_by(market_id=mid, user_id=a["id"]).one()
        pos_b = db.query(Position).filter_by(market_id=mid, user_id=b["id"]).one()
        assert pos_a.costs[0] == pytest.approx(40)
        assert pos_b.costs[1] == pytest.approx(40)
        assert pos_a.shares[0] == pytest.approx(80)
        assert pos_b.shares[1] == pytest.approx(80)
    fills = fills_of(mid)
    assert len(fills) == 1
    assert fills[0].maker_stake == 40 * ATOM and fills[0].taker_stake == 40 * ATOM
    kinds = [e.op_type for e in journal_of(mid)]
    assert kinds.count("reserve") == 2
    assert kinds.count("fill_escrow") == 2
    recon = audit(client, mid, ah).json()
    assert recon["fully_verified"] is True
    assert recon["discrepancies"] == []
    assert recon["pot"]["actual_ton"] == pytest.approx(80)
    assert_order_split(first["id"])
    assert_order_split(second["id"])
    assert_conserved(start, nano_ledger(), "partial-fill")

    pos_api_a = client.get(f"/users/{a['id']}/positions", headers=ha).json()
    pos_api_b = client.get(f"/users/{b['id']}/positions", headers=hb).json()
    pos_a_live = next(item for item in pos_api_a if item["market_id"] == mid)
    pos_b_live = next(item for item in pos_api_b if item["market_id"] == mid)
    mine_b_partial = next(
        item for item in client.get(f"/users/{b['id']}/orders", headers=hb).json()
        if item["id"] == second["id"]
    )

    before_cancel = api_balance(client, a, ha)[1]
    cancel = client.post(f"/orders/{first['id']}/cancel", headers=ha)
    assert cancel.status_code == 200, cancel.text
    assert api_balance(client, a, ha)[1] == before_cancel + 60 * ATOM
    cancelled = client.get(f"/users/{a['id']}/orders", headers=ha).json()
    cancelled_row = next(item for item in cancelled if item["id"] == first["id"])
    assert cancelled_row["remaining"] == 0
    assert cancelled_row["refunded"] == 60
    assert cancelled_row["filled"] == 40
    assert cancelled_row["status"] == "cancelled"
    assert_order_split(first["id"])
    with SessionLocal() as db:
        assert db.get(Market, mid).pot_nano == 80 * ATOM
        pos_a = db.query(Position).filter_by(market_id=mid, user_id=a["id"]).one()
        assert pos_a.costs[0] == pytest.approx(40)
        assert pos_a.shares[0] == pytest.approx(80)
    refunds = [e for e in journal_of(mid) if e.op_type == "refund"]
    assert len(refunds) == 1
    assert refunds[0].reason == "cancel"
    assert refunds[0].amount == 60 * ATOM
    again_bal = api_balance(client, a, ha)[1]
    assert client.post(f"/orders/{first['id']}/cancel", headers=ha).status_code == 200
    assert api_balance(client, a, ha)[1] == again_bal
    assert len([e for e in journal_of(mid) if e.op_type == "refund"]) == 1
    assert_conserved(start, nano_ledger(), "cancel-remainder")

    full_a = submit(client, mid, ha, 0, 30, 2)
    assert full_a.status_code == 200, full_a.text
    assert full_a.json()["filled"] == 0 and full_a.json()["remaining"] == 30
    full_b = submit(client, mid, hb, 1, 30, 2)
    assert full_b.status_code == 200, full_b.text
    fb = full_b.json()
    fa = next(
        item for item in client.get(f"/users/{a['id']}/orders", headers=ha).json()
        if item["id"] == full_a.json()["id"]
    )
    assert fa["filled"] == 30 and fa["remaining"] == 0 and fa["status"] == "filled"
    assert fb["filled"] == 30 and fb["remaining"] == 0 and fb["status"] == "filled"
    assert api_balance(client, a, ha)[1] == a0n - 70 * ATOM
    assert api_balance(client, b, hb)[1] == b0n - 70 * ATOM
    with SessionLocal() as db:
        assert db.get(Market, mid).pot_nano == 140 * ATOM
        assert db.query(P2PFill).filter_by(market_id=mid).count() == 2
        pos_a = db.query(Position).filter_by(market_id=mid, user_id=a["id"]).one()
        pos_b = db.query(Position).filter_by(market_id=mid, user_id=b["id"]).one()
        assert pos_a.costs[0] == pytest.approx(70)
        assert pos_b.costs[1] == pytest.approx(70)
        assert pos_a.shares[0] == pytest.approx(140)
        assert pos_b.shares[1] == pytest.approx(140)
    assert audit(client, mid, ah).json()["fully_verified"] is True
    assert_conserved(start, nano_ledger(), "full-fill")

    closed = client.post(f"/markets/{mid}/close", headers=ah)
    assert closed.status_code == 200, closed.text
    assert closed.json()["status"] == "closed"
    assert closed.json()["accepting_bets"] is False
    blocked = submit(client, mid, ha, 0, 10, 2)
    assert blocked.status_code == 400
    assert api_balance(client, a, ha)[1] == a0n - 70 * ATOM
    assert_conserved(start, nano_ledger(), "close")

    resolved = client.post(f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 0})
    assert resolved.status_code == 200, resolved.text
    body = resolved.json()
    assert body["status"] == "resolved"
    assert body["winning_outcome"] == "Да"
    assert body["settlement_kind"] == "auto"
    assert body["pot"] == 0
    with SessionLocal() as db:
        market = db.get(Market, mid)
        assert market.pot_nano == 0
        assert market.settlement_kind == "auto"
        for order in db.query(P2POrder).filter_by(market_id=mid):
            assert order.remaining == 0
            assert order.amount == order.filled + order.refunded
        assert db.query(P2PFill).filter_by(market_id=mid).count() == 2

    hist_a = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    hist_b = client.get(f"/users/{b['id']}/settlements", headers=hb).json()[0]
    assert hist_a["market_id"] == mid and hist_b["market_id"] == mid
    assert hist_a["winning_outcome"] == "Да" and hist_b["winning_outcome"] == "Да"
    assert hist_a["chosen_outcomes"] == ["Да"]
    assert hist_b["chosen_outcomes"] == ["Нет"]
    assert hist_a["stakes_total"] == pytest.approx(70)
    assert hist_b["stakes_total"] == pytest.approx(70)
    assert hist_a["payout"] == pytest.approx(140)
    assert hist_b["payout"] == pytest.approx(0)
    assert hist_a["tip"] == pytest.approx(0.7)
    assert hist_b["tip"] == pytest.approx(0)
    assert hist_a["credited"] == pytest.approx(139.3)
    assert hist_b["credited"] == pytest.approx(0)
    assert hist_a["result"] == pytest.approx(69.3)
    assert hist_b["result"] == pytest.approx(-70)
    assert hist_a["is_loss"] is False
    assert hist_b["is_loss"] is True
    assert hist_a["settlement_kind"] == "auto"
    assert user_nano(a["id"]) == a0n + 693 * ATOM // 10
    assert user_nano(b["id"]) == b0n - 70 * ATOM
    assert user_nano(admin["id"]) == admin0n + 7 * ATOM // 10
    recon = audit(client, mid, ah).json()
    assert recon["fully_verified"] is True
    assert recon["pot"]["expected_nano"] == 0
    tips = [e for e in journal_of(mid) if e.op_type == "tip"]
    payouts = [e for e in journal_of(mid) if e.op_type == "payout"]
    assert len(payouts) == 1 and payouts[0].to_user_id == a["id"]
    assert sum(e.amount for e in tips) == 7 * ATOM // 10
    assert {e.to_user_id for e in tips} == {admin["id"]}
    claim = client.post(f"/markets/{mid}/claim", headers=ha)
    assert claim.status_code == 400
    n_entries = len(journal_of(mid))
    a_after = api_balance(client, a, ha)[1]
    b_after = api_balance(client, b, hb)[1]
    admin_after = user_nano(admin["id"])
    again = client.post(f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 1})
    assert again.status_code == 400
    assert len(journal_of(mid)) == n_entries
    assert api_balance(client, a, ha)[1] == a_after
    assert api_balance(client, b, hb)[1] == b_after
    assert user_nano(admin["id"]) == admin_after
    assert_conserved(start, nano_ledger(), "resolve")

    event_resolved = client.get(f"/markets/{mid}").json()
    feed = client.get("/markets").json()
    feed_row = next(item for item in feed if item["id"] == mid)
    pos_after_a = next(item for item in client.get(f"/users/{a['id']}/positions", headers=ha).json() if item["market_id"] == mid)
    pos_after_b = next(item for item in client.get(f"/users/{b['id']}/positions", headers=hb).json() if item["market_id"] == mid)
    me_a = client.get(f"/users/{a['id']}", headers=ha).json()
    me_b = client.get(f"/users/{b['id']}", headers=hb).json()

    ui = render_live_ui(tmp_path, {
        "me": {"id": a["id"], "is_admin": False, "balance": me_a["balance"]},
        "restingOrder": mine[0],
        "quote": quote.json(),
        "quoteTerms": {"money": 40, "odds": 2, "outcomeName": "Нет"},
        "placeResult": maker,
        "partialOrderA": maker,
        "partialOrderB": mine_b_partial,
        "positionA": pos_a_live,
        "positionB": pos_b_live,
        "eventOpen": event,
        "eventResolved": event_resolved,
        "historyWin": hist_a,
        "historyLoss": hist_b,
        "feedResolved": feed_row,
        "resolvedPosA": pos_after_a,
        "resolvedPosB": pos_after_b,
        "cancelledOrder": cancelled_row,
        "fullOrder": fa,
    })
    assert ui["restingStatus"] == "Ожидает контрагента"
    assert "Отменить остаток" in ui["restingCard"]
    assert "Ожидает контрагента" in ui["restingMine"]
    assert ui["partialStatusA"] == "Частично исполнена"
    assert "Частично исполнена" in ui["partialMineA"]
    assert any("Исполнится сейчас" in line for line in ui["preview"])
    assert "частично исполнена" in ui["toast"].lower()
    assert ui["cancelledStatus"] == "Отменена"
    assert "Отменить остаток" not in ui["cancelledMine"]
    assert ui["fullStatus"] == "Исполнена"
    assert "Да" in ui["historyWin"] and "Победивший исход" in ui["historyWin"]
    assert "+69.30 TON" in ui["historyWin"]
    assert "Проигрыш" not in ui["historyWin"]
    assert "-70.00 TON" in ui["historyLoss"]
    assert "Проигрыш" in ui["historyLoss"]
    assert "Забрать выигрыш" not in ui["eventResolved"]
    assert "Забрать выигрыш" not in ui["resolvedPosA"]
    assert "Забрать выигрыш" not in ui["resolvedPosB"]
    assert "Исход: Да" in ui["eventResolved"] or "Да" in ui["feedResolved"]
    assert "Оставить заявку" not in ui["eventResolved"]
    assert me_a["balance"] == pytest.approx(1069.3)
    assert me_b["balance"] == pytest.approx(930)


def test_beta_e2e_void_partial_and_full(client, monkeypatch, tmp_path):
    admin, ah = _admin(client, monkeypatch)
    a, ha = _login(client)
    b, hb = _login(client)
    start = nano_ledger()
    a0n = api_balance(client, a, ha)[1]
    b0n = api_balance(client, b, hb)[1]

    created = create_p2p(client, ha, "Sprint3 void: отменят ли матч?")
    mid = created["id"]
    assert client.post(f"/markets/{mid}/approve", headers=ah).status_code == 200
    assert submit(client, mid, ha, 0, 80, 2).status_code == 200
    assert submit(client, mid, hb, 1, 20, 2).status_code == 200
    with SessionLocal() as db:
        order = db.query(P2POrder).filter_by(market_id=mid, user_id=a["id"]).one()
        assert order.filled == 20 * ATOM and order.remaining == 60 * ATOM
        assert db.get(Market, mid).pot_nano == 40 * ATOM
    assert submit(client, mid, ha, 0, 25, 2).status_code == 200
    assert submit(client, mid, hb, 1, 25, 2).status_code == 200
    with SessionLocal() as db:
        assert db.get(Market, mid).pot_nano == 90 * ATOM
        assert db.query(P2PFill).filter_by(market_id=mid).count() == 2
    assert_conserved(start, nano_ledger(), "void-setup")

    cancelled = client.post(
        f"/markets/{mid}/cancel",
        headers=ah,
        json={"reason": "Источник не подтвердился"},
    )
    assert cancelled.status_code == 200, cancelled.text
    body = cancelled.json()
    assert body["status"] == "cancelled"
    assert body["settlement_kind"] == "void"
    assert body["pot"] == 0
    assert body["cancellation_reason"] == "Источник не подтвердился"
    assert api_balance(client, a, ha)[1] == a0n
    assert api_balance(client, b, hb)[1] == b0n
    with SessionLocal() as db:
        market = db.get(Market, mid)
        assert market.pot_nano == 0
        assert market.settlement_kind == "void"
        for order in db.query(P2POrder).filter_by(market_id=mid):
            assert order.remaining == 0
            assert order.amount == order.filled + order.refunded
        assert not db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type="tip").count()
        assert not db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type="payout").count()
        voids = db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type="void_return").all()
        assert sum(e.amount for e in voids) == 90 * ATOM
    hist_a = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    hist_b = client.get(f"/users/{b['id']}/settlements", headers=hb).json()[0]
    assert hist_a["settlement_kind"] == "void" and hist_b["settlement_kind"] == "void"
    assert hist_a["tip"] == 0 and hist_b["tip"] == 0
    assert hist_a["is_loss"] is False and hist_b["is_loss"] is False
    assert hist_a["credited"] == pytest.approx(105)
    assert hist_b["credited"] == pytest.approx(45)
    recon = audit(client, mid, ah).json()
    assert recon["fully_verified"] is True
    assert recon["pot"]["expected_nano"] == 0
    assert_conserved(start, nano_ledger(), "void")

    n_entries = len(journal_of(mid))
    repeat = client.post(
        f"/markets/{mid}/cancel",
        headers=ah,
        json={"reason": "Повторная отмена"},
    )
    assert repeat.status_code == 200
    assert repeat.json()["cancellation_reason"] == "Источник не подтвердился"
    assert len(journal_of(mid)) == n_entries
    assert api_balance(client, a, ha)[1] == a0n
    assert api_balance(client, b, hb)[1] == b0n
    assert_conserved(start, nano_ledger(), "void-retry")

    event_void = client.get(f"/markets/{mid}").json()
    feed_void = next(item for item in client.get("/markets").json() if item["id"] == mid)
    ui = render_live_ui(tmp_path, {
        "me": {"id": a["id"], "is_admin": False, "balance": 1000},
        "eventVoid": event_void,
        "historyVoid": hist_a,
        "feedVoid": feed_void,
    })
    assert "Событие отменено · средства возвращены" in ui["historyVoid"]
    assert "Проигрыш" not in ui["historyVoid"]
    assert "Возврат 105.00 TON" in ui["historyVoid"]
    assert "Забрать выигрыш" not in ui["eventVoid"]
    assert "Оставить заявку" not in ui["eventVoid"]
    assert "Отменено" in ui["eventVoid"]
    assert "Источник не подтвердился" in ui["feedVoid"] or "Отменено" in ui["feedVoid"]


def test_beta_e2e_legacy_lmsr_regression(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    creator, ch = _login(client)
    winner, wh = _login(client)
    loser, lh = _login(client)
    start = nano_ledger()
    created = post_legacy_market(
        client,
        "/markets",
        headers=ch,
        json={
            "question": "Sprint3 LMSR: фаворит возьмёт титул?",
            "outcomes": ["Да", "Нет"],
            "lock_ton": 50,
            "close_at": _close_at(),
        },
    )
    assert created.status_code == 200, created.text
    mid = created.json()["id"]
    assert created.json()["mechanism"] == "lmsr"
    quote = client.post(f"/markets/{mid}/quote", json={"outcome": 0, "money": 20})
    assert quote.status_code == 200, quote.text
    assert quote.json()["shares"] > 0
    assert client.post(f"/markets/{mid}/buy", headers=wh, json={"outcome": 0, "money": 20}).status_code == 200
    assert client.post(f"/markets/{mid}/buy", headers=lh, json={"outcome": 1, "money": 10}).status_code == 200
    assert client.post(f"/markets/{mid}/close", headers=ah).status_code == 200
    before_w = api_balance(client, winner, wh)[1]
    before_l = api_balance(client, loser, lh)[1]
    resolved = client.post(f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 0})
    assert resolved.status_code == 200, resolved.text
    assert resolved.json()["settlement_kind"] == "auto"
    assert resolved.json()["pot"] == pytest.approx(0)
    assert api_balance(client, winner, wh)[1] > before_w
    assert api_balance(client, loser, lh)[1] == before_l
    assert client.post(f"/markets/{mid}/claim", headers=wh).status_code == 400
    assert_conserved(start, nano_ledger(), "lmsr-resolve")
    again = client.post(f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 1})
    assert again.status_code == 400
    assert_conserved(start, nano_ledger(), "lmsr-repeat")
