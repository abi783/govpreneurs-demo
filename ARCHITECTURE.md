# ARCHITECTURE — the contract every feature in `GOAL.md` conforms to

Foundation (F0) for the opportunities-feed parity work. Read this before you open
a feature. It settles the four F0 decisions, names where every new module sits,
lists what you must reuse rather than rewrite, and states the rules that stop
twenty-two features colliding on three files.

Nothing here implements a feature. Where a file is not needed until a specific
feature, this document gives its path and its signature and creates nothing.

---

## 1 · Layering

Clean Architecture, mapped onto a React single-page application. The Dependency
Rule is strict: an outer layer imports an inner one, never the reverse.

| Layer | Directory | Holds | May import |
|---|---|---|---|
| **Entities** | `src/lib/vocab/`, the type declarations in `src/lib/hunterChat.ts`, `src/lib/opportunityFilters.ts`, `src/lib/hunter/stageArtifact.ts` | Controlled vocabulary and the shapes the domain is made of. No behaviour beyond a label lookup. | Other entities only |
| **Use cases** | Pure modules under `src/lib/` — `preview.ts`, `warmStartMapping.ts`, `prereqGate.ts`, `smartList.ts`, `naicsCatalog.ts`, `matchesGenerating.ts`, `feedSnapshot.ts`, `feedViewMemory.ts`, `components/Hunter/filterChips.ts` | Application rules. No React, no DOM, no `fetch`. | Entities |
| **Interface adapters** | `src/lib/*Api.ts` (`discoverApi`, `hunterChat`, `workspace`, `partnersApi`…), `src/lib/api.ts`, `src/lib/discoverMapper.ts`, `src/lib/hunter/stageStore.tsx` | HTTP clients, DTO ⇄ view-model translation, React state stores | Use cases, entities |
| **Frameworks & drivers** | `src/routes/`, `src/components/`, `src/styles.css` | React components, Radix primitives, the router, CSS | Everything inner |

**The one rule a reviewer checks:** nothing under `src/lib/**` may import from
`src/components/**` or `src/routes/**`. If a `lib/` module needs a React type,
it takes it from `react`, not from a component.

### Two pre-existing violations, recorded and NOT fixed here

- **`CardOpportunity` — the feed's core view entity — is declared in
  `src/lib/mock/opportunities.ts`.** Every consumer imports it `import type`, so
  it costs no runtime dependency and the mock guardrail passes. It is still the
  wrong home for the entity the whole page is built on. Moving it touches ~40
  files and is out of scope for every feature below. Do not move it opportunistically.
- **`src/lib/opportunityFilters.ts` (a use case) imports `WORK_TYPE_TO_NAICS`
  from `lib/mock/govTaxonomy`** — an entity reaching sideways into a mock module.
  Feature V8 fixes this as a by-product of the vocabulary move.

---

## 2 · Entities

Six, and only six matter to this work.

| Entity | Declared in | What it is |
|---|---|---|
| `CardOpportunity` | `lib/mock/opportunities.ts` (type only — see above) | One opportunity as the feed renders it |
| `OpportunityFilters` | `lib/opportunityFilters.ts` | The member's query: facets, keyword, value range, plus a `prefilled: Set<string>` recording which values came from their profile |
| `ProfileFilterDefaults` / `FilterDefaultsDto` | `lib/opportunityFilters.ts` / `lib/discoverApi.ts` | What `GET /opportunities/filters/defaults` says the member's profile holds: `naics`, `setAsides`, `states`, `cities`, `hasCapabilityStatement`. **No provenance field** — see §3(b) and feature V4 |
| `Option` (`{ id, label, gloss? }`), `AgencyNode`, `NaicsRow`, `PscRow` | `lib/vocab/*` after features 8/10/V8; `lib/mock/govTaxonomy.ts` until then | Controlled vocabulary |
| `HunterTurnResponse` + its five payloads (`ComparePayload`, `EligibilityPayload`, `MatchesPayload`, `ActPayload`, `WebResearchPayload`, `DiscoveryPayload`) | `lib/hunterChat.ts` | What one Hunter turn returns |
| `StageArtifact` | `lib/hunter/stageArtifact.ts` — **created by F0** | The single thing pinned above the feed. §5 |

**Relationships.** A Hunter turn produces at most one `StageArtifact` and at most
one `DiscoveryPayload`; the artifact goes on the stage, the discovery payload
mutates `OpportunityFilters`. `OpportunityFilters` is seeded — tagged, never
pre-selected — from `ProfileFilterDefaults`. Vocabulary supplies the labels for
every id inside `OpportunityFilters`; it never supplies an opportunity.

---

## 3 · The four F0 decisions

### (a) The page-header intro sentence

**Two sentences, because a sentence that needs a number in one place and not
another is two sentences.** Both live in one exported module so the feed and the
Pilot backdrop cannot drift apart.

Create in feature 1 (do not create now):
`src/components/Hunter/feedIntroCopy.tsx`

```ts
/** The corpus sentence, with the live figure in tabular mono. `count` is null
 *  until /opportunities/all answers; the Pilot backdrop always passes null. */
export function FeedIntro({ count }: { count: number | null }): JSX.Element;
```

**State 1 — count loaded (`count` is a number):**

> Hunter scans <span class="of-num">{count.toLocaleString("en-US")}</span> federal
> and state/local (SLED) opportunities every morning and bins each one as
> **Bid**, **Review**, or **No Bid** based on how you actually work.

**State 2 — count still `null`:** the identical sentence with the number and the
word "scans" adjusted, and nothing standing in for the figure:

