// DH-12 — THE CLIENT STOPS TRUSTING THE FEED BODY.
//
// `fetchSmallOrdersFeed()` and `fetchMemberState()` cast the parsed body to a
// type. A cast is not a check: it renames the value and asserts nothing. So a
// 200 that carries a proxy's HTML error page, or a shape drift, or an empty
// body, arrives at the surface as a "valid" feed, and `feed.orders.find(...)`
// throws inside a render — the board shows a blank screen or a crash instead of
// the sentence it already owns for this exact case.
//
// THE SURFACE ALREADY HAS THE FAILURE STATE. `feed.ts` types the corpus
// `BoardFeed | null | undefined` and the board renders `null` as "Today's orders
// from DLA did not load." This feature does not add a state — A11 and the
// reuse registry both forbid a fourth. It routes a bad shape into the third one.
//
// ── WHY THE ENVELOPE AND NOT THE ROWS (A11) ──────────────────────────────
//
// The checks below stop at the envelope: the five fields the feed declares, and
// "is this row an object at all". Per-ORDER field drift is DH-13's job, and it
// is refereed there against real mapper output. Rejecting a whole board because
// one row is missing one field would blank the surface over a single field —
// the opposite of the failure this feature exists to remove.
//
// ── THE DROPPED ROW AND `count` ──────────────────────────────────────────
//
// The server sets `count: orders.length`
// (`small-orders.mongo-feed-source.ts`), so `count` describes the payload it
// travels in. Dropping a row breaks that, and the break is not cosmetic: the
// board's foot banner prints `count` as "N orders from DLA", and its slice
// disclosure prints nothing at all when `count >= total`. A board silently
// shortened by one would then be presented as complete. So the narrowing
// subtracts what it dropped, which is the only value that keeps the server's
// own invariant true. See the last describe block.
//
// ── AND THE DROP IS SAID OUT LOUD (DH-26) ────────────────────────────────
//
// Subtracting the row kept the member's board honest and told NOBODY that it
// happened. A mapper regression that corrupted every tenth row would shrink the
// board with no log, no counter and no alert. `console.warn` is the signal —
// the report this workspace already uses for a client-side failure — and the
// case below is what proves it still fires.
//
// Layer: INTERFACE ADAPTERS. This is the wire module's own spec; it stubs
// `fetch` and imports no surface.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  fetchSmallOrder,
  fetchSmallOrdersFeed,
  fetchSmallOrdersByIds,
  fetchMemberState,
  saveMemberState,
  type SmallOrdersFeed,
} from "./api";
import { LIVE_MAPPED_ORDERS } from "./liveMapperOutput.fixture";
import { paperHref } from "./paperHref";
// The store's own initial record, so the DH-22 cases below write a real
// `MicroState` rather than a literal nobody checked against the shape.
import { getMicroState, type MicroState } from "../state/microPurchases";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

// The drop cases below spy on `console.warn`. Restoring it here rather than in
// each test keeps the real console for every other case, including one that
// fails part-way through.
afterEach(() => {
  vi.restoreAllMocks();
});

/** Watch the operator signal, and keep it out of the runner's output. */
function watchWarnings() {
  return vi.spyOn(console, "warn").mockImplementation(() => undefined);
}

/** Answer the next request with `body` verbatim, as a 200. */
function serve(body: BodyInit | null): void {
  mockFetch.mockResolvedValue(new Response(body, { status: 200 }));
}

/** Answer the next request with `value` encoded as JSON, as a 200. */
function serveJson(value: unknown): void {
  serve(JSON.stringify(value));
}

/** A feed the server could really have sent, built from real mapper output. */
function validFeed(): SmallOrdersFeed {
  const orders = LIVE_MAPPED_ORDERS.slice(0, 3);
  return {
    orders: [...orders],
    asOf: "2026-07-22",
    postedOnLabel: "22 July",
    count: orders.length,
    total: 16_600,
    boardTotal: 16_600,
    // DH-28 — a first page, with more behind it.
    more: { cursor: NEXT_CURSOR, loads: 50, remaining: 450 },
  };
}

/** A cursor shaped like one the server writes: opaque, and never read here. */
const NEXT_CURSOR = "eyJhc09mIjoiMjAyNi0wNy0yMiJ9";

