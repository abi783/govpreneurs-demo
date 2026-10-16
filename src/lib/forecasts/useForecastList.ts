// The paged forecast list (ARCHITECTURE-forecasts-paginated.md, section 10). The
// server selects, filters, sorts and counts; this hook loads one page at a time.
//
// The same shape as the opportunities feed's infinite scroll (routes/index.tsx):
//   · the query key is the request without its page. A new key starts again at
//     page 1 and replaces the rows;
//   · a request epoch and an AbortController drop an answer for a query the member
//     has left, and a next page that was in flight when the query changed;
//   · a sentinel after the last row asks the next page when it comes near the screen;
//   · a failed next page keeps the rows, and Retry asks the same page again.
// The engine runs on each row for the card's words only. The order is the server's.

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { bus } from "../eventBus";
import {
  fetchForecastList,
  type ForecastCaptureCounts,
  type ForecastFacetsDto,
  type ForecastListResponseDto,
  type ForecastListRowDto,
  type ForecastMatchRead,
  type ForecastMemberDto,
  type ForecastViewCounts,
} from "../forecastsApi";
import { FACET_DEBOUNCE_MS, SEARCH_DEBOUNCE_MS } from "../feedDebounce";
import { TRACKED_WRITES_SLICE } from "../trackedForecasts";
import type { ScoredForecast } from "./engine";
import { forecastListQueryKey, pageParams, searchWordsOf } from "./listQuery";
import { firmFromMember, scoreLive } from "./live";
import { rememberForecasts } from "./loadedForecasts";
import type { ForecastsSearch } from "./search";

/** How far outside the screen the sentinel counts as reached. */
const SENTINEL_MARGIN = "400px";

/** One loaded row: the engine's read of the record, and the member's match row. */
export type ForecastListItem = ScoredForecast & { match: ForecastMatchRead | null };

/** Whether `facets` are page 1's for the current query (`current`), the last
 *  known ones while the current page 1 is in flight (`pending`), or the last
 *  known ones after the current page 1 failed (`failed`). */
export type ForecastFacetsState = "current" | "pending" | "failed";

interface ListState {
  /** The query the rows answer. */
  queryKey: string;
  status: "loading" | "error" | "ready";
  rows: ForecastListItem[];
  member: ForecastMemberDto | null;
  /** The last page loaded. */
  page: number;
  hasMore: boolean;
  loadingMore: boolean;
  moreFailed: boolean;
  /** Page 1's counts. A later page carries none, so these stay. */
  total: number | null;
  captureCounts: ForecastCaptureCounts | null;
  viewCounts: ForecastViewCounts | null;
  facets: ForecastFacetsDto | null;
  /** The facets of the last page 1 that answered, for any query. They keep the
   *  drawer's options on screen until the current query's page 1 answers. */
  priorFacets: ForecastFacetsDto | null;
  /** Page 1 of the same query is loading again (a Saved reload), and the rows stay. */
  reloading: boolean;
}

type Action =
  | { type: "start"; queryKey: string; keepRows: boolean }
  | { type: "firstPage"; res: ForecastListResponseDto }
  | { type: "firstFailed" }
  | { type: "moreStarted" }
  | { type: "morePage"; res: ForecastListResponseDto; page: number }
  | { type: "moreFailed" };

function emptyState(queryKey: string): ListState {
  return {
    queryKey,
    status: "loading",
    rows: [],
    member: null,
    page: 0,
    hasMore: false,
    loadingMore: false,
    moreFailed: false,
    total: null,
    captureCounts: null,
    viewCounts: null,
    facets: null,
    priorFacets: null,
    reloading: false,
  };
}

/** A fresh state for a new query that keeps the last known facets. */
function startState(queryKey: string, from: ListState): ListState {
  return { ...emptyState(queryKey), priorFacets: from.facets ?? from.priorFacets };
}

/** The rows of one answer, read by the engine, leaving out ids already held. */
function itemsOf(
  res: ForecastListResponseDto,
  held: readonly ForecastListItem[],
): ForecastListItem[] {
  const firm = firmFromMember(res.member);
  const seen = new Set(held.map((r) => r.id));
  const out: ForecastListItem[] = [];
  for (const row of res.forecasts) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(toItem(row, firm));
  }
  return out;
}

function toItem(
  row: ForecastListRowDto,
  firm: ReturnType<typeof firmFromMember>,
): ForecastListItem {
  return { ...scoreLive(row, firm), match: row.match };
}

function reduce(state: ListState, action: Action): ListState {
  switch (action.type) {
    case "start":
      // A reload of the same query keeps the rows on screen until the answer comes.
      if (action.keepRows && state.queryKey === action.queryKey && state.rows.length > 0) {
        return { ...state, loadingMore: false, moreFailed: false, reloading: true };
      }
      return startState(action.queryKey, state);
    case "firstPage":
      return {
        ...state,
        status: "ready",
        rows: itemsOf(action.res, []),
        member: action.res.member,
        page: 1,
        hasMore: action.res.hasMore,
        loadingMore: false,
        moreFailed: false,
        total: action.res.total ?? null,
        captureCounts: action.res.captureCounts ?? null,
        viewCounts: action.res.viewCounts ?? null,
        facets: action.res.facets ?? null,
        reloading: false,
      };
    case "firstFailed":
      return { ...startState(state.queryKey, state), status: "error" };
    case "moreStarted":
      return { ...state, loadingMore: true, moreFailed: false };
    case "morePage":
      // Only the page after the last one held extends the rows.
      if (action.page !== state.page + 1) return state;
      return {
        ...state,
        rows: [...state.rows, ...itemsOf(action.res, state.rows)],
        page: action.page,
        hasMore: action.res.hasMore,
        loadingMore: false,
      };
    case "moreFailed":
      return { ...state, loadingMore: false, moreFailed: true };
  }
}

