from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.database import SessionLocal
from app.models import Market, P2POrder, User
from app.money import MAX_NANO, adjust_balance_nano, nonnegative_nano, tip_nano, to_nano
from app.services import market_service as legacy, p2p_ledger
from tests.test_p2p import ready, submit


def total_nano():
    with SessionLocal() as db:
        return (sum(u.balance_nano for u in db.query(User))
                + sum(m.pot_nano for m in db.query(Market))
                + sum(o.remaining for o in db.query(P2POrder)))


def test_single_nano_at_large_balance_and_overflow(client, monkeypatch):
    _, _, user, _, _, _, _ = ready(client, monkeypatch)
    with SessionLocal() as db:
        db.get(User, user['id']).balance_nano = MAX_NANO - 1
        db.commit()
        adjust_balance_nano(db, user['id'], 1)
        db.commit()
        assert db.get(User, user['id']).balance_nano == MAX_NANO
        with pytest.raises(HTTPException):
            adjust_balance_nano(db, user['id'], 1)
        db.rollback()
        assert db.get(User, user['id']).balance_nano == MAX_NANO
        adjust_balance_nano(db, user['id'], -MAX_NANO)
        db.commit()
        with pytest.raises(HTTPException):
            adjust_balance_nano(db, user['id'], -1)
        db.rollback()
        assert db.get(User, user['id']).balance_nano == 0


def test_concurrent_nano_increments_are_not_lost(client, monkeypatch):
    _, _, user, _, _, _, _ = ready(client, monkeypatch)
    with SessionLocal() as db:
        initial = db.get(User, user['id']).balance_nano
    def credit(_):
        with SessionLocal() as db:
            legacy._lock_users(db, [user['id']])
            adjust_balance_nano(db, user['id'], 1)
            db.commit()
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(credit, range(20)))
    with SessionLocal() as db:
        assert db.get(User, user['id']).balance_nano == initial + 20


@pytest.mark.parametrize('finish', ['resolve', 'cancel'])
def test_p2p_exact_conservation_and_one_nano_bank_deficit(client, monkeypatch, finish):
    _, ah, _, ha, _, hb, mid = ready(client, monkeypatch)
    initial = total_nano()
    assert submit(client, mid, ha, amount='100.000000001').status_code == 200
    assert submit(client, mid, hb, 1, '50.000000001', 1.83).status_code == 200
    assert total_nano() == initial
    assert client.post(f'/markets/{mid}/close', headers=ah).status_code == 200
    with SessionLocal() as db:
        market = db.get(Market, mid)
        market.pot_nano -= 1
        db.commit()
        report = p2p_ledger.reconcile(db, mid)
        assert not report['fully_verified']
        assert not report['pot']['consistent']
    path = f'/markets/{mid}/' + finish
    body = {'winning_outcome': 0} if finish == 'resolve' else {'reason': 'Invalid event'}
    response = client.post(path, headers=ah, json=body)
    assert response.status_code == 409, response.text
    assert total_nano() == initial - 1
    with SessionLocal() as db:
        db.get(Market, mid).pot_nano += 1
        db.commit()
    response = client.post(path, headers=ah, json=body)
    assert response.status_code == 200, response.text
    assert total_nano() == initial


def test_lmsr_rounding_keeps_every_nano_in_bank_or_credits(client, monkeypatch):
    from datetime import datetime, timedelta, timezone
    from tests.test_markets_api import _admin, _login
    admin, _ = _admin(client, monkeypatch)
    creator, _ = _login(client)
    winner, _ = _login(client)
    initial = total_nano()
    with SessionLocal() as db:
        market = legacy.create_market(db, question='Integer settlement?', creator_id=creator['id'],
            outcomes=['Да', 'Нет'], lock_ton=50.000000001, close_at=datetime.now(timezone.utc)+timedelta(hours=1))
        legacy.moderate_market(db, market.id, admin['id'])
        for amount in (1.123456789, 3.000000001, 5.999999999):
            legacy.buy_shares(db, market.id, winner['id'], 0, amount)
        assert total_nano() == initial
        legacy.close_market(db, market.id, admin['id'])
        legacy.resolve_market(db, market.id, 0, admin['id'])
        assert db.get(Market, market.id).pot_nano == 0
    assert total_nano() == initial


def test_conversion_boundaries_and_tip_rounding():
    assert to_nano('9223372036.854775807') == MAX_NANO
    assert to_nano('0.0000000015') == 2
    assert tip_nano(199) == 1
    assert tip_nano(1) == 0
    for value in ['nan', 'inf', '-0.0000000001', '9223372036.854775808']:
        with pytest.raises(HTTPException):
            nonnegative_nano(value)
    assert Decimal(to_nano('100.000000001')) == 100000000001
