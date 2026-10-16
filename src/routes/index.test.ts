import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { INITIAL, reducer, reviveSavedFilters } from "./index";
import { emptyFilters, type OpportunityFilters } from "../lib/opportunityFilters";
import type { OppTab } from "../components/Hunter/OpportunitiesTabs";

describe("the awarded feed branch", () => {
  it("leaves no awarded render branch, and no award mock, in the feed route", () => {
    // The tab strip stopped offering `awarded`, so nothing could set the tab
    // and the branch below it was unreachable. Unreachable code that renders
    // fabricated award data is worse than dead: a future edit can revive it.
    // Asserted against the source, because a branch nothing can enter has no
    // behaviour to assert.
    const source = readFileSync(resolve(process.cwd(), "src/routes/index.tsx"), "utf8");
    expect(source).not.toMatch(/awarded/i);
    expect(source).not.toContain("lib/mock/awardedContracts");
  });

  it("keeps the tab union to the three tabs the strip offers", () => {
    const tabs: OppTab[] = ["for_you", "all", "saved"];
    // @ts-expect-error `awarded` left the union with the tab that offered it.
    const removed: OppTab = "awarded";
    expect(tabs).not.toContain(removed);
  });
});

describe("reviveSavedFilters", () => {
  it("preserves every field — including the prefilled Set — through the save→apply round trip", () => {
    const original: OpportunityFilters = {
      ...emptyFilters(),
      cities: ["Houston", "Dallas"],
      states: ["TX"],
      workTypes: ["roofing", "electrical"],
      valueRange: { min: 250_000, max: 1_000_000 },
      setAsides: ["WOSB"],
      prefilled: new Set(["states", "states:TX", "naics:238160"]),
    };

    // Simulates the real server round trip: `addSavedSearch` converts the
    // `prefilled` Set to an array before POSTing (Sets serialize to `{}`, which
    // would lose every member), the whole object is stored/returned as JSON,
    // and `reviveSavedFilters` turns the array back into a Set on load.
    const forWire = { ...original, prefilled: [...original.prefilled] };
    const roundTripped = JSON.parse(JSON.stringify(forWire)) as OpportunityFilters;
    const revived = reviveSavedFilters(roundTripped);

    expect(revived).toEqual(original);
    expect([...revived.prefilled].sort()).toEqual([...original.prefilled].sort());
    expect(revived.cities).toEqual(original.cities);
    expect(revived.workTypes).toEqual(original.workTypes);
    expect(revived.valueRange).toEqual(original.valueRange);
    expect(revived.setAsides).toEqual(original.setAsides);
  });

  it("drops the categories of a search saved when the menu still had a type filter", () => {
    const raw = {
      ...emptyFilters(),
      states: ["TX"],
      categories: ["grant", "forecast"],
      prefilled: [] as unknown as Set<string>,
    } as OpportunityFilters;
    const revived = reviveSavedFilters(raw);
    expect(revived).not.toHaveProperty("categories");
    expect(revived.states).toEqual(["TX"]);
  });

  it("drops the scope of an old saved search: the buyer lane is not saved with a search", () => {
    const raw = {
      ...emptyFilters(),
      states: ["TX"],
      scope: { fed: true, sled: false },
      prefilled: [] as unknown as Set<string>,
    } as OpportunityFilters;
    const revived = reviveSavedFilters(raw);
    expect(revived).not.toHaveProperty("scope");
    expect(revived.states).toEqual(["TX"]);
  });

  it("revives prefilled from an array payload (defensive: some callers may pre-serialize the Set to an array)", () => {
    const raw = {
      ...emptyFilters(),
      prefilled: ["states", "states:TX"] as unknown as Set<string>,
    };
    const revived = reviveSavedFilters(raw);
    expect(Array.from(revived.prefilled)).toEqual(["states", "states:TX"]);
  });

  it("defaults prefilled to an empty Set when the field is missing entirely", () => {
    const raw = { ...emptyFilters() } as OpportunityFilters;
    // @ts-expect-error simulating a payload where prefilled was stripped
    delete raw.prefilled;
    const revived = reviveSavedFilters(raw);
    expect(Array.from(revived.prefilled)).toEqual([]);
  });
});

