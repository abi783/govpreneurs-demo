// THE CONSULTANT's forecasts (read through src/demo/explore/forecastData.ts, which
// picks the active member): 14 consulting and training forecasts near Coppervale
// Advisory Group's office in Fayetteville, NC. Source: demo-storyboard/consulting-pack.md,
// section 13. The buyers are real offices; the forecast records are written for the
// demo from real awards and their end dates (named below). Dates count from today.
//
// The Army's family readiness staff training comes first (storyboard segment 10): the
// recompete of W15QKN21F0263 (an order on the Army's HR Solutions PLS contract, 6
// offers, $5,517,405, May 2021 – May 2026), so the next one is about $5M–$7M over five
// years, for PLS holders only. No follow-on shows on USAspending yet, so the timing
// (about 150 days) is projected. Hunter says team up.
//
// Capture status comes from the days to the expected date (engine.ts RUNWAY):
// act now 45 days or fewer, start capture 120, position early 365, watch beyond.
//
// Modeled on (USAspending, pulled 19 Oct 2026):
//   Family readiness staff (PLS)  https://www.usaspending.gov/award/CONT_AWD_W15QKN21F0263_9700_W15QKN19D0049_9700
//   Guard family readiness (PLS)  https://www.usaspending.gov/award/CONT_AWD_W15QKN26F0163_9700_W15QKN19D0049_9700
//   USAR analyst support          https://www.usaspending.gov/award/CONT_AWD_W9124722P0107_9700_-NONE-_-NONE-
//   Manpower support (GSA)        https://www.usaspending.gov/award/CONT_AWD_W9124723F0139_9700_GS10F0190W_4730
//   Family Advocacy support       https://www.usaspending.gov/award/CONT_AWD_W9124725CA078_9700_-NONE-_-NONE-
//   Family readiness support      https://www.usaspending.gov/award/CONT_AWD_W9124722P0016_9700_-NONE-_-NONE-
//   USAR sustainment reporting    https://www.usaspending.gov/award/CONT_AWD_W9124726FA027_9700_47QRAA24D0003_4732
//   Army training model support   https://www.usaspending.gov/award/CONT_AWD_W9124721F0116_9700_47QRAA18D009D_4732
//   VHA Supervisor Ready          https://www.usaspending.gov/award/CONT_AWD_36C10X24F0030_3600_47QRAA23D007J_4732
//   VISN 6 contract specialists   https://www.usaspending.gov/award/CONT_AWD_36C24623P0378_3600_-NONE-_-NONE-
//   PWC pay study (for the city's) https://www.faypwc.com/wp-content/uploads/2025/12/PWC2526055-RFP-Job-Analyses-Classification-and-Compensation-Study-SL.pdf
//   Harnett County study          https://harnett.org/finance/downloads/addendum-1-compensation-study-rfp-2025.pdf
//   Cumberland County             https://www.cumberlandcountync.gov/home/2025/04/11/cumberland-county-commissioners-agenda-session-wrap-up

import type { ForecastSeed } from "../../../explore/forecastSeeds";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { findPastPerformance, KEY_PARTNER } from "../../../story/persona";
import { HERO_IDS } from "../opportunities";

