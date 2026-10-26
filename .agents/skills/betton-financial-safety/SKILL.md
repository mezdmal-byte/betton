---
name: betton-financial-safety
description: Investigate or change BetTON money, reserves, ledger, settlement, idempotency, or migrations using isolated synthetic databases and existing financial contracts.
---

# Financial work in BetTON

Read the confirmed money sections of `docs/BETTON_BIBLE.md`, then the affected contracts in
`app/services/p2p_service.py`, `app/services/p2p_ledger.py`, `app/money.py`, and `app/migrations/`.
`docs/p2p.md` contains historical float-era descriptions: verify current integer models before using them.

Use nanoTON integers for money; frontend formatting must not become an accounting source.
Keep IOC/limit semantics, partial fills, maker-price lots, self-match exclusion and the existing
1% net-profit fee with its 75/25 split. Reuse `p2p_ledger.reconcile`; never manufacture missing history.
Distinguish `incomplete` journal coverage from a proven mismatch. A user balance cannot be reconstructed
from P2P alone because initial grants and legacy LMSR also affect it.

Money fixes need a reproducer, atomic rollback and replay assertions, conservation, and relevant
PostgreSQL contention coverage. `tests/conftest.py` owns disposable SQLite; PostgreSQL requires an
explicit local `BETTON_TEST_DATABASE_URL`. Never set a working database as that URL.
Run focused `pytest` first, then the existing financial/release suites. Migration rehearsals use a
backup restored to a new test database; no automatic repairs or corrective postings to source data.

Report exact tests, coverage limits and invariant results. Production DB changes, real transfers,
schema rollouts and deployment require separate human authorization.
