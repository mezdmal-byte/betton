# Core prototypes — Assessment B

Method: independent Assessment B (`/root/core_assessment_b`), isolated from
Assessment A. Target: `frontend/prototypes/core`, 26 October 2026. This is a
technical/browser evidence packet for the parent's dual-agent synthesis, not a
standalone approval of the app or of its eventual API integration.

## Evidence and scope

- Ran `.cursor/skills/impeccable/scripts/impeccable.cmd detect --json frontend/prototypes/core`.
  Exit **0**, exact JSON **`[]`**, zero rule findings. Reuse this result in the
  parent; a clean static detector does not cover accounting semantics, clipping,
  focus management or viewport placement.
- Storage slug resolved successfully to `frontend-prototypes-core`.
- Created a fresh in-app browser tab for the live localhost target; inspected
  Exchange and Pocket there. No existing user tab was reused.
- Ran an independent Chromium matrix: three variants × 320/390px × light/dark,
  height844, reduced motion. Walked question → outcome → amount150 → review →
  synthetic confirmation → portfolio in all12 cases. Zero browser page errors.
- Visually inspected the resulting viewport PNGs for Exchange320 light,
  Exchange390 dark, Folio320 dark, Folio390 light trade, Pocket390 light trade and
  Pocket320 dark trade. Temporary captures and metrics are in the ignored
  `.ux-preview/critique-b/` folder; parent direction screenshots remain the
  committed evidence set. These were real renders, not inferred images.
- No real API, Telegram account, database, production configuration or financial
  operation was used. All confirmations below are explicitly synthetic.

Browser detector overlay: **not available**. The exposed in-app browser
`playwright.evaluate` is explicitly read-only; no supported mutable script/tag
injection primitive is exposed. I did not circumvent that boundary, start a
detector live server, or claim a visible overlay. Native browser inspection plus
the CLI scan and requested Chromium tests supply the fallback evidence.

## Passed at this scope

| Check | Observed result | Practical limit |
| --- | --- | --- |
| Primary app target size | Feed app buttons measured at least44×44 in the12 matrix cases | Prototype picker28px and harness theme30px are separate chrome; not product controls |
| Reduced motion | Pocket sheet `animationName:none`; reduced-motion media query true | Native phone keyboard/gesture physics were not exercised |
| Visible keyboard focus | Amount input had a solid focus outline | Focus destination after route change fails below |
| Picker shortcuts | After its ready marker, `1` switched Pocket→Exchange and `3` returned | Initial input before listener readiness is not evidence of a broken shortcut |
| Document overflow | `scrollWidth <= innerWidth` in all12 cases | This check misses clipping inside `overflow-x:clip`; Exchange fails below |
| Synthetic flow | Review, confirmation, result and portfolio all reachable in12 cases | Result model is inconsistent and mutable, so completion alone is not correctness |

## Priority findings for one correction batch

### P1 — The synthetic portfolio is derived from the live form, not a confirmed receipt

`shared.tsx` `Portfolio` subtracts the entered amount unconditionally. With an IOC
amount150 and available opposing amount120, the result says120 executed and30
returned, but the portfolio says **850 available**, rather than880. Pocket's header
simultaneously still says1000 TON.

More seriously, after that confirmation I opened the position, returned to the
ticket, changed the amount to5, and used the Portfolio tab **without confirming**.
The existing position changed to5 TON and available balance to995. This reproduces
in the shared model used by all three variants: `hasPosition` is only a boolean,
while portfolio/result read mutable `market`, `side`, `amount` and `kind`.

Fix: snapshot an immutable synthetic receipt on confirmation and render positions,
orders, account balance and result from that receipt. IOC deducts executed amount;
limit reserves executed plus resting amount. Zero-filled limit submission must be
an active order, not an open position or "partial execution". Do not carry this
prototype arithmetic into integration; the real app must use server outputs.
Add assertions for partial IOC refund, zero-fill resting limit and editing another
unsubmitted ticket after a completed operation. Suggested mode: `harden`.

### P1 — Pocket's trading action starts below the fixed dock

At390×844 after editing150, the "Проверить заявку" rectangle was
**y824.33–878.33**, while the fixed nav occupied **y767–844**. At320 it was
**y815.05–869.05**. The inspected viewport screenshots show amount presets at the
dock and no usable primary action. Scrolling eventually exposes the action, but
the advertised thumb-friendly sheet initially spends its visible height on the
brand, Back, metadata, question and repeated selectors.

Fix: give the trade route a compact context header; reserve a visible action row
above the dock (or replace the dock with the scoped trade action and explicit
cancel). Keep amount/error scrolling clear of both bars and test the action's hit
target, not only its DOM visibility. Do not mask the problem with more bottom
padding alone. Suggested modes: `layout`, `adapt`.

### P2 — Exchange silently clips the fifth primary destination

At320px the Profile button's right edge measured **332.14px**, and at390px it was
**405.42px**. The container remains viewport-width because the article uses
`overflow-x:clip`; therefore the existing document-overflow assertion passes while
the actual Profile text is cut. Exchange nav labels shrink to **8px** at320.

Fix: design a narrow-width nav that fits five labelled destinations without
8px labels or clipped text. Test every nav button rectangle against its container
and inspect the actual screenshot. Suggested mode: `adapt`.

### P2 — Route changes discard focus and have no announcement

After the feed question button opened detail, `document.activeElement` was
**BODY**. Keyed `<main>` remounts on every route but does not focus a heading or
announce the new state. Confirmation/result use the same pattern. The keyboard
user loses position and must traverse harness/header controls again.

