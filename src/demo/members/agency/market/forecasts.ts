// THE AGENCY's forecasts (read through src/demo/explore/forecastData.ts, which picks
// the active member): 14 advertising and marketing forecasts near Lantern Row
// Creative's studio in Fayetteville, NC. The buyers are real offices; the forecast
// records are written for the demo, modeled on real awards and their end dates
// (awards.ts lists the USAspending records). Dates count from today.
//
// The VA hiring campaign comes first (storyboard segment 10): the follow-on to
// 36C77623C0104, which ends 24 Sep 2027 (USAspending: $34.3M obligated, $41.7M with
// options, set aside for service-disabled veteran-owned firms, 11 offers), so the
// next one is about $35M–$45M over five years. Hunter says team up.
//
// Capture status comes from the days to the expected date (engine.ts RUNWAY):
// act now 45 days or fewer, start capture 120, position early 365, watch beyond.
//
// Modeled on (USAspending, pulled 19 Oct 2026):
//   VHA recruitment marketing   https://www.usaspending.gov/award/CONT_AWD_36C77623C0104_3600_-NONE-_-NONE-
//   NC Guard ad buys            https://www.usaspending.gov/award/CONT_AWD_W9124225PA042_9700_-NONE-_-NONE-
//                               https://www.usaspending.gov/award/CONT_AWD_W9124221P0013_9700_-NONE-_-NONE-
//   MARSOC geofencing           https://www.usaspending.gov/award/CONT_AWD_H9225720P0024_9700_-NONE-_-NONE-
//   Fort Bragg ACS ads (WOSB)   https://sam.gov/opp/12c34720dcc541dd7aeff59b642be4fc/view
//   ChooseVA on GSA eBuy        https://sam.gov/opp/edd02746c0fa40558ceb4e5ef7935f2d/view
//   More Powerful NC ($2.5M)    https://www.wfdd.org/2019-04-04/north-carolina-launches-campaign-to-combat-opioid-crisis
//   VA NCO 6 public affairs     https://www.usaspending.gov/award/CONT_AWD_36C24625P0814_3600_-NONE-_-NONE-

import type { ForecastSeed } from "../../../explore/forecastSeeds";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { findPastPerformance, KEY_PARTNER } from "../../../story/persona";
import { HERO_IDS } from "../opportunities";

