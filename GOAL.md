# Goal: Sync the opportunities FEED page and the Hunter chat dock with the prototype, put Hunter's tool output on a stage card above the feed, and take the remaining mock data off both.

Scope, after three cuts and one addition by the user:

- **IN:** `src/routes/index.tsx` (served at `/`) and the components it renders —
  including the Hunter chat dock (`components/Hunter/HunterChatOverlay.tsx`) and
  the **tool-response cards** it renders, driven by the payloads
  `postHunterMessage` returns in `src/lib/hunterChat.ts`.
  The prototype equivalent is `src/routes/opportunities.index.tsx`
  (`/opportunities`) and its own `HunterChatOverlay.tsx` / `StageCard.tsx`.
- **IN (backend, exactly one change):** a `GET /psc/search?q=` controller in
  `backend/src/psc/`. **Nothing else in `backend/` may be touched.**
- **OUT:** every other route, and the opportunity DETAIL page
  (`routes/opportunities.$noticeId.tsx`, `GrantCanvas`, `lib/grant/take.ts`,
  `EvidenceBlock`). Pipeline, government-buyers, forecasts, labor-pricing,
  vehicles, whos-winning, partners, home, business-profile, mentors, awards,
  tasks, wallet, stay-ready, agencies, cap-statement, admin, internal,
  mentor-directory, redirect and the dev routes are all descoped, together with
  the questions they raised.

---

## Provenance of this plan

**The prototype's current main IS `ac877eb`** — verified by the coordinator
against the GitHub API, the raw ref files and a full tree diff: zero commits
ahead, clean working tree, no newer Hunter work on any branch. The running
`http://localhost:8080` server is current main, not stale. My own file-level
comparison agreed: `routes/opportunities.index.tsx`,
`components/Hunter/HunterChatOverlay.tsx` and `lib/hunter/scenarios.ts` are
identical at identical line numbers between the working tree and the `ac877eb`
checkout.

**No browser was used to write this plan.** The planning agent had `Read`,
`Grep` and `Glob` only. Every finding is read off source. The visual pass is a
task, not a question — see "Outstanding task" at the end.

---

## The rule the user gave for resolving differences

> **Keep the better version, sync the rest.**

Where the target is genuinely richer or reads real member data, the target
**stays** and this document records why. Only pure visual drift is synced. That
rule settles eight questions; the decisions are recorded under "Decisions taken"
below so nobody re-opens them.

The evidence behind the rule, measured on this page:

| Surface | Prototype | Target |
|---|---|---|
| "Why these?" reasoning | Hardcoded prose: *"food service past performance up to ~$890K … under 3 hours of Fayetteville … MICC Fort Bragg"* (`OppsSummaryRow.tsx:113-120`) | `WhyReasoning` — reads the member's real `businessProfile`, prompts for a capability statement when there is none |
| "N new this week" | Hardcoded `18` (`opportunities.index.tsx:847`) | Derived from the loaded page's `postedAt` |
| Filter facet counts | `lib/filterCounts` + `lib/mock/catalog`'s `countryOptionCounts` | `useFacetCounts` — a live backend call |

Two corrections to the original brief, both verified in source:

- `AdvancedFiltersPanel.tsx` is NOT a target-only surface. The prototype renders
  the same Advanced facets inline in `FiltersDrawer.tsx`; the target extracted
  them into a component. Same five drawer sections in both
  (`what` / `where` / `fit` / `timing` / `advanced`). Not a deletion candidate.
- The repo `CLAUDE.md` line "Hunter's Partners and Government Buyers pages are
  mock-driven" is **stale for Partners**: `routes/partners.tsx` is fully wired to
  `/partners`. Out of scope here; recorded so nobody re-derives it.

---

## Hunter's tool output goes on a stage card — the model, and the mapping

The user asked: *"Can you make the calling tools display their output in the
main window, with the formatting of the prototype?"*

**The prototype's model, from its own source.** `StageCard.tsx`'s header comment:

> *Stage card canvas pattern. Pinned above the opportunity list, one at a time;
> the list stays alive underneath (filters intact).*

Three moving parts, and the target already has one of them:

| Prototype part | What it does | Target status |
|---|---|---|
| `StageCardMount` / `StageCardShell` | The big artifact, pinned above the feed, one at a time, dismissed by a "Back to your N results" button | **Missing** — feature 13 |
| `{ kind: "minicard"; oppId }` | A compact reference INLINE in the chat, so the conversation stays readable | **Missing** — feature 14 |
| `{ kind: "canvas"; apply(filters) }` | A filter change shown as the feed itself re-filtering | **ALREADY BUILT** — feature 15 verifies it |

**The payload-to-artifact mapping is close to one-to-one**, which is why this is
buildable without inventing data:

| Prototype stage kind | Target payload (`lib/hunterChat.ts`) |
|---|---|
| `compare` — columns, rows of cells, a verdict bar, winner column | `ComparePayload` — `opps: CompareCol[]`, `rows: CompareRow[]` (`values[]` + `winner`), `verdict`, `tradeoff` |
| `scorecard` — a verdict chip + note, rows with have/missing/confirm dots | `EligibilityPayload` — `verdict`, `verdictLabel`, `rows: EligibilityRow[]`, `note`, `soleSource` |
| `checklist` — numbered steps with done/todo/blocked, a DIY-vs-DFY fork | `ActPayload` — `gap`, `trustLevel`, `offers: DfyOffer[]`, `selfServe`, `bidChecklist`, `mentorFeeUSD` |
| *(none — prototype uses an inline `minicard`)* | `MatchesPayload` — `rows: MatchesRow[]` with tier + match reasons |
| *(prototype `research`, inline in chat)* | `WebResearchPayload` — `answer` + numbered `citations[]` |

**Four shape gaps, all of which degrade honestly rather than block.** Each is
also an open question naming the missing backend field (questions 1–3 below):
per-column verdict weights, per-cell notes, the 4-into-3 status collapse, and
the prototype's row decorations (`action`, `subNote`, `blocker`, `hypothetical`)
that `EligibilityRow` has no source for. **Where a field is absent the section
drops out — it is never filled with placeholder copy.**

### Three hard constraints on this feature set

1. **Live payloads only.** The cards keep reading `postHunterMessage`. Do NOT
   script replies, hardcode answer text, or port `lib/hunter/scenarios.ts`. This
   is presentation work. The prototype's answers are authored; ours are not, and
   must not become so.
2. **The research card's safety work must survive intact** — numbered citations
   with `host` and `trusted`, URL vetting through `httpUrlOrNull`, the
   `MAX_CITATIONS` cap with its "and N more not shown" line, and the
   verify-against-the-official-solicitation disclaimer. The prototype has a bare
   `source` string in a `title` attribute. The target's is better and stays.
3. **The prototype's checklist footer carries `priceLabel`. It must NOT be
   ported.** `lib/hunterChat.ts:113-116` documents the rule: `DfyOffer` carries
   *"NEVER a price (the flat mentor fee is the only monetary figure Act may
   surface)"*. Porting the prototype's footer verbatim would reintroduce
   per-service prices the target deliberately forbids.

**One CSS trap.** Both apps use the class family `hunter-research` /
`hunter-research__*` for entirely different DOM. Prototype:
`__sentence` / `__src` / `__micro`. Target: `__head` / `__kicker` / `__live` /
`__para` / `__cite` / `__source*` / `__disclaimer`. If prototype CSS is copied
across, these collide silently. The same applies to `stage-card*`, `scorecard*`,
`compare__*` and `checklist__*`, which the target does not yet have — those are
free, and features 13/14 must add them as NEW rules only.

---

## Decisions taken — do not re-open

