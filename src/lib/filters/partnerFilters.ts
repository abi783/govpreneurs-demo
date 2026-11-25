// The Find partners filter panel: what each filter is and the words a member reads.
//
// Seven categories: their work · where · buyers · small firms · size and activity ·
// certifications · hidden companies. The panel covers every structured field of a
// company. Free text (a name, a city, a small firm's name, a UEI) goes in the search box.
// Every number and date is an open range; the buttons only fill the boxes.
//
// All filtering runs client-side on the precomputed partner list (typically a few
// hundred companies per member). The list is small enough that this is fast. The pick
// lists come from the same list, so a member never picks a value that finds nothing.
//
// PRODUCTION field mapping for each filter:
//   Match         → trade.proximity (direct / adjacent / tangential)
//   Verdict       → verdict (partner_play / competitor / recompete_watch)
//   Work they win → workTypes[].naics (PROPOSED)
//   Location      → geography.statesPerformed
//   Military      → buyers[].name here; production reads agency.isDefense per award
//   Buyers        → buyers[].name (PROPOSED)
//   Firms         → bench.distinctSubs
//   Repeat        → bench.repeatSubs
//   Trades hired  → tradesHired[].naics (PROPOSED, phase 2)
//   Trend         → bench.trend
//   Mentor        → runsMentorProgram (PROPOSED, hg_awardee_mp join)
//   Size          → economics.medianAwardUsd
//   Last won      → economics.lastAwardAt
//   Jobs          → economics.awardCount
//   Next job ends → the earliest future recentJobs[].endsAt, else economics.recompeteMonthsOut
//   Certifications→ certifications (PROPOSED, hg_awardees)

import type { PrimeCandidate, PartnerVerdict } from "../partnersApi";
import {
  ANY_RANGE,
  NEXT_PRESETS,
  PAST_PRESETS,
  inRange,
  isAnyRange,
  rangeWords,
  readRange,
  type Range,
  type RangePreset,
} from "./range";
import { readStates, statesText } from "./states";
import { readStrings } from "./read";
import { plainNaics } from "../vocab/plainCodes";
import { CERT_CHOICES, certIds } from "./smallBusinessPrograms";

export type MatchChoice = "both" | "exact" | "close";
export type PartnerBuyerKind = "all" | "defense" | "civilian";
export type BenchTrend = "growing" | "steady" | "declining";
/** A certification choice id from smallBusinessPrograms.ts. */
export type CertId = string;
export type PartnerSection = "work" | "where" | "buyers" | "people" | "size" | "certs" | "hidden";

export interface PartnerFilters {
  match: MatchChoice;
  kinds: PartnerVerdict[];
  /** NAICS codes of the work they win. */
  workTypes: string[];
  /** The states they work in. Empty means all of the US. */
  states: string[];
  buyerKind: PartnerBuyerKind;
  /** Buyer (agency) names. */
  buyers: string[];
  firms: Range;
  repeat: Range;
  /** NAICS codes of the trades they hire. */
  trades: string[];
  trend: BenchTrend[];
  mentor: boolean;
  size: Range;
  lastWon: Range;
  jobs: Range;
  nextEnds: Range;
  certs: CertId[];
  /** Only certifications that the SBA checked (bus_type_info[].cert_flag). */
  certifiedOnly: boolean;
  showHidden: boolean;
}

export const NO_PARTNER_FILTERS: PartnerFilters = {
  match: "both",
  kinds: [],
  workTypes: [],
  states: [],
  buyerKind: "all",
  buyers: [],
  firms: ANY_RANGE,
  repeat: ANY_RANGE,
  trades: [],
  trend: [],
  mentor: false,
  size: ANY_RANGE,
  lastWon: ANY_RANGE,
  jobs: ANY_RANGE,
  nextEnds: ANY_RANGE,
  certs: [],
  certifiedOnly: false,
  showHidden: false,
};

export const KIND_CHOICES: { id: PartnerVerdict; label: string }[] = [
  { id: "partner_play", label: "Good match" },
  { id: "competitor", label: "They bid against you" },
  { id: "recompete_watch", label: "Jobs coming up again" },
];

export const FIRMS_PRESETS: RangePreset[] = [
  { label: "5 or more", range: { min: 5, max: null, unit: "days" } },
  { label: "10 or more", range: { min: 10, max: null, unit: "days" } },
  { label: "20 or more", range: { min: 20, max: null, unit: "days" } },
];

export const REPEAT_PRESETS: RangePreset[] = [
  { label: "1 or more", range: { min: 1, max: null, unit: "days" } },
  { label: "3 or more", range: { min: 3, max: null, unit: "days" } },
];

