"""Offline, backed-up conversion of monetary storage. No bot/settings imports.

DATABASE_URL must be explicit. Stop the app and workers before running this CLI.
It refuses a changed snapshot, inconsistent funding, or unapproved rounding.
"""
import argparse
import hashlib
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from decimal import Decimal, ROUND_DOWN
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

from app.money_preflight import convert_candidate, inspect_money

FIELDS = [('users', 'balance', 'balance_nano'),
          ('markets', 'pot', 'pot_nano'), ('markets', 'lock_ton', 'lock_nano')]
VERSION = 'integer_money_v1'


def fingerprint(conn):
    """Logical whole-database snapshot, including non-money tables; no secret output."""
    digest = hashlib.sha256()
    quote = conn.dialect.identifier_preparer.quote
    for name in sorted(inspect(conn).get_table_names()):
        digest.update(name.encode())
        columns = inspect(conn).get_columns(name)
        digest.update(json.dumps([c['name'] for c in columns]).encode())
        rows = conn.execute(text(f'SELECT * FROM {quote(name)}')).all()
        for row in sorted(json.dumps(list(r), default=str, ensure_ascii=False) for r in rows):
            digest.update(row.encode())
            digest.update(b'\n')
    return digest.hexdigest()


def _check_lmsr(conn):
    tables = set(inspect(conn).get_table_names())
    if 'positions' not in tables:
        if conn.execute(text("SELECT COUNT(*) FROM markets WHERE mechanism='lmsr'")).scalar_one():
            raise ValueError('LMSR positions table missing')
        return
    def vector(value):
        return json.loads(value) if isinstance(value, str) else value
    for market in conn.execute(text("SELECT * FROM markets WHERE mechanism='lmsr'")).mappings():
        names = vector(market.get('outcomes'))
        if not names or len(names) < 2:
            raise ValueError('LMSR outcomes missing')
        bank = convert_candidate(market['pot'])[0]
        liabilities = [0] * len(names)
        for pos in conn.execute(text('SELECT * FROM positions WHERE market_id=:id'),
                                {'id': market['id']}).mappings():
            if pos['claimed']:
                continue
            shares = vector(pos['shares'])
            if not isinstance(shares, list) or len(shares) != len(names):
                raise ValueError('Invalid LMSR position')
            for i, qty in enumerate(shares):
                convert_candidate(qty)  # finite, nonnegative, within BIGINT
                liabilities[i] += int((Decimal(str(qty)) * 10**9).to_integral_value(rounding=ROUND_DOWN))
        if market['status'] == 'resolved':
            winner = market.get('winning_outcome')
            if winner not in names:
                raise ValueError('Unknown LMSR winner')
            required = liabilities[names.index(winner)]
        elif market['status'] in ('pending', 'open', 'closed'):
            required = max(liabilities)
        else:
            required = 0
        if required > bank:
            raise ValueError(f'LMSR bank does not cover existing claims: market {market["id"]}')


def _protect_columns(conn):
    """Old application code must fail instead of writing the obsolete float ledger."""
    for table, pairs in [('users', [('balance', 'balance_nano')]),
                         ('markets', [('pot', 'pot_nano'), ('lock_ton', 'lock_nano')])]:
        if conn.dialect.name == 'sqlite':
            invalid = ' OR '.join(f'NEW.{nano} IS NULL OR typeof(NEW.{nano}) != \'integer\' '
                                  f'OR NEW.{nano}<0' for _, nano in pairs)
            changed = ' OR '.join(f'NEW.{old} IS NOT OLD.{old}' for old, _ in pairs)
            for operation in ('INSERT', 'UPDATE'):
                condition = invalid + (f' OR {changed}' if operation == 'UPDATE' else '')
                conn.exec_driver_sql(f"CREATE TRIGGER money_{table}_{operation.lower()} "
                    f"BEFORE {operation} ON {table} WHEN {condition} BEGIN "
                    "SELECT RAISE(ABORT, 'integer money required; legacy values are snapshots'); END")
        else:
            for _, nano in pairs:
                conn.exec_driver_sql(f'ALTER TABLE {table} ALTER COLUMN {nano} SET NOT NULL')
            changed = ' OR '.join(f'NEW.{old} IS DISTINCT FROM OLD.{old}' for old, _ in pairs)
            conn.exec_driver_sql(f"CREATE FUNCTION money_guard_{table}() RETURNS trigger LANGUAGE plpgsql AS $$ "
                f"BEGIN IF {changed} THEN RAISE EXCEPTION 'legacy money is read-only'; END IF; "
                "RETURN NEW; END $$")
            conn.exec_driver_sql(f'CREATE TRIGGER money_{table}_update BEFORE UPDATE ON {table} '
                                f'FOR EACH ROW EXECUTE FUNCTION money_guard_{table}()')


