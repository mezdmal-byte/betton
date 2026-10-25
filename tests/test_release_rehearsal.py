"""Full synthetic schema-3 backup, restore, schema-4 upgrade and rollback rehearsal."""
from contextlib import contextmanager
from datetime import datetime, timedelta
import json
import sqlite3
import uuid

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session
from app.database import engine as suite_engine, enforce_sqlite_foreign_keys
from app.migrations import upgrade, assert_schema_ready, event_intents
from app.migrations.baseline import upgrade as baseline
from app.money_migrate import fingerprint, verified_backup, _pg_tool
from app.models import User, Market, MarketStatus, P2POrder, P2PFill, P2PMoneyEntry, Position, SettlementRecord
from app.services import p2p_service as p2p, p2p_ledger as ledger


@contextmanager
def disposable(tmp_path, label):
    admin=None
    if suite_engine.dialect.name=='postgresql':
        parsed=suite_engine.url
        name='betton_test_release_'+label+'_'+uuid.uuid4().hex
        admin=create_engine(parsed.set(database='postgres'),isolation_level='AUTOCOMMIT')
        with admin.connect() as conn: conn.exec_driver_sql(f'CREATE DATABASE "{name}"')
        url=parsed.set(database=name)
    else: url=make_url('sqlite:///'+str(tmp_path/(label+'.db')))
    db=create_engine(url); enforce_sqlite_foreign_keys(db)
    try: yield url,db
    finally:
        db.dispose()
        if admin:
            with admin.connect() as conn: conn.exec_driver_sql(f'DROP DATABASE "{name}"')
            admin.dispose()


def financial_snapshot(db):
    with db.connect() as conn:
        return {model.__tablename__:json.dumps([dict(r) for r in conn.execute(text('SELECT * FROM '+model.__tablename__+' ORDER BY id')).mappings()],default=str,sort_keys=True)
                for model in [User,Market,P2POrder,P2PFill,P2PMoneyEntry,Position,SettlementRecord]}


def test_full_backup_restore_upgrade_and_rollback_on_synthetic_database(tmp_path):
    with disposable(tmp_path,'source') as (url,db):
        with db.begin() as conn:
            baseline(conn)
            if db.dialect.name=='postgresql': conn.exec_driver_sql('ALTER TABLE users ALTER COLUMN telegram_id TYPE BIGINT')
            event_intents.upgrade(conn)
            conn.exec_driver_sql('CREATE TABLE betton_schema_version(id INTEGER PRIMARY KEY,revision INTEGER NOT NULL)')
            conn.exec_driver_sql('INSERT INTO betton_schema_version VALUES(1,3)')
        with Session(db,autoflush=False) as session:
            a=User(username='release_actor_a',telegram_id=10001,balance=1000)
            b=User(username='release_actor_b',telegram_id=10002,balance=1000)
            session.add_all([a,b]);session.flush()
            market=Market(question='Synthetic release rehearsal',creator_id=a.id,category='unique',outcomes=['A','B'],q=[0,0],q_yes=0,q_no=0,b=1,mechanism='p2p',status=MarketStatus.open,pot=0,lock_ton=0,lock_returned=True,close_at=datetime.now()+timedelta(days=7),p2p_journal_coverage='full')
            session.add(market);session.commit()
            uid=a.id
            mid=market.id
            p2p.place(session,mid,a.id,0,100,2,'limit','release-maker-1')
            p2p.place(session,mid,b.id,1,40,2,'limit','release-taker-1')
            assert ledger.reconcile(session,mid)['fully_verified']
        before=financial_snapshot(db)
        with db.connect() as conn: digest=fingerprint(conn)
        backup=tmp_path/'release-before.backup'
        with verified_backup(url,backup) as restored_digest: assert restored_digest==digest
        assert backup.stat().st_size>0
        upgrade(db);upgrade(db);assert_schema_ready(db)
        assert financial_snapshot(db)==before
        with Session(db,autoflush=False) as session:
            assert ledger.reconcile(session,mid)['fully_verified']
            p2p.place(session,mid,uid,0,100,2,'limit','release-maker-1')
        assert financial_snapshot(db)==before
        # Rollback is restore of the backup into a NEW database, never destructive overwrite.
        with disposable(tmp_path,'restore') as (restore_url,restored):
            if restored.dialect.name=='sqlite':
                restored.dispose()
                with sqlite3.connect(backup) as source, sqlite3.connect(restore_url.database) as target: source.backup(target)
            else:
                _pg_tool(['pg_restore','--no-owner','--no-acl','--exit-on-error','--dbname',restore_url.database,str(backup)],restore_url)
            with restored.connect() as conn:
                assert fingerprint(conn)==digest
                assert conn.exec_driver_sql('SELECT revision FROM betton_schema_version').scalar_one()==3
            assert financial_snapshot(restored)==before
            upgrade(restored);assert_schema_ready(restored)
            with Session(restored,autoflush=False) as session: assert ledger.reconcile(session,mid)['fully_verified']
            assert financial_snapshot(restored)==before
            with Session(restored,autoflush=False) as session:
                original_balance=session.get(User,uid).balance_nano
                created=p2p.place(session,mid,uid,0,10,2,'limit','release-after-restore')
                assert created['request_id']=='release-after-restore'
                assert session.get(User,uid).balance_nano==original_balance-10*10**9
                assert ledger.reconcile(session,mid)['fully_verified']