function facetsStateOf(state: ListState): ForecastFacetsState {
  if (state.facets) return "current";
  return state.status === "loading" ? "pending" : "failed";
}

/** Logs the detail of a failed load; the page shows one fixed sentence. */
function logFailure(what: string, err: unknown): void {
  console.error(`[forecasts] ${what} failed`, err);
}

/** What the list page reads. */
export interface ForecastList {
  status: "loading" | "error" | "ready";
  /** The loaded rows, in the server's order. */
  rows: ForecastListItem[];
  member: ForecastMemberDto | null;
  hasMore: boolean;
  /** A next page is in flight. */
  loadingMore: boolean;
  /** The last next page failed. The rows stay; Retry asks the same page again. */
  moreFailed: boolean;
  total: number | null;
  captureCounts: ForecastCaptureCounts | null;
  viewCounts: ForecastViewCounts | null;
  /** The drawer's options: this query's page-1 facets, or the last known ones. */
  facets: ForecastFacetsDto | null;
  facetsState: ForecastFacetsState;
  /** Asks the failed page again: page 1 after a failed first load, else the next page. */
  retry: () => void;
  /** The ref for the sentinel after the last row. */
  sentinelRef: (el: HTMLElement | null) => void;
}

/** The forecast list for the page's URL search, one server page at a time. */
export function useForecastList(search: ForecastsSearch): ForecastList {
  const queryKey = forecastListQueryKey(search);
  const [stored, dispatch] = useReducer(reduce, queryKey, emptyState);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  /** Bumped by each page-1 request. An answer from an older epoch is dropped. */
  const epochRef = useRef(0);
  const lastKeyRef = useRef<string | null>(null);
  const moreRef = useRef<AbortController | null>(null);

  // Page 1: on arrival, on a new query, on Retry after a failed first load, and on
  // a Saved reload.
  useEffect(() => {
    const epoch = ++epochRef.current;
    moreRef.current?.abort();
    moreRef.current = null;
    const previous = lastKeyRef.current;
    lastKeyRef.current = queryKey;
    const reload = previous === queryKey;
    dispatch({ type: "start", queryKey, keepRows: reload });

    const searchChanged = searchWordsOf(previous ?? "") !== searchWordsOf(queryKey);
    const delay = reload ? 0 : searchChanged ? SEARCH_DEBOUNCE_MS : FACET_DEBOUNCE_MS;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchForecastList(pageParams(queryKey, 1), controller.signal)
        .then((res) => {
          if (epochRef.current !== epoch) return;
          rememberForecasts(res.member, res.forecasts);
          dispatch({ type: "firstPage", res });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || epochRef.current !== epoch) return;
          logFailure("list", err);
          dispatch({ type: "firstFailed" });
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [queryKey, reloadNonce]);

  // Rows that answer an older query are never shown, not even for one frame.
  const state = stored.queryKey === queryKey ? stored : startState(queryKey, stored);
  const { status, hasMore, page, moreFailed, reloading } = state;

  const loadMore = useCallback(
    (again: boolean) => {
      if (moreRef.current || reloading || status !== "ready" || !hasMore) return;
      if (moreFailed && !again) return;
      const epoch = epochRef.current;
      const nextPage = page + 1;
      const controller = new AbortController();
      moreRef.current = controller;
      dispatch({ type: "moreStarted" });
      fetchForecastList(pageParams(queryKey, nextPage), controller.signal)
        .then((res) => {
          if (epochRef.current !== epoch) return;
          rememberForecasts(res.member, res.forecasts);
          dispatch({ type: "morePage", res, page: nextPage });
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted || epochRef.current !== epoch) return;
          logFailure("next page", err);
          dispatch({ type: "moreFailed" });
        })
        .finally(() => {
          if (moreRef.current === controller) moreRef.current = null;
        });
    },
    [queryKey, status, hasMore, page, moreFailed, reloading],
  );

  useEffect(() => {
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore(false);
      },
      { rootMargin: SENTINEL_MARGIN },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [sentinel, loadMore]);

  // The Saved view reloads page 1 once a track or untrack write has settled.
  const view = new URLSearchParams(queryKey).get("view");
  useEffect(() => {
    if (view !== "saved") return;
    return bus.subscribe(TRACKED_WRITES_SLICE, () => setReloadNonce((n) => n + 1));
  }, [view]);

  const retry = useCallback(() => {
    if (status === "error") setReloadNonce((n) => n + 1);
    else if (moreFailed) loadMore(true);
  }, [status, moreFailed, loadMore]);

  return {
    status: state.status,
    rows: state.rows,
    member: state.member,
    hasMore: state.hasMore,
    loadingMore: state.loadingMore,
    moreFailed: state.moreFailed,
    total: state.total,
    captureCounts: state.captureCounts,
    viewCounts: state.viewCounts,
    facets: state.facets ?? state.priorFacets,
    facetsState: facetsStateOf(state),
    retry,
    sentinelRef: setSentinel,
  };
}