def migrate_connection(conn, *, accept_rounding=False):
    """Caller holds an exclusive write lock and owns commit/rollback."""
    tables = set(inspect(conn).get_table_names())
    if 'money_migrations' in tables:
        row = conn.execute(text('SELECT report FROM money_migrations WHERE version=:v'),
                           {'v': VERSION}).scalar_one_or_none()
        if row is not None:
            return dict(already_applied=True, version=VERSION)
        raise ValueError('Unknown migration state')
    report = inspect_money(conn)
    if report['issues']:
        raise ValueError('Preflight failed: ' + json.dumps(report['issues'], ensure_ascii=False))
    if report['rounding'] and not accept_rounding:
        raise ValueError('Rounding requires --accept-rounding; inspect app.money_preflight report first')
    _check_lmsr(conn)
    # No mixed backfill: existing non-NULL integers could already be the live ledger.
    for table, old, nano in FIELDS:
        columns = {c['name'] for c in inspect(conn).get_columns(table)}
        if nano in columns:
            if conn.execute(text(f'SELECT COUNT(*) FROM {table} WHERE {nano} IS NOT NULL')).scalar_one():
                raise ValueError('Integer data already present without migration marker')
        else:
            conn.exec_driver_sql(f'ALTER TABLE {table} ADD COLUMN {nano} BIGINT '
                                 f'CHECK ({nano} BETWEEN 0 AND 9223372036854775807)')
    conn.exec_driver_sql('CREATE TABLE money_conversion_entries ('
        'table_name VARCHAR(32) NOT NULL, row_id BIGINT NOT NULL, field_name VARCHAR(32) NOT NULL, '
        'source_ton TEXT NOT NULL, amount_nano BIGINT NOT NULL, delta_ton TEXT NOT NULL, '
        'PRIMARY KEY(table_name,row_id,field_name))')
    for table, old, nano in FIELDS:
        rows = conn.execute(text(f'SELECT id, {old} FROM {table} ORDER BY id')).all()
        for row_id, value in rows:
            amount, delta = convert_candidate(value)
            conn.execute(text(f'UPDATE {table} SET {nano}=:amount WHERE id=:id'),
                         dict(amount=amount, id=row_id))
            conn.execute(text('INSERT INTO money_conversion_entries '
                '(table_name,row_id,field_name,source_ton,amount_nano,delta_ton) '
                'VALUES (:t,:id,:f,:source,:amount,:delta)'),
                dict(t=table, id=row_id, f=old, source=str(value), amount=amount, delta=str(delta)))
    _protect_columns(conn)
    conn.exec_driver_sql('CREATE TABLE money_migrations (version VARCHAR(64) PRIMARY KEY, report TEXT NOT NULL)')
    report.update(version=VERSION, migrated_at=datetime.now(timezone.utc).isoformat(), read_only=False)
    conn.execute(text('INSERT INTO money_migrations VALUES (:v,:report)'),
                 dict(v=VERSION, report=json.dumps(report, ensure_ascii=False)))
    return report


def _pg_env(url):
    parsed = make_url(url)
    env = os.environ.copy()
    for key, value in dict(PGHOST=parsed.host, PGPORT=parsed.port, PGDATABASE=parsed.database,
                           PGUSER=parsed.username, PGPASSWORD=parsed.password).items():
        if value is not None:
            env[key] = str(value)
    if parsed.query.get('sslmode'):
        env['PGSSLMODE'] = parsed.query['sslmode']
    return env


def _pg_tool(args, url):
    subprocess.run(args, env=_pg_env(url), check=True, stdout=subprocess.DEVNULL,
                   stderr=subprocess.PIPE, timeout=600)


