from pathlib import Path
import hashlib
import json
import sqlite3

import pytest

from admin_center import simulation
from admin_center.store import redact_snapshot
from admin_center.store import read_only_engine
from sqlalchemy.engine import URL
from sqlalchemy import text
from tests.test_admin_center import admin, fixture_db


def test_snapshot_is_consistent_readonly_and_requires_marked_schema4(tmp_path,monkeypatch):
    monkeypatch.setattr(simulation,'ROOT',tmp_path/'admin')
    sandbox=tmp_path/'sim/.ux-preview'
    state=sandbox/'telegram-simulation-test'
    state.mkdir(parents=True)
    source=state/'betton-test-simulation.sqlite'
    writer=sqlite3.connect(source)
    writer.execute('PRAGMA journal_mode=WAL')
    writer.executescript('CREATE TABLE demo_environment(id INTEGER,version INTEGER); INSERT INTO demo_environment VALUES(1,1); CREATE TABLE betton_schema_version(revision INTEGER); INSERT INTO betton_schema_version VALUES(4);')
    for name in ('users','markets','p2p_orders','p2p_fills','p2p_money_entries'):
        writer.execute('CREATE TABLE '+name+' (id INTEGER PRIMARY KEY)')
    writer.execute('INSERT INTO users VALUES(1)');writer.commit()
    runtime=sandbox/'telegram-simulation-runtime';runtime.mkdir()
    manifest=runtime/'active.json';manifest.write_text(json.dumps({'state_dir':str(state)}))
    before={p.name:hashlib.sha256(p.read_bytes()).digest() for p in state.iterdir() if not p.name.endswith('-shm')}
    target=tmp_path/'admin/.ux-preview/snapshot.sqlite'
    info=simulation.snapshot(manifest,target)
    assert info['counts']['users']==1 and info['schema_revision']==4
    assert before=={p.name:hashlib.sha256(p.read_bytes()).digest() for p in state.iterdir() if not p.name.endswith('-shm')}
    with pytest.raises(ValueError):simulation.snapshot(manifest,target)
    with pytest.raises(ValueError):simulation.snapshot(manifest,tmp_path/'outside.sqlite')
    writer.execute('UPDATE betton_schema_version SET revision=3');writer.commit()
    with pytest.raises(ValueError,match='Schema 4'):simulation.snapshot(manifest,tmp_path/'admin/.ux-preview/old.sqlite')
    writer.close()


def test_schema4_sections_are_authenticated_read_only_and_redact_private_tokens(admin,fixture_db):
    c,auth,_=admin
    with sqlite3.connect(fixture_db) as db:
        db.executescript('''CREATE TABLE guarantor_profiles(user_id INTEGER PRIMARY KEY,status TEXT,bio TEXT,topics TEXT,available_until TEXT,last_seen_at TEXT);
        CREATE TABLE event_revisions_v3(id INTEGER PRIMARY KEY,market_id INTEGER,revision INTEGER,actor_id INTEGER,kind TEXT,snapshot TEXT,created_at TEXT);
        CREATE TABLE guarantor_messages(id INTEGER PRIMARY KEY,market_id INTEGER,user_id INTEGER,kind TEXT,text TEXT,created_at TEXT);
        CREATE TABLE demo_guarantor_runs(market_id INTEGER PRIMARY KEY,actor_id INTEGER,enabled INTEGER,scenario TEXT,next_at TEXT,last_error TEXT);
        CREATE TABLE betton_schema_version(revision INTEGER); INSERT INTO betton_schema_version VALUES(4);
        INSERT INTO guarantor_profiles VALUES(24,'approved','Test profile','Test',NULL,NULL);
        INSERT INTO event_revisions_v3 VALUES(1,42,1,18,'created','{"rules":"Keep readable","share_token":"PRIVATE","nested":{"password":"PRIVATE"}}','2026-10-26');
        INSERT INTO guarantor_messages VALUES(1,42,24,'message','Test question','2026-10-26');
        INSERT INTO demo_guarantor_runs VALUES(42,24,0,'winner_0',NULL,'Controlled error');''')
    before=hashlib.sha256(fixture_db.read_bytes()).digest()
    for section in ('guarantors','cases','revisions','messages','demo-runs'):
        url='/api/inspect/'+section
        assert c.get(url).status_code==401
        response=c.get(url,headers=auth)
        assert response.status_code==200,response.text
        assert len(response.json()['items'])==1
        assert c.post(url,headers=auth,json={}).status_code==405
    revision=c.get('/api/inspect/revisions/1',headers=auth).json()['snapshot']
    assert revision['rules']=='Keep readable' and revision['share_token']=='[redacted]'
    assert revision['nested']['password']=='[redacted]'
    assert c.get('/api/database-status',headers=auth).json()['schema_revision']==4
    assert c.get('/api/inspect/revisions?market_id=999',headers=auth).json()['items']==[]
    assert c.get('/api/inspect/revisions?limit=101',headers=auth).status_code==422
    assert c.get('/api/reconciliation').status_code==401
    assert c.post('/api/reconciliation',headers=auth).status_code==405
    assert hashlib.sha256(fixture_db.read_bytes()).digest()==before


def test_redaction_does_not_destroy_nonsecret_nested_text():
    assert redact_snapshot({'rules':'Evidence','list':['Yes','No'],'auth_token':'SECRET'})=={
        'rules':'Evidence','list':['Yes','No'],'auth_token':'[redacted]'}


def test_readonly_url_roundtrip_handles_windows_drive_and_encoded_path(fixture_db):
    url=URL.create('sqlite',database=str(fixture_db)).render_as_string(hide_password=False)
    engine=read_only_engine(url)
    try:
        with engine.connect() as conn:
            assert conn.execute(text('SELECT count(*) FROM users')).scalar()==2
    finally:engine.dispose()
