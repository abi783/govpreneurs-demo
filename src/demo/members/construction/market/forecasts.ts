// THE CONTRACTOR's forecasts (read through src/demo/explore/forecastData.ts, which
// picks the active member): 14 building construction and repair forecasts near
// Ninebark Builders' shop in Fayetteville, NC. Source: demo-storyboard/construction-pack.md,
// section 13. The buyers are real offices; the forecast records are written for the
// demo, modeled on real awards and their end dates (named on each one). Dates count
// from today.
//
// The Fayetteville VA's fan coils come first (storyboard segment 10): floors 2 and 4,
// after 36C24623C0027 did the 3rd floor (a service-disabled veteran-owned sealed bid,
// 2 bids, $3,002,879, Jun 2023 – Jul 2025). So the next one is about $3.2M–$4.4M and
// set aside for those firms (38 U.S.C. 8127). Hunter says team up.
//
// Capture status comes from the days to the expected date (engine.ts RUNWAY):
// act now 45 days or fewer, start capture 120, position early 365, watch beyond.
//
// Modeled on (USAspending and SAM.gov, pulled 19 Oct 2026):
//   VA fan coils, 3rd floor     https://www.usaspending.gov/award/CONT_AWD_36C24623C0027_3600_-NONE-_-NONE-
//   Minor Construction MATOC    https://sam.gov/opp/a41d8e4d855e416a8e27e0960c99e810/view
//   Vertical Construction MATOC https://sam.gov/opp/f21282ed70464a2c8ad2d063c6560cf8/view
//   USACE HUBZone sealed bid    https://www.usaspending.gov/award/CONT_AWD_W912PM21C0014_9700_-NONE-_-NONE-
//   USACE Savannah barracks     https://www.usaspending.gov/award/CONT_AWD_W912HN22C4007_9700_-NONE-_-NONE-
//   Pope repairs                https://www.usaspending.gov/award/CONT_AWD_FA445225P0042_9700_-NONE-_-NONE-
//   FAA HVAC                    https://www.usaspending.gov/award/CONT_AWD_6973GH21C00079_6920_-NONE-_-NONE-
//   VA breaker testing          https://www.usaspending.gov/award/CONT_AWD_36C24626P0998_3600_-NONE-_-NONE-
//   VA boiler plant services    https://www.usaspending.gov/award/CONT_AWD_36C24624P1848_3600_-NONE-_-NONE-
//   VA auxiliary chiller        https://sam.gov/opp/5f533fd708574cceb41e5def8ac6b22d/view
//   Army Reserve Region F       https://www.usaspending.gov/award/CONT_IDV_W912HP22D1001_9700
//   Cumberland County Schools   https://www.constructionbidsource.com/state/north-carolina/county/cumberland/820798
//   FSU notice to bidders       https://www.uncfsu.edu/assets/Documents/Facilities%20Management/2025/000109%20-%20Notice%20to%20Bidders.pdf
//   Crown Complex chiller       https://www.constructionbidsource.com/state/north-carolina/county/cumberland/821899

import type { ForecastSeed } from "../../../explore/forecastSeeds";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { findPastPerformance, KEY_PARTNER, PERSONA } from "../../../story/persona";
import { HERO_IDS } from "../opportunities";