> Hunter reads every federal and state/local (SLED) opportunity published
> overnight and bins each one as **Bid**, **Review**, or **No Bid** based on how
> you actually work.

**State 3 — `LockedOpportunitiesBackdrop`:** state 2, verbatim. The backdrop
fires zero network requests (§3(c)) so it can never hold a count, and it must not
be given a different sentence — a second wording is a second thing to keep true.

Four rules on this copy:

1. **The figure is `tabAllCount`, not `8M+`.** `routes/index.tsx:386` already
   holds it, fetched from `/opportunities/all`, and already passes it to
   `MeetHunter` as `count`. `8M+` is a claim nothing measures. Feature 1(d) is
   the check that the two read the same source.
2. **The mono treatment is `.of-num`, which already exists** — `styles.css:8484`,
   `font-family: var(--font-mono); font-weight: 600`. Wrap the figure in
   `<span className="of-num">`. **No new CSS rule.**
3. **The Bid / Review / No Bid clause comes back**, overriding decision A8 in
   `GOAL.md`. A8 dropped it on the ground that the card no longer shows a verdict
   chip, so the sentence would name a control the member cannot see. That ground
   is answered by teaching the vocabulary instead of removing it:
4. **The three words are glossed in place.** Render each as
   `<GlossTerm term="Bid">Bid</GlossTerm>` (`components/ui/GlossTerm.tsx`) and add
   three entries to `LABEL_GLOSS` in `lib/filterGlosses.ts`. `GlossTerm` renders a
   plain `<span>` when no gloss is found, so the entries are load-bearing — write
   them in the same commit. The dock's existing `"What is a Review?"` starter chip
   (`HunterChatOverlay.tsx:420`) is the second, conversational route to the same
   answer; it stays. Two routes to the vocabulary, no third.

Locale is pinned to `"en-US"` to match the prototype and `COUNT_LOCALE` in
`components/Companion/FirstMeeting.tsx`. A grouped figure that changes separator
by browser locale is not the same figure.

### (b) The home for the filter vocabulary

**New directory: `src/lib/vocab/`. Three modules, one per KIND of vocabulary,
one owning feature each. No barrel `index.ts`** — a barrel would let any feature
pull the whole vocabulary and would hide which feature owns which symbol.

| Module | Symbols | Owned by |
|---|---|---|
| `src/lib/vocab/usStates.ts` | `STATES`, `US_STATE_NAMES`, `stateName()` | Feature 8 |
| `src/lib/vocab/filterOptions.ts` | `Option`, `SET_ASIDES`, `NOTICE_TYPES`, `CATEGORIES`, `DUE_WINDOWS`, `VEHICLES`, `AgencyNode`, `AGENCY_TREE`, and `agencyLabel` / `categoryLabel` / `dueWindowLabel` / `noticeTypeLabel` / `setAsideLabel` / `vehicleLabel` | Feature 10 |
| `src/lib/vocab/trades.ts` | `WORK_TYPES`, `WORK_TYPE_TO_NAICS`, `workTypeLabel()` | Feature V8 |

All three stubs exist already, carrying the rationale below and nothing else.
Each owning feature fills its own module. **Two features never edit the same
vocab file.**

#### Why these are NOT mock data — state this, do not re-derive it

`lib/mock/` means *fabricated data standing in for something real*. These three
modules are **controlled vocabulary**: the closed set of ids a filter may hold and
the human label for each id. The distinction is load-bearing, so it gets a test
(feature 10(b)) and a paragraph here:

- **`usStates.ts` is a constant of the world.** There are fifty United States. No
  endpoint should ever serve them, and one that did would be a network round-trip
  for a fact that cannot change.
- **`filterOptions.ts` is the filter's own id space.** `GET /opportunities/filters/defaults`
  returns *the member's* values; nothing on the backend serves the OPTION LIST.
  A missing label here is a raw id on screen, not a lie.
- **`trades.ts` is editorial judgement, and that is the point.**
  `GET /naics/search?q=roofing` answers *"which NAICS codes mention the word
  roofing"*. `WORK_TYPE_TO_NAICS` answers *"which NAICS codes does a roofer
  actually bid"*. Those are different questions and the second has no backend
  home. The repo `CLAUDE.md` rule *"No hardcoded NAICS catalog on the frontend"*
  bans shipping a truncated copy of a taxonomy the backend serves; it does not ban
  a curated trade→code mapping the backend does not hold. Keep the mapping.

**A future reader must not "fix" these back under `lib/mock/`.** Nothing in these
three modules asserts that an opportunity, an agency, an award or a member fact
exists.

#### What does NOT move

- **`PSC_ROWS`** — feature 12 deletes it outright for `GET /psc/search?q=`.
- **`NAICS_ROWS`, `NAICS_BY_CODE`, `naicsDescription()`** — these ARE a truncated
  28-row copy of a taxonomy the backend serves (`GET /naics/descriptions?codes=`),
  which is exactly what `CLAUDE.md` forbids. They stay in `lib/mock/govTaxonomy.ts`
  and stay classified as mock. Feature 9 removes the `WorkPicker` consumer. The
  last consumer after that is `lib/naicsCatalog.ts:16`, which seeds its cache from
  `NAICS_BY_CODE` so the picker paints before the network answers. **Removing that
  seed is a behaviour change (first paint would block on a fetch) and is out of
  scope for every feature below.** Recorded, unowned.

#### `SET_ASIDES` vs `SET_ASIDE_CATEGORIES` — beside, not superseded

