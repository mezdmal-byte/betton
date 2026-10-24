"""Additional PostgreSQL-only audit scenarios. Never use a working database.
Run through run_postgres_audit.sh; NOT verified on PostgreSQL in this Work session.
"""
from tests.conftest import client
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, current_thread
from datetime import timedelta
import os
import uuid
import pytest
from sqlalchemy import text, MetaData
from sqlalchemy.exc import DataError, IntegrityError
from app.database import engine, Base, SessionLocal
from app.models import User, Market, P2POrder, P2PMoneyEntry, SettlementRecord, EventConfigV3
from app.services import p2p_ledger as ledger, guarantors as gs
from tests.test_p2p import ready, submit, market
from tests.test_guarantor_funding import secured_pair, totals
from tests.test_guarantors import call
from tests.test_markets_api import _login
from tests.test_ux_v3_events import payload

pytestmark=pytest.mark.skipif(not os.environ.get('BETTON_TEST_DATABASE_URL','').startswith('postgresql'),reason='isolated PostgreSQL required; SQLite is not a concurrency substitute')

def race(*jobs):
    gate=Barrier(len(jobs))
    def execute(job): gate.wait(timeout=10); return job()
    with ThreadPoolExecutor(max_workers=len(jobs)) as pool:
        futures=[pool.submit(execute,j) for j in jobs]
        return [f.result(timeout=30) for f in futures]

def verify(mid,conserved):
    assert engine.dialect.name=='postgresql'
    assert totals()==conserved
    with SessionLocal() as db:
        assert all(u.balance_nano>=0 for u in db.query(User))
        assert ledger.reconcile(db,mid)['fully_verified']
        keys=[r.entry_key for r in db.query(P2PMoneyEntry).filter_by(market_id=mid)]
        assert len(keys)==len(set(keys))

@pytest.mark.parametrize('other',['resolve','cancel'])
def test_pg_settle_against_settle_or_cancel(client,monkeypatch,other):
    _,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    assert submit(client,mid,ha,0,100,2).status_code==200
    assert submit(client,mid,hb,1,100,2).status_code==200
    assert client.post(f'/markets/{mid}/close',headers=ah).status_code==200
    conserved=totals()
    def resolve(): return client.post(f'/markets/{mid}/resolve',headers=ah,json={'winning_outcome':0}).status_code
    def cancel(): return client.post(f'/markets/{mid}/cancel',headers=ah,json={'reason':'Audit cancellation'}).status_code
    statuses=race(resolve,resolve if other=='resolve' else cancel)
    assert all(s in (200,409) for s in statuses) and 200 in statuses
    verify(mid,conserved)
    with SessionLocal() as db:
        rows=db.query(SettlementRecord).filter_by(market_id=mid).all()
        assert len(rows)==len({r.user_id for r in rows})
        assert db.get(Market,mid).pot_nano==0

def test_pg_two_fills_and_cancel_remainder(client,monkeypatch):
    _,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    c,hc=_login(client)
    maker=submit(client,mid,ha,0,100,2).json()
    conserved=totals()
    statuses=race(lambda:submit(client,mid,hb,1,80,2).status_code,lambda:submit(client,mid,hc,1,80,2).status_code,
                  lambda:client.post(f"/orders/{maker['id']}/cancel",headers=ha).status_code)
    assert all(s in (200,409) for s in statuses)
    verify(mid,conserved)

def test_pg_same_balance_two_markets_cannot_overspend(client,monkeypatch):
    _,ah,a,ha,b,hb,mid=ready(client,monkeypatch)
    second=market(client,ha)['id']
    assert client.post(f'/markets/{second}/approve',headers=ah).status_code==200
    conserved=totals()
    statuses=race(lambda:submit(client,mid,ha,0,800,2).status_code,lambda:submit(client,second,ha,0,800,2).status_code)
    assert statuses.count(200)==1 and all(s in (200,400,409) for s in statuses)
    verify(mid,conserved); verify(second,conserved)

