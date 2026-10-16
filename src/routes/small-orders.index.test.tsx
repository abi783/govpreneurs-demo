// @vitest-environment jsdom
//
// Feature 3 — the surface reads the FEED'S day, and its banner stops lying.
//
// Two defects, one cause. The board derived its own `AS_OF` from the bundled
// fixture's `TODAY` and passed that into `queryOrders`, so the server's corpus
// clock (D2) was ignored by the client and the two-clock defect survived the
// backend fix: the live corpus is a month stale, every order in it closed
// before any wall clock, and a client cut against "today" empties a board the
// server filled. And the foot banner printed `CORPUS.synthetic` — "9 made-up
// ones for testing" — over whatever the server had actually served (D12).
//
// Rendered rather than asserted as strings, following `wallet.test.tsx` and the
// feature 9 tests beside this file: the criterion is about what reaches the
// screen, and a pure function agreeing with itself proves nothing about the
// sentence she reads.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NarrowSheet } from "../components/MicroPurchases/NarrowSheet";
import { queryBoard, type BoardFeed } from "../lib/microPurchases/feed";
import {
  NO_FILTERS,
  hunterSummary,
  isComplete,
  mayBid,
  narrowedSummary,
  forYouSummary,
  ourGap,
  queryOrders,
  type MicroFilters,
  EMPTY_CONTEXT,
  type MicroMemberContext,
} from "../lib/microPurchases/relevance";
import { LIVE_AS_OF, LIVE_MAPPED_ORDERS } from "../lib/microPurchases/liveMapperOutput.fixture";
import { MICRO_ORDERS, TODAY } from "../lib/mock/microPurchaseOrders";
import * as board from "./small-orders.index";

afterEach(cleanup);

/** The fixture's own day — the value this file used to export as `AS_OF`, and
 *  the value `feed.ts` still gives the bundled corpus. DERIVED from the mock
 *  corpus's own `TODAY`, never written out: hardcoded, it silently stops being
 *  the fixture's day the moment `TODAY` moves, and the two-clock assertion
 *  below would then compare the feed's day against nothing in particular. */
const FIXTURE_TODAY = TODAY.toISOString().slice(0, 10);
/** A served corpus a month older than that, which is the live corpus's actual
 *  shape: ingest stopped 2026-07-23 and the newest posting is 2026-07-22. */
const FEED_ASOF = "2026-07-22";
const FEED_LABEL = "22 July 2026";
const FEED_CLOSES = "2026-07-24";

// The exported empty context, not a hand-copy of it. `relevance.ts` owns what
// "she has told us nothing" means, and the three liveCorpus.* specs already
// import it — a seventh field added there should reach this file by compiling,
// not by someone remembering.
const NOBODY: MicroMemberContext = EMPTY_CONTEXT;

/** Orders the board would show on the fixture's own day, re-dated into the
 *  served corpus's month. Built from real corpus records rather than by hand so
 *  every field the permission rule, the cap and the sort read is the shape they
 *  are written against. */
const STALE_ORDERS = queryOrders(
  { filters: NO_FILTERS, sort: "best" },
  NOBODY,
  MICRO_ORDERS,
  FIXTURE_TODAY,
).rows.map((o) => ({ ...o, postedOn: FEED_ASOF, closesOn: FEED_CLOSES }));

const SERVED: BoardFeed = {
  orders: STALE_ORDERS,
  asOf: FEED_ASOF,
  postedOnLabel: FEED_LABEL,
  count: STALE_ORDERS.length,
  // The cap did not bite on this one: the page IS the board, so `total` is `count`.
  total: STALE_ORDERS.length,
  boardTotal: STALE_ORDERS.length,
};

/** The number on the sheet's confirm button, or 0 when it has been replaced by
 *  the zero-state sentence — a dead control explains nothing, so at zero there
 *  is no button to read. */
function sheetCount(): number {
  const button = screen.queryByRole("button", { name: /^Show \d+ orders?$/ });
  if (button == null) return 0;
  return Number(/\d+/.exec(button.textContent ?? "")?.[0]);
}

