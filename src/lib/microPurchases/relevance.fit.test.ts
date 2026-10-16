// "Best first" — the fit term.
//
// Best first ranks by how well an order fits her business. The matching engine
// already answers that for opportunities, and a small order IS an opportunity:
// on production about one match row in seven is a DIBBS order, rescored each
// Sunday. So the engine's `finalScore` (0–100) is the fit where she has a match
// row. An order posted since the last rescore has none, and falls back to her
// NAICS codes — an exact code, then one the engine counts as related.
import { describe, expect, it } from "vitest";
import {
  EMPTY_CONTEXT,
  FIT_MAX_POINTS,
  NAICS_ALLIED_FIT,
  NAICS_EXACT_FIT,
  fitScore,
  relevanceScore,
  type MicroMemberContext,
} from "./relevance";
import { MICRO_ORDERS, TODAY } from "../mock/microPurchaseOrders";
import type { MicroOrder } from "./order";

const ORDER: MicroOrder = { ...MICRO_ORDERS[0], id: "dibbs-fit", naics: "332722" };

function member(over: Partial<MicroMemberContext> = {}): MicroMemberContext {
  return { ...EMPTY_CONTEXT, ...over };
}

describe("fitScore", () => {
  it("is her engine score where the engine scored the order", () => {
    expect(fitScore(ORDER, member({ matchScores: { "dibbs-fit": 63 } }))).toBe(63);
  });

  it("prefers the engine score over any NAICS fallback", () => {
    const m = member({ matchScores: { "dibbs-fit": 12 }, profileNaics: ["332722"] });
    expect(fitScore(ORDER, m)).toBe(12);
  });

  it("falls back to an exact NAICS code, then a related one", () => {
    expect(fitScore(ORDER, member({ profileNaics: ["332722"] }))).toBe(NAICS_EXACT_FIT);
    expect(fitScore(ORDER, member({ alliedNaics: ["332722"] }))).toBe(NAICS_ALLIED_FIT);
  });

  it("claims no fit at all when neither source says anything", () => {
    expect(fitScore(ORDER, member())).toBeNull();
    expect(fitScore({ ...ORDER, naics: null }, member({ profileNaics: ["332722"] }))).toBeNull();
  });
});

describe("the fit term inside Best first", () => {
  const now = new Date(`${TODAY.toISOString().slice(0, 10)}T00:00:00Z`);
  const base = relevanceScore(ORDER, member(), now);

  it("adds points in proportion to the fit, up to its ceiling", () => {
    expect(relevanceScore(ORDER, member({ matchScores: { "dibbs-fit": 100 } }), now) - base).toBe(
      FIT_MAX_POINTS,
    );
    expect(relevanceScore(ORDER, member({ matchScores: { "dibbs-fit": 50 } }), now) - base).toBe(
      FIT_MAX_POINTS / 2,
    );
  });

  it("never lifts a perfect fit above a part she said she can get", () => {
    const perfectFit = relevanceScore(ORDER, member({ matchScores: { "dibbs-fit": 100 } }), now);
    const canGet = relevanceScore(ORDER, member({ attestedNsns: [ORDER.nsn] }), now);
    expect(canGet).toBeGreaterThan(perfectFit);
  });
});
