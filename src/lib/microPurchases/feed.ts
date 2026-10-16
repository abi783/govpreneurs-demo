// Small orders — who owns the corpus.
//
// One slice, one owner. Four surfaces read the board's orders — the board, one
// order, the restricted list and the wins page — and before this they each
// imported the bundled fixture directly. That was correct while the corpus was
// a module; it is wrong once the corpus is a REQUEST, because four importers of
// a static array become four surfaces that disagree about whether the feed
// arrived.
//
// THE THREE STATES, AND WHY THEY ARE THREE:
//
//   undefined     — not asked yet, or the request is in flight. The surface
//                   shows a spinner. It says nothing about the board, because
//                   it does not yet know anything about the board.
//   BoardFeed     — the server answered. `orders` possibly empty: "There are no
//                   orders today." is a real and different sentence.
//   null          — the request failed. "Today's orders from DLA did not
//                   load."
//
// `relevance.ts` types its corpus parameter `MicroOrder[] | null` for exactly
// this reason and turns it into `feedArrived`. In the prototype that null was
// unreachable — every call site passed the static array, so a sentence that was
// written, typed and asserted could never render. It is reachable now.
//
// ── AND THE DAY IS THE FEED'S TOO (D2, feature 3) ─────────────────────────
//
// This module used to keep `feed.orders` and throw the other three fields away,
// so the board derived its own `AS_OF` from the fixture's `TODAY` and passed
// THAT into `queryOrders`. Two clocks: the server cut the corpus against the
// newest posting date it actually holds, and the client then cut the result
// again against a day the server knows nothing about. The live corpus is a
// month stale, so the client's cut removed all of it and the board read as a
// broken feature rather than a stale one.
//
// One clock, and it is the corpus's. What the server said — `asOf`,
// `postedOnLabel`, `count` — is held whole and handed to every reader, and
// `queryBoard()` below is the ONE place a held feed becomes a `queryOrders`
// call. Three surfaces call it (the board, the narrow sheet, the restricted
// list), so they cannot be judging different days: there is no second argument
// left for them to disagree about.
//
// ── WHY FIRST PAINT IS A SPINNER AND NOT THE BUNDLED CORPUS ──────────────
//
// This module used to seed itself with the 25 committed sample records so the
// board was never blank. That was a stale board for the width of one request,
// and the request takes 13 to 21 seconds. Nine of those records were written by
// hand and none of them are orders she can bid, so for twenty seconds the
// surface whose first rule is that everything it says is true showed her made-up
// orders and named them as the board.
//
// A spinner says the one true thing we know while the request is open: we are
// asking. It cannot be mistaken for an answer, which is the whole defect the
// bundled first paint had.

import { useSyncExternalStore } from "react";
import { bus } from "../eventBus";
import type { MicroOrder } from "./order";
import {
  queryOrders,
  type CensusRow,
  type MicroQuery,
  type MicroMemberContext,
  type MicroResult,
} from "./relevance";
import {
  fetchCodeCensus,
  fetchSmallOrdersFeed,
  type SmallOrdersFeed,
  type SmallOrdersNextPage,
} from "./api";
import { biddablePairsFromCensus } from "./restrictedGroups";
import type { FeedView } from "./boardView";
import type { MicroCategory } from "./categories";

/**
 * The BOARD as the app holds it — every page that has arrived, as one feed.
 *
 * It carried a `sample` flag while this module seeded itself with the bundled
 * corpus — the one fact the wire could not carry, and the banner could not do
 * without, because a count printed over 25 committed records would have been
 * the quietest possible lie. Nothing seeds itself any more, so every feed the
 * app holds came off the wire and there is no second kind to tell it from.
 *
 * **IT DROPS `more`, AND THAT IS THE POINT (DH-28).** `more` is a fact about
 * one REQUEST — where the next page starts — and the board is what she is
 * looking at. Four surfaces read this type (the board, one order, the
 * restricted list, the wins page) and only one of them pages; a cursor on the
 * type every surface reads is a cursor three of them would have to ignore. It
 * is held beside the board instead, by this module, which is the only thing
 * that issues a request.
 */
