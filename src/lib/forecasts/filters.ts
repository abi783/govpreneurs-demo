// Filters and sort for the forecasts list, in the shape of the Opportunities menu:
// a few plain questions, each with live counts, and one sort. They live in the URL,
// so a filtered list can be shared and the back button keeps it.
//
// Every filter starts at "any", so the list a member lands on is the same with or
// without this menu (D-C1: nothing is hidden until the member chooses it).

import { dueBucket, inPostedWindow, valueRangeOverlaps } from "../opportunityFilters";
import { BOUGHT_BEFORE } from "./copy";
import {
  FORECASTS_TODAY,
  byBestFit,
  cityName,
  daysBetween,
  stateCode,
  type ScoredForecast,
} from "./engine";

export type WorkKind = "food" | "building" | "sites" | "other";
export type WhoKind = "small" | "undecided" | "program" | "not_shared";
export type SizeBucket = "any" | "under_250k" | "250k_1m" | "1m_5m" | "over_5m";
/** When the buyer expects to post the request for bids. Hunter's `dueWithin` values. */
export type ExpectedWindow = "this_week" | "2_weeks" | "30_days" | "60_plus";
export type ForecastSort = "match" | "soonest" | "newest" | "value";

export interface ForecastFilters {
  work: WorkKind[];
  place: "any" | "served";
  who: WhoKind[];
  size: SizeBucket;
  bought: "any" | "again" | "new";
  status: "any" | "open";
  /** Windows for the expected posting date. Any one of them passes. */
  expected: ExpectedWindow[];
  /** The lowest value of the range, in whole dollars. Null means no lower bound. */
  valueMin: number | null;
  /** The highest value of the range, in whole dollars. Null means no upper bound. */
  valueMax: number | null;
  /** USPS codes of the place of performance. Any one of them passes. */
  states: string[];
  /** City names of the place of performance, in any capital letters. Any one passes. */
  cities: string[];
  /** NAICS codes, 2 to 6 digits. A record passes only on an exact match. */
  naics: string[];
  /** Days back from FORECASTS_TODAY that the buyer published the record (postedOn).
   *  Null means any date. */
  postedWithin: number | null;
}

export const EMPTY_FILTERS: ForecastFilters = {
  work: [],
  place: "any",
  who: [],
  size: "any",
  bought: "any",
  status: "any",
  expected: [],
  valueMin: null,
  valueMax: null,
  states: [],
  cities: [],
  naics: [],
  postedWithin: null,
};

export const WORK_KINDS: WorkKind[] = ["food", "building", "sites", "other"];
export const WHO_KINDS: WhoKind[] = ["small", "undecided", "program", "not_shared"];
export const SIZE_BUCKETS: SizeBucket[] = ["any", "under_250k", "250k_1m", "1m_5m", "over_5m"];
export const EXPECTED_WINDOWS: ExpectedWindow[] = ["this_week", "2_weeks", "30_days", "60_plus"];
export const SORTS: ForecastSort[] = ["match", "soonest", "newest", "value"];
/** The day counts the menu offers for "posted in the last". The URL takes any count. */
export const POSTED_WITHIN_CHOICES: number[] = [7, 14, 30, 90];

/** The kind of work, from the industry code the buyer chose. */
export function workKindOf(f: ScoredForecast): WorkKind {
  const code = f.record.naicsCode ?? "";
  if (/^(722|311|624210)/.test(code)) return "food";
  if (/^(236|237|238|5413)/.test(code)) return "building";
  if (/^561/.test(code)) return "sites";
  return "other";
}

export function whoKindOf(f: ScoredForecast): WhoKind {
  switch (f.whoMayBid.kind) {
    case "small_business":
      return "small";
    case "undetermined":
      return "undecided";
    case "program":
    case "program_one":
      return "program";
    default:
      return "not_shared";
  }
}

