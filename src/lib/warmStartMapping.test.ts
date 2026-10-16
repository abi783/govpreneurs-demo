import { describe, it, expect } from "vitest";
import { childId, type TreeSelection } from "./treeSelection";
import {
  buildPreviewAnswers,
  emptyPreviewAnswers,
  selectionsFromAnswers,
  statesFromSelection,
  effectiveNaicsFrom,
  citiesFrom,
  setAsideFilterTokensFrom,
  setAsideCodesFrom,
  tradeIdsFrom,
  EMPTY_TREE_SELECTION,
} from "./warmStartMapping";
import { WORK_TYPE_TO_NAICS } from "./vocab/trades";
import { US_STATE_NEIGHBORS } from "./usStateNeighbors";

const EMPTY: TreeSelection = EMPTY_TREE_SELECTION;

describe("effectiveNaicsFrom", () => {
  it("uses the full trade NAICS list when the parent is selected whole", () => {
    const workSel: TreeSelection = { parents: ["roofing_and_roof_systems"], children: [] };
    expect(effectiveNaicsFrom(workSel)).toEqual(WORK_TYPE_TO_NAICS.roofing_and_roof_systems);
  });

  it("uses exactly the picked child codes when only some are selected (parent absent)", () => {
    const workSel: TreeSelection = {
      parents: [],
      children: [
        childId("siding_windows_and_doors", "238150"),
        childId("siding_windows_and_doors", "332321"),
      ],
    };
    expect(effectiveNaicsFrom(workSel).sort()).toEqual(["238150", "332321"].sort());
  });

  it("unions codes across multiple trades and dedupes", () => {
    const workSel: TreeSelection = {
      parents: ["roofing_and_roof_systems"],
      children: [childId("siding_windows_and_doors", "238150")],
    };
    const result = effectiveNaicsFrom(workSel);
    expect(result.sort()).toEqual(["238160", "238150"].sort());
  });

  it("appends ad-hoc escape-hatch codes and dedupes against effective codes", () => {
    const workSel: TreeSelection = { parents: ["roofing_and_roof_systems"], children: [] };
    const result = effectiveNaicsFrom(workSel, ["541511", "238160"]);
    expect(result.sort()).toEqual(["238160", "541511"].sort());
  });

  it("returns [] for an empty selection with no ad-hoc codes", () => {
    expect(effectiveNaicsFrom(EMPTY)).toEqual([]);
  });
});

describe("tradeIdsFrom", () => {
  it("includes whole-parent picks and parents of any picked child", () => {
    const workSel: TreeSelection = {
      parents: ["roofing_and_roof_systems"],
      children: [childId("siding_windows_and_doors", "238150")],
    };
    expect(tradeIdsFrom(workSel).sort()).toEqual(
      ["roofing_and_roof_systems", "siding_windows_and_doors"].sort(),
    );
  });
});

describe("statesFromSelection (rung expansion)", () => {
  it("national collapses to [] regardless of selected states", () => {
    expect(statesFromSelection(["NC", "SC"], "national")).toEqual([]);
  });

  it("state_plus_neighbors expands via full US adjacency and unions with selected", () => {
    const result = statesFromSelection(["NC"], "state_plus_neighbors");
    expect(new Set(result)).toEqual(new Set(["NC", ...US_STATE_NEIGHBORS.NC]));
  });

  it("state_plus_neighbors unions neighbors across multiple selected states", () => {
    const result = new Set(statesFromSelection(["NC", "AK"], "state_plus_neighbors"));
    // AK has no neighbors (US_STATE_NEIGHBORS.AK === []) but stays in the set itself.
    expect(result.has("AK")).toBe(true);
    for (const n of US_STATE_NEIGHBORS.NC) expect(result.has(n)).toBe(true);
  });

  it("metro/nearby/state pass through the selected states as-is (no query narrowing yet)", () => {
    expect(statesFromSelection(["NC", "SC"], "metro")).toEqual(["NC", "SC"]);
    expect(statesFromSelection(["NC", "SC"], "nearby")).toEqual(["NC", "SC"]);
    expect(statesFromSelection(["NC", "SC"], "state")).toEqual(["NC", "SC"]);
  });
});

