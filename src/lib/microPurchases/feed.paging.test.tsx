// @vitest-environment jsdom
//
// Small orders — the board arrives 50 at a time, and "Load more" APPENDS.
//
// DH-28. The member asked for this: the board served 500 orders in one request
// and took 13 to 28 seconds to do it. Measured against production on
// 2026-09-10 — 50 rows cost 1,045 ms of corpus read and 43 KB of payload;
// 500 rows cost 4,928 ms and 422 KB.
//
// ── WHAT THIS FILE HOLDS THE LINE ON ─────────────────────────────────────
//
//   · the next page is APPENDED, and the first page is never refetched;
//   · `count` is SUMMED, so DH-05's disclosure names what is ON SCREEN at
//     every step and grows as she loads;
//   · `total` is the SERVER's measurement of the market and is never summed,
//     never recomputed and never edited;
//   · a failed second page leaves the fifty real orders she is looking at
//     exactly where they are — this is the one place on this surface where a
//     `null` from the wire is NOT "we could not get today's orders";
//   · the control stops when the server says the walk is over.
//
// Its own file because `feed.ts` keeps module-level state and guards `loadFeed`
// with a `started` flag, so a second test in the same module would read the
// first one's board. Every case below re-imports the module fresh, which is the
// same reason `feed.firstPaint.test.ts` is a separate file.
//
// Layer: INTERFACE ADAPTERS. It stubs `fetch` and imports no surface.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { LIVE_MAPPED_ORDERS } from "./liveMapperOutput.fixture";
import type { MicroOrder } from "./order";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
  // A fresh copy of the store per test. `corpus`, `started` and the cursor are
  // module-level, so without this the second test reads the first's board.
  vi.resetModules();
});

/** The board's whole market, as the server measures it. */
const TOTAL = 13_418;
const ASOF = "2026-09-07";
const LABEL = "7 September 2026";

/** One page the server could really have sent, from real mapper output. */
function page(from: number, size: number, more: unknown): Record<string, unknown> {
  const orders = Array.from({ length: size }, (_, i) => ({
    ...LIVE_MAPPED_ORDERS[(from + i) % LIVE_MAPPED_ORDERS.length],
    id: `dibbs-page-${from + i}`,
  }));
  return { orders, asOf: ASOF, postedOnLabel: LABEL, count: size, total: TOTAL, more };
}

/** Answer each request in turn with the bodies given, as 200s. */
function serve(...bodies: unknown[]): void {
  for (const body of bodies) {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }));
  }
}

/** The store, freshly imported. */
async function store() {
  return await import("./feed");
}

/** The `after=` value of the nth request, or null when it asked for page one. */
function askedFor(call: number): string | null {
  const url = new URL(String(mockFetch.mock.calls[call][0]), "http://x");
  return url.searchParams.get("after");
}

const CURSOR_1 = "cursor-after-page-one";
const CURSOR_2 = "cursor-after-page-two";

describe("the first page", () => {
  it("holds 50 orders and knows there is more to load", async () => {
    serve(page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }));
    const feed = await store();

    await feed.loadFeed();

    expect(feed.getBoardFeed()?.orders).toHaveLength(50);
    expect(feed.getBoardFeed()?.count).toBe(50);
    expect(feed.getFeedNextPage()).toEqual({
      cursor: CURSOR_1,
      loads: 50,
      remaining: 450,
    });
  });

  it("offers nothing more to load when the server says the board is whole", async () => {
    serve(page(0, 12, null));
    const feed = await store();

    await feed.loadFeed();

    expect(feed.getFeedNextPage()).toBeNull();
  });
});

describe("Load more appends, and refetches nothing", () => {
  it("adds the next 50 to the 50 she already has", async () => {
    serve(
      page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }),
      page(50, 50, { cursor: CURSOR_2, loads: 50, remaining: 400 }),
    );
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    const held = feed.getBoardFeed();
    expect(held?.orders).toHaveLength(100);
    // In order, and every one of them once.
    expect(held?.orders[0].id).toBe("dibbs-page-0");
    expect(held?.orders[50].id).toBe("dibbs-page-50");
    expect(new Set(held?.orders.map((o: MicroOrder) => o.id)).size).toBe(100);
  });

  it("asks the server to CONTINUE, so the first fifty are never read again", async () => {
    serve(
      page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }),
      page(50, 50, { cursor: CURSOR_2, loads: 50, remaining: 400 }),
    );
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(askedFor(0)).toBeNull();
    expect(askedFor(1)).toBe(CURSOR_1);
  });

  it("moves the cursor on, so a third click asks for a third page", async () => {
    serve(
      page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }),
      page(50, 50, { cursor: CURSOR_2, loads: 50, remaining: 400 }),
      page(100, 50, null),
    );
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();
    await feed.loadMoreFeed();

    expect(askedFor(2)).toBe(CURSOR_2);
    expect(feed.getBoardFeed()?.orders).toHaveLength(150);
    expect(feed.getFeedNextPage()).toBeNull();
  });

  it("does nothing at all when there is nothing more to load", async () => {
    serve(page(0, 12, null));
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("issues ONE request when the control is pressed twice", async () => {
    // A second click against the same cursor would append the same fifty rows
    // twice, which is the repeat the cursor exists to prevent.
    let release: (value: Response) => void = () => undefined;
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 })), {
        status: 200,
      }),
    );
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
    );
    const feed = await store();
    await feed.loadFeed();

    const first = feed.loadMoreFeed();
    const second = feed.loadMoreFeed();
    expect(feed.isLoadingMore()).toBe(true);
    release(new Response(JSON.stringify(page(50, 50, null)), { status: 200 }));
    await Promise.all([first, second]);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(feed.getBoardFeed()?.orders).toHaveLength(100);
    expect(feed.isLoadingMore()).toBe(false);
  });
});

