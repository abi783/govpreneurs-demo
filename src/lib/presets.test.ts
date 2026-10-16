import { applyProfileDefaults, buildPresets, emptyFilters } from "./opportunityFilters";

describe("buildPresets", () => {
  it("leads with a profile-lane preset built from the user's tagged facets", () => {
    const f = applyProfileDefaults(emptyFilters(), {
      naics: ["238160"],
      setAsides: ["WOSB"],
      states: ["TX"],
      cities: ["Houston"],
    });
    const presets = buildPresets(f);
    expect(presets[0].id).toBe("profile-lane");

    const applied = presets[0].apply(f);
    expect(applied.naics).toEqual(["238160"]);
    expect(applied.setAsides).toEqual(["WOSB"]);
    expect(applied.states).toEqual(["TX"]);
    expect(applied.cities).toEqual(["Houston"]);
  });

  it("omits the profile-lane preset but keeps neutral presets when there's no profile", () => {
    const presets = buildPresets(emptyFilters());
    expect(presets.some((p) => p.id === "profile-lane")).toBe(false);
    expect(presets.map((p) => p.id)).toEqual(["early-signals", "closing-30", "new-this-week"]);
  });
});
