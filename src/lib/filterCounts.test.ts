import { describe, it, expect } from "vitest";
import { emptyFilters } from "./opportunityFilters";
import { sectionActiveCounts } from "./filterCounts";

describe("sectionActiveCounts", () => {
  it("is all zero for empty filters", () => {
    expect(sectionActiveCounts(emptyFilters())).toEqual({
      what: 0,
      where: 0,
      fit: 0,
      timing: 0,
      advanced: 0,
    });
  });

  it("counts workTypes under 'what'", () => {
    const f = { ...emptyFilters(), workTypes: ["roofing", "concrete"] };
    expect(sectionActiveCounts(f).what).toBe(2);
  });

  it("counts states + cities under 'where'", () => {
    // Bare city name (e.g. "Houston") — matches the popCity filter contract;
    // see LocationPicker's city-id convention.
    const f = { ...emptyFilters(), states: ["NC"], cities: ["Houston"] };
    expect(sectionActiveCounts(f).where).toBe(2);
  });

  it("counts setAsides and an active valueRange under 'fit'", () => {
    const f = {
      ...emptyFilters(),
      setAsides: ["SB", "8A"],
      valueRange: { min: 100_000, max: null },
    };
    expect(sectionActiveCounts(f).fit).toBe(3);
  });

  it("counts a non-'any' dueWindow and a set postedWithin under 'timing'", () => {
    const f = { ...emptyFilters(), dueWindow: ["30_days"], postedWithin: 7 };
    expect(sectionActiveCounts(f).timing).toBe(2);
  });

  it("does not count dueWindow of just 'any' under 'timing'", () => {
    expect(sectionActiveCounts(emptyFilters()).timing).toBe(0);
  });

  it("rolls psc/agencies/toggles/noticeTypes/vehicles/status into 'advanced'", () => {
    const f = {
      ...emptyFilters(),
      psc: ["Z2AA"],
      agencies: ["dod.army"],
      toggles: { ...emptyFilters().toggles, dodOnly: true },
      noticeTypes: ["sources_sought"],
      vehicles: ["idiq"],
      status: "all" as const,
    };
    // psc(1) + agencies(1) + dodOnly(1) + noticeTypes(1) + vehicles(1) + status(1)
    expect(sectionActiveCounts(f).advanced).toBe(6);
  });

  it("counts excludeNoBid and favoritesOnly toggles under 'advanced'", () => {
    const f = {
      ...emptyFilters(),
      toggles: { ...emptyFilters().toggles, excludeNoBid: true, favoritesOnly: true },
    };
    expect(sectionActiveCounts(f).advanced).toBe(2);
  });
});
