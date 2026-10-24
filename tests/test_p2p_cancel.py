import uuid
from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import HTTPException

from app.database import SessionLocal
from app.models import Market, P2POrder, SettlementRecord, User
from app.services import market_service as legacy, p2p_service as p2p
from tests.legacy_helpers import post_legacy_market
from tests.test_markets_api import _login, _close_at
from tests.test_p2p import balance, market, ready, submit


def ledger():
    with SessionLocal() as db:
        available = sum(float(u.balance) for u in db.query(User))
        pot = sum(float(m.pot or 0) for m in db.query(Market))
        reserved = sum(int(o.remaining or 0) for o in db.query(P2POrder)) / p2p.ATOM
        return available, pot, reserved, available + pot + reserved


def market_funds(mid):
    with SessionLocal() as db:
        pot = float(db.get(Market, mid).pot or 0)
        reserved = sum(int(o.remaining or 0) for o in db.query(P2POrder).filter_by(market_id=mid)) / p2p.ATOM
        return pot, reserved


def void(client, mid, headers, reason='Источник не подтвердился'):
    return client.post(f'/markets/{mid}/cancel', headers=headers, json={'reason': reason})


def test_unfilled_order_is_fully_refunded(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    before_a, before_b = balance(client, a, ha), balance(client, b, hb)
    conserved = ledger()[3]
    submit(client, mid, ha)
    assert void(client, mid, ah).status_code == 200
    assert balance(client, a, ha) == pytest.approx(before_a)
    assert balance(client, b, hb) == pytest.approx(before_b)
    with SessionLocal() as db:
        order = db.query(P2POrder).filter_by(market_id=mid).one()
        assert order.remaining == 0 and order.refunded == 100 * p2p.ATOM
        assert db.get(Market, mid).pot == 0
        hist = db.query(SettlementRecord).filter_by(market_id=mid, user_id=a['id']).one()
        assert hist.payout == 0 and hist.residual_returned == pytest.approx(100)
        assert hist.credited == pytest.approx(100) and hist.tip == 0
    assert ledger()[3] == pytest.approx(conserved, abs=1e-7)


def test_partial_fill_returns_each_side_its_stake(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    before_a, before_b = balance(client, a, ha), balance(client, b, hb)
    conserved = ledger()[3]
    submit(client, mid, ha)
    submit(client, mid, hb, 1, 50, 1.83)
    body = void(client, mid, ah).json()
    assert body['status'] == 'cancelled' and body['pot'] == 0
    assert body['cancellation_reason'] == 'Источник не подтвердился'
    assert body['settlement_kind'] == 'void'
    assert balance(client, a, ha) == pytest.approx(before_a)
    assert balance(client, b, hb) == pytest.approx(before_b)
    hist_a = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    hist_b = client.get(f"/users/{b['id']}/settlements", headers=hb).json()[0]
    assert hist_a['payout'] == pytest.approx(41.6667, abs=.001)
    assert hist_a['residual_returned'] == pytest.approx(58.3333, abs=.001)
    assert hist_a['credited'] == pytest.approx(100, abs=.001)
    assert hist_a['tip'] == 0 and hist_a['is_loss'] is False
    assert hist_b['payout'] == pytest.approx(50, abs=.001)
    assert hist_b['residual_returned'] == pytest.approx(0, abs=1e-3)
    assert hist_b['credited'] == pytest.approx(50, abs=.001)
    assert market_funds(mid) == pytest.approx((0, 0), abs=1e-7)
    assert ledger()[3] == pytest.approx(conserved, abs=1e-7)


def test_multiple_fills_and_both_outcomes_for_one_user(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    c, hc = _login(client)
    before = {a['id']: balance(client, a, ha), b['id']: balance(client, b, hb), c['id']: balance(client, c, hc)}
    conserved = ledger()[3]
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 50, 2)
    submit(client, mid, hc, 0, 40, 2)
    submit(client, mid, ha, 1, 20, 2)
    assert void(client, mid, ah, 'Оба исхода').status_code == 200
    assert balance(client, a, ha) == pytest.approx(before[a['id']])
    assert balance(client, b, hb) == pytest.approx(before[b['id']])
    assert balance(client, c, hc) == pytest.approx(before[c['id']])
    hist = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    assert set(hist['chosen_outcomes']) == {'A', 'B'}
    assert hist['payout'] == pytest.approx(70)
    assert hist['residual_returned'] == pytest.approx(50)
    assert hist['credited'] == pytest.approx(120)
    assert market_funds(mid) == pytest.approx((0, 0), abs=1e-7)
    assert ledger()[3] == pytest.approx(conserved, abs=1e-7)


def test_previously_cancelled_remainder_is_not_refunded_again(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    first = submit(client, mid, ha).json()
    submit(client, mid, hb, 1, 50, 1.83)
    before = balance(client, a, ha)
    assert client.post(f"/orders/{first['id']}/cancel", headers=ha).status_code == 200
    after_order_cancel = balance(client, a, ha)
    assert after_order_cancel == pytest.approx(before + 58.3333, abs=.001)
    assert void(client, mid, ah).status_code == 200
    assert balance(client, a, ha) == pytest.approx(after_order_cancel + 41.6667, abs=.001)
    hist = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    assert hist['residual_returned'] == 0
    assert hist['payout'] == pytest.approx(41.6667, abs=.001)
    with SessionLocal() as db:
        order = db.get(P2POrder, first['id'])
        assert order.remaining == 0
        assert order.filled + order.refunded == order.amount


def test_repeat_cancel_keeps_reason_and_balances(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    submit(client, mid, hb, 1, 50, 1.83)
    first = void(client, mid, ah, 'Первая причина')
    assert first.status_code == 200
    snapshot = ledger()
    balances = [balance(client, a, ha), balance(client, b, hb)]
    again = void(client, mid, ah, 'Другая причина')
    assert again.status_code == 200
    assert again.json()['cancellation_reason'] == 'Первая причина'
    assert [balance(client, a, ha), balance(client, b, hb)] == balances
    assert ledger() == snapshot
    with SessionLocal() as db:
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 2


def test_forbidden_for_non_admin_resolved_and_lmsr(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha)
    submit(client, mid, hb, 1, 50, 1.83)
    assert void(client, mid, ha).status_code == 403
    pending = market(client, ha)['id']
    assert void(client, pending, ah).status_code == 400
    assert client.post(f'/markets/{pending}/reject', headers=ah, json={'reason': 'Нет источника'}).status_code == 200
    client.post(f'/markets/{mid}/close', headers=ah)
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 200
    before = ledger()
    assert void(client, mid, ah).status_code == 400
    assert ledger() == before
    creator_before = balance(client, a, ha)
    legacy_id = post_legacy_market(client, '/markets', headers=ha, json={
        'question': 'LMSR cannot use p2p cancel?',
        'lock_ton': 50,
        'close_at': _close_at(),
    }).json()['id']
    after_lock = balance(client, a, ha)
    assert after_lock == pytest.approx(creator_before - 50)
    denied = void(client, legacy_id, ah)
    assert denied.status_code == 409
    assert 'LMSR' in denied.json()['detail']
    assert balance(client, a, ha) == pytest.approx(after_lock)
    with SessionLocal() as db:
        row = db.get(Market, legacy_id)
        assert row.status.value == 'open' and row.pot == pytest.approx(50)


def test_insufficient_bank_and_credit_error_roll_back(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    submit(client, mid, ha, 0, 100, 2)
    submit(client, mid, hb, 1, 50, 2)
    with SessionLocal() as db:
        db.get(Market, mid).pot = 1
        db.commit()
    broken = ledger()
    assert void(client, mid, ah).status_code == 409
    assert ledger() == broken
    with SessionLocal() as db:
        market_row = db.get(Market, mid)
        assert market_row.status.value == 'open'
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0
    assert void(client, mid, ah).status_code == 409
    assert ledger() == broken
    with SessionLocal() as db:
        db.get(Market, mid).pot = 100
        db.commit()
    original = p2p.adjust_atoms

    def fail(db, user_id, atoms):
        original(db, user_id, atoms)
        raise RuntimeError('after credit')

    before = ledger()
    with monkeypatch.context() as patch:
        patch.setattr(p2p, 'adjust_atoms', fail)
        with pytest.raises(RuntimeError):
            void(client, mid, ah)
    after = ledger()
    assert after[3] == pytest.approx(before[3], abs=1e-7)
    with SessionLocal() as db:
        assert db.get(Market, mid).status.value == 'open'
        assert db.query(SettlementRecord).filter_by(market_id=mid).count() == 0


def _race(ops):
    with ThreadPoolExecutor(max_workers=2) as pool:
        return list(pool.map(lambda fn: fn(), ops))


def test_cancel_races_place_order_cancel_and_resolve(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    order = submit(client, mid, ha, 0, 100, 2).json()
    conserved = ledger()[3]

    def cancel_event():
        with SessionLocal() as db:
            try:
                return p2p.void_market(db, mid, admin['id'], 'Гонка со ставкой')
            except HTTPException as exc:
                return exc.status_code

    def place_take():
        with SessionLocal() as db:
            try:
                return p2p.place(db, mid, b['id'], 1, 50, 2, 'ioc', str(uuid.uuid4()))
            except HTTPException as exc:
                return exc.status_code

    results = _race([cancel_event, place_take])
    assert any(not isinstance(r, int) for r in results)
    assert ledger()[3] == pytest.approx(conserved, abs=1e-7)
    with SessionLocal() as db:
        market_row = db.get(Market, mid)
        row = db.get(P2POrder, order['id'])
        assert row.filled + row.refunded + row.remaining == row.amount
        if market_row.status.value == 'cancelled':
            assert market_funds(mid) == pytest.approx((0, 0), abs=1e-7)
            assert row.remaining == 0

    other = market(client, ha)['id']
    assert client.post(f'/markets/{other}/approve', headers=ah).status_code == 200
    resting = submit(client, other, ha, 0, 80, 2).json()
    conserved = ledger()[3]

    def cancel_order():
        with SessionLocal() as db:
            try:
                return p2p.cancel(db, resting['id'], a['id'])
            except HTTPException as exc:
                return exc.status_code

    def cancel_market():
        with SessionLocal() as db:
            try:
                return p2p.void_market(db, other, admin['id'], 'Гонка с отменой заявки')
            except HTTPException as exc:
                return exc.status_code

    _race([cancel_order, cancel_market])
    assert ledger()[3] == pytest.approx(conserved, abs=1e-7)
    with SessionLocal() as db:
        row = db.get(P2POrder, resting['id'])
        assert row.remaining == 0
        assert row.filled + row.refunded == row.amount

    closed = market(client, ha)['id']
    assert client.post(f'/markets/{closed}/approve', headers=ah).status_code == 200
    submit(client, closed, ha, 0, 100, 2)
    submit(client, closed, hb, 1, 50, 2)
    assert client.post(f'/markets/{closed}/close', headers=ah).status_code == 200
    conserved = ledger()[3]

    def resolve():
        with SessionLocal() as db:
            try:
                return legacy.resolve_market(db, closed, 0, admin['id'])
            except HTTPException as exc:
                return exc.status_code

    def cancel_closed():
        with SessionLocal() as db:
            try:
                return p2p.void_market(db, closed, admin['id'], 'Гонка с расчётом')
            except HTTPException as exc:
                return exc.status_code

    _race([resolve, cancel_closed])
    statuses = []
    with SessionLocal() as db:
        statuses.append(db.get(Market, closed).status.value)
    assert statuses[0] in ('resolved', 'cancelled')
    assert ledger()[3] == pytest.approx(conserved, abs=1e-7)
    with SessionLocal() as db:
        market_row = db.get(Market, closed)
        assert float(market_row.pot or 0) == 0
        assert sum(o.remaining for o in db.query(P2POrder).filter_by(market_id=closed)) == 0


def test_manual_scenario_and_conservation_without_double_count(client, monkeypatch):
    admin, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    start_a, start_b = balance(client, a, ha), balance(client, b, hb)
    conserved = ledger()
    submit(client, mid, ha, 0, 100, 2.20)
    submit(client, mid, hb, 1, 50, 1.83)
    body = void(client, mid, ah, 'Событие не состоялось')
    assert body.status_code == 200, body.text
    assert balance(client, a, ha) == pytest.approx(start_a)
    assert balance(client, b, hb) == pytest.approx(start_b)
    assert market_funds(mid) == pytest.approx((0, 0), abs=1e-7)
    assert ledger()[3] == pytest.approx(conserved[3], abs=1e-7)
    hist_a = client.get(f"/users/{a['id']}/settlements", headers=ha).json()[0]
    hist_b = client.get(f"/users/{b['id']}/settlements", headers=hb).json()[0]
    assert hist_a['cancellation_reason'] == 'Событие не состоялось'
    assert hist_a['payout'] > 0 and hist_a['residual_returned'] > 0
    assert hist_b['payout'] == pytest.approx(50, abs=.001)
    again = void(client, mid, ah, 'Повтор')
    assert again.status_code == 200
    assert balance(client, a, ha) == pytest.approx(start_a)
    assert balance(client, b, hb) == pytest.approx(start_b)
    assert client.get(f'/markets/{mid}').json()['status'] == 'cancelled'
    assert client.post(f'/markets/{mid}/orders', headers=ha, json={
        'outcome': 0, 'money': 10, 'odds': 2, 'request_id': str(uuid.uuid4()),
    }).status_code == 400
    assert client.post(f'/markets/{mid}/resolve', headers=ah, json={'winning_outcome': 0}).status_code == 400
    assert client.post(f'/markets/{mid}/claim', headers=ha, json={}).status_code == 400
    assert ledger()[3] == pytest.approx(conserved[3], abs=1e-7)


def test_existing_varchar8_status_still_reads_after_cancel_columns(tmp_path, monkeypatch):
    from sqlalchemy import create_engine, text
    from app import database
    old = create_engine('sqlite:///' + str(tmp_path / 'cancel-old.db'))
    with old.begin() as conn:
        conn.execute(text(
            'CREATE TABLE users (id INTEGER PRIMARY KEY, telegram_id INTEGER, username VARCHAR(64), '
            'balance FLOAT, created_at DATETIME)'
        ))
        conn.execute(text(
            "CREATE TABLE markets (id INTEGER PRIMARY KEY, question VARCHAR(512), description TEXT, "
            "creator_id INTEGER, category VARCHAR(32), b FLOAT, q_yes FLOAT, q_no FLOAT, outcomes TEXT, "
            "q TEXT, lock_ton FLOAT, pot FLOAT, close_at DATETIME, lock_returned BOOLEAN, "
            "status VARCHAR(8), winning_outcome VARCHAR(128), created_at DATETIME, resolved_at DATETIME, "
            "settlement_kind VARCHAR(16))"
        ))
        conn.execute(text("INSERT INTO users VALUES (1, 1, 'existing', 950, '2026-01-01')"))
        conn.execute(text(
            "INSERT INTO markets VALUES (1, 'Existing market?', '', 1, 'unique', 72, -50, -50, "
            "'[\"A\",\"B\"]', '[-50,-50]', 50, 50, '2030-01-01', 0, 'open', NULL, '2026-01-01', NULL, NULL)"
        ))
    monkeypatch.setattr(database, 'engine', old)
    database.ensure_schema()
    database.ensure_schema()
    with old.connect() as conn:
        row = conn.execute(text(
            'SELECT mechanism, status, pot, lock_ton, cancellation_reason, cancelled_by FROM markets'
        )).one()
        assert tuple(row[:4]) == ('lmsr', 'open', 50, 50)
        assert row[4] is None and row[5] is None
        conn.execute(text("UPDATE markets SET status='cancelled', cancellation_reason='ok' WHERE id=1"))
        assert conn.execute(text('SELECT status FROM markets')).scalar_one() == 'cancelled'
        assert conn.execute(text('SELECT balance FROM users')).scalar_one() == 950
    old.dispose()