// Each preset label is the same as the words its chip says.
export const PARTNER_SIZE_PRESETS: RangePreset[] = [
  { label: "Up to $250K", range: { min: null, max: 250_000, unit: "days" } },
  { label: "$250K to $1M", range: { min: 250_000, max: 1_000_000, unit: "days" } },
  { label: "$1M to $10M", range: { min: 1_000_000, max: 10_000_000, unit: "days" } },
  { label: "$10M or more", range: { min: 10_000_000, max: null, unit: "days" } },
];

/** The same date shortcuts as Awards. */
export const LAST_WON_PRESETS = PAST_PRESETS;

export const TREND_CHOICES: { id: BenchTrend; label: string }[] = [
  { id: "growing", label: "Growing" },
  { id: "steady", label: "Steady" },
  { id: "declining", label: "Shrinking" },
];

export const JOBS_PRESETS: RangePreset[] = [
  { label: "2 or more", range: { min: 2, max: null, unit: "days" } },
  { label: "5 or more", range: { min: 5, max: null, unit: "days" } },
  { label: "10 or more", range: { min: 10, max: null, unit: "days" } },
];

export const NEXT_ENDS_PRESETS = NEXT_PRESETS;

const MS_DAY = 86_400_000;

/** Whole days from today to a date. The feed carries real dates, so this reads the real clock. */
const daysFromNow = (iso: string): number =>
  Math.round((new Date(iso).getTime() - Date.now()) / MS_DAY);

/** Days until the first of their jobs that has not ended. Null when we do not know. */
function nextJobEndsInDays(p: PrimeCandidate): number | null {
  const ahead = (p.recentJobs ?? [])
    .map((j) => (j.endsAt ? daysFromNow(j.endsAt) : null))
    .filter((d): d is number => d !== null && d >= 0);
  if (ahead.length) return Math.min(...ahead);
  const months = p.economics.recompeteMonthsOut;
  return months === null ? null : months * 30;
}

/** The same rule as the mock API. Production reads agency.isDefense on each award. */
const DEFENSE = /defense|army|navy|air force|marine|dla|dod|coast guard/i;

/** The certification id for a certification as hg_awardees writes it. */
/** One choice in a pick list. `detail` is the code and the company count. */
export interface PickItem {
  id: string;
  label: string;
  detail: string;
}

export interface PartnerPickLists {
  workTypes: PickItem[];
  buyers: PickItem[];
  trades: PickItem[];
}

export const NO_PICK_LISTS: PartnerPickLists = { workTypes: [], buyers: [], trades: [] };

const companies = (n: number) => (n === 1 ? "1 company" : `${n} companies`);

/** Builds the pick lists from the whole feed, most companies first. */
export function partnerPickLists(partners: PrimeCandidate[]): PartnerPickLists {
  const tally = (pairs: [id: string, label: string][][]) => {
    const m = new Map<string, { label: string; n: number }>();
    for (const one of pairs) {
      // A company counts once for each value, however many jobs it has.
      for (const [id, label] of new Map(one)) {
        const had = m.get(id);
        m.set(id, { label, n: (had?.n ?? 0) + 1 });
      }
    }
    return [...m].sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label));
  };
  const coded = (rows: [string, { label: string; n: number }][]): PickItem[] =>
    rows.map(([id, v]) => ({
      id,
      label: plainNaics(id, v.label),
      detail: `${id} · ${companies(v.n)}`,
    }));

  return {
    workTypes: coded(tally(partners.map((p) => (p.workTypes ?? []).map((w) => [w.naics, w.name])))),
    trades: coded(tally(partners.map((p) => (p.tradesHired ?? []).map((t) => [t.naics, t.name])))),
    // Buyer names are proper names, so they keep their own capitals.
    buyers: tally(partners.map((p) => buyerNames(p).map((b) => [b, b]))).map(([id, v]) => ({
      id,
      label: v.label,
      detail: companies(v.n),
    })),
  };
}

/** The buyers a company works for. The jobs list is the fallback for an older feed. */
const buyerNames = (p: PrimeCandidate): string[] =>
  p.buyers?.length
    ? p.buyers.map((b) => b.name)
    : [...new Set((p.recentJobs ?? []).map((j) => j.buyer))];

export interface PartnerChip {
  key: string;
  label: string;
  section: PartnerSection;
  remove: (f: PartnerFilters) => PartnerFilters;
}

/**
 * The active filters as removable chips. `lists` gives the plain names for the codes;
 * without it a chip shows the code.
 */
