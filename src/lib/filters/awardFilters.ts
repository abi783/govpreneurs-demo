// The Awards filter panel: what each filter is and the words a member reads.
//
// Seven categories: kind of work · place · buyer · how it was bought · size · small firms ·
// dates. The panel holds every structured field of an award. Free text (city, office,
// winner, contract number) goes in the search box, not here.
// Every number and date is an open range; the buttons only fill the boxes.
//
// PRODUCTION mapping to hg_awards fields. The indexed fields narrow the query first. The
// fields with no index apply after that match, on the smaller set.
//   Kind of work  → naics_code (indexed)
//   Service       → psc_code (no index)
//   Place         → primary_place_of_performance_state_code (indexed)
//   Buyer         → awarding_agency.agency_key (indexed)
//   Who could bid → type_of_set_aside (no index)
//   Competed      → extent_competed (no index)
//   Bid count     → number_of_offers_received (no index)
//   Price type    → type_of_contract_pricing (no index)
//   Size          → total_dollars_obligated (indexed)
//   Small firms   → the subcontracting plan field (no index); the winner's sub bench
//   Dates         → awardedAtProxy, period_of_performance_current_end_date (indexed)

import {
  ANY_RANGE,
  NEXT_PRESETS,
  PAST_PRESETS,
  isAnyRange,
  rangeWords,
  readRange,
  type Range,
  type RangePreset,
} from "./range";
import { readStates, statesText } from "./states";
import { readStrings } from "./read";
import { plainNaics, plainPricing, plainPsc } from "../vocab/plainCodes";
import { SET_ASIDE_CHOICES, type SetAsideId } from "./smallBusinessPrograms";
import type { AwardFacets } from "../awardsApi";

export type WorkChoice = "mine" | "any" | "pick";
export type CompetedChoice = "any" | "yes" | "no";
export type BuyerChoice = "all" | "defense" | "civilian";
export type WhoCouldBid = SetAsideId;
export type AwardSection = "work" | "where" | "buyer" | "bought" | "size" | "firms" | "time";

export interface AwardFilters {
  work: WorkChoice;
  /** NAICS codes. Used only when `work` is "pick". */
  naics: string[];
  /** PSC codes. */
  psc: string[];
  /** The states of the work. Empty means all of the US. A new visit starts with hers. */
  states: string[];
  buyer: BuyerChoice;
  /** Agency names. */
  agencies: string[];
  who: WhoCouldBid[];
  competed: CompetedChoice;
  bids: Range;
  /** type_of_contract_pricing values, as the record writes them. */
  pricing: string[];
  size: Range;
  /** Only awards where the winner must file a small business plan. */
  subPlan: boolean;
  /** Only awards whose winner has small firms on record. */
  hasSubs: boolean;
  awarded: Range;
  ends: Range;
}

/** What a member lands on: no filter on, every kind of work, all of the US (decided 19 Nov 2026). */
export const DEFAULT_AWARD_FILTERS: AwardFilters = {
  work: "any",
  naics: [],
  psc: [],
  states: [],
  buyer: "all",
  agencies: [],
  who: [],
  competed: "any",
  bids: ANY_RANGE,
  pricing: [],
  size: ANY_RANGE,
  subPlan: false,
  hasSubs: false,
  awarded: ANY_RANGE,
  ends: ANY_RANGE,
};

/** "Clear all" means nothing on — every kind of work, everywhere. */
export const NO_AWARD_FILTERS: AwardFilters = {
  ...DEFAULT_AWARD_FILTERS,
  work: "any",
};

/** Every FPDS set-aside, in nine choices. See smallBusinessPrograms.ts. */
export const WHO_COULD_BID = SET_ASIDE_CHOICES;

// Each preset label is the same as the words its chip says, so the two always agree.
export const SIZE_PRESETS: RangePreset[] = [
  { label: "Up to $500K", range: { min: null, max: 500_000, unit: "days" } },
  { label: "$500K to $5M", range: { min: 500_000, max: 5_000_000, unit: "days" } },
  { label: "$5M to $25M", range: { min: 5_000_000, max: 25_000_000, unit: "days" } },
  { label: "$25M or more", range: { min: 25_000_000, max: null, unit: "days" } },
];

export const BID_PRESETS: RangePreset[] = [
  { label: "1 to 3", range: { min: 1, max: 3, unit: "days" } },
  { label: "4 to 6", range: { min: 4, max: 6, unit: "days" } },
  { label: "7 or more", range: { min: 7, max: null, unit: "days" } },
];

export const AWARDED_PRESETS = PAST_PRESETS;
export const ENDS_PRESETS = NEXT_PRESETS;

/** The name of each code in the filter choices, so a chip can say "Janitorial services". */
export type FacetLabels = {
  naics: Map<string, string>;
  psc: Map<string, string>;
  agencies?: Map<string, string>;
};

export const facetLabels = (
  f: Pick<AwardFacets, "naics" | "psc"> & Partial<Pick<AwardFacets, "agencies">>,
): FacetLabels => ({
  naics: new Map(f.naics.map((x) => [x.id, x.label])),
  psc: new Map(f.psc.map((x) => [x.id, x.label])),
  agencies: new Map((f.agencies ?? []).map((x) => [x.id, x.label])),
});

export interface AwardChip {
  key: string;
  label: string;
  section: AwardSection;
  remove: (f: AwardFilters) => AwardFilters;
}

