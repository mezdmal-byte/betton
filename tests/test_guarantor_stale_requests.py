"""Version/round binding through real authenticated API, on disposable databases."""
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from threading import Barrier

import pytest
from app.database import SessionLocal
from app.models import (GuarantorCase, AppNotification, GuarantorMessage,
                        EventRevisionV3, P2PMoneyEntry, SettlementRecord)
from app.services import guarantors as gs
from tests.test_guarantors import call, setup_case
from tests.test_guarantor_security_followup import review, snap
from tests.test_markets_api import _login
from tests.test_ux_v3_events import create, payload


def snapshot(mid):
    """All case columns, notices, evidence and financial rows, not just counts."""
    with SessionLocal() as db:
        rows = []
        for model in (GuarantorCase, AppNotification, GuarantorMessage,
                      EventRevisionV3, P2PMoneyEntry, SettlementRecord):
            rows.append(tuple(repr(tuple(getattr(row, c.name) for c in model.__table__.columns))
                              for row in db.query(model).filter_by(market_id=mid)
                              .order_by(*model.__table__.primary_key.columns)))
        return snap(mid), tuple(rows)


def invited(client, monkeypatch, v3):
    _, _, _, ha, g, hg, _, _, old = setup_case(client, monkeypatch)
    event = create(client, ha, payload('guarantor', g['id'])) if v3 else old
    return ha, g, hg, event['id']


def parallel(*functions):
    gate = Barrier(len(functions))
    def run(f):
        gate.wait(timeout=10)
        return f()
    with ThreadPoolExecutor(len(functions)) as pool:
        return list(pool.map(run, functions))


@pytest.mark.parametrize('v3', [False, True])
@pytest.mark.parametrize('action', ['acknowledge', 'decline', 'invite', 'extend'])
def test_missing_version_fails_closed(client, monkeypatch, v3, action):
    ha, g, hg, mid = invited(client, monkeypatch, v3)
    if action in ('invite', 'extend'):
        assert call(client, mid, hg, 'acknowledge', revision=1).status_code == 200
    if action == 'invite':
        assert call(client, mid, hg, 'decline', revision=1).status_code == 200
    before = snapshot(mid)
    r = call(client, mid, ha if action == 'invite' else hg, action,
             guarantor_id=g['id'])
    assert r.status_code == 409, r.text
    assert snapshot(mid) == before


@pytest.mark.parametrize('v3', [False, True])
@pytest.mark.parametrize('action', ['acknowledge', 'decline'])
def test_reinvitation_generation_and_lost_response(client, monkeypatch, v3, action):
    ha, g, hg, mid = invited(client, monkeypatch, v3)
    assert call(client, mid, hg, 'decline', revision=1).status_code == 200
    # Response is "lost": use the same observed version, never a helper's current version.
    assert call(client, mid, ha, 'invite', revision=1, guarantor_id=g['id']).status_code == 200
    before = snapshot(mid)
    assert call(client, mid, ha, 'invite', revision=1, guarantor_id=g['id']).status_code == 409
    assert call(client, mid, hg, action, revision=1).status_code == 409
    assert snapshot(mid) == before
    assert call(client, mid, hg, action, revision=2).status_code == 200
    after = snapshot(mid)
    assert call(client, mid, hg, action, revision=2).status_code == 409
    assert snapshot(mid) == after
    # Even after r2 declines, the old invite intent may not create r3.
    if action == 'decline':
        assert call(client, mid, ha, 'invite', revision=1, guarantor_id=g['id']).status_code == 409
        assert snapshot(mid) == after
        assert call(client, mid, ha, 'invite', revision=2, guarantor_id=g['id']).json()['revision'] == 3


