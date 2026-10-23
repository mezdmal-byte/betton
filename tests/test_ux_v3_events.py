from datetime import timedelta
import pytest
from app.database import SessionLocal
from app.models import (
    User,
    Market,
    GuarantorCase,
    EventConfigV3,
    P2PMoneyEntry,
    SettlementRecord,
)
from app.services import market_service as ms, guarantors as gs, p2p_service as p2p
from tests.test_markets_api import _admin, _login
from tests.test_guarantors import setup_case, call
from tests.test_p2p import submit


def payload(kind="public", guarantor_id=None):
    close = ms.utcnow() + timedelta(days=2)
    body = dict(
        event_type=kind,
        question="Кто победит в проверяемом событии?",
        outcomes=["Альфа", "Бета"],
        description="Проверяемое описание",
        rules="Один завершённый матч",
        resolution_method="Проверить итоговый протокол",
        close_at=close.isoformat(),
        ends_at=(close + timedelta(hours=2)).isoformat(),
    )
    if kind == "public":
        body.update(
            category="sports",
            criteria=["Выиграла Альфа", "Выиграла Бета"],
            unverifiable="При отмене матча событие отменяется",
            primary_source={"name": "Протокол", "url": "https://example.com/results"},
        )
    if kind == "guarantor":
        body["guarantor_id"] = guarantor_id
    return body


def create(client, headers, body):
    response = client.post("/ux-v3/events", headers=headers, json=body)
    assert response.status_code == 200, response.text
    return response.json()


def v3_case(client, monkeypatch):
    admin, ah, creator, ch, g, gh, b, bh, _ = setup_case(client, monkeypatch)
    event = create(client, ch, payload("guarantor", g["id"]))
    mid = event["id"]
    bh = {**bh, "X-Market-Share-Token": event["share_token"]}
    assert call(client, mid, gh, "acknowledge").status_code == 200
    assert call(client, mid, gh, "accept", revision=1).status_code == 200
    assert call(client, mid, ch, "consent", revision=1).status_code == 200
    assert call(client, mid, bh, "consent", revision=1).status_code == 200
    return admin, ah, creator, ch, g, gh, b, bh, event