| # | Question | Decision | Why |
|---|---|---|---|
| A1 | Sort control | **Keep the target's `SortDropdown`** | Per-tab `sortKeys` (`saved\|newest\|deadline` on Saved, `newest\|deadline` on Explore) and a fifth `saved` key. The prototype's native `<select>` knows none of that |
| A2 | Load-more vs infinite scroll | **Keep infinite scroll** | The target's IntersectionObserver sentinel + `{totalOpps} … showing {n}` line reads a real total; the prototype's button line reads `TOTAL_STRONG_MATCHES`, which is `0` |
| A3 | `CountTicker` | **Port it** — folded into feature 4 | Pure presentation, no data cost |
| A4 | Preview / not-yet-matched flow | **Keep the target's** | Its `preview-gate-banner` + `MatchesGenerating` + `FeedLoadingState` read live state. The prototype's five bands need `stageStore` / `memberState` / `enrichmentStore`, none of which exist here |
| A5 | `DeltaStrip` + `FilterStoreProvider` | **Not ported; keep `useReducer`** | Porting the strip means porting the store — a rewrite of how the feed holds filter state, for an undo affordance |
| A6 | `ProfileStrengthMeter` in the page header | **Stays in the dock, not duplicated** | The previous port's constraint holds: no second meter, no second `/state` call |
| A7 | The "You qualify" chip | **Declined** | Lands on `OpportunityCard.tsx`, which is DONE, and "self-reported vs verified" is exactly the self-certified/certified distinction `CLAUDE.md` forbids flattening |
| A8 | "bins each one as Bid, Review, or No Bid" | **Dropped** | The port removed `verdict-chip` from the card; the sentence would name a control the member cannot see |
| A9 | PSC endpoint | **Build it** — features 11 and 12 | The taxonomy service already exists and is exported; only the HTTP route is missing |
| A15 | Delete the tool-response cards | **No** | The rule cannot delete a capability with no other route to it — the same ground already accepted for the auth-bypass routes |

---

## Working environment

- Backend `http://localhost:3000`; target `http://localhost:8081/v2/ui/`;
  prototype `http://localhost:8080/opportunities` (current main).
- Seed: 5 opportunities `LOCAL-FS-0001`..`0005`, ranked matches for
  `locationId=ddbuHlCqOW0xNpbwwogw`.
- Tab buttons are `.opps-tab`, `<button aria-pressed>` inside `role="tablist"` —
  **`getByRole('tab')` finds nothing.** Select by class and text.
- Baselines to hold: **76 test files / 891 tests**; `npx tsc --noEmit` has
  **exactly 2** pre-existing errors (`routes/agencies.tsx`, `routes/home.tsx`);
  repo-wide eslint carries ~1800 pre-existing problems, so the criterion is
  **zero net-new on changed files**; no NEW runtime `lib/mock/*` import; no
  pre-existing `styles.css` rule modified.

### File ownership — why the parallel-with fields are so tight

| File | Owned by, in order |
|---|---|
| `routes/index.tsx` | 3 → 4 → 5 → 6 → 13 → 15 (strictly serial) |
| `components/Hunter/OpportunitiesTabs.tsx` | 2 |
| `components/Hunter/LockedOpportunitiesBackdrop.tsx` | 1 → 7 |
| `components/Hunter/OppsSummaryRow.tsx` | 4 |
| `components/Hunter/HunterChatOverlay.tsx` | 14 |
| `components/Hunter/AdvancedFiltersPanel.tsx` | 10 → 12 |
| `components/Hunter/FiltersDrawer.tsx`, `filterChips.ts` | 8 → 10 |
| `backend/src/psc/` | 11 |
| `src/test/portGuardrails.test.ts` | 16 only |

**AMENDED by F0**, once the visual-pass features are folded in:

| File | Owned by, in order |
|---|---|
| `routes/index.tsx` | 3 → 4 → 5 → 6 → 13 → 15 → V2 → V5 → V7 (strictly serial) |
| `components/Hunter/OppsSummaryRow.tsx` | 4 → V3 (**and 4 and V3 contradict — see V3**) |
| `components/Hunter/HunterChatOverlay.tsx` | 14 → V6 |
| `components/Hunter/AdvancedFiltersPanel.tsx` | 10 → 12 → V4 |
| `components/Hunter/SearchableMultiSelect.tsx` | V4 (additive only) |
| `components/Hunter/FiltersDrawer.tsx`, `filterChips.ts` | 8 → 10 → V5 |
| `components/Hunter/LockedOpportunitiesBackdrop.tsx` | 1 → 7 (**7 also depends on 2** — it needs `openCount: number \| null`) |
| `src/lib/vocab/usStates.ts` / `filterOptions.ts` / `trades.ts` | 8 / 10 / V8 — one file each, never shared |
| `src/lib/hunter/stageArtifact.ts` | F0 (created); 13 and 14 read only |
| `src/styles.css` | every feature APPENDS one block at the end; nobody edits the middle |

`portGuardrails.test.ts`'s `ALLOWED_MOCK_VALUE_IMPORTS` is an **upper bound** —
removing an import passes without editing the list. That is why features 7–12 do
not serialise on it; only feature 16 tightens it.

## Foundation

- [x] F0 Architecture & shared skeleton  (owner: designer)
      Four decisions, recorded in `ARCHITECTURE.md`. No code.
      **(a) The corpus number in the page header.** The target hardcodes `8M+`.
      It already holds the real figure: `tabAllCount` (`routes/index.tsx:386`),
      fetched from `/opportunities/all` and already passed to `MeetHunter` as
      `count`. Decide the sentence for THREE states — count loaded, count still
      `null`, and `LockedOpportunitiesBackdrop`, which must fire zero network
      requests and therefore can never have a count. A sentence that needs a
      number in one place and not another is two sentences; say which. The
      Bid/Review/No-Bid clause is dropped per A8. Feature 1 reads this.
      **(b) The non-mock home for the filter vocabulary.** `lib/mock/govTaxonomy.ts`
      is 1500 lines of controlled vocabulary — `STATES`, `US_STATE_NAMES`,
      `SET_ASIDES`, `NOTICE_TYPES`, `CATEGORIES`, `DUE_WINDOWS`, `VEHICLES`,
      `PSC_ROWS`, `AGENCY_TREE`, `WORK_TYPES`, `WORK_TYPE_TO_NAICS`,
      `NAICS_ROWS` and seven `*Label` helpers. **A label map, not fabricated
      opportunity data**, but it sits under `lib/mock/` so every consumer reads
      as a mock dependency. Decide the module(s) it moves to, and whether
      `lib/setAsideTaxonomy.ts` — which already holds `SET_ASIDE_CATEGORIES`
      outside `lib/mock/` — supersedes `SET_ASIDES` or sits beside it.
      Features 8 and 10 read this.
      **(c) The Pilot backdrop.** `LockedOpportunitiesBackdrop` renders 12 mock
      opportunity cards behind the upsell blur. Its header comment argues this
      is a SECURITY property: nothing real is fetched, so devtools cannot unblur
      anything real. **That argument is sound and must survive.** Decide the
      data-free replacement that keeps "zero network requests, no real data in
      the DOM" while showing nothing that reads as a real contract. Feature 7.
      **(d) The stage-card contract.** Decide, before any of 13/14 is written:
      the artifact union the target's stage store holds and how each live
      payload maps onto it (`ComparePayload` → compare, `EligibilityPayload` →
      scorecard, `ActPayload` → checklist, `MatchesPayload` → list,
      `WebResearchPayload` → research); where the mount sits in
      `routes/index.tsx` relative to `OppsSummaryRow` and the card list; how
      "one at a time" is enforced; what the dismiss control says; and what the
      chat's compact inline reference contains. Constraints, not a design:
      **the feed must not unmount beneath the stage card and its filters must
      stay intact**; exactly one artifact is visible at a time; a payload field
      the target does not carry makes its section DROP OUT, never fill with
      placeholder copy. Features 13 and 14 read this.

## Features (dependency order)