@pytest.mark.parametrize('deadline_offset',[-1,0,1])
def test_pg_decision_and_expiration_boundary(client,monkeypatch,deadline_offset):
    _,_,a,ha,g,hg,b,hb,event=secured_pair(client,monkeypatch)
    mid=event['id']
    with SessionLocal() as db: ends=db.get(EventConfigV3,mid).ends_at
    instant=ends+timedelta(hours=24,seconds=deadline_offset)
    monkeypatch.setattr(gs,'now',lambda:instant)
    conserved=totals()
    outcomes=race(lambda:call(client,mid,hg,'propose',revision=2,outcome=0,text='Audit boundary').status_code,lambda:gs.process_due())
    assert outcomes[0] in (200,409)
    verify(mid,conserved)
    with SessionLocal() as db:
        expected='resolved' if deadline_offset<0 else 'cancelled'
        assert db.get(Market,mid).status.value==expected
        assert db.get(Market,mid).pot_nano==0

def test_pg_concurrent_creation_currently_duplicates(client):
    _,headers=_login(client)
    body=payload('private')
    responses=race(lambda:client.post('/ux-v3/events',headers=headers,json=body),lambda:client.post('/ux-v3/events',headers=headers,json=body))
    assert all(r.status_code==200 for r in responses)
    assert len({r.json()['id'] for r in responses})==2 # current defect, not desired behavior

def test_pg_bigint_migration_populated_schema_and_rollback_guard():
    """Copy model DDL into a run-owned schema; migrate only that schema."""
    assert engine.dialect.name=='postgresql'
    schema='audit_id_'+uuid.uuid4().hex
    metadata=MetaData()
    for table in Base.metadata.sorted_tables: table.to_metadata(metadata,schema=schema)
    with engine.begin() as conn: conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    try:
        metadata.create_all(engine)
        users=metadata.tables[schema+'.users']
        with engine.begin() as conn:
            conn.execute(users.insert().values(id=1,telegram_id=123456,username='audit_original',balance_nano=1000000000))
            conn.execute(text(f'CREATE TABLE "{schema}".audit_child (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES "{schema}".users(id))'))
            conn.execute(text(f'INSERT INTO "{schema}".audit_child VALUES (1,1)'))
        with pytest.raises(DataError):
            with engine.begin() as conn: conn.execute(users.insert().values(id=2,telegram_id=2**32+7,username='audit_large',balance_nano=1000000000))
        with engine.begin() as conn:
            conn.execute(text("SET LOCAL lock_timeout='3s'"))
            conn.execute(text(f'ALTER TABLE "{schema}".users ALTER COLUMN telegram_id TYPE BIGINT USING telegram_id::bigint'))
            assert conn.execute(text(f'SELECT telegram_id FROM "{schema}".users WHERE id=1')).scalar_one()==123456
            conn.execute(users.insert().values(id=2,telegram_id=2**32+7,username='audit_large',balance_nano=1000000000))
            conn.execute(text(f'INSERT INTO "{schema}".audit_child VALUES (2,2)'))
            assert conn.execute(text(f'SELECT count(*) FROM "{schema}".users WHERE telegram_id NOT BETWEEN -2147483648 AND 2147483647')).scalar_one()==1
        with pytest.raises(IntegrityError):
            with engine.begin() as conn: conn.execute(users.insert().values(id=3,telegram_id=123456,username='audit_duplicate',balance_nano=1000000000))
        # Narrowing is unsafe while large IDs exist. Test rollback on this synthetic row only.
        with engine.begin() as conn:
            conn.execute(text(f'DELETE FROM "{schema}".audit_child WHERE id=2'))
            conn.execute(text(f'DELETE FROM "{schema}".users WHERE id=2'))
            conn.execute(text(f'ALTER TABLE "{schema}".users ALTER COLUMN telegram_id TYPE INTEGER USING telegram_id::integer'))
            assert conn.execute(text(f'SELECT count(*) FROM "{schema}".audit_child c JOIN "{schema}".users u ON u.id=c.user_id')).scalar_one()==1
    finally:
        with engine.begin() as conn: conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
