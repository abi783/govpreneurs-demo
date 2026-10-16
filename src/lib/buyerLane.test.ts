import { describe, expect, it } from "vitest";
import { BUYER_LANE_LABEL, laneFromScope, laneOnlyFilters, withLane } from "./buyerLane";

describe("buyerLane", () => {
  it("labels the lanes as the forecasts page does", () => {
    expect(BUYER_LANE_LABEL).toEqual({
      all: "All buyers",
      federal: "Federal",
      sled: "State and local",
    });
  });

  it("adds the server scope for a narrowed lane, and nothing for All buyers", () => {
    const base = { naicsCodes: ["238160"] };
    expect(withLane(base, "federal")).toEqual({ naicsCodes: ["238160"], scopes: ["fed"] });
    expect(withLane(base, "sled")).toEqual({ naicsCodes: ["238160"], scopes: ["sled"] });
    expect(withLane(base, "all")).toBe(base);
  });

  it("gives a filter-free list only the lane", () => {
    expect(laneOnlyFilters("sled")).toEqual({ scopes: ["sled"] });
    expect(laneOnlyFilters("all")).toBeUndefined();
  });

  it("reads Hunter's scope as a lane", () => {
    expect(laneFromScope({ fed: true, sled: false })).toBe("federal");
    expect(laneFromScope({ fed: false, sled: true })).toBe("sled");
    expect(laneFromScope({ fed: true, sled: true })).toBe("all");
    expect(laneFromScope({ fed: false, sled: false })).toBeUndefined();
    expect(laneFromScope(undefined)).toBeUndefined();
  });
});
