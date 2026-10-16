/**
 * The drawer filters and the search, FRONTEND SIDE of the parity pair.
 *
 * The server filters the list with Mongo conditions
 * (`backend/src/forecasts/forecast-list.conditions.ts`). One fixture file holds the
 * stored records, the member and the cases, and both suites read it: this test runs
 * the client's `readFilterSearch`, `matchesFilters` and `matchesSearch` on each
 * record, and the backend spec runs the server conditions on a real mongod. If one
 * side changes a rule, one suite fails. Contract: ARCHITECTURE-forecasts-paginated.md,
 * section 5.3.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { ForecastMemberDto, ForecastRecordDto } from "../forecastsApi";
import { LIVE } from "./copy";
import {
  FORECASTS_TODAY,
  PROGRAM_CODES,
  SEARCH_DESCRIPTION_CHARS,
  matchesSearch,
  stateCode,
  stateName,
  type ScoredForecast,
} from "./engine";
import { filtersFromSearch, matchesFilters, readFilterSearch } from "./filters";
import { firmFromMember, scoreLive } from "./live";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(HERE, "../../../../backend/src/forecasts/forecast-filter.fixtures.json");

interface FilterCase {
  name: string;
  query: Record<string, string>;
  memberPatch?: Partial<ForecastMemberDto>;
  expectKeys: string[];
}

interface FilterFixture {
  searchDescriptionChars: number;
  today: string;
  programCodes: Record<string, string[]>;
  stateNames: Record<string, string>;
  untitled: string;
  member: ForecastMemberDto;
  forecasts: { record: ForecastRecordDto }[];
  cases: FilterCase[];
}

const FIX = JSON.parse(readFileSync(FIXTURE, "utf8")) as FilterFixture;

/** The list route's own rule for the lane, the search and the capture tab. */
function listed(f: ScoredForecast, query: Record<string, string>): boolean {
  const lane = query.lane ?? "all";
  const tab = query.tab ?? "all";
  return (
    (lane === "all" || f.lane === lane) &&
    matchesSearch(f, query.q ?? "") &&
    (tab === "all" || (f.lifecycle === "open" && f.status === tab))
  );
}

function keysFor(c: FilterCase): string[] {
  const firm = firmFromMember({ ...FIX.member, ...c.memberPatch });
  const filters = filtersFromSearch(readFilterSearch(c.query));
  return FIX.forecasts
    .map(({ record }) => scoreLive(record, firm))
    .filter((f) => listed(f, c.query) && matchesFilters(f, filters))
    .map((f) => f.id)
    .sort();
}

describe("the filter fixture", () => {
  it("counts from the day the client counts from", () => {
    expect(FORECASTS_TODAY).toBe(FIX.today);
  });

  it("covers every drawer group, the lane, the tab and the search", () => {
    const keys = new Set(FIX.cases.flatMap((c) => Object.keys(c.query)));
    for (const key of [
      "lane",
      "work",
      "naics",
      "place",
      "states",
      "cities",
      "who",
      "size",
      "bought",
      "status",
      "expected",
      "posted",
      "valueMin",
      "valueMax",
      "tab",
      "q",
    ])
      expect(keys).toContain(key);
  });
});

describe("the tables the server copies", () => {
  it("the program set-aside codes and their certificates are the fixture's", () => {
    const client = Object.fromEntries(
      Object.entries(PROGRAM_CODES).map(([code, rule]) => [code, rule.needs]),
    );
    expect(client).toEqual(FIX.programCodes);
  });

  it("the state names are the fixture's, and no other two letters name a state", () => {
    for (const [code, name] of Object.entries(FIX.stateNames)) {
      expect(stateName(code)).toBe(name);
      expect(stateCode(name)).toBe(code);
    }
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const others = letters
      .flatMap((a) => letters.map((b) => a + b))
      .filter((pair) => !(pair in FIX.stateNames));
    for (const pair of others) expect(stateCode(pair)).toBeNull();
  });

  it("the title of a forecast with no title is the fixture's", () => {
    expect(LIVE.untitled).toBe(FIX.untitled);
  });

  it("the search reads as much of a description as the fixture says", () => {
    expect(SEARCH_DESCRIPTION_CHARS).toBe(FIX.searchDescriptionChars);
  });
});

describe.each(FIX.cases)("filter parity: $name", (c) => {
  it("the client matchers select the fixture's keys", () => {
    expect(keysFor(c)).toEqual(c.expectKeys);
  });
});
