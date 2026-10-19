// Grant's take on a forecast: counted facts over public award records.
//
// The figures are sample data. They are internally consistent, they name only
// the made-up companies of firms.ts, and a forecast that is not food service
// gets no counted fact (the page then adds nothing to "How to win it").
//
// DEMO: for the agency, the facts are counted from the agency's award record
// (src/demo/members/agency/market/awards.ts, each award modeled on a real one), so
// Grant's take, the Awards page and Partners give the same numbers.

import { isoDaysFromNow } from "@/demo/story/clock";
import { MEMBER } from "@/demo/member";
import { PERSONA } from "@/demo/story/persona";
import { allAwardRecords } from "./awardsData";
import type { AwardRecord } from "@/lib/awardsApi";
import type { AwardTally, BuyerCitation, ForecastCitation } from "@/lib/grant/types";
import type {
  ForecastTakeCountedFact,
  ForecastTakeCountedKey,
  ForecastTakeFact,
  ForecastTakeResponse,
} from "@/lib/forecasts/grantTakeApi";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { AMIRA_FIRM, CAROLINA_DINING, OTHER_FIRMS } from "./firms";
import { FORECAST_RECORDS } from "./forecastData";
import { FORT_BRAGG_FORECAST_KEY, POPE_FORECAST_KEY, SEYMOUR_FORECAST_KEY } from "./forecastLocalSeeds";

const NOT_CHECKED: ForecastTakeFact = { state: "notChecked" };
const YEARS = "FY2021–FY2025";

type Size = "small" | "mid" | "large";

const SIZE_FACTS: Record<
  Size,
  { median: number; low: number; high: number; awards: number; offers: number; winners: number }
> = {
  small: { median: 210_000, low: 120_000, high: 480_000, awards: 64, offers: 4, winners: 9 },
  mid: { median: 1_400_000, low: 800_000, high: 2_600_000, awards: 41, offers: 3, winners: 6 },
  large: { median: 4_800_000, low: 2_100_000, high: 9_500_000, awards: 23, offers: 3, winners: 4 },
};

function sizeOf(valHigh: number | null): Size {
  if (valHigh == null || valHigh <= 1_000_000) return "small";
  return valHigh <= 3_000_000 ? "mid" : "large";
}

/** The member's codes, in the names NAICS gives them. */
const MEMBER_NAICS_LABEL: Record<string, string> = Object.fromEntries([
  [PERSONA.primaryNaics, PERSONA.primaryNaicsLabel],
  ...PERSONA.secondaryNaics.map((n) => [n.code, n.label]),
]);

function naicsLabel(code: string): string {
  if (MEMBER !== "caterer") return MEMBER_NAICS_LABEL[code] ?? PERSONA.primaryNaicsLabel;
  if (code === "722320") return "Caterers";
  if (code === "722330") return "Mobile Food Services";
  return "Food Service Contractors";
}

function tally(
  kind: AwardTally["kind"],
  matchedOn: string,
  over: Partial<AwardTally> & Pick<AwardTally, "figure" | "countedOver">,
): ForecastTakeCountedFact {
  const asOf = isoDaysFromNow(-2, 6);
  const t: AwardTally = {
    kind,
    low: null,
    high: null,
    matchedOn,
    yearsCovered: YEARS,
    sample: [],
    asOf,
    ...over,
  };
  return {
    state: "counted",
    figure: t.figure,
    basis: { countedOver: t.countedOver, matchedOn: t.matchedOn, yearsCovered: t.yearsCovered, atLeast: false },
    source: { label: kind, provenance: { type: "public", ref: `tally:${kind}`, tally: t } },
    asOf,
  };
}

/** Other forecasts from the same kind of buyer, for the "other forecasts" fact. */
function otherForecastFor(record: ForecastRecordDto): ForecastRecordDto | undefined {
  const pick = record.oppKey === POPE_FORECAST_KEY ? FORT_BRAGG_FORECAST_KEY : record.oppKey === SEYMOUR_FORECAST_KEY ? null : POPE_FORECAST_KEY;
  const key = record.agencyAbbr === "MICC" ? pick : null;
  return key ? FORECAST_RECORDS.find((r) => r.oppKey === key) : undefined;
}

function buyerFact(record: ForecastRecordDto): ForecastTakeCountedFact {
  const asOf = isoDaysFromNow(-2, 6);
  const office: BuyerCitation = {
    agencyKey: 2000 + (record.agencyName.length % 90),
    name: record.agencyName,
    abbreviation: record.agencyAbbr,
    agencyType: null,
    isDefense: record.agencyAbbr !== "VA",
    parents: [],
    buys: [{ code: record.naicsCode ?? "722310", description: naicsLabel(record.naicsCode ?? "722310"), awards: 22 }],
    awardsExamined: 38,
    setAsideAwards: 14,
    officers: null,
    asOf,
  };
  return {
    state: "counted",
    figure: 14,
    basis: { countedOver: 38, matchedOn: "Awards by this contracting office", yearsCovered: null, atLeast: false },
    source: { label: "This office's award record", provenance: { type: "public", ref: `buyer:${office.agencyKey}#setAside`, buyer: office } },
    asOf,
  };
}