/** The forecasts the story and the other pages point at. */
export const FORECAST_KEYS = {
  /** The VA hiring campaign follow-on: the team-up. */
  teamUp: "7f03bbb98f79e5cfc04ebf3d9a09a7b1",
  /** Fort Bragg's Exceptional Family Member videos: set aside for woman-owned firms. */
  wosb: "6c995669b3e6a5f855da043dda64cf20",
  /** Cumberland County's hurricane campaign: the job she lost by about 6%. */
  lost: "8fe8d16b51e5b3e938fe45751480a2c9",
  /** The City of Fayetteville's stormwater campaign: her 2023 job. */
  pastJob: "9d01f2874d14a311e0f1e0e17f397730",
  ncGuard: "8897f702e2acd6a86b5895973767395a",
  marsoc: "ffc222bc9810b9987a75e57a80d1f50d",
  visn6: "9147b6460f1a10288b9729163f71ef53",
  dhhs: "4ea8f1e3a3e4d18a0f688c40d8ae256d",
  pwc: "1f6312fc75d913c9d1083b323213c79a",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const USPFO = "USPFO for North Carolina (NC Army National Guard)";

function seed(s: Omit<ForecastSeed, "contactName" | "contactRole" | "sourceLink" | "docKey"> & Partial<ForecastSeed>): ForecastSeed {
  return { contactName: null, contactRole: null, sourceLink: null, docKey: null, ...s };
}

export const FORECAST_SEEDS: ForecastSeed[] = [
  // ── The team-up: position early ───────────────────────────────────────
  seed({
    key: "va-vha-recruitment-follow-on",
    lane: "federal",
    oppKey: FORECAST_KEYS.teamUp,
    hgTitle: "VHA Recruitment Marketing and Advertising Campaign (Follow-on)",
    hgText:
      `The VA's next national campaign to recruit doctors, nurses and other staff for VA hospitals, after the current contract ends on 24 September 2027: strategy, paid media, video shoots at VA medical centers and a hiring website, with a base year and four option years. The VA expects to set it aside for service-disabled veteran-owned small businesses. It is asking firms about the work now (sources sought notice ${HERO_IDS.teamUp}).`,
    sourceId: "VA-27-00041826",
    postedDaysAgo: 5,
    expectedInDays: 200,
    agencyName: "Program Contracting Activity Central (PCAC)",
    agencyAbbr: "VA",
    naicsCode: "541613",
    pscCode: "R701",
    oppType: "Recompete",
    setAsideCode: "SDVOSBC",
    valLow: 35_000_000,
    valHigh: 45_000_000,
    popState: "VA",
    popCity: "Alexandria",
    sourceName: "Department of Veterans Affairs",
    files: [{ fileName: "VHA recruitment marketing follow-on: acquisition plan summary.pdf", sizeBytes: 241_664 }],
    plainTitle: "VA's national health-care hiring campaign, the next contract",
    semanticFit: 0.86,
  }),

  // ── Act now ───────────────────────────────────────────────────────────
  seed({
    key: "acs-efmp-videos",
    lane: "federal",
    oppKey: FORECAST_KEYS.wosb,
    hgTitle: "Exceptional Family Member Program Awareness Videos and Social Media — ACS Fort Bragg",
    hgText:
      "Six short, captioned videos and a year of social posts telling military families at Fort Bragg how the Exceptional Family Member Program helps with medical and school needs. One year. The Army plans to set the quote aside for woman-owned small businesses.",
    sourceId: "MICC-FB-FY27-0517",
    postedDaysAgo: 16,
    expectedInDays: 38,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "512110",
    pscCode: "R701",
    oppType: "New",
    setAsideCode: "WOSB",
    valLow: 60_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Videos for Fort Bragg's Exceptional Family Member Program",
    semanticFit: 0.92,
  }),
  seed({
    key: "pwc-water-conservation",
    lane: "sled",
    oppKey: FORECAST_KEYS.pwc,
    hgTitle: "Water Conservation and Customer Communications Campaign",
    hgText:
      "The commission's board asked staff to seek proposals for a campaign telling customers how to save water and read the new bills: short videos, social and radio ads, bill inserts and a Spanish-language version. About one year.",
    sourceId: null,
    postedDaysAgo: 10,
    expectedInDays: 35,
    agencyName: "Fayetteville Public Works Commission",
    agencyAbbr: "PWC",
    naicsCode: "541810",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 60_000,
    valHigh: 90_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Commission meeting minutes.pdf", sizeBytes: 486_201 }],
    plainTitle: "Water-saving campaign for Fayetteville PWC",
    semanticFit: 0.88,
  }),

  // ── Start capture ─────────────────────────────────────────────────────
  seed({
    key: "marsoc-geofencing-recompete",
    lane: "federal",
    oppKey: FORECAST_KEYS.marsoc,
    hgTitle: "Recruiting Geofencing and Lead Generation Campaign (Recompete) — MARSOC",
    hgText:
      "The next contract for MARSOC's location-based recruiting ads and lead forms, after the current one ends. Digital ads around chosen bases, events and schools, with leads sent to recruiters each week. A base year and four option years, set aside for small businesses.",
    sourceId: "H92257-FY27-0108",
    postedDaysAgo: 24,
    expectedInDays: 50,
    agencyName: "Marine Forces Special Operations Command (MARSOC)",
    agencyAbbr: "SOCOM",
    naicsCode: "541810",
    pscCode: "R701",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 120_000,
    valHigh: 180_000,
    popState: "NC",
    popCity: "Camp Lejeune",
    sourceName: "U.S. Special Operations Command",
    files: null,
    plainTitle: "Geofenced recruiting ads for MARSOC, the next contract",
    semanticFit: 0.9,
  }),
  seed({
    key: "fayetteville-stormwater-2027",
    lane: "sled",
    oppKey: FORECAST_KEYS.pastJob,
    hgTitle: "Stormwater Public Education Campaign 2027–2028",
    hgText:
      "Stormwater Services asked for a new public-education campaign on what not to pour down storm drains: bus-shelter and social ads, two short videos and a bilingual flyer. The council's agenda notes the 2023 campaign raised awareness in the city's survey.",
    sourceId: null,
    postedDaysAgo: 13,
    expectedInDays: 70,
    agencyName: "City of Fayetteville",
    agencyAbbr: null,
    naicsCode: "541810",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 45_000,
    valHigh: 60_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "City Council work session agenda.pdf", sizeBytes: 612_558 }],
    plainTitle: "The city's next stormwater campaign, Fayetteville",
    semanticFit: 0.95,
  }),
  seed({
    key: "ncng-family-programs-videos",
    lane: "federal",
    oppKey: "0a90d2bf7b98731d1d377dcabb3dab44",
    hgTitle: "Family Programs Outreach Video Series — NC National Guard",
    hgText:
      "Short videos that explain the Guard's family readiness and assistance programs to new soldiers' families, filmed at armories across the state, with social cut-downs. One year, set aside for small businesses.",
    sourceId: "W91242-FY27-0044",
    postedDaysAgo: 8,
    expectedInDays: 75,
    agencyName: USPFO,
    agencyAbbr: "NGB",
    naicsCode: "512110",
    pscCode: "R701",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 40_000,
    valHigh: 60_000,
    popState: "NC",
    popCity: "Raleigh",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Family-programs videos for the NC National Guard",
    semanticFit: 0.9,
  }),
  seed({
    key: "acs-relocation-welcome",
    lane: "federal",
    oppKey: "f8aefc9d46592efdad83253cd6051689",
    hgTitle: "Relocation Readiness Welcome Campaign, PCS Season 2027 — ACS Fort Bragg",
    hgText:
      "A campaign for families moving to Fort Bragg in the 2027 moving season: a welcome video, social and search ads, a landing page and printed guides for the Soldier Support Center. One year with one option year, set aside for small businesses.",
    sourceId: "MICC-FB-FY27-0602",
    postedDaysAgo: 19,
    expectedInDays: 95,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541810",
    pscCode: "R701",
    oppType: "New",
    setAsideCode: "SBA",
    valLow: 90_000,
    valHigh: 140_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Welcome campaign for families moving to Fort Bragg",
    semanticFit: 0.9,
  }),

  // ── Position early ────────────────────────────────────────────────────
  seed({
    key: "nc-dhhs-opioid-campaign",
    lane: "sled",
    oppKey: FORECAST_KEYS.dhhs,
    hgTitle: "Opioid and Substance Use Awareness Campaign, Next Phase (More Powerful NC)",
    hgText:
      "The department plans a request for proposals for the next phase of its statewide opioid-awareness campaign: TV, radio, streaming, billboards and social ads, with materials for local health departments. Two years. The first phase in 2019 was a $2.5 million media campaign.",
    sourceId: null,
    postedDaysAgo: 21,
    expectedInDays: 140,
    agencyName: "North Carolina Department of Health and Human Services",
    agencyAbbr: "NCDHHS",
    naicsCode: "541810",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 1_800_000,
    valHigh: 2_500_000,
    popState: "NC",
    popCity: "Raleigh",
    sourceName: null,
    files: [{ fileName: "Opioid settlement advisory committee minutes.pdf", sizeBytes: 731_904 }],
    plainTitle: "Statewide opioid-awareness campaign, the next phase",
    semanticFit: 0.84,
  }),
  seed({
    key: "va-visn6-outreach",
    lane: "federal",
    oppKey: FORECAST_KEYS.visn6,
    hgTitle: "Veteran Outreach and Suicide Prevention Awareness Campaign — VA Mid-Atlantic Health Care Network (VISN 6)",
    hgText:
      "Outreach for VA medical centers in North Carolina and Virginia, including Fayetteville and Durham: short videos, social and radio ads, and event materials encouraging veterans to enroll in VA care and to call the crisis line. One year with two option years. The VA has not said who may bid.",
    sourceId: "VA-27-00043190",
    postedDaysAgo: 27,
    expectedInDays: 150,
    agencyName: "Network Contracting Office 6",
    agencyAbbr: "VA",
    naicsCode: "541810",
    pscCode: "R701",
    oppType: "New",
    setAsideCode: "TBD",
    valLow: 250_000,
    valHigh: 400_000,
    popState: "NC",
    popCity: "Durham",
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "Veteran outreach campaign for the VA's Carolinas and Virginia network",
    semanticFit: 0.87,
  }),
  seed({
    key: "cumberland-hurricane-2027",
    lane: "sled",
    oppKey: FORECAST_KEYS.lost,
    hgTitle: "Hurricane Season Preparedness Campaign 2027, Emergency Services",
    hgText:
      "Emergency Services plans to ask for proposals for the 2027 hurricane preparedness campaign before the season starts on 1 June: social and radio ads, a short video, and printed checklists in English and Spanish. The county will again score creative and price.",
    sourceId: null,
    postedDaysAgo: 11,
    expectedInDays: 160,
    agencyName: "Cumberland County Board of Commissioners",
    agencyAbbr: null,
    naicsCode: "541810",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 55_000,
    valHigh: 75_000,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Board of Commissioners agenda.pdf", sizeBytes: 559_872 }],
    plainTitle: "Cumberland County's 2027 hurricane campaign",
    semanticFit: 0.93,
  }),
  seed({
    key: "ncdot-watch-for-me",
    lane: "sled",
    oppKey: "150a99d95fff07fe51b16b756118a9bd",
    hgTitle: "Pedestrian and Bicycle Safety Campaign (Watch for Me NC), 2027–2028",
    hgText:
      "NCDOT plans to seek an agency for the next round of its pedestrian and bicycle safety campaign with partner towns: paid social and radio, street-level ads near crossings, and toolkits for local police. Two years.",
    sourceId: null,
    postedDaysAgo: 30,
    expectedInDays: 210,
    agencyName: "North Carolina Department of Transportation",
    agencyAbbr: "NCDOT",
    naicsCode: "541810",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: 250_000,
    valHigh: 350_000,
    popState: "NC",
    popCity: "Raleigh",
    sourceName: null,
    files: [{ fileName: "Board of Transportation committee packet.pdf", sizeBytes: 1_104_337 }],
    plainTitle: "Pedestrian and bike safety campaign for NCDOT",
    semanticFit: 0.86,
  }),
  seed({
    key: "ncng-recruiting-fy28",
    lane: "federal",
    oppKey: FORECAST_KEYS.ncGuard,
    hgTitle: "Recruiting and Retention Advertising, FY2028 — NC Army National Guard",
    hgText:
      "The Guard's recruiting advertising for the 2028 fiscal year: geofenced and social ads around high schools, colleges and state events, video ads on screens in DMV offices, short videos and a lead form routed to recruiters. One year with two option years, set aside for small businesses.",
    sourceId: "W91242-FY28-0006",
    postedDaysAgo: 14,
    expectedInDays: 300,
    agencyName: USPFO,
    agencyAbbr: "NGB",
    naicsCode: "541810",
    pscCode: "R701",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 300_000,
    valHigh: 450_000,
    popState: "NC",
    popCity: "Raleigh",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "NC Guard recruiting ads for fiscal 2028",
    semanticFit: 0.94,
  }),

  // ── Watch ─────────────────────────────────────────────────────────────
  seed({
    key: "va-choose-va-next-order",
    lane: "federal",
    oppKey: "3efcc463ceef46aabdd152a3a4f0e48b",
    hgTitle: "VA Careers Employer Brand Campaign (ChooseVA), Next Order — GSA MAS SIN 541810",
    hgText:
      "The VA's next order for its national employer-brand campaign. The last one was posted on GSA eBuy to holders of the GSA schedule's advertising SIN 541810, and the VA expects to buy the next one the same way.",
    sourceId: "VA-28-00012077",
    postedDaysAgo: 33,
    expectedInDays: 400,
    agencyName: "Strategic Acquisition Center",
    agencyAbbr: "VA",
    naicsCode: "541810",
    pscCode: "R701",
    oppType: "Recompete",
    setAsideCode: null,
    valLow: 2_500_000,
    valHigh: 3_500_000,
    popState: "DC",
    popCity: null,
    sourceName: "Department of Veterans Affairs",
    files: null,
    plainTitle: "VA's employer-brand campaign, for GSA schedule holders",
    semanticFit: 0.8,
  }),
  seed({
    key: "ccs-enrollment-campaign",
    lane: "sled",
    oppKey: "c7c503b0079b903268de2947b9fe32b1",
    hgTitle: "Family Enrollment and School Choice Campaign",
    hgText:
      "The school board discussed a campaign to tell families about magnet programs and enrollment dates: social and radio ads, short videos and printed guides. Staff will report back with a plan; no date was set.",
    sourceId: null,
    postedDaysAgo: 20,
    expectedInDays: null,
    agencyName: "Cumberland County Board of Education",
    agencyAbbr: null,
    naicsCode: "541810",
    pscCode: null,
    oppType: "Agendas / Minutes",
    setAsideCode: null,
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: "Fayetteville",
    sourceName: null,
    files: [{ fileName: "Board of Education meeting minutes.pdf", sizeBytes: 402_115 }],
    plainTitle: "Enrollment campaign for Cumberland County Schools",
    semanticFit: 0.85,
  }),
];

