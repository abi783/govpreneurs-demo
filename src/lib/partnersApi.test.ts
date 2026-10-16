import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PIPELINE_STAGES,
  STAGE_LABEL,
  STAGE_TERM,
  suppressPartner,
  unsuppressPartner,
  whereTheyWork,
  type PrimeCandidate,
} from "./partnersApi";

/** Minimal geography-only fixture — whereTheyWork only reads `p.geography`. */
function withGeography(geography: Partial<PrimeCandidate["geography"]>): PrimeCandidate {
  return {
    geography: {
      inStateAwardShare: null,
      statesPerformed: [],
      topCitiesByCount: [],
      hqState: null,
      ...geography,
    },
  } as PrimeCandidate;
}

describe("pipeline stages", () => {
  it("has Ernie's eight, in order", () => {
    expect(PIPELINE_STAGES).toEqual([
      "saved",
      "researching",
      "contacted",
      "following_up",
      "on_their_bench",
      "teaming",
      "active_partner",
      "worked_together",
    ]);
  });

  it("has a plain-English label for every stage", () => {
    for (const stage of PIPELINE_STAGES) {
      expect(STAGE_LABEL[stage]).toBeTruthy();
    }
  });

  it("only carries a secondary term for the two jargon stages", () => {
    expect(STAGE_TERM.on_their_bench).toBe("Qualified");
    expect(STAGE_TERM.worked_together).toBe("Past performance");
    expect(Object.keys(STAGE_TERM)).toHaveLength(2);
  });

  it("has Ernie's exact plain-English labels", () => {
    expect(STAGE_LABEL).toEqual({
      saved: "Saved",
      researching: "Researching",
      contacted: "Contacted",
      following_up: "Follow-up",
      on_their_bench: "On their vendor list",
      teaming: "Teaming discussion",
      active_partner: "Working together",
      worked_together: "Finished a job for them",
    });
  });
});

describe("whereTheyWork — Karthik feedback, real places instead of vague 'near you'", () => {
  it("says nothing known when there is no geography at all", () => {
    expect(whereTheyWork(withGeography({}))).toBe("We do not know where they work.");
  });

  it("names the state in full, not the code, when no city rollup exists yet", () => {
    // The common case today — a rebuild is mid-flight, so most rows have no
    // citiesByCount — and it must degrade to states-only, not to nothing.
    const p = withGeography({
      statesPerformed: ["CA"],
      topCitiesByCount: [],
      inStateAwardShare: null,
    });
    expect(whereTheyWork(p)).toBe("They work in California.");
  });

  it("names the actual city, title-cased, when a city rollup exists", () => {
    const p = withGeography({
      statesPerformed: ["MI"],
      topCitiesByCount: [{ city: "ANN ARBOR", count: 4 }],
      inStateAwardShare: null,
    });
    expect(whereTheyWork(p)).toBe("Their most common job site is Ann Arbor.");
  });

  it("leads with the overlap when a good share of their work is in the member's state", () => {
    const p = withGeography({
      statesPerformed: ["MI", "OH"],
      topCitiesByCount: [{ city: "ANN ARBOR", count: 4 }],
      inStateAwardShare: 0.5,
    });
    expect(whereTheyWork(p)).toBe(
      "A good share of their jobs are near you, including in Ann Arbor.",
    );
  });

  it("names the place plainly, with no count claim, when a count is present but low", () => {
    const p = withGeography({
      statesPerformed: ["MI"],
      topCitiesByCount: [{ city: "DETROIT", count: 1 }],
      inStateAwardShare: 0.1,
    });
    expect(whereTheyWork(p)).toBe(
      "Some of their jobs are near you. Their most common job site is Detroit.",
    );
  });

  it("names almost-all-in-one-place with the city and the full state name together", () => {
    const p = withGeography({
      statesPerformed: ["TX"],
      topCitiesByCount: [{ city: "AUSTIN", count: 20 }],
      inStateAwardShare: 0.9,
    });
    expect(whereTheyWork(p)).toBe("Almost all their work is in Austin and nearby, in Texas.");
  });
});

describe('suppress / unsuppress — D11 "not right for me"', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the awardeeKey to /partners/suppress", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await suppressPartner(123);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/partners/suppress");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ awardeeKey: 123 });
  });

  it("DELETEs /partners/suppress/:awardeeKey", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await unsuppressPartner(123);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/partners/suppress/123");
    expect(init.method).toBe("DELETE");
  });

  it("throws on a failed suppress", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 500 })),
    );
    await expect(suppressPartner(123)).rejects.toThrow();
  });
});
