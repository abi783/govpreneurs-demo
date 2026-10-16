import { describe, it, expect } from "vitest";
import { STATES, US_STATE_NAMES, stateName } from "./usStates";

describe("usStates vocabulary", () => {
  it("holds the fifty states, plus DC", () => {
    expect(STATES.length).toBeGreaterThanOrEqual(50);
    expect(STATES.map((s) => s.id)).toContain("DC");
  });

  it("names a state from its two-letter code", () => {
    expect(stateName("NC")).toBe("North Carolina");
  });

  it("falls back to the code itself when the map has no name", () => {
    expect(stateName("ZZ")).toBe("ZZ");
  });

  it("names every code the STATES catalog holds", () => {
    for (const state of STATES) {
      expect(US_STATE_NAMES[state.id]).toBeDefined();
    }
  });
});
