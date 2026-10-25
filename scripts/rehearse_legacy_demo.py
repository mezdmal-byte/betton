"""Attempt supported upgrades only on the marked legacy demo audit copy."""
import json
import os
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
folder=Path.home()/'betton/.local-preserve/demo-restoration-audit'
copy=folder/'betton-test-legacy-upgrade.sqlite'
assert copy.is_file()
url='sqlite:///'+copy.as_posix()
os.environ.update(DATABASE_URL=url,BOT_TOKEN='',ADMIN_TELEGRAM_USERNAMES='')
from app.money_preflight import readonly_connection,inspect_money
from app.money_migrate import run_migration
with readonly_connection(url) as conn: report=inspect_money(conn)
(folder/'legacy-money-preflight.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
try:
    result=run_migration(url,str(folder/'legacy-copy-before-money.sqlite'))
    from app.migrations import upgrade
    from app.database import assert_money_ready
    upgrade();assert_money_ready()
    summary={'upgrade_to_schema4':True,'money_migration':result}
except Exception as exc:
    summary={'upgrade_to_schema4':False,'reason':str(exc),'error_type':type(exc).__name__}
(folder/'legacy-upgrade-result.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2,default=str),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,default=str))
