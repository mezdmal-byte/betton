"""Read-only inventory before a separate integer-money migration.

Run with DATABASE_URL set explicitly: python -m app.money_preflight.
Does not import application settings, run migrations, start the bot, or write data.
"""
import json
import os
import sqlite3
import sys
from collections import defaultdict
from contextlib import contextmanager
from decimal import Decimal, InvalidOperation, ROUND_HALF_EVEN, localcontext
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

NANO = 1_000_000_000
MAX_INT64 = 2**63 - 1


def convert_candidate(value):
    """A proposal from the stored decimal representation, never a write."""
    if value is None:
        raise ValueError('null_amount')
    try:
        amount = Decimal(str(value))
    except InvalidOperation:
        raise ValueError('invalid_amount') from None
    if not amount.is_finite():
        raise ValueError('non_finite_amount')
    if amount < 0:
        raise ValueError('negative_amount')
    with localcontext() as ctx:
        ctx.prec = 80
        if amount > Decimal(MAX_INT64) / NANO:
            raise ValueError('int64_overflow')
        scaled = amount * NANO
        candidate = int(scaled.to_integral_value(rounding=ROUND_HALF_EVEN))
        delta = Decimal(candidate) / NANO - amount
    return candidate, delta


@contextmanager
def readonly_connection(url):
    parsed = make_url(url)
    backend = parsed.get_backend_name()
    if backend == 'sqlite':
        if not parsed.database or parsed.database == ':memory:' or parsed.query:
            raise ValueError('Use an existing SQLite file without URL query parameters')
        path = Path(parsed.database).resolve(strict=True)
        if not path.is_file():
            raise ValueError('SQLite path must be an existing file')
        engine = create_engine('sqlite://', creator=lambda: sqlite3.connect(
            path.as_uri() + '?mode=ro', uri=True, timeout=30))
    elif backend == 'postgresql':
        engine = create_engine(parsed, isolation_level='REPEATABLE READ')
    else:
        raise ValueError('Only SQLite and PostgreSQL are supported')
    try:
        with engine.connect() as conn:
            if backend == 'sqlite':
                conn.exec_driver_sql('PRAGMA query_only = ON')
                conn.exec_driver_sql('BEGIN')
            else:
                conn.exec_driver_sql('SET TRANSACTION READ ONLY')
            try:
                yield conn
            finally:
                conn.rollback()
    finally:
        engine.dispose()


