// Hunter Match and Capture Status for forecasts — a deterministic prototype of the
// Hunter Match Score PRD. Two outputs, never merged (§1, §11.1):
//   · the FIT (can she do this work, and how winnable is it), shown as words, and
//   · the STATUS (the clock), which nothing but the date may move.
//
// Every input is passed in, never looked up here: the firm (from the member's
// profile, D-A3), the record, Hunter's facts (`live.ts` builds them from the member's
// match) and the public records. This file holds no member or forecast data.
// What is standing in: NAICS closeness uses code prefixes where the member's match
// gives no taxonomy fit (§6.1). PSC is not scored: we hold no PSC codes for the firm
// (§6.2).

import { money, openEndedHigh } from "../money";
import type { Extraction, ForecastFacts } from "./facts";
import type {
  BuyerRecord,
  ForecastLane,
  HigherGovForecast,
  PriorAward,
  SourceDocument,
} from "./records";
import {
  ASK,
  BOUGHT_BEFORE,
  FIT_LABEL,
  NO_DATE,
  PLACE_FROM_BUYER,
  PRECISION_NOTE,
  REASON,
  STEP,
  STEP_CHIP,
  UNKNOWN,
  VERDICT,
  WHO_MAY_BID,
  type CaptureStatus,
  type FitTier,
  CERT_NAME,
  type EmailPitch,
} from "./copy";

/** ONE CLOCK (D-B7): every runway on both forecast pages counts from this date.
 *  It is today's date. The tests pin it with VITE_FORECASTS_TODAY (vitest.config.ts),
 *  because the test fixtures were pulled on 16 September 2026. */
export const FORECASTS_TODAY: string =
  import.meta.env.VITE_FORECASTS_TODAY ?? new Date().toISOString().slice(0, 10);

// ── Constants — Hunter Match Score PRD, Appendix A ──────────────────────────────
const FIT_CAP = 78;
const BLEND = { structured: 0.4, semantic: 0.6 };
const EXTRACTION_CONF: Record<Extraction, number> = { high: 1, medium: 0.6, low: 0.25, none: 0 };
const SLED_EXTRACTION_CAP = 0.6;
const SLED_STRUCTURED_CONF = 0.5;
const WEIGHTS = {
  low: { cap: 0.9, loc: 0.1, notSpecified: 0.5 },
  medium: { cap: 0.75, loc: 0.25, notSpecified: 0.3 },
  high: { cap: 0.45, loc: 0.55, notSpecified: 0.15 },
} as const;
const RESERVE = { niche: 22, smallBusiness: 12 };
/** A set-aside kept for one small business program. `needs` lists the certificates,
 *  any one of which qualifies. A sole-source code plans the work for one chosen company,
 *  so no certificate makes it "held" (13 CFR 127.503, 124.506). */
interface ProgramRule {
  /** Plain words for who the program is for. */
  plain: string;
  /** The government's name for it, shown small under the plain words. */
  term: string;
  soleSource: boolean;
  needs: string[];
}
const programRules = (rule: Omit<ProgramRule, "soleSource">) => ({
  open: { ...rule, soleSource: false },
  one: { ...rule, soleSource: true },
});
const EIGHT_A = programRules({
  plain: "businesses in a federal program for disadvantaged owners",
  term: "8(a)",
  needs: ["8a"],
});
const HUBZONE = programRules({
  plain: "businesses based in, and hiring from, low-income areas",
  term: "HUBZone",
  needs: ["hubzone"],
});
const SDVOSB = programRules({
  plain: "businesses owned by service-disabled veterans",
  term: "SDVOSB",
  needs: ["sdvosb"],
});
const VOSB = programRules({
  plain: "businesses owned by veterans",
  term: "VOSB",
  needs: ["vosb", "sdvosb"],
});
const WOSB = programRules({
  plain: "women-owned small businesses",
  term: "WOSB",
  needs: ["wosb", "edwosb"],
});
// An EDWOSB set-aside is open to EDWOSB firms only; a WOSB certificate is not enough.
const EDWOSB = programRules({
  plain: "women-owned small businesses with lower owner income",
  term: "EDWOSB",
  needs: ["edwosb"],
});
/** Every program set-aside code in SAM.gov's list, as HigherGov returns it. */
export const PROGRAM_CODES: Record<string, ProgramRule> = {
  "8A": EIGHT_A.open,
  "8AN": EIGHT_A.one,
  HZC: HUBZONE.open,
  HZS: HUBZONE.one,
  SDVOSBC: SDVOSB.open,
  SDVOSBS: SDVOSB.one,
  VSA: VOSB.open,
  VSS: VOSB.one,
  WOSB: WOSB.open,
  WOSBSS: WOSB.one,
  EDWOSB: EDWOSB.open,
  EDWOSBSS: EDWOSB.one,
};
/** Total and partial small business set-asides. */
const SMALL_BUSINESS_CODES = new Set(["SBA", "SBP"]);
/** The code a record gives while the buyer has not decided who may bid. */
const UNDECIDED_CODE = "TBD";

/**
 * Whether a set-aside code leaves open who may bid: null, blank or TBD. The code is
 * trimmed and upper-cased first. The one owner of this rule on the client.
 */
export function isUndecidedSetAside(code: string | null | undefined): boolean {
  const read = code?.trim().toUpperCase() ?? "";
  return read === "" || read === UNDECIDED_CODE;
}
const CAP_CANNOT_BID = 25;
const CAP_WRONG_WORK = 39;
const CAP_PLACE = 39;
/** Calibrated thresholds belong to the real engine (§13). These are prototype values. */
const SEM_LOW = 0.25;
const SEM_LOW_SLED = 0.2;
const RIGHT_SIZE_MULTIPLE = 5;
const RUNWAY = { actNow: 45, startCapture: 120, positionEarly: 365 };

/** How long a forecast stays on For you and All after its expected window ends.
 *  The server owns the cut (`FORECAST_GRACE_MONTHS` in forecast-runway.ts); this
 *  mirror is held to it by the shared runway fixture. */
export const FORECAST_GRACE_MONTHS = 6;

// ── The firm ────────────────────────────────────────────────────────────────────
export type RegistrationStatus = "active" | "inactive" | "expired" | "not_registered";