@pytest.mark.parametrize('action', ['acknowledge', 'decline'])
def test_replacement_guarantor_is_not_authorized_by_old_invitation(client, monkeypatch, action):
    ha, g, hg, mid = invited(client, monkeypatch, True)
    replacement, rh = _login(client)
    assert client.put('/guarantors/me', headers=rh, json={'accept_rules': True}).status_code == 200
    assert client.post('/guarantors/me/availability', headers=rh, json={'available': True}).status_code == 200
    assert call(client, mid, hg, 'decline', revision=1).status_code == 200
    assert call(client, mid, ha, 'invite', revision=1, guarantor_id=replacement['id']).status_code == 200
    before = snapshot(mid)
    # A private link can grant viewing access, never authority as the old guarantor.
    old = {**hg, 'X-Market-Share-Token': client.get(f'/markets/{mid}', headers=ha).json()['share_token']}
    assert call(client, mid, old, action, revision=2).status_code == 403
    assert call(client, mid, rh, action, revision=1).status_code == 409
    assert snapshot(mid) == before
    assert call(client, mid, rh, action, revision=2).status_code == 200


@pytest.mark.parametrize('v3', [False, True])
def test_extension_is_bound_to_revision_and_deadline_round(client, monkeypatch, v3):
    ha, _, hg, mid = invited(client, monkeypatch, v3)
    c = call(client, mid, hg, 'acknowledge', revision=1).json()
    deadline = c['deadline']
    before = snapshot(mid)
    assert call(client, mid, ha, 'extend', revision=1).status_code == 409
    assert call(client, mid, ha, 'extend', revision=99, expected_deadline=deadline).status_code == 409
    assert snapshot(mid) == before
    assert call(client, mid, ha, 'extend', revision=1, expected_deadline=deadline).status_code == 200
    # Freeze at acknowledge's exact time: a new round must still get a new token.
    with SessionLocal() as db:
        instant = db.get(GuarantorCase, mid).deadline - timedelta(minutes=5)
    monkeypatch.setattr(gs, 'now', lambda: instant)
    r = call(client, mid, hg, 'extend', revision=1, expected_deadline=deadline)
    assert r.status_code == 200, r.text
    assert r.json()['deadline'] != deadline and r.json()['extension_by'] is None
    after = snapshot(mid)
    for h in (ha, hg):
        assert call(client, mid, h, 'extend', revision=1, expected_deadline=deadline).status_code == 409
    assert snapshot(mid) == after
    new_deadline = r.json()['deadline']
    assert call(client, mid, hg, 'extend', revision=1, expected_deadline=new_deadline).status_code == 200


@pytest.mark.parametrize('change', ['terms', 'reward'])
def test_new_revision_clears_old_extension_consent(client, monkeypatch, change):
    _, ha, g, hg, _, _, e = review(client, monkeypatch)
    mid = e['id']
    c = client.get(f'/markets/{mid}/guarantor', headers=ha).json()
    assert call(client, mid, ha, 'extend', revision=1, expected_deadline=c['deadline']).status_code == 200
    if change == 'terms':
        body = payload('guarantor', g['id'])
        body['rules'] = 'Updated synthetic rules requiring both signatures'
        r = client.put(f'/ux-v3/events/{mid}/terms', headers=ha,
                       json={'expected_revision': 1, 'event': body})
    else:
        r = client.post(f'/ux-v3/events/{mid}/reward', headers=hg,
                        json={'expected_revision': 1, 'mode': 'fixed', 'fixed_ton': '0'})
    assert r.status_code == 200, r.text
    with SessionLocal() as db:
        case = db.get(GuarantorCase, mid)
        assert case.revision == 2 and case.extension_by is None and case.creator_confirmed == 0
    before = snapshot(mid)
    for action in ('extend', 'confirm', 'accept'):
        r = call(client, mid, hg if action != 'confirm' else ha, action,
                 revision=1, expected_deadline=c['deadline'])
        assert r.status_code == 409, r.text
    assert snapshot(mid) == before
    assert call(client, mid, hg, 'extend', revision=2, expected_deadline=c['deadline']).json()['extension_by'] == g['id']


@pytest.mark.parametrize('action', ['acknowledge', 'decline'])
def test_old_response_races_with_reinvite(client, monkeypatch, action):
    ha, g, hg, mid = invited(client, monkeypatch, True)
    assert call(client, mid, hg, 'decline', revision=1).status_code == 200
    responses = parallel(
        lambda: call(client, mid, ha, 'invite', revision=1, guarantor_id=g['id']),
        lambda: call(client, mid, hg, action, revision=1))
    assert [r.status_code for r in responses] == [200, 409], [r.text for r in responses]
    with SessionLocal() as db:
        case = db.get(GuarantorCase, mid)
        assert (case.state, case.revision, case.guarantor_id) == ('invited', 2, g['id'])
        assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='invite').count() == 1