// The proxy error page. Not JSON, so `response.json()` throws — but a JSON
// STRING carrying the same page parses fine, and only a check catches that one.
const HTML_ERROR_PAGE = "<!doctype html><html><body><h1>502 Bad Gateway</h1></body></html>";

describe("fetchSmallOrdersFeed rejects a body that is not a feed envelope", () => {
  it("returns null for an object with no envelope fields at all", async () => {
    serveJson({});
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null when `orders` is a string rather than an array", async () => {
    // The mutation check for this feature. Restore the bare
    // `as SmallOrdersFeed` cast and this is the assertion that fails.
    serveJson({ orders: "x" });
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null for a JSON null body", async () => {
    serveJson(null);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null for a bare HTML error page", async () => {
    serve(HTML_ERROR_PAGE);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null for an HTML error page that arrives as a JSON string", async () => {
    serveJson(HTML_ERROR_PAGE);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null for a 200 with an empty body", async () => {
    serve(null);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null for a JSON array, which has an `orders` of undefined", async () => {
    serveJson([]);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null when the DH-05 total is missing", async () => {
    // Without `total` the slice disclosure computes `count >= undefined`, which
    // is false, and then prints "of undefined open orders". A feed that cannot
    // say how much of the board it is, is not this envelope.
    const { total: _total, ...withoutTotal } = validFeed();
    serveJson(withoutTotal);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null when a date field is not a string", async () => {
    serveJson({ ...validFeed(), asOf: 20260722 });
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("returns null when the DH-28 next page is missing", async () => {
    // `undefined` is not "the last page". The last page says `more: null` and
    // says it deliberately, because the server reads one document past the
    // page to know. A body that omits the field is not this envelope.
    const { more: _more, ...withoutMore } = validFeed();
    serveJson(withoutMore);
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it.each([
    ["a cursor with no counts beside it", { cursor: NEXT_CURSOR }],
    ["counts with no cursor", { loads: 50, remaining: 450 }],
    ["an empty cursor", { cursor: "", loads: 50, remaining: 450 }],
    ["a cursor that is an operator object", { cursor: { $ne: "" }, loads: 50, remaining: 450 }],
    ["a `loads` that is prose", { cursor: NEXT_CURSOR, loads: "fifty", remaining: 450 }],
  ])("returns null for a next page carrying %s", async (_name, more) => {
    // A PAGE IS ALL-OR-NOTHING. A cursor with no count makes the control invent
    // the number it prints to her, and a count with no cursor is a promise it
    // cannot keep.
    serveJson({ ...validFeed(), more });
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });

  it("still returns null on a non-2xx, unchanged", async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify(validFeed()), { status: 503 }));
    expect(await fetchSmallOrdersFeed()).toBeNull();
  });
});

describe("fetchSmallOrdersFeed passes a real feed through untouched", () => {
  it("round-trips every envelope field, including the DH-05 total", async () => {
    const feed = validFeed();
    serveJson(feed);

    expect(await fetchSmallOrdersFeed()).toEqual(feed);
  });

  it("round-trips an empty served corpus, which is not a failure", async () => {
    // `[]` and `null` are two different sentences on this surface and the
    // narrowing must not collapse one into the other.
    const empty: SmallOrdersFeed = {
      orders: [],
      asOf: "",
      postedOnLabel: "",
      count: 0,
      total: 0,
      boardTotal: 0,
      more: null,
    };
    serveJson(empty);

    expect(await fetchSmallOrdersFeed()).toEqual(empty);
  });

  it("round-trips a LAST page, whose `more` is null and not missing", async () => {
    const last: SmallOrdersFeed = { ...validFeed(), more: null };
    serveJson(last);

    expect(await fetchSmallOrdersFeed()).toEqual(last);
  });
});

// DH-28. The board loads 50 and asks before loading more, and the cursor is the
// server's own token handed straight back. This module never reads inside one
// and never builds one, so the client cannot invent a position the server did
// not serve.
describe("fetchSmallOrdersFeed asks for the page it was told to ask for", () => {
  it("asks for the first page when it holds no cursor", async () => {
    serveJson(validFeed());

    await fetchSmallOrdersFeed();

    expect(String(mockFetch.mock.calls[0][0])).toContain("/small-orders/feed");
    expect(String(mockFetch.mock.calls[0][0])).not.toContain("after=");
  });

  it("hands the cursor back verbatim, encoded for a query string", async () => {
    serveJson({ ...validFeed(), more: null });

    await fetchSmallOrdersFeed("a+b/c=");

    const url = String(mockFetch.mock.calls[0][0]);
    expect(url).toContain(`after=${encodeURIComponent("a+b/c=")}`);
  });

  it("returns null when the server refuses the cursor", async () => {
    // A 400 is `!response.ok`, so it is the same "we could not get today's
    // orders" a dead request is — NOT a silent fall back to page one, which
    // would repeat fifty rows she is already looking at.
    mockFetch.mockResolvedValue(new Response("{}", { status: 400 }));

    expect(await fetchSmallOrdersFeed(NEXT_CURSOR)).toBeNull();
  });
});

describe("fetchSmallOrdersByIds reads her saved orders", () => {
  it("asks in batches of 100 and keeps the answers in order", async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `dibbs-${i}`);
    const [a, b] = LIVE_MAPPED_ORDERS;
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ orders: [a] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ orders: [b] }), { status: 200 }));

    const orders = await fetchSmallOrdersByIds(ids);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(String(mockFetch.mock.calls[0][0])).toContain(encodeURIComponent("dibbs-99"));
    expect(String(mockFetch.mock.calls[0][0])).not.toContain(encodeURIComponent("dibbs-100,"));
    expect(orders).toEqual([a, b]);
  });

  it("returns null, not a short list, when one batch fails", async () => {
    const ids = Array.from({ length: 150 }, (_, i) => `dibbs-${i}`);
    mockFetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ orders: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 500 }));

    expect(await fetchSmallOrdersByIds(ids)).toBeNull();
  });

  it("returns null for a body that is not an order list", async () => {
    serveJson({ nope: true });

    expect(await fetchSmallOrdersByIds(["dibbs-1"])).toBeNull();
  });
});

