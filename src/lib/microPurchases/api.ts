// Small orders — the wire.
//
// The prototype this surface was ported from held its corpus in a module and
// its member state in memory, and both reset on reload. This module is the seam
// that replaces both: the board's orders come from the API, and her answers are
// written back to it.
//
// THE TWO FEED FAILURES STAY DISTINCT. `relevance.ts` types the corpus as
// `MicroOrder[] | null` for a reason it states at length: `null` is a fetch that
// threw or timed out — "Today's orders from DLA did not load" — and `[]` is a
// feed that came back empty — "There are no orders today." A number cannot hold
// both, and a healthy-but-empty upstream told the opposite of the truth is the
// same conflation this feature undid elsewhere. Everything below preserves it.
//
// In the prototype the broken-feed sentence was written, tested and
// UNREACHABLE, because every call site passed the static corpus. It is reachable
// now: this is a real request and it can really fail.

import { apiFetch, API_BASE_URL } from "../api";
import type { MicroOrder } from "./order";
import type { MicroCategory } from "./categories";
import type { CensusRow } from "./relevance";
import type { MicroState } from "../state/microPurchases";
import type { FeedView } from "./boardView";

/**
 * What the board is served with, and the day it is the board for.
 *
 * Mirrors `backend/src/small-orders/small-orders.service.ts`. The two date
 * fields are two different facts and must stay that way: `asOf` is ISO and is
 * what a closing date is compared against; `postedOnLabel` is the banner's
 * prose and nothing computes on it.
 */
export interface SmallOrdersFeed {
  orders: MicroOrder[];
  asOf: string;
  postedOnLabel: string;
  count: number;
  /** How many orders MATCHED on the server, before its 500-row cap cut the
   *  page. `count` is what she was served; this is what she was served OUT OF.
   *  The two are equal when she is seeing the whole board. The server carries
   *  the number and the banner writes the sentence — a count the server
   *  pre-wrote into prose is a count nothing can compare. */
  total: number;
  /** How many orders the WHOLE board holds today, before the For you set or her
   *  categories narrow it. Equal to `total` on an unnarrowed walk. `null` when a
   *  server older than the field answers: we do not know the whole board, and
   *  copying `total` into it printed "Out of 295 orders… matched 295". */
  boardTotal: number | null;
  /** Where the next page starts and what it costs, or `null` when this page is
   *  the last one (DH-28). `null` is EXACT and not inferred: the server reads
   *  one document beyond the page to decide it, so the "Load more" control is
   *  never rendered over a request that would return nothing. */
  more: SmallOrdersNextPage | null;
}

/**
 * What the next page will cost her, and what is left after it.
 *
 * **EVERY NUMBER HERE IS THE SERVER'S.** The page size and the 500-row cap both
 * live on the server, so a client that computed "50 more" from a constant of
 * its own would state a page size the server had changed. The client renders
 * these and derives none of them.
 */
export interface SmallOrdersNextPage {
  /** The opaque token the next request hands back. The client never reads
   *  inside it, and never builds one. */
  cursor: string;
  /** How many orders the next request serves, at most. */
  loads: number;
  /** How many orders the board can still load, this next page included. */
  remaining: number;
}

/**
 * A parsed JSON value that is a keyed object — not null, not an array.
 *
 * `typeof null === "object"` and an array is an object too, so both need
 * saying. This is the whole of what "an object at all" means here.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The feed envelope as a checked value, or `null` if the body is not one.
 *
 * A CAST IS NOT A CHECK. `as SmallOrdersFeed` renames the parsed body and
 * asserts nothing about it, so a proxy's HTML error page, an empty body or a
 * shape drift reached the board as a "valid" feed and `feed.orders.find(…)`
 * threw inside a render. The surface already owns the sentence for a feed it
 * could not get; this returns the value that renders it.
 *
 * THE ENVELOPE ONLY (A11). The six declared fields, and "is this row an object
 * at all". Per-order field drift is refereed by `parity.test.ts` against real
 * mapper output — blanking a whole board because one row lost one field would
 * be a worse failure than the one this removes.
 *
 * IT RUNS ON EVERY PAGE, not only the first (DH-28). Each page is a whole
 * envelope of its own and is narrowed on arrival, so a malformed body still
 * returns `null` and a dropped row still costs THAT page's `count` — which is
 * the value the board sums into what is on screen.
 *
 * A DROPPED ROW COSTS A COUNT. The server sets `count: orders.length`, so
 * `count` describes the payload it travels in, and the board's foot banner
 * prints it as "N orders from DLA" and stays silent about the market's size
 * whenever `count >= total`. A board shortened by a dropped row and left with
 * the server's count would be presented as the complete board. So the drop is
 * subtracted here, which is the only value that keeps the server's own
 * invariant true. `total` is the server's measurement and is never edited.
 *
 * AND THE DROP IS SAID OUT LOUD (DH-26). Subtracting the row kept her board
 * honest and told nobody it had happened, so a mapper regression that corrupted
 * every tenth row would shrink the board with no log and no counter anywhere. A
 * `console.warn` is the report this workspace already uses for a client-side
 * failure (`hunterChat.ts`, `tasks.ts`, `eventBus.ts`), and it is all this needs
 * to be: the server drops the documents IT cannot map and sets `count` to what
 * it kept, so a row arriving here as a non-object means the payload is not one
 * the server's own code can produce. That is an operator's fact, not hers.
 */