def test_two_invites_and_two_acknowledgements_serialize(client, monkeypatch):
    ha, g, hg, mid = invited(client, monkeypatch, True)
    assert call(client, mid, hg, 'decline', revision=1).status_code == 200
    rs = parallel(*[lambda: call(client, mid, ha, 'invite', revision=1, guarantor_id=g['id']) for _ in range(2)])
    assert sorted(r.status_code for r in rs) == [200, 409]
    rs = parallel(*[lambda: call(client, mid, hg, 'acknowledge', revision=2) for _ in range(2)])
    assert sorted(r.status_code for r in rs) == [200, 409]
    with SessionLocal() as db:
        assert db.get(GuarantorCase, mid).revision == 2
        assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='acknowledge').count() == 1


@pytest.mark.parametrize('action', ['invite', 'acknowledge'])
def test_timeout_worker_races_with_request(client, monkeypatch, action):
    ha, g, hg, mid = invited(client, monkeypatch, True)
    with SessionLocal() as db:
        deadline = db.get(GuarantorCase, mid).deadline
    monkeypatch.setattr(gs, 'now', lambda: deadline)
    rs = parallel(lambda: call(client, mid, ha if action == 'invite' else hg,
                              action, revision=1, guarantor_id=g['id']), gs.process_due)
    assert rs[0].status_code == (200 if action == 'invite' else 409), rs[0].text
    gs.process_due()
    with SessionLocal() as db:
        case = db.get(GuarantorCase, mid)
        assert (case.state, case.revision) == (('invited', 2) if action == 'invite' else ('needs_guarantor', 1))
        assert db.query(P2PMoneyEntry).filter_by(market_id=mid).count() == 0
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0


@pytest.mark.parametrize('change', ['terms', 'reward'])
def test_new_terms_or_counteroffer_races_with_confirmation(client, monkeypatch, change):
    _, ha, g, hg, _, _, e = review(client, monkeypatch)
    mid = e['id']
    def revise():
        if change == 'reward':
            return client.post(f'/ux-v3/events/{mid}/reward', headers=hg,
                               json={'expected_revision': 1, 'mode': 'fixed', 'fixed_ton': '0'})
        body = payload('guarantor', g['id'])
        body['rules'] = 'New synthetic revision; approval must be renewed'
        return client.put(f'/ux-v3/events/{mid}/terms', headers=ha,
                          json={'expected_revision': 1, 'event': body})
    rs = parallel(revise, lambda: call(client, mid, ha, 'confirm', revision=1))
    assert rs[0].status_code == 200, rs[0].text
    assert rs[1].status_code in (200, 409), rs[1].text
    with SessionLocal() as db:
        case = db.get(GuarantorCase, mid)
        assert case.revision == 2 and case.creator_confirmed == 0
    before = snapshot(mid)
    assert call(client, mid, hg, 'accept', revision=1).status_code == 409
    assert snapshot(mid) == before


def test_repeated_confirm_accept_and_post_agreement_requests(client, monkeypatch):
    _, ha, _, hg, _, _, e = review(client, monkeypatch)
    mid = e['id']
    for _ in range(2):
        assert call(client, mid, ha, 'confirm', revision=1).status_code == 200
    rs = parallel(*[lambda: call(client, mid, hg, 'accept', revision=1) for _ in range(2)])
    assert sorted(r.status_code for r in rs) == [200, 409]
    before = snapshot(mid)
    for h, action in ((ha, 'confirm'), (hg, 'accept'), (hg, 'decline'),
                      (hg, 'acknowledge'), (ha, 'extend'), (ha, 'invite')):
        assert call(client, mid, h, action, revision=1, guarantor_id=e['creator_id']).status_code == 409
    assert snapshot(mid) == before