export interface ForecastFirm {
  naics: string[];
  states: string[];
  /** Program certificates held: "8a", "hubzone", "sdvosb", "vosb", "wosb", "edwosb". Read
   *  from My Business's saved slugs (eight_a, hubzone, …) or "{program}_certified". */
  certs: string[];
  /** False when the member answered "Not sure" or never answered: a program set-aside
   *  then waits, rather than saying she does not hold the certificate. */
  certsKnown: boolean;
  /** From My Business. Null when not on record: never assumed in a claim she sends. */
  isSmall: boolean | null;
  /** The government registration. `endsOn` stands in for its end date: the prototype
   *  reads My Business `samVerifiedAt`, whose meaning is assumed (PRD gap G-1). */
  registration: { status: RegistrationStatus; endsOn: string | null };
  biggestPastJob: number | null;
  smallestTarget: number | null;
}

/** The public records a forecast can carry beyond its own record. `GET /forecasts`
 *  sends none of them, so the live path passes `NO_PUBLIC_RECORDS`, and each box that
 *  needs one stays hidden or says "not shared". */
export interface ForecastPublicRecords {
  /** The last contract, matched to a federal recompete. */
  priorAward: PriorAward | null;
  /** The buyer's own forecast page. Federal only. */
  buyer: BuyerRecord | null;
  /** The document a local forecast was found in. */
  document: SourceDocument | null;
}

/** What the forecast API sends today: no prior award, no buyer page, no document. */
export const NO_PUBLIC_RECORDS: ForecastPublicRecords = {
  priorAward: null,
  buyer: null,
  document: null,
};