`lib/setAsideTaxonomy.ts` already sits outside `lib/mock/` and already holds
`SET_ASIDE_CATEGORIES`. It does **not** supersede `SET_ASIDES`. They are two
different vocabularies for two different surfaces:

| | `SET_ASIDES` (`vocab/filterOptions.ts`) | `SET_ASIDE_CATEGORIES` (`lib/setAsideTaxonomy.ts`) |
|---|---|---|
| Size | 7 filter tokens (`VOSB`, `SB`, `8A`, `WOSB`, `HUBZone`, `NATIVE_TRIBAL`, `FULL_OPEN`) | 13 categories over ~20 official SAM codes |
| Surface | The feed's filter drawer | The onboarding / warm-start wizard |
| Bridge | — | `SET_ASIDE_CATEGORY_TO_FILTER` already maps one onto the other |

The bridge exists and is tested. Do not merge the two lists; merging them would
either put SAM codes in the filter drawer or flatten `SDVOSBC`/`SDVOSBS` into the
single `VOSB` filter token in the wizard, and the wizard needs the distinction.

#### The consumer list is much larger than `GOAL.md` says — read this before feature 8

`GOAL.md` features 8 and 10 name three or four consumers each. **`lib/mock/govTaxonomy`
has 23 importing files.** Ten of them are under `src/lib/` and import via
`"./mock/govTaxonomy"`, which the mock guardrail's regex (`/(^|\/)lib\/mock\//`)
does not match — so they are invisible to `portGuardrails.test.ts` today. §8 covers
the guardrail hole. The move must repoint all of them:

| Consumer | Symbols | Moved by |
|---|---|---|
| `components/Hunter/LocationPicker.tsx` | `stateName` | 8 |
| `components/Hunter/FiltersDrawer.tsx` | `STATES`, `WORK_TYPES` | 8, V8 |
| `components/Hunter/filterChips.ts` | `stateName`, `agencyLabel`, `categoryLabel`, `dueWindowLabel`, `noticeTypeLabel`, `setAsideLabel`, `vehicleLabel` | 8, 10 |
| `components/Hunter/AdvancedFiltersPanel.tsx` | `CATEGORIES`, `DUE_WINDOWS`, `NOTICE_TYPES`, `SET_ASIDES`, `VEHICLES` (+ `PSC_ROWS` until 12) | 10 |
| `components/Hunter/HierarchyPicker.tsx` | `AGENCY_TREE` / `AgencyNode` | 10 |
| `components/Hunter/WorkPicker.tsx` | `WORK_TYPE_TO_NAICS` (+ `naicsDescription` until 9) | V8 |
| `components/Hunter/WarmStartWizard.tsx` | `WORK_TYPE_TO_NAICS` | V8 |
| `lib/askOptions.ts` | `SET_ASIDES`, `STATES`, `US_STATE_NAMES` | 8, 10 |
| `lib/factDisplay.ts` | `SET_ASIDES`, `stateName` | 8, 10 |
| `lib/preview.ts` | `WORK_TYPES`, `SET_ASIDES`, `stateName` | 8, 10, V8 |
| `lib/onboardingTrees.ts` | (multi-symbol import) | 8, 10, V8 |
| `lib/opportunityFilters.ts` | `WORK_TYPE_TO_NAICS` | V8 |
| `lib/warmStartMapping.ts` | `WORK_TYPE_TO_NAICS` | V8 |
| `lib/workSections.ts` | `WORK_TYPES` | V8 |
| `lib/setAsideTaxonomy.ts` | comment reference only | 10 (comment) |
| `lib/usStateNeighbors.ts` | comment reference only | 8 (comment) |
| Test files: `lib/usStateNeighbors.test.ts`, `lib/setAsideLabels.test.ts`, `lib/workSections.test.ts`, `lib/warmStartMapping.test.ts`, `lib/opportunityFilters.test.ts`, `components/Hunter/LocationPicker.test.tsx` | various | their own feature |

**No re-export shim in `lib/mock/govTaxonomy.ts`.** A shim would leave the mock
module as the vocabulary's nominal home, which is the whole thing the move exists
to end. Repoint every consumer; delete the symbol from `govTaxonomy.ts` in the
same commit.

`lib/usStateNeighbors.ts` keeps its own concern (land-border adjacency). Do not
fold `STATES` into it — a module with two purposes is how the next reader loses
the thread.

### (c) The Pilot backdrop

`LockedOpportunitiesBackdrop.tsx` renders `OPPORTUNITIES.slice(0, 12)` as real-looking
`OpportunityCard`s to any member on a Pilot plan. Twelve fabricated agencies,
titles, values and deadlines shown to somebody paying us.

**The component's security argument is sound and survives unchanged:** a Pilot
member never mounts the real feed, so there is no `/opportunities/discover/v2`
call to find in the Network panel and no real opportunity data in the DOM. Removing
the blur in devtools must reveal nothing. **The backdrop must never start fetching.**

**Decision: replace the twelve cards with twelve inert placeholder rows that
contain no text at all.**

- Drop the `OpportunityCard` and `toCardOpportunity` imports, and with them the
  only reason the module imports `lib/mock/opportunities`. Feature 7 leaves that
  module with **zero** imports from `lib/mock/` — not a type-only one.
- Render `BACKDROP_ROW_COUNT = 12` rows of `<div className="locked-backdrop__row">`,
  each holding two or three `<div className="locked-backdrop__bar">` blocks sized
  by CSS. Geometry only. No agency, no dollar figure, no date, no title — nothing
  a screenshot could be mistaken for a contract.