/** How close a forecast's industry code is to Dana's own, 0 to 1. Null: no code. */
export function categoryFit(code: string | null, own: readonly string[]): number | null {
  if (!code) return null;
  if (own.includes(code)) return 1;
  if (/^(5418|5121)/.test(code)) return 0.8;
  if (/^(5416|5414)/.test(code)) return 0.6;
  if (/^(519130|323111)/.test(code)) return 0.35;
  return 0.05;
}

// ── Grant's words on the forecast pages ─────────────────────────────────

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

const stormwater = findPastPerformance("pp-fayetteville-stormwater")!;
const ncng = findPastPerformance("pp-ncng-recruiting")!;
const longleaf = findPastPerformance("pp-longleaf-hiring")!;

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardLine(oppKey: string, r: ForecastRecordDto, when: string, biggest: number): string | null {
  switch (oppKey) {
    case FORECAST_KEYS.teamUp:
      return `The VA's national hiring campaign, after the current one ends in September 2027. Set aside for veteran-owned firms and far above your ${money(biggest)} largest job: team up. ${KEY_PARTNER.name} holds it now.${when}`;
    case FORECAST_KEYS.wosb:
      return `Videos for Fort Bragg families, planned for woman-owned firms. You hold that certificate, it is your size, and it is 12 miles from your office.${when}`;
    case FORECAST_KEYS.ncGuard:
      return `The NC Guard's recruiting ads for fiscal 2028. You ran this campaign for them in 2025, so ask for your interim rating before it posts.${when}`;
    case FORECAST_KEYS.marsoc:
      return `MARSOC's geofenced recruiting ads come up again. Quillmark Creative holds them now, the firm that beat you on price at Cumberland County. Camp Lejeune is about 100 miles away.${when}`;
    case FORECAST_KEYS.pastJob:
      return `The city's next stormwater campaign. You made the last one in ${stormwater.periodStart.slice(0, 4)}, and your reference, ${stormwater.referenceName}, coordinates its public education.${when}`;
    case FORECAST_KEYS.lost:
      return `The county's 2027 hurricane campaign. You lost the last one by about 6% on price, so price the media buy apart from the creative this time.${when}`;
    case FORECAST_KEYS.pwc:
      return `A water-saving campaign for PWC, across town and your size. It is a public-behavior campaign, like your stormwater work for the city.${when}`;
    case FORECAST_KEYS.visn6:
      return `Veteran outreach for the VA network that includes the Fayetteville VA. The VA has not said who may bid; veteran-owned firms come first when two can bid.${when}`;
    case FORECAST_KEYS.dhhs:
      return `The state's next opioid-awareness campaign. At ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)} it is far above your ${money(biggest)} largest job, so look for an agency to join.${when}`;
    default:
      return null;
  }
}

/** Grant's chat answers that name Dana's own story. */
export const CHAT = {
  base: "office",
  teamUp: `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) holds the VA's hiring campaign now and wrote to you about it. They want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}. The next one is expected to be set aside for service-disabled veteran-owned firms, so their team is your way in. Open Partners to see their card.`,
  smallTeam: "You do not need a partner for the size of this one. A partner can still help if the buyer asks for more people than your team of nine.",
  mentor:
    "Diana Potts can review this with you. Use “Review with a Mentor” on this page. She has read your FAST ridership proposal, so she knows your work.",
  past: `Your closest past work is ${ncng.projectTitle} (${money(ncng.totalValue)}, ${ncng.periodStart.slice(0, 4)}). Your ${longleaf.customerName} hiring campaign (${money(longleaf.totalValue)}) shows recruiting work, and your City of Fayetteville stormwater campaign (${money(stormwater.totalValue)}) shows public campaigns.`,
};
