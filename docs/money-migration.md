# Before migrating shared money columns

Current shared balances and market pots are still floats. P2P order/fill amounts
and journal movements already use integer nanoTON. This change only provides a
read-only inventory; it does not switch accounting or backfill columns.

On a **database copy**, explicitly set DATABASE_URL and run:

```sh
python -m app.money_preflight > money-preflight.json
```

No URL is accepted on the command line. The tool does not load .env, import the
application configuration, start Telegram, or run ensure_schema. The output omits
connection credentials, usernames and Telegram IDs; it still contains internal
row IDs and monetary amounts, so treat it as a private operational report.

SQLite opens an existing file in mode=ro with query_only and a read transaction.
PostgreSQL uses a REPEATABLE READ, READ ONLY transaction. Each report observes a
single snapshot, not a mix of different moments during ongoing trading.

Exit codes:
- 0: scanned values need no rounding and the listed structural checks passed.
- 1: invalid values, schema gaps, funding discrepancies or rounding proposals.
- 2: configuration/connection failure; no database writes performed.

The proposed conversion is Decimal(str(stored_value)) * 1,000,000,000, rounded
half-even. Every nonzero adjustment is reported; nothing is silently accepted or
applied. Nonfinite, null, negative and signed-BIGINT-overflow amounts are blockers.
Original decimal precision already lost to float cannot be recovered. Aggregate
nano amounts are JSON strings so JavaScript cannot silently round large integers.

The report scans users.balance, markets.pot and markets.lock_ton; it checks P2P
order identities, fill references, reserves after close and current P2P bank
against the fills for open/closed events (zero for resolved/cancelled events).
The reserve total is separate from the bank; executed amounts are not counted
twice. Legacy LMSR pots/collateral are inventoried, but LMSR liabilities and past
settlements are outside this report. A clean report is NOT a complete financial
audit, a migration authorization or proof that all money columns are already exact.

Next steps before backfill:
1. Verify database backup restoration and inspect this report from a fresh copy.
2. Decide rounding treatment; never silently invent missing funds.
3. Implement integer balance/pot writes for ALL paths, including legacy LMSR.
4. Stop writes during the actual backfill, rescan and verify conservation.
5. Keep old columns for verification until the new accounting is validated.

Production data was not scanned or changed as part of adding this tool.
