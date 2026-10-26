# BetTON — handoff: visual v1 screens / React implementation

**27.10.2026 | Owner decisions from review | Work-ready specification**

## 0. Source of truth and classification

- **Functionality/API:** actual existing code in PR #24 (`codex/night-sprint-20261026`), including authoritative i18n and number formatting, plus API contract details from existing tests. PR #28 fixes guarantor stale requests, but is a separate unfinished stack; do not pretend it is already merged.
- **Visual style and compositions:** preferred image references and inline corrections in [README.md](README.md), the actual source images from the conversation packed into **`BetTON_visual_reference_pack_v3_2026-10-27.zip`**. Attach that archive to Work; 10 full-resolution PNGs, SHA-256 manifest. The archive is an artifact of the ChatGPT discussion; **it has not been added to GitHub** yet.
- **Do not** copy PR #25 Exchange/Folio/Pocket styles. **Do not** use the newly generated guarantor 4-/8-screen collages as separate UI systems. **Do** extract micro-patterns from them.
- **Status distinction:** accepted *composition* vs changes required before review vs exploratory idea. Mockup text, amounts and timing are not authoritative.

## 1. Screens to create in a single consistent visual system

1. **FEED-01 — Главная:** use `feed-v1.png`; pale gray canvas, white compact event cards, orange highlight, text category tabs, all-categories dropdown, sorting and filters in separate row, per-event favorite star, clear outcome price/odds and metrics. Lower nav **Главная / Мои ставки / Создать / Уведомления / Профиль**; the middle creation action gets emphasis. No Live-only destination in v1; no automatically invented Live status.
2. **DRAWER-01 — Left drawer:** use `drawer-v1.png`; profile, balance (only if backed by real available view), categories, favorites, my events/drafts/history, rules/how it works/help/settings/theme/language. Show implemented destinations only, or non-clickable explicit coming-soon items. Close on overlay tap/ESC/Telegram back and restore focus.
3. **EVENT-01 — Event detail, one continuous scroll page:** main visual `event-layout-v1.png` (two side-by-side sections of **one** page). Take *only* the **compact header** from `event-header-v1.png`; **do not** use wide photographic banner from event-layout. Two outcomes and standardized status chips, optional image state, 3 true market metrics; 24h/7d/all chart with **two actual outcome lines**, tooltip for real trades, optional amount bars; rules with expandable details/source; preview of roughly 3 orderbook price levels **per outcome**, only `Odds` + `Available TON`, filter All/A/B, open full orderbook; last fills, chat preview; concise Quick Trade vs Own Odds action and sticky estimate. In real API mode amounts and quote must come from server. No false liquidity, no synthetic filled trades represented as live.
4. **MY-BETS-01 — Мои ставки:** use `my-bets-v1.png`. Cards at top: `В ставках — X TON` (executed, awaiting result), `В предложениях — Y TON` (unfilled remaining), `Завершено — N пари` (win/loss/cancel/return). Tabs: `Все / В ставках / Мои предложения / Завершённые`; `С гарантами` is only a filter. Partial fill means split `Исполнено` vs `Осталось в предложении`; don't double count. Generated `Выплачено` is **rejected**.
5. **GUARANTOR-PICK-01 — Выбор гаранта:** use `guarantor-select-v1.png`. Keep selected/other cards, sorting, profile, tariff and sticky continue. Replace repetitive `Условия` section with **the guarantor's own `bio`** preview (2–3 lines); link to full profile; use `topics` only if genuine. Global 24h/return rules must appear only once as global help, and HLTV belongs to specific event, not guarantor profile. Selecting guarantor does not execute bet or accept contract automatically.
6. **GUARANTOR-01 — Частное пари с выбранным гарантом:** use `guarantor-v1.png` as the **main container** with compact event header, selected guarantor, explanatory rules and `Что будет дальше`. It is not an independent unrelated app. Detailed discussion opens from `Согласование условий`.
7. **GUARANTOR-DETAIL-01 — Detailed negotiation within the same private-bet UI:** **not** 4 or 8 unrelated screens. Implement inner `Чат / Условия / История` tabs, same header/guarantor/status as GUARANTOR-01. `Чат`: creator⇄guarantor, incoming/outgoing messages and *system cards* for proposed revisions; `Условия`: tariff, source, criteria, exact current revision, change request, status of required confirmations; `История`: version timeline and actual status transitions. Use proposal chips/cards, counter-offers, waiting, acceptance/rejection, cancellation/expiry as **states of the same component**, not as separate designs. Review `guarantor-agreement-4screen-concept.png` and `guarantor-journey-8states-ideas.png` for useful patterns only.
8. **Supporting state previews:** empty market, no offers/no graph points, loading/error/403/409, awaiting another participant, waiting guarantor, revised terms awaiting confirmation, collecting, active, decision due, cancelled/settled. Use a sandbox state selector for review, not fake API buttons.

## 2. One coherent visual contract

