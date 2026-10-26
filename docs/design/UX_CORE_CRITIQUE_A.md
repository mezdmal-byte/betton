# Core journey — independent Assessment A

Method: independent Assessment A (`core_assessment_a`), before detector or Assessment B findings. This is the design/UX half of the parent's dual-agent critique, not a combined verdict. Target: `frontend/prototypes/core/`, 26 October 2026. **Disposition: fix.**

## Scope and evidence

- Created a fresh in-app browser tab for `http://127.0.0.1:8891/prototypes/core/?v=1`; inspected Exchange, switched to Pocket, and personally completed question → outcome → amount150 → review → demo confirmation → portfolio. Opened Folio in dark mode separately.
- Visually inspected the committed candidate evidence for detail/trade/review/result/portfolio, plus independent320px light/dark captures of all three feeds. Independent Playwright capture also rendered all three at390px, in both themes with reduced motion. Document-width overflow was false in all12 captures; the clipped Exchange navigation shows why this alone is insufficient.
- Independent captures are ignored local artifacts `.ux-preview/assessment-a-{320|390}-{light|dark}-{1|2|3}.png`. Public direction evidence is `docs/design/ux-reinvention/evidence/directions/`. Screenshots are synthetic; no money API was called by this assessment.
- Read the prototype's shared presentation/state source to explain observed behavior. Did not read another assessor's report, run a detector, or change frontend code. These scores concern the synthetic core journey only. They do not certify API integration, financial safety, native Telegram behavior or user research.

## Design specificity first

The feeds are genuinely different in composition: Exchange is a ruled quotation bulletin with aligned prices and top navigation; Folio uses a serif reading hierarchy and conditions-first narrative; Pocket uses comfortable question surfaces, categories and bottom navigation. These are not merely three colourways.

Their specificity weakens after event selection. All three trade/review/result/portfolio screens largely share the same component structure and information sequence. Pocket's rounded `sheet` is currently a section in a replacement page, not a contextual mobile sheet. A different panel radius does not establish a different trade ritual. The event questions and truthful availability wording belong to BetTON, but the visual identity is still a promising experiment rather than a distinctive finished product system.

## Experimental recommendation

**Carry Pocket forward, after the P1 fixes below.** It gives a new user conditions before the outcome choice, makes missing proposals understandable, and keeps the five destinations in the thumb zone. Its amount presets and clearly named review step support deliberate action. This is a recommendation for the isolated branch, not owner approval for production.

| Direction | Where it wins | Cost / reason not to lead this experiment |
| --- | --- | --- |
| Exchange | Fastest comparison: several questions, both coefficients and available amount are visible together. Strong compact visual discipline. | At320px the top navigation clips Profile. Data labels are small, and the price columns require more domain familiarity. Better candidate for experienced scanning than the first-time path. |
| Folio | Strongest visual divergence and clear conditions-first reading. Its headline language is memorable. | Large reading blocks reduce market comparison; trade/result steps inherit the same generic structure. The extra “Перейти к сумме” action defaults to Yes, competing with explicit outcome selection. |
| Pocket | Clearest novice path, reachable destinations and readable grouped amounts. Best foundation for the required whole application. | Lowest feed density; repeated rounded market surfaces can become generic. Its distinctive mechanism must be funded availability and an honest execution receipt, not decoration. |

Do not combine the three skins. Pocket can inherit a discipline such as numerical alignment without importing Exchange's navigation or Folio's lettering.

## Nielsen assessment,0–4

| # | Heuristic | Score | Key issue |
| --- | --- | --- | --- |
|1|Visibility of system status|2|Partial execution is named, but the subsequent available balance contradicts the refund.|
|2|Match with the real world|2|The role of coefficients is partially explained; accepted price, probability and execution bound are absent from review.|
|3|User control and freedom|2|Explicit Back/change-amount controls exist; route scroll/focus and refresh continuity are not maintained.|
|4|Consistency and standards|2|Controls are consistent, but Folio offers a second route to amount that silently chooses Yes.|
|5|Error prevention|1|A financial confirmation omits the execution coefficient/bound; synthetic result/accounting can mislead.|
|6|Recognition rather than recall|2|Question/outcome are repeated, but the coefficient must be remembered from detail.|
|7|Flexibility and efficiency|2|Search and presets work; narrow navigation and unnecessary scroll impede one-handed use.|
|8|Aesthetic and minimalist design|3|Three coherent feed directions, restrained surfaces and clear headings; secondary financial text is too small.|
|9|Error recognition and recovery|2|Invalid amount disables progression with an inline explanation; changing state can erase the conceptual receipt. Network recovery is outside this synthetic scope.|
|10|Help and documentation|2|Liquidity and fee copy helps; IOC and the relationship between coefficient, price and chance need local explanation.|
| |**Total**|**20/40**|**Acceptable prototype foundation; significant improvement required.**|

## Cognitive load and emotional journey

