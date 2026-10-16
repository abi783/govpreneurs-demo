// DEMO (Hunter): the filter, sort and page rules of the feed, run in the browser.
//
// This is the server's job in production, and the feed page trusts it: the page
// sends the filters and the sort, and draws the rows in the order it gets back.
// So every control in the page has to change what this file returns. The rules
// are the ones the Filters drawer and the chat describe:
//
//   - Values in one facet are OR. Different facets are AND.
//   - Location is states OR cities (the picker's own model).
//   - The value range keeps every job whose range touches the range you set. A
//     job with no stated value is hidden once any bound is set. Production keeps
//     it, but then a bucket such as "Under $25K" would show a card with no value,
//     and its count would not read as a count of jobs that size.
//   - The set-aside, notice-type and due-window ids are the drawer's ids.

import type { ServerFilters, ServerSort } from "../../lib/discoverApi";
import { dueBucket, valueRangeOverlaps } from "../../lib/opportunityFilters";
import { savedRows, type FeedRow, type FeedTabId } from "./data";

/** The facets that the counts leave out, so each option's count shows what picking it would give. */
export type FacetName = "location" | "naics" | "setAsides" | "valueRange" | "dueWindow";

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "of", "for", "to", "and", "or", "with", "near", "me", "my",
  "job", "jobs", "work", "opportunity", "opportunities", "contract", "contracts",
]);

/** A word cut to its root, so "meals" finds "meal" and "catering" finds "caterers". */
export function stem(word: string): string {
  const w = word.toLowerCase();
  const cut = w.replace(/(ing|ers|er|es|s)$/, "");
  return cut.length >= 4 ? cut : w;
}

/** The words of a search box, without the filler words. */
export function searchTokens(q: string): string[] {
  const all = q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const kept = all.filter((t) => !STOP_WORDS.has(t));
  return kept.length > 0 ? kept : all;
}

function tokenHit(row: FeedRow, token: string): boolean {
  // A short word (a state code such as "va") must be a whole word of the notice.
  if (token.length <= 2) return row.words.has(token);
  if (row.haystack.includes(token)) return true;
  const root = stem(token);
  for (const word of row.words) if (word.startsWith(root)) return true;
  return false;
}

/** True when every word of the search is in the notice's title, agency, place, code or summary. */
export function searchMatches(row: FeedRow, q: string): boolean {
  const tokens = searchTokens(q);
  if (tokens.length === 0) return true;
  return tokens.every((t) => tokenHit(row, t));
}

const VEHICLE_TEXT: Record<string, RegExp> = {
  idiq: /\bidiq\b|id\/iq|indefinite[- ]delivery|indefinite[- ]quantity/i,
  bpa: /\bbpa\b|blanket purchase/i,
  matoc: /\bmatoc\b|\bsatoc\b|multiple[- ]award|task order/i,
  future: /recompete|re-compete|renewal|upcoming|presol|sources sought/i,
};

/** True when the value estimate touches the range. No stated value never does. */
export function valueFits(range: { min: number | null; max: number | null }, low: number | null, high: number | null): boolean {
  if (low === null && high === null) return false;
  return valueRangeOverlaps(range, low, high);
}

function inWindow(days: number, ids: string[]): boolean {
  const buckets = dueBucket(days);
  return ids.some((id) => buckets.includes(id));
}

/** True when the row passes every filter, except the one facet named in `skip`. */
export function rowMatches(row: FeedRow, f: ServerFilters, skip?: FacetName): boolean {
  if (f.scopes?.length && !f.scopes.includes(row.o.scope)) return false;

  if (skip !== "naics" && f.naicsCodes?.length && !f.naicsCodes.includes(row.o.naics)) return false;

  if (skip !== "setAsides" && f.setAsides?.length) {
    if (!f.setAsides.some((id) => row.setAsideIds.includes(id))) return false;
  }

  if (skip !== "location") {
    const states = f.location?.states ?? [];
    const cities = f.location?.cities ?? [];
    if (states.length || cities.length) {
      const hit = states.includes(row.state) || cities.some((c) => c.toLowerCase() === row.city.toLowerCase());
      if (!hit) return false;
    }
  }

  if (f.noticeTypes?.length && !f.noticeTypes.some((id) => row.noticeIds.includes(id))) return false;

  if (skip !== "dueWindow" && f.dueWindow?.length) {
    if (!inWindow(row.o.closesInDays, f.dueWindow)) return false;
  }

  if (skip !== "valueRange" && f.valueRange && (f.valueRange.min !== null || f.valueRange.max !== null)) {
    if (!valueFits(f.valueRange, row.low, row.high)) return false;
  }

  if (f.agencies?.length && !f.agencies.includes(row.o.agency)) return false;

  if (f.vehicles?.length) {
    const text = `${row.o.title} ${row.o.plainTitle} ${row.o.noticeType}`;
    if (!f.vehicles.some((id) => VEHICLE_TEXT[id]?.test(text))) return false;
  }

  if (f.psc?.length && !f.psc.some((code) => row.psc.toLowerCase().startsWith(code.toLowerCase()))) return false;

  if (f.popZips?.length && !(row.zip && f.popZips.includes(row.zip))) return false;

  if (f.postedWithin != null && row.o.postedDaysAgo > f.postedWithin) return false;

  if (f.dodOnly && !row.isDod) return false;
  if (f.civilianOnly && row.isDod) return false;

  if (f.search?.trim() && !searchMatches(row, f.search)) return false;

  return true;
}

