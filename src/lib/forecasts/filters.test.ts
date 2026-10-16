// Filters and Sort on the forecasts list. These cover the promises the menu makes:
// nothing is hidden until a choice is made, each count matches the list it would
// show, and a filtered list survives the trip through the URL.

import { describe, expect, it } from "vitest";
import { FORECASTS_TODAY, allForecasts, type ScoredForecast } from "./engine";
import { SCORED_FORECASTS } from "./__fixtures__/scored";
import { firmFromMember, scoreLive } from "./live";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import { valueRangeOverlaps } from "../opportunityFilters";
import {
  EMPTY_FILTERS,
  EXPECTED_WINDOWS,
  POSTED_WITHIN_CHOICES,
  SIZE_BUCKETS,
  WORK_KINDS,
  activeFilterCount,
  filtersFromSearch,
  matchesFilters,
  cityOptions,
  naicsOptions,
  optionCount,
  readFilterSearch,
  searchFromFilters,
  sizeOf,
  sortForecasts,
  stateOptions,
  workKindOf,
  type ForecastFilters,
} from "./filters";

const list = allForecasts(SCORED_FORECASTS);

describe("forecast filters", () => {
  it("hides nothing before a choice is made (D-C1)", () => {
    expect(list.filter((f) => matchesFilters(f, EMPTY_FILTERS))).toHaveLength(list.length);
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("puts every forecast in exactly one kind of work", () => {
    const total = WORK_KINDS.reduce((n, k) => n + optionCount(list, EMPTY_FILTERS, "work", k), 0);
    expect(total).toBe(list.length);
  });

  it("counts each option as the list it would show", () => {
    const filters: ForecastFilters = { ...EMPTY_FILTERS, work: ["food"], status: "open" };
    for (const size of SIZE_BUCKETS) {
      const shown = list.filter((f) => matchesFilters(f, { ...filters, size })).length;
      expect(optionCount(list, filters, "size", size)).toBe(shown);
    }
  });

  it("drops a forecast with no estimate once a size is chosen", () => {
    const noValue = list.find((f) => sizeOf(f) === null);
    expect(noValue).toBeDefined();
    for (const size of SIZE_BUCKETS.filter((s) => s !== "any")) {
      expect(matchesFilters(noValue!, { ...EMPTY_FILTERS, size })).toBe(false);
    }
  });

  it("keeps only the member's states when asked", () => {
    const served = list.filter((f) => matchesFilters(f, { ...EMPTY_FILTERS, place: "served" }));
    expect(served.length).toBeGreaterThan(0);
    expect(served.every((f) => f.inArea)).toBe(true);
  });

  it("counts one badge per question, not per pill", () => {
    const filters: ForecastFilters = {
      ...EMPTY_FILTERS,
      work: ["food", "building"],
      size: "1m_5m",
    };
    expect(activeFilterCount(filters)).toBe(2);
  });

  it("classifies the Charlotte lunches as food", () => {
    const charlotte = SCORED_FORECASTS.find((f) => f.id.includes("charlotte"));
    expect(charlotte && workKindOf(charlotte)).toBe("food");
  });
});

describe("forecast sort", () => {
  it("never adds or drops a forecast", () => {
    for (const sort of ["match", "soonest", "newest", "value"] as const) {
      expect(sortForecasts(list, sort)).toHaveLength(list.length);
    }
  });

  it("puts the biggest estimate first, and no estimate last", () => {
    const byValue = sortForecasts(list, "value");
    const top = (f: (typeof list)[number]) => f.record.valHigh ?? f.record.valLow ?? -1;
    for (let i = 1; i < byValue.length; i++) {
      expect(top(byValue[i - 1])).toBeGreaterThanOrEqual(top(byValue[i]));
    }
  });

  it("puts the soonest bid request first", () => {
    const soonest = sortForecasts(list, "soonest");
    const days = soonest.map((f) => f.timing.runwayDays ?? Infinity);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });
});

describe("filters in the URL", () => {
  it("round-trips every choice", () => {
    const filters: ForecastFilters = {
      work: ["food", "sites"],
      place: "served",
      who: ["undecided"],
      size: "250k_1m",
      bought: "again",
      status: "open",
      expected: ["this_week", "60_plus"],
      valueMin: 500_000,
      valueMax: 2_000_000,
      states: ["TX", "OK"],
      cities: ["Houston", "Dallas"],
      naics: ["238160", "2381"],
      postedWithin: 45,
    };
    const search = readFilterSearch({ ...searchFromFilters(filters) });
    expect(filtersFromSearch(search)).toEqual(filters);
  });

  it("ignores values it does not know, and leaves defaults out of the URL", () => {
    const search = readFilterSearch({ work: "food,nonsense", size: "huge", sort: "match" });
    expect(search.work).toBe("food");
    expect(search.size).toBeUndefined();
    expect(search.sort).toBeUndefined();
    expect(searchFromFilters(EMPTY_FILTERS)).toEqual({
      work: undefined,
      place: undefined,
      who: undefined,
      size: undefined,
      bought: undefined,
      status: undefined,
      expected: undefined,
      valueMin: undefined,
      valueMax: undefined,
      states: undefined,
      cities: undefined,
      naics: undefined,
      posted: undefined,
    });
  });

  it("writes the expected windows as one list and drops a window it does not know", () => {
    const search = readFilterSearch({ expected: "this_week,soon,30_days" });
    expect(search.expected).toBe("this_week,30_days");
    expect(filtersFromSearch(search).expected).toEqual(["this_week", "30_days"]);
    expect(readFilterSearch({ expected: "nonsense" }).expected).toBeUndefined();
  });
});

// ── Feature 6: the expected posting date ─────────────────────────────────────────

const ATLANTA = HIGHERGOV_FORECASTS.find((r) => r.id === "fed-detainee-meals-atlanta")!;
const FIRM = firmFromMember({
  naics: ["722310"],
  states: ["GA"],
  certs: [],
  certsKnown: true,
  isSmall: true,
  registration: { status: "active", endsOn: "2028-01-31" },
  biggestPastJob: 3_000_000,
  smallestTarget: null,
  businessName: "Peach State Meals LLC",
  address: "1 Peachtree St, Atlanta, GA 30303",
});

/** A live forecast whose buyer expects to post it on `dueOn`. */
function expectedOn(dueOn: string | null): ScoredForecast {
  return scoreLive(
    {
      ...ATLANTA,
      id: ATLANTA.oppKey,
      dueOn,
      hunter: { plainTitle: "Boxed meals, Atlanta", semanticFit: 0.85, categoryFit: null },
    },
    FIRM,
  );
}

/** A forecast whose expected date is `days` days from today, whatever the calendar. */
function daysOut(days: number | null): ScoredForecast {
  const base = expectedOn("2026-09-23");
  return { ...base, timing: { ...base.timing, runwayDays: days } };
}

/** The windows a forecast passes, one filter at a time. */
function windowsOf(f: ScoredForecast): string[] {
  return EXPECTED_WINDOWS.filter((w) => matchesFilters(f, { ...EMPTY_FILTERS, expected: [w] }));
}

describe("expected posting date window", () => {
  it("counts from FORECASTS_TODAY", () => {
    expect(FORECASTS_TODAY).toBe("2026-09-16");
    expect(expectedOn("2026-09-23").timing.runwayDays).toBe(7);
  });

  it("puts each boundary day in the windows the feed's dueBucket gives it", () => {
    // Exact dates read from dueOn. None falls on the first or last day of a month,
    // because the engine reads those as a whole month.
    expect(windowsOf(expectedOn("2026-09-16"))).toEqual(["this_week", "2_weeks", "30_days"]);
    expect(windowsOf(expectedOn("2026-09-23"))).toEqual(["this_week", "2_weeks", "30_days"]);
    expect(windowsOf(expectedOn("2026-09-24"))).toEqual(["2_weeks", "30_days"]);
    expect(windowsOf(expectedOn("2026-10-16"))).toEqual(["30_days"]);
    expect(windowsOf(expectedOn("2026-10-17"))).toEqual([]);
    expect(windowsOf(expectedOn("2026-11-14"))).toEqual([]);
    expect(windowsOf(expectedOn("2026-11-15"))).toEqual(["60_plus"]);
    // Day 14 (30 September) and day 15 (1 October) fall on month ends.
    expect(windowsOf(daysOut(14))).toEqual(["2_weeks", "30_days"]);
    expect(windowsOf(daysOut(15))).toEqual(["30_days"]);
  });

  it("drops a forecast with no expected date only while a window is chosen", () => {
    const noDate = expectedOn(null);
    expect(noDate.timing.runwayDays).toBeNull();
    expect(matchesFilters(noDate, EMPTY_FILTERS)).toBe(true);
    expect(windowsOf(noDate)).toEqual([]);
    expect(windowsOf(daysOut(null))).toEqual([]);
  });

  it("keeps a forecast in any one of the chosen windows", () => {
    const filters: ForecastFilters = { ...EMPTY_FILTERS, expected: ["this_week", "60_plus"] };
    expect(matchesFilters(daysOut(3), filters)).toBe(true);
    expect(matchesFilters(daysOut(90), filters)).toBe(true);
    expect(matchesFilters(daysOut(20), filters)).toBe(false);
  });

  it("counts each window as the list it would show, and as one badge", () => {
    const sample = [0, 7, 8, 14, 30, 45, 60, 120, null].map(daysOut);
    const filters: ForecastFilters = { ...EMPTY_FILTERS, expected: ["2_weeks"] };
    for (const w of EXPECTED_WINDOWS) {
      const shown = sample.filter((f) => matchesFilters(f, { ...filters, expected: [w] })).length;
      expect(optionCount(sample, filters, "expected", w)).toBe(shown);
    }
    expect(activeFilterCount({ ...EMPTY_FILTERS, expected: ["this_week", "30_days"] })).toBe(1);
  });
});

// ── Feature 7: the exact value range ────────────────────────────────────────────

/** A forecast whose buyer estimate is `valLow` to `valHigh`. */
function estimate(valLow: number | null, valHigh: number | null): ScoredForecast {
  const base = list[0];
  return { ...base, record: { ...base.record, valLow, valHigh } };
}

/** True when the value range alone keeps the forecast. */
function inRange(f: ScoredForecast, valueMin: number | null, valueMax: number | null): boolean {
  return matchesFilters(f, { ...EMPTY_FILTERS, valueMin, valueMax });
}

describe("exact value range", () => {
  // The rule is the feed's `valueRangeOverlaps` (lib/opportunityFilters.ts), which
  // `evaluateFilters` also calls. The forecast list adds one thing: while a bound is
  // set, a forecast with no estimate is not shown, as the `size` filter does.
  const job = estimate(400_000, 900_000);

  it("uses the same overlap rule as the opportunities feed", () => {
    const cases: [number | null, number | null][] = [
      [null, 300_000],
      [500_000, null],
      [950_000, 2_000_000],
      [100_000, 399_999],
      [900_000, 900_000],
    ];
    for (const [min, max] of cases) {
      expect(inRange(job, min, max)).toBe(valueRangeOverlaps({ min, max }, 400_000, 900_000));
    }
  });

  it("with a minimum only, keeps an estimate whose top reaches the minimum", () => {
    expect(inRange(job, 900_000, null)).toBe(true);
    expect(inRange(job, 900_001, null)).toBe(false);
    expect(inRange(job, 0, null)).toBe(true);
  });

  it("with a maximum only, keeps an estimate whose bottom is not above the maximum", () => {
    expect(inRange(job, null, 400_000)).toBe(true);
    expect(inRange(job, null, 399_999)).toBe(false);
  });

  it("with both bounds, keeps an estimate that overlaps the range", () => {
    expect(inRange(job, 100_000, 500_000)).toBe(true);
    expect(inRange(job, 800_000, 5_000_000)).toBe(true);
    expect(inRange(job, 500_000, 600_000)).toBe(true);
    expect(inRange(job, 1_000_000, 2_000_000)).toBe(false);
    expect(inRange(job, 100_000, 399_999)).toBe(false);
  });

  it("reads an estimate with only a low value as that one value", () => {
    const lowOnly = estimate(750_000, null);
    expect(inRange(lowOnly, 500_000, 1_000_000)).toBe(true);
    expect(inRange(lowOnly, 800_000, null)).toBe(false);
    expect(inRange(lowOnly, null, 700_000)).toBe(false);
    expect(valueRangeOverlaps({ min: 800_000, max: null }, 750_000, null)).toBe(false);
  });

  it("drops a forecast with no estimate only while a bound is set", () => {
    const none = estimate(null, null);
    expect(inRange(none, null, null)).toBe(true);
    expect(inRange(none, 1, null)).toBe(false);
    expect(inRange(none, null, 10_000_000)).toBe(false);
    // The feed keeps a record with no value. The forecast list does not.
    expect(valueRangeOverlaps({ min: 1, max: null }, null, null)).toBe(true);
  });

  it("applies together with the size filter", () => {
    const filters: ForecastFilters = { ...EMPTY_FILTERS, size: "250k_1m", valueMin: 950_000 };
    expect(matchesFilters(estimate(400_000, 1_000_000), filters)).toBe(true);
    expect(matchesFilters(estimate(400_000, 900_000), filters)).toBe(false);
    expect(matchesFilters(estimate(2_000_000, 3_000_000), filters)).toBe(false);
  });

  it("counts the range as one filter, and null as any", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, valueMin: 0 })).toBe(1);
    expect(activeFilterCount({ ...EMPTY_FILTERS, valueMax: 5 })).toBe(1);
    expect(activeFilterCount({ ...EMPTY_FILTERS, valueMin: 1, valueMax: 5 })).toBe(1);
  });

  it("reads whole dollars from the URL and drops anything else", () => {
    const search = readFilterSearch({ valueMin: "500000", valueMax: 2000000 });
    expect(search).toMatchObject({ valueMin: 500_000, valueMax: 2_000_000 });
    expect(filtersFromSearch(search)).toMatchObject({ valueMin: 500_000, valueMax: 2_000_000 });
    for (const bad of ["-5", "1.5", "abc", "", -5, 1.5, Number.NaN, null]) {
      const read = readFilterSearch({ valueMin: bad, valueMax: bad });
      expect(read.valueMin).toBeUndefined();
      expect(read.valueMax).toBeUndefined();
    }
    expect(readFilterSearch({ valueMin: 0 }).valueMin).toBe(0);
    const min = { ...EMPTY_FILTERS, valueMin: 250_000 };
    expect(filtersFromSearch(readFilterSearch({ ...searchFromFilters(min) }))).toEqual(min);
  });
});