function narrowFeed(body: unknown): SmallOrdersFeed | null {
  if (!isRecord(body)) return null;
  if (!Array.isArray(body.orders)) return null;
  if (typeof body.asOf !== "string" || typeof body.postedOnLabel !== "string") return null;
  if (typeof body.count !== "number" || typeof body.total !== "number") return null;
  const more = narrowNextPage(body.more);
  if (more === undefined) return null;

  const orders = body.orders.filter(isRecord) as unknown as MicroOrder[];
  const dropped = body.orders.length - orders.length;
  if (dropped > 0) {
    console.warn(
      `small-orders feed: dropped ${dropped} of ${body.orders.length} rows that were not ` +
        `objects; the board shows ${orders.length} of the ${body.count} the server counted`,
    );
  }
  return {
    orders,
    asOf: body.asOf,
    postedOnLabel: body.postedOnLabel,
    count: body.count - dropped,
    total: body.total,
    boardTotal: typeof body.boardTotal === "number" ? body.boardTotal : null,
    more,
  };
}

/**
 * The `more` field as a checked value: the object, `null`, or `undefined` for
 * "this is not a feed envelope".
 *
 * THREE RETURNS FOR THREE FACTS, and the third is the reason this is a separate
 * function. `null` is a real and common answer — it is the last page — so it
 * cannot double as the rejection. `undefined` is the rejection, and
 * `narrowFeed` turns it into the `null` the whole envelope gets.
 *
 * A PAGE IS ALL-OR-NOTHING (DH-28). The three fields travel together because
 * they mean nothing apart: a cursor with no count makes the control invent the
 * number it prints, and a count with no cursor is a promise it cannot keep. So
 * a partial `more` rejects the envelope rather than being half-used, and the
 * surface renders "we could not get today's orders" — which is true, because a
 * body the server's own code cannot produce is not today's orders.
 */
function narrowNextPage(value: unknown): SmallOrdersNextPage | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  if (typeof value.cursor !== "string" || value.cursor === "") return undefined;
  if (typeof value.loads !== "number" || typeof value.remaining !== "number") return undefined;
  return { cursor: value.cursor, loads: value.loads, remaining: value.remaining };
}

/**
 * ONE PAGE of today's corpus.
 *
 * Returns `null` when the request did not complete OR when the body is not a
 * feed envelope — NOT an empty array. The caller hands this straight to
 * `queryOrders`, whose third parameter carries exactly this distinction into
 * `feedArrived` and the sentence Hunter renders.
 *
 * `cursor` continues a walk the last page named (DH-28). Absent, this asks for
 * the first page. A cursor the server refuses is a 400, which is `!response.ok`
 * and therefore `null` — the same "we could not get today's orders" the surface
 * already renders, rather than a silently repeated or silently skipped page.
 */
