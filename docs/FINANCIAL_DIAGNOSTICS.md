# Read-only financial diagnostics

The toolkit inventories an explicit existing SQLite file in a single read-only
snapshot. It never discovers `.env`/`DATABASE_URL`, starts the application, imports
ORM models, runs a worker or migration, or repairs a balance. Its connection reuses
`app.money_preflight.readonly_connection`: SQLite `mode=ro`, `query_only=ON`, `BEGIN`,
rollback, disposal. Missing files are not created. Do not point a test at a writable
working database; prefer a consistent SQLite online backup.

```powershell
.\.venv\Scripts\python.exe -X utf8 scripts/financial_diagnostics.py C:\path\betton-test-snapshot.sqlite
.\.venv\Scripts\python.exe -X utf8 scripts/financial_diagnostics.py C:\path\betton-test-snapshot.sqlite --output C:\safe\new-summary.json
```

Output paths must be new files and cannot equal the source. Default JSON contains
only schema revision, counts, exact decimal-string nanoTON inventories, grouped
finding codes/classifications and limitations. It excludes names, event questions,
Telegram identities, request keys, row IDs, database paths and connection URLs.
`--details` explicitly adds local numeric row/market references for investigation;
do not publish detailed output or database files. Existing summary files are never
overwritten automatically.

Exit codes: **0** no proven structural anomaly (history can still be incomplete),
**1** at least one proven anomaly, **2** invalid source/access/schema/output operation.
Always inspect `status` and `findings`; exit 0 is not release approval.

## Checks and scope

- Existing revisions 0/unversioned, 3 and 4; missing columns/history are reported.
- Nonnegative int64 values; inventory sums remain exact beyond JavaScript 2^53.
- Order identity `amount = filled + remaining + refunded`; filled vs recorded fills.
- User/market/order/fill logical links, cross-market fill parties, self-matches,
  native SQLite FK/integrity checks, reserves left after closed/terminal states.
- Duplicate user/request identities, journal keys, settlement market/user identities.
- Journal directions, linked market, reserve/refund owner, individual fill escrow
  parties/amounts, per-order reserve/fill/refund totals and pot conservation.
- Existing legacy float preflight/conversion proposals are reused, never applied.

`proven_anomaly` means a contradiction in stored structural facts. Missing journal
history is `incomplete_history`; no past journal rows are invented. Historical
storage authority, initial balance baselines, and unavailable payout/admin context
are `unknown`. A balance cannot be fully reconstructed from this P2P journal alone:
initial grants and LMSR also affect it. This toolkit does not create a second fee,
matching, payout or guarantor-reward engine. Use the existing core
`p2p_ledger.reconcile`/admin reconciliation with verified administrator context for
authoritative payout-recipient/formula verification. `checks_passed` is deliberately
not named `fully_verified`.

## Embedding in the read-only Admin Center

```python
from app.financial_diagnostics import inspect_database, inspect_connection

summary = inspect_database(snapshot_path)  # independently opens a native ro file
summary = inspect_connection(readonly_sqlalchemy_connection, details=False)
```

The supplied connection must already be `query_only=ON` (SQLite) or inside a
read-only transaction (PostgreSQL); writable connections are rejected. SQLite
embedding needs read-only `query_only`, `foreign_key_check`, `integrity_check`, and
SQLAlchemy metadata inspection pragmas. Import from **`app.financial_diagnostics`**,
not `app.services`: the latter package currently eagerly imports live model/settings
modules. A subprocess regression proves this module never imports config/database/
models/main even with hostile production-shaped environment variables.

## Findings from the retained legacy copy — 26 October 2026

Inspected only the already retained `betton-test-legacy-upgrade.sqlite` copy:
20 users, 263 markets, 217 orders, 73 fills, 564 journal rows, 26 settlement records.
It has neither schema-version nor money-migration markers, **but does have nano
columns and a complete-looking journal**. Integer structural/journal-pot checks
find no contradiction. Existing float pot snapshots total zero and differ from
nano/fill facts in 36 markets. The existing legacy float preflight reports those
same 36 mismatches.

This proves divergent unversioned dual storage; it does **not** prove a double
credit or prove which historic storage was authoritative. The report is
`incomplete`, with `storage_authority_unversioned` and 36
`legacy_p2p_pot_mismatch` findings classified **unknown**. Do not silently change
the migration preflight, choose balances, or insert corrective ledger entries.
Original source/retained copy are not modified by this toolkit.

A separate online backup of the running Telegram SIM was also inspected: schema 4,
17 users, 42 markets, 48 orders, 18 fills, 99 journal rows, 7 settlements. Structural
checks pass; baseline/authoritative-settlement limitations remain explicit. The
live SIM was read-only during backup, never stopped or reconfigured by this task.
Raw snapshots and JSON reports remain under ignored `.local-preserve/financial/`.

## Tests

```powershell
.\.venv\Scripts\python.exe -X utf8 -m pytest tests/test_financial_diagnostics.py -q
```

20 tests passed on Windows: clean schema 3/4, exact large integers, corrupted
identities/links/directions/parties, missing journal history, conflicting entries,
legacy pot mismatch, unversioned dual storage, anonymized output, exclusive export,
source byte hashes unchanged, missing source not created, writable connection
rejected, and no application/settings imports. No production or real-money
operations were executed.
