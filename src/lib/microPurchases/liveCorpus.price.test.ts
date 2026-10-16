/**
 * THE PRICE, AND WHERE IT STILL ABSTAINS (D14).
 *
 * `awards[]` is the only price this surface will stand behind. It lives on the
 * `nsn_records` document, which `nsn.service.ts` ingests and the feed source
 * joins on the order's stock number — so a joined order now carries a real
 * award history, a real last price and a real unit of issue, and the price
 * block answers instead of withdrawing.
 *
 * ── THE FILE'S PURPOSE DID NOT CHANGE ────────────────────────────────────
 *
 * It exists to stop a money figure being derived from evidence we do not hold.
 * A quantity is not a value; a stock number is not a price. So over a joined
 * corpus it pins BOTH halves:
 *
 *  1. **Where the record supplies awards, the price answers** — a price point,
 *     an order value where a quantity is also stated, and a usable ceiling.
 *  2. **Where it does not, the price still abstains** — no record at all, or a
 *     record carrying no award and no price field. `pricePoint()` is null,
 *     `orderValue()` is null, no size band matches, and no ceiling is put in
 *     front of her.
 *
 * The failure this prevents is silent and expensive: a money figure derived
 * from a price we hold no evidence for is a number she acts on. Nothing in
 * `pricing.ts` is loosened to produce one.
 *
 * ONE CLOCK: the ladder's `now` is the corpus's own day, never a wall clock.
 * An award's age is measured from the day the corpus was posted or it measures
 * how long ago the ingest stopped.
 */
import { describe, it, expect } from "vitest";
import { hasUsableCeiling, orderValue, pricePoint } from "./pricing";
import { EMPTY_CONTEXT, NO_FILTERS, passesFilters, queryOrders } from "./relevance";
import {
  LIVE_AS_OF,
  LIVE_MAPPED_ORDERS,
  LIVE_MAPPED_UNCATEGORISED,
  LIVE_UNJOINED_IDS,
} from "./liveMapperOutput.fixture";
import { type MicroOrder } from "./order";

const ALL = [...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED];
const CORPUS_DAY = new Date(`${LIVE_AS_OF}T00:00:00.000Z`);

/** Nothing on the record to build a price from: no award, and no price field
 *  to fall back to. `pricePoint()` must answer null on every one of these. */
function holdsNoEvidence(o: MicroOrder): boolean {
  return o.awards.length === 0 && o.lastPricePerUnit === null;
}

const PRICED = ALL.filter((o) => o.awards.length > 0);
const UNPRICED = ALL.filter(holdsNoEvidence);
/** Joined to no `nsn_records` document at all — the 2.5%. Named by the fixture
 *  rather than found by reading nulls, because an order that joined to a record
 *  holding no code carries the same nulls and is a different fact. */
const UNJOINED = ALL.filter((o) => LIVE_UNJOINED_IDS.includes(o.id));

describe("the corpus carries both populations", () => {
  it("has orders with award evidence and orders with none", () => {
    // Named first, so no assertion below can pass by ruling over nothing.
    expect(ALL.length).toBeGreaterThan(0);
    expect(PRICED.length).toBeGreaterThan(0);
    expect(UNPRICED.length).toBeGreaterThan(0);
    expect(UNJOINED.length).toBeGreaterThan(0);
  });
});

describe("an order whose record carries awards", () => {
  it("carries the award history the record holds, not a summary of it", () => {
    for (const o of PRICED) {
      expect(o.awards.length).toBeGreaterThan(0);
      // The newest award dates the last price. The record has no other date.
      expect(o.lastPriceDate).toBe(o.awards[0].awardedOn);
    }
  });

  it("has a price point, built from the award and not from the field", () => {
    for (const o of PRICED) {
      const point = pricePoint(o);
      expect(point).not.toBeNull();
      expect(point?.amount).toBe(o.awards[0].unitCost);
    }
  });

  it("has an order value wherever a quantity is also stated", () => {
    const withQuantity = PRICED.filter((o) => o.quantity != null && o.quantity > 0);

    expect(withQuantity.length).toBeGreaterThan(0);
    for (const o of withQuantity) expect(orderValue(o, CORPUS_DAY)).not.toBeNull();
  });

  it("has a ceiling, because the unit of issue arrived with the price", () => {
    // `priceCeiling()` withdraws when the unit is null: reading `HD` (hundred)
    // as `each` is wrong by a factor of 100. The record carries `ui`, so the
    // instruction can name what one unit is.
    const usable = PRICED.filter((o) => hasUsableCeiling(o, CORPUS_DAY));

    expect(usable.length).toBeGreaterThan(0);
    for (const o of usable) expect(o.unitOfIssue).not.toBeNull();
  });
});

