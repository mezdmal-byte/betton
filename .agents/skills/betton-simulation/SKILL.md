---
name: betton-simulation
description: Run, verify or extend BetTON browser and Telegram simulations with marked isolated databases, synthetic guarantors, retained history and safe Windows launchers.
---

# Simulation boundaries

Read `docs/LOCAL_SIMULATION_20261025.md` and the current launcher source.
Browser SIM uses `scripts/simulation.py`; Telegram SIM uses `scripts/telegram_simulation.py`.
Their `.ux-preview/*-runtime/active.json` pointers identify separate test generations.
Preserve the actual pointer and online backup before changing a generation; never reset because
a list is empty. Old ordinary TEST and SIM are distinct runtimes.

`DemoEnvironment`, allowed test/demo environment, test-named DB and `DemoGuarantorActor` with
`telegram_id=NULL` are mandatory. New UX v3 events register existing strategies atomically.
The normal worker respects invitation/end deadlines and never accepts terms or stakes for the creator.
Do not automate a real Telegram account or expose local role impersonation through a tunnel.

Check six available approved actors through normal HMAC `/guarantors`, worker heartbeat, correct
menu origin and the served build. Use the existing verification scripts; they create only explicit
synthetic negotiations or perform read-only checks as documented. Use stop BAT for graceful shutdown.
`already running` means no duplicate process should be launched. Launchers must leave readable errors.

Do not delete databases/backups, reconfigure webhook/polling, or import real money into a demo pack.
Keep current WebView manual-verification limitations explicit in the result.
