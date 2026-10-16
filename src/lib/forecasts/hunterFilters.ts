// Hunter's discovery, tab and reset payloads, mapped onto the forecast list's URL.
// Pure: no React, no fetch, no navigation. The route calls it and navigates.
//
// The rule: a filter the list can express goes into the URL. A filter it cannot
// express is RETURNED in `unsupported` with its values, and never dropped in
// silence. `categories: ["forecast"]` is neither: the page already shows only
// forecasts, so it is satisfied and not reported.
//
// Contract: ARCHITECTURE-forecasts-hunter.md, section 4. Feature 3 adds the
// functions; features 11 and 12 widen what the mapping writes.

import type { DiscoveryPayload, FeedTab, HunterFilterDelta } from "../hunterChat";
import { readFilterSearch, type FilterSearch, type WhoKind } from "./filters";
import type { ForecastsSearch } from "./search";

/** A Hunter filter key that the mapping can report as unsupported. `search` and
 *  `scope` always map (to `q` and `lane`), so they are never reported. */
export type UnsupportedFilterKey = Exclude<keyof HunterFilterDelta, "search" | "scope">;

/** One filter the list did not apply, with the value Hunter sent, unchanged.
 *  For `categories`, `value` holds only the categories other than "forecast". */
export type UnsupportedFilter = {
  [K in UnsupportedFilterKey]: { key: K; value: NonNullable<HunterFilterDelta[K]> };
}[UnsupportedFilterKey];

/** The result of mapping one Hunter payload onto the forecast list. */
export interface HunterFilterMapping {
  /** The whole next search. The route navigates to it as it is (no merge). */
  search: ForecastsSearch;
  /** Every filter the list could not express, in the fixed key order of
   *  `HunterFilterDelta`, so the same payload always gives the same line. */
  unsupported: UnsupportedFilter[];
}

/** Every key the mapping can report, in the key order of `HunterFilterDelta`. */
const UNSUPPORTED_ORDER: readonly UnsupportedFilterKey[] = [
  "states",
  "cities",
  "setAsides",
  "valueRange",
  "dueWindow",
  "naics",
  "noticeTypes",
  "categories",
  "vehicles",
  "postedWithin",
  "dodOnly",
  "civilianOnly",
];

/** The one category that the forecast list always satisfies. */
const FORECAST_CATEGORY = "forecast";

/** Hunter set-aside ids that a `who` group means exactly. `SB` is the small-business
 *  set-aside, and `small` is the engine's `small_business` reading (codes SBA and
 *  SBP). No program certificate is here: `program` holds every program, so a single
 *  certificate would widen to all of them. `FULL_OPEN` is not here either: no group
 *  means "open to everyone". Read with `Object.hasOwn`, because the id is model input. */
const WHO_FOR_SET_ASIDE: Readonly<Record<string, WhoKind>> = { SB: "small" };

/** The `who` groups for Hunter's set-asides, or null when the list must not apply
 *  them. Hunter's set-asides are an OR, so if one id has no exact group, the list
 *  applies none: a subset would hide records the member asked for. */
function whoForSetAsides(setAsides: string[] | undefined): WhoKind[] | null {
  if (!setAsides?.length) return null;
  if (!setAsides.every((id) => Object.hasOwn(WHO_FOR_SET_ASIDE, id))) return null;
  return [...new Set(setAsides.map((id) => WHO_FOR_SET_ASIDE[id]))];
}

type FilterValue<K extends UnsupportedFilterKey> = NonNullable<HunterFilterDelta[K]>;

/** Returns the value to report for one key, or null when the key sets no filter.
 *  An empty list, a `false` switch and a range with no bound set no filter. */
function reportable<K extends UnsupportedFilterKey>(
  key: K,
  delta: HunterFilterDelta,
): FilterValue<K> | null {
  const raw = delta[key];
  if (raw === undefined || raw === null || raw === false) return null;
  if (key === "categories") {
    const other = (raw as string[]).filter((c) => c !== FORECAST_CATEGORY);
    return other.length ? (other as FilterValue<K>) : null;
  }
  if (Array.isArray(raw)) return raw.length ? (raw as FilterValue<K>) : null;
  if (key === "valueRange") {
    const range = raw as FilterValue<"valueRange">;
    return range.min == null && range.max == null ? null : (raw as FilterValue<K>);
  }
  return raw as FilterValue<K>;
}

/** Every filter in the delta that the forecast list cannot express. */
function unsupportedIn(delta: HunterFilterDelta): UnsupportedFilter[] {
  const out: UnsupportedFilter[] = [];
  for (const key of UNSUPPORTED_ORDER) {
    const value = reportable(key, delta);
    if (value !== null) out.push({ key, value } as UnsupportedFilter);
  }
  return out;
}

/** Hunter list filters that the forecast list applies, with the URL key each one
 *  writes. `dueWindow` uses the same window ids as `expected`. `cities` is not here:
 *  most forecasts carry no city (112 of 129 active NC forecasts on staging,
 *  2026-10-01), so Hunter's city emptied the list. The list reports it instead. The
 *  member can still pick a city in the drawer. */
const LIST_URL_KEY = {
  states: "states",
  dueWindow: "expected",
  naics: "naics",
} as const satisfies Partial<Record<UnsupportedFilterKey, keyof FilterSearch>>;

type ListKey = keyof typeof LIST_URL_KEY;
type ListUrlKey = (typeof LIST_URL_KEY)[ListKey];