- [x] 1 Page-header intro copy — depends on: F0
      Replace the hardcoded `8M+` with the honest corpus figure per F0(a), in
      `routes/index.tsx:1326` and the byte-identical copy at
      `LockedOpportunitiesBackdrop.tsx:40`. Do NOT add the prototype's
      Bid/Review/No-Bid clause (A8).
      criteria: all four pass:
      (a) `rg "8M\+" src/` returns nothing, and `rg "No Bid" src/routes/index.tsx`
          returns nothing;
      (b) a render test asserts the sentence contains
          `tabAllCount.toLocaleString()` once `tabAllCount` is non-null, and the
          count-free variant when it is `null` — no `0`, no placeholder, no
          invented figure in either state;
      (c) `LockedOpportunitiesBackdrop` renders the count-free variant, and the
          test asserts it issues no `fetch`;
      (d) BROWSER: at `http://localhost:8081/v2/ui/` with
          `locationId=ddbuHlCqOW0xNpbwwogw`, the header figure equals the number
          on the "All opportunities" tab badge. If it does not, the two read
          different sources and this feature is not done.
      parallel-with: 2, 11

- [x] 2 Tab strip: labels, counts, and the dead awarded tab — depends on: F0
      `components/Hunter/OpportunitiesTabs.tsx` only.
      Rename `For You` → `Opportunities for you`, `Explore` →
      `All opportunities`. Delete the `awarded` tab: `SHOW_AWARDED_TAB`, the
      `awardedCount` prop, the `"awarded"` member of `OppTab`, the `Trophy`
      import. It is compiled out today, so **deleting it removes no capability
      and no live data** — and the prototype has no such tab.
      criteria: all four pass:
      (a) `rg "SHOW_AWARDED_TAB|awardedCount|Trophy" src/components/Hunter/OpportunitiesTabs.tsx`
          returns nothing, and `type OppTab` has exactly three members;
      (b) a render test asserts the three buttons read "Opportunities for you",
          "All opportunities", "Saved";
      (c) the same test asserts all three render an `.opps-tab-count` when the
          counts are numbers, and that a `null` count renders NO badge rather
          than a `0` — an unfetched count is not a measurement;
      (d) `npx tsc --noEmit` will FAIL between this feature and feature 3, since
          `routes/index.tsx` still passes `awardedCount`. Expected; the
          "exactly 2 pre-existing errors" gate is feature 3's.
      parallel-with: 1, 11

- [x] 3 Delete the awarded feed branch — depends on: 2
      `routes/index.tsx`. Remove the `state.tab === "awarded"` render branch
      (~1591-1617), `awardedFiltered`, the `AwardedContractCard` import, the
      `awardedCount={TOTAL_AWARDED_IN_SPACE}` prop, the
      `tab={state.tab === "awarded" ? "for_you" : state.tab}` coercion passed to
      `HunterChatOverlay`, and the three `lib/mock/awardedContracts` value
      imports. `AwardedContractCard.tsx` itself is NOT deleted here — see
      Outstanding question 4.
      criteria: all four pass:
      (a) `rg "awarded" src/routes/index.tsx` returns nothing;
      (b) `rg "lib/mock/awardedContracts" src/routes/index.tsx` returns nothing;
      (c) `npx tsc --noEmit` reports exactly the 2 pre-existing errors, and
          `bun run test` is green at 891+ tests;
      (d) BROWSER: all three tabs render and switch; no console error.
      parallel-with: 11 (owns `routes/index.tsx` from here to feature 6)

- [x] 4 OppsSummaryRow: dead Save control, honest "new this week", CountTicker — depends on: 3
      `components/Hunter/OppsSummaryRow.tsx` plus its one call site in
      `routes/index.tsx`. Three changes, one file, so one feature.
      Delete the commented-out Save button block (lines 227-236), the unused
      `BookmarkPlus` import, the `onSaveSearch` prop and the
      `onSaveSearch={() => {}}` no-op the route passes — the live save entry
      point is `FiltersDrawer`'s footer `SaveSearchPopover`, and a commented-out
      block breaks the repo's own "no commented-out code" rule. Adopt the
      prototype's `newThisWeek > 0` guard so the row never prints "0 new this
      week". Port `CountTicker` (A3) for the match count, keeping
      `toLocaleString()` grouping.
      criteria: all five pass:
      (a) `rg "BookmarkPlus|onSaveSearch" src/components/Hunter/OppsSummaryRow.tsx`
          returns nothing, and no commented-out JSX block remains in the file;
      (b) a render test asserts `newThisWeek={0}` renders neither the
          "new this week" text nor the `.opps-summary__sep` before it, and that
          `newThisWeek={4}` renders "4 new this week";
      (c) a render test asserts the count element carries the `CountTicker`
          class and its final text is `1,234` for `matchCount={1234}` — the
          animation must not drop digit grouping;
      (d) the same test asserts a `prefers-reduced-motion` match renders the
          final value with no intermediate frames;
      (e) the `WhyReasoning` block is UNCHANGED — a test asserts the reasoning
          still names a value from the member's real `businessProfile`, and
          `rg "Fort Bragg|Fayetteville" src/components/Hunter/OppsSummaryRow.tsx`
          returns nothing. The prototype's hardcoded reasoning must not arrive.
      parallel-with: 8, 9, 11

- [x] 5 Saved tab stops filtering the member's own bookmarks — depends on: 4
      `routes/index.tsx`. The target applies the active filters AND the search
      box to the saved list — its empty state proves it: *"None of your saved
      opportunities match your search or filters."* (line 1540). The prototype's
      `SavedSection` deliberately does not, and says why in-source: re-running
      the filters over a saved list makes bookmarks disappear when the member
      narrows a search, *"which is the one thing a bookmark must never do"*.
      Adopt the prototype's behaviour and its lede: *"Soonest closing date
      first. Your filters do not touch this list."* Sort by soonest deadline.
      criteria: all four pass:
      (a) a test asserts that with two saved opportunities and a `keyword`
          filter matching neither, BOTH still render on the Saved tab;
      (b) the same test asserts ascending `daysUntil(closesAt)` order;
      (c) the lede renders above a non-empty list, and
          `rg "match your search or filters" src/` returns nothing;
      (d) BROWSER: bookmark one card, switch to Saved, type a non-matching term
          in the search field — the card stays.
      parallel-with: 8, 9, 11

- [x] 6 Stretch mode stops claiming 47 — depends on: 5
      `routes/index.tsx`. `matchCount={state.mode === "stretches" ? 47 : …}`
      (line 1375) and `headlineOverride={… "Showing 47 stretches."}` (line 1384)
      are hardcoded; `STRETCH_MODE_OPPORTUNITIES` is `[]`, so the header claims
      47 results above zero cards. Feed the real length; drop the
      `headlineOverride` clause when that length is `0`, exactly as the previous
      port already does for `MeetHunter`'s opener. `TOTAL_STRONG_MATCHES` (`= 0`)
      survives only as a `||` fallback for the tab badge; remove it and let the
      real `0` stand.
      criteria: all four pass:
      (a) `rg "\b47\b" src/routes/index.tsx` returns nothing;
      (b) a test asserts that with `mode: "stretches"` and an empty stretch
          list, the summary row shows neither "47" nor a headline asserting a
          count;
      (c) `rg "TOTAL_STRONG_MATCHES" src/routes/index.tsx` returns nothing;
      (d) `STRETCH_MODE_OPPORTUNITIES` may STAY as a module-level constant — it
          is `[]`, carries no fabricated data, and inlining `[]` would return a
          new array reference on every `useMemo` recompute, a render-behaviour
          change this work cannot prove inert. A comment records that.
      parallel-with: 8, 9, 11

