// THE AGENCY's award record: the Awards page, the Partners "Who's winning" strip,
// the Government Buyers panel and the company files (read through
// src/demo/explore/awardsData.ts, which picks the active member).
//
// Each award is modeled on a real federal award for advertising, marketing, design
// or video work in NC, SC or VA (sources below): the buyer, the work, the value,
// the set-aside and the number of offers come from the real record. Changed: the
// winner is a made-up company (D13), the award id is invented in the buyer's format
// (each id checked unused on USAspending, 19 Oct 2026), and most dates are counted
// from today so "Just awarded" stays true. Two awards keep their real dates because
// the story is built on them: the VA hiring campaign (ends 24 September 2027) and
// Dana's own NC Guard campaign (persona.ts).
//
// Sources (USAspending, pulled 19 Oct 2026):
//   VHA recruitment marketing   https://www.usaspending.gov/award/CONT_AWD_36C77623C0104_3600_-NONE-_-NONE-
//   VA "Same Day" promotion     https://www.usaspending.gov/award/CONT_AWD_36C24625P0814_3600_-NONE-_-NONE-
//   NC Guard recruiting website https://www.usaspending.gov/award/CONT_AWD_W9124225FA076_9700_GS07F0382X_4732
//   NC Guard visual design      https://www.usaspending.gov/award/CONT_AWD_W9124223P0066_9700_-NONE-_-NONE-
//   Durham VA video (2026)      https://www.usaspending.gov/award/CONT_AWD_36C24626P0898_3600_-NONE-_-NONE-
//   Durham VA video (2023)      https://www.usaspending.gov/award/CONT_AWD_36C24623P1780_3600_-NONE-_-NONE-
//   Norfolk Naval Shipyard      https://www.usaspending.gov/award/CONT_AWD_N4215820PS265_9700_-NONE-_-NONE-
//   Fort Bragg print and digital https://www.usaspending.gov/award/CONT_AWD_W9124719P1860_9700_-NONE-_-NONE-
//   NC DMV screen ads           https://www.usaspending.gov/award/CONT_AWD_W9124225PA042_9700_-NONE-_-NONE-
//   MARSOC geofencing           https://www.usaspending.gov/award/CONT_AWD_H9225720P0024_9700_-NONE-_-NONE-
//   MARSOC article series       https://www.usaspending.gov/award/CONT_AWD_H9225723P0036_9700_-NONE-_-NONE-
//   SC ANG recruiting           https://www.usaspending.gov/award/CONT_AWD_W50S9525PA007_9700_-NONE-_-NONE-
//   Fort Jackson graphics       https://www.usaspending.gov/award/CONT_AWD_W9124C21P0030_9700_-NONE-_-NONE-
//   USASOC short film           https://www.usaspending.gov/award/CONT_AWD_H9223922P0011_9700_-NONE-_-NONE-
//   MARSOC video and photo shoot https://www.usaspending.gov/award/CONT_AWD_H9225722F0107_9700_H9225720D0002_9700
//   MARSOC staff and advertising https://www.usaspending.gov/award/CONT_AWD_H9225726FE074_9700_H9240020D0039_9700
//   Camp Lejeune media monitoring https://www.usaspending.gov/award/CONT_AWD_M6700121P1196_9700_-NONE-_-NONE-
//   NC Guard digital recruiting (Dana's, modeled on) https://www.usaspending.gov/award/CONT_AWD_W9124221P0013_9700_-NONE-_-NONE-
//     and https://www.usaspending.gov/award/CONT_AWD_W912K625PA019_9700_-NONE-_-NONE-

import { findPastPerformance } from "../../../story/persona";
import { getOpportunity } from "../../../story/opportunities";
import type { AwardSeed } from "../../../explore/awardsData";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, MEMBER_FIRM } from "./firms";

