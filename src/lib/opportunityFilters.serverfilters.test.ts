import { describe, it, expect } from "vitest";
import { emptyFilters, toServerFilters, withoutCategories } from "./opportunityFilters";

describe("toServerFilters", () => {
  it("maps panel facets to the server shape (ranked)", () => {
    const f = {
      ...emptyFilters(),
      naics: ["236220"],
      setAsides: ["VOSB"],
      states: ["NC"],
      valueRange: { min: 100000, max: null },
    };
    const { filters, sort } = toServerFilters(f, "deadline");
    expect(filters.naicsCodes).toEqual(["236220"]);
    expect(filters.setAsides).toEqual(["VOSB"]);
    expect(filters.location?.states).toEqual(["NC"]);
    // This call used to pass the "bid" verdict tab and expect it on the wire.
    // The selector is retired: the feed asks for every match and the server's
    // own default (tier != low) is what the member sees.
    expect(filters).not.toHaveProperty("verdict");
    expect(filters.valueRange).toEqual({ min: 100000, max: null });
    expect(sort).toEqual({ field: "deadline", order: "asc" });
  });

  it("merges states and popStates into location.states, deduped", () => {
    const f = { ...emptyFilters(), states: ["NC", "SC"], popStates: ["SC", "GA"] };
    const { filters } = toServerFilters(f, "match");
    expect(filters.location?.states).toEqual(["NC", "SC", "GA"]);
  });

  it("includes cities in location alongside states", () => {
    const f = { ...emptyFilters(), states: ["TX"], cities: ["Houston"] };
    const { filters } = toServerFilters(f, "match");
    expect(filters.location?.states).toEqual(["TX"]);
    expect(filters.location?.cities).toEqual(["Houston"]);
  });

  it("emits location with only cities when no states are selected", () => {
    const f = { ...emptyFilters(), cities: ["Houston", "Dallas"] };
    const { filters } = toServerFilters(f, "match");
    expect(filters.location?.states).toBeUndefined();
    expect(filters.location?.cities).toEqual(["Houston", "Dallas"]);
  });

  it("drops 'any' from dueWindow and omits the field when only 'any' is set", () => {
    const { filters } = toServerFilters(emptyFilters(), "match");
    expect(filters.dueWindow).toBeUndefined();

    const f = { ...emptyFilters(), dueWindow: ["any", "30_days"] };
    const { filters: filters2 } = toServerFilters(f, "match");
    expect(filters2.dueWindow).toEqual(["30_days"]);
  });

  it("never emits verdict, for any input", () => {
    // `toServerFilters` no longer takes a verdict argument at all, so there is
    // no input that can put one on the wire. Cover the spread of shapes the
    // panel produces rather than a single empty one, since the field used to be
    // conditional on state the caller supplied.
    const inputs = [
      emptyFilters(),
      { ...emptyFilters(), naics: ["236220"], setAsides: ["VOSB"] },
      { ...emptyFilters(), states: ["NC"], cities: ["Raleigh"] },
      { ...emptyFilters(), valueRange: { min: 1, max: 2 }, postedWithin: 7 },
    ];
    for (const f of inputs) {
      for (const sort of ["match", "deadline", "value", "newest", "saved"] as const) {
        expect(toServerFilters(f, sort).filters).not.toHaveProperty("verdict");
      }
    }
  });

  it("emits all opp-facet fields server-side", () => {
    const f = {
      ...emptyFilters(),
      agencies: ["Dept of Widgets"],
      vehicles: ["idiq"],
      psc: ["Z2AA"],
      popZips: ["28301"],
      postedWithin: 7,
      toggles: { ...emptyFilters().toggles, dodOnly: true },
    };
    const { filters } = toServerFilters(f, "match");
    expect(filters.agencies).toEqual(["Dept of Widgets"]);
    expect(filters.vehicles).toEqual(["idiq"]);
    expect(filters.psc).toEqual(["Z2AA"]);
    expect(filters.popZips).toEqual(["28301"]);
    expect(filters.postedWithin).toBe(7);
    expect(filters.dodOnly).toBe(true);
  });

  it("emits civilianOnly", () => {
    const f = { ...emptyFilters(), toggles: { ...emptyFilters().toggles, civilianOnly: true } };
    const { filters } = toServerFilters(f, "match");
    expect(filters.civilianOnly).toBe(true);
  });

  it("never emits scopes: the buyer lane is page state, added by withLane", () => {
    expect(toServerFilters(emptyFilters(), "match").filters).not.toHaveProperty("scopes");
  });

  it("omits postedWithin when null (any)", () => {
    const { filters } = toServerFilters(emptyFilters(), "match");
    expect(filters.postedWithin).toBeUndefined();
  });

  it("passes a free number-of-days postedWithin through", () => {
    const f = { ...emptyFilters(), postedWithin: 21 };
    const { filters } = toServerFilters(f, "match");
    expect(filters.postedWithin).toBe(21);
  });

  it("does not emit keyword, workTypes, excludedNaics or status — backend DTO doesn't accept them yet", () => {
    const f = {
      ...emptyFilters(),
      keyword: "roof",
      workTypes: ["roofing"],
      excludedNaics: ["238160"],
      status: "all" as const,
      naics: ["236220"],
    };
    const { filters } = toServerFilters(f, "match");
    expect(filters).not.toHaveProperty("keyword");
    expect(filters).not.toHaveProperty("workTypes");
    expect(filters).not.toHaveProperty("excludedNaics");
    expect(filters).not.toHaveProperty("status");
    // naicsCodes still derives from f.naics, unchanged.
    expect(filters.naicsCodes).toEqual(["236220"]);
  });

  it("ranked 'newest' now passes straight through as a server sort field", () => {
    const { sort } = toServerFilters(emptyFilters(), "newest");
    expect(sort).toEqual({ field: "newest", order: "desc" });
  });

  it("sorts deadline ascending and other fields descending", () => {
    expect(toServerFilters(emptyFilters(), "deadline").sort.order).toBe("asc");
    expect(toServerFilters(emptyFilters(), "value").sort.order).toBe("desc");
    expect(toServerFilters(emptyFilters(), "match").sort.order).toBe("desc");
    expect(toServerFilters(emptyFilters(), "newest").sort.order).toBe("desc");
  });

  it("maps 'Most time left' and 'Smallest first' onto the reversed field sorts", () => {
    expect(toServerFilters(emptyFilters(), "timeLeft").sort).toEqual({
      field: "deadline",
      order: "desc",
    });
    expect(toServerFilters(emptyFilters(), "smallest").sort).toEqual({
      field: "value",
      order: "asc",
    });
  });
});

describe("the feed has no opportunity-type filter", () => {
  it("toServerFilters never sends categories, even when old filters carry them", () => {
    const f = { ...emptyFilters(), categories: ["grant", "forecast"] };
    expect(toServerFilters(f, "match").filters).not.toHaveProperty("categories");
  });

  it("withoutCategories drops the key and keeps every other field", () => {
    const f = { ...emptyFilters(), states: ["TX"], categories: ["grant"] };
    const out = withoutCategories(f);
    expect(out).not.toHaveProperty("categories");
    expect(out.states).toEqual(["TX"]);
  });

  it("withoutCategories returns the same object when there is no such key", () => {
    const f = emptyFilters();
    expect(withoutCategories(f)).toBe(f);
  });
});