- [x] 7 Pilot backdrop stops rendering invented contracts — depends on: 1
      `components/Hunter/LockedOpportunitiesBackdrop.tsx`. It renders
      `OPPORTUNITIES.slice(0, 12)` as real-looking `OpportunityCard`s behind the
      upsell blur — twelve fabricated agencies, titles and values shown to a
      paying member. It is reachable: it mounts whenever
      `isPilotPlan(session.productId)`. Replace with the data-free backdrop
      F0(c) specifies. **The no-network security property is the point of the
      component and must survive.**
      criteria: all four pass:
      (a) `rg "lib/mock/opportunities" src/components/Hunter/LockedOpportunitiesBackdrop.tsx`
          shows only `import type` lines, or nothing;
      (b) a render test asserts the component renders NO element carrying an
          agency name, a dollar figure or a deadline;
      (c) the same test asserts `global.fetch` is never called when the
          component mounts — the no-network guarantee becomes a test, not only a
          comment;
      (d) BROWSER: a Pilot-plan session at `/` shows the gate with the new
          backdrop, and the Network panel shows no `/opportunities/discover/v2`
          request.
      parallel-with: 8, 9, 11

- [x] 8 US-state vocabulary leaves `lib/mock/` — depends on: F0
      `STATES`, `US_STATE_NAMES` and `stateName()` are the fifty United States —
      a constant of the world, not fabricated data, and no endpoint should ever
      serve them. Move them to the module F0(b) names
      (`lib/usStateNeighbors.ts` is already a non-mock home for state data) and
      repoint `LocationPicker.tsx`, `FiltersDrawer.tsx` and `filterChips.ts`.
      Pure move; no value changes.
      criteria: all four pass:
      (a) a unit test asserts the moved `STATES` has 50+ entries and
          `stateName("NC") === "North Carolina"`, imported from the NEW module;
      (b) `rg "lib/mock/govTaxonomy" src/components/Hunter/{LocationPicker,FiltersDrawer,filterChips}.*`
          returns nothing for the state symbols;
      (c) `bun run test` green and `LocationPicker.test.tsx` passes UNMODIFIED —
          if it needs editing, the move was not value-preserving;
      (d) `npx tsc --noEmit` reports exactly the 2 pre-existing errors.
      parallel-with: 4, 5, 6, 7, 9, 11

- [x] 9 `naicsDescription` reads the live taxonomy — depends on: F0
      `components/Hunter/WorkPicker.tsx` imports `naicsDescription` from
      `lib/mock/govTaxonomy` — a hardcoded 28-row `NAICS_BY_CODE`. The repo's
      own `CLAUDE.md` states the rule for this exact surface: *"No hardcoded
      NAICS catalog on the frontend."* The endpoint exists and this page already
      calls it — `useNaicsDescriptions` (`routes/index.tsx:1200`) batches one
      `GET /naics/descriptions?codes=` per rendered page. Reuse that hook or its
      lookup. A code with no taxonomy entry degrades to the bare code — never to
      an invented label.
      criteria: all four pass:
      (a) `rg "naicsDescription" src/components/Hunter/WorkPicker.tsx` returns
          nothing;
      (b) a unit test asserts ONE request for a de-duplicated code list, and
          that an unknown code and a failed request both yield the bare code;
      (c) a render test asserts `WorkPicker` shows the resolved description for
          `722310` when supplied, and the bare `722310` when not;
      (d) BROWSER: `curl 'http://localhost:3000/naics/descriptions?codes=722310,722320,311999'`
          returns three entries each with a non-empty `description`, and the
          work picker shows those words.
      parallel-with: 4, 5, 6, 7, 8, 11

- [x] 10 The remaining filter vocabulary leaves `lib/mock/` — depends on: 8, 9
      Move `SET_ASIDES`, `NOTICE_TYPES`, `CATEGORIES`, `DUE_WINDOWS`,
      `VEHICLES`, `AGENCY_TREE` and the `*Label` helpers (`agencyLabel`,
      `categoryLabel`, `dueWindowLabel`, `noticeTypeLabel`, `setAsideLabel`,
      `vehicleLabel`) to the module F0(b) names; repoint `FiltersDrawer`,
      `AdvancedFiltersPanel` and `filterChips`. **`PSC_ROWS` is NOT moved here**
      — feature 12 removes it outright. Pure move; no option value changes.
      criteria: all four pass:
      (a) `rg "lib/mock/govTaxonomy" src/components/Hunter/` matches ONLY
          `AdvancedFiltersPanel.tsx` (for `PSC_ROWS`, until feature 12) and the
          two `WORK_TYPE_TO_NAICS` consumers;
      (b) a unit test iterates every moved option list and asserts each entry
          has a non-empty `id` and `label`, and that each `*Label` helper
          returns a non-empty string for every `id` in its own list — so a new
          option cannot be added without a label;
      (c) `bun run test` green; existing filter-drawer and chip tests pass
          unmodified;
      (d) BROWSER: open Filters, select one option in each Advanced facet, close
          the drawer — every selection appears as a chip with a human label, not
          a raw id.
      parallel-with: 11, 13

- [x] 11 BACKEND: `GET /psc/search?q=` — depends on: nothing
      **The only authorised change under `backend/`.** `backend/src/psc/` holds
      exactly two files (`psc.module.ts`, `psc-search.dto.ts`) and NO
      controller, so `PscTaxonomyService` — which `psc.module.ts` already
      provides and exports — is unreachable over HTTP. Add
      `psc-search.controller.ts` mirroring
      `backend/src/naics/naics-search.controller.ts` one-for-one, using the
      existing `psc-search.dto.ts`, and register it in `PscModule`. Register
      `PscModule` in `app.module.ts` if it is not already.
      criteria: all five pass:
      (a) a Nest unit spec asserts `GET /psc/search?q=roof` returns
          `{ code, description }[]`, and that an empty or missing `q` returns
          `[]` rather than the whole taxonomy;
      (b) the spec asserts the same result cap `NaicsSearchController` applies
          (20), so the two endpoints behave alike;
      (c) `cd backend && npm test` is green and `npm run build` succeeds;
      (d) `curl 'http://localhost:3000/psc/search?q=roof'` returns a non-empty
          JSON array against the seeded taxonomy;
      (e) `git diff --stat backend/` touches ONLY `backend/src/psc/*` and, if
          needed, `backend/src/app.module.ts`. Any other backend file in the
          diff fails this feature.
      parallel-with: 1-10 (no frontend file)

- [x] 12 `AdvancedFiltersPanel` drops `PSC_ROWS` for the live endpoint — depends on: 10, 11
      Replace the hardcoded `PSC_ROWS` with a typeahead against
      `GET /psc/search?q=`, using the same `SearchableMultiSelect` the panel
      already renders. A failed request yields NO options and says so — never a
      silent fallback to a stale hardcoded list, which would be the one outcome
      indistinguishable from success.
      criteria: all four pass:
      (a) `rg "PSC_ROWS" src/` returns nothing, and `PSC_ROWS` is deleted from
          `lib/mock/govTaxonomy.ts`;
      (b) a unit test asserts the lookup debounces to ONE request per settled
          query and returns `{ code, description }[]`;
      (c) the same test asserts a failed request renders an explicit
          "couldn't load" state with zero options — not an empty list that reads
          as "no matches";
      (d) BROWSER: open Filters → Advanced, type `roof` in the PSC field, see
          live results, select one, close the drawer — it appears as a chip with
          its description.
      parallel-with: 13

