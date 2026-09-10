# BetTON: binary P2P orders

## Preserving LMSR

The pre-P2P source is archived on `archive/lmsr-before-p2p` at
`19ac1768f70aea23b8368c7719e557e5b50f423f`.
This is a source snapshot, not a production database backup.

The new application still handles existing LMSR markets via `mechanism=lmsr`.
No conversion of their balances, positions, b, prices or settlement history occurs.
Explicit API requests with `mechanism=lmsr` remain supported and enter moderation.
The Mini App creates P2P markets by default and offers no initial odds or collateral fields.
The archived application cannot safely read new P2P/pending records; run that source
against a separate compatible database, not as a blind rollback on a mixed database.

## Creation and moderation

New P2P events have exactly two mutually exclusive, exhaustive outcomes and a future
close_at. Creation needs no collateral and debits no account. Events enter `pending`.
Only the authenticated admin can approve or reject; rejection requires a reason.
Public listing/detail/book hide pending/rejected events. Authors see their events
in Mine; admins have a moderation queue. Expired pending events cannot be approved.
Rejecting an LMSR pending event returns its collateral once. P2P has none to return.
Existing published events are not sent back for moderation.

## Orders and matching

- A request specifies outcome, stake, minimum odds, kind and a user-scoped request_id.
- `limit` reserves the stake, executes compatible offers and leaves the unfilled part open.
- `ioc` executes compatible offers immediately and refunds everything unfilled.
  The UI derives its minimum odds from the worst visible executable level, displays
  that floor, and never sends an unrestricted market order.
- A first order is already an offer to the opposite outcome. No deal and no last
  trade price exist until another account accepts compatible terms.
- Compatibility is `maker_price + taker_limit_price >= 1`.
- Execution uses the resting maker price. Higher opposing price is better for the
  taker; order id breaks ties (price/time priority).
- Same-user matching is excluded. A user can hold both outcomes through actual
  trades with other users; tips use aggregate event cost, not only winning-side cost.
- Cancelling returns only the remaining reservation. Executed stakes stay in the
  market pot. Repeated cancellation never refunds again.
- Requests repeated with the same id and terms return the original order. Reusing
  an id with different terms returns 409. The UI keeps the id after network failure.

## Units, rounding and conservation

Stakes and matched stake amounts are integer nanoTON (1 TON = 1,000,000,000 units).
Price ticks are 1/1,000,000. `price = floor(1,000,000 / requested_odds)` means the
actual accepted minimum odds are equal or better than the requested value.
The API returns effective odds; the UI rounds odds for display only.

For a resting price tick p, let g=gcd(p,1,000,000). One executable lot requires:

- maker stake: p/g nanoTON;
- opposite stake: (1,000,000-p)/g nanoTON;
- payout to the winner: 1,000,000/g nanoTON.

A fill takes an integer number of lots fitting both remaining reservations. The
sum of the two stakes is exactly the winner's entitlement. No platform subsidy
is involved. A remaining reservation smaller than its executable lot is refunded.
The smallest payout lot is at most 0.001 TON, depending on the price.

The 100 TON @2.20 / opposing 50 TON example is therefore approximately 41.6667 TON
of maker stake plus 50 TON of taker stake, subject to tick/lot rounding. The UI shows
actual executed, reserved and refunded amounts, including small remainders.

Existing User.balance and Market.pot columns remain floating point demo accounting.
Order/fill arithmetic is integer; balance/pot updates still pass through the existing
float storage. Tests check conservation to 1e-7 TON. A real-money launch requires a
separate migration of shared balances to fixed-point accounting; this PR does not
claim on-chain custody or exact integer storage for the whole legacy application.

## Money journal

New P2P markets (`p2p_journal_coverage=full`) append an insert-only row for every
actual movement. The journal does not move money and is not a completed migration of
`User.balance` / `Market.pot` off float.

| Type | From | To | Unique key |
| --- | --- | --- | --- |
| `reserve` | user balance | order reserve | `reserve:{order_id}` |
| `fill_escrow` | order reserve | market pot | `fill:{fill_id}:maker` / `:taker` |
| `refund` | order reserve | user balance | `refund:{order_id}` |
| `payout` | market pot | winner balance | `payout:{market_id}:{user_id}` |
| `tip` | market pot | creator/admin | `tip:{market_id}:{winner_id}:{recipient_id}` |
| `void_return` | market pot | user balance | `void:{market_id}:{user_id}` |

