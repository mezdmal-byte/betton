"""Read-only structural money diagnostics, without application configuration.

No settings, ORM models, startup, workers, migrations or settlement are imported.
This is evidence collection, not a replacement for the authoritative per-market
reconciliation service or permission to reconstruct missing historical money.
"""
from collections import Counter, defaultdict
from pathlib import Path

from sqlalchemy import inspect, text

from app.money_preflight import MAX_INT64, inspect_money, readonly_connection

TABLES = ('users', 'markets', 'p2p_orders', 'p2p_fills', 'p2p_money_entries', 'settlement_records')
NANO_FIELDS = {'users': ('balance_nano',), 'markets': ('pot_nano', 'lock_nano'),
               'p2p_orders': ('amount', 'filled', 'remaining', 'refunded'),
               'p2p_fills': ('maker_stake', 'taker_stake'), 'p2p_money_entries': ('amount',)}
DIRECTIONS = {'reserve': ('user_balance', 'order_reserve'),
              'fill_escrow': ('order_reserve', 'market_pot'),
              'refund': ('order_reserve', 'user_balance'),
              **{kind: ('market_pot', 'user_balance') for kind in
                 ('payout', 'tip', 'void_return', 'guarantor_reward')}}


def inspect_database(path, *, details=False):
    """Inspect an existing SQLite file. Never creates one, loads .env or writes it."""
    source = Path(path).resolve(strict=True)
    if not source.is_file():
        raise ValueError('Source must be an existing SQLite file')
    with readonly_connection('sqlite:///' + source.as_posix()) as conn:
        return inspect_connection(conn, details=details)