- The whole backdrop takes `aria-hidden="true"`. It is decoration behind a gate;
  the gate (`PilotUpsellGate`) carries the accessible content. Empty bars announced
  to a screen reader are noise.
- The header keeps its real copy via `<FeedIntro count={null} />` (§3(a) state 3).
- `OpportunitiesTabs` renders with every count `null`, so no badge appears.
  This needs feature 2 to have widened `openCount` to `number | null` — **feature 7
  therefore depends on 2 as well as 1**, which `GOAL.md` does not say.
- New CSS: `locked-backdrop__row`, `locked-backdrop__bar` and a
  `locked-backdrop__bar--short` modifier. A NEW family; nothing in `styles.css`
  matches `locked-backdrop` today.

The no-network guarantee stops being a comment and becomes feature 7(c): a test
that asserts `global.fetch` is never called on mount.

### (d) The stage-card contract

The prototype's own header comment states the model, and it is the model we adopt:

> *Stage card canvas pattern. Pinned above the opportunity list, one at a time;
> the list stays alive underneath (filters intact).*

#### The artifact union

Declared **now**, in `src/lib/hunter/stageArtifact.ts` (created by F0 — types only,
no behaviour). Five kinds, each carrying a live payload from `lib/hunterChat.ts`
verbatim. **The stage never reshapes a payload and never invents a field.**

```ts
export type StageArtifact =
  | { kind: "scorecard"; key: number; payload: EligibilityPayload }
  | { kind: "compare";   key: number; payload: ComparePayload }
  | { kind: "checklist"; key: number; payload: ActPayload }
  | { kind: "matches";   key: number; payload: MatchesPayload }
  | { kind: "research";  key: number; payload: WebResearchPayload };

export type StageArtifactInput = Omit<StageArtifact, "key">;   // discriminated
```

`key` is a monotonic instance counter assigned by the store, not by the caller.
It exists so asking the same question twice re-runs the reveal animation; it is
never rendered.

Payload → artifact, one-to-one:

| `HunterTurnResponse.uiPayload.kind` | Artifact kind | Card title |
|---|---|---|
| `eligibility` | `scorecard` | `Readiness check · {payload.title}` |
| `compare` | `compare` | `Compare · {a} vs {b}` |
| `act` | `checklist` | `Action checklist · {payload.gap.title}` |
| `matches` | `matches` | `Best matches` |
| `web_research` | `research` | `Research · {payload.query}` |
| `discovery`, `switch_tab`, `save`, `reset`, `none` | *(no artifact)* | — these change the feed, they are not artifacts. Feature 15 pins that path |

#### The store

`src/lib/hunter/stageStore.tsx` — created by feature 13, signature fixed here:

```ts
export function StageStoreProvider({ children }: { children: ReactNode }): JSX.Element;
export function useStageStore(): {
  artifact: StageArtifact | null;
  showArtifact: (input: StageArtifactInput) => void;
  dismissArtifact: () => void;
};
```

**"One at a time" is enforced by the store holding a single nullable value, not
by the mount filtering a list.** `showArtifact` overwrites. There is no array, no
stack, no history. A capability that cannot hold two artifacts cannot show two.

In-memory only. No `sessionStorage`, no URL state — an artifact is the answer to
a question asked this minute, and restoring one on reload would put an answer on
screen with no question above it.

#### Where the mount sits

`StageStoreProvider` wraps the whole page body in `routes/index.tsx`, outside the
feed, so mounting or dismissing an artifact never re-renders the provider's own
subtree boundary.

```
<section>                          ← the existing page column
  <header> … <FeedIntro /> …
  <MeetHunter /> | <HunterStrip />
  <OpportunitiesTabs />
  <HeroSearchField />
  <OppsSummaryRow />               ← the results row stays where it is
  <StageCardMount resultCount={…} />   ← NEW: here, and only here
  … active filter chips …
  … the opportunity list …        ← NEVER unmounted
</section>
```

Between `OppsSummaryRow` and the filter chips. Above the artifact the member can
still see what they searched and how many results they have; below it the list
they came for is untouched.

**The feed does not unmount.** `StageCardMount` returns `null` when the store is
empty and a sibling `<section>` when it is not. It is never a conditional wrapper
around the list, never a route change and never a modal. Feature 13(a) is the test:
with an artifact set, the opportunity list is still in the DOM and the active
filter chips are unchanged.

#### The dismiss control

One control, in the card header, first in DOM order:

```
← Back to your {resultCount} results
```

Singular when `resultCount === 1`. `resultCount` is the real count the feed is
showing — the same number `OppsSummaryRow` prints — passed down from
`routes/index.tsx`. Its accessible name names that count, so a screen-reader user
hears what they are going back to. It calls `dismissArtifact()` and nothing else:
it does not clear filters, does not change tab, does not scroll.

Escape does **not** dismiss. The stage is not a modal, it does not trap focus, and
a member typing in the search box must not lose the artifact to a stray Escape.

#### The card shell

```tsx
// src/components/Hunter/Stage/StageCard.tsx        (feature 13)
export function StageCardMount({ resultCount }: { resultCount: number }): JSX.Element | null;
```

- `<section className="stage-card" role="region" aria-live="polite" aria-label={…}>`
- The `aria-label` names the artifact in a sentence: *"Readiness check for
  {title} is on screen"*.
- `prefers-reduced-motion: reduce` renders every row revealed immediately, with
  **no timers created at all** — not timers whose duration is zero.

#### The artifact bodies

One file each, so features 13 and 14 never edit the same file. Named here,
created by their own feature:

