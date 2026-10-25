from app.config import settings
from tests.test_order_recovery import legacy_ready, totals
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4
import pytest
from sqlalchemy import text
from app.database import SessionLocal
from app.models import User, Market, Trade


def test_unkeyed_buy_rejected_before_any_debit_and_explicit_compatibility(client, monkeypatch):
    mid,a,h,_=legacy_ready(client,monkeypatch)
    monkeypatch.setattr(settings,'allow_unkeyed_legacy_buy',False)
    before=totals(mid,a['id'])
    rejected=client.post(f'/markets/{mid}/buy',headers=h,json={'outcome':0,'money':10})
    assert rejected.status_code==428
    assert 'request_id' in rejected.json()['detail']
    assert totals(mid,a['id'])==before
    monkeypatch.setattr(settings,'allow_unkeyed_legacy_buy',True)
    assert client.post(f'/markets/{mid}/buy',headers=h,json={'outcome':0,'money':10}).status_code==200
    assert totals(mid,a['id'])[0]<before[0]
    monkeypatch.setattr(settings,'allow_unkeyed_legacy_buy',False)
    after=totals(mid,a['id'])
    assert client.post(f'/markets/{mid}/buy',headers=h,json={'outcome':0,'money':10}).status_code==428
    assert totals(mid,a['id'])==after


@pytest.mark.parametrize('different_market',[False,True])
def test_distinct_keyed_buys_of_same_actor_share_safe_lock_order(client,monkeypatch,different_market):
    from tests.legacy_helpers import post_legacy_market
    from tests.test_settlement import _close_at
    mid,a,h,_=legacy_ready(client,monkeypatch)
    mids=[mid,mid]
    if different_market:
        created=post_legacy_market(client,'/markets',headers=h,json={'question':'Second concurrent legacy market?', 'lock_ton':50,'close_at':_close_at()})
        assert created.status_code==200,created.text
        mids[1]=created.json()['id']
    with SessionLocal() as db:
        before_balance=db.get(User,a['id']).balance_nano
        before_pot=sum(db.get(Market,m).pot_nano for m in set(mids))
    keys=[]; paid=0
    for _ in range(3):
        barrier=Barrier(2)
        bodies=[dict(outcome=0,money=10,request_id=str(uuid4())) for _ in range(2)]
        def buy(index):
            barrier.wait(timeout=10)
            return client.post(f'/markets/{mids[index]}/buy',headers=h,json=bodies[index])
        with ThreadPoolExecutor(2) as pool:
            results=list(pool.map(buy,range(2)))
        assert all(r.status_code==200 for r in results),[r.text for r in results]
        for i,response in enumerate(results):
            paid+=round(response.json()['paid']*10**9)
            keys.append(bodies[i]['request_id'])
            assert client.post(f'/markets/{mids[i]}/buy',headers=h,json=bodies[i]).json()==response.json()
    with SessionLocal() as db:
        assert db.get(User,a['id']).balance_nano==before_balance-paid
        assert sum(db.get(Market,m).pot_nano for m in set(mids))==before_pot+paid
        assert db.query(Trade).filter(Trade.market_id.in_(set(mids)),Trade.user_id==a['id']).count()==6
        receipts=db.execute(text('SELECT request_id FROM legacy_purchase_intents WHERE user_id=:uid'),{'uid':a['id']}).scalars().all()
        assert sorted(receipts)==sorted(keys)
