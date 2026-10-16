// @vitest-environment jsdom
//
// THE CARD FOOT MAY NOT TELL HER TO QUOTE AN ORDER WE COULD NOT RULE ON (DH-36).
//
// DH-34 widened the board. An order carrying `ourGap()` — no acquisition code
// reached us, or a code reached us and we hold no ruling for it — is on the main
// list now, because hiding it stated OUR gap as DLA's restriction. The row
// carries `gapNote().card` in its why-line: "No acquisition code available at
// source."
//
// The card foot was written before that. On a fast-award order it printed
// "Quote today", and on an order with no closing date "No closing date. Quote
// today" — an imperative to act, an inch under a sentence saying we cannot tell
// who may sell the part. MEASURED on the live-mapper board, 10 September 2026:
// 12 rows, of which 8 carry a gap, and 3 of those 8 carried the chip.
//
// The stand-down is the one `sendable` already makes on the order page: the
// verdict decides whether an imperative may be printed, and `mayBid()` is the
// only owner of the verdict. Nothing here reads the acquisition codes.
//
// Rendered rather than asserted as strings, following `orderPrice.clock.test.tsx`
// beside it: the claim is about what reaches her screen.
import { afterEach, describe, expect, it } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { OrderCard } from "./OrderCard";
import {
  corpusNow,
  orderValue,
  priceAdvice,
  shortDate,
  usd,
} from "../../lib/microPurchases/pricing";
import { quantityLine } from "../../lib/microPurchases/units";
import {
  EMPTY_CONTEXT,
  NO_FILTERS,
  mayBid,
  ourGap,
  queryOrders,
  whyThisOrder,
} from "../../lib/microPurchases/relevance";
import { LIVE_AS_OF, LIVE_MAPPED_ORDERS } from "../../lib/microPurchases/liveMapperOutput.fixture";
import type { MicroOrder } from "../../lib/microPurchases/order";

afterEach(cleanup);

/** The instruction this feature exists to keep off a row we could not rule on. */
const IMPERATIVE = "Quote today";

/** The board a member with no profile at all sees, judged on the corpus's own
 *  day (D2, ONE CLOCK) — the same query `liveCorpus.board.test.ts` uses. */
const ROWS = queryOrders(
  { filters: NO_FILTERS, sort: "best" },
  EMPTY_CONTEXT,
  [...LIVE_MAPPED_ORDERS],
  LIVE_AS_OF,
).rows;

const GAP_ROWS = ROWS.filter((o) => ourGap(o) != null);
const RULED_ROWS = ROWS.filter((o) => mayBid(o));

/** What the whole card prints, through the props the board passes it. */
function cardText(o: MicroOrder): string {
  const { container } = render(
    <OrderCard
      order={o}
      why={whyThisOrder(o, EMPTY_CONTEXT)}
      seen={false}
      attested={null}
      now={corpusNow(LIVE_AS_OF)}
      onOpen={() => {}}
    />,
  );
  return container.textContent ?? "";
}

/** The first row of a population, named so a missing one reads as a corpus
 *  problem rather than as `undefined` reaching the renderer. */
function pick(rows: readonly MicroOrder[], what: string): MicroOrder {
  const first = rows[0];
  if (first == null) throw new Error(`The live-mapper board carries no ${what}.`);
  return first;
}

describe("the live-mapper board still has both populations on it", () => {
  // Every assertion below is over one of these. At zero they all pass while
  // proving nothing, which is the shape a widened `mayBid()` would produce.
  it("carries rows we could not rule on, including fast-award ones", () => {
    expect(GAP_ROWS.length).toBeGreaterThan(0);
    expect(GAP_ROWS.filter((o) => o.fastAward).length).toBeGreaterThan(0);
  });

  it("carries rows we ruled she may bid, including a fast-award one", () => {
    expect(RULED_ROWS.length).toBeGreaterThan(0);
    expect(RULED_ROWS.filter((o) => o.fastAward).length).toBeGreaterThan(0);
  });
});

