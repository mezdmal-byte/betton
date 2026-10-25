---
name: betton-telegram-miniapp
description: Implement or debug BetTON Telegram Mini App auth, navigation, deep links, themes, or test-bot integration while preserving webhook and HMAC boundaries.
---

# Telegram contract

Use `app/telegram_auth.py`, `app/webhook_security.py`, `frontend/src/telegram/webapp.ts` and the
affected route as the contracts. Stable Telegram IDs confer admin rights; usernames do not.
Keep normal initData HMAC, TTL, future-date checks and user-scoped intent storage. Do not add a
public fake-auth endpoint or trust `initDataUnsafe` as server authentication.

SIM's direct personal menu, `/start` inline buttons and the global TEST menu may open different
origins. Verify the actual URL, frontend asset hash and authenticated `/guarantors` response.
`scripts/verify_telegram_simulation.py` checks the existing local test installation; it needs locally
stored credentials and must not print them. Do not change webhook, polling or global menu to test UI.

Preserve BackButton ownership/cleanup, share-token access, theme changes, narrow viewports and
draft/recovery behavior across close/reopen. Test current `tests/test_telegram_auth.py`,
`tests/test_webhook_security.py`, relevant navigation tests and the existing Playwright harness.
Node Playwright is already installed; do not introduce a second browser-testing stack casually.

Browser host emulation and correctly signed HTTP fixtures are integration evidence, not a claim
that Android/iOS Telegram WebView storage, bridge delivery or Back behavior was manually verified.
