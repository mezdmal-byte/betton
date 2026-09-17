# Integer money deployment runbook

Shared money is authoritative in `users.balance_nano`, `markets.pot_nano`
and `markets.lock_nano` (signed BIGINT, nonnegative, 1 TON = 10^9 nanoTON).
All P2P and legacy LMSR balance/pot mutations use integer deltas. SQL increments
check available funds and overflow before adding; market locks and transactions
remain required. A one-nano P2P bank discrepancy blocks settlement/cancellation.

The original physical columns `balance`, `pot`, `lock_ton` remain snapshots.
ORM attributes are `balance_legacy`, `pot_legacy`, `lock_ton_legacy`.
They do not mirror future transactions. TON properties/API responses are display
adapters, not values to feed back into ledger arithmetic. P2P reconciliation
reports the actual bank in `pot.actual_nano` as an exact decimal string.

LMSR `b`, `q`, shares, historical costs and settlement display records remain
floats; `app/lmsr.py` is unchanged. Incoming LMSR amounts/paid costs are rounded
half-even at the monetary boundary. Each winning position's share payout is
rounded DOWN to a nanoTON. The funding guard uses that same per-position rule.
Tips round down; creator gets `tip * 75 // 100`, platform gets the remainder.
Creator = winner sends all tips to platform. All residual bank nanoTON return
to the creator. Historical legacy claim semantics (including the existing cap
to available bank) remain; migration refuses existing unfunded LMSR claims.
Old decimal precision already lost in float cannot be recovered.

## Release gate

**Do not merge/deploy this runtime against an unmigrated populated database.**
Startup refuses NULL nano fields. This is a coordinated offline migration, not
a zero-downtime rollout. A new empty database needs no backfill.

1. Identify the actual DATABASE_URL backend and where its data persist. Do not
   print credentials or paste them into a PR. A git branch is not a DB backup.
2. Rehearse the commands below on a recent full database copy. Store the backup
   outside the service's ephemeral filesystem and confirm access to it.
3. Stop all application instances, expiry workers, and other writers. Prevent
   automatic old-version restarts/deploys for the maintenance window. Merely
   closing betting in the UI is insufficient (login, refunds and resolve write).
4. With the migration release checked out and dependencies installed, explicitly
   set DATABASE_URL in the process environment (the CLI does not load .env).
   Run the read-only report, inspect its issues and each rounding adjustment:

   ```sh
   python -m app.money_preflight > money-preflight.json
   python -m app.money_migrate --writers-stopped --backup /safe/betton-before-nano.backup > money-migration.json
   ```

   If the reviewed report requires rounding, append `--accept-rounding`. This
   permits HALF_EVEN conversion only; it never bypasses funding inconsistencies,
   NULL, negative, nonfinite or overflow values. Every field conversion, source
   decimal representation and delta is stored in `money_conversion_entries`.
   The summary/version is stored transactionally in `money_migrations`.
5. The command creates a full backup in a NEW file (0600; never overwrites),
   restores it to a disposable database and fingerprints that restored copy.
   Under a write lock it fingerprints the current source again. Any intervening
   change aborts; stop the writer and retry with a new backup path. Conversion,
   audit, marker and legacy-write protection are one transaction. A retry after
   success does not recalculate nano balances from obsolete floats.
6. Verify the migration marker/report and persist the backup/report outside the
   instance. Only then activate this runtime, restore normal deployment and
   traffic, and perform the smoke checks below. Do not start the old runtime on
   the converted database: guards reject old float writes and old-format inserts.

SQLite requires an existing file; its backup includes committed WAL data and
is checked with `PRAGMA integrity_check`. The migration uses BEGIN IMMEDIATE.
PostgreSQL requires compatible `pg_dump` and `pg_restore` executables plus rights
to create/drop a randomly named temporary restore database on the same server.
The migration locks all existing application tables (10-second lock timeout).
If backup/restore access is missing, stop here; do not skip restore verification.

The CLI is intended for the application database, not a shared multi-application
database. It inspects/locks user tables in the active/default schema. Use a
dedicated application database and the same schema/search_path for app and CLI.
Credentials stay in environment variables, not command arguments/logs. Reports
contain internal IDs and amounts and must remain private.

## Recovery

On a pre-commit failure, the transaction rolls back; retain the backup and
inspect the migration marker before restarting. If the marker exists, use the
new runtime. Do not fix discrepancies by topping up a bank or setting NULL to 0.

For rollback before reopening writes: stop all processes, restore the verified
full backup into a separate database/file, validate it, point the OLD release at
that restored database, and only then reopen traffic. Keep the converted copy
for investigation. A source-only rollback is unsafe. Once new transactions have
occurred, restoring the old backup would lose them; reconcile/replay them first.

## Verification

```sh
python -m pytest -q tests
```

CI additionally runs integer transfer, concurrency and full dump/restore migration
tests on PostgreSQL 16. Tests use isolated databases and fake Telegram credentials.

In Telegram: create/approve P2P → 100.000000001 TON on one side → partial opposing
stake → cancel remaining order → close/resolve. Payout/tips are automatic; bank
becomes exactly zero. In a second event test admin cancellation/refunds. Reopen
Mini App and verify balances/history, and as admin inspect P2P reconciliation.
The exact invariant is balances_nano + pots_nano + remaining order reserves;
settlement and cancellation preserve it without a tolerance.

Preflight after migration reports `integer_accounting_active`, because the old
float columns are no longer current balances. Use nano fields and the journal
for post-migration checks. Historical settlement display floats are explicitly
outside the scope of this storage conversion.
