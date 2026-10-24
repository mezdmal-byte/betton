import os
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient

from tests.auth_helpers import TEST_BOT_TOKEN

# Isolated test DB only. Never reuse production DATABASE_URL / Render secrets.
_ALLOWED_PG_HOSTS = {"localhost", "127.0.0.1", "postgres", "::1"}
_TEST_PG = os.environ.get("BETTON_TEST_DATABASE_URL", "").strip()
if _TEST_PG:
    if not _TEST_PG.startswith("postgresql"):
        raise RuntimeError("BETTON_TEST_DATABASE_URL must be a postgresql:// URL")
    host = urlparse(_TEST_PG).hostname
    if host not in _ALLOWED_PG_HOSTS:
        raise RuntimeError("BETTON_TEST_DATABASE_URL must point at a local/CI test database")
    os.environ["DATABASE_URL"] = _TEST_PG
else:
    _fd, _TEST_DB = tempfile.mkstemp(prefix="betton-test-", suffix=".db")
    os.close(_fd)
    os.environ["DATABASE_URL"] = "sqlite:///" + Path(_TEST_DB).as_posix()
os.environ["BOT_TOKEN"] = TEST_BOT_TOKEN
os.environ["ADMIN_TELEGRAM_ID"] = ""
os.environ["MINI_APP_URL"] = "http://127.0.0.1"
os.environ["PUBLIC_BASE_URL"] = "http://127.0.0.1"
os.environ["RENDER_EXTERNAL_URL"] = ""


@pytest.fixture
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
