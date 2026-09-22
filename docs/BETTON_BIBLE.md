# BetTON Product Bible

> Living source of truth for the product. Read this before changing product behavior, UX, visual direction, or roadmap.
>
> Status vocabulary:
> - **CONFIRMED** — accepted product decision; do not change casually.
> - **EXPERIMENT** — intentionally being tested; may change.
> - **OPEN** — unresolved question.
> - **LEGACY** — preserved for compatibility, not the target direction.

## 1. Product in one sentence

**BetTON is a Telegram-native P2P prediction market in TON where users trade against each other through an order book, not against a bookmaker.**

The target feeling is closer to a real market / financial product than to a sportsbook, casino, meme-coin app, or generic Web3 dashboard.

## 2. Product principles

### CONFIRMED

- P2P order book is the target market model.
- Backend is the source of truth for money, matching, settlement, fees, auth and access rules.
- Quick Trade = IOC against available liquidity.
- Own Price = limit order that may rest in the book.
- Partial fills are normal.
- Users can cancel their unfilled remainder.
- Service fee: **1% only from the winner's net profit**.
- Existing split of that fee: **75% event creator / 25% platform**.
- Public and unlisted events exist.
- Unlisted means hidden from public discovery and accessible through a share token/link; it is not an invite-only allowlist.
- Existing LMSR support is legacy compatibility, not the direction for new markets.
- Telegram Mini App is a primary product surface.
- Wallet/on-chain integration is not yet real and must not be presented as completed functionality.

### Product character

BetTON should feel:
- trustworthy;
- fast;
- legible;
- market-driven;
- financially literate without becoming a terminal for professionals only;
- native to mobile and Telegram;
- restrained rather than gamified.

BetTON should **not** feel:
- like a bookmaker;
- like a casino;
- like a generic AI-generated SaaS dashboard;
- like a neon Web3 landing page;
- like a collection of identical rounded cards;
- like a product where decoration is more important than market information.

## 3. Market information model

### CONFIRMED

For P2P markets:
- there is no bookmaker setting a canonical coefficient;
- executable price comes from opposing funded orders;
- first price appears from real market interaction;
- order book and real fills matter;
- recent trades/chart must come from real P2P fills.

### EXPERIMENT

The presentation layer may move away from bookmaker-style coefficients such as **2.08** as the primary representation.

**Current design exploration (2026-09-22) — not CONFIRMED, not a backend change:**
- **Primary** market representation: implied **probability (%)**.
- **Secondary** inside the trade flow: contract price, coefficient, and expected payout / execution economics.

This exploration choice does **not** permanently close probability vs contract price vs coefficient vs hybrid. A later CONFIRMED decision is still required. Backend pricing, matching, settlement and fee math are unchanged.

Reason: the visual and conceptual model should communicate "market" before "betting".

### EXPERIMENT — Feed vs Detail information (2026-09-22)

For the current design exploration only:

**Feed shows:**
- question;
- probability;
- liquidity;
- close time;
- category;
- compact creator identity;
- optional trend **only** when real data exists (no fabricated trend).

**Not on Feed** (live on Market Detail instead):
- resolution criteria / description depth;
- order book;
- recent trades;
- detailed execution economics.

Does **not** permanently close every Feed vs Detail nuance (e.g. search result density, sorting cues, or whether liquidity format on Feed stays as-is). Backend discovery/access rules are unchanged.

### EXPERIMENT — Order book default depth (2026-09-22)

On Market Detail, the order book is **compact by default**: about **3–4 best levels per side**, with a way to expand and show more.

Does **not** change matching, self-match protection, or how much of the book the backend returns — only default presentation for normal users in this exploration.

### EXPERIMENT — Creator identity vs reputation ranking (2026-09-22)

- Show creator **identity / profile** where the product already supports it.
- **Compact creator identity on Feed is allowed** in this exploration.
- New art direction **must not depend** on a Top Creators block or reputation ranking as a required part of the visual system until a creator reputation model is **CONFIRMED**.
- Public creator surfaces (profile, creator events, backend-supported stats) remain in scope; ranking / Top Creators as mandatory visual chrome does not.

## 4. Core user flows

These flows must ultimately be complete and visually coherent:

1. **Discover**
   - feed (see §3 EXPERIMENT — Feed vs Detail);
   - search;
   - filters;
   - sorting;
   - public creator surfaces;
   - top creators — optional product surface; **not** a required art-direction dependency until reputation is CONFIRMED (see §3).

2. **Understand a market**
   - question;
   - description / resolution criteria;
   - creator;
   - status;
   - close time;
   - probability as primary representation in current exploration (§3); contract price / coefficient / payout secondary in trade flow;
   - liquidity;
   - chart;
   - order book (compact default depth in current exploration — §3);
   - recent trades.

