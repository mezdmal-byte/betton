# BetTON UX/UI reinvention — 26 October 2026

## New direct owner decision

The attached UX/UI REINVENTION assignment supersedes older Rail/current-token/Figma
appearance constraints for this experiment. It authorizes an autonomous recommendation
and implementation in this isolated branch, without waiting for a human choice.
It does not authorize production promotion, deployment, merge or economic changes.

## Preserved contracts

- Existing backend is the authority for money, matching, quotes, ledger/settlement and access.
- P2P order book, Quick Trade IOC, Own Price limit, partial execution and remainder cancellation.
- Integer nanoTON, 1% winner net-profit fee, existing75/25 distribution; separate guarantor reward.
- Telegram HMAC/TTL, stable-ID permissions, unlisted share tokens, moderation and explicit confirmations.
- No unsupported wallet, payout or successful-order claims; only server-confirmed results.
- Real API for the integrated experiment; fixture-only alternatives explicitly labelled synthetic.
- Markets, portfolio, create, notifications and profile remain reachable despite a new navigation model.

## Visual decisions no longer binding

Rail, prior onboarding variants, old palette/type/radii/card system, historical Figma frames
and the instruction to stop at a human selection are history for this specific experiment.
They remain useful baseline evidence, not the artistic foundation. No hybrid of all directions.

## UX/UI goals

Improve the complete feed → event → quote → trade → confirmed result → portfolio journey.
Make liquidity, partial execution, reservation and error/recovery comprehensible on mobile.
Create three structurally distinct directions before choosing one; extend the recommendation
through creation, guarantors, notifications, profile, history and honest system states.
Inspect real screenshots, use accessible touch targets/contrast/safe areas and reduced motion.

## Autonomous experimental decision

Product Guardian fixes constraints; reference research supplies concrete screen evidence;
Art Director builds three full core journeys. Independent UX and visual reviews evaluate
clarity, speed, safety, mobile usability, originality and ability to scale. Root chooses
one experimental recommendation, records the reasons and proceeds with integrated React.
The owner retains final approval for any production visual direction.

## Isolation and remote review

Base: verified PR24 HEAD39074415f80aed64bd4880d183a79e4b2d620bb6.
Branch: codex/ux-ui-reinvention-20261026. Existing live SIM/prod/Render/webhook untouched.
Use a fresh marked local database and separate ports; no public publication/tunnel.
Commit/push each checked stage. Only synthetic, secret-free screenshots go in
docs/design/ux-reinvention/evidence. Real external references require accurate attribution;
unavailable sources are recorded, not invented. Progress and exact resume points stay
in UX_REINVENTION_PROGRESS.md.
