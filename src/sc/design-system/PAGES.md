# Which design system does this page use?

**Read this before styling anything in `src/app` or `src/components`.**

Two token systems coexist in this repo. Picking the wrong one is why handed-over
features stop matching the prototypes. This file is the authority on which is which.

---

## The rule, in one line

> **New surfaces use the Design System. Legacy surfaces stay legacy until they are
> deliberately redesigned — do not half-migrate one while working on something else.**

A page is **either** DS **or** legacy. Never both. Mixing them inside one screen is
the one outcome worse than leaving a page legacy, because the seam is visible to the
member and nobody knows which half is intentional.

---

## The two systems

| | **Design System v4.1** | **Legacy portal** |
|---|---|---|
| Defined in | `src/design-system/tokens.css` | `src/app/globals.css` |
| Palette | Warm neutrals · Federal Blue · Brand Red · AI Amber | Slate · Emerald · Navy |
| Sample tokens | `--n-1` `--blue-7` `--brand-7` `--ai-7` `--s-4` `--r-md` `--sh-rest` | `--bg-base` `--green` `--gold` `--text-primary` `--radius-lg` |
| Type | Inter · Instrument Serif · JetBrains Mono (`/ds-fonts`) | Inter, Tailwind defaults |
| Status | **Target for all new work** | Frozen — change only in a deliberate redesign |

They share **zero** variable names, so both load safely at once. That is also why a
page cannot straddle them: there is no shared vocabulary to meet in the middle.

> `--gold` in the legacy system is **navy** `#1E40AF`, not gold. Historical name.
> Keep it; do not "fix" it.

---

## Page inventory

### Design System — 12 surfaces

| Route | Entry point |
|---|---|
| `/[locationId]/business` · `/[locationId]/business/[part]` | `business/layout.tsx` (the shell — stripe, heading, `SectionNav`) · `business/page.tsx` · `business/[part]/page.tsx` · `components/business/mybusiness/**` |
| `/[locationId]/tasks` | `TasksLedgerClient.tsx` · `TaskCard.tsx` — **reference implementation**. One known seam: the booking modal it opens, `BookingPickerModal`, is legacy markup, and the business address form inside that modal uses the modal's legacy classes too (2026-09-24), as does the pilot terms box (`TermsBox` with `legacyTermsBoxClasses`, 2026-09-29), because the form takes the style of the component that owns the purchase button |
| `/[locationId]/tasks-v1` | `GettingStartedTasks.tsx` |
| `/[locationId]/roadmap/v3` | `components/portal/roadmap-v3/RoadmapV3Client.tsx` — port of the frozen `roadmap-v2/` prototype; scope class `.gpds-rm3`, styles machine-extracted into co-located `roadmap-v3.css` (journey precedent). Real state mapping in `src/lib/roadmapV3/`. One known seam: `RenewMembershipButton` is legacy markup, and the business address form and the pilot terms box inside its modal use its legacy classes too (2026-09-24, 2026-09-29), because the form takes the style of the component that owns the purchase button. The drawer and the intake offer carry the pilot checkout parts and success view (`PilotCheckout.tsx`, 2026-09-28); the booking sheet carries the terms box on a paid call (`TermsConsent`, 2026-09-29): DS tokens only, `.dfyd__govfee`/`.dfyd__terms`/`.dfyd__invoice` in `roadmap-v3.css`, and the DS `.gpds-toast` for "your invoice is ready" |
| `/[locationId]/digital-compliance` | `components/portal/digital-compliance/DigitalComplianceClient.tsx` — the member's Digital Compliance step on its own page: the chain and clock, the nine items (each sendable to her mentor), and what she bought. Scope class `.gpds-dc`, co-located `digital-compliance.css` (journey precedent). Data in `src/lib/roadmapV3/dcStepLoad.ts`; `?sample=1` / `?sample=dfy` render sample data and write nothing |
| `/intake` | `IntakeClient.tsx` · `IntakeForm.tsx` · `IntakeDashboardClient.tsx` |
| `/control-center/journey` | `controlcenter/journey/JourneyClient.tsx` — first team-facing DS surface. One known seam: the header's date picker is the mentor dashboard's `DateRangePicker`, legacy palette and inline styles, reused deliberately (2026-09-09) so the control matches the one the team already knows |
| `/summit` | `components/summit/SummitBoardClient.tsx` — Summit ticket + revenue board, plus the landing-page funnel panel (views, opt-ins, conversion); scope class `.gpds-summit`, co-located `summit.css` (journey precedent). Data in `src/lib/summit/` |
| `/control-center/v2` | `components/commandcenter/CommandCenterV2Client.tsx` — Command Center **v2**, the `command-center/` prototype's information architecture over production data; scope class `.gpds-cc2`, co-located `cc2.css` (journey precedent). Domain in `src/lib/commandCenter/`. **A peer of `/control-center`, not a replacement** — v1 stays legacy and keeps its URL (a GHL custom-menu-link target) until the decommission conditions in `docs/command-center-build-plan.md` §4.1 are met, at which point this row replaces v1's below |
| `/payouts` | `components/payouts/PayoutsClient.tsx` — affiliate payout report; scope class `.gpds-payouts`, co-located `payouts.css` (journey precedent). Data in `src/lib/payouts/`, read live from GoHighLevel. Standalone full-screen, admin session enforced in `src/proxy.ts` **and** `src/lib/portalGate.ts` |
| `/asana` | `components/admin/asana/AsanaDashboardClient.tsx` — Asana team board; scope class `.gpds-asana`, co-located `asana.css` (journey precedent). Data in `src/lib/asana/`. A standalone full-screen page, not an admin-console one, though it takes an admin session (enforced in `src/proxy.ts`) and the admin sidebar links to it. `/admin/asana` redirects here |

