# BetTON Design v1

Frozen visual prototype for `feature/react-ui`. Backend integration must reuse this system, not restyle it.

## Principles

Premium consumer fintech + prediction market + Telegram-native. Canvas / surface / faint outcome tints. No glass, gradients, neon, crypto chrome, or large card shadows. System font stack. 4px spacing. Semantic Side A/B color, never profit/loss green-red.

## Tokens

Source: `src/styles/tokens.css`.

- Canvas `#f7f8fa`, surface `#ffffff`, text `#15171a` / `#667085`
- Brand plum / teal, primary action `#11756f`
- Outcome A teal, Outcome B coral
- Radius 14 for controls, 16 for sheets, pill for chips
- Touch 44px min, 48px preferred
- Safe areas: `--safe-top` / `--safe-bottom` via `env(safe-area-inset-*)`. Bottom nav and sticky action bars use `padding-bottom: max(existing, env(safe-area-inset-bottom))`. Do not hardcode iPhone inset values.

## Outcome A / B

`OutcomeQuote` is generic. Labels are market-defined (Да/Нет, Спартак/ЦСКА, Выше/Ниже). Persistent faint A/B tint; selected is stronger. Color is not a Yes/No or win/lose encoding.

## Navigation

Bottom tabs: Рынки · Создать · Портфель. Profile is pushed (back header), not a tab. Create Market uses back + sticky CTA, no tab bar.

## Quick Trade vs Own Price

- **Quick Trade:** sheet over the feed. Best executable quote, amount, presets, payout, primary CTA. «Своя цена →» is tertiary.
- **Own Price:** full screen. Odds stepper, execution summary (исполнится сейчас / останется заявкой), book, recent trades. No IOC/LIMIT wording.

## Screen patterns

- Header 56px. Back screens: `IconButton` md + 16px semibold title.
- Page padding 16px.
- Section labels: 12px medium secondary.
- Form controls: 48px, radius 14, faint border. Amount field stays 56px / 28px numeral.
- Sticky bars: 12px top, 16px bottom (plus safe area), faint top border.
- Tabs: 400 inactive, 600 + plum underline active.
- Primary filled teal, secondary outlined surface, ghost/tertiary muted text with 44px hit area.
- Financial numbers: tabular nums. 700 only for hero amounts / CTA figures.

## Canonical fee copy

Compact: `Вознаграждение автору: 75% сервисного сбора`

Detail (Create Market, expanded only): `Автор события получает 75% сервисного сбора, начисленного с выигрыша другого пользователя. 25% получает платформа. Общий сервисный сбор для победителя не меняется — 1% от чистой прибыли.`

Winner service fee remains 1% of net profit. This is not a second creator fee.

## Master screens

Markets, QuickTrade, MarketDetail, OwnPrice, CreateMarket, Portfolio, Profile.

## Do not casually change during backend integration

Matching, integer money, ledger, settlement, 75/25 split, auth, private-market rules, or `app/static`. Do not invent movement %, social/gamification, or exchange jargon (IOC/LIMIT). Do not restyle tokens, A/B semantics, or the seven master layouts to match a new component library.
