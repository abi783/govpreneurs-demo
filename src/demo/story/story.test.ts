import { describe, expect, it } from "vitest";
import { checkStory, factProblem } from "./check";
import { getOpportunity, HERO_IDS } from "./opportunities";

describe("demo story", () => {
  it("has no inconsistencies, and every Hunter reason is true of the member", () => {
    expect(checkStory()).toEqual([]);
  });

  it("catches false claims (the checks can fail)", () => {
    const o = getOpportunity(HERO_IDS.fieldMeals)!;
    expect(factProblem(o, { kind: "valueInRange", says: "about $900K" })).toMatch(/outside/);
    expect(factProblem(o, { kind: "distance", says: "10 minutes from your kitchen" })).toMatch(/45 miles/);
    expect(factProblem(o, { kind: "setAside", code: "SBA", says: "x" })).toMatch(/set-aside/);
    expect(factProblem(o, { kind: "clearanceGap", says: "x" })).toMatch(/not true/);
    expect(factProblem(o, { kind: "noticeType", says: "a sealed price bid" })).toMatch(/non-IFB/);
    const dining = getOpportunity(HERO_IDS.fortBraggDining)!;
    expect(factProblem(dining, { kind: "valueInRange", says: "about $2M" })).toMatch(/outside the member's range/);
  });
});
