// THE IT SERVICES FIRM's forecasts (read through src/demo/explore/forecastData.ts,
// which picks the active member): 14 IT forecasts near Gallberry Technology Group's
// office in Fayetteville, NC. Source: demo-storyboard/it-services-pack.md, section 13.
// The buyers are real offices; the forecast records are written for the demo,
// modeled on real awards and their end dates (named on each one). Dates count from
// today.
//
// The Army hospital's IT at Fort Bragg comes first (storyboard segment 10): the
// current order (HT001524F0117 as the model, 8(a) STARS III, $8.55M, Aug 2024 – Aug
// 2026, option to 28 Feb 2027, 1 offer) is followed by about $3.8M–$4.4M a year,
// ordered through STARS III again. He is 8(a) but holds no STARS III seat, and each
// year is about one and a half times his revenue, so Hunter says team up. The
// hospital is never named: "Womack" is one of the caterer's own words.
//
// Values are the whole contract, base and option years, as a forecast states them.
//
// Capture status comes from the days to the expected date (engine.ts RUNWAY):
// act now 45 days or fewer, start capture 120, position early 365, watch beyond.
//
// Modeled on (USAspending and SAM.gov, pulled 19 Oct 2026):
//   Army hospital IT (STARS III) https://www.usaspending.gov/award/CONT_AWD_HT001524F0117_9700_47QTCB21D0173_4732
//   Pope 43 CS IT support        https://www.usaspending.gov/award/CONT_AWD_FA445223P0027_9700_-NONE-_-NONE-
//   Seymour Johnson desktop      https://www.usaspending.gov/award/CONT_AWD_FA480917PR014_9700_-NONE-_-NONE-
//   Logistics systems (ITES-3S)  https://www.usaspending.gov/award/CONT_AWD_W9124722F0117_9700_W52P1J18DA122_9700
//   XVIII ABC IT (ITES-3S)       https://www.usaspending.gov/award/CONT_AWD_W9124725FA066_9700_W52P1J18DA013_9700
//   Other Fort Bragg ITES-3S     https://www.usaspending.gov/award/CONT_AWD_W9124723F2439_9700_W52P1J18DA087_9700
//                                https://www.usaspending.gov/award/CONT_AWD_W9124724F0382_9700_W52P1J18DA013_9700
//   8(a) sole source, Fort Bragg https://www.usaspending.gov/award/CONT_AWD_W9124725CA004_9700_-NONE-_-NONE-
//                                https://www.usaspending.gov/award/CONT_AWD_W9124725CA003_9700_-NONE-_-NONE-
//   Seymour Johnson telecom IDIQ https://www.usaspending.gov/award/CONT_IDV_FA480923D0006_9700
//   Camp Lejeune base network    https://www.usaspending.gov/award/CONT_AWD_M6785421C4905_9700_-NONE-_-NONE-
//   USSOCOM labor for seats      https://www.usaspending.gov/award/CONT_AWD_H9240323C0003_9700_-NONE-_-NONE-
//   NC DPI Category Two          https://sci.fi.ncsu.edu/?p=5598
//   ITES-4S                      https://sam.gov/opp/960b3ea931b74e04a6f248ffc23d46da/view

import type { ForecastSeed } from "../../../explore/forecastSeeds";
import type { ForecastRecordDto } from "@/lib/forecastsApi";
import { findPastPerformance, KEY_PARTNER } from "../../../story/persona";
import { HERO_IDS } from "../opportunities";

/** The forecasts the story and the other pages point at. */
export const FORECAST_KEYS = {
  /** The Army hospital's IT at Fort Bragg, the follow-on: the team-up. */
  teamUp: "af7492ba6865ae35fedebe3214aeb807",
  /** Pope's 43 CS IT support: the buyer now plans it for 8(a) firms, his program. */
  wosb: "e4871ecb0a1a3c1d15f9e7a4d4495a72",
  /** XVIII Airborne Corps IT services: the office that took a lower price on his Windows 11 quote. */
  lost: "9d6718d0700cf3db414eabd5fc5fb0ad",
  /** Seymour Johnson desktop support, the follow-on: the job he runs now. */
  pastJob: "f5d4ae2ddd341c9ac045699c33250c5b",
  logistics: "b0be62da54dc27678b4f626b9a16d274",
  lejeune: "f044156ac2183ab4f4d6513c5543c931",
  schoolWifi: "f91b2510b980354b81a0851563462640",
  ites4s: "b4625c71c4f8023b0b1a527fb63b2b1c",
} as const;