These wrap their subtree in `.gpds` and import `@/components/business/ds.css`.
**Copy this pattern for anything new.**

> **Note on the journey board's CSS.** It wraps in `.gpds gpds-journey` and imports
> `ds.css` like everything else, but its own rules live in a co-located
> `journey/journey.css` rather than at the bottom of `ds.css`. Both are equally
> scoped; the co-located file is simply code-split to that one route, so the four
> member-facing DS pages don't download ~17KB of dashboard chart styling they will
> never use. **Extend `ds.css` for anything shared; start a scoped co-located file
> when a route's styling is large and used nowhere else.** Either way the rule that
> matters is unchanged: every selector nested under a scope class, never global.

> **`/[locationId]/business` was redesigned on 2026-08-14** into the five-part
> record. A server `layout.tsx` loads the payload once, holds it in
> `RecordStore` above everything that reads it, and renders the persistent
> rail — Basic Info and the parts, each with a pill carrying
> a count of what is still open, and nothing at all where nothing is. **A sixth
> rail entry, "Digital identity", was added on 2026-08-31** and is the one part
> that is not the record: it renders the Digital Compliance Audit Form
> (`DigitalIdentityPart` → `DigitalIdentityForm`), which writes the same single
> `MemberValidation` row the roadmap's copy of that form writes, so what she
> submits here appears on her roadmap and vice versa. It owns no catalog rows
> (`CATALOG_PART_IDS` names the five that do), loads its own data rather than
> widening the record payload, and is built from `.gpds` / `.mb-di__*` plus the
> shared `.badge` classes — never the roadmap's `.rm3-*`. The one
> AI hatch, "Tell Hunter everything", sits in the page header level with the
> heading: it is a page-level action, and the rail answers a different question.
> Beneath the rail: the landing page (`HandoffPanel` in whichever of its three
> modes — filling, ready, sent — `payload.handoff.mode` says she is in, then
> `AskCard`'s single question — the `QueuePanel` that once followed was mounted
> by no page and was deleted in F5g), and one page per part at `/[locationId]/business/[part]`.
> Every count on the screen comes from `queue.ts`, so no two parts of the page
> can disagree. Its styling is a co-located
> `components/business/mybusiness/mybusiness.css`, scoped under `.gpds`, on the
> journey board's precedent — **`ds.css` gained zero lines**, because it is
> shared with `/tasks`, `/tasks-v1` and `/intake`. The old single-page entry
> point, `BusinessProfileClient.tsx`, was deleted in F16a; `/intake` keeps the
> `QuestionCard` / `servicesFrom` F0 moved out of it, so the two surfaces still
> ask one question one way.

