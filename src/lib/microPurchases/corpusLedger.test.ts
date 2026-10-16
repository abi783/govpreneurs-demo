// THE LEDGER COUNTS THE DAY, NOT THE PAGE.
//
// REPORTED TWICE BY THE MEMBER: "these counts are STILL broken." The board
// pages at 50, so every figure taken from `MicroResult` describes the rows the
// browser holds — and Hunter said "I looked at 50 orders today" over a corpus
// of 13,418.
//
// The server now counts the corpus by the fields a ruling reads, and
// `corpusLedger()` does the ruling here, through the SAME predicates the board
// and the order page use. These cases pin two things:
//
//   1. each census row lands in exactly ONE bucket, so the parts can be summed
//      against the total without counting an order twice;
//   2. the two lines the census CANNOT answer stay page-scoped and are not
//      quietly presented as corpus figures.
import { describe, expect, it } from "vitest";
import { corpusLedger, heldBackFromCorpus, type CensusRow, type MicroResult } from "./relevance";

const OPEN = "Open";

function row(over: Partial<CensusRow>): CensusRow {
  return { amc: null, amsc: null, hasPsc: true, dibbsStatus: OPEN, orders: 1, ...over };
}

/** Only the two page-scoped fields matter to `heldBackFromCorpus`. */
function pageResult(over: Partial<MicroResult>): MicroResult {
  return { ...({} as MicroResult), overCap: 0, filteredOut: 0, ...over };
}

describe("corpusLedger", () => {
  it("counts an order with no code as one we could not rule on", () => {
    const led = corpusLedger([row({ amc: null, amsc: null, orders: 40 })], 40);

    expect(led.unruled).toBe(40);
    expect(led.restricted).toBe(0);
  });

  it("counts a restricted pair as permission she does not have", () => {
    // 3D — DLA cannot add new sellers. The verdict this surface exists to give.
    const led = corpusLedger([row({ amc: "3", amsc: "D", orders: 12 })], 12);

    expect(led.restricted).toBe(12);
    expect(led.unruled).toBe(0);
  });

  it("does not hold back a biddable pair at all", () => {
    // 1G — the pair the whole board is looking for.
    const led = corpusLedger([row({ amc: "1", amsc: "G", orders: 9 })], 9);

    expect(led.restricted).toBe(0);
    expect(led.unruled).toBe(0);
    expect(led.uncategorised).toBe(0);
    expect(led.notTakingPrices).toBe(0);
  });

  it("counts a missing product-service code as not saying what the part is", () => {
    const led = corpusLedger([row({ amc: "1", amsc: "G", hasPsc: false, orders: 7 })], 7);

    expect(led.uncategorised).toBe(7);
  });

  it("counts a status that is not open, and an absent status, as different facts", () => {
    const led = corpusLedger(
      [
        row({ amc: "1", amsc: "G", dibbsStatus: "Awarded", orders: 5 }),
        row({ amc: "1", amsc: "G", dibbsStatus: null, orders: 3 }),
      ],
      8,
    );

    expect(led.notTakingPrices).toBe(5);
    expect(led.statusUnknown).toBe(3);
  });

  /**
   * THE CASE THAT MAKES THE LEDGER ADD UP. An order counted under two reasons
   * would make the held-back figures sum past the corpus, and the one question
   * this block answers is "am I seeing everything?".
   */
  it("puts every order in exactly one bucket", () => {
    const rows = [
      row({ amc: null, amsc: null, orders: 100 }),
      row({ amc: "3", amsc: "D", orders: 50 }),
      row({ amc: "1", amsc: "G", hasPsc: false, orders: 25 }),
      row({ amc: "1", amsc: "G", dibbsStatus: "Cancelled", orders: 10 }),
      row({ amc: "1", amsc: "G", dibbsStatus: null, orders: 5 }),
      row({ amc: "1", amsc: "G", orders: 60 }), // biddable, held back by nothing
    ];
    const led = corpusLedger(rows, 250);

    const heldBack =
      led.restricted + led.unruled + led.uncategorised + led.notTakingPrices + led.statusUnknown;
    expect(heldBack).toBe(190);
    expect(led.total).toBe(250);
    // The 60 biddable orders are the ones she was shown.
    expect(led.total - heldBack).toBe(60);
  });
});

describe("heldBackFromCorpus", () => {
  it("states the code reasons from the corpus", () => {
    const led = corpusLedger([row({ amc: "3", amsc: "D", orders: 1212 })], 13418);

    const lines = heldBackFromCorpus(led, pageResult({}));

    expect(lines).toContain("1212 need permission you do not have");
  });

  /**
   * THE HONEST HALF. The census knows nothing of her filters, so that line
   * still counts the page. It must keep counting the page rather than be
   * dropped or dressed up as a corpus figure.
   *
   * THE PRICE LINE IS GONE (owner, 2026-09-16). An order over the $15,000 cap
   * is SHOWN, with a mark on its row, so a ledger claiming we held it back
   * would be false about a card she is looking at. `MicroResult.overCap` now
   * counts the marked rows.
   */
  it("keeps the filter line on the page's own number, and claims no price hold-back", () => {
    const led = corpusLedger([row({ amc: "1", amsc: "G", orders: 13418 })], 13418);

    const lines = heldBackFromCorpus(led, pageResult({ overCap: 1, filteredOut: 4 }));

    expect(lines).toContain("4 do not match what you chose");
    expect(lines.some((l) => l.includes("$15,000"))).toBe(false);
  });

  it("says nothing for a reason that held nothing back", () => {
    const led = corpusLedger([row({ amc: "1", amsc: "G", orders: 10 })], 10);

    expect(heldBackFromCorpus(led, pageResult({}))).toEqual([]);
  });
});