describe("the card foot on an order we could not rule on", () => {
  it("tells her to quote none of them", () => {
    for (const o of GAP_ROWS) {
      expect(cardText(o)).not.toContain(IMPERATIVE);
      cleanup();
    }
  });

  it("states the fast-award fact and drops the instruction", () => {
    // The fact survives, because the fact is true: on a fast-award order the
    // listed closing date is not the deadline. It is the same sentence the
    // order page's key facts print. NO GATE COMPARES THE TWO STRINGS — no spec
    // in this repo reads both files — so keep them together by hand.
    const text = cardText(
      pick(
        GAP_ROWS.filter((o) => o.fastAward),
        "fast-award row we could not rule on",
      ),
    );

    expect(text).toContain("DLA can buy at any time.");
    expect(text).not.toContain(IMPERATIVE);
  });

  it("keeps a real closing date, because a real deadline is still hers to meet", () => {
    const row = pick(
      GAP_ROWS.filter((o) => o.closesOn != null && !o.fastAward),
      "dated row we could not rule on",
    );

    expect(cardText(row)).toContain(`Closes ${shortDate(row.closesOn as string)}`);
  });

  it("names a missing closing date without turning it into an instruction", () => {
    // Zero rows on today's live board reach this branch, so the case is built
    // from a real gap row rather than measured. The acquisition codes are
    // untouched, so `ourGap()` answers the same for it.
    const row: MicroOrder = {
      ...pick(GAP_ROWS, "row we could not rule on"),
      closesOn: null,
      fastAward: false,
    };
    expect(ourGap(row)).not.toBeNull();
    const text = cardText(row);

    expect(text).toContain("No closing date.");
    expect(text).not.toContain(IMPERATIVE);
  });
});

describe("the card foot on an order we ruled she may bid", () => {
  // THE STAND-DOWN IS NOT ALLOWED TO BE WIDER THAN THE GAP. A foot that went
  // quiet on every row would pass every assertion above it and lose the four
  // rows the board is for.
  it("still tells her to quote a fast-award one", () => {
    const text = cardText(
      pick(
        RULED_ROWS.filter((o) => o.fastAward),
        "fast-award row we ruled she may bid",
      ),
    );

    expect(text).toContain(IMPERATIVE);
  });

  it("still treats a missing closing date as urgent", () => {
    const row: MicroOrder = {
      ...pick(RULED_ROWS, "row we ruled she may bid"),
      closesOn: null,
      fastAward: false,
    };
    expect(mayBid(row)).toBe(true);

    expect(cardText(row)).toContain(`No closing date. ${IMPERATIVE}`);
  });
});

// ── AND EVERY FACT ON THE ROW SURVIVES THE STAND-DOWN ─────────────────────
//
// Owner, 16 September 2026: "display all info regardless of the acquisition
// code." The order page used to hold its whole record back; the card never did,
// and these cases are what keeps it that way. The stand-down above is about ONE
// imperative. Widening it to the count, the delivery days, the money or the
// closing date would state our gap as a missing fact about the order.
//
// The who-can-bid line is the one cell that changes, and it changes because it
// IS the verdict — `bidCell.test.tsx` owns that sentence.
describe("the card's facts on an order we could not rule on", () => {
  it("prints the same fact cells as a row we ruled she may bid", () => {
    const gapRow = pick(
      GAP_ROWS.filter((o) => o.deliveryDays != null),
      "row we could not rule on that carries delivery days",
    );

    const text = cardText(gapRow);

    // How many, and in the words `units.ts` owns.
    expect(text).toContain(quantityLine(gapRow.quantity, gapRow.unitOfIssue));
    // How long she has to deliver.
    expect(text).toContain(`Deliver within ${gapRow.deliveryDays} days`);
    // Who is buying.
    expect(text).toContain(gapRow.buyer);
    // What it is worth, or the honest refusal to say. `Figure` cannot print a
    // number without a caption, so both arms put words on the row.
    const worth = orderValue(gapRow, corpusNow(LIVE_AS_OF));
    expect(text).toContain(
      worth == null ? priceAdvice(gapRow, corpusNow(LIVE_AS_OF)).headline : usd(worth),
    );
  });

  it("never goes quiet about the closing date", () => {
    // The instruction goes; the timing fact does not. Every row says one of the
    // three things there is to say about when this one closes.
    for (const o of GAP_ROWS) {
      const text = cardText(o);
      const closing = o.fastAward
        ? "DLA can buy at any time."
        : o.closesOn == null
          ? "No closing date."
          : `Closes ${shortDate(o.closesOn)}`;

      expect(text).toContain(closing);
      cleanup();
    }
  });
});