Fix: focus the destination heading (temporary `tabIndex=-1`) after route changes,
restore the launching control on Back, and announce the synthetic confirmed
result once. Keep ordinary input editing silent. Suggested mode: `harden`.

### P2 — Invalid-input text misses contrast in the dark theme

The actual invalid amount alert computed to **rgb(180,35,24)** on Pocket sheet
**rgb(52,46,41)**: measured contrast **2.04:1**, below4.5:1 for its12px text.
The global `.error` colour does not adapt to the dark palette.

Fix: theme the error foreground/surface and verify the rendered pair in both
themes. Preserve the explicit text and `role=alert`; colour must not be the only
signal. Suggested modes: `colorize`, `audit`.

## Technical recommendation and limits

**Hold all three until the shared result model is corrected.** Pocket is the
strongest implementation candidate conditionally: its full-width event targets,
category/search entry, explanatory detail and persistent labelled destinations
support a beginner mobile journey. That recommendation depends on fixing the
trading action placement and receipt/state bugs; it is not a ship verdict.
Exchange's aligned rows are a useful distinct comparison, but the narrow nav
needs redesign. Folio keeps a clearer visible review action in the measured trade
viewport; its reading-first composition trades away feed density. The parent must
weigh these observations with unanchored Assessment A, not replace A with a
detector score.

RU was the only locale supplied by this synthetic harness. EN/ZH are not verified
or claimed. No native Telegram Back, OS keyboard, auth failure, actual quote,
unknown server result or real recovery was tested by this prototype review; those
belong to the integrated application matrix. No frontend mutation or commit was
made by Assessment B.

Questions skipped: the owner explicitly authorized autonomous experimental
selection and correction while unavailable; production approval remains separate.

## Bounded verdict after the first correction batch

This pass scores **only the five findings above**. No second detector or new
issue hunt was run. Assessment A had completed before the parent read this
assessment. Inspected updated source and the regenerated direction PNGs; ran a
focused Chromium confirmation at320/390px in dark/reduced-motion mode for all
three variants. Fresh temporary evidence is `.ux-preview/critique-b-confirm/`.
The in-app browser was unavailable at this confirmation (`Browser is not available:
iab`); the owner's explicitly requested Chromium/Playwright path supplied the
bounded fallback. This is not native Telegram or OS-keyboard verification.

| Original finding | Verdict | Confirmation evidence |
| --- | --- | --- |
| P1 Mutable/incorrect synthetic receipt and portfolio | **resolved** | `DemoReceipt` snapshots market/side/mode/amount/filled/refund/remainder before confirmation. All three variants showed IOC150→120filled/30refund and880available. Editing an unsubmitted5TON ticket kept880 and the120TON position. A subsequent zero-fill10TON limit added one order without adding another position; result said "Заявка размещена". Pocket's header also showed880. |
| P1 Pocket action below the dock | **resolved at tested viewports** | At both320/390×844 the contextual modal action rectangle wasy732.95–786.95, entirely inside the viewport. Background detail remains present and inert; the old navigation no longer covers the action. Actual reduced-motion PNGs show a solid sheet and visible confirmation action. |
| P2 Exchange fifth destination clipping | **resolved** | Each of the five nav-button rectangles fits within320 and390px in all three variants. The grid replaces overflowing intrinsic button widths; the inspected screenshot shows Profile fully. |
| P2 Route focus loss / return | **partial** | Detail H1 receives focus; dialog H2 receives initial focus. Shift+Tab reaches the last action and Tab wraps to the close button. Escape closes the panel. The result has `role=status`. However, close returns focus to the detail H1 rather than the outcome control that launched the dialog, so the originally requested launcher-focus restoration is not yet implemented. |
| P2 Dark error contrast | **resolved** | Actual alert foreground isrgb(255,180,168) onrgb(52,46,41), measured7.87:1. The labelled error and disabled action remain. |

**Evidence recapture needed:** the current `directions/pocket-03-trade.png`
was captured during the sheet's entrance opacity animation: underlying text shows
through the transient frame. The independently captured reduced-motion confirmation
is opaque and demonstrates the action correction. Recapture the published PNG
after animation completion or with screenshot animations disabled; do not treat
the transient frame as the final visual material.

Disposition: **fix** for the remaining named launcher-focus requirement and
**recapture** for that one direction image. The four resolved rows support those
specific fixes, not whole-app approval. No claim is made about integrated API
behaviour, untranslated locales, native keyboard or Telegram Back.

### Final targeted verdict — launcher focus and recaptured image

Only the two open items from the preceding verdict were rechecked; no detector,
full matrix or new issue search was run.

| Open item | Final verdict | Observed evidence |
| --- | --- | --- |
| Return focus to the launching outcome | **resolved** | A fresh390×844 Pocket Chromium pass opened the trade panel from "Да1.67×". Both the close button and Escape returned `document.activeElement` to that exact launching outcome control. `useCoreJourney` retains the control and has a data-attribute fallback for a remounted detail. |
| Transient-opacity trade screenshot | **resolved** | Visually inspected the replaced `directions/pocket-03-trade.png`: the sheet is opaque, underlying terms no longer bleed through, and the full action is visible. Capture calls now use `animations:'disabled'`. |

Final disposition: **ship at the scope of Assessment B's five named prototype
fixes**. All five are resolved by the evidence above. This is not approval of the
eventual integrated application, production direction or untested states.
