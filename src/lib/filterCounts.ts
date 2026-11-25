// Category-level active-filter counts for the Opportunities Filters window.
//
// Only "how many filters are on in this category". The per-option result
// counts come from the backend (see discoverApi.ts `fetchFacetCounts`).

import type { OpportunityFilters } from "./opportunityFilters";

/** The categories of the Opportunities Filters window, in display order. */
export type DrawerSectionId =
  | "what"
  | "where"
  | "fit"
  | "timing"
  | "setAsides"
  | "agencies"
  | "noticeTypes"
  | "vehicles";

/** Active-value counts per category — the badges in the window's category list. */
export function sectionActiveCounts(f: OpportunityFilters): Record<DrawerSectionId, number> {
  return {
    what: f.workTypes.length,
    where: f.states.length + f.cities.length,
    fit: f.valueRange.min !== null || f.valueRange.max !== null ? 1 : 0,
    timing: (f.dueWindow.some((v) => v !== "any") ? 1 : 0) + (f.postedWithin != null ? 1 : 0),
    setAsides: f.setAsides.length,
    agencies: f.agencies.length,
    noticeTypes: f.noticeTypes.length,
    vehicles: f.vehicles.length,
  };
}
