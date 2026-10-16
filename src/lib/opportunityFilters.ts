// Unified two-tier filter model for the Opportunities page.
// Replaces the old single-string ActiveFilters shape.
// In-memory only — no persistence, no URL state.

import type { OppCategory, OppScope } from "./mock/opportunities";
import { daysUntil } from "./format";
import type { SortKey } from "../components/Hunter/OppsSummaryRow";
import type { ServerFilters, ServerSort } from "./discoverApi";
import { WORK_TYPE_TO_NAICS } from "./vocab/trades";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Opportunity status filter — mirrors the reference's `Status` union. */
export type Status = "active" | "include_expiring" | "all";

export type OpportunityFilters = {
  /**
   * Vestigial — no longer written or read anywhere. The drawer's keyword
   * input now drives the real search directly (state.searchValue in
   * routes/index.tsx, sent to the server as the `search` query param) rather
   * than this field. Kept on the type (rather than removed) purely so old
   * persisted saved-search filter objects that still carry a `keyword` key
   * continue to type-check and load without runtime errors; not counted by
   * `countActive` and never read by `toServerFilters`.
   */
  keyword: string;
  // SIMPLE tier
  workTypes: string[]; // trade/work-type ids (e.g. "roofing")
  /** NAICS codes excluded from a selected work type (advanced trim). Subtractive — never counted as an active filter. */
  excludedNaics: string[];
  states: string[]; // 2-letter state codes
  cities: string[]; // free-text city names (e.g. "Houston"), casing preserved
  radius: { city: string; miles: number } | null;
  setAsides: string[]; // ids: "VOSB","SB","8A","WOSB","HUBZone","FULL_OPEN"
  valueRange: { min: number | null; max: number | null };
  dueWindow: string[]; // ids: "this_week","2_weeks","30_days","60_plus","any"
  status: Status;

  // ADVANCED tier
  naics: string[]; // ["238160", ...]
  psc: string[]; // ["Z2AA", ...]
  noticeTypes: string[]; // ids
  agencies: string[]; // hierarchical ids: "dod.army.usace.wilmington"
  popStates: string[];
  popCounties: string[];
  popZips: string[];
  // Lookback window in days; null = any. NOTE: the reference (govpreneurs-v2)
  // models this as a string enum ("1d"|"3d"|"7d"|"30d"|"any") instead — left
  // as-is here and migration to that enum is deferred to a later phase (the
  // segmented-control phase).
  postedWithin: number | null;
  vehicles: string[]; // ids: "idiq","bpa","matoc","future"
  // No `scope`: the buyer lane is page state, not a filter. See buyerLane.ts.
  toggles: {
    excludeNoBid: boolean;
    favoritesOnly: boolean;
    civilianOnly: boolean;
    dodOnly: boolean;
  };

  // metadata — which facets/values were seeded from the user's profile.
  // Holds both facet keys ("naics") for chip highlighting and value keys
  // ("naics:238160") for per-option "from your profile" tags.
  prefilled: Set<string>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Profile-seeded defaults — derived from the user's Success Center business
// profile (GET /opportunities/filters/defaults), not hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

/** Facet values from the user's business profile, used to tag matching options. */
export type ProfileFilterDefaults = {
  naics: string[];
  setAsides: string[];
  states: string[];
  cities: string[];
};

/**
 * Tags the NAICS, set-asides, states and cities from the user's business
 * profile as "from your profile" so the matching filter options are marked
 * in the UI. Does NOT pre-select them — the user opts in by ticking the
 * option. Facets with no profile data are left untagged.
 */
export function applyProfileDefaults(
  base: OpportunityFilters,
  defaults: ProfileFilterDefaults,
): OpportunityFilters {
  const prefilled = new Set<string>();
  const seeded: [keyof ProfileFilterDefaults, string[]][] = [
    ["naics", defaults.naics],
    ["setAsides", defaults.setAsides],
    ["states", defaults.states],
    ["cities", defaults.cities],
  ];
  for (const [facet, values] of seeded) {
    if (!values.length) continue;
    prefilled.add(facet);
    for (const value of values) prefilled.add(`${facet}:${value}`);
  }
  return { ...base, prefilled };
}

/** True when the member's profile holds at least one facet value to seed from. */
export function hasProfileFacets(defaults: ProfileFilterDefaults): boolean {
  return Boolean(
    defaults.naics.length ||
    defaults.setAsides.length ||
    defaults.states.length ||
    defaults.cities.length,
  );
}

/** Option ids tagged "from your profile" for a facet (read from the prefilled set). */
export function prefilledValues(f: OpportunityFilters, facet: string): string[] {
  const prefix = `${facet}:`;
  return [...f.prefilled]
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));
}

