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

## Executed browser audit

Fresh full-demo runtime: `http://127.0.0.1:8890/sandbox/?actor=creator`.
Database: root experiment's `.ux-preview/reinvention-baseline-20261026/betton-test-simulation.sqlite`.
No live Telegram/production database was used. Playwright Chromium captured
390×844 light-theme viewports; additional search, notification, history and
guarantor conversation checks used the in-app browser at desktop width. This is
browser Telegram-host simulation, not a real Telegram/device test.

Counts below include deliberate taps/clicks and text-field edits from the named
starting point; scrolling and waiting are reported separately. These are observed
paths, not statistically measured task-completion times or user-study results.

| Task | Actual path and count | Observation / improvement |
|---|---|---|
|1 Find event|Feed → search icon → type `Индекс` → one matching event:2actions; opening adds1.|Search works, but its entry is an unlabeled visual icon until opened. Put persistent search affordance near the market list.|
|2 Understand odds|Feed → history market:1tap; detail shows executable1.33× and last traded5.00×.|The distinction is financially valid but visually weak. Explain current offer vs last execution together; do not imply last trade is executable.|
|3 Opposing liquidity|Same detail:15TON executable onYes, No says no liquidity. Empty Snow market → Own Price:2taps.|Detail is honest; feed instead shows `—×` with no explanation. Show absence as words and offer a clear own-order path.|
|4 Quick Trade|History event →Yes →amount30 →confirm:4actions from feed on partial branch, plus initial quote wait.|Real POST completed.30requested,15filled,15refunded, no resting order. Keep fresh quote and explicit confirmation; improve vertical distance between amount and CTA.|
|5 Own Price|Snow detail →Own Price →odds2 →amount7 →preview →place →confirm:6actions from detail (7fromfeed).|Real7TON limit rested with0filled. Three successive preview/confirmation pages repeat nearly identical economics. Consolidate review without dropping explicit confirmation. Entry defaults to100TON and1.90×, a risky unrequested amount.|
|6 Partial fill|IOC result showed15filled of30,15returned, no remainder order. Portfolio→active position:1tap.|Result clearly distinguishes refund from a limit remainder. Preserve this semantic clarity; show the next portfolio action directly.|
|7 Open positions|Navigation→My Bets:1tap. Orders tab adds1; Snow order detail adds1.|Real15TON position and7TON open order visible. Position/order split is good; available vs reserved funds are hidden under a separate Funds action.|
|8 Public creation|Create→public→continue→3question/outcome edits→next→9required-condition/source/date edits→review→submit:18actions plus long form scroll.|Review and POST were exercised. The screenshot captured the pending-request banner before the response; final public approval/result is **not** claimed. Avoid transient unknown-result language during a normal in-flight request.|
|9 Private creation|Create→private→continue→3question/outcome edits→next→4condition/date edits→review→create:13actions plus scroll.|Actual `Событие создано` result, correct creator-result authority and invite-participants action. Keep per-type fields; make timezone and close/end distinction clearer.|
|10 Guarantor|Guaranteed creation adds directory→selectFlexible→invite to private-length path:15actions; result→case→chat→type→send→confirm adds5.|Six available demo profiles plus original unavailable sandbox guarantor rendered. Actual worker accepted, proposed1.5% tariff at revision2, replied to a synthetic chat message; creator confirmed current revision, then case showedFund formation. No funding/settlement claim.|
|11 Notice→event|Notifications→specific agreement notice→Open event:3taps.|Unread2→1 and target#32 were verified; case reopened inFund formation. Intermediate detail uses genericEvent#32 rather than question. New-message overlay can interrupt this flow.|
|12 Result/history|My Bets→History:2taps from other tab.|Real−7limit reserve and IOC−30reserve/+15refund/−15execution entries rendered, plus seeded creator credits. Heading saysCompleted although history includes open-order activity. Label history distinctly and make informational execution rows unmistakable. Settlement execution itself was not run in this bounded audit.|

### Screenshot evidence

