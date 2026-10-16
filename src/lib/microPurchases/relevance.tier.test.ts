// COMPLETE ORDERS FIRST (owner, 2026-09-15).
//
// A complete order carries an acquisition code we can read and a price we can
// quote from. The server walk serves those orders first across every page, and
// `queryOrders()` keeps them first inside the rows she has loaded. The ranking
// she already had still orders each tier.
import { describe, expect, it } from "vitest";
import { EMPTY_CONTEXT, NO_FILTERS, isComplete, queryOrders, type MicroSort } from "./relevance";
import { LIVE_AS_OF } from "./liveMapperOutput.fixture";
import { STRADDLING_ORDER } from "./priceClock.fixture";
import type { MicroOrder } from "./order";

/** A priced order with a readable code, varied by id, stock number and close. */
function complete(id: string, nsn: string, closesOn: string): MicroOrder {
  return { ...STRADDLING_ORDER, id, nsn, closesOn };
}

/** No acquisition code reached us. */
function noCode(id: string, nsn: string, closesOn: string): MicroOrder {
  return { ...complete(id, nsn, closesOn), amc: null, amsc: null };
}

/** No price we can quote from. */
function noPrice(id: string, nsn: string, closesOn: string): MicroOrder {
  return {
    ...complete(id, nsn, closesOn),
    awards: [],
    lastPricePerUnit: null,
    lastPriceDate: null,
    standardPrice: null,
  };
}

const ORDERS: MicroOrder[] = [
  noPrice("no-price", "5305000000001", "2099-01-01"),
  noCode("no-code", "5305000000002", "2099-01-02"),
  complete("complete-late", "5305000000003", "2099-03-01"),
  complete("complete-early", "5305000000004", "2099-02-01"),
];

/** She said she can get the incomplete orders' parts, which lifts them in Best first. */
const MEMBER = { ...EMPTY_CONTEXT, attestedNsns: ["5305000000001", "5305000000002"] };

const SORTS: MicroSort[] = ["best", "closing", "biggest"];

function rowIds(sort: MicroSort, orders: MicroOrder[]): string[] {
  return queryOrders({ filters: NO_FILTERS, sort }, MEMBER, orders, LIVE_AS_OF).rows.map(
    (o) => o.id,
  );
}

describe("isComplete", () => {
  it("needs both a readable code and a price", () => {
    expect(ORDERS.map(isComplete)).toEqual([false, false, true, true]);
  });
});

describe("queryOrders — complete orders first", () => {
  it("serves every order it was given", () => {
    for (const sort of SORTS) expect(rowIds(sort, ORDERS)).toHaveLength(ORDERS.length);
  });

  it("puts a complete order above an incomplete one she said she can get", () => {
    // Her answer lifts an incomplete order to the top of its own tier, and no
    // higher: a complete order still comes first.
    expect(
      rowIds(
        "best",
        ORDERS.filter((o) => !isComplete(o)),
      )[0],
    ).toBe("no-price");
    expect(rowIds("best", ORDERS)[0]).not.toBe("no-price");
  });

  it.each(SORTS)("puts complete orders first and keeps each tier's own order (%s)", (sort) => {
    const expected = [
      ...rowIds(sort, ORDERS.filter(isComplete)),
      ...rowIds(
        sort,
        ORDERS.filter((o) => !isComplete(o)),
      ),
    ];

    expect(rowIds(sort, ORDERS)).toEqual(expected);
  });
});