> **A third redesign, 2026-09, ported a UI overhaul from a separate sandbox
> prototype** (`govpreneurs-prototype`, "My Business: count questions answered,
> not points") onto this real record. `PartRail` was renamed `SectionNav` and
> gained a done tick per part (`score.ts`'s `partState`); `RecordLede`'s single
> "we know n things" line was replaced by `ReadinessHeader`'s three stat tiles
> (`.mb-stats`) and a collapsible `SectionBreakdown`, both reading a new
> `readyScore`/`sectionScore` pair in `src/lib/businessProfile/score.ts`. A new
> `ScoreCard` repeats the headline fraction above the rail's links. This is a
> **deliberate, recorded exception** to the "count, never a fraction" rule the
> rest of the page still enforces — see `score.ts`'s own header and
> `mybusiness.css`'s header for the full reasoning; nowhere else on the page
> gained a percentage or a bar. An extras tier (tier-3, non-intake rows) now
> carries a `.mb-tier--extra` modifier. `ds.css` again gained zero lines — every
> new class lives in `mybusiness.css`.
>
> **`EntryGhost` is gone (2026-09-08).** It rendered above the questions when a
> part held nothing, showing two of that part's field LABELS greyed out as "the
> shape of an answer that is not there yet". The prototype's version stood
> INSTEAD of the questions; ours stood above them, and every one of its lines
> was a row already listed below it with a button on it — measured 2 of 2 on all
> five parts. On `papers` that put "Insurance coverage" on screen twice, once
> inert and once as "Add your insurance". The tier heading and its note already
> frame an empty part. Component and `ghostCopy.ts` both deleted.
>
> **A parity pass on 2026-09-04** closed the gaps between that port and the
> design it came from. The three stat tiles became tinted cards, each with its
> own icon and one of three fixed grounds — `--pos-*` answered, `--blue-*` parts,
> and a warm neutral for extras. Extras takes NO status family on purpose:
> `--ai-*` is AI-authored output, `--warn-*` is "pending", `--insight-*` is an
> inference, and none of them means "answers beyond the core" — whose absence
> must never read as missing work. `ScoreCard` stopped reusing the header's small tile and took the
> Success Center's own card shape: a 40px figure over an 8px bar, with a
> bordered 44px "Answer the next one" that names its target question for a
> screen reader. That control now reads `readyScore`'s new `open` list after
> `blocking`, so it keeps pointing somewhere while ANY core question is
> unanswered instead of vanishing once the tier-1 rows are settled.
> `SectionBreakdown` became one compact `name · track · n/total` row per part
> and renders ONCE, under the tiles it explains, rather than a second time
> inside the rail card. The rail's done tick gained the text alternative it was
> missing. Every track is clamped at 100%.
>
> **A second parity pass, later the same day**, moved the strip off the shell.
> `ReadinessHeader` and `SectionBreakdown` now render in `business/page.tsx`, at
> the top of the record's own column and as wide as it — the shape the source
> gives them. In `layout.tsx` they were sized by the page title beside them and
> repeated above every part screen, where the rail's `ScoreCard` already carries
> the figure. A new `IdentityCard` opens that column with the record's subject:
> the uploaded logo (or a neutral mark), the registered name, the address and
> the contact email, each read from a stored answer and each omitted when she
> has not given it — an `unknown` ("Not sure") is never printed as a name.

`/[locationId]/tasks` was brought to full compliance on 2026-08-13 and is the
best worked example: every colour is a token (no hex in its CSS block), icons
are inline stroke SVG in `components/portal/tasks/Icon.tsx` rather than glyphs,
counts carry tabular figures, and AI-drafted content sits on the amber lane
behind an `.ai-attr` chip. The other three surfaces predate that pass and still
carry hand-picked hexes in their own blocks of `ds.css`.

Two gotchas found while doing it, worth knowing before you copy DS CSS:

- `--font-ed` is referenced by `type-and-components.css` / `colors_and_type.css`
  but the global entry point defines **`--font-editorial`** — copy a rule using
  `var(--font-ed)` into production and it silently falls back to the browser
  default. Use `--font-editorial`, or the `.gpds-ed` class.
- `tokens.css` is described as tokens-only but its last lines ship four real
  class rules (`.noise`, `[data-noise]`, `.no-scroll`). Nothing uses them today,
  so there is no collision — just do not assume the file is inert.

### Legacy — everything else (37 routes)

Member portal `/[locationId]` · `/mentors` · `/onboarding` · `/roadmap` ·
`/roadmap/v2` · `/roadmap/v2/launchpad` — the whole admin console under
`/admin/**` — `/control-center` · `/members` · `/livecohorts` ·
`/mentors/[ghlUserId]/**`.

Leave them alone. If you are fixing a bug on one of these, fix the bug in the
legacy vocabulary. Do not opportunistically restyle.

---

## How to build a DS page

**Tokens are global.** No import, no wrapper, available on every route:

```css
background: var(--blue-7);   border-radius: var(--r-md);
padding: var(--s-4);         box-shadow: var(--sh-rest);
font-family: var(--font-ui);
```

**The component layer is opt-in and MUST be scoped.** Wrap the subtree, then use
the classes:

```tsx
import "@/components/business/ds.css";

<div className="gpds w-full min-h-screen">
  <div className="gpds-stripe" />        {/* 3px navy→red — every DS page starts with it */}
  <button className="gpds-btn">Save</button>
</div>
```

### Why the component layer is not global

Importing `type-and-components.css` or `colors_and_type.css` app-wide breaks
production immediately:

| DS class | Production classNames it would hijack |
|---|---|
| `.mono` | 40 |
| `.btn` | 39 |
| `.card` | 38 |
| `.input` | 23 |
| `.badge` `.scrim` `.field` `.hint` `.label` | 20 combined |

`type-and-components.css` also sets `html, body { font-size: 14px; background; color }`
and `colors_and_type.css` restyles bare `h1`–`h5` / `p` / `a`.

`src/components/business/ds.css` is the working answer: every rule nested under
`.gpds`, so nothing leaks. Extend that file rather than importing the raw DS
component CSS.

---

## Non-negotiables on a DS surface

From `SKILL.md` — these are the system's own rules, not preferences:

1. **Three-colour discipline.** Federal Blue (`--blue-7`) for all interactive and
   authority chrome. Brand Red (`--brand-7`) **only** for brand moments (Pro
   upsells, the brand stripe). AI Amber (`--ai-7`) **only** for AI-authored
   surfaces. Never cross the streams.
2. **Every page opens with the 3px brand stripe** (`--brand-stripe`, navy→red) at
   `top: 0`. It is the visual bridge to the GoHighLevel shell. Non-negotiable.
3. **AI attribution is mandatory.** Any AI-generated text sits inside `.ai-surface`
   with an `.ai-attr` chip naming Hunter as the source.
4. Never invent colours. Never use emoji. Never use Title Case in UI copy.
   Always tabular figures for numbers, IDs and code.

---

## When you redesign a legacy page

1. Move the whole route in one pass — not a component at a time.
2. Wrap in `.gpds`, add the brand stripe, swap legacy tokens for DS tokens.
3. Delete the legacy token usage from that route; don't leave both.
4. Move its row from the legacy list to the DS table above **in this file**.

Step 4 is the one that keeps this document true. A stale inventory is worse than
none, because the next agent will trust it.

---

## Files

| Path | What |
|---|---|
| `src/design-system/tokens.css` | 111 primitives + semantic aliases |
| `src/design-system/type-and-components.css` | Type ramp + component classes (scope before use) |
| `src/design-system/colors_and_type.css` | Aggregator + bare-tag mapping (scope before use) |
| `src/design-system/govpreneurs-ds.css` | Production entry point — imported by `globals.css` |
| `src/design-system/README.md` · `SKILL.md` | The system, and its agent manifest |
| `src/design-system/preview/` | 24 preview cards, one per token cluster |
| `src/design-system/ui_kits/govpreneurs-app/` | Hi-fi React recreation — lift these, don't re-implement |
| `src/components/business/ds.css` | The scoped `.gpds` layer production actually uses |
| `public/ds-fonts/` · `public/ds-assets/` | Self-hosted fonts; logos and icons |