/** The top of the buyer's estimate. A forecast with no estimate has no size. */
function valueOf(f: ScoredForecast): number | null {
  return f.record.valHigh ?? f.record.valLow ?? null;
}

export function sizeOf(f: ScoredForecast): Exclude<SizeBucket, "any"> | null {
  const v = valueOf(f);
  if (v == null) return null;
  if (v < 250_000) return "under_250k";
  if (v <= 1_000_000) return "250k_1m";
  if (v <= 5_000_000) return "1m_5m";
  return "over_5m";
}

function boughtOf(f: ScoredForecast): "again" | "new" | null {
  if (f.boughtBefore?.text === BOUGHT_BEFORE.again.text) return "again";
  if (f.boughtBefore?.text === BOUGHT_BEFORE.isNew.text) return "new";
  return null;
}

/** The windows the expected posting date falls in, counted from FORECASTS_TODAY by
 *  the engine's runway. The feed's `dueBucket` owns the day bounds. No date, none. */
export function expectedWindowsOf(f: ScoredForecast): string[] {
  const days = f.timing.runwayDays;
  return days == null ? [] : dueBucket(days);
}

/** True when the buyer's estimate overlaps the value range, by the feed's rule. While
 *  a bound is set, a forecast with no estimate is not shown, as with `size`. */
function inValueRange(f: ScoredForecast, filters: ForecastFilters): boolean {
  const range = { min: filters.valueMin, max: filters.valueMax };
  if (range.min === null && range.max === null) return true;
  const { valLow, valHigh } = f.record;
  if (valLow == null && valHigh == null) return false;
  return valueRangeOverlaps(range, valLow ?? null, valHigh ?? null);
}

/** The USPS code of the state the record names, or null. */
const stateOf = (f: ScoredForecast): string | null => stateCode(f.record.popState);

/** The city the record names, or null. */
const cityOf = (f: ScoredForecast): string | null => cityName(f.record.popCity);

const sameCity = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

/** True when the record names one of the chosen states. While a state is chosen, a
 *  forecast that names no state is not shown. */
function inStates(f: ScoredForecast, states: string[]): boolean {
  if (states.length === 0) return true;
  const state = stateOf(f);
  return state != null && states.includes(state);
}

/** True when the record names one of the chosen cities. When states are also chosen,
 *  the city must be inside one of them, so "Springfield" in IL is not "Springfield" in MO. */
function inCities(f: ScoredForecast, filters: ForecastFilters): boolean {
  if (filters.cities.length === 0) return true;
  const city = cityOf(f);
  if (city == null || !filters.cities.some((c) => sameCity(c, city))) return false;
  return inStates(f, filters.states);
}

/** The industry code the record carries, or null. */
const naicsOf = (f: ScoredForecast): string | null => f.record.naicsCode?.trim() || null;

/** True when the record carries one of the chosen codes, exactly: `238160` never
 *  matches `2381`. While a code is chosen, a forecast with no code is not shown. */
function inNaics(f: ScoredForecast, codes: string[]): boolean {
  if (codes.length === 0) return true;
  const code = naicsOf(f);
  return code != null && codes.includes(code);
}

/** True when the buyer published the record between FORECASTS_TODAY - N days and
 *  FORECASTS_TODAY. While N is set, a forecast with no posted date is not shown. The
 *  feed's `inPostedWindow` owns the day bounds. */
function postedInWindow(f: ScoredForecast, days: number | null): boolean {
  if (days == null) return true;
  const postedOn = f.record.postedOn;
  return postedOn != null && inPostedWindow(daysBetween(postedOn, FORECASTS_TODAY), days);
}

/** One question in the menu. The value range is one question over two fields. */
type Group = Exclude<keyof ForecastFilters, "valueMin" | "valueMax"> | "value";
/** A question that takes one of a set of options, so each option has a count. */
type OptionGroup = Exclude<Group, "value">;

