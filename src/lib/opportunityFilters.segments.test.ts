import { describe, it, expect } from "vitest";
import {
  dueWindowSegmentToArray,
  dueWindowArrayToSegment,
  postedWithinSegmentToDays,
  postedWithinDaysToSegment,
  DUE_WINDOW_SEGMENT_IDS,
  POSTED_WITHIN_SEGMENT_IDS,
} from "./opportunityFilters";

describe("dueWindowSegmentToArray", () => {
  it("maps a specific segment id to a one-element array", () => {
    expect(dueWindowSegmentToArray("30_days")).toEqual(["30_days"]);
  });

  it("maps 'any' to an empty array", () => {
    expect(dueWindowSegmentToArray("any")).toEqual([]);
  });
});

describe("dueWindowArrayToSegment", () => {
  it("reads the specific id back out of a one-element array", () => {
    expect(dueWindowArrayToSegment(["30_days"])).toBe("30_days");
  });

  it("reads 'any' back out of an empty array", () => {
    expect(dueWindowArrayToSegment([])).toBe("any");
  });

  it("reads 'any' back out of an array containing only 'any'", () => {
    expect(dueWindowArrayToSegment(["any"])).toBe("any");
  });

  it("prefers the first non-'any' entry when both are present", () => {
    expect(dueWindowArrayToSegment(["any", "60_plus"])).toBe("60_plus");
  });

  it("round-trips through dueWindowSegmentToArray for every fixed segment id", () => {
    for (const id of DUE_WINDOW_SEGMENT_IDS) {
      expect(dueWindowArrayToSegment(dueWindowSegmentToArray(id))).toBe(id);
    }
  });
});

describe("postedWithinSegmentToDays", () => {
  it("maps a day-number string to the number", () => {
    expect(postedWithinSegmentToDays("7")).toBe(7);
    expect(postedWithinSegmentToDays("1")).toBe(1);
    expect(postedWithinSegmentToDays("30")).toBe(30);
  });

  it("maps 'any' to null", () => {
    expect(postedWithinSegmentToDays("any")).toBeNull();
  });

  it("maps a non-numeric/invalid segment to null defensively", () => {
    expect(postedWithinSegmentToDays("not-a-number")).toBeNull();
    expect(postedWithinSegmentToDays("0")).toBeNull();
    expect(postedWithinSegmentToDays("-5")).toBeNull();
  });
});

describe("postedWithinDaysToSegment", () => {
  it("reads a fixed-preset day count back out", () => {
    expect(postedWithinDaysToSegment(7)).toBe("7");
    expect(postedWithinDaysToSegment(1)).toBe("1");
    expect(postedWithinDaysToSegment(30)).toBe("30");
  });

  it("reads null back out as 'any'", () => {
    expect(postedWithinDaysToSegment(null)).toBe("any");
  });

  it("falls back to 'any' for a day count outside the fixed presets", () => {
    expect(postedWithinDaysToSegment(21)).toBe("any");
  });

  it("round-trips through postedWithinSegmentToDays for every fixed segment id", () => {
    for (const id of POSTED_WITHIN_SEGMENT_IDS) {
      expect(postedWithinDaysToSegment(postedWithinSegmentToDays(id))).toBe(id);
    }
  });
});
