/**
 * The runway rule, FRONTEND SIDE of the parity pair.
 *
 * The server filters and counts the list with its own copy of this rule
 * (`backend/src/forecasts/forecast-runway.ts`). One fixture file holds the cases, and
 * both suites read it: this test against `readTiming`, `captureStatus`, the engine's
 * lifecycle and the drawer's expected windows, the backend specs against the server
 * function and the Mongo condition. If one side changes the rule, one suite fails.
 * Contract: ARCHITECTURE-forecasts-paginated.md, section 5.2.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  NO_PUBLIC_RECORDS,
  captureStatus,
  isPastGrace,
  forecastPeriod,
  readTiming,
  scoreForecast,
} from "./engine";
import type { ForecastFacts } from "./facts";
import { expectedWindowsOf } from "./filters";
import { firmFromMember } from "./live";
import { HIGHERGOV_FORECASTS } from "./__fixtures__/forecastRecords";
import type { ForecastLane } from "./records";
import type { ForecastMemberDto } from "../forecastsApi";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(HERE, "../../../../backend/src/forecasts/forecast-runway.fixtures.json");

interface RunwayCase {
  name: string;
  today: string;
  dueDay: string | null;
  lane: ForecastLane;
  expect: {
    middle: string | null;
    end: string | null;
    /** The label of the period the date stands for, or null for a month or a day. */
    period: string | null;
    runwayDays: number | null;
    captureStatus: string;
    lifecycle: "open" | "stale";
    /** More than the grace past the expected window: For you and All leave it out. */
    pastGrace: boolean;
    expected: string[];
  };
}

const CASES = (JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: RunwayCase[] }).cases;

/** A recorded forecast re-keyed, scored with no public records, as a live one is. */
const BASE = { ...HIGHERGOV_FORECASTS[0], id: "runway-parity", oppKey: "runway-parity" };

/** The facts a live record carries: no timing, lifecycle or place override (live.ts). */
const LIVE_FACTS: ForecastFacts = {
  title: "Runway parity",
  why: "",
  work: "",
  scopeFit: 0,
  codeFit: 0,
  extraction: "none",
};

const MEMBER: ForecastMemberDto = {
  naics: [],
  states: [],
  certs: [],
  certsKnown: false,
  isSmall: null,
  registration: { status: "not_registered", endsOn: null },
  biggestPastJob: null,
  smallestTarget: null,
  businessName: null,
  address: null,
};

describe("the runway fixture", () => {
  it("holds at least 30 cases", () => {
    expect(CASES.length).toBeGreaterThanOrEqual(30);
  });
});

describe.each(CASES)("runway parity: $name", (c) => {
  const record = { ...BASE, dueOn: c.dueDay, lane: c.lane };

  it("readTiming and captureStatus give the fixture's middle, end, runway and status", () => {
    const timing = readTiming(record, LIVE_FACTS, c.today);
    expect({
      middle: timing.middle,
      end: timing.end,
      runwayDays: timing.runwayDays,
      captureStatus: captureStatus(timing.runwayDays),
    }).toEqual({
      middle: c.expect.middle,
      end: c.expect.end,
      runwayDays: c.expect.runwayDays,
      captureStatus: c.expect.captureStatus,
    });
  });

  it("the period, the label and the grace match the fixture", () => {
    const timing = readTiming(record, LIVE_FACTS, c.today);
    expect(c.dueDay ? (forecastPeriod(c.dueDay, c.lane)?.label ?? null) : null).toBe(
      c.expect.period,
    );
    if (c.expect.period) {
      expect(timing.label).toBe(c.expect.period);
      expect(["quarter", "year"]).toContain(timing.precision);
    } else {
      expect(["quarter", "year"]).not.toContain(timing.precision);
    }
    if (c.lane === "sled") expect(timing.label).not.toMatch(/FY/);
    expect(isPastGrace(timing.end, c.today)).toBe(c.expect.pastGrace);
  });

  it("the scored forecast gives the fixture's lifecycle, status and expected windows", () => {
    const scored = scoreForecast(
      record,
      firmFromMember(MEMBER),
      c.today,
      LIVE_FACTS,
      NO_PUBLIC_RECORDS,
    );
    expect({
      status: scored.status,
      lifecycle: scored.lifecycle,
      expected: expectedWindowsOf(scored).filter((w) => w !== "any"),
    }).toEqual({
      status: c.expect.captureStatus,
      lifecycle: c.expect.lifecycle,
      expected: c.expect.expected,
    });
  });
});
