// Test data only: Grant's take on a forecast, built from the wire interface in
// `grantTakeApi.ts` (not from a sample response). Shared by the take, read and page
// tests so each proves its rule against the same take.

import type { AwardCitation, AwardTally, BuyerCitation, ForecastCitation } from "../grant/types";
import type {
  ForecastTakeCountedFact,
  ForecastTakeCountedKey,
  ForecastTakeFact,
  ForecastTakeResponse,
} from "./grantTakeApi";

export const TAKE_AS_OF = "2026-09-20T00:00:00.000Z";
const MATCHED_ON = "NAICS 722310 · Food Service Contractors";
const YEARS = "FY2019–FY2024";

export const NOT_CHECKED: ForecastTakeFact = { state: "notChecked" };

function tally(kind: AwardTally["kind"], over: Partial<AwardTally> = {}): AwardTally {
  return {
    kind,
    figure: 1,
    low: null,
    high: null,
    countedOver: 1,
    matchedOn: MATCHED_ON,
    yearsCovered: YEARS,
    sample: [],
    asOf: TAKE_AS_OF,
    ...over,
  };
}

/** A counted fact over a tally, with the basis the tally carries. */
export function tallyFact(
  kind: AwardTally["kind"],
  over: Partial<AwardTally> = {},
): ForecastTakeCountedFact {
  const t = tally(kind, over);
  return {
    state: "counted",
    figure: t.figure,
    basis: {
      countedOver: t.countedOver,
      matchedOn: t.matchedOn,
      yearsCovered: t.yearsCovered,
      atLeast: false,
    },
    source: { label: kind, provenance: { type: "public", ref: `tally:${kind}`, tally: t } },
    asOf: TAKE_AS_OF,
  };
}

/** One award row, for a tally sample. */
export const AWARD: AwardCitation = {
  awardId: "W91234-24-C-0001",
  title: "Dining facility attendant services",
  description: null,
  awardeeName: "Acme Catering",
  agencyName: "General Services Administration",
  naicsCode: "722310",
  naicsDescription: null,
  value: 170000,
  offers: 4,
  fiscalYear: 2024,
  actionDate: null,
  setAside: null,
  extentCompeted: null,
  popState: null,
  solicitationId: null,
  sourceUrl: null,
  asOf: TAKE_AS_OF,
};

export const OFFICE: BuyerCitation = {
  agencyKey: 4321,
  name: "Fort Liberty Contracting Office",
  abbreviation: null,
  agencyType: null,
  isDefense: false,
  parents: [],
  buys: [],
  awardsExamined: 40,
  setAsideAwards: 22,
  officers: null,
  asOf: TAKE_AS_OF,
};

export const UPCOMING: ForecastCitation = {
  oppKey: "OTHER_FORECAST",
  title: "Dining hall support",
  agencyName: "Fort Liberty Contracting Office",
  agencyKey: 4321,
  forecastType: "New",
  expectedDate: "2027-01-15",
  estValueLow: null,
  estValueHigh: null,
  contractingOfficer: null,
  naicsCode: "722310",
  setAside: null,
  popState: "NC",
  alsoUpcoming: 2,
  asOf: TAKE_AS_OF,
};

const FULL_COUNTED: Record<ForecastTakeCountedKey, ForecastTakeFact> = {
  comparableAwards: tallyFact("comparable-awards", {
    figure: 170000,
    low: 90000,
    high: 400000,
    countedOver: 186,
  }),
  fieldSize: tallyFact("field-size", { figure: 4, countedOver: 120 }),
  marketWinners: tallyFact("market-winners", {
    figure: 31,
    countedOver: 31,
    firms: [
      { name: "Acme Catering", awards: 12, totalValue: 2_400_000 },
      { name: "Beta Food Group", awards: 9, totalValue: null },
      { name: "Gamma Kitchens", awards: 5, totalValue: null },
      { name: "Delta Meals", awards: 2, totalValue: null },
    ],
  }),
  buyer: {
    state: "counted",
    figure: 22,
    basis: {
      countedOver: 40,
      matchedOn: "Awards by this contracting office",
      yearsCovered: null,
      atLeast: false,
    },
    source: {
      label: "This office's award record",
      provenance: { type: "public", ref: "buyer:4321#setAside", buyer: OFFICE },
    },
    asOf: TAKE_AS_OF,
  },
  upcoming: {
    state: "counted",
    figure: 3,
    basis: {
      countedOver: 3,
      matchedOn: "This contracting office and NAICS 722310",
      yearsCovered: null,
      atLeast: false,
    },
    source: {
      label: "This office's other forecasts",
      provenance: { type: "public", ref: "forecast:OTHER_FORECAST#expected", forecast: UPCOMING },
    },
    asOf: TAKE_AS_OF,
  },
  subUse: tallyFact("sub-use", { figure: 6, countedOver: 6 }),
};

/** A take with every fact counted, or with `counted` changed as given. */
export function takeFixture(
  oppKey: string,
  counted: Partial<Record<ForecastTakeCountedKey, ForecastTakeFact>> = {},
): ForecastTakeResponse {
  return {
    oppKey,
    noticeType: "forecast",
    analyzedAt: "2026-09-25T10:00:00.000Z",
    counted: { ...FULL_COUNTED, ...counted },
    reads: [],
    memberSources: {
      profile: "used",
      capabilityStatement: "notChecked",
      learnedFacts: "notChecked",
      match: "notChecked",
    },
  };
}

/** A take in which no fact was checked. */
export function emptyTakeFixture(oppKey: string): ForecastTakeResponse {
  return takeFixture(oppKey, {
    comparableAwards: NOT_CHECKED,
    fieldSize: NOT_CHECKED,
    marketWinners: NOT_CHECKED,
    buyer: NOT_CHECKED,
    upcoming: NOT_CHECKED,
    subUse: NOT_CHECKED,
  });
}
