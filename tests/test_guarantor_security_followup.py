"""PR24 independent API checks. Known-defect tests assert observed unsafe behaviour."""
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
import json
import pytest
from app.database import SessionLocal
from app.models import User,Market,GuarantorCase,EventConfigV3,P2POrder,P2PMoneyEntry,SettlementRecord
from app.services import guarantors as gs,market_service as ms
from tests.test_guarantors import setup_case,call
from tests.test_ux_v3_events import create,payload
from tests.test_guarantor_funding import secured_pair,paid_case,totals
from tests.test_markets_api import _login


def review(client,monkeypatch):
    _,_,a,ha,g,hg,b,hb,_=setup_case(client,monkeypatch)
    e=create(client,ha,payload('guarantor',g['id']))
    assert call(client,e['id'],hg,'acknowledge').status_code==200
    return a,ha,g,hg,b,hb,e


def snap(mid):
    with SessionLocal() as db:
        m=db.get(Market,mid);c=db.get(GuarantorCase,mid);f=db.get(EventConfigV3,mid)
        return (tuple(db.query(User.id,User.balance_nano).order_by(User.id)),m.status.value,m.pot_nano,c.state,c.revision,c.creator_confirmed,json.dumps(f.reward,sort_keys=True),tuple(db.query(P2POrder.id,P2POrder.remaining,P2POrder.status).filter_by(market_id=mid).order_by(P2POrder.id)),db.query(P2PMoneyEntry).filter_by(market_id=mid).count(),db.query(SettlementRecord).filter_by(market_id=mid).count())


@pytest.mark.parametrize('field,value',[('fixed_ton','NaN'),('fixed_ton','Infinity'),('fixed_ton','-0.000000001'),('fixed_ton','0.0000000001'),('percent','100.01'),('percent','0.001')])
def test_invalid_reward_preserves_revision_and_money(client,monkeypatch,field,value):
    _,ha,_,_,_,_,e=review(client,monkeypatch);mid=e['id'];before=snap(mid)
    body=dict(expected_revision=1,mode='combined',fixed_ton='1',percent='2');body[field]=value
    r=client.post(f'/ux-v3/events/{mid}/reward',headers=ha,json=body)
    assert r.status_code==422,r.text
    assert snap(mid)==before


def test_concurrent_counteroffers_have_one_winner(client,monkeypatch):
    _,ha,_,hg,_,_,e=review(client,monkeypatch);mid=e['id']
    def propose(h):return client.post(f'/ux-v3/events/{mid}/reward',headers=h,json=dict(expected_revision=1,mode='fixed',fixed_ton='5'))
    with ThreadPoolExecutor(2) as pool: rs=list(pool.map(propose,[ha,hg]))
    assert sorted(r.status_code for r in rs)==[200,409],[r.text for r in rs]
    with SessionLocal() as db:
        assert db.get(GuarantorCase,mid).revision==db.get(EventConfigV3,mid).revision==2
        assert len(db.get(EventConfigV3,mid).reward['accepted_by'])==1
    before=snap(mid)
    assert call(client,mid,ha,'confirm',revision=1).status_code==409
    assert snap(mid)==before