export type BoardFeed = Omit<SmallOrdersFeed, "more">;

/**
 * The feed, in one of its three states.
 *
 * `undefined` until `loadFeed()` settles — see the header. It is deliberately
 * distinct from `null`: one means we have not been told, the other means we
 * asked and failed, and only the second has a sentence to show her.
 */
let corpus: BoardFeed | null | undefined;
let started = false;

/**
 * Where the next page starts, or `null` when the board is whole.
 *
 * It is the SERVER's answer, held verbatim. The board never derives it: a
 * client that decided for itself whether another page exists would have to
 * guess from `orders.length`, and a full page and a last page look identical
 * from here. The server reads one document past the page to know.
 */
let nextPage: SmallOrdersNextPage | null = null;

/** True while a "Load more" request is open, so a second click does not issue
 *  a second request against the same cursor. */
let loadingMore = false;

/**
 * The feed as the app currently holds it.
 *
 * `undefined` while the request is open, `null` once one has failed, and the
 * feed itself once one has landed.
 */
export function getBoardFeed(): BoardFeed | null | undefined {
  return corpus;
}

/** What the board is holding about its next page, for the one surface that
 *  pages. `null` means there is nothing more to load, and no control renders. */
export function getFeedNextPage(): SmallOrdersNextPage | null {
  return nextPage;
}

/** True while a "Load more" request is open. */
export function isLoadingMore(): boolean {
  return loadingMore;
}

/**
 * One order out of the corpus.
 *
 * Replaces `getMicroOrder()` from the fixture module, which could only ever
 * answer about the bundled 25. `undefined` is the order page's designed "that
 * order is not here any more" state, and a failed feed produces it too — which
 * is correct: we cannot claim an order exists on a board we could not fetch.
 */
export function findFeedOrder(id: string): MicroOrder | undefined {
  return corpus?.orders.find((o) => o.id === id);
}

/**
 * Read the board out of the feed we hold — the ONE seam between the two.
 *
 * Both of `queryOrders`' data arguments come out of the same object here, so a
 * caller cannot pass one surface's orders against another surface's day. That
 * is not a hypothetical: the board, the narrow sheet and the restricted list
 * each passed the pair separately, and each drift between them was found on
 * screen rather than in a type.
 *
 * `null` in stays `null` through to `feedArrived: false` — a fetch that failed
 * must never arrive at `queryOrders` as an empty corpus.
 */
export function queryBoard(
  query: MicroQuery,
  member: MicroMemberContext,
  feed: BoardFeed | null | undefined,
): MicroResult {
  // `undefined` (still asking) collapses to `null` (asked and failed) HERE and
  // only here, because `queryOrders` has two answers and this has three. The
  // surfaces show a spinner rather than a board while the request is open, so
  // this branch is the backstop for a caller that does not — and between the
  // two, "no board" is the safe one. Claiming an empty board would be the
  // failure `feedArrived` exists to prevent.
  return queryOrders(query, member, feed ? feed.orders : null, feed?.asOf ?? "");
}

/**
 * Fetch the corpus, once per page load.
 *
 * Idempotent — all four surfaces call it on mount and only the first does the
 * work. Nothing here throws: a failed fetch sets `null`, which is a state the
 * board renders a sentence for, not an error to propagate.
 */
/** The view the corpus is currently walked in. */
let walkView: FeedView = "all";
/** The categories it is walked in, sorted. Empty is every category. */
let walkCategories: MicroCategory[] = [];

/** The view the corpus is currently walked in. The board reads it to know
 *  which tab the feed in hand belongs to. */
export function getWalkView(): FeedView {
  return walkView;
}

/**
 * Counts walks. A response from an older walk is dropped: she switched tabs
 * while it was open, and its orders belong to the tab she left.
 */