/** The forecasts the story and the other pages point at. */
export const FORECAST_KEYS = {
  /** The Army's family readiness staff training recompete: the team-up. */
  teamUp: "8cbeac72451bc43604eafffd4d0d1470",
  /** Fort Bragg's Family Advocacy support: set aside for service-disabled veteran-owned firms, her certificate. */
  wosb: "df92530c877dafad14ca9e9481aae95d",
  /** Harnett County's pay plan upkeep: the buyer that turned her down on similar work. */
  lost: "30230120f0c76e35749a09d1b7e000c1",
  /** Cumberland County's strategic plan update: the same kind of work as her Hope Mills plan. */
  pastJob: "455c851094fb6861cd3535f60fc00599",
  usarAnalysts: "3d383a430d9725f1eba8d7e0baed1d51",
  manpower: "43097151cf0be1d2bffd1add23e2ba95",
  supervisorReady: "edeffa36d55d8305b26721d22a7e3aa5",
  cityPay: "93da0bf4019897b30c811132780067c4",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const VA_NCO6 = "Network Contracting Office 6";
const ACC_RI = "Army Contracting Command — Rock Island (Picatinny)";

function seed(s: Omit<ForecastSeed, "contactName" | "contactRole" | "sourceLink" | "docKey"> & Partial<ForecastSeed>): ForecastSeed {
  return { contactName: null, contactRole: null, sourceLink: null, docKey: null, ...s };
}

export const FORECAST_SEEDS: ForecastSeed[] = [
  // ── The team-up: position early ───────────────────────────────────────
  seed({
    key: "acc-ri-family-readiness-recompete",
    lane: "federal",
    oppKey: FORECAST_KEYS.teamUp,
    hgTitle: "Soldier and Family Readiness Staff Training Support (Recompete) — HR Solutions PLS",
    hgText:
      `The Army's next five years of training for soldier and family readiness staff, in person across the Southeast and online. It will be an order on the Army's HR Solutions Personnel Lifecycle Support (PLS) contract, so only its holders can bid. The Army is asking firms about the work now (sources sought notice ${HERO_IDS.teamUp}).`,
    sourceId: "W15QKN-FY27-0031",
    postedDaysAgo: 6,
    expectedInDays: 150,
    agencyName: ACC_RI,
    agencyAbbr: "ACC",
    naicsCode: "541612",
    pscCode: "U008",
    oppType: "Recompete",
    setAsideCode: null,
    valLow: 5_000_000,
    valHigh: 7_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: [{ fileName: "Family readiness staff training: sources sought.pdf", sizeBytes: 218_112 }],
    plainTitle: "Army training for family readiness staff, the next order",
    semanticFit: 0.9,
  }),

  // ── Act now ───────────────────────────────────────────────────────────
  seed({
    key: "micc-usar-analysts",
    lane: "federal",
    oppKey: FORECAST_KEYS.usarAnalysts,
    hgTitle: "Analyst Support Services, U.S. Army Reserve Command Headquarters, Fort Bragg",
    hgText:
      "Full-time analysts at the Army Reserve's headquarters for five years, after the last contract, given to an 8(a) firm, ended in September 2026. This time it is set aside for small businesses, and proposals are open now (W91247-27-R-0034).",
    sourceId: "MICC-FB-FY27-0207",
    postedDaysAgo: 40,
    expectedInDays: 30,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 4_000_000,
    valHigh: 5_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Analysts for the Army Reserve's headquarters at Fort Bragg",
    semanticFit: 0.82,
  }),

  // ── Start capture ─────────────────────────────────────────────────────
  seed({
    key: "va-visn6-contract-specialists",
    lane: "federal",
    oppKey: "6b115208a3c060ccb1ce64dbc13c45af",
    hgTitle: "Contract Specialist Support Services, VISN 6 (Follow-on)",
    hgText:
      "Contract specialists to help the network's contracting office, after the current contract ends on 20 December 2026. Set aside for service-disabled veteran-owned small businesses.",
    sourceId: "VA-27-00038114",
    postedDaysAgo: 18,
    expectedInDays: 62,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 1_800_000,
    valHigh: 2_200_000,
    popState: "NC",
    popCity: "Durham",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Contract specialists for the VA's Carolinas and Virginia network",
    semanticFit: 0.55,
  }),
  seed({
    key: "micc-usar-sustainment-option",
    lane: "federal",
    oppKey: "37c9236f20277802f2035f8386e92fe9",
    hgTitle: "Army Reserve Sustainment-Reporting Support, Option Year — GSA MAS",
    hgText:
      "The Army decides by 22 January 2027 whether to keep the current GSA schedule order for readiness reporting at the Army Reserve's headquarters, about $570,000 a year. Only schedule holders can quote a replacement.",
    sourceId: "MICC-FB-FY27-0311",
    postedDaysAgo: 22,
    expectedInDays: 95,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "Expiring Contract",
    setAsideCode: "SBA",
    valLow: 570_000,
    valHigh: 570_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Army Reserve readiness reporting, for GSA schedule holders",
    semanticFit: 0.7,
  }),
  seed({
    key: "va-sac-supervisor-ready",
    lane: "federal",
    oppKey: FORECAST_KEYS.supervisorReady,
    hgTitle: "VHA Supervisor Ready Leadership Program, Option Period — GSA MAS",
    hgText:
      "The VA's national program for new supervisors, ordered from a GSA schedule and set aside for service-disabled veteran-owned firms. The base period ends on 8 February 2027, about $770,000 a year.",
    sourceId: "VA-27-00040522",
    postedDaysAgo: 12,
    expectedInDays: 112,
    agencyName: "Strategic Acquisition Center – Frederick",
    agencyAbbr: "VA",
    naicsCode: "611430",
    pscCode: "U008",
    oppType: "Expiring Contract",
    setAsideCode: "SDVOSBC",
    valLow: 770_000,
    valHigh: 770_000,
    popState: "MD",
    popCity: "Frederick",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "VA's national supervisor program, for GSA schedule holders",
    semanticFit: 0.88,
  }),

  // ── Position early ────────────────────────────────────────────────────
  seed({
    key: "acc-ri-guard-family-readiness-option",
    lane: "federal",
    oppKey: "d75ed7c5d93e1e5cb631c2bea97cfba1",
    hgTitle: "National Guard Family Readiness Staff Training, Option Year — HR Solutions PLS",
    hgText:
      "The option year of the Guard's family readiness staff training, due on 20 April 2027: about $810,000, set aside for small businesses among holders of the Army's HR Solutions contract.",
    sourceId: "W15QKN-FY27-0044",
    postedDaysAgo: 9,
    expectedInDays: 183,
    agencyName: ACC_RI,
    agencyAbbr: "ACC",
    naicsCode: "541612",
    pscCode: "U008",
    oppType: "Expiring Contract",
    setAsideCode: "SBA",
    valLow: 810_000,
    valHigh: 810_000,
    popState: "NC",
    popCity: "Raleigh",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Guard family readiness training, for HR Solutions holders",
    semanticFit: 0.86,
  }),
  seed({
    key: "micc-manpower-follow-on",
    lane: "federal",
    oppKey: FORECAST_KEYS.manpower,
    hgTitle: "Manpower Support Services Follow-on, Fort Bragg — GSA MAS SIN 541611",
    hgText:
      "The next order for manpower analysts at Fort Bragg, after the current one ends in April 2027. The Army expects to post it on GSA eBuy again, set aside for service-disabled veteran-owned schedule holders.",
    sourceId: "MICC-FB-FY27-0418",
    postedDaysAgo: 15,
    expectedInDays: 190,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 2_400_000,
    valHigh: 3_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Fort Bragg manpower analysts, for GSA schedule holders",
    semanticFit: 0.84,
  }),
  seed({
    key: "micc-ctc-support",
    lane: "federal",
    oppKey: "df0bf35bb4c336950238b3c3b8f54f26",
    hgTitle: "CTC Support Services, Fort Bragg (8(a) Sole Source)",
    hgText:
      "The Army plans to give the next contract for this support, about $760,000 a year, to one 8(a) firm without a competition, by June 2027.",
    sourceId: "MICC-FB-FY27-0526",
    postedDaysAgo: 26,
    expectedInDays: 240,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "New",
    setAsideCode: "8AN",
    valLow: 760_000,
    valHigh: 760_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Support services at Fort Bragg, for one 8(a) firm",
    semanticFit: 0.6,
  }),
  seed({
    key: "fayetteville-classification-pay",
    lane: "sled",
    oppKey: FORECAST_KEYS.cityPay,
    hgTitle: "Classification and Pay Study, FY2028",
    hgText:
      "Council budget notes plan a study of the city's job classes and pay for fiscal 2028, with manager training on the new plan. No date is set; the timing is projected.",
    sourceId: null,
    postedDaysAgo: 17,
    expectedInDays: 300,
    agencyName: "City of Fayetteville",
    agencyAbbr: null,
    naicsCode: "541612",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 150_000,
    valHigh: 200_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "City Council budget work session.pdf", sizeBytes: 544_210 }],
    plainTitle: "The city's job classes and pay study",
    semanticFit: 0.88,
  }),
  seed({
    key: "harnett-pay-plan-upkeep",
    lane: "sled",
    oppKey: FORECAST_KEYS.lost,
    hgTitle: "Compensation Plan Maintenance, FY2028",
    hgText:
      "After the 2025 compensation study, the county plans to hire a firm to keep the new pay plan current: a yearly market check and updates for new positions. The timing is projected.",
    sourceId: null,
    postedDaysAgo: 24,
    expectedInDays: 330,
    agencyName: "Harnett County Board of Commissioners",
    agencyAbbr: null,
    naicsCode: "541612",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 30_000,
    valHigh: 50_000,
    popState: "NC",
    popCity: "Lillington",
    sourceName: null,
    files: [{ fileName: "Board of Commissioners agenda.pdf", sizeBytes: 471_330 }],
    plainTitle: "Harnett County's pay plan upkeep",
    semanticFit: 0.9,
  }),
  seed({
    key: "cumberland-strategic-plan-update",
    lane: "sled",
    oppKey: FORECAST_KEYS.pastJob,
    hgTitle: "Strategic Plan Update, FY2028",
    hgText:
      "Commissioners asked staff to plan an update of the county's strategic plan for fiscal 2028, with public input sessions. The timing is projected.",
    sourceId: null,
    postedDaysAgo: 20,
    expectedInDays: 360,
    agencyName: "Cumberland County Board of Commissioners",
    agencyAbbr: null,
    naicsCode: "541611",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 60_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Commissioners agenda session summary.pdf", sizeBytes: 389_004 }],
    plainTitle: "Cumberland County's strategic plan update",
    semanticFit: 0.92,
  }),

  // ── Watch ─────────────────────────────────────────────────────────────
  seed({
    key: "micc-family-readiness-8a",
    lane: "federal",
    oppKey: "c5b879ee27812b3197c72bcc9c9c3a64",
    hgTitle: "Family Readiness Support Services, Fort Bragg (8(a))",
    hgText:
      "Support for unit family readiness programs, about $100,000 a year. The current 8(a) contract can run to January 2028, and the next one is expected to stay with 8(a) firms.",
    sourceId: "MICC-FB-FY28-0019",
    postedDaysAgo: 30,
    expectedInDays: 460,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "Recompete",
    setAsideCode: "8A",
    valLow: 100_000,
    valHigh: 100_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Family readiness support at Fort Bragg, for 8(a) firms",
    semanticFit: 0.85,
  }),
  seed({
    key: "micc-family-advocacy-recompete",
    lane: "federal",
    oppKey: FORECAST_KEYS.wosb,
    hgTitle: "Family Advocacy Program Support, Army Community Service, Fort Bragg (Recompete)",
    hgText:
      "Prevention classes and program support for Fort Bragg families, about $225,000 a year, set aside for service-disabled veteran-owned firms. The Army decides on the first option year on 25 October 2026; a full competition is expected about 2029.",
    sourceId: "MICC-FB-FY29-0004",
    postedDaysAgo: 10,
    expectedInDays: 1100,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "611430",
    pscCode: "U099",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 225_000,
    valHigh: 225_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Family Advocacy support at Fort Bragg, the next contract",
    semanticFit: 0.9,
  }),
  seed({
    key: "micc-training-model-follow-on",
    lane: "federal",
    oppKey: "0bf1080c7fd57830e8ca7b7e8b7b68f6",
    hgTitle: "Army Training Model Support Follow-on, Fort Bragg — GSA MAS (WOSB)",
    hgText:
      "The last GSA schedule order for this work, about $1.5 million a year and set aside for woman-owned firms, ended in May 2026. No new order has been posted since, and the Army gives no date.",
    sourceId: null,
    postedDaysAgo: 45,
    expectedInDays: null,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541611",
    pscCode: "R408",
    oppType: "Unknown",
    setAsideCode: "WOSB",
    valLow: 1_500_000,
    valHigh: 1_500_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Army training model support, for woman-owned schedule holders",
    semanticFit: 0.7,
  }),
];