- [x] 13 The stage-card canvas shell — depends on: 6, F0(d)
      Port the prototype's canvas pattern into the target's feed:
      `components/Hunter/StageCard.tsx` (shell + mount) and a small stage store,
      mounted in `routes/index.tsx` per F0(d). One artifact at a time, pinned
      above the opportunity list, dismissed by a "Back to your N results"
      control. **This feature ships the SHELL with one artifact kind only** —
      the `EligibilityPayload` → scorecard mapping, which is the simplest — so
      the shell is proven before feature 14 adds the rest. Add the
      `stage-card*` and `scorecard*` rules to `styles.css` as NEW selectors.
      criteria: all six pass:
      (a) a render test asserts that with a stage artifact set, the feed's
          opportunity list is STILL in the DOM beneath it, and that the active
          filter chips are unchanged — the feed does not unmount;
      (b) the same test asserts that setting a second artifact replaces the
          first: exactly one `.stage-card` exists at any time;
      (c) the dismiss control carries an accessible name naming the real result
          count, and clicking it removes the `.stage-card` and leaves the list
          and filters untouched;
      (d) the section carries `role="region"` and `aria-live="polite"`, and a
          `prefers-reduced-motion` match renders every row revealed with no
          stagger timers;
      (e) `git diff src/styles.css` adds only NEW `stage-card*` / `scorecard*`
          selectors — no pre-existing rule modified, and no `hunter-research*`
          rule touched;
      (f) BROWSER: side by side with `http://localhost:8080/opportunities`, ask
          Hunter an eligibility question; the scorecard appears above the feed
          and the card list is still scrollable beneath it.
      parallel-with: 10, 11, 12

- [x] 14 Hunter's tool output renders on the stage, with a compact chat reference — depends on: 13
      `components/Hunter/HunterChatOverlay.tsx` and the new stage components.
      Route the remaining live payloads to stage artifacts per F0(d):
      `ComparePayload` → compare table, `ActPayload` → checklist,
      `MatchesPayload` → list, `WebResearchPayload` → research. Keep a compact
      inline reference in the chat for each, mirroring the prototype's
      `minicard`, so the conversation stays readable.
      **Honest degradation is required, not optional** (see the four shape gaps
      above): the compare verdict bar renders a single winner segment from
      `verdict.strengthPct` + `strengthLabel`, NOT an N-segment proportional bar
      — the payload carries no per-column weights; per-cell notes and the
      `missing` flag do not render, because `CompareRow.values` is `string[]`;
      `EligibilityRow.status` maps `pass→have`, `fail→missing`,
      `warn|neutral→confirm`; and the prototype's `action` / `subNote` /
      `blocker` / `hypothetical` row decorations do not render at all.
      criteria: all seven pass:
      (a) a test per payload kind asserts the artifact renders from a LIVE
          payload fixture and that no answer text is hardcoded —
          `rg "lib/hunter/scenarios" src/` returns nothing and no new string
          literal carries an answer sentence;
      (b) the research artifact still renders numbered citations with `host` and
          `trusted`, still vets URLs through `httpUrlOrNull` (a rejected URL
          hides the LINK, never the citation), still applies `MAX_CITATIONS`
          with its "and N more not shown" line, and still renders the
          verify-against-the-official-solicitation disclaimer. A test asserts
          each of those five;
      (c) a test asserts the Act checklist renders NO price for any `DfyOffer` —
          only `mentorFeeUSD` may appear as a monetary figure. The prototype's
          `priceLabel` must not arrive;
      (d) a test asserts the compare artifact renders a single winner segment
          and does NOT render a per-column percentage, since none exists;
      (e) a test asserts each tool response leaves a compact inline reference in
          the chat thread, and that the full artifact is NOT duplicated there;
      (f) exactly one `.stage-card` at a time still holds across all five kinds;
      (g) BROWSER: run one prompt per tool against the live backend. Each puts
          its artifact on the stage, leaves a compact line in the chat, and
          leaves the feed mounted with filters intact.
      parallel-with: none

- [x] 15 The filter half is already built — verify, do not rebuild — depends on: 13
      `routes/index.tsx:1650` passes `onApplyFilters={applyHunterFilters}`, and
      `applyHunterFilters` (line 938) merges a `DiscoveryPayload` into the
      feed's filters — `fresh` replaces wholesale, otherwise it merges.
      `HunterChatOverlay.tsx:634` dispatches `kind === "discovery"` into it, and
      also handles `switch_tab` (641) and `save_opportunity` (644). **That is
      the prototype's `{ kind: "canvas"; apply }` step, already working.** Add a
      test that pins the behaviour so a future change cannot silently break it.
      No production code changes.
      criteria: all four pass:
      (a) a test asserts a `discovery` payload with `fresh: true` REPLACES the
          filters and clears the search, and that `fresh: false` MERGES onto the
          current set;
      (b) the same test asserts the opportunity list stays mounted across the
          change — the feed re-filters, it does not remount;
      (c) a test asserts `switch_tab` moves the tab and `save_opportunity`
          updates the saved set;
      (d) `git diff --stat` for this feature shows NO change to
          `routes/index.tsx` or `HunterChatOverlay.tsx` — test files only. If
          production code changed, the premise was wrong; stop and report.
      parallel-with: 14

- [x] 16 Re-tighten the mock guardrail — depends on: 3, 6, 7, 8, 9, 10, 12, 14
      `src/test/portGuardrails.test.ts`. `ALLOWED_MOCK_VALUE_IMPORTS` is an
      upper bound, so every removal above passed without editing it. Narrow it
      to what the tree actually holds, so a re-introduction fails.
      criteria: all four pass:
      (a) the `routes/index.tsx` entry lists at most
          `["STRETCH_MODE_OPPORTUNITIES"]`;
      (b) the `LockedOpportunitiesBackdrop.tsx`, `LocationPicker.tsx` and
          `WorkPicker.tsx` entries are gone; the `FiltersDrawer.tsx`,
          `filterChips.ts` and `AdvancedFiltersPanel.tsx` entries are gone or
          reduced;
      (c) the scan-is-not-vacuous test still passes — the tree must still hold
          more than 20 runtime mock imports, since the descoped pages keep
          theirs. If it does not, LOWER the threshold in the same commit rather
          than deleting the assertion;
      (d) `bun run test` green at 891+ tests.
      parallel-with: none
      **AMENDED by F0:** feature 16 also depends on V8, and it must close the
      hole ARCHITECTURE.md §8 records — `MOCK_MODULE_RE` does not match the
      `"./mock/…"` specifiers that ten modules under `src/lib/` use, so those
      runtime mock imports are invisible to the scan today. Widen the regex,
      then re-baseline the allow-list. Expect the list to GROW even as the
      tree's real dependency shrinks; that is the hole becoming visible.

---

## Features from the visual pass (appended by F0)

Measured at 1440x1200 with both apps live. Numbered `V1`..`V8` so the sixteen
above are not renumbered. `V7` and `V8` are not visual findings — `V7` is a
defect found while reading the feed's error path, `V8` is the owner the user's
binding decision on the trade→NAICS mapping needs and `GOAL.md` did not have.

**Read `ARCHITECTURE.md` first.** It settles the four F0 decisions, names the
reuse registry, and states the isolation rules for `routes/index.tsx`,
`AdvancedFiltersPanel.tsx` and `styles.css`.

- [x] V1 Composer and send button sync to the prototype — depends on: F0
      `src/styles.css` only (Hunter-owned families — see ARCHITECTURE.md §6).
      Measured drift, target vs prototype:

      | | Target (`.hunter-composer` / `.hunter-send-btn`) | Prototype (`.hunter-dock__composer` / `.hunter-dock__send`) |
      |---|---|---|
      | textarea border | `1px var(--border-strong)` → `rgba(32,29,26,0.14)` | `1px var(--border)`, focus `var(--ai-7)` → `rgb(195,119,40)` |
      | textarea radius | `var(--r-sm)` → 6 | 10 |
      | textarea ground | transparent | `var(--surface)` (white) |
      | textarea padding | `10px 12px` | `8px 10px` |
      | textarea height | 61px (`rows={2}`) | 73px (3-line `min-height`) |
      | send size | 36x36 | 32x32 |
      | send radius | `var(--r-sm)` → 6 | 8 |
      | send fill | `var(--blue-7)` → `rgb(49,84,193)` | `var(--ai-7)` → `rgb(195,119,40)` |

      The suggestion chips are ALREADY amber and identical on both sides
      (`.hunter-suggestion-chip` borders `var(--ai-7)`), so the target today
      pairs an amber chip row with a blue send button. Sync to the prototype.
      The prototype's values are all tokens the target already defines
      (`--ai-7`, `--ai-9`, `--border`, `--surface`) — this is a token swap, not
      a new family and not a literal colour.
      **Do NOT restore the `⌘K` hint.** The user removed it deliberately:
      `CommandBarProvider`'s handler is commented out, so the shortcut does
      nothing and advertising it promises nothing. The in-source comment at
      `HunterChatOverlay.tsx:815-818` records that and stays.
      criteria: all four pass:
      (a) `rg "⌘K" src/` returns nothing;
      (b) `git diff src/styles.css` touches ONLY `.hunter-composer*` and
          `.hunter-send-btn*`, and no rule outside the Hunter-owned families;
      (c) every colour is a `var(--…)` token — `rg "195, ?119, ?40|#c37728" src/styles.css`
          returns nothing;
      (d) BROWSER: side by side at 1440x1200, the composer border, radius,
          ground, padding and height and the send button's size, radius and
          fill match the prototype.
      parallel-with: V3, V4, V6, 11