describe("fetchSmallOrdersFeed reads the whole board's count", () => {
  it("passes the server's boardTotal through", async () => {
    serveJson({ ...validFeed(), total: 295, boardTotal: 11_404 });

    const feed = await fetchSmallOrdersFeed(undefined, undefined, "for-you");

    expect(feed?.total).toBe(295);
    expect(feed?.boardTotal).toBe(11_404);
  });

  it("reports no whole-board count, rather than copying total, when a server older than the field answers", async () => {
    const { boardTotal: _omitted, ...older } = validFeed();
    serveJson(older);

    expect((await fetchSmallOrdersFeed())?.boardTotal).toBeNull();
  });
});

describe("fetchSmallOrdersFeed asks for her view only when told", () => {
  it("sends view=for-you for the For you tab", async () => {
    serveJson(validFeed());

    await fetchSmallOrdersFeed(undefined, undefined, "for-you");

    expect(String(mockFetch.mock.calls[0][0])).toContain("view=for-you");
  });

  it("sends no view for the whole board", async () => {
    serveJson(validFeed());

    await fetchSmallOrdersFeed(undefined, undefined, "all");

    expect(String(mockFetch.mock.calls[0][0])).not.toContain("view=");
  });
});

describe("fetchSmallOrdersFeed drops a row that is not an object", () => {
  it("keeps the rest of the board", async () => {
    watchWarnings();
    const feed = validFeed();
    const withBadRow = {
      ...feed,
      orders: [feed.orders[0], "not an order", feed.orders[1], null, feed.orders[2]],
      count: 5,
    };
    serveJson(withBadRow);

    const result = await fetchSmallOrdersFeed();

    expect(result?.orders).toEqual(feed.orders);
  });

  it("subtracts the dropped rows from `count`, so the board cannot claim to be whole", async () => {
    // THE HAZARD. The server's `count` is `orders.length`. Left alone, a board
    // of 9 rendered rows would carry `count: 10`, the foot banner would say
    // "10 orders from DLA", and — because `bannerSlice()` prints nothing when
    // `count >= total` — a shortened board would be shown as the complete one.
    watchWarnings();
    const orders = [...LIVE_MAPPED_ORDERS.slice(0, 2), { bad: true, orders: [] }];
    serveJson({
      orders: [orders[0], "x", orders[1]],
      asOf: "2026-07-22",
      postedOnLabel: "22 July",
      count: 3,
      total: 3,
      more: null,
    });

    const result = await fetchSmallOrdersFeed();

    expect(result?.count).toBe(2);
    expect(result?.count).toBe(result?.orders.length);
    // `total` is the server's measurement of the market and no client edit can
    // improve it. It stays exactly as sent, so `count < total` now holds and
    // the disclosure fires.
    expect(result?.total).toBe(3);
  });
});

