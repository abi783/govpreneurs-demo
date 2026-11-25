import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collapseAwardMoney,
  fetchAwardFacets,
  fetchAwards,
  hasSubcontractingPlan,
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
    const result = collapseAwardMoney({
      obligated: 4_200_000,
      currentValue: 4_200_000,
      ceiling: 4_200_000,
    });
    expect(result).toEqual({ figure: 4_200_000, explainNoGrowth: true });
  });

  it("stays uncollapsed (null) when the present figures differ", () => {
    expect(
      collapseAwardMoney({ obligated: 1_000_000, currentValue: null, ceiling: 2_000_000 }),
    ).toBeNull();
  });

  it("collapses a single present figure but makes no no-growth claim", () => {
    const result = collapseAwardMoney({ obligated: 500_000, currentValue: null, ceiling: null });
    expect(result).toEqual({ figure: 500_000, explainNoGrowth: false });
  });

  it("treats 0/null as absent, same as usd()", () => {
    const result = collapseAwardMoney({
      obligated: 1_000_000,
      currentValue: 0,
      ceiling: 1_000_000,
    });
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

describe("Awards API wiring (filters, facets, new fields)", () => {
  afterEach(() => vi.unstubAllGlobals());

  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("GETs /awards/facets for the filter pick lists", async () => {
    const facets = {
      naics: [{ id: "238220", label: "Plumbing", count: 4 }],
      psc: [],
      agencies: [],
      pricing: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(ok(facets));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchAwardFacets()).toEqual(facets);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/awards/facets");
  });

  it("throws when the facets call fails, so the panel can fall back", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    await expect(fetchAwardFacets()).rejects.toThrow();
  });

  it("POSTs the new filter fields to /awards and passes matchedBecause and total through", async () => {
    const result = { awards: [], matchedBecause: { a1: "Type of work: plumbing" }, total: 42 };
    const fetchMock = vi.fn().mockResolvedValue(ok(result));
    vi.stubGlobal("fetch", fetchMock);
    const out = await fetchAwards({
      q: "plumber",
      panel: { naicsCodes: ["238220"], competed: "yes" },
    } as never);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/awards$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ q: "plumber" });
    expect(out.matchedBecause).toEqual({ a1: "Type of work: plumbing" });
    expect(out.total).toBe(42);
  });

  it("reads a subcontracting plan from the record's words, never by the word 'not'", () => {
    expect(hasSubcontractingPlan("Individual Subcontract Plan")).toBe(true);
    expect(hasSubcontractingPlan("Plan Required (Incentive Not Included)")).toBe(true);
    expect(hasSubcontractingPlan("Plan Not Required")).toBe(false);
    expect(hasSubcontractingPlan(null)).toBe(false);
  });
});