export function partnerChips(
  f: PartnerFilters,
  lists: PartnerPickLists = NO_PICK_LISTS,
): PartnerChip[] {
  const out: PartnerChip[] = [];
  const nameOf = (items: PickItem[], id: string) => items.find((i) => i.id === id)?.label ?? id;
  if (f.match !== "both") {
    out.push({
      key: "match",
      label: f.match === "exact" ? "Same work" : "Similar work",
      section: "work",
      remove: (x) => ({ ...x, match: "both" }),
    });
  }
  for (const k of f.kinds) {
    const label = KIND_CHOICES.find((x) => x.id === k)?.label ?? k;
    out.push({
      key: `kind-${k}`,
      label,
      section: "work",
      remove: (x) => ({ ...x, kinds: x.kinds.filter((v) => v !== k) }),
    });
  }
  for (const w of f.workTypes) {
    out.push({
      key: `wins-${w}`,
      label: `Wins: ${nameOf(lists.workTypes, w)}`,
      section: "work",
      remove: (x) => ({ ...x, workTypes: x.workTypes.filter((v) => v !== w) }),
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
  if (f.buyerKind !== "all") {
    out.push({
      key: "buyerKind",
      label: f.buyerKind === "defense" ? "Military buyers" : "Non-military buyers",
      section: "buyers",
      remove: (x) => ({ ...x, buyerKind: "all" }),
    });
  }
  for (const b of f.buyers) {
    out.push({
      key: `buyer-${b}`,
      label: `Buyer: ${b}`,
      section: "buyers",
      remove: (x) => ({ ...x, buyers: x.buyers.filter((v) => v !== b) }),
    });
  }
  if (!isAnyRange(f.firms)) {
    out.push({
      key: "firms",
      label: `Small firms used: ${rangeWords(f.firms, "count")}`,
      section: "people",
      remove: (x) => ({ ...x, firms: ANY_RANGE }),
    });
  }
  if (!isAnyRange(f.repeat)) {
    out.push({
      key: "repeat",
      label: `Used again: ${rangeWords(f.repeat, "count")}`,
      section: "people",
      remove: (x) => ({ ...x, repeat: ANY_RANGE }),
    });
  }
  for (const t of f.trades) {
    out.push({
      key: `hires-${t}`,
      label: `Hires: ${nameOf(lists.trades, t)}`,
      section: "people",
      remove: (x) => ({ ...x, trades: x.trades.filter((v) => v !== t) }),
    });
  }
  for (const t of f.trend) {
    const label = TREND_CHOICES.find((c) => c.id === t)?.label ?? t;
    out.push({
      key: `trend-${t}`,
      label: `Use of small firms: ${label.toLowerCase()}`,
      section: "people",
      remove: (x) => ({ ...x, trend: x.trend.filter((v) => v !== t) }),
    });
  }
  if (f.mentor) {
    out.push({
      key: "mentor",
      label: "Has a mentor program",
      section: "people",
      remove: (x) => ({ ...x, mentor: false }),
    });
  }
  if (!isAnyRange(f.size)) {
    out.push({
      key: "size",
      label: `Usual job: ${rangeWords(f.size, "money")}`,
      section: "size",
      remove: (x) => ({ ...x, size: ANY_RANGE }),
    });
  }
  if (!isAnyRange(f.lastWon)) {
    out.push({
      key: "lastWon",
      label: `Last won ${rangeWords(f.lastWon, "time", "ago")}`,
      section: "size",
      remove: (x) => ({ ...x, lastWon: ANY_RANGE }),
    });
  }
  if (!isAnyRange(f.jobs)) {
    out.push({
      key: "jobs",
      label: `Jobs on record: ${rangeWords(f.jobs, "count")}`,
      section: "size",
      remove: (x) => ({ ...x, jobs: ANY_RANGE }),
    });
  }
  if (!isAnyRange(f.nextEnds)) {
    out.push({
      key: "nextEnds",
      label: `Next job ends ${rangeWords(f.nextEnds, "time", "ahead")}`,
      section: "size",
      remove: (x) => ({ ...x, nextEnds: ANY_RANGE }),
    });
  }
  for (const c of f.certs) {
    const label = CERT_CHOICES.find((x) => x.id === c)?.label ?? c;
    out.push({
      key: `cert-${c}`,
      label,
      section: "certs",
      remove: (x) => ({ ...x, certs: x.certs.filter((v) => v !== c) }),
    });
  }
  if (f.certifiedOnly) {
    out.push({
      key: "certifiedOnly",
      label: "Checked certifications only",
      section: "certs",
      remove: (x) => ({ ...x, certifiedOnly: false }),
    });
  }
  if (f.showHidden) {
    out.push({
      key: "hidden",
      label: "Hidden companies shown",
      section: "hidden",
      remove: (x) => ({ ...x, showHidden: false }),
    });
  }
  return out;
}

/** Client-side filter predicate. */
export function passesPartnerFilters(p: PrimeCandidate, f: PartnerFilters): boolean {
  // Match (trade proximity)
  if (f.match === "exact" && p.trade.proximity !== "direct") return false;
  if (f.match === "close" && p.trade.proximity !== "adjacent") return false;

  // Kind (verdict)
  if (f.kinds.length > 0 && !f.kinds.includes(p.verdict)) return false;

  // Work they win
  if (f.workTypes.length > 0 && !(p.workTypes ?? []).some((w) => f.workTypes.includes(w.naics)))
    return false;

  // Location. No states means all of the US.
  if (f.states.length > 0 && !p.geography.statesPerformed.some((s) => f.states.includes(s)))
    return false;

  // Buyers. A company with both kinds of buyer passes both choices.
  // The feed does not carry buyers yet (prod AF-12: both choices gave 0 companies). A company
  // whose buyers we do not know is kept, not dropped, so the choice never empties the list.
  const buyers = buyerNames(p);
  if (buyers.length > 0) {
    // The stored kinds come from hg_agencies.defense_flag over ALL their agencies; the name rule
    // is only for a feed computed before they were stored.
    const kinds = p.buyerKinds?.length
      ? p.buyerKinds
      : buyers.map((b) => (DEFENSE.test(b) ? "defense" : "civilian"));
    if (f.buyerKind !== "all" && !kinds.includes(f.buyerKind)) return false;
    if (f.buyers.length > 0 && !buyers.some((b) => f.buyers.includes(b))) return false;
  }

  // Small firms hired
  if (!inRange(p.bench.distinctSubs, f.firms, "count")) return false;

  // Repeat hires
  if (!inRange(p.bench.repeatSubs, f.repeat, "count")) return false;

  // Trades they hire, and whether their use of small firms grows
  if (f.trades.length > 0 && !(p.tradesHired ?? []).some((t) => f.trades.includes(t.naics)))
    return false;
  if (f.trend.length > 0 && !f.trend.includes(p.bench.trend as BenchTrend)) return false;

  // Mentor-protégé
  if (f.mentor && p.runsMentorProgram !== true) return false;

  // Median award size
  if (!inRange(p.economics.medianAwardUsd, f.size, "money")) return false;

  // Last won (days ago)
  const lastWonDays = p.economics.lastAwardAt
    ? Math.max(0, -daysFromNow(p.economics.lastAwardAt))
    : null;
  if (!inRange(lastWonDays, f.lastWon, "time")) return false;

  // Jobs on record, and when the next job ends
  if (!inRange(p.economics.awardCount, f.jobs, "count")) return false;
  if (!inRange(nextJobEndsInDays(p), f.nextEnds, "time")) return false;

  // Certifications
  // With "SBA-certified only" on, only the types that the SBA checked count.
  const held = certIds(f.certifiedOnly ? p.sbaCertified : p.certifications);
  if (f.certs.length > 0 && !held.some((c) => f.certs.includes(c))) return false;
  if (f.certifiedOnly && held.length === 0) return false;

  return true;
}

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

const PARTNER_VERDICTS: PartnerVerdict[] = ["partner_play", "competitor", "recompete_watch"];
const TRENDS: BenchTrend[] = ["growing", "steady", "declining"];
const CERT_IDS = CERT_CHOICES.map((c) => c.id);

/** A list of short strings from the URL. See read.ts for the limits. */
const strings = readStrings;
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): T[] =>
  strings(v).filter((x): x is T => allowed.includes(x as T));

/** Reads the filter panel state back from the URL. Anything malformed falls back cleanly. */
export function readPartnerFilters(input: unknown): PartnerFilters {
  if (!input || typeof input !== "object") return NO_PARTNER_FILTERS;
  const o = input as Record<string, unknown>;
  const kinds = Array.isArray(o.kinds)
    ? o.kinds.filter((k): k is PartnerVerdict => PARTNER_VERDICTS.includes(k as PartnerVerdict))
    : [];
  return {
    match: pick(o.match, ["both", "exact", "close"] as const, "both"),
    kinds: [...new Set(kinds)],
    workTypes: strings(o.workTypes),
    states: readStates(o.states),
    buyerKind: pick(o.buyerKind, ["all", "defense", "civilian"] as const, "all"),
    buyers: strings(o.buyers),
    firms: readRange(o.firms),
    repeat: readRange(o.repeat),
    trades: strings(o.trades),
    trend: oneOf(o.trend, TRENDS),
    mentor: o.mentor === true,
    size: readRange(o.size),
    lastWon: readRange(o.lastWon),
    jobs: readRange(o.jobs),
    nextEnds: readRange(o.nextEnds),
    certs: oneOf(o.certs, CERT_IDS),
    certifiedOnly: o.certifiedOnly === true,
    showHidden: o.showHidden === true,
  };
}