| Path | Feature | Reads |
|---|---|---|
| `src/components/Hunter/Stage/ScorecardArtifact.tsx` | 13 | `EligibilityPayload` |
| `src/components/Hunter/Stage/CompareArtifact.tsx` | 14 | `ComparePayload` |
| `src/components/Hunter/Stage/ChecklistArtifact.tsx` | 14 | `ActPayload` |
| `src/components/Hunter/Stage/MatchesArtifact.tsx` | 14 | `MatchesPayload` |
| `src/components/Hunter/Stage/ResearchArtifact.tsx` | 14 | `WebResearchPayload` |
| `src/components/Hunter/Stage/StageMiniCard.tsx` | 14 | the artifact, for the inline chat reference |

Each exports one component taking exactly `{ payload }`.

#### The compact inline reference

`StageMiniCard` renders in the chat thread where the full card used to. One line,
no data beyond what names the artifact:

```
[icon] Readiness check · {title}          On the stage ↑
```

The whole row is a button; clicking it calls `showArtifact` with the same payload,
so an artifact dismissed by accident is one click back. **The full artifact is
never duplicated in the thread** (feature 14(e)).

#### The three degradations, and the one fix

`GOAL.md`'s outstanding questions 1–3 are settled. Record the missing backend
fields; ship the honest rendering.

| Gap | Missing backend field | Decision |
|---|---|---|
| 1 · Compare verdict bar | per-column verdict weights on `ComparePayload` (the prototype's `verdictWeights: number[]`) | **Ships degraded.** One winner segment, from `verdict.strengthPct` + `verdict.strengthLabel`. No per-column percentage is rendered, because none exists |
| 2 · Compare cells | `note` and `missing` per cell (`CompareRow.values` is `string[]`) | **Ships degraded.** Plain cells. A thin value reads as a value and cannot say why it is thin |
| 3 · Eligibility status | *(nothing missing)* | **FIXED, not degraded — see below** |
| 4 · Row decorations | `action`, `subNote`, `blocker`, `hypothetical` on `EligibilityRow` | Not rendered at all. The section **drops out**; it is never filled with placeholder copy |

**Gap 3 — the scorecard grows a fourth dot.** `EligibilityRow.status` is
four-valued (`pass | warn | fail | neutral`); the prototype's row primitive has
three (`have | missing | confirm`). Mapping `warn` and `neutral` both onto
`confirm` would collapse *"we checked this and it is marginal"* into *"we have not
checked this"*. That is the exact error the repo `CLAUDE.md` calls out — **empty
is not verified-absent** — and it is not one we repeat to save a CSS class.

The mapping is one-to-one:

| `EligibilityRow.status` | Dot | Reads as |
|---|---|---|
| `pass` | `is-have` | You have it |
| `fail` | `is-missing` | You do not have it |
| `warn` | `is-marginal` **(new)** | We checked; it is marginal |
| `neutral` | `is-confirm` | We have not checked |

`is-marginal` is a NEW modifier on the new `scorecard__dot` family — no existing
rule changes. Give it its own icon and its own `aria-label`; a colour difference
alone is not a distinction.

#### Three constraints carried from `GOAL.md`, unchanged

1. **Live payloads only.** The stage reads what `postHunterMessage` returns. Do
   not script replies, do not hardcode answer text, do not port
   `lib/hunter/scenarios.ts`.
2. **The research card's safety work survives intact** — numbered citations with
   `host` and `trusted`, URL vetting through `httpUrlOrNull` (a rejected URL hides
   the LINK, never the citation), the `MAX_CITATIONS` cap with its "and N more not
   shown" line, and the verify-against-the-official-solicitation disclaimer. The
   target's research card is better than the prototype's `title`-attribute source
   string. Move it to the stage; change nothing inside it.
3. **`priceLabel` must not arrive.** `lib/hunterChat.ts:113-116`: a `DfyOffer`
   carries *"NEVER a price (the flat mentor fee is the only monetary figure Act
   may surface)"*. The prototype's checklist footer renders `a.priceLabel`.
   Porting it verbatim reintroduces per-service prices this app deliberately
   forbids.

---

## 4 · Recorded user decisions — binding, do not re-open

| Decision | Consequence |
|---|---|
| **Keep the better version, sync the rest** | The target's per-tab `SortDropdown`, infinite scroll, preview / not-yet-matched flow, `useReducer` filter state and profile-driven "Why these?" reasoning all STAY |
| No `DeltaStrip`, no `FilterStoreProvider` | The feed keeps `useReducer`. Porting the undo strip means porting the store |
| The prototype's hardcoded reasoning must NOT arrive | `rg "Fort Bragg\|Fayetteville" src/components/Hunter/OppsSummaryRow.tsx` returns nothing, forever |
| `ProfileStrengthMeter` is NOT duplicated into the page header | It stays in the dock. ONE `/state` read |
| The "You qualify" card chip is **declined** | It lands on `OpportunityCard.tsx`, which is done, and it would flatten the self-certified / certified distinction |
| Payload gaps 1 and 2 ship **degraded** | §3(d). Missing backend fields recorded above |
| Payload gap 3 is **fixed** | §3(d). Fourth dot |
| `AwardedContractCard.tsx` is **deleted** once feature 3 orphans it | Answers `GOAL.md` question 4. Delete the component, its `lib/mock/awardedContracts` imports and its guardrail allow-list entry |
| Tab labels sync to the prototype | `Opportunities for you` / `All opportunities` / `Saved` |
| The curated trade→NAICS mapping **stays**, out of `lib/mock/` | §3(b). Answers `GOAL.md` question 5. Owned by feature V8 |
| **Backend: only `GET /psc/search?q=` may be added** | Feature 11. Nothing else under `backend/` may be touched |
| Do NOT restore the `⌘K` hint | `CommandBarProvider`'s handler is commented out; the shortcut does nothing. Advertising it promises nothing |

