
## Goal

Relocate the entire filter UI (simple chips, advanced controls, active-value chips, Starters) off the Opportunities page body and into the Filters panel. The page body leads with the feed. No functionality changes — only relocation.

## Page body (after)

Order under the page header:

```text
Opportunities title + subtitle
Open / Awarded tabs
Verdict sub-tabs  (All / Bid / Lean Bid / Pass)
── Summary row ──
   142 matches · 18 new this week · Why these?
   [Filters · 13]   [Sort ▾]   [♡ Save]
Opportunity cards…
```

Goal: 2–3 cards visible at ~1440 without scrolling. No Starters strip, no simple-tier chip row, no per-value chip wall on the body.

## Filters panel (single home)

Reuse the existing `FiltersDrawer` (Radix overlay) and add the simple tier + active chips at the top of its body. New panel structure:

```text
Header: "Filters"                              [×]
Quick starts:  [SDVOSB roofing · NC · $250K–$1M] [Early signals] [Fort Bragg / USACE]
Active filters: chip chip chip chip  …         [Clear all]
── Simple ──
   Work type ▾   Location ▾   Set-aside ▾
   Value range ▾ Due date ▾   Status ▾
── Advanced (accordion) ──
   NAICS · PSC · Notice type · Agency · PoP · Posted · Vehicle · Scope · Toggles
Footer: 142 matches · Clear all · Save this search · Done
```

The Smart-list builder tab in the drawer is preserved as-is.

## Files to change

1. **`src/routes/opportunities.index.tsx`**
   - Remove `<FilterPresetsStrip>` from body.
   - Replace `<OpportunitiesFilterBar>` block with a new lightweight `<OppsSummaryRow>` (count + "Why these?" + Filters·N + Sort + Save).
   - Keep saved-searches strip (it's small, one row, already conditional).
   - Wire `Filters` button to dispatch `open-customize`.

2. **`src/components/Hunter/OppsSummaryRow.tsx`** (new, small)
   - Props: `matchCount`, `newThisWeek`, `activeCount`, `sort`, `onSortChange`, `onOpenFilters`, `onSaveSearch`, optional `headlineOverride` / `sublineOverride`.
   - Renders the single row described above. Uses tokens, Inter, Lucide (`SlidersHorizontal`, `BookmarkPlus`, `ChevronDown`). No Radix needed (no popovers in row).
   - Includes the existing "Why these?" toggle/reasoning paragraph below the row (preserve the copy that was inside `OpportunitiesFilterBar`).

3. **`src/components/Hunter/FiltersDrawer.tsx`**
   - In "advanced" mode tab, render in this order inside `fd-body`:
     1. `<FilterPresetsStrip>` ("Quick starts" header label).
     2. Active-value chips row + Clear-all (extract `buildChips` from `OpportunitiesFilterBar.tsx` into a shared helper or move it into the drawer).
     3. New `<SimpleFiltersGrid>` (the 6 `SimpleFilterChip` popovers currently in the bar — moved verbatim).
     4. Existing `<AdvancedFiltersPanel>` accordion.
     5. Saved-lists section (unchanged).
   - Footer already shows match count + Clear all + Done; add `Save this search` button next to Clear all (call same handler the page uses).
   - Rename drawer title from "Advanced filters" → "Filters". Keep the two-tab Advanced/Smart-list switcher.

4. **`src/components/Hunter/OpportunitiesFilterBar.tsx`**
   - Extract `buildChips`, `ValueRangeEditor`, `FacetHeader`, and the simple-chip JSX into reusable pieces:
     - `src/components/Hunter/filterChips.ts` — exports `buildActiveChips(filters, set)`.
     - `src/components/Hunter/SimpleFiltersGrid.tsx` — the six `SimpleFilterChip` popovers + `ValueRangeEditor`.
   - Then delete `OpportunitiesFilterBar.tsx` (no longer used) and remove its import from the page.

5. **`src/styles.css`**
   - Add `.opps-summary-row` styles (single flex row, count strong + sep + "Why these?" link · spacer · Filters button with badge · Sort · Save).
   - Add `.fd-quickstarts`, `.fd-active-chips`, `.fd-simple-grid` panel-internal styles. Drop unused `.opps-bar*` / `.of-simple-row` / `.opps-bar__chips-row` (or leave dormant).

## Out of scope

No changes to filter evaluation, taxonomy, glosses, smart-list builder logic, saved searches behavior, opportunity card, verdict tabs, awarded-contract pipeline, Hunter chat, or any backend. Persona stays Marcus / NC roofing. No "Hank" anywhere.
