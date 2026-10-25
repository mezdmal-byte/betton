"""Read-only verification; never registers/deletes webhooks or sends messages."""
import asyncio
import json
from pathlib import Path
import sqlite3
import sys
from dotenv import dotenv_values
from aiogram import Bot
import httpx

ROOT=Path(__file__).resolve().parents[1]
runtime=ROOT/'.ux-preview/telegram-simulation-runtime'
config=Path.home()/'betton/.local-preserve/pr22-d83d355/.telegram-test/credentials.env'

async def main():
    cfg=dotenv_values(config)
    record=json.loads((runtime/'verification.json').read_text())
    backup=json.loads((runtime/'menu-backup.json').read_text())
    global_base=dotenv_values(config.with_name('last-tunnel.env'))['PUBLIC_BASE_URL']
    async with Bot(cfg['BOT_TOKEN']).context() as bot:
        webhook=await asyncio.wait_for(bot.get_webhook_info(),45)
        assert webhook.url==backup['original_webhook']
        menu=await asyncio.wait_for(bot.get_chat_menu_button(chat_id=int(cfg['ADMIN_TELEGRAM_IDS'])),45)
        if '--stopped' in sys.argv:
            assert menu.model_dump(mode='json')==backup['menu']
        else:
            assert menu.web_app.url==record['url']
        global_menu=await asyncio.wait_for(bot.get_chat_menu_button(),45)
        assert global_menu.web_app.url==global_base+'/v2/'
    if '--stopped' in sys.argv:
        print(json.dumps({'personal_menu_restored':True,'existing_webhook_unchanged':True,'global_menu_unchanged':True}))
        return
    public=record['api']
    async with httpx.AsyncClient(timeout=20) as client:
        ready=await client.get(public+'/ready')
        assert ready.status_code==200 and ready.json()['schema_revision']==4
        statuses={path:(await client.get(public+path)).status_code
            for path in ('/v2/','/simulation/','/simulation/manifest','/sandbox/session')}
        assert statuses=={'/v2/':200,'/simulation/':200,'/simulation/manifest':401,'/sandbox/session':404}
        assert (await client.post(public+'/webhook',json={})).status_code==503
    db=sqlite3.connect(Path(record['database']).as_uri()+'?mode=ro',uri=True)
    try:
        assert db.execute('select count(*) from demo_guarantor_actors').fetchone()[0]==6
        assert db.execute('select count(*) from users u join demo_guarantor_actors a on a.user_id=u.id where u.telegram_id is not null').fetchone()[0]==0
    finally:db.close()
    record.update(public_http=statuses,existing_webhook_verified_unchanged=True,global_menu_verified_unchanged=True,
        personal_menu_verified=True,no_fake_auth_routes=True,automatic_demo_guarantors=6)
    (runtime/'verification.json').write_text(json.dumps(record,indent=2))
    print(json.dumps({key:value for key,value in record.items() if key!='database'}))

try:asyncio.run(main())
except Exception as exc:
    print('Read-only Telegram verification failed: '+type(exc).__name__)
    raise SystemExit(2)
