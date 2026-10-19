// The Forecasts page data, in the shapes the production API sends.
//
// The 40 recorded forecasts and the seven written for the story become
// `ForecastRecordDto` rows with dates counted from today (clock.ts). Hunter's
// words on each card are NOT written here: the page works them out from the
// record and from the member's facts below, exactly as it does in production.
// So a line like "the right size for you" is true because the numbers say so.
// DEMO: for the agency, the 14 forecasts of src/demo/members/agency/market/forecasts.ts.

import { calendarDay } from "./dates";
import { byMember, MEMBER, own } from "@/demo/member";
import { PAST_PERFORMANCE, PERSONA } from "@/demo/story/persona";
import type {
  ForecastListRowDto,
  ForecastMatchRead,
  ForecastMemberDto,
  ForecastRecordDto,
} from "@/lib/forecastsApi";
import type { ScoredForecast } from "@/lib/forecasts/engine";
import { firmFromMember, scoreLive } from "@/lib/forecasts/live";
import { FORT_BRAGG_FORECAST_KEY, LOCAL_SEEDS } from "./forecastLocalSeeds";
import { RECORDED_SEEDS, type ForecastSeed } from "./forecastSeeds";

const pack = own(
  import.meta.glob<typeof import("@/demo/members/agency/market/forecasts")>("/src/demo/members/*/market/forecasts.ts", { eager: true }),
);

/** Amira's facts, as the forecast rules read them. */
export const FORECAST_MEMBER: ForecastMemberDto = {
  naics: [PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)],
  states: [...PERSONA.serviceStates],
  certs: ["wosb"],
  certsKnown: true,
  isSmall: true,
  registration: { status: "active", endsOn: PERSONA.samActiveUntil },
  biggestPastJob: Math.max(...PAST_PERFORMANCE.map((p) => p.totalValue)),
  smallestTarget: null,
  businessName: PERSONA.businessName,
  address: PERSONA.physicalAddress,
};

/** Dates that stand for a whole fiscal period or year in the forecast rules. */
const PERIOD_DAYS = new Set(["01-01", "04-01", "07-01", "09-30", "10-01", "06-30", "12-31"]);

/** A date `days` from today that is not one of the period dates, so it reads as a day. */
function plainDate(days: number): string {
  let d = days;
  while (PERIOD_DAYS.has(calendarDay(d).slice(5))) d += 1;
  return calendarDay(d);
}

/** How close the industry code is to the member's own, 0 to 1. Null: no code. */
function categoryFitOf(code: string | null): number | null {
  if (MEMBER !== "caterer") return pack.categoryFit(code, FORECAST_MEMBER.naics);
  if (!code) return null;
  if (FORECAST_MEMBER.naics.includes(code)) return 1;
  if (/^(7223|7225|311)/.test(code)) return 0.8;
  if (/^(722|624210)/.test(code)) return 0.6;
  if (/^561(210|920)/.test(code)) return 0.35;
  return 0.05;
}

function toRecord(seed: ForecastSeed): ForecastRecordDto {
  return {
    id: seed.oppKey,
    lane: seed.lane,
    oppKey: seed.oppKey,
    hgTitle: seed.hgTitle,
    hgText: seed.hgText,
    sourceId: seed.sourceId,
    postedOn: seed.postedDaysAgo == null ? null : plainDate(-seed.postedDaysAgo),
    dueOn: seed.expectedInDays == null ? null : plainDate(seed.expectedInDays),
    agencyName: seed.agencyName,
    agencyAbbr: seed.agencyAbbr,
    naicsCode: seed.naicsCode,
    pscCode: seed.pscCode,
    oppType: seed.oppType,
    setAsideCode: seed.setAsideCode,
    valLow: seed.valLow,
    valHigh: seed.valHigh,
    popState: seed.popState,
    popCity: seed.popCity,
    contactName: seed.contactName,
    contactRole: seed.contactRole,
    // DEMO: no e-mail address, so no sample click can write to a real official.
    contactEmail: null,
    sourceName: seed.sourceName,
    sourceLink: seed.sourceLink,
    docKey: seed.docKey,
    hunter: {
      plainTitle: seed.plainTitle,
      semanticFit: seed.semanticFit,
      categoryFit: categoryFitOf(seed.naicsCode),
    },
  };
}

// DEMO: two members. The caterer has 48 forecasts; the agency's 14 are in
// src/demo/members/agency/market/forecasts.ts.
const ALL_SEEDS: ForecastSeed[] = byMember({
  pack: pack.FORECAST_SEEDS,
  caterer: [...LOCAL_SEEDS, ...RECORDED_SEEDS],
});

/** Every forecast, in the order of the seeds. */
export const FORECAST_RECORDS: ForecastRecordDto[] = ALL_SEEDS.map(toRecord);

const SEED_BY_KEY = new Map(ALL_SEEDS.map((s) => [s.oppKey, s]));
const RECORD_BY_KEY = new Map(FORECAST_RECORDS.map((r) => [r.oppKey, r]));

export function forecastRecord(oppKey: string): ForecastRecordDto | undefined {
  return RECORD_BY_KEY.get(oppKey);
}

export function isForecastKey(oppKey: string): boolean {
  return RECORD_BY_KEY.has(oppKey);
}

/** The files the page lists for one forecast. */
export function forecastFiles(oppKey: string): { fileName: string; sizeBytes: number | null }[] | null {
  return SEED_BY_KEY.get(oppKey)?.files ?? null;
}

const FIRM = firmFromMember(FORECAST_MEMBER);

/** The tier of a match row, from the score: priority 80+, strong 60+, stretch 40+. */
function tierOf(score: number): ForecastMatchRead["tier"] {
  if (score >= 80) return "priority";
  if (score >= 60) return "strong";
  if (score >= 40) return "stretch";
  return "low";
}

/** Hunter's own score for the forecast the story points at: the incumbent partner makes it a team bid worth chasing. */
const SCORE_OVERRIDE: Record<string, number> = { [FORT_BRAGG_FORECAST_KEY]: 100 };

export interface ScoredRow {
  record: ForecastRecordDto;
  scored: ScoredForecast;
  match: ForecastMatchRead | null;
}

/** Each forecast scored for Amira, with the match row Hunter would hold for it. */
export const SCORED_ROWS: ScoredRow[] = FORECAST_RECORDS.map((record) => {
  const scored = scoreLive(record, FIRM);
  const worthAMatch =
    scored.published && scored.score != null && (record.hunter.categoryFit ?? 0) >= 0.3;
  // Work more than five times her largest job is a stretch for her, whatever the work.
  const tooBig = record.valHigh != null && record.valHigh > 5 * (FORECAST_MEMBER.biggestPastJob ?? Infinity);
  const raw = scored.score ?? 0;
  const finalScore = SCORE_OVERRIDE[record.oppKey] ?? (tooBig ? Math.min(raw, 58) : raw);
  const match: ForecastMatchRead | null = worthAMatch
    ? { tier: tierOf(finalScore), finalScore }
    : null;
  return { record, scored, match };
});

const ROW_BY_KEY = new Map(SCORED_ROWS.map((r) => [r.record.oppKey, r]));

export function scoredRow(oppKey: string): ScoredRow | undefined {
  return ROW_BY_KEY.get(oppKey);
}

export function toListRow(row: ScoredRow): ForecastListRowDto {
  return { ...row.record, match: row.match };
}
