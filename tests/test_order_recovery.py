from concurrent.futures import ThreadPoolExecutor
import uuid
import pytest
from sqlalchemy import text
from app.database import SessionLocal
from app.models import User, P2POrder, P2PMoneyEntry
from app.services import p2p_ledger as ledger
from tests.test_p2p import ready, submit


def totals(mid, uid):
    with SessionLocal() as db:
        return (db.get(User, uid).balance_nano,
                sum(o.remaining for o in db.query(P2POrder).filter_by(user_id=uid)),
                db.query(P2PMoneyEntry).filter_by(market_id=mid).count())


@pytest.mark.parametrize('kind', ['limit', 'ioc'])
def test_lost_response_recovery_replay_and_partial_fill(client, monkeypatch, kind):
    _, ah, a, ha, b, hb, mid = ready(client, monkeypatch)
    assert submit(client, mid, hb, 1, 40, 2).status_code == 200
    body = dict(request_id=str(uuid.uuid4()), outcome=0, money='100', odds=2, kind=kind, expected_user_id=a['id'])
    first = client.post(f'/markets/{mid}/orders', headers=ha, json=body)
    assert first.status_code == 200
    after = totals(mid, a['id'])
    recovered = client.get(f"/users/{a['id']}/orders/by-request/{body['request_id']}", headers=ha)
    assert recovered.json() == first.json()
    for _ in range(2):
        assert client.post(f'/markets/{mid}/orders', headers=ha, json=body).json() == recovered.json()
    assert totals(mid,a['id']) == after
    with SessionLocal() as db:
        assert db.query(P2POrder).filter_by(user_id=a['id'],request_id=body['request_id']).count() == 1
        assert ledger.reconcile(db,mid)['fully_verified']
    # Read-only lookup remains usable after cancellation and market close.
    client.post(f"/orders/{first.json()['id']}/cancel", headers=ha)
    assert client.post(f'/markets/{mid}/close', headers=ah).status_code == 200
    final = totals(mid,a['id'])
    assert client.get(f"/users/{a['id']}/orders/by-request/{body['request_id']}", headers=ha).status_code == 200
    assert totals(mid,a['id']) == final
    assert client.get(f"/users/{a['id']}/orders/by-request/{body['request_id']}", headers=hb).status_code == 403
    assert client.get(f"/users/{b['id']}/orders/by-request/{body['request_id']}", headers=hb).status_code == 404
    assert client.get(f"/users/{a['id']}/orders/by-request/{body['request_id']}").status_code == 401


def test_two_replays_reserve_once_and_actor_precondition(client, monkeypatch):
    _, _, a, ha, b, _, mid = ready(client,monkeypatch)
    body=dict(request_id=str(uuid.uuid4()),outcome=0,money=100,odds=2,kind='limit',expected_user_id=a['id'])
    before=totals(mid,a['id'])
    with ThreadPoolExecutor(2) as pool:
        results=list(pool.map(lambda _:client.post(f'/markets/{mid}/orders',headers=ha,json=body),range(2)))
    assert all(r.status_code==200 for r in results), [r.text for r in results]
    assert results[0].json()['id']==results[1].json()['id']
    assert totals(mid,a['id'])[0]==before[0]-100*10**9
    assert totals(mid,a['id'])[1]==before[1]+100*10**9
    assert client.post(f'/markets/{mid}/orders',headers=ha,json={**body,'money':101}).status_code==409
    unchanged=totals(mid,a['id'])
    assert client.post(f'/markets/{mid}/orders',headers=ha,json={**body,'request_id':str(uuid.uuid4()),'expected_user_id':b['id']}).status_code==409
    assert totals(mid,a['id'])==unchanged


