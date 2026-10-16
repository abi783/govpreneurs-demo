import { describe, expect, it } from "vitest";
import type { DiscoveryPayload, HunterFilterDelta } from "../hunterChat";
import { HUNTER_FILTER_NOTE } from "./copy";
import {
  applyHunterDiscovery,
  appliedHunterFilters,
  clearedForecastSearch,
  forecastSearchForTab,
  type UnsupportedFilter,
} from "./hunterFilters";
import type { ForecastsSearch } from "./search";

const discovery = (filters: HunterFilterDelta, fresh?: boolean): DiscoveryPayload => ({
  filters,
  note: null,
  fresh,
});

/** A search that holds a value in every key the page keeps in its URL. */
const FULL: ForecastsSearch = {
  view: "all",
  tab: "act_now",
  lane: "federal",
  q: "roof",
  work: "building",
  place: "served",
  who: "small",
  size: "1m_5m",
  bought: "again",
  status: "open",
  sort: "soonest",
};

describe("applyHunterDiscovery: filters the list can express", () => {
  it("maps search onto q and keeps every other key", () => {
    const r = applyHunterDiscovery(discovery({ search: "paving" }), FULL);
    expect(r.search).toEqual({ ...FULL, q: "paving" });
    expect(r.unsupported).toEqual([]);
  });

  it("clears q when search is an empty string", () => {
    const r = applyHunterDiscovery(discovery({ search: "" }), FULL);
    expect(r.search).toEqual({ ...FULL, q: undefined });
  });

  it("maps a federal-only scope onto lane federal", () => {
    const r = applyHunterDiscovery(discovery({ scope: { fed: true, sled: false } }), {});
    expect(r.search.lane).toBe("federal");
    expect(r.unsupported).toEqual([]);
  });

  it("maps a state-and-local-only scope onto lane sled", () => {
    const r = applyHunterDiscovery(discovery({ scope: { fed: false, sled: true } }), {});
    expect(r.search.lane).toBe("sled");
  });

  it("removes the lane when both scopes are on", () => {
    const r = applyHunterDiscovery(discovery({ scope: { fed: true, sled: true } }), FULL);
    expect(r.search.lane).toBeUndefined();
  });

  it("changes nothing and reports nothing when both scopes are off", () => {
    const r = applyHunterDiscovery(discovery({ scope: { fed: false, sled: false } }), FULL);
    expect(r.search).toEqual(FULL);
    expect(r.unsupported).toEqual([]);
  });

  it("treats categories ['forecast'] as satisfied and does not report it", () => {
    const r = applyHunterDiscovery(discovery({ categories: ["forecast"] }), FULL);
    expect(r.search).toEqual(FULL);
    expect(r.unsupported).toEqual([]);
  });

  it("does not change the current search when the delta is empty", () => {
    const r = applyHunterDiscovery(discovery({}), FULL);
    expect(r.search).toEqual(FULL);
    expect(r.unsupported).toEqual([]);
  });

  it("does not change the current search object", () => {
    const current = { ...FULL };
    applyHunterDiscovery(discovery({ search: "x" }, true), current);
    expect(current).toEqual(FULL);
  });
});

describe("applyHunterDiscovery: fresh", () => {
  it("resets q, lane, tab and every drawer filter, and keeps view and sort", () => {
    const r = applyHunterDiscovery(discovery({}, true), FULL);
    expect(r.search).toEqual({ view: "all", sort: "soonest" });
  });

  it("applies the delta after the reset", () => {
    const r = applyHunterDiscovery(
      discovery({ search: "fence", scope: { fed: false, sled: true } }, true),
      FULL,
    );
    expect(r.search).toEqual({ view: "all", sort: "soonest", q: "fence", lane: "sled" });
  });

  it("still reports what it cannot express after the reset", () => {
    const r = applyHunterDiscovery(discovery({ vehicles: ["idiq"] }, true), FULL);
    expect(r.search).toEqual({ view: "all", sort: "soonest" });
    expect(r.unsupported).toEqual([{ key: "vehicles", value: ["idiq"] }]);
  });

  it("drops the filters the reset removed and applies the new ones", () => {
    const r = applyHunterDiscovery(discovery({ naics: ["236220"] }, true), {
      ...FULL,
      states: "TX",
      expected: "this_week",
    });
    expect(r.search).toEqual({ view: "all", sort: "soonest", naics: "236220" });
  });
});

