# NEXT DESIGN TASK — rebuild BetTON Feed exploration correctly

This is the next autonomous design mission. Do not start by editing production screens.

## Goal

Produce one live 390px Markets Feed prototype with 3 genuinely different, high-craft directions that the human can switch between at full size.

The human rejected the previous Tape / Issue / Instrument Figma exploration. Do not continue or remix it.

## Phase 0 — sync and install the missing design skills

1. Confirm branch: `feature/react-full-preview`.
2. Pull latest.
3. Confirm these existing skills:
   - `.agents/skills/design-taste-frontend/`
   - `.cursor/skills/impeccable/`
4. Install the official Emil Kowalski skills if missing:

```powershell
npx skills@latest add emilkowalski/skills --skill "emil-design-eng" --yes
npx skills@latest add emilkowalski/skills --skill "prototype" --yes
```

Do not install unrelated skill packs.

After install, verify:
- `.agents/skills/emil-design-eng/SKILL.md`
- `.agents/skills/prototype/SKILL.md`
- `.agents/skills/prototype/PICKER.md`

If the installer chooses a different project-local path, report it and use that path; do not duplicate the same skill manually.

## Phase 1 — read the actual process

Read fully:
- `AGENTS.md`
- `PRODUCT.md`
- `DESIGN.md`
- `docs/BETTON_BIBLE.md`
- `docs/HANDOFF.md`
- `docs/design/DESIGN_PIPELINE.md`
- `docs/design/ART_DIRECTION_RESEARCH.md`
- Taste SKILL.md
- Impeccable SKILL.md
- Emil `emil-design-eng` SKILL.md
- Emil `prototype` SKILL.md + PICKER.md

Run Impeccable context once from the repo root using the installed Windows launcher.

Do not run `/impeccable init`. PRODUCT.md/DESIGN.md are already intentional adapter files.

## Phase 2 — Product Guardian contract

Delegate only the Feed constraints to `betton-product-guardian`.

The contract must say what is real product truth and what remains EXPERIMENT/OPEN.

Do not redesign mechanics.

## Phase 3 — reference board with actual visual evidence

Delegate to `betton-art-director`, but require actual visual evidence rather than brand-name prose.

Collect 6–10 specific references/screens/screenshots, prioritizing:
- mobile prediction/trading UI around 390px;
- premium mobile financial/product UI;
- compact lists / market rows;
- navigation/filter patterns;
- restrained but distinctive typography and surface treatment.

For each reference record:
- source URL/product;
- what exact screen was inspected;
- what specific design move is transferable;
- what must NOT be copied.

If a category is missing, search again instead of filling the gap with a generic default.

Save the board under `docs/design/reference-board/` or a single `docs/design/REFERENCE_BOARD.md` with image/source references that can be reopened.

Do not use the rejected Figma frames as positive references.

## Phase 4 — isolated live Feed prototype

Explicitly invoke Emil's `prototype` skill for **one thing only: Markets Feed at 390px**.

Build 3 genuinely different full-size variants in an isolated prototype route/harness. Use the official picker behavior from PICKER.md.

Requirements:
- realistic BetTON fixture data;
- same fixture across variants where comparison benefits;
- real interactions for tabs/filter/search/market selection where shown;
- no dead decorative controls;
- do not touch production Feed implementation;
- do not build Detail/Trade yet;
- no Figma in this phase;
- not side-by-side thumbnails.

Each variant needs a named axis that is more meaningful than color:
- layout/composition;
- density;
- information hierarchy;
- interaction model;
- typography/surface language.

## Phase 5 — rendered design loop

Run the prototype in browser.

For each variant:
1. capture a 390px screenshot;
2. inspect it visually;
3. run Impeccable critique on the rendered result;
4. if safe/bland, use the appropriate Impeccable mode such as `bolder`, `typeset`, `layout` or `delight`;
5. make one batched correction pass;
6. capture at most one confirm screenshot.

Use `emil-design-eng` for interaction/motion craft only where it improves a real interaction.

Do not endlessly polish a weak direction; replace it if the concept itself is weak.

## Phase 6 — verification

Before stopping:
- all 3 variants render;
- picker switches them full-size;
- console clean;
- 390px screenshots exist;
- no production React screen changed;
- no backend/money/auth files changed;
- no deploy;
- no merge;
- previous rejected Figma is untouched.

## HUMAN CHECKPOINT

Stop only when the human can actually open the prototype and switch among all three variants.

Return:
- local/prototype URL and how to open it;
- three screenshots or their exact paths;
- variant names + axis;
- one honest tradeoff each;
- exact files changed;
- git status.

Do not pick the winner for the human.
Do not move to Figma, Detail, Trade or production implementation before selection.
