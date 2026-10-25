---
name: betton-debugging
description: Reproduce and fix a concrete BetTON regression using the actual runtime, bounded diagnostics, a minimal patch, and a regression test.
---

# Debug the actual BetTON runtime

Identify the checkout, commit, process, port, origin and database before interpreting a symptom.
The ordinary TEST server and SIM can serve identical frontend bundles against different databases.
For Telegram SIM, inspect `.ux-preview/telegram-simulation-runtime/verification.json`, the actual
personal menu and HMAC API response; file presence or `/ready` alone does not prove the user flow.

Use `rg` to locate the failed contract. Reproduce on an isolated fixture/copy, record expected versus
observed behavior, then add the smallest meaningful regression test. Keep auth/money assertions
intact. A failed command is not evidence that an unrelated service is down: distinguish sandbox,
DNS, VPN, app readiness and configuration errors.

Read launcher/server logs locally; redact tokens, initData, credentials and personal content from
output. Preserve old BAT/config files before changing them. Do not reset active demo data to hide
an initialization problem, start duplicate workers, or retry configuration failures forever.

Use `python scripts/check_dev.py --tests tests/test_<affected>.py` once available, then broaden
only for a concrete integration risk. Explain the demonstrated root cause, changed component,
tests and remaining uncertainty. Commit checked source files only; do not include runtime logs.
