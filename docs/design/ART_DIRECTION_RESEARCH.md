# Art direction research

Reading this as: visual overhaul of a Telegram-native P2P prediction market for mobile users, with a serious financial-product language. Trust and legibility override decoration. The current teal, rounded, Inter-like React UI is scaffolding, not a brand to preserve.

This note is research only. It does not pick a direction, change product rules, or specify CSS.

Sources of product truth stay `docs/BETTON_BIBLE.md` and `docs/HANDOFF.md`. Confirmed mechanics are fixed: P2P order book, Quick Trade as IOC, Own Price as a resting limit, partial fills, 1% fee only on the winner's net profit, unlisted as a share link, backend as the source of money and matching.

The skill's landing-page dial baseline (variance 8, motion 6, density 4) does not fit this surface. BetTON is an operate screen inside Telegram, and money UI is trust-first. The three directions below sit in different dial regions on purpose.

## What was opened

Prediction and trading, for information architecture:

- Polymarket home and the market `Trump x Greenland deal signed by...?` (22 Sep 2026).
- Kalshi home and `Which party will win the U.S. Senate?`.
- Robinhood Prediction markets (`robinhood.com/us/en/prediction-markets/`).
- TradingView symbol page for NASDAQ:AAPL.
- Coinbase public Bitcoin price page.

Did not render, so they are not used as visual evidence:

- Hyperliquid trade screen stayed a blank dark page.
- Binance BTC/USDT spot stayed a blank black page.
- Financial Times home stopped on a security checkpoint.

Visual references outside prediction markets:

- Linear home, including the embedded product UI.
- Mercury home and the live demo dashboard at `demo.mercury.com/dashboard`.
- Bloomberg Europe home, seen behind a cookie dialog: black masthead, price ticker, news columns.
- Stripe home.
- Wise home.
- Wealthsimple home.
- Koyfin home, including the product screenshot of tables and charts.
- Monzo home.
- Apple Card page.
- Public home, including the product shot of a portfolio and a phone.
- Ramp home.

### Reference depth (honest)

Dissected along hierarchy, density, surfaces, type, number, chart, navigation, and ticket (or the closest analogue):

- Polymarket: full pass. Feed card hierarchy, percent as scan number, ticket as side panel, rules as body, category strip as chrome.
- Kalshi: full pass on detail. Percent + cents side by side, payout before commit, chart as probability history, ticket as one action. Home featured chart failed to paint; home is thinner evidence than detail.
- Robinhood prediction markets: full pass as a negative. Cent prices, dark cards, team colors, chip categories. Useful for "what not to look like."
- TradingView AAPL: hierarchy and number/chart pass. Name < price < change < thin line. Ranges as words, not chip walls.
- Coinbase Bitcoin: anti-pattern pass. Black field + saturated green area chart. Do not import.

Opened and used for one or two DNA moves, not a full eight-axis write-up:

- Mercury demo: large balance figure, thin chart, quiet account rows, soft surface. Feeds Instrument's "one number" and sheet continuity. Navigation and ticket analogues are shallow.
- Koyfin product shot: table density and hairline list logic for Tape. No trade ticket.
- Linear product UI: hairline list restraint and dark-mode relative for Instrument. Marketing chrome ignored. No market number model.
- Bloomberg Europe (partial, cookie dialog): masthead + ticker + column rhythm for Issue. Not a usable ticket or chart study.
- Wise / Public / Apple Card / Monzo: oversized type, one-job phone screen, serif-or-flat field cues for Issue and Instrument. Hierarchy only; no book, no partial-fill language.
- Stripe: whitespace and anti-gradient lesson. Not a product-operate reference.

Name-checked, not dissected:

- Wealthsimple, Ramp. Atmosphere only. Do not treat them as evidence for Feed, Detail, or Trade.

Did not render (no visual claims from these):

- Hyperliquid trade, Binance BTC/USDT spot, Financial Times home.

Still missing as evidence (see Stage 5): Telegram Mini App peers on a real phone width, mobile Polymarket/Kalshi (this pass was desktop-weighted), a clean order-book ladder reference, and a fintech sheet that shows partial fill / no liquidity without sportsbook chrome.

## Stage 1. What the market products actually do

### Polymarket

Feed is a light page. A featured event can be a sports scoreboard with a chart. Below that, "All markets" is a grid of cards. Each card leads with a short question, a large percent, a small volume, and Yes/No chips. Category navigation is a long horizontal strip.

