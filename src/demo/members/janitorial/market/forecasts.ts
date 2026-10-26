// THE JANITORIAL FIRM's forecasts (read through src/demo/explore/forecastData.ts, which
// picks the active member): 14 cleaning and grounds forecasts near Gray Owl's office
// in Fayetteville, NC. Source: demo-storyboard/janitorial-pack.md, section 13. The
// buyers are real offices; the forecast records are written for the demo, modeled on
// real awards and their end dates (named on each one). Dates count from today.
//
// The Army Reserve centers come first (storyboard segment 10): the 81st Readiness
// Division's janitorial and grounds follow-on, after W912HP21C1001 (8(a) sole source,
// $1,900,573, Jul 2021 – Jul 2026, potential end Jan 2027). Expected 8(a) again, so
// Hunter says team up with the prime.
//
// Capture status comes from the days to the expected date (engine.ts RUNWAY):
// act now 45 days or fewer, start capture 120, position early 365, watch beyond.
//
// Modeled on (USAspending and SAM.gov, pulled 19 Oct 2026):
//   81st RD janitorial and grounds  https://www.usaspending.gov/award/CONT_AWD_W912HP21C1001_9700_-NONE-_-NONE-
//   Seymour Johnson custodial       https://sam.gov/opp/0988013518e547cd843cd03ea1a9eb2e/view
//   Seymour Johnson grounds         https://www.usaspending.gov/award/CONT_AWD_FA480926F0033_9700_FA480924D0003_9700
//   4th Medical Group cleaning      https://www.usaspending.gov/award/CONT_AWD_HT940625F0038_9700_HT940824D0005_9700
//   DoDEA Fort Bragg schools        https://www.usaspending.gov/award/CONT_AWD_HE125426CE010_9700_-NONE-_-NONE-
//   Womack hospital cleaning        https://www.usaspending.gov/award/CONT_AWD_HT940824F0031_9700_HT940824D0009_9700
//   Garner VA clinic                https://www.usaspending.gov/award/CONT_AWD_36C24625P1093_3600_-NONE-_-NONE-
//   NIEHS janitorial                https://www.usaspending.gov/award/CONT_AWD_75N99026C00018_7529_-NONE-_-NONE-
//   Recruiting offices              https://www.usaspending.gov/award/CONT_AWD_W912HN25CA005_9700_-NONE-_-NONE-
//   FAA Fayetteville tower          https://www.usaspending.gov/award/CONT_AWD_697DCK23C00411_6920_-NONE-_-NONE-
//   Mess-hall exhaust hoods         https://www.usaspending.gov/award/CONT_AWD_W9124722C9112_9700_-NONE-_-NONE-
//   Seymour Johnson washing BPA     https://www.usaspending.gov/award/CONT_AWD_FA480925F0106_9700_FA480924A0002_9700

import type { ForecastSeed } from "../../../explore/forecastSeeds";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { findPastPerformance, KEY_PARTNER } from "../../../story/persona";
import { HERO_IDS } from "../opportunities";

/**
 * The forecasts the story and the other pages point at. The role names are the
 * template's; he has no forecast from a buyer that turned him down, so `lost` is
 * Seymour Johnson's base custodial, the 8(a) award he can only reach as a sub.
 */
