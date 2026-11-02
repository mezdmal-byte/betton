"""Disposable in-process full SIM: validate creation, rich fills and idempotency."""
import asyncio,json,sys
from pathlib import Path
from uuid import uuid4
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from scripts.ux_v3_preview import create_preview
state=ROOT/'.ux-preview'/('qa-rich-'+uuid4().hex)
app=create_preview(state,full_demo=True)

async def main():
    from app.database import SessionLocal
    from app.models import Market,User,P2PFill,P2POrder,DemoGuarantorActor
    from app.services.p2p_ledger import reconcile
    from scripts.rich_simulation_pack import add_rich_scenarios
    from app.main import app as backend
    async with app.router.lifespan_context(app):
        marker=state/'ux-v3-sandbox.json';core=json.loads(marker.read_text())
        def total(db):return sum(u.balance_nano for u in db.query(User))+sum(m.pot_nano for m in db.query(Market))+sum(o.remaining for o in db.query(P2POrder))
        with SessionLocal() as db:
            initial=total(db);before={u.id:u.balance_nano for u in db.query(User) if u.id not in core['liquidity_makers']}
        import httpx
        from datetime import datetime,timedelta,timezone
        from scripts.ux_v3_preview import signed_init_data
        now=datetime.now(timezone.utc)
        payload={'request_id':str(uuid4()),'event_type':'guarantor','question':'ТЕСТ · Проверка создания с гарантом?','outcomes':['Да','Нет'],'rules':'Проверить протокол','criteria':['Подтверждено','Не подтверждено'],'resolution_method':'Тестовый протокол','guarantor_id':core['users']['guarantor'],'close_at':(now+timedelta(days=1)).isoformat(),'ends_at':None,'timing_version':'start-v1'}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=backend,client=('127.0.0.1',12345)),base_url='http://127.0.0.1:8877',headers={'Authorization':'tma '+signed_init_data('creator')}) as client:
            invalid=await client.post('/ux-v3/events',json=payload)
            assert invalid.status_code==400 and invalid.json()=={'detail':'Укажите предполагаемое завершение события'},invalid.text
            payload['ends_at']=(now+timedelta(days=2)).isoformat()
            valid=await client.post('/ux-v3/events',json=payload)
            assert valid.status_code==200,valid.text
            assert valid.json()['id']>0
        result=await add_rich_scenarios(backend,core)
        assert result['rich_history_fills']>=100,result
        again=await add_rich_scenarios(backend,core)
        assert again==result
        with SessionLocal() as db:
            assert total(db)==initial
            assert all(db.get(User,uid).balance_nano==balance for uid,balance in before.items())
            audits=[reconcile(db,row['id']) for row in result['rich_scenarios'].values()]
            assert all(a['fully_verified'] for a in audits),audits
            fills=db.query(P2PFill).filter_by(market_id=result['rich_scenarios']['rich_history']['id']).all()
            assert len({f.price for f in fills})>=4
            assert db.query(DemoGuarantorActor).count()==6
        core.update(result);core['scenarios'].update(result['rich_scenarios']);marker.write_text(json.dumps(core,ensure_ascii=False,indent=2),encoding='utf-8')
        report={'passed':True,'additional_markets':len(result['rich_scenarios']),'rich_executions':len(fills),'price_levels':len({f.price for f in fills}),'reconcile_verified':len(audits),'idempotent':True,'conserved':True,'existing_user_balances_unchanged':True,'automatic_guarantors':6,'guarantor_creation':True,'validation_error_localized':True}
        (state/'rich-report.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report));print('ISOLATED_SIM_STATE='+str(state))
if __name__=='__main__':asyncio.run(main())