describe("applyHunterDiscovery: filters the list cannot express", () => {
  const every: HunterFilterDelta = {
    setAsides: ["SB", "8A"],
    noticeTypes: ["rfp"],
    categories: ["forecast", "contract", "grant"],
    vehicles: ["idiq"],
    dodOnly: true,
    civilianOnly: true,
  };

  it("reports every one with its values, in the fixed key order", () => {
    const r = applyHunterDiscovery(discovery(every), FULL);
    const expected: UnsupportedFilter[] = [
      { key: "setAsides", value: ["SB", "8A"] },
      { key: "noticeTypes", value: ["rfp"] },
      { key: "categories", value: ["contract", "grant"] },
      { key: "vehicles", value: ["idiq"] },
      { key: "dodOnly", value: true },
      { key: "civilianOnly", value: true },
    ];
    expect(r.unsupported).toEqual(expected);
  });

  it("leaves the search unchanged for filters it only reports", () => {
    const r = applyHunterDiscovery(discovery(every), FULL);
    expect(r.search).toEqual(FULL);
  });

  it("reports each key the same way when it comes alone", () => {
    for (const [key, value] of Object.entries(every)) {
      const r = applyHunterDiscovery(discovery({ [key]: value }), {});
      const reported = key === "categories" ? ["contract", "grant"] : value;
      expect(r.unsupported).toEqual([{ key, value: reported }]);
    }
  });

  it("does not report a value that sets no filter", () => {
    const r = applyHunterDiscovery(
      discovery({
        noticeTypes: [],
        vehicles: [],
        dodOnly: false,
        civilianOnly: false,
      }),
      FULL,
    );
    expect(r.unsupported).toEqual([]);
    expect(r.search).toEqual(FULL);
  });
});