---

## 5 · Reuse registry — reuse or extend these; do NOT write a near-copy

A feature that needs one of these and writes its own is rejected at review.

### Presentation primitives

| Thing | Path | Use it for |
|---|---|---|
| `GlossTerm` | `components/ui/GlossTerm.tsx` | An inline term in prose, dotted-underlined, gloss on hover/focus/tap. **Feature V2 uses this for Bid / Review / No Bid** |
| `JargonGloss` | `components/Hunter/JargonGloss.tsx` | An icon-bearing pill beside a section head. Different primitive from `GlossTerm`; do not merge them |
| `FromProfileTag` | `components/Hunter/FromProfileTag.tsx` | The "from your profile" tag on a filter option |
| `SearchableMultiSelect` + `MSOption` | `components/Hunter/SearchableMultiSelect.tsx` | Every multi-select facet. Already supports `detail`, `gloss`, `mono`, `prefilled` (sorted to the top) and `onQueryChange` for a **remote** option list — feature 12 needs no new component |
| `SortDropdown` | `components/Hunter/OppsSummaryRow.tsx` | Per-tab sort. Keep it; the prototype's native `<select>` is worse |
| `ErrorBoundary` | `components/ui/ErrorBoundary.tsx` | Wrap each stage artifact. A malformed payload costs that artifact, not the page |
| `SaveSearchPopover` | `components/Hunter/SaveSearchPopover.tsx` | The live save-a-search entry point. **Feature V3 must not build a second one** |
| `FeedLoadingState` | `components/Hunter/FeedLoadingState.tsx` | The feed's loading skeleton. NOT the Pilot backdrop — that must not read as "loading" |
| `.of-num` | `styles.css:8484` | Every tabular figure. No new mono rule |

### Domain and data modules

| Thing | Path | Use it for |
|---|---|---|
| `apiFetch`, `API_BASE_URL`, `ApiError`, `buildApiError` | `lib/api.ts` | Every backend call. `apiFetch` attaches `X-GHL-Token` and the mock `locationId`. `ApiError.status` lets a caller branch on the HTTP status |
| `fetchFilterDefaults` / `FilterDefaultsDto` | `lib/discoverApi.ts` | The member's profile-derived facets. **Features V4 and V5 both read this — one call, cached in `routes/index.tsx`** |
| `applyProfileDefaults`, `prefilledValues`, `emptyFilters`, `setValues`, `hasProfileFacets` | `lib/opportunityFilters.ts` | Seeding and mutating filters. **Feature V5's "Reset to my profile" IS `applyProfileDefaults(emptyFilters(), defaults)`** — the same expression the route already runs on mount. Do not invent a second notion of "my profile". `hasProfileFacets(defaults)` is the one test for "the profile seeded something" — the route uses it both to seed on mount and to decide whether to offer the reset |
| `SET_ASIDE_CATEGORY_TO_FILTER` | `lib/setAsideTaxonomy.ts` | Bridging wizard categories to filter tokens |
| `describeNaics` / `ensureNaicsDescriptions` | `lib/naicsCatalog.ts` | ONE NAICS description cache for the whole app. Feature 9 reuses this or `useNaicsDescriptions`; a second cache means a second set of network calls and two answers to "what is 238160" |
| `glossFor`, `LABEL_GLOSS`, `OPTION_GLOSS`, `SET_ASIDE_GLOSS` | `lib/filterGlosses.ts` | Every gloss. **`field-vocabulary` equivalent for this app: one gloss map, no second label map anywhere** |
| `httpUrlOrNull` (`lib/safeUrl.ts`), `externalSourceUrl` / `agencySource` (`lib/sourceLink.ts`) | | URL vetting. Every citation. Never construct a source URL from an id |
| `postHunterMessage` and the payload types | `lib/hunterChat.ts` | The only source of Hunter's answers |
| `shouldShowPreview`, `mapPreviewToCard` | `lib/preview.ts` | The preview gate |
| `shouldShowMatchesGenerating` | `lib/matchesGenerating.ts` | The matches-generating gate |
| `useDebouncedSearch` | `lib/useDebouncedSearch.ts` | Every remote typeahead over a catalog too large to ship. Debounces, aborts, and reports a failed lookup as `status: "failed"` with ZERO rows — so a caller can say "couldn't load" instead of "no matches". Used by the PSC facet and the NAICS closed-set ask |
| `searchPsc` / `PscSearchResult` | `lib/pscApi.ts` | The PSC taxonomy. `GET /psc/search?q=`, the register live. The 2,344-code catalog is never shipped to the client |
| `parseMarkdownBlocks` / `parseInlineSpans` | `lib/miniMarkdown.ts` | Any model-written answer that arrives as markdown. Returns `{ text, bold }` STRUCTURE, never markup, so the caller builds React nodes and never needs `dangerouslySetInnerHTML`. Covers bold, bullets, numbered items, headings and paragraphs — the subset a chat model writes; anything else stays literal text. `ResearchArtifact` is the only caller today |

### Never reuse

- **`lib/hunter/scenarios.ts` (prototype only).** Authored answers. Do not port it,
  do not import it, do not imitate it.
- **Anything under `src/lib/mock/` at runtime.** §8.

---

