// The fifty United States, plus DC — the vocabulary the place-of-performance
// filter is built from.
//
// THIS IS NOT MOCK DATA. `src/lib/mock/` means fabricated data standing in for
// something real. This module holds a constant of the world: there are fifty
// states, the list cannot change, and no endpoint should ever serve it. Moving
// it back under `lib/mock/` would tell every reader that the state list is a
// stand-in for real data it is not. See ARCHITECTURE.md §3(b).
//
// `lib/usStateNeighbors.ts` keeps its own concern (land-border adjacency). Do
// not fold this list into it.

import type { Option } from "./filterOptions";

/** The place-of-performance catalog: the fifty states plus DC, where the id and
 * the label are both the 2-letter code. Display names live in `US_STATE_NAMES`. */
export const STATES: Option[] = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
].map((s) => ({ id: s, label: s }));

// Full display names for 2-letter US state/territory codes — DISPLAY ONLY.
// The stored/filter value (filters.states, toServerFilters' location.states)
// must stay the 2-letter code everywhere; this map only backs human-readable
// labels (e.g. LocationPicker rows, applied-filter chips). Covers all 50
// states + DC plus the US territory codes that appear in the HigherGov
// gazetteer (PR, GU, VI, AS, MP).
export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
  PR: "Puerto Rico",
  GU: "Guam",
  VI: "U.S. Virgin Islands",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

/** Full display name for a 2-letter state/territory code — falls back to the
 * code itself for anything not in the map, so unknown codes never disappear
 * from the UI. DISPLAY ONLY — never use this to derive a stored filter value. */
export function stateName(code: string): string {
  return US_STATE_NAMES[code] ?? code;
}