describe("the day the board is read for comes from the feed", () => {
  it("no longer exports a fixture-derived AS_OF", () => {
    expect(Object.keys(board)).not.toContain("AS_OF");
  });

  it("judges a served corpus against the day the server sent, not the fixture's", () => {
    expect(STALE_ORDERS.length).toBeGreaterThan(0);
    // The defect, stated as an assertion: on the day this file used to export,
    // every one of these orders has closed and the board is empty.
    expect(
      queryOrders({ filters: NO_FILTERS, sort: "best" }, NOBODY, STALE_ORDERS, FIXTURE_TODAY).rows,
    ).toHaveLength(0);
    expect(queryBoard({ filters: NO_FILTERS, sort: "best" }, NOBODY, SERVED).rows).toHaveLength(
      STALE_ORDERS.length,
    );
  });

  it.each<[string, MicroFilters]>([
    ["no filters", NO_FILTERS],
    ["a delivery answer", { size: "any", delivery: "days60" }],
    ["a size answer", { size: "under1k", delivery: "any" }],
  ])("counts the same board on the sheet as on the board itself — %s", (_name, filters) => {
    const rows = queryBoard({ filters, sort: "best" }, NOBODY, SERVED).rows.length;

    render(
      <NarrowSheet
        selected={filters}
        categories={[]}
        member={NOBODY}
        sort="best"
        feed={SERVED}
        onApply={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(sheetCount()).toBe(rows);
  });

  it("promises orders on the sheet, not a count the stale board cannot deliver", () => {
    render(
      <NarrowSheet
        selected={NO_FILTERS}
        categories={[]}
        member={NOBODY}
        sort="best"
        feed={SERVED}
        onApply={() => undefined}
        onClose={() => undefined}
      />,
    );

    // Guards the previous case against passing vacuously at 0 === 0, which is
    // exactly what a re-introduced wall clock would produce on both sides.
    expect(sheetCount()).toBeGreaterThan(0);
  });
});

// DH-28. The board loads 50 and asks before loading more. The control is
// member-facing: she is deciding whether to bid, not operating a database, so
// it says how many ORDERS the click will load and how many are still there.
// REMOVED ON THE OWNER'S CALL: the "Orders you won" row, the wins page it led
// to, and the grey foot banner under it ("50 orders from DLA… DLA posts about
// 2,145 orders a day…"). The recorded wins themselves are not removed — the
// capability statement still reads them.
describe("the board's foot carries no wins row and no banner", () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

  it("offers no route to a wins page", () => {
    expect(source("src/routeTree.gen.ts")).not.toContain("/small-orders/wins");
    expect(source("src/routes/small-orders.index.tsx")).not.toContain("Orders you won");
  });

  it("renders no foot banner", () => {
    expect("FeedBanner" in board).toBe(false);
    expect(source("src/routes/small-orders.index.tsx")).not.toContain("mp-sample");
  });
});

describe("the Load more control", () => {
  const MORE = { cursor: "opaque-server-token", loads: 50, remaining: 450 };

  it("names no number on the button, and says how many are left", () => {
    // A page of 50 orders can add fewer than 50 rows: some go to "Ones not open
    // to you" and her filters hide others. So the button promises no count.
    const { container } = render(
      <board.LoadMore next={MORE} loading={false} onLoad={() => undefined} />,
    );

    const button = screen.getByRole("button", { name: "Load more" });
    expect(button.textContent ?? "").not.toMatch(/\d/);
    expect(container.textContent ?? "").toContain("450 more orders are ready to load.");
  });

  it("says Load more on the last page too, and says nothing about a remainder", () => {
    const { container } = render(
      <board.LoadMore
        next={{ ...MORE, loads: 12, remaining: 12 }}
        loading={false}
        onLoad={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
    expect(container.textContent ?? "").not.toContain("ready to load");
    expect(container.textContent ?? "").not.toMatch(/\d/);
  });

  it("renders NOTHING when there is nothing more to load", () => {
    // The last page must end cleanly. A control that fetches nothing is worse
    // than no control: she presses it, waits, and the board does not change.
    const { container } = render(
      <board.LoadMore next={null} loading={false} onLoad={() => undefined} />,
    );

    expect(container.textContent).toBe("");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says it is asking DLA while the request is open, and refuses a second click", () => {
    const { container } = render(<board.LoadMore next={MORE} loading onLoad={() => undefined} />);

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(container.textContent ?? "").toContain("Getting them from DLA");
  });

  it("prints its numbers grouped, the way every other count on this board is", () => {
    const { container } = render(
      <board.LoadMore
        next={{ ...MORE, remaining: 13_368 }}
        loading={false}
        onLoad={() => undefined}
      />,
    );

    expect(container.textContent ?? "").toContain("13,368 more orders");
  });

  it("counts ORDERS and not matches, because the list above it is ranked", () => {
    // `relevance.ts` filters and ranks what the board shows, so loading 50 more
    // orders may add two rows or none. A button promising "50 more" over a list
    // that grew by two would be a small lie repeated on every click.
    const { container } = render(
      <board.LoadMore next={MORE} loading={false} onLoad={() => undefined} />,
    );
    const text = container.textContent ?? "";

    expect(text).toContain("orders");
    expect(text).not.toContain("match");
    expect(text).not.toContain("result");
  });
});

describe("a feed that never arrived is not a quiet day", () => {
  const broken = queryBoard({ filters: NO_FILTERS, sort: "best" }, NOBODY, null);

  // PR 38 folded Hunter into the board panel, so there is no longer a component
  // to render in isolation — the behaviour now lives in the gate on that block.
  // Testing the gate is testing the thing that ships; rendering a component the
  // route no longer mounts would pass while the page said the wrong sentence.
  it("keeps Hunter on screen for a member who has named her trade and has no rows", () => {
    expect(board.hunterRides(false, true, false)).toBe(true);
  });

  it("stands Hunter down on a genuinely quiet day, so EmptyState owns it", () => {
    expect(board.hunterRides(false, true, true)).toBe(false);
  });

  it("still has the sentence to say", () => {
    // The gate is only half of it: the summary must actually carry the
    // broken-feed branch, or Hunter rides and says something else.
    expect(hunterSummary(broken, NOBODY)).toContain("Today's orders from DLA did not load");
  });

  it("does not also tell her the market is quiet", () => {
    const { container } = render(
      <board.EmptyState
        feedArrived={broken.feedArrived}
        hasFilters={false}
        categoryLabel="Fasteners"
        scoped
        onClear={() => undefined}
        onChangeCategory={() => undefined}
      />,
    );

    expect(container.textContent).toBe("");
  });

  it("still tells her the market is quiet when the feed DID arrive empty", () => {
    const { container } = render(
      <board.EmptyState
        feedArrived
        hasFilters={false}
        categoryLabel="Fasteners"
        scoped
        onClear={() => undefined}
        onChangeCategory={() => undefined}
      />,
    );

    expect(container.textContent).toContain("Nothing today for fasteners.");
  });
});

// The board's three tabs. "For you" and "All orders" are server walks; "Saved"
// is her saved list read by id. The sort buttons they replaced are gone. The
// strip is the opportunities feed's tab bar, so the two pages look the same.
describe("the board tabs", () => {
  /** Every tab button in DOM order. */
  function tabButtons(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(".opps-tabs .opps-tab"));
  }

  it("renders the shared tab bar with Orders for you, All orders and Saved, in that order", () => {
    const { container } = render(<board.BoardTabs view="for-you" onChange={() => undefined} />);

    expect(
      tabButtons(container).map((b) => b.querySelector(".opps-tab-label")?.textContent),
    ).toEqual(["Orders for you", "All orders", "Saved"]);
    expect(tabButtons(container).every((b) => b.querySelector("svg") != null)).toBe(true);
    expect(container.textContent).not.toMatch(/Best first|Closing soon|Biggest first/);
  });

  it("renders no count badge on any tab", () => {
    const { container } = render(<board.BoardTabs view="for-you" onChange={() => undefined} />);

    expect(container.querySelectorAll(".opps-tab-count")).toHaveLength(0);
  });

  it("marks the tab she is on, and only that one", () => {
    const { container } = render(<board.BoardTabs view="saved" onChange={() => undefined} />);

    expect(tabButtons(container).map((b) => b.getAttribute("aria-pressed"))).toEqual([
      "false",
      "false",
      "true",
    ]);
    expect(tabButtons(container)[2].classList.contains("is-active")).toBe(true);
  });

  it("asks for the tab she taps", () => {
    const picked: string[] = [];
    render(<board.BoardTabs view="for-you" onChange={(v) => picked.push(v)} />);

    fireEvent.click(screen.getByRole("button", { name: "All orders" }));

    expect(picked).toEqual(["all"]);
  });

  it("keeps a real tab in the address and drops the old sort", () => {
    const validate = board.Route.options.validateSearch as (
      input: Record<string, unknown>,
    ) => board.MicroSearch;

    expect(validate({ view: "saved" })).toEqual({ view: "saved" });
    expect(validate({ view: "everything", sort: "closing" })).toEqual({});
  });
});

describe("the line that says what the board is narrowed to", () => {
  it("names one category in words", () => {
    expect(narrowedSummary(["filters"], NO_FILTERS)).toBe("Only filters.");
  });

  it("counts several, because their names hold commas", () => {
    expect(narrowedSummary(["filters", "pipes-valves"], NO_FILTERS)).toBe(
      "Only the 2 kinds of parts you picked.",
    );
  });

  it("puts the categories before the other filters", () => {
    const summary = narrowedSummary(["filters"], { ...NO_FILTERS, delivery: "days30" });

    expect(summary.startsWith("Only filters. Showing")).toBe(true);
  });
});

describe("Hunter's line on the For you tab", () => {
  it("names the whole board and the orders that fit her profile, in the owner's words", () => {
    expect(forYouSummary(11404, 295)).toBe(
      "Out of 11,404 orders, Hunter has read your profile and matched 295 orders that fit your domain of work.",
    );
  });

  it("keeps the verb and noun right at one", () => {
    expect(forYouSummary(1, 1)).toBe(
      "Out of 1 order, Hunter has read your profile and matched 1 order that fits your domain of work.",
    );
  });
});

describe("an empty For you", () => {
  it("says where the picks come from and opens every order", () => {
    let seeAll = 0;
    render(<board.ForYouEmpty feedArrived onSeeAll={() => (seeAll += 1)} />);

    expect(screen.getByText(/business profile/, { selector: ".mp-empty__head" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "See all orders" }));
    expect(seeAll).toBe(1);
  });

  it("says nothing over a walk that failed, because Hunter's verdict says it", () => {
    const { container } = render(
      <board.ForYouEmpty feedArrived={false} onSeeAll={() => undefined} />,
    );

    expect(container.textContent).toBe("");
  });
});

describe("the Saved tab when it has no rows", () => {
  it("says it is getting them while the read is open", () => {
    const { container } = render(
      <board.SavedEmpty state="loading" onRetry={() => undefined} onSeeAll={() => undefined} />,
    );

    expect(container.textContent).toContain("Getting your saved orders");
    expect(container.textContent).not.toContain("not saved any");
  });

  it("offers to try again when the read failed, and never claims she saved nothing", () => {
    let retried = 0;
    const { container } = render(
      <board.SavedEmpty state="failed" onRetry={() => (retried += 1)} onSeeAll={() => undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retried).toBe(1);
    expect(container.textContent).not.toContain("not saved any");
  });

  it("says she has saved nothing only when the read succeeded", () => {
    const { container } = render(
      <board.SavedEmpty state="ready" onRetry={() => undefined} onSeeAll={() => undefined} />,
    );

    expect(container.textContent).toContain("You have not saved any orders yet.");
  });
});

// DH-38. The last "you can bid" on this surface was the hint under the sort
// row: "Best means orders you can bid today". DH-36 left it deliberately,
// because it is a claim about the RANKING and not about membership. So it is
// decided against the sort, and the sort says it is false.
//
// `queryOrders()` builds the list from `mayBid(o) || ourGap(o) != null` and
// orders it on `relevanceScore()`. That score holds no permission term. It
// reads her record with the exact stock number — won +2000, supplied +1000,
// said-she-can-get +400 — and it DEMOTES an order we could not rule on by 300.
// A demotion is a position, not a boundary, so a record of her own puts a gap
// row at the top of "Best first". Measured on the live-mapper board,
// 10 September 2026: 12 rows, 4 she may bid and 8 we could not rule on.
describe("the hint under the sort row", () => {
  /** The board the hint sits over, ranked as "Best first" ranks it. */
  const bestFirst = (m: MicroMemberContext) =>
    queryOrders({ filters: NO_FILTERS, sort: "best" }, m, [...LIVE_MAPPED_ORDERS], LIVE_AS_OF).rows;

  const LIVE = bestFirst(NOBODY);
  /** The best-ranked order we could not rule on, and the worst-ranked complete
   *  row. One tap lifts the first; her own win lifts the second. Complete
   *  orders rank above every other order, so a win lifts an order to the top
   *  of its own tier and no higher. */
  const TOP_GAP = LIVE.find((o) => ourGap(o) != null)!;
  const LAST_ROW = LIVE.filter(isComplete).at(-1)!;

  it("sits over a sort that ranks both populations", () => {
    // Without this the cases below argue about a board that cannot break the
    // rule. Both kinds of row have to be under the hint.
    expect(LIVE.filter((o) => mayBid(o)).length).toBeGreaterThan(0);
    expect(LIVE.filter((o) => ourGap(o) != null).length).toBeGreaterThan(0);
  });

  it("cannot mean 'orders you can bid today', because one tap puts a gap row first", () => {
    // THE MEASUREMENT THAT DECIDES DH-38. `ourGap()` costs 300 and her answer
    // on the sourcing panel pays 400, so the top of "Best first" is an order we
    // could not rule on — with four rows she may bid underneath it.
    const said = bestFirst({ ...NOBODY, attestedNsns: [TOP_GAP.nsn] });

    expect(said[0].id).toBe(TOP_GAP.id);
    expect(mayBid(said[0])).toBe(false);
    expect(ourGap(said[0])).not.toBeNull();
  });

  it("claims no permission, in either of its two forms", () => {
    // The same gate DH-36 put over the heading, over the sentence DH-36 left.
    // "bid" is the verb every overclaim on this surface has used.
    for (const hasCategories of [false, true]) {
      const { container } = render(<board.SortHint hasCategories={hasCategories} />);

      expect((container.textContent ?? "").toLowerCase()).not.toContain("bid");
    }
  });

  it("names the two things the sort really lifts, and they really lift", () => {
    // A hint that avoided "bid" and said nothing would pass the case above. The
    // sentence has to name the top key, and the key has to be real: each
    // assertion below re-runs the sort rather than trusting the score's
    // constants. Mutate either bonus in `relevanceScore()` and this case fails.
    const { container } = render(<board.SortHint hasCategories={false} />);
    const hint = (container.textContent ?? "").toLowerCase();

    expect(hint).toContain("won");
    expect(hint).toContain("said you can get");

    const won = bestFirst({
      ...NOBODY,
      wonQuotes: [{ nsn: LAST_ROW.nsn, pricePerUnit: null, wonOn: LIVE_AS_OF }],
    });
    expect(won[0].id).toBe(LAST_ROW.id);
    expect(bestFirst({ ...NOBODY, attestedNsns: [TOP_GAP.nsn] })[0].id).toBe(TOP_GAP.id);
  });

  it("offers the category half only when she has given us a category", () => {
    // Unchanged by DH-38 and pinned so it stays that way: with no category on
    // file, "ones that fit what you sell" describes a fact she never gave us.
    const without = render(<board.SortHint hasCategories={false} />).container.textContent ?? "";
    const with_ = render(<board.SortHint hasCategories />).container.textContent ?? "";

    expect(without).not.toContain("what you sell");
    expect(with_).toContain("what you sell");
  });

  it("names her business profile when fit comes from it and she has picked no category", () => {
    // Best first ranks by her matching-engine score, or her NAICS codes, even
    // before she answers "What do you sell?". The hint says so, and says where
    // the fit comes from — never "what you sell", which she has not told us here.
    const text =
      render(<board.SortHint hasCategories={false} hasProfileFit />).container.textContent ?? "";

    expect(text).toContain("your business profile");
    expect(text).not.toContain("what you sell");
  });
});