def test_public_fields_and_author_preserved_during_moderator_edit(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    author, h = _login(client)
    body = payload()
    event = create(client, h, body)
    mid = event["id"]
    assert event["status"] == "pending" and event["category"] == "sport"
    assert (
        client.put(
            f"/ux-v3/events/{mid}/moderation",
            headers=h,
            json={"expected_revision": 1, "event": body},
        ).status_code
        == 403
    )
    body["question"] = "Уточнённый вопрос проверяемого события?"
    edit = client.put(
        f"/ux-v3/events/{mid}/moderation",
        headers=ah,
        json={"expected_revision": 1, "event": body},
    )
    assert edit.status_code == 200 and edit.json()["publication_blocked"]
    assert (
        client.put(
            f"/ux-v3/events/{mid}/moderation",
            headers=ah,
            json={"expected_revision": 1, "event": body},
        ).status_code
        == 409
    )
    assert (
        client.post(f"/markets/{mid}/approve", headers=ah, json={}).status_code == 409
    )
    revisions = client.get(f"/ux-v3/events/{mid}/revisions", headers=h).json()
    assert revisions[0]["snapshot"]["question"] != revisions[-1]["snapshot"]["question"]
    assert all(r["snapshot"]["creator_id"] == author["id"] for r in revisions)
    approved = client.post(
        f"/ux-v3/events/{mid}/moderation/approve-original", headers=ah, json={}
    )
    assert approved.status_code == 200 and approved.json()["status"] == "open"
    assert approved.json()["creator_id"] == author["id"]
    assert (
        client.put(
            f"/ux-v3/events/{mid}/moderation",
            headers=ah,
            json={"expected_revision": 3, "event": body},
        ).status_code
        == 409
    )


def test_validation_and_private_creator_terms_consent(client, monkeypatch):
    _, ah = _admin(client, monkeypatch)
    author, h = _login(client)
    other, oh = _login(client)
    for field in ("primary_source", "criteria", "category", "unverifiable"):
        body = payload()
        body.pop(field)
        assert client.post("/ux-v3/events", headers=h, json=body).status_code in (
            400,
            422,
        )
    body = payload()
    body["outcomes"] = [" SAME ", "same"]
    assert client.post("/ux-v3/events", headers=h, json=body).status_code in (400, 422)
    body = payload()
    body["primary_source"]["name"] = "   "
    assert client.post("/ux-v3/events", headers=h, json=body).status_code in (400, 422)
    event = create(client, h, payload("private"))
    mid = event["id"]
    assert event["status"] == "open"
    token = {**oh, "X-Market-Share-Token": event["share_token"]}
    assert client.get(f"/ux-v3/events/{mid}/terms", headers=oh).status_code == 404
    assert submit(client, mid, token, 0, 10, 2).status_code == 403
    assert (
        client.post(
            f"/ux-v3/events/{mid}/consent", headers=token, json={"revision": 1}
        ).status_code
        == 200
    )
    assert submit(client, mid, token, 0, 10, 2).status_code == 200
    assert client.get(f"/ux-v3/events/{mid}/terms", headers=oh).status_code == 200
    assert (
        client.post(
            f"/ux-v3/events/{mid}/creator-decision",
            headers=oh,
            json={"outcome": 0, "reason": "Проверено"},
        ).status_code
        == 403
    )
    assert (
        client.post(
            f"/ux-v3/events/{mid}/creator-decision",
            headers=h,
            json={"outcome": 0, "reason": "Проверено"},
        ).status_code
        == 409
    )
    with SessionLocal() as db:
        db.get(EventConfigV3, mid).ends_at = gs.now() - timedelta(seconds=1)
        db.commit()
    assert (
        client.post(
            f"/markets/{mid}/resolve", headers=ah, json={"winning_outcome": 0}
        ).status_code
        == 403
    )
    assert (
        client.post(
            f"/ux-v3/events/{mid}/creator-decision",
            headers=h,
            json={"outcome": 0, "reason": "Проверено"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/ux-v3/events/{mid}/creator-decision",
            headers=h,
            json={"outcome": 0, "reason": "Повтор"},
        ).status_code
        == 409
    )


def test_guarantor_final_decision_and_negotiation_privacy(client, monkeypatch):
    _, ah, a, ha, g, gh, b, hb, event = v3_case(client, monkeypatch)
    mid = event["id"]
    assert submit(client, mid, ha, 0, 100, 2).status_code == 200
    assert submit(client, mid, hb, 1, 40, 2).status_code == 200
    assert (
        call(client, mid, ha, "message", text="Приватные переговоры").status_code == 200
    )
    view = client.get(f"/markets/{mid}/guarantor", headers=hb).json()
    assert not any(m["text"] == "Приватные переговоры" for m in view["messages"])
    assert call(client, mid, hb, "message", text="Чужие переговоры").status_code == 403
    assert (
        call(
            client,
            mid,
            gh,
            "propose",
            revision=1,
            outcome=0,
            text="Результат подтверждён",
        ).status_code
        == 409
    )
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
    monkeypatch.setattr(gs, "now", lambda: ends + timedelta(hours=1))
    result = call(
        client, mid, gh, "propose", revision=1, outcome=0, text="Результат подтверждён"
    )
    assert result.status_code == 200 and result.json()["state"] == "settled"
    assert call(client, mid, hb, "dispute", text="Не согласен").status_code == 409
    assert (
        call(client, mid, ah, "admin_resolve", outcome=1, text="Пересмотр").status_code
        == 409
    )
    assert (
        call(
            client, mid, gh, "propose", revision=1, outcome=1, text="Повтор"
        ).status_code
        == 409
    )
    with SessionLocal() as db:
        assert db.get(Market, mid).status.value == "resolved"
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2


def test_guarantor_timeout_refunds_existing_accounting_once(client, monkeypatch):
    _, ah, a, ha, g, gh, b, hb, event = v3_case(client, monkeypatch)
    mid = event["id"]
    with SessionLocal() as db:
        before = {uid: db.get(User, uid).balance_nano for uid in (a["id"], b["id"])}
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 40, 2)
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
    monkeypatch.setattr(gs, "now", lambda: ends + timedelta(hours=24))
    # Automatic authority uses server clock too; no admin identity is fabricated.
    monkeypatch.setattr(ms, "utcnow", lambda: ms.as_utc(ends) + timedelta(hours=24))
    with SessionLocal() as db:
        market = ms._lock_market(db, mid)
        gs.expire(db, market, db.get(GuarantorCase, mid))
        db.commit()
    with SessionLocal() as db:
        p2p.cancel_expired_v3(db, mid)
        assert db.get(Market, mid).status.value == "cancelled"
        assert db.get(Market, mid).cancelled_by is None
        assert {uid: db.get(User, uid).balance_nano for uid in before} == before
        assert (
            db.query(P2PMoneyEntry)
            .filter_by(market_id=mid, op_type="void_return")
            .count()
            == 2
        )
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2


def test_revoked_guarantor_cannot_finalize_and_admin_cannot_close(client, monkeypatch):
    from app.models import GuarantorProfile

    _, ah, a, ha, g, gh, b, hb, event = v3_case(client, monkeypatch)
    mid = event["id"]
    assert client.post(f"/markets/{mid}/close", headers=ah, json={}).status_code == 403
    private = create(client, ha, payload("private"))
    assert (
        client.post(f"/markets/{private['id']}/close", headers=ah, json={}).status_code
        == 403
    )
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
        db.get(GuarantorProfile, g["id"]).status = "suspended"
        db.commit()
    monkeypatch.setattr(gs, "now", lambda: ends + timedelta(hours=1))
    assert (
        call(
            client, mid, gh, "propose", revision=1, outcome=0, text="Проверено"
        ).status_code
        == 403
    )
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "active"
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0


def test_reinvite_clears_old_reward_and_invalidates_old_revision(client, monkeypatch):
    _, ah, a, ha, g, gh, b, hb, _ = setup_case(client, monkeypatch)
    event = create(client, ha, payload("guarantor", g["id"]))
    mid = event["id"]
    assert call(client, mid, gh, "acknowledge").status_code == 200
    assert (
        client.post(
            f"/ux-v3/events/{mid}/reward",
            headers=ha,
            json={"expected_revision": 1, "mode": "fixed", "fixed_ton": "0"},
        ).status_code
        == 200
    )
    assert call(client, mid, gh, "decline", text="Не могу проверить").status_code == 200
    replacement, rh = _login(client)
    assert (
        client.put(
            "/guarantors/me",
            headers=rh,
            json={
                "bio": "Проверяю результаты событий",
                "topics": "События",
                "accept_rules": True,
            },
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/guarantors/{replacement['id']}/approval",
            headers=ah,
            json={"approved": True},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/guarantors/me/availability", headers=rh, json={"available": True}
        ).status_code
        == 200
    )
    invited = call(client, mid, ha, "invite", guarantor_id=replacement["id"])
    assert invited.status_code == 200, invited.text
    with SessionLocal() as db:
        cfg = db.get(EventConfigV3, mid)
        case = db.get(GuarantorCase, mid)
        assert cfg.terms["guarantor_id"] == replacement["id"]
        assert cfg.reward == {} and cfg.revision == case.revision == 3
    assert call(client, mid, gh, "acknowledge").status_code in (403, 404)
    assert call(client, mid, rh, "acknowledge").status_code == 200
    assert call(client, mid, rh, "accept", revision=1).status_code == 409


def test_paid_reward_is_not_falsely_activated(client, monkeypatch):
    _, _, a, ha, g, gh, b, hb, _ = setup_case(client, monkeypatch)
    event = create(client, ha, payload("guarantor", g["id"]))
    mid = event["id"]
    call(client, mid, gh, "acknowledge")
    assert (
        client.post(
            f"/ux-v3/events/{mid}/reward",
            headers=hb,
            json={"expected_revision": 1, "fixed_ton": "5"},
        ).status_code
        == 403
    )
    r = client.post(
        f"/ux-v3/events/{mid}/reward",
        headers=ha,
        json={"expected_revision": 1, "mode": "percent", "percent": "5"},
    )
    assert r.status_code == 200 and r.json()["payments_supported"] is False
    assert call(client, mid, gh, "accept", revision=2).status_code == 409
    assert (
        client.get(f"/markets/{mid}/guarantor", headers=ha).json()["state"] == "review"
    )


def test_cancelled_creator_event_never_leaks_to_stranger(client, monkeypatch):
    _admin(client, monkeypatch)
    a, ha = _login(client)
    b, hb = _login(client)
    event = create(client, ha, payload("private"))
    mid = event["id"]
    with SessionLocal() as db:
        db.get(EventConfigV3, mid).ends_at = gs.now() - timedelta(seconds=1)
        db.commit()
    assert (
        client.post(
            f"/ux-v3/events/{mid}/creator-cancel",
            headers=ha,
            json={"reason": "Нет результата"},
        ).status_code
        == 200
    )
    denied = client.post(
        f"/ux-v3/events/{mid}/creator-cancel", headers=hb, json={"reason": "Повтор"}
    )
    assert denied.status_code == 403 and event["share_token"] not in denied.text


def test_timeout_corrupt_bank_rolls_back_and_concurrent_retry_is_idempotent(
    client, monkeypatch
):
    from concurrent.futures import ThreadPoolExecutor
    from fastapi import HTTPException

    _, _, a, ha, g, gh, b, hb, event = v3_case(client, monkeypatch)
    mid = event["id"]
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 40, 2)
    with SessionLocal() as db:
        ends = db.get(EventConfigV3, mid).ends_at
        expected = db.get(Market, mid).pot_nano
        db.get(Market, mid).pot_nano = expected + 1
        db.commit()
        balances = {uid: db.get(User, uid).balance_nano for uid in (a["id"], b["id"])}
    monkeypatch.setattr(gs, "now", lambda: ends + timedelta(hours=25))
    monkeypatch.setattr(ms, "utcnow", lambda: ms.as_utc(ends) + timedelta(hours=25))
    with SessionLocal() as db:
        with pytest.raises(HTTPException):
            p2p.cancel_expired_v3(db, mid)
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).state == "active"
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0
        assert {uid: db.get(User, uid).balance_nano for uid in balances} == balances
        db.get(Market, mid).pot_nano = expected
        db.commit()

    def retry():
        with SessionLocal() as db:
            return p2p.cancel_expired_v3(db, mid).status.value

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert list(pool.map(lambda _: retry(), range(2))) == ["cancelled", "cancelled"]
    with SessionLocal() as db:
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2
        assert (
            db.query(P2PMoneyEntry)
            .filter_by(market_id=mid, op_type="void_return")
            .count()
            == 2
        )