Detail puts the question and volume first, then a list of outcomes with a huge percent, volume under the date, and Buy Yes / Buy No buttons priced in cents. Rules and resolution sit in the reading column. The trade ticket is a side panel: Buy/Sell, Yes/No, an amount, preset add-ons, and one Trade button. Price is explained as cents, and the percent is the headline.

Useful structure: probability as the scan number, contract price inside the ticket, volume next to the outcome, rules as a real text block, ticket separated from the feed.

Visually weak for BetTON: sports scoreboard as the hero, pastel Yes/No chips, many category pills, social comments as a peer of the market, and a card grid where every event is the same rounded rectangle.

### Kalshi

Home is a white exchange-like page with a green wordmark. A featured market has columns for Market, Pays out, and Odds, plus a chart slot. The right rail is percent lists: trending, movers, volume. Upcoming events are a row of small picture cards.

Detail is stronger. A two-line chart, a large percent for each side, Yes/No priced in cents, and a ticket that states chance, max payout, and a single trade action. Lower sections repeat the same Yes/No row for related contracts. News and rules sit under the chart.

Useful structure: percent and cents shown together but not as the same thing, payout visible before commit, chart as history of the probability, related contracts as rows.

Visually weak for BetTON: green as the brand and the buy button, sports-like Yes/No pills, picture cards for events, and a social thread under the market. The homepage chart area also failed to paint in this session, which is a reminder not to depend on a decorative chart slot.

### Robinhood prediction markets

The public page is a dark sports board. A featured matchup is two huge cent prices (30¢ and 73¢) and two colored buttons. Below, events are dark cards: time, volume, two sides, a percent, and a thin color bar along the bottom. Categories are a chip row, including Live and 15 min.

Useful structure: contract price can be the primary number, volume is on the card, a matchup can be two sides rather than a paragraph.

Visually wrong as a model for BetTON: it reads as a sportsbook. Dark cards, team colors, and cent buttons make the product feel like a bet slip. That fights the confirmed character: market before betting, not a bookmaker.

### TradingView and Coinbase

TradingView's AAPL page is light. The company name is large, the price is larger, the change is a small green figure, and the chart is a thin line with a faint fill. Ranges are words ("1 day", "5 days"), not a wall of pills. The number is the hierarchy.

Coinbase's Bitcoin page is the opposite: a black field and a saturated green area chart. That is the crypto terminal look the brief rejects. It is evidence of what not to import, not a palette.

## Stage 2. Design DNA

### A. Borrow functionally from prediction and trading products

- Feed scans by one number. Polymarket and Kalshi use a percent. Robinhood uses cents. BetTON should pick one primary number per direction and keep the other secondary.
- Volume and liquidity stay visible. A market with no opposing orders is a different state, not an empty decoration.
- Yes and No are outcomes with a price, not a casino pair of buttons, until the user is inside the ticket.
- The ticket shows what can fill now, the average or worst price, and the payout. Quick Trade must be able to say "nothing can fill" and "only part can fill".
- Rules and resolution criteria are body text, not a tooltip.
- The chart is a history of real prices or probabilities, not a sparkline for its own sake. BetTON charts must come from real P2P fills.
- Time to close, status, and creator are metadata. They do not outrank the question and the price.

### B. Do not repeat their visual weaknesses

- Do not make the feed a sports scoreboard or a row of team-colored bet slips.
- Do not use Yes/No as the main visual identity of every card.
- Do not let a long category chip bar become the design.
- Do not put comments, holders, and social proof on the same level as price, book, and rules.
- Do not paint the chart as a neon green area on black.
- Do not use one brand green for logo, links, up-moves, and the buy button at once. Kalshi does this. The action, the outcome, and the positive change then blur together.
- Do not copy Polymarket's or Robinhood's card grid and only recolor it.

### C. Visual principles for BetTON