- [x] V2 Page-header intro copy — depends on: F0, 1
      **Supersedes feature 1's copy half**, per ARCHITECTURE.md §3(a). Feature 1
      removes `8M+` and wires `tabAllCount`; V2 lands the final sentence.
      Two sentences, not one: the count-loaded variant carries the figure in
      `<span className="of-num">`, the count-null variant omits it and does not
      stand anything in for it. The Bid / Review / No Bid clause **comes back**,
      overriding decision A8 — it is taught in place with `GlossTerm` plus three
      new `LABEL_GLOSS` entries, and the dock's existing "What is a Review?"
      starter chip is the second route to the same answer.
      Extract both variants into `src/components/Hunter/feedIntroCopy.tsx`
      (`export function FeedIntro({ count }: { count: number | null })`) so the
      feed and `LockedOpportunitiesBackdrop` cannot drift apart.
      criteria: all five pass:
      (a) `rg "8M\+" src/` returns nothing, and the sentence appears in exactly
          ONE module — `rg "bins each one as" src/ -l` returns one file;
      (b) a render test asserts `count={30000}` renders `30,000` inside an
          element carrying `of-num`, and `count={null}` renders neither a
          figure nor a placeholder;
      (c) a test asserts each of `Bid`, `Review` and `No Bid` resolves a gloss
          through `glossFor` — a `GlossTerm` with no gloss renders a bare span,
          so the three `LABEL_GLOSS` entries are load-bearing;
      (d) `npx tsc --noEmit` reports exactly the 2 pre-existing errors;
      (e) BROWSER: the header figure equals the "All opportunities" tab badge,
          and hovering `Review` shows its gloss.
      parallel-with: V4, V6, 11
      (owns `routes/index.tsx` — queue after 15, before V5)

- [x] V3 "Save this search": restore the button or delete the dead prop — depends on: 4
      `components/Hunter/OppsSummaryRow.tsx` lines ~227-236 hold a commented-out
      Save button, leaving `onSaveSearch` and the `BookmarkPlus` import dead and
      `routes/index.tsx` passing `onSaveSearch={() => {}}`. **Leaving it
      commented violates the repo's no-commented-out-code rule either way.**
      The prototype renders it right of Sort (`button.opps-summary__btn`,
      radius 7, `1px rgba(32,29,26,0.08)`) — a class the target already has.
      The capability also exists live in the drawer footer
      (`SaveSearchPopover`), so restoring the button must REUSE that popover,
      not build a second save path.
      **This is feature 4's other half.** Feature 4 as written deletes the block
      and the prop. If V3 restores the button instead, feature 4 must not delete
      them — the two features contradict, and whichever runs first wins. Decide
      before starting 4. The default, absent a decision, is feature 4: delete.
      criteria: all four pass:
      (a) no commented-out JSX remains in the file, and
          `rg "onSaveSearch" src/components/Hunter/OppsSummaryRow.tsx` either
          returns a LIVE prop threaded to `SaveSearchPopover` or returns
          nothing — never a prop with a no-op call site;
      (b) if restored: a test asserts clicking it opens the SAME
          `SaveSearchPopover` the drawer footer uses, and that saving posts once;
      (c) if deleted: `rg "BookmarkPlus|onSaveSearch" src/components/Hunter/OppsSummaryRow.tsx`
          and `rg "onSaveSearch" src/routes/index.tsx` both return nothing;
      (d) `npm run test` green; `npx tsc --noEmit` at exactly 2 errors.
      parallel-with: V1, V4, V6, 11

- [x] V4 Filters drawer: set-aside eligibility grouping — depends on: 10, 12, F0
      `components/Hunter/AdvancedFiltersPanel.tsx` +
      `components/Hunter/SearchableMultiSelect.tsx`. The prototype splits the
      set-aside facet into a `YOU QUALIFY` block and `OTHER SET-ASIDES`, with an
      "Ask Hunter: do I qualify?" affordance and a group `Select all`. The
      target renders one flat list with no eligibility signal.
      The member's set-asides come from `GET /opportunities/filters/defaults`,
      already fetched by `routes/index.tsx` — read the tagged values through
      `prefilledValues(filters, "setAsides")`. **No new network call.**
      **The badge must NOT say "verified".** `FilterDefaultsDto` carries
      `setAsides: string[]` and no provenance field at all, so the target cannot
      tell a self-certified code from a certified one. SAM's `cert_flag` decides
      whether a set-aside bid is responsive; printing "verified" for a
      self-certified code is the exact flattening `CLAUDE.md` forbids. Badge
      **"You qualify · from your profile"** — a claim about where we read it,
      which is true, and not a claim about who checked it.
      *Missing backend field:* per-set-aside provenance
      (`self_certified | certified`) on `GET /opportunities/filters/defaults`.
      Record it; do not synthesise it.
      `SearchableMultiSelect` gains only ADDITIVE optional API: `group?: string`
      and `badge?: ReactNode` on `MSOption`, and a `groupCheckAll?: string[]`
      prop. Every existing call site keeps working untouched.
      criteria: all six pass:
      (a) a render test asserts two group headings render, that a member
          set-aside sits under `YOU QUALIFY` and a non-member one under
          `OTHER SET-ASIDES`, and that a member with no set-asides renders ONE
          ungrouped list rather than an empty "You qualify" heading;
      (b) `rg -i "verified" src/components/Hunter/AdvancedFiltersPanel.tsx`
          returns nothing, and a test asserts the badge text is
          "You qualify · from your profile";
      (c) a test asserts `Select all` on a group selects exactly that group's
          ids and leaves the other group untouched;
      (d) the "Ask Hunter: do I qualify?" control opens the dock with that
          question — it does NOT compute an answer client-side;
      (e) every existing `SearchableMultiSelect` test and every other call site
          passes UNMODIFIED — that is the proof the API change is additive;
      (f) BROWSER: open Filters → Your fit; the grouping and badges render, and
          the member's own set-asides sit first.
      parallel-with: V1, V3, V6, 11

- [x] V5 "Reset to my profile" in the filters-drawer footer — depends on: F0, V2
      `components/Hunter/FiltersDrawer.tsx` + `routes/index.tsx`. The prototype
      has this footer action (`FiltersDrawer.tsx:877`); the target has zero hits
      and an in-source TODO at `FiltersDrawer.tsx:501-506` explaining why it was
      deferred — the drawer receives no `onResetToProfile` and no `locationId`.
      Build it. **Reset to my profile IS
      `applyProfileDefaults(emptyFilters(), defaults)`** — literally the
      expression `routes/index.tsx:859` already runs on mount. Do not invent a
      second notion of "my profile".
      The route already fetches `FilterDefaultsDto` at line 848 and **throws it
      away**, keeping only `hasCapabilityStatement`. Cache it in ONE new state
      variable and pass a `onResetToProfile` callback down. **Zero new network
      calls.** Delete the TODO comment in the same commit.
      criteria: all five pass:
      (a) `rg "TODO\(phase N\)" src/components/Hunter/FiltersDrawer.tsx` returns
          nothing;
      (b) a test asserts the control restores exactly
          `applyProfileDefaults(emptyFilters(), defaults)` — facets tagged, none
          pre-selected — and clears the keyword;
      (c) a test asserts NO second `fetchFilterDefaults` call fires when the
          control is clicked;
      (d) a test asserts the control is absent (not disabled-and-silent) when
          the defaults fetch failed or returned nothing on every facet — a
          reset that resets to nothing is indistinguishable from a broken one;
      (e) BROWSER: narrow the filters, click Reset to my profile, and the
          drawer returns to the state it had on first load.
      parallel-with: V1, V3, V4, V6, 11
      (owns `routes/index.tsx` — queue after V2)