def inspect_connection(conn, *, details=False):
    """Inspect an already read-only SQLAlchemy connection in one snapshot.

    Public export is aggregated and excludes IDs, names, questions, request keys,
    Telegram identifiers, database paths and connection URLs. Local details are
    explicit opt-in and still omit arbitrary source strings.
    """
    if conn.dialect.name == 'sqlite':
        if conn.exec_driver_sql('PRAGMA query_only').scalar() != 1:
            raise ValueError('Diagnostics require PRAGMA query_only=ON')
    elif conn.dialect.name == 'postgresql':
        if conn.exec_driver_sql('SHOW transaction_read_only').scalar() != 'on':
            raise ValueError('Diagnostics require a read-only transaction')
    else:
        raise ValueError('Unsupported database')
    metadata = inspect(conn)
    tables = set(metadata.get_table_names())
    columns = {table: {c['name'] for c in metadata.get_columns(table)} for table in TABLES if table in tables}
    findings = []

    def note(code, classification='proven_anomaly', **context):
        # Context is constructed only from schema constants and numeric IDs/amounts.
        findings.append({'classification': classification, 'code': code, **context})

    revision = 0
    if 'betton_schema_version' in tables:
        versions = conn.execute(text('SELECT revision FROM betton_schema_version')).scalars().all()
        if len(versions) == 1 and type(versions[0]) is int:
            revision = versions[0]
        else:
            note('invalid_schema_marker')
    if revision not in (0, 3, 4):
        note('schema_not_supported', 'unknown')
    uncertain_storage = (revision == 0 and 'balance_nano' in columns.get('users', set())
                         and 'money_migrations' not in tables)
    if uncertain_storage:
        note('storage_authority_unversioned', 'unknown')
    rows = {table: [dict(row) for row in conn.execute(text('SELECT * FROM ' + table)).mappings()]
            for table in columns}
    for table in TABLES:
        if table not in tables:
            note('missing_table', 'incomplete_history', table=table)
    if conn.dialect.name == 'sqlite':
        for _ in conn.exec_driver_sql('PRAGMA foreign_key_check'):
            note('foreign_key_violation')
        if conn.exec_driver_sql('PRAGMA integrity_check').scalar() != 'ok':
            note('sqlite_integrity_failure')

    inventory = {}
    valid = {}
    for table, fields in NANO_FIELDS.items():
        for field in fields:
            if field not in columns.get(table, set()):
                continue
            good, total = set(), 0
            for row in rows[table]:
                amount = row[field]
                if type(amount) is not int or not 0 <= amount <= MAX_INT64:
                    note('invalid_integer_amount', table=table, row_id=row.get('id'), field=field)
                else:
                    good.add(row.get('id'))
                    total += amount
            valid[table, field] = good
            inventory[table + '.' + field] = {'nano': str(total), 'complete': len(good) == len(rows[table])}

    def complete(table, fields):
        if not set(fields) <= columns.get(table, set()):
            note('missing_columns', 'incomplete_history', table=table)
            return False
        return True

    users = {r['id']: r for r in rows.get('users', []) if 'id' in r}
    markets = {r['id']: r for r in rows.get('markets', []) if 'id' in r}
    orders = {r['id']: r for r in rows.get('p2p_orders', []) if 'id' in r}
    fills = {r['id']: r for r in rows.get('p2p_fills', []) if 'id' in r}
    entries = rows.get('p2p_money_entries', [])

    def reference(row, field, target, table, *, nullable=False):
        if field in row and not (nullable and row[field] is None) and row[field] not in target:
            note('orphan_reference', table=table, row_id=row.get('id'), field=field)

    for table, records, links in (
        ('markets', markets.values(), [('creator_id', users)]),
        ('p2p_orders', orders.values(), [('market_id', markets), ('user_id', users)]),
        ('p2p_fills', fills.values(), [('market_id', markets), ('maker_order_id', orders),
          ('taker_order_id', orders), ('maker_user_id', users), ('taker_user_id', users)]),
        ('settlement_records', rows.get('settlement_records', []), [('market_id', markets), ('user_id', users)]),
    ):
        for row in records:
            for field, target in links:
                reference(row, field, target, table)
    for row in entries:
        for field, target in (('market_id', markets), ('order_id', orders), ('fill_id', fills),
                ('from_user_id', users), ('to_user_id', users), ('from_order_id', orders), ('to_order_id', orders)):
            reference(row, field, target, 'p2p_money_entries', nullable=field != 'market_id')

    # Uniqueness checks also work on old copies where constraints were absent.
    for table, keys in (('p2p_orders', ('user_id', 'request_id')),
                        ('p2p_money_entries', ('entry_key',)),
                        ('settlement_records', ('market_id', 'user_id'))):
        if set(keys) <= columns.get(table, set()):
            grouped = Counter(tuple(r[k] for k in keys) for r in rows[table])
            for count in grouped.values():
                if count > 1:
                    note('duplicate_identity', table=table, excess_rows=count-1)

    filled, banks = defaultdict(int), defaultdict(int)
    if complete('p2p_fills', ('id', 'market_id', 'maker_order_id', 'taker_order_id', 'maker_stake', 'taker_stake')):
        for row in fills.values():
            for side in ('maker', 'taker'):
                if row['id'] not in valid.get(('p2p_fills', side + '_stake'), set()):
                    continue
                order = orders.get(row[side + '_order_id'])
                if order and (order.get('market_id') != row['market_id'] or
                        (side + '_user_id' in row and order.get('user_id') != row[side + '_user_id'])):
                    note('fill_order_party_mismatch', table='p2p_fills', row_id=row['id'], market_id=row['market_id'])
                filled[row[side + '_order_id']] += row[side + '_stake']
                banks[row['market_id']] += row[side + '_stake']
            if row.get('maker_user_id') is not None and row.get('maker_user_id') == row.get('taker_user_id'):
                note('self_match', table='p2p_fills', row_id=row['id'], market_id=row['market_id'])

    if complete('p2p_orders', ('id', 'market_id', 'amount', 'filled', 'remaining', 'refunded')):
        for row in orders.values():
            if not all(row['id'] in valid.get(('p2p_orders', f), set()) for f in ('amount','filled','remaining','refunded')):
                continue
            if row['amount'] != row['filled'] + row['remaining'] + row['refunded']:
                note('order_amount_identity', table='p2p_orders', row_id=row['id'], market_id=row['market_id'])
            if row['filled'] != filled[row['id']]:
                note('order_fill_mismatch', table='p2p_orders', row_id=row['id'], market_id=row['market_id'])
            market = markets.get(row['market_id'], {})
            if market.get('mechanism') not in (None, 'p2p'):
                note('order_non_p2p_market', table='p2p_orders', row_id=row['id'], market_id=row['market_id'])
            if market.get('status') in ('closed','resolved','cancelled','rejected') and row['remaining']:
                note('reserve_after_close', table='p2p_orders', row_id=row['id'], market_id=row['market_id'])

    journal = defaultdict(int)
    outflow = defaultdict(int)
    if complete('p2p_money_entries', ('id','market_id','op_type','amount','from_kind','to_kind')):
        for row in entries:
            if row['id'] not in valid.get(('p2p_money_entries', 'amount'), set()):
                continue
            if DIRECTIONS.get(row['op_type']) != (row['from_kind'], row['to_kind']):
                note('journal_direction', table='p2p_money_entries', row_id=row['id'], market_id=row['market_id'])
            order = orders.get(row.get('order_id') or row.get('from_order_id'))
            fill = fills.get(row.get('fill_id'))
            if (order and order.get('market_id') != row['market_id']) or (fill and fill.get('market_id') != row['market_id']):
                note('journal_market_reference', table='p2p_money_entries', row_id=row['id'], market_id=row['market_id'])
            if row['op_type'] in ('reserve','refund'):
                if (not order or row.get('from_user_id') != order.get('user_id')
                        or row.get('to_user_id') != order.get('user_id')
                        or (row['op_type']=='reserve' and row.get('to_order_id') != order.get('id'))):
                    note('journal_order_party', table='p2p_money_entries', row_id=row['id'], market_id=row['market_id'])
            if row['op_type'] == 'fill_escrow':
                sides = [side for side in ('maker','taker') if fill and row.get('from_order_id') == fill.get(side+'_order_id')]
                if (len(sides) != 1 or row['amount'] != fill.get(sides[0]+'_stake')
                        or row.get('from_user_id') != fill.get(sides[0]+'_user_id')):
                    note('journal_fill_party', table='p2p_money_entries', row_id=row['id'], market_id=row['market_id'])
            order_id = row.get('order_id')
            if row['op_type'] == 'fill_escrow':
                order_id = row.get('from_order_id')
            journal[row['op_type'], order_id] += row['amount']
            if row['op_type'] in ('payout','tip','void_return','guarantor_reward'):
                outflow[row['market_id']] += row['amount']
        for row in orders.values():
            market = markets.get(row.get('market_id'), {})
            coverage = market.get('p2p_journal_coverage') == 'full'
            for field, op in (('amount','reserve'),('filled','fill_escrow'),('refunded','refund')):
                if row['id'] not in valid.get(('p2p_orders', field), set()):
                    continue
                actual = journal[op, row['id']]
                if actual != row[field]:
                    note('journal_' + op + '_mismatch', 'proven_anomaly' if coverage or actual else 'incomplete_history',
                         table='p2p_orders', row_id=row['id'], market_id=row['market_id'])

    for market in markets.values():
        if market.get('mechanism') != 'p2p':
            continue
        full = market.get('p2p_journal_coverage') == 'full'
        if not full:
            note('journal_history_incomplete', 'incomplete_history', table='markets', market_id=market['id'])
        if market['id'] in valid.get(('markets','pot_nano'), set()):
            status = market.get('status')
            if status in ('open','closed'):
                expected = banks[market['id']]
                if outflow[market['id']]:
                    note('open_has_settlement', table='markets', market_id=market['id'])
            elif status in ('resolved','cancelled') and full:
                expected = banks[market['id']] - outflow[market['id']]
            else:
                expected = None
            if expected is not None and market['pot_nano'] != expected:
                note('pot_conservation_mismatch', table='markets', market_id=market['id'],
                     expected_nano=str(expected), actual_nano=str(market['pot_nano']))
            if status in ('resolved','cancelled') and market['pot_nano']:
                note('terminal_pot_not_empty', table='markets', market_id=market['id'])
            if status in ('pending','rejected') and banks[market['id']]:
                note('trades_before_approval', table='markets', market_id=market['id'])

    # The existing migration preflight is authoritative about stored legacy floats;
    # do not reproduce its conversion/rounding policy here.
    if 'balance_nano' not in columns.get('users', set()) or uncertain_storage:
        legacy = inspect_money(conn)
        for item in legacy['issues']:
            classification = 'unknown' if uncertain_storage else 'incomplete_history' if item['kind']=='missing_schema' else 'proven_anomaly'
            note('legacy_' + item['kind'], classification,
                 **{k:v for k,v in item.items() if k in ('table','field','row_id','market_id','order_id','fill_id')})
        if legacy.get('rounding'):
            note('legacy_rounding_required', 'unknown', affected_values=len(legacy['rounding']))
        for key, value in legacy.get('totals', {}).items():
            inventory['legacy_candidate.'+key] = value
    note('balance_baseline_unavailable', 'unknown')
    note('settlement_authority_requires_core_reconciliation', 'unknown')
    counts = Counter((item['classification'], item['code']) for item in findings)
    critical = sum(count for (kind,_),count in counts.items() if kind == 'proven_anomaly')
    incomplete = uncertain_storage or revision not in (0,3,4) or any(kind == 'incomplete_history' for kind,_ in counts)
    result = {'report_version':1, 'read_only':True, 'schema_revision':revision,
        'status':'critical' if critical else 'incomplete' if incomplete else 'checks_passed',
        'exit_code':1 if critical else 0, 'counts':{table:len(records) for table,records in rows.items()},
        'inventory_nano':inventory,
        'findings':[{'classification':kind,'code':code,'count':count} for (kind,code),count in sorted(counts.items())],
        'limitations':[
            'Checks passed is not full financial certification or approval to deploy.',
            'Balances include initial grants and legacy LMSR activity; no authoritative opening baseline is stored.',
            'This tool does not recompute payouts, fees or guarantor rewards; use core p2p-reconciliation with verified administrator context.',
            'Legacy missing history cannot prove whether a discrepancy was a double credit or an unrecorded operation.',
            'Legacy float precision cannot be recovered; proposed conversions are never applied.',
        ]}
    if details:
        result['details'] = findings
    return result
