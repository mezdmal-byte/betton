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

## Checkpoint 2 — diagnostics, Admin Center, skills integrated

- Release tooling commit: `c204b9f` (pushed).
- Financial toolkit: `b350253` (agent source `162a2a2`); **20 passed** again in this branch.
- Admin Center: `d98c388` + PG fixture-boundary patch `d598c51`; **24 passed** integrated SQLite tests.
- Pinned design skills + six BetTON skills/workflow: `5b952a1`; inline-path correction `a3b0828`.
- Root developer gate: **8 passed** before path-regression extension; agent final extension **10 passed**, 26 inline references verified. Root `--skills` succeeds after integration.
- Skills are filesystem-installed and validated, discoverable by Codex on its next turn; manually read/used financial-safety and official prototype instructions during this sprint.
- Root Admin browser: **14 sections**, zero write/external requests, snapshot SHA unchanged, schema4 diagnostics `checks_passed`; desktop/mobile screenshots actually viewed under `.ux-preview/admin-center-runtime/screenshots/`.
- Admin Center is running on loopback **8885**, generated local credentials only in `.ux-preview/admin-center-runtime/access.json`. Stop with `stop-admin-simulation.bat`. It does not share a writable database or start app workers.
- Confirmed Windows defect fixed: SQLAlchemy2.1 escaped `C:` as `C%3A`; Admin's manual SQLite URL parsing now decodes once, with regression.
- Legacy snapshot findings: 263 markets / 217 orders / 73 fills / 564 journal rows / 26 settlements; 36 float pot mismatches versus internally consistent nano/journal facts. Storage authority remains unknown because version/migration markers are missing. No corrective postings or migration performed.
- Product Guardian reviewed isolated onboarding flow: **compatible**, with explicit examples, IOC/limit distinction, 1%/75:25, private-link rules and final guarantor decisions. Art Director now builds three separate live directions; actual onboarding untouched.
- In progress: full combined SQLite run; native PG admin role regression; separate prototype mobile/theme/language/motion checks. Never substitute previous counts for these pending results.

## Checkpoint 3 — resumed after account limit, 26 October

- At resume, root HEAD was `7c22a15`; remote PR #24 still `a8ca059`. Two uncommitted root files were preserved/reviewed: release rehearsal financial gate and its corruption regression.
- `7c22a15` adds the actual PostgreSQL SELECT-only role regression. Native full PG run completed: **505 passed, 0 skipped**, `.ux-preview/night-postgres-full.log`; temporary database `betton_test_night_20261026_0132`, localhost55432 only.
- Earlier combined SQLite run: **478 passed, 25 PG-only skipped**; it began before the extra native-PG/corruption tests were collected. Do not label it the final HEAD suite.
- Release financial gate: **7 passed**; proven money corruption blocks rehearsal without repairing source. A real SIM snapshot rehearsal also passed, retained all pre-existing rows, restored backup/rollback and kept release authorization false.
- Frontend: **175 passed / 30 files**, TypeScript/Vite build success; existing >500kB bundle warning retained.
- Onboarding agent worktree contains uncommitted, working three-direction implementation and isolated tests/config/docs; not overwritten. Its first matrix: **73 passed**, separate typecheck/build passed. Independent Impeccable A/B critique and one bounded fix/confirm were interrupted by account limit and resumed. No design direction selected or production onboarding changed.
- Next: commit/push reviewed root gate, complete A/B review and prototype handoff, integrate checked prototype commit, run final combined checks and update PR/report. Preserve all agent trees until their work is committed/integrated.