/** The forecasts the story and the other pages point at. */
export const FORECAST_KEYS = {
  /** The Fayetteville VA's fan coils, floors 2 and 4: the team-up. */
  teamUp: "a614fc6f6e9188b184bddcf3dbf4aac6",
  /** USACE Wilmington's FY27 repairs at Fort Bragg: set aside for HUBZone firms, his certificate. */
  wosb: "cc3366c2d0f7453b08f89cb425d696ce",
  /** Fayetteville State's repair work: the buyer that turned him down on price. */
  lost: "b9c8d10854e515f3d1362fcbf14fa26d",
  /** Cumberland County Schools' summer 2027 HVAC: the buyer of his 2024 school job. */
  pastJob: "df570193ed2fbe9cccfc47de1cbbea02",
  minorMatoc: "71786e624ac6e587bb707f21026cdc07",
  pope: "2f5d0ddad85ef21816c19f07d7be0100",
  savannah: "c736a789d7bd211fba676f82090716ae",
  vaChiller: "8724f0f1ddbc34705aaf93670cffbf63",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const VA_NCO6 = "Network Contracting Office 6";

function seed(s: Omit<ForecastSeed, "contactName" | "contactRole" | "sourceLink" | "docKey"> & Partial<ForecastSeed>): ForecastSeed {
  return { contactName: null, contactRole: null, sourceLink: null, docKey: null, ...s };
}

export const FORECAST_SEEDS: ForecastSeed[] = [
  // ── The team-up: position early ───────────────────────────────────────
  seed({
    key: "va-fayetteville-fan-coils-2-4",
    lane: "federal",
    oppKey: FORECAST_KEYS.teamUp,
    hgTitle: "Replace Fan Coil Units, Building 1, Floors 2 and 4 — Fayetteville VA Medical Center",
    hgText:
      `Replace the fan coil units, their piping, controls and power on two floors of the medical center's main building, keeping the floors in use. The 3rd floor was done in 2023–2025. The VA expects a sealed bid set aside for service-disabled veteran-owned small businesses, and is asking firms about the work now (sources sought notice ${HERO_IDS.teamUp}).`,
    sourceId: "VA-27-00052719",
    postedDaysAgo: 4,
    expectedInDays: 150,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "236220",
    pscCode: "Z2DA",
    oppType: "New",
    setAsideCode: "SDVOSBC",
    valLow: 3_200_000,
    valHigh: 4_400_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: "Department of Veterans Affairs",
    files: [{ fileName: "Fan coil replacement, floors 2 and 4: acquisition plan summary.pdf", sizeBytes: 228_352 }],
    plainTitle: "Fan coil replacement at the Fayetteville VA, floors 2 and 4",
    semanticFit: 0.9,
  }),

  // ── Act now ───────────────────────────────────────────────────────────
  seed({
    key: "pope-fy27-building-repairs",
    lane: "federal",
    oppKey: FORECAST_KEYS.pope,
    hgTitle: "FY2027 Facility Repairs (HVAC, Electrical, Interior) — Pope Army Airfield",
    hgText:
      "The squadron's plan for next year's small building repairs at Pope: HVAC ductwork and units, panels and circuits, restrooms and interiors. Each job is quoted on its own and set aside for small businesses.",
    sourceId: "FA4452-FY27-0019",
    postedDaysAgo: 12,
    expectedInDays: 30,
    agencyName: "763rd Enterprise Sourcing Squadron",
    agencyAbbr: "USAF",
    naicsCode: "236220",
    pscCode: "Z2AA",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 20_000,
    valHigh: 200_000,
    popState: "NC",
    popCity: "Pope Army Airfield",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "Pope's building repairs for fiscal 2027",
    semanticFit: 0.94,
  }),

  // ── Start capture ─────────────────────────────────────────────────────
  seed({
    key: "usace-sof-repairs-fy27",
    lane: "federal",
    oppKey: FORECAST_KEYS.wosb,
    hgTitle: "FY2027 SOF Facility HVAC and Electrical Repairs, Fort Bragg, NC",
    hgText:
      "The district's next round of repairs to Special Operations buildings at Fort Bragg: air handlers, chillers, controls, switchboards and panels, bid one building at a time as sealed bids. It plans to set most of them aside for HUBZone small businesses.",
    sourceId: "W912PM-FY27-0042",
    postedDaysAgo: 18,
    expectedInDays: 60,
    agencyName: "U.S. Army Corps of Engineers, Wilmington District",
    agencyAbbr: "USACE",
    naicsCode: "238220",
    pscCode: "Z2AA",
    oppType: "New",
    setAsideCode: "HZC",
    valLow: 500_000,
    valHigh: 1_500_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Fort Bragg building HVAC and electrical repairs, fiscal 2027",
    semanticFit: 0.95,
  }),
  seed({
    key: "usace-savannah-barracks-fy27",
    lane: "federal",
    oppKey: FORECAST_KEYS.savannah,
    hgTitle: "FY2027 Barracks Repairs, Fort Bragg, NC — Anticipated Procurements",
    hgText:
      "The district's list of barracks repairs it plans to award at Fort Bragg next year: whole-building repairs with new HVAC, power and interiors. Each is a proposal set aside for small businesses.",
    sourceId: "W912HN-FY27-0007",
    postedDaysAgo: 22,
    expectedInDays: 90,
    agencyName: "U.S. Army Corps of Engineers, Savannah District",
    agencyAbbr: "USACE",
    naicsCode: "236220",
    pscCode: "Z2JZ",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 5_000_000,
    valHigh: 25_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: [{ fileName: "FY27 anticipated SRM procurements.pdf", sizeBytes: 318_464 }],
    plainTitle: "Fort Bragg barracks repairs, fiscal 2027",
    semanticFit: 0.82,
  }),
  seed({
    key: "faa-nc-hvac-replacement",
    lane: "federal",
    oppKey: "ab64dd4e96c7766dceb8e6701b66043a",
    hgTitle: "HVAC Replacement, FAA Equipment Building, North Carolina",
    hgText:
      "Replace the HVAC equipment serving an FAA equipment building in eastern North Carolina, keeping the equipment rooms cool during the switch. Set aside for small businesses.",
    sourceId: "6973GH-FY27-0088",
    postedDaysAgo: 15,
    expectedInDays: 100,
    agencyName: "Federal Aviation Administration",
    agencyAbbr: "FAA",
    naicsCode: "238220",
    pscCode: "Z2AZ",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 180_000,
    valHigh: 260_000,
    popState: "NC",
    popCity: null,
    sourceName: "Department of Transportation",
    files: null,
    plainTitle: "HVAC replacement at an FAA building in North Carolina",
    semanticFit: 0.9,
  }),
  seed({
    key: "fsu-repair-renovation-2027",
    lane: "sled",
    oppKey: FORECAST_KEYS.lost,
    hgTitle: "HVAC and Electrical Repair and Renovation Projects, 2027",
    hgText:
      "The university's repair and renovation list for next year: HVAC and electrical work in classroom and residence buildings, bid under state rules with bonds. The trustees' report lists the projects and their budgets.",
    sourceId: null,
    postedDaysAgo: 9,
    expectedInDays: 120,
    agencyName: "Fayetteville State University",
    agencyAbbr: "FSU",
    naicsCode: "238220",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 250_000,
    valHigh: 1_000_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Board of Trustees capital projects report.pdf", sizeBytes: 544_768 }],
    plainTitle: "Fayetteville State's HVAC and electrical repairs, 2027",
    semanticFit: 0.92,
  }),

  // ── Position early ────────────────────────────────────────────────────
  seed({
    key: "ccs-summer-hvac-2027",
    lane: "sled",
    oppKey: FORECAST_KEYS.pastJob,
    hgTitle: "Summer 2027 HVAC Replacements, Facilities Department",
    hgText:
      "The board approved next summer's HVAC replacements at several schools, to be bid in the spring and done between the last school day and the first teacher workday. Each job needs performance and payment bonds.",
    sourceId: null,
    postedDaysAgo: 14,
    expectedInDays: 150,
    agencyName: "Cumberland County Board of Education",
    agencyAbbr: null,
    naicsCode: "238220",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 150_000,
    valHigh: 1_200_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Board of Education capital outlay minutes.pdf", sizeBytes: 402_115 }],
    plainTitle: "Cumberland County Schools' summer 2027 HVAC jobs",
    semanticFit: 0.96,
  }),
  seed({
    key: "va-aux-chiller-next",
    lane: "federal",
    oppKey: FORECAST_KEYS.vaChiller,
    hgTitle: "Replace Auxiliary Chiller, Building 5 — Fayetteville VA Medical Center",
    hgText:
      "Replace an auxiliary chiller and its pumps at another building of the medical center. The VA expects a sealed bid set aside for service-disabled veteran-owned small businesses.",
    sourceId: "VA-27-00055102",
    postedDaysAgo: 20,
    expectedInDays: 200,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "238220",
    pscCode: "Z2DA",
    oppType: "New",
    setAsideCode: "SDVOSBC",
    valLow: 250_000,
    valHigh: 700_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Auxiliary chiller replacement at the Fayetteville VA",
    semanticFit: 0.88,
  }),
  seed({
    key: "cumberland-county-hvac",
    lane: "sled",
    oppKey: "ba5ac74c76bb9017035045649de1807d",
    hgTitle: "County Building HVAC Replacements",
    hgText:
      "The commissioners' capital plan funds HVAC work in county buildings over the next year, after the Crown Complex chiller job. Each will be bid on its own, with bonds over $300,000.",
    sourceId: null,
    postedDaysAgo: 11,
    expectedInDays: 200,
    agencyName: "Cumberland County Board of Commissioners",
    agencyAbbr: null,
    naicsCode: "238220",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 300_000,
    valHigh: 900_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Board of Commissioners capital plan.pdf", sizeBytes: 559_872 }],
    plainTitle: "HVAC work in Cumberland County buildings",
    semanticFit: 0.9,
  }),
  seed({
    key: "micc-minor-matoc-follow-on",
    lane: "federal",
    oppKey: FORECAST_KEYS.minorMatoc,
    hgTitle: "Fort Bragg DPW Minor Construction MATOC (HUBZone) Follow-on",
    hgText:
      "The next five-year Minor Construction MATOC for Fort Bragg's electrical, HVAC and small repair orders, after the current one stops ordering on 31 January 2028. The last one awarded about $7M to each holder. The Army is asking HUBZone firms about it now (sources sought notice W91247-27-R-0007).",
    sourceId: "MICC-FB-FY27-0731",
    postedDaysAgo: 6,
    expectedInDays: 240,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "236220",
    pscCode: "Z2JZ",
    oppType: "Recompete",
    setAsideCode: "HZC",
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Fort Bragg's next Minor Construction MATOC",
    semanticFit: 0.93,
  }),
  seed({
    key: "va-breaker-testing-stage-3",
    lane: "federal",
    oppKey: "469c34615ec4380419776925b434af7f",
    hgTitle: "Electrical Breaker Testing, Stage 3 — Fayetteville VA Medical Center",
    hgText:
      "The next stage of testing and servicing the medical center's breakers, after stage 2 ends in August 2027. The VA usually buys this from veteran-owned firms first and has not said who may bid.",
    sourceId: "VA-28-00003316",
    postedDaysAgo: 25,
    expectedInDays: 290,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "238210",
    pscCode: "J059",
    oppType: "Recompete",
    setAsideCode: "TBD",
    valLow: 300_000,
    valHigh: 400_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Breaker testing at the Fayetteville VA, stage 3",
    semanticFit: 0.8,
  }),
  seed({
    key: "va-boiler-plant-services",
    lane: "federal",
    oppKey: "bdd5a0ec2f90b2c261c2ef7965f8f602",
    hgTitle: "Boiler Plant Services — Fayetteville VA Medical Center",
    hgText:
      "Service and repair of the medical center's boiler plant, after the current contract ends in September 2027. The VA usually buys this from veteran-owned firms first and has not said who may bid.",
    sourceId: "VA-28-00003471",
    postedDaysAgo: 25,
    expectedInDays: 310,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "238220",
    pscCode: "J045",
    oppType: "Recompete",
    setAsideCode: "TBD",
    valLow: 180_000,
    valHigh: 180_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Boiler plant service at the Fayetteville VA",
    semanticFit: 0.74,
  }),
  seed({
    key: "usace-army-reserve-region-f",
    lane: "federal",
    oppKey: "3f5c0be71812be0c0609fc788f1bb2b1",
    hgTitle: "Army Reserve Facility Repair and Maintenance Services, Region F (Follow-on)",
    hgText:
      "Repair and maintenance task orders at Army Reserve centers across the region, after the current contract ends on 18 November 2027. Set aside for small businesses. The district has not given a value.",
    sourceId: "W912HP-FY28-0011",
    postedDaysAgo: 30,
    expectedInDays: 330,
    agencyName: "U.S. Army Corps of Engineers, Charleston District",
    agencyAbbr: "USACE",
    naicsCode: "236220",
    pscCode: "Z2JZ",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: null,
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Repairs at Army Reserve centers, the next contract",
    semanticFit: 0.78,
  }),

  // ── Watch ─────────────────────────────────────────────────────────────
  seed({
    key: "micc-vertical-matoc-follow-on",
    lane: "federal",
    oppKey: "720e205a2906384bf465dc66719e011d",
    hgTitle: "Fort Bragg DPW Vertical Construction MA IDIQ (HUBZone) Follow-on",
    hgText:
      "The next Vertical Construction MATOC for Fort Bragg's larger building repairs, after the current one stops ordering on 31 August 2028. The last one drew 19 offers. The Army has not given a value.",
    sourceId: "MICC-FB-FY28-0102",
    postedDaysAgo: 35,
    expectedInDays: 420,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "236220",
    pscCode: "Z2JZ",
    oppType: "Recompete",
    setAsideCode: "HZC",
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Fort Bragg's next Vertical Construction MATOC",
    semanticFit: 0.86,
  }),
];

/** How close a forecast's industry code is to Derrick's own, 0 to 1. Null: no code. */
export function categoryFit(code: string | null, own: readonly string[]): number | null {
  if (!code) return null;
  if (own.includes(code)) return 1;
  if (/^(2362|2382)/.test(code)) return 0.8;
  if (/^(2361|2383|2389)/.test(code)) return 0.6;
  if (/^(237|561210)/.test(code)) return 0.35;
  return 0.05;
}

// ── Grant's words on the forecast pages ─────────────────────────────────

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

const school = findPastPerformance("pp-ccs-school-hvac")!;
const pope = findPastPerformance("pp-pope-office-hvac")!;
const turnrow = findPastPerformance("pp-turnrow-barracks-electrical")!;
const single = PERSONA.bondLine?.single ?? 0;

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardLine(oppKey: string, r: ForecastRecordDto, when: string, biggest: number): string | null {
  switch (oppKey) {
    case FORECAST_KEYS.teamUp:
      return `The VA's fan coils, floors 2 and 4. Set aside for veteran-owned firms and more than twice your ${money(single)} single bond: team up. ${KEY_PARTNER.name} wants your crews.${when}`;
    case FORECAST_KEYS.wosb:
      return `Fort Bragg building repairs, planned for HUBZone firms. You hold that certificate, they are both your trades, and the jobs fit your bond.${when}`;
    case FORECAST_KEYS.pastJob:
      return `Next summer's school HVAC jobs. You did one for this district in ${school.periodStart.slice(0, 4)}, and your reference, ${school.referenceName}, runs their facilities.${when}`;
    case FORECAST_KEYS.lost:
      return `Fayetteville State's repair list. You lost a classroom HVAC job here by 4.2% on price, so ask before bids if "or equal" controls are allowed.${when}`;
    case FORECAST_KEYS.pope:
      return `Pope's small repairs for next year. Same buyer as your office building job, which they rated Very Good.${when}`;
    case FORECAST_KEYS.minorMatoc:
      return `Fort Bragg's next Minor Construction MATOC. Most of the base's HUBZone repair work goes through it, and you are not on the current one. Answer the sources sought.${when}`;
    case FORECAST_KEYS.savannah:
      return `Barracks repairs at ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)}, far above your ${money(biggest)} largest job. Ask the winners for the electrical and HVAC package.${when}`;
    case FORECAST_KEYS.vaChiller:
      return `Another chiller at the Fayetteville VA. Your size and trade, but set aside for veteran-owned firms, so you would come in as a subcontractor.${when}`;
    default:
      return null;
  }
}

/** Grant's chat answers that name Derrick's own story. */
export const CHAT = {
  base: "shop",
  teamUp: `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) wrote to you about the fan coils. They want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}. The job is expected to be set aside for service-disabled veteran-owned firms, so their team is your way in. Agree on sub bonds before you sign. Open Partners to see their card.`,
  smallTeam: "You do not need a partner for the size of this one. A partner can still help if it lands in the same month as another job and your crews are booked.",
  mentor:
    "Sarah Mitchell can review this with you. Use “Review with a Mentor” on this page. She is reading your bid plan for the summer school HVAC job, so she knows your work.",
  past: `Your closest past work is ${pope.projectTitle} (${money(pope.totalValue)}, ${pope.periodStart.slice(0, 4)}), rated Very Good. Your ${school.customerName} job (${money(school.totalValue)}) shows bonded HVAC work, and the ${money(turnrow.totalValue)} barracks electrical job for ${turnrow.customerName.replace(/ \(.*\)$/, "")} shows work on post.`,
};