@pytest.mark.parametrize('offset,code',[(timedelta(microseconds=-1),409),(timedelta(0),200),(timedelta(hours=24,microseconds=-1),200),(timedelta(hours=24),409)])
def test_exact_decision_window(client,monkeypatch,offset,code):
    _,_,_,_,_,hg,_,_,e=secured_pair(client,monkeypatch);mid=e['id']
    with SessionLocal() as db: ends=db.get(EventConfigV3,mid).ends_at
    monkeypatch.setattr(gs,'now',lambda:ends+offset)
    monkeypatch.setattr(ms,'utcnow',lambda:ms.as_utc(ends)+offset)
    before=snap(mid)
    r=call(client,mid,hg,'propose',revision=2,outcome=0,text='Synthetic boundary evidence')
    assert r.status_code==code,r.text
    if code==409 and offset<timedelta(0): assert snap(mid)==before
    elif code==409:
        # Expiry commits its legitimate refund before rejecting the late decision.
        after=snap(mid)
        assert after[1]=='cancelled' and after[2]==0 and after[3]=='cancelled'
        with SessionLocal() as db:
            from app.services import p2p_ledger as ledger
            assert ledger.reconcile(db,mid)['fully_verified']
            assert db.query(P2PMoneyEntry).filter(P2PMoneyEntry.market_id==mid,P2PMoneyEntry.op_type.in_(['tip','guarantor_reward'])).count()==0
        assert call(client,mid,hg,'propose',revision=2,outcome=1,text='Retry late decision').status_code==409
        assert snap(mid)==after
    else:
        after=snap(mid)
        assert call(client,mid,hg,'propose',revision=2,outcome=1,text='Replay after lost response').status_code==409
        assert snap(mid)==after


@pytest.mark.parametrize('action',['acknowledge','decline','accept','propose'])
def test_nonassigned_actor_with_share_token_cannot_control_case(client,monkeypatch,action):
    _,_,_,_,_,hb,e=review(client,monkeypatch);mid=e['id'];hb={**hb,'X-Market-Share-Token':e['share_token']};before=snap(mid)
    r=call(client,mid,hb,action,revision=1,outcome=0,text='Not assigned')
    assert r.status_code==403,r.text
    assert snap(mid)==before


def test_share_link_does_not_grant_private_negotiation_access(client,monkeypatch):
    _,ha,_,_,_,_,e=review(client,monkeypatch);mid=e['id']
    assert call(client,mid,ha,'message',text='Private canary').status_code==200
    _,h=_login(client);h={**h,'X-Market-Share-Token':e['share_token']}
    r=client.get(f'/markets/{mid}/guarantor',headers=h)
    assert r.status_code==200,r.text
    assert 'Private canary' not in json.dumps(r.json())
    before=snap(mid)
    assert call(client,mid,h,'message',text='Intrusion').status_code==403
    assert snap(mid)==before


@pytest.mark.parametrize('action',['acknowledge','decline'])
def test_known_defect_stale_invitation_action_mutates_new_invitation(client,monkeypatch,action):
    """G1 reproducer: observed 200; desired contract 409/no mutation. NOT a security pass."""
    _,ha,g,hg,_,_,e=review(client,monkeypatch);mid=e['id']
    assert call(client,mid,hg,'decline',revision=1).status_code==200
    assert call(client,mid,ha,'invite',guarantor_id=g['id']).status_code==200
    with SessionLocal() as db: assert db.get(GuarantorCase,mid).revision==2
    before=snap(mid)
    r=call(client,mid,hg,action,revision=1)
    assert r.status_code==200,r.text
    after=snap(mid)
    assert after[3]==('review' if action=='acknowledge' else 'needs_guarantor')
    assert after!=before
    for i in [0,2,7,8,9]:assert after[i]==before[i]


@pytest.mark.parametrize('actor',['creator','guarantor'])
def test_tariff_cannot_change_after_acceptance(client,monkeypatch,actor):
    _,_,_,ha,_,hg,_,_,e=paid_case(client,monkeypatch,fixed='5');mid=e['id'];before=snap(mid)
    r=client.post(f'/ux-v3/events/{mid}/reward',headers=ha if actor=='creator' else hg,json=dict(expected_revision=2,mode='fixed',fixed_ton='500'))
    assert r.status_code==409,r.text
    assert snap(mid)==before


@pytest.mark.parametrize('actor',['creator','bettor'])
def test_cancellation_requires_assigned_guarantor_even_in_valid_window(client,monkeypatch,actor):
    _,_,_,ha,_,_,_,hb,e=secured_pair(client,monkeypatch);mid=e['id'];before=snap(mid)
    assert call(client,mid,ha if actor=='creator' else hb,'cancel',revision=2,text='Unauthorized cancellation').status_code==403
    assert snap(mid)==before