function upcomingFact(record: ForecastRecordDto): ForecastTakeFact {
  const other = otherForecastFor(record);
  return other ? upcomingFactFor(other) : NOT_CHECKED;
}

function upcomingFactFor(other: ForecastRecordDto): ForecastTakeCountedFact {
  const asOf = isoDaysFromNow(-2, 6);
  const citation: ForecastCitation = {
    oppKey: other.oppKey,
    title: other.hunter.plainTitle,
    agencyName: other.agencyName,
    agencyKey: null,
    forecastType: other.oppType,
    expectedDate: other.dueOn,
    estValueLow: other.valLow,
    estValueHigh: other.valHigh,
    contractingOfficer: null,
    naicsCode: other.naicsCode,
    setAside: other.setAsideCode,
    popState: other.popState,
    alsoUpcoming: 1,
    asOf,
  };
  return {
    state: "counted",
    figure: 1,
    basis: { countedOver: 1, matchedOn: `This contracting office and NAICS ${other.naicsCode}`, yearsCovered: null, atLeast: false },
    source: { label: "This office's other forecasts", provenance: { type: "public", ref: `forecast:${other.oppKey}#expected`, forecast: citation } },
    asOf,
  };
}

// ── The agency: facts counted from its own award record ─────────────────────

const AGENCY_TRADE = new Set<string>([PERSONA.primaryNaics, ...PERSONA.secondaryNaics.map((n) => n.code)]);
const AGENCY_STATES = PERSONA.serviceStates as readonly string[];

/** The award-record buyer that matches a forecast's office, by name. */
const AGENCY_BUYER_OF: [RegExp, string][] = [
  [/Mission and Installation Contracting Command/, "MICC Fort Bragg"],
  [/USPFO for North Carolina/, "USPFO NC"],
  [/Program Contracting Activity Central/, "VA PCAC"],
  [/Network Contracting Office 6/, "VA NCO 6"],
  [/MARSOC/, "MARSOC"],
];

function fiscalYear(day: string): number {
  const [y, m] = day.split("-").map(Number);
  return m >= 10 ? y + 1 : y;
}

function medianOf(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** The value at a share of the way up the sorted list (nearest rank): the page calls 25%–75% "the middle half". */
function quantileOf(values: number[], p: number): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.round(p * (s.length - 1))];
}

function agencyCounted(record: ForecastRecordDto, counted: Record<ForecastTakeCountedKey, ForecastTakeFact>): void {
  const rows = allAwardRecords().filter(
    (a) =>
      a.naicsCode !== null &&
      AGENCY_TRADE.has(a.naicsCode) &&
      a.location.state !== null &&
      AGENCY_STATES.includes(a.location.state),
  );
  if (rows.length === 0) return;
  const fys = rows.map((a) => a.recency.awardedAt).filter((d): d is string => !!d).map(fiscalYear);
  const years = `FY${Math.min(...fys)}–FY${Math.max(...fys)}`;
  const matchedOn = "Advertising, marketing, design and video awards (NAICS 541810, 541613, 541430, 512110, 541820), NC, VA and SC";
  const values = rows.map((a) => a.obligated ?? 0);
  const t = (kind: AwardTally["kind"], over: Partial<AwardTally> & Pick<AwardTally, "figure" | "countedOver">) =>
    tally(kind, matchedOn, { yearsCovered: years, ...over });

  counted.comparableAwards = t("comparable-awards", {
    figure: medianOf(values),
    low: quantileOf(values, 0.25),
    high: quantileOf(values, 0.75),
    countedOver: rows.length,
  });
  const offers = rows.map((a) => a.offersReceived).filter((o): o is number => o !== null);
  counted.fieldSize = t("field-size", { figure: medianOf(offers), countedOver: offers.length });

  const by = new Map<string, { awards: number; total: number }>();
  for (const a of rows) {
    if (a.winner.awardeeKey === AMIRA_FIRM.key) continue; // the member herself
    const w = by.get(a.winner.name) ?? { awards: 0, total: 0 };
    w.awards += 1;
    w.total += a.obligated ?? 0;
    by.set(a.winner.name, w);
  }
  // "The firms with the most of these awards": most awards first, then the most money.
  const ranked = [...by.entries()].sort((a, b) => b[1].awards - a[1].awards || b[1].total - a[1].total);
  counted.marketWinners = t("market-winners", {
    figure: by.size,
    countedOver: by.size,
    firms: ranked.slice(0, 3).map(([name, w]) => ({ name, awards: w.awards, totalValue: w.total })),
  });

  const benched = rows.filter((a) => a.bench && a.bench.distinctSubs > 0);
  const subs = new Map<string, number>();
  for (const a of benched) for (const s of a.bench!.sampleSubs) subs.set(s.name, (subs.get(s.name) ?? 0) + (s.awards ?? 0));
  counted.subUse = t("sub-use", {
    figure: benched.length,
    countedOver: rows.length,
    subs: [...subs.entries()].slice(0, 3).map(([name, awards]) => ({ name, awards, total: null })),
  });

  const abbrev = AGENCY_BUYER_OF.find(([re]) => re.test(record.agencyName))?.[1];
  const office = abbrev ? allAwardRecords().filter((a) => a.agency.abbrev === abbrev) : [];
  if (office.length > 0) counted.buyer = buyerFactFrom(record, office);

  const other = FORECAST_RECORDS.find((r) => r.oppKey !== record.oppKey && r.agencyName === record.agencyName);
  if (other) counted.upcoming = upcomingFactFor(other);
}

