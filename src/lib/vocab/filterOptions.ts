// The filter's own id space: the closed set of values a facet may hold, and the
// human label for each id.
//
// THIS IS NOT MOCK DATA. `GET /opportunities/filters/defaults` returns THE
// MEMBER'S values; nothing on the backend serves the OPTION LIST. A missing
// label here shows a raw id on screen — it does not assert that an opportunity,
// an agency or a member fact exists. That is the difference between controlled
// vocabulary and fabricated data, and it is why this module sits outside
// `lib/mock/`. See ARCHITECTURE.md §3(b).
//
// Feature 10 moved `Option`, `SET_ASIDES`, `NOTICE_TYPES`, `CATEGORIES`,
// `DUE_WINDOWS`, `VEHICLES`, `AgencyNode`, `AGENCY_TREE` and the six `*Label`
// helpers here from `lib/mock/govTaxonomy.ts`. The option values are unchanged.
// `CATEGORIES` and `categoryLabel` were removed later: the opportunities page
// holds contracts only, so the menu has no opportunity-type filter.
//
// `SET_ASIDES` does NOT supersede, and is not superseded by,
// `SET_ASIDE_CATEGORIES` in `lib/setAsideTaxonomy.ts` (13 categories over the
// official SAM codes). They serve the filter drawer and the onboarding wizard
// respectively; `SET_ASIDE_CATEGORY_TO_FILTER` already bridges them.
//
// The hardcoded PSC row list was never moved here: feature 12 deleted it. The
// PSC facet reads the register live through `lib/pscApi.ts` (`GET /psc/search?q=`).
//
// `NAICS_ROWS` / `NAICS_BY_CODE` / `naicsDescription` are NOT moved here either:
// those ARE a truncated copy of a taxonomy the backend serves, which is what the
// repo CLAUDE.md forbids on the frontend. They stay classified as mock.

/** One value a filter facet may hold: its stored id and the words a member reads. */
export type Option = { id: string; label: string; gloss?: string };

/** The set-aside filter tokens the feed sends. Not the SAM code list — see `lib/setAsideTaxonomy.ts`. */
export const SET_ASIDES: Option[] = [
  { id: "VOSB", label: "VOSB / SDVOSB" },
  { id: "SB", label: "Small Business (Total)" },
  { id: "8A", label: "8(a)" },
  { id: "WOSB", label: "WOSB / EDWOSB" },
  { id: "HUBZone", label: "HUBZone" },
  { id: "MWDBE", label: "MBE / WBE / DBE" },
  { id: "NATIVE_TRIBAL", label: "Native American / Tribal" },
  { id: "FULL_OPEN", label: "Full and Open Competition" },
];

/** The response-deadline windows the due-date facet offers. */
export const DUE_WINDOWS: Option[] = [
  { id: "any", label: "Any deadline" },
  { id: "this_week", label: "Due this week" },
  { id: "2_weeks", label: "Due in 2 weeks" },
  { id: "30_days", label: "Due in 30 days" },
  { id: "60_plus", label: "60+ days out" },
];

/** The notice types the feed's notice facet offers. */
export const NOTICE_TYPES: Option[] = [
  { id: "solicitation", label: "Solicitation" },
  { id: "rfp", label: "RFP" },
  { id: "rfq", label: "RFQ" },
  { id: "combined", label: "Combined Synopsis/Solicitation" },
  { id: "sources_sought", label: "Sources Sought" },
  { id: "rfi", label: "RFI" },
  { id: "presol", label: "Presolicitation Notice" },
  { id: "special", label: "Special Notice" },
];

/** One agency, and the offices under it — the agency facet is a tree, not a list. */
export type AgencyNode = {
  id: string;
  label: string;
  children?: AgencyNode[];
};

/** The agency facet's hierarchy, from department down to contracting office. */
export const AGENCY_TREE: AgencyNode[] = [
  {
    id: "dod",
    label: "Department of Defense",
    children: [
      {
        id: "dod.army",
        label: "Army",
        children: [
          {
            id: "dod.army.usace",
            label: "USACE",
            children: [
              { id: "dod.army.usace.wilmington", label: "Wilmington District" },
              { id: "dod.army.usace.savannah", label: "Savannah District" },
            ],
          },
          { id: "dod.army.fort_bragg", label: "Fort Bragg / Liberty DPW" },
        ],
      },
      {
        id: "dod.navy",
        label: "Navy / USMC",
        children: [
          { id: "dod.navy.camp_lejeune", label: "MCB Camp Lejeune" },
          { id: "dod.navy.navfac_ma", label: "NAVFAC Mid-Atlantic" },
        ],
      },
      {
        id: "dod.air_force",
        label: "Air Force",
        children: [{ id: "dod.air_force.seymour", label: "Seymour Johnson AFB" }],
      },
    ],
  },
  {
    id: "va",
    label: "Veterans Affairs",
    children: [
      {
        id: "va.nco6",
        label: "NCO 6",
        children: [{ id: "va.nco6.fayetteville", label: "VA Fayetteville" }],
      },
    ],
  },
  { id: "gsa", label: "GSA" },
  { id: "dhs", label: "DHS" },
  { id: "doe", label: "DOE" },
];

/** The contract vehicles the vehicle facet offers. */
export const VEHICLES: Option[] = [
  { id: "idiq", label: "IDIQ" },
  { id: "bpa", label: "BPA" },
  { id: "matoc", label: "MATOC" },
  { id: "future", label: "Future / Recompete" },
];

/** Human label for an agency id at any depth of the tree, or the bare id when unknown. */
export function agencyLabel(id: string): string {
  function walk(nodes: AgencyNode[]): string | null {
    for (const n of nodes) {
      if (n.id === id) return n.label;
      if (n.children) {
        const found = walk(n.children);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(AGENCY_TREE) ?? id;
}

/** Human label for a set-aside id, or the bare id when unknown. */
export function setAsideLabel(id: string): string {
  return SET_ASIDES.find((s) => s.id === id)?.label ?? id;
}

/** Human label for a due-date window id, or the bare id when unknown. */
export function dueWindowLabel(id: string): string {
  return DUE_WINDOWS.find((d) => d.id === id)?.label ?? id;
}

/** Human label for a notice-type id, or the bare id when unknown. */
export function noticeTypeLabel(id: string): string {
  return NOTICE_TYPES.find((n) => n.id === id)?.label ?? id;
}

/** Human label for a contract-vehicle id, or the bare id when unknown. */
export function vehicleLabel(id: string): string {
  return VEHICLES.find((v) => v.id === id)?.label ?? id;
}