// DH-26. The drop was silent. The board shrank, the disclosure fired, and
// nothing anywhere said that WE could not read a row the server sent — so a
// mapper regression looked exactly like a busy day at DLA. `console.warn` is
// what `hunterChat.ts`, `tasks.ts` and `eventBus.ts` already report a
// client-side failure with, so this adds a message, not a mechanism.
describe("a dropped row raises a signal an operator can see", () => {
  it("warns once, and names how many rows it dropped", async () => {
    const warn = watchWarnings();
    const feed = validFeed();
    serveJson({
      ...feed,
      orders: [feed.orders[0], "not an order", null, feed.orders[1]],
      count: 4,
    });

    await fetchSmallOrdersFeed();

    expect(warn).toHaveBeenCalledTimes(1);
    const said = String(warn.mock.calls[0][0]);
    // Greppable prefix first, then the number — an operator reading a console
    // must be able to tell one dropped row from every tenth one.
    expect(said).toContain("small-orders feed");
    expect(said).toContain("dropped 2 of 4");
  });

  it("says nothing at all about a feed it read whole", async () => {
    // A warning printed over a healthy feed is a warning nobody reads.
    const warn = watchWarnings();
    serveJson(validFeed());

    await fetchSmallOrdersFeed();

    expect(warn).not.toHaveBeenCalled();
  });
});

// ── DH-30 · one order, off the record route ───────────────────────────────
//
// The board serves 50 rows now (DH-28), so an order she bookmarked can be
// missing from the page we hold and still exist. `GET /small-orders/orders/:id`
// answers about any order, and the whole value of asking it is that its answer
// carries TWO facts the page must not merge: the server holds no such order,
// and we did not get an answer. Merging them is the defect this fetch removes,
// so every case below asserts which of the two came back — not merely that the
// fetch failed.
describe("fetchSmallOrder tells 'we could not ask' apart from 'it is not there'", () => {
  /** The order the cases below ask for. Real mapper output, so the body a
   *  server could send is the body this fixture already is. */
  const ORDER = LIVE_MAPPED_ORDERS[0];

  /** Answer the next request with `value` as JSON, under `status`. */
  function answer(value: unknown, status: number): void {
    mockFetch.mockResolvedValue(new Response(JSON.stringify(value), { status }));
  }

  it("returns the order the server served", async () => {
    answer(ORDER, 200);

    const result = await fetchSmallOrder(ORDER.id);

    expect(result.state).toBe("order");
    expect(result.state === "order" && result.order.id).toBe(ORDER.id);
  });

  it("calls a 404 ABSENT — the server read the id and holds no such order", async () => {
    // The controller throws `NotFoundException` for an id the source misses,
    // and this is the ONE answer that earns "that order is not here any more".
    answer({ statusCode: 404, message: "No small order with id x" }, 404);

    expect(await fetchSmallOrder("dibbs-gone")).toEqual({ state: "absent" });
  });

  it("calls a 500 UNREACHABLE, never absent — a broken server holds no opinion", async () => {
    answer({ statusCode: 500 }, 500);

    expect(await fetchSmallOrder(ORDER.id)).toEqual({ state: "unreachable" });
  });

  it("calls a 401 unreachable too — a dead session says nothing about the order", async () => {
    answer({ statusCode: 401 }, 401);

    expect(await fetchSmallOrder(ORDER.id)).toEqual({ state: "unreachable" });
  });

  it("calls a request that threw unreachable", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    expect(await fetchSmallOrder(ORDER.id)).toEqual({ state: "unreachable" });
  });

  it("calls a proxy's HTML error page unreachable, even when it arrives as a 200", async () => {
    // DH-12's rule, on a body of one row: a 200 carrying a gateway page is not
    // an order, and it is not evidence the order is gone either.
    mockFetch.mockResolvedValue(new Response(HTML_ERROR_PAGE, { status: 200 }));

    expect(await fetchSmallOrder(ORDER.id)).toEqual({ state: "unreachable" });
  });

  it("calls a JSON null body unreachable", async () => {
    answer(null, 200);

    expect(await fetchSmallOrder(ORDER.id)).toEqual({ state: "unreachable" });
  });

  it("calls an array body unreachable — an order is not a list", async () => {
    answer([ORDER], 200);

    expect(await fetchSmallOrder(ORDER.id)).toEqual({ state: "unreachable" });
  });

  it("refuses a body that names a DIFFERENT order, and does not call it absent", async () => {
    // The page renders whatever this returns under the id in the URL, so an
    // order that is not that one would put another order's facts on her screen.
    answer(ORDER, 200);

    expect(await fetchSmallOrder("dibbs-live-999")).toEqual({ state: "unreachable" });
  });

  it("asks the record route for the id, encoded", async () => {
    answer(ORDER, 200);

    await fetchSmallOrder("dibbs SPE/1");

    expect(mockFetch.mock.calls[0][0]).toContain("/small-orders/orders/dibbs%20SPE%2F1");
  });
});

