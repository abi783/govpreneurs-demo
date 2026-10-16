// The board's tabs walk the server in a view: "For you" or "All orders".
//
// These cases hold the three things a tab switch must get right. It asks the
// server for the view, never filters the rows in hand. It clears the board while
// it asks, so no "All orders" row sits under "For you". And an answer from a
// tab she has already left is dropped.
//
// "For you" also waits for the code census and sends only the pairs she may
// bid. Requests are answered by URL, so the census never takes a feed answer.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LIVE_MAPPED_ORDERS } from "./liveMapperOutput.fixture";

const mockFetch = vi.fn();

/** Feed answers, in the order the feed requests arrive. */
let feedAnswers: Promise<Response>[] = [];
/** The census answer, or `null` for a census that fails. */
let censusBody: unknown = null;

/** A census holding one pair of every kind the ruling tells apart. */
const CENSUS = {
  pairs: [
    { amc: "1", amsc: "G", hasPsc: true, dibbsStatus: "Open", orders: 934 },
    { amc: "1", amsc: "T", hasPsc: true, dibbsStatus: "Open", orders: 140 },
    { amc: "3", amsc: "D", hasPsc: true, dibbsStatus: "Open", orders: 1212 },
    { amc: null, amsc: null, hasPsc: true, dibbsStatus: "Open", orders: 8177 },
    { amc: "2", amsc: "Z", hasPsc: false, dibbsStatus: "Open", orders: 3 },
  ],
  total: 10466,
};

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
  feedAnswers = [];
  censusBody = CENSUS;
  mockFetch.mockImplementation((url: unknown) => {
    if (String(url).includes("/small-orders/code-census")) {
      return Promise.resolve(
        censusBody == null ? new Response("", { status: 500 }) : reply(censusBody),
      );
    }
    return feedAnswers.shift() ?? Promise.reject(new Error("no feed answer queued"));
  });
  // The store keeps its walk in module variables.
  vi.resetModules();
});

/** Queue a feed answer. */
function answerFeed(response: Promise<Response> | Response): void {
  feedAnswers.push(Promise.resolve(response));
}

/** A feed answer that waits until the case releases it. */
function heldFeed(): (body: unknown) => void {
  let release: (r: Response) => void = () => undefined;
  feedAnswers.push(new Promise<Response>((r) => (release = r)));
  return (body) => release(reply(body));
}

/** The URLs of the feed requests, in order. */
function feedCalls(): URL[] {
  return mockFetch.mock.calls
    .map((call) => new URL(String(call[0]), "http://x"))
    .filter((url) => url.pathname.endsWith("/small-orders/feed"));
}

/** One page whose orders are tagged, so a case can tell whose answer landed. */
function page(tag: string): Record<string, unknown> {
  const orders = LIVE_MAPPED_ORDERS.slice(0, 2).map((o, i) => ({ ...o, id: `${tag}-${i}` }));
  return {
    orders,
    asOf: "2026-09-07",
    postedOnLabel: "7 September 2026",
    count: orders.length,
    total: orders.length,
    more: null,
  };
}

function reply(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

/** The `view=` value of the nth feed request, or null when it asked for the whole board. */
function viewAsked(call: number): string | null {
  return feedCalls()[call].searchParams.get("view");
}

describe("walking a tab", () => {
  it("asks the server for her view instead of filtering the rows in hand", async () => {
    answerFeed(reply(page("hers")));
    const feed = await import("./feed");

    await feed.walkFeedFor("for-you");

    expect(viewAsked(0)).toBe("for-you");
    expect(feed.getBoardFeed()?.orders.map((o) => o.id)).toEqual(["hers-0", "hers-1"]);
  });

  it("asks for the whole board with no view parameter, and no census", async () => {
    answerFeed(reply(page("all")));
    const feed = await import("./feed");

    await feed.loadFeed();

    expect(viewAsked(0)).toBeNull();
    expect(feedCalls()[0].searchParams.has("bidCodes")).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("clears the board while a new tab is asked for", async () => {
    answerFeed(reply(page("all")));
    const feed = await import("./feed");
    await feed.loadFeed();

    const answer = heldFeed();
    const pending = feed.walkFeedFor("for-you");

    expect(feed.getBoardFeed()).toBeUndefined();
    answer(page("hers"));
    await pending;
    expect(feed.getBoardFeed()?.orders[0]?.id).toBe("hers-0");
  });

  it("drops an answer from a tab she has already left", async () => {
    const feed = await import("./feed");
    const answerForYou = heldFeed();
    answerFeed(reply(page("all")));

    const forYou = feed.walkFeedFor("for-you");
    // Let the For you walk read the census and send its request first.
    await vi.waitFor(() => expect(feedCalls()).toHaveLength(1));
    await feed.walkFeedFor("all");
    answerForYou(page("hers"));
    await forYou;

    expect(feed.getBoardFeed()?.orders[0]?.id).toBe("all-0");
  });

  it("walks her categories on the server, and starts a new walk when they change", async () => {
    answerFeed(reply(page("filters")));
    answerFeed(reply(page("both")));
    const feed = await import("./feed");

    await feed.walkFeedFor("all", ["filters"]);
    await feed.walkFeedFor("all", ["filters"]);
    await feed.walkFeedFor("all", ["hand-tools", "filters"]);

    const asked = (call: number) => feedCalls()[call].searchParams.get("categories");
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(asked(0)).toBe("filters");
    // Sorted, so the same set is always the same request.
    expect(asked(1)).toBe("filters,hand-tools");
    expect(feed.getBoardFeed()?.orders[0]?.id).toBe("both-0");
  });

  it("does not ask again when she taps the tab she is on", async () => {
    answerFeed(reply(page("hers")));
    const feed = await import("./feed");
    await feed.walkFeedFor("for-you");

    await feed.walkFeedFor("for-you");

    expect(feedCalls()).toHaveLength(1);
    expect(feed.getBoardFeed()?.orders[0]?.id).toBe("hers-0");
  });
});

describe("walking For you by acquisition code", () => {
  it("sends only the pairs she may bid, read off the census", async () => {
    answerFeed(reply(page("hers")));
    const feed = await import("./feed");

    await feed.walkFeedFor("for-you");

    // 1T is DLA's qualified-list refusal, 3D is refused, and the null pair
    // never arrived.
    expect(feedCalls()[0].searchParams.get("bidCodes")).toBe("1G,2Z");
  });

  it("sends an empty list, never no list, when no pair may be bid", async () => {
    censusBody = { pairs: [CENSUS.pairs[1], CENSUS.pairs[3]], total: 8317 };
    answerFeed(reply(page("none")));
    const feed = await import("./feed");

    await feed.walkFeedFor("for-you");

    expect(feedCalls()[0].searchParams.get("bidCodes")).toBe("");
  });

  it("fails the walk rather than show orders she may not bid when the census does not load", async () => {
    censusBody = null;
    const feed = await import("./feed");

    await feed.walkFeedFor("for-you");

    expect(feedCalls()).toHaveLength(0);
    expect(feed.getBoardFeed()).toBeNull();
  });

  it("asks for the census once, and again after one that failed", async () => {
    const feed = await import("./feed");
    censusBody = null;
    expect(await feed.loadCodeCensus()).toBeNull();

    censusBody = CENSUS;
    await feed.loadCodeCensus();
    await feed.loadCodeCensus();

    const censusCalls = mockFetch.mock.calls.filter((c) => String(c[0]).includes("code-census"));
    expect(censusCalls).toHaveLength(2);
  });
});
