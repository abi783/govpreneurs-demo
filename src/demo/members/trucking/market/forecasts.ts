// THE TRUCKING COMPANY's forecasts (read through src/demo/explore/forecastData.ts,
// which picks the active member): 14 trucking, hauling and courier forecasts near
// Rockfish Run Freight's yard in Fayetteville, NC. Source: demo-storyboard/trucking-pack.md,
// section 13. The buyers are real offices; the forecast records are written for the
// demo, modeled on real awards and their end dates (named on each one). Dates count
// from today.
//
// Fort Bragg's logistics contract comes first (storyboard segment 10): task order
// 0001 under the EAGLE agreement W52P1J13G0027 ($606M obligated, 19 offers) ends
// 30 Jun 2027 and its 2024 re-solicitation (W519TC23R0019) shows no award. Only
// EAGLE holders can bid, and each year is about 20 times her revenue. Hunter says
// team up with Brightwater.
//
// Capture status comes from the days to the expected date (engine.ts RUNWAY):
// act now 45 days or fewer, start capture 120, position early 365, watch beyond.
//
// Modeled on (USAspending and SAM.gov, pulled 19 Oct 2026):
//   Fort Bragg EAGLE task order https://www.usaspending.gov/award/CONT_AWD_0001_9700_W52P1J13G0027_9700
//   EAGLE re-solicitation 2024  https://sam.gov/opp/bfe8b59dd83345cf9b0720f7a954dae0/view
//   VA Garner instruments       https://www.usaspending.gov/award/CONT_AWD_36C24625P1002_3600_-NONE-_-NONE-
//   Army hospital lab courier   https://www.usaspending.gov/award/CONT_AWD_W81K0426FA242_9700_W91YTZ23A0004_9700
//   VA Durham lab courier       https://www.usaspending.gov/award/CONT_AWD_36C24626N0834_3600_36C24626D0075_3600
//   FWS refuge gravel           https://www.usaspending.gov/award/CONT_AWD_140FS325P0239_1448_-NONE-_-NONE-
//   Barracks furniture moves    https://www.usaspending.gov/award/CONT_AWD_W9124721P9054_9700_-NONE-_-NONE-
//   Trailer removals            https://www.usaspending.gov/award/CONT_AWD_W9124726PA027_9700_-NONE-_-NONE-
//   GSA freight rate offers     https://origin-www.gsa.gov/system/files/FY23%20RFO%20-%20GSA%20General%20Rates%20-%20AX.pdf
//   DeCA holiday trailers       https://sam.gov/opp/e1884037ddab41ca99c72556c75ac729/view
//   USPS surface transportation https://sam.gov/opp/fdaf788e04a345c2b7f99d058616e91c/view
//   DFTS II                     https://sam.gov/opp/61d327eafc4e4b13a15e4b73eebe32e3/view
//   VA chilled routes           https://www.usaspending.gov/award/CONT_AWD_36C24627N0199_3600_36C24627D0014_3600
//   NCDOT hauling RFQs          https://connect.ncdot.gov/letting/Division%206%20Letting/8-6-2025/D6D2.POC.028%20-%20Proposal.pdf

import type { ForecastSeed } from "../../../explore/forecastSeeds";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { findPastPerformance, KEY_PARTNER } from "../../../story/persona";
import { HERO_IDS } from "../opportunities";