// ── Feature 8: states and cities ────────────────────────────────────────────────

/** A forecast whose record names this place. */
function placedAt(popState: string | null, popCity: string | null): ScoredForecast {
  const base = list[0];
  return { ...base, record: { ...base.record, popState, popCity } };
}

const HOUSTON = placedAt("TX", "Houston");
const DALLAS = placedAt("Texas", "DALLAS");
const TULSA = placedAt("OK", "Tulsa");
const SPRINGFIELD_IL = placedAt("IL", "Springfield");
const SPRINGFIELD_MO = placedAt("MO", "Springfield");
const NOWHERE = placedAt(null, null);
const PLACES = [HOUSTON, DALLAS, TULSA, SPRINGFIELD_IL, SPRINGFIELD_MO, NOWHERE];

/** The forecasts that the states and cities keep. */
function keptBy(states: string[], cities: string[]): ScoredForecast[] {
  return PLACES.filter((f) => matchesFilters(f, { ...EMPTY_FILTERS, states, cities }));
}

describe("states and cities", () => {
  it("keeps one state by its USPS code, whether the record sends the code or the name", () => {
    expect(keptBy(["TX"], [])).toEqual([HOUSTON, DALLAS]);
  });

  it("keeps any one of two states", () => {
    expect(keptBy(["TX", "OK"], [])).toEqual([HOUSTON, DALLAS, TULSA]);
  });

  it("keeps a city by its name, with no attention to capital letters", () => {
    expect(keptBy([], ["dallas"])).toEqual([DALLAS]);
    expect(keptBy([], ["Springfield"])).toEqual([SPRINGFIELD_IL, SPRINGFIELD_MO]);
  });

  it("keeps a city only inside a chosen state when states are also set", () => {
    expect(keptBy(["IL"], ["Springfield"])).toEqual([SPRINGFIELD_IL]);
    expect(keptBy(["TX"], ["Tulsa"])).toEqual([]);
    expect(keptBy(["TX", "OK"], ["Houston", "Tulsa"])).toEqual([HOUSTON, TULSA]);
  });

  it("drops a forecast with no place only while a state or a city is chosen", () => {
    expect(matchesFilters(NOWHERE, EMPTY_FILTERS)).toBe(true);
    expect(keptBy(["TX"], [])).not.toContain(NOWHERE);
    expect(keptBy([], ["Houston"])).not.toContain(NOWHERE);
    const stateOnly = placedAt("TX", null);
    expect(matchesFilters(stateOnly, { ...EMPTY_FILTERS, states: ["TX"] })).toBe(true);
    expect(matchesFilters(stateOnly, { ...EMPTY_FILTERS, cities: ["Houston"] })).toBe(false);
    // A city value that names no place is no city.
    const tbd = placedAt("TX", "TBD");
    expect(matchesFilters(tbd, { ...EMPTY_FILTERS, cities: ["TBD"] })).toBe(false);
  });

  it("applies together with the member's own states", () => {
    const served = { ...HOUSTON, inArea: true };
    const notServed = { ...DALLAS, inArea: false };
    const filters: ForecastFilters = { ...EMPTY_FILTERS, place: "served", states: ["TX"] };
    expect(matchesFilters(served, filters)).toBe(true);
    expect(matchesFilters(notServed, filters)).toBe(false);
  });

  it("counts states and cities as two badges", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, states: ["TX", "OK"] })).toBe(1);
    expect(activeFilterCount({ ...EMPTY_FILTERS, states: ["TX"], cities: ["Houston"] })).toBe(2);
  });

  it("offers the states and cities on the list, each counted as the list it would show", () => {
    const filters: ForecastFilters = { ...EMPTY_FILTERS, states: ["TX"] };
    const states = stateOptions(PLACES, filters);
    expect(states.map((o) => o.code)).toEqual(["IL", "MO", "OK", "TX"]);
    for (const o of states) {
      expect(o.count).toBe(optionCount(PLACES, filters, "states", o.code));
    }
    // With TX chosen, only the Texas cities are offered.
    const cities = cityOptions(PLACES, filters);
    expect(cities.map((o) => o.name)).toEqual(["DALLAS", "Houston"]);
    expect(cities.map((o) => o.count)).toEqual([1, 1]);
    // With no state chosen, every named city is offered once.
    expect(cityOptions(PLACES, EMPTY_FILTERS).map((o) => o.name)).toEqual([
      "DALLAS",
      "Houston",
      "Springfield",
      "Tulsa",
    ]);
  });

  it("keeps a chosen state or city in the options when no forecast holds it", () => {
    const filters: ForecastFilters = { ...EMPTY_FILTERS, states: ["WY"], cities: ["Casper"] };
    expect(stateOptions(PLACES, filters).find((o) => o.code === "WY")?.count).toBe(0);
    expect(cityOptions(PLACES, filters)).toEqual([{ name: "Casper", count: 0 }]);
  });

  it("reads USPS codes and plain city names from the URL", () => {
    const search = readFilterSearch({
      states: "TX,ok,Texas,Narnia",
      cities: "Houston, dallas ,,houston",
    });
    expect(search.states).toBe("TX,OK");
    expect(search.cities).toBe("Houston,dallas");
    expect(filtersFromSearch(search)).toMatchObject({
      states: ["TX", "OK"],
      cities: ["Houston", "dallas"],
    });
    expect(readFilterSearch({ states: "Narnia", cities: " , " })).toMatchObject({
      states: undefined,
      cities: undefined,
    });
    const both = { ...EMPTY_FILTERS, states: ["TX"], cities: ["Houston"] };
    expect(filtersFromSearch(readFilterSearch({ ...searchFromFilters(both) }))).toEqual(both);
  });
});

