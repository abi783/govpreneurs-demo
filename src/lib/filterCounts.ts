// Section-level active-filter counts for the filters drawer nav badges.
//
// Ported from the reference (govpreneurs-v2/src/lib/filterCounts.ts) — only
// the "how many filters are active in this section" logic, adapted to live's
// OpportunityFilters model (Task 1). The reference's result-counting helpers
// (facetOptionCounts, singleChoiceCounts, scopeSegmentCounts,
// buyerTypeSegmentCounts, valueBucketCounts) are NOT ported: those tally
// matches over a mock Opportunity[] array and will be replaced by a backend
// endpoint (see discoverApi.ts `fetchFacetCounts`) in a later phase — porting
// them now would just create dead code coupled to fictional mock data.

import type { OpportunityFilters } from "./opportunityFilters";

export type DrawerSectionId = "what" | "where" | "fit" | "timing" | "advanced";

/** Active-value counts per drawer section — feeds the section-nav badges. */
export function sectionActiveCounts(f: OpportunityFilters): Record<DrawerSectionId, number> {
  return {
    what: f.workTypes.length,
    where: f.states.length + f.cities.length,
    fit: f.setAsides.length + (f.valueRange.min !== null || f.valueRange.max !== null ? 1 : 0),
    timing: (f.dueWindow.some((v) => v !== "any") ? 1 : 0) + (f.postedWithin != null ? 1 : 0),
    // Status renders as a SegmentedControl in Advanced, matching the
    // reference's placement (govpreneurs-v2's FiltersDrawer puts its
    // `status` ControlHead/SegmentedControl inside the Advanced group).
    advanced:
      f.psc.length +
      f.agencies.length +
      (f.toggles.dodOnly || f.toggles.civilianOnly ? 1 : 0) +
      f.noticeTypes.length +
      f.vehicles.length +
      (f.status !== "active" ? 1 : 0) +
      (f.toggles.excludeNoBid ? 1 : 0) +
      (f.toggles.favoritesOnly ? 1 : 0),
  };
}
