from datetime import timedelta

import pytest

from app.database import SessionLocal
from app.models import (
    User,
    Market,
    EventConfigV3,
    GuarantorCase,
    P2POrder,
    P2PFill,
    P2PMoneyEntry,
    SettlementRecord,
)
from app.services import (
    guarantors as gs,
    market_service as ms,
    p2p_ledger as ledger,
    p2p_service as p2p,
)
from tests.test_ux_v3_events import payload, create
from tests.test_guarantors import setup_case, call
from tests.test_markets_api import _login
from tests.test_p2p import submit

NANO = 10**9


def paid_case(client, monkeypatch, mode="fixed", fixed="100", percent="0"):
    admin, ah, a, ha, g, hg, b, hb, _ = setup_case(client, monkeypatch)
    event = create(client, ha, payload("guarantor", g["id"]))
    mid = event["id"]
    hb = {**hb, "X-Market-Share-Token": event["share_token"]}
    assert call(client, mid, hg, "acknowledge").status_code == 200
    offer = client.post(
        f"/ux-v3/events/{mid}/reward",
        headers=ha,
        json={
            "expected_revision": 1,
            "mode": mode,
            "fixed_ton": fixed,
            "percent": percent,
        },
    )
    assert offer.status_code == 200, offer.text
    assert call(client, mid, ha, "confirm", revision=2).status_code == 200
    accept = call(client, mid, hg, "accept", revision=2)
    assert accept.status_code == 200, accept.text
    assert accept.json()["state"] == "collecting"
    assert accept.json()["reward_payments_supported"]
    assert not accept.json()["funding"]["secured"]
    assert call(client, mid, ha, "consent", revision=2).status_code == 200
    assert call(client, mid, hb, "consent", revision=2).status_code == 200
    return admin, ah, a, ha, g, hg, b, hb, event


def totals():
    with SessionLocal() as db:
        return (
            sum(u.balance_nano for u in db.query(User))
            + sum(m.pot_nano for m in db.query(Market))
            + sum(o.remaining for o in db.query(P2POrder))
        )


@pytest.mark.parametrize(
    "mode,fixed,percent,rewards",
    [
        ("fixed", "100", "0", (100, 100)),
        ("percent", "0", "3", (21, 9)),
        ("combined", "100", "3", (121, 109)),
        ("percent_minimum", "100", "3", (100, 100)),
    ],
)
@pytest.mark.parametrize("outcome", [0, 1])
def test_tariffs_actual_partial_fills_multiple_winners_atomic_settlement_and_journal(
    client, monkeypatch, mode, fixed, percent, rewards, outcome
):
    admin, ah, a, ha, g, hg, b, hb, event = paid_case(
        client, monkeypatch, mode, fixed, percent
    )
    mid = event["id"]
    c, hc = _login(client)
    hc = {**hc, "X-Market-Share-Token": event["share_token"]}
    assert call(client, mid, hc, "consent", revision=2).status_code == 200
    before = totals()
    with SessionLocal() as db:
        history_initial = {u.id: u.balance_nano for u in db.query(User)}
        gua_before = db.get(User, g["id"]).balance_nano
    maker = submit(client, mid, ha, 0, 400, 4)
    assert maker.status_code == 200, maker.text
    assert (
        submit(client, mid, hb, 1, 600, p2p.taker_odds_for_maker(250000)).status_code
        == 200
    )
    assert (
        client.get(f"/markets/{mid}/guarantor", headers=ha).json()["state"] == "active"
    )
    assert submit(client, mid, hc, 0, 100, 2).status_code == 200
    assert submit(client, mid, hb, 1, 100, 2).status_code == 200
    with SessionLocal() as db:
        assert db.query(P2PFill).filter_by(market_id=mid).count() == 2
        assert db.get(P2POrder, maker.json()["id"]).remaining == 200 * NANO
        assert db.get(User, g["id"]).balance_nano == gua_before
        ends = db.get(EventConfigV3, mid).ends_at
    monkeypatch.setattr(gs, "now", lambda: ends + timedelta(hours=1))
    monkeypatch.setattr(ms, "utcnow", lambda: ms.as_utc(ends) + timedelta(hours=1))
    decision = call(
        client,
        mid,
        hg,
        "propose",
        revision=2,
        outcome=outcome,
        text="Проверено по итоговому протоколу",
    )
    assert decision.status_code == 200, decision.text
    assert decision.json()["state"] == "settled"
    assert totals() == before
    with SessionLocal() as db:
        assert (
            db.get(User, g["id"]).balance_nano == gua_before + rewards[outcome] * NANO
        )
        assert db.get(Market, mid).pot_nano == 0
        assert db.query(P2POrder).filter_by(market_id=mid, status="open").count() == 0
        from tests.test_guarantor_history import assert_history_matches_balance
        assert_history_matches_balance(db, mid, history_initial)
        journal = ledger.reconcile(db, mid)
        assert journal["fully_verified"], journal["discrepancies"]
        assert journal["pot"]["guarantor_rewards_nano"] == rewards[outcome] * NANO
        for rec in db.query(SettlementRecord).filter_by(market_id=mid):
            profit = max(0, rec.payout - rec.stakes_total)
            if profit:
                assert rec.credited - rec.stakes_total + 1e-8 >= 0.2 * profit
    assert (
        call(
            client,
            mid,
            hg,
            "propose",
            revision=2,
            outcome=outcome,
            text="Повторный запрос",
        ).status_code
        == 409
    )
    assert totals() == before


