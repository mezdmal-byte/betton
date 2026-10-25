"""Rehearse schema 3 -> 4 on a NEW SQLite copy; never migrate the source.

Outputs anonymous hashes/check results, not rows. No app server, bot or worker.
Existing money_migrate backup/restore and explicit schema upgrade are reused.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = ROOT / '.ux-preview'
sys.path.insert(0, str(ROOT))


def _inside(path):
    path = Path(path).resolve()
    if path == ALLOWED.resolve() or not path.is_relative_to(ALLOWED.resolve()):
        raise ValueError('Rehearsal destination must be a new folder inside .ux-preview')
    return path


def _worker(directory):
    directory = _inside(directory)
    if json.loads((directory / 'rehearsal-marker.json').read_text()) != {'kind': 'betton-release-rehearsal', 'version': 1}:
        raise ValueError('Missing rehearsal marker')
    database = directory / 'betton-test-release.sqlite'
    expected_url = 'sqlite:///' + database.as_posix()
    if (directory / '.env').exists() or database.resolve().parent != directory:
        raise ValueError('Unsafe rehearsal configuration or redirected database')
    if os.environ.get('DATABASE_URL') != expected_url:
        raise ValueError('Worker must use its explicit isolated copy')
    from sqlalchemy import create_engine, inspect, text
    from app.database import enforce_sqlite_foreign_keys, assert_money_ready
    from app.migrations import upgrade, revision, assert_schema_ready
    from app.money_migrate import fingerprint, verified_backup

    def preserved_rows(engine, names):
        # All existing tables, including intents/users/positions, not only balances.
        digest = hashlib.sha256()
        with engine.connect() as conn:
            quote = conn.dialect.identifier_preparer.quote
            for name in sorted(names):
                digest.update(name.encode())
                for row in sorted(json.dumps(list(r), default=str, ensure_ascii=False)
                                  for r in conn.execute(text('SELECT * FROM ' + quote(name)))):
                    digest.update(row.encode()); digest.update(b'\n')
        return digest.hexdigest()

    engine = create_engine('sqlite:///' + database.as_posix())
    enforce_sqlite_foreign_keys(engine)
    restored = None
    try:
        with engine.connect() as conn:
            before_revision = revision(conn)
            if before_revision not in (3, 4):
                raise ValueError('Only schema 3/4 rehearsal supported; legacy money preflight is separate')
            if conn.exec_driver_sql('PRAGMA integrity_check').scalar_one() != 'ok':
                raise ValueError('Snapshot integrity failed')
            if conn.exec_driver_sql('PRAGMA foreign_key_check').first():
                raise ValueError('Snapshot has broken references')
            names = set(inspect(conn).get_table_names()) - {'betton_schema_version'}
            full_before = fingerprint(conn)
        before = preserved_rows(engine, names)
        assert_money_ready()  # Controlled child environment points only to this copy.
        backup = directory / 'schema-before.backup'
        with verified_backup(engine.url, backup) as digest:
            if digest != full_before:
                raise ValueError('Restored backup differs from snapshot')
        upgrade(engine)
        assert_schema_ready(engine)
        if preserved_rows(engine, names) != before:
            raise ValueError('Migration changed existing rows')
        with engine.connect() as conn:
            after = fingerprint(conn)
        upgrade(engine)
        with engine.connect() as conn:
            if fingerprint(conn) != after:
                raise ValueError('Repeated upgrade changed the database')
        restore_file = directory / 'betton-test-restored.sqlite'
        with sqlite3.connect(backup.as_uri() + '?mode=ro', uri=True) as source:
            with sqlite3.connect(restore_file) as target:
                source.backup(target)
        restored = create_engine('sqlite:///' + restore_file.as_posix())
        enforce_sqlite_foreign_keys(restored)
        with restored.connect() as conn:
            if fingerprint(conn) != full_before or revision(conn) != before_revision:
                raise ValueError('Rollback restore did not reproduce the original snapshot')
        upgrade(restored); assert_schema_ready(restored)
        if preserved_rows(restored, names) != before:
            raise ValueError('Upgrade after rollback changed existing rows')
        return {'report_version': 1, 'status': 'passed', 'source_read_only': True,
                'revision_before': before_revision, 'revision_after': 4,
                'existing_rows_sha256': before, 'backup_restored': True,
                'existing_rows_preserved': True, 'repeat_upgrade_unchanged': True,
                'rollback_restored': True, 'restored_copy_upgrade_ready': True,
                'scope': 'SQLite copy; no production rollout or Telegram smoke'}
    finally:
        engine.dispose()
        if restored is not None:
            restored.dispose()


def rehearse(source, destination):
    source = Path(source).resolve(strict=True)
    destination = _inside(destination)
    if not source.is_file():
        raise ValueError('Existing SQLite source required')
    destination.mkdir(parents=True, exist_ok=False)  # never reuse/overwrite a rehearsal
    (destination / 'rehearsal-marker.json').write_text(json.dumps(
        {'kind': 'betton-release-rehearsal', 'version': 1}))
    database = destination / 'betton-test-release.sqlite'
    with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as original:
        original.execute('PRAGMA query_only=ON')
        with sqlite3.connect(database) as copy:
            original.backup(copy)
    environment = {key: value for key, value in os.environ.items()
                   if not key.upper().startswith(('DATABASE_', 'BOT_', 'TELEGRAM_', 'ADMIN_', 'BETTON_', 'RENDER_', 'PANDASCORE_'))}
    environment.update(DATABASE_URL='sqlite:///' + database.as_posix(),
                       BOT_TOKEN='123456:LOCAL_REHEARSAL_ONLY', ADMIN_TELEGRAM_ID='',
                       ADMIN_TELEGRAM_IDS='', ADMIN_TELEGRAM_USERNAMES='',
                       PUBLIC_BASE_URL='http://127.0.0.1', MINI_APP_URL='http://127.0.0.1/v2/',
                       BETTON_ENVIRONMENT='test', BETTON_DEMO_AUTOMATION='false', PYTHONUTF8='1')
    # Fresh process + empty cwd prevents local dotenv/config and imported test globals leaking in.
    process = subprocess.run([sys.executable, '-X', 'utf8', str(Path(__file__).resolve()),
                              '--worker', str(destination)], cwd=destination,
                             env=environment, capture_output=True, text=True, encoding='utf-8', timeout=120)
    try:
        report = json.loads(process.stdout.strip().splitlines()[-1])
    except (ValueError, IndexError):
        report = {'report_version': 1, 'status': 'blocked', 'error': 'Rehearsal worker failed; source unchanged'}
    (destination / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path)
    parser.add_argument('--work-dir', type=Path)
    parser.add_argument('--worker', type=Path, help=argparse.SUPPRESS)
    args = parser.parse_args()
    try:
        if args.worker:
            result = _worker(args.worker)
        else:
            if not args.source or not args.work_dir:
                parser.error('--source and --work-dir are required')
            result = rehearse(args.source, args.work_dir)
    except Exception as exc:
        # No SQL parameters, filenames, personal data, settings or secrets in exported error.
        result = {'report_version': 1, 'status': 'blocked', 'error_type': type(exc).__name__,
                  'error': 'Rehearsal stopped; inspect the retained isolated copy; source not migrated'}
    print(json.dumps(result))
    return 0 if result['status'] == 'passed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
