# Night sprint release gates — 26 October 2026

This is a review checklist, not authorization to deploy. PR #24 depends on #23,
which depends on #22; no sequential blind merge of #20/#21 is required.

## Bounded audit inventory

| IDs | Current source evidence | Remaining release evidence |
|---|---|---|
| S1, S3 | PR #20 is an ancestor of night base; webhook module identical to PR #21; stable-ID auth and explicit webhook lifecycle retained | Private verification of administrator IDs and authorized webhook rollout; no production mutation performed |
| S2, A1, F3 | Explicit schema4 migrations, BIGINT/FK and startup checks; existing rollback/concurrency tests | Actual approved source-copy diagnosis and restoration rehearsal; do not adopt unknown storage authority |
| F1, F2 | Journal/history projections, persisted intent/owned lookup and schema4 legacy receipt; PR22 unkeyed buy guard retained | Real mobile Telegram storage/reopen smoke and final CI for reviewed integration SHA |
| A4 | Event/invitation/intent in one transaction; PR23 adds guarded demo run to the same transaction | Final combined SQLite/PostgreSQL tests and tested client/server compatibility |

All eight mandatory findings were implemented before this sprint. No additional
confirmed money/auth regression is claimed by this inventory. Production rollout
has not happened in this work. Previous test counts are historical, not night CI.

## Offline copy rehearsal (new runnable tool)

```powershell
.venv\Scripts\python.exe scripts/rehearse_release.py --source PATH_TO_APPROVED_SQLITE_SNAPSHOT --work-dir .ux-preview/release-review-001
```

The destination must be new and inside this checkout's `.ux-preview`. Source is
opened read-only and online-backed-up; its migration is never invoked. The child
clears production environment settings, refuses dotenv and works only on the new
copy. Existing backup/restore and migration services are reused. Schema 3/4 only;
unversioned legacy money needs separate diagnosis, not an automatic conversion.

Output is anonymous checks/hashes in `report.json`, plus retained before/after and
restored copies. Exit 0 means this bounded SQLite rehearsal passed; 2 means blocked.
It checks backup restoration, preserved rows in **all existing tables**, explicit
upgrade, repeat upgrade, readiness and rollback restoration into another copy.
It does not certify historical correctness, repair balances, migrate production,
prove on-device Telegram behaviour or replace PostgreSQL CI.

## Required review before any later release

- [ ] Reviewed code and exact final SHA; combined CI linked in progress log.
- [ ] Anonymous financial diagnostics distinguish critical/unknown/history gaps.
- [ ] Source storage authority and any legacy float/nano mismatch resolved using evidence.
- [ ] Approved consistent backup, restored into a new database, matching fingerprints.
- [ ] Schema and money readiness on the restored copy; no rounding auto-acceptance.
- [ ] Receipt replay, migration rollback/concurrency and money invariants pass in PostgreSQL.
- [ ] Real Telegram Android/iOS smoke: signed initData, private links, back, reload/recovery.
- [ ] Separate owner authorization for writers maintenance, production deploy and webhook actions.

Unmet boxes stay unmet; neither this checklist nor a green synthetic test grants
production permissions. Existing maintenance fallback and rollback restrictions
remain in `PRODUCTION_READINESS_20261025.md`.
