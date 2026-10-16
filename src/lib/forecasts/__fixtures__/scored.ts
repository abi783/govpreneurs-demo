// TEST DATA ONLY: the recorded forecasts, scored for the business they were pulled for.
// Production code never imports this file; `portGuardrails.test.ts` fails if it does.
// The engine takes every input as an argument, so the tests pass this firm, these
// facts and these public records explicitly, and the live path passes its own.

import {
  FORECASTS_TODAY,
  scoreForecast,
  type ForecastFirm,
  type ForecastPublicRecords,
  type ScoredForecast,
} from "../engine";
import type { HigherGovForecast } from "../records";
import { FORECAST_FACTS } from "./facts";
import {
  BUYER_RECORDS,
  HIGHERGOV_FORECASTS,
  PRIOR_AWARDS,
  SOURCE_DOCUMENTS,
} from "./forecastRecords";

/** The food-service business the recorded forecasts were pulled for: a small, WOSB
 *  certified caterer in North Carolina, registered until 15 April 2027. */
export const DEMO_FIRM: ForecastFirm = {
  naics: ["722310", "722320", "722330", "311991"],
  states: ["NC", "VA", "SC"],
  certs: ["wosb"],
  certsKnown: true,
  isSmall: true,
  registration: { status: "active", endsOn: "2027-04-15" },
  biggestPastJob: 340000,
  smallestTarget: 120000,
};

/** The public records held for one recorded forecast, by its recorded id. */
export function recordsFor(id: string): ForecastPublicRecords {
  return {
    priorAward: PRIOR_AWARDS[id] ?? null,
    buyer: BUYER_RECORDS[id] ?? null,
    document: SOURCE_DOCUMENTS[id] ?? null,
  };
}

/** Scores one recorded forecast with its own facts and records. */
export function scoreRecorded(
  r: HigherGovForecast,
  firm: ForecastFirm = DEMO_FIRM,
  today: string = FORECASTS_TODAY,
): ScoredForecast {
  const facts = FORECAST_FACTS[r.id];
  if (!facts) throw new Error(`No facts for recorded forecast ${r.id}`);
  return scoreForecast(r, firm, today, facts, recordsFor(r.id));
}

/** Every recorded forecast, scored for `DEMO_FIRM`. */
export const SCORED_FORECASTS: ScoredForecast[] = HIGHERGOV_FORECASTS.map((r) => scoreRecorded(r));

/** The scored recorded forecast with this id. */
export function findForecast(id: string): ScoredForecast | undefined {
  return SCORED_FORECASTS.find((f) => f.id === id);
}
