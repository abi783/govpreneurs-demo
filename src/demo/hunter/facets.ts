// DEMO (Hunter): the counts that the Filters drawer shows beside each option.
//
// Each count answers one question: "If I pick this option, how many cards will
// the feed show?" So a facet's count leaves out that facet's own filter and
// keeps every other filter. The numbers then agree with the cards after the
// pick. The one exception is a facet that is OR inside itself (states, set-asides):
// there the count is for that single option, which is also what the feed shows
// when the member picks only that option.

import type { FacetCountsDto, ServerFilters } from "../../lib/discoverApi";
import { STATES } from "../../lib/vocab/usStates";
import { SET_ASIDES } from "../../lib/vocab/filterOptions";
import { bucketBounds, VALUE_BUCKET_IDS } from "../../components/Hunter/ValueRangeControl";
import { universe, type FeedRow, type FeedTabId } from "./data";
import { applyFilters, valueFits } from "./query";

const DUE_WINDOW_IDS = ["this_week", "2_weeks", "30_days", "60_plus"] as const;

function tally<T>(
  rows: FeedRow[],
  keys: (r: FeedRow) => T[],
  seed: Record<string, number> = {},
): Record<string, number> {
  const out = { ...seed };
  for (const row of rows) {
    for (const key of keys(row)) {
      const k = String(key);
      out[k] = (out[k] ?? 0) + 1;
    }
  }
  return out;
}

function windowsOf(days: number): string[] {
  const out: string[] = [];
  if (days >= 0 && days <= 7) out.push("this_week");
  if (days >= 0 && days <= 14) out.push("2_weeks");
  if (days >= 0 && days <= 30) out.push("30_days");
  if (days >= 60) out.push("60_plus");
  return out;
}

/** The facet counts for the filters the drawer holds, over the rows of one tab. */
export function facetCounts(filters: ServerFilters, tab: FeedTabId): FacetCountsDto {
  const base = universe(tab);

  const zeroStates = Object.fromEntries(STATES.map((s) => [s.id, 0]));
  const zeroSetAsides = Object.fromEntries(SET_ASIDES.map((s) => [s.id, 0]));
  const zeroBuckets = Object.fromEntries(VALUE_BUCKET_IDS.map((id) => [id, 0]));
  const zeroWindows = Object.fromEntries(DUE_WINDOW_IDS.map((id) => [id, 0]));

  const forLocation = applyFilters(base, filters, "location");
  const forNaics = applyFilters(base, filters, "naics");
  const forSetAsides = applyFilters(base, filters, "setAsides");
  const forValue = applyFilters(base, filters, "valueRange");
  const forDue = applyFilters(base, filters, "dueWindow");

  const valueBuckets = { ...zeroBuckets };
  for (const id of VALUE_BUCKET_IDS) {
    const range = bucketBounds(id);
    valueBuckets[id] = forValue.filter((r) => valueFits(range, r.low, r.high)).length;
  }

  return {
    states: tally(forLocation, (r) => [r.state], zeroStates),
    cities: tally(forLocation, (r) => [r.city]),
    naics: tally(forNaics, (r) => [r.o.naics]),
    setAsides: tally(forSetAsides, (r) => r.setAsideIds, zeroSetAsides),
    valueBuckets,
    dueWindow: tally(forDue, (r) => windowsOf(r.o.closesInDays), zeroWindows),
  };
}

/** The cities of one state, with the number of story opportunities in each. */
export function citiesOf(state: string): { city: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const row of universe("all")) {
    if (row.state === state) counts[row.city] = (counts[row.city] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}
