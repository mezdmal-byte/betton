import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys

import pytest
from sqlalchemy import create_engine

from app.financial_diagnostics import inspect_connection, inspect_database
from scripts.financial_diagnostics import main


def fixture(path, *, revision=4, legacy=False):
    db=sqlite3.connect(path)
    db.executescript('''
        CREATE TABLE users(id INTEGER PRIMARY KEY, balance REAL, balance_nano INTEGER, display_name TEXT);
        CREATE TABLE markets(id INTEGER PRIMARY KEY, creator_id INTEGER REFERENCES users(id),
            mechanism TEXT, status TEXT, pot REAL, lock_ton REAL, pot_nano INTEGER, lock_nano INTEGER,
            p2p_journal_coverage TEXT, question TEXT);
        CREATE TABLE p2p_orders(id INTEGER PRIMARY KEY, market_id INTEGER REFERENCES markets(id),
            user_id INTEGER REFERENCES users(id), request_id TEXT, amount INTEGER, filled INTEGER,
            remaining INTEGER, refunded INTEGER);
        CREATE TABLE p2p_fills(id INTEGER PRIMARY KEY, market_id INTEGER REFERENCES markets(id),
            maker_order_id INTEGER REFERENCES p2p_orders(id), taker_order_id INTEGER REFERENCES p2p_orders(id),
            maker_user_id INTEGER REFERENCES users(id), taker_user_id INTEGER REFERENCES users(id),
            maker_stake INTEGER, taker_stake INTEGER);
        CREATE TABLE p2p_money_entries(id INTEGER PRIMARY KEY, entry_key TEXT, market_id INTEGER REFERENCES markets(id),
            order_id INTEGER, fill_id INTEGER, op_type TEXT, amount INTEGER, from_kind TEXT, to_kind TEXT,
            from_user_id INTEGER, to_user_id INTEGER, from_order_id INTEGER, to_order_id INTEGER);
        CREATE TABLE settlement_records(id INTEGER PRIMARY KEY, market_id INTEGER REFERENCES markets(id),
            user_id INTEGER REFERENCES users(id), payout REAL);
        INSERT INTO users VALUES(1,90,90000000000,'PRIVATE NAME'),(2,90,90000000000,'PRIVATE OTHER');
        INSERT INTO markets VALUES(1,1,'p2p','open',20,0,20000000000,0,'full','PRIVATE QUESTION');
        INSERT INTO p2p_orders VALUES(1,1,1,'PRIVATE REQUEST A',10000000000,10000000000,0,0),
            (2,1,2,'PRIVATE REQUEST B',10000000000,10000000000,0,0);
        INSERT INTO p2p_fills VALUES(1,1,1,2,1,2,10000000000,10000000000);
        INSERT INTO p2p_money_entries VALUES
            (1,'reserve:1',1,1,NULL,'reserve',10000000000,'user_balance','order_reserve',1,1,NULL,1),
            (2,'reserve:2',1,2,NULL,'reserve',10000000000,'user_balance','order_reserve',2,2,NULL,2),
            (3,'fill:1:maker',1,1,1,'fill_escrow',10000000000,'order_reserve','market_pot',1,NULL,1,NULL),
            (4,'fill:1:taker',1,2,1,'fill_escrow',10000000000,'order_reserve','market_pot',2,NULL,2,NULL);
    ''')
    if legacy:
        db.executescript('ALTER TABLE users DROP COLUMN balance_nano; ALTER TABLE markets DROP COLUMN pot_nano; ALTER TABLE markets DROP COLUMN lock_nano;')
    else:
        db.execute('CREATE TABLE betton_schema_version(revision INTEGER)')
        db.execute('INSERT INTO betton_schema_version VALUES(?)',(revision,))
    db.commit();db.close()
    return path


def mutate(path, sql):
    with sqlite3.connect(path) as db:db.executescript(sql)


def codes(report):
    return {item['code'] for item in report['findings']}


@pytest.mark.parametrize('revision',[3,4])
def test_clean_current_snapshot_exact_inventory_and_no_false_certification(tmp_path,revision):
    path=fixture(tmp_path/'test.sqlite',revision=revision)
    mutate(path,'UPDATE users SET balance_nano=9007199254740993 WHERE id=1')
    before=hashlib.sha256(path.read_bytes()).hexdigest()
    report=inspect_database(path)
    assert report['schema_revision']==revision
    assert report['status']=='checks_passed' and report['exit_code']==0
    assert report['inventory_nano']['users.balance_nano']['nano']==str(9007199254740993+90000000000)
    assert report['inventory_nano']['p2p_orders.remaining']['nano']=='0'
    assert not any(item['classification']=='proven_anomaly' for item in report['findings'])
    assert 'balance_baseline_unavailable' in codes(report)
    assert 'settlement_authority_requires_core_reconciliation' in codes(report)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==before


