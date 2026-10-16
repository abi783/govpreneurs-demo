// THE COUNTS HUNTER STATES, AND WHOSE ROWS THEY COUNT.
//
// DH-28 made the board arrive 50 at a time. Every count on the surface was
// written when the board arrived whole, so each one silently changed meaning
// from "today's orders" to "the ones that have loaded" — and went on using the
// first word for the second thing. A member with 13,418 open orders read
// "50 open".
//
// The distinction these cases exist to hold is not "big number good":
//
//   · a STANDALONE count — "N orders today" — is a claim about the corpus, and
//     the server measured it, so it takes `feed.total`.
//   · a PARTITION claim — so many open to any seller, so many with rules, so
//     many we could not rule on — is a sum over the rows in hand. It must keep
//     counting those rows. Parts that do not add up to the whole they are
//     printed under are a worse defect than the one being fixed.
//
// The second rule is the one a future edit will break, so it gets its own case.
import { describe, expect, it } from "vitest";
import {
  hunterSummary,
  forYouSummary,
  overMicroCap,
  queryOrders,
  EMPTY_CONTEXT,
  NO_FILTERS,
  MICRO_PURCHASE_LIMIT,
  type MicroMemberContext,
} from "./relevance";
import { quantityLine, quantityParts } from "./units";
import { corpusNow, orderValue } from "./pricing";
import { LIVE_AS_OF } from "./liveMapperOutput.fixture";
import { STRADDLING_ORDER } from "./priceClock.fixture";
import type { MicroResult } from "./relevance";
import type { MicroOrder } from "./order";
import { MICRO_ORDERS } from "../mock/microPurchaseOrders";

const MEMBER: MicroMemberContext = EMPTY_CONTEXT;

/** A board result carrying `rows`, with the feed flags a healthy sweep sets. */
function boardOf(rows: MicroOrder[]): MicroResult {
  return {
    ...({} as MicroResult),
    rows,
    restricted: [],
    unreadable: [],
    considered: rows.length,
    feed: rows.length,
    feedArrived: true,
  } as MicroResult;
}

/** Orders whose acquisition codes never reached us — the unruled tier. */
function unruled(count: number): MicroOrder[] {
  return Array.from({ length: count }, (_, i) => ({
    ...MICRO_ORDERS[0],
    oppKey: `gap-${i}`,
    amc: null,
    amsc: null,
  }));
}

describe("hunterSummary and the corpus total", () => {
  it("states the corpus total, not the rows that have loaded", () => {
    const line = hunterSummary(boardOf(unruled(50)), MEMBER, 0, 13418);

    expect(line).toContain("13,418 orders");
    // The loaded count must not be presented as the day's total.
    expect(line).not.toMatch(/\b50 orders today/);
  });

  it("falls back to the rows in hand when no server total has arrived", () => {
    // First paint renders the bundled sample and no total exists yet. There the
    // rows ARE everything we hold, so counting them is the honest answer.
    const line = hunterSummary(boardOf(unruled(7)), MEMBER, 0, null);

    expect(line).toContain("7 orders");
  });

  /**
   * THE CASE THAT GUARDS THE RULE, not just the number.
   *
   * When every loaded row is one we could not rule on, Hunter says so. That
   * sentence counts what he READ. Handed the corpus total it would claim he had
   * read 13,418 orders and failed on all of them — a confession about work he
   * never did, printed over a board he has barely started.
   */
  it("counts the rows he read, not the corpus, when the claim partitions the board", () => {
    const line = hunterSummary(boardOf(unruled(50)), MEMBER, 1, 13418);

    expect(line).toContain("The source data does not make clear who may sell 50 orders today.");
    expect(line).not.toContain("who may sell 13,418");
  });
});

describe("quantityParts", () => {
  it("keeps the count out of the sentence about the count", () => {
    // The defect: "223 — I do not know how these are counted."
    // rendered as one bold VALUE under a label reading HOW MANY.
    const parts = quantityParts(223, null);

    expect(parts.value).toBe("223");
    expect(parts.note).toBe("unit not available at source.");
  });

  it("has no note when the count says everything", () => {
    const parts = quantityParts(300, "EA");

    expect(parts.value).toBe("300 pieces");
    expect(parts.note).toBeNull();
  });

  /** One owner for the words: the joined form must still be the two parts. */
  it("composes back into the one-line form the card and the wins record use", () => {
    for (const ui of [null, "EA", "HD", "ZZ"] as const) {
      const parts = quantityParts(500, ui);
      const joined = parts.note == null ? parts.value : `${parts.value} — ${parts.note}`;
      expect(joined).toBe(quantityLine(500, ui));
    }
  });
});

