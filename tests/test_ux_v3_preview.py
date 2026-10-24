"""Launcher safety tests: all DB integration occurs in a separate child process."""

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "ux_v3_preview_test_module", ROOT / "scripts" / "ux_v3_preview.py"
)
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


def test_preview_refuses_unmarked_database_and_escape(tmp_path, monkeypatch):
    monkeypatch.setattr(preview, "SANDBOX_ROOT", tmp_path / "allowed")
    state = tmp_path / "allowed" / "state"
    state.mkdir(parents=True)
    database = state / preview.DATABASE_NAME
    database.write_bytes(b"do not touch")
    with pytest.raises(RuntimeError, match="unmarked"):
        preview.prepare_state(state)
    assert database.read_bytes() == b"do not touch"
    with pytest.raises(RuntimeError, match="inside"):
        preview.prepare_state(tmp_path / "outside")


def test_preview_marker_is_required_and_dotenv_forbidden(tmp_path, monkeypatch):
    monkeypatch.setattr(preview, "SANDBOX_ROOT", tmp_path)
    state, marker = preview.prepare_state(tmp_path / "safe")
    assert marker["seeded"] is False
    (state / "ux-v3-sandbox.json").write_text('{"kind":"other"}')
    with pytest.raises(RuntimeError, match="Unrecognized"):
        preview.prepare_state(state)
    (state / ".env").write_text("DATABASE_URL=sqlite:///arbitrary.db")
    with pytest.raises(RuntimeError, match=".env"):
        preview.prepare_state(state)


def test_preview_real_auth_is_signed_and_expires():
    from app.telegram_auth import TelegramAuthError, validate_init_data

    token = preview.signed_init_data("creator", now=1700000000)
    assert (
        validate_init_data(token, preview.LOCAL_TOKEN, now=1700000000)["id"]
        == preview.ACTORS["creator"]["id"]
    )
    with pytest.raises(TelegramAuthError):
        validate_init_data(token, "different-token", now=1700000000)
    with pytest.raises(TelegramAuthError):
        validate_init_data(token, preview.LOCAL_TOKEN, now=1700004000)


def test_preview_real_seed_isolated_idempotent_and_external_settings_ignored():
    preview.SANDBOX_ROOT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix="launcher-test-", dir=preview.SANDBOX_ROOT
    ) as temporary:
        state = Path(temporary)
        command = [
            sys.executable,
            str(ROOT / "scripts" / "ux_v3_preview.py"),
            "--state-dir",
            str(state),
            "--smoke",
        ]
        environment = {
            **os.environ,
            "DATABASE_URL": "postgresql://never-connect.invalid/production",
            "BOT_TOKEN": "not-a-real-token-do-not-load",
            "PUBLIC_BASE_URL": "https://never-connect.invalid",
            "TELEGRAM_AUTH_PROXY_URL": "https://never-connect.invalid",
            "TELEGRAM_WEBHOOK_PROXY_URL": "https://never-connect.invalid",
        }
        results = []
        for _ in range(2):
            process = subprocess.run(
                command,
                check=False,
                cwd=ROOT,
                env=environment,
                text=True,
                capture_output=True,
                timeout=40,
            )
            assert process.returncode == 0, process.stderr + process.stdout
            results.append(json.loads(process.stdout.strip().splitlines()[-1]))
        assert results[0]["auth_user"] == results[1]["auth_user"]
        assert results[0]["feed"] == {
            "active_offers_nano": "110000000000",
            "scope": "all_active_events",
        }
        marker = json.loads((state / "ux-v3-sandbox.json").read_text())
        assert marker["seeded"] is True and len(marker["users"]) == 4
        assert (state / preview.DATABASE_NAME).is_file()


def test_preview_cannot_reconfigure_existing_application():
    # pytest's normal test app already imported its config; refuse switching it.
    from app import config  # noqa: F401

    with pytest.raises(RuntimeError, match="separate process"):
        preview.configure_process(preview.SANDBOX_ROOT)