/** The buyers. Government offices are real, so these names are real. */
export const AWARD_AGENCIES = {
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  uspfoNc: { name: "Department of the Army, USPFO for North Carolina (NC Army National Guard)", abbrev: "USPFO NC", isDefense: true },
  vaPcac: { name: "Department of Veterans Affairs, Program Contracting Activity Central", abbrev: "VA PCAC", isDefense: false },
  vaNco6: { name: "Department of Veterans Affairs, Network Contracting Office 6", abbrev: "VA NCO 6", isDefense: false },
  marsoc: { name: "U.S. Special Operations Command, Marine Forces Special Operations Command (Camp Lejeune)", abbrev: "MARSOC", isDefense: true },
  usasoc: { name: "U.S. Special Operations Command, U.S. Army Special Operations Command (Fort Bragg)", abbrev: "USASOC", isDefense: true },
  lejeune: { name: "Department of the Navy, Marine Corps Base Camp Lejeune", abbrev: "MCB Camp Lejeune", isDefense: true },
  uspfoSc: { name: "Department of the Air Force, USPFO for South Carolina (169th Fighter Wing)", abbrev: "USPFO SC", isDefense: true },
  fortJackson: { name: "Department of the Army, MICC Fort Jackson", abbrev: "MICC Fort Jackson", isDefense: true },
  norfolkShipyard: { name: "Department of the Navy, Norfolk Naval Shipyard", abbrev: "Norfolk Naval Shipyard", isDefense: true },
} as const;

export type AgencyAwardAgency = keyof typeof AWARD_AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AWARD_AGENCY_LABEL: Record<AgencyAwardAgency, string> = {
  braggMicc: "the Army contracting office at Fort Bragg",
  uspfoNc: "the NC National Guard",
  vaPcac: "the VA's national contracting office",
  vaNco6: "the VA contracting office for North Carolina and Virginia",
  marsoc: "Marine special operations at Camp Lejeune",
  usasoc: "Army special operations at Fort Bragg",
  lejeune: "Marine Corps Base Camp Lejeune",
  uspfoSc: "the South Carolina Air National Guard",
  fortJackson: "the Army at Fort Jackson",
  norfolkShipyard: "the Navy at Norfolk Naval Shipyard",
};

const FULL_OPEN = "Full and Open Competition";
const AFTER_EXCL = "Full and Open Competition after exclusion of sources";
const SIMPLIFIED = "Competed under simplified acquisition procedures";
const NOT_COMPETED = "Not Competed";
const SB_SETASIDE = "Small Business Set-Aside, total";
const SDVOSB_SETASIDE = "Service-Disabled Veteran-Owned Small Business Set-Aside";
const EIGHT_A_SOLE = "8(a) Sole Source";
const SB_PRIME = "Not required (small business prime)";

const BLUESTONE = KEY_PARTNER_FIRM.key;
const DANA = MEMBER_FIRM.key;
const ncng = findPastPerformance("pp-ncng-recruiting")!;