export async function fetchSmallOrdersFeed(
  cursor?: string,
  signal?: AbortSignal,
  /**
   * Which orders the SERVER walks: the whole board, or the orders under her
   * allied NAICS set. The server reads her set from her profile; the client
   * never sends NAICS codes.
   *
   * IGNORED WHEN A CURSOR IS GIVEN, by the server: the cursor carries the view
   * its walk started in, so page two of "For you" cannot become the whole
   * board. Changing the tab starts a NEW walk.
   */
  view: FeedView = "all",
  /**
   * Her part categories from the filter menu. The SERVER narrows the walk to
   * them, so a page of 50 is 50 orders in her categories. Ignored with a
   * cursor, which pins the categories its walk started with.
   */
  categories: readonly MicroCategory[] = [],
  /**
   * Acquisition-code pairs ("1C", "3Z"). The server serves only orders whose
   * stock number carries one of them — how "Ones not open to you" pages each
   * reason group over the whole board. Ignored with a cursor, which pins them.
   */
  codes: readonly string[] = [],
  /**
   * The pairs she may bid ("1G", "2Z"), for the "For you" walk. `null` asks for
   * no such narrowing. An EMPTY list is sent too, and the server serves nothing
   * for it. Ignored with a cursor, which pins them.
   */
  bidCodes: readonly string[] | null = null,
): Promise<SmallOrdersFeed | null> {
  try {
    // The cursor is the SERVER's own token, handed straight back. This module
    // never reads inside it and never builds one, so the client cannot invent a
    // position the server did not serve.
    const params = new URLSearchParams();
    if (cursor) params.set("after", cursor);
    // Only sent when it is not the default, so the whole board asks for
    // exactly the URL it always asked for.
    if (view === "for-you") params.set("view", view);
    if (categories.length > 0) params.set("categories", [...categories].sort().join(","));
    if (codes.length > 0) params.set("codes", [...codes].sort().join(","));
    if (bidCodes != null) params.set("bidCodes", [...bidCodes].sort().join(","));
    const query = params.toString();
    const url = `${API_BASE_URL}/small-orders/feed${query ? `?${query}` : ""}`;
    const response = await apiFetch(url, { signal });
    if (!response.ok) return null;
    return narrowFeed(await response.json());
  } catch {
    // A throw, a non-2xx and a body that is not a feed are the same fact to
    // this surface: no feed arrived. The distinction that matters to her is
    // feed-vs-empty, and that one is preserved above — a served corpus of zero
    // orders passes the check and stays `[]`.
    return null;
  }
}

/**
 * One order from the record route, or which of the two failures happened.
 *
 * **THE TWO FAILURES ARE NOT ONE FACT (DH-30), and this type is where they stop
 * being merged.** `absent` is the server reading the id and holding no such
 * order — the only answer that earns "that order is not here any more".
 * `unreachable` is every way we did not get an answer we can read: the request
 * threw, the server broke or refused, or the body is not this order. She has
 * done nothing wrong in either case, but only the first is a fact about the
 * order, and the page says two different sentences about them.
 */
export type SmallOrderResult =
  | { state: "order"; order: MicroOrder }
  | { state: "absent" }
  | { state: "unreachable" };

/** The one status that means the server read the id and holds no such order.
 *  `SmallOrdersController.getOrder` throws `NotFoundException` for it. */
const ORDER_NOT_FOUND = 404;

/**
 * The order body as a checked value, or `null` when it is not this order.
 *
 * THE ENVELOPE ONLY (A11), the same rule `narrowFeed` applies to a row: is this
 * an object at all. A body from the network is a body from the network, and one
 * row is not more trustworthy than five hundred — a proxy's HTML error page
 * served as a 200 reaches here exactly as it reaches the feed. Per-field drift
 * is refereed by `parity.test.ts` against real mapper output, so a missing
 * field must not blank a page the member can otherwise read.
 *
 * AND THE ID, which the feed path gets for free: the board resolves its order
 * with `find(x => x.id === orderId)`, so an order it produces is always the one
 * in the URL. Nothing makes that true of a body, and the page renders whatever
 * this returns under the id in the URL. A mismatch is `unreachable` and never
 * `absent` — we did not get an answer about the order she asked for.
 */
function narrowOrder(body: unknown, orderId: string): MicroOrder | null {
  if (!isRecord(body)) return null;
  if (body.id !== orderId) return null;
  return body as unknown as MicroOrder;
}

