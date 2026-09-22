# BetTON product context adapter

This file exists so design skills such as Impeccable can load durable product context without creating a second source of truth.

**Authoritative product source:** `docs/BETTON_BIBLE.md`  
**Authoritative technical source:** `docs/HANDOFF.md`

If anything here conflicts with the Bible, the Bible wins.

BetTON is a Telegram-native P2P prediction market using TON-denominated balances. The target model is a funded order book, not a bookmaker and not platform-provided liquidity. Quick Trade is IOC against currently available opposing liquidity. Own Price is a resting limit order. Partial fills are normal. Backend remains the source of truth for money, quotes, matching, settlement, fees, auth and unlisted access.

The visual product should feel like a serious, understandable market for ordinary mobile users: trustworthy, fast to scan, distinctive, and clearly not a casino/sportsbook or generic crypto dashboard.

Current design work is exploration. No visual direction is approved yet. Read `docs/design/DESIGN_PIPELINE.md` before starting new design work.
