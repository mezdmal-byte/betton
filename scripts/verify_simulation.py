"""Read-only financial verification of this checkout's active full sandbox."""
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
state=Path(json.loads((ROOT/'.ux-preview/simulation-runtime/active.json').read_text())['state_dir'])
if not state.resolve().is_relative_to((ROOT/'.ux-preview').resolve()):raise RuntimeError('Unsafe sandbox path')
from scripts.ux_v3_preview import configure_process,prepare_state
_,marker=prepare_state(state,'betton-test-simulation.sqlite')
assert marker['seeded'] and marker['full_demo']
configure_process(state,full_demo=True,database_name='betton-test-simulation.sqlite')
from app.database import SessionLocal
from app.models import User,Market,P2POrder,P2PFill,DemoGuarantorActor,DemoGuarantorRun
from app.services.p2p_ledger import reconcile
from sqlalchemy import text
from app.config import ADMIN_BANKROLL,settings

with SessionLocal() as db:
    markets=db.query(Market).filter_by(mechanism='p2p').all()
    audits=[reconcile(db,m.id) for m in markets]
    bad=[a for a in audits if not a['fully_verified']]
    total=sum(u.balance_nano for u in db.query(User))+sum(m.pot_nano for m in markets)+sum(o.remaining for o in db.query(P2POrder))
    fills=db.query(P2PFill).filter_by(market_id=marker['scenarios']['history']['id']).all()
    multi=db.query(P2PFill).filter_by(market_id=marker['scenarios']['multi_fill']['id']).all()
    initial=int(marker.get('initial_test_total_nano',int((ADMIN_BANKROLL+3*settings.starting_balance+6*20000)*10**9)))
    report={'schema_revision':db.execute(text('select revision from betton_schema_version')).scalar_one(),
        'markets':len(markets),'scenario_count':len(marker['scenarios']),
        'fully_verified_markets':len(audits)-len(bad),'audit_failures':bad,
        'total_test_money_nano':str(total),'initial_test_grants_nano':str(initial),
        'conserved':total==initial,
        'automatic_guarantors':db.query(DemoGuarantorActor).count(),
        'automatic_actors_with_telegram_id':db.query(User).join(DemoGuarantorActor,User.id==DemoGuarantorActor.user_id).filter(User.telegram_id.isnot(None)).count(),
        'history_fills':len(fills),'history_distinct_times':len({f.created_at for f in fills}),
        'history_distinct_prices':len({f.price for f in fills}),'multilevel_seed_fills':len(multi),
        'foreign_key_violations':len(db.execute(text('pragma foreign_key_check')).all()),
        'controlled_errors':[r.last_error for r in db.query(DemoGuarantorRun).filter(DemoGuarantorRun.last_error.isnot(None))]}
out=ROOT/'.ux-preview/simulation-runtime/financial-audit.json'
out.write_text(json.dumps(report,ensure_ascii=False,indent=2,default=str),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,default=str))
assert not bad and report['conserved'] and not report['automatic_actors_with_telegram_id']