3. **Quick Trade**
   - select outcome;
   - enter amount;
   - show executable liquidity;
   - show average / worst execution;
   - show expected payout / economics;
   - handle no liquidity;
   - full fill;
   - partial fill;
   - stale quote;
   - insufficient balance;
   - success.

4. **Own Price**
   - choose outcome;
   - set price;
   - set amount;
   - preview;
   - submit limit order;
   - display resting order;
   - partial fill + remainder;
   - cancel remainder.

5. **Portfolio**
   - balance;
   - positions;
   - open orders;
   - history;
   - cancel order;
   - explicit unauthenticated state.

6. **Create market**
   - question;
   - description / criteria;
   - category;
   - close time;
   - visibility public/unlisted;
   - validation;
   - pending moderation;
   - share result for unlisted market.

7. **Moderation / admin**
   - moderation queue;
   - approve;
   - reject with reason;
   - close;
   - cancel/void with reason;
   - choose outcome;
   - explicit settlement confirmation.

8. **Profiles**
   - own profile;
   - public creator profile;
   - creator events;
   - stats that are actually supported by backend data.

9. **System states**
   - loading;
   - empty;
   - network error + retry;
   - auth required;
   - auth expired;
   - forbidden;
   - not found.

## 5. Visual direction

### IMPORTANT

**The current React visual style and the first Figma foundations are NOT approved art direction.**

They are implementation scaffolding only.

We explicitly rejected the idea that "clean + rounded + Inter + teal" is enough.

### Direction-finding process

The 2026-09-22 Tape / Issue / Instrument Figma sprint was reviewed by the human and **rejected as visual direction**. Keep it as research history only; do not continue, blend, or implement those frames.

Before finalizing a design system:

1. Collect **specific visual references/screenshots**, prioritizing real mobile product UI rather than brand-name lists.
2. Extract transferable design DNA rather than copying screens:
   - hierarchy;
   - density;
   - rhythm;
   - typography;
   - contrast;
   - surface model;
   - navigation;
   - motion;
   - use of color;
   - amount of chrome.
3. Work on **one high-leverage surface first: Markets Feed at 390px**.
4. Explore 3 genuinely different directions as full-size, live, isolated prototypes with realistic BetTON data and a visual picker.
5. Inspect screenshots and run bounded Impeccable critique/refinement on the actual rendered prototypes.
6. Human selects/rejects the Feed direction.
7. Only after selection: freeze it in Figma, implement the production Feed with screenshot-diff validation, then derive Market Detail and Trade from the approved visual system.

Detailed procedure: `docs/design/DESIGN_PIPELINE.md`.

### Anti-patterns

Avoid by default:
- endless cards-inside-cards;
- large corner radii on every element;
- teal as decoration everywhere;
- fake crypto gradients;
- glassmorphism without functional reason;
- oversized decorative illustrations that push market data down;
- sportsbook-style odds as the dominant visual language unless deliberately chosen;
- excessive badges and pills;
- generic Inter/SF layout with no distinctive hierarchy;
- inconsistent spacing invented screen by screen;
- treating Top Creators / reputation ranking as mandatory visual system chrome before the reputation model is CONFIRMED.

## 6. Pixel-accurate design → code protocol

This protocol exists because "looks approximately like Figma" is not an acceptable implementation standard.

### Why previous attempts drifted

The earlier workflow allowed too much interpretation:
- design was treated as a screenshot/reference instead of a measured spec;
- screens were implemented before component mapping was frozen;
- real Telegram viewport/safe areas were not always part of the design target;
- there was no automated screenshot comparison gate;
- implementation continued to the next screen before the previous one matched.

### Required workflow

For every key screen:

#### A. Freeze one exact target
- Define exact viewport (for example the actual iPhone/Telegram CSS viewport).
- Freeze content fixture so text and market data do not move during comparison.
- Freeze theme, locale and app state.
- Freeze one Figma frame for that exact state.

#### B. Map components
Every reusable Figma component must map to a production component where possible:

- Figma Button ↔ React Button
- Figma Market Card ↔ React MarketCard
- Figma Outcome / Price ↔ React outcome component
- Figma Bottom Navigation ↔ React BottomNavigation
- Figma Trade Ticket ↔ React QuickTrade / OwnPrice components

Do not redraw an existing production component independently on every screen.

#### C. Use actual Figma measurements
Implementation must use:
- exact spacing;
- exact dimensions where fixed;
- exact typography;
- exact line height;
- exact radii;
- exact borders;
- exact colors/tokens;
- exact component states.