describe("DH-05's disclosure stays true at every step", () => {
  it("grows `count` with what is ON SCREEN and leaves `total` alone", async () => {
    serve(
      page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }),
      page(50, 50, { cursor: CURSOR_2, loads: 50, remaining: 400 }),
    );
    const feed = await store();

    await feed.loadFeed();
    expect(feed.getBoardFeed()?.count).toBe(50);
    expect(feed.getBoardFeed()?.total).toBe(TOTAL);

    await feed.loadMoreFeed();
    // "Showing the newest 100 of 13,418 open orders." — the first number is
    // what she can see and the second is the market, unchanged.
    expect(feed.getBoardFeed()?.count).toBe(100);
    expect(feed.getBoardFeed()?.total).toBe(TOTAL);
  });

  it("keeps `count === orders.length` after a page lost a row (DH-12)", async () => {
    // The second page arrives with a row that is not an object. `narrowFeed`
    // drops it and subtracts it from THAT page's count, and the sum stays the
    // number of rows on screen — which is what `bannerSlice()` prints.
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const second = page(50, 50, null);
    (second.orders as unknown[])[7] = "not an order";
    serve(page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }), second);
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    const held = feed.getBoardFeed();
    expect(held?.orders).toHaveLength(99);
    expect(held?.count).toBe(99);
    expect(held?.count).toBeLessThan(held!.total);
  });

  it("keeps the corpus clock the FIRST page derived", async () => {
    // The server pins `asOf` into the cursor so every page of one walk answers
    // with the same day. Holding the first page's value says so, rather than
    // trusting the two to agree.
    serve(page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }), {
      ...page(50, 50, null),
      asOf: "2026-09-09",
      postedOnLabel: "9 September 2026",
    });
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    expect(feed.getBoardFeed()?.asOf).toBe(ASOF);
    expect(feed.getBoardFeed()?.postedOnLabel).toBe(LABEL);
  });
});

describe("DH-12's narrowing applies to every page, not only the first", () => {
  it.each([
    ["a malformed body", { orders: "x" }],
    ["an envelope with no next page at all", { ...page(50, 50, null), more: undefined }],
    ["a next page with a cursor and no counts", page(50, 50, { cursor: CURSOR_2 })],
  ])("keeps the board she is looking at when page two is %s", async (_name, body) => {
    serve(page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }), body);
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    // HER FIFTY REAL ORDERS ARE STILL THERE. A failed second page must not
    // blank a board that arrived.
    expect(feed.getBoardFeed()?.orders).toHaveLength(50);
    expect(feed.getBoardFeed()?.count).toBe(50);
  });

  it("leaves the cursor in place so pressing the control again retries", async () => {
    serve(page(0, 50, { cursor: CURSOR_1, loads: 50, remaining: 450 }), { orders: "x" });
    const feed = await store();

    await feed.loadFeed();
    await feed.loadMoreFeed();

    expect(feed.getFeedNextPage()?.cursor).toBe(CURSOR_1);
    expect(feed.isLoadingMore()).toBe(false);
  });
});

// The two hooks the board reads. `useSyncExternalStore` calls `getSnapshot` on
// every render and re-renders when the value CHANGES, so a snapshot that built
// a fresh object each call would loop forever — and it would loop in her
// browser, with nothing in this suite noticing. `getFeedNextPage()` returns the
// held reference for exactly that reason, and this is what holds it there.
describe("the paging hooks drive a real render", () => {
  it("re-renders when a page lands, and settles rather than looping", async () => {
    const empty = (more: unknown) => ({
      orders: [],
      asOf: ASOF,
      postedOnLabel: LABEL,
      count: 0,
      total: TOTAL,
      more,
    });
    serve(empty({ cursor: CURSOR_1, loads: 50, remaining: 50 }), empty(null));
    const feed = await store();

    function Probe() {
      const next = feed.useFeedNextPage();
      const loading = feed.useLoadingMore();
      return (
        <p>
          {next ? `next:${next.cursor}` : "next:none"}|{loading ? "busy" : "idle"}
        </p>
      );
    }

    render(<Probe />);
    expect(screen.getByText(/next:none\|idle/)).toBeTruthy();

    await act(async () => {
      await feed.loadFeed();
    });
    expect(screen.getByText(new RegExp(`next:${CURSOR_1}\\|idle`))).toBeTruthy();

    await act(async () => {
      await feed.loadMoreFeed();
    });
    expect(screen.getByText(/next:none\|idle/)).toBeTruthy();
    cleanup();
  });
});