// The page renders a verdict, a gap note, the sourcing panel, the order paper
// and the send control. An order arriving by the record route must carry
// everything those read, or the member who bookmarked one gets a poorer page
// than the member who scrolled to it.
describe("an order off the record route is the same shape as a feed one", () => {
  it("round-trips every field, on every order the mapper really emits", async () => {
    for (const order of LIVE_MAPPED_ORDERS) {
      mockFetch.mockResolvedValue(new Response(JSON.stringify(order), { status: 200 }));

      const result = await fetchSmallOrder(order.id);

      expect(result.state).toBe("order");
      expect(result.state === "order" && result.order).toEqual(order);
      // Key-for-key, so a field the wire drops fails here rather than
      // rendering as `undefined` on the panel that reads it.
      expect(result.state === "order" && Object.keys(result.order)).toEqual(Object.keys(order));
    }
  });

  it("carries the order paper, which the board's own rows never do", async () => {
    // `findOrder()` joins `documents` the same way `mapPage()` does, so a
    // singly-fetched order can carry a paper. `paperHref` is what the page
    // builds the download control from.
    const withPaper = {
      ...LIVE_MAPPED_ORDERS[0],
      paper: { fileName: "SPE1C1.PDF", fileSize: 81_920 },
    };
    mockFetch.mockResolvedValue(new Response(JSON.stringify(withPaper), { status: 200 }));

    const result = await fetchSmallOrder(withPaper.id);

    expect(result.state === "order" && result.order.paper).toEqual(withPaper.paper);
    expect(result.state === "order" && paperHref(result.order)).toBeTruthy();
  });
});

describe("fetchMemberState rejects a body that is not a state document", () => {
  it("returns null for a JSON null body", async () => {
    serveJson(null);
    expect(await fetchMemberState()).toBeNull();
  });

  it("returns null for a bare HTML error page", async () => {
    serve(HTML_ERROR_PAGE);
    expect(await fetchMemberState()).toBeNull();
  });

  it("returns null for a 200 with an empty body", async () => {
    serve(null);
    expect(await fetchMemberState()).toBeNull();
  });

  it("returns null for an array, which would put numeric keys in the store", async () => {
    // MEASURED for DH-26, because the comment in `api.ts` described a mechanism
    // nobody had run: `commit()` merges with `{ ...state, ...remote }`, so an
    // array body adds the keys `"0"`, `"1"`, … BESIDE `categories` and
    // `registrations` and overwrites neither. The store then PUTs those junk
    // keys back as her state.
    for (const body of [[], ["an-order-id"]]) {
      serveJson(body);
      expect(await fetchMemberState()).toBeNull();
    }
  });

  it("round-trips a state document unchanged", async () => {
    // Envelope level only, per A11: the store merges this over its defaults, so
    // a missing field keeps a default rather than crashing a reader.
    const state = { onboarded: true, categories: ["hardware"], seenOrderIds: ["a", "b"] };
    serveJson(state);

    expect(await fetchMemberState()).toEqual(state);
  });
});