@pytest.mark.parametrize('sql,expected',[
    ('UPDATE p2p_orders SET amount=amount+1 WHERE id=1','order_amount_identity'),
    ('UPDATE markets SET pot_nano=0','pot_conservation_mismatch'),
    ('UPDATE p2p_fills SET maker_user_id=2','fill_order_party_mismatch'),
    ('UPDATE p2p_orders SET user_id=999 WHERE id=1','orphan_reference'),
    ('UPDATE p2p_money_entries SET from_kind="market_pot" WHERE id=1','journal_direction'),
    ('UPDATE p2p_money_entries SET from_user_id=2 WHERE id=1','journal_order_party'),
    ('UPDATE p2p_money_entries SET from_user_id=2 WHERE id=3','journal_fill_party'),
    ('UPDATE p2p_money_entries SET fill_id=NULL WHERE id=3','journal_fill_party'),
    ('UPDATE users SET balance_nano=-1 WHERE id=1','invalid_integer_amount'),
    ('UPDATE p2p_orders SET amount="not a number" WHERE id=1','invalid_integer_amount'),
    ('INSERT INTO settlement_records VALUES(1,1,1,2),(2,1,1,2)','duplicate_identity'),
    ('INSERT INTO p2p_money_entries SELECT 5,entry_key,market_id,order_id,fill_id,op_type,amount,from_kind,to_kind,from_user_id,to_user_id,from_order_id,to_order_id FROM p2p_money_entries WHERE id=1','duplicate_identity'),
])
def test_proven_corruptions_are_critical_and_source_untouched(tmp_path,sql,expected):
    path=fixture(tmp_path/'corrupt.sqlite');mutate(path,sql)
    before=hashlib.sha256(path.read_bytes()).hexdigest()
    report=inspect_database(path,details=True)
    assert report['exit_code']==1 and report['status']=='critical'
    assert expected in codes(report)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==before


def test_incomplete_history_is_not_invented_and_missing_full_journal_is_critical(tmp_path):
    path=fixture(tmp_path/'incomplete.sqlite')
    mutate(path,"DELETE FROM p2p_money_entries; UPDATE markets SET p2p_journal_coverage='incomplete'")
    report=inspect_database(path)
    assert report['status']=='incomplete' and report['exit_code']==0
    assert 'journal_history_incomplete' in codes(report)
    assert not any(item['classification']=='proven_anomaly' for item in report['findings'])
    mutate(path,"UPDATE markets SET p2p_journal_coverage='full'")
    assert inspect_database(path)['exit_code']==1


def test_legacy_uses_existing_preflight_and_reports_proven_pot_conflict(tmp_path):
    path=fixture(tmp_path/'legacy.sqlite',legacy=True)
    report=inspect_database(path)
    assert report['schema_revision']==0
    assert report['exit_code']==0
    mutate(path,"UPDATE markets SET status='closed',pot=0")
    report=inspect_database(path)
    assert report['exit_code']==1
    assert 'legacy_p2p_pot_mismatch' in codes(report)


def test_unversioned_dual_storage_does_not_guess_which_historical_value_is_authoritative(tmp_path):
    path=fixture(tmp_path/'unversioned.sqlite')
    mutate(path,'DROP TABLE betton_schema_version; UPDATE markets SET pot=0')
    report=inspect_database(path)
    assert report['status']=='incomplete' and report['exit_code']==0
    assert 'storage_authority_unversioned' in codes(report)
    assert {'classification':'unknown','code':'legacy_p2p_pot_mismatch','count':1} in report['findings']


def test_export_is_aggregate_and_details_never_include_arbitrary_source_text(tmp_path,capsys):
    path=fixture(tmp_path/'private.sqlite')
    mutate(path,'UPDATE p2p_orders SET amount=amount+1 WHERE id=1')
    for detailed in (False,True):
        content=json.dumps(inspect_database(path,details=detailed))
        assert 'PRIVATE' not in content and str(path) not in content
        if not detailed:
            assert 'row_id' not in content and 'market_id' not in content and 'user_id' not in content
    output=tmp_path/'anonymous.json'
    assert main([str(path),'--output',str(output)])==1
    assert 'details' not in json.loads(output.read_text())
    assert main([str(path),'--output',str(output)])==2
    assert main([str(path),'--output',str(path)])==2


def test_missing_source_not_created_and_writable_connection_refused(tmp_path):
    path=tmp_path/'missing.sqlite'
    assert main([str(path)])==2 and not path.exists()
    path=fixture(path)
    engine=create_engine('sqlite:///'+path.as_posix())
    try:
        with engine.connect() as conn:
            with pytest.raises(ValueError,match='query_only'):inspect_connection(conn)
    finally:engine.dispose()


def test_diagnostic_import_does_not_load_app_or_environment(tmp_path):
    path=fixture(tmp_path/'test.sqlite')
    root=Path(__file__).resolve().parents[1]
    script="from app.financial_diagnostics import inspect_database; import sys; r=inspect_database(sys.argv[1]); assert not any(x in sys.modules for x in ('app.config','app.database','app.models','app.main')); assert r['exit_code']==0; print('clean')"
    environment={**os.environ,'DATABASE_URL':'postgresql://private:secret@never-connect.invalid/production','BOT_TOKEN':'PRIVATE SECRET',
                 'PYTHONPATH':str(root),'PYTHONDONTWRITEBYTECODE':'1'}
    result=subprocess.run([sys.executable,'-c',script,str(path)],cwd=tmp_path,env=environment,capture_output=True,text=True,timeout=20)
    assert result.returncode==0,result.stderr
    assert result.stdout.strip()=='clean'
