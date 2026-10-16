// The forecast list's URL search, as a type. It lives in lib, not in the route, so
// the pure Hunter mapping (hunterFilters.ts) can read and return it without an
// import from routes/. The route's `validateSearch` still owns the reading.

import type { FeedTab } from "../hunterChat";
import type { CaptureStatus, Lane } from "./copy";
import type { FilterSearch } from "./filters";

/** Everything the forecast list keeps in its URL. An absent key means its default. */
export interface ForecastsSearch extends FilterSearch {
  /** The view: absent is "Forecasts for you". Same ids as the feed's tabs. */
  view?: FeedTab;
  /** The capture-time tab: absent is "all". */
  tab?: "all" | CaptureStatus;
  /** The buyer lane: absent is "all". */
  lane?: Lane;
  /** The search words. */
  q?: string;
}
