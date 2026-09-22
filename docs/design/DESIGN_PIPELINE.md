# BetTON design exploration pipeline

This process exists because the previous path — broad research → text concepts → nine Figma frames — produced coherent but visually weak results.

The next design pass must produce a **live, full-size, inspectable UI**, not another prose concept deck.

## 0. Product contract

Before any visual work, `betton-product-guardian` extracts only the constraints for the current surface from `docs/BETTON_BIBLE.md`.

For Feed this includes, at minimum:
- question;
- current design-exploration probability representation;
- liquidity / availability truth;
- close time;
- category when useful;
- compact creator identity;
- no invented data;
- no public rendering of unlisted markets.

No product mechanics may be invented to make the layout easier.

## 1. Reference evidence

The Art Director may use `design-taste-frontend` for design read and anti-slop guidance, but BetTON is multi-step product UI, so Taste is not the primary product-UI architect.

Build a small reference board before variants:
- 6–10 **specific screenshots or exact screens**, not a list of brand names;
- prioritize real mobile product UI around 390px;
- include prediction/trading IA plus unrelated premium product craft;
- annotate each reference with the exact transferable move: hierarchy, density, typography, surface, chart, nav, interaction, etc.;
- mark anti-references explicitly;
- if a needed reference category is still missing, search again instead of letting the model fill it with a default.

A reference may inspire a move. It must not be copied as a skin.

## 2. Impeccable setup

BetTON product screens use Impeccable mode **Operate**.

At the beginning of a design session:
1. run the installed Impeccable `context` command once from the repo root;
2. use `PRODUCT.md`, `DESIGN.md`, Bible and the current surface brief as context;
3. for a replacement visual world, load the Impeccable new-work playbook;
4. immediately before UI edits, load its craft-floor guidance.

Do not replace these with a generic “self-review”.

Use focused Impeccable modes when needed:
- `shape` for hierarchy/interaction planning;
- `typeset` for type hierarchy;
- `layout` for rhythm and composition;
- `bolder` when the result is safe/bland;
- `delight` for memorable but purposeful details;
- `critique` for design review;
- `polish` only near the end.

## 3. Divergence in live code

Use Emil Kowalski's `prototype` skill.

Rules:
- **one surface per run**;
- start with Markets Feed at 390px;
- default to 3 genuinely different variants;
- each variant has a named axis (layout, density, personality, interaction model, etc.);
- all variants are full-size and interactive;
- realistic BetTON fixture data only;
- exploration lives in an isolated prototype route/harness;
- production UI is not modified;
- use the official picker behavior;
- do not judge variants as side-by-side miniatures.

The user should be able to switch variants in the running app and feel them at real scale.

## 4. Visual verification

The agent must actually run the prototype.

For every variant:
- render at the target viewport;
- inspect a screenshot;
- verify text wrapping, hierarchy, spacing and interaction;
- verify console is clean;
- verify the design does not collapse into generic cards/pills/default fintech.

Then run a **bounded** Impeccable pass:
1. one screenshot-based critique;
2. one batched correction pass;
3. at most one confirm screenshot pass.

Do not spend unlimited tokens polishing the same weak concept. If the concept is fundamentally weak, replace it.

## 5. Interaction craft

Use `emil-design-eng` where interaction matters:
- press feedback;
- sheets/drawers;
- easing and duration;
- transform origin;
- interruptibility;
- perceived responsiveness;
- reduced-motion behavior.

Do not add motion simply to make the prototype look expensive.

## 6. Human checkpoint

Stop when the user can open one prototype URL and switch among the three complete Feed directions.

Present:
- variant name;
- axis;
- what it optimizes;
- honest cost/tradeoff.

Do not pick the winner unless the user explicitly asks for a recommendation.

## 7. After selection

Only after the user selects a direction:

1. freeze that Feed direction;
2. create the exact Figma source-of-truth for the chosen state;
3. map it to production components;
4. implement one production screen/state;
5. run exact screenshot comparison;
6. only then derive Market Detail and Trade from the approved visual system.

Do not expand an unapproved style across the app.

## Human checkpoints

Human input is required for:
- selecting/rejecting the visual direction;
- material product-mechanic changes;
- production deployment/DB actions;
- secrets/logins/permissions;
- final real-device acceptance.

Everything else should be handled autonomously by the design/engineering agents.
