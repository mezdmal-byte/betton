"""Separate Telegram demo; changes only owner's test-bot menu, NEVER webhooks.

Real Telegram HMAC; no sandbox/session endpoints and no synthetic role login.
The financial dataset is copied only from a freshly bootstrapped full sandbox.
"""
import asyncio
import json
import logging
import msvcrt
import os
from pathlib import Path
import re
import secrets
import shutil
import socket
import sqlite3
import subprocess
import sys
import time
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
RUNTIME=ROOT/'.ux-preview/telegram-simulation-runtime'
RUNTIME.mkdir(parents=True,exist_ok=True)
STOP=RUNTIME/'stop.request'
CONFIG=Path(os.environ.get('BETTON_TELEGRAM_TEST_CONFIG',str(Path.home()/'betton/.local-preserve/pr22-d83d355/.telegram-test/credentials.env')))

def status(message):
    print(message,flush=True)
    with (RUNTIME/'launcher.log').open('a',encoding='utf-8') as file:
        file.write(time.strftime('%Y-%m-%d %H:%M:%S ')+message+'\n')

async def run():
    from dotenv import dotenv_values
    from aiogram import Bot
    from aiogram.types import MenuButtonWebApp,MenuButtonDefault,MenuButtonCommands,WebAppInfo
    cfg=dotenv_values(CONFIG)
    identity=json.loads(CONFIG.with_name('verified-identities.json').read_text(encoding='utf-8'))
    token=cfg.get('BOT_TOKEN','');owner=cfg.get('ADMIN_TELEGRAM_IDS','')
    if not owner.isascii() or not owner.isdecimal():raise RuntimeError('One verified test owner ID is required')
    owner=int(owner)
    if token.split(':')[0] in identity['protected_production_bot_ids']:raise RuntimeError('Production bot refused')
    bot=Bot(token)
    tunnel=None;server=None;previous_menu=None;public='';menu_changed=False;ready=False
    with socket.socket() as sock:sock.bind(('127.0.0.1',8882))
    try:
        me=await asyncio.wait_for(bot.get_me(),45)
        if me.username.lower()!='sobakapesbot':raise RuntimeError('Only verified SobakaPesBot is allowed')
        original_webhook=(await asyncio.wait_for(bot.get_webhook_info(),45)).url
        executable=shutil.which('cloudflared')
        if not executable:raise RuntimeError('cloudflared is missing')
        with (RUNTIME/'tunnel.log').open('w',encoding='utf-8') as file:
            tunnel=subprocess.Popen([executable,'tunnel','--protocol','http2','--edge-ip-version','4',
                '--url','http://127.0.0.1:8882'],stdout=file,stderr=file,creationflags=subprocess.CREATE_NO_WINDOW)
        deadline=time.monotonic()+180
        while time.monotonic()<deadline and not STOP.exists():
            raw=(RUNTIME/'tunnel.log').read_text(errors='replace')
            match=re.search(r'https://[a-z0-9-]+\.trycloudflare\.com',raw)
            if match and 'Registered tunnel connection' in raw:public=match.group();break
            if tunnel.poll() is not None:raise RuntimeError('Test tunnel exited')
            await asyncio.sleep(1)
        if not public:raise RuntimeError('Tunnel timeout or stop requested')
        active=RUNTIME/'active.json'
        if not active.exists():
            seed=ROOT/'.ux-preview'/('telegram-seed-'+uuid4().hex)
            command=[sys.executable,'-X','utf8',str(ROOT/'scripts/ux_v3_preview.py'),
                '--full-demo','--state-dir',str(seed),'--smoke']
            result=await asyncio.to_thread(subprocess.run,command,cwd=ROOT,capture_output=True,text=True,timeout=90)
            if result.returncode:raise RuntimeError('Full demo bootstrap failed; original databases unchanged')
            state=ROOT/'.ux-preview'/('telegram-simulation-'+uuid4().hex)
            state.mkdir()
            with sqlite3.connect((seed/'betton-test-simulation.sqlite').as_uri()+'?mode=ro',uri=True) as source:
                with sqlite3.connect(state/'betton-test-simulation.sqlite') as target:source.backup(target)
            shutil.copy2(seed/'ux-v3-sandbox.json',state/'fixture-manifest.json')
            active.write_text(json.dumps({'state_dir':str(state)},indent=2))
        state=Path(json.loads(active.read_text())['state_dir'])
        if not state.resolve().is_relative_to((ROOT/'.ux-preview').resolve()):raise RuntimeError('Unsafe demo state path')
        # No inherited production settings and no production .env discovery.
        for key in list(os.environ):
            if key.upper().startswith(('BOT_','TELEGRAM_','ADMIN_','DATABASE_','RENDER_','BETTON_','PANDASCORE_')):
                del os.environ[key]
        os.environ.update(DATABASE_URL='sqlite:///'+(state/'betton-test-simulation.sqlite').as_posix(),
            BOT_TOKEN=token,TELEGRAM_BOT_USERNAME=me.username,ADMIN_TELEGRAM_IDS=str(owner),
            ADMIN_TELEGRAM_USERNAMES='',PUBLIC_BASE_URL=public,MINI_APP_URL=public+'/v2/',
            BETTON_ENVIRONMENT='test',BETTON_DEMO_AUTOMATION='true',BETTON_PREVIEW_SEED='false',
            TELEGRAM_WEBHOOK_SECRET=secrets.token_urlsafe(36),ALLOW_UNKEYED_LEGACY_BUY='false',STARTING_BALANCE='1000')
        os.chdir(state)
        from app.main import app
        from app.database import SessionLocal,assert_money_ready
        from app.migrations import assert_schema_ready
        from app.services import demo_guarantors as demo,market_service as ms
        from app.telegram_auth import get_current_user
        from fastapi import Depends,HTTPException
        from fastapi.responses import HTMLResponse,Response
        from app.models import User
        from app.database import get_db
        from sqlalchemy.orm import Session
        assert_schema_ready();assert_money_ready()
        with SessionLocal() as db:demo.require_demo(db)
        @app.middleware('http')
        async def no_webhook(request,call_next):
            if request.url.path=='/webhook':return Response(status_code=503)
            return await call_next(request)
        @app.get('/simulation/')
        def tools():
            html=(ROOT/'scripts/telegram_simulation_tools.html').read_text(encoding='utf-8')
            return HTMLResponse(html,headers={'Cache-Control':'no-store'})
        @app.get('/simulation/tools.js')
        def tools_js():
            return Response((ROOT/'scripts/telegram_simulation_tools.js').read_text(encoding='utf-8'),media_type='text/javascript')
        @app.get('/simulation/manifest')
        def manifest(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
            ms.require_admin(user);demo.require_demo(db)
            return json.loads((state/'fixture-manifest.json').read_text(encoding='utf-8'))
        import uvicorn
        server=uvicorn.Server(uvicorn.Config(app,host='127.0.0.1',port=8882,log_level='critical',timeout_graceful_shutdown=20))
        async def controls():
            nonlocal previous_menu,menu_changed,ready
            import httpx
            try:
                async with httpx.AsyncClient(timeout=8) as client:
                    deadline=time.monotonic()+120
                    while time.monotonic()<deadline and not STOP.exists():
                        try:
                            ready=await client.get(public+'/ready')
                            if ready.status_code==200 and ready.json().get('schema_revision')==4:break
                        except Exception:pass
                        await asyncio.sleep(2)
                    else:raise RuntimeError('Public readiness timeout')
                if (await asyncio.wait_for(bot.get_webhook_info(),45)).url!=original_webhook:
                    raise RuntimeError('Existing webhook changed externally; stopping without touching it')
                previous_menu=await asyncio.wait_for(bot.get_chat_menu_button(chat_id=owner),45)
                backup_file=RUNTIME/'menu-backup.json'
                if backup_file.exists():
                    saved=json.loads(backup_file.read_text())
                    if saved.get('demo_menu_url')==getattr(getattr(previous_menu,'web_app',None),'url',None):
                        menu_class={'web_app':MenuButtonWebApp,'commands':MenuButtonCommands,'default':MenuButtonDefault}[saved['menu']['type']]
                        previous_menu=menu_class.model_validate(saved['menu'])
                backup={'owner_id':owner,'menu':previous_menu.model_dump(mode='json'),'original_webhook':original_webhook,
                        'demo_menu_url':public+'/simulation/'}
                (RUNTIME/'menu-backup.json').write_text(json.dumps(backup,indent=2))
                menu_changed=True  # Also restore after an uncertain/lost Bot API response.
                await asyncio.wait_for(bot.set_chat_menu_button(chat_id=owner,menu_button=MenuButtonWebApp(
                    text='BetTON SIM',web_app=WebAppInfo(url=public+'/simulation/'))),45)
                ready=True
                report={'test_bot':me.username,'url':public+'/simulation/','api':public,
                    'database':str(state/'betton-test-simulation.sqlite'),'schema_revision':4,
                    'webhook_unchanged':(await asyncio.wait_for(bot.get_webhook_info(),45)).url==original_webhook,
                    'menu_scope':'verified_owner_chat_only','real_telegram_webview_verified':False}
                (RUNTIME/'verification.json').write_text(json.dumps(report,indent=2))
                status('TELEGRAM SIM READY: @'+me.username+' -> personal menu BetTON SIM; '+public+'/simulation/')
                while not STOP.exists() and tunnel.poll() is None and not server.should_exit:await asyncio.sleep(.5)
            except Exception as exc:status('Telegram demo setup stopped: '+type(exc).__name__+'. No automatic restart.')
            finally:server.should_exit=True
        task=asyncio.create_task(controls())
        try:await server.serve()
        finally:task.cancel();await asyncio.gather(task,return_exceptions=True)
        if not ready:raise RuntimeError('Telegram simulation did not become ready')
    finally:
        if menu_changed and previous_menu:
            try:
                current=await asyncio.wait_for(bot.get_chat_menu_button(chat_id=owner),20)
                if getattr(getattr(current,'web_app',None),'url',None)==public+'/simulation/':
                    await asyncio.wait_for(bot.set_chat_menu_button(chat_id=owner,menu_button=previous_menu),20)
                    status('Previous personal test-bot menu restored. Webhook never modified.')
            except Exception:status('Menu restore pending: network unavailable. Saved menu-backup.json preserved.')
        await bot.session.close()
        if tunnel and tunnel.poll() is None:
            tunnel.terminate()
            try:tunnel.wait(timeout=10)
            except subprocess.TimeoutExpired:tunnel.kill();tunnel.wait()

def main():
    action=sys.argv[1] if len(sys.argv)>1 else 'start'
    if action=='stop':
        STOP.touch();status('Telegram simulation stop requested.')
        with (RUNTIME/'instance.lock').open('a+b') as file:
            if os.fstat(file.fileno()).st_size==0:file.write(b'0');file.flush()
            deadline=time.monotonic()+60
            while time.monotonic()<deadline:
                try:
                    file.seek(0);msvcrt.locking(file.fileno(),msvcrt.LK_NBLCK,1)
                    status('Telegram demo stopped; owned tunnel closed. See launcher.log for menu restore result.');return 0
                except OSError:time.sleep(.25)
        status('Stop pending while requests finish. No forced termination.');return 1
    with (RUNTIME/'instance.lock').open('a+b') as lock:
        if os.fstat(lock.fileno()).st_size==0:lock.write(b'0');lock.flush()
        lock.seek(0)
        try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        except OSError:status('Telegram simulation already running.');return 3
        if action=='reset':
            active=RUNTIME/'active.json'
            if active.exists():
                shutil.copy2(active,RUNTIME/('previous-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid4().hex[:6]+'.json'))
                active.unlink()  # Only the pointer; previous databases are never deleted.
            status('New Telegram demo generation will be created on next start. Previous database retained.')
            return 0
        STOP.unlink(missing_ok=True)
        logging.basicConfig(level=logging.CRITICAL)
        try:asyncio.run(run());return 0
        except KeyboardInterrupt:return 0
        except Exception as exc:status('Telegram simulation error: '+type(exc).__name__+'. No automatic restart.');return 2

if __name__=='__main__':sys.exit(main())
