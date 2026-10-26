"""Standalone loopback Admin Center over a fresh SQLite online snapshot only."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import secrets
import socket
import sqlite3
import time
from uuid import uuid4

ROOT=Path(__file__).resolve().parents[1]
RUNTIME=ROOT/'.ux-preview/admin-center-runtime'
DEFAULT_MANIFEST=Path.home()/'.codex/worktrees/betton-demo-restoration/betton/.ux-preview/telegram-simulation-runtime/active.json'


def snapshot(source_manifest:Path, destination:Path)->dict:
    manifest=source_manifest.resolve(strict=True)
    if manifest.name!='active.json' or manifest.parent.name not in ('telegram-simulation-runtime','simulation-runtime'):
        raise ValueError('Select the active.json of an isolated BetTON simulator')
    allowed=manifest.parent.parent.resolve()
    state=Path(json.loads(manifest.read_text(encoding='utf-8'))['state_dir']).resolve(strict=True)
    if not state.is_relative_to(allowed): raise ValueError('Simulation state escapes its workspace')
    source=(state/'betton-test-simulation.sqlite').resolve(strict=True)
    if not source.is_relative_to(allowed) or not source.is_file(): raise ValueError('Unsafe source database')
    destination=destination.resolve()
    if destination.exists() or not destination.is_relative_to((ROOT/'.ux-preview').resolve()):
        raise ValueError('Snapshot must be a new file inside this workspace .ux-preview')
    destination.parent.mkdir(parents=True,exist_ok=True)
    with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src:
        src.execute('PRAGMA query_only=ON')
        if src.execute('SELECT version FROM demo_environment WHERE id=1').fetchone()!=(1,):
            raise ValueError('Source is not a marked demo database')
        if src.execute('SELECT revision FROM betton_schema_version').fetchone()!=(4,):
            raise ValueError('Schema 4 is required; Admin Center never migrates data')
        with sqlite3.connect(destination) as dst: src.backup(dst)
    with sqlite3.connect(destination.as_uri()+'?mode=ro',uri=True) as db:
        if db.execute('PRAGMA integrity_check').fetchone()!=('ok',): raise ValueError('Snapshot integrity failed')
        counts={name:db.execute('SELECT count(*) FROM '+name).fetchone()[0]
                for name in ('users','markets','p2p_orders','p2p_fills','p2p_money_entries')}
    return {'snapshot':str(destination),'schema_revision':4,'counts':counts,
            'created_at':time.strftime('%Y-%m-%d %H:%M:%S'),'read_only':True}


def main(argv=None):
    parser=argparse.ArgumentParser(description='Snapshot-only local BetTON Admin Center')
    parser.add_argument('action',choices=['start','stop','snapshot'],nargs='?',default='start')
    parser.add_argument('--source-manifest',type=Path,default=DEFAULT_MANIFEST)
    parser.add_argument('--port',type=int,default=8885)
    args=parser.parse_args(argv)
    if not 1024<=args.port<=65535: parser.error('Use an unprivileged local port')
    RUNTIME.mkdir(parents=True,exist_ok=True)
    stop=RUNTIME/'stop.request'
    if args.action=='stop':
        stop.touch();print('Admin stop requested. Only this snapshot viewer is affected.');return 0
    import msvcrt
    lock=(RUNTIME/'instance.lock').open('a+b')
    if os.fstat(lock.fileno()).st_size==0:lock.write(b'0');lock.flush()
    lock.seek(0)
    try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
    except OSError:
        lock.close();print('Admin Center already running. No duplicate process started.');return 3
    try:
        with socket.socket() as probe:probe.bind(('127.0.0.1',args.port))
        path=RUNTIME/('snapshot-'+time.strftime('%Y%m%d-%H%M%S')+'-'+uuid4().hex[:8]+'.sqlite')
        metadata=snapshot(args.source_manifest,path)
        (RUNTIME/'snapshot.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
        if args.action=='snapshot':print('Read-only snapshot prepared. Original simulation is unchanged.');return 0
        from admin_center.security import make_password_hash
        from admin_center.store import read_only_engine
        from admin_center.app import create_app
        access=RUNTIME/'access.json'
        if access.exists():credentials=json.loads(access.read_text(encoding='utf-8'))
        else:
            credentials={'username':'local-owner','password':secrets.token_urlsafe(24)}
            with access.open('x',encoding='utf-8') as file:json.dump(credentials,file,indent=2)
        engine=read_only_engine('sqlite:///'+path.as_posix())
        app=create_app(engine=engine,username=credentials['username'],
                       password_hash=make_password_hash(credentials['password']))
        import threading,uvicorn
        server=uvicorn.Server(uvicorn.Config(app,host='127.0.0.1',port=args.port,
            proxy_headers=False,access_log=False,server_header=False,timeout_graceful_shutdown=15))
        stop.unlink(missing_ok=True)
        def monitor():
            while not server.should_exit:
                if stop.exists():server.should_exit=True;return
                time.sleep(.25)
        threading.Thread(target=monitor,daemon=True).start()
        print(f'Admin Center: http://127.0.0.1:{args.port}; READ-ONLY SNAPSHOT ONLY.',flush=True)
        print('Local login/password: .ux-preview/admin-center-runtime/access.json (never share or commit).',flush=True)
        print('Stop: stop-admin-simulation.bat. Each new start preserves the previous snapshot.',flush=True)
        try:server.run()
        finally:engine.dispose()
        return 0 if server.started else 2
    except Exception as exc:
        # No raw SQL, connection strings, credentials or source contents in logs.
        print('Admin Center stopped: '+type(exc).__name__+'. Check local demo manifest/schema and port; no restart.');return 2
    finally:lock.close()


if __name__=='__main__':raise SystemExit(main())