/**
 * The active filters as removable chips, in the same words as the controls. `labels` gives
 * the official name of each picked code. Without it, a chip uses the plain name list only.
 */
export function awardChips(f: AwardFilters, labels?: FacetLabels): AwardChip[] {
  const out: AwardChip[] = [];
  if (f.work === "mine") {
    out.push({
      key: "work",
      label: "My work",
      section: "work",
      remove: (x) => ({ ...x, work: "any" }),
    });
  }
  if (f.work === "pick") {
    for (const code of f.naics) {
      out.push({
        key: `naics-${code}`,
        label: plainNaics(code, labels?.naics.get(code)),
        section: "work",
        remove: (x) => {
          const naics = x.naics.filter((v) => v !== code);
          return { ...x, naics, work: naics.length ? x.work : "any" };
        },
      });
    }
  }
  for (const code of f.psc) {
    out.push({
      key: `psc-${code}`,
      label: `Service: ${plainPsc(code, labels?.psc.get(code))}`,
      section: "work",
      remove: (x) => ({ ...x, psc: x.psc.filter((v) => v !== code) }),
    });
  }
  if (f.states.length) {
    out.push({
      key: "states",
      label: `Where: ${statesText(f.states)}`,
      section: "where",
      remove: (x) => ({ ...x, states: [] }),
    });
  }
  if (f.buyer !== "all") {
    out.push({
      key: "buyer",
      label: f.buyer === "defense" ? "Military buyers" : "Non-military buyers",
      section: "buyer",
      remove: (x) => ({ ...x, buyer: "all" }),
    });
  }
  for (const a of f.agencies) {
    out.push({
      key: `agency-${a}`,
      label: `Buyer: ${labels?.agencies?.get(a) ?? a}`,
      section: "buyer",
      remove: (x) => ({ ...x, agencies: x.agencies.filter((v) => v !== a) }),
    });
  }
  for (const w of f.who) {
    const label = WHO_COULD_BID.find((x) => x.id === w)?.label ?? w;
    out.push({
      key: `who-${w}`,
      label,
      section: "bought",
      remove: (x) => ({ ...x, who: x.who.filter((v) => v !== w) }),
    });
  }
  if (f.competed !== "any") {
    out.push({
      key: "competed",
      label: f.competed === "yes" ? "Competed" : "Not competed",
      section: "bought",
      remove: (x) => ({ ...x, competed: "any" }),
    });
  }
  if (!isAnyRange(f.bids)) {
    out.push({
      key: "bids",
      label: `Bids: ${rangeWords(f.bids, "count")}`,
      section: "bought",
      remove: (x) => ({ ...x, bids: ANY_RANGE }),
    });
  }
  for (const p of f.pricing) {
    out.push({
      key: `pricing-${p}`,
      label: `Price: ${plainPricing(p)}`,
      section: "bought",
      remove: (x) => ({ ...x, pricing: x.pricing.filter((v) => v !== p) }),
    });
  }
  if (!isAnyRange(f.size)) {
    out.push({
      key: "size",
      label: `Paid: ${rangeWords(f.size, "money")}`,
      section: "size",
      remove: (x) => ({ ...x, size: ANY_RANGE }),
    });
  }
  if (f.subPlan) {
    out.push({
      key: "subPlan",
      label: "Must plan for small firms",
      section: "firms",
      remove: (x) => ({ ...x, subPlan: false }),
    });
  }
  if (f.hasSubs) {
    out.push({
      key: "hasSubs",
      label: "Used small firms",
      section: "firms",
      remove: (x) => ({ ...x, hasSubs: false }),
    });
  }
  if (!isAnyRange(f.awarded)) {
    out.push({
      key: "awarded",
      label: `Won ${rangeWords(f.awarded, "time", "ago")}`,
      section: "time",
      remove: (x) => ({ ...x, awarded: ANY_RANGE }),
    });
  }
  if (!isAnyRange(f.ends)) {
    out.push({
      key: "ends",
      label: `Ends ${rangeWords(f.ends, "time", "ahead")}`,
      section: "time",
      remove: (x) => ({ ...x, ends: ANY_RANGE }),
    });
  }
  return out;
}

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

/** Reads the filter panel state back from the URL. Anything malformed falls back cleanly. */
export function readAwardFilters(input: unknown): AwardFilters | undefined {
  if (!input || typeof input !== "object") return undefined;
  const o = input as Record<string, unknown>;
  const who = Array.isArray(o.who)
    ? o.who.filter((w): w is WhoCouldBid => WHO_COULD_BID.some((x) => x.id === w))
    : [];
  return {
    work: pick(o.work, ["mine", "any", "pick"] as const, "any"),
    naics: readStrings(o.naics),
    psc: readStrings(o.psc),
    states: readStates(o.states),
    buyer: pick(o.buyer, ["all", "defense", "civilian"] as const, "all"),
    agencies: readStrings(o.agencies),
    who: [...new Set(who)],
    competed: pick(o.competed, ["any", "yes", "no"] as const, "any"),
    bids: readRange(o.bids),
    pricing: readStrings(o.pricing),
    size: readRange(o.size),
    subPlan: o.subPlan === true,
    hasSubs: o.hasSubs === true,
    awarded: readRange(o.awarded),
    ends: readRange(o.ends),
  };
}