- Light gray app background; white surfaces; premium but restrained orange accent; dark graphite headings; muted text; soft separators; rounded corners. No exchange dashboard / editorial or magazine typography; no arbitrary restyling.
- Centralized tokens for typography, spacing, radius, borders, shadows, surface, accent, semantic states. Exactly same header, tab styles, navigation and buttons across all screens.
- Price/odds displayed uniformly with **two decimals** (e.g. 1.67, 2.20). Units are **TON**. No ₽, no double/incorrect commissions, no invented profit calculations.
- Only show a `Горячее` tag with a grounded defined algorithm; otherwise omit in actual API mode.
- Responsive 320/360/390/430 px, phone safe-area, keyboard focus, proper hit targets, zero clipped text or horizontal scroll, long names, empty descriptions. Dark theme can be a **token-ready foundation**, not a distraction from accurate light theme; deliver complete dark theme only if time allows.
- Keep copy consistent with current agreed i18n and `BETTON_BIBLE.md`; prefer everyday Russian over exchange/crypto jargon. No automatic renaming of previously settled product terms.

## 3. Guarantor workflow business constraints (high priority)

- **Do not confuse** public market conversation with the private creator↔guarantor negotiation.
- In negotiation: messages are discussion and do **not** bind contract; changes to criteria or reward create **a new revision**; relevant parties confirm the actual latest revision through server actions. Don't treat an optimistic UI text `Согласен` as confirmation.
- Show tariff modes: fixed / percent / combined / percent minimum, with truthful helper copy. Reward paid under existing agreed backend formula, not fake flat fees.
- Stages derived from server state, not from screenshots. Avoid depicting guarantor as a bettor or announcing secured funds before actually secured. The private bet is **not public**, remove `Публичное` markers from collage examples.
- `PR #28` security fix is not merged into PR #24; for preview-only state machine, do not claim stale request protection. When later integrating real API, account for G1 invitation revision/generation token requirements and G2 HTTP409-triggered lawful cancellation/recovery; coordinate with security PR before activation.
- Don't invent `LIVE` mode, fictitious sports sources, made-up TON settlement or crypto balance. Preview synthetic fixture data prominently labeled demo.

## 4. Work implementation approach and QA

- Open **new independent branch from `design/visual-decisions-20261027`** and Draft PR **targeting PR #29**. Do **not** edit PR #29 directly. That baseline already has design docs and one miniature guarantor selection preview.
- Implement **real working React/TypeScript frontend prototype** in isolated directory under `frontend/prototypes/` or separate Vite entrypoint consistent with repository. Use current repo tooling, i18n and format utils where feasible. *Do not* rewrite existing `frontend/src/screens/*`, reducers, real auth or backend for a demo.
- Include a coherent clickthrough: feed → event → offer interaction; feed/my bets/favorite/drawer; private event → guarantor picker → private bet → detail tabs. Where no actual API is connected use deterministic fixtures and `Демо` indication.
- Every visible click target should have meaningful interaction or be explicitly disabled; realistic state changes in prototype, not inert styling.
- Create `docs/design/visual-v1/` proof: screenshot same viewport for each implemented key screen + relevant states, comparison reference vs implementation, simple acceptance checklist and remaining mismatches. Save readable images **in GitHub** and/or as GitHub Actions artifacts linked in PR, not only ignored local worktree. Upload full-resolution source PNGs from the provided archive to GitHub in the Work branch, verify hashes from archive manifest and provide directory links. Do not rely on our existing thumbnail as full source.
- CI/tests: install dependencies without unsafe script blind trust, TS/build, existing core frontend tests, Playwright desktop mobile emulation for tab/filters/orderbook/negotiation states, responsive screenshot inspection. If Playwright tests fail, fix or show honest blockers. Avoid cosmetic snapshots being treated as functional safety proof.
- Commit/push each meaningful stage; Work might hit limits or stop. No work should remain solely local.
- No production deploy, Render/webhook/Telegram real bot changes, no merging PRs, no real databases, no money operations.

## 5. Acceptance criteria for owner

1. Open GitHub PR remotely to see **screenshots of all accepted screens**, links to core original PNG assets, actual source and test results.
2. Work preview looks recognizably like the exact approved image references, not a new creative redesign.
3. Tabs, filters, selection, pinned CTA, sidebar and negotiation states actually work.
4. The event detail does not cram two parts into two narrow columns; two-lined chart and offer-level data work in demo states.
5. Guarantor context stays consistent across picker/private bet/detailed negotiation. No public badge, Live, made-up payment guarantees, generic guarantor terms.
6. Every change from exact original design is documented with reason; fix copy in product, not image regeneration.
7. Existing BetTON functionality and all unrelated PRs remain unchanged.
8. Clear next steps for later Figma rebuild/React integration; **do not claim Figma source file already authored if not**.

## 6. Future scope (NOT this sprint)

Creation event wizard (needs new approved screenshots), notifications and profile, all onboarding animations, complete guarantor settlement screens and end-to-end production Telegram integration. Create a unified design library in Figma only after owner reviews Work screenshots. Don't hide this limitation or silently make unapproved screens.
