"""Preserve the active SIM generation and add the rich pack after an online backup."""
import argparse, asyncio, json, socket, sqlite3, sys
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runtime',choices=['simulation','telegram-simulation'],default='simulation')
    args=parser.parse_args()
    for port in [8882 if args.runtime=='telegram-simulation' else 8877]:
        with socket.socket() as sock:
            sock.settimeout(.2)
            if sock.connect_ex(('127.0.0.1',port))==0:raise RuntimeError('Stop the test SIM before enrichment; do not run duplicate processes')
    runtime=ROOT/'.ux-preview'/(args.runtime+'-runtime')
    lock=None
    if sys.platform=='win32':
        import msvcrt
        lock=(runtime/'instance.lock').open('a+b')
        if lock.seek(0,2)==0:lock.write(b'0');lock.flush()
        lock.seek(0)
        try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
        except OSError:raise RuntimeError('SIM launcher is running; stop it before enrichment')
    pointer=json.loads((runtime/'active.json').read_text(encoding='utf-8'))
    state=Path(pointer['state_dir']).resolve()
    if not state.is_relative_to((ROOT/'.ux-preview').resolve()):raise RuntimeError('Unsafe SIM state path')
    marker=state/('fixture-manifest.json' if args.runtime=='telegram-simulation' else 'ux-v3-sandbox.json');data=json.loads(marker.read_text(encoding='utf-8'))
    from scripts.ux_v3_preview import MARKER_KIND
    if data.get('kind')!=MARKER_KIND or data.get('database')!='betton-test-simulation.sqlite':raise RuntimeError('Unrecognized SIM manifest')
    if not data.get('seeded') or not data.get('full_demo'):raise RuntimeError('A seeded full SIM is required; no generation was created or reset')
    database=state/'betton-test-simulation.sqlite'
    if database.is_symlink() or marker.is_symlink() or not database.is_file():raise RuntimeError('SIM files must be regular local files')
    backup=state/('before-rich-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')+'.sqlite')
    with sqlite3.connect(database.as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(backup) as dst:
        src.backup(dst)
        if dst.execute('PRAGMA quick_check').fetchall()!=[('ok',)]:raise RuntimeError('Backup validation failed')
    from scripts.ux_v3_preview import configure_process
    configure_process(state,full_demo=True,database_name='betton-test-simulation.sqlite')
    from app.main import app
    from scripts.rich_simulation_pack import add_rich_scenarios
    result=asyncio.run(add_rich_scenarios(app,data))
    data.update(result);data.setdefault('scenarios',{}).update(result['rich_scenarios'])
    temporary=marker.with_suffix('.json.tmp');temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8');temporary.replace(marker)
    print('Added rich SIM pack:',len(result['rich_scenarios']),'markets;',result['rich_history_fills'],'executions. Active pointer and previous history preserved.')
if __name__=='__main__':main()
