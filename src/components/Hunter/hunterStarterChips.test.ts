import { describe, expect, it } from "vitest";
import { buildStarterChips } from "./HunterChatOverlay";
import type { VisibleOpp } from "../../lib/hunterChat";

const opps: VisibleOpp[] = [
  { oppKey: "1", title: "Roof Repair" },
  { oppKey: "2", title: "HVAC" },
  { oppKey: "3", title: "Paving" },
];

describe("buildStarterChips", () => {
  it("For You (for_you) leads with why-does-this-match", () => {
    const chips = buildStarterChips(null, opps, "for_you");
    expect(chips[0]).toMatch(/why does the Roof Repair match/i);
  });

  it("Explore (all) offers a good-fit prompt for the top opp", () => {
    const chips = buildStarterChips(null, opps, "all");
    expect(chips.join(" ")).toMatch(/good fit for the Roof Repair/i);
  });

  it("Saved offers a compare-my-saved prompt", () => {
    const chips = buildStarterChips(null, opps, "saved");
    expect(chips.join(" ")).toMatch(/compare my saved/i);
  });

  it("Saved with a single opp still returns a usable chip", () => {
    const chips = buildStarterChips(null, [opps[0]], "saved");
    expect(chips.length).toBeGreaterThan(0);
  });
});
