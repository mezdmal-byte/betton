# Project skills and developer workflow

Checked 26 October 2026 in an isolated worktree based on PR #23 `4574ba1`.
Nothing was installed into the shared Python/Node environments, and the running SIM was not restarted.

## Inventory and provenance

| Candidate | Observed source / licence | Decision |
|---|---|---|
| Impeccable | Existing tracked `.cursor/skills/impeccable`, 4.3.1, Apache-2.0; [upstream](https://github.com/pbakaus/impeccable) | Preserve canonical runtime/reference tree and hook. New `.agents` discovery adapter points to it; no second runtime. Exact upstream commit of the already-vendored copy is not claimed. |
| design-taste-frontend | Existing tracked `.agents/skills/design-taste-frontend`; [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), MIT | Preserve existing entry and legacy tree hash. Auxiliary reference only, not BetTON product architect. |
| emil-design-eng | [emilkowalski/skills](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/emil-design-eng), MIT | Actually installed using bundled Codex installer at pinned commit `2d228630ba1446365f614a108cb8252f1feda202`; licence included. |
| prototype | [Same pinned official repository](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/prototype), MIT | Actually installed, including exact PICKER.md. Codex adaptation: unsupported `disable-model-invocation` moved to `agents/openai.yaml` `allow_implicit_invocation: false`. Instructions/picker unchanged. |
| UI UX Pro Max | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), repository API reports MIT | Not installed: duplicates the existing product design workflow and adds another recommendation/data workflow without a demonstrated BetTON gap. No installer executed. |
| frontend-design | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design); per-skill licence referenced | Read entry, not installed: duplicates Impeccable/Taste's visual direction work. No claim that an uninstalled package passed runtime tests. |
| webapp-testing | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing), per-folder Apache-2.0 inspected | Read entry/licence, not installed: its required native Python Playwright workflow duplicates the project's working Node Playwright suite and would add another browser-testing dependency. |
| vercel-react-best-practices | Already available as the bundled `vercel:react-best-practices` skill in Codex | No duplicate downloaded into the repository. Follow the existing skill when multiple TSX components change. |
| find-skills | [vercel-labs/skills](https://github.com/vercel-labs/skills), MIT; entry inspected | Not installed: bundled skill-installer already handles the requested discovery/install workflow; avoid a second floating `npx skills@latest` path. |

Repository APIs and source entries were consulted directly with authenticated `gh api`. No unknown shell
installer was executed. Downloaded skills contain prose, picker examples and licence files; a bounded scan
found no privilege escalation, credential collection or network/install commands in their instructions.
The only network installer executed was the preinstalled OpenAI Codex `skill-installer` helper, with an
explicit repository/path/SHA and this worktree's `.agents/skills` destination.

The original checkout had untracked Emil/prototype directories and lock entries. Those were read only;
this branch reproduces them from the reviewed official pin rather than copying uncommitted files.
`.cursor/hooks.json` and existing role prompts are preserved. No hook was disabled or replaced.

`skills-lock.json` distinguishes existing npm-skills tree hashes from new `skill-entry-sha256` hashes.
New digests normalize UTF-8 CRLF to LF (`normalization: utf8-lf`) so Git autocrlf on Windows does not
invalidate reviewed text. The digest identifies the reviewed entry after the explicit Codex adaptation. It does not
pretend to hash every asset or certify the arbitrary behavior of an upstream package.

## Six project skills

Installed in `.agents/skills`: `betton-financial-safety`, `betton-debugging`,
`betton-telegram-miniapp`, `betton-ui-quality`, `betton-simulation`, `betton-release`.
They point to existing code/contracts and contain no secrets, account IDs or live database paths.
Use them by name; normal skill discovery applies. Prototype stays explicitly invoked, as upstream intended.
New skills become available through Codex discovery on the next turn; the current turn can read their
absolute `SKILL.md` paths directly. This is not a claim that a model silently reloaded its initial catalog.

Impeccable's actual commands (cwd must be this repository):

```powershell
.cursor\skills\impeccable\scripts\impeccable.cmd context
Get-Content .cursor/skills/impeccable/reference/craft-floor.md
```

The Windows launcher's `--help` was actually run successfully. A backend-only skills setup does not run
design `context`; run it once at the beginning of the actual design session. The shipped runtime is used;
no binary or browser was downloaded by this skills task.

## Repeatable setup and checks

```powershell
# Offline verification of existing installed skills; never overwrites them.
./scripts/setup-design-skills.ps1
# Only if a pinned skill is missing, explicitly permit the reviewed download.
./scripts/setup-design-skills.ps1 -Install

python scripts/check_dev.py --skills
python scripts/check_dev.py --skills --tests tests/test_dev_checks.py
python scripts/check_dev.py --frontend
python scripts/check_dev.py --types
```

`check-dev.bat` forwards the same flags and leaves the result window readable. The default gate inspects
the **staged index**, including the staged bytes even when a working copy has subsequently changed.
It runs `git diff --cached --check`, rejects runtime databases/backups/logs/private directories and detects
common Telegram/GitHub token, private-key and credential-assignment patterns. Findings print only path
and rule, not matched content. `.env.example` placeholders remain allowed; actual `.env` is blocked.
This is a bounded pattern check, not a guarantee that every possible secret is detectable. Review the diff.

Optional tests/builds run only after a clean staged gate. No dependency installation, app startup,
migration, network request or deployment is a side effect. `--types` uses the installed TypeScript;
`--frontend` runs the existing unit test and production build scripts, which already include TypeScript.

## Existing CI and verification

Keep `.github/workflows/postgres-p2p-ledger.yml`, `frontend-ci.yml`, `ui-screenshots.yml`. PR events already
run the relevant backend, PostgreSQL, frontend and browser checks; a parallel replacement CI is unnecessary.
The developer-check tests run in the existing backend jobs. BetTON-authored skill inline repo references
are checked as well as Markdown links: concrete paths must exist; named templates/globs are skipped.
Upstream generic skills are excluded from this repo-specific check. Forward use caught the wrong
`app/migrations.py` reference; it is corrected to the real `app/migrations/` package.
The quick gate does not claim to replace the
full PostgreSQL/recovery/browser suite or actual Telegram WebView testing.

Behavioral verification uses isolated temporary Git repositories: staged secret retained despite a clean
working file, unstaged content not confused with the index, private artifact rejection, safe example env,
no optional tests after a failed gate, missing skill reference and pin mismatch detection. No live service
or money database is involved. This is also a small actual use of the new debugging/release skill workflow.