/**
 * ONE order, by id, whatever page of the board it would have been on.
 *
 * WHY THE PAGE NEEDS THIS (DH-30). The board serves 50 rows and asks before
 * loading more, so an order she bookmarked, or was sent, can be missing from
 * the page we hold and perfectly alive. `GET /small-orders/orders/:orderId`
 * applies neither the date cut nor the paging, so it answers about any order we
 * hold.
 *
 * IT IS THE SAME ORDER THE BOARD WOULD HAVE SERVED. `findOrder()` in
 * `small-orders.mongo-feed-source.ts` joins `nsn_records` and `documents` and
 * then calls `mapOpportunityToMicroOrder`, which is what `mapPage()` does for
 * every row of the feed. So the verdict, the gap note, the sourcing panel, the
 * order paper and the send control all read the fields they read on the board.
 */
export async function fetchSmallOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<SmallOrderResult> {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/small-orders/orders/${encodeURIComponent(orderId)}`,
      { signal },
    );
    if (response.status === ORDER_NOT_FOUND) return { state: "absent" };
    if (!response.ok) return { state: "unreachable" };
    const order = narrowOrder(await response.json(), orderId);
    return order === null ? { state: "unreachable" } : { state: "order", order };
  } catch {
    // A throw is not a verdict. The server may hold this order and we did not
    // reach it, so nothing here may become "it is not there any more".
    return { state: "unreachable" };
  }
}

/**
 * Her answers, as the server holds them.
 *
 * `null` on any failure, and the caller keeps whatever the in-memory store
 * already has. Failing to LOAD her state must never look like her having
 * answered nothing — that would show a member who registered weeks ago the
 * first-run board, and the seeding effect would then write over it.
 *
 * A body that is not a keyed object is one of those failures, and the two kinds
 * fail differently. THIS WAS MEASURED, not reasoned about (DH-26 — the comment
 * here previously said an array body "would put string indices where
 * `categories` and `registrations` belong", and that is not what happens).
 * `commit()` in `state/microPurchases.ts` merges with `{ ...state, ...remote }`,
 * so an ARRAY body adds the keys `"0"`, `"1"`, … BESIDE `categories` and
 * `registrations` and overwrites neither: both survive, and what the store gains
 * is junk keys it then PUTs back as her state. An HTML error page never reaches
 * the merge at all, because a string is not an object and the check below
 * rejects it outright. The check is the envelope only (A11): a document with
 * fewer fields than `MicroState` merges cleanly and keeps the defaults for the
 * rest, which is what a member with a short history has.
 */
export async function fetchMemberState(signal?: AbortSignal): Promise<MicroState | null> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/small-orders/state`, { signal });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    return isRecord(body) ? (body as unknown as MicroState) : null;
  } catch {
    return null;
  }
}

/**
 * Why a write did not land, in the two kinds she can act on differently.
 *
 * `refused` — the server read the document and answered 4xx. It judged THIS
 * document and said no, so sending the same document again gets the same
 * answer. DH-06's caps are one way to earn it (DH-22/A14); an expired session
 * is another. Neither is fixed by waiting.
 *
 * `unconfirmed` — no verdict arrived. The request threw, or the server answered
 * 5xx, which is the server failing rather than judging. We cannot say whether
 * the document stored: a request can reach the server and lose its response. A
 * later write may land, so the store's next attempt is worth making.
 */
export type SaveFailure = "refused" | "unconfirmed";

/** What one write did: it landed, or it failed in one of the two kinds above. */
export type SaveOutcome = { saved: true } | { saved: false; reason: SaveFailure };

/** The lowest status that means the server judged the document. */
const CLIENT_ERROR_MIN = 400;

/** The lowest status that means the server broke instead of judging. */
const SERVER_ERROR_MIN = 500;

/**
 * Tell an operator that a member's record is not being stored.
 *
 * NUMBERS AND A STATUS, NOTHING ELSE. Everything in the document is hers — order
 * ids she opened, NSNs she attested, prices she typed — and none of it
 * belongs in a console. The four lengths are what an operator needs and all he
 * needs: they name which array is against its cap when the status is 400, which
 * is the measurement DH-22/A14 defers the pruning policy until somebody has.
 *
 * `console.warn` is the report this workspace already uses for a client-side
 * failure (`eventBus.ts`, `tasks.ts`, `mentorReviewsApi.ts`, `hunterChat.ts`),
 * and it is the same signal DH-26 put on the dropped feed row above.
 */
function reportFailedSave(state: MicroState, status: number | null): void {
  console.warn(
    `small-orders state: save failed with status ${status ?? "none"}; ` +
      `seen ${state.seenOrderIds.length}, ` +
      `attested ${state.attestedNsns.length}, quotes ${state.quotes.length}, ` +
      `wins ${state.wins.length}`,
  );
}

