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
      setAsides: 0,
      agencies: 0,
      noticeTypes: 0,
      vehicles: 0,
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

  it("counts an active valueRange under 'fit' and set-asides under their own category", () => {
    const f = {
      ...emptyFilters(),
      setAsides: ["SB", "8A"],
      valueRange: { min: 100_000, max: null },
    };
    expect(sectionActiveCounts(f).fit).toBe(1);
    expect(sectionActiveCounts(f).setAsides).toBe(2);
  });

  it("counts a closing window and a set postedWithin under 'timing'", () => {
    const f = { ...emptyFilters(), dueWindow: ["within_20"], postedWithin: 7 };
    expect(sectionActiveCounts(f).timing).toBe(2);
  });

  it("does not count dueWindow of just 'any' under 'timing'", () => {
    expect(sectionActiveCounts(emptyFilters()).timing).toBe(0);
  });

  it("gives agencies, notice types and vehicles their own categories", () => {
    const f = {
      ...emptyFilters(),
      agencies: ["Department of the Army"],
      noticeTypes: ["sources_sought", "presol"],
      vehicles: ["idiq"],
    };
    const counts = sectionActiveCounts(f);
    expect(counts.agencies).toBe(1);
    expect(counts.noticeTypes).toBe(2);
    expect(counts.vehicles).toBe(1);
  });
});
