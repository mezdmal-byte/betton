"""Full sandbox must bootstrap before users and never repeat financial seed writes."""
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
from contextlib import closing

ROOT=Path(__file__).resolve().parents[1]

def financial_snapshot(db):
    result={}
    for table in ('p2p_orders','p2p_fills','p2p_money_entries','settlement_records'):
        if db.execute("select 1 from sqlite_master where type='table' and name=?",(table,)).fetchone():
            result[table]=db.execute('select * from '+table+' order by id').fetchall()
    result['balances']=db.execute('select id,balance_nano from users order by id').fetchall()
    result['pots']=db.execute('select id,pot_nano,lock_nano from markets order by id').fetchall()
    return result

def test_full_demo_seed_and_restart_preserve_finances_and_use_real_history():
    sandbox=ROOT/'.ux-preview';sandbox.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='full-demo-test-',dir=sandbox) as folder:
        state=Path(folder)
        command=[sys.executable,'-X','utf8',str(ROOT/'scripts/ux_v3_preview.py'),
                 '--full-demo','--state-dir',str(state),'--smoke']
        env={**os.environ,'PYTHONUTF8':'1','PYTHONIOENCODING':'utf-8',
             'DATABASE_URL':'postgresql://never-connect.invalid/production',
             'BETTON_ENVIRONMENT':'production','BOT_TOKEN':'must-not-be-used'}
        first=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True,timeout=60)
        assert first.returncode==0,first.stdout+first.stderr
        marker=json.loads((state/'ux-v3-sandbox.json').read_text(encoding='utf-8'))
        assert marker['full_demo'] and len(marker['scenarios'])>=25
        with closing(sqlite3.connect(state/'betton-test-simulation.sqlite')) as db:
            assert db.execute('select revision from betton_schema_version').fetchone()==(4,)
            assert not db.execute('pragma foreign_key_check').fetchall()
            assert db.execute('select count(*) from demo_guarantor_actors').fetchone()[0]==6
            assert db.execute('select count(*) from users u join demo_guarantor_actors d on d.user_id=u.id where u.telegram_id is not null').fetchone()[0]==0
            rows=db.execute('select created_at,price from p2p_fills where market_id=?',(marker['scenarios']['history']['id'],)).fetchall()
            assert len(rows)>=4 and len({row[0] for row in rows})>=2 and len({row[1] for row in rows})>=4
            snapshot=financial_snapshot(db)
        second=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True,timeout=60)
        assert second.returncode==0,second.stdout+second.stderr
        with closing(sqlite3.connect(state/'betton-test-simulation.sqlite')) as db:
            assert financial_snapshot(db)==snapshot