/**
 * Write her answers back, whole.
 *
 * The store holds the complete state and is the single writer, so this PUTs the
 * document rather than a patch — the merge rule stays in one place instead of
 * being split between a client reducer and a server one.
 *
 * Returns what happened to the write, in the two kinds above. It used to return
 * a boolean that its one caller discarded with `void`, so EVERY failed save was
 * silent — a 400 from a cap, a 401 from a dead session, a 500, a dropped
 * connection. Her quotes and wins stopped persisting and nothing told her or
 * anybody else. Nothing on screen is reversed on a failure: the in-memory store
 * has already committed and she has already seen her answer land in the page.
 * She is told that it is on the page ONLY.
 */
/** One acquisition code and what the regulation says it means. */
export type AcquisitionCodeMeaning = {
  code: string;
  kind: "amc" | "amsc";
  meaning: string;
  status: string;
  citation: { document: string; section: string; effectiveDate: string; url: string };
};

/**
 * DFARS PGI 217.75's own words for every acquisition code, or `null`.
 *
 * FETCHED ONCE FOR THE WHOLE TABLE. It is 32 entries of pinned transcription,
 * not live data, so one request serves every order page in the session — and
 * the alternative, a lookup per order, would put a round trip in front of a
 * panel that only explains a code already on screen.
 *
 * NULL RENDERS NOTHING. The verdict above it does not depend on this text; it
 * is the regulation quoted for a member who wants to check us against it. A
 * panel that failed to arrive must cost her nothing.
 */
export async function fetchAcquisitionCodes(
  signal?: AbortSignal,
): Promise<AcquisitionCodeMeaning[] | null> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/small-orders/acquisition-codes`, { signal });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!Array.isArray(body)) return null;
    const out: AcquisitionCodeMeaning[] = [];
    for (const entry of body) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as Record<string, unknown>;
      const cite = (row.citation ?? {}) as Record<string, unknown>;
      if (typeof row.code !== "string" || typeof row.meaning !== "string") continue;
      if (row.kind !== "amc" && row.kind !== "amsc") continue;
      out.push({
        code: row.code,
        kind: row.kind,
        meaning: row.meaning,
        status: typeof row.status === "string" ? row.status : "",
        citation: {
          document: typeof cite.document === "string" ? cite.document : "",
          section: typeof cite.section === "string" ? cite.section : "",
          effectiveDate: typeof cite.effectiveDate === "string" ? cite.effectiveDate : "",
          url: typeof cite.url === "string" ? cite.url : "",
        },
      });
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * The acquisition-code census over the whole corpus, or `null`.
 *
 * NULL IS A REAL ANSWER and the caller must render the page without it. This
 * fills in the held-back ledger's corpus figures; a board that refused to draw
 * because a secondary count had not arrived would be worse than a board whose
 * ledger appears a second late.
 *
 * NARROWED HERE, like the feed. The wire is untrusted: a row missing a field,
 * or carrying a number where a string belongs, is dropped rather than allowed
 * to reach `corpusLedger()` and be counted as something it is not.
 */
export async function fetchCodeCensus(signal?: AbortSignal): Promise<{
  rows: CensusRow[];
  total: number;
} | null> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/small-orders/code-census`, { signal });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return null;
    const raw = body as { pairs?: unknown; total?: unknown };
    if (!Array.isArray(raw.pairs) || typeof raw.total !== "number") return null;
    const rows: CensusRow[] = [];
    for (const entry of raw.pairs) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as Record<string, unknown>;
      if (typeof row.orders !== "number") continue;
      rows.push({
        amc: typeof row.amc === "string" ? row.amc : null,
        amsc: typeof row.amsc === "string" ? row.amsc : null,
        hasPsc: row.hasPsc === true,
        dibbsStatus: typeof row.dibbsStatus === "string" ? row.dibbsStatus : null,
        orders: row.orders,
      });
    }
    return { rows, total: raw.total };
  } catch {
    return null;
  }
}

/** Open orders per category for a set of NAICS codes. */
export interface NaicsCategoryCounts {
  total: number;
  rows: { category: MicroCategory; orders: number }[];
}

/**
 * GET /small-orders/naics-categories — open orders per category, over the whole
 * corpus, for these NAICS codes. `null` when the server did not answer usefully:
 * a suggestion is a convenience, and the sheet opens without one.
 */