export function emptyFilters(): OpportunityFilters {
  return {
    keyword: "",
    workTypes: [],
    excludedNaics: [],
    states: [],
    cities: [],
    radius: null,
    setAsides: [],
    valueRange: { min: null, max: null },
    dueWindow: ["any"],
    status: "active",
    naics: [],
    psc: [],
    noticeTypes: [],
    agencies: [],
    popStates: [],
    popCounties: [],
    popZips: [],
    postedWithin: null,
    vehicles: [],
    toggles: { excludeNoBid: false, favoritesOnly: false, civilianOnly: false, dodOnly: false },
    prefilled: new Set(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkPicker resolution — trade selection → resolved NAICS codes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the WorkPicker's trade selection into the flat NAICS code list
 * that `filters.naics` must hold: the union of every selected trade's code
 * bundle (WORK_TYPE_TO_NAICS), minus any codes the user explicitly excluded
 * (an honest narrowing — excludedNaics is subtractive only, never additive).
 * Order-stable and de-duplicated so repeated calls with the same inputs
 * produce an array that compares equal element-for-element.
 */
export function resolveNaicsSelection(workTypes: string[], excludedNaics: string[]): string[] {
  const excluded = new Set(excludedNaics);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const trade of workTypes) {
    for (const code of WORK_TYPE_TO_NAICS[trade] ?? []) {
      if (excluded.has(code) || seen.has(code)) continue;
      seen.add(code);
      out.push(code);
    }
  }
  return out;
}

/**
 * Applies a WorkPicker change (trades and/or excluded codes) and recomputes
 * `filters.naics` from the result, keeping the two in sync in one place
 * rather than at each call site.
 */
export function applyWorkPickerChange(
  f: OpportunityFilters,
  next: { workTypes?: string[]; excludedNaics?: string[] },
): OpportunityFilters {
  const workTypes = next.workTypes ?? f.workTypes;
  const excludedNaics = next.excludedNaics ?? f.excludedNaics;
  return { ...f, workTypes, excludedNaics, naics: resolveNaicsSelection(workTypes, excludedNaics) };
}

// ─────────────────────────────────────────────────────────────────────────────
// LocationPicker city-id bridging — bare popCity strings only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps the backend city gazetteer's `{ city, count }` rows (from
 * `GET /opportunities/filters/cities`) into LocationPicker's `CityNode[]`,
 * using the BARE city name as both `id` and `label`. This is the bridging
 * point that keeps `filters.cities` a flat array of bare popCity strings end
 * to end: the live backend's popCity filter matches bare names (e.g.
 * "Houston"), never "City, ST" composites — so no composite id is
 * constructed here or anywhere downstream (onChange → onSetFilters →
 * toServerFilters's `location.cities`).
 */
export function cityRowsToNodes(rows: { city: string }[]): { id: string; label: string }[] {
  return rows.map((r) => ({ id: r.city, label: r.city }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Facet keys for chip removal
// ─────────────────────────────────────────────────────────────────────────────

export type MultiFacet =
  | "workTypes"
  | "states"
  | "cities"
  | "setAsides"
  | "dueWindow"
  | "naics"
  | "psc"
  | "noticeTypes"
  | "agencies"
  | "popStates"
  | "popCounties"
  | "popZips"
  | "vehicles";

export function removeValue(
  f: OpportunityFilters,
  facet: MultiFacet,
  value: string,
): OpportunityFilters {
  return { ...f, [facet]: f[facet].filter((v) => v !== value) };
}

export function addValue(
  f: OpportunityFilters,
  facet: MultiFacet,
  value: string,
): OpportunityFilters {
  if (f[facet].includes(value)) return f;
  return { ...f, [facet]: [...f[facet], value] };
}

export function setValues(
  f: OpportunityFilters,
  facet: MultiFacet,
  values: string[],
): OpportunityFilters {
  return { ...f, [facet]: values };
}

// ─────────────────────────────────────────────────────────────────────────────
// Counting active filters
// ─────────────────────────────────────────────────────────────────────────────

export function countActive(f: OpportunityFilters): number {
  let n = 0;
  // f.keyword is a vestigial field — nothing writes it anymore (the drawer's
  // keyword input now drives the real search, state.searchValue, directly)
  // and it was never sent to the server. Deliberately NOT counted here; kept
  // on the type only so old persisted saved-search filter objects still
  // type-check and load without runtime errors.
  n += f.workTypes.length;
  // excludedNaics is a subtractive trim within a selected work type, not a
  // positive filter of its own — deliberately NOT counted here.
  // f.naics is DERIVED from workTypes by the WorkPicker, so it must not be
  // counted again alongside workTypes (that double-counts every trade). Only
  // count naics when it's set WITHOUT a work type — i.e. a Hunter-suggested
  // naics value that the WorkPicker doesn't represent.
  if (f.naics.length && f.workTypes.length === 0) n++;
  if (f.states.length) n++;
  if (f.cities.length) n++;
  if (f.setAsides.length) n++;
  if (f.valueRange.min !== null || f.valueRange.max !== null) n++;
  if (f.dueWindow.length && !(f.dueWindow.length === 1 && f.dueWindow[0] === "any")) n++;
  if (f.status !== "active") n++;
  if (f.psc.length) n++;
  if (f.noticeTypes.length) n++;
  if (f.agencies.length) n++;
  if (f.popStates.length || f.popCounties.length || f.popZips.length) n++;
  if (f.postedWithin != null) n++;
  if (f.vehicles.length) n++;
  if (
    f.toggles.excludeNoBid ||
    f.toggles.favoritesOnly ||
    f.toggles.civilianOnly ||
    f.toggles.dodOnly
  )
    n++;
  return n;
}

// Set-aside id → matcher
const SET_ASIDE_LABELS: Record<string, RegExp> = {
  // VOSB chip subsumes SDVOSB (SDVOSB⊂VOSB), so match both.
  VOSB: /vosb/i,
  SB: /small business|total small business|\bsb\b/i,
  "8A": /\b8\(a\)|\b8a\b/i,
  WOSB: /wosb|edwosb/i,
  HUBZone: /hubzone/i,
  NATIVE_TRIBAL: /indian|tribal|isbee|\bIEE\b/i,
  FULL_OPEN: /full[- ]?and[- ]?open|full[ &]+open|open competition/i,
};

// Agency id (hierarchical) → matchers against o.agency + o.subAgency
const AGENCY_MATCHERS: Record<string, RegExp> = {
  "dod.army.usace.wilmington": /usace.*wilmington|wilmington district/i,
  "dod.army.usace.savannah": /usace.*savannah|savannah district/i,
  "dod.army.fort_bragg": /fort bragg|bragg dpw/i,
  "va.nco6.fayetteville": /\bva\b.*fayetteville|nco 6/i,
  "dod.navy.camp_lejeune": /camp lejeune|lejeune|navfac/i,
  "dod.army": /\barmy\b|usace/i,
  "dod.navy": /\bnavy\b|navfac|marine|mcas|mcb/i,
  "dod.air_force": /\bair force\b|afb/i,
  va: /\bva\b|veterans/i,
  gsa: /\bgsa\b/i,
  dod: /\barmy\b|\bnavy\b|usace|afb|marine|navfac/i,
};

// Notice-type id → matcher run against `${title} ${workType}`, where workType
// carries the HigherGov oppType.description (e.g. "Solicitation", "Synopsis
// Solicitation", "Presolicitation"). \b stops "solicitation" matching inside
// "presolicitation"; the lookbehind keeps a plain "Solicitation" distinct from
// "Synopsis Solicitation" so the two facets stay mutually exclusive.
const NOTICE_TYPE_RX: Record<string, RegExp> = {
  // DEMO: the sample opportunities state their type as "Request for Quote", "Request for
  // Proposal" or "Invitation for Bid". They are all solicitations, and RFQ and RFP are
  // also facets of their own, so the Notice type options show real choices.
  solicitation:
    /(?<!synopsis[\s/])\bsolicitation\b|\brfp\b|\bifb\b|\brfq\b|request for (proposal|quote)|invitation for bid/i,
  rfp: /\brfp\b|request for proposal/i,
  rfq: /\brfq\b|request for quote/i,
  combined: /synopsis solicitation|combined synopsis/i,
  sources_sought: /sources sought/i,
  presol: /presol/i,
  special: /special notice/i,
};

// Contract-vehicle id → best-effort matcher against title + work type.
// HigherGov opportunities carry no structured vehicle field, so this mirrors
// the keyword approach used for work types and notice types above.
const VEHICLE_RX: Record<string, RegExp> = {
  idiq: /\bidiq\b|id\/iq|indefinite[- ]delivery|indefinite[- ]quantity/i,
  bpa: /\bbpa\b|blanket purchase/i,
  matoc: /\bmatoc\b|\bsatoc\b|multiple[- ]award task order|task order contract/i,
  future: /recompete|re-compete|upcoming|presol|pre[- ]solicitation|sources sought/i,
};

// Posted-within id → max age in days. "any" is handled separately (no bound).
// ─────────────────────────────────────────────────────────────────────────────
// Evaluator
// ─────────────────────────────────────────────────────────────────────────────

function stateFromLocation(loc: string): string {
  // location is "City, ST" (e.g. "Fayetteville, NC") or a bare "ST" when the
  // opp has no city. Take the last comma-separated segment and accept it only
  // if it's a 2-letter state code, so full names or non-US codes like "MX-SON"
  // don't false-match.
  const last = (loc.split(",").pop() ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(last) ? last : "";
}

/** The due windows a date `daysOut` days away falls in. The windows are cumulative. */
export function dueBucket(daysOut: number): string[] {
  const out: string[] = ["any"];
  // Lower bound keeps already-closed opps (negative days) out of the
  // "closing soon" windows.
  if (daysOut >= 0 && daysOut <= 7) out.push("this_week");
  if (daysOut >= 0 && daysOut <= 14) out.push("2_weeks");
  if (daysOut >= 0 && daysOut <= 30) out.push("30_days");
  if (daysOut >= 60) out.push("60_plus");
  return out;
}

/**
 * The opportunity fields the evaluator reads. Satisfied by both the mock
 * `Opportunity` shape (valueLow/valueHigh, closesAt) and the live
 * `CardOpportunity` shape (valEstLow/valEstHigh, daysUntilClose) — the value
 * and due-date fields are optional because the two shapes name them differently.
 */
export type EvaluableOpp = {
  scope: OppScope;
  category?: OppCategory;
  agency: string;
  subAgency?: string;
  title: string;
  workType: string;
  location: string;
  setAside?: string;
  naicsCode?: string;
  zip?: string;
  postedAt?: string | null;
  valueLow?: number;
  valueHigh?: number;
  valEstLow?: number | null;
  valEstHigh?: number | null;
  closesAt?: string;
  daysUntilClose?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Facet checks shared with the smart-list evaluator — toggles,
// agency, vehicles, popZips, postedWithin. These now duplicate
// filtering the server already does for the ranked/preview feeds, but
// `evaluateFilters` (used by the fully client-side smart-list path) still
// needs them.
// ─────────────────────────────────────────────────────────────────────────────

function residualToggles(f: OpportunityFilters, o: EvaluableOpp): boolean {
  const isDod = AGENCY_MATCHERS["dod"].test(`${o.agency} ${o.subAgency ?? ""}`);
  if (f.toggles.dodOnly && !isDod) return false;
  if (f.toggles.civilianOnly && isDod) return false;
  return true;
}

function residualAgency(f: OpportunityFilters, o: EvaluableOpp): boolean {
  // Contract-lane only (CAT-7). Options are data-driven from the loaded
  // opportunities, so the stored values are real agency names, not ids.
  const contractLane = (o.category ?? "contract") === "contract";
  if (f.agencies.length && contractLane) {
    return f.agencies.includes(o.agency);
  }
  return true;
}

function residualVehicles(f: OpportunityFilters, o: EvaluableOpp): boolean {
  if (!f.vehicles.length) return true;
  const hay = `${o.title} ${o.workType}`;
  return f.vehicles.some((id) => VEHICLE_RX[id]?.test(hay));
}

function residualZip(f: OpportunityFilters, o: EvaluableOpp): boolean {
  if (!f.popZips.length) return true;
  return !!o.zip && f.popZips.includes(o.zip);
}

/** True when a record `ageDays` old is inside "posted in the last `days` days".
 *  A negative age is a posted date in the future, and it is outside the window. */
export function inPostedWindow(ageDays: number, days: number): boolean {
  return !(ageDays < 0 || ageDays > days);
}

function residualPostedWithin(f: OpportunityFilters, o: EvaluableOpp): boolean {
  if (f.postedWithin == null) return true;
  if (!o.postedAt) return false;
  const ageDays = (Date.now() - new Date(o.postedAt).getTime()) / 86400000;
  return inPostedWindow(ageDays, f.postedWithin);
}

/** True when the estimate `low` to `high` overlaps the range. If the estimate has only
 *  one value, that value is used for both ends. An estimate with no value passes. */
export function valueRangeOverlaps(
  range: { min: number | null; max: number | null },
  low: number | null,
  high: number | null,
): boolean {
  const top = high ?? low;
  const bottom = low ?? high;
  if (range.min !== null && top !== null && top < range.min) return false;
  if (range.max !== null && bottom !== null && bottom > range.max) return false;
  return true;
}

export function evaluateFilters<T extends EvaluableOpp>(f: OpportunityFilters, opps: T[]): T[] {
  return opps.filter((o) => {
    // Undefined normalizes to "contract".
    const category = o.category ?? "contract";

    // Contract-lane preferences (CAT-7): agency, contract-size value range, and
    // set-aside defaults apply to contracts only — a $28K DLA product buy isn't a
    // "$250K–$1M contract", and grants have no set-aside to filter on.
    const contractLane = category === "contract";

    // Civilian / DoD toggles
    if (!residualToggles(f, o)) return false;

    // States (OR)
    if (f.states.length) {
      const st = stateFromLocation(o.location);
      if (!f.states.includes(st)) return false;
    }

    // Set-asides (OR; FULL_OPEN matches when o.setAside is missing too).
    // Contract-lane, but a non-contract opp that DOES carry a set-aside is still filtered.
    if (f.setAsides.length && (contractLane || o.setAside)) {
      const sa = o.setAside ?? "";
      const hit = f.setAsides.some((id) => {
        if (id === "FULL_OPEN" && !sa) return true;
        return SET_ASIDE_LABELS[id]?.test(sa);
      });
      if (!hit) return false;
    }

    // Value range (overlap test) — contract-lane only. Live cards carry
    // valEstLow/valEstHigh; mock opps carry valueLow/valueHigh. A lone estimate
    // is treated as a point value so a half-open range still filters sensibly.
    if (contractLane) {
      const low = o.valEstLow ?? o.valueLow ?? null;
      const high = o.valEstHigh ?? o.valueHigh ?? null;
      if (!valueRangeOverlaps(f.valueRange, low, high)) return false;
    }

    // Due window (OR; "any" always matches). Live cards carry a precomputed
    // daysUntilClose; mock opps carry an ISO closesAt.
    if (f.dueWindow.length && !f.dueWindow.includes("any")) {
      const daysOut = o.daysUntilClose ?? (o.closesAt ? daysUntil(o.closesAt) : NaN);
      const buckets = dueBucket(daysOut);
      const hit = f.dueWindow.some((id) => buckets.includes(id));
      if (!hit) return false;
    }

    // NAICS (OR)
    if (f.naics.length) {
      if (!o.naicsCode || !f.naics.includes(o.naicsCode)) return false;
    }

    // Agencies (OR — exact match against the opportunity's agency name).
    if (!residualAgency(f, o)) return false;

    // Notice types (OR; best-effort against mock)
    if (f.noticeTypes.length) {
      const hay = `${o.title} ${o.workType}`;
      const hit = f.noticeTypes.some((id) => NOTICE_TYPE_RX[id]?.test(hay));
      if (!hit) return false;
    }

    // PoP states (OR)
    if (f.popStates.length) {
      const st = stateFromLocation(o.location);
      if (!f.popStates.includes(st)) return false;
    }

    // PoP ZIP (OR; an opp with no zip can't satisfy an active zip filter)
    if (!residualZip(f, o)) return false;

    // Posted within (recency relative to real "today"; "any" always matches).
    // Opportunities with no posted date can't satisfy a bounded window.
    if (!residualPostedWithin(f, o)) return false;

    // Contract vehicles (OR; best-effort keyword match against title + work type)
    if (!residualVehicles(f, o)) return false;

    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-authoritative filter translation — maps the panel's OpportunityFilters
// state to the backend's ServerFilters/ServerSort shape (see discoverApi.ts).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drops a `categories` key from filters that arrive from outside the menu,
 * such as a search saved when the menu still had an opportunity-type filter.
 * The opportunities page holds contracts only, so it has no type filter.
 * Returns the same object when there is no such key.
 */
export function withoutCategories<T extends object>(f: T): Omit<T, "categories"> {
  if (!("categories" in f)) return f;
  const rest: Record<string, unknown> = { ...f };
  delete rest.categories;
  return rest as Omit<T, "categories">;
}

/**
 * Translates panel filter state into the server request shape. Every facet is
 * now filtered server-side on both the ranked (`/discover/v2`) and preview
 * (`/opportunities/preview`) paths — including agency,
 * contract vehicles, PSC, PoP ZIP, posted-within and the dod/civilian toggles
 * — so nothing is left for a client-side residual layer.
 *
 * No `verdict` is ever emitted: the feed shows every match, and omitting the
 * field is what resolves server-side to the whole matched set (tier != low).
 */
export function toServerFilters(
  f: OpportunityFilters,
  sort: SortKey,
): { filters: ServerFilters; sort: ServerSort } {
  const states = [...new Set([...f.states, ...f.popStates])];
  const cities = f.cities;
  const dueWindow = f.dueWindow.filter((w) => w !== "any");

  const filters: ServerFilters = {
    ...(f.naics.length ? { naicsCodes: f.naics } : {}),
    ...(f.setAsides.length ? { setAsides: f.setAsides } : {}),
    ...(states.length || cities.length
      ? { location: { ...(states.length ? { states } : {}), ...(cities.length ? { cities } : {}) } }
      : {}),
    ...(f.noticeTypes.length ? { noticeTypes: f.noticeTypes } : {}),
    ...(dueWindow.length ? { dueWindow } : {}),
    ...(f.valueRange.min !== null || f.valueRange.max !== null ? { valueRange: f.valueRange } : {}),
    ...(f.agencies.length ? { agencies: f.agencies } : {}),
    ...(f.vehicles.length ? { vehicles: f.vehicles } : {}),
    ...(f.psc.length ? { psc: f.psc } : {}),
    ...(f.popZips.length ? { popZips: f.popZips } : {}),
    ...(f.postedWithin != null ? { postedWithin: f.postedWithin } : {}),
    ...(f.toggles.dodOnly ? { dodOnly: true } : {}),
    ...(f.toggles.civilianOnly ? { civilianOnly: true } : {}),
  };

  return { filters, sort: SERVER_SORTS[sort] };
}

/** The server field and direction for each sort key. 'newest' is sorted
 *  server-side on both the ranked and preview paths. */
const SERVER_SORTS: Record<SortKey, ServerSort> = {
  match: { field: "match", order: "desc" },
  newest: { field: "newest", order: "desc" },
  deadline: { field: "deadline", order: "asc" },
  timeLeft: { field: "deadline", order: "desc" },
  value: { field: "value", order: "desc" },
  smallest: { field: "value", order: "asc" },
  saved: { field: "saved", order: "desc" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Available facet values — which filter options actually match at least one
// opportunity in the given set. Uses the exact same matcher tables as
// evaluateFilters so "available" stays in sync with what filtering would do.
// ─────────────────────────────────────────────────────────────────────────────

export interface AvailableFacets {
  naics: Set<string>;
  noticeTypes: Set<string>;
  agencies: Set<string>;
  states: Set<string>;
  zips: Set<string>;
}

type FacetSourceOpp = {
  naicsCode?: string;
  category?: OppCategory;
  title: string;
  workType: string;
  agency: string;
  subAgency?: string;
  location: string;
  zip?: string;
};

export function computeAvailableFacets(opps: FacetSourceOpp[]): AvailableFacets {
  const naics = new Set<string>();
  const noticeTypes = new Set<string>();
  const agencies = new Set<string>();
  const states = new Set<string>();
  const zips = new Set<string>();

  for (const o of opps) {
    if (o.naicsCode) naics.add(o.naicsCode);
    if (o.zip) zips.add(o.zip);

    const noticeHay = `${o.title} ${o.workType}`;
    for (const [id, rx] of Object.entries(NOTICE_TYPE_RX)) {
      if (rx.test(noticeHay)) noticeTypes.add(id);
    }

    if (o.agency) agencies.add(o.agency);

    const st = stateFromLocation(o.location);
    if (st) states.add(st);
  }

  return { naics, noticeTypes, agencies, states, zips };
}

// ─────────────────────────────────────────────────────────────────────────────
// SegmentedControl bridging helpers — dueWindow and postedWithin are modeled
// as an array / a number respectively (see the `OpportunityFilters` type
// above), but the drawer now represents each as a single-value
// <SegmentedControl>. These pure helpers translate between the segmented
// control's one selected id and the model's underlying shape, so
// toServerFilters and the rest of the model never change.
// ─────────────────────────────────────────────────────────────────────────────

/** Segment ids for the due-window SegmentedControl, in display order
 *  ("any" first/leftmost, then ascending windows). */
export const DUE_WINDOW_SEGMENT_IDS = [
  "any",
  "this_week",
  "2_weeks",
  "30_days",
  "60_plus",
] as const;

/**
 * Maps a due-window SegmentedControl selection to `filters.dueWindow`:
 * "any" → [] (matches everything, same as the empty/omitted state
 * toServerFilters already handles), any specific id → a one-element array.
 */
export function dueWindowSegmentToArray(segmentId: string): string[] {
  return segmentId === "any" ? [] : [segmentId];
}

/**
 * Inverse of `dueWindowSegmentToArray` — reads the current segment id back
 * out of `filters.dueWindow` for the SegmentedControl's `value` prop. An
 * empty array or an array whose only entry is "any" both read as "any".
 */
export function dueWindowArrayToSegment(dueWindow: string[]): string {
  const specific = dueWindow.filter((w) => w !== "any");
  return specific[0] ?? "any";
}

/** Segment ids for the posted-within SegmentedControl, in display order
 *  ("any" first/leftmost, then ascending day counts). */
export const POSTED_WITHIN_SEGMENT_IDS = ["any", "1", "3", "7", "30"] as const;

/**
 * Maps a posted-within SegmentedControl selection (a day-number string, or
 * "any") to `filters.postedWithin`: "any" → null, otherwise the parsed
 * number of days — the same shape toServerFilters already emits verbatim.
 */
export function postedWithinSegmentToDays(segmentId: string): number | null {
  if (segmentId === "any") return null;
  const n = Number(segmentId);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Inverse of `postedWithinSegmentToDays` — reads the current segment id back
 * out of `filters.postedWithin` for the SegmentedControl's `value` prop.
 * A day count that doesn't match one of the fixed presets (e.g. a value set
 * by an older control) falls back to "any" rather than showing a false match.
 */
export function postedWithinDaysToSegment(postedWithin: number | null): string {
  if (postedWithin == null) return "any";
  const s = String(postedWithin);
  return (POSTED_WITHIN_SEGMENT_IDS as readonly string[]).includes(s) ? s : "any";
}

// ─────────────────────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────────────────────

export type Preset = {
  id: string;
  label: string;
  description: string;
  apply: (base: OpportunityFilters) => OpportunityFilters;
};

/**
 * Builds the "Quick starts" presets for the current user. The first preset is
 * derived from the user's Success Center profile (the NAICS, set-asides and
 * states tagged in `base.prefilled`); the rest are persona-neutral and apply to
 * any firm. When the profile has no tagged facets, only the neutral presets show.
 */
export function buildPresets(base: OpportunityFilters): Preset[] {
  const naics = prefilledValues(base, "naics");
  const setAsides = prefilledValues(base, "setAsides");
  const states = prefilledValues(base, "states");
  const cities = prefilledValues(base, "cities");

  const presets: Preset[] = [];

  if (naics.length || setAsides.length || states.length || cities.length) {
    presets.push({
      id: "profile-lane",
      label: "Your profile lane",
      description: "NAICS, set-asides, states and cities from your Success Center profile.",
      apply: (b) => ({ ...b, naics, setAsides, states, cities }),
    });
  }

  presets.push(
    {
      id: "early-signals",
      label: "Early signals (Sources Sought)",
      description: "Get in before the bid drops.",
      apply: (b) => ({ ...b, noticeTypes: ["sources_sought"], dueWindow: ["any"] }),
    },
    {
      id: "closing-30",
      label: "Closing in 30 days",
      description: "Opportunities with a response deadline inside a month.",
      apply: (b) => ({ ...b, dueWindow: ["30_days"] }),
    },
    {
      id: "new-this-week",
      label: "New this week",
      description: "Posted in the last 7 days.",
      apply: (b) => ({ ...b, postedWithin: 7 }),
    },
  );

  return presets;
}
