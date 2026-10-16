// The paged list's request (ARCHITECTURE-forecasts-paginated.md, section 3). Pure:
// the list page's URL search becomes the `GET /forecasts` query. Each key has its URL
// name and meaning. The drawer keys go through the URL reader again, so the request
// holds only the values the page itself would show as chosen.

import type { ForecastView } from "../forecastsApi";
import {
  SORTS,
  filtersFromSearch,
  searchFromFilters,
  type FilterSearch,
  type ForecastSort,
} from "./filters";
import type { ForecastsSearch } from "./search";

/** A sort the URL can hold. Best match is For you's default, so the URL never names it. */
type UrlSort = NonNullable<FilterSearch["sort"]>;

/** Rows per page. The same size as the AI take window (`TAKE_WINDOW`). */
export const FORECAST_PAGE_SIZE = 20;

/** The server's bounds (section 3). A value past one would be a 400. `listQuery.test.ts`
 *  holds them to `forecast-filter.fixtures.json`'s `bounds`, as the backend holds its own.
 *  States need no bound here: the URL reader keeps each known code once. */
export const MAX_Q_LENGTH = 200;
export const MAX_CITIES = 50;
export const MAX_CITY_LENGTH = 100;
export const MAX_NAICS = 100;

/** The drawer keys, in the order the request sends them. */
const DRAWER_KEYS = [
  "work",
  "place",
  "who",
  "size",
  "bought",
  "status",
  "expected",
  "valueMin",
  "valueMax",
  "states",
  "cities",
  "naics",
  "posted",
] as const;

/** Cities inside the server's bounds: each at most 100 characters, at most 50. */
function boundedCities(cities: string | undefined): string | undefined {
  if (!cities) return undefined;
  const kept = cities
    .split(",")
    .filter((c) => c.length <= MAX_CITY_LENGTH)
    .slice(0, MAX_CITIES);
  return kept.length ? kept.join(",") : undefined;
}

/** NAICS codes inside the server's bound: at most 100. */
function boundedNaics(naics: string | undefined): string | undefined {
  return naics ? naics.split(",").slice(0, MAX_NAICS).join(",") : undefined;
}

/** The order a view has when the URL names none: Best match on For you, else soonest. */
function defaultSort(view: ForecastView): ForecastSort {
  return view === "for_you" ? "match" : "soonest";
}

/** The sorts a view offers. Best match needs her match scores, so For you only. */
export function sortsForView(view: ForecastView): ForecastSort[] {
  return view === "for_you" ? SORTS : SORTS.filter((s) => s !== "match");
}

/** The order the list is in: the URL's sort, else the view's default. */
export function listSort(search: ForecastsSearch): ForecastSort {
  return search.sort ?? defaultSort(search.view ?? "for_you");
}

/** The URL value for a sort: absent for the view's default, and for a sort it does not offer. */
export function urlSortFor(view: ForecastView, sort: ForecastSort): UrlSort | undefined {
  if (sort === "match" || sort === defaultSort(view)) return undefined;
  return sort;
}

/**
 * The request without `page` and `limit`, as a query string. Two searches that ask
 * the same question give the same string, so it is also the hook's query key. The
 * view is always sent, and the sort only when it is not the view's default.
 */
export function forecastListQueryKey(search: ForecastsSearch): string {
  const params = new URLSearchParams();
  params.set("view", search.view ?? "for_you");
  if (search.lane && search.lane !== "all") params.set("lane", search.lane);
  const q = search.q?.trim().slice(0, MAX_Q_LENGTH);
  if (q) params.set("q", q);
  if (search.tab && search.tab !== "all") params.set("tab", search.tab);
  const sort = urlSortFor(search.view ?? "for_you", listSort(search));
  if (sort) params.set("sort", sort);

  const drawer = searchFromFilters(filtersFromSearch(search));
  const bounded = {
    ...drawer,
    cities: boundedCities(drawer.cities),
    naics: boundedNaics(drawer.naics),
  };
  for (const key of DRAWER_KEYS) {
    const value = bounded[key];
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

/** The full request for one page of a query key. */
export function pageParams(queryKey: string, page: number): URLSearchParams {
  const params = new URLSearchParams(queryKey);
  params.set("page", String(page));
  params.set("limit", String(FORECAST_PAGE_SIZE));
  return params;
}

/** The full request for one page of the list page's URL search. */
export function forecastListParams(search: ForecastsSearch, page: number): URLSearchParams {
  return pageParams(forecastListQueryKey(search), page);
}

/** The search words of a query key, or "" when it has none. */
export function searchWordsOf(queryKey: string): string {
  return new URLSearchParams(queryKey).get("q") ?? "";
}
