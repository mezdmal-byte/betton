import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.database import SessionLocal
from app.models import Market, P2POrder, P2PFill, SettlementRecord, User
from app.services import market_service as legacy, p2p_service as p2p
from tests.test_markets_api import _admin, _login, _close_at


def market(client, headers):
    r = client.post('/markets', headers=headers, json={'question':'Binary P2P event?', 'close_at':_close_at(), 'outcomes':['A','B']})
    assert r.status_code == 200, r.text
    return r.json()


def submit(client, mid, headers, side=0, amount=100, odds=2.2, **extras):
    return client.post(f'/markets/{mid}/orders', headers=headers,
                      json=dict(outcome=side, money=amount, odds=odds, request_id=str(uuid.uuid4()), **extras))


def balance(client, user, headers):
    return client.get(f"/users/{user['id']}", headers=headers).json()['balance']


def total():
    with SessionLocal() as db:
        return sum(u.balance for u in db.query(User)) + sum(m.pot for m in db.query(Market)) + sum(o.remaining for o in db.query(P2POrder))/p2p.ATOM


def ready(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    a, ha = _login(client)
    b, hb = _login(client)
    m = market(client, ha)
    assert client.post(f"/markets/{m['id']}/approve", headers=ah).status_code == 200
    return admin, ah, a, ha, b, hb, m['id']


def test_pending_visibility_permissions_no_collateral_and_reject(client, monkeypatch):
    admin, ah = _admin(client, monkeypatch)
    a, ha = _login(client)
    b, hb = _login(client)
    before = balance(client,a,ha)
    m = market(client,ha); mid=m['id']
    assert m['mechanism']=='p2p' and m['status']=='pending' and m['pot']==m['lock_ton']==0
    assert m['prices']==[] and m['odds']==[]
    assert balance(client,a,ha)==before
    assert all(x['id']!=mid for x in client.get('/markets').json())
    assert client.get(f'/markets/{mid}').status_code==404
    assert client.get(f'/markets/{mid}/orderbook').status_code==404
    assert any(x['id']==mid for x in client.get(f"/users/{a['id']}/markets",headers=ha).json())
    assert client.get(f"/users/{a['id']}/markets",headers=hb).status_code==403
    assert client.get('/moderation/markets',headers=hb).status_code==403
    for action in ['approve','reject']:
        assert client.post(f'/markets/{mid}/{action}',headers=hb,json={'reason':'no'}).status_code==403
    assert submit(client,mid,ha).status_code==400
    assert client.post(f'/markets/{mid}/close',headers=ah).status_code==409
    assert client.post(f'/markets/{mid}/reject',headers=ah,json={'reason':'  '}).status_code in (400,422)
    assert client.post(f'/markets/{mid}/reject',headers=ah,json={'reason':'Not verifiable'}).status_code==200
    assert client.post(f'/markets/{mid}/reject',headers=ah,json={'reason':'Again'}).status_code==409
    assert balance(client,a,ha)==before


def test_full_example_partial_and_cancel(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    initial=total()
    first=submit(client,mid,ha).json()
    assert first['remaining']==100 and first['filled']==0
    book=client.get(f'/markets/{mid}/orderbook').json()
    assert book['forming'] and book['last_prices'] is None
    assert book['sides'][1][0]['odds']==pytest.approx(1.83333,rel=1e-5)
    assert book['sides'][1][0]['available']==pytest.approx(120,abs=.001)
    second=submit(client,mid,hb,1,50,1.83).json()
    assert second['filled'] == pytest.approx(50,abs=.001)
    own=client.get(f"/users/{a['id']}/orders",headers=ha).json()[0]
    assert own['filled']==pytest.approx(41.6667,abs=.001)
    assert own['remaining']==pytest.approx(58.3333,abs=.001)
    assert not client.get(f'/markets/{mid}/orderbook').json()['forming']
    before=balance(client,a,ha)
    assert client.post(f"/orders/{first['id']}/cancel",headers=hb).status_code==404
    r=client.post(f"/orders/{first['id']}/cancel",headers=ha)
    assert r.status_code==200
    assert balance(client,a,ha)==pytest.approx(before+own['remaining'])
    again=balance(client,a,ha)
    client.post(f"/orders/{first['id']}/cancel",headers=ha)
    assert balance(client,a,ha)==again
    assert total()==pytest.approx(initial,abs=1e-7)


@pytest.mark.parametrize('winner',[0,1])
def test_resolution_pays_only_executed_and_refunds_rest(client,monkeypatch,winner):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    initial=total()
    submit(client,mid,ha)
    submit(client,mid,hb,1,50,1.83)
    client.post(f'/markets/{mid}/close',headers=ah)
    assert all(o['remaining']==0 for o in client.get(f"/users/{a['id']}/orders",headers=ha).json())
    r=client.post(f'/markets/{mid}/resolve',headers=ah,json={'winning_outcome':winner})
    assert r.status_code==200,r.text
    assert r.json()['pot']==0 and r.json()['settlement_kind']=='auto'
    user,h=(a,ha) if winner==0 else (b,hb)
    history=client.get(f"/users/{user['id']}/settlements",headers=h).json()[0]
    assert history['payout']==pytest.approx(91.6667,abs=.001)
    assert history['tip']==pytest.approx(max(0,history['payout']-history['stakes_total'])*.01,abs=1e-8)
    assert total()==pytest.approx(initial,abs=1e-7)
    balances=[balance(client,a,ha),balance(client,b,hb)]
    assert client.post(f'/markets/{mid}/resolve',headers=ah,json={'winning_outcome':1-winner}).status_code==400
    assert balances==[balance(client,a,ha),balance(client,b,hb)]


def test_quote_ioc_self_trade_and_price_priority(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    first=submit(client,mid,ha,0,20,2.5).json()
    second=submit(client,mid,ha,0,20,2).json()
    # Self orders cannot execute against one another.
    own=submit(client,mid,ha,1,10,1.5,kind='ioc').json()
    assert own['filled']==0 and own['refunded']==10
    quote=client.post(f'/markets/{mid}/orders/quote',headers=hb,json={'outcome':1,'money':10,'odds':3}).json()
    assert quote['requested']['matched']==0
    assert quote['available']['matched']==10 and quote['available']['average_odds']==2
    result=submit(client,mid,hb,1,10,1.5,kind='ioc').json()
    assert result['filled']==10 and result['remaining']==0
    with SessionLocal() as db:
        fill=db.query(P2PFill).filter_by(market_id=mid).first()
        assert fill.maker_order_id==second['id']
        assert db.get(P2POrder,first['id']).filled==0


def test_idempotency_and_parallel_fills(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    rid=str(uuid.uuid4())
    payload=dict(outcome=0,money=100,odds=2,request_id=rid)
    first=client.post(f'/markets/{mid}/orders',headers=ha,json=payload).json()
    before=balance(client,a,ha)
    assert client.post(f'/markets/{mid}/orders',headers=ha,json=payload).json()['id']==first['id']
    assert balance(client,a,ha)==before
    assert client.post(f'/markets/{mid}/orders',headers=ha,json={**payload,'money':101}).status_code==409
    initial=total()
    def take(_):
        with SessionLocal() as db:
            return p2p.place(db,mid,b['id'],1,80,2,'ioc',str(uuid.uuid4()))
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(take,range(2)))
    assert sum(x['filled'] for x in results)==100
    assert total()==pytest.approx(initial,abs=1e-7)


def test_expiration_and_refund_rollback(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    first=submit(client,mid,ha).json()
    before=balance(client,a,ha)
    with SessionLocal() as db:
        db.get(Market,mid).close_at=datetime.utcnow()-timedelta(seconds=1)
        db.commit()
    assert client.get(f'/markets/{mid}/orderbook').status_code==200
    assert balance(client,a,ha)==pytest.approx(before+100)
    assert submit(client,mid,hb,1,50,1.83).status_code==400
    assert client.post(f"/orders/{first['id']}/cancel",headers=ha).status_code==200
    assert balance(client,a,ha)==pytest.approx(before+100)


def test_failed_matching_rolls_back(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    submit(client,mid,ha)
    before=total()
    def fail(*args): raise RuntimeError('injected')
    monkeypatch.setattr(p2p,'_finish_order',fail)
    with pytest.raises(RuntimeError): submit(client,mid,hb,1,50,1.83)
    assert total()==pytest.approx(before,abs=1e-7)
    with SessionLocal() as db:
        assert db.query(P2PFill).filter_by(market_id=mid).count()==0
        assert db.query(P2POrder).filter_by(market_id=mid).count()==1
        assert db.query(P2POrder).filter_by(market_id=mid).one().remaining==100*p2p.ATOM


def test_legacy_rejection_returns_collateral_once(client,monkeypatch):
    admin,ah=_admin(client,monkeypatch)
    a,ha=_login(client)
    before=balance(client,a,ha)
    mid=client.post('/markets',headers=ha,json={'question':'Legacy moderation?', 'mechanism':'lmsr','close_at':_close_at(),'lock_ton':50}).json()['id']
    assert balance(client,a,ha)==before-50
    assert client.post(f'/markets/{mid}/reject',headers=ah,json={'reason':'No source'}).status_code==200
    assert balance(client,a,ha)==before
    assert client.post(f'/markets/{mid}/reject',headers=ah,json={'reason':'Again'}).status_code==409
    assert balance(client,a,ha)==before


def test_cancel_races_match_without_double_refund(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    order=submit(client,mid,ha,0,100,2).json()
    initial=total()
    def operation(which):
        with SessionLocal() as db:
            return p2p.cancel(db,order['id'],a['id']) if which==0 else p2p.place(db,mid,b['id'],1,100,2,'ioc',str(uuid.uuid4()))
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(operation,[0,1]))
    with SessionLocal() as db:
        row=db.get(P2POrder,order['id'])
        assert row.filled+row.refunded+row.remaining==row.amount
        assert db.get(Market,mid).pot in (0,200)
    assert total()==pytest.approx(initial,abs=1e-7)


def test_equal_price_time_priority_and_reject_expired_approval(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    one=submit(client,mid,ha,0,20,2).json()
    two=submit(client,mid,ha,0,20,2).json()
    submit(client,mid,hb,1,10,2)
    with SessionLocal() as db:
        assert db.get(P2POrder,one['id']).filled==10*p2p.ATOM
        assert db.get(P2POrder,two['id']).filled==0
    pending=market(client,ha)['id']
    with SessionLocal() as db:
        db.get(Market,pending).close_at=datetime.utcnow()-timedelta(seconds=1)
        db.commit()
    assert client.post(f'/markets/{pending}/approve',headers=ah).status_code==409
    assert client.post(f'/markets/{pending}/reject',headers=ah,json={'reason':'Expired'}).status_code==200


def test_tips_split_75_25_and_conservation(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    c,hc=_login(client)
    submit(client,mid,hb,0,100,2)
    submit(client,mid,hc,1,100,2)
    creator_before=balance(client,a,ha)
    admin_before=balance(client,admin,ah)
    client.post(f'/markets/{mid}/close',headers=ah)
    response=client.post(f'/markets/{mid}/resolve',headers=ah,json={'winning_outcome':0})
    assert response.status_code==200,response.text
    assert balance(client,a,ha)-creator_before==pytest.approx(.75)
    assert balance(client,admin,ah)-admin_before==pytest.approx(.25)
    assert balance(client,b,hb)==pytest.approx(1099)
    assert balance(client,c,hc)==pytest.approx(900)


def test_settlement_failure_rolls_back_and_expiry_worker_refunds(client,monkeypatch):
    admin,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    submit(client,mid,ha,0,100,2)
    submit(client,mid,hb,1,50,2)
    client.post(f'/markets/{mid}/close',headers=ah)
    initial=total()
    original=p2p.adjust_atoms
    def fail(db,user_id,atoms):
        original(db,user_id,atoms)
        raise RuntimeError('after credit')
    with monkeypatch.context() as patch:
        patch.setattr(p2p,'adjust_atoms',fail)
        with pytest.raises(RuntimeError):
            client.post(f'/markets/{mid}/resolve',headers=ah,json={'winning_outcome':0})
    assert total()==pytest.approx(initial,abs=1e-7)
    with SessionLocal() as db:
        assert db.get(Market,mid).status.value=='closed'
        assert db.query(SettlementRecord).filter_by(market_id=mid).count()==0
    # The background worker uses the same expiration path even without a page read.
    another=market(client,ha)['id']
    client.post(f'/markets/{another}/approve',headers=ah)
    submit(client,another,ha,0,20,2)
    before=balance(client,a,ha)
    with SessionLocal() as db:
        db.get(Market,another).close_at=datetime.utcnow()-timedelta(seconds=1)
        db.commit()
    p2p.expire_due_orders()
    assert balance(client,a,ha)==pytest.approx(before+20)


def test_existing_database_migration_preserves_lmsr(tmp_path,monkeypatch):
    from sqlalchemy import create_engine, text
    from app import database
    old=create_engine('sqlite:///'+str(tmp_path/'old.db'))
    with old.begin() as conn:
        conn.execute(text('CREATE TABLE users (id INTEGER PRIMARY KEY, telegram_id INTEGER, username VARCHAR(64), balance FLOAT, created_at DATETIME)'))
        conn.execute(text('CREATE TABLE markets (id INTEGER PRIMARY KEY, question VARCHAR(512), description TEXT, creator_id INTEGER, category VARCHAR(32), b FLOAT, q_yes FLOAT, q_no FLOAT, outcomes TEXT, q TEXT, lock_ton FLOAT, pot FLOAT, close_at DATETIME, lock_returned BOOLEAN, status VARCHAR(8), winning_outcome VARCHAR(128), created_at DATETIME, resolved_at DATETIME, settlement_kind VARCHAR(16))'))
        conn.execute(text("INSERT INTO users VALUES (1, 1, 'existing', 950, '2026-01-01')"))
        conn.execute(text("INSERT INTO markets VALUES (1, 'Existing market?', '', 1, 'unique', 72, -50, -50, '[\"A\",\"B\"]', '[-50,-50]', 50, 50, '2030-01-01', 0, 'open', NULL, '2026-01-01', NULL, NULL)"))
    monkeypatch.setattr(database,'engine',old)
    database.ensure_schema()
    database.ensure_schema()
    with old.connect() as conn:
        row=conn.execute(text('SELECT mechanism,status,pot,lock_ton,b FROM markets')).one()
        assert tuple(row)==('lmsr','open',50,50,72)
        assert conn.execute(text('SELECT balance FROM users')).scalar_one()==950
        assert conn.execute(text('SELECT count(*) FROM p2p_orders')).scalar_one()==0
    old.dispose()
