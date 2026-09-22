# FULL APP DESIGN TASK — Rail direction

## Mission

Expand the **selected Rail live-feed visual structure** into a coherent, complete BetTON product prototype.

The human explicitly selected Rail as the working structure. Do **not** generate three new directions and do not reopen Tape / Issue / Instrument.

Current palette is provisional. Keep the current dark near-black + mint/green + coral/red palette for this pass, but implement it through a small token layer so the palette can be replaced later without redesigning every screen.

Work autonomously until the HUMAN CHECKPOINT at the end.

## Safety

- Branch: `feature/react-full-preview`.
- Do not merge PR #15.
- Do not deploy production.
- Do not touch production DB.
- Do not modify backend money / matching / settlement / fees / auth / unlisted rules.
- Do not replace production screens yet.
- Do not delete the current Rail prototype or the previous research/history.
- Existing local untracked launcher scripts, `frontend/qa-pass11/`, and `bot/main.py.before-v2-start-fix.bak` are out of scope.

## Read first

Read fully:
- `AGENTS.md`
- `PRODUCT.md`
- `DESIGN.md`
- `docs/BETTON_BIBLE.md`
- `docs/HANDOFF.md`
- `docs/design/DESIGN_PIPELINE.md`
- `docs/design/REFERENCE_BOARD.md` if it exists locally
- installed Taste skill
- installed Impeccable skill
- `.agents/skills/emil-design-eng/SKILL.md`
- `.agents/skills/prototype/SKILL.md`

Run Impeccable context once for this design session. Do not run `/impeccable init`.

## Source of truth for product surfaces

Inspect the actual current routes and screens before designing:
- `frontend/src/app/navigation.ts`
- `frontend/src/app/ConnectedApp.tsx`
- `frontend/src/screens/`
- `frontend/src/app/`

The current product navigation is authoritative.

Important: the current real bottom navigation is **Markets / Create / Portfolio**. Do not invent a five-tab navigation from image references. Profile is opened from the account/avatar flow.

## Working visual system

Use the current local Rail prototype as the visual foundation rather than starting over.

Preserve the qualities the human liked:
- dark near-black mobile surface;
- market-first density;
- thin separators and restrained surfaces;
- strong probability / number hierarchy;
- sparklines and market data that scan quickly;
- minimal decorative chrome;
- clear Telegram-mobile proportions;
- no casino / sportsbook feeling;
- no generic rounded-card dashboard.

Provisional palette:
- background: near-black / blue-black;
- primary text: off-white;
- secondary text: cool gray;
- YES / positive: mint-green;
- NO / negative: coral-red;
- borders: low-contrast cool gray.

Put these into reusable CSS variables/tokens. Color may be changed later, structure should survive recoloring.

Use the same spacing, type hierarchy, radii, borders, data formatting and interaction language across the whole prototype.

## Build one complete isolated product prototype

Create or extend an isolated prototype shell under the existing prototype area.

Preferred entry:
`/v2/prototypes/app.html`

If the current prototype structure makes a different path cleaner, keep it under `/v2/prototypes/` and report the exact URL.

The prototype must:
- be independent from production routes/screens;
- use deterministic realistic fixtures;
- let the human navigate through the product like a real Mini App;
- also expose a small developer screen/state picker so every surface can be inspected directly;
- fit 390px first;
- remain usable at 430x932;
- not require backend/network availability.

Use the current Rail Feed implementation as the first screen, not a rewrite from zero.

## Surfaces to design

Design **all current product surfaces**, including the initial screen.

### 0. Initial / onboarding
Design the existing onboarding concept:
- BetTON identity;
- short explanation of P2P;
- order book / market concept;
- fee explanation;
- clear CTA into Markets.

Do not make it a crypto landing page or marketing poster.

### 1. Markets Feed
Use the selected Rail structure.

Include:
- categories;
- search;
- sort/filter access;
- market rows;
- probability;
- liquidity/volume truth;
- close time;
- creator identity where appropriate;
- real trend only when fixture data exists;
- no-liquidity row state.

### 2. Search / filter state
Design the current feed filtering/search interaction:
- query;
- category;
- status;
- sort;
- clear/reset;
- empty result.

This may be a sheet/overlay rather than a separate route if that is more coherent.

### 3. Market Detail
Must expose the actual product model:
- question and criteria;
- primary probability representation for the current EXPERIMENT;
- creator;
- close time;
- liquidity / volume;
- real trade history/chart fixture;
- compact order book, ~3–4 best levels per side with expand affordance;
- YES / NO actions;
- share/unlisted context where relevant.

Do not turn this into a sportsbook event card.

### 4. Quick Trade
Design the IOC flow with real BetTON semantics:
- side;
- amount;
- current executable liquidity;
- average / worst execution information where available;
- expected payout on fillable amount;
- partial fill;
- **unfilled IOC remainder does not rest in the book**;
- confirmation;
- success state;
- no-liquidity / insufficient-balance state.

Fee wording must remain correct:
**1% only from winner's net profit**, not an upfront 0.5%/1% transaction fee.

### 5. Own Price
Design the resting limit-order flow:
- side;
- limit price;
- amount;
- reserve implication;
- preview;
- submit;
- partial fill + remainder;
- open/resting order;
- cancel remainder;
- success/error states.

Do not make Own Price behave like IOC.

