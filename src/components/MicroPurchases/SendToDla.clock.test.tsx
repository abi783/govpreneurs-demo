// @vitest-environment jsdom
//
// BOTH DATE DECISIONS ON THIS COMPONENT READ THE WALL CLOCK.
//
// Both read a record the MEMBER wrote — the day she asked us to wait, and the
// day she promised DLA a delivery. Neither is a fact about the order, so
// neither is measured against the corpus's day. The corpus's day trails the
// real day by however far the ingest is behind, and both decisions would
// arrive that late.
//
// The component takes the corpus's day as well, for the PRICE: what DLA last
// paid is a fact about the order. Every case below hands it the day these
// fixture orders are served for, so the price block reads the same day the
// board would and no case turns on it.
//
// `SendToDla` read the served corpus's `asOf` for both, which was right while
// the store stamped its records with the corpus's day too. The store reads the
// real day now (`src/lib/state/microPurchases.ts`), so a record written on one
// clock was being read on another.
//
// Every case below sets the real day away from the fixture's `TODAY` and moves
// it between the write and the render, which is what the corpus's day cannot
// do.
//
// Rendered rather than asserted as a string, because the rule is about what
// reaches the DOM — the same shape as `small-orders.$orderId.test.tsx`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SendToDla } from "./SendToDla";
import { MICRO_ORDERS, TODAY } from "../../lib/mock/microPurchaseOrders";
import type { MicroOrder } from "../../lib/microPurchases/order";
import { corpusNow } from "../../lib/microPurchases/pricing";
import { isoDay } from "../../lib/microPurchases/wallClock";
import {
  recordOutcome,
  recordQuote,
  recordQuotedPrice,
  recordStillWaiting,
  recordWin,
} from "../../lib/state/microPurchases";

const MS_PER_DAY = 24 * 3600 * 1000;

/** The bundled corpus's own day, which is the day these fixture orders are
 *  served for. Derived from `TODAY`, so no date is restated. */
const CORPUS_DAY = corpusNow(isoDay(TODAY.toISOString()));

/** How far the real day sits ahead of the served corpus's day. The measured gap
 *  was seven days; any gap works, because it is the DISAGREEMENT the cases
 *  rest on. Derived from `TODAY`, so no date is restated. */
const CORPUS_LAG_DAYS = 7;

const REAL_NOW = new Date(TODAY.getTime() + CORPUS_LAG_DAYS * MS_PER_DAY);

/** Move the real day to `days` after the day she acts. */
function realDayMovesTo(days: number): void {
  vi.setSystemTime(new Date(REAL_NOW.getTime() + days * MS_PER_DAY));
}

/** Move the real day to `days` after the CORPUS's day. The cases that separate
 *  the two clocks land between the two answers. */
function corpusDayReaches(days: number): void {
  vi.setSystemTime(new Date(TODAY.getTime() + days * MS_PER_DAY));
}

beforeEach(() => {
  // Only `Date`. The store debounces its writes on a real `setTimeout`, and
  // faking that as well would leave a pending write in every case.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(REAL_NOW);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/** A real corpus order under a test-local id, so each case owns its own quote
 *  in the module-scoped member store. */
function orderWith(id: string, fields: Partial<MicroOrder> = {}): MicroOrder {
  return { ...MICRO_ORDERS[0], id, ...fields };
}

/** A quote she has sent and priced. This is the state the snooze question is
 *  asked in. */
function quoted(o: MicroOrder): void {
  recordQuote(o.id, o.nsn, o.deliveryDays);
  recordQuotedPrice(o.id, 100);
}

describe("SendToDla — the snooze expires against the real day", () => {
  it("keeps the snooze while the real day is before it", () => {
    const o = orderWith("clock-snooze-running");
    quoted(o);
    recordStillWaiting(o.id);

    realDayMovesTo(1);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText(/We will ask you again on/)).toBeTruthy();
    expect(screen.queryByText("Did you win it?")).toBeNull();
  });

  it("lets the snooze expire once the real day passes it", () => {
    // THE ASSERTION THAT NAMES THE BUG. One tap on "Still waiting" removed her
    // only route to record a win, because the day it waited for could not
    // arrive. The real day arrives.
    const o = orderWith("clock-snooze-expired");
    quoted(o);
    recordStillWaiting(o.id);

    realDayMovesTo(15);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText("Did you win it?")).toBeTruthy();
    expect(screen.queryByText(/We will ask you again on/)).toBeNull();
  });

  it("counts the snooze from the day SHE tapped, not from the corpus's day", () => {
    // Eighteen days after the corpus's day is only eleven after hers, so a
    // snooze counted from the corpus's day has expired here and hers has not.
    // We promised her two weeks of quiet.
    const o = orderWith("clock-snooze-her-day");
    quoted(o);
    recordStillWaiting(o.id);

    corpusDayReaches(CORPUS_LAG_DAYS + 11);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText(/We will ask you again on/)).toBeTruthy();
    expect(screen.queryByText("Did you win it?")).toBeNull();
  });
});

describe("SendToDla — the delivery day is reached against the real day", () => {
  const DELIVERY_DAYS = 30;

  /** A win, ready for the delivery question. `recordWin` stamps `wonOn` with
   *  the real day, so the promised day is `DELIVERY_DAYS` after it. */
  function won(id: string): MicroOrder {
    const o = orderWith(id, { deliveryDays: DELIVERY_DAYS, quantity: 10 });
    quoted(o);
    recordOutcome(o.id, "won");
    recordWin(o, 1000);
    return o;
  }

  it("waits while the real day is before the day she promised", () => {
    const o = won("clock-due-waiting");

    realDayMovesTo(5);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText(/We will ask you on .* if you delivered it\./)).toBeTruthy();
    expect(screen.queryByText("Did you deliver it?")).toBeNull();
  });

  it("asks once the real day is past the day she promised", () => {
    const o = won("clock-due-passed");

    realDayMovesTo(DELIVERY_DAYS + 15);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText("Did you deliver it?")).toBeTruthy();
  });

  it("asks ON the day she promised, not the day after", () => {
    const o = won("clock-due-exact");

    realDayMovesTo(DELIVERY_DAYS);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText("Did you deliver it?")).toBeTruthy();
  });

  it("counts the delivery days from the day SHE won, not from the corpus's day", () => {
    // Thirty-four days after the corpus's day is only twenty-seven after hers.
    // She still has three days to deliver, and asking now says we think the day
    // has come when it has not.
    const o = won("clock-due-her-day");

    corpusDayReaches(CORPUS_LAG_DAYS + DELIVERY_DAYS - 3);
    render(<SendToDla order={o} now={CORPUS_DAY} />);

    expect(screen.getByText(/We will ask you on .* if you delivered it\./)).toBeTruthy();
    expect(screen.queryByText("Did you deliver it?")).toBeNull();
  });
});