describe("citiesFrom", () => {
  it("extracts explicit city picks as bare { city, state } refs", () => {
    const locSel: TreeSelection = { parents: [], children: [childId("NC", "Fayetteville")] };
    expect(citiesFrom(locSel)).toEqual([{ city: "Fayetteville", state: "NC" }]);
  });

  it("whole-state parents contribute no city refs", () => {
    const locSel: TreeSelection = { parents: ["NC"], children: [] };
    expect(citiesFrom(locSel)).toEqual([]);
  });

  it("a city under an 'all' (whole-state) parent is excluded — parent already covers it", () => {
    const locSel: TreeSelection = { parents: ["NC"], children: [childId("NC", "Fayetteville")] };
    expect(citiesFrom(locSel)).toEqual([]);
  });
});

describe("setAsideFilterTokensFrom / setAsideCodesFrom", () => {
  it("category picks union into the 6-token filter vocab", () => {
    const saSel: TreeSelection = { parents: ["sdvosb", "eight_a"], children: [] };
    expect(setAsideFilterTokensFrom(saSel).sort()).toEqual(["8A", "VOSB"].sort());
  });

  it("native/tribal categories map to the NATIVE_TRIBAL filter token", () => {
    // Before #374 these categories had no filter counterpart and mapped to [].
    // That commit added the Native American/Tribal filter, so every native/tribal
    // category now resolves to it.
    for (const parent of ["iee", "isbee", "buy_indian", "alaska_native", "tribally_owned"]) {
      const saSel: TreeSelection = { parents: [parent], children: [] };
      expect(setAsideFilterTokensFrom(saSel)).toEqual(["NATIVE_TRIBAL"]);
    }
    // NATIVE_TRIBAL joined the filter vocab (setAsideTaxonomy.ts documents the
    // 7-token vocab; opportunityFilters.ts carries its matcher) — these
    // categories are no longer filter-invisible.
    const saSel: TreeSelection = { parents: ["iee"], children: [] };
  });

  it("whole-category pick emits every one of its SAM codes", () => {
    const saSel: TreeSelection = { parents: ["sdvosb"], children: [] };
    expect(setAsideCodesFrom(saSel).sort()).toEqual(["SDVOSBC", "SDVOSBS"].sort());
  });

  it("partial pick emits exactly the picked codes", () => {
    const saSel: TreeSelection = { parents: [], children: [childId("sdvosb", "SDVOSBC")] };
    expect(setAsideCodesFrom(saSel)).toEqual(["SDVOSBC"]);
  });
});

describe("buildPreviewAnswers", () => {
  it("assembles the full payload shape per §5", () => {
    const answers = buildPreviewAnswers({
      workSel: { parents: ["roofing_and_roof_systems"], children: [] },
      locSel: { parents: [], children: [childId("NC", "Fayetteville")] },
      saSel: { parents: ["sdvosb"], children: [] },
      serviceArea: "state_plus_neighbors",
      adhocNaics: ["541511"],
    });
    expect(answers.naics.sort()).toEqual(["238160", "541511"].sort());
    expect(new Set(answers.states)).toEqual(new Set(["NC", ...US_STATE_NEIGHBORS.NC]));
    expect(answers.setAsides).toEqual(["VOSB"]);
    expect(answers.setAsideCodes?.sort()).toEqual(["SDVOSBC", "SDVOSBS"].sort());
    expect(answers.cities).toEqual([{ city: "Fayetteville", state: "NC" }]);
    expect(answers.trades).toEqual(["roofing_and_roof_systems"]);
    expect(answers.serviceArea).toBe("state_plus_neighbors");
  });
});

describe("emptyPreviewAnswers (skip payload shape)", () => {
  it("matches §4.4 exactly: empty naics/states/setAsides, no optional fields", () => {
    const answers = emptyPreviewAnswers();
    expect(answers).toEqual({ naics: [], states: [], setAsides: [] });
  });
});