### 6. Portfolio
Design the current portfolio surface:
- balance;
- in positions;
- in open orders;
- creator income if supported;
- positions;
- open orders;
- cancel;
- empty state;
- unauthenticated state.

### 7. History
Design the existing history variant:
- completed / settled activity;
- readable outcome and money movement;
- avoid fake unsupported analytics.

### 8. Create market
Design the full creation flow:
- question;
- description / criteria;
- category;
- close time;
- public vs unlisted;
- validation;
- fee / rules summary;
- submit.

### 9. Create result
Cover the real result variants:
- pending moderation;
- approved/public;
- unlisted with share link/token behavior;
- open market / go to my markets / return to feed actions.

### 10. Profile
Design own profile:
- identity;
- balances/stats that backend actually supports;
- menu entries based on the current app;
- My Markets;
- Wallet shell;
- History;
- Help;
- Public profile preview;
- Moderation entry only for admin.

### 11. Public creator profile
Design:
- creator identity;
- markets/events created;
- supported stats only;
- open market actions.

Do not invent a reputation score or ranking model.

### 12. My Markets
Design:
- pending;
- open;
- closed/resolved;
- rejected if current data supports it;
- clear status language;
- open market action.

### 13. Wallet shell
Design both current tabs:
- deposit;
- withdraw.

Important: wallet/on-chain deposits and withdrawals are not a finished production system. Keep this an honest shell/placeholder matching current product scope. Do not fake successful blockchain settlement.

### 14. Help
Design the existing help/explanation surface:
- P2P;
- order book;
- Quick Trade vs Own Price;
- fee model;
- concise, scannable mobile structure.

### 15. Moderation / admin
Design the current admin flow:
- queue;
- market review;
- criteria/source context;
- approve;
- reject with reason;
- close;
- cancel/void with reason;
- select outcome;
- explicit settlement confirmation.

Irreversible actions must look meaningfully different from ordinary navigation.

### 16. System states
Create a coherent state family for:
- loading;
- empty;
- network error + retry;
- auth required;
- auth expired;
- forbidden;
- not found;
- invalid/unavailable unlisted share.

These can share one state template if visually consistent.

## Product mechanics that must survive the redesign

Do not visually imply mechanics that are false.

- Target market model = funded P2P order book.
- Quick Trade = IOC.
- Own Price = limit order.
- Partial fills are normal.
- Service fee = 1% of winner net profit.
- Fee split = 75% creator / 25% platform.
- Unlisted = hidden from feed + share token/link, not an allowlist.
- Backend remains source of truth.
- No public fake current coefficient if there is no executable liquidity.
- Wallet is still shell, not real on-chain settlement.

## Component / system pass

Do not hand-style every screen independently.

Create a prototype-only design system layer for:
- app shell;
- top bar;
- real 3-item bottom navigation;
- typography scale;
- colors;
- spacing;
- separators;
- icon sizing;
- market row;
- probability display;
- data pair / metric;
- buttons;
- inputs;
- tabs;
- sheets;
- order-book rows;
- status banners;
- empty/error states.

Use Lucide or existing project icons where appropriate. Do not create decorative fake icons.

## Interaction craft

Use `emil-design-eng` for:
- pressed/selected states;
- sheets;
- tab switches;
- back behavior;
- confirmation states;
- subtle transitions.

Keep motion restrained and interruptible. Respect reduced motion.

## Impeccable pass

Do not stop after assembling pages.

Run screenshot-based review on the rendered prototype.

At minimum inspect:
- Onboarding;
- Feed;
- Detail;
- Quick Trade partial-fill;
- Own Price resting order;
- Portfolio;
- Create;
- Profile;
- Moderation.

Use one bounded correction pass across the system, then a confirm pass.

Fix system-level problems first:
- inconsistent type scale;
- spacing drift;
- too many rounded cards;
- weak contrast;
- generic fintech patterns;
- dense-but-unreadable rows;
- inconsistent YES/NO semantics;
- broken 390px wrapping.

## QA

Test:
- 390x844;
- 430x932;
- one 320px narrow smoke test;
- no horizontal overflow;
- no Vite error overlay;
- console clean;
- keyboard/pointer interactions used by the prototype work;
- screen picker works;
- real navigation between the main prototype screens works.

Do not use the old visual regression baselines as the new design truth.

## Figma

Do **not** spend this pass drawing the whole system manually in Figma.

After the human approves this live full-app prototype, the next step will be:
1. capture approved live screens into Figma;
2. build/freeze the design-system source of truth there;
3. implement production screens one by one with screenshot diff.

Figma is the freeze/handoff step, not the place to invent this pass.

## HUMAN CHECKPOINT

Do not stop for minor design decisions.

Stop only when:
- every surface above exists in the isolated prototype;
- screens share one coherent Rail-derived design language;
- key screens passed rendered Impeccable review;
- navigation and state picker work;
- 390px and 430px checks pass;
- production screens/backend remain untouched.

Return:
1. exact prototype URL;
2. exact way to switch/open every screen;
3. a screen inventory with status;
4. screenshot paths for the main screens;
5. any honest unresolved visual issues;
6. exact files changed;
7. git status.

At the checkpoint, commit/push is allowed for:
- design skills installed by this work;
- prototype-only code;
- reference-board/design documentation;
- generated prototype screenshots.

Do not include unrelated local scripts, `frontend/qa-pass11/`, or backup files.
Do not merge.
Do not deploy.
