"""Start/cutoff protocol is additive; legacy events retain their end time."""
from datetime import datetime, timedelta

import pytest

from app.database import SessionLocal
from app.models import EventConfigV3, GuarantorCase, Market, MarketStatus, User
from app.services import guarantors as gs, market_service as ms, p2p_service as p2p
from tests.test_markets_api import _admin, _login
from tests.test_p2p import submit
from tests.test_ux_v3_events import create, payload


def start_payload(kind="private", guarantor_id=None):
    body = payload(kind, guarantor_id)
    body["timing_version"] = "start-v1"
    if kind != "guarantor":
        body["ends_at"] = None
    return body


def clock(monkeypatch, when):
    monkeypatch.setattr(gs, "now", lambda: when)
    monkeypatch.setattr(ms, "utcnow", lambda: ms.as_utc(when))


@pytest.mark.parametrize("delay", [timedelta(0), timedelta(days=365)])
def test_private_decision_available_at_start_without_upper_deadline(client, monkeypatch, delay):
    _admin(client, monkeypatch)
    author, headers = _login(client)
    event = create(client, headers, start_payload())
    mid = event["id"]
    with SessionLocal() as db:
        start = db.get(Market, mid).close_at
        assert db.get(EventConfigV3, mid).ends_at == start
        assert db.get(GuarantorCase, mid) is None
    terms = client.get(f"/ux-v3/events/{mid}/terms", headers=headers).json()
    assert terms["ends_at"] is None and terms["guarantor_due_at"] is None
    clock(monkeypatch, start - timedelta(microseconds=1))
    assert client.post(f"/ux-v3/events/{mid}/creator-decision", headers=headers,
                       json={"outcome": 0, "reason": "Проверено"}).status_code == 409
    clock(monkeypatch, start + delay)
    # The normal close path must not turn an unresolved private event into an
    # automatic cancellation, even long after the start.
    with SessionLocal() as db:
        market = db.get(Market, mid)
        ms._maybe_auto_close(db, market)
        db.commit()
        assert market.status == MarketStatus.closed
    response = client.post(f"/ux-v3/events/{mid}/creator-decision", headers=headers,
                           json={"outcome": 0, "reason": "Проверено"})
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "resolved"
    assert client.post(f"/ux-v3/events/{mid}/creator-decision", headers=headers,
                       json={"outcome": 1, "reason": "Повтор"}).status_code == 409


def test_private_betting_closes_exactly_at_start_and_cancel_stays_owner_only(client, monkeypatch):
    _admin(client, monkeypatch)
    author, headers = _login(client)
    other, other_headers = _login(client)
    event = create(client, headers, start_payload())
    mid = event["id"]
    with SessionLocal() as db:
        start = db.get(Market, mid).close_at
        before = db.get(User, author["id"]).balance_nano
    assert client.post(f"/ux-v3/events/{mid}/consent", headers=headers, json={"revision": 1}).status_code == 200
    clock(monkeypatch, start - timedelta(microseconds=1))
    assert submit(client, mid, headers, 0, 10, 2).status_code == 200
    assert client.post(f"/ux-v3/events/{mid}/creator-cancel", headers=headers,
                       json={"reason": "Нет результата"}).status_code == 403
    clock(monkeypatch, start)
    assert submit(client, mid, headers, 0, 10, 2).status_code == 400
    assert client.post(f"/ux-v3/events/{mid}/creator-cancel", headers=other_headers,
                       json={"reason": "Чужое решение"}).status_code == 403
    response = client.post(f"/ux-v3/events/{mid}/creator-cancel", headers=headers,
                           json={"reason": "Результат нельзя определить"})
    assert response.status_code == 200, response.text
    with SessionLocal() as db:
        assert db.get(User, author["id"]).balance_nano == before
        assert p2p.ledger.reconcile(db, mid)["fully_verified"]


def test_legacy_private_still_waits_for_its_original_end(client, monkeypatch):
    _admin(client, monkeypatch)
    _, headers = _login(client)
    event = create(client, headers, payload("private"))
    mid = event["id"]
    with SessionLocal() as db:
        start, end = db.get(Market, mid).close_at, db.get(EventConfigV3, mid).ends_at
    clock(monkeypatch, start)
    assert client.post(f"/ux-v3/events/{mid}/creator-decision", headers=headers,
                       json={"outcome": 0, "reason": "Проверено"}).status_code == 409
    assert client.post(f"/ux-v3/events/{mid}/creator-cancel", headers=headers,
                       json={"reason": "Нет результата"}).status_code == 403
    clock(monkeypatch, end)
    assert client.post(f"/ux-v3/events/{mid}/creator-decision", headers=headers,
                       json={"outcome": 0, "reason": "Проверено"}).status_code == 200


