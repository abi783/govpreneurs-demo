import { describe, expect, it } from "vitest";
import {
  collapseAwardMoney,
  competitionSummary,
  isSoleSource,
  usd,
  whatHappensNext,
  type AwardRecord,
} from "./awardsApi";

const award = (over: Partial<AwardRecord> = {}): AwardRecord =>
  ({
    awardId: "a1",
    title: "Roof Replacement",
    solicitationId: null,
    winner: { name: "Acme", uei: null, awardeeKey: null, parentUei: null },
    agency: { name: "GSA", abbrev: null, isDefense: false },
    obligated: null,
    currentValue: null,
    ceiling: null,
    recency: {
      awardedAt: null,
      daysSinceAward: null,
      justAwarded: null,
      comingUpAgain: false,
      recompeteAt: null,
      reportingLagNote: "",
    },
    location: { city: null, state: null },
    naicsCode: null,
    workType: null,
    pscCode: null,
    offersReceived: null,
    extentCompeted: null,
    setAside: null,
    subcontractingPlan: null,
    bench: null,
    sourceUrl: null,
    ...over,
  }) as AwardRecord;

describe("usd — item 14", () => {
  it("rounds and groups sub-$1,000 values instead of showing raw cents", () => {
    expect(usd(689.34)).toBe("$689");
    expect(usd(186.9)).toBe("$187");
  });

  it("formats negatives with a leading minus, same magnitude rules", () => {
    expect(usd(-2_164_826)).toBe("−$2.2M");
    expect(usd(-500)).toBe("−$500");
  });

  it("treats 0 like null — a placeholder, not a real amount", () => {
    expect(usd(0)).toBe("—");
    expect(usd(null)).toBe("—");
  });
});

describe("collapseAwardMoney", () => {
  it("collapses to one figure and explains no-growth when obligated equals ceiling", () => {
    const result = collapseAwardMoney({ obligated: 4_200_000, currentValue: 4_200_000, ceiling: 4_200_000 });
    expect(result).toEqual({ figure: 4_200_000, explainNoGrowth: true });
  });

  it("stays uncollapsed (null) when the present figures differ", () => {
    expect(collapseAwardMoney({ obligated: 1_000_000, currentValue: null, ceiling: 2_000_000 })).toBeNull();
  });

  it("collapses a single present figure but makes no no-growth claim", () => {
    const result = collapseAwardMoney({ obligated: 500_000, currentValue: null, ceiling: null });
    expect(result).toEqual({ figure: 500_000, explainNoGrowth: false });
  });

  it("treats 0/null as absent, same as usd()", () => {
    const result = collapseAwardMoney({ obligated: 1_000_000, currentValue: 0, ceiling: 1_000_000 });
    expect(result).toEqual({ figure: 1_000_000, explainNoGrowth: true });
  });

  it("is null when nothing is present", () => {
    expect(collapseAwardMoney({ obligated: null, currentValue: 0, ceiling: null })).toBeNull();
  });
});

describe("isSoleSource / competitionSummary — fix #5", () => {
  it("flags the FPDS 'not competed' family, case-insensitively", () => {
    expect(isSoleSource("Not Competed")).toBe(true);
    expect(isSoleSource("Not Competed under SAP")).toBe(true);
    expect(isSoleSource("Not Available for Competition")).toBe(true);
    expect(isSoleSource("NOT COMPETED")).toBe(true);
  });

  it("does not flag genuinely competitive extent-competed values", () => {
    expect(isSoleSource("Full and Open Competition")).toBe(false);
    expect(isSoleSource("Full And Open Competition After Exclusion Of Sources")).toBe(false);
    expect(isSoleSource("Follow On to Competed Action")).toBe(false);
  });

  it("asserts nothing when extentCompeted is unknown", () => {
    expect(isSoleSource(null)).toBe(false);
  });

  it("a single-bid SOLE-SOURCE award does not read as 'not heavily contested'", () => {
    // THE BUG: offersReceived <= 3 used to render "small field, not heavily
    // contested" regardless of extentCompeted — the opposite of the truth for a
    // sole-source award, which was never open to competition at all.
    const summary = competitionSummary({ offersReceived: 1, extentCompeted: "Not Competed" });
    expect(summary).not.toContain("not heavily contested");
    expect(summary).toContain("not put out for open competition");
  });

  it("a genuinely small competitive field still reads as a small field", () => {
    const summary = competitionSummary({
      offersReceived: 2,
      extentCompeted: "Full and Open Competition",
    });
    expect(summary).toContain("small field");
  });

  it("a crowded competitive field is unchanged", () => {
    const summary = competitionSummary({
      offersReceived: 10,
      extentCompeted: "Full and Open Competition",
    });
    expect(summary).toContain("crowded field");
  });

  it("asserts neither small nor crowded when extentCompeted is unknown", () => {
    expect(competitionSummary({ offersReceived: 1, extentCompeted: null })).toBeNull();
  });
});

describe("whatHappensNext — fix #6, defense reporting lag", () => {
  it('says "just won" for a non-defense award under 30 days old', () => {
    const a = award({ recency: { ...award().recency, daysSinceAward: 10 } });
    expect(whatHappensNext(a)).toBe(
      "This was just won. Give them a few weeks to get set up, then reach out.",
    );
  });

  it('does NOT assert "just won" for a defense award under 30 days old — the date may be lagged ~90 days', () => {
    const a = award({
      agency: { name: "Naval Facilities Engineering Command", abbrev: "NAVFAC", isDefense: true },
      recency: { ...award().recency, daysSinceAward: 10 },
    });
    expect(whatHappensNext(a)).not.toContain("just won");
    expect(whatHappensNext(a)).toContain("Reach out and ask who is already on the team");
  });
});
