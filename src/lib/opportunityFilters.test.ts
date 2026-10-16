import type { Opportunity } from "./mock/opportunities";
import {
  emptyFilters,
  evaluateFilters,
  computeAvailableFacets,
  countActive,
  resolveNaicsSelection,
  applyWorkPickerChange,
  cityRowsToNodes,
} from "./opportunityFilters";
import { WORK_TYPE_TO_NAICS } from "./vocab/trades";

function makeOpp(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    noticeId: "n-1",
    title: "Re-roof barracks",
    agency: "USACE",
    workType: "Roofing",
    valueLow: 100_000,
    valueHigh: 200_000,
    location: "Fayetteville, NC",
    closesAt: new Date().toISOString(),
    matchTier: "strong",
    matchScore: 90,
    hunterReasoning: "",
    eligibility: "qualify",
    mode: "prime",
    scope: "fed",
    ...overrides,
  };
}

describe("evaluateFilters — PoP zip", () => {
  const opps = [
    makeOpp({ noticeId: "a", zip: "28301" }),
    makeOpp({ noticeId: "b", zip: "28542" }),
    makeOpp({ noticeId: "c", zip: undefined }),
  ];

  it("keeps only opps whose zip is selected", () => {
    const f = { ...emptyFilters(), popZips: ["28301"] };
    expect(evaluateFilters(f, opps).map((o) => o.noticeId)).toEqual(["a"]);
  });

  it("matches any selected zip (OR)", () => {
    const f = { ...emptyFilters(), popZips: ["28301", "28542"] };
    expect(evaluateFilters(f, opps).map((o) => o.noticeId)).toEqual(["a", "b"]);
  });

  it("excludes opps with no zip when a zip filter is active", () => {
    const f = { ...emptyFilters(), popZips: ["28301"] };
    expect(evaluateFilters(f, opps).some((o) => o.noticeId === "c")).toBe(false);
  });

  it("does nothing when no zip is selected", () => {
    expect(evaluateFilters(emptyFilters(), opps)).toHaveLength(3);
  });
});

describe("evaluateFilters — value range (valEst fields)", () => {
  // Live cards carry valEstLow/valEstHigh rather than the mock valueLow/valueHigh.
  const card = (valEstLow: number | null, valEstHigh: number | null) =>
    ({ ...makeOpp(), valueLow: undefined, valueHigh: undefined, valEstLow, valEstHigh }) as never;

  it("excludes opps whose high estimate is below the min", () => {
    const opps = [card(50_000, 100_000), card(300_000, 600_000)];
    const f = { ...emptyFilters(), valueRange: { min: 250_000, max: null } };
    expect(evaluateFilters(f, opps)).toHaveLength(1);
  });

  it("excludes opps whose low estimate is above the max", () => {
    const opps = [card(50_000, 100_000), card(2_000_000, 3_000_000)];
    const f = { ...emptyFilters(), valueRange: { min: null, max: 1_000_000 } };
    expect(evaluateFilters(f, opps)).toHaveLength(1);
  });

  it("treats a lone high estimate as a point value", () => {
    const opps = [card(null, 500_000)];
    expect(
      evaluateFilters({ ...emptyFilters(), valueRange: { min: 250_000, max: null } }, opps),
    ).toHaveLength(1);
    expect(
      evaluateFilters({ ...emptyFilters(), valueRange: { min: 600_000, max: null } }, opps),
    ).toHaveLength(0);
  });
});

describe("evaluateFilters — due window (daysUntilClose)", () => {
  // Live cards carry a precomputed daysUntilClose rather than an ISO closesAt.
  const card = (daysUntilClose: number) => ({ ...makeOpp(), daysUntilClose }) as never;

  it("keeps opps closing inside the selected window", () => {
    const opps = [card(3), card(45)];
    const f = { ...emptyFilters(), dueWindow: ["this_week"] };
    expect(evaluateFilters(f, opps)).toHaveLength(1);
  });

  it("excludes opps closing outside every selected window", () => {
    const opps = [card(45)];
    const f = { ...emptyFilters(), dueWindow: ["this_week", "2_weeks"] };
    expect(evaluateFilters(f, opps)).toHaveLength(0);
  });

  it('does nothing when the window is "any"', () => {
    const opps = [card(3), card(45), card(120)];
    expect(evaluateFilters(emptyFilters(), opps)).toHaveLength(3);
  });

  it("excludes already-closed opps (negative days) from closing-soon windows", () => {
    const opps = [card(-5)];
    const f = { ...emptyFilters(), dueWindow: ["this_week", "2_weeks", "30_days"] };
    expect(evaluateFilters(f, opps)).toHaveLength(0);
  });
});

describe("computeAvailableFacets — zips", () => {
  it("collects the distinct zips present in the opportunity set", () => {
    const facets = computeAvailableFacets([
      { title: "", workType: "", agency: "", location: "", zip: "28301" },
      { title: "", workType: "", agency: "", location: "", zip: "28301" },
      { title: "", workType: "", agency: "", location: "", zip: "28542" },
      { title: "", workType: "", agency: "", location: "" },
    ]);
    expect([...facets.zips].sort()).toEqual(["28301", "28542"]);
  });
});

describe("emptyFilters — new model fields", () => {
  it("initializes keyword, workTypes, excludedNaics and status with their defaults", () => {
    const f = emptyFilters();
    expect(f.keyword).toBe("");
    expect(f.workTypes).toEqual([]);
    expect(f.excludedNaics).toEqual([]);
    expect(f.status).toBe("active");
  });
});

