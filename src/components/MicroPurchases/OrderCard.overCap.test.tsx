// @vitest-environment jsdom
//
// AN ORDER OVER THE MICRO-PURCHASE CAP IS SHOWN, WITH A MARK (owner,
// 2026-09-16).
//
// The $15,000 cap used to DELETE the row while the chip and Hunter's sentence
// above it went on counting the order, so a member read a number she could not
// reach. The row stays now and says what is true of it. The mark states a fact
// and gives no instruction: the cap is a rule about the buying method, not a
// refusal by DLA, and the order page carries what she does about it.
//
// Rendered rather than asserted as a string, following `OrderCard.gap.test.tsx`
// beside it: the claim is about what reaches her screen. `overCapNote()` is the
// one owner of both the ruling and the words — `relevance.ts` counts the marked
// rows with the same predicate.
import { afterEach, describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { OrderCard } from "./OrderCard";
import { corpusNow, orderValue } from "../../lib/microPurchases/pricing";
import {
  EMPTY_CONTEXT,
  MICRO_PURCHASE_LIMIT,
  OVER_CAP_NOTE,
  overMicroCap,
  whyThisOrder,
} from "../../lib/microPurchases/relevance";
import { LIVE_AS_OF } from "../../lib/microPurchases/liveMapperOutput.fixture";
import { STRADDLING_ORDER } from "../../lib/microPurchases/priceClock.fixture";
import type { MicroOrder } from "../../lib/microPurchases/order";

afterEach(cleanup);

const NOW = corpusNow(LIVE_AS_OF);

/** A real mapped order, priced and inside the cap. */
const INSIDE_CAP: MicroOrder = STRADDLING_ORDER;

/** The same order, in a quantity that takes it past the cap. */
const OVER_CAP: MicroOrder = {
  ...INSIDE_CAP,
  quantity: Math.ceil(MICRO_PURCHASE_LIMIT / (INSIDE_CAP.lastPricePerUnit ?? 1)) + 1,
};

function cardText(o: MicroOrder): string {
  const { container } = render(
    <OrderCard
      order={o}
      why={whyThisOrder(o, EMPTY_CONTEXT)}
      seen={false}
      attested={null}
      now={NOW}
      onOpen={() => {}}
    />,
  );
  return container.textContent ?? "";
}

describe("the two populations this file rules over", () => {
  // At zero rows every assertion below passes while proving nothing.
  it("holds one order each side of the cap", () => {
    expect(overMicroCap(OVER_CAP, NOW)).toBe(true);
    expect(orderValue(OVER_CAP, NOW)).toBeGreaterThan(MICRO_PURCHASE_LIMIT);
    expect(overMicroCap(INSIDE_CAP, NOW)).toBe(false);
  });
});

describe("the card on an order over the micro-purchase cap", () => {
  it("shows the order and marks it", () => {
    const text = cardText(OVER_CAP);

    expect(text).toContain(OVER_CAP_NOTE);
    expect(text).toContain("Over the $15,000 limit");
  });

  it("gives her no instruction about the cap", () => {
    // The mark is a fact. What to do about a big order is the order page's,
    // and no board row may tell her she cannot bid it — DLA has not said so.
    const text = cardText(OVER_CAP);

    expect(text).not.toContain("Not open to you");
    expect(text).not.toMatch(/\bskip\b/i);
  });

  it("marks nothing inside the cap", () => {
    expect(cardText(INSIDE_CAP)).not.toContain("limit");
  });
});