export async function fetchNaicsCategories(
  codes: string[],
  signal?: AbortSignal,
): Promise<NaicsCategoryCounts | null> {
  try {
    const query = encodeURIComponent(codes.join(","));
    const response = await apiFetch(
      `${API_BASE_URL}/small-orders/naics-categories?naics=${query}`,
      {
        signal,
      },
    );
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return null;
    const raw = body as { total?: unknown; rows?: unknown };
    if (typeof raw.total !== "number" || !Array.isArray(raw.rows)) return null;
    const rows: NaicsCategoryCounts["rows"] = [];
    for (const entry of raw.rows) {
      if (typeof entry !== "object" || entry === null) continue;
      const row = entry as Record<string, unknown>;
      if (typeof row.category !== "string" || typeof row.orders !== "number") continue;
      rows.push({ category: row.category as MicroCategory, orders: row.orders });
    }
    return { total: raw.total, rows };
  } catch {
    return null;
  }
}

/**
 * GET /small-orders/fit — her matching-engine score per order id. An empty
 * object when the server did not answer: Best first then ranks without fit,
 * which is what it did before fit existed.
 */
/** The most ids `GET /small-orders/orders` takes in one request. */
const ORDERS_BY_ID_BATCH = 100;

/**
 * Her saved orders, by id — the Saved tab.
 *
 * Her saved list is the workspace's and also holds other opportunities; the
 * server leaves out any id that is not a DIBBS order. Closed orders come back
 * too. The answer keeps the order the ids were given in.
 *
 * `null` when any request fails or a body is not an order list, so the tab can
 * say it could not get them rather than show a short list as the whole one.
 */
export async function fetchSmallOrdersByIds(
  orderIds: readonly string[],
  signal?: AbortSignal,
): Promise<MicroOrder[] | null> {
  const batches: string[][] = [];
  for (let i = 0; i < orderIds.length; i += ORDERS_BY_ID_BATCH) {
    batches.push(orderIds.slice(i, i + ORDERS_BY_ID_BATCH));
  }
  try {
    const answers = await Promise.all(
      batches.map(async (batch) => {
        const query = encodeURIComponent(batch.join(","));
        const response = await apiFetch(`${API_BASE_URL}/small-orders/orders?ids=${query}`, {
          signal,
        });
        if (!response.ok) return null;
        const body: unknown = await response.json();
        if (!isRecord(body) || !Array.isArray(body.orders)) return null;
        return body.orders.filter(isRecord) as unknown as MicroOrder[];
      }),
    );
    if (answers.some((a) => a === null)) return null;
    return (answers as MicroOrder[][]).flat();
  } catch {
    return null;
  }
}

export async function fetchMatchScores(
  orderIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  try {
    const query = encodeURIComponent(orderIds.join(","));
    const response = await apiFetch(`${API_BASE_URL}/small-orders/fit?ids=${query}`, { signal });
    if (!response.ok) return {};
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return {};
    const scores = (body as { scores?: unknown }).scores;
    if (typeof scores !== "object" || scores === null) return {};
    const out: Record<string, number> = {};
    for (const [id, value] of Object.entries(scores as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) out[id] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export async function saveMemberState(state: MicroState): Promise<SaveOutcome> {
  try {
    const response = await apiFetch(`${API_BASE_URL}/small-orders/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (response.ok) return { saved: true };
    reportFailedSave(state, response.status);
    const judged = response.status >= CLIENT_ERROR_MIN && response.status < SERVER_ERROR_MIN;
    return { saved: false, reason: judged ? "refused" : "unconfirmed" };
  } catch {
    reportFailedSave(state, null);
    return { saved: false, reason: "unconfirmed" };
  }
}

/**
 * Company names for one order's CAGE codes, keyed by code.
 *
 * `{}` on any failure. A supplier name is a courtesy on a panel whose facts are
 * already on screen — the CAGE renders either way, and it is the identifier she
 * would search with regardless.
 */
export async function fetchSupplierNames(orderId: string): Promise<Record<string, string>> {
  try {
    const response = await apiFetch(
      `${API_BASE_URL}/small-orders/orders/${encodeURIComponent(orderId)}/suppliers`,
    );
    if (!response.ok) return {};
    return (await response.json()) as Record<string, string>;
  } catch {
    return {};
  }
}