describe("applyHunterDiscovery: filters the list applies (feature 12)", () => {
  it("maps dueWindow onto expected, in the same ids", () => {
    const r = applyHunterDiscovery(discovery({ dueWindow: ["this_week", "60_plus"] }), FULL);
    expect(r.search).toEqual({ ...FULL, expected: "this_week,60_plus" });
    expect(r.unsupported).toEqual([]);
  });

  it("applies the known windows and reports an unknown one", () => {
    const r = applyHunterDiscovery(discovery({ dueWindow: ["30_days", "next_year"] }), {});
    expect(r.search).toEqual({ expected: "30_days" });
    expect(r.unsupported).toEqual([{ key: "dueWindow", value: ["next_year"] }]);
  });

  it("maps valueRange onto valueMin and valueMax, in whole dollars", () => {
    const r = applyHunterDiscovery(
      discovery({ valueRange: { min: 500_000, max: 2_000_000.4 } }),
      {},
    );
    expect(r.search).toEqual({ valueMin: 500_000, valueMax: 2_000_000 });
    expect(r.unsupported).toEqual([]);
  });

  it("sets one bound and clears the other for a one-sided range", () => {
    const r = applyHunterDiscovery(discovery({ valueRange: { min: null, max: 250_000 } }), {
      valueMin: 10,
      valueMax: 99,
    });
    expect(r.search).toEqual({ valueMin: undefined, valueMax: 250_000 });
  });

  it("reports a range with a bound that is not a dollar amount, and applies none", () => {
    const range = { min: -5, max: 100 };
    const r = applyHunterDiscovery(discovery({ valueRange: range }), { valueMax: 7 });
    expect(r.search).toEqual({ valueMax: 7 });
    expect(r.unsupported).toEqual([{ key: "valueRange", value: range }]);
  });

  it("clears both bounds for a range with no bound, and reports nothing", () => {
    const r = applyHunterDiscovery(discovery({ valueRange: { min: null, max: null } }), {
      valueMin: 1,
      valueMax: 2,
    });
    expect(r.search).toEqual({ valueMin: undefined, valueMax: undefined });
    expect(r.unsupported).toEqual([]);
  });

  it("maps states onto USPS codes, each once", () => {
    const r = applyHunterDiscovery(discovery({ states: ["TX", "Oklahoma", "tx"] }), {});
    expect(r.search).toEqual({ states: "TX,OK" });
    expect(r.unsupported).toEqual([]);
  });

  it("applies the real states and reports a value that is not a state", () => {
    const r = applyHunterDiscovery(discovery({ states: ["TX", "Narnia"] }), {});
    expect(r.search).toEqual({ states: "TX" });
    expect(r.unsupported).toEqual([{ key: "states", value: ["Narnia"] }]);
  });

  it("reports cities and does not write them, because most forecasts carry no city", () => {
    const r = applyHunterDiscovery(discovery({ cities: ["Charlotte"] }), {});
    expect(r.search).toEqual({});
    expect(r.unsupported).toEqual([{ key: "cities", value: ["Charlotte"] }]);
  });

  it("keeps the city that the member picked in the drawer", () => {
    const r = applyHunterDiscovery(discovery({ cities: ["Charlotte"], states: ["NC"] }), {
      cities: "Raleigh",
    });
    expect(r.search).toEqual({ cities: "Raleigh", states: "NC" });
    expect(r.unsupported).toEqual([{ key: "cities", value: ["Charlotte"] }]);
  });

  it("maps naics onto exact codes and reports a value that is not a code", () => {
    const r = applyHunterDiscovery(discovery({ naics: ["238160", "roofing", "236220"] }), {});
    expect(r.search).toEqual({ naics: "238160,236220" });
    expect(r.unsupported).toEqual([{ key: "naics", value: ["roofing"] }]);
  });

  it("maps postedWithin onto posted", () => {
    const r = applyHunterDiscovery(discovery({ postedWithin: 30 }), {});
    expect(r.search).toEqual({ posted: 30 });
    expect(r.unsupported).toEqual([]);
  });

  it("reports a postedWithin that is not a positive whole number of days", () => {
    for (const days of [0, -3, 2.5]) {
      const r = applyHunterDiscovery(discovery({ postedWithin: days }), { posted: 7 });
      expect(r.search).toEqual({ posted: 7 });
      expect(r.unsupported).toEqual([{ key: "postedWithin", value: days }]);
    }
  });

  it("replaces the value already in the search, as the feed does", () => {
    const r = applyHunterDiscovery(discovery({ states: ["OK"], naics: ["236220"] }), {
      states: "TX,NM",
      naics: "722310",
      q: "roof",
    });
    expect(r.search).toEqual({ states: "OK", naics: "236220", q: "roof" });
  });

  it("clears a filter when Hunter sends an empty list, and keeps the drawer's city", () => {
    const r = applyHunterDiscovery(discovery({ states: [], cities: [], naics: [] }), {
      states: "TX",
      cities: "Houston",
      naics: "236220",
      expected: "30_days",
    });
    expect(r.search).toEqual({
      states: undefined,
      cities: "Houston",
      naics: undefined,
      expected: "30_days",
    });
    expect(r.unsupported).toEqual([]);
  });

  it("applies every mappable filter at once and reports only the rest", () => {
    const r = applyHunterDiscovery(
      discovery({
        states: ["TX"],
        cities: ["Houston"],
        setAsides: ["SB"],
        valueRange: { min: 500_000, max: 2_000_000 },
        dueWindow: ["30_days"],
        naics: ["238160"],
        postedWithin: 30,
        noticeTypes: ["rfp"],
        vehicles: ["idiq"],
      }),
      {},
    );
    expect(r.search).toEqual({
      states: "TX",
      who: "small",
      valueMin: 500_000,
      valueMax: 2_000_000,
      expected: "30_days",
      naics: "238160",
      posted: 30,
    });
    expect(r.unsupported).toEqual([
      { key: "cities", value: ["Houston"] },
      { key: "noticeTypes", value: ["rfp"] },
      { key: "vehicles", value: ["idiq"] },
    ]);
  });

  it("does not change the payload it reads", () => {
    const filters: HunterFilterDelta = {
      states: ["Texas", "Narnia"],
      naics: ["x", "238160"],
      valueRange: { min: 1.5, max: null },
    };
    const copy = structuredClone(filters);
    applyHunterDiscovery(discovery(filters), {});
    expect(filters).toEqual(copy);
  });
});