## 6 · Feature isolation — the rules that stop collisions

Each feature is a self-contained change that depends only on the shared inner
layers. A feature never reaches into a sibling feature's component.

### `src/routes/index.tsx` — the composition root, and the bottleneck

Owned strictly serially: **3 → 4 → 5 → 6 → 13 → 15 → V2 → V5 → V7**. It is the
only file that knows about every other part of this page, which is why it is the
only file with a queue.

Two rules that keep the queue short:

1. **A feature adds at most ONE `useState` here, and only when the state IS the
   composition.** Legitimate: feature 13's `StageStoreProvider` boundary; feature
   V5's cached `FilterDefaultsDto`. Not legitimate: anything a `lib/` hook or a
   child component could own. `routes/index.tsx` is already ~1680 lines.
2. **A feature does not "tidy" a line it did not come for.** Every changed line
   traces to that feature's criteria.

Feature V5 caches the `FilterDefaultsDto` the route **already fetches and throws
away** at line 848 — it currently keeps only `hasCapabilityStatement`. That is one
new state variable and zero new network calls. Any implementation that fetches the
defaults a second time is wrong.

### `src/components/Hunter/AdvancedFiltersPanel.tsx`

Owned serially: **10 → 12 → V4**. Three features, three concerns, one file:

- 10 repoints its vocabulary imports at `lib/vocab/filterOptions.ts`.
- 12 replaces `PSC_ROWS` with the live typeahead.
- V4 groups the set-aside facet.

V4 is the only one that may change `SearchableMultiSelect`, and it may only ADD
optional fields to `MSOption` (`group?: string`, `badge?: ReactNode`) plus an
optional `groupCheckAll?: string[]` prop. Every existing call site must keep
working untouched — that is V4's proof the change is additive.

### `src/styles.css`

- **Each feature appends its rules in ONE contiguous block at the END of the
  file**, headed by `/* ── <feature name> ── */`. Two features appending at the
  end produce a trivial merge; two features editing the middle do not.
- **A feature edits only rules it added, or rules in a Hunter-owned family it is
  named as owning.** Hunter-owned families: `hunter-*`, `opps-*`, `of-*`,
  `stage-card*`, `scorecard*`, `compare*`, `checklist*`, `locked-backdrop*`,
  `fd-*`. Shared base families — `.card`, `.btn`, `.t-*`, `.scope-pill`,
  `.opp-facts-grid*`, `.hunter-enrich-*` — are **frozen**; `portGuardrails.test.ts`
  pins three of them by name and will fail.
- **`hunter-research__*` is TAKEN and means something else.** The prototype uses
  the same family for entirely different DOM (`__sentence` / `__src` / `__micro`
  there; `__head` / `__kicker` / `__live` / `__para` / `__cite` / `__source*` /
  `__disclaimer` here). Copying prototype CSS across collides silently. Feature 14
  moves the research card to the stage and keeps the target's class names.
- `stage-card*`, `scorecard*`, `compare*`, `checklist*` and `locked-backdrop*` are
  **free** — verified, zero matches in `styles.css` today. Features 13, 14 and 7
  add them as NEW selectors.

### Features that share nothing

11 (backend), 8 / 10 / V8 (three different vocab modules), 2 (`OpportunitiesTabs`),
7 (`LockedOpportunitiesBackdrop`), V1 / V6 (`HunterChatOverlay`) and V3 / 4
(`OppsSummaryRow`) touch disjoint files and run in parallel, subject to the
dependency order in `GOAL.md`.

---

## 7 · CSS naming plan

BEM-ish, matching the repo: `family`, `family__element`, `family--modifier`, plus
`is-<state>` for transient state. New families this work introduces:

| Family | Elements | Added by |
|---|---|---|
| `locked-backdrop` | `__row`, `__bar`, `__bar--short` | 7 |
| `stage-card` | `__head`, `__back`, `__title`, `__title-sep`, `__subject`, `__body`; `is-instant` for reduced motion | 13 |
| `scorecard` | `__verdict`, `__verdict-chip`, `__verdict-note`, `__rows`, `__row`, `__dot`, `__row-label`, `__row-note`, `__footnote`; dot states `is-have`, `is-missing`, `is-marginal`, `is-confirm`; row reveal `is-in` / `is-pre` | 13 |
| `compare` | `__verdict`, `__verdict-label`, `__verdict-bar`, `__verdict-seg`, `__table-wrap`, `__table`, `__col-head`, `__col-name`, `__col-sub`, `__row-label`, `__cell`, `__tick`; `is-winner-col` | 14 |
| `checklist` | `__sub`, `__steps`, `__step`, `__step-num`, `__step-body`, `__step-title`, `__step-note`, `__fork`, `__fork-side`, `__fork-head`, `__fork-cta`; step states `is-done`, `is-todo`, `is-blocked`. **No `__footer-price`** | 14 |
| `stage-mini` | `__icon`, `__label`, `__hint` | 14 |
| `of-qual` | `--verified` is **NOT ported** — see V4. Use `of-qual` plus `of-qual__source` | V4 |

Colour comes from tokens, never a literal. `var(--ai-7)` / `var(--ai-9)` is
Hunter amber; `var(--blue-7)` / `var(--blue-9)` is the app's action blue. **Feature
V1 is a token swap on Hunter-owned rules, not a new family.**

---

## 8 · The mock guardrail — and the hole in it

`src/test/portGuardrails.test.ts` asserts that no NEW runtime (value) import of
`src/lib/mock/*` appears. It must keep passing.