describe("build ⇄ rehydrate round-trip (selectionsFromAnswers)", () => {
  it("round-trips a whole-parent trade pick back to a selected parent", () => {
    const answers = buildPreviewAnswers({
      workSel: { parents: ["roofing_and_roof_systems"], children: [] },
      locSel: EMPTY,
      saSel: EMPTY,
      serviceArea: "state",
    });
    const rehydrated = selectionsFromAnswers(answers);
    expect(rehydrated.workSel.parents).toEqual(["roofing_and_roof_systems"]);
    expect(rehydrated.workSel.children).toEqual([]);
    expect(rehydrated.adhocNaics).toEqual([]);
  });

  it("round-trips a partial child pick back to exactly those children", () => {
    const workSel: TreeSelection = {
      parents: [],
      children: [childId("siding_windows_and_doors", "238150")],
    };
    const answers = buildPreviewAnswers({
      workSel,
      locSel: EMPTY,
      saSel: EMPTY,
      serviceArea: "state",
    });
    const rehydrated = selectionsFromAnswers(answers);
    expect(rehydrated.workSel.parents).toEqual([]);
    expect(rehydrated.workSel.children).toEqual([childId("siding_windows_and_doors", "238150")]);
  });

  it("leftover stored NAICS not belonging to any stored trade become ad-hoc codes", () => {
    const answers = buildPreviewAnswers({
      workSel: EMPTY,
      locSel: EMPTY,
      saSel: EMPTY,
      serviceArea: "state",
      adhocNaics: ["541511"],
    });
    const rehydrated = selectionsFromAnswers(answers);
    expect(rehydrated.adhocNaics).toEqual(["541511"]);
    expect(rehydrated.workSel).toEqual(EMPTY);
  });

  it("round-trips set-aside whole-category and partial picks symmetrically", () => {
    // "WOSB" (the set-aside variant) is unique to the "wosb" category, unlike
    // "8A" which intentionally repeats across eight_a/alaska_native/tribally_owned
    // (see setAsideTaxonomy.ts) — using it keeps this round-trip unambiguous.
    const saSel: TreeSelection = {
      parents: ["sdvosb"],
      children: [childId("wosb", "WOSB")],
    };
    const answers = buildPreviewAnswers({
      workSel: EMPTY,
      locSel: EMPTY,
      saSel,
      serviceArea: "state",
    });
    const rehydrated = selectionsFromAnswers(answers);
    expect(rehydrated.saSel.parents).toEqual(["sdvosb"]);
    expect(rehydrated.saSel.children).toEqual([childId("wosb", "WOSB")]);
  });

  it("a code shared across multiple categories (e.g. '8A') rehydrates into every category that has it", () => {
    const saSel: TreeSelection = { parents: [], children: [childId("eight_a", "8A")] };
    const answers = buildPreviewAnswers({
      workSel: EMPTY,
      locSel: EMPTY,
      saSel,
      serviceArea: "state",
    });
    const rehydrated = selectionsFromAnswers(answers);
    // This is expected/correct: storage is code-based (setAsideCodes: ["8A"]),
    // and "8A" belongs to eight_a, alaska_native, and tribally_owned alike —
    // rehydration can't know which UI category the user originally clicked.
    expect(rehydrated.saSel.children.sort()).toEqual(
      [
        childId("eight_a", "8A"),
        childId("alaska_native", "8A"),
        childId("tribally_owned", "8A"),
      ].sort(),
    );
  });

  it("round-trips city + state + serviceArea for step 2", () => {
    const locSel: TreeSelection = { parents: ["SC"], children: [childId("NC", "Fayetteville")] };
    const answers = buildPreviewAnswers({
      workSel: EMPTY,
      locSel,
      saSel: EMPTY,
      serviceArea: "metro",
    });
    const rehydrated = selectionsFromAnswers(answers);
    expect(rehydrated.serviceArea).toBe("metro");
    expect(rehydrated.locSel.parents).toEqual(["SC"]);
    expect(rehydrated.locSel.children).toEqual([childId("NC", "Fayetteville")]);
  });

  it("national rung stores no states, so rehydration reconstructs step 2 from cities only", () => {
    const locSel: TreeSelection = { parents: [], children: [childId("NC", "Fayetteville")] };
    const answers = buildPreviewAnswers({
      workSel: EMPTY,
      locSel,
      saSel: EMPTY,
      serviceArea: "national",
    });
    expect(answers.states).toEqual([]);
    const rehydrated = selectionsFromAnswers(answers);
    expect(rehydrated.serviceArea).toBe("national");
    expect(rehydrated.locSel.children).toEqual([childId("NC", "Fayetteville")]);
  });

  it("handles a null-ish/empty answers blob without throwing (blank wizard)", () => {
    const rehydrated = selectionsFromAnswers(emptyPreviewAnswers());
    expect(rehydrated.workSel).toEqual(EMPTY);
    expect(rehydrated.locSel).toEqual(EMPTY);
    expect(rehydrated.saSel).toEqual(EMPTY);
    expect(rehydrated.serviceArea).toBe("");
    expect(rehydrated.adhocNaics).toEqual([]);
  });
});
