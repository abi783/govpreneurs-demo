// THE PRICE LADDER READS THE SERVED CORPUS'S DAY.
//
// An award's age is a fact about an ORDER, so it takes the corpus's day
// (`SmallOrdersFeed.asOf`) — the same clock the board judges a closing date
// against. `src/lib/microPurchases/wallClock.ts` names that split and puts
// "how old its last award is" on this side of it.
//
// `pricing.ts` defaulted `now` to `TODAY`, the SAMPLE corpus's frozen day, and
// twenty live call sites took the default. The sample's day stopped on
// 26 August 2026 while the served corpus's day moves with the ingest, so the
// ladder measured every award against a day that is not the board's. It reads
// an award as older than it is while the served day trails the sample's, and
// as YOUNGER once the served day passes it. Since 2026-09-15 an old award
// still prices (owner's call), so the day decides which WORDS go with the
// price: "more than two years ago" is a claim about the award's age, and the
// wrong day makes it false.
//
// Every case below sets the two days apart and asserts which one answered.
import { describe, expect, it } from "vitest";
import { MONTHS_USABLE, corpusNow, monthsSince, orderValue, priceAdvice } from "./pricing";
import { EMPTY_CONTEXT, NO_FILTERS, queryOrders, resellerRule } from "./relevance";
import { mentorDecision } from "./mentor";
import { LIVE_AS_OF } from "./liveMapperOutput.fixture";
import { STRADDLE_AWARD_DAY, STRADDLING_ORDER } from "./priceClock.fixture";
import { TODAY } from "../mock/microPurchaseOrders";
import type { MicroOrder } from "./order";

/** The served corpus's day, through the one function that reads it. */
const CORPUS_DAY = corpusNow(LIVE_AS_OF);

/** The order the two days disagree about. See `priceClock.fixture.ts`. */
const ORDER: MicroOrder = STRADDLING_ORDER;

describe("the two days disagree about this award", () => {
  it("is inside the window on the corpus's day and past it on the sample's", () => {
    // Named first, so nothing below passes by ruling over a corpus where both
    // clocks give the same answer.
    expect(CORPUS_DAY).not.toBeNull();
    expect(monthsSince(STRADDLE_AWARD_DAY, CORPUS_DAY as Date)).toBeLessThanOrEqual(MONTHS_USABLE);
    expect(monthsSince(STRADDLE_AWARD_DAY, TODAY)).toBeGreaterThan(MONTHS_USABLE);
  });

  it("calls the award old only on the day that makes it old", () => {
    // Both days price the order. Only the sample's day, which ages the award
    // past 24 months, may say it is more than two years old.
    const onCorpusDay = priceAdvice(ORDER, CORPUS_DAY);
    const onSampleDay = priceAdvice(ORDER, TODAY);

    expect(onCorpusDay.ceiling).not.toBeNull();
    expect(onCorpusDay.kind).not.toBe("stale");
    expect(onCorpusDay.body).not.toContain("more than two years ago");

    expect(onSampleDay.ceiling).not.toBeNull();
    expect(onSampleDay.kind).toBe("stale");
    expect(onSampleDay.body).toContain("more than two years ago");
  });
});

describe("the board prices against the day it was served", () => {
  it("keeps an order in the size band its corpus-day value falls in", () => {
    // `passesSize()` refuses an order it cannot price. On the sample's frozen
    // day this order has no value at all, so the band drops a row the served
    // board can price and rank.
    const result = queryOrders(
      { filters: { ...NO_FILTERS, size: "under1k" }, sort: "best" },
      EMPTY_CONTEXT,
      [ORDER],
      LIVE_AS_OF,
    );

    expect(orderValue(ORDER, CORPUS_DAY)).toBeLessThan(1000);
    expect(result.rows.map((o) => o.id)).toEqual([ORDER.id]);
  });

  it("sorts by size on the corpus day's value, never on nothing", () => {
    const result = queryOrders(
      { filters: NO_FILTERS, sort: "biggest" },
      EMPTY_CONTEXT,
      [ORDER],
      LIVE_AS_OF,
    );

    expect(result.rows).toHaveLength(1);
  });

  it("states the reseller rule, which needs a value to place against the threshold", () => {
    // 13 CFR 121.406(c) applies below the simplified acquisition threshold, so
    // the sentence is withheld where the value is unknown. An old award still
    // gives a value, so the rule is stated on either day.
    const setAside: MicroOrder = { ...ORDER, setAside: "SBA" };

    expect(resellerRule(setAside, CORPUS_DAY)).not.toBeNull();
    expect(resellerRule(setAside, TODAY)).not.toBeNull();
  });
});

describe("the mentor's price check", () => {
  it("catches a price far under what DLA paid, on the corpus's day", () => {
    // The trigger compares her price against `priceAdvice().ceiling`, so on a
    // day that withdraws the ceiling the check cannot fire at all — and this is
    // the unit-of-issue catch that mentor.ts says pays for the feature.
    const decision = mentorDecision(
      ORDER,
      { pricePerUnit: 1, deliveryDays: ORDER.deliveryDays },
      { hasQuotedBefore: true, largestOrderValueSoFar: 0, reviewsThisWeek: 0 },
      CORPUS_DAY,
    );

    expect(decision.mode).not.toBe("none");
    expect(decision.mode !== "none" && decision.trigger.id).toBe("price-low");
  });
});

describe("a corpus that carries no day", () => {
  it("abstains rather than pricing against an unreadable one", () => {
    // `asOf` is `''` only on an empty or failed feed, which carries no order to
    // price. An unreadable day must still withdraw: a date arithmetic against
    // it yields NaN, and every NaN comparison is false, so the ladder would
    // hand back a ceiling it had aged against nothing.
    expect(corpusNow("")).toBeNull();
    expect(orderValue(ORDER, null)).toBeNull();
    // The whole block abstains, not just the ceiling: stating "DLA paid $X" with
    // no age beside it is the age claim the ladder exists to withhold.
    expect(priceAdvice(ORDER, null).kind).toBe("none");
    expect(priceAdvice(ORDER, null).ceiling).toBeNull();
  });
});
