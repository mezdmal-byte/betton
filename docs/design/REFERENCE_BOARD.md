# Feed reference board

Visual evidence for the live Feed prototype. The rejected Tape / Issue / Instrument Figma file is not a positive reference.

Viewport check: the browser content width was 390px (`window.innerWidth`). Captures below are first-screen evidence from this pass, not a brand-name list.

## Inspected

### Polymarket home

- Source: https://polymarket.com/
- Screen: mobile home, first viewport, 22 Sep 2026.
- Image: `docs/design/reference-board/polymarket-home-390.png`
- Transferable: a real search field; probability sits next to the outcome; volume is a short line under the question; bottom navigation stays out of the market type.
- Do not copy: rounded market cards, green/red Yes/No pills, wrapping topic chips, promo banner, sign-up pill. That is the sportsbook-adjacent chrome this product refuses.

### Linear marketing page

- Source: https://linear.app/
- Screen: first mobile viewport and the embedded issue list, 22 Sep 2026.
- What was visible: a dark marketing hero whose headline is cropped at 390, and a small product mock of an issue list (title, then a dense activity stack). The list itself is text rows, not equal cards.
- Transferable: a row can be a title plus one meta line; selection does not need a colored pill.
- Do not copy: near-black SaaS chrome, the marketing crop, or a sidebar costume. A 390 feed has to be composed for 390, not shrunk from a desktop page.

## Did not render

- Kalshi home (https://kalshi.com/) stopped on a Vercel security checkpoint. No visual claims from it.
- A further premium-finance page was not captured in this pass after the browser stopped on an extra destination. The two captures above are the evidence actually on disk.

## Moves taken into the prototype

These are not skins of the references, and they are not the rejected Figma systems.

- Rail: category is a working vertical index. The feed shows one category at a time, plus search.
- Clock: close time is the left spine and the grouping. Probability is secondary text.
- Rule: the question is the type; probability is the length of a measured rule, with the percent beside it.