const MICC = "Mission and Installation Contracting Command (MICC) — Fort Bragg";
const ITES_ONLY = "It is expected to be ordered through the Army's ITES-3S contract, so only its holders may quote.";

function seed(s: Omit<ForecastSeed, "contactName" | "contactRole" | "sourceLink" | "docKey"> & Partial<ForecastSeed>): ForecastSeed {
  return { contactName: null, contactRole: null, sourceLink: null, docKey: null, ...s };
}

export const FORECAST_SEEDS: ForecastSeed[] = [
  // ── The team-up ───────────────────────────────────────────────────────
  seed({
    key: "dha-bragg-hospital-it",
    lane: "federal",
    oppKey: FORECAST_KEYS.teamUp,
    hgTitle: "Medical Center IT Services Follow-on — Fort Bragg, NC (8(a) STARS III)",
    hgText:
      `IT services for the Army medical center at Fort Bragg and its clinics: deskside support, the service desk and clinic network support, about $3.8M to $4.4M a year for a base year and four options. The current order's last option ends on 28 February 2027. The DHA expects to order the next one through 8(a) STARS III, with quotes in about 90 days, and is asking firms about it now (request for information ${HERO_IDS.teamUp}).`,
    sourceId: "DHA-FY27-EMSCD-0141",
    postedDaysAgo: 4,
    expectedInDays: 90,
    agencyName: "Defense Health Agency",
    agencyAbbr: "DHA",
    naicsCode: "541512",
    pscCode: "DE01",
    oppType: "Recompete",
    setAsideCode: "8A",
    // The whole order, five years: about $3.8M–$4.4M a year (the opportunity's yearly value).
    valLow: 19_000_000,
    valHigh: 22_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Defense Health Agency",
    files: [{ fileName: "Medical center IT services follow-on: acquisition plan summary.pdf", sizeBytes: 241_664 }],
    plainTitle: "IT support for the Army hospital at Fort Bragg, the follow-on",
    semanticFit: 0.92,
  }),

  // ── Act now ───────────────────────────────────────────────────────────
  seed({
    key: "sjafb-desktop-follow-on",
    lane: "federal",
    oppKey: FORECAST_KEYS.pastJob,
    hgTitle: "Desktop Support Services, 4th Communications Squadron (Follow-on) — Seymour Johnson AFB",
    hgText:
      "Two on-site techs for the squadron's desktop support and imaging, from March 2027, when the current contract ends. Set aside for small businesses; the quote request is open now (FA480927Q0006).",
    sourceId: "FA4809-FY27-0006",
    postedDaysAgo: 30,
    expectedInDays: 10,
    agencyName: "4th Contracting Squadron",
    agencyAbbr: "USAF",
    naicsCode: "541513",
    pscCode: "DE02",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 630_000,
    valHigh: 780_000,
    popState: "NC",
    popCity: "Seymour Johnson AFB",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "Seymour Johnson desktop support, the follow-on",
    semanticFit: 0.97,
  }),
  seed({
    key: "micc-logistics-field-support",
    lane: "federal",
    oppKey: FORECAST_KEYS.logistics,
    hgTitle: "Logistics Systems Field Support Services, Fort Bragg (Follow-on)",
    hgText:
      `Field techs for the Army's logistics systems across Fort Bragg, after the current order ends on 29 November 2026. ${ITES_ONLY}`,
    sourceId: "MICC-FB-FY27-0214",
    postedDaysAgo: 40,
    expectedInDays: 20,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541519",
    pscCode: "DD01",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 19_000_000,
    valHigh: 22_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Logistics systems field support at Fort Bragg",
    semanticFit: 0.7,
  }),
  seed({
    key: "nc-dpi-category-two",
    lane: "sled",
    oppKey: FORECAST_KEYS.schoolWifi,
    hgTitle: "E-Rate Category Two Statewide Contract (School Wi-Fi and Network Equipment)",
    hgText:
      "The state's next master contract for school Wi-Fi and network gear under the federal E-Rate program. Districts will buy from it through mini-bids. Proposals are due on 6 November 2026.",
    sourceId: null,
    postedDaysAgo: 21,
    expectedInDays: 18,
    agencyName: "NC Department of Public Instruction",
    agencyAbbr: "NC DPI",
    naicsCode: "541512",
    pscCode: null,
    oppType: "New",
    setAsideCode: null,
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: null,
    sourceName: null,
    files: [{ fileName: "Category Two RFP Lite: overview.pdf", sizeBytes: 187_392 }],
    plainTitle: "Statewide school Wi-Fi contract under E-Rate",
    semanticFit: 0.55,
  }),

  // ── Start capture ─────────────────────────────────────────────────────
  seed({
    key: "micc-fccs-support",
    lane: "federal",
    oppKey: "069df10f393770057973d2262c553233",
    hgTitle: "FCCS Support Services, Fort Bragg (Follow-on)",
    hgText: `Network and communications support for units on Fort Bragg, after the current order ends on 31 January 2027. ${ITES_ONLY}`,
    sourceId: "MICC-FB-FY27-0188",
    postedDaysAgo: 28,
    expectedInDays: 75,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541519",
    pscCode: "DG01",
    oppType: "Recompete",
    setAsideCode: "TBD",
    valLow: 7_500_000,
    valHigh: 9_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Network and communications support at Fort Bragg",
    semanticFit: 0.75,
  }),
  seed({
    key: "lejeune-base-network",
    lane: "federal",
    oppKey: FORECAST_KEYS.lejeune,
    hgTitle: "Base Network Operations and Maintenance, Marine Corps Base Camp Lejeune — 8(a) Sole Source",
    hgText:
      "Running and maintaining Camp Lejeune's base network. The Marine Corps plans to give it to one 8(a) firm without a competition (notice of intent M6785427R4902). The winner will need techs and cabling crews on base.",
    sourceId: "MCSC-FY27-0049",
    postedDaysAgo: 6,
    expectedInDays: 60,
    agencyName: "Marine Corps Systems Command",
    agencyAbbr: "USMC",
    naicsCode: "541512",
    pscCode: "DG01",
    oppType: "Recompete",
    setAsideCode: "8AN",
    valLow: 65_000_000,
    valHigh: 75_000_000,
    popState: "NC",
    popCity: "Camp Lejeune",
    sourceName: "Department of the Navy",
    files: null,
    plainTitle: "Camp Lejeune's base network, going to one 8(a) firm",
    semanticFit: 0.8,
  }),
  seed({
    key: "usarc-gcss-army-support",
    lane: "federal",
    oppKey: "9a671707a1ef5219a299aaede4a2ad22",
    hgTitle: "GCSS-Army Support Services, U.S. Army Reserve Command (Follow-on)",
    hgText:
      "Help for Army Reserve units on the Army's supply and finance system, after the base period ends on 23 March 2027. The last one went to one 8(a) firm without a competition.",
    sourceId: "MICC-FB-FY27-0302",
    postedDaysAgo: 15,
    expectedInDays: 110,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541519",
    pscCode: "DA01",
    oppType: "Recompete",
    setAsideCode: "8AN",
    valLow: 2_000_000,
    valHigh: 2_400_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Supply system help for the Army Reserve, the next contract",
    semanticFit: 0.72,
  }),
  seed({
    key: "forscom-g39-support",
    lane: "federal",
    oppKey: "fe95144d639bea038f626cd93c82eb4a",
    hgTitle: "FORSCOM G-39 Support Services (Follow-on)",
    hgText:
      "Information and planning support for Forces Command's G-39 staff at Fort Bragg, after the base period ends on 27 March 2027. The last one went to one 8(a) firm without a competition.",
    sourceId: "MICC-FB-FY27-0307",
    postedDaysAgo: 15,
    expectedInDays: 115,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541519",
    pscCode: "DF01",
    oppType: "Recompete",
    setAsideCode: "8AN",
    valLow: 1_200_000,
    valHigh: 1_600_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Staff support for Forces Command's G-39, the next contract",
    semanticFit: 0.6,
  }),

  // ── Position early ────────────────────────────────────────────────────
  seed({
    key: "xviii-abc-it-services",
    lane: "federal",
    oppKey: FORECAST_KEYS.lost,
    hgTitle: "IT and Information-Sharing Services, XVIII Airborne Corps (Follow-on)",
    hgText: `IT support and SharePoint sites for the corps headquarters at Fort Bragg, after the base period ends in May 2027. ${ITES_ONLY} The last order drew 12 offers.`,
    sourceId: "MICC-FB-FY27-0355",
    postedDaysAgo: 18,
    expectedInDays: 170,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541519",
    pscCode: "DF01",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: 800_000,
    valHigh: 950_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "XVIII Airborne Corps IT services, the next order",
    semanticFit: 0.9,
  }),
  seed({
    key: "pope-43cs-it-support",
    lane: "federal",
    oppKey: FORECAST_KEYS.wosb,
    hgTitle: "IT Support Services, 43rd Communications Squadron — Pope Army Airfield",
    hgText:
      "The squadron's help desk, network and phone support at Pope, with an award planned by September 2027. The last two contracts went to one firm without a competition. The Air Force asked which firms could do it (sources sought FA445227R0004) and now plans an 8(a) competition.",
    sourceId: "FA4452-FY27-0031",
    postedDaysAgo: 12,
    expectedInDays: 200,
    agencyName: "763rd Enterprise Sourcing Squadron",
    agencyAbbr: "USAF",
    naicsCode: "541513",
    pscCode: "DG01",
    oppType: "Recompete",
    setAsideCode: "8A",
    valLow: 4_250_000,
    valHigh: 4_750_000,
    popState: "NC",
    popCity: "Pope Army Airfield",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "Pope's 43 CS IT support",
    semanticFit: 0.95,
  }),
  seed({
    key: "usarc-cybersecurity-support",
    lane: "federal",
    oppKey: "a9531be603c8dceb8d04b969a3838469",
    hgTitle: "Cybersecurity Support Services, U.S. Army Reserve Command (Follow-on)",
    hgText: `Security officers and network defense for the Army Reserve, after the current order ends on 12 July 2027. ${ITES_ONLY}`,
    sourceId: "MICC-FB-FY27-0418",
    postedDaysAgo: 22,
    expectedInDays: 240,
    agencyName: MICC,
    agencyAbbr: "MICC",
    naicsCode: "541519",
    pscCode: "DJ01",
    oppType: "Recompete",
    setAsideCode: "TBD",
    valLow: 9_000_000,
    valHigh: 11_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of the Army",
    files: null,
    plainTitle: "Cybersecurity support for the Army Reserve, the next order",
    semanticFit: 0.62,
  }),
  seed({
    key: "army-ites-4s",
    lane: "federal",
    oppKey: FORECAST_KEYS.ites4s,
    hgTitle: "Information Technology Enterprise Solutions — Services 4 (ITES-4S)",
    hgText:
      "The Army's next IT services contract, about $12.1B, replacing ITES-3S, which runs through September 2027. It is expected to set seats aside for small businesses. The request for proposals is expected; awards are not expected before the third quarter of fiscal 2027.",
    sourceId: "W52P1J-ITES-4S",
    postedDaysAgo: 45,
    expectedInDays: 300,
    agencyName: "Army Contracting Command — Rock Island (CHESS)",
    agencyAbbr: "ACC",
    naicsCode: "541512",
    pscCode: "DA01",
    oppType: "New",
    setAsideCode: "TBD",
    valLow: null,
    valHigh: null,
    popState: null,
    popCity: null,
    sourceName: "Department of the Army",
    files: [{ fileName: "ITES-4S request for information.pdf", sizeBytes: 306_176 }],
    plainTitle: "ITES-4S, the Army's next IT contract",
    semanticFit: 0.85,
  }),

  // ── Watch ─────────────────────────────────────────────────────────────
  seed({
    key: "ussocom-labor-for-seats",
    lane: "federal",
    oppKey: "da969baea3ac483be1aef46d0a99fabc",
    hgTitle: "\"Labor for Seats\" End-User Support, U.S. Special Operations Command (Follow-on)",
    hgText:
      "Help-desk and desktop techs placed with special operations units, after the option years end in September 2028. The last one was an 8(a) competition with 6 offers.",
    sourceId: "H92403-FY28-0012",
    postedDaysAgo: 30,
    expectedInDays: 640,
    agencyName: "U.S. Special Operations Command",
    agencyAbbr: "USSOCOM",
    naicsCode: "541519",
    pscCode: "DE01",
    oppType: "Recompete",
    setAsideCode: "8A",
    valLow: 5_000_000,
    valHigh: 6_000_000,
    popState: "NC",
    popCity: "Fort Bragg",
    sourceName: "Department of Defense",
    files: null,
    plainTitle: "End-user support seats for special operations units",
    semanticFit: 0.9,
  }),
  seed({
    key: "sjafb-base-telecom",
    lane: "federal",
    oppKey: "2d48fc758086a1f8354c77e9ea1324c8",
    hgTitle: "Base Telecommunications Systems Support, Seymour Johnson AFB (Follow-on IDIQ)",
    hgText:
      "Cable, phone and network repair orders across the base, after the current contract stops ordering on 31 January 2029. Set aside for small businesses; the last one drew 4 offers.",
    sourceId: "FA4809-FY29-0002",
    postedDaysAgo: 35,
    expectedInDays: 780,
    agencyName: "4th Contracting Squadron",
    agencyAbbr: "USAF",
    naicsCode: "541519",
    pscCode: "DG01",
    oppType: "Recompete",
    setAsideCode: "SBA",
    valLow: null,
    valHigh: null,
    popState: "NC",
    popCity: "Seymour Johnson AFB",
    sourceName: "Department of the Air Force",
    files: null,
    plainTitle: "Seymour Johnson's base telecom repairs, the next contract",
    semanticFit: 0.7,
  }),
];