1. The question is the content. The price is the hierarchy. Chrome is the last thing the eye should hit.
2. One primary number per screen region. Feed: one figure per market. Detail: one figure for the selected outcome. Ticket: one figure for what will actually execute.
3. Probability, contract price, and coefficient are three different facts. A direction may emphasize one. It may not draw all three at the same size.
4. Liquidity is a sentence or a column, not a badge. "320 TON available" matters more than a pill that says Open.
5. Rows before cards. A card is allowed when the object is truly a separate thing, such as the trade sheet. A list of markets should not be a stack of identical containers.
6. Color is semantic. Up, down, selected outcome, and the commit button are the only strong colors. The page itself is paper or charcoal, not a gradient.
7. Type does the ranking. Size and weight separate question, price, and metadata. Extra badges do not.
8. Numbers are tabular. Columns of odds, volume, and book size align.
9. The chart is a line with a quiet scale. Fill, glow, and gridlines stay minimal. If there are no fills, the empty state is explicit.
10. The book is a ladder of prices and sizes. It can be short. It should not look like a second feed of cards.
11. The trade sheet is one surface. It covers the feed or sits under the question. It does not invent a new theme.
12. Motion is state change: sheet open, quote refresh, partial fill. Not looping decoration. Trust-first motion stays low.
13. Telegram is the frame. Bottom navigation, one thumb, safe areas, and a width near 390. A desktop terminal layout is a reference for hierarchy, not a layout to paste in.
14. Dark mode is the same system with inverted paper, not a neon reskin.
15. Creator identity is a name and a record, not an avatar sticker on every row.

### D. Anti-patterns

- Bookmaker odds as the dominant type, such as a giant 2.08 on every card.
- Casino or sportsbook color: team reds and greens as the page, flashing live dots, bet-slip buttons.
- Generic AI SaaS: purple gradient, three equal feature cards, glass panels, mesh background.
- Neon Web3: black canvas, glowing green chart, token badges.
- Identical rounded cards with the same radius, shadow, and chip row on every screen.
- Teal used as decoration rather than as a selected state.
- Category pills that wrap into a second navigation.
- Decorative middle-dot metadata chains on every line.
- A chart with no data that still draws a pretty curve.
- Optimistic balances or fake liquidity. The UI does not invent a fill the backend did not quote.
- Copying Linear, Mercury, or Stripe as a skin. Their restraint is the lesson. Their brand colors are not.

## Stage 3. Three directions

These apply only to Markets Feed, Market Detail, and Trade / Quick Trade. They differ in composition, type, density, and what the first number means.

### 1. Tape

Idea. The feed is a market list a normal person can scan, closer to a readable exchange than to a magazine or a bet slip. Each market is a row: question, one probability, a short liquidity line. Detail opens that row into a column: question, line chart, a short book, then the ticket.

First effect. "This is a list of prices." The eye hits the right-hand numbers before it hits any container.

Typography. One grotesque family only (not Inter-as-default branding; a sharper UI grotesque when fonts are locked later). Row anatomy on 390: question ~15-16 / 20-22 left; probability ~20-22 / 24 tabular right; liquidity and meta ~12-13 / 16 muted. Detail: question steps up one size; selected outcome percent becomes the largest figure on the page (~28-32); book and ticket figures stay at row size so they never compete with that percent. No serif anywhere.

Grid. A single column of rows separated by hairlines. No card padding around each market. Row height roughly 56-64. Detail is the same column: chart full width of the content column, book as a 4-6 row ladder under it, ticket as a sheet, not a tile around the chart.

Density. High on the feed (about six to eight markets in the first screen on 390). Medium on detail. Dial reading: variance 4, motion 2, density 7.

Surfaces. Cool or neutral off-white paper, not cream craft paper. Rows are not cards: no fill, no shadow, no radius per market. The only raised surface is the trade sheet (same paper, top rule or light elevation, not a new theme).

Probability and price. Probability (%) is the only feed number at large size. Book shows contract price and size as aligned columns. Ticket shows executable contract price, available size, average/worst, payout; coefficient only as a small secondary line if shown at all. Never three equal-size facts.

Color. Ink text on paper. Outcome labels use weight or a short underline, not mint/rose fills. One commit accent on the sheet button only. Up/down deltas are small signed numerals beside the percent, never full-row green/red washes.

Chart. Thin ink line, light horizontal guides, no area fill, no glow. Y-scale quiet. Empty history is a sentence where the line would be, not a decorative curve.

Navigation. Text tabs for New, Popular, Closing under the header. Categories open a filter sheet or a single text list, not a wrapping chip cloud. Bottom nav: icons + labels, no colored active pill that steals hierarchy from prices.