// ── Dates ───────────────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}
function iso(y: number, m: number, d: number): string {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toISOString().slice(0, 10);
}
function lastDay(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`) -
      Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)) /
      86_400_000,
  );
}
/** Dates are written out in full: "15 April 2027". */
export function longDate(value: string): string {
  const { y, m, d } = parts(value);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
function monthYear(y: number, m: number): string {
  return `${MONTHS[m - 1]} ${y}`;
}
function midpoint(fromIso: string, toIso: string): string {
  const span = daysBetween(fromIso, toIso);
  const { y, m, d } = parts(fromIso);
  return iso(y, m, d + Math.floor(span / 2));
}

export type Precision = "exact" | "month" | "quarter" | "year" | "window" | "unknown";

/** The period a forecast's date stands for, when the date is not a day. */
export interface ForecastPeriod {
  from: string;
  to: string;
  middle: string;
  /** "Some time in FY2027", "Around Q2 FY2027", "Between July 2025 and June 2026". */
  label: string;
  precision: "quarter" | "year";
  note: string;
}

/** A federal fiscal year starts in October of the calendar year before it. */
const FISCAL_YEAR_START_MONTH = 10;
/** The months whose first day reads as a federal fiscal quarter. */
const QUARTER_START_MONTHS = [1, 4, 7];
const MONTHS_PER_QUARTER = 3;

function yearPeriod(from: string, to: string, label: string, note: string): ForecastPeriod {
  return { from, to, middle: midpoint(from, to), label, precision: "year", note };
}

/** 1 October and 30 September are a whole fiscal year. The first of January, April
 *  or July is a fiscal quarter written as a day: Q2, Q3 or Q4 of the fiscal year
 *  that ends that September. */
function federalPeriod(y: number, m: number, d: number): ForecastPeriod | null {
  if (m === FISCAL_YEAR_START_MONTH && d === 1)
    return yearPeriod(
      iso(y, 10, 1),
      iso(y + 1, 9, 30),
      `Some time in FY${y + 1}`,
      PRECISION_NOTE.fiscalYear,
    );
  if (m === 9 && d === 30)
    return yearPeriod(
      iso(y - 1, 10, 1),
      iso(y, 9, 30),
      `Some time in FY${y}`,
      PRECISION_NOTE.fiscalYear,
    );
  if (d === 1 && QUARTER_START_MONTHS.includes(m)) {
    const endMonth = m + 2;
    const quarter = Math.floor((m - 1) / MONTHS_PER_QUARTER) + 2;
    return {
      from: iso(y, m, 1),
      to: iso(y, endMonth, lastDay(y, endMonth)),
      middle: iso(y, m + 1, 15),
      label: `Around Q${quarter} FY${y}`,
      precision: "quarter",
      note: PRECISION_NOTE.quarter,
    };
  }
  return null;
}

/** A member does not know a local buyer's budget calendar, so these labels use
 *  calendar words only, never "FY". 30 June and 30 September end a budget year: the
 *  12 months that end on the date. 1 January and 31 December are their calendar
 *  year. */
function sledPeriod(y: number, m: number, d: number): ForecastPeriod | null {
  if ((m === 6 || m === 9) && d === 30) {
    const startMonth = m + 1;
    return yearPeriod(
      iso(y - 1, startMonth, 1),
      iso(y, m, d),
      `Between ${monthYear(y - 1, startMonth)} and ${monthYear(y, m)}`,
      PRECISION_NOTE.budgetYear,
    );
  }
  if ((m === 1 && d === 1) || (m === 12 && d === 31))
    return yearPeriod(
      iso(y, 1, 1),
      iso(y, 12, 31),
      `Some time in ${y}`,
      PRECISION_NOTE.calendarYear,
    );
  return null;
}

/** The period a forecast's date stands for, or null when it is a month or a day.
 *  The server owns the same rule (`forecastPeriod` in forecast-runway.ts), held to
 *  this one by the shared runway fixture. */
export function forecastPeriod(dueOn: string, lane: ForecastLane): ForecastPeriod | null {
  const { y, m, d } = parts(dueOn);
  return lane === "federal" ? federalPeriod(y, m, d) : sledPeriod(y, m, d);
}

/** The same day `months` later, cut to the last day of a shorter month. */
function addMonths(day: string, months: number): string {
  const { y, m, d } = parts(day);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const ty = target.getUTCFullYear();
  const tm = target.getUTCMonth() + 1;
  return iso(ty, tm, Math.min(d, lastDay(ty, tm)));
}

/** True when the expected window ended more than `FORECAST_GRACE_MONTHS` before
 *  today. The server leaves such a forecast out of For you and All. */
export function isPastGrace(end: string | null, today: string): boolean {
  return end != null && addMonths(end, FORECAST_GRACE_MONTHS) < today;
}

export interface Timing {
  label: string;
  precision: Precision;
  note: string;
  /** True when the date is our reading rather than the buyer's statement. */
  ourRead: boolean;
  middle: string | null;
  end: string | null;
  runwayDays: number | null;
}

/** date_precision (§11.1): render at the precision held, never finer, and count the
 *  runway from the middle of what the buyer said. */
export function readTiming(r: HigherGovForecast, f: ForecastFacts, today: string): Timing {
  const none = (note: string, ourRead: boolean, label = NO_DATE): Timing => ({
    label,
    precision: "unknown",
    note,
    ourRead,
    middle: null,
    end: null,
    runwayDays: null,
  });

  if (f.lifecycle) return none(f.lifecycle.note, true, f.lifecycle.timing);
  if (f.timing?.kind === "none") return none(f.timing.note, true);

  const runway = (middle: string, end: string) =>
    end < today ? null : Math.max(0, daysBetween(today, middle));

  if (f.timing?.kind === "window") {
    const middle = midpoint(f.timing.from, f.timing.to);
    return {
      label: f.timing.label,
      precision: "window",
      note: f.timing.note,
      ourRead: true,
      middle,
      end: f.timing.to,
      runwayDays: runway(middle, f.timing.to),
    };
  }

  if (!r.dueOn) return none(PRECISION_NOTE.none, false);

  const local = r.lane === "sled";
  const period = forecastPeriod(r.dueOn, r.lane);
  if (period) {
    return {
      label: period.label,
      precision: period.precision,
      note: period.note,
      ourRead: true,
      middle: period.middle,
      end: period.to,
      runwayDays: runway(period.middle, period.to),
    };
  }

  const { y, m, d } = parts(r.dueOn);
  const wholeMonth = d === 1 || d === lastDay(y, m);

  if (wholeMonth) {
    const end = iso(y, m, lastDay(y, m));
    const middle = iso(y, m, 15);
    return {
      label: `Around ${monthYear(y, m)}`,
      precision: "month",
      note: local ? PRECISION_NOTE.estimate : PRECISION_NOTE.month,
      ourRead: true,
      middle,
      end,
      runwayDays: runway(middle, end),
    };
  }
  return {
    label: local ? `Around ${longDate(r.dueOn)}` : longDate(r.dueOn),
    precision: "exact",
    note: local ? PRECISION_NOTE.estimate : PRECISION_NOTE.exact,
    ourRead: local,
    middle: r.dueOn,
    end: r.dueOn,
    runwayDays: runway(r.dueOn, r.dueOn),
  };
}

export function captureStatus(runwayDays: number | null): CaptureStatus {
  if (runwayDays == null) return "watch";
  if (runwayDays <= RUNWAY.actNow) return "act_now";
  if (runwayDays <= RUNWAY.startCapture) return "start_capture";
  if (runwayDays <= RUNWAY.positionEarly) return "position_early";
  return "watch";
}

// ── Place ───────────────────────────────────────────────────────────────────────
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "Washington, D.C.",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

export function stateName(code: string): string {
  return STATE_NAMES[code] ?? code;
}

/** "Massachusetts, New York and Maine". */
function listStates(codes: string[]): string {
  const names = codes.map(stateName);
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
    : (names[0] ?? "");
}

export interface Place {
  label: string | null;
  states: string[];
  ourRead: boolean;
  note: string | null;
  /** is_concrete() (§9): a specific place is named. */
  concrete: boolean;
}

/** A local buyer is usually the place (§9): "Town of Barnstable" works in Barnstable.
 *  Returns null when the buyer's name does not name a place, such as a university system. */
function placeFromJurisdiction(agency: string): string | null {
  const ofPlace = agency.match(/^(?:City|Town|Village|Borough) of (.+)$/i);
  if (ofPlace) return ofPlace[1];
  const countyOf = agency.match(/^County of (.+)$/i);
  if (countyOf) return `${countyOf[1]} County`;
  const district = agency.match(/^(.+?) Independent School District$/i);
  if (district) return district[1];
  const area = agency.match(/^(.+? (?:County|Parish|Township))\b/);
  if (area) return area[1];
  if (/university|system|department|authority|district/i.test(agency)) return null;
  return agency.split(" ").length <= 3 ? agency : null;
}

const STATE_CODE_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code]),
);

/** A two-letter code or a state's name, as the record sends it. Anything else is none. */
export function stateCode(raw: string | null): string | null {
  const t = raw?.trim();
  if (!t) return null;
  if (STATE_NAMES[t.toUpperCase()]) return t.toUpperCase();
  return STATE_CODE_BY_NAME[t.toLowerCase()] ?? null;
}

/** City values that name no place. */
const NO_CITY = /^(tbd|multiple|multiple locations|various|various locations|n\/?a|none)$/i;

/** The city the record names. A value that names no place, like "TBD", is none. */
export function cityName(raw: string | null): string | null {
  const t = raw?.trim();
  return t && !NO_CITY.test(t) ? t : null;
}

function readPlace(r: HigherGovForecast, f: ForecastFacts): Place {
  // Hunter's own reading replaces the record's fields. It names a place only with a state.
  if (f.place)
    return {
      label: f.place.label,
      states: f.place.states,
      ourRead: true,
      note: f.place.note,
      concrete: f.place.states.length > 0,
    };
  const state = stateCode(r.popState);
  const city = cityName(r.popCity);
  if (state) {
    const name = stateName(state);
    if (city)
      return {
        label: `${city}, ${name}`,
        states: [state],
        ourRead: false,
        note: null,
        concrete: true,
      };
    const local = r.lane === "sled" ? placeFromJurisdiction(r.agencyName) : null;
    if (local) {
      return {
        label: `${local}, ${name}`,
        states: [state],
        ourRead: true,
        note: PLACE_FROM_BUYER,
        concrete: true,
      };
    }
    return { label: name, states: [state], ourRead: false, note: null, concrete: true };
  }
  return { label: city, states: [], ourRead: false, note: null, concrete: false };
}

// ── Money ───────────────────────────────────────────────────────────────────────
/**
 * The buyer's estimate, as a band. Never a price, and never "$0 to". A low end
 * alone is a floor, so it reads "$100M or more", never as one exact figure.
 */
export function valueLabel(low: number | null, rawHigh: number | null): string | null {
  const high = openEndedHigh(rawHigh);
  if (high == null && low == null) return null;
  if (high == null) return `${money(low as number)} or more`;
  if (!low) return `Up to ${money(high)}`;
  if (low === high) return money(low);
  return `${money(low)} to ${money(high)}`;
}

// ── Scoring ─────────────────────────────────────────────────────────────────────
type Relation = "exact" | "close" | "related" | "outside" | "none";

/** The relation a taxonomy fit stands for (scoring-rules v5 categoryFit). */
function relationOf(fit: number, code: string | null): Relation {
  if (!code) return "none";
  if (fit >= 1) return "exact";
  if (fit >= 0.7) return "close";
  if (fit >= 0.35) return "related";
  return "outside";
}

function naicsFit(
  code: string | null,
  firm: string[],
): { fit: number; relation: Relation; matched: string | null } {
  if (!code) return { fit: 0.5, relation: "none", matched: null };
  let best: { fit: number; relation: Relation; matched: string | null } = {
    fit: 0,
    relation: "outside",
    matched: null,
  };
  for (const own of firm) {
    const candidate: { fit: number; relation: Relation; matched: string } =
      own === code
        ? { fit: 1, relation: "exact", matched: own }
        : own.slice(0, 4) === code.slice(0, 4)
          ? { fit: 0.7, relation: "close", matched: own }
          : own.slice(0, 3) === code.slice(0, 3)
            ? { fit: 0.35, relation: "related", matched: own }
            : { fit: 0, relation: "outside", matched: own };
    if (candidate.fit > best.fit) best = candidate;
  }
  return best;
}

/** Location sensitivity by the matched category (§9). Food service and building work
 *  are place-bound. */
function sensitivity(code: string | null): keyof typeof WEIGHTS {
  if (!code) return "medium";
  if (code.startsWith("72")) return "high";
  if (code.startsWith("23")) return "high";
  return "medium";
}

export type WhoMayBidKind =
  | "undetermined"
  | "not_shared"
  | "local"
  | "small_business"
  | "program"
  | "program_one"
  | "held"
  /** Planned for one chosen company, and she holds that program's certificate. */
  | "program_one_held"
  /** A program set-aside, and her certificates are not on record. */
  | "program_unknown"
  /** A set-aside code not in the table. Never read as open to all. */
  | "unlisted"
  /** The buyer's record names a contract only its holders can order under. */
  | "vehicle_only"
  /** The buyer's record says the work will not be competed. */
  | "not_competed";

export interface WhoMayBid {
  kind: WhoMayBidKind;
  text: string;
  term: string | null;
  note: string | null;
  /** The program's short name, e.g. "8(a)", on program readings. */
  program?: string;
  /** The contract vehicle, on a vehicle_only reading. */
  vehicle?: string;
  /** Set when the reading is ours, not the record's: the reason. */
  ourRead?: string;
}

function readWhoMayBid(
  r: HigherGovForecast,
  firm: ForecastFirm,
  prior: PriorAward | null = null,
  buyer: BuyerRecord | null = null,
): { who: WhoMayBid; reserve: number; partner: boolean } {
  if (r.lane !== "sled" && buyer) {
    // The buyer's own record decides before any code: not competed, or holders only.
    if (!buyer.competed && buyer.program !== "8(a)")
      return {
        who: {
          kind: "not_competed",
          text: WHO_MAY_BID.notCompeted.text(buyer.incumbent),
          term: WHO_MAY_BID.notCompeted.term,
          note: null,
        },
        reserve: 0,
        partner: false,
      };
    if (buyer.vehicle)
      return {
        who: {
          kind: "vehicle_only",
          text: WHO_MAY_BID.vehicleOnly.text(buyer.vehicle),
          term: WHO_MAY_BID.vehicleOnly.term,
          note: null,
          vehicle: buyer.vehicle,
        },
        reserve: 0,
        partner: false,
      };
  }
  const raw = r.setAsideCode?.trim().toUpperCase() || null;
  const undecided = isUndecidedSetAside(raw);
  // The buyer's record can decide what the code leaves open.
  const fromBuyer =
    r.lane !== "sled" && buyer?.program === "8(a)"
      ? buyer.competed
        ? "8A"
        : "8AN"
      : undecided && buyer?.setAside === "full"
        ? "SBA"
        : null;
  // Work bought through 8(a) stays in 8(a) unless SBA releases it (13 CFR 124.504(d)).
  const prior8a =
    !fromBuyer && undecided && r.lane !== "sled" && /8\(A\)/i.test(prior?.setAsideText ?? "");
  const read = readSetAside(
    r,
    firm,
    fromBuyer ?? (prior8a ? (/sole source/i.test(prior?.setAsideText ?? "") ? "8AN" : "8A") : raw),
  );
  if (prior8a)
    read.who = {
      ...read.who,
      text: WHO_MAY_BID.likely(read.who.text),
      ourRead: WHO_MAY_BID.likelyWhy,
    };
  return read;
}

export function readSetAside(
  r: HigherGovForecast,
  firm: ForecastFirm,
  setAside: string | null,
): { who: WhoMayBid; reserve: number; partner: boolean } {
  if (r.lane === "sled") {
    return {
      who: {
        kind: "local",
        text: WHO_MAY_BID.local.text,
        term: null,
        note: WHO_MAY_BID.local.note,
      },
      reserve: 0,
      partner: false,
    };
  }
  // Codes are trimmed and upper-cased. A blank code is no code.
  const code = setAside?.trim().toUpperCase() || null;
  if (code == null) {
    return {
      who: { kind: "not_shared", text: WHO_MAY_BID.notShared.text, term: null, note: null },
      reserve: 0,
      partner: false,
    };
  }
  if (isUndecidedSetAside(code)) {
    return {
      who: {
        kind: "undetermined",
        text: WHO_MAY_BID.undetermined.text,
        term: WHO_MAY_BID.undetermined.term,
        note: null,
      },
      reserve: 0,
      partner: false,
    };
  }
  if (SMALL_BUSINESS_CODES.has(code)) {
    const copy = code === "SBP" ? WHO_MAY_BID.smallBusinessPart : WHO_MAY_BID.smallBusiness;
    return {
      who: { kind: "small_business", text: copy.text, term: copy.term, note: null },
      reserve: firm.isSmall === true ? RESERVE.smallBusiness : 0,
      partner: false,
    };
  }
  const rule = PROGRAM_CODES[code];
  if (rule) {
    const certified = rule.needs.some((c) => firm.certs.includes(c));
    // A sole source is planned for one company. Holding the certificate makes her a
    // company the office and SBA could choose (13 CFR 124.502-124.503, 127.503(c)).
    if (rule.soleSource && certified) {
      return {
        who: {
          kind: "program_one_held",
          text: WHO_MAY_BID.programOneHeld.text(rule.plain),
          term: WHO_MAY_BID.programOneCompany.term(rule.term),
          note: null,
          program: rule.term,
        },
        reserve: 0,
        partner: false,
      };
    }
    // Without her certificates on record, Grant cannot say either way.
    if (!certified && !firm.certsKnown) {
      return {
        who: {
          kind: "program_unknown",
          text: WHO_MAY_BID.programUnknown.text(rule.plain),
          term: (rule.soleSource ? WHO_MAY_BID.programOneCompany : WHO_MAY_BID.program).term(
            rule.term,
          ),
          note: null,
        },
        reserve: 0,
        partner: false,
      };
    }
    const holds = !rule.soleSource && certified;
    if (holds) {
      return {
        who: {
          kind: "held",
          text: WHO_MAY_BID.held.text(rule.plain),
          term: WHO_MAY_BID.held.term(rule.term),
          note: null,
        },
        reserve: RESERVE.niche,
        partner: false,
      };
    }
    // Forecast rule (§5): a program set-aside she does not hold routes to a partner.
    // It does not cap — nothing is final on a forecast.
    const copy = rule.soleSource ? WHO_MAY_BID.programOneCompany : WHO_MAY_BID.program;
    return {
      who: {
        kind: rule.soleSource ? "program_one" : "program",
        text: copy.text(rule.plain),
        term: copy.term(rule.term),
        note: null,
        program: rule.term,
      },
      reserve: 0,
      partner: true,
    };
  }
  // A code not in SAM.gov's program list is never read as open to all.
  return {
    who: {
      kind: "unlisted",
      text: WHO_MAY_BID.unlisted.text,
      term: WHO_MAY_BID.unlisted.term(code),
      note: null,
    },
    reserve: 0,
    partner: false,
  };
}

export interface Reason {
  ok: boolean;
  text: string;
}

export type StepKind =
  | "renew"
  | "register"
  | "check_registration"
  | "last_contract"
  | "partner"
  | "email_buyer"
  | "meeting";

export interface Step {
  kind: StepKind;
  title: string;
  body: string;
  /** The one chip a card shows for this step, when it is the first. */
  chip: string | null;
  /** Sentence shown after "Do this first:". */
  first: string;
  term: string | null;
  link: { label: string; href: string; external: boolean; search?: Record<string, string> } | null;
  /** A fixed date the step happens on, such as a public meeting. */
  on?: string;
}

export interface Lifecycle {
  state: "open" | "closed" | "stale";
}

export type RegistrationGap = "not_registered" | "lapsed" | "unknown_end" | "ends_soon";

export interface ScoredForecast {
  id: string;
  record: HigherGovForecast;
  facts: ForecastFacts;
  lane: "federal" | "sled";
  /** Null when the record is too thin to publish a fit (SLED floor, §8). */
  score: number | null;
  fit: FitTier | null;
  published: boolean;
  heldBack: "other_state" | "thin" | null;
  /** The firm's government registration against this forecast, federal and open only.
   *  Null status never means "no gap": not registered and lapsed are gaps of their own. */
  registration: {
    gap: RegistrationGap | null;
    endsOn: string | null;
    /** The bid window ends more than a year away: one renewal will not reach it. */
    far: boolean;
  };
  /** A set-aside for small businesses or a program: she must be small for its industry code. */
  sizeCheck: boolean;
  /** Both the job's value and the firm's biggest past job are known, so size can be judged. */
  sizeKnown: boolean;
  /** My Business says the firm is small. False means not on record, never "not small". */
  smallKnown: boolean;
  /** The partner route on work kept for small businesses: the partner rules apply. */
  partnerRules: boolean;
  /** Done in person: true, false (supplies), or null when there is no industry code. */
  inPerson: boolean | null;
  /** The buyer's own forecast record, where one was read. */
  buyer: BuyerRecord | null;
  /** The document a local forecast was found in, where one was read. */
  document: SourceDocument | null;
  /** The firm's states are on record, so "outside your area" can be said at all. */
  statesKnown: boolean;
  status: CaptureStatus;
  lifecycle: Lifecycle["state"];
  timing: Timing;
  place: Place;
  inArea: boolean;
  value: string | null;
  whoMayBid: WhoMayBid;
  boughtBefore: { text: string; term: string | null } | null;
  foundIn: string | null;
  partnerRoute: boolean;
  confidence: "high" | "medium" | "low";
  reasons: Reason[];
  verdict: string;
  steps: Step[];
  firstStep: Step | null;
  unknowns: string[];
  priorAward: PriorAward | null;
  answers: { doFirst: string };
}

function forecastConfidence(
  r: HigherGovForecast,
  timing: Timing,
  place: Place,
): "high" | "medium" | "low" {
  if (timing.precision === "unknown") return "low";
  const code = r.setAsideCode?.trim().toUpperCase() || null;
  const decided = code != null && (SMALL_BUSINESS_CODES.has(code) || code in PROGRAM_CODES);
  const thinText = !r.hgText || r.hgText === r.hgTitle;
  const unknown = [!decided, !place.concrete, r.valHigh == null, !r.naicsCode, thinText].filter(
    Boolean,
  ).length;
  if (unknown >= 3) return "low";
  const exactEnough = timing.precision === "exact" || timing.precision === "month";
  if (decided && exactEnough && r.valHigh != null && r.naicsCode && r.pscCode) return "high";
  return "medium";
}

function timePhrase(runwayDays: number | null): string {
  if (runwayDays == null) return VERDICT.timeNone;
  if (runwayDays === 0) return VERDICT.timeAnyDay;
  if (runwayDays < 60) return VERDICT.timeWeeks(Math.max(1, Math.round(runwayDays / 7)));
  const months = Math.round(runwayDays / 30.44);
  return runwayDays <= RUNWAY.positionEarly
    ? VERDICT.timeMonthsReady(months)
    : VERDICT.timeMonths(months);
}

function sentence(text: string): string {
  const t = text.trim();
  return /[.?!]$/.test(t) ? t : `${t}.`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Scores one forecast for one firm. Every input is passed in; nothing is looked up. */
export function scoreForecast(
  r: HigherGovForecast,
  firm: ForecastFirm,
  today: string,
  /** What Hunter read from the record. */
  facts: ForecastFacts,
  records: ForecastPublicRecords,
): ScoredForecast {
  const f = facts;
  const local = r.lane === "sled";

  const timing = readTiming(r, f, today);
  const place = readPlace(r, f);
  // With no states on record, no place is "outside your area": it is unknown for her.
  const statesKnown = firm.states.length > 0;
  const inArea = statesKnown && place.states.some((s) => firm.states.includes(s));

  // Structured fit (§6). Local codes are HigherGov's guess, so they count for less.
  const prefixFit = naicsFit(r.naicsCode, firm.naics);
  // The real taxonomy's fit, where the member's match record gives one, replaces the
  // code-prefix stand-in, so Hunter reads the code the same way here as on Opportunities.
  const structured =
    f.codeFit == null
      ? prefixFit
      : { ...prefixFit, fit: f.codeFit, relation: relationOf(f.codeFit, r.naicsCode) };
  const confStructured = local ? SLED_STRUCTURED_CONF : r.naicsCode || r.pscCode ? 1 : 0.5;

  // Semantic fit (§7), standing in: scopeFit from facts.ts.
  const confSemantic = Math.min(EXTRACTION_CONF[f.extraction], local ? SLED_EXTRACTION_CAP : 1);
  const weightS = BLEND.structured * confStructured;
  const weightM = BLEND.semantic * confSemantic;
  const capability =
    weightS + weightM > 0
      ? (weightS * structured.fit + weightM * f.scopeFit) / (weightS + weightM)
      : 0;

  // Location (§9).
  const weights = WEIGHTS[sensitivity(structured.matched ?? firm.naics[0] ?? null)];
  const location = !place.concrete || !statesKnown ? weights.notSpecified : inArea ? 1 : 0;

  const fitBand = Math.round((weights.cap * capability + weights.loc * location) * FIT_CAP);
  const priorAward = records.priorAward;
  const buyer = local ? null : records.buyer;
  const { who, reserve, partner } = readWhoMayBid(r, firm, local ? null : priorAward, buyer);
  // Supplies ship from anywhere. With no industry code we do not know, and an unknown
  // never produces "outside your area" (D-C4).
  const inPerson: boolean | null = r.naicsCode ? !/^(31|32|33|42)/.test(r.naicsCode) : null;
  const outside = place.concrete && statesKnown && !inArea;

  // Caps (§5): the lowest applicable wins.
  const caps: number[] = [];
  if (f.directAward) caps.push(CAP_CANNOT_BID);
  const wrongWork = local
    ? f.extraction !== "none" && f.scopeFit < SEM_LOW_SLED
    : structured.relation === "outside" && f.extraction !== "none" && f.scopeFit < SEM_LOW;
  if (wrongWork) caps.push(CAP_WRONG_WORK);
  if (weights === WEIGHTS.high && outside && inPerson === true) caps.push(CAP_PLACE);
  const score = Math.min(Math.max(0, Math.min(100, fitBand + reserve)), ...caps);

  // SLED floor (§8): with a guessed code and a thin record, publish no fit at all.
  const published = !(local && confStructured <= 0.5 && confSemantic <= 0.5);

  const fit: FitTier | null = !published
    ? null
    : f.directAward
      ? "cannot_bid"
      : score >= 80
        ? "best"
        : score >= 60
          ? "good"
          : score >= 40
            ? "possible"
            : "weak";

  const lifecycle: ScoredForecast["lifecycle"] =
    f.lifecycle?.state ?? (timing.end && timing.end < today ? "stale" : "open");
  const status = captureStatus(timing.runwayDays);

  // Held back from the ranked list: a guess too thin to judge, or local work in a
  // state she does not serve (§9: far-away local work should not be surfaced).
  const heldBack: ScoredForecast["heldBack"] = !published
    ? "thin"
    : local && place.concrete && statesKnown && !inArea
      ? "other_state"
      : null;

  const valueHigh = r.valHigh;
  const tooBig =
    valueHigh != null &&
    firm.biggestPastJob != null &&
    valueHigh > RIGHT_SIZE_MULTIPLE * firm.biggestPastJob;
  const small = valueHigh != null && firm.smallestTarget != null && valueHigh < firm.smallestTarget;
  const partnerRoute = partner || tooBig;
  const confidence = forecastConfidence(r, timing, place);
  const doc = records.document;
  const sizeKnown = valueHigh != null && firm.biggestPastJob != null;
  // Nobody can send a price on work that is not competed or kept for a contract's holders.
  const closedToBids = who.kind === "not_competed" || who.kind === "vehicle_only";

  // The registration must be active when a price is sent and at award (FAR 52.204-7).
  // Not registered, lapsed and an unreadable end date are gaps. So is one that ends
  // before the window closes, or, with no window, within the capture horizon.
  const reg = firm.registration;
  const registrationGap: RegistrationGap | null =
    local || lifecycle !== "open" || f.directAward || closedToBids
      ? null
      : reg.status === "not_registered"
        ? "not_registered"
        : reg.status !== "active" || (reg.endsOn != null && reg.endsOn < today)
          ? "lapsed"
          : reg.endsOn == null
            ? "unknown_end"
            : timing.end
              ? reg.endsOn <= timing.end
                ? "ends_soon"
                : null
              : daysBetween(today, reg.endsOn) <= RUNWAY.startCapture
                ? "ends_soon"
                : null;
  const registrationFar = !!timing.end && daysBetween(today, timing.end) > 365;
  const sizeCheck =
    !local &&
    lifecycle === "open" &&
    !f.directAward &&
    [
      "small_business",
      "program",
      "program_one",
      "held",
      "program_one_held",
      "program_unknown",
    ].includes(who.kind);

  // Why-lines under the verdict.
  const reasons: Reason[] = [];
  if (f.lifecycle) reasons.push({ ok: false, text: f.lifecycle.note });
  else if (f.directAward) reasons.push({ ok: false, text: f.directAward });
  const workOk = f.scopeFit >= 0.5 || (f.extraction === "none" && structured.relation === "exact");
  if (!f.lifecycle && !f.directAward) reasons.push({ ok: workOk, text: f.work });
  const placeNames = listStates(place.states);
  if (!place.concrete) reasons.push({ ok: false, text: REASON.noPlace });
  else if (!statesKnown) {
    // No reason either way until her states are on record.
  } else if (inArea) reasons.push({ ok: true, text: REASON.inArea });
  else if (inPerson !== true) {
    // Work that can be done from anywhere, or that we cannot tell, is not "outside".
  } else if (place.states.length > 1)
    reasons.push({ ok: false, text: REASON.outOfAreaMany(placeNames) });
  else reasons.push({ ok: false, text: REASON.outOfArea(placeNames) });
  // Size matters when she could do the work, or when it changes how she would do it.
  // "The right size" beside building work she does not do tells her nothing. With no
  // past job size on record there is nothing to compare, so the size claim waits.
  if (!f.lifecycle && !f.directAward && valueHigh != null) {
    if (tooBig) reasons.push({ ok: false, text: REASON.tooBig });
    else if (small) reasons.push({ ok: false, text: REASON.small(money(valueHigh)) });
    else if (workOk && sizeKnown) reasons.push({ ok: true, text: REASON.rightSize });
  }

  const firstNegative = reasons.find((x) => !x.ok)?.text ?? f.work;
  const verdict = !published
    ? VERDICT.thin
    : lifecycle === "closed"
      ? VERDICT.closed
      : lifecycle === "stale"
        ? VERDICT.stale
        : fit === "cannot_bid"
          ? VERDICT.cannotBid
          : f.headline
            ? f.headline
            : fit === "weak"
              ? VERDICT.weak(firstNegative)
              : `${FIT_LABEL[fit as FitTier]}. ${timePhrase(timing.runwayDays)}`;

  // Next steps (§11.1, "Recommended action on a forecast"). Only when there is
  // something worth doing: an open forecast she could plausibly pursue.
  const steps: Step[] = [];
  const pursue =
    published && lifecycle === "open" && (fit === "best" || fit === "good" || fit === "possible");
  if (pursue && partnerRoute) {
    {
      steps.push({
        kind: "partner",
        chip: STEP_CHIP.partner,
        title: STEP.partner.title,
        body: STEP.partner.body,
        first: STEP.partner.first,
        term: null,
        link: {
          label: STEP.partner.cta,
          href: STEP.partner.href,
          external: false,
          search: { tab: "whos-winning" },
        },
      });
    }
  }
  // A registration step costs nothing, so it comes with its card at any confidence or fit.
  if (published && lifecycle === "open") {
    if (registrationGap === "not_registered") {
      steps.push({
        kind: "register",
        chip: STEP_CHIP.register,
        title: STEP.register.title,
        body: STEP.register.body,
        first: STEP.register.first,
        term: STEP.register.term,
        link: { label: STEP.register.cta, href: STEP.register.href, external: true },
      });
    } else if (registrationGap === "unknown_end") {
      steps.push({
        kind: "check_registration",
        chip: STEP_CHIP.checkRegistration,
        title: STEP.checkRegistration.title,
        body: STEP.checkRegistration.body,
        first: STEP.checkRegistration.first,
        term: STEP.checkRegistration.term,
        link: {
          label: STEP.checkRegistration.cta,
          href: STEP.checkRegistration.href,
          external: true,
        },
      });
    } else if (registrationGap) {
      const ends = registrationGap === "ends_soon" && reg.endsOn ? longDate(reg.endsOn) : null;
      steps.push({
        kind: "renew",
        chip: STEP_CHIP.renew,
        title: registrationFar && ends ? STEP.renew.titleYearly : STEP.renew.title,
        body: ends ? STEP.renew.body(ends) : STEP.renew.bodyLapsed,
        first: ends ? STEP.renew.first(ends) : STEP.renew.firstLapsed,
        term: STEP.renew.term,
        link: { label: STEP.renew.cta, href: STEP.renew.href, external: true },
      });
    }
  }
  if (pursue) {
    if (!local && priorAward && (status === "start_capture" || status === "position_early")) {
      steps.push({
        kind: "last_contract",
        chip: null,
        title: STEP.lastContract.title,
        body: STEP.lastContract.body(priorAward.awardee),
        first: STEP.lastContract.first(priorAward.awardee),
        term: null,
        link: priorAward.noticeUrl
          ? { label: STEP.lastContract.cta, href: priorAward.noticeUrl, external: true }
          : null,
      });
    }
    // "Engage the buyer" only with a specific, named reason (§11.1).
    if (local && doc?.upcoming && doc.upcoming.on >= today) {
      const on = longDate(doc.upcoming.on);
      const sameBody = doc.upcoming.body === doc.body;
      steps.push({
        kind: "meeting",
        on: doc.upcoming.on,
        chip: STEP_CHIP.meeting(on),
        title: STEP.meeting.title(doc.upcoming.body, on),
        body: sameBody ? STEP.meeting.body : STEP.meeting.bodyElsewhere(doc.upcoming.body),
        first: STEP.meeting.first(doc.upcoming.body, on),
        term: null,
        // The meetings page is the source's body. A meeting of another body gets no link.
        link:
          sameBody && r.sourceLink?.opens === "meetings"
            ? { label: STEP.meeting.cta, href: r.sourceLink.url, external: true }
            : null,
      });
    }
    // Named reasons to write to the buyer: who may bid is not decided or not shared, and
    // hearing from businesses helps them decide (FAR 19.502-2); or the work is planned for
    // one company in a program she is certified in, and the office and SBA choose it.
    const writeReason =
      who.kind === "program_one_held"
        ? who.program === "8(a)"
          ? "held8a"
          : "heldOther"
        : who.kind === "undetermined" || who.kind === "not_shared"
          ? who.kind
          : null;
    if (!local && writeReason && firm.isSmall !== false && r.contactName && r.contactEmail) {
      // What to say names only what My Business records: certificates, then small status.
      const names = firm.certs.map((c) => CERT_NAME[c]?.term ?? c);
      const pitch: EmailPitch =
        writeReason === "held8a" || writeReason === "heldOther"
          ? { kind: "held" }
          : names.length
            ? { kind: "certs", names: listAnd(names) }
            : firm.isSmall === true
              ? { kind: "small" }
              : { kind: "unknown" };
      steps.push({
        kind: "email_buyer",
        chip: STEP_CHIP.email_buyer,
        title: STEP.emailBuyer.title(r.contactName),
        body: [
          STEP.emailBuyer.body[writeReason],
          STEP.emailBuyer.say(pitch),
          buyer?.specialist ? STEP.emailBuyer.specialist(buyer.specialist) : null,
        ]
          .filter(Boolean)
          .join(" "),
        first: STEP.emailBuyer.first(r.contactName, pitch),
        term: null,
        link: {
          label: STEP.emailBuyer.cta(r.contactName),
          href: `mailto:${r.contactEmail}`,
          external: true,
        },
      });
    }
  }
  const firstStep = steps[0] ?? null;

  // Still unknown (§12): gaps in the buyer's disclosure, never in the firm.
  const unknowns: string[] = [];
  if (
    !f.directAward &&
    (local || who.kind === "undetermined" || who.kind === "not_shared" || who.kind === "unlisted")
  )
    unknowns.push(UNKNOWN.whoMayBid);
  if (timing.precision !== "exact" && !f.directAward && !closedToBids) unknowns.push(UNKNOWN.date);
  if (lifecycle === "open" && outside && inPerson == null) unknowns.push(UNKNOWN.onSite);
  if (!local && (!r.hgText || r.hgText === r.hgTitle)) unknowns.push(UNKNOWN.work);
  if (!place.concrete) unknowns.push(UNKNOWN.place);
  if (valueHigh == null) unknowns.push(UNKNOWN.value);
  if (!local && r.oppType === "Recompete" && !priorAward) unknowns.push(UNKNOWN.lastContract);
  if (!r.contactName) unknowns.push(UNKNOWN.contact);
  // Mandatory sources can take the work before any bid: blind vendors for federal
  // cafeterias (34 CFR 395.33), and the AbilityOne list for services on it (FAR 8.7).
  // A direct award already names who gets it, so the question is settled.
  if (
    !local &&
    lifecycle === "open" &&
    !f.directAward &&
    /^(722310|722514)$/.test(r.naicsCode ?? "")
  )
    unknowns.push(UNKNOWN.blindVendors);
  // AbilityOne covers food service and base support as well as cleaning and grounds.
  if (
    !local &&
    lifecycle === "open" &&
    !f.directAward &&
    /^(722310|561210|561720|561730|812332|493110|561110)$/.test(r.naicsCode ?? "")
  )
    unknowns.push(UNKNOWN.abilityOne);

  const boughtBefore = local
    ? null
    : r.oppType === "Recompete"
      ? BOUGHT_BEFORE.again
      : r.oppType === "New"
        ? BOUGHT_BEFORE.isNew
        : BOUGHT_BEFORE.notShared;

  // Grant's derived answer to "What should I do first?".
  const answers = {
    doFirst: firstStep ? sentence(capitalise(firstStep.first)) : ASK.doNothing,
  };

  return {
    id: r.id,
    record: r,
    facts: f,
    lane: r.lane,
    score: published ? score : null,
    fit,
    published,
    heldBack,
    registration: { gap: registrationGap, endsOn: reg.endsOn, far: registrationFar },
    sizeCheck,
    smallKnown: firm.isSmall === true,
    // A partner that does the main work can cost a small business its status (13 CFR
    // 121.103(h)), so the partner route on a kept-for-small job carries the rules.
    partnerRules:
      partnerRoute &&
      ["small_business", "held", "program_one_held", "program_unknown"].includes(who.kind),
    inPerson,
    buyer,
    document: doc,
    sizeKnown,
    statesKnown,
    status,
    lifecycle,
    timing,
    place,
    inArea,
    value: valueLabel(r.valLow, r.valHigh),
    whoMayBid: who,
    boughtBefore,
    foundIn: local ? (f.found ?? null) : null,
    partnerRoute,
    confidence,
    reasons,
    verdict,
    steps,
    firstStep,
    unknowns,
    priorAward: local ? null : priorAward,
    answers,
  };
}

// ── The list ────────────────────────────────────────────────────────────────────
const FIT_RANK: Record<FitTier, number> = { best: 0, good: 1, possible: 2, weak: 3, cannot_bid: 4 };

/** Best fit first; a closed or stale forecast sinks to the bottom of its group.
 *  The engine's own order, kept for its tests; the list page orders by the server's `sort` and does not call it. */
export function byBestFit(a: ScoredForecast, b: ScoredForecast): number {
  const open = Number(a.lifecycle !== "open") - Number(b.lifecycle !== "open");
  if (open) return open;
  const tier = (a.fit ? FIT_RANK[a.fit] : 5) - (b.fit ? FIT_RANK[b.fit] : 5);
  if (tier) return tier;
  const score = (b.score ?? -1) - (a.score ?? -1);
  if (score) return score;
  const runway = (a.timing.runwayDays ?? Infinity) - (b.timing.runwayDays ?? Infinity);
  if (runway) return runway;
  return a.facts.title.localeCompare(b.facts.title);
}

/** Supplies can be sent from anywhere; services and building work happen in a place.
 *  Null when the industry code is missing: the out-of-area rule then does not fire. */
export function isInPerson(f: ScoredForecast): boolean | null {
  return f.inPerson;
}

function listAnd(items: string[]): string {
  return items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The engine's ranked list, kept for its tests; the list page renders server rows and does not call it. */
export function rankedForecasts(list: ScoredForecast[]): ScoredForecast[] {
  return list.filter((f) => f.heldBack == null).sort(byBestFit);
}

/** Forecasts for you: the ones Hunter picked. Open, not held back, and a best, good or
 *  possible fit. Weaker fits, far-away local work and thin records are in All forecasts,
 *  as No-Bid work is in All opportunities.
 *  The engine's own pick, kept for its tests. The page shows the server's For you (her
 *  non-low `matches` rows) and does not call it. */
export function forYouForecasts(list: ScoredForecast[]): ScoredForecast[] {
  return rankedForecasts(list).filter(
    (f) => f.lifecycle === "open" && (f.fit === "best" || f.fit === "good" || f.fit === "possible"),
  );
}

/** All forecasts: every record, best fit first, closed and out-of-date ones last.
 *  Kept for the engine's tests; the list page renders server rows and does not call it. */
export function allForecasts(list: ScoredForecast[]): ScoredForecast[] {
  return [...list].sort(byBestFit);
}

/** Open forecasts per capture status. A test oracle for the server's `captureCounts`; the page reads those and does not call it. */
export function statusCounts(list: ScoredForecast[]): Record<CaptureStatus, number> {
  const counts: Record<CaptureStatus, number> = {
    act_now: 0,
    start_capture: 0,
    position_early: 0,
    watch: 0,
  };
  for (const f of list) if (f.lifecycle === "open") counts[f.status] += 1;
  return counts;
}

/** How much of the buyer's description the search reads: the first 2,000 characters.
 *  The server holds the same number (`FORECAST_SEARCH_DESCRIPTION_CHARS`), and
 *  `forecast-filter.fixtures.json` holds both sides to it. */
export const SEARCH_DESCRIPTION_CHARS = 2_000;

/** Search reads what she sees: Hunter's title, the buyer, the place and the buyer's title.
 *  It also reads the start of the buyer's description (`SEARCH_DESCRIPTION_CHARS`).
 *  The parity oracle for the server's search (`ForecastListReader.searchKeys`, `filters.parity.test.ts`); the list page renders server rows and does not call it. */
export function matchesSearch(f: ScoredForecast, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [
    f.facts.title,
    f.record.agencyName,
    f.record.agencyAbbr,
    f.place.label,
    f.record.hgTitle,
    f.record.hgText?.slice(0, SEARCH_DESCRIPTION_CHARS),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((w) => hay.includes(w));
}