def test_insufficient_fund_returns_matched_and_unmatched_no_fees_or_reward(
    client, monkeypatch
):
    _, _, a, ha, g, hg, b, hb, event = paid_case(client, monkeypatch)
    mid = event["id"]
    before = totals()
    with SessionLocal() as db:
        balances = {
            uid: db.get(User, uid).balance_nano for uid in (a["id"], b["id"], g["id"])
        }
    assert submit(client, mid, ha, 0, 100, 2).status_code == 200
    assert submit(client, mid, hb, 1, 40, 2).status_code == 200
    with SessionLocal() as db:
        close = db.get(Market, mid).close_at
    monkeypatch.setattr(gs, "now", lambda: close + timedelta(seconds=1))
    monkeypatch.setattr(ms, "utcnow", lambda: ms.as_utc(close) + timedelta(seconds=1))
    gs.process_due()
    assert totals() == before
    with SessionLocal() as db:
        assert db.get(Market, mid).status.value == "cancelled"
        assert {uid: db.get(User, uid).balance_nano for uid in balances} == balances
        assert (
            db.query(P2PMoneyEntry)
            .filter(
                P2PMoneyEntry.market_id == mid,
                P2PMoneyEntry.op_type.in_(["tip", "guarantor_reward"]),
            )
            .count()
            == 0
        )
        assert ledger.reconcile(db, mid)["fully_verified"]


def test_active_fund_cannot_be_destroyed_by_new_hedging_fill(client, monkeypatch):
    _, _, a, ha, g, hg, b, hb, event = paid_case(client, monkeypatch, fixed="50")
    mid = event["id"]
    assert submit(client, mid, ha, 0, 100, 2).status_code == 200
    assert submit(client, mid, hb, 1, 100, 2).status_code == 200
    assert submit(client, mid, ha, 1, 100, 2).status_code == 200
    with SessionLocal() as db:
        bank = db.get(Market, mid).pot_nano
        fills = db.query(P2PFill).filter_by(market_id=mid).count()
        buyer = db.get(User, b["id"]).balance_nano
    rejected = submit(client, mid, hb, 0, 100, 2)
    assert rejected.status_code == 409, rejected.text
    with SessionLocal() as db:
        assert db.get(Market, mid).pot_nano == bank
        assert db.get(User, b["id"]).balance_nano == buyer
        assert db.query(P2PFill).filter_by(market_id=mid).count() == fills
        assert ledger.reconcile(db, mid)["fully_verified"]


def secured_pair(client, monkeypatch):
    values = paid_case(client, monkeypatch, fixed="50")
    _, _, a, ha, g, hg, b, hb, event = values
    mid = event["id"]
    assert submit(client, mid, ha, 0, 150, 2).status_code == 200
    assert submit(client, mid, hb, 1, 100, 2).status_code == 200
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
    monkeypatch.setattr(gs, "now", lambda: ends + timedelta(hours=1))
    monkeypatch.setattr(ms, "utcnow", lambda: ms.as_utc(ends) + timedelta(hours=1))
    return values


