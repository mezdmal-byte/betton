"""Isolated audit diagnostics; assertions describe current source, not fixes."""
from tests.conftest import client
import ast
import asyncio
import subprocess
from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock
import pytest
from fastapi import Request, HTTPException
from app.config import settings
from app.database import SessionLocal
from app.models import User, EventConfigV3, P2PMoneyEntry, SettlementRecord, Market
from app.services import guarantors as gs, market_service as ms, p2p_ledger as ledger
from tests.test_guarantor_funding import paid_case, totals
from tests.test_guarantors import call
from tests.test_p2p import submit
from tests.auth_helpers import tma_headers

@pytest.mark.parametrize('revision', ['d4ed4e7d5978300244d0bcde09a2ce10b6ee6b0a', '1c0f7cb0fa802e3d6a2a77f7873489208a775327'])
def test_unsigned_webhook_real_handler_with_mock_transport(revision):
    source = subprocess.check_output(['git','show',revision+':app/main.py'], text=True)
    fn = next(n for n in ast.parse(source).body if isinstance(n,ast.AsyncFunctionDef) and n.name=='telegram_webhook')
    fn.decorator_list=[]
    dp = SimpleNamespace(feed_update=AsyncMock())
    ns = dict(Request=Request, HTTPException=HTTPException, settings=SimpleNamespace(telegram_webhook_proxy_url=''), _maybe_bot=lambda:(object(),dp))
    exec(compile(ast.Module(body=[fn],type_ignores=[]),revision,'exec'),ns)
    req=SimpleNamespace(json=AsyncMock(return_value={'update_id':123,'message':{'message_id':1,'date':1,'chat':{'id':123,'type':'private'},'from':{'id':456,'is_bot':False,'first_name':'Audit'},'text':'/help','entities':[{'offset':0,'length':5,'type':'bot_command'}]}}))
    assert asyncio.run(ns['telegram_webhook'](req))=={'status':'ok'}
    assert dp.feed_update.await_count==1
    assert dp.feed_update.call_args.args[1].message.text=='/help'
    print(revision, 'unsigned /help update reached mock dispatcher; zero Telegram traffic')

def test_username_identity_can_change_admin_access(client,monkeypatch):
    monkeypatch.setattr(settings,'admin_telegram_id',99990001)
    monkeypatch.setattr(settings,'admin_telegram_usernames','audit_reassigned_name')
    uid=99990002
    normal=client.post('/auth/telegram',headers=tma_headers(uid,username='audit_regular'))
    assert not normal.json()['is_admin']
    renamed=client.post('/auth/telegram',headers=tma_headers(uid,username='audit_reassigned_name'))
    assert renamed.json()['is_admin']
    with SessionLocal() as db:
        ms.require_admin(db.get(User,renamed.json()['id']))
    print('Different immutable ID acquires admin through configured username; only test-signed identities used')

def test_reward_history_exact_balance_delta(client,monkeypatch):
    _,_,a,ha,g,hg,b,hb,event=paid_case(client,monkeypatch,fixed='5')
    mid=event['id']
    for headers,side in [(ha,0),(hb,1)]: assert submit(client,mid,headers,side,100,2).status_code==200
    with SessionLocal() as db:
        before={u:db.get(User,u).balance_nano for u in [a['id'],g['id']]}
        ends=db.get(EventConfigV3,mid).ends_at
    monkeypatch.setattr(gs,'now',lambda:ends+timedelta(hours=1))
    monkeypatch.setattr(ms,'utcnow',lambda:ms.as_utc(ends)+timedelta(hours=1))
    assert call(client,mid,hg,'propose',revision=2,outcome=0,text='Audit').status_code==200
    with SessionLocal() as db:
        winner=db.get(User,a['id']).balance_nano-before[a['id']]
        guarantor=db.get(User,g['id']).balance_nano-before[g['id']]
        rec=db.query(SettlementRecord).filter_by(market_id=mid,user_id=a['id']).one()
        assert rec.credited==194 and rec.payout==200 and rec.tip==1
        assert winner==194*10**9 and guarantor==5*10**9
        assert ledger.reconcile(db,mid)['fully_verified']
    rows=client.get(f"/users/{a['id']}/transactions",headers=ha).json()
    displayed=sum(r['amount_nano'] for r in rows if r['market_id']==mid and r['type'] in ('win','fee'))
    assert displayed==199*10**9
    print('Winner settlement credit=194 TON; history win-fee=199 TON; guarantor balance +5 TON')

def test_reward_write_failure_rolls_back_all_money(client,monkeypatch):
    _,_,a,ha,g,hg,b,hb,event=paid_case(client,monkeypatch,fixed='5')
    mid=event['id']
    for headers,side in [(ha,0),(hb,1)]: assert submit(client,mid,headers,side,100,2).status_code==200
    with SessionLocal() as db:
        ends=db.get(EventConfigV3,mid).ends_at
        before={u.id:u.balance_nano for u in db.query(User)}
        count=db.query(P2PMoneyEntry).filter_by(market_id=mid).count()
    monkeypatch.setattr(gs,'now',lambda:ends+timedelta(hours=1))
    monkeypatch.setattr(ms,'utcnow',lambda:ms.as_utc(ends)+timedelta(hours=1))
    original=ledger.record
    def fail_after_reward(*args,**kwargs):
        row=original(*args,**kwargs)
        if kwargs.get('op_type')==ledger.OP_GUARANTOR_REWARD: raise RuntimeError('audit-injected failure after reward insert')
        return row
    monkeypatch.setattr(ledger,'record',fail_after_reward)
    with pytest.raises(RuntimeError,match='audit-injected'):
        call(client,mid,hg,'propose',revision=2,outcome=0,text='Audit rollback')
    with SessionLocal() as db:
        assert {u.id:u.balance_nano for u in db.query(User)}==before
        assert db.query(P2PMoneyEntry).filter_by(market_id=mid).count()==count
        assert db.query(SettlementRecord).filter_by(market_id=mid).count()==0
        assert db.get(Market,mid).pot_nano==200*10**9
        assert ledger.reconcile(db,mid)['fully_verified']
    print('Injected failure after reward journal insert rolled back balances, journal, settlement')