let walkId = 0;

/** The code census over the whole board, as the feed store holds it. */
export type CodeCensus = { rows: CensusRow[]; total: number };

/** The census request, shared by every caller. A failed one is forgotten, so
 *  the next caller asks again. */
let census: Promise<CodeCensus | null> | null = null;

/**
 * The code census, asked for once per page load. `null` when it did not load.
 *
 * The "For you" walk needs it to name the pairs she may bid, and the board
 * reads it to decide whether "Ones not open to you" has anything behind it.
 */
export function loadCodeCensus(): Promise<CodeCensus | null> {
  if (census != null) return census;
  const asked = fetchCodeCensus().then((answer) => {
    if (answer == null && census === asked) census = null;
    return answer;
  });
  census = asked;
  return asked;
}

/**
 * The first page of a walk.
 *
 * "FOR YOU" SHOWS ONLY ORDERS SHE MAY BID BY ACQUISITION CODE (owner,
 * 2026-09-15). The server cannot rule on a code, so this asks for the census,
 * rules each pair with `relevance.ts` and sends the pairs that pass. The walk
 * and its count then read the same narrowed set.
 *
 * IF THE CENSUS DOES NOT LOAD, THE WALK FAILS. Walking her NAICS set without
 * the pairs would put orders she may not bid under "For you", and its count
 * would call them matches. The board says the orders did not load, and "All
 * orders" still works.
 */
async function firstPage(
  view: FeedView,
  categories: readonly MicroCategory[],
): Promise<SmallOrdersFeed | null> {
  if (view !== "for-you") {
    return fetchSmallOrdersFeed(undefined, undefined, view, categories);
  }
  const codes = await loadCodeCensus();
  if (codes == null) return null;
  return fetchSmallOrdersFeed(
    undefined,
    undefined,
    view,
    categories,
    [],
    biddablePairsFromCensus(codes.rows),
  );
}

export async function loadFeed(): Promise<void> {
  if (started) return;
  started = true;
  const walk = ++walkId;
  const feed = await firstPage(walkView, walkCategories);
  if (walk !== walkId) return;
  corpus = feed ? boardOf(feed) : null;
  nextPage = feed?.more ?? null;
  bus.publish("smallOrdersFeed");
}

/**
 * Walk a different view — "For you" or "All orders" — from the beginning.
 *
 * WHY IT REFETCHES RATHER THAN FILTERS. The board is capped at 500 and pages at
 * 50, so the rows in hand are the NEWEST ones of the whole board. Filtering
 * them to her NAICS set would show the few of those 50 that fit, and none of
 * the fitting orders posted earlier. The server walks her set instead.
 *
 * IT CLEARS THE BOARD WHILE IT ASKS. The rows in hand belong to the other tab,
 * and showing them under this one would put orders under "For you" that were
 * not chosen for her. The board shows its loading state until the walk lands.
 *
 * HER CATEGORIES ARE PART OF THE WALK. The server narrows to them, so changing
 * them in the filter menu starts a new walk the same way a tab does.
 *
 * A NO-OP WHEN NEITHER HAS CHANGED and a walk has started, so re-picking the
 * active tab does not blank the board she is reading.
 */
export async function walkFeedFor(
  view: FeedView,
  categories: readonly MicroCategory[] = [],
): Promise<void> {
  const sorted = [...categories].sort();
  if (started && view === walkView && sorted.join(",") === walkCategories.join(",")) return;
  walkView = view;
  walkCategories = sorted;
  started = true;
  const walk = ++walkId;
  corpus = undefined;
  nextPage = null;
  bus.publish("smallOrdersFeed");
  const feed = await firstPage(view, sorted);
  if (walk !== walkId) return;
  corpus = feed ? boardOf(feed) : null;
  nextPage = feed?.more ?? null;
  bus.publish("smallOrdersFeed");
}