export function applyFilters(rows: FeedRow[], f: ServerFilters | undefined, skip?: FacetName): FeedRow[] {
  if (!f) return rows;
  return rows.filter((r) => rowMatches(r, f, skip));
}

// ── Sort ────────────────────────────────────────────────────────────────────

/** What a tab does when the request names no sort. */
export function defaultSort(tab: FeedTabId): ServerSort {
  if (tab === "saved") return { field: "saved", order: "desc" };
  return { field: "match", order: "desc" };
}

function valueKey(row: FeedRow): number | null {
  if (row.low === null && row.high === null) return null;
  const low = row.low ?? row.high!;
  const high = row.high ?? row.low!;
  return (low + high) / 2;
}

/** Hunter's own order for the For You tab: rank 1 first. Other rows go by score. */
function matchKey(row: FeedRow, tab: FeedTabId): number {
  if (tab === "for_you" && row.o.hunter.forYouRank !== undefined) return 1000 - row.o.hunter.forYouRank;
  return row.o.hunter.score;
}

/** Orders rows by the sort the page sent. Rows with no value always come last on a value sort. */
export function sortRows(rows: FeedRow[], sort: ServerSort | undefined, tab: FeedTabId): FeedRow[] {
  const s = sort ?? defaultSort(tab);
  const savedOrder = savedRows().map((r) => r.id);
  const indexInStory = new Map(rows.map((r, i) => [r.id, i]));

  // `key` runs from low to high. `asc` flips it. Null keys go last either way.
  const keyOf = (row: FeedRow): number | null => {
    switch (s.field) {
      case "match":
        return matchKey(row, tab);
      case "newest":
        return -row.o.postedDaysAgo;
      case "deadline":
        return row.o.closesInDays;
      case "value":
        return valueKey(row);
      case "saved": {
        const at = savedOrder.indexOf(row.id);
        // `savedRows` is newest first, so a lower index is more recent.
        return at === -1 ? null : -at;
      }
    }
  };
  const naturalDesc: Record<ServerSort["field"], boolean> = {
    match: true,
    newest: true,
    deadline: false,
    value: true,
    saved: true,
  };
  const order = s.order ?? (naturalDesc[s.field] ? "desc" : "asc");
  const dir = order === "desc" ? -1 : 1;

  return [...rows].sort((a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === null && kb === null) return (indexInStory.get(a.id) ?? 0) - (indexInStory.get(b.id) ?? 0);
    if (ka === null) return 1;
    if (kb === null) return -1;
    if (ka !== kb) return (ka - kb) * dir;
    // Equal keys: the better match first, then the story order.
    const m = matchKey(b, tab) - matchKey(a, tab);
    return m !== 0 ? m : (indexInStory.get(a.id) ?? 0) - (indexInStory.get(b.id) ?? 0);
  });
}

// ── Page ────────────────────────────────────────────────────────────────────

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** One page of a list. `totalPages` is `ceil(total / limit)`, as the feed page expects. */
export function pageOf<T>(items: T[], page?: number, limit?: number): Page<T> {
  const size = Math.max(1, Math.floor(limit ?? 50));
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const at = Math.max(1, Math.floor(page ?? 1));
  const start = (at - 1) * size;
  return { data: items.slice(start, start + size), total: items.length, page: at, limit: size, totalPages };
}

/** Runs one request end to end: universe, filters, sort, page. */
export function runFeed(
  tab: FeedTabId,
  rows: FeedRow[],
  body: { filters?: ServerFilters; sort?: ServerSort; search?: string; page?: number; limit?: number },
): Page<FeedRow> {
  const filters: ServerFilters = { ...(body.filters ?? {}) };
  // The All tab puts the search text in `filters.search`. The Saved tab sends it at the top.
  if (body.search && !filters.search) filters.search = body.search;
  const kept = applyFilters(rows, filters);
  return pageOf(sortRows(kept, body.sort, tab), body.page, body.limit);
}