// ── DH-22 — THE WRITE THAT DID NOT LAND ──────────────────────────────────
//
// `saveMemberState` already returned whether the write landed, and its one
// caller discarded that with `void`. So every failed save was silent: a 400
// from DH-06's caps, a 401 from a dead session, a 500, a dropped connection.
// The cases below pin the two things that removed the silence — the outcome the
// store now reads, and the console line an operator now gets.
//
// THE TWO KINDS ARE NOT ONE. A 4xx is a verdict on this document and sending it
// again gets the same verdict. Anything else is no verdict: the write may have
// landed and we cannot say. Those are different sentences to her, so they are
// different values here.

/** A real member record, from the store's own initial state rather than a
 *  hand-rolled literal, with only the counted arrays set. */
function stateWith(over: Partial<MicroState>): MicroState {
  return { ...getMicroState(), ...over };
}

/** Answer the next request with `status` and no body. */
function answerWith(status: number): void {
  mockFetch.mockResolvedValue(new Response(null, { status }));
}

describe("saveMemberState reports what happened to the write", () => {
  it("reports a landed write", async () => {
    answerWith(200);
    expect(await saveMemberState(stateWith({}))).toEqual({ saved: true });
  });

  it("calls a 400 a REFUSAL — the server read the document and said no", async () => {
    // DH-06's caps answer 400. So does its DTO on any other malformed field.
    watchWarnings();
    answerWith(400);

    expect(await saveMemberState(stateWith({}))).toEqual({ saved: false, reason: "refused" });
  });

  it("calls a 401 a refusal too, because sending it again gets the same answer", async () => {
    watchWarnings();
    answerWith(401);

    expect(await saveMemberState(stateWith({}))).toEqual({ saved: false, reason: "refused" });
  });

  it("calls a 500 UNCONFIRMED — the server broke rather than judged", async () => {
    watchWarnings();
    answerWith(500);

    expect(await saveMemberState(stateWith({}))).toEqual({ saved: false, reason: "unconfirmed" });
  });

  it("calls a request that threw unconfirmed, because it may still have landed", async () => {
    // A request can reach the server and lose its answer. "We never sent it"
    // would be a claim this code cannot make.
    watchWarnings();
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await saveMemberState(stateWith({}))).toEqual({ saved: false, reason: "unconfirmed" });
  });
});

describe("saveMemberState tells an operator, in numbers", () => {
  it("prints the status and the four lengths that name a cap", async () => {
    const warn = watchWarnings();
    answerWith(400);

    await saveMemberState(stateWith({ seenOrderIds: ["a", "b", "c", "d"] }));

    expect(warn).toHaveBeenCalledTimes(1);
    const said = String(warn.mock.calls[0][0]);
    // Greppable prefix first, then the status, then the array that hit its cap.
    expect(said).toContain("small-orders state");
    expect(said).toContain("status 400");
    expect(said).toContain("seen 4");
    expect(said).toContain("quotes 0");
    expect(said).toContain("wins 0");
  });

  it("says `status none` when nothing answered", async () => {
    const warn = watchWarnings();
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await saveMemberState(stateWith({}));

    expect(String(warn.mock.calls[0][0])).toContain("status none");
  });

  it("puts NOTHING of hers in the console — no id, no NSN, no URL", async () => {
    // The redaction rule. Everything in the document is a member's: order ids
    // she opened, NSNs she attested, prices she typed. An operator needs the
    // numbers and gets only the numbers.
    const warn = watchWarnings();
    answerWith(400);

    await saveMemberState(
      stateWith({ seenOrderIds: ["SPE7M3-26-Q-0042"], attestedNsns: ["5330-01-234-5678"] }),
    );

    const said = String(warn.mock.calls[0][0]);
    expect(said).not.toContain("SPE7M3-26-Q-0042");
    expect(said).not.toContain("5330-01-234-5678");
    expect(said).not.toContain("/small-orders/state");
    expect(said).not.toContain("http");
  });

  it("says nothing at all about a write that landed", async () => {
    const warn = watchWarnings();
    answerWith(200);

    await saveMemberState(stateWith({}));

    expect(warn).not.toHaveBeenCalled();
  });
});