// ── Feature 9: NAICS codes ──────────────────────────────────────────────────────

/** A forecast whose record carries this industry code. */
function codedAs(naicsCode: string | null): ScoredForecast {
  const base = list[0];
  return { ...base, record: { ...base.record, naicsCode } };
}

const ROOFING = codedAs("238160");
const HOUSING = codedAs("236220");
const ROOFING_GROUP = codedAs("2381");
const CATERING = codedAs("722320");
const UNCODED = codedAs(null);
const CODED = [ROOFING, HOUSING, ROOFING_GROUP, CATERING, UNCODED];

/** The forecasts that the chosen NAICS codes keep. */
const keptByNaics = (naics: string[]): ScoredForecast[] =>
  CODED.filter((f) => matchesFilters(f, { ...EMPTY_FILTERS, naics }));

describe("NAICS codes", () => {
  it("keeps one code by exact match", () => {
    expect(keptByNaics(["238160"])).toEqual([ROOFING]);
  });

  it("keeps any one of two codes", () => {
    expect(keptByNaics(["238160", "236220"])).toEqual([ROOFING, HOUSING]);
  });

  it("never treats a code as a prefix, in either direction", () => {
    expect(keptByNaics(["2381"])).toEqual([ROOFING_GROUP]);
    expect(keptByNaics(["238160"])).not.toContain(ROOFING_GROUP);
    expect(keptByNaics(["23816"])).toEqual([]);
  });

  it("drops a forecast with no code only while a code is chosen", () => {
    expect(matchesFilters(UNCODED, EMPTY_FILTERS)).toBe(true);
    expect(keptByNaics(["238160"])).not.toContain(UNCODED);
  });

  it("applies together with the kind of work", () => {
    const building: ForecastFilters = { ...EMPTY_FILTERS, work: ["building"], naics: ["238160"] };
    expect(matchesFilters(ROOFING, building)).toBe(true);
    const food: ForecastFilters = { ...EMPTY_FILTERS, work: ["food"], naics: ["238160"] };
    expect(matchesFilters(ROOFING, food)).toBe(false);
  });

  it("counts the codes as one badge", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, naics: ["238160", "236220"] })).toBe(1);
  });

  it("offers the codes on the list and the chosen ones, each counted as the list it would show", () => {
    const filters: ForecastFilters = { ...EMPTY_FILTERS, naics: ["541330"] };
    const options = naicsOptions(CODED, filters);
    expect(options.map((o) => o.code)).toEqual(["236220", "2381", "238160", "541330", "722320"]);
    for (const o of options) {
      expect(o.count).toBe(optionCount(CODED, filters, "naics", o.code));
    }
    expect(options.find((o) => o.code === "541330")?.count).toBe(0);
  });

  it("reads only 2 to 6 digit codes from the URL, each once", () => {
    const search = readFilterSearch({ naics: "238160, 2381,238160,1,1234567,23816a,,54" });
    expect(search.naics).toBe("238160,2381,54");
    expect(filtersFromSearch(search).naics).toEqual(["238160", "2381", "54"]);
    expect(readFilterSearch({ naics: "roofing" }).naics).toBeUndefined();
    // The router reads a hand-typed `naics=238160` as a number.
    expect(readFilterSearch({ naics: 238160 }).naics).toBe("238160");
    expect(readFilterSearch({ naics: 1234567 }).naics).toBeUndefined();
    const chosen = { ...EMPTY_FILTERS, naics: ["238160", "236220"] };
    expect(searchFromFilters(chosen).naics).toBe("238160,236220");
    expect(filtersFromSearch(readFilterSearch({ ...searchFromFilters(chosen) }))).toEqual(chosen);
  });
});

