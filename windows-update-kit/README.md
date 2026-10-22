# BetTON / SobakaPes — Windows update kit (22 Oct 2026)

This kit is stored on a separate branch. No production main files or Render services were changed.

## What to copy to C:\Users\1\betton

- 01-UPDATE-BETTON.bat
- update-betton.ps1
- 02-START-SOBAKAPES.bat (optional, convenient shortcut)
- 03-STOP-SOBAKAPES.bat (optional, convenient shortcut)

Keep the BAT updater next to its PowerShell helper.

## Use

1. Stop the local app using the existing stop-betton-always-on.bat.
2. Double-click 01-UPDATE-BETTON.bat.
3. The updater checks Git and fetches feature/react-full-preview into a temporary directory.
4. It backs up any source files that would be overwritten or removed, then syncs source into the original project.
5. Once SUCCESS appears, start with the existing start-betton-always-on.bat or the provided 02 shortcut.

## What is NEVER modified by the updater

- Any *.bat, *.cmd, *.ps1 launchers (any project subdirectory).
- .env and .env.* (including any local secrets).
- *.db, *.sqlite, *.sqlite3 and SQLite WAL/SHM/journal files.
- .git, .venv, node_modules, dist/build, .betton-run and other runtime directories.
- Untracked files not present in the snapshot.

The updater does delete obsolete tracked source files no longer in the target branch,
but saves their original contents to a timestamped backup BEFORE deleting.

Backups: C:\Users\1\betton\.betton-update-backups\YYYY-MM-DD_HH-mm-ss
Read UPDATE-REPORT.txt for the downloaded GitHub commit.

## Important branch behavior

The existing always-on launcher uses feature/react-full-preview.
This updater deliberately synchronizes ONLY that branch.
If local Git is on a different branch it refuses to update. No automatic branch switch.

This is a file sync, not git reset/checkout. Git HEAD and your launcher scripts are untouched.
After updating, 'local modifications found; git pull skipped' in the existing launcher can be
EXPECTED. Use 01-UPDATE-BETTON.bat for later updates instead of assuming its built-in Git
pull will work. The launcher still builds frontend sources and starts local FastAPI/Cloudflare.

If you ever restore the local Git checkout to a clean state, the original launcher
may resume its own automatic git pull. The updater itself will not touch your launchers.

## Recovery launchers

The recovery-launcher folder contains exact copies from the GitHub
feature/react-full-preview branch of:
- start-betton-always-on.bat
- start-betton-always-on.ps1
- stop-betton-always-on.bat

These are verified repository copies, NOT proof they are identical to your current
locally modified last-successful launcher. Do NOT overwrite a working local launcher
with a recovery copy unless you intend to restore that repository version.

## Caveats

- The updater requires Git in PATH and network access to GitHub.
- It does not update Python dependencies or npm packages; the existing launcher
  rebuilds frontend source if necessary. If dependencies changed, rebuild/install
  may need manual attention.
- It has not been executed on your Windows computer; check the backup and output.
- Do not run while local BetTON is still serving port 8000 or the watchdog is alive.
- Do not treat this as a database backup or production deployment tool.