/** The buyer fact from the award record: how many of this office's awards were set aside. */
function buyerFactFrom(record: ForecastRecordDto, office: AwardRecord[]): ForecastTakeCountedFact {
  const asOf = isoDaysFromNow(-2, 6);
  const setAside = office.filter((a) => a.setAside !== null).length;
  const citation: BuyerCitation = {
    agencyKey: 2000 + (record.agencyName.length % 90),
    name: record.agencyName,
    abbreviation: record.agencyAbbr,
    agencyType: null,
    isDefense: record.agencyAbbr !== "VA",
    parents: [],
    buys: [{ code: record.naicsCode ?? PERSONA.primaryNaics, description: naicsLabel(record.naicsCode ?? PERSONA.primaryNaics), awards: office.length }],
    awardsExamined: office.length,
    setAsideAwards: setAside,
    officers: null,
    asOf,
  };
  return {
    state: "counted",
    figure: setAside,
    basis: { countedOver: office.length, matchedOn: "Awards by this contracting office", yearsCovered: null, atLeast: false },
    source: { label: "This office's award record", provenance: { type: "public", ref: `buyer:${citation.agencyKey}#setAside`, buyer: citation } },
    asOf,
  };
}

/** The take for one forecast, or null when the key is not a forecast. */
export function buildForecastTake(oppKey: string): ForecastTakeResponse | null {
  const record = FORECAST_RECORDS.find((r) => r.oppKey === oppKey);
  if (!record) return null;

  const food = MEMBER === "caterer" && record.lane === "federal" && /^(722|311)/.test(record.naicsCode ?? "");
  const counted: Record<ForecastTakeCountedKey, ForecastTakeFact> = {
    comparableAwards: NOT_CHECKED,
    fieldSize: NOT_CHECKED,
    marketWinners: NOT_CHECKED,
    buyer: NOT_CHECKED,
    upcoming: NOT_CHECKED,
    subUse: NOT_CHECKED,
  };

  if (MEMBER !== "caterer" && record.lane === "federal" && AGENCY_TRADE.has(record.naicsCode ?? "")) {
    agencyCounted(record, counted);
  }

  if (food) {
    const code = record.naicsCode ?? "722310";
    const size = SIZE_FACTS[sizeOf(record.valHigh)];
    const state = record.popState ?? "NC";
    const where = ["NC", "VA", "SC"].includes(state) ? "NC, VA and SC" : state;
    const matchedOn = `NAICS ${code} · ${naicsLabel(code)}, ${where}`;
    const incumbent = oppKey === FORT_BRAGG_FORECAST_KEY;
    counted.comparableAwards = tally("comparable-awards", matchedOn, {
      figure: size.median,
      low: size.low,
      high: size.high,
      countedOver: size.awards,
    });
    counted.fieldSize = tally("field-size", matchedOn, { figure: size.offers, countedOver: Math.round(size.awards * 0.8) });
    const winners = incumbent
      ? [
          { name: CAROLINA_DINING.name, awards: 3, totalValue: 26_400_000 },
          { name: OTHER_FIRMS[0].name, awards: 2, totalValue: 5_100_000 },
          { name: OTHER_FIRMS[7].name, awards: 2, totalValue: 4_300_000 },
        ]
      : [
          { name: OTHER_FIRMS[1].name, awards: 5, totalValue: null },
          { name: OTHER_FIRMS[3].name, awards: 4, totalValue: null },
          { name: OTHER_FIRMS[5].name, awards: 3, totalValue: null },
        ];
    counted.marketWinners = tally("market-winners", matchedOn, {
      figure: size.winners,
      countedOver: size.winners,
      firms: winners,
    });
    counted.buyer = buyerFact(record);
    counted.upcoming = upcomingFact(record);
    counted.subUse = tally("sub-use", matchedOn, {
      figure: 6,
      countedOver: 6,
      subs: [
        { name: OTHER_FIRMS[2].name, awards: 2, total: 640_000 },
        { name: OTHER_FIRMS[8].name, awards: 1, total: 210_000 },
      ],
    });
  }

  return {
    oppKey,
    noticeType: "forecast",
    analyzedAt: isoDaysFromNow(0, 7),
    counted,
    reads: [],
    memberSources: {
      profile: "used",
      capabilityStatement: "used",
      learnedFacts: "empty",
      match: "used",
    },
  };
}