Trade ticket. Bottom sheet on the same paper. States, in order: available size now, average and worst executable, expected payout, fill fate (full / partial / cannot fill / will rest if Own Price). Amount is the primary input. Outcome is chosen on the row or detail before the sheet opens; the sheet does not restage a Yes/No sportsbook pair.

Motion. Sheet rise and quote number refresh only. No chart draw-on-load. Reduced motion: instant sheet, static numbers.

References. Koyfin tables (density), TradingView price-over-chart hierarchy, Kalshi percent rows, Polymarket rules block, Linear hairline lists. Not their marketing sites as skins.

Strengths. Matches P2P: price, size, and book stay honest. Fast to scan. Hard to mistake for a bookmaker. Fits a narrow Telegram width.

Risks. Can feel like a terminal if the question type drops below readable. Dense rows can hide "no liquidity" unless that line is written in words on the row. Dark mode must keep hairlines and muted meta; pure black + neon line would collapse into the Coinbase anti-pattern.

### 2. Issue

Idea. The feed is a front page. One market is the lead story. The question is set like a headline. The probability is the lede. Other markets are a short column under it, not a grid of equals. Detail reads down the page: headline, number, chart, criteria, then book.

First effect. "This is a question worth reading." The market is an issue, not a tile.

Typography. Two roles, not one skin: an editorial display face for the question only (a real editorial serif such as a Tiempos/Sectra-class, or a high-contrast display grotesque - pick one when locking fonts; never Fraunces/Instrument Serif as the lazy default). All prices, percents, sizes, and ticket figures stay in a tabular grotesque. Lead on 390: question ~28-34 / tight; lede percent ~40-48 tabular; contract caption ~13 under it; secondary market rows ~14 question + ~16 percent. Book and ticket never use the display face. Metadata is a caption line, not a chip.

Grid. Asymmetric on purpose. Lead occupies roughly the top half of the first viewport (question, lede number, one thin chart). Secondary markets are three or four single-line items under a rule, not equal cards. Detail is one reading measure (~320-340 content width inside 390) with intentional side inset. This is the opposite of Tape's edge-to-edge row list.

Density. Low to medium: one lead + three or four secondaries on first paint. Dial reading: variance 6, motion 3, density 3.

Surfaces. Paper field (neutral warm or cool off-white is fine; avoid beige-brass "craft premium" palette). No cards, no shadows, no glass. Sections divided by a single horizontal rule or by vertical space. Ticket is the last block in the column (same paper), not a floating elevated slip.

Probability and price. Lede is probability in display size. Contract price is a caption under the lede ("94¢"), never the same size as the percent. Coefficient stays off the feed and, if present, only inside the ticket as fine print. Book is a small two-column table after resolution criteria: skippable, findable, not re-styled as cards.

Color. Ink and paper. At most one rare live mark (a single red or green used like a newspaper bullet for "moved," not as page chrome). No pastel Yes/No fills, no team colors.

Chart. One ink line inside the reading column, print-sparkline scale enlarged. No area fill, no brand tint, no glow.

Navigation. Feed chrome is search + one sort control. No category chip bar. Categories live in a filter sheet. Bottom nav remains but visually quieter than the lead headline.

Trade ticket. Last section of the article column, not a separate theme. Copy order: how much can trade now, average/worst, what it pays, what remains unfilled or cannot fill. One commit control (text button or single solid). Outcome chosen above; no Yes/No pill pair in the ticket.

Motion. Lead can swap when sort changes (hard cut or short crossfade). No marquee, no live scoreboard pulse, no looping chart.

References. Bloomberg masthead/ticker/columns (partial view), Wise oversized type on a flat field, Public product shot with a serious headline over a sober surface, Stripe whitespace (not Stripe gradient ribbon).

Strengths. Literate, unlike a sportsbook. Resolution criteria get a real place. Strong on Market Detail reading.

Risks. Fewer markets on first paint: discovery and top creators need a second pattern or they return as cards. Display question type without strict tabular numbers slides into magazine. Book and partial fill can read as footnotes if type scale is wrong. Least like a trading terminal: intentional, and the failure mode if traders cannot find the book.

### 3. Instrument

Idea. Each screen is one financial object, the way Mercury treats a balance and Apple Card treats one action. The feed is a short stack of markets, each dominated by a probability the size of a balance. Detail is that object opened: one number, one line, one book, one action. The ticket is the same object with an amount field, not a new theme.

