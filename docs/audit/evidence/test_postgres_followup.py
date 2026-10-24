"""Additional PostgreSQL-only audit scenarios. Never use a working database.
Run through run_postgres_audit.sh; NOT verified on PostgreSQL in this Work session.
"""
from tests.conftest import client
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier, Event, current_thread
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
from tests.test_demo_guarantors import enable
from tests.test_markets_api import _admin
from tests.test_ux_v3_events import create
from app.models import GuarantorCase, GuarantorMessage, DemoGuarantorRun
from app.services import demo_guarantors as demo, market_service as ms

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

def demo_cases(client, monkeypatch, count=1):
    """Only synthetic actors; actual environment guard remains active."""
    admin, ah = _admin(client, monkeypatch)
    _, ch = _login(client)
    enable(monkeypatch)  # disables background process_due; tests call tick explicitly
    result = client.post('/demo/guarantors/install', headers=ah)
    assert result.status_code == 200, result.text
    mids = []
    for actor in result.json()[:count]:
        mid = create(client, ch, payload('guarantor', actor['user_id']))['id']
        response = client.put(f'/demo/guarantors/events/{mid}', headers=ah,
                              json={'scenario': 'negotiate'})
        assert response.status_code == 200, response.text
        mids.append(mid)
    instant = gs.now() + timedelta(seconds=16)
    monkeypatch.setattr(gs, 'now', lambda: instant)
    return admin['id'], mids

def worker_tick():
    with SessionLocal() as db:
        demo.tick(db)

def test_pg_two_workers_two_actors_once(client, monkeypatch):
    _, mids = demo_cases(client, monkeypatch, count=2)
    conserved = totals()
    race(worker_tick, worker_tick)
    for mid in mids:
        verify(mid, conserved)
        with SessionLocal() as db:
            assert db.get(GuarantorCase, mid).state == 'review'
            assert db.query(GuarantorMessage).filter_by(market_id=mid, kind='acknowledge').count() == 1
            run = db.get(DemoGuarantorRun, mid)
            assert run.enabled and run.next_at > gs.now() and run.last_error is None

@pytest.mark.parametrize('worker_has_lock', [False, True])
def test_pg_disable_while_worker_running(client, monkeypatch, worker_has_lock):
    """Force disable before market lock, or while an action holds that lock.

    Disabling is serialized: an action already holding the lock may finish;
    no action may begin after the disable transaction commits.
    """
    admin_id, (mid,) = demo_cases(client, monkeypatch)
    conserved = totals()
    reached, release, disable_started = Event(), Event(), Event()
    original_lock, original_step = ms._lock_market, demo._step
    worker_ident = []

    def pause():
        reached.set()
        assert release.wait(8), 'diagnostic gate was not released'

    def lock(db, market_id):
        if market_id == mid and current_thread().ident in worker_ident and not worker_has_lock:
            pause()  # enabled ids already read by tick; disable must now win
        return original_lock(db, market_id)

    def step(db, run, actor, market, case, config):
        if market.id == mid and worker_has_lock:
            pause()  # tick already holds market/run locks
        return original_step(db, run, actor, market, case, config)

    def worker():
        worker_ident.append(current_thread().ident)
        worker_tick()

    def disable():
        with SessionLocal() as db:
            disable_started.set()
            demo.configure(db, db.get(User, admin_id), mid, 'negotiate', enabled=False)

    monkeypatch.setattr(ms, '_lock_market', lock)
    monkeypatch.setattr(demo, '_step', step)
    with ThreadPoolExecutor(max_workers=2) as pool:
        work = pool.submit(worker)
        try:
            assert reached.wait(8)
            stopping = pool.submit(disable)
            assert disable_started.wait(8)
            if not worker_has_lock:
                stopping.result(timeout=8)
        finally:
            release.set()
        work.result(timeout=20)
        stopping.result(timeout=20)
    with SessionLocal() as db:
        run = db.get(DemoGuarantorRun, mid)
        assert not run.enabled and run.last_error is None
        assert run.progress['_generation'] == 2
        assert db.get(GuarantorCase, mid).state == ('review' if worker_has_lock else 'invited')
        message_count = db.query(GuarantorMessage).filter_by(market_id=mid).count()
    worker_tick()
    with SessionLocal() as db:
        assert db.query(GuarantorMessage).filter_by(market_id=mid).count() == message_count
    verify(mid, conserved)

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