Three of the eight cognitive-load checks fail: **working memory** (review omits the chosen coefficient), **single focus** (outcome/mode/presets/navigation compete in the ticket), and **one thing at a time** (Folio has two paths into trading, one with a default outcome). Grouping, readable primary hierarchy and progressive amount/review separation work. Result: moderate cognitive load, not a wall of controls.

There are five persistent main destinations, two trade modes, two outcomes and four amount presets. Five navigation choices are conventional and do not need arbitrary removal; they need visual separation from the active financial decision. The four preset amounts are a coherent group. Prototype picker/chrome is a separate comparison tool and should not be counted as future product navigation.

The strongest emotional moment is the calm partial-fill receipt: it says what executed and what returned. The valley comes immediately afterward when portfolio says850 available after a120 debit and30 refund from1000. That breaks trust more severely than a styling defect. Entering the review should reassure by repeating the accepted price and limits; it currently asks the user to remember them.

## What works

1. Event selection is separate from submission. Tapping a market does not commit money, and review has a distinct confirm action.
2. Missing opposing proposals are described in words; Own Price remains an available path rather than a fake coefficient.
3. Question, selected outcome, requested amount, expected execution and remainder are grouped into a legible receipt. This is the right structure to populate from real backend quotes.

## Priority issues

### P1 — Receipt, portfolio and mutable draft disagree

Observed in live Pocket and the captured alternatives: request150, execute120, refund30, then available850 with120 in positions and no active order. The displayed total loses30. The header still says1000. Source also derives portfolio from the current mutable amount/market/side, rather than an immutable confirmed record; opening another event can relabel the prior position. With zero available liquidity, a resting limit can be described as a partial fill and counted as a position.

**Fix:** give the synthetic prototype an immutable, explicitly labelled result fixture/record; distinguish executed position from resting order, and make header/receipt/portfolio agree. For integration, bind every amount/status to the existing authoritative server response and account refetch, not this prototype's arithmetic. Suggested mode: `harden`.

### P1 — Review omits the price being accepted

The review repeats outcome/mode/amount but not the selected coefficient, limit coefficient or worst acceptable execution bound. A user has to remember detail and cannot verify the most consequential input. Price, probability and coefficient are also not visibly distinguished in the current core path. A general fee paragraph does not repair that gap.

**Fix:** show the chosen price representation with its unit and source, the accepted bound and quote freshness beside the confirmation, and the server-provided expected execution/payout where supported. Keep absence explicit. A synthetic fixture must be labelled; do not add client arithmetic to pretend the real backend promised a quote. Suggested modes: `clarify`, `harden`.

### P1 — Navigation and route continuity fail on a narrow phone

At320px Exchange clips the rightmost Profile destination even though horizontal-overflow checks pass: `overflow-x:clip` hides it. In live Pocket, route changes retained the document's prior vertical offset; detail/review could open with their header above the viewport and the floating comparison picker over the title. Route headings do not receive focus. Fixed bottom navigation can cover controls during intermediate scroll positions, visible in Folio detail/portfolio captures.

**Fix:** use a bounded app viewport with a deliberate scroll container and measured bottom clearance; make all five destinations fit at320px; move focus to the new route heading and reset/restore scroll intentionally. Keep native Back and focus cleanup in the integrated controller. Verify visibility and hit-testing, not only document scroll width. Suggested modes: `adapt`, `audit`.

### P2 — Divergence does not yet extend through the trading interaction

The three feeds are different, but Ticket/Review/Result/Portfolio are essentially the same shared layout under three skins. Pocket's section is called a sheet without preserving the underlying event context. Folio's “Перейти к сумме” is an additional Yes shortcut, not a new deliberate trading sequence.

**Fix:** preserve the three design directions, but make their interaction hypotheses testable: Exchange can keep quote/depth adjacent to its ticket; Folio can progress from a deliberate selected outcome through a reading-led review; Pocket can present a genuinely contextual short trading panel with explicit close/back and focus return. Do not create a second financial implementation. Suggested modes: `shape`, `prototype` workflow.

### P2 — Financial secondary information is below comfortable mobile reading size

Available amounts, close times and creator/source labels are often10–12px, and navigation labels shrink to8–10px. On320px, the dark Exchange feed makes the question readable but its supporting evidence much harder to scan. Pocket's large introduction/filter region means only about one full market is available above the dock. Exclude the96px comparison harness when assessing product space, but still reduce product-only overhead.

**Fix:** increase important financial/supporting labels to a consistent readable size, keep nonessential metadata secondary, and compress product header space before shrinking data. Inspect rendered Cyrillic lettering, not just the declared Latin display face. Suggested modes: `typeset`, `layout`.

## Persona red flags

- **Jordan, first-time trader:** sees coefficients without the accepted price repeated at confirmation; “Своя цена” and IOC need a brief in-context distinction. The150/120/30→850 contradiction undermines understanding of refunds.
- **Casey, distracted one-handed user:** bottom destinations help in Pocket, but the ticket/review require scroll and can begin at the wrong vertical position. Exchange Profile is unavailable at320px.
- **Sam, keyboard/screen-reader user:** native buttons and labelled amount fields are useful. New route headings are not focused or announced; focus remains on a removed control, while fixed controls can obscure the next focused item. This was source/live review, not a screen-reader certification.