function passes(f: ScoredForecast, filters: ForecastFilters, group: Group): boolean {
  switch (group) {
    case "work":
      return filters.work.length === 0 || filters.work.includes(workKindOf(f));
    case "place":
      return filters.place === "any" || f.inArea;
    case "who":
      return filters.who.length === 0 || filters.who.includes(whoKindOf(f));
    case "size":
      return filters.size === "any" || sizeOf(f) === filters.size;
    case "bought":
      return filters.bought === "any" || boughtOf(f) === filters.bought;
    case "status":
      return filters.status === "any" || f.lifecycle === "open";
    case "expected":
      return (
        filters.expected.length === 0 ||
        expectedWindowsOf(f).some((w) => (filters.expected as string[]).includes(w))
      );
    case "value":
      return inValueRange(f, filters);
    case "states":
      return inStates(f, filters.states);
    case "cities":
      return inCities(f, filters);
    case "naics":
      return inNaics(f, filters.naics);
    case "postedWithin":
      return postedInWindow(f, filters.postedWithin);
  }
}

const GROUPS: Group[] = [
  "work",
  "naics",
  "place",
  "states",
  "cities",
  "who",
  "size",
  "bought",
  "status",
  "expected",
  "postedWithin",
  "value",
];

/** True when the forecast passes every group, or every group but `except`.
 *  The parity oracle for `forecast-list.conditions.ts` (`filters.parity.test.ts`); the list page renders server rows and does not call it. */
export function matchesFilters(
  f: ScoredForecast,
  filters: ForecastFilters,
  except?: Group,
): boolean {
  return GROUPS.every((g) => g === except || passes(f, filters, g));
}

/** How many forecasts an option would show, with every other choice kept.
 *  A test oracle for the server's facet counts (`forecast-list.facets.ts`); the list page renders server rows and does not call it. */
export function optionCount<G extends OptionGroup>(
  list: ScoredForecast[],
  filters: ForecastFilters,
  group: G,
  value: ForecastFilters[G] extends (infer V)[] ? V : ForecastFilters[G],
): number {
  const current = filters[group];
  const next = {
    ...filters,
    [group]: Array.isArray(current) ? [value] : value,
  } as ForecastFilters;
  return list.filter((f) => matchesFilters(f, next)).length;
}

/** A state the member can choose, with the count of forecasts it would show. */
export interface StateOption {
  code: string;
  count: number;
}

/** A city the member can choose, with the count of forecasts it would show. */
export interface CityOption {
  name: string;
  count: number;
}

/** A NAICS code the member can choose, with the count of forecasts it would show. */
export interface NaicsOption {
  code: string;
  count: number;
}

/** The codes the list carries, plus the chosen ones, in code order.
 *  A test oracle for the server's NAICS facet (`forecast-list.facets.ts`); the list page renders server rows and does not call it. */
export function naicsOptions(list: ScoredForecast[], filters: ForecastFilters): NaicsOption[] {
  const codes = new Set(filters.naics);
  for (const f of list) {
    const code = naicsOf(f);
    if (code) codes.add(code);
  }
  return [...codes]
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({ code, count: optionCount(list, filters, "naics", code) }));
}

/** The states the list names, plus the chosen ones, in code order.
 *  A test oracle for the server's state facet (`forecast-list.facets.ts`); the list page renders server rows and does not call it. */
export function stateOptions(list: ScoredForecast[], filters: ForecastFilters): StateOption[] {
  const codes = new Set(filters.states);
  for (const f of list) {
    const state = stateOf(f);
    if (state) codes.add(state);
  }
  return [...codes]
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({ code, count: optionCount(list, filters, "states", code) }));
}

/** The cities the list names, plus the chosen ones, in name order. Each city is
 *  offered once, whatever its capital letters. While states are chosen, only the
 *  cities inside them are offered.
 *  A test oracle for the server's city facet (`forecast-list.facets.ts`); the list page renders server rows and does not call it. */
