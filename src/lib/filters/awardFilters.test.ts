import { describe, expect, it } from "vitest";
import { awardChips, facetLabels, NO_AWARD_FILTERS } from "./awardFilters";

describe("awardChips buyer chip (AF-04)", () => {
  const facets = {
    naics: [],
    psc: [],
    agencies: [{ id: "466", label: "Coast Guard", count: 3 }],
  };
  it("shows the agency name, not its key", () => {
    const chips = awardChips({ ...NO_AWARD_FILTERS, agencies: ["466"] }, facetLabels(facets));
    expect(chips.map((c) => c.label)).toEqual(["Buyer: Coast Guard"]);
  });
  it("falls back to the key only when the name is unknown", () => {
    const chips = awardChips({ ...NO_AWARD_FILTERS, agencies: ["9"] }, facetLabels(facets));
    expect(chips[0].label).toBe("Buyer: 9");
  });
});
