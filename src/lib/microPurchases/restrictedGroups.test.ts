// The reason groups on "Ones not open to you" come from the whole board's code
// census, ruled on by the same predicates the board uses.
import { describe, expect, it } from "vitest";
import { biddablePairsFromCensus, reasonGroupsFromCensus } from "./restrictedGroups";
import type { CensusRow } from "./relevance";

function row(amc: string | null, amsc: string | null, orders: number, hasPsc = true): CensusRow {
  return { amc, amsc, hasPsc, dibbsStatus: "Open", orders };
}

describe("reasonGroupsFromCensus", () => {
  it("groups restricted pairs by reason and adds up their orders across the board", () => {
    const groups = reasonGroupsFromCensus([
      row("1", "C", 120),
      row("3", "C", 30),
      row("3", "D", 40),
    ]);

    const approved = groups.find((g) => g.pairs.includes("1C"));
    expect(approved?.pairs).toEqual(["1C", "3C"]);
    expect(approved?.estimate).toBe(150);
    expect(groups.find((g) => g.pairs.includes("3D"))?.estimate).toBe(40);
  });

  it("leaves out pairs a newcomer may bid, unread codes and orders with no product code", () => {
    const groups = reasonGroupsFromCensus([
      row("1", "G", 500), // open to any seller
      row(null, null, 900), // no code reached the record
      row("1", "C", 7, false), // no product code: held apart, not grouped
    ]);

    expect(groups).toEqual([]);
  });

  it("puts the group a form can fix first", () => {
    const groups = reasonGroupsFromCensus([row("3", "D", 40), row("1", "C", 5)]);

    expect(groups[0]?.route).toBe("sar");
  });

  it("builds the qualified-list group off the census, with both of T's pairs", () => {
    // 2-201.2(t) allows AMC 1 and 2 and nothing else, so `1T` and `2T` are the
    // whole tier and they share one reason.
    const groups = reasonGroupsFromCensus([row("1", "T", 476), row("2", "T", 6)]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.pairs).toEqual(["1T", "2T"]);
    expect(groups[0]?.estimate).toBe(482);
    expect(groups[0]?.route).toBe("qpl");
    expect(groups[0]?.fixable).toBe(false);
    expect(groups[0]?.head).toBe("Only sellers on DLA's qualified list can quote this one.");
  });

  it("keeps the qualified-list group apart from the two tiers it sits between", () => {
    // Three rulings, three groups: a form (C), a qualified products list (T),
    // and no route named at all (Q). One group here would be the S/V/Y mistake.
    const groups = reasonGroupsFromCensus([row("1", "C", 5), row("1", "T", 7), row("1", "Q", 9)]);

    expect(groups.map((g) => g.route)).toEqual(["sar", "qpl", "approved"]);
    expect(new Set(groups.map((g) => g.body)).size).toBe(3);
  });
});

describe("biddablePairsFromCensus", () => {
  it("keeps only the pairs a newcomer may bid, once each and sorted", () => {
    const pairs = biddablePairsFromCensus([
      row("2", "Z", 3),
      row("1", "G", 500),
      row("1", "G", 12, false), // the same pair with no product code
      row("1", "Z", 40),
      row("2", "G", 9),
    ]);

    expect(pairs).toEqual(["1G", "1Z", "2G", "2Z"]);
  });

  it("never sends a pair DLA refuses, a code with no ruling, or a code that never arrived", () => {
    const pairs = biddablePairsFromCensus([
      row("1", "C", 120), // a Source Approval Request first
      row("3", "D", 40), // no route for a newcomer
      row("1", "T", 140), // a qualified products list, so DLA refuses a newcomer
      row("1", "L", 12), // read, but no ruling held
      row("0", "0", 211), // DLA assigned no code
      row(null, null, 8177), // no record joined
      row("1", null, 5), // half a code
      row(" 1", "g ", 4), // readable after trimming, so it counts
    ]);

    expect(pairs).toEqual(["1G"]);
  });
});
