"""Optional real-browser smoke test. Requires: pip install playwright; playwright install chromium.

Run from the repo root: python tests/admin_center_browser.py
Creates only a temporary synthetic DB and starts only the local Admin Center.
"""

from pathlib import Path
import os
import secrets
import socket
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import httpx
from playwright.sync_api import sync_playwright
from admin_center.security import make_password_hash
from tests.test_admin_center import fixture_db


def main():
    with tempfile.TemporaryDirectory(prefix="betton-admin-browser-") as temp:
        location = fixture_db.__wrapped__(Path(temp))
        password = secrets.token_urlsafe(24)
        env = {
            **os.environ,
            "BETTON_ADMIN_ENVIRONMENT": "test",
            "BETTON_ADMIN_DATABASE_URL": "sqlite:///" + str(location),
            "BETTON_ADMIN_USERNAME": "browser-test",
            "BETTON_ADMIN_PASSWORD_HASH": make_password_hash(password),
        }
        # Never attach to an existing service on this port.
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 8765))
        server = subprocess.Popen(
            [sys.executable, "-m", "admin_center.launcher"],
            cwd=ROOT,
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        try:
            for _ in range(80):
                if server.poll() is not None:
                    raise RuntimeError("Local viewer exited before browser test")
                try:
                    if (
                        httpx.get(
                            "http://127.0.0.1:8765", timeout=1, trust_env=False
                        ).status_code
                        == 401
                    ):
                        break
                except httpx.TransportError:
                    pass
                time.sleep(0.1)
            else:
                raise RuntimeError("Local viewer did not start")
            with sync_playwright() as p:
                browser = p.chromium.launch()
                context = browser.new_context(
                    http_credentials={"username": "browser-test", "password": password},
                    viewport={"width": 1440, "height": 900},
                )
                page = context.new_page()
                errors = []
                mutations = []
                external = []
                page.on("pageerror", lambda error: errors.append(str(error)))

                def observe(request):
                    if request.method not in ("GET", "HEAD"):
                        mutations.append(request.url)
                    if not request.url.startswith("http://127.0.0.1:8765/"):
                        external.append(request.url)

                page.on("request", observe)
                page.goto("http://127.0.0.1:8765/")
                page.get_by_text("90 TON", exact=True).wait_for()
                page.locator('#navigation a[href="#users"]').click()
                page.get_by_role("textbox").fill("1001")
                page.get_by_role("button", name="Найти", exact=True).click()
                page.locator('tbody a[href="#user?id=18"]').click()
                page.get_by_role("heading", name="Пользователь", exact=True).wait_for()
                page.locator('a[href="#order?id=501"]').first.click()
                page.get_by_role("heading", name="Заявка", exact=True).wait_for()
                page.locator('a[href="#fill?id=705"]').first.click()
                page.get_by_role("heading", name="Исполнение", exact=True).wait_for()
                page.locator('a[href="#event?id=42"]').first.click()
                page.get_by_text("Спартак — Зенит", exact=True).wait_for()
                page.locator('a[href="#entry?id=987"]').first.click()
                page.get_by_text("reserve:501", exact=True).wait_for()
                page.go_back()
                page.get_by_text("Спартак — Зенит", exact=True).wait_for()
                page.locator('#navigation a[href="#orders"]').click()
                page.get_by_role("textbox", name="ID заявки").fill("501")
                page.get_by_role("button", name="Найти", exact=True).click()
                page.locator('tbody a[href="#order?id=501"]').wait_for()
                page.locator('#navigation a[href="#monitor"]').click()
                page.get_by_role(
                    "heading", name="Состояние snapshot-базы"
                ).wait_for()
                page.goto("http://127.0.0.1:8765/#user?id=999")
                page.get_by_text("Не удалось получить данные:", exact=False).wait_for()
                page.goto("http://127.0.0.1:8765/#overview")
                page.get_by_text("90 TON", exact=True).wait_for()
                output = ROOT / ".admin-center-qa"
                output.mkdir(exist_ok=True)
                page.screenshot(path=str(output / "overview-1440.png"), full_page=True)
                page.set_viewport_size({"width": 1024, "height": 768})
                assert page.evaluate(
                    "document.documentElement.scrollWidth <= innerWidth"
                )
                page.set_viewport_size({"width": 390, "height": 844})
                assert page.evaluate(
                    "document.documentElement.scrollWidth <= innerWidth"
                )
                assert not errors, errors
                assert not mutations, mutations
                assert not external, external
                assert page.locator(".nav-dot").evaluate_all(
                    "(nodes)=>nodes.every(n=>n.complete&&n.naturalWidth>0)"
                )
                browser.close()
            print(
                "Browser smoke: PASS — search, related objects, Back, unavailable/404 states, 3 viewports; no write or external requests."
            )
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)


if __name__ == "__main__":
    main()