All images under `ux-reinvention/evidence/baseline/` are synthetic viewport captures.
The initial four committed images preserve the before state. Later images cover
actual partial result, portfolio, limit entry/review/confirmation/order detail,
all three creation conditions/reviews, directory and creation results.

- `01-feed-notice.png`: unsolicited old-notice overlay obscures the feed header.
- `02-feed.png`, `03-detail.png`, `04-trade.png`: same390px main journey before changes.
- `05-partial-preview.png`: **despite the historical filename this is a captured
  quote-validation error, not a valid partial preview**. It briefly reported the
  amount/odds validation range while the quote flow updated. No backend cause is
  established by this UX observation.
- `06-partial-result.png`: authoritative15filled/15refunded response.
- `07-portfolio.png`, `08-limit-entry.png`…`12-orders.png`: position, default amount,
  successive reviews and saved open order. `11-limit-result.png` is the portfolio
  order detail after placement, not a separate placement success screen.
- `13-create-type.png`, `14-*-conditions.png`, `15-*-review.png`,
  `16-guarantor-directory.png`: actual existing forms and six available demo actors.
- `17-private-result.png`: confirmed creation; `17-public-result.png` is **submitting**,
  not a completed result. `18-guarantor-result.png`: confirmed invitation creation.

The notification, chat and current-revision consent follow-up was inspected in the
browser but not committed as a390px screenshot. CUA image-file saving outside its
writable scope failed; no image was fabricated to fill the gap.

## Ranked improvement map

1. **Keep interruptions out of ordinary discovery and trade.** Initial seed had30
   unread notices. Hiding one marks it read and immediately displays the next;
  29successive hide clicks were required after the first manual dismissal. Use a
   compact badge/list and a dismiss/snooze behavior with honest read semantics.
2. **Let the market question lead.** A9-decimal global active-offers metric dominates
   the feed while individual liquidity is absent until detail. Reduce summary
   prominence and show concise, truthful per-outcome availability.
3. **Put trading terms beside the action.** Existing trade entry shows seven
   financial rows before amount entry has produced a quote, including duplicate
  15TON best/total values. Detail's chart competes with trade actions below the
   first viewport. Group decisive values, then progressively disclose history.
4. **Make the amount deliberate.** Own Price opens at100TON without input. Prefer
   an empty/explicitly selected amount; preserve decimal precision and server
   validation. Keep quote amount/outcome/bound inseparable from confirmation.
5. **Reduce repeated review pages.** Own Price has entry→preview→confirm with
   overlapping values. Preserve the actual confirmation while removing redundant
   presentation; retain complete amount/filled/resting/reserve information.
6. **Show state and next action together.** During guarantor review the footer said
   `Приём завершён` although close time was five days away. It should explain
   negotiation/funding gating. Chat duplicates the full reward/funding/consent
   block behind and inside its panel, making the next action hard to reach.
7. **Keep history understandable.** `Completed` is the history heading even for a
   newly open limit. Distinguish reservation, execution and refund so users do
   not sum informational rows as new debits. Do not alter financial accounting.
8. **Preserve successful existing behaviors.** Actual partial-result copy, separate
   orders/positions, by-type creation, source criteria, available guarantors,
   revision labels, fee source and explicit funding insufficiency are valuable.

## Safety and coverage limits

No backend, money/auth code, live SIM launcher, production, Render or webhook was
changed. Fresh demo history remains; no reset/delete was performed. This audit
created one30TON synthetic IOC, one7TON resting limit, private/public creation
attempts and one guaranteed event with a synthetic chat/consent. It did not run
real funds, chain operations, settlement, cancellation of existing data or a
complete guaranteed funding cycle. Time, seed notices and worker replies change
between captures; counts are not performance measurements.

PR28's guarantor409/unknown-result work is separate. It was neither modified nor
cherry-picked here. The fresh current-revision happy path passed; stale revision,
409 and lost-response guarantor actions are **not** proven safe by this audit.
Any integration must read the then-current contract and refetch authoritative
case state after conflict/uncertainty instead of blindly retrying a stale action.
