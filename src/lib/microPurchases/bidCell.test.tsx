// The order page's "Can you bid this one?" cell. It showed a green "You can bid
// this one" on an order with no acquisition code, directly above Hunter's "Not
// clear if you can bid this one." These cases hold the four answers apart.
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { OrderCard } from "../../components/MicroPurchases/OrderCard";
import { bidCell, ourGap } from "./relevance";
import { LIVE_MAPPED_ORDERS } from "./liveMapperOutput.fixture";
import type { MicroOrder } from "./order";

function order(
  amc: string | null,
  amsc: string | null,
  setAside: string | null = null,
): MicroOrder {
  return { ...LIVE_MAPPED_ORDERS[0], amc, amsc, setAside };
}

describe("the bid cell", () => {
  it("says not clear, with no tick, when the acquisition code never reached the record", () => {
    const o = order(null, null);

    expect(ourGap(o)).toBe("unread");
    expect(bidCell(o)).toEqual({ verdict: "Not clear from DLA's codes", openToHer: false });
  });

  it("says not clear, not 'not open', when the code has no ruling", () => {
    // `1L` since the qualified-list tier ruled `1T`. 2-201.2(l) is the
    // below-threshold screening code, and no sentence on this surface resolves
    // it into a verdict.
    const o = order("1", "L");

    expect(ourGap(o)).toBe("unruled");
    expect(bidCell(o)).toEqual({ verdict: "Not clear from DLA's codes", openToHer: false });
  });

  it("says not open to you when DLA's code refuses a newcomer", () => {
    expect(bidCell(order("1", "C"))).toEqual({ verdict: "Not open to you", openToHer: false });
  });

  it("names the approved sellers, with no tick, on the limited-competition tier", () => {
    // 2-201.2(g) names Q as a code that "may imply limited competition when two
    // or more independent sources exist", and 2-201.2(q) allows AMCs 1 or 2
    // where at least two sources exist. DLA is competing the order among the
    // sellers it already has.
    for (const amc of ["1", "2"]) {
      const o = order(amc, "Q");

      // It is a RULING, so it is not one of our gaps and not "not clear".
      expect(ourGap(o)).toBeNull();
      expect(bidCell(o)).toEqual({ verdict: "Approved sellers only", openToHer: false });
    }
  });

  it("names the qualified list, with no tick, on the QPL tier", () => {
    // 2-201.2(t): "Competition for this part is limited to sources which are
    // listed on or are qualified for listing on the QPL at the time of award".
    // A ruling, so it is not one of our gaps and not "not clear".
    for (const amc of ["1", "2"]) {
      const o = order(amc, "T");

      expect(ourGap(o)).toBeNull();
      expect(bidCell(o)).toEqual({ verdict: "Qualified sellers only", openToHer: false });
    }
  });

  it("keeps the two limited-competition verdicts apart in the cell", () => {
    // Q and T are both limited competition and they are not the same fact: Q
    // names no route and T names a qualified products list. A member meeting
    // both must be able to tell them apart in one short cell.
    expect(bidCell(order("1", "T")).verdict).not.toBe(bidCell(order("1", "Q")).verdict);
  });

  it("NEVER ticks green on the QPL tier, whatever the set-aside says", () => {
    // Nothing here holds the member's CAGE code, so nothing can say she is on
    // DLA's qualified list. A set-aside must not turn that into a yes either.
    for (const setAside of [null, "SBA", "WOSB", "SOMETHING-WE-DO-NOT-KNOW"]) {
      for (const amc of ["1", "2"]) {
        const cell = bidCell(order(amc, "T", setAside));

        expect(cell.openToHer).toBe(false);
        expect(cell.verdict).not.toBe("You can bid this one");
        expect(cell.verdict).toBe("Qualified sellers only");
      }
    }
  });

  it("NEVER ticks green on the approved-sellers tier, whatever the set-aside says", () => {
    // `openToHer` is the one field that draws a green tick, and it must stay
    // false here: no profile on this surface holds the member's CAGE code, so
    // nothing can say she is one of the approved sellers. Sweep the set-aside
    // shapes too — a set-aside must not be able to turn a refusal into a yes.
    for (const setAside of [null, "SBA", "WOSB", "SOMETHING-WE-DO-NOT-KNOW"]) {
      const cell = bidCell(order("1", "Q", setAside));

      expect(cell.openToHer).toBe(false);
      expect(cell.verdict).not.toBe("You can bid this one");
      expect(cell.verdict).toBe("Approved sellers only");
    }
  });

  it("ticks green only when the code lets a newcomer quote and nothing is set aside", () => {
    expect(bidCell(order("1", "G"))).toEqual({ verdict: "You can bid this one", openToHer: true });
  });

  it("names the set-aside, with no tick, when the code is open but the order is set aside", () => {
    const cell = bidCell(order("1", "G", "SBA"));

    expect(cell.openToHer).toBe(false);
    expect(cell.verdict).not.toBe("You can bid this one");
    expect(cell.hint).toContain("set-aside");
  });
});

describe("the board card's who-can-bid line", () => {
  function cardText(o: MicroOrder): string {
    return (
      render(
        <OrderCard order={o} why="" seen={false} attested={null} now={null} onOpen={() => {}} />,
      ).container.textContent ?? ""
    );
  }

  it("never says anyone can bid on an order whose code is missing", () => {
    const text = cardText(order(null, null));

    expect(text).toContain("Not clear who can bid");
    expect(text).not.toContain("Anyone can bid");
  });

  it("still says anyone can bid when the code is open and nothing is set aside", () => {
    expect(cardText(order("1", "G"))).toContain("Anyone can bid");
  });

  it("never says anyone can bid on an order DLA's codes refuse", () => {
    // The line read `ourGap(o) != null ? … : setAside == null ? "Anyone can
    // bid"`, so every ruled refusal with no set-aside said the opposite of the
    // verdict its own order page prints. A saved order is where she meets this
    // card outside the board's own permission split.
    for (const [amc, amsc] of [
      ["1", "C"],
      ["1", "B"],
      ["3", "Z"],
      ["1", "Q"],
    ]) {
      expect(cardText(order(amc, amsc))).not.toContain("Anyone can bid");
    }
    expect(cardText(order("1", "Q"))).toContain("Approved sellers only");
  });
});