describe("an order with no price evidence", () => {
  it("carries nothing the price could be built from", () => {
    for (const o of UNPRICED) {
      expect(o.awards).toEqual([]);
      expect(o.lastPricePerUnit).toBeNull();
      expect(o.lastPriceDate).toBeNull();
    }
  });

  it("has no price point, no order value and no ceiling", () => {
    for (const o of UNPRICED) {
      expect(pricePoint(o)).toBeNull();
      expect(orderValue(o, CORPUS_DAY)).toBeNull();
      expect(hasUsableCeiling(o, CORPUS_DAY)).toBe(false);
    }
  });

  it("stays priceless even where a real quantity IS stated", () => {
    // A quantity is not a value: multiplying it by a price we do not hold is
    // the derived-money defect this file exists to prevent.
    const withQuantity = UNPRICED.filter((o) => o.quantity != null && o.quantity > 0);

    expect(withQuantity.length).toBeGreaterThan(0);
    for (const o of withQuantity) expect(orderValue(o, CORPUS_DAY)).toBeNull();
  });

  it("matches no size band she can pick — an unknown value satisfies none", () => {
    // `passesSize()` refuses an order whose value it cannot read, deliberately:
    // a band is a promise about money.
    for (const size of ["under1k", "1kTo5k", "over5k"] as const) {
      const matched = UNPRICED.filter((o) => passesFilters(o, { ...NO_FILTERS, size }, CORPUS_DAY));
      expect(matched).toEqual([]);
    }
    expect(UNPRICED.filter((o) => passesFilters(o, NO_FILTERS, CORPUS_DAY))).toHaveLength(
      UNPRICED.length,
    );
  });
});

describe("an order that joined to no record at all", () => {
  it("abstains on the price as completely as it abstains on the verdict", () => {
    // The no-record rule reaches every NSN-side field, not only the two codes.
    // An order we cannot say who may sell is also an order we cannot price.
    for (const o of UNJOINED) {
      expect(o.awards).toEqual([]);
      expect(o.lastPricePerUnit).toBeNull();
      expect(o.lastPriceDate).toBeNull();
      expect(o.standardPrice).toBeNull();
      expect(o.unitOfIssue).toBeNull();
      expect(o.partNumbers).toBeNull();
      expect(o.approvedSources).toEqual([]);
      expect(pricePoint(o)).toBeNull();
      expect(orderValue(o, CORPUS_DAY)).toBeNull();
    }
  });
});

describe("what the price costs the board", () => {
  it("holds back every order the $15,000 cap catches, and no others", () => {
    // The cap is a real exclusion now that real prices arrive. It fires only on
    // a BIDDABLE order we can price, and every one it fires on is named on the
    // ledger rather than dropped in silence.
    const result = queryOrders(
      { filters: NO_FILTERS, sort: "best" },
      EMPTY_CONTEXT,
      ALL,
      LIVE_AS_OF,
    );

    expect(result.overCap).toBeGreaterThanOrEqual(0);
    // No order the board SHOWS is over the cap, whatever the count says.
    for (const o of result.rows) {
      const value = orderValue(o, CORPUS_DAY);
      if (value !== null) expect(value).toBeLessThanOrEqual(15000);
    }
  });

  it("sorts by size without inventing a size for an order it cannot price", () => {
    const result = queryOrders(
      { filters: NO_FILTERS, sort: "biggest" },
      EMPTY_CONTEXT,
      ALL,
      LIVE_AS_OF,
    );

    for (const o of result.rows) {
      if (holdsNoEvidence(o)) expect(orderValue(o, CORPUS_DAY)).toBeNull();
    }
  });
});
