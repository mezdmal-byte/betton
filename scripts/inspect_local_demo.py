"""Read-only local inventory; copies legacy SQLite before any upgrade."""
from pathlib import Path
import hashlib
import json
import sqlite3

ROOT=Path.home()/'betton'
OUT=ROOT/'.local-preserve/demo-restoration-audit'
OUT.mkdir(exist_ok=True)
paths=[ROOT/'betton-live-test.db',ROOT/'.local-preserve/pr22-d83d355/.telegram-test/betton_test_telegram.sqlite',
       ROOT/'.local-preserve/pr22-d83d355/.ux-preview/sobakapes/betton-test.sqlite']
result=[]
for path in paths:
    if not path.exists():continue
    conn=sqlite3.connect(path.resolve().as_uri()+'?mode=ro',uri=True)
    tables={r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    item={'path':str(path),'tables':len(tables),'integrity':conn.execute('pragma integrity_check').fetchone()[0],
          'schema':conn.execute('select revision from betton_schema_version').fetchone()[0] if 'betton_schema_version' in tables else 0}
    for table in ('users','markets','p2p_orders','p2p_fills','guarantor_profiles','demo_guarantor_actors','demo_environments'):
        if table in tables:item[table]=conn.execute('select count(*) from '+table).fetchone()[0]
    if 'markets' in tables:
        item['states']=dict(conn.execute('select status,count(*) from markets group by status'))
        item['legacy_demo_markets']=conn.execute("select count(*) from markets where description like '%DEMO[vasily]%' ").fetchone()[0]
    if path.name=='betton-live-test.db':
        dest=OUT/'betton-test-legacy-upgrade.sqlite'
        if not dest.exists():
            backup=sqlite3.connect(dest);conn.backup(backup);backup.close()
        item['original_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
        item['copy']=str(dest)
    conn.close();result.append(item)
(OUT/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