/** How close a forecast's industry code is to Hector's own, 0 to 1. Null: no code. */
export function categoryFit(code: string | null, own: readonly string[]): number | null {
  if (!code) return null;
  if (own.includes(code)) return 1;
  if (/^5415/.test(code)) return 0.8;
  if (/^(5182|517)/.test(code)) return 0.6;
  if (/^(4234|238210)/.test(code)) return 0.35;
  return 0.05;
}

// ── Grant's words on the forecast pages ─────────────────────────────────

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

const seymour = findPastPerformance("pp-sjafb-desktop-support")!;
const seats = findPastPerformance("pp-bragg-helpdesk-seats")!;
const chromebooks = findPastPerformance("pp-ccs-chromebook-reimage")!;

/** The longer line on a list card, for the forecasts that matter to the story. */
export function cardLine(oppKey: string, r: ForecastRecordDto, when: string, biggest: number): string | null {
  switch (oppKey) {
    case FORECAST_KEYS.teamUp:
      return `The Army hospital's IT at Fort Bragg. Only STARS III holders can quote, and each year is about one and a half times your revenue: team up. ${KEY_PARTNER.name} wants your techs.${when}`;
    case FORECAST_KEYS.wosb:
      return `Pope's 43 CS IT support, now planned for 8(a) firms. It's your work, and the last two went to one firm without a competition. Answer the sources sought.${when}`;
    case FORECAST_KEYS.lost:
      return `XVIII Airborne Corps IT, the office that took a lower price on your Windows 11 quote. Only ITES-3S holders can quote it, so ask Larkspur Federal IT about a subcontract.${when}`;
    case FORECAST_KEYS.pastJob:
      return `Your Seymour Johnson desktop support, the follow-on. You're the incumbent, rated Very Good: send your CPARS with the quote.${when}`;
    case FORECAST_KEYS.logistics:
      return `Logistics systems support at ${money(r.valLow ?? 0)} to ${money(r.valHigh ?? 0)} over five years: ITES-3S holders only, and far above your ${money(biggest)} largest job.${when}`;
    case FORECAST_KEYS.lejeune:
      return `Camp Lejeune's base network, going to one 8(a) firm without a competition. Ask the winner for subcontract seats.${when}`;
    case FORECAST_KEYS.schoolWifi:
      return `School Wi-Fi under E-Rate. It's mostly equipment, and it needs an E-Rate provider number and a Wi-Fi maker's partner status.${when}`;
    case FORECAST_KEYS.ites4s:
      return `ITES-4S, the Army's next IT contract. Most Fort Bragg IT will be ordered through it. Decide this winter whether to bid as part of a team.${when}`;
    default:
      return null;
  }
}

/** Grant's chat answers that name Hector's own story. */
export const CHAT = {
  base: "office",
  teamUp: `Yes, I would team up. ${KEY_PARTNER.name} (${KEY_PARTNER.contact}, ${KEY_PARTNER.contactTitle}) wrote to you about the hospital's IT. They want ${KEY_PARTNER.seeking.charAt(0).toLowerCase()}${KEY_PARTNER.seeking.slice(1)}. Only STARS III holders can quote it, and they hold it. Agree on the number of techs and their pay before you sign. Open Partners to see their card.`,
  smallTeam: "You do not need a partner for the size of this one. A partner can still help if it starts in the same month as another job and your techs are booked.",
  mentor:
    "Sarah Mitchell can review this with you. Use “Review with a Mentor” on this page. She is reading your question about the Pope sources sought, so she knows your work.",
  past: `Your closest past work is ${seymour.projectTitle} (${money(seymour.totalValue)}, ${seymour.periodStart.slice(0, 4)}), rated Very Good. Your ${money(seats.totalValue)} of help-desk seats on Fort Bragg show Army work on post, and the ${chromebooks.customerName.replace(/, .*$/, "")} job shows imaging at scale.`,
};
