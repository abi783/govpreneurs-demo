import { describe, it, expect } from "vitest";
import { WORK_TYPES } from "./vocab/trades";
import { WORK_SECTIONS, WORK_TYPE_SECTIONS, sectionOf } from "./workSections";

describe("WORK_TYPE_SECTIONS", () => {
  it("maps every WORK_TYPES id to a valid section", () => {
    for (const t of WORK_TYPES) {
      expect(WORK_TYPE_SECTIONS[t.id]).toBeDefined();
      expect(WORK_SECTIONS).toContain(WORK_TYPE_SECTIONS[t.id]);
    }
  });

  it("has no stale keys beyond WORK_TYPES ids", () => {
    const ids = new Set(WORK_TYPES.map((t) => t.id));
    for (const key of Object.keys(WORK_TYPE_SECTIONS)) {
      expect(ids.has(key)).toBe(true);
    }
  });
});

describe("sectionOf", () => {
  it("returns the mapped section for a known id", () => {
    expect(sectionOf("roofing_and_roof_systems")).toBe("Construction & Trades");
    expect(sectionOf("it_services_and_software")).toBe("Technology");
  });

  it("falls back to Supply & Other for an unmapped id (catalog-drift safety)", () => {
    expect(sectionOf("some_future_trade_not_yet_mapped")).toBe("Supply & Other");
  });
});