export const FORECAST_KEYS = {
  /** The Army Reserve centers' cleaning and mowing: the team-up. */
  teamUp: "91f29f429bf888fdd4a58376bd413648",
  /** The next call under his own BPA at Seymour Johnson. */
  wosb: "af264b419ef683b672ac9ee6ad9f2b2c",
  /** Seymour Johnson's base custodial: 8(a), so floor care for the bidders. */
  lost: "35d510085da4247fbe324b13e4c17f13",
  /** His Hope Mills custodial contract, up for renewal. */
  pastJob: "32933e2c40715f7b0dfceb7ae553089d",
  hoods: "f4020bf0b7bf4c8c8241e6d4c5974687",
  womack: "9de3a1107cc3fa11ef4fd7cf62fb1656",
  clinic: "4d3c4a12ee786688176c008d0a02df7c",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const SEYMOUR = "4th Contracting Squadron, Seymour Johnson AFB";
const VA_NCO6 = "Network Contracting Office 6";
const DHA = "Defense Health Agency";

function seed(s: Omit<ForecastSeed, "contactName" | "contactRole" | "sourceLink" | "docKey"> & Partial<ForecastSeed>): ForecastSeed {
  return { contactName: null, contactRole: null, sourceLink: null, docKey: null, ...s };
}

export const FORECAST_SEEDS: ForecastSeed[] = [
  // ── The team-up: start capture ────────────────────────────────────────
  seed({
    key: "usace-81st-rd-janitorial-grounds",
    lane: "federal",
    oppKey: FORECAST_KEYS.teamUp,
    hgTitle: "81st Readiness Division Janitorial and Grounds Maintenance, Army Reserve Facilities in NC and SC (Follow-on)",
    hgText:
      `Custodial and grounds care at Army Reserve centers in North and South Carolina, one prime for every site, base year and four options. It follows the current contract, which ends in January 2027. The district expects to set it aside for 8(a) firms and is asking firms about it now (sources sought notice ${HERO_IDS.teamUp}).`,
    sourceId: "W912HP-FY27-0019",
    postedDaysAgo: 6,
    expectedInDays: 75,
    agencyName: "U.S. Army Corps of Engineers, Charleston District",
    agencyAbbr: "USACE",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "8A",
    valLow: 2_000_000,
    valHigh: 2_600_000,
    popState: "NC",
    popCity: null,
    sourceName: "Department of the Army",
    files: [{ fileName: "81st RD janitorial and grounds: site list and acquisition summary.pdf", sizeBytes: 241_664 }],
    plainTitle: "Cleaning and mowing at Army Reserve centers in NC and SC",
    semanticFit: 0.93,
  }),

  // ── Act now ───────────────────────────────────────────────────────────
  seed({
    key: "sj-base-custodial-award",
    lane: "federal",
    oppKey: FORECAST_KEYS.lost,
    hgTitle: "Base Custodial Services, Seymour Johnson AFB (FA480926R0004)",
    hgText:
      "The squadron's next base custodial contract, set aside for 8(a) firms. Proposals are in; the award is expected in about six weeks, and the work starts on 1 April 2027.",
    sourceId: "FA4809-FY27-0004",
    postedDaysAgo: 30,
    expectedInDays: 45,
    agencyName: SEYMOUR,
    agencyAbbr: "USAF",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "8A",
    valLow: 650_000,
    valHigh: 750_000,
    popState: "NC",
    popCity: "Goldsboro",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "Seymour Johnson's base custodial",
    semanticFit: 0.92,
  }),

  // ── Start capture ─────────────────────────────────────────────────────
  seed({
    key: "dha-4mdg-clinic-cleaning",
    lane: "federal",
    oppKey: FORECAST_KEYS.clinic,
    hgTitle: "Healthcare Environmental Cleaning, 4th Medical Group, Seymour Johnson AFB (Task Order)",
    hgText:
      "The clinic's cleaning order ends on 13 February 2027, and the next one will be placed under DHA's healthcare cleaning IDIQ. Only the IDIQ's holders can compete.",
    sourceId: "HT9408-FY27-0031",
    postedDaysAgo: 14,
    expectedInDays: 117,
    agencyName: DHA,
    agencyAbbr: "DHA",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 650_000,
    valHigh: 750_000,
    popState: "NC",
    popCity: "Goldsboro",
    sourceName: "Department of Defense",
    files: null,
    plainTitle: "Clinic cleaning at Seymour Johnson, the next order",
    semanticFit: 0.86,
  }),

  // ── Position early ────────────────────────────────────────────────────
  seed({
    key: "sj-washing-bpa-next-call",
    lane: "federal",
    oppKey: FORECAST_KEYS.wosb,
    hgTitle: "Exterior Washing, Dormitories and Facilities — Call under BPA FA480924A0007",
    hgText:
      "The squadron plans its next exterior-washing call for the spring: dorms, sidewalks and dumpster pads, with wash water kept out of the storm drains. Calls go to the BPA's holder to quote.",
    sourceId: "FA4809-FY27-0112",
    postedDaysAgo: 10,
    expectedInDays: 160,
    agencyName: SEYMOUR,
    agencyAbbr: "USAF",
    naicsCode: "561790",
    pscCode: "S299",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 40_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Goldsboro",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "The next washing call at Seymour Johnson",
    semanticFit: 0.97,
  }),
  seed({
    key: "garner-va-clinic-janitorial",
    lane: "federal",
    oppKey: "f2a4255778bece80f8eccdfba5d28c64",
    hgTitle: "Janitorial Services, Garner VA Clinic",
    hgText:
      "The clinic's janitorial contract ends on 14 June 2027. The VA buys this from service-disabled veteran-owned firms first.",
    sourceId: "VA-27-00061204",
    postedDaysAgo: 20,
    expectedInDays: 238,
    agencyName: VA_NCO6,
    agencyAbbr: "VA",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 550_000,
    valHigh: 650_000,
    popState: "NC",
    popCity: "Garner",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Janitorial at the Garner VA clinic",
    semanticFit: 0.9,
  }),
  seed({
    key: "hope-mills-custodial-renewal",
    lane: "sled",
    oppKey: FORECAST_KEYS.pastJob,
    hgTitle: "Custodial Services, Town Hall, Police Station and Park Restrooms — Renewal",
    hgText:
      "The town's budget for next year carries its custodial contract for the town hall, police station and park restrooms, which renews on 30 June 2027.",
    sourceId: null,
    postedDaysAgo: 12,
    expectedInDays: 254,
    agencyName: "Town of Hope Mills Board of Commissioners",
    agencyAbbr: null,
    naicsCode: "561720",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 52_000,
    valHigh: 52_000,
    popState: "NC",
    popCity: "Hope Mills",
    sourceName: null,
    files: [{ fileName: "Town of Hope Mills recommended budget, FY2028.pdf", sizeBytes: 486_400 }],
    plainTitle: "Hope Mills' custodial contract, up for renewal",
    semanticFit: 0.98,
  }),
  seed({
    key: "recruiting-offices-janitorial-nc",
    lane: "federal",
    oppKey: "bb7949510aac246ac37392fd6602c211",
    hgTitle: "Janitorial Services, Army and Marine Corps Recruiting Offices, North Carolina",
    hgText:
      "Cleaning for recruiting offices across North Carolina, after the current contract ends on 1 August 2027. Last time it went to one 8(a) firm without a competition.",
    sourceId: "W912HN-FY27-0204",
    postedDaysAgo: 24,
    expectedInDays: 286,
    agencyName: "U.S. Army Corps of Engineers, Savannah District",
    agencyAbbr: "USACE",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "8AN",
    valLow: 425_000,
    valHigh: 525_000,
    popState: "NC",
    popCity: null,
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Janitorial at recruiting offices across NC",
    semanticFit: 0.88,
  }),
  seed({
    key: "bragg-dfac-exhaust-hoods",
    lane: "federal",
    oppKey: FORECAST_KEYS.hoods,
    hgTitle: "Exhaust Hood, Duct and Fan Cleaning, Troop Mess Halls (DFACs), Fort Bragg — Follow-on",
    hgText:
      "Cleaning the exhaust hoods, ducts and fans in Fort Bragg's mess halls to NFPA 96, after the current contract's extension ends on 13 September 2027. Last time it went to an 8(a) firm without a competition; the Army is asking firms about it now (sources sought notice W9124727QA026).",
    sourceId: "MICC-FB-FY27-0388",
    postedDaysAgo: 8,
    expectedInDays: 329,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "561790",
    pscCode: "S299",
    oppType: "Recompete",
    setAsideCode: "TBD",
    valLow: 70_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Mess-hall exhaust hood cleaning at Fort Bragg",
    semanticFit: 0.8,
  }),

  // ── Watch ─────────────────────────────────────────────────────────────
  seed({
    key: "rcc-grounds-maintenance",
    lane: "sled",
    oppKey: "48a6141e0b479ff3876f924b19e27caf",
    hgTitle: "Lawn and Grounds Maintenance Services",
    hgText:
      "The college's facilities committee plans to bid its lawn and grounds care late next year instead of doing it in house.",
    sourceId: null,
    postedDaysAgo: 16,
    expectedInDays: 400,
    agencyName: "Robeson Community College Board of Trustees",
    agencyAbbr: "RCC",
    naicsCode: "561730",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 40_000,
    valHigh: 70_000,
    popState: "NC",
    popCity: "Lumberton",
    sourceName: null,
    files: [{ fileName: "Facilities committee minutes.pdf", sizeBytes: 211_968 }],
    plainTitle: "Robeson Community College's grounds care",
    semanticFit: 0.84,
  }),
  seed({
    key: "faa-fay-tower-janitorial",
    lane: "federal",
    oppKey: "67adac0ca9a4c5f11106c3de1656a84a",
    hgTitle: "Janitorial Services, Fayetteville Airport Traffic Control Tower",
    hgText:
      "Janitorial for the tower and its base building. The work is on the AbilityOne Procurement List; the current contract runs to September 2028.",
    sourceId: "FAA-FY28-0457",
    postedDaysAgo: 40,
    expectedInDays: 710,
    agencyName: "Federal Aviation Administration",
    agencyAbbr: "FAA",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: null,
    valLow: 40_000,
    valHigh: 40_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: "Department of Transportation",
    files: null,
    plainTitle: "Janitorial at Fayetteville's control tower (AbilityOne)",
    semanticFit: 0.9,
  }),
  seed({
    key: "sj-grounds-maintenance",
    lane: "federal",
    oppKey: "e58e7df7ce800a2eb6506227cdac50bd",
    hgTitle: "Grounds Maintenance, Seymour Johnson AFB",
    hgText:
      "The base's grounds care runs under a veteran-owned IDIQ to August 2029. The squadron set it aside for HUBZone firms until 2024.",
    sourceId: "FA4809-FY29-0008",
    postedDaysAgo: 45,
    expectedInDays: 1_040,
    agencyName: SEYMOUR,
    agencyAbbr: "USAF",
    naicsCode: "561730",
    pscCode: "S208",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 550_000,
    valHigh: 650_000,
    popState: "NC",
    popCity: "Goldsboro",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "Grounds care at Seymour Johnson",
    semanticFit: 0.82,
  }),
  seed({
    key: "womack-hospital-cleaning",
    lane: "federal",
    oppKey: FORECAST_KEYS.womack,
    hgTitle: "Healthcare Environmental Cleaning, Army Medical Center at Fort Bragg (Task Order)",
    hgText:
      "The post hospital's cleaning, ordered under DHA's healthcare cleaning IDIQ, has options to September 2029. Any successor must pay the incumbent's union wages and benefits (41 U.S.C. 6707(c)).",
    sourceId: "HT9408-FY29-0012",
    postedDaysAgo: 50,
    expectedInDays: 1_075,
    agencyName: DHA,
    agencyAbbr: "DHA",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 9_000_000,
    valHigh: 11_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of Defense",
    files: null,
    plainTitle: "Hospital cleaning at Fort Bragg's Army hospital",
    semanticFit: 0.85,
  }),
  seed({
    key: "dodea-bragg-schools-custodial",
    lane: "federal",
    oppKey: "6e5d4432b846f645ab035594ea6a41a2",
    hgTitle: "Custodial Services, DoDEA Schools, Fort Bragg",
    hgText:
      "Custodial for the DoD schools on post. The work is on the AbilityOne Procurement List; the current contract runs to November 2031.",
    sourceId: "HE1254-FY32-0003",
    postedDaysAgo: 60,
    expectedInDays: 1_850,
    agencyName: "Department of Defense Education Activity",
    agencyAbbr: "DoDEA",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: null,
    valLow: 600_000,
    valHigh: 700_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of Defense",
    files: null,
    plainTitle: "Custodial at Fort Bragg's DoD schools (AbilityOne)",
    semanticFit: 0.9,
  }),
  seed({
    key: "niehs-rtp-janitorial",
    lane: "federal",
    oppKey: "4bc6484b6e6b15abb302581c39393336",
    hgTitle: "Janitorial Services, NIEHS Campus, Research Triangle Park",
    hgText:
      "Janitorial for the institute's labs and offices. Last set aside for 8(a) firms, with 25 offers; its options run to 2032.",
    sourceId: "NIH-FY32-0141",
    postedDaysAgo: 55,
    expectedInDays: 1_900,
    agencyName: "National Institutes of Health",
    agencyAbbr: "NIH",
    naicsCode: "561720",
    pscCode: "S201",
    oppType: "Recompete",
    setAsideCode: "8A",
    valLow: 1_100_000,
    valHigh: 1_300_000,
    popState: "NC",
    popCity: "Durham",
    sourceName: "Department of Health and Human Services",
    files: null,
    plainTitle: "Janitorial at NIEHS in Research Triangle Park",
    semanticFit: 0.86,
  }),
];

/** How close a forecast's industry code is to Reggie's own, 0 to 1. Null: no code. */
export function categoryFit(code: string | null, own: readonly string[]): number | null {
  if (!code) return null;
  if (own.includes(code)) return 1;
  if (/^5617/.test(code)) return 0.8;
  if (/^(5612|5619)/.test(code)) return 0.5;
  if (/^(2382|3256)/.test(code)) return 0.2;
  return 0.05;
}

// ── Grant's words on the forecast pages ─────────────────────────────────

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

const dorms = findPastPerformance("pp-sj-dorm-wash")!;
const hopeMills = findPastPerformance("pp-hope-mills-custodial")!;
const redtail = findPastPerformance("pp-redtail-va-floors")!;

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardLine(oppKey: string, r: ForecastRecordDto, when: string, _biggest: number): string | null {
  switch (oppKey) {
    case FORECAST_KEYS.teamUp:
      return `Army Reserve cleaning and mowing in NC and SC. It's for 8(a) firms only and spans two states: team up. ${KEY_PARTNER.name} wants a crew for the NC centers.${when}`;
    case FORECAST_KEYS.wosb:
      return `The next washing call under your own BPA. Same squadron and work as your dorm job; quote it when it comes.${when}`;
    case FORECAST_KEYS.pastJob:
      return `Your Hope Mills contract renews. Ask ${hopeMills.referenceName} for a reference letter now, while it's going well.${when}`;
    case FORECAST_KEYS.lost:
      return `Seymour Johnson's base custodial goes to an 8(a) firm. Offer your floor care to the bidders before the award.${when}`;
    case FORECAST_KEYS.hoods:
      return `Mess-hall hood cleaning at Fort Bragg. Answer the sources sought, but you'd need NFPA 96 hood certification first.${when}`;
    case FORECAST_KEYS.womack:
      return `Fort Bragg's hospital cleaning, at ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)} a year, for IDIQ holders only and at union wages. Ask a holder about floor care later.${when}`;
    case FORECAST_KEYS.clinic:
      return `Clinic cleaning at Seymour Johnson, for DHA's IDIQ holders only. You can't quote it; ask a holder if they need a floor crew.${when}`;
    default:
      return null;
  }
}

/** Grant's chat answers that name Reggie's own story. */
export const CHAT = {
  base: "office",
  teamUp: `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) wrote to you about the Army Reserve centers. They want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}. The work is expected to be for 8(a) firms, so their team is your way in, and your share is capped at half (13 CFR 125.6). Open Partners to see their card.`,
  smallTeam: "You don't need a partner for the size of this one. A partner can still help if it starts the same month as another job and your night crews are full.",
  mentor:
    "Diana Potts can review this with you. Use “Review with a Mentor” on this page. She is reading your plan for the Fort Bragg pressure-washing bid, so she knows your work.",
  past: `Your closest federal work is ${dorms.projectTitle} (${money(dorms.totalValue)}, ${dorms.periodStart.slice(0, 4)}). Your floor care for ${redtail.customerName.replace(/ \(.*\)$/, "")} (${money(redtail.totalValue)}) shows work under a prime, and ${hopeMills.customerName} shows steady public custodial since ${hopeMills.periodStart.slice(0, 4)}.`,
};