describe("countActive — new model fields", () => {
  it("counts each selected work type", () => {
    expect(countActive({ ...emptyFilters(), workTypes: ["roofing"] })).toBe(1);
    expect(countActive({ ...emptyFilters(), workTypes: ["roofing", "concrete"] })).toBe(2);
  });

  it("does NOT count keyword — vestigial field, real search lives in state.searchValue", () => {
    expect(countActive({ ...emptyFilters(), keyword: "roof" })).toBe(0);
    expect(countActive({ ...emptyFilters(), keyword: "   " })).toBe(0);
  });

  it("counts status !== 'active' as 1", () => {
    expect(countActive({ ...emptyFilters(), status: "all" })).toBe(1);
    expect(countActive({ ...emptyFilters(), status: "active" })).toBe(0);
  });

  it("does NOT count excludedNaics", () => {
    expect(countActive({ ...emptyFilters(), excludedNaics: ["238160"] })).toBe(0);
    // Still 0 even when paired with the work type it's trimming (excludedNaics
    // itself contributes nothing; only workTypes.length counts here).
    expect(
      countActive({ ...emptyFilters(), workTypes: ["roofing"], excludedNaics: ["238160"] }),
    ).toBe(1);
  });

  it("baseline empty filters count to 0", () => {
    expect(countActive(emptyFilters())).toBe(0);
  });
});

describe("resolveNaicsSelection — WorkPicker trade→code resolution", () => {
  // Catalog-agnostic: derive expectations from the real WORK_TYPE_TO_NAICS so
  // these stay green when the trade catalog changes. Pick two trades with codes.
  const tradeIds = Object.keys(WORK_TYPE_TO_NAICS);
  const A = tradeIds.find((t) => WORK_TYPE_TO_NAICS[t].length >= 1)!;
  const B = tradeIds.find((t) => t !== A && WORK_TYPE_TO_NAICS[t].length >= 1)!;
  const AC = WORK_TYPE_TO_NAICS[A];
  const BC = WORK_TYPE_TO_NAICS[B];

  it("returns the union of NAICS codes across all selected trades", () => {
    const expected = [...new Set([...AC, ...BC])];
    expect(resolveNaicsSelection([A, B], []).sort()).toEqual(expected.sort());
  });

  it("de-duplicates codes shared by more than one selected trade", () => {
    // Selecting the same trade twice must not duplicate its codes.
    const codes = resolveNaicsSelection([A, A], []);
    expect(codes).toEqual([...new Set(AC)]);
  });

  it("subtracts excludedNaics from the resolved set (subtractive trim only)", () => {
    const [head, ...rest] = AC;
    expect(resolveNaicsSelection([A], [head]).sort()).toEqual(rest.sort());
  });

  it("excluding every code in a trade yields an empty array, not an error", () => {
    expect(resolveNaicsSelection([A], [...AC])).toEqual([]);
  });

  it("returns an empty array when no trades are selected", () => {
    expect(resolveNaicsSelection([], [AC[0]])).toEqual([]);
  });

  it("ignores exclusions for codes outside any selected trade", () => {
    expect(resolveNaicsSelection([A], ["000000"]).sort()).toEqual([...AC].sort());
  });
});

describe("applyWorkPickerChange — keeps filters.naics in sync with workTypes/excludedNaics", () => {
  const A = Object.keys(WORK_TYPE_TO_NAICS).find((t) => WORK_TYPE_TO_NAICS[t].length >= 1)!;
  const AC = WORK_TYPE_TO_NAICS[A];

  it("recomputes naics when workTypes changes", () => {
    const next = applyWorkPickerChange(emptyFilters(), { workTypes: [A] });
    expect(next.workTypes).toEqual([A]);
    expect(next.naics.sort()).toEqual([...AC].sort());
  });

  it("recomputes naics when excludedNaics changes, leaving workTypes untouched", () => {
    const base = applyWorkPickerChange(emptyFilters(), { workTypes: [A] });
    const [head, ...rest] = AC;
    const next = applyWorkPickerChange(base, { excludedNaics: [head] });
    expect(next.workTypes).toEqual([A]);
    expect(next.excludedNaics).toEqual([head]);
    expect(next.naics.sort()).toEqual(rest.sort());
  });

  it("does not clobber a Hunter-suggested naics value until WorkPicker itself is touched", () => {
    // applyHunterFilters (routes/index.tsx) writes filters.naics directly
    // without touching workTypes/excludedNaics — that value must survive
    // until the user actually interacts with WorkPicker again.
    const afterHunter = { ...emptyFilters(), naics: ["541330"] };
    expect(afterHunter.naics).toEqual(["541330"]);
    // Once WorkPicker fires (e.g. the user ticks a trade), naics is
    // recomputed from workTypes/excludedNaics as designed.
    const afterPicker = applyWorkPickerChange(afterHunter, { workTypes: [A] });
    expect(afterPicker.naics.sort()).toEqual([...AC].sort());
  });
});

describe("cityRowsToNodes — LocationPicker bare-city-id bridging", () => {
  it("uses the bare city name as both id and label (no 'City, ST' composite)", () => {
    expect(cityRowsToNodes([{ city: "Houston" }])).toEqual([{ id: "Houston", label: "Houston" }]);
  });

  it("maps every row from a fetchCities()-shaped response, ignoring extra fields like count", () => {
    const rows: { city: string; count: number }[] = [
      { city: "Austin", count: 12 },
      { city: "Dallas", count: 4 },
    ];
    const nodes = cityRowsToNodes(rows);
    expect(nodes).toEqual([
      { id: "Austin", label: "Austin" },
      { id: "Dallas", label: "Dallas" },
    ]);
  });

  it("returns an empty array for an empty input (state with no cities on file)", () => {
    expect(cityRowsToNodes([])).toEqual([]);
  });
});
