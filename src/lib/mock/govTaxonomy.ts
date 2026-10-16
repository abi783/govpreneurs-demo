// GovCon taxonomy seed for the Advanced filters panel.
// Trimmed for demo — Marcus-relevant entries flagged.
//
// The filter vocabulary itself — `Option`, the facet option lists, the agency
// tree and their `*Label` helpers — moved to `lib/vocab/filterOptions.ts` in
// feature 10. Controlled vocabulary is not mock data (ARCHITECTURE.md §3(b)).
// The curated trade→NAICS mapping moved to `lib/vocab/trades.ts` in feature V8,
// for the same reason. Neither module is re-exported from here.

export type NaicsRow = { code: string; description: string };

// ─────────────────────────────────────────────────────────────────────────────
// State → city gazetteer — TYPES ONLY. Real city data will come from the
// backend `GET /opportunities/filters/cities` endpoint (see discoverApi.ts
// `fetchCities`), wired up by a LocationPicker component in a later phase.
// The reference (govpreneurs-v2)'s hardcoded STATE_CITY_TREE is a small
// fictional NC-centric mock dataset and is deliberately NOT ported here.
// ─────────────────────────────────────────────────────────────────────────────

export type CityNode = { id: string; label: string };
export type StateCityGroup = { state: string; cities: CityNode[] };

// ─────────────────────────────────────────────────────────────────────────────
// NAICS
// ─────────────────────────────────────────────────────────────────────────────

export const NAICS_ROWS: NaicsRow[] = [
  { code: "238160", description: "Roofing Contractors" },
  { code: "236220", description: "Commercial & Institutional Building Construction" },
  { code: "236210", description: "Industrial Building Construction" },
  { code: "237310", description: "Highway, Street, & Bridge Construction" },
  { code: "238110", description: "Poured Concrete Foundation & Structure" },
  { code: "238190", description: "Other Foundation, Structure & Building Exterior" },
  { code: "238210", description: "Electrical Contractors" },
  { code: "238220", description: "Plumbing, Heating & A/C Contractors" },
  { code: "238310", description: "Drywall & Insulation Contractors" },
  { code: "238320", description: "Painting & Wall Covering Contractors" },
  { code: "238330", description: "Flooring Contractors" },
  { code: "238340", description: "Tile & Terrazzo Contractors" },
  { code: "238350", description: "Finish Carpentry Contractors" },
  { code: "238390", description: "Other Building Finishing Contractors" },
  { code: "238910", description: "Site Preparation Contractors" },
  { code: "238990", description: "All Other Specialty Trade Contractors" },
  { code: "236115", description: "New Single-Family Housing Construction" },
  { code: "236118", description: "Residential Remodelers" },
  { code: "541330", description: "Engineering Services" },
  { code: "541350", description: "Building Inspection Services" },
  { code: "541370", description: "Surveying & Mapping Services" },
  { code: "561210", description: "Facilities Support Services" },
  { code: "561730", description: "Landscaping Services" },
  { code: "562910", description: "Remediation Services" },
  { code: "811310", description: "Commercial Machinery Repair" },
];

export const NAICS_BY_CODE: Record<string, string> = Object.fromEntries(
  NAICS_ROWS.map((r) => [r.code, r.description]),
);

/** Human title for a NAICS code, or the bare code when unknown. */
export function naicsDescription(code: string): string {
  return NAICS_BY_CODE[code] ?? code;
}
