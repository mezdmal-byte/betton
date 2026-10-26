# Isolated onboarding directions — 26 October 2026

Product Guardian: compatible. One educational journey, five pages plus three event-type explanations.
No live requests, balance changes, production onboarding completion or selected final direction.
Questions skipped: the owner explicitly requested three named autonomous explorations while asleep.

## Reference evidence before implementation

Eight screenshots of the current committed onboarding/typeinfo were captured at 390×844
in `.ux-preview/onboarding-screenshots/reference-{0..4,public,private,guarantor}.png`.
They are evidence of content and current tokens, not permission to replace the live UI.

| Specific reference | Retain / change in exploration |
|---|---|
| reference-0 | Opposing participants and an actual opposing offer are the central explanation; remove decorative avatar emphasis |
| reference-1 | Preserve full/partial/waiting distinction; make the executed amount observable and user-controlled |
| reference-2 | Preserve three event types and drill-down explanations; distinguish moderation from share-link access |
| reference-3 | Preserve 1% net-profit fee and 75/25 split; show 0.75/0.25 TON from 1 TON, not a generic 1% badge |
| reference-4 | Preserve creator/guarantor roles; distinguish agreed reward from service fee and funded execution |
| reference-public | Published conditions and moderation before opening remain explicit |
| reference-private | Result authority belongs to creator, access is by share token, not an invite-only list |
| reference-guarantor | Final timely decision within 24h; no decision means cancellation/refund, not legacy dispute |

## Three axes

| Direction | Structure / interaction axis | Tradeoff |
|---|---|---|
| Premium Minimal | A calm typographic reading sequence with a compact ledger-like example | Fast to scan, less demonstrative |
| Motion Experience | A staged opposing-offer scene with replay and observable matching transitions | Explains sequence, requires more attention |
| Interactive Education | A small worksheet: change available liquidity, IOC/limit and net profit | Learns by doing, more decisions per page |

Existing React/TypeScript, CSS Modules and project tokens are retained. Prototype picker follows
the pinned `prototype/PICKER.md` verbatim, located at the top because the journey uses bottom controls.
No new dependency or imagery is required. Production files remain unchanged.

## Run / build / check

Double-click `start-onboarding-prototypes.bat` in this checkout. The frontend-only
preview binds to **127.0.0.1:8886** with strict port checking. Open:

http://127.0.0.1:8886/prototypes/onboarding/index.html

Stop the foreground preview with Ctrl+C in its window. No bot, tunnel, database,
matching, migrations or settlement process is started. Do not run this BAT against
an unrelated process already using 8886; Vite reports the conflict and exits.

Picker: keys **1–3**, **Left/Right**, **R** replay; selection persists in `?v=...`.
Language/theme controls are harness-only URL preferences and do not write the
production onboarding completion flag. Optional URL parameters: `lang=ru|en|zh`,
`theme=light|dark`. `baseline=1&step=0..4` / `baseline=1&kind=public|private|guarantor`
show the untouched current components for comparison.

From `frontend`:

```powershell
npx tsc -p tsconfig.prototypes.json
npx vite build --config vite.prototypes.config.ts
npx playwright test --config playwright.prototypes.config.ts
```

The standalone build writes only `.ux-preview/onboarding-build`, never `frontend/dist`.
If the preview is already running, set `BETTON_PROTOTYPE_EXISTING=1` for Playwright.
The tests use their own `prototype-tests` directory; no production screenshot baselines
are replaced. Screenshots and test outputs are ignored under `.ux-preview`.

## Verification checkpoint before bounded critique

- TypeScript prototype check passed; isolated Vite production build passed.
- Initial Playwright matrix: **73 passed**. This includes all three directions ×
  three languages × two themes × four widths (320/360/390/430), each traversing
  five pages and three type-info pages; plus interaction/picker/skip/bridge checks.
- No page errors or backend/API calls occurred. Tests verify footer visibility,
  horizontal overflow, independent production completion state and normal/reduced motion.
- Telegram BackButton is checked with an emulated bridge, not a real mobile WebView.
- Independent Impeccable assessment A/B and the single bounded fix/confirm pass
  are pending at this checkpoint; no direction has been selected or promoted.

## Bounded A/B review and final confirmation

Independent agents `onboarding_critique_a` (design/browser review) and
`onboarding_critique_b` (detector/browser evidence) reviewed the initial build.
The parent read A before B and supplied one combined batch. Static detector reported
zero findings; live inspection identified the specific issues below. The inherited
project-font warning was treated as a scoped false positive, not a reason to replace
the existing typography. No whole-product accessibility certification is claimed.

| Before | After | Why |
|---|---|---|
| Learn execution feedback could fall below the 320px scrollport | Solid sticky feedback precedes the controls and stays visible with slider/IOC | The learner can see filled and returned amounts while acting |
| Learning consent marked all guarantor stages complete | Only the first agreement stage receives a check | Agreeing is not funding or settlement |
| Progress controls had a 19×19px hit area | 44×44px controls, with the official picker untouched | Keyboard/touch navigation remains dependable |
| RU/EN main step omitted the deadline anchor | Explicitly within 24h **after the event ends** | Matches the confirmed UX v3 protocol |
| Motion type numbers had contrast 4.32/3.92 | Secondary project token, measured 5.01 light / 5.84 dark | Small text needs at least 4.5:1 |
| Offer metadata could shrink to 10–11px | 12px metadata with wrapping | Narrow devices preserve legibility |
| `?v=1.5` could render an undefined variant | Strict integer/range validation falls back to direction 1 | Malformed links no longer crash |
| Steps could retain a previous scroll position | Step/detail changes reset scroll and focus the current heading | Back and keyboard users regain context |

After that single batch: **74 Playwright tests passed** (the 72-case matrix and two
focused interaction/regression cases), prototype TypeScript passed and the isolated
Vite production build passed. No console errors or backend calls were observed.
The new regression covers malformed URLs, simultaneous feedback/controls at 320px,
200 TON educational profit splitting into 1.50/0.50 TON from the 2 TON fee, one checked
consent stage, focus recovery and 44px progress targets.

One confirm screenshot round was captured and visually inspected:
`confirm-direction-{1,2,3}.png`, `confirm-motion-types-dark.png`,
`confirm-learn-320-en.png`, `confirm-guarantor-consent.png` under the screenshot folder.
Small screens intentionally scroll their content area; the footer and picker remain
reachable. No additional visual-polish rounds were performed.

This is a choice-ready prototype, not an approved replacement. Real Telegram bridge,
mobile screen-reader behaviour and production integration remain separate checks.
