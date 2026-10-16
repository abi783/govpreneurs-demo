import { describe, it, expect } from "vitest";
import { US_STATE_NEIGHBORS } from "./usStateNeighbors";
import { STATES } from "./vocab/usStates";

describe("US_STATE_NEIGHBORS", () => {
  it("is symmetric: every neighbor relation is reciprocated", () => {
    for (const [state, neighbors] of Object.entries(US_STATE_NEIGHBORS)) {
      for (const neighbor of neighbors) {
        expect(US_STATE_NEIGHBORS[neighbor]).toBeDefined();
        expect(US_STATE_NEIGHBORS[neighbor]).toContain(state);
      }
    }
  });

  it("has exactly the 51 STATES codes as keys (no extra/missing)", () => {
    const stateIds = STATES.map((s) => s.id).sort();
    const neighborKeys = Object.keys(US_STATE_NEIGHBORS).sort();
    expect(neighborKeys).toEqual(stateIds);
  });

  it("AK and HI have no land-border neighbors", () => {
    expect(US_STATE_NEIGHBORS.AK).toEqual([]);
    expect(US_STATE_NEIGHBORS.HI).toEqual([]);
  });

  it("DC borders exactly MD and VA", () => {
    expect(new Set(US_STATE_NEIGHBORS.DC)).toEqual(new Set(["MD", "VA"]));
  });

  it("spot-checks high-degree states (MO=8, TN=8, KY=7)", () => {
    expect(US_STATE_NEIGHBORS.MO).toHaveLength(8);
    expect(new Set(US_STATE_NEIGHBORS.MO)).toEqual(
      new Set(["IA", "IL", "KY", "TN", "AR", "OK", "KS", "NE"]),
    );
    expect(US_STATE_NEIGHBORS.TN).toHaveLength(8);
    expect(new Set(US_STATE_NEIGHBORS.TN)).toEqual(
      new Set(["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"]),
    );
    expect(US_STATE_NEIGHBORS.KY).toHaveLength(7);
    expect(new Set(US_STATE_NEIGHBORS.KY)).toEqual(
      new Set(["IN", "OH", "WV", "VA", "TN", "MO", "IL"]),
    );
  });
});
