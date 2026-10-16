// @vitest-environment jsdom
//
// THE FOUR SURFACES THAT PRICE AN ORDER READ THE SERVED CORPUS'S DAY.
//
// What DLA last paid, and whether that price is still one we stand behind, is a
// fact about an ORDER. It takes the day the board was served for, like every
// other fact about the order — `src/lib/microPurchases/wallClock.ts` names the
// split and puts "how old its last award is" on this side of it.
//
// All four took `TODAY` instead, the SAMPLE corpus's frozen day, by way of a
// default in `pricing.ts`. A card reading its own clock is a second clock on
// one screen: the board would rule an order priceable and the card an inch
// below would refuse to price it, or worse, the card would stand behind a
// figure the ladder has withdrawn.
//
// Rendered rather than asserted as a string, because the rule is about what
// reaches the DOM — the same shape as `SendToDla.clock.test.tsx`.
import { afterEach, describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { AwardHistory } from "./AwardHistory";
import { OrderCard } from "./OrderCard";
import { SendToDla } from "./SendToDla";
import { SourcingPanel } from "./SourcingPanel";
import { corpusNow, orderValue, usd } from "../../lib/microPurchases/pricing";
import { LIVE_AS_OF } from "../../lib/microPurchases/liveMapperOutput.fixture";
import { STRADDLING_ORDER } from "../../lib/microPurchases/priceClock.fixture";
import { TODAY } from "../../lib/mock/microPurchaseOrders";
import type { MicroOrder } from "../../lib/microPurchases/order";

afterEach(cleanup);

/** The served corpus's day, through the one function that reads it. */
const CORPUS_DAY = corpusNow(LIVE_AS_OF);

/** What the card prints when it has a total it will stand behind. */
const MONEY = usd(orderValue(STRADDLING_ORDER, CORPUS_DAY) as number);

/** What the record block prints per unit, where the award is inside the window
 *  it draws its range from. A different string from the total above, because
 *  the order is for more than one unit. */
const UNIT_PRICE = usd(STRADDLING_ORDER.awards[0].unitCost as number);

function card(now: Date | null): HTMLElement {
  return render(
    <OrderCard
      order={STRADDLING_ORDER}
      why="Because you sell these."
      seen={false}
      attested={null}
      now={now}
      onOpen={() => {}}
    />,
  ).container;
}

describe("OrderCard", () => {
  it("prints the total on the corpus's day", () => {
    expect(card(CORPUS_DAY).textContent).toContain(MONEY);
  });

  it("prints the same total on the sample corpus's frozen day", () => {
    // The award is past 24 months of that day. Since 2026-09-15 an old award
    // still prices, so the card's figure does not depend on the day.
    const text = card(TODAY).textContent;

    expect(text).toContain(MONEY);
    expect(text).not.toContain("Price it yourself.");
  });

  it("keeps the refusal off the card the corpus's day can price", () => {
    expect(card(CORPUS_DAY).textContent).not.toContain("Price it yourself.");
  });
});

describe("AwardHistory", () => {
  it("draws its range from the window on the corpus's day", () => {
    const { container } = render(<AwardHistory order={STRADDLING_ORDER} now={CORPUS_DAY} />);

    expect(container.textContent).toContain(UNIT_PRICE);
    expect(container.textContent).not.toContain("too old to price from");
  });

  it("says the same record is more than two years old on the sample corpus's frozen day", () => {
    const { container } = render(<AwardHistory order={STRADDLING_ORDER} now={TODAY} />);

    expect(container.textContent).toContain("more than two years ago");
    expect(container.textContent).not.toContain("too old to price from");
  });
});

describe("SourcingPanel", () => {
  /** The reseller rule applies to a small-business set-aside, and only below
   *  the simplified acquisition threshold — so the panel needs a value to place
   *  the order against it. Set-aside is the one field added. */
  const SET_ASIDE: MicroOrder = { ...STRADDLING_ORDER, setAside: "SBA" };

  /** The first words of the rule, which is the whole point of the block. */
  const RULE = "If you buy this part to resell";

  it("states the rule on the corpus's day", () => {
    const { container } = render(<SourcingPanel order={SET_ASIDE} now={CORPUS_DAY} />);

    expect(container.textContent).toContain(RULE);
  });

  it("states it on the sample corpus's frozen day too, because an old award still prices", () => {
    const { container } = render(<SourcingPanel order={SET_ASIDE} now={TODAY} />);

    expect(container.textContent).toContain(RULE);
  });
});

describe("SendToDla", () => {
  it("tells her what to keep under, on the corpus's day", () => {
    const { container } = render(<SendToDla order={STRADDLING_ORDER} now={CORPUS_DAY} />);

    expect(container.textContent).toContain("Keep it under");
  });

  it("keeps the price on the sample corpus's frozen day, and says it is old", () => {
    // The block she types her quote from. An old award still gives the number,
    // and the block says the old price is only a guide.
    const { container } = render(<SendToDla order={STRADDLING_ORDER} now={TODAY} />);

    expect(container.textContent).toContain("Keep it under");
    expect(container.textContent).toContain("the old price is only a guide");
  });
});