// ── THE COUNT AND THE CARDS ARE ONE SET (owner, 2026-09-16) ───────────────
//
// The chip and Hunter's sentence read the SERVER's `total`. The list under
// them is `queryOrders()` output, and three CLIENT cuts ran between the two:
// an uncategorised order, an order over the micro-purchase cap, and an order
// DLA is not taking prices on. Measured on the live API on 2026-09-16, one
// member was told 120 and could reach 19.
//
// Two of the three cuts are gone — both kinds of order stay on the board, and
// the over-cap one carries a mark. The third moved to the server, so the count
// and every page leave it out together
// (`backend/src/small-orders/small-orders.feed-total.spec.ts`).

/** A live order she may bid, DLA is taking prices on, priced and categorised. */
const ON_THE_BOARD: MicroOrder = { ...STRADDLING_ORDER, id: "on-the-board" };

/** We could not work out what kind of part it is. It is shown, not deleted. */
const UNCATEGORISED: MicroOrder = { ...ON_THE_BOARD, id: "uncategorised", category: "other" };

/** Worth more than the micro-purchase cap. It is shown with a mark, not deleted. */
const OVER_CAP: MicroOrder = {
  ...ON_THE_BOARD,
  id: "over-cap",
  quantity: Math.ceil(MICRO_PURCHASE_LIMIT / (STRADDLING_ORDER.lastPricePerUnit ?? 1)) + 1,
};

/** DLA is not taking prices on it. THE SERVER leaves it out, so it never
 *  reaches this corpus and never enters the count. */
const NOT_TAKING_PRICES: MicroOrder = {
  ...ON_THE_BOARD,
  id: "not-taking-prices",
  dibbsStatus: "Cancelled",
};

/** Every order DLA holds for her today, before the server's own cut. */
const CORPUS = [ON_THE_BOARD, UNCATEGORISED, OVER_CAP, NOT_TAKING_PRICES];

/** What the feed serves AND counts: `total` is a count of exactly these rows. */
const SERVED = CORPUS.filter((o) => o.dibbsStatus === "Open");

/** The whole board behind her matched set, for the sentence's first number. */
const BOARD_TOTAL = 15454;

describe("the walked board shows every order its count counts", () => {
  it("holds a corpus that reaches all three cuts", () => {
    // Without this the cases below could pass over orders that were never cut.
    const now = corpusNow(LIVE_AS_OF);
    expect(UNCATEGORISED.category).toBe("other");
    expect(overMicroCap(OVER_CAP, now)).toBe(true);
    expect(orderValue(OVER_CAP, now)).toBeGreaterThan(MICRO_PURCHASE_LIMIT);
    expect(overMicroCap(ON_THE_BOARD, now)).toBe(false);
    expect(SERVED).toHaveLength(3);
  });

  it.each([true, false])(
    "serves one card for every order the count counts (eligibleOnly: %s)",
    (eligibleOnly) => {
      const result = queryOrders(
        { filters: NO_FILTERS, sort: "best", eligibleOnly },
        EMPTY_CONTEXT,
        SERVED,
        LIVE_AS_OF,
      );

      expect(result.rows).toHaveLength(SERVED.length);
      expect(result.rows.map((o) => o.id).sort()).toEqual(SERVED.map((o) => o.id).sort());
      // Nothing is held back in hand, on either walked tab.
      expect(result.restricted).toHaveLength(0);
      expect(result.unreadable).toHaveLength(0);
      expect(result.filteredOut).toBe(0);
    },
  );

  it("states the number it shows", () => {
    const result = queryOrders(
      { filters: NO_FILTERS, sort: "best", eligibleOnly: true },
      EMPTY_CONTEXT,
      SERVED,
      LIVE_AS_OF,
    );

    // `total` is the server's count of `SERVED`, which is what the chip prints.
    expect(forYouSummary(BOARD_TOTAL, SERVED.length)).toContain(
      `${result.rows.length} orders that fit`,
    );
  });

  it("counts the over-cap rows it shows", () => {
    const result = queryOrders(
      { filters: NO_FILTERS, sort: "best", eligibleOnly: true },
      EMPTY_CONTEXT,
      SERVED,
      LIVE_AS_OF,
    );

    // The field names the marked rows now, not a set held back.
    expect(result.overCap).toBe(1);
    expect(result.rows.map((o) => o.id)).toContain("over-cap");
  });

  it("leaves the status cut to the server", () => {
    // The client rules on nothing here any more. If a not-taking-prices order
    // ever reaches the browser, it is a row like any other — which is what
    // keeps the count and the cards one set.
    const result = queryOrders(
      { filters: NO_FILTERS, sort: "best", eligibleOnly: true },
      EMPTY_CONTEXT,
      CORPUS,
      LIVE_AS_OF,
    );

    expect(result.rows).toHaveLength(CORPUS.length);
  });
});
