import math
import uuid
from decimal import Decimal

import pytest

from app.database import SessionLocal
from app.models import Market, P2PMoneyEntry, P2POrder
from app.services import p2p_ledger as ledger
from app.services import p2p_service as p2p
from fastapi import HTTPException

from tests.test_markets_api import _login
from tests.test_p2p import balance, market, ready, submit, total


def audit(client, mid, headers):
    return client.get(f'/markets/{mid}/p2p-reconciliation', headers=headers)


def entries(mid, op=None):
    with SessionLocal() as db:
        q = db.query(P2PMoneyEntry).filter_by(market_id=mid)
        if op:
            q = q.filter_by(op_type=op)
        return q.order_by(P2PMoneyEntry.id).all()


def test_reserve_partial_fill_cancel_remainder(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    first = submit(client, mid, ha).json()
    submit(client, mid, hb, 1, 50, 1.83)
    assert client.post(f"/orders/{first['id']}/cancel", headers=ha).status_code == 200
    body = audit(client, mid, ah).json()
    assert body['journal_coverage'] == 'full'
    assert body['fully_verified'] is True
    assert body['discrepancies'] == []
    kinds = [e['op_type'] for e in body['entries']]
    assert kinds.count('reserve') == 2
    assert kinds.count('fill_escrow') == 2
    assert kinds.count('refund') == 1
    refund = next(e for e in body['entries'] if e['op_type'] == 'refund')
    assert refund['reason'] == 'cancel'
    assert refund['from_kind'] == 'order_reserve'
    assert refund['to_kind'] == 'user_balance'
    assert refund['origin_key'] == f"reserve:{first['id']}"
    with SessionLocal() as db:
        order = db.get(P2POrder, first['id'])
        assert order.amount == order.filled + order.remaining + order.refunded
        assert order.remaining == 0


def test_ioc_refunds_unfilled(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 20, 2)
    result = submit(client, mid, hb, 1, 50, 2, kind='ioc').json()
    assert result['filled'] == 20 and result['refunded'] == 30
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is True
    refunds = [e for e in body['entries'] if e['op_type'] == 'refund']
    assert len(refunds) == 1
    assert refunds[0]['reason'] == 'ioc'
    assert refunds[0]['amount_nano'] == 30 * p2p.ATOM


def test_close_refunds_resting_orders(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    assert client.post(f'/markets/{mid}/close', headers=ah).status_code == 200
    body = audit(client, mid, ah).json()
    assert body['status'] == 'closed'
    assert body['fully_verified'] is True
    refunds = [e for e in body['entries'] if e['op_type'] == 'refund']
    assert len(refunds) == 1 and refunds[0]['reason'] == 'close'
    assert body['pot']['expected_nano'] == 0
    assert body['pot']['actual_ton'] == pytest.approx(0, abs=1e-7)


def test_dust_remainder_refund(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    tick = p2p.parse_terms(1, 2.2)[1]
    divisor = math.gcd(tick, p2p.PRICE)
    lot = tick // divisor
    taker_lot = (p2p.PRICE - tick) // divisor
    need = 10_000_000
    lots = max((need + lot - 1) // lot, (need + taker_lot - 1) // taker_lot)
    maker_atoms = lots * lot + 7
    taker_atoms = lots * taker_lot
    first = client.post(
        f'/markets/{mid}/orders',
        headers=ha,
        json={
            'outcome': 0,
            'money': str(Decimal(maker_atoms) / p2p.ATOM),
            'odds': '2.2',
            'request_id': str(uuid.uuid4()),
        },
    )
    assert first.status_code == 200, first.text
    second = client.post(
        f'/markets/{mid}/orders',
        headers=hb,
        json={
            'outcome': 1,
            'money': str(Decimal(taker_atoms) / p2p.ATOM),
            'odds': '1.83',
            'request_id': str(uuid.uuid4()),
        },
    )
    assert second.status_code == 200, second.text
    with SessionLocal() as db:
        order = db.get(P2POrder, first.json()['id'])
        assert order.refunded == 7
        assert order.remaining == 0
        assert order.filled == lots * lot
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is True
    refunds = [e for e in body['entries'] if e['op_type'] == 'refund']
    assert len(refunds) == 1
    assert refunds[0]['reason'] == 'remainder'
    assert refunds[0]['amount_nano'] == 7


def test_resolution_tips_and_creator_winner(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 100, 2)
    client.post(f'/markets/{mid}/close', headers=ah)
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 200
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is True
    tips = [e for e in body['entries'] if e['op_type'] == 'tip']
    payouts = [e for e in body['entries'] if e['op_type'] == 'payout']
    assert len(payouts) == 1
    assert payouts[0]['to_user_id'] == a['id']
    assert {e['to_user_id'] for e in tips} == {admin['id']}
    assert sum(e['amount_nano'] for e in tips) == 1 * p2p.ATOM
    assert body['pot']['expected_nano'] == 0
    assert body['pot']['actual_ton'] == pytest.approx(0, abs=1e-7)


def test_tip_split_journal_when_creator_not_winner(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    c, hc = _login(client)
    submit(client, mid, hb, 0, 100, 2)
    submit(client, mid, hc, 1, 100, 2)
    client.post(f'/markets/{mid}/close', headers=ah)
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 200
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is True
    tips = {e['to_user_id']: e['amount_nano'] for e in body['entries'] if e['op_type'] == 'tip'}
    assert tips[a['id']] == 75 * p2p.ATOM // 100
    assert tips[admin['id']] == 25 * p2p.ATOM // 100


def test_void_market_journal(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    submit(client, mid, hb, 1, 50, 1.83)
    assert client.post(f'/markets/{mid}/cancel', headers=ah, json={'reason': 'Источник не подтвердился'}).status_code == 200
    body = audit(client, mid, ah).json()
    assert body['status'] == 'cancelled'
    assert body['fully_verified'] is True
    kinds = [e['op_type'] for e in body['entries']]
    assert 'void_return' in kinds
    refunds = [e for e in body['entries'] if e['op_type'] == 'refund']
    assert any(e['reason'] == 'void' for e in refunds)
    assert kinds.count('void_return') == 2
    assert not any(e['op_type'] in ('payout', 'tip') for e in body['entries'])
    assert body['pot']['void_returns_nano'] == body['pot']['fills_nano']
    assert body['pot']['expected_nano'] == 0


def test_repeat_requests_do_not_duplicate_journal(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    rid = str(uuid.uuid4())
    payload = dict(outcome=0, money=100, odds=2, request_id=rid)
    first = client.post(f'/markets/{mid}/orders', headers=ha, json=payload)
    assert first.status_code == 200
    assert client.post(f'/markets/{mid}/orders', headers=ha, json=payload).json()['id'] == first.json()['id']
    assert len(entries(mid, 'reserve')) == 1
    oid = first.json()['id']
    assert client.post(f'/orders/{oid}/cancel', headers=ha).status_code == 200
    assert client.post(f'/orders/{oid}/cancel', headers=ha).status_code == 200
    assert len(entries(mid, 'refund')) == 1
    other = market_ready_second(client, ah, ha)
    submit(client, other, ha, 0, 10, 2)
    submit(client, other, hb, 1, 10, 2)
    assert client.post(f'/markets/{other}/cancel', headers=ah, json={'reason': 'Раз'}).status_code == 200
    n = len(entries(other))
    assert client.post(f'/markets/{other}/cancel', headers=ah, json={'reason': 'Два'}).status_code == 200
    assert len(entries(other)) == n


def market_ready_second(client, ah, ha):
    m = market(client, ha)
    assert client.post(f"/markets/{m['id']}/approve", headers=ah).status_code == 200
    return m['id']


def test_repeat_resolve_does_not_duplicate(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 100, 2)
    client.post(f'/markets/{mid}/close', headers=ah)
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 200
    n = len(entries(mid))
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 400
    assert len(entries(mid)) == n


def test_journal_write_failure_rolls_back_money(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    before = balance(client, a, ha)
    conserved = total()

    def fail(*args, **kwargs):
        raise RuntimeError('journal down')

    monkeypatch.setattr(ledger, 'record', fail)
    with pytest.raises(RuntimeError):
        submit(client, mid, ha)
    assert balance(client, a, ha) == pytest.approx(before)
    assert total() == pytest.approx(conserved, abs=1e-7)
    with SessionLocal() as db:
        assert db.query(P2POrder).filter_by(market_id=mid).count() == 0
        assert db.query(P2PMoneyEntry).filter_by(market_id=mid).count() == 0


def test_accounting_break_is_reported(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    submit(client, mid, hb, 1, 50, 1.83)
    with SessionLocal() as db:
        market = db.get(Market, mid)
        market.pot = float(market.pot or 0) + 1
        db.commit()
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is False
    kinds = {d['kind'] for d in body['discrepancies']}
    assert 'pot_mismatch' in kinds or 'pot_vs_fills' in kinds


def test_pre_journal_market_never_fully_verified(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    with SessionLocal() as db:
        db.get(Market, mid).p2p_journal_coverage = ledger.COVERAGE_INCOMPLETE
        db.commit()
    body = audit(client, mid, ah).json()
    assert body['journal_coverage'] == 'incomplete'
    assert body['fully_verified'] is False
    assert 'до внедрения журнала' in body['coverage_note'].lower() or 'existed before' in body['coverage_note'].lower()


def test_pre_journal_history_is_not_invented(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    submit(client, mid, hb, 1, 50, 1.83)
    with SessionLocal() as db:
        db.query(P2PMoneyEntry).filter_by(market_id=mid).delete()
        db.get(Market, mid).p2p_journal_coverage = ledger.COVERAGE_INCOMPLETE
        db.commit()
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is False
    assert body['entries'] == []
    assert body['coverage_gaps']
    assert all(g['kind'].startswith('missing_journal') for g in body['coverage_gaps'])


def test_non_admin_cannot_reconcile(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    assert audit(client, mid, ha).status_code == 403
    assert audit(client, mid, hb).status_code == 403


def test_existing_schema_marks_old_p2p_incomplete(tmp_path, monkeypatch):
    from sqlalchemy import create_engine, text
    from app import database
    old = create_engine('sqlite:///' + str(tmp_path / 'old-p2p.db'))
    with old.begin() as conn:
        conn.execute(text(
            'CREATE TABLE users (id INTEGER PRIMARY KEY, telegram_id INTEGER, username VARCHAR(64), '
            'balance FLOAT, created_at DATETIME)'
        ))
        conn.execute(text(
            'CREATE TABLE markets (id INTEGER PRIMARY KEY, question VARCHAR(512), description TEXT, '
            'creator_id INTEGER, category VARCHAR(32), b FLOAT, q_yes FLOAT, q_no FLOAT, outcomes TEXT, '
            'q TEXT, lock_ton FLOAT, pot FLOAT, close_at DATETIME, lock_returned BOOLEAN, status VARCHAR(16), '
            'winning_outcome VARCHAR(128), created_at DATETIME, resolved_at DATETIME, settlement_kind VARCHAR(16), '
            "mechanism VARCHAR(16) DEFAULT 'p2p')"
        ))
        conn.execute(text("INSERT INTO users VALUES (1, 1, 'existing', 1000, '2026-01-01')"))
        conn.execute(text(
            "INSERT INTO markets VALUES (1, 'Old P2P?', '', 1, 'unique', 1, 0, 0, '[\"A\",\"B\"]', '[0,0]', "
            "0, 10, '2030-01-01', 1, 'open', NULL, '2026-01-01', NULL, NULL, 'p2p')"
        ))
    monkeypatch.setattr(database, 'engine', old)
    database.ensure_schema()
    with old.connect() as conn:
        coverage = conn.execute(text('SELECT p2p_journal_coverage FROM markets')).scalar_one()
        assert coverage == 'incomplete'
        pot = conn.execute(text('SELECT pot, lock_ton FROM markets')).one()
        assert tuple(pot) == (10, 0)
        assert conn.execute(text('SELECT count(*) FROM p2p_money_entries')).scalar_one() == 0
    old.dispose()


def test_lmsr_reconciliation_rejected(client, monkeypatch):
    from tests.legacy_helpers import post_legacy_market
    from tests.test_markets_api import _admin, _login, _close_at
    admin, ah = _admin(client, monkeypatch)
    a, ha = _login(client)
    created = post_legacy_market(client, '/markets', headers=ha, json={
        'question': 'LMSR has no P2P journal?',
        'close_at': _close_at(),
        'lock_ton': 50,
    })
    assert created.status_code == 200
    assert audit(client, created.json()['id'], ah).status_code == 409
    assert audit(client, created.json()['id'], ha).status_code == 403


def test_resolve_when_admin_is_creator(client, monkeypatch):
    admin, ah, a, ha, b, hb, _ = ready(client, monkeypatch)
    mid = market_ready_second(client, ah, ah)
    with SessionLocal() as db:
        assert db.get(Market, mid).creator_id == admin['id']
    admin_before = balance(client, admin, ah)
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 100, 2)
    assert client.post(f'/markets/{mid}/close', headers=ah).status_code == 200
    resolved = client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0})
    assert resolved.status_code == 200, resolved.text
    assert balance(client, a, ha) == pytest.approx(1099)
    assert balance(client, b, hb) == pytest.approx(900)
    assert balance(client, admin, ah) == pytest.approx(admin_before + 1)
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is True
    assert body['discrepancies'] == []
    tips = [e for e in body['entries'] if e['op_type'] == 'tip']
    assert len(tips) == 1
    assert tips[0]['to_user_id'] == admin['id']
    assert tips[0]['amount_nano'] == 1 * p2p.ATOM
    n = len(entries(mid))
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 400
    assert len(entries(mid)) == n


def test_resolve_when_admin_creates_and_wins(client, monkeypatch):
    admin, ah, a, ha, b, hb, _ = ready(client, monkeypatch)
    mid = market_ready_second(client, ah, ah)
    submit(client, mid, ah, 0, 100, 2)
    submit(client, mid, hb, 1, 100, 2)
    client.post(f'/markets/{mid}/close', headers=ah)
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 200
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is True
    tips = [e for e in body['entries'] if e['op_type'] == 'tip']
    assert len(tips) == 1
    assert tips[0]['to_user_id'] == admin['id']
    assert tips[0]['from_user_id'] == admin['id']


def test_wrong_payout_recipient_is_reported(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 100, 2)
    client.post(f'/markets/{mid}/close', headers=ah)
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 200
    assert audit(client, mid, ah).json()['fully_verified'] is True
    with SessionLocal() as db:
        payout = db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type='payout').one()
        assert payout.to_user_id == a['id']
        payout.to_user_id = b['id']
        db.commit()
    body = audit(client, mid, ah).json()
    assert body['fully_verified'] is False
    kinds = {d['kind'] for d in body['discrepancies']}
    assert 'payout_recipient' in kinds or 'missing_journal_payout' in kinds


def test_record_rejects_same_key_different_party(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    with SessionLocal() as db:
        row = db.query(P2PMoneyEntry).filter_by(market_id=mid, op_type='reserve').one()
        with pytest.raises(HTTPException) as err:
            ledger.record(
                db,
                entry_key=row.entry_key,
                op_type=row.op_type,
                market_id=row.market_id,
                amount=int(row.amount),
                from_kind=row.from_kind,
                to_kind=row.to_kind,
                from_user_id=b['id'],
                to_user_id=b['id'],
                to_order_id=row.to_order_id,
                order_id=row.order_id,
                origin_key=row.origin_key,
                reason=row.reason,
            )
        assert err.value.status_code == 409
        db.rollback()
        again = db.query(P2PMoneyEntry).filter_by(entry_key=row.entry_key).one()
        assert again.to_user_id == a['id']
        same = ledger.record(
            db,
            entry_key=row.entry_key,
            op_type=row.op_type,
            market_id=row.market_id,
            amount=int(row.amount),
            from_kind=row.from_kind,
            to_kind=row.to_kind,
            from_user_id=row.from_user_id,
            to_user_id=row.to_user_id,
            to_order_id=row.to_order_id,
            order_id=row.order_id,
            origin_key=row.origin_key,
            reason=row.reason,
        )
        assert same.id == row.id
