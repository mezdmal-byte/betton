"""Convenient lifecycle for the existing full sandbox. No bot or tunnel access."""
import json
import logging
from logging.handlers import RotatingFileHandler
import msvcrt
import os
from pathlib import Path
import socket
import sys
import threading
import time
from urllib.request import urlopen
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
RUNTIME=ROOT/'.ux-preview/simulation-runtime'
RUNTIME.mkdir(parents=True,exist_ok=True)
STOP=RUNTIME/'stop.request'
ACTIVE=RUNTIME/'active.json'
URL='http://127.0.0.1:8877'

def lock_file():
    file=(RUNTIME/'instance.lock').open('a+b')
    if os.fstat(file.fileno()).st_size==0:file.write(b'0');file.flush()
    file.seek(0)
    return file

def main():
    action=sys.argv[1] if len(sys.argv)>1 else 'start'
    lock=lock_file()
    try:
        try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        except OSError:
            if action=='stop':
                STOP.touch()
                for _ in range(160):
                    time.sleep(.25)
                    try:
                        lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
                        print('Simulation stopped gracefully. All data preserved.');return 0
                    except OSError:pass
                print('Stop pending. Do not start a second copy.');return 1
            print('Simulation already running: '+URL+'/sandbox/scenarios');return 3
        if action=='stop':print('Simulation is already stopped.');return 0
        if action=='reset':
            if ACTIVE.exists():
                previous=json.loads(ACTIVE.read_text())
                archive=RUNTIME/('previous-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid4().hex[:6]+'.json')
                archive.write_text(json.dumps(previous,indent=2))
            folder=ROOT/'.ux-preview'/('simulation-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid4().hex[:6])
            ACTIVE.write_text(json.dumps({'state_dir':str(folder)},indent=2))
            print('New clean generation selected. Previous database preserved. Start the simulation BAT.');return 0
        with socket.socket() as sock:sock.bind(('127.0.0.1',8877))
        if not (ROOT/'frontend/dist/index.html').is_file():
            print('Frontend missing. Run install-simulation.bat.');return 2
        if not ACTIVE.exists():
            folder=ROOT/'.ux-preview'/('simulation-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid4().hex[:6])
            ACTIVE.write_text(json.dumps({'state_dir':str(folder)},indent=2))
        state=Path(json.loads(ACTIVE.read_text())['state_dir'])
        if not state.resolve().is_relative_to((ROOT/'.ux-preview').resolve()):raise RuntimeError('Unsafe simulation path')
        STOP.unlink(missing_ok=True)
        handler=RotatingFileHandler(RUNTIME/'server.log',maxBytes=2_000_000,backupCount=4,encoding='utf-8')
        logging.basicConfig(level=logging.INFO,handlers=[handler,logging.StreamHandler()],format='%(asctime)s %(levelname)s %(message)s')
        from scripts.ux_v3_preview import create_preview
        application=create_preview(state,full_demo=True)
        import uvicorn
        server=uvicorn.Server(uvicorn.Config(application,host='127.0.0.1',port=8877,
            proxy_headers=False,log_config=None,timeout_graceful_shutdown=20))
        failed=threading.Event()
        def monitor():
            deadline=time.monotonic()+90
            ready=False
            while not server.should_exit:
                if STOP.exists():server.should_exit=True;return
                if not ready:
                    try:
                        with urlopen(URL+'/ready',timeout=1) as response:data=json.load(response)
                        if data.get('schema_revision')==4:
                            ready=True;print('SIMULATION READY: '+URL+'/sandbox/scenarios',flush=True)
                            if '--open' in sys.argv:
                                import webbrowser
                                webbrowser.open(URL+'/sandbox/scenarios')
                    except Exception:
                        if time.monotonic()>deadline:
                            failed.set();server.should_exit=True;print('Readiness timeout. See .ux-preview/simulation-runtime/server.log');return
                time.sleep(.25)
        threading.Thread(target=monitor,daemon=True).start()
        print('Full local simulation. Synthetic funds only. No Telegram bot or webhook.',flush=True)
        server.run()
        return 0 if server.started and not failed.is_set() else 2
    except Exception as exc:
        print('Simulation stopped: '+str(exc)+'. No automatic restart.');return 2
    finally:lock.close()

if __name__=='__main__':sys.exit(main())