Use Figma design context / variables / component metadata rather than eyeballing screenshots.

#### D. Deterministic visual test
For every approved state:

1. render the React screen with deterministic fixtures;
2. take a screenshot at the exact target viewport;
3. compare it against the approved Figma render;
4. inspect overlay / pixel diff;
5. fix mismatch;
6. repeat.

Do not move to the next screen because the implementation is "close enough".

#### E. Order of correction
Fix in this order:
1. overall layout / viewport / safe areas;
2. widths and heights;
3. spacing and alignment;
4. typography and wrapping;
5. controls and component states;
6. colors / borders / radii;
7. shadows / subtle effects;
8. motion.

#### F. Acceptance gate
A screen is design-complete only when:
- there is no obvious layout drift at overlay;
- text wraps identically for the frozen fixture;
- controls align identically;
- Telegram safe-area behavior is correct;
- the remaining pixel diff is limited to rendering/antialiasing noise or explicitly accepted platform differences;
- the same component still behaves correctly with real dynamic data.

### Tooling target

Add a visual regression harness around the React preview:
- Playwright screenshots at fixed viewports;
- deterministic demo fixtures;
- baseline screenshots;
- pixel/overlay comparison;
- named snapshots for Feed, Detail, Quick Trade, Own Price, Portfolio and Create.

This is the missing layer between "Figma looks good" and "production looks identical".

## 7. Figma role

Figma is useful, but it is **not** the quality guarantee.

Use it for:
- art direction;
- exact screen specs;
- variables/tokens;
- reusable components;
- component states;
- responsive / viewport specs;
- prototypes;
- design review;
- a persistent visual source of truth.

Do not use it as:
- a giant disconnected mockup that is later reinterpreted manually;
- a substitute for testing the actual Telegram Mini App.

Professional Figma becomes valuable when we have enough iteration volume and a chosen direction. The design must still pass the visual regression protocol after implementation.

## 8. Agent / skills workflow

Goal: tools and skills belong to the project, not to one model.

Planned project-level design skills:
- Taste / reference-DNA extraction;
- Impeccable / critique, audit and polish;
- frontend design skill(s) selected after review.

Desired structure:

```
.agents/
  skills/
    ...
```

The exact skill set should remain small enough that instructions do not conflict.

### Agent responsibility

- ChatGPT: product coordination, architecture, GitHub review/writes, Figma work, preview/Render management, QA strategy.
- Cursor/Codex/local agent: local code execution, browser loop, visual implementation and targeted refactors using project skills.
- Human: final taste judgment, product trade-offs, real-device feedback.

No agent may silently change CONFIRMED product mechanics to improve UI.

## 9. Technical safety boundaries

Do not casually change:
- integer/nano money behavior;
- reserve/refund accounting;
- P2P matching;
- self-match protection;
- settlement;
- service fee and 75/25 distribution;
- request_id idempotency;
- Telegram HMAC/auth TTL;
- unlisted access rules.

UI must call backend contracts rather than recreating these rules client-side.

## 10. Current implementation status

### Current working branch
`feature/react-full-preview`

### Current preview concept
- legacy app at `/` for compatibility where applicable;
- React v2 preview;
- separate preview infrastructure may be used for QA;
- production database must not be used casually for destructive/write experiments.

### React preview already includes substantial functionality
- feed/search/filter/sort;
- market detail;
- Quick Trade;
- Own Price;
- order book;
- chart from P2P fills;
- portfolio;
- cancel order;
- public/unlisted create;
- sharing;
- profiles;
- moderation;
- localization;
- Telegram themes/back button;
- explicit auth/error/loading states.

This functional work is valuable even if visual art direction is replaced.

## 11. Current roadmap

### Phase A — establish visual direction
- [x] Install Taste and Impeccable project-local design skills.
- [ ] Install Emil Kowalski project skills used for product craft/prototyping.
- [ ] Build a screenshot-based mobile reference board.
- [ ] Extract design DNA from selected references.
- [ ] Create 3 distinct **live Feed** variants in an isolated 390px prototype picker.
- [ ] Run screenshot-based Impeccable refinement on those variants.
- [ ] Human selects/rejects the Feed direction.
- [ ] Freeze the selected Feed direction in Figma.

### Phase B — make implementation reproducible
- [ ] Define exact canonical mobile viewport(s).
- [ ] Add deterministic frontend fixtures.
- [ ] Add Playwright visual screenshots.
- [ ] Add baseline/diff workflow.
- [ ] Map Figma components to React components.
- [ ] Consider Code Connect where it improves reliability.

