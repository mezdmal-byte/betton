"""Local-only entry point; never loads app.config, .env, bot or migrations."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from sqlalchemy.orm import Session

from admin_center.app import create_app
from admin_center.security import make_password_hash
from admin_center.store import Store, read_only_engine

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / ".admin-center.json"
KEYS = (
    "BETTON_ADMIN_DATABASE_URL",
    "BETTON_ADMIN_USERNAME",
    "BETTON_ADMIN_PASSWORD_HASH",
    "BETTON_ADMIN_ENVIRONMENT",
)


def configure() -> None:
    from getpass import getpass

    print(
        "BetTON Admin Center: choose an existing LOCAL TEST database, never production."
    )
    path = (
        Path(input("Path to your SQLite test database: ").strip().strip('"'))
        .expanduser()
        .resolve(strict=True)
    )
    username = input("Separate administrator login: ").strip()
    if not username or ":" in username:
        raise ValueError("Login must be non-empty and contain no colon")
    password = getpass("New administrator password (16+ characters): ")
    if password != getpass("Repeat password: "):
        raise ValueError("Passwords do not match")
    password_hash = make_password_hash(password)
    url = "sqlite:///" + path.as_posix()
    engine = read_only_engine(url)
    try:
        # Validate the selected schema without creating or populating anything.
        with Session(engine) as db:
            Store(engine).overview(db)
    finally:
        engine.dispose()
    config = dict(zip(KEYS, (url, username, password_hash, "test")))
    fd = os.open(CONFIG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as file:
        json.dump(config, file, indent=2)
    print("Saved local configuration. Start: start-admin-center.bat")


def load_configuration() -> None:
    # Explicit env configuration is all-or-nothing: do not mix DBs/credentials.
    if any(key in os.environ for key in KEYS):
        return
    if CONFIG.is_file():
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
        for key in KEYS:
            if not isinstance(config.get(key), str):
                raise ValueError("Invalid local admin configuration")
            os.environ[key] = config[key]


def main() -> None:
    parser = argparse.ArgumentParser(description="BetTON local test-data viewer")
    parser.add_argument("--configure", action="store_true")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify configuration and read access without starting a server",
    )
    args = parser.parse_args()
    try:
        if args.configure:
            configure()
            return
        load_configuration()
        app = create_app()
        if args.check:
            engine = read_only_engine(os.environ["BETTON_ADMIN_DATABASE_URL"])
            try:
                with Session(engine) as db:
                    data = Store(engine).overview(db)
                print(
                    f"Read access OK: {data['users']} users; {data['events']} events. No data written."
                )
            finally:
                engine.dispose()
            return
        import uvicorn

        print("Open http://127.0.0.1:8765 — local read-only TEST data. Stop: Ctrl+C")
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8765,
            workers=1,
            proxy_headers=False,
            forwarded_allow_ips="",
            access_log=False,
            server_header=False,
        )
    except Exception:
        # Do not print DB driver errors: they can include credentials/connection URLs.
        parser.exit(
            1,
            "Admin Center could not start. Check local test DB, SELECT-only access and separate admin configuration.\n"
            "Configure SQLite: python -m admin_center.launcher --configure\n"
            "Environment setup: see ADMIN_CENTER_README_RU.md\n",
        )


if __name__ == "__main__":
    main()