First effect. "This number is the market." Calm, expensive, and specific.

Typography. One grotesque family with extreme size contrast (not Inter + teal as the identity). Per market on 390: question ~13-14 / 18 above; probability ~44-56 tabular as the hero; meta ~12 single line under. Detail keeps the same hero number; book sizes and ticket economics sit two steps smaller (~14-16) in a vertical stack under the amount. Question is never a poster; the number is.

Grid. Left-aligned or softly centered object, not a bento, not three equal cards. Feed: three to five markets stacked with clear air between objects (~16-24 gap). Each object is one figure plus one short question, not a chip kit. Detail: same object opened vertically - number, chart, short book, action.

Density. Medium, with air around the figure (about three to five markets in the first screen). Dial reading: variance 5, motion 4, density 4.

Surfaces. Neutral warm-gray or cool-gray canvas (not purple mesh, not black neon). Optional: one quiet white/off-white plate per market with small radius (~8-12 max) and near-zero shadow (Mercury-soft, not sportsbook tile). If a plate adds nothing, drop it and use spacing only. Trade sheet reuses the same plate language; it does not invent glass or a second radius system.

Probability and price. Giant feed/detail number is probability. Ticket stack under amount: contract price, available size, average/worst, payout, fill fate. Coefficient off the feed. Do not promote cents to hero size on the feed (that is Robinhood's sportsboard move).

Color. Neutral canvas. One accent locked to the commit control only. Outcome selection = weight or underline, never mint/rose fills. Chart stroke = text ink. No glow.

Chart. Thin line with optional very light same-ink fill (Mercury balance chart), never saturated green area on black.

Navigation. Short header + bottom nav. Sort = three-word segmented control. Filters = sheet. No category chip parade.

Trade ticket. Same object expands downward or as a sheet that keeps the hero number visible. Contents: amount, small presets, executable size, payout, one verb. Partial fill and no liquidity are plain sentences in that stack, not toast decoration. No second palette.

Motion. Short ease on sheet open (~200-280ms). Number updates without bounce or count-up theatrics. Reduced motion: hard state change, no ease.

References. Mercury demo (balance, thin chart, quiet list), Linear near-black product UI as dark-mode relative only, Monzo one-job phone, Apple Card single action + huge type without gradient, Public product shot with a table under one price.

Strengths. Premium and calm on a phone. Trade can stay continuous with the feed object. Fits 390 without looking cramped when air is intentional.

Risks. Closest of the three to generic fintech if fonts default to Inter, accent to teal, and radius creeps up. Air can hide the book and partial-fill truth if the stack under the number is deferred. A stack of big numbers becomes another card list the moment each object grows a chip row. Dark mode needs its own pass so it does not become Robinhood's sports board.

## Stage 4. Comparison, not a ranking

No direction is selected here. The table is a difference check, not a scoreboard.

| | Tape | Issue | Instrument |
|---|---|---|---|
| First read | A list of prices | A question worth reading | One number, held quietly |
| Feed composition | Hairline rows, many markets | One lead plus a short column | Short stack, one figure each |
| Type | One grotesque, tabular prices | Editorial question only, sans figures | One family, extreme size contrast |
| Density | High (6-8 / first screen) | Low (1 lead + 3-4) | Medium (3-5 with air) |
| Surfaces | Almost none; sheet only | Paper and rules; no plates | Optional quiet plate per market |
| Primary number | Probability on the row | Probability as the lede | Probability as a balance |
| Chart | Thin line, full width, no fill | Ink line in the column | Thin line, light same-ink fill |
| Ticket | Bottom sheet, same ink | Last block of the column | Same object, amount added |
| Motion | Almost none | Almost none | Short ease on the sheet |
| Best pressure test | Book, partial fill, no liquidity | Criteria, creator, long question | One-thumb trade on 390 |
| Main risk | Terminal coldness | Hiding the book | Sliding back into generic fintech cards |

What would have to stay true in all three, because it is product, not taste:

- Backend quotes the fill. The screen does not compute matching.
- No liquidity, partial fill, and resting size are visible states.
- Unlisted markets do not appear as public feed rows.
- Wallet actions that are not built are not drawn as success.
- A screen is not done until it is checked in the real React Telegram surface, one screen at a time, against a frozen fixture.

## Stage 5. Remaining reference gaps

These gaps do not invalidate the three systems above. They limit how far DNA claims can be pushed before a human picks a direction and tests it in product.

1. Mobile prediction-market screens at ~390. This pass leaned desktop for Polymarket, Kalshi, and Robinhood. Telegram-width hierarchy may differ.
2. Telegram Mini App peers (other serious Mini Apps on a real device): chrome density, bottom nav, sheet behavior inside Telegram's frame.
3. A clean order-book ladder reference that is not a full pro terminal and not a card list (short bid/ask for casual mobile users).
4. Trade-sheet examples that show partial fill, no liquidity, and resting limit without sportsbook Yes/No chrome.
5. Wealthsimple and Ramp: opened, not dissected; do not cite them as structural evidence.
6. Hyperliquid, Binance spot, FT: did not render; no claims from them.
7. Live creator / reputation surfaces for "top creators" under Issue's sparse feed (product need, visual pattern still thin).

Next step, when a direction is chosen, is to test it on Feed, Market Detail, and Trade inside the product. Not to expand a full design system first, and not to treat the current React or the first Figma frames as the answer.

## Stage 6. Art direction sprint in Figma

**Status: REJECTED as visual direction by the human on 2026-09-22.** Retain these frames only as research history / anti-reference. Do not continue, blend, or implement Tape / Issue / Instrument.

Exploration only. No direction was selected. Production React was not changed.

File: [BetTON — Art Direction Sprint](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw). Page `BetTON — Art Direction Sprint` (`1:2`). Nine frames, width 390, one shared demo fixture (Zenit, 64%, volume 1 240 TON, available 85 TON, @marina_k, close 12 May 2027). Numbers are labeled as a demo fixture, not a backend quote.

| System | Section | Feed | Market Detail | Trade |
|---|---|---|---|---|
| Tape | [01 Tape](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=2-2) `2:2` | [Feed](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=2-3) `2:3` | [Detail](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=2-50) `2:50` | [Trade](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=2-101) `2:101` |
| Issue | [02 Issue](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=3-2) `3:2` | [Feed](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=3-3) `3:3` | [Detail](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=3-35) `3:35` | [Trade](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=3-81) `3:81` |
| Instrument | [03 Instrument](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=4-2) `4:2` | [Feed](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=4-3) `4:3` | [Detail](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=4-20) `4:20` | [Trade](https://www.figma.com/design/ZvAdNtvkinjSyfEho5YTnw?node-id=4-67) `4:67` |

What actually landed, after art-director review and a product check:

- **Tape.** Cool paper, IBM Plex Sans plus IBM Plex Mono, text tabs, hairline rows, probability on the right of the row. Detail stays one column: stepped ink line, ladder book (Да then Нет, four levels, "Ещё уровни"), flat blue IOC commit. Feed repeats two extra rows so the list is denser than the other two.
- **Issue.** Warm paper, Newsreader question, Libre Franklin figures, search and sort as text. The lead occupies the first view; three markets sit under a rule. Detail puts criteria before a two-column book. Trade is the last block of the column, with a text commit in `#8B1E1E`, not a filled bar.
- **Instrument.** Warm-gray canvas, three off-white plates (radius about 10), question small above a balance-sized Roboto Mono percent. Trade keeps that percent visible above the amount. Commit is `#0F6E56` on the same radius. Metro is not on the first feed paint.

Chart note. Thin SVG strokes collapsed to an unreadable hairline. The frames now use an 8px stepped ink line (58% to 64%) plus the numeric caption. Instrument adds a light same-ink wash behind that line and does not put the chart on a second plate.

Product check against the 2026-09-22 exploration contract: compatible. No CONFIRMED conflict. Partial IOC, available size, average/worst, payout on the fillable part, and the 1% winner-net-profit line are on the trade frames. Wallet success and Top Creators are absent. Own Price is not a separate frame; the ticket states that the unfilled IOC remainder does not rest.

### What this failed experiment taught us

- Product correctness did not guarantee visual quality.
- Textual design DNA plus broad brand references was insufficient; too many mobile/product-specific reference gaps remained.
- Building nine Figma frames before validating one strong live Feed surface spread craft too thin.
- A subagent self-review is not a substitute for Impeccable's real design modes plus rendered screenshot inspection.
- Next exploration follows `docs/design/DESIGN_PIPELINE.md` and starts in an isolated live Feed prototype, not another nine-frame Figma sprint.
