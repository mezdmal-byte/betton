"""Read-only-to-production diagnostics; temporary DB comes from tests.conftest.
Run: python -m pytest -o addopts='' -q docs/audit/evidence/test_audit_probes.py
Assertions describe current defects, not desired future behavior.
"""
from tests.conftest import client
from datetime import timedelta
from unittest.mock import AsyncMock
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql
from app.database import SessionLocal, engine
from app.models import User, EventConfigV3, P2PMoneyEntry
from app.services import guarantors as gs, market_service as ms, p2p_ledger as ledger
from tests.test_guarantor_funding import paid_case
from tests.test_guarantors import call
from tests.test_p2p import submit
from tests.test_ux_v3_events import payload


def test_reward_paid_but_absent_from_guarantor_history(client, monkeypatch):
    _, _, a, ha, g, hg, b, hb, event = paid_case(client, monkeypatch, fixed='5')
    mid=event['id']
    assert submit(client,mid,ha,0,100,2).status_code==200
    assert submit(client,mid,hb,1,100,2).status_code==200
    with SessionLocal() as db:
        ends=db.get(EventConfigV3,mid).ends_at
    monkeypatch.setattr(gs,'now',lambda: ends+timedelta(hours=1))
    monkeypatch.setattr(ms,'utcnow',lambda: ms.as_utc(ends)+timedelta(hours=1))
    assert call(client,mid,hg,'propose',revision=2,outcome=0,text='Isolated audit result').status_code==200
    with SessionLocal() as db:
        amount=sum(x.amount for x in db.query(P2PMoneyEntry).filter_by(market_id=mid,op_type=ledger.OP_GUARANTOR_REWARD))
        assert amount==5*10**9
        assert ledger.reconcile(db,mid)['fully_verified']
    history=client.get(f"/users/{g['id']}/transactions",headers=hg).json()
    assert not [row for row in history if row['market_id']==mid], history
    winner_history=client.get(f"/users/{a['id']}/transactions",headers=ha).json()
    assert not any('guarantor' in str(row) for row in winner_history if row['market_id']==mid)
    print('Reward ledger=5000000000; guarantor history has no corresponding row; winner history omits reward deduction')


def test_webhook_dispatches_without_secret_header(client, monkeypatch):
    import app.main as main
    dispatcher=type('StubDispatcher',(),{'feed_update':AsyncMock()})()
    monkeypatch.setattr(main,'_maybe_bot',lambda:(object(),dispatcher))
    response=client.post('/webhook',json={'update_id':987654321})
    assert response.status_code==200,response.text
    assert dispatcher.feed_update.await_count==1
    print('Unsigned local request reached stub dispatcher; no bot network calls made')


def test_postgresql_telegram_id_compiles_to_integer_and_sqlite_foreign_keys_off():
    ddl=str(CreateTable(User.__table__).compile(dialect=postgresql.dialect()))
    assert 'telegram_id INTEGER' in ddl,ddl
    if engine.dialect.name=='sqlite':
        with engine.connect() as conn:
            assert conn.exec_driver_sql('PRAGMA foreign_keys').scalar()==0
    print('PostgreSQL DDL: telegram_id INTEGER; SQLite PRAGMA foreign_keys=0')


def test_event_create_retry_duplicates_event(client,monkeypatch):
    from tests.test_markets_api import _login
    _,headers=_login(client)
    body=payload('private')
    first=client.post('/ux-v3/events',headers=headers,json=body)
    second=client.post('/ux-v3/events',headers=headers,json=body)
    assert first.status_code==second.status_code==200
    assert first.json()['id']!=second.json()['id']
    print('Identical create requests committed two distinct events')