Refund `reason` values: `cancel`, `ioc`, `remainder`, `close`, `void`.
Amounts are integer nanoTON. Journal insert and the matching debit/credit share one
transaction; a journal error rolls the money movement back. Repeating the same
request or settlement hits the semantic unique key and does not add a second movement.

Markets that already existed when the journal shipped are marked `incomplete`.
Their past reserves, fills and payouts are not invented. Later operations may appear
in the journal, but reconciliation never reports `fully_verified=true` for them.

Still float (not this journal, not an integer-money migration): `User.balance`,
`Market.pot`, `Market.lock_ton`, LMSR `b`/`q`, position shares/costs, `Trade.*`,
`SettlementRecord` money columns. Integer: P2P order/fill stakes and `P2PMoneyEntry.amount`.
Pot vs journal uses the existing 1e-7 TON tolerance; integer fields are exact.

Admin-only read-only audit (does not pay, refund, expire or rewrite):

```
GET /markets/{market_id}/p2p-reconciliation
Authorization: tma <admin initData>
```

It reports coverage, order identity (`amount = filled + remaining + refunded`),
fill vs order filled, reserve↔pot transitions, expected vs actual pot, and concrete
gaps. Do not compare a user's total `balance` to this journal: starting grants and
LMSR activity also change it.

## Resolution and expiration

One admin resolution automatically pays every matched winner from the matched pot.
Tips are 1% of positive net profit across the event, rounded down to nanoTON:
75% creator / 25% admin; creator winning their own event sends all their tip to admin.
No unmatched reservation enters profit or the matched pot. History uses existing
SettlementRecord; winning positions cannot subsequently claim again.

Placement, cancellation and resolution serialize on the market row. User balances
are adjusted with SQL increments under sorted user locks. PostgreSQL uses row locks;
SQLite uses the existing write-lock technique. Exceptions roll back the transaction.

Close refunds remaining orders. An in-process worker checks due P2P markets every
15 seconds while the service runs. Reads and new order attempts also process due
expiration, so a sleeping service catches up on wake. There is no guaranteed wall-clock
refund while the process is suspended. The deadline always prevents new execution.

## UI and boundaries

The simple view shows opposite offers, their capacity, amount/minimum-odds inputs,
requested-price execution and the best currently available weighted odds. Book
levels are under a collapsible Market view. Offers are refreshed on view entry,
input changes and the Refresh Offers button. There is no WebSocket feed in this MVP.
"Market forming" means no trades yet; compatible orders execute immediately.
There is no five-minute opening auction, resale/shorting, multi-outcome P2P or TON Connect.

## Verification

`python -m pytest -q tests`: 105 passed, 4 skipped on isolated SQLite with fake credentials.
Legacy scenarios explicitly create and approve LMSR fixtures. New tests cover
moderation/privacy, no collateral, partial fills, IOC, self-trade exclusion,
price/time priority, idempotency, concurrent fills/cancellation, refunds, 75/25 tips,
resolution rollback, additive migration preserving existing LMSR data, the P2P money
journal, reconciliation coverage for pre-journal markets, and admin-only audit access.
PostgreSQL was not available in this workspace; journal uniqueness and `ensure_schema`
were exercised on SQLite. Live Telegram has not been tested.

Actual Mini App JavaScript + DOM flow test (Node + jsdom):

```
npm install --prefix /tmp/betton-ui-test jsdom
NODE_PATH=/tmp/betton-ui-test/node_modules node tests/p2p_ui.cjs
```

It covers full initialization, offers, a network retry preserving request_id, IOC
floor, order cancellation, event creation, rejection and clearing private UI on 401.
It is a simulated DOM with mocked HTTP, not a live Telegram or visual-browser test.
PostgreSQL behavior and live Telegram have not been tested.

Manual check on a test deployment: create event → admin approve → account A places
100 @2.20 → account B previews/accepts 50 at available odds → A sees partial execution
and cancels remainder → admin closes/resolves → both see automatic results/balances.
Repeat with the other winning outcome; verify an old LMSR event still works.