/** The forecasts the story and the other pages point at. */
export const FORECAST_KEYS = {
  /** Fort Bragg's logistics contract (EAGLE task order): the team-up. */
  teamUp: "168067b3a1a243482079bdf7d25e5fce",
  /** The Garner clinic's instrument runs: set aside for service-disabled veteran-owned firms, her certificate. */
  wosb: "d7db7fbab768e9ff44c9c9775359633c",
  /** The VA's chilled freight routes, next round: the job she lost by about 7%. */
  lost: "9271f19d6788d0281908af9f9980d25d",
  /** Fort Bragg's trailer removals for the 18th Airborne Corps: the buyer of her own job. */
  pastJob: "5edc0fe927fab5b747ad5560f5803bc9",
  armyLabCourier: "75ba08673eaecbd7c7623afeea388261",
  durhamLab: "275831f6dff30b53dcf408d340d4d6b7",
  furniture: "f17f9f95475f90cab8cd027dab105427",
  dfts: "2c4d131574cf6f0eb81467f53152c653",
  storm2028: "5464fc8db73eb45e9c5df7ce432f041c",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const VA_NCO6 = "Network Contracting Office 6";

function seed(s: Omit<ForecastSeed, "contactName" | "contactRole" | "sourceLink" | "docKey"> & Partial<ForecastSeed>): ForecastSeed {
  return { contactName: null, contactRole: null, sourceLink: null, docKey: null, ...s };
}

export const FORECAST_SEEDS: ForecastSeed[] = [
  // ── The team-up: start capture ────────────────────────────────────────
  seed({
    key: "bragg-lrc-eagle-task-order",
    lane: "federal",
    oppKey: FORECAST_KEYS.teamUp,
    hgTitle: "Fort Bragg Logistics Readiness Center: Maintenance, Supply and Transportation Services (EAGLE Task Order)",
    hgText:
      `The Army's next base logistics contract for Fort Bragg, after the current task order ends on 30 June 2027: motor pool maintenance, supply warehouses and the transportation division (central receiving runs, installation freight, trailer and container moves), for five years. Only holders of the Army's EAGLE ordering agreement can bid. The Army has posted a draft for comment (notice ${HERO_IDS.teamUp}).`,
    sourceId: "ACC-RI-FY27-0214",
    postedDaysAgo: 6,
    expectedInDays: 100,
    agencyName: "Army Contracting Command – Rock Island",
    agencyAbbr: "ACC-RI",
    naicsCode: "561210",
    pscCode: "R706",
    oppType: "Recompete",
    setAsideCode: null,
    valLow: 250_000_000,
    valHigh: 300_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: [{ fileName: "Fort Bragg LRC task order: draft performance work statement.pdf", sizeBytes: 486_912 }],
    plainTitle: "Fort Bragg's base logistics contract, 2027",
    semanticFit: 0.7,
  }),

  // ── Start capture ─────────────────────────────────────────────────────
  seed({
    key: "bragg-trailer-removals-fy27",
    lane: "federal",
    oppKey: FORECAST_KEYS.pastJob,
    hgTitle: "Modular Trailer Removal and Relocation, 18th Airborne Corps, Fort Bragg",
    hgText:
      "The corps' plan to clear and move modular office trailers between unit areas and off-post yards next year, quoted one batch at a time and set aside for small businesses.",
    sourceId: "MICC-FB-FY27-0655",
    postedDaysAgo: 10,
    expectedInDays: 110,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "484220",
    pscCode: "V129",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 30_000,
    valHigh: 55_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Trailer removals for the 18th Airborne Corps",
    semanticFit: 0.97,
  }),

  // ── Position early ────────────────────────────────────────────────────
  seed({
    key: "army-hospital-lab-courier-fy27",
    lane: "federal",
    oppKey: FORECAST_KEYS.armyLabCourier,
    hgTitle: "Laboratory Specimen Courier Services (BPA Call), Army Medical Center, Fort Bragg",
    hgText:
      "The next yearly order for the hospital's lab courier, after the current one ends on 31 May 2027: specimen pickups twice a day from clinics on post, with rush calls around the clock. Set aside for small businesses.",
    sourceId: "W81K04-FY27-0031",
    postedDaysAgo: 14,
    expectedInDays: 140,
    agencyName: "Medical Readiness Contracting Office – East",
    agencyAbbr: "MRCO",
    naicsCode: "492110",
    pscCode: "V112",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 110_000,
    valHigh: 130_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Lab courier for the Army hospital at Fort Bragg",
    semanticFit: 0.8,
  }),
  seed({
    key: "va-garner-instrument-transport",
    lane: "federal",
    oppKey: FORECAST_KEYS.wosb,
    hgTitle: "Sterile Instrument Transport Services, Garner VA Clinic",
    hgText:
      "Daily runs of sealed instrument cases between the Garner clinic and the Durham VA, after the current contract ends on 14 June 2027. The VA expects to set it aside for service-disabled veteran-owned small businesses.",
    sourceId: "VA-27-00061204",
    postedDaysAgo: 9,
    expectedInDays: 150,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "492110",
    pscCode: "V112",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 75_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Garner",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Instrument runs for the Garner VA clinic",
    semanticFit: 0.86,
  }),
  seed({
    key: "bragg-barracks-furniture-pcs",
    lane: "federal",
    oppKey: FORECAST_KEYS.furniture,
    hgTitle: "Barracks Furniture Removal and Delivery, Spring Move Season, Fort Bragg",
    hgText:
      "Moving old furniture out of barracks and new furniture in during the spring move season, quoted as small-business purchase orders. Past orders drew 8 to 11 quotes.",
    sourceId: "MICC-FB-FY27-0702",
    postedDaysAgo: 16,
    expectedInDays: 160,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "484210",
    pscCode: "V129",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 25_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Spring barracks furniture moves at Fort Bragg",
    semanticFit: 0.9,
  }),
  seed({
    key: "va-durham-lab-courier",
    lane: "federal",
    oppKey: FORECAST_KEYS.durhamLab,
    hgTitle: "Laboratory Courier Services, Durham VA Health Care System",
    hgText:
      "Scheduled and rush specimen runs between the Durham VA and its clinics, after the current order ends on 16 July 2027. The VA expects to set it aside for service-disabled veteran-owned small businesses.",
    sourceId: "VA-27-00063377",
    postedDaysAgo: 12,
    expectedInDays: 190,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "492110",
    pscCode: "V112",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 250_000,
    valHigh: 500_000,
    popState: "NC",
    popCity: "Durham",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Lab courier for the Durham VA",
    semanticFit: 0.78,
  }),
  seed({
    key: "fws-alligator-river-gravel",
    lane: "federal",
    oppKey: "8dcae29f34396274b984a0f8e8b03d8c",
    hgTitle: "Gravel Delivery, Alligator River National Wildlife Refuge",
    hgText:
      "Gravel delivered to the refuge's roads, priced by the ton. The service has bought it each year since 2024 and sets it aside for small businesses.",
    sourceId: "140FS3-FY27-0018",
    postedDaysAgo: 20,
    expectedInDays: 200,
    agencyName: "U.S. Fish and Wildlife Service",
    agencyAbbr: "FWS",
    naicsCode: "484220",
    pscCode: "V129",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 20_000,
    valHigh: 30_000,
    popState: "NC",
    popCity: "Manteo",
    sourceName: "Department of the Interior",
    files: null,
    plainTitle: "Gravel delivery to the Alligator River refuge",
    semanticFit: 0.72,
  }),
  seed({
    key: "usps-mid-carolinas-routes",
    lane: "federal",
    oppKey: "c80df36bd8189d05e820f2a896b034cc",
    hgTitle: "Surface Transportation: Local Mail-Plant Trucking, Mid-Carolinas",
    hgText:
      "USPS's next round of local routes between mail plants and post offices in the mid-Carolinas, paid a fixed rate per trip. USPS posts these in its own system, not SAM.gov, and has no set-asides.",
    sourceId: null,
    postedDaysAgo: 18,
    expectedInDays: 210,
    agencyName: "U.S. Postal Service",
    agencyAbbr: "USPS",
    naicsCode: "484110",
    pscCode: null,
    oppType: "New",
    setAsideCode: null,
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: null,
    sourceName: "U.S. Postal Service",
    files: null,
    plainTitle: "Mail-plant routes in the mid-Carolinas",
    semanticFit: 0.84,
  }),
  seed({
    key: "deca-holiday-trailers-fy28",
    lane: "federal",
    oppKey: "ef007bfd050dab8e27d4f93a3c70679b",
    hgTitle: "Holiday Refrigerated Trailer Rental, CONUS Commissaries, FY2028",
    hgText:
      "Refrigerated trailers parked at commissaries for six weeks over the holidays, to hold extra stock. Quoted store by store and set aside for small businesses.",
    sourceId: "HQC005-FY28-0009",
    postedDaysAgo: 22,
    expectedInDays: 265,
    agencyName: "Defense Commissary Agency",
    agencyAbbr: "DeCA",
    naicsCode: "532120",
    pscCode: "W023",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 8_000,
    valHigh: 15_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of Defense",
    files: null,
    plainTitle: "Holiday reefer trailers for commissaries, 2028",
    semanticFit: 0.5,
  }),
  seed({
    key: "dfts-ii-option-year-2",
    lane: "federal",
    oppKey: FORECAST_KEYS.dfts,
    hgTitle: "Defense Freight Transportation Services (DFTS II): Option Year 2",
    hgText:
      "USTRANSCOM's yearly option on the DFTS II contract, which runs DoD freight inside the US through Crowley Government Services and its carrier network. Carriers haul under it as Crowley's subcontractors.",
    sourceId: "HTC711-FY27-0102",
    postedDaysAgo: 28,
    expectedInDays: 285,
    agencyName: "U.S. Transportation Command",
    agencyAbbr: "USTRANSCOM",
    naicsCode: "488510",
    pscCode: "V113",
    oppType: "Recompete",
    setAsideCode: null,
    valLow: null,
    valHigh: null,
    popState: null,
    popCity: null,
    sourceName: "Department of Defense",
    files: null,
    plainTitle: "DoD's freight network contract, next option year",
    semanticFit: 0.55,
  }),
  seed({
    key: "gsa-fmp-rate-offers-fy28",
    lane: "federal",
    oppKey: "a47e1c44b62fa3bfcc9d1ecce51c0aa3",
    hgTitle: "GSA Freight Management Program: FY2028 Rate Offer Cycle",
    hgText:
      "GSA's yearly call for carriers to file rates for civilian agencies' freight in TMSS 2.0. Only approved carriers get tendered loads.",
    sourceId: "GSA-FMP-FY28-001",
    postedDaysAgo: 30,
    expectedInDays: 300,
    agencyName: "General Services Administration",
    agencyAbbr: "GSA",
    naicsCode: "484121",
    pscCode: "V113",
    oppType: "New",
    setAsideCode: null,
    valLow: null,
    valHigh: null,
    popState: null,
    popCity: null,
    sourceName: "General Services Administration",
    files: null,
    plainTitle: "GSA's freight rate offers for 2028",
    semanticFit: 0.7,
  }),
  seed({
    key: "va-salisbury-linen-delivery",
    lane: "federal",
    oppKey: "1eeeea04cc259406d4559594dcceb715",
    hgTitle: "Linen Processing with Pickup and Delivery, Salisbury VA Health Care System",
    hgText:
      "Laundering the hospital's linen, with pickup and delivery to its clinics. The VA asked firms about it in 2021 and usually sets this work aside for veteran-owned firms first.",
    sourceId: "VA-27-00066015",
    postedDaysAgo: 24,
    expectedInDays: 330,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "812332",
    pscCode: "S209",
    oppType: "Recompete",
    setAsideCode: "TBD",
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: "Salisbury",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Linen laundering and delivery for the Salisbury VA",
    semanticFit: 0.35,
  }),

  // ── Watch ─────────────────────────────────────────────────────────────
  seed({
    key: "ncdot-div6-storm-hauling-2028",
    lane: "sled",
    oppKey: FORECAST_KEYS.storm2028,
    hgTitle: "On-Call Hauling Services, Cumberland County, Calendar Year 2028",
    hgText:
      "Division 6's yearly bid for trucks and drivers on call after storms, at hourly rates. The lowest responsible bid wins.",
    sourceId: null,
    postedDaysAgo: 15,
    expectedInDays: 400,
    agencyName: "NCDOT Division 6",
    agencyAbbr: "NCDOT",
    naicsCode: "484220",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 60_000,
    valHigh: 150_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Division 6 maintenance contracts plan.pdf", sizeBytes: 301_056 }],
    plainTitle: "Storm hauling in Cumberland County, 2028",
    semanticFit: 0.92,
  }),
  seed({
    key: "va-chilled-routes-next-round",
    lane: "federal",
    oppKey: FORECAST_KEYS.lost,
    hgTitle: "Chilled Freight Transportation, Hampton VA to VISN 6 Sites (Next Contract)",
    hgText:
      "The next contract for the weekly refrigerated routes from the Hampton VA to Fayetteville and seven other sites, after the five-year contract that began on 1 October 2026. Expected to be set aside for service-disabled veteran-owned small businesses again.",
    sourceId: "VA-31-00000412",
    postedDaysAgo: 18,
    expectedInDays: 1_800,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "484220",
    pscCode: "V113",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 1_200_000,
    valHigh: 1_500_000,
    popState: "VA",
    popCity: "Hampton",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "The VA's chilled freight routes, next round",
    semanticFit: 0.88,
  }),
];

/** How close a forecast's industry code is to Tanya's own, 0 to 1. Null: no code. */
export function categoryFit(code: string | null, own: readonly string[]): number | null {
  if (!code) return null;
  if (own.includes(code)) return 1;
  if (/^(4841|4842|4921)/.test(code)) return 0.8;
  if (/^(4885|5321|561210)/.test(code)) return 0.5;
  if (/^(4859|8123)/.test(code)) return 0.35;
  return 0.05;
}

// ── Grant's words on the forecast pages ─────────────────────────────────

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

const bragg = findPastPerformance("pp-bragg-trailer-hauling")!;
const storm = findPastPerformance("pp-ncdot-storm-hauling")!;
const routes = findPastPerformance("pp-quarry-lane-routes")!;

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardLine(oppKey: string, r: ForecastRecordDto, when: string, biggest: number): string | null {
  switch (oppKey) {
    case FORECAST_KEYS.teamUp:
      return `Fort Bragg's base logistics contract. Only EAGLE holders can bid, and it is far above your ${money(biggest)} largest job: team up. ${KEY_PARTNER.name} wants a local carrier.${when}`;
    case FORECAST_KEYS.wosb:
      return `Instrument runs for the Garner VA clinic, planned for service-disabled veteran-owned firms. You hold that certificate, and it fits your size.${when}`;
    case FORECAST_KEYS.pastJob:
      return `More trailer moves for the 18th Airborne Corps, the office you made 46 moves for. Ask for an interim rating first.${when}`;
    case FORECAST_KEYS.lost:
      return `The next round of the VA's chilled routes. You lost this one by about 7%; name a backup reefer and price the long legs with a team driver.${when}`;
    case FORECAST_KEYS.armyLabCourier:
      return `The Army hospital's lab courier, on post. Rush calls around the clock need a third driver, so staff for nights before you quote.${when}`;
    case FORECAST_KEYS.durhamLab:
      return `The Durham VA's lab courier, set aside for firms like yours. At ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)} a year it needs a Durham-based driver.${when}`;
    case FORECAST_KEYS.furniture:
      return `Spring barracks furniture moves. Box-truck work 12 miles away, and past winners came from out of state.${when}`;
    case FORECAST_KEYS.dfts:
      return `DoD's freight network. You can't bid it, but you can haul under Crowley once you're in SDDC's carrier program.${when}`;
    case FORECAST_KEYS.storm2028:
      return `Division 6's storm hauling for 2028, the buyer you hauled for in ${storm.periodStart.slice(0, 4)}. The lowest responsible bid wins.${when}`;
    default:
      return null;
  }
}

/** Grant's chat answers that name Tanya's own story. */
export const CHAT = {
  base: "yard",
  teamUp: `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) wrote to you about Fort Bragg's logistics contract. They want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}. Only EAGLE agreement holders can bid, so their team is your way in. Agree in writing which runs are yours before you sign. Open Partners to see their card.`,
  smallTeam: "You do not need a partner for the size of this one. A partner can still help if it lands in the same week as another job and your trucks are booked.",
  mentor:
    "Sarah Mitchell can review this with you. Use “Review with a Mentor” on this page. She is reading your quote for the Army hospital's lab courier, so she knows your work.",
  past: `Your closest past work is ${bragg.projectTitle} (${money(bragg.totalValue)}, ${bragg.periodStart.slice(0, 4)}), your first federal prime. Your ${routes.customerName} routes (${money(routes.totalValue)} a year) show daily scheduled runs, and your ${money(storm.totalValue)} storm hauling for NCDOT shows on-call work.`,
};
