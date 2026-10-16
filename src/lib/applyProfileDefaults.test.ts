import { describe, it, expect } from "vitest";
import { applyProfileDefaults, emptyFilters, prefilledValues } from "./opportunityFilters";

describe("applyProfileDefaults", () => {
  it("tags but does NOT pre-select naics, set-asides, states or cities", () => {
    const f = applyProfileDefaults(emptyFilters(), {
      naics: ["238160"],
      setAsides: ["VOSB", "SB"],
      states: ["NC", "VA"],
      cities: ["Fayetteville"],
    });
    // Nothing is selected (no filtering applied)…
    expect(f.naics).toEqual([]);
    expect(f.setAsides).toEqual([]);
    expect(f.states).toEqual([]);
    expect(f.cities).toEqual([]);
    // …but the values are tagged so the UI can mark the options.
    expect(prefilledValues(f, "naics")).toEqual(["238160"]);
    expect(prefilledValues(f, "setAsides").sort()).toEqual(["SB", "VOSB"]);
    expect(prefilledValues(f, "states").sort()).toEqual(["NC", "VA"]);
    expect(prefilledValues(f, "cities")).toEqual(["Fayetteville"]);
  });

  it("tags each seeded facet and value in the prefilled set", () => {
    const f = applyProfileDefaults(emptyFilters(), {
      naics: ["238160"],
      setAsides: ["VOSB"],
      states: ["NC"],
      cities: ["Fayetteville"],
    });
    expect(f.prefilled.has("naics")).toBe(true);
    expect(f.prefilled.has("naics:238160")).toBe(true);
    expect(f.prefilled.has("setAsides:VOSB")).toBe(true);
    expect(f.prefilled.has("states:NC")).toBe(true);
    expect(f.prefilled.has("cities:Fayetteville")).toBe(true);
  });

  it("does not tag a facet that has no profile data", () => {
    const f = applyProfileDefaults(emptyFilters(), {
      naics: [],
      setAsides: ["VOSB"],
      states: [],
      cities: [],
    });
    expect(f.prefilled.has("naics")).toBe(false);
    expect(f.prefilled.has("states")).toBe(false);
    expect(f.prefilled.has("cities")).toBe(false);
    expect(f.prefilled.has("setAsides")).toBe(true);
  });

  it("preserves untouched base fields (toggles)", () => {
    const f = applyProfileDefaults(emptyFilters(), {
      naics: [],
      setAsides: [],
      states: [],
      cities: [],
    });
    expect(f.toggles).toEqual(emptyFilters().toggles);
    expect(f.prefilled.size).toBe(0);
  });
});