def test_failure_after_reserve_journal_rolls_back_then_same_key_succeeds(client, monkeypatch):
    _, _, a, ha, _, _, mid=ready(client,monkeypatch)
    body=dict(request_id=str(uuid.uuid4()),outcome=0,money=100,odds=2,kind='limit')
    before=totals(mid,a['id'])
    original=ledger.record_reserve
    def fail(*args):
        original(*args); args[0].flush()
        raise RuntimeError('injected after reserve journal')
    monkeypatch.setattr(ledger,'record_reserve',fail)
    with pytest.raises(RuntimeError,match='injected'):
        client.post(f'/markets/{mid}/orders',headers=ha,json=body)
    assert totals(mid,a['id'])==before
    assert client.get(f"/users/{a['id']}/orders/by-request/{body['request_id']}",headers=ha).status_code==404
    monkeypatch.setattr(ledger,'record_reserve',original)
    assert client.post(f'/markets/{mid}/orders',headers=ha,json=body).status_code==200
    after=totals(mid,a['id'])
    assert client.post(f'/markets/{mid}/orders',headers=ha,json=body).status_code==200
    assert totals(mid,a['id'])==after


def legacy_ready(client, monkeypatch):
    from tests.legacy_helpers import post_legacy_market
    from tests.test_settlement import _close_at
    from tests.test_markets_api import _admin, _login
    _, ah = _admin(client,monkeypatch)
    a, ha = _login(client)
    response=post_legacy_market(client,'/markets',headers=ha,json={'question':'Legacy receipt recovery?', 'lock_ton':50,'close_at':_close_at()})
    assert response.status_code==200,response.text
    mid=response.json()['id']
    assert response.json()['status']=='open'
    return mid,a,ha,ah


def test_legacy_buy_lost_response_parallel_replay_and_lookup(client, monkeypatch):
    mid,a,h,ah=legacy_ready(client,monkeypatch)
    body=dict(outcome=0,money=10,request_id=str(uuid.uuid4()),expected_user_id=a['id'])
    before=totals(mid,a['id'])[0]
    with ThreadPoolExecutor(2) as pool:
        responses=list(pool.map(lambda _:client.post(f'/markets/{mid}/buy',headers=h,json=body),range(2)))
    assert all(r.status_code==200 for r in responses), [r.text for r in responses]
    assert responses[0].json()==responses[1].json()
    after=totals(mid,a['id'])[0]
    assert before-after==round(responses[0].json()['paid']*10**9)
    assert client.post(f'/markets/{mid}/buy',headers=h,json={**body,'money':11}).status_code==409
    assert client.post(f'/markets/{mid}/close',headers=ah).status_code==200
    lookup=client.get(f"/users/{a['id']}/purchases/by-request/{body['request_id']}",headers=h)
    assert lookup.json()==responses[0].json()
    assert client.post(f'/markets/{mid}/buy',headers=h,json=body).json()==lookup.json()
    assert totals(mid,a['id'])[0]==after
    assert client.get(f"/users/{a['id']}/purchases/by-request/{body['request_id']}").status_code==401


def test_legacy_buy_error_after_money_flush_rolls_back_receipt_and_trade(client, monkeypatch):
    from app.services import market_service as ms
    from app.models import Market,Trade
    mid,a,h,_=legacy_ready(client,monkeypatch)
    body=dict(outcome=0,money=10,request_id=str(uuid.uuid4()))
    def snapshot():
        with SessionLocal() as db:
            return (db.get(User,a['id']).balance_nano,db.get(Market,mid).pot_nano,db.query(Trade).filter_by(market_id=mid).count(),db.execute(text('SELECT count(*) FROM legacy_purchase_intents')).scalar_one())
    before=snapshot(); original=ms.buy_shares
    def fail(*args,**kwargs):
        result=original(*args,**kwargs)
        assert kwargs['commit'] is False
        raise RuntimeError('injected after legacy buy flush')
    monkeypatch.setattr(ms,'buy_shares',fail)
    with pytest.raises(RuntimeError,match='injected'):
        client.post(f'/markets/{mid}/buy',headers=h,json=body)
    assert snapshot()==before
    assert client.get(f"/users/{a['id']}/purchases/by-request/{body['request_id']}",headers=h).status_code==404
    monkeypatch.setattr(ms,'buy_shares',original)
    assert client.post(f'/markets/{mid}/buy',headers=h,json=body).status_code==200
    after=snapshot()
    assert client.post(f'/markets/{mid}/buy',headers=h,json=body).status_code==200
    assert snapshot()==after
