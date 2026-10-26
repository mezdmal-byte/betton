# Visual reference research — 26 October 2026

[Open the annotated visual board](board.html). Eight captured examples were visually inspected in the in-app browser. These are reference excerpts, not BetTON designs or validation of competitors' financial claims. The six product examples include iOS recordings hosted by 60fps and publicly accessible web UI; Mercury is explicitly its public synthetic demo. No authenticated customer account was opened and no transaction was submitted.

The original assignment requested12–18 examples if accessible. The owner's later **DESIGN SKILLS REPAIR + REAL UX/UI REINVENTION** clarification prioritizes a small real board and implementation stages C–F. This checkpoint supplies8 inspected examples rather than spending the sprint collecting more. It does not claim12–18.

## Concrete observations and transfer

| Reference and exact page | Observed screen | UX problem / transfer to BetTON | Do not copy |
| --- | --- | --- | --- |
| [Wise transfer calculator](https://wise.com/gb/send-money/) | Two amounts, each with direction label and currency; timing and fee rows directly below; lock duration next to rate. Browser served Russian localization. | Separate stake from possible receipt; place fee and quote freshness next to the decision instead of in help. Values must come from backend quote. | Wise green branding, transfer timing claims, or exchange-rate semantics as P2P probabilities. |
| [Polymarket public feed](https://polymarket.com/ru) | Question first, vertically aligned outcome percentages, compact Yes/No controls, volume in footer, category strip. Screenshot is scrolled feed, not mobile emulation. | Align comparable outcomes; distinguish question, executable quote, and activity. Let event row open detail before commitment. | Repeated tiny trade buttons, truncated outcomes, combo/perpetual products, or volume as evidence of currently executable liquidity. |
| [Mercury public demo dashboard](https://demo.mercury.com/dashboard) | Persistent destination rail, balance/chart region, quick actions, separate contextual task panel. Synthetic demo banner remains visible. | Give portfolio and activity stable destinations; surface next action without hiding balance context. | Desktop density, demo balance, fabricated charts or large marketing panels in a mobile trade view. |
| [Mercury public demo company profile](https://demo.mercury.com/settings) | Label/value rows with contextual explanation and local Edit action; clear Settings return path. All visible company data is the public Mercury Demo. | Profile as readable facts and deliberate edits; separate private account settings from public guarantor identity. | Corporate tax fields and sprawling desktop settings navigation. |
| [Apple HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | Diagram and guidance frame a sheet as a scoped task related to its underlying context. This is documentation, not an app screenshot. | A short quote/review can preserve market context, with explicit cancel/back; longer create/revision flow needs a full page. | Applying a sheet to every route or reproducing the HIG illustration as product UI. |
| [Linear Issue Actions Popup — iOS recording](https://60fps.design/shots/linear-issue-actions-popup-interaction) | Dark compose context, keyboard, compact metadata controls, then a localized Priority choice panel with selected check. Inspected the changing recording; saved choice-panel frame. | Reveal advanced metadata only when needed; keep the current event/draft context visible; make selected state explicit. | Tiny controls, developer terminology, or placing irreversible trade confirmation inside a casual metadata popup. |
| [Wise Number Input — iOS recording](https://60fps.design/shots/wise-number-input-interaction) | Large editable sending amount, smaller receiving amount, currency on each row, numeric keyboard and Done. Recording changes typography as amount grows. | Anchor editing on one monetary amount; keep currency and direction persistent; test long numbers and keyboard clearance. | Animated digits that delay reading or a second client-side financial calculation. |
| [Revolut Graph Glow Drag — iOS recording](https://60fps.design/shots/revolut-graph-glow-drag-interaction) | Instrument name, large price, change/time labels; graph cursor and highlighted curve point underneath; risk copy above. | Tie history inspection to a time/value label. Keep historical prices distinct from current executable quote and probability. | Decorative glow, crypto branding, or invented historical points when backend has no data. |

## Research access ledger

- **Mobbin:** the first targeted iOS prediction-market feed search was refused: “Mobbin MCP requires a paid plan.” No retry, bypass, result or visual observation is claimed. [Plan information](https://mobbin.com/pricing).
- **21st.dev:** public HTML catalog accessible; components/navigation categories confirmed. No concrete component was visually inspected or adopted in this checkpoint. No code/dependency copied.
- **60fps.design:** actual Linear, Wise and Revolut pages opened and recordings visually inspected. Public Family wallet/error and Telegram translation sheet recordings were additionally inspected, but omitted from the published board because the saved frames include participant names/avatars/content that is unnecessary for BetTON research.
- **motionsites.ai:** public HTML gallery accessible; marketing/hero focus confirmed. No specific motion clip inspected or adopted.
- **navbar.gallery, unsection.com, cta.gallery, footer.design:** public HTML accessible. Their marketing navigation/section catalogs were read only; no specific design is claimed as a visual reference.
- **bentogrids.com:** text fetch returned no extractable content. No visual observation claimed.
- **404s.design:** text fetch unavailable. No visual observation claimed.
- **Apple HIG:** JavaScript page opened successfully in browser; Sheets documentation visually inspected. Text tool alone initially returned the JavaScript notice.
- **Kalshi:** text page accessible, but browser showed a security/browser verification screen. No interaction, bypass or visual market observation claimed.
- **Robinhood /us/en/stocks/:** text fetch404; no visual observation claimed. No account/login used.
- **Mercury /product:** text fetch unavailable; public homepage then its linked demo opened normally in browser. Dashboard and settings loaded; transactions remained partially loading in captured attempts and are excluded from the board.
- **Polymarket detail:** title/date/category region loaded but ticket remained a skeleton at capture; excluded as a complete trade-ticket reference. Feed is retained as observed.

## Direction implications, before implementation

1. **Readable counterparties, not a bookmaker grid:** make event question and available opposing amount primary. A percentage is not itself guaranteed execution.
2. **One deliberate trade path:** outcome → amount/mode → fresh server quote → explicit confirmation → actual result. Expand Own Price controls rather than showing all controls at feed level.
3. **Portfolio is a destination, result is a receipt:** pending/reserved/filled/remainder must be named. Preserve identifiers and server status through uncertain responses and reload.
4. **Progressive detail, stable navigation:** terms and liquidity remain inspectable; advanced fields don't obstruct the first transaction. Back restores the prior context.
5. **Motion follows a state change:** press feedback, contextual panel entrance, focus restoration. No moving money numerals while the user is comparing them; honor reduced motion.

The board is a research input. It does not choose the experimental direction or certify the BetTON build. Root performs independent critiques and implementation in PR25.
