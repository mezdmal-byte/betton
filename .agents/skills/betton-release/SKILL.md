---
name: betton-release
description: Prepare a reviewable BetTON release candidate with staged-source checks, isolated migration rehearsals, CI evidence and rollback limits; deployment and merge remain separately authorized.
---

# Candidate verification

Read `docs/PRODUCTION_READINESS_20261025.md`, `docs/POST_AUDIT_FIXES_20261024.md` and the current
progress report. Verify branch/HEAD and actual PR checks instead of copying an older green run.
Keep checked source commits and a single relevant PR; never force push or merge automatically.

Start with `python scripts/check_dev.py --skills` and targeted tests; use `--frontend` for the
existing unit tests and TypeScript/Vite build. Full checks remain the existing GitHub Actions
SQLite, PostgreSQL and browser workflows. A skipped PG test is not PostgreSQL evidence.

Schema startup must not perform DDL. Rehearse schema 3→4, replay, backup/restore and failure
rollback only on disposable copies through existing migration tools and
`tests/test_release_rehearsal.py`. Historical pot/fill mismatches block migration; they do not
authorize invented corrections. Preserve receipts and journal in every recovery path.

Check staged diff for secrets, databases, backups and personal dumps. Exports should be anonymized.
Report exact commands/counts/CI SHA and remaining real Telegram/staging gates.
The maintenance app is a safe stop for roll-forward, not proof that an older build can read schema 4.
No production/Render/menu/webhook mutation or real transfer follows implicitly from candidate readiness.