- [x] V6 The seed message earns a feedback row — depends on: F0
      `components/Hunter/HunterChatOverlay.tsx:756` gates thumbs/flag on
      `m.id !== "seed"`, so on first paint there is no way to tell Hunter he is
      wrong. Two blocks above, the MeetHunter hero promises exactly that: *"And
      I get things wrong; tell me when I do and your feed changes."*
      (`components/Companion/FirstMeeting.tsx:92-93`).
      **Decision: the seed message earns the row; the promise stands.** A
      promise made in the hero and refused by the first message on screen is the
      worse of the two failures — and the seed message is Hunter's opening claim
      about the member's feed, which is precisely the kind of claim worth
      contradicting.
      The seed has no `turnId` (it was never a backend turn), and
      `postHunterFeedback` needs one. So the seed's row must degrade honestly:
      render thumbs/flag, and on a rating with no `turnId` open the comment
      field and post the feedback against the SESSION rather than a turn — or,
      if no such path exists, render the row and route the click into the
      composer as a pre-filled message. **What must not happen is a control that
      appears to record feedback and records nothing.**
      criteria: all four pass:
      (a) `rg 'm.id !== "seed"' src/components/Hunter/HunterChatOverlay.tsx`
          returns nothing;
      (b) a render test asserts the feedback row renders on the seed message at
          first paint;
      (c) a test asserts a rating on a message with no `turnId` either posts
          something the backend accepts or visibly hands off — it never
          resolves silently with no request and no UI change;
      (d) BROWSER: load `/` fresh, thumbs-down the seed message, and confirm in
          the Network panel that a request fires (or that the composer receives
          the hand-off).
      parallel-with: V1, V3, V4, 11

- [x] V7 A failed feed load reads as a member mistake — depends on: F0, V5
      `routes/index.tsx`. **Correcting the brief:** the feed does NOT spin
      forever on a 500. Every branch of the fetch effect (lines 706-785) ends in
      `.finally(finish)`, which clears `loading`, and `.catch` sets `apiError`.
      The real defects are three, and they are worse than a spinner because they
      are legible:
      1. `apiError` renders as a bare `<p className="t-body-sm">{apiError}</p>`
         at line 1428 — no `role="alert"`, so a screen reader is never told;
      2. **no retry control** — the member's only recourse is a page reload;
      3. the empty-state card still renders BELOW the error and says
         *"No opportunities in this bucket. Try loosening your filters."*
         A server failure is presented to the member as their own filters being
         too narrow. That is the same shape as the summary-`'none'` bug the repo
         `CLAUDE.md` records: missing information asserted as a finding.
      SECURITY: `buildApiError` (`lib/api.ts:79`) promotes the backend's own
      `message` into the thrown `Error`, and the route renders it verbatim.
      Render a fixed member-facing sentence; `console.error` the detail.
      criteria: all five pass:
      (a) a test asserts a rejected `fetchDiscoverV2` renders an element with
          `role="alert"` and a Retry control, and that Retry re-issues exactly
          one request;
      (b) the same test asserts the "try loosening your filters" empty state
          does NOT render while `apiError` is set;
      (c) a test asserts the raw backend message is not in the DOM — the member
          sees a fixed sentence, the detail goes to `console.error`;
      (d) a test asserts a slow response and a failed response are
          distinguishable: while `loading`, the loading state renders and the
          alert does not;
      (e) BROWSER: stop the backend, load `/`, and the feed says it could not
          load and offers Retry.
      parallel-with: V1, V3, V4, V6, 11
      (owns `routes/index.tsx` — queue last)

- [x] V8 The trade→NAICS mapping leaves `lib/mock/` — depends on: 9, 10
      **Answers outstanding question 5 with the user's binding decision: the
      curated mapping STAYS, and moves.** `GET /naics/search?q=roofing` answers
      "which codes MENTION roofing", not "which codes does a roofer BID" — the
      second is editorial judgement nothing on the backend holds, and it is
      worth keeping. See ARCHITECTURE.md §3(b) and `src/lib/vocab/trades.ts`.
      Move `WORK_TYPES`, `WORK_TYPE_TO_NAICS` and `workTypeLabel()` to
      `src/lib/vocab/trades.ts`. Pure move; no value changes; no re-export shim.
      **The consumer list is larger than features 8 and 10 imply.** Repoint all
      seven: `components/Hunter/WorkPicker.tsx`,
      `components/Hunter/WarmStartWizard.tsx`,
      `components/Hunter/FiltersDrawer.tsx`, `lib/opportunityFilters.ts`,
      `lib/warmStartMapping.ts`, `lib/workSections.ts`, `lib/preview.ts`, plus
      `lib/onboardingTrees.ts` and the four test files that import them.
      criteria: all four pass:
      (a) `rg "WORK_TYPES|WORK_TYPE_TO_NAICS|workTypeLabel" src/lib/mock/govTaxonomy.ts`
          returns nothing, and no module re-exports them from there;
      (b) a unit test asserts every id in `WORK_TYPES` has a key in
          `WORK_TYPE_TO_NAICS` and a non-empty `workTypeLabel`, so a trade
          cannot be added without its codes;
      (c) `npm run test` green and `warmStartMapping.test.ts`,
          `workSections.test.ts` and `opportunityFilters.test.ts` pass with only
          their import path changed — if a value changed, the move was not
          value-preserving;
      (d) `npx tsc --noEmit` reports exactly the 2 pre-existing errors.
      parallel-with: 11, 12, 13

### Explicitly NOT drift — do not schedule

Measured, judged, and rejected:

- **The prototype's search box is INERT.** Typing nonsense still returns all 17
  cards. Do not port its filtering behaviour; the target's search works.
- **The international location tree.** The target's own copy flags the
  gazetteer as unported. Known, not drift.
- Dock width, chip height, message-list padding, and the `DISCOVERY` eyebrow's
  one-token colour step.
- **All prototype mock harness:** the left nav, `DEV · enrich`,
  `Preview as …`, the `Test` button, and "Sample replies, not live AI".

---

## Mock imports on this page — the classification the plan rests on

**Fabricated member-facing data** and **controlled vocabulary** are not the same
thing, and only the first is a lie.