def test_guarantor_requires_end_and_other_versioned_types_reject_a_fake_end(client):
    _, headers = _login(client)
    body = start_payload("guarantor", 123)
    body["ends_at"] = None
    assert client.post("/ux-v3/events", headers=headers, json=body).status_code in (400, 422)
    body = start_payload()
    body["ends_at"] = body["close_at"]
    assert client.post("/ux-v3/events", headers=headers, json=body).status_code in (400, 422)
    body = payload("private")
    body.pop("ends_at")
    assert client.post("/ux-v3/events", headers=headers, json=body).status_code in (400, 422)


def test_public_no_end_survives_moderation_edit_and_original_restore(client, monkeypatch):
    _, admin_headers = _admin(client, monkeypatch)
    _, headers = _login(client)
    original = start_payload("public")
    event = create(client, headers, original)
    mid = event["id"]
    edited = {**original, "question": "Уточнённый вопрос проверяемого события?"}
    response = client.put(f"/ux-v3/events/{mid}/moderation", headers=admin_headers,
                          json={"expected_revision": 1, "event": edited})
    assert response.status_code == 200, response.text
    terms = client.get(f"/ux-v3/events/{mid}/terms", headers=headers).json()
    assert terms["ends_at"] is None and terms["timing_version"] == "start-v1"
    restored = client.post(f"/ux-v3/events/{mid}/moderation/approve-original", headers=admin_headers)
    assert restored.status_code == 200, restored.text
    terms = client.get(f"/ux-v3/events/{mid}/terms", headers=headers).json()
    assert terms["question"] == original["question"]
    assert terms["ends_at"] is None and terms["timing_version"] == "start-v1"


def test_versioned_guarantor_keeps_estimated_end_and_24_hour_window(client, monkeypatch):
    from tests.test_guarantors import setup_case, call
    _, _, _, headers, guarantor, guarantor_headers, _, player_headers, _ = setup_case(client, monkeypatch)
    body = start_payload("guarantor", guarantor["id"])
    event = create(client, headers, body)
    mid = event["id"]
    assert call(client, mid, guarantor_headers, "acknowledge").status_code == 200
    assert call(client, mid, guarantor_headers, "accept", revision=1).status_code == 200
    player_headers = {**player_headers, "X-Market-Share-Token": event["share_token"]}
    assert call(client, mid, headers, "consent", revision=1).status_code == 200
    assert call(client, mid, player_headers, "consent", revision=1).status_code == 200
    assert submit(client, mid, headers, 0, 100, 2).status_code == 200
    assert submit(client, mid, player_headers, 1, 100, 2).status_code == 200
    with SessionLocal() as db:
        start = db.get(Market, mid).close_at
        end = db.get(EventConfigV3, mid).ends_at
        assert db.get(GuarantorCase, mid).state == "active"
        assert db.get(GuarantorCase, mid).result_due_at == end + timedelta(hours=24)
    terms = client.get(f"/ux-v3/events/{mid}/terms", headers=headers).json()
    assert terms["ends_at"] is not None
    assert ms.as_utc(end) == ms.as_utc(datetime.fromisoformat(terms["ends_at"]))
    clock(monkeypatch, start)
    assert call(client, mid, guarantor_headers, "propose", revision=1, outcome=0, text="Проверено").status_code == 409
    clock(monkeypatch, end)
    result = call(client, mid, guarantor_headers, "propose", revision=1, outcome=0, text="Проверено")
    assert result.status_code == 200, result.text
    assert result.json()["state"] == "settled"


def test_no_end_creation_replay_after_start_returns_same_event(client, monkeypatch):
    _, headers = _login(client)
    body = start_payload()
    event = create(client, headers, body)
    with SessionLocal() as db:
        start = db.get(Market, event["id"]).close_at
    clock(monkeypatch, start + timedelta(days=40))
    assert create(client, headers, body) == event
    assert client.get(f"/ux-v3/events/{event['id']}/terms", headers=headers).json()["ends_at"] is None


def test_start_decision_settles_real_partial_fills_and_returns_resting_remainder(client, monkeypatch):
    _admin(client, monkeypatch)
    author, headers = _login(client)
    _, other_headers = _login(client)
    event = create(client, headers, start_payload())
    mid = event["id"]
    other_headers = {**other_headers, "X-Market-Share-Token": event["share_token"]}
    for participant_headers in (headers, other_headers):
        assert client.post(f"/ux-v3/events/{mid}/consent", headers=participant_headers,
                           json={"revision": 1}).status_code == 200
    assert submit(client, mid, headers, 0, 100, 2).status_code == 200
    assert submit(client, mid, other_headers, 1, 40, 2).status_code == 200
    with SessionLocal() as db:
        start = db.get(Market, mid).close_at
    clock(monkeypatch, start)
    result = client.post(f"/ux-v3/events/{mid}/creator-decision", headers=headers,
                         json={"outcome": 0, "reason": "Подтверждённый результат"})
    assert result.status_code == 200, result.text
    with SessionLocal() as db:
        from app.models import P2POrder, SettlementRecord
        assert db.query(P2POrder).filter_by(market_id=mid, status="open").count() == 0
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2
        report = p2p.ledger.reconcile(db, mid)
        assert report["fully_verified"], report