describe("reducer — per-tab isolation (For You ↔ All Opportunities)", () => {
  it("does not carry filters or search from For You into All on first switch", () => {
    const withFilters = reducer(
      reducer(INITIAL, {
        type: "set-filters",
        filters: { ...emptyFilters(), states: ["TX"] },
      }),
      { type: "set-search", value: "roofing" },
    );
    const onAll = reducer(withFilters, { type: "set-tab", tab: "all" });

    expect(onAll.tab).toBe("all");
    expect(onAll.filters.states).toEqual([]);
    expect(onAll.searchValue).toBe("");
    // All is unscored → defaults to Newest, not For You's "match".
    expect(onAll.sort).toBe("newest");
  });

  it("restores each tab's own applied filters/search when switching back", () => {
    // For You: filter TX + search "roofing".
    let s = reducer(INITIAL, {
      type: "set-filters",
      filters: { ...emptyFilters(), states: ["TX"] },
    });
    s = reducer(s, { type: "set-search", value: "roofing" });
    // Switch to All, apply a different filter + search there.
    s = reducer(s, { type: "set-tab", tab: "all" });
    s = reducer(s, { type: "set-filters", filters: { ...emptyFilters(), states: ["CA"] } });
    s = reducer(s, { type: "set-search", value: "paving" });
    // Back to For You — its own TX + "roofing" come back, untouched by All.
    s = reducer(s, { type: "set-tab", tab: "for_you" });
    expect(s.filters.states).toEqual(["TX"]);
    expect(s.searchValue).toBe("roofing");
    // And All still remembers CA + "paving".
    s = reducer(s, { type: "set-tab", tab: "all" });
    expect(s.filters.states).toEqual(["CA"]);
    expect(s.searchValue).toBe("paving");
  });

  it("is a no-op when re-selecting the already-active tab", () => {
    const s = reducer(INITIAL, { type: "set-tab", tab: "for_you" });
    expect(s).toBe(INITIAL);
  });

  it("carries no verdict slice — neither in the initial state nor through the tab stash", () => {
    // The All / Bid / Review selector is retired: the feed shows every match and
    // the request omits the narrowing entirely. `noUnusedLocals: false` means a
    // leftover slice of state still typechecks, so the shape is pinned here.
    //
    // Asserted as the EXACT key set rather than one absent key: the retired
    // field's own name may not appear anywhere under `src` (that zero-grep is
    // the feature's acceptance check), and pinning the whole set is the stronger
    // claim anyway — a reintroduced slice fails whatever it is called.
    expect(Object.keys(INITIAL).sort()).toEqual([
      "activeSavedListId",
      "builderOpen",
      "chatOpen",
      "customizeOpen",
      "exploreOpen",
      "filters",
      "lane",
      "mode",
      "parsedQuery",
      "parsing",
      "savedFilters",
      "savedIds",
      "savedLists",
      "searchValue",
      "smartList",
      "sort",
      "tab",
      "tabStash",
    ]);

    // Round-trip For You → All → For You. The stash snapshots the tab-scoped
    // slice verbatim, so a reintroduced field would surface in its key set too.
    let s = reducer(INITIAL, {
      type: "set-filters",
      filters: { ...emptyFilters(), states: ["TX"] },
    });
    s = reducer(s, { type: "set-tab", tab: "all" });
    expect(Object.keys(s.tabStash.for_you!).sort()).toEqual(["filters", "searchValue", "sort"]);
    s = reducer(s, { type: "set-tab", tab: "for_you" });
    expect(s.filters.states).toEqual(["TX"]);
  });

  it("keeps the buyer lane across tab switches, and never stashes it per tab", () => {
    let s = reducer(INITIAL, { type: "set-lane", lane: "sled" });
    s = reducer(s, { type: "set-tab", tab: "all" });
    expect(s.lane).toBe("sled");
    s = reducer(s, { type: "set-tab", tab: "saved" });
    s = reducer(s, { type: "set-tab", tab: "for_you" });
    expect(s.lane).toBe("sled");
    expect(Object.keys(s.tabStash.all!)).not.toContain("lane");
    // "Clear all" clears filters, not the lane.
    expect(reducer(s, { type: "clear-all-filters" }).lane).toBe("sled");
  });

  it("isolates the Saved tab and defaults it to Recently saved", () => {
    const withForYou = reducer(INITIAL, {
      type: "set-filters",
      filters: { ...emptyFilters(), states: ["TX"] },
    });
    const onSaved = reducer(withForYou, { type: "set-tab", tab: "saved" });
    expect(onSaved.tab).toBe("saved");
    expect(onSaved.filters.states).toEqual([]);
    expect(onSaved.sort).toBe("saved");
    // For You's filters return intact when switching back.
    const backToForYou = reducer(onSaved, { type: "set-tab", tab: "for_you" });
    expect(backToForYou.filters.states).toEqual(["TX"]);
  });
});