@contextmanager
def verified_backup(url, backup_path):
    """Create a full backup, restore into a disposable DB, fingerprint that restore."""
    parsed = make_url(url)
    backup_path = Path(backup_path).resolve()
    if not backup_path.parent.is_dir():
        raise ValueError('Backup directory does not exist')
    # Never overwrite an existing backup; private permissions from creation onward.
    fd = os.open(backup_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(fd)
    if parsed.get_backend_name() == 'sqlite':
        source = Path(parsed.database).resolve(strict=True)
        if parsed.query or not source.is_file():
            raise ValueError('Use an existing SQLite file without query parameters')
        with sqlite3.connect(source.as_uri() + '?mode=ro', uri=True) as src:
            with sqlite3.connect(backup_path) as dst:
                src.backup(dst)
        with tempfile.TemporaryDirectory(prefix='betton-restore-') as directory:
            restored = Path(directory) / 'restore.db'
            shutil.copyfile(backup_path, restored)
            check = create_engine('sqlite:///' + str(restored))
            try:
                with check.connect() as conn:
                    if conn.exec_driver_sql('PRAGMA integrity_check').scalar_one() != 'ok':
                        raise ValueError('Backup integrity check failed')
                    digest = fingerprint(conn)
                yield digest
            finally:
                check.dispose()
    elif parsed.get_backend_name() == 'postgresql':
        if not shutil.which('pg_dump') or not shutil.which('pg_restore'):
            raise ValueError('PostgreSQL backup/restore tools required')
        _pg_tool(['pg_dump', '--format=custom', '--file', str(backup_path)], url)
        name = 'betton_restore_' + uuid.uuid4().hex
        admin = create_engine(parsed.set(database='postgres'), isolation_level='AUTOCOMMIT')
        created = False
        check = None
        try:
            with admin.connect() as conn:
                conn.exec_driver_sql(f'CREATE DATABASE "{name}"')
            created = True
            restored_url = parsed.set(database=name)
            _pg_tool(['pg_restore', '--no-owner', '--no-acl', '--exit-on-error',
                      '--dbname', name, str(backup_path)], restored_url)
            check = create_engine(restored_url)
            with check.connect() as conn:
                digest = fingerprint(conn)
        finally:
            if check is not None:
                check.dispose()
            if created:
                with admin.connect() as conn:
                    conn.exec_driver_sql(f'DROP DATABASE "{name}"')
            admin.dispose()
        yield digest
    else:
        raise ValueError('Only SQLite and PostgreSQL are supported')


def run_migration(url, backup_path, *, accept_rounding=False):
    parsed = make_url(url)
    if parsed.get_backend_name() not in ('sqlite', 'postgresql'):
        raise ValueError('Unsupported database')
    if parsed.get_backend_name() == 'sqlite':
        if not parsed.database or parsed.database == ':memory:' or parsed.query:
            raise ValueError('Existing SQLite file required')
        Path(parsed.database).resolve(strict=True)
    with verified_backup(url, backup_path) as digest:
        engine = create_engine(parsed)
        try:
            with engine.connect() as conn:
                if conn.dialect.name == 'sqlite':
                    conn.exec_driver_sql('BEGIN IMMEDIATE')
                else:
                    conn.exec_driver_sql("SET LOCAL lock_timeout = '10s'")
                    names = sorted(inspect(conn).get_table_names())
                    quote = conn.dialect.identifier_preparer.quote
                    conn.exec_driver_sql('LOCK TABLE ' + ','.join(map(quote, names)) + ' IN ACCESS EXCLUSIVE MODE')
                try:
                    if fingerprint(conn) != digest:
                        raise ValueError('Database changed since backup; stop all writers and retry with a new backup')
                    report = migrate_connection(conn, accept_rounding=accept_rounding)
                    conn.commit()
                except Exception:
                    conn.rollback()
                    raise
            return report
        finally:
            engine.dispose()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backup', required=True, help='New full backup file; must not exist')
    parser.add_argument('--writers-stopped', action='store_true', required=True)
    parser.add_argument('--accept-rounding', action='store_true')
    args = parser.parse_args(argv)
    url = os.environ.get('DATABASE_URL')
    if not url:
        print('Set DATABASE_URL explicitly.', file=sys.stderr)
        return 2
    try:
        report = run_migration(url, args.backup, accept_rounding=args.accept_rounding)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    except Exception:
        # Never print driver/subprocess exceptions: they can contain credentials.
        print('Migration failed. Check database/backup access and migration marker before restarting.', file=sys.stderr)
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
