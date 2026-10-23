# Admin Center — implementation status (2026-10-23)

The standalone local read-only prototype was implemented and tested in this ChatGPT conversation. The tested source package is delivered as `BetTON_Admin_Center_v1_local.zip` in the conversation, rather than committed to this branch: the file-to-GitHub transfer was unavailable in the current environment.

**Do not claim this branch has the executable code or deploy it.** It contains the architecture at `docs/ADMIN_CENTER_V1.md`; the attached package is the current source for the next merge.

Package contents:
- `admin_center/app.py` separate FastAPI app factory, API routes and local-only guard
- `admin_center/security.py` PBKDF2 password hashes and HTTP Basic authentication
- `admin_center/store.py` SQLAlchemy read-only database adapter
- `admin_center/static/` editable desktop frontend UI (HTML, CSS, JS)
- `tests/test_admin_center.py` 6 isolated tests with a synthetic SQLite DB
- `start-admin-center.bat` and `ADMIN_CENTER_README_RU.md`

Test result: **6 passed** locally (isolated fixture DB); frontend JavaScript passed syntax validation. No repository-wide CI or Render deployment has been run. Existing money logic, production database, and Telegram bot were not changed.

Known limitations: audit/error logs, live monitoring, backups, external TON wallets, and production-safe remote administrator authentication remain unimplemented. Only local, explicit DB connections; no write endpoints or schema migrations.