/**
 * Load the next page and APPEND it — "Load more" (DH-28).
 *
 * ── WHAT IT DOES NOT DO ──────────────────────────────────────────────────
 *
 * It does not refetch the first page. The cursor names the row the last page
 * stopped on, so the server continues from there and the orders she already has
 * are never read again.
 *
 * It does not overwrite the board on a failure. She is looking at fifty real
 * orders; a failed second page must not blank them. So a `null` from the wire
 * leaves `corpus` exactly as it was, and leaves `nextPage` in place so pressing
 * the control again retries. **This is the one place where `null` is NOT "we
 * could not get today's orders"** — we already got them, and one more page did
 * not arrive.
 *
 * ── WHAT IT ADDS UP, AND WHAT IT REFUSES TO ──────────────────────────────
 *
 * `count` is SUMMED across pages, which is what keeps DH-05's disclosure true
 * at every step: `bannerSlice()` prints `count` as what is ON SCREEN, so it
 * must grow as she loads. Each page's `count` has already had DH-12's dropped
 * rows subtracted from it, so the sum stays equal to `orders.length`.
 *
 * `total` is NOT summed and not recomputed. It is the server's measurement of
 * the market, taken over one pinned corpus clock, and the same number arrives
 * on every page of one walk. The first page's is kept, because mixing a later
 * page's re-count with the first page's rows would put two instants in one
 * sentence.
 */
export async function loadMoreFeed(): Promise<void> {
  const held = corpus;
  const from = nextPage;
  if (loadingMore || from === null || !held) return;
  loadingMore = true;
  bus.publish("smallOrdersFeed");
  try {
    const walk = walkId;
    const page = await fetchSmallOrdersFeed(from.cursor, undefined, walkView, walkCategories);
    // A page of a walk she has left belongs to the other tab.
    if (!page || walk !== walkId) return;
    corpus = {
      orders: [...held.orders, ...page.orders],
      // The corpus clock is the FIRST page's, and the server pins it into the
      // cursor so every later page answers with the same one. Keeping the held
      // value says so, rather than trusting the two to agree.
      asOf: held.asOf,
      postedOnLabel: held.postedOnLabel,
      count: held.count + page.count,
      total: held.total,
      boardTotal: held.boardTotal,
    };
    nextPage = page.more;
  } finally {
    loadingMore = false;
    bus.publish("smallOrdersFeed");
  }
}

/** One wire page as a board. The cursor half is held separately — see
 *  `BoardFeed`. */
function boardOf(page: SmallOrdersFeed): BoardFeed {
  return {
    orders: page.orders,
    asOf: page.asOf,
    postedOnLabel: page.postedOnLabel,
    count: page.count,
    total: page.total,
    boardTotal: page.boardTotal,
  };
}

/**
 * The corpus, live.
 *
 * `useSyncExternalStore` rather than state-plus-effect, matching the pattern
 * `useLiveSlice` exists for — the corpus is read during render by four
 * surfaces and swapped once, which is precisely the tearing hazard the hook
 * closes.
 */
export function useSmallOrdersFeed(): BoardFeed | null | undefined {
  return useSyncExternalStore(
    (fn) => bus.subscribe("smallOrdersFeed", fn),
    getBoardFeed,
    getBoardFeed,
  );
}

/**
 * The next page, live — for the ONE surface that renders a "Load more".
 *
 * A separate hook rather than a field on `useSmallOrdersFeed()`, because three
 * of the four surfaces that read the board have no control to render and no
 * business knowing a cursor exists.
 */
export function useFeedNextPage(): SmallOrdersNextPage | null {
  return useSyncExternalStore(
    (fn) => bus.subscribe("smallOrdersFeed", fn),
    getFeedNextPage,
    getFeedNextPage,
  );
}

/** Whether a "Load more" request is open, live. */
export function useLoadingMore(): boolean {
  return useSyncExternalStore(
    (fn) => bus.subscribe("smallOrdersFeed", fn),
    isLoadingMore,
    isLoadingMore,
  );
}