`ALLOWED_MOCK_VALUE_IMPORTS` is an **upper bound**: removing an import passes
without editing the list. So features 3, 7, 8, 9, 10, 12 and V8 all shrink the
tree's mock dependency without touching the guardrail. Only feature 16 tightens it.

**Feature 16 must also close a hole this design uncovered.** `MOCK_MODULE_RE` is
`/(^|\/)lib\/mock\//`. A module inside `src/lib/` imports its neighbour as
`"./mock/govTaxonomy"`, which does not match. **Ten runtime mock imports under
`src/lib/` are invisible to the scan today** — `askOptions.ts`, `factDisplay.ts`,
`preview.ts`, `onboardingTrees.ts`, `opportunityFilters.ts`, `warmStartMapping.ts`,
`workSections.ts`, `naicsCatalog.ts`, `smartList.ts`, `tasks.ts`. Widen the regex
to `/(^|\/|^\.\/)(lib\/)?mock\//` (or resolve the specifier against the importing
file's directory, which is exact), then re-baseline `ALLOWED_MOCK_VALUE_IMPORTS`
with what the widened scan finds. Expect the allow-list to GROW at feature 16 even
as the tree's real dependency shrinks — that is the hole becoming visible, not a
regression. The "scan is not vacuous" threshold (`> 20`) can then rise.

**Entries feature 16 removes or reduces:** `routes/index.tsx` (to at most
`["STRETCH_MODE_OPPORTUNITIES"]`), `LockedOpportunitiesBackdrop.tsx` (gone),
`AwardedContractCard.tsx` (gone — the file is deleted), `LocationPicker.tsx`
(gone), `WorkPicker.tsx` (gone), `WarmStartWizard.tsx` (gone),
`FiltersDrawer.tsx` (gone), `filterChips.ts` (gone),
`AdvancedFiltersPanel.tsx` (gone).

---

## 9 · Test strategy — decided once

**Framework.** Vitest 4 with `@testing-library/react`. The whole suite is:

```bash
npm --prefix <repo>/frontend-v2 run test        # → vitest run
```

`GOAL.md` says `bun run test` in several criteria. **The package manager here is
npm** (`package.json` → `"test": "vitest run"`); read every `bun run test` in
`GOAL.md` as `npm run test`.

Type checking is separate and is part of every feature's gate:

```bash
npx tsc --noEmit    # EXACTLY 2 pre-existing errors: routes/agencies.tsx, routes/home.tsx
```

**Where tests live.** Beside the module under test, always:

- `Foo.tsx` → `Foo.test.tsx`
- `foo.ts` → `foo.test.ts`
- A test with no single module under test — a tree scan, a guardrail — lives in
  `src/test/`. That is the only exception, and `portGuardrails.test.ts` is the
  only current inhabitant besides `vitest.setup.ts`.

**Naming.** `*.test.ts` / `*.test.tsx` is Vitest. `*.spec.ts` under `e2e/` is
Playwright and is NOT run by `npm run test`. Never name a Vitest file `.spec.ts`.

**Environment.** The default is `node`. A test that renders a component must
declare `// @vitest-environment jsdom` on its first line. Forgetting it produces
a confusing "document is not defined", not a helpful failure.

**Unit vs integration, for this app:**

| | Unit | Integration |
|---|---|---|
| Subject | One pure module under `src/lib/` | One component tree |
| Environment | `node` | `jsdom` |
| Network | None. If it needs `fetch`, it is not a unit | `fetch` / `apiFetch` stubbed with `vi.fn()`; never a live server |
| Asserts on | Return values | Rendered DOM, via `@testing-library` queries |

There is a third kind — the **browser check** in several `GOAL.md` criteria
(a real page at `localhost:8081`). That is a manual verification step the feature
owner performs. It is not automated and it is not part of `npm run test`.

**Test-first.** Each Developer writes their feature's tests before the code,
against these conventions. The Tester runs the whole suite; no feature runs a
subset and calls it green.

**Selector rule, measured and load-bearing.** The tab buttons are `.opps-tab`,
`<button aria-pressed>` inside a `role="tablist"`. **`getByRole("tab")` finds
nothing.** Select by class and text. (The `aria-pressed`-inside-`tablist`
inconsistency is a known accessibility defect, flagged and out of scope.)

**Baselines to hold.** 76 test files / 891 tests passing. `npx tsc --noEmit`
reports exactly 2 errors. Lint: the repo carries ~1897 pre-existing eslint
problems in files this work never opens, so `npm run lint` cannot exit 0 — the
criterion is **zero net-new problems on changed files**, measured per file.

---

## 10 · Skeleton created by F0

Only what more than one feature depends on. Everything else is named above and
created by its owning feature.

| Path | What it is |
|---|---|
| `frontend-v2/ARCHITECTURE.md` | This document |
| `frontend-v2/src/lib/vocab/usStates.ts` | Stub + the not-mock rationale. Feature 8 fills it |
| `frontend-v2/src/lib/vocab/filterOptions.ts` | Stub + the not-mock rationale. Feature 10 fills it |
| `frontend-v2/src/lib/vocab/trades.ts` | Stub + the editorial-judgement rationale. Feature V8 fills it |
| `frontend-v2/src/lib/hunter/stageArtifact.ts` | The `StageArtifact` union. Types only, no behaviour. Features 13 and 14 both read it |

Named, **not** created: `components/Hunter/feedIntroCopy.tsx`,
`lib/hunter/stageStore.tsx`, `components/Hunter/Stage/StageCard.tsx` and the six
artifact/mini-card files, `backend/src/psc/psc-search.controller.ts`.
