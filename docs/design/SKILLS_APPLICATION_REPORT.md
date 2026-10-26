# Design skills: installation, actual use and limits

Checkpoint: 26 October 2026. Scope is PR #25's isolated UX/UI experiment. This report
records the tools stage; it does **not** certify the redesigned application or its screenshots.

## Discovery is different from a file on disk

The current root session catalog lists `impeccable`, `design-taste-frontend`,
`emil-design-eng` and `betton-ui-quality`. It does **not** list `prototype`,
`apple-design` or `find-skills`, even though their project files now exist.
There is no exposed dynamic skill-invocation/discovery API or `/skills` tool in this
session. Typing `$prototype` in PowerShell would not invoke a Codex skill.

Accordingly, Apple Design and Find Skills were applied by reading their full
installed instructions and following the workflow directly. This is a **manual
workflow fallback**, not a successful catalog invocation. The root will apply the
same fallback to the complete Prototype instructions and its exact picker.
`prototype/agents/openai.yaml` retains `allow_implicit_invocation: false`; it has
not been weakened to manufacture implicit activation. The installer's “next turn”
discovery expectation remains unverified until a later session catalog actually lists
the skills. `check_dev.py --skills` validates files/hashes/references, not discovery.

## Reviewed and pinned installations

All three were installed using the bundled system skill-installer's
`install-skill-from-github.py --repo … --ref <full SHA> --path … --dest .agents/skills`.
No upstream shell installer, global npm install or package lifecycle script ran.