export const AWARD_SEEDS: AwardSeed<AgencyAwardAgency>[] = [
  // ── Bluestone Veteran Media Group (4001): the VA's national hiring campaign ──
  {
    id: "36C77623C0298",
    title: "VHA recruitment marketing and advertising campaign (national)",
    winner: BLUESTONE,
    agency: "vaPcac",
    obligated: 34_307_425,
    ceiling: 41_650_983,
    startedOn: "2023-09-25",
    endsOn: "2027-09-24",
    rebidIsOpen: true,
    city: "Alexandria",
    state: "VA",
    naics: "541613",
    workType: "Hiring campaigns for VA doctors, nurses and staff",
    psc: "R701",
    offers: 11,
    extent: AFTER_EXCL,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 9, repeat: 3, subs: [[4003, 2], [4007, 1], [4006, 1]] },
  },
  {
    id: "36C24625P2968",
    title: "Promotional materials for the \"Same Day\" access campaign, Durham VA Health Care System",
    winner: BLUESTONE,
    agency: "vaNco6",
    obligated: 22_045,
    ceiling: 49_655,
    startedDaysAgo: 584,
    endsInDays: 145,
    city: "Durham",
    state: "NC",
    naics: "541810",
    workType: "Printed and digital pieces for a public-affairs campaign",
    psc: "R701",
    offers: 1,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 9, repeat: 3, subs: [[4003, 2], [4007, 1], [4006, 1]] },
  },

  // ── Lantern Row Creative (4000): Dana's own NC Guard campaign ─────────────
  {
    id: "W91242-25-P-A118",
    title: "Digital recruiting campaign: NC Army National Guard",
    winner: DANA,
    agency: "uspfoNc",
    obligated: ncng.totalValue,
    currentValue: ncng.totalValue,
    ceiling: ncng.totalValue,
    startedOn: ncng.periodStart,
    city: "Raleigh",
    state: "NC",
    naics: "541810",
    workType: "Recruiting videos, geofenced ads and leads routed to recruiters",
    psc: "R701",
    offers: 4,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Hollowell Pike Communications (4002): NC Guard web and design ─────────
  {
    id: "W91242-25-F-A914",
    title: "Recruiting website design and upkeep, NC Army National Guard (GSA schedule order)",
    winner: 4002,
    agency: "uspfoNc",
    obligated: 103_010,
    ceiling: 319_974,
    startedDaysAgo: 417,
    endsInDays: 312,
    city: "Raleigh",
    state: "NC",
    naics: "541613",
    workType: "The Guard's recruiting website",
    psc: "R701",
    offers: 1,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 6, repeat: 2, subs: [[4005, 1], [4004, 1]] },
  },
  {
    id: "W91242-23-P-0071",
    title: "Visual design support for NC National Guard public affairs",
    winner: 4002,
    agency: "uspfoNc",
    obligated: 235_231,
    ceiling: 629_321,
    startedDaysAgo: 1115,
    endsInDays: 345,
    city: "Raleigh",
    state: "NC",
    naics: "541430",
    workType: "An on-site designer for the Guard's public affairs office",
    psc: "T001",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: { distinct: 6, repeat: 2, subs: [[4005, 1], [4004, 1]] },
  },

  // ── Kestrel Point Federal Marketing (4003): VA video and Navy recruiting ──
  {
    id: "36C24626P2971",
    title: "Patient-education and outreach video production, Durham VA Health Care System",
    winner: 4003,
    agency: "vaNco6",
    obligated: 200_000,
    ceiling: 800_000,
    startedDaysAgo: 54,
    endsInDays: 310,
    city: "Durham",
    state: "NC",
    naics: "512110",
    workType: "Short videos for patients and veterans",
    psc: "R701",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4007, 2]] },
  },
  {
    id: "36C24623P1792",
    title: "Educational video production, Durham VA Health Care System",
    winner: 4003,
    agency: "vaNco6",
    obligated: 250_050,
    ceiling: 390_050,
    startedDaysAgo: 1130,
    city: "Durham",
    state: "NC",
    naics: "512110",
    workType: "Educational videos for veterans",
    psc: "R701",
    offers: 1,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4007, 2]] },
  },
  {
    id: "N42158-20-P-S281",
    title: "Recruitment and marketing campaign, Norfolk Naval Shipyard",
    winner: 4003,
    agency: "norfolkShipyard",
    obligated: 638_300,
    startedDaysAgo: 2224,
    city: "Portsmouth",
    state: "VA",
    naics: "541613",
    workType: "Hiring campaign for shipyard trades",
    psc: "R701",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4007, 2]] },
  },

  // ── Sandhill Signal Media (4004): a local publisher with screens and an app ──
  {
    id: "W91247-19-P-1874",
    title: "Print and digital advertisements, Army Community Service, Fort Bragg",
    winner: 4004,
    agency: "braggMicc",
    obligated: 356_624,
    startedOn: "2019-09-30",
    city: "Fort Bragg",
    state: "NC",
    naics: "541810",
    workType: "Weekly print ads and digital ads for family programs",
    psc: "R701",
    offers: 5,
    extent: SIMPLIFIED,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },
  {
    id: "W91242-25-P-A931",
    title: "Recruiting ads on screens in NC DMV offices, NC Army National Guard",
    winner: 4004,
    agency: "uspfoNc",
    obligated: 143_169,
    ceiling: 367_974,
    startedDaysAgo: 409,
    endsInDays: 320,
    city: "Raleigh",
    state: "NC",
    naics: "541890",
    workType: "Video ads on the screens they own in DMV offices",
    psc: "R701",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },

  // ── Quillmark Creative (4005): the Fayetteville agency that beat Dana on price ──
  {
    id: "H92257-25-P-0041",
    title: "Geofencing and lead-generation recruiting campaign, MARSOC",
    winner: 4005,
    agency: "marsoc",
    obligated: 129_712,
    ceiling: 687_904,
    startedDaysAgo: 300,
    endsInDays: 65,
    city: "Camp Lejeune",
    state: "NC",
    naics: "541810",
    workType: "Location-based recruiting ads with lead forms",
    psc: "R701",
    offers: 7,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 1, repeat: 0, subs: [[4004, 1]] },
  },
  {
    id: "H92257-23-P-0391",
    title: "Article series and public relations support, MARSOC",
    winner: 4005,
    agency: "marsoc",
    obligated: 48_000,
    ceiling: 120_000,
    startedDaysAgo: 1319,
    endsInDays: 528,
    city: "Camp Lejeune",
    state: "NC",
    naics: "541820",
    workType: "Feature articles about the command",
    psc: "R708",
    offers: 7,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 1, repeat: 0, subs: [[4004, 1]] },
  },

  // ── Ironline Recruiting Media (4006): South Carolina Guard recruiting ──────
  {
    id: "W50S95-25-P-A917",
    title: "Recruiting marketing campaign, 169th Fighter Wing (SC Air National Guard)",
    winner: 4006,
    agency: "uspfoSc",
    obligated: 249_999,
    startedDaysAgo: 395,
    city: "Eastover",
    state: "SC",
    naics: "541810",
    workType: "A year of recruiting ads around Columbia",
    psc: "R701",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4007, 1]] },
  },
  {
    id: "W9124C-21-P-0917",
    title: "Graphics upgrade, U.S. Army Chaplain Center and School, Fort Jackson",
    winner: 4006,
    agency: "fortJackson",
    obligated: 247_463,
    startedDaysAgo: 1872,
    city: "Columbia",
    state: "SC",
    naics: "541430",
    workType: "Wall graphics and displays",
    psc: "T001",
    offers: 1,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4007, 1]] },
  },

  // ── Harbor Nine Productions (4007): video crews for special operations ────
  {
    id: "H92257-26-F-0021",
    title: "Video and photo shoot, MARSOC (order under an existing contract)",
    winner: 4007,
    agency: "marsoc",
    obligated: 95_750,
    startedDaysAgo: 62,
    city: "Jacksonville",
    state: "NC",
    naics: "512110",
    workType: "A shoot for recruiting video and photos",
    psc: "R701",
    offers: null,
    extent: null,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 4, repeat: 1, subs: [[4003, 1]] },
  },
  {
    id: "H92239-22-P-0391",
    title: "Short film for USASOC, Fort Bragg",
    winner: 4007,
    agency: "usasoc",
    obligated: 223_132,
    startedOn: "2022-08-10",
    city: "Fayetteville",
    state: "NC",
    naics: "512110",
    workType: "A short film about the command",
    psc: "R701",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: { distinct: 4, repeat: 1, subs: [[4003, 1]] },
  },

  // ── Companies that are not partners for Dana ─────────────────────────────
  {
    id: "H92257-25-F-E917",
    title: "Staff and advertising support, MARSOC (order under a multiple-award contract)",
    winner: 4101,
    agency: "marsoc",
    obligated: 2_359_322,
    ceiling: 4_757_830,
    startedDaysAgo: 440,
    endsInDays: 285,
    city: "Jacksonville",
    state: "NC",
    naics: "541613",
    workType: "Full-time marketing staff on site, plus ad buys",
    psc: "R701",
    offers: 4,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: "Plan on file",
    bench: null,
  },
  {
    id: "M67001-21-P-1997",
    title: "News and media monitoring, Marine Corps Base Camp Lejeune",
    winner: 4102,
    agency: "lejeune",
    obligated: 333_600,
    startedDaysAgo: 1853,
    city: "Camp Lejeune",
    state: "NC",
    naics: "541820",
    workType: "Daily news clips and media reports",
    psc: "R708",
    offers: 5,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: SB_PRIME,
    bench: null,
  },
];

/** Replies to the VA's sources sought, from the story's notice. */
function vaRepliesDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 21;
}

/** The line on an award whose next contract is already being asked about. */
export function openNowNote(awardId: string): string | undefined {
  if (awardId === "36C77623C0298") {
    return `The VA is asking which firms could run the next campaign. Replies are due in ${vaRepliesDays()} days, and it is expected to be set aside for service-disabled veteran-owned firms. Grant says to team up.`;
  }
  return undefined;
}

/** Awards the story saves on the Awards page: the VA hiring campaign and Dana's own. */
export const STORY_SAVED_AWARD_IDS = ["36C77623C0298", "W91242-25-P-A118"] as const;