### Phase C — core product
- [ ] Pixel-accurate Feed.
- [ ] Pixel-accurate Market Detail.
- [ ] Pixel-accurate Quick Trade.
- [ ] Pixel-accurate Own Price.
- [ ] Full real-device P2P QA with two users.
- [ ] Partial fill and cancellation QA.

### Phase D — complete product surface
- [ ] Portfolio.
- [ ] Create.
- [ ] Profiles.
- [ ] Moderation.
- [ ] System states.
- [ ] Dark theme.
- [ ] RU/EN/ZH consistency.

### Phase E — production readiness
- [ ] Resolve production database migration/persistence plan.
- [ ] Complete money migration/preflight work.
- [ ] Security review.
- [ ] Performance review.
- [ ] Accessibility review.
- [ ] Production deployment plan.
- [ ] Rollback plan.

### Later / separate product decisions
- [ ] Real TON wallet/deposit/withdraw flow.
- [ ] Smart-contract scope.
- [ ] Confirmation / trust model for events.
- [ ] Community moderation / voting if still desired.
- [ ] Token/collateral ideas only after core market product works.

## 12. Open product questions

Keep unresolved questions here rather than solving them inconsistently in UI:

- **Primary market representation (probability vs contract price vs coefficient vs hybrid)?**  
  **EXPERIMENT (2026-09-22, design exploration only):** probability (%) is primary; contract price, coefficient and expected payout are secondary inside the trade flow. **Still OPEN** for a lasting CONFIRMED choice. Not a backend change.

- **What information belongs on Feed vs Detail?**  
  **EXPERIMENT (2026-09-22, design exploration only):** Feed = question, probability, liquidity, close time, category, compact creator identity, optional trend only with real data. Criteria, order book, recent trades and detailed execution economics stay on Detail. **Still OPEN** for remaining nuances (e.g. search-result density, exact liquidity formatting, other discovery surfaces).

- **How much of the order book should a normal user see by default?**  
  **EXPERIMENT (2026-09-22, design exploration only):** Market Detail shows ~3–4 best levels per side by default, with expand-to-see-more. **Still OPEN** for the final default depth and whether expanded depth should be sticky per user. Presentation only — matching unchanged.

- **What is the final creator reputation model?**  
  **Still OPEN / not CONFIRMED.** Identity and profile display are in scope; compact creator identity on Feed is allowed in the current exploration. Art direction must **not** require Top Creators or reputation ranking until this model is CONFIRMED.

- What is the correct event verification / evidence model?
- What parts of moderation should eventually move on-chain?
- What wallet UX belongs in v1 vs later?

## 13. Decision log

Append important decisions; do not erase old reasoning without recording replacement.

- **P2P order book selected over platform-funded liquidity/AMM for target product.**
- **Quick Trade uses IOC; Own Price uses limit orders.**
- **Service fee remains 1% of winner net profit with existing 75/25 creator/platform split.**
- **Unlisted markets use share-token access and are hidden from public feed.**
- **Visual direction is being reset; current clean teal/light UI is not considered final.**
- **Design implementation must gain a screenshot-diff visual quality gate before the product is considered visually finished.**
- **2026-09-22 EXPERIMENT (design exploration only):** Primary market representation = probability (%); contract price, coefficient and expected payout are secondary inside the trade flow. Does not change backend pricing/matching/settlement; lasting CONFIRMED choice still OPEN.
- **2026-09-22 EXPERIMENT (design exploration only):** Feed shows question, probability, liquidity, close time, category, compact creator identity, and optional trend only with real data; criteria, order book, recent trades and detailed execution economics stay on Detail. Remaining Feed/Detail nuances still OPEN.
- **2026-09-22 EXPERIMENT (design exploration only):** Market Detail order book defaults to ~3–4 best levels per side with expand-for-more. Presentation only; matching unchanged. Final default depth still OPEN.
- **2026-09-22 EXPERIMENT (design exploration only):** Show creator identity/profile; compact creator on Feed allowed. Art direction must not depend on Top Creators / reputation ranking until the reputation model is CONFIRMED. Reputation model remains OPEN.
- **2026-09-22 DESIGN PROCESS:** Tape / Issue / Instrument Figma exploration was rejected as a visual direction. Future exploration starts with one live 390px Feed surface, specific screenshot references, isolated prototype variants, and rendered visual critique before Figma/production expansion.

## 14. How to maintain this file

Whenever a meaningful product decision is made:
1. update the relevant section;
2. mark it CONFIRMED / EXPERIMENT / OPEN where useful;
3. append a short entry to the Decision log;
4. if roadmap changes, update checkboxes/order;
5. do not let chat-only decisions remain undocumented for long.

This file is intended to outlive individual chats and agents.