| Import | What it is | Real endpoint? | Handled by |
|---|---|---|---|
| `LockedOpportunitiesBackdrop` → `OPPORTUNITIES`, `toCardOpportunity` | **Fabricated opportunity data**, reachable — 12 invented agencies/titles/values shown to a Pilot member | n/a — fetching nothing is the point | Feature 7 |
| `routes/index.tsx` → `AWARDED_CONTRACTS`, `TOTAL_AWARDED_IN_SPACE`, `rankAwardedByTeamingRelevance` | Fabricated award data, **unreachable** (`SHOW_AWARDED_TAB = false`) | n/a | Feature 3 |
| `routes/index.tsx` → `TOTAL_STRONG_MATCHES` | Inert: the value is `0` | n/a | Feature 6 |
| `routes/index.tsx` → `STRETCH_MODE_OPPORTUNITIES` | Inert: the value is `[]` | n/a | **Kept** — referential stability, 6(d) |
| `FiltersDrawer`, `filterChips`, `LocationPicker` → `STATES`, `US_STATE_NAMES`, `stateName` | **Vocabulary.** The fifty states | No, and none should exist | Feature 8 |
| `AdvancedFiltersPanel`, `filterChips` → `SET_ASIDES`, `NOTICE_TYPES`, `CATEGORIES`, `DUE_WINDOWS`, `VEHICLES`, `AGENCY_TREE` + `*Label` | **Vocabulary.** Filter option lists and labels | `/opportunities/filters/defaults` returns the MEMBER's values, **not** the option list. No endpoint serves the vocabulary | Feature 10 |
| `WorkPicker` → `naicsDescription` | **Vocabulary, but a hardcoded 28-row subset of a real taxonomy** | **Yes** — `GET /naics/descriptions?codes=` | Feature 9 |
| `AdvancedFiltersPanel` → `PSC_ROWS` | Same shape: a hardcoded subset of a real taxonomy | **Being built** — features 11, 12 | Features 11, 12 |
| `WarmStartWizard`, `WorkPicker` → `WORK_TYPE_TO_NAICS`, `WORK_TYPES` | Editorial mapping: plain-English trade → NAICS | Partly — see question 5 | **Unresolved** |

---

## Outstanding questions

**All five are now ANSWERED by the user, recorded in `ARCHITECTURE.md` §4.** The
question text is kept because each one names a missing backend field that is
still missing. The answers:

| # | Answer | Owner |
|---|---|---|
| 1 | **Accept the single winner segment.** Ships degraded; the missing per-column weights are recorded | 14 |
| 2 | **Accept plain cells.** Ships degraded; the missing `note` / `missing` per cell are recorded | 14 |
| 3 | **The scorecard grows a FOURTH dot.** Fixed, not degraded — `warn` and `neutral` stay distinct | 13, 14 |
| 4 | **Delete `AwardedContractCard.tsx`** once feature 3 orphans it, with its mock imports and its guardrail entry | 3 |
| 5 | **The curated mapping STAYS** and moves out of `lib/mock/` | V8 |

The original text, for the record:

1. **`ComparePayload` carries no per-column verdict weights.** The prototype's
   compare bar needs `verdictWeights: number[]`, one per column; the target has
   a single `verdict.strengthPct` for the winner. Feature 14 ships a single
   winner segment as the honest degradation. *Missing backend field:*
   per-opportunity strength weights on `ComparePayload`. Add them, or accept the
   single bar permanently?
2. **`CompareRow.values` is `string[]`.** The prototype's compare cells carry a
   `note` and a `missing` flag; ours have neither, so a cell can say a value but
   not why it is thin. *Missing backend fields:* `note` and `missing` per cell.
   Add them, or accept plain values?
3. **`EligibilityRow.status` is four-valued, the prototype's row is three.**
   Feature 14 maps `warn` and `neutral` both onto `confirm`, which loses the
   distinction between "we checked and it is marginal" and "we did not check".
   Given how hard `CLAUDE.md` is on exactly that distinction elsewhere — *empty
   is not verified-absent* — should the scorecard grow a fourth dot instead?
4. **`AwardedContractCard.tsx` after feature 3.** Once the awarded branch is
   gone, nothing imports it. Delete it, or leave it? The previous port's
   standing instruction was "do NOT delete them in this port", written when the
   branch still existed.
5. **The trade→NAICS mapping has no owner.** `CLAUDE.md` says *"`GET /naics/search?q=`
   … for the wizard's plain-English trade question … No hardcoded NAICS catalog
   on the frontend"*, but `WarmStartWizard.tsx` still imports
   `WORK_TYPE_TO_NAICS`. Note the asymmetry: `/naics/search?q=` answers "which
   NAICS codes mention the word *roofing*", which is NOT "which NAICS codes does
   a roofer bid" — the second is an editorial judgement nothing on the backend
   holds. Either the wizard switches to keyword search and drops the curated
   mapping, or the mapping needs a backend home. Which?

## Outstanding task (not a question)

**The visual pass was never done.** Everything in this plan is a code-level
finding; the tab strip, search field and results row were never compared in a
browser at a fixed viewport. The coordinator will run it. It may add features
this plan does not have. The card, chat dock and MeetHunter hero were excluded
on the standing instruction that they are already synced across 9 commits.

Also unchecked: the `HeroSearchField` placeholder text in each app. Both import
the same component name; the copy was never compared.

---

# Appendix — carried over from the completed Hunter PR-39 port

The features above REPLACE the eleven of the PR-39 Hunter port, which are
complete (`50ed54c1`..`36813f99`). What follows is that document's record of
things observed and deliberately not fixed. It is preserved because several
entries are still true and none has an owner.

## Observed, not in scope

- `discoverMapper.ts:71` keeps the `workType: noticeType ?? dto.noticeType`
  alias. It carries no independent information on real feed data. Deleting it
  needs `lib/smartList.ts` and `discoverMapper.test.ts:165` to change too.
- `lib/preview.ts:129` repeats the same alias.
- Chat-dock items left alone by the previous feature 10: the "HUNTER KNOWS YOU"
  set-asides panel, the message-bubble style, the suggestion-chip style, the
  header caption, the footer line under the input.
- The tab buttons use `aria-pressed` inside a `role="tablist"` instead of
  `role="tab"`. An accessibility inconsistency, flagged and not fixed.
- The fast-award chip at `OpportunityCard.tsx:244` stays on `JargonGloss` rather
  than migrating to `GlossTerm`. PR 39 never touched it, and the two are
  different primitives — `JargonGloss` renders an icon-bearing pill, `GlossTerm`
  a dotted-underlined inline term.
- `.opp-summary-facts`, `.opp-fact`, `.opp-fact__k`, `.opp-summary-kicker` and
  `.meet-hunter-card__avatar--portrait` have ZERO callers. They survive only in
  `styles.css`. Dead-CSS removal is a separate decision.
- `MeetHunterSpotlight.tsx` is mounted nowhere — the port shipped
  `Companion/FirstMeeting.tsx` instead. The spotlight and its test are dead.
- `EnrichCTA`'s `"inline"` variant is dead: no caller passes `variant`, so
  `.hunter-enrich-cta--inline` is unreachable.
- No test covers the previous feature 10(c)'s "no rule still sets
  `align-self: flex-start`" half. The `width: 100%` and DOM-order halves are
  covered by `EnrichmentJourney.test.tsx`.
- Newly observed this round: `components/Hunter/HierarchyPicker.tsx` has no
  importer in the target. The prototype's `FiltersDrawer` uses it; the target's
  `AdvancedFiltersPanel` does not.

## SECURITY — recorded, not fixed, and not forgotten

**`backend/scripts/seed-opportunities.ts:5` hardcodes a live DigitalOcean Mongo
admin credential as the `??` fallback for `MONGO_URI`.**

Nobody may run that script without `MONGO_URI` set in the environment. **The
credential must be rotated and removed from the file.** Out of scope for the
PR-39 port and out of scope for the feed work above — note that feature 11 is
the only authorised backend change and does not cover it. This has now been
carried across four plan revisions without an owner. It needs one.

## Lint baseline — measured, so the "zero net-new" criterion means something

`bun run lint` cannot exit 0: the repo carries 1897 pre-existing eslint problems,
1843 of them auto-fixable `prettier/prettier`, in files this work never opens. A
repo-wide `--fix` would rewrite most of the tree. The criterion is **zero
net-new problems on changed files**, measured per file with `eslint --stdin`.

The PR-39 port's own measurement, base `50ed54c1^`: 14 new files carried 0
problems; of 15 changed files the total went from 106 to 104 (a delta of −2, from
`ThinFeedBanner.test.tsx`). One file, `lib/mock/opportunities.ts`, carries 78 of
the 104 — all pre-existing.