/** The URL's separator. A value that holds it cannot be one entry of a URL list. */
const LIST_SEPARATOR = ",";

/** Reads one Hunter value the way the URL reads it, so the list's own reader decides
 *  what is valid (a state becomes its USPS code). Undefined when the reader drops it. */
function readOne(urlKey: ListUrlKey, value: string): string | undefined {
  if (value.includes(LIST_SEPARATOR)) return undefined;
  return readFilterSearch({ [urlKey]: value })[urlKey];
}

/** Writes one Hunter list filter into `next`, replacing what the key held, as the feed
 *  does. An empty list clears the key. Returns the values the list cannot read. */
function applyList(key: ListKey, values: string[], next: ForecastsSearch): string[] {
  const urlKey = LIST_URL_KEY[key];
  const kept: string[] = [];
  const rejected: string[] = [];
  for (const value of values) {
    if (!value.trim()) continue;
    const read = readOne(urlKey, value);
    if (read === undefined) rejected.push(value);
    else kept.push(read);
  }
  next[urlKey] = readFilterSearch({ [urlKey]: [...new Set(kept)].join(LIST_SEPARATOR) })[urlKey];
  return rejected;
}

/** A bound in whole dollars, by the URL's own reader. Null when it is not a dollar
 *  amount (negative, not finite). */
function wholeDollars(n: number): number | null {
  if (!Number.isFinite(n)) return null;
  return readFilterSearch({ valueMin: Math.round(n) }).valueMin ?? null;
}

/** Writes Hunter's value range into `next`, both bounds at once. Returns false, and
 *  changes nothing, when a bound is not a dollar amount. */
function applyRange(range: { min: number | null; max: number | null }, next: ForecastsSearch) {
  const min = range.min == null ? undefined : wholeDollars(range.min);
  const max = range.max == null ? undefined : wholeDollars(range.max);
  if (min === null || max === null) return false;
  next.valueMin = min;
  next.valueMax = max;
  return true;
}

/** Writes every filter the list can express into `next`. Returns the delta that is
 *  left to report: a mapped key keeps only the values the list could not read. */
function applyMapped(filters: HunterFilterDelta, next: ForecastsSearch): HunterFilterDelta {
  const rest: HunterFilterDelta = { ...filters };
  for (const key of Object.keys(LIST_URL_KEY) as ListKey[]) {
    const values = filters[key];
    if (values === undefined) continue;
    const rejected = applyList(key, values, next);
    rest[key] = rejected.length ? rejected : undefined;
  }
  if (filters.valueRange && applyRange(filters.valueRange, next)) rest.valueRange = undefined;
  if (filters.postedWithin !== undefined) {
    const posted = readFilterSearch({ posted: filters.postedWithin }).posted;
    if (posted !== undefined) {
      next.posted = posted;
      rest.postedWithin = undefined;
    }
  }
  const who = whoForSetAsides(filters.setAsides);
  if (who !== null) {
    next.who = who.join(LIST_SEPARATOR);
    rest.setAsides = undefined;
  }
  return rest;
}

/** The lane for a Hunter scope. `undefined` removes the lane (both scopes on).
 *  `null` means no change: with both scopes off, the member asked for nothing. */
function laneFor(scope: { fed: boolean; sled: boolean }): ForecastsSearch["lane"] | null {
  if (scope.fed && scope.sled) return undefined;
  if (scope.fed) return "federal";
  if (scope.sled) return "sled";
  return null;
}

/** Applies Hunter's discovery payload to the forecast list's search. It returns the
 *  next search and every filter that the list cannot express. */
export function applyHunterDiscovery(
  p: DiscoveryPayload,
  current: ForecastsSearch,
): HunterFilterMapping {
  const next: ForecastsSearch = p.fresh ? clearedForecastSearch(current) : { ...current };
  const { search, scope } = p.filters;
  if (search !== undefined) next.q = search.trim() || undefined;
  if (scope) {
    const lane = laneFor(scope);
    if (lane !== null) next.lane = lane;
  }
  return { search: next, unsupported: unsupportedIn(applyMapped(p.filters, next)) };
}

/** The part of Hunter's filters that the list applied: `filters` without the
 *  `unsupported` report. A list key keeps the values the list read, and any other
 *  reported key is removed. The "Using" row reads this, because it states what
 *  Hunter did. */
export function appliedHunterFilters(
  filters: HunterFilterDelta,
  unsupported: UnsupportedFilter[],
): HunterFilterDelta {
  const applied: Record<string, unknown> = { ...filters };
  for (const { key, value } of unsupported) {
    const sent = filters[key];
    const kept =
      Array.isArray(sent) && Array.isArray(value) ? sent.filter((v) => !value.includes(v)) : [];
    if (kept.length) applied[key] = kept;
    else delete applied[key];
  }
  return applied as HunterFilterDelta;
}

/** Moves the forecast list to the view for a feed tab. It clears the capture tab
 *  and keeps the filters. "for_you" is the default view, so its key is absent. */
export function forecastSearchForTab(tab: FeedTab, current: ForecastsSearch): ForecastsSearch {
  return { ...current, view: tab === "for_you" ? undefined : tab, tab: undefined };
}

/** Clears the search words, the lane, the capture tab and every drawer filter.
 *  It keeps the view and the sort. */
export function clearedForecastSearch(current: ForecastsSearch): ForecastsSearch {
  const next: ForecastsSearch = {};
  if (current.view !== undefined) next.view = current.view;
  if (current.sort !== undefined) next.sort = current.sort;
  return next;
}
