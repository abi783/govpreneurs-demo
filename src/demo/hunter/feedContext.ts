// DEMO (Hunter): what the feed page is showing right now.
//
// The page publishes its tab, filters, sort and search here after each change.
// Two handlers read it:
//   - `POST /opportunities/discover/v2/counts` sends bare filters with no tab.
//     The counts must describe the tab the member is on.
//   - The Hunter chat applies a change to the member's current filters, so it
//     must know them to say how many matches the change leaves.
// It is plain module state: the page and the handlers run in the same browser.

import type { ServerFilters, ServerSort } from "../../lib/discoverApi";
import type { FeedTab } from "../../lib/hunterChat";
import type { BuyerLane } from "../../lib/buyerLane";

export interface FeedContext {
  tab: FeedTab;
  lane: BuyerLane;
  /** The server filters of the tab, with the buyer lane and the search added. */
  filters: ServerFilters;
  sort: ServerSort;
}

let current: FeedContext = {
  tab: "for_you",
  lane: "all",
  filters: {},
  sort: { field: "match", order: "desc" },
};

/** The page calls this after each change of tab, lane, filters, sort or search. */
export function publishFeedContext(next: FeedContext): void {
  current = next;
}

export function getFeedContext(): FeedContext {
  return current;
}