export function cityOptions(list: ScoredForecast[], filters: ForecastFilters): CityOption[] {
  const byKey = new Map<string, string>();
  for (const c of filters.cities) byKey.set(c.toLowerCase(), c);
  for (const f of list) {
    const city = cityOf(f);
    if (city && inStates(f, filters.states) && !byKey.has(city.toLowerCase()))
      byKey.set(city.toLowerCase(), city);
  }
  return [...byKey.values()]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((name) => ({ name, count: optionCount(list, filters, "cities", name) }));
}

/** How many questions have a choice other than "any", for the badge on Filters.
 *  An empty list and a null value count as "any". */
export function activeFilterCount(filters: ForecastFilters): number {
  return GROUPS.filter((g) => {
    if (g === "value") return filters.valueMin != null || filters.valueMax != null;
    const v: unknown = filters[g];
    if (Array.isArray(v)) return v.length > 0;
    return v != null && v !== "any";
  }).length;
}

/** The list orders in the browser. A test oracle for the server's `sort` (`forecast-list.rules.ts`); the list page renders server rows and does not call it. */
export function sortForecasts(list: ScoredForecast[], sort: ForecastSort): ScoredForecast[] {
  const out = [...list];
  switch (sort) {
    case "match":
      return out.sort(byBestFit);
    case "soonest":
      return out.sort(
        (a, b) =>
          (a.timing.runwayDays ?? Infinity) - (b.timing.runwayDays ?? Infinity) || byBestFit(a, b),
      );
    case "newest":
      return out.sort(
        (a, b) =>
          (b.record.postedOn ?? "").localeCompare(a.record.postedOn ?? "") || byBestFit(a, b),
      );
    case "value":
      return out.sort((a, b) => (valueOf(b) ?? -1) - (valueOf(a) ?? -1) || byBestFit(a, b));
  }
}

// ── The URL ─────────────────────────────────────────────────────────────────────

const pickList = <T extends string>(raw: unknown, allowed: T[]): T[] =>
  typeof raw === "string"
    ? raw.split(",").filter((x): x is T => (allowed as string[]).includes(x))
    : [];

const WHOLE_DOLLARS = /^\d+$/;

/** A whole number of dollars, 0 or more, from the URL. Anything else is no value. */
const pickDollars = (raw: unknown): number | undefined => {
  const text = typeof raw === "number" ? String(raw) : raw;
  if (typeof text !== "string" || !WHOLE_DOLLARS.test(text)) return undefined;
  const n = Number(text);
  return Number.isSafeInteger(n) ? n : undefined;
};

/** USPS codes from the URL. A code or a state's name is read; anything else is dropped. */
const pickStates = (raw: unknown): string[] =>
  typeof raw === "string" ? [...new Set(raw.split(",").flatMap((x) => stateCode(x) ?? []))] : [];

/** City names from the URL, trimmed, each once whatever its capital letters. */
const pickCities = (raw: unknown): string[] => {
  if (typeof raw !== "string") return [];
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const city = part.trim();
    if (city && !out.some((c) => sameCity(c, city))) out.push(city);
  }
  return out;
};

const NAICS_CODE = /^\d{2,6}$/;

/** NAICS codes from the URL: 2 to 6 digits, each once. The router reads a single
 *  hand-typed code as a number, so a number is read as its digits. */
const pickNaics = (raw: unknown): string[] => {
  const text = typeof raw === "number" ? String(raw) : raw;
  if (typeof text !== "string") return [];
  const codes = text.split(",").map((x) => x.trim());
  return [...new Set(codes.filter((x) => NAICS_CODE.test(x)))];
};

const WHOLE_DAYS = /^[1-9]\d*$/;

/** A positive whole number of days from the URL. The router reads a lone number as a
 *  number, so a number is read as its digits. Anything else is no value. */
const pickDays = (raw: unknown): number | undefined => {
  const text = typeof raw === "number" ? String(raw) : raw;
  if (typeof text !== "string" || !WHOLE_DAYS.test(text)) return undefined;
  const n = Number(text);
  return Number.isSafeInteger(n) ? n : undefined;
};

