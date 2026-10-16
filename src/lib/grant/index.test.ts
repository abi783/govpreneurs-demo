import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { getGrantAnalysis } from "./index";
import type { Opportunity } from "../mock/opportunities";

// Minimal Opportunity stub — only the fields the Grant lib reads matter here.
function stubOpp(overrides: Partial<Opportunity>): Opportunity {
  return {
    noticeId: "STUB-0001",
    title: "Stub opportunity",
    agency: "USACE",
    workType: "Re-roofing",
    valueLow: 100_000,
    valueHigh: 200_000,
    location: "Fort Bragg, NC",
    closesAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    matchTier: "good",
    matchScore: 80,
    hunterReasoning: "A reasonable fit.",
    eligibility: "qualify",
    mode: "prime",
    scope: "fed",
    ...overrides,
  };
}

describe("getGrantAnalysis", () => {
  it("returns the hand-authored fixture for a known demo notice id", () => {
    const opp = stubOpp({ noticeId: "W912EE-26-R-0066" });
    const analysis = getGrantAnalysis(opp);

    expect(analysis.opportunityId).toBe("W912EE-26-R-0066");
    expect(["bid", "review", "no-bid"]).toContain(analysis.verdict.value);
    expect(analysis.verdict.value).toBe("bid");
    expect(analysis.complianceMatrix.length).toBeGreaterThan(0);
  });

  it("synthesizes a deterministic analysis for a non-fixture opportunity", () => {
    const opp = stubOpp({ noticeId: "NON-FIXTURE-0042", matchTier: "strong", eligibility: "qualify" });
    const analysis = getGrantAnalysis(opp);

    expect(analysis.opportunityId).toBe("NON-FIXTURE-0042");
    expect(["bid", "review", "no-bid"]).toContain(analysis.verdict.value);
    expect(analysis.verdict.value).toBe("bid");
    expect(analysis.complianceMatrix.length).toBeGreaterThan(0);
  });

  it("synthesizes a no-bid verdict for a closed-to-new opportunity", () => {
    const opp = stubOpp({ noticeId: "NON-FIXTURE-CLOSED", eligibility: "closed_to_new" });
    const analysis = getGrantAnalysis(opp);

    expect(analysis.verdict.value).toBe("no-bid");
  });

  it("caches the analysis by noticeId", () => {
    const opp = stubOpp({ noticeId: "NON-FIXTURE-CACHE" });
    const first = getGrantAnalysis(opp);
    const second = getGrantAnalysis(opp);
    expect(first).toBe(second);
  });
});

// ── The live seam must never fabricate ───────────────────────────────────────
//
// `loadGrantAnalysis` used to fall back to `synthesize` whenever the backend had
// no analysis — but synthesize is a FIXTURE generator. A member viewing an
// opportunity nothing had analyzed saw "I've read this one · 14 checks ·
// 5 sources", plus hardcoded SDVOSB / NC-license / NAICS-238160 eligibility
// inputs, next to a left panel saying we had no data on it. Only 5 locations in
// production had a match record for that opportunity; every other member hit
// this path.

vi.mock("../grantAnalysisApi", () => ({ fetchGrantAnalysis: vi.fn() }));

describe("loadGrantAnalysis — unanalyzed opportunities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadWithBackend(impl: () => Promise<unknown>) {
    const { fetchGrantAnalysis } = await import("../grantAnalysisApi");
    (fetchGrantAnalysis as unknown as Mock).mockImplementation(impl);
    const { loadGrantAnalysis } = await import("./index");
    return loadGrantAnalysis(stubOpp({ noticeId: "LIVE-NO-ANALYSIS" }), {
      grantV2: true,
      oppKey: "LIVE-NO-ANALYSIS",
    });
  }

  it("reports nothing analyzed when the backend has no analysis", async () => {
    const a = await loadWithBackend(() => Promise.resolve(null));
    expect(a.meta.stage).toBe("unanalyzed");
    expect(a.meta.checksRun).toBe(0);
    expect(a.meta.sourcesConsulted).toBe(0);
    expect(a.meta.analyzedAt).toBeNull();
  });

  it("does the same when the call fails, rather than inventing a take", async () => {
    const a = await loadWithBackend(() => Promise.reject(new Error("network")));
    expect(a.meta.stage).toBe("unanalyzed");
    expect(a.meta.checksRun).toBe(0);
  });

  it("never claims to have read the opportunity", async () => {
    const a = await loadWithBackend(() => Promise.resolve(null));
    const spoken = [
      ...a.rail.briefing.flat().map((s) => s.text),
      ...a.verdict.headline.flat().map((s) => s.text),
      ...a.verdict.gist.map((s) => s.text),
      ...a.meta.freshnessLine.map((s) => s.text),
    ].join(" ");
    expect(spoken).not.toMatch(/I've read this one/i);
    expect(spoken).not.toMatch(/Analyzed just now/i);
    expect(spoken).toMatch(/haven't analyzed this one yet/i);
  });

  it("asserts no firm credential it has not checked", async () => {
    const a = await loadWithBackend(() => Promise.resolve(null));
    // Empty means "not checked" — different from checked-and-absent, but either
    // way it must not name a certification or a state licence we never verified.
    expect(a.gateInputs.setAside.firmHolds).toEqual([]);
    expect(a.gateInputs.setAside.verified).toBe(false);
    expect(a.gateInputs.license.firmLicensedStates).toEqual([]);
    expect(a.gateInputs.sam.activeThrough).toBeNull();
    // And no borrowed NAICS: the notice's own, or nothing.
    expect(a.gateInputs.naics.code).toBe("");
  });

  it("carries the notice's own facts through, since those are real", async () => {
    const { fetchGrantAnalysis } = await import("../grantAnalysisApi");
    (fetchGrantAnalysis as unknown as Mock).mockResolvedValue(null);
    const { loadGrantAnalysis } = await import("./index");
    const opp = stubOpp({
      noticeId: "LIVE-2",
      setAside: "SDVOSB",
      naicsCode: "324121",
    });
    const a = await loadGrantAnalysis(opp, { grantV2: true, oppKey: "LIVE-2" });
    expect(a.gateInputs.setAside.required).toBe("SDVOSB");
    expect(a.gateInputs.naics.code).toBe("324121");
    expect(a.realDeadlineInputs.responseDue).toBe(opp.closesAt);
  });

  it("still returns the local take off the live path (mock/demo mode)", async () => {
    const { loadGrantAnalysis } = await import("./index");
    const a = await loadGrantAnalysis(stubOpp({ noticeId: "W912EE-26-R-0066" }));
    expect(a.meta.stage).not.toBe("unanalyzed");
  });
});
