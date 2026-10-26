# BetTON UX reinvention: product guard and baseline audit

26 October 2026. Base: PR24 `39074415f80aed64bd4880d183a79e4b2d620bb6`.
The owner's UX/UI REINVENTION brief authorizes new navigation, visual language and
an autonomous experimental recommendation. It supersedes the historical Rail/Figma
appearance and human-selection stop for this branch, not the following contracts.

## Product guard

- P2P funded opposing orders determine executable prices. An unfilled order is not
  a position, and a public book level is not necessarily available to its owner.
- Quick Trade is IOC: fill what is executable at the accepted bound, refund the
  unfilled amount. Own Price is limit: the unfilled remainder can reserve funds
  and rest in the book. Users can cancel that remainder.
- Quote, matching, fees, balance and settlement come from the backend. No client
  arithmetic may promise execution or replace the server's financial calculation.
- Show submitted, partial, resting, rejected and uncertain results distinctly.
  A successful POST response must identify the expected request and market.
- Preserve durable order/event intents, stable request IDs, explicit confirmation,
  and same-key lookup/replay after lost responses or reload. Do not clear an
  uncertain request and silently create a fresh one.
- Service fee is 1% of the winner's net profit, with existing75/25 creator/platform
  distribution. A guarantor's reward is separate and paid only from winners'
  profit under the existing four-tariff, both-outcome funding contract.
- Public creation requires moderation. Private-by-link is hidden from discovery,
  not an account allowlist. Private creation without a guarantor and creation
  with a guarantor are distinct supported UXv3 types.
- Guarantor agreement is revision-specific. Both parties accept the same rules
  and tariff. `collecting` is not `active`: executed stakes must secure both
  outcomes. An order offer alone is not funding. Server-provided deadlines and
  automatic refunds must not be replaced by invented frontend state.
- HMAC, auth TTL, expected actor, remembered share-token access and moderation
  permissions remain. Wallet/on-chain operations remain explicitly unavailable.
- Real charts use actual P2P fills; absent prices, ratings and history stay absent.
  The five major destinations must remain reachable even if their layout changes.

## Existing contract map for the twelve audit tasks

| Task | Existing API / integration seam | Required UX truth |
|---|---|---|
| Find an event | `listMarkets` → `GET /markets` with q/category/status/sort/limit/offset | Public discovery only; retain filters and position on return. |
| Understand price/odds | `getMarket`, `getMarketTrades`, personalized quotes; `mapMarketOut` | Probability/price is a representation; executable odds need live opposing orders. |
| Find opposing liquidity | `GET /markets/{id}/orderbook`, `available_to_me`; `POST /markets/{id}/orders/quote` | Own orders excluded from personally executable liquidity. |
| Quick Trade | `previewOrder`; `submitOrderIntent`; `completeOrderIntent`; `invalidateAfterTrade` | Fresh bound/amount/outcome before confirmation; authoritative fill/refund result. |
| Place own order | Same `/orders/quote` and `/orders`, `kind:limit` | Explicit own price, reservation, immediate partial fill and resting remainder. |
| Inspect partial fill | Returned `OrderOut.filled/remaining/refunded/status`; account/orders refetch | IOC remainder refunded; limit remainder may remain reserved. |
| Open positions | `GET /users/{id}/positions`, `/orders`, `/account` | Positions and orders remain distinct; cancel via `POST /orders/{id}/cancel`. |
| Public creation | `validateEventStep`, `buildEventBody`, `submitEventIntent` → `POST /ux-v3/events` | Source, criteria, uncertainty fallback, close/end timestamps; moderation result. |
| Private creation | Same endpoint, `event_type:private`; share-token result | By-link visibility, terms consent, creator result authority, no wager on creation. |
| Guarantor negotiation | `GET /guarantors`; case GET/POST `/markets/{id}/guarantor`; `/ux-v3/events/{id}/terms` | Directory availability, selected profile, revision, tariff, consent, chat, deadlines. |
| Notices and return | `GET /notifications`; `POST /notifications/{id}/read`; market route | Actual read state and target; access still checked by backend. |
| Result/history | `GET /users/{id}/transactions`, `/settlements`, `/markets`; account refetch | Separate settlement/refund/fee; no fake chain payout. |

`frontend/src/api/orderIntent.ts` saves before writing, serializes by actor, retains
uncertain results, checks `/users/{id}/orders/by-request/{request_id}`, and replays
the original body/key. Only definitive400/422 rejections clear immediately.
`eventCreationIntent.ts` likewise persists and replays the same creation payload.
`share.ts` remembers per-market tokens; protected detail/trade/case calls reuse them.

## Browser evidence scope

Baseline browser inspection is pending the new isolated loopback runtime on8890.
No claim of a completed browser walkthrough is made in this checkpoint. The audit
will use synthetic actors and a fresh marked demonstration database, never the
running Telegram simulation or production. Only synthetic viewport images belong
in `ux-reinvention/evidence/baseline/`.

## Proposed improvement tests, pending browser confirmation

1. Group price explanation with execution and liquidity rather than teaching a
   detached financial vocabulary before the user sees a market.
2. Show quote amount, matched amount, average/worst bound, refunded/resting amount
   and fee scope beside the confirming action; avoid a generic success label.
3. Keep the detail/trade/portfolio relationship visible, and make returning from
   an order or a notice preserve the user's previous context.
4. Split creation by type before revealing irrelevant public/private fields.
   Keep validation local to its field and make final review materially useful.
5. Present guarantor state, current revision, required actor action and actual
   deadline together; distinguish negotiation, funding and active execution.

These are hypotheses to test against the browser baseline, not findings from
screenshots and not permission to change a server contract.
