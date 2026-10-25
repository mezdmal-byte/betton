# BetTON Admin Center — v1 design & implementation contract

Status: **LOCAL READ-ONLY IMPLEMENTATION.** A separate localhost/test-data viewer now exists; see [implementation status](ADMIN_CENTER_IMPLEMENTATION_STATUS.md) and [Windows runbook](../ADMIN_CENTER_README_RU.md). It does not mount endpoints in the main app, change money, migrate a DB, or deploy anything. The user's existing test DB connection remains unverified until an approved local test file is supplied.
Figma desktop wireframes: https://www.figma.com/design/GRbVHwppYxx5c7N5WG1BVA/Untitled?node-id=421-3
Source baseline: requested branch `feature/admin-center-readonly-v1` at `0d0255080a7cbaa1adbd54e2c923ee70e9a9baec`, descended from `feature/guarantor-mvp`. No merge target is authorized.

## Goal

A protected, separate desktop web interface, **not** the user-facing Telegram Mini App, for investigations and support. First release is **read-only**: find a user/event/order, trace P2P money movements, inspect guarantor cases and check errors. Use only real rows once connected. Figma numbers are synthetic and are not live telemetry.

## Proven existing data

| Source | Facts / proposed UI |
| --- | --- |
| `users` | internal ID, Telegram identity, displayed balance, created-at (identity visibility must be role-limited) |
| `markets` | ID, creator ID, status, category, visibility when schema supports it, dates, outcome |
| `p2p_orders` | ID, user ID, market ID, request ID, outcome, amount, filled, remaining, status |
| `p2p_fills` | maker/taker IDs, order IDs, stakes, execution price, timestamp |
| `p2p_money_entries` | immutable-by-application money journal for reserve, fill-to-pot, refund, payout, tips, void returns |
| `settlement_records` | settlement results and credited/payout amounts |
| `guarantor_cases`, `guarantor_messages` | current state, revisions, timing and negotiation messages |
| `app/services/p2p_ledger.py` | `reconcile(db, market_id)` exists; coverage can be incomplete for older events |

**Not proven yet:** a centralized immutable audit trail of every important user/admin action, request correlation across every service, error/trace aggregation, backup monitoring, deposit/withdrawal integration with live TON, external-wallet reconciliations, secure desktop administrator login. Do not display mock statuses as live.

## Proposed screens in Figma

1. Overview — metrics and incident feed.
2. Users — search ID, Telegram ID or name; paginated result table.
3. User detail — activity timeline, orders, fills, money entries, settlements, related markets; read-only.
4. Event detail — creator, guarantor, status, terms revisions, timeline, order/fill/settlement details and reconciliation.
5. Money ledger — filters by actor, market, order/fill ID, type and date.
6. Audit & Errors — events correlated by request_id/interaction_id; severity, actor, object, result.

Future: moderators' queue, guarantor dashboard, case management, incident detail, backup/recovery status; authorizations separately approved.

## Important semantics

- **Available balance** is not the same as **reserved/open offers**, **filled stakes**, **pot**, **settlement payout**, or external wallet balance.
- Financial history for pre-journal periods cannot be reconstructed from nonexistent records.
- All money amounts should be handled internally in integer nanoTON, not floats, where the active implementation supports it. Verify branch/schema differences.
- `request_id` on an order is an idempotency key, not necessarily a tracing correlation ID.
- No display of unverified counts/totals. Missing data must say “Нет данных”, never “Норма”.
- Logged administrator actions must retain the **original creator ID** when moderation edits a public event, so revenue attribution stays unchanged.

## Needed audit event contract (not yet implemented)

Proposed append-only `audit_events` schema:

- `id`, `occurred_at_utc`, `recorded_at_utc`;
- `actor_kind` (user/admin/guarantor/system), `actor_user_id` if known;
- `action`, `object_type`, `object_id`, `result`, `failure_code`;
- `request_id` (correlation ID), `related_market_id`, `related_order_id`;
- `old_revision`, `new_revision`, *bounded sanitized* `metadata_json`.

Record meaningful state changes, auth/authorization failures, moderation edits and decisions, guarantor transitions, account restrictions, exceptional order/payment events, journal reconciliation failures and admin reads of sensitive records. Never record credentials, secrets, raw Telegram `initData`, passwords, private keys, unmasked sensitive identifiers, or unbounded chat contents. Keep financial journal independent of generic audit log.

## Security gates before actual backend connection

The local test-only milestone uses one separate read-only administrator, loopback HTTP Basic and an explicit local test DB selection. The MFA, remote RBAC, immutable access-audit and operational controls below remain gates for future remote/production use; they are not claimed complete by this milestone.

1. Separate admin identity/login, MFA for privileged roles, server-side RBAC with default deny.
2. TLS when accessed outside localhost, no public UI backed by simple client-side password.
3. Read-only service account for viewing production data; write/admin actions are separate capabilities with explicit approval, not included in v1.
4. Audit administrator activity itself and access to sensitive user data.
5. Pagination, explicit query bounds, rate limits, safe filtering, no full database dumps or uncontrolled exports.
6. Backup/restore and database health checks; configure retention, rotation, access controls, masking and integrity protections.
7. Test both positive and **unauthorized** paths, including object-level access. Never expose to public Render before security review.
8. Read-only pages should not call any ORM mutator, DB migration, event settlement, payout or cancellation function.

Relevant guidance:
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

## Implementation order

**Phase 1:** data/source mapping and Figma reference reviewed. No production changes.

**Phase 2 (current branch):** separate protected read-only API and desktop frontend implemented and tested on isolated SQLite and actual-schema P2P-generated test rows. Users, events, P2P orders, fills, settlements and money entries are connected. Only stored coverage is shown; full reconciliation remains disconnected. Connection to the user's existing **test** database is pending availability of that database. No merge or deployment performed.

**Phase 3:** persist missing meaningful audit events and correlate exceptions. Reconcile with financial journal, build incident filters. No retroactive synthetic history.

**Phase 4:** moderator/guarantor operations with rigorous authorization, immutable change history, human confirmation and per-action logging.

**Before real TON:** external deposit/withdrawal ledger, chain confirmation/reorg handling, anti-duplicate idempotency, key custody controls, rate limits, fraud/manual review, recovery drills and deployment security review.

### Acceptance for first live-read-only milestone

An authorized administrator on a desktop browser can locate a **real test** user/event/order by ID, traverse links to all associated fills and entries, distinguish current/reserved/settled amounts, and see incomplete coverage explicitly. Unauthorized users cannot retrieve any admin data. UI remains separate from Telegram. No money-changing calls are possible from this service.
