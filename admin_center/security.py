"""Local Basic authentication. Admin credentials are NOT Telegram credentials."""

from __future__ import annotations

import base64
import binascii
from collections import defaultdict, deque
from getpass import getpass
import hashlib
import hmac
import ipaddress
import secrets
import sys
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

ITERATIONS = 600_000
WINDOW = 600
MAX_ATTEMPTS = 10


def make_password_hash(password: str, salt: bytes | None = None) -> str:
    if len(password) < 16:
        raise ValueError("Use at least 16 characters for the admin password")
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, repetitions, salt, expected = stored.split("$")
        cost = int(repetitions)
        if algorithm != "pbkdf2_sha256" or not (200_000 <= cost <= 1_000_000):
            return False
        if len(bytes.fromhex(salt)) != 16 or len(bytes.fromhex(expected)) != 32:
            return False
        real = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt), cost
        )
        return hmac.compare_digest(real, bytes.fromhex(expected))
    except (ValueError, TypeError):
        return False


def valid_password_hash(stored: str) -> bool:
    try:
        algorithm, cost, salt, digest = stored.split("$")
        return (
            algorithm == "pbkdf2_sha256"
            and 200_000 <= int(cost) <= 1_000_000
            and len(bytes.fromhex(salt)) == 16
            and len(bytes.fromhex(digest)) == 32
        )
    except (ValueError, TypeError, AttributeError):
        return False


def is_loopback_request(request: Request, *, allow_testclient: bool = False) -> bool:
    host = request.client.host if request.client is not None else ""
    if allow_testclient and host == "testclient":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def auth_middleware(
    username: str, password_hash: str, *, allow_testclient: bool = False
):
    attempts: dict[str, deque[float]] = defaultdict(deque)

    async def guard(request: Request, call_next):
        # Never trust X-Forwarded-For: socket peer must be loopback.
        if not is_loopback_request(request, allow_testclient=allow_testclient):
            return JSONResponse({"detail": "Local access only"}, status_code=403)
        if any(
            header in request.headers
            for header in (
                "forwarded",
                "x-forwarded-for",
                "x-forwarded-host",
                "x-forwarded-proto",
            )
        ):
            return JSONResponse({"detail": "Proxy access is disabled"}, status_code=403)
        if request.headers.get("sec-fetch-site") == "cross-site":
            return JSONResponse(
                {"detail": "Cross-site access is disabled"}, status_code=403
            )
        peer = request.client.host
        now = time.monotonic()
        recent = attempts[peer]
        while recent and recent[0] < now - WINDOW:
            recent.popleft()
        if len(recent) >= MAX_ATTEMPTS:
            return JSONResponse(
                {"detail": "Too many attempts"},
                status_code=429,
                headers={"Retry-After": "600"},
            )
        header = request.headers.get("authorization", "")
        supplied_user = supplied_password = ""
        if header.startswith("Basic ") and len(header) < 4096:
            try:
                decoded = base64.b64decode(header[6:], validate=True).decode("utf-8")
                supplied_user, supplied_password = decoded.split(":", 1)
            except (ValueError, UnicodeDecodeError, binascii.Error):
                pass
        valid_user = hmac.compare_digest(supplied_user.encode(), username.encode())
        valid_password = (
            await run_in_threadpool(verify_password, supplied_password, password_hash)
            if supplied_password
            else False
        )
        if not (valid_user and valid_password):
            recent.append(now)
            return JSONResponse(
                {"detail": "Authentication required"},
                status_code=401,
                headers={"WWW-Authenticate": 'Basic realm="BetTON Admin"'},
            )
        recent.clear()
        if request.method not in {"GET", "HEAD"}:
            return JSONResponse(
                {"detail": "Read-only service"},
                status_code=405,
                headers={"Allow": "GET, HEAD"},
            )
        response = await call_next(request)
        response.headers["Cache-Control"] = "private, no-store, max-age=0"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; script-src 'self'; style-src 'self'; "
            "connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'"
        )
        return response

    return guard


def main() -> None:
    print("Password is entered locally and is not printed or sent to GitHub.")
    p1 = getpass("New administrator password (16+ characters): ")
    p2 = getpass("Repeat password: ")
    if p1 != p2:
        sys.exit("Passwords do not match")
    print("BETTON_ADMIN_PASSWORD_HASH=" + make_password_hash(p1))


if __name__ == "__main__":
    main()
