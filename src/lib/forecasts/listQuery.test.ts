// The paged list's request: the list page's URL search, as `GET /forecasts` keys.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  FORECAST_PAGE_SIZE,
  MAX_CITIES,
  MAX_CITY_LENGTH,
  MAX_NAICS,
  MAX_Q_LENGTH,
  forecastListParams,
  forecastListQueryKey,
  listSort,
  searchWordsOf,
  sortsForView,
  urlSortFor,
} from "./listQuery";

describe("forecastListQueryKey", () => {
  it("always sends the view, For you when the URL names none", () => {
    expect(forecastListQueryKey({})).toBe("view=for_you");
    expect(forecastListQueryKey({ view: "saved" })).toBe("view=saved");
  });

  it("sends every URL key with its own name, and leaves out the defaults", () => {
    const key = forecastListQueryKey({
      view: "all",
      lane: "sled",
      q: "  roof repair ",
      tab: "act_now",
      sort: "newest",
      work: "food,building",
      place: "served",
      who: "small",
      size: "1m_5m",
      bought: "again",
      status: "open",
      expected: "this_week,30_days",
      valueMin: 1000,
      valueMax: 50000,
      states: "TX,GA",
      cities: "Austin",
      naics: "722310",
      posted: 30,
    });
    expect(Object.fromEntries(new URLSearchParams(key))).toEqual({
      view: "all",
      lane: "sled",
      q: "roof repair",
      tab: "act_now",
      sort: "newest",
      work: "food,building",
      place: "served",
      who: "small",
      size: "1m_5m",
      bought: "again",
      status: "open",
      expected: "this_week,30_days",
      valueMin: "1000",
      valueMax: "50000",
      states: "TX,GA",
      cities: "Austin",
      naics: "722310",
      posted: "30",
    });
  });

  it("does not send lane all, tab all, or an empty search", () => {
    expect(forecastListQueryKey({ view: "all", lane: "all", tab: "all", q: "   " })).toBe(
      "view=all",
    );
  });

  it("keeps the values inside the server's bounds, so a long URL is not a 400", () => {
    const params = new URLSearchParams(
      forecastListQueryKey({
        q: "x".repeat(300),
        cities: ["y".repeat(150), ...Array.from({ length: 60 }, (_, i) => `City${i}`)].join(","),
      }),
    );
    expect(params.get("q")).toHaveLength(200);
    const cities = params.get("cities")!.split(",");
    expect(cities).toHaveLength(50);
    expect(cities[0]).toBe("City0");
  });

  it("is the same for two searches that differ only in key order", () => {
    expect(forecastListQueryKey({ lane: "sled", view: "all" })).toBe(
      forecastListQueryKey({ view: "all", lane: "sled" }),
    );
  });
});

describe("the sort of a view", () => {
  it("defaults to Best match on For you and to soonest on All and Saved", () => {
    expect(listSort({})).toBe("match");
    expect(listSort({ view: "all" })).toBe("soonest");
    expect(listSort({ view: "saved" })).toBe("soonest");
    expect(listSort({ view: "all", sort: "value" })).toBe("value");
  });

  it("offers Best match on For you only", () => {
    expect(sortsForView("for_you")).toEqual(["match", "soonest", "newest", "value"]);
    expect(sortsForView("all")).toEqual(["soonest", "newest", "value"]);
    expect(sortsForView("saved")).toEqual(["soonest", "newest", "value"]);
  });

  it("keeps the URL sort absent for the view's default", () => {
    expect(urlSortFor("for_you", "match")).toBeUndefined();
    expect(urlSortFor("all", "soonest")).toBeUndefined();
    expect(urlSortFor("all", "match")).toBeUndefined();
    expect(urlSortFor("for_you", "soonest")).toBe("soonest");
    expect(urlSortFor("saved", "newest")).toBe("newest");
  });

  it("sends no sort for the view's default, and never Best match", () => {
    // The URL reader never keeps `match`: it is For you's default, so the URL is absent.
    expect(forecastListQueryKey({})).toBe("view=for_you");
    expect(forecastListQueryKey({ view: "all" })).toBe("view=all");
    expect(forecastListQueryKey({ view: "saved", sort: "soonest" })).toBe("view=saved");
    expect(forecastListQueryKey({ sort: "soonest" })).toBe("view=for_you&sort=soonest");
  });
});

describe("forecastListParams", () => {
  it("adds the page and the page size to the query", () => {
    const params = forecastListParams({ view: "all" }, 2);
    expect(params.get("view")).toBe("all");
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe(String(FORECAST_PAGE_SIZE));
    expect(FORECAST_PAGE_SIZE).toBe(20);
  });
});

describe("searchWordsOf", () => {
  it("reads the search words back from a query key", () => {
    expect(searchWordsOf(forecastListQueryKey({ q: "roof" }))).toBe("roof");
    expect(searchWordsOf(forecastListQueryKey({}))).toBe("");
  });
});

/** The server's bounds, as `forecast-filter.fixtures.json` holds them. The backend's
 *  `forecast-list.query.spec.ts` holds `forecast-list.query.ts` to the same block. */
interface Bounds {
  maxQLength: number;
  maxStates: number;
  maxCities: number;
  maxCityLength: number;
  maxNaics: number;
}

const FIXTURE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../backend/src/forecasts/forecast-filter.fixtures.json",
);
const { bounds, stateNames } = JSON.parse(readFileSync(FIXTURE, "utf8")) as {
  bounds: Bounds;
  stateNames: Record<string, string>;
};

describe("the server's bounds", () => {
  it("are the bounds the server parser holds", () => {
    expect({
      maxQLength: MAX_Q_LENGTH,
      maxCities: MAX_CITIES,
      maxCityLength: MAX_CITY_LENGTH,
      maxNaics: MAX_NAICS,
    }).toEqual({
      maxQLength: bounds.maxQLength,
      maxCities: bounds.maxCities,
      maxCityLength: bounds.maxCityLength,
      maxNaics: bounds.maxNaics,
    });
  });

  it("never sends more states than the server accepts: the URL reader keeps each known code once", () => {
    const every = Object.keys(stateNames);
    const key = forecastListQueryKey({ view: "all", states: [...every, ...every].join(",") });
    const sent = new URLSearchParams(key).get("states")?.split(",") ?? [];
    expect(sent).toHaveLength(every.length);
    expect(sent.length).toBeLessThanOrEqual(bounds.maxStates);
  });
});