## Minor observations and limits

- Prototype-only synthetic labels are conspicuous and honest. Keep them out of the final product surface while retaining an unmistakable test-environment indicator.
- The type=number spinner appears in desktop Chromium; test phone numeric keyboard clearance separately in the integrated build.
- Both theme palettes rendered coherently in independently captured feeds. This assessment did not calculate contrast ratios or validate every dynamic state in dark mode.
- Refresh resets the synthetic journey, which is acceptable only if explicitly a prototype limitation. Integrated persisted intents must remain untouched.
- No real API integration, new event creation, guarantor protocol, production direction approval or user usability study is claimed by this review.

Questions skipped: the owner explicitly authorized autonomous experimental choice and is unavailable. The parent should apply one bounded fix batch, then request a confirmation pass over these named findings before treating the prototype as ready for integration.

## Verdict pass after the single correction batch

This is a confirmation of the five findings above, not a new full audit. Assessment B was not read. Inspected the replacement390px screenshots, source changes, and a fresh explicit Playwright run of the synthetic Pocket flow. The previous IAB browser was unavailable and browser inventory was empty; the owner-requested Playwright path supplied actual rendered evidence instead. Temporary confirmation captures are `.ux-preview/assessment-a-confirm-*`.

| Named finding | Verdict | Evidence checked |
| --- | --- | --- |
| P1 receipt/portfolio/draft disagreement | **Resolved within the tested synthetic scenarios** | IOC150 now executes120, returns30 and shows880 available in both header and portfolio. A subsequent zero-fill limit10 shows “Заявка размещена”,870 available, one original position and one active order. The original train position is preserved while the draft moves to the exhibition. Confirmed records are immutable snapshots rather than a view of the current draft. |
| P1 accepted price absent from review | **Resolved for this prototype** | Review shows “Не хуже коэффициента1.67×” or the chosen limit coefficient and a labelled demo-quote time. Ticket explains coefficient units and implied probability without calling it a platform prediction. Integrated economics and quote expiry remain server responsibilities. |
| P1 narrow navigation / route continuity | **Resolved at the named prototype scope** | Profile fits at320px: x250,width60 within320. New detail heading receives focus. The bounded app/scroll structure replaces the accidental document-offset behavior; navigation and focus have explicit treatment. This does not certify native Telegram Back or preservation of every integrated route. |
| P2 insufficient trading-interaction divergence | **Partial** | Pocket now opens a genuine contextual dialog over the event, with close control, inert background, focus handling and a pinned review action. Exchange keeps quote/volume beside its ticket; Folio's unsafe default-Yes duplicate action is removed. Folio still shares the same ticket/review order rather than demonstrating a substantially different sequential trading ritual. The three feeds remain structurally distinct; the trade-stage divergence is strongest between Pocket and the other two. |
| P2 small secondary financial information | **Resolved at the named size checks** | Important financial/supporting labels increased to12–13px, navigation to10–11px and all five destinations fit. Updated320px Exchange and390px Pocket renders were inspected; no claim is made about every locale or a complete contrast matrix. |

**Scoped conclusion:** the three named P1 findings are resolved in the tested synthetic flow. Pocket remains the recommended isolated integration direction. The partial divergence finding is an honest limitation of the retained alternatives; it does not justify rewriting financial controllers or combining their visual systems. This verdict does not say the whole application has passed UX, API or release acceptance.

The public `pocket-03-trade.png` replacement capture caught the210ms entrance while sheet opacity was still changing, exposing underlying text in that frame. A settled/reduced-motion independent capture shows an opaque sheet (`rgb(239,237,231)`, opacity1) and a clear pinned action. Recapture that public evidence after animation completion before presenting it as the finished state. This is a capture correction under the existing sheet finding, not an additional design-review round.

Questions skipped: the owner authorized autonomous experimental continuation. No new discovery list or additional open-ended polish round was started.

### Final disposition of the sole partial finding

Inspected only the updated `folio-03-trade.png` and Folio's component reference after the targeted change. **P2 trading-interaction divergence: resolved at the prototype-comparison scope.** Folio now uses a separate `FolioTicket`: the chosen outcome is a read-only statement, followed by one large amount, then the available opposing volume and the execution-method decision. It no longer begins with the shared mode/outcome toggles and four presets. This creates a reading-led full-page hypothesis that is materially different from Exchange's quote-adjacent ticket and Pocket's contextual dialog. Sharing the receipt model and review contracts is appropriate; separate financial logic is unnecessary.

This final scoring closes that named partial finding only. It does not reopen the matrix, certify every Folio control, approve production, or expand the previous synthetic-flow verdict into an integrated API claim. Pocket remains the recommendation. No further prototype polish round is requested by Assessment A.