def inspect_money(conn):
    report = dict(
        report_version=1, database=conn.dialect.name, read_only=True,
        scope=['users.balance', 'markets.pot', 'markets.lock_ton',
               'P2P order amounts and fill funding'],
        rounding_proposal='ROUND_HALF_EVEN from Decimal(str(stored_value)); not applied',
        counts={}, totals={}, rounding=[], issues=[],
        limitations=[
            'Not a migration or approval to deploy one.',
            'Original precision already lost in float cannot be recovered.',
            'LMSR liabilities and historical settlements are not audited here.',
            'A future backfill must recheck a fresh snapshot while writes are stopped.',
        ],
    )
    inspector = inspect(conn)
    required = {
        'users': {'id', 'balance'},
        'markets': {'id', 'mechanism', 'status', 'pot', 'lock_ton'},
        'p2p_orders': {'id', 'market_id', 'amount', 'filled', 'remaining', 'refunded'},
        'p2p_fills': {'id', 'market_id', 'maker_order_id', 'taker_order_id',
                      'maker_stake', 'taker_stake'},
    }
    tables = set(inspector.get_table_names())
    for table, columns in required.items():
        present = {c['name'] for c in inspector.get_columns(table)} if table in tables else set()
        if columns - present:
            report['issues'].append(dict(kind='missing_schema', table=table,
                                         columns=sorted(columns - present)))
    if report['issues']:
        report['amounts_convertible_without_rounding'] = False
        return report

    def issue(kind, **details):
        report['issues'].append(dict(kind=kind, **details))

    def scan_field(table, field, rows):
        total_nano = 0
        valid = {}
        for row in rows:
            try:
                nano, delta = convert_candidate(row[field])
            except ValueError as exc:
                issue(str(exc), table=table, field=field, row_id=row['id'])
                continue
            valid[row['id']] = nano
            total_nano += nano
            if delta:
                report['rounding'].append(dict(
                    table=table, field=field, row_id=row['id'],
                    stored_ton=str(row[field]), proposed_nano=str(nano), delta_ton=str(delta)))
        report['totals'][table + '.' + field] = dict(
            proposed_nano=str(total_nano), complete=len(valid) == len(rows))
        return valid

    users = conn.execute(text('SELECT id, balance FROM users')).mappings().all()
    markets = conn.execute(text('SELECT id, mechanism, status, pot, lock_ton FROM markets')).mappings().all()
    pots = scan_field('markets', 'pot', markets)
    scan_field('users', 'balance', users)
    scan_field('markets', 'lock_ton', markets)
    market_map = {m['id']: m for m in markets}
    orders = conn.execute(text(
        'SELECT id, market_id, amount, filled, remaining, refunded FROM p2p_orders')).mappings().all()
    fills = conn.execute(text(
        'SELECT id, market_id, maker_order_id, taker_order_id, maker_stake, taker_stake FROM p2p_fills')).mappings().all()
    report['counts'] = dict(users=len(users), markets=len(markets), orders=len(orders), fills=len(fills))

    def valid_int(value, table, row_id, field):
        if not isinstance(value, int) or not 0 <= value <= MAX_INT64:
            issue('invalid_nano_amount', table=table, row_id=row_id, field=field)
            return False
        return True

    bank = defaultdict(int)
    filled = defaultdict(int)
    order_map = {o['id']: o for o in orders}
    for fill in fills:
        for side in ('maker', 'taker'):
            stake = fill[side + '_stake']
            if not valid_int(stake, 'p2p_fills', fill['id'], side + '_stake'):
                continue
            order_id = fill[side + '_order_id']
            order = order_map.get(order_id)
            if order is None or order['market_id'] != fill['market_id']:
                issue('fill_order_mismatch', fill_id=fill['id'], order_id=order_id)
            filled[order_id] += stake
            bank[fill['market_id']] += stake
    reserve = 0
    for order in orders:
        valid = [valid_int(order[f], 'p2p_orders', order['id'], f)
                 for f in ('amount', 'filled', 'remaining', 'refunded')]
        if not all(valid):
            continue
        reserve += order['remaining']
        market = market_map.get(order['market_id'])
        if market is None or market['mechanism'] != 'p2p':
            issue('order_market_mismatch', order_id=order['id'])
        if order['amount'] != order['filled'] + order['remaining'] + order['refunded']:
            issue('order_amount_identity', order_id=order['id'])
        if order['filled'] != filled[order['id']]:
            issue('order_fill_mismatch', order_id=order['id'])
        if market and market['status'] in ('closed', 'resolved', 'cancelled', 'rejected') and order['remaining']:
            issue('reserve_after_close', order_id=order['id'], market_id=market['id'])
    report['totals']['p2p_order_reserve'] = dict(nano=str(reserve))
    for market in markets:
        if market['mechanism'] != 'p2p' or market['id'] not in pots:
            continue
        status = market['status']
        if status not in ('pending', 'rejected', 'open', 'closed', 'resolved', 'cancelled'):
            issue('unknown_status', market_id=market['id'])
            continue
        if status in ('pending', 'rejected') and bank[market['id']]:
            issue('trades_before_approval', market_id=market['id'])
        expected = bank[market['id']] if status in ('open', 'closed') else 0
        if pots[market['id']] != expected:
            issue('p2p_pot_mismatch', market_id=market['id'],
                  proposed_nano=str(pots[market['id']]), expected_nano=str(expected))
    report['amounts_convertible_without_rounding'] = not report['issues'] and not report['rounding']
    return report


def main():
    url = os.environ.get('DATABASE_URL')
    if not url:
        print('Set DATABASE_URL explicitly; use a database copy.', file=sys.stderr)
        return 2
    try:
        with readonly_connection(url) as conn:
            report = inspect_money(conn)
    except Exception:
        # Driver exception messages may contain credentials or a connection URL.
        print('Preflight failed: check database access and schema. No data was changed.', file=sys.stderr)
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))
    return 0 if report['amounts_convertible_without_rounding'] else 1


if __name__ == '__main__':
    sys.exit(main())