describe("applyHunterDiscovery: set-asides onto who may bid", () => {
  /** Every set-aside id the discovery tool can emit other than SB (SET_ASIDE_IDS in
   *  backend/src/hunter-chat/discovery-agent.service.ts). */
  const UNMAPPED = ["VOSB", "8A", "WOSB", "HUBZone", "NATIVE_TRIBAL", "FULL_OPEN"];

  it("maps SB (total small business) onto who small and does not report it", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: ["SB"] }), {});
    expect(r.search).toEqual({ who: "small" });
    expect(r.unsupported).toEqual([]);
  });

  it("replaces the who groups already in the search", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: ["SB"] }), {
      ...FULL,
      who: "program,not_shared",
    });
    expect(r.search).toEqual({ ...FULL, who: "small" });
  });

  it("writes small once when SB comes twice", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: ["SB", "SB"] }), {});
    expect(r.search.who).toBe("small");
  });

  it("applies SB after a fresh reset", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: ["SB"] }, true), FULL);
    expect(r.search).toEqual({ view: "all", sort: "soonest", who: "small" });
  });

  it.each(UNMAPPED)("reports %s and leaves who unchanged", (id) => {
    const r = applyHunterDiscovery(discovery({ setAsides: [id] }), FULL);
    expect(r.search).toEqual(FULL);
    expect(r.unsupported).toEqual([{ key: "setAsides", value: [id] }]);
  });

  it.each(UNMAPPED)("reports SB with %s, and applies neither", (id) => {
    // Hunter's set-asides are an OR. If the list applied SB alone, it would hide
    // the other records the member asked for. So a mixed list applies nothing.
    const r = applyHunterDiscovery(discovery({ setAsides: ["SB", id] }), {});
    expect(r.search).toEqual({});
    expect(r.unsupported).toEqual([{ key: "setAsides", value: ["SB", id] }]);
  });

  it("does not map an id that differs from SB in case, spacing or letters", () => {
    for (const id of ["sb", " SB", "SBA"]) {
      const r = applyHunterDiscovery(discovery({ setAsides: [id] }), {});
      expect(r.search).toEqual({});
      expect(r.unsupported).toEqual([{ key: "setAsides", value: [id] }]);
    }
  });

  it("does not map a key inherited from Object.prototype", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: ["toString"] }), {});
    expect(r.search).toEqual({});
    expect(r.unsupported).toEqual([{ key: "setAsides", value: ["toString"] }]);
  });

  it("leaves who unchanged and reports nothing for an empty list", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: [] }), FULL);
    expect(r.search).toEqual(FULL);
    expect(r.unsupported).toEqual([]);
  });

  it("still reports the other filters when SB applies", () => {
    const r = applyHunterDiscovery(discovery({ setAsides: ["SB"], vehicles: ["idiq"] }), {});
    expect(r.search).toEqual({ who: "small" });
    expect(r.unsupported).toEqual([{ key: "vehicles", value: ["idiq"] }]);
  });
});

describe("forecastSearchForTab", () => {
  it("maps for_you onto an absent view", () => {
    const r = forecastSearchForTab("for_you", FULL);
    expect(r.view).toBeUndefined();
  });

  it("maps all and saved onto the same view ids", () => {
    expect(forecastSearchForTab("all", {}).view).toBe("all");
    expect(forecastSearchForTab("saved", {}).view).toBe("saved");
  });

  it("clears the capture tab and keeps the filters", () => {
    const r = forecastSearchForTab("saved", FULL);
    expect(r).toEqual({ ...FULL, view: "saved", tab: undefined });
  });
});

describe("clearedForecastSearch", () => {
  it("does the same reset as fresh, with no delta", () => {
    expect(clearedForecastSearch(FULL)).toEqual({ view: "all", sort: "soonest" });
  });

  it("keeps an empty search empty", () => {
    expect(clearedForecastSearch({})).toEqual({});
  });
});