/** How close a forecast's industry code is to Simone's own, 0 to 1. Null: no code. */
export function categoryFit(code: string | null, own: readonly string[]): number | null {
  if (!code) return null;
  if (own.includes(code)) return 1;
  if (/^(5416|6114)/.test(code)) return 0.8;
  if (/^(5419|6117|5612)/.test(code)) return 0.6;
  if (/^(5413|6113)/.test(code)) return 0.35;
  return 0.05;
}

// ── Grant's words on the forecast pages ─────────────────────────────────

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

const acs = findPastPerformance("pp-acs-lean-review")!;
const halyard = findPastPerformance("pp-halyard-family-readiness")!;
const hopeMills = findPastPerformance("pp-hope-mills-plan")!;

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardLine(oppKey: string, r: ForecastRecordDto, when: string, biggest: number): string | null {
  switch (oppKey) {
    case FORECAST_KEYS.teamUp:
      return `The Army's family readiness staff training, the work you taught in 2023–2025. Only HR Solutions holders can bid, and you aren't one: team up. ${KEY_PARTNER.name} holds it now.${when}`;
    case FORECAST_KEYS.wosb:
      return `Family Advocacy support at Fort Bragg ACS, set aside for service-disabled veteran-owned firms: your certificate and the office you delivered for.${when}`;
    case FORECAST_KEYS.usarAnalysts:
      return `Full-time analysts at the Army Reserve's headquarters. At ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)} over five years it is a staffing contract far above your ${money(biggest)} largest job. Diana wants your hiring plan first.${when}`;
    case FORECAST_KEYS.manpower:
      return `Fort Bragg's next manpower order, the same lock as the one you passed on: only GSA schedule holders can quote. Start your schedule offer now.${when}`;
    case FORECAST_KEYS.supervisorReady:
      return `The VA's national supervisor program: your work and your set-aside, but ordered only from GSA schedule holders.${when}`;
    case FORECAST_KEYS.cityPay:
      return `A pay study for the city, across town. You lost Harnett County's on similar work, so team with a firm that has done NC local pay studies.${when}`;
    case FORECAST_KEYS.lost:
      return `Harnett County's pay plan upkeep. They passed on you for lack of local pay studies, so bring a partner who has them.${when}`;
    case FORECAST_KEYS.pastJob:
      return `The county's strategic plan update, the same kind of work as your ${hopeMills.periodStart.slice(0, 4)} Hope Mills plan, which the board adopted unchanged.${when}`;
    default:
      return null;
  }
}

/** Grant's chat answers that name Simone's own story. */
export const CHAT = {
  base: "office",
  teamUp: `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) holds the Army's HR Solutions contract and wrote to you about this work. They want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}. Only holders can bid, so their team is your way in. Open Partners to see their card.`,
  smallTeam: "You do not need a partner for the size of this one. A partner can still help if the buyer wants more classes at once than your W-2 staff can teach.",
  mentor:
    "Diana Potts can review this with you. Use “Review with a Mentor” on this page. She is reading your Army Reserve analyst question now, so she knows your work.",
  past: `Your closest past work is ${acs.projectTitle} (${money(acs.totalValue)}, ${acs.periodStart.slice(0, 4)}), your first federal prime. The ${money(halyard.totalValue)} family readiness classes for ${halyard.customerName.replace(/, for .*$/, "")} show Army training, and your Hope Mills plan (${money(hopeMills.totalValue)}) shows public strategic planning.`,
};