const pickOne = <T extends string>(raw: unknown, allowed: T[], fallback: T): T =>
  (allowed as string[]).includes(raw as string) ? (raw as T) : fallback;

export interface FilterSearch {
  work?: string;
  place?: "served";
  who?: string;
  size?: Exclude<SizeBucket, "any">;
  bought?: "again" | "new";
  status?: "open";
  /** Expected posting date windows, comma separated. */
  expected?: string;
  /** The lowest value of the range, in whole dollars. */
  valueMin?: number;
  /** The highest value of the range, in whole dollars. */
  valueMax?: number;
  /** USPS codes, comma separated. */
  states?: string;
  /** City names, comma separated. */
  cities?: string;
  /** NAICS codes, comma separated. */
  naics?: string;
  /** Days back that the buyer published the record, a positive whole number. */
  posted?: number;
  sort?: Exclude<ForecastSort, "match">;
}

export function readFilterSearch(input: Record<string, unknown>): FilterSearch {
  const work = pickList(input.work, WORK_KINDS);
  const who = pickList(input.who, WHO_KINDS);
  const size = pickOne(input.size, SIZE_BUCKETS, "any");
  const bought = pickOne(
    input.bought,
    ["any", "again", "new"] as const as ("any" | "again" | "new")[],
    "any",
  );
  const sort = pickOne(input.sort, SORTS, "match");
  const expected = pickList(input.expected, EXPECTED_WINDOWS);
  const states = pickStates(input.states);
  const cities = pickCities(input.cities);
  const naics = pickNaics(input.naics);
  return {
    work: work.length ? work.join(",") : undefined,
    place: input.place === "served" ? "served" : undefined,
    who: who.length ? who.join(",") : undefined,
    size: size === "any" ? undefined : size,
    bought: bought === "any" ? undefined : bought,
    status: input.status === "open" ? "open" : undefined,
    expected: expected.length ? expected.join(",") : undefined,
    valueMin: pickDollars(input.valueMin),
    valueMax: pickDollars(input.valueMax),
    states: states.length ? states.join(",") : undefined,
    cities: cities.length ? cities.join(",") : undefined,
    naics: naics.length ? naics.join(",") : undefined,
    posted: pickDays(input.posted),
    sort: sort === "match" ? undefined : sort,
  };
}

export function filtersFromSearch(s: FilterSearch): ForecastFilters {
  return {
    work: pickList(s.work, WORK_KINDS),
    place: s.place ?? "any",
    who: pickList(s.who, WHO_KINDS),
    size: s.size ?? "any",
    bought: s.bought ?? "any",
    status: s.status ?? "any",
    expected: pickList(s.expected, EXPECTED_WINDOWS),
    valueMin: pickDollars(s.valueMin) ?? null,
    valueMax: pickDollars(s.valueMax) ?? null,
    states: pickStates(s.states),
    cities: pickCities(s.cities),
    naics: pickNaics(s.naics),
    postedWithin: pickDays(s.posted) ?? null,
  };
}

export function searchFromFilters(f: ForecastFilters): Omit<FilterSearch, "sort"> {
  return {
    work: f.work.length ? f.work.join(",") : undefined,
    place: f.place === "served" ? "served" : undefined,
    who: f.who.length ? f.who.join(",") : undefined,
    size: f.size === "any" ? undefined : f.size,
    bought: f.bought === "any" ? undefined : f.bought,
    status: f.status === "open" ? "open" : undefined,
    expected: f.expected.length ? f.expected.join(",") : undefined,
    valueMin: f.valueMin ?? undefined,
    valueMax: f.valueMax ?? undefined,
    states: f.states.length ? f.states.join(",") : undefined,
    cities: f.cities.length ? f.cities.join(",") : undefined,
    naics: f.naics.length ? f.naics.join(",") : undefined,
    posted: f.postedWithin ?? undefined,
  };
}