def test_guarantor_cancels_without_winner_no_fee_or_reward(client, monkeypatch):
    _, _, a, ha, g, hg, b, hb, event = secured_pair(client, monkeypatch)
    mid = event["id"]
    before = totals()
    assert (
        call(
            client, mid, hg, "cancel", revision=1, text="Нет объективного результата"
        ).status_code
        == 409
    )
    assert (
        call(client, mid, ha, "cancel", revision=2, text="Нет результата").status_code
        == 403
    )
    result = call(
        client, mid, hg, "cancel", revision=2, text="Нет объективного результата"
    )
    assert result.status_code == 200, result.text
    assert result.json()["state"] == "cancelled"
    assert totals() == before
    with SessionLocal() as db:
        assert (
            db.query(P2PMoneyEntry)
            .filter(
                P2PMoneyEntry.market_id == mid,
                P2PMoneyEntry.op_type.in_(["tip", "guarantor_reward", "payout"]),
            )
            .count()
            == 0
        )
        assert ledger.reconcile(db, mid)["fully_verified"]


def test_reward_record_failure_rolls_back_fees_refunds_decision_and_balances(
    client, monkeypatch
):
    from fastapi import HTTPException

    _, _, a, ha, g, hg, b, hb, event = secured_pair(client, monkeypatch)
    mid = event["id"]
    before = totals()
    with SessionLocal() as db:
        balances = {u.id: u.balance_nano for u in db.query(User)}
        bank = db.get(Market, mid).pot_nano
        remainders = {
            o.id: o.remaining for o in db.query(P2POrder).filter_by(market_id=mid)
        }
    original = ledger.record

    def fail_reward(db, **kwargs):
        if kwargs.get("op_type") == "guarantor_reward":
            raise HTTPException(409, "Проверка атомарности")
        return original(db, **kwargs)

    monkeypatch.setattr(ledger, "record", fail_reward)
    assert (
        call(client, mid, hg, "propose", revision=2, outcome=0, text="Итог").status_code
        == 409
    )
    assert totals() == before
    with SessionLocal() as db:
        assert {u.id: u.balance_nano for u in db.query(User)} == balances
        assert db.get(Market, mid).pot_nano == bank
        assert db.get(GuarantorCase, mid).state == "active"
        assert {
            o.id: o.remaining for o in db.query(P2POrder).filter_by(market_id=mid)
        } == remainders
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0
        assert ledger.reconcile(db, mid)["fully_verified"]


def test_two_concurrent_final_decisions_only_one_pays(client, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor

    _, _, a, ha, g, hg, b, hb, event = secured_pair(client, monkeypatch)
    mid = event["id"]
    before = totals()
    with SessionLocal() as db:
        history_initial = {u.id: u.balance_nano for u in db.query(User)}
        gua_before = db.get(User, g["id"]).balance_nano

    def decide(side):
        return call(
            client, mid, hg, "propose", revision=2, outcome=side, text="Проверено"
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(decide, [0, 1])) == [200, 409]
    assert totals() == before
    with SessionLocal() as db:
        assert db.get(User, g["id"]).balance_nano == gua_before + 50 * NANO
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2
        assert ledger.reconcile(db, mid)["fully_verified"]


def test_quote_projects_fees_without_fake_execution_or_guaranteed_unfilled_payout(
    client, monkeypatch
):
    _, _, a, ha, g, hg, b, hb, event = paid_case(client, monkeypatch)
    mid = event["id"]
    assert submit(client, mid, ha, 0, 200, 2).status_code == 200
    before = totals()
    quote = client.post(
        f"/markets/{mid}/orders/quote",
        headers=hb,
        json={"outcome": 1, "money": "150", "odds": "2", "kind": "limit"},
    )
    assert quote.status_code == 200, quote.text
    costs = quote.json()["requested"]["guarantor_costs"]
    assert costs["preliminary"] and costs["secured_for_both_outcomes"]
    assert costs["event_payout_after_fees_nano"] == str(198_500_000_000)
    assert costs["guarantor_reward_nano"] == str(100 * NANO)
    assert costs["service_fee_nano"] == str(1_500_000_000)
    assert totals() == before
    with SessionLocal() as db:
        assert db.query(P2PFill).filter_by(market_id=mid).count() == 0
        assert db.get(GuarantorCase, mid).state == "collecting"
