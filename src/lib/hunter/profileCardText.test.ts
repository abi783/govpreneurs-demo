import { describe, expect, it } from "vitest";
import { foldText, naicsEntry, startWithCapital } from "./profileCardText";

describe("foldText", () => {
  it("keeps a text that fits", () => {
    expect(foldText("short text", 40)).toBe("short text");
  });

  it("folds at a word boundary, never inside a word", () => {
    expect(foldText("entry strategies such as subcontracting and teaming", 36)).toBe(
      "entry strategies such as…",
    );
  });

  it("cuts hard when no word boundary is near the fold", () => {
    expect(foldText("a supercalifragilistic", 12)).toBe("a supercalif…");
  });
});

describe("naicsEntry", () => {
  it("splits a NAICS entry into its code and name", () => {
    expect(naicsEntry("541810 — Advertising services")).toEqual({
      code: "541810",
      name: "Advertising services",
    });
  });

  it("returns null for anything else", () => {
    expect(naicsEntry("541810")).toBeNull();
    expect(naicsEntry("States: NC")).toBeNull();
  });
});

describe("startWithCapital", () => {
  it("capitalises a phrase that starts with a lower-case word", () => {
    expect(startWithCapital("federal market research")).toBe("Federal market research");
    expect(startWithCapital("mentor-guided action planning")).toBe("Mentor-guided action planning");
  });

  it("leaves a phrase that starts with a code, a number or a capital", () => {
    expect(startWithCapital("541810 — Advertising services")).toBe("541810 — Advertising services");
    expect(startWithCapital("UEI YWS1TMEQ7KZ6")).toBe("UEI YWS1TMEQ7KZ6");
    expect(startWithCapital("8(a)")).toBe("8(a)");
  });

  it("leaves a mixed-case brand word as written", () => {
    expect(startWithCapital("iOS app delivery")).toBe("iOS app delivery");
    expect(startWithCapital("eBay storefront setup")).toBe("eBay storefront setup");
  });

  it("keeps leading space out and survives an empty string", () => {
    expect(startWithCapital("  teaming")).toBe("Teaming");
    expect(startWithCapital("")).toBe("");
  });
});