| Skill | Upstream pin and path | Review / runtime | Decision |
| --- | --- | --- | --- |
| Apple Design | [Emil source](https://github.com/emilkowalski/skills/tree/2d228630ba1446365f614a108cb8252f1feda202/skills/apple-design), `2d228630ba1446365f614a108cb8252f1feda202` | MIT; prose-only SKILL.md, no runtime dependency | Keep in `.agents/skills/apple-design` |
| Find Skills | [Vercel source](https://github.com/vercel-labs/skills/tree/a80e4c9d12d607631249d4d7d059f835d4b2f13a/skills/find-skills), `a80e4c9d12d607631249d4d7d059f835d4b2f13a` | MIT; prose-only skill; actual search CLI `skills@1.7.4`, Node ≥22.20, isolated ignored prefix | Keep in `.agents/skills/find-skills` |
| UI UX Pro Max | [source](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/d14efff8ed1faa4187f004f79926f428c8074ec7/.claude/skills/ui-ux-pro-max), `d14efff8ed1faa4187f004f79926f428c8074ec7` | MIT; reviewed `search.py`, `core.py`, `design_system.py`, `reasoning_contract.py`; Python stdlib, local CSV reads; optional persistence writes only when requested | Keep as targeted QA lookup, not visual authority |

Licenses accompany each installed directory. `skills-lock.json` records normalized
entry hashes; `scripts/setup-reinvention-skills.ps1` reinstalls only missing pinned
directories and verifies the project gate. Existing files are not overwritten.
The Pro Max upstream entry documents a Claude plugin variable; for Codex use the
actual project path `.agents/skills/ui-ux-pro-max/scripts/search.py`, not that variable.
The only local upstream-code adaptation removes whitespace from otherwise blank
lines in `design_system.py`, so the existing staged whitespace gate passes; the
reinstallation script applies the same normalization. No guidance or search logic changed.

## Find Skills: nine real searches

Read the [leaderboard](https://skills.sh/) first, then ran the reviewed, pinned CLI
for all nine requested queries, with `DISABLE_TELEMETRY=1` and `DO_NOT_TRACK=1`.
Installation used `npm ci --ignore-scripts --no-audit --no-fund` in
`.ux-preview/skill-trial`, with no changes to frontend dependencies.

The CLI printed results, but on this Windows Node runtime several processes failed
on exit with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`;
the repeated `visual testing` check exited `-1073740791`. This is **not** a clean
CLI compatibility pass. Confirmed all nine searches through the same reviewed
read-only official endpoint, `https://skills.sh/api/search?q=<query>&limit=20`.
Only public generic keywords were sent. The [captured top results](ux-reinvention/skill-trial/find-results.json)
record returned counts, sources, install counts and exact result IDs.

| Query | Concrete result | What happened |
| --- | --- | --- |
| mobile ux | `nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max` | Required tool installed and trialled |
| navigation design | `anthropics/skills@frontend-design` | No additional install: Impeccable already owns app IA |
| accessible forms | `jakubkrehel/skills@better-accessibility` | Candidate only; no unreviewed install; targeted Pro Max validation/focus guidance used |
| financial application ui | `igniteui/igniteui-blazor@igniteui-blazor-components`, 9 installs | Wrong stack / insufficient demonstrated benefit; rejected |
| interaction design | `wshobson/agents@interaction-design` | Candidate only; existing Apple/Emil cover the concrete interaction task |
| motion design | `heygen-com/hyperframes@hyperframes-animation` | Video-oriented candidate; no benefit demonstrated for trade controls |
| product design research | `firecrawl/firecrawl-workflows@firecrawl-workflows` | No crawler install needed; existing browser/Mobbin research tools available |
| visual testing | `pbakaus/impeccable@critique` | Existing canonical Impeccable retained; no duplicate installation |
| react ui | `vercel-labs/agent-skills@vercel-react-view-transitions` | No install: motion must not delay repeated navigation; existing stack retained |

Install counts are discovery signals, not a security or quality certification.
No extra candidate was recommended as verified or installed solely from search rank.

## Concrete Pro Max feed trial

Executed on the **BetTON mobile markets feed**, not an invented unrelated product:

```powershell
python .agents/skills/ui-ux-pro-max/scripts/search.py "prediction market mobile trust" --design-system --density 7 --variance 6 --motion 2 -p "BetTON Feed Trial" -f markdown
python .agents/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux -n 2
python .agents/skills/ui-ux-pro-max/scripts/search.py "error summary validation" --domain ux -n 2
python .agents/skills/ui-ux-pro-max/scripts/search.py "conditional modal focus" --stack react -n 2
```

Saved the [unmodified generated recommendation](ux-reinvention/skill-trial/pro-max-generated-system.md)
and targeted [focus](ux-reinvention/skill-trial/pro-max-focus.md),
[form error](ux-reinvention/skill-trial/pro-max-errors.md) and
[React](ux-reinvention/skill-trial/pro-max-react.md) results.

| Pro Max recommendation actually returned | Impeccable Operate / Taste comparison | Concrete disposition |
| --- | --- | --- |
| “Trust & Authority + Conversion”; hero → proof logos → solution → CTA; “Contact Sales / Get Quote” | A feed is an Operate surface, where a person scans questions and opposing liquidity. A sales hero introduces steps before the actual task. | Reject generated IA; do not add sales, security badges or logos to BetTON |
| Navy/slate/gold; paired Lexend / Source Sans 3 | Taste rejects automatic slate SaaS defaults; Operate allows one tuned UI family and task-driven density | Do not adopt this palette/type as the new direction merely because a generator returned it |
| GSAP ScrollTrigger reveal, 300–400ms | Operate rejects orchestrated page-load sequences; Emil avoids animation on frequently repeated navigation | No GSAP dependency added; visible-by-default market content |
| Focus Not Obscured: accurately separates AA minimum and AAA enhanced | More precise than a generic “keyboard accessible” checklist | Use sticky-bar scroll clearance and focus visibility in actual app QA |
| Focusable error summary, linked invalid fields, inline errors retained | Adds concrete form behavior to Impeccable's state coverage | Use for create/trade error handling; no toast-only validation |
| React focus trap and return on close | Agrees with Apple wayfinding / reversibility | Apply when a trade confirmation genuinely requires a dialog |

The output trial is complete; an attempted separate HTML visual comparison was
**not written** because automatic approval review could not run after the account
usage limit was exhausted. No browser comparison screenshot is claimed for this
tools stage. The primary app's live variants and visual review are the root's next
stage; a generator result alone is not visual evidence or a finished feed.

## Application handoff: do not confuse intent with a verified UI change

| Skill | Actual use at this checkpoint | Concrete requirement handed to app implementation | UI verification status |
| --- | --- | --- | --- |
| Find Skills | Full instructions read; nine CLI searches + official endpoint confirmation | Avoid redundant installs; retain exact evidence and CLI limitation | Search exercised; catalog discovery unverified |
| Apple Design | Full instructions read, applied to mobile trade interaction contract | Immediate press feedback; input remains interruptible; same-path close; keyboard alternative to gestures; reduced-motion static/crossfade; no decorative glass | Contract supplied; app component/screenshots still pending |
| UI UX Pro Max | Four real local searches, output reviewed against actual feed task | Focus clearance, linked validation summary and modal focus return; reject marketing IA | Local runtime tested; app application pending |
| Impeccable | Canonical Operate playbook used for the concrete feed comparison; root ran context once | Questions/liquidity/actions first; one coherent component/state system | Root's screenshot critique pending |
| design-taste-frontend | Read and applied as anti-default check, not multi-step app architect | Reject generated slate/navy hero template, avoid three color-only alternatives | Root's three variant comparison pending |
| emil-design-eng | Read frequency/motion rules; applied to generator's scroll-reveal proposal | No reveal delays for market list; named transitions ≤250ms; pressed feedback | Root's actual interaction check pending |
| prototype | Installed file and explicit-only invocation policy preserved | Root must read full workflow + PICKER.md and build three full-size core journeys | Neither dynamic invocation nor completed new variants claimed here |
| betton-ui-quality | Existing repo gate and required viewport/state matrix retained | 320/360/390/430, themes/locales, focus, safe areas, Back, errors and console | Full app matrix pending |

Update this table with component paths, screenshots and test evidence **after**
those stages actually occur. No financial, auth, backend or live SIM file changed.

## Core-journey application: executed, not installation intent

- **Prototype manual workflow:** full SKILL.md and PICKER.md were read; three
  separate React surfaces in `frontend/prototypes/core/{Exchange,Folio,Pocket}.tsx`
  implement feed→detail→trade→review→result→portfolio. Exact shared picker CSS,
  keyboard exclusions, URL persistence and remount are exercised by Chromium.
  This is manual execution of its explicitly requested workflow, not a claim that
  `$prototype` dynamically ran. The implicit-invocation policy remains false.
- **Impeccable:** root ran `impeccable.cmd context --target
  docs/design/UX_REINVENTION_BRIEF.md` once and direction seed760c3b8e. Operate,
  shape/new-work/craft-floor and critique playbooks informed the work. Independent
  Assessment A completed before B entered synthesis. B actually ran
  `detect --json frontend/prototypes/core`: exit0, `[]`. The clean detector did
  not prevent receipt, clipping and focus defects; browser review found them.
  See UX_CORE_CRITIQUE_A.md and UX_CORE_CRITIQUE_B.md for original and scoped verdicts.
- **Apple Design:** Pocket changed from a replacement page to a contextual dialog
  over its market, with an always-visible action, explicit close, focus trap,
  Escape and return to the launch control. Input is not locked during entrance.
 44px controls, immediate press response and static reduced motion are implemented.
  No gesture tracking, spring physics or native Telegram validation is claimed.
- **Emil design engineering:** no repeated list reveal; one210ms ease-out panel
  entrance, transform/opacity only, immediate press feedback. Evidence initially
  caught a transitional frame; settled screenshots now disable capture animations.
- **Taste:** three different feed structures and trading rituals replace the old
  blue odds rows. Folio uses reading-led amount-first composition, Exchange keeps
  aligned quote context, Pocket uses a scoped dialog. The Pro Max marketing hero,
  logo carousel and scroll-reveal recommendation were concretely rejected.
- **Pro Max targeted QA:** its focus-not-obscured guidance contributed a measured
  action hit-target check, and return-focus guidance became a browser assertion.
  Error text contrast was corrected in dark mode; B measured7.87:1.
- **React quality review:** existing Vite/React/CSS Modules remain. UI components
  are top-level, event listeners clean up, receipts are immutable, and no prototype
  imports enter the real application's money controllers. No new UI dependency.

Evidence:18 settled390px synthetic PNGs under `evidence/directions`, two preserved
pre-fix problem images,30 Chromium tests across320/360/390/430 and both themes,
plus175 existing frontend tests and successful builds. These prove the prototype
scope only; integrated API, EN/ZH and native host checks remain a separate stage.

**Discovery update:** the fresh Assessment A child turn reports that its actual
session catalog now includes Apple Design, Find Skills and UI UX Pro Max. This
confirms discovery there after installation. Root's earlier catalog did not list
them; neither this observation nor reading a file is reported as a `$skill` call.
Prototype remains absent from that child's catalog and uses the documented manual
fallback. No session restart or owner action blocks the implementation stage.

Official documentation checked after the practical trial:
[Build skills](https://learn.chatgpt.com/docs/build-skills) confirms repository
`.agents/skills` discovery, progressive metadata loading, automatic change detection,
and explicit invocation for `allow_implicit_invocation:false`. It also notes that
large skill sets can omit entries from the initial context list. Therefore an
absent catalog entry alone is not diagnosed as a broken installation. This session
exposes no slash-command execution API; no fictitious `/skills` command was run.
The successful file/hash gate, a fresh child catalog and actual executed workflow
are recorded separately. A restart is a fallback for a missing update, not a step
we claim to have performed or a requirement that blocks the app work.

## Executed checks

- `check_dev.py --skills --tests tests/test_dev_checks.py`: 10 passed; skill files,
  references and reviewed entry hashes passed.
- Pro Max upstream `TestTokenizer`, `TestBm25CoreBehavior`, `TestSearchDomains`:
  20 tests and 68 subtests passed on Python 3.14.5; no application database involved.
- `setup-reinvention-skills.ps1` without `-Install`: existing pinned files verified,
  no download or overwrite performed.
- Final staged whitespace/artifact/secret-pattern and skill gate rerun before commit.
  Frontend/browser tests are not claimed for this tools-only change.
