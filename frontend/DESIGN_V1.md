# BetTON Design v1

Frozen product/design contract for the React Mini App. Backend integration and visual polishing should reuse this system instead of restyling it from scratch.

## Principles

Premium consumer fintech + prediction market + Telegram-native. Canvas / surface / faint outcome tints. No glass, gradients, neon, casino styling, crypto chrome, or large card shadows. System font stack. 4px spacing. Semantic Side A/B color, never profit/loss green-red.

## Tokens

Source: `src/styles/tokens.css`.

- Canvas `#f7f8fa`, surface `#ffffff`, text `#15171a` / `#667085`
- Brand plum / teal, primary action `#11756f`
- Outcome A teal, Outcome B coral
- Radius 12–14 for controls/cards, 20 for sheets, pill for chips
- Touch 44px min, 48px preferred
- Safe areas: `--safe-top` / `--safe-bottom` via `env(safe-area-inset-*)`. Bottom nav and sticky action bars use the safe-area tokens. Do not hardcode iPhone inset values.

## Outcome A / B

`OutcomeQuote` is generic. Labels are market-defined (Да/Нет, Спартак/ЦСКА, Выше/Ниже). Persistent faint A/B tint; selected is stronger. Color is not a Yes/No or win/lose encoding.

## Navigation

Bottom tabs: **Рынки · Создать · Портфель**. Profile is pushed from the avatar and uses a back header, not a fourth bottom tab. Create is a top-level tab: its primary CTA sits above the bottom navigation. Secondary flows such as Market Detail, Own Price, Wallet, Help, moderation and public profiles use a back header.

## Quick Trade vs Own Price

- **Quick Trade:** bottom sheet over the feed/detail. Amount starts empty. Presets are `10 / 50 / 100 / Макс. X`. It consumes executable counterparty liquidity immediately; backend preview is the source of truth. If an IOC quick trade is only partially filled, the unfilled remainder is refunded. It must never silently become a resting order. «Своя цена →» is tertiary.
- **Own Price:** full screen LIMIT flow. Odds stepper, amount, execution summary (исполнится сейчас / останется заявкой), order book, recent trades. Eligible liquidity can fill immediately; the remaining amount stays as a resting order until matched or cancelled. Do not expose IOC/LIMIT jargon in primary consumer copy.

## Categories

Supported product categories are `sport`, `politics`, `crypto`, and `unique` (shown as «Другое»). A visible category must map to the same backend category; never show a category chip that silently saves as another category.

## Wallet / networks

**TON and Solana are both required product networks.** Keep the `TON | Solana` network switch in the Wallet UI.

The current Wallet is intentionally an honest production-looking shell:
- do not connect TON Connect, Solana wallet adapters, RPC/indexers, deposits or withdrawals until that implementation is explicitly scheduled;
- do not generate fake addresses, QR codes or on-chain balances;
- disabled deposit/withdraw controls must explain that blockchain functionality is not connected;
- the existing BetTON test balance remains separate from the selected future deposit/withdraw network.

## Screen patterns

- Header: compact Telegram-native header. Back screens: `IconButton` md + 16px semibold title.
- Page padding 16px.
- Section labels: 11–12px medium secondary.
- Form controls: 44–48px, radius 12–14, faint border. Amount fields can use larger financial numerals.
- Sticky bars: faint top border; respect Telegram/iOS safe areas.
- Tabs: inactive secondary text, active semibold + plum/teal underline according to component token.
- Primary filled teal, secondary outlined surface, ghost/tertiary muted text with 44px hit area.
- Financial numbers: tabular nums. 700 only for hero amounts / key CTA figures.
- Prefer flat sections and thin borders to stacking many large grey cards.

## Canonical fee copy

Compact:
`Сервисный сбор — 1% только с чистой прибыли победителя.`

Detail:
`Автор события получает 75% сервисного сбора, начисленного с выигрыша другого пользователя. 25% получает платформа. Общий сервисный сбор для победителя не меняется — 1% от чистой прибыли. Автор не получает долю со своего собственного выигрыша.`

There is one winner service fee only. The creator share is a split of that fee, not an additional fee.

## Current master flows

Markets, Market Detail, Quick Trade, Own Price, Create Market + Result, Portfolio, Profile, My Events, Public Creator, Help, Wallet, Moderation, onboarding/session states, and market/order/trade edge states.

## Do not casually change during UI work

Matching, integer money, ledger, settlement, 75/25 fee split, auth, visibility/share-token rules, Quick Trade IOC semantics, Own Price resting-order semantics, or legacy `app/static`. Do not invent movement percentages, fake wallet data, social/gamification, or exchange jargon.