describe("HUNTER_FILTER_NOTE.line", () => {
  const all: UnsupportedFilter[] = [
    { key: "states", value: ["TX", "OK"] },
    { key: "cities", value: ["Houston"] },
    { key: "setAsides", value: ["8A"] },
    { key: "valueRange", value: { min: 500_000, max: 2_000_000 } },
    { key: "dueWindow", value: ["30_days"] },
    { key: "naics", value: ["238160"] },
    { key: "noticeTypes", value: ["rfp"] },
    { key: "categories", value: ["contract"] },
    { key: "vehicles", value: ["idiq"] },
    { key: "postedWithin", value: 30 },
    { key: "dodOnly", value: true },
    { key: "civilianOnly", value: true },
  ];

  it("has a label for every key", () => {
    for (const f of all) expect(HUNTER_FILTER_NOTE.label[f.key]).toBeTruthy();
  });

  it("names each unsupported filter and its values", () => {
    const text = HUNTER_FILTER_NOTE.line(all);
    for (const f of all) expect(text).toContain(HUNTER_FILTER_NOTE.label[f.key]);
    expect(text).toContain("TX, OK");
    expect(text).toContain("Houston");
    expect(text).toContain("238160");
    expect(text).toContain("$500K");
    expect(text).toContain("$2M");
    expect(text).toContain("30");
  });

  it("sends the member to the opportunities feed in words, and has no URL", () => {
    const text = HUNTER_FILTER_NOTE.line([{ key: "states", value: ["TX"] }]);
    expect(text).toBe(
      "This list did not use these filters: State: TX. You can set them on the opportunities feed.",
    );
    expect(text).not.toMatch(/https?:|\/v2\/|href|from a link/i);
  });

  it("describes a one-sided value range", () => {
    expect(
      HUNTER_FILTER_NOTE.line([{ key: "valueRange", value: { min: 100_000, max: null } }]),
    ).toContain("at least $100K");
    expect(
      HUNTER_FILTER_NOTE.line([{ key: "valueRange", value: { min: null, max: 250_000 } }]),
    ).toContain("up to $250K");
  });

  it("never calls the forecast date a deadline", () => {
    const text = HUNTER_FILTER_NOTE.line([
      { key: "dueWindow", value: ["this_week", "2_weeks", "30_days", "60_plus"] },
    ]);
    expect(text).not.toMatch(/deadline|\bdue\b|\bcloses?\b/i);
  });

  it("is empty when every filter applied", () => {
    expect(HUNTER_FILTER_NOTE.line([])).toBe("");
  });

  it("never contains HigherGov", () => {
    const text = [HUNTER_FILTER_NOTE.line(all), ...Object.values(HUNTER_FILTER_NOTE.label)].join(
      " ",
    );
    expect(text).not.toMatch(/highergov/i);
  });
});

describe("appliedHunterFilters: what the list applied", () => {
  const apply = (filters: HunterFilterDelta): HunterFilterDelta =>
    appliedHunterFilters(filters, applyHunterDiscovery({ filters, note: null }, {}).unsupported);

  it("removes a key the list did not apply", () => {
    expect(apply({ search: "roof", noticeTypes: ["rfp"], dodOnly: true })).toEqual({
      search: "roof",
    });
  });

  it("keeps the values of a list key that the list read, and drops the rest", () => {
    expect(apply({ states: ["Texas", "Atlantis"] })).toEqual({ states: ["Texas"] });
  });

  it("removes the city, so no city chip shows", () => {
    expect(apply({ states: ["NC"], cities: ["Charlotte"] })).toEqual({ states: ["NC"] });
  });

  it("keeps the forecast category, which the list always satisfies", () => {
    expect(apply({ categories: ["forecast", "grant"] })).toEqual({ categories: ["forecast"] });
  });

  it("returns the delta unchanged when every filter applied", () => {
    const filters: HunterFilterDelta = { naics: ["236220"], valueRange: { min: 1000, max: null } };
    expect(apply(filters)).toEqual(filters);
  });
});
