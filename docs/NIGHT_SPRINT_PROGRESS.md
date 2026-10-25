# BetTON night sprint — 26 October 2026

## Checkpoint 0 — isolated start

- Branch: `codex/night-sprint-20261026`.
- Base PR #23: `4574ba19ffe8a033001cbf25ab4ace472b29d7a9` (verified GitHub HEAD).
- PR #22: `d83d35562917b9fcb2fcdc4076c11499b93f41ac`; #20: `671d3d5d9f86df1b4977ad24cd42aeee1bb01db0`; #21: `54ebdb7d94c34370a6cb12de3950c82db98ccc3f`.
- Admin Center source: `7b8f8cc7ed7ebf093d63ec48232342e4006e1310`, `feature/admin-center-readonly-v1`.
- Working copy: separate managed `betton-night-sprint` worktree. Original checkout and running SIM worktree preserved.
- Existing Python/Node dependencies reused via junctions; do not install into shared environments.
- No production/Render/webhook/global-menu mutations or automatic merges authorized.

## Work allocation / next steps

1. Root: bounded audit inventory and concrete release/developer checks; integrate tested commits.
2. Financial toolkit: isolated branch/worktree, read-only diagnostics and synthetic tests.
3. Admin Center: isolated branch/worktree, port only compatible existing admin implementation; snapshot-only local verification.
4. Skills/workflow: isolated branch/worktree, installed-source inventory, six scoped project skills, instructions and verification.
5. After foundations: isolated three-direction onboarding prototype using required design skills, browser screenshots and mobile checks; never replace live onboarding.

No nightly tests or deployments claimed yet. Preserve exact commands, counts, commit SHAs and remaining work at each checkpoint.

## Checkpoint 1 — bounded audit / release copy tooling

- Night PR: https://github.com/mezdmal-byte/betton/pull/24 (draft; base #23).
- Start checkpoint commit: `88aa2d8`.
- Verified PR #20 ancestor relationship and fetched PR #21: `app/webhook_security.py` has no diff from #21.
- Eight mandatory IDs already implemented; release gates remain distinct from deployed status.
- Added `scripts/rehearse_release.py`, `tests/test_rehearse_release_cli.py`, `docs/NIGHT_RELEASE_GATES.md`.
- Rehearsal copies only into a fresh `.ux-preview` folder; production config/dotenv rejected; source is never migrated. Existing upgrade and verified backup/restore reused.
- Tests: initial CLI + existing release/schema suite **9 passed, 2 PG-only skipped**; final CLI after extra configuration guards **6 passed**. Logs: `.ux-preview/release-targeted.log`, `release-cli-final.log`.
- Updated historical float-storage warning in `docs/p2p.md`; no money formulas changed.
- Financial agent found a distinction worth preserving: unversioned legacy snapshot has nano/journal data but diverging float mirrors; exact classification/tests pending its commit. Do not label it proven double-credit or silently convert it.
- Next: integrate tested diagnostic/Admin/skills commits; run combined suites on separate databases; build isolated onboarding variants.