// ── Feature 10: posted within N days ────────────────────────────────────────────

/** A forecast whose buyer published the record on `postedOn`. */
function postedAt(postedOn: string | null): ScoredForecast {
  const base = list[0];
  return { ...base, record: { ...base.record, postedOn } };
}

/** True when the forecast passes "posted in the last `days` days" alone. */
const postedWithin = (f: ScoredForecast, days: number | null): boolean =>
  matchesFilters(f, { ...EMPTY_FILTERS, postedWithin: days });

describe("posted within N days", () => {
  it("counts from FORECASTS_TODAY", () => {
    expect(FORECASTS_TODAY).toBe("2026-09-16");
  });

  it("keeps a record posted on the boundary day, today minus N", () => {
    expect(postedWithin(postedAt("2026-08-17"), 30)).toBe(true);
    expect(postedWithin(postedAt("2026-09-09"), 7)).toBe(true);
  });

  it("drops a record posted one day before the boundary", () => {
    expect(postedWithin(postedAt("2026-08-16"), 30)).toBe(false);
    expect(postedWithin(postedAt("2026-09-08"), 7)).toBe(false);
  });

  it("keeps a record posted today, and reads a full timestamp by its day", () => {
    expect(postedWithin(postedAt("2026-09-16"), 7)).toBe(true);
    expect(postedWithin(postedAt("2026-08-17T23:59:00Z"), 30)).toBe(true);
  });

  it("drops a record posted after FORECASTS_TODAY, as the feed does", () => {
    expect(postedWithin(postedAt("2026-09-17"), 30)).toBe(false);
    expect(postedWithin(postedAt("2026-09-17"), null)).toBe(true);
  });

  it("drops a record with no posted date only while the filter is set", () => {
    const unposted = postedAt(null);
    expect(postedWithin(unposted, null)).toBe(true);
    expect(postedWithin(unposted, 90)).toBe(false);
  });

  it("counts as one badge, and null counts as any", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, postedWithin: 30 })).toBe(1);
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it("counts each preset choice as the list it would show", () => {
    const dated = ["2026-09-15", "2026-09-01", "2026-07-01", null].map(postedAt);
    for (const days of POSTED_WITHIN_CHOICES) {
      const shown = dated.filter((f) => postedWithin(f, days)).length;
      expect(optionCount(dated, EMPTY_FILTERS, "postedWithin", days)).toBe(shown);
    }
  });

  it("reads any positive whole number of days from the URL, as text or as a number", () => {
    expect(readFilterSearch({ posted: "30" }).posted).toBe(30);
    // The router reads a hand-typed `posted=45` as a number.
    expect(readFilterSearch({ posted: 45 }).posted).toBe(45);
    expect(filtersFromSearch(readFilterSearch({ posted: 45 })).postedWithin).toBe(45);
    for (const bad of ["0", "-3", "1.5", "30d", "", 0, -3, 1.5, null]) {
      expect(readFilterSearch({ posted: bad }).posted).toBeUndefined();
    }
    expect(filtersFromSearch(readFilterSearch({})).postedWithin).toBeNull();
    const chosen = { ...EMPTY_FILTERS, postedWithin: 21 };
    expect(searchFromFilters(chosen).posted).toBe(21);
    expect(filtersFromSearch(readFilterSearch({ ...searchFromFilters(chosen) }))).toEqual(chosen);
  });
});
