// THE IT SERVICES FIRM's award record: the Awards page, the Partners "Who's winning"
// strip, the Government Buyers panel and the company files (read through
// src/demo/explore/awardsData.ts, which picks the active member).
//
// Source: demo-storyboard/it-services-pack.md, section 13. Most awards are modeled on
// a real federal IT award with work at or near Fort Bragg (the model is named on each
// one): the buyer, the work, the value, the set-aside, the contract it was ordered
// through and the number of offers come from the real record. Changed: the winner is
// a made-up company (D13), the award id is invented in the buyer's format, and most
// dates are counted from today so "Just awarded" stays true. Kept: the end dates the
// pack names (the hospital order's 28 Feb 2027 option, the ITES-3S orders' ends),
// and Hector's own Seymour Johnson job (persona.ts).
// The Army hospital at Fort Bragg is never named: "Womack" is one of the caterer's
// own words. Brackwater's two Navy medical center orders and the small Pinecrest
// and Northfork jobs have no single model; they are written to fit the record.
//
// Models (USAspending):
//   USARC TAC/C4, 8(a) competed  https://www.usaspending.gov/award/CONT_AWD_W9124719C9000_9700_-NONE-_-NONE-
//   USARC knowledge mgmt (ITES)  https://www.usaspending.gov/award/CONT_AWD_W9124723F2461_9700_W52P1J18DA092_9700
//   XVIII ABC IT (ITES-3S)       https://www.usaspending.gov/award/CONT_AWD_W9124725FA066_9700_W52P1J18DA013_9700
//   Logistics systems (ITES-3S)  https://www.usaspending.gov/award/CONT_AWD_W9124722F0117_9700_W52P1J18DA122_9700
//   Other Fort Bragg ITES-3S     https://www.usaspending.gov/award/CONT_AWD_W9124723F2439_9700_W52P1J18DA087_9700
//   USARC GCSS-Army, 8(a) sole   https://www.usaspending.gov/award/CONT_AWD_W9124725CA004_9700_-NONE-_-NONE-
//   Pope 43 CS IT support        https://www.usaspending.gov/award/CONT_AWD_FA445223P0027_9700_-NONE-_-NONE-
//   Pope medical LAN (STARS III) https://www.usaspending.gov/award/CONT_AWD_FA445223F0078_9700_47QTCB21D0200_4732
//   Army hospital IT (STARS III) https://www.usaspending.gov/award/CONT_AWD_HT001524F0117_9700_47QTCB21D0173_4732
//   USSOCOM labor for seats      https://www.usaspending.gov/award/CONT_AWD_H9240323C0003_9700_-NONE-_-NONE-
//   Fort Bragg IT (IMCS IV)      https://www.usaspending.gov/award/CONT_AWD_W91RUS25FA046_9700_W91RUS23D0001_9700
//   Seymour Johnson telecom IDIQ https://www.usaspending.gov/award/CONT_IDV_FA480923D0006_9700
//   Conference-room upgrade      https://www.usaspending.gov/award/CONT_AWD_W912HQ23P0115_9700_-NONE-_-NONE-
//   MARSOC office rewire         https://www.usaspending.gov/award/CONT_AWD_H9225722P0067_9700_-NONE-_-NONE-

import { findPastPerformance } from "../../../story/persona";
import { getOpportunity } from "../../../story/opportunities";
import type { AwardSeed } from "../../../explore/awardsData";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, MEMBER_FIRM } from "./firms";

/** The buyers. Government offices are real, so these names are real. */
export const AWARD_AGENCIES = {
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  accApg: { name: "Department of the Army, Army Contracting Command, Aberdeen Proving Ground", abbrev: "ACC-APG", isDefense: true },
  usaceHecsa: { name: "Department of the Army, U.S. Army Corps of Engineers, Humphreys Engineer Center Support Activity", abbrev: "USACE HECSA", isDefense: true },
  dha: { name: "Defense Health Agency, Enterprise Medical Services Contracting Division", abbrev: "DHA", isDefense: true },
  pope: { name: "Department of the Air Force, 763rd Enterprise Sourcing Squadron (Pope Army Airfield)", abbrev: "763 ESS Pope", isDefense: true },
  seymour: { name: "Department of the Air Force, 4th Contracting Squadron (Seymour Johnson AFB)", abbrev: "4th CONS", isDefense: true },
  ussocom: { name: "U.S. Special Operations Command", abbrev: "USSOCOM", isDefense: true },
  marsoc: { name: "Department of the Navy, Marine Forces Special Operations Command", abbrev: "MARSOC", isDefense: true },
  ncGuard: { name: "Department of the Army, USPFO for North Carolina (NC National Guard)", abbrev: "USPFO NC", isDefense: true },
} as const;

export type AgencyAwardAgency = keyof typeof AWARD_AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AWARD_AGENCY_LABEL: Record<AgencyAwardAgency, string> = {
  braggMicc: "the Army contracting office at Fort Bragg",
  accApg: "the Army's network contracting office",
  usaceHecsa: "the Corps of Engineers' support office",
  dha: "the Defense Health Agency",
  pope: "Air Force contracting at Pope Army Airfield",
  seymour: "Air Force contracting at Seymour Johnson",
  ussocom: "Special Operations Command",
  marsoc: "the Marine special operations command at Camp Lejeune",
  ncGuard: "the NC National Guard",
};

const AFTER_EXCL = "Full and Open Competition after exclusion of sources";
const SIMPLIFIED = "Competed under simplified acquisition procedures";
const FAIR_OPPORTUNITY = "Subject to Multiple Award Fair Opportunity";
const NOT_COMPETED = "Not Competed";
const NOT_COMPETED_SIMPLIFIED = "Not competed under simplified acquisition procedures";
const SB_SETASIDE = "Small Business Set-Aside, total";
const EIGHT_A_COMPETED = "8(a) Competed";
const EIGHT_A_SOLE = "8(a) Sole Source";
const NO_SETASIDE = "No set-aside used";
const SB_PRIME = "Not required (small business prime)";
const PLAN_ON_FILE = "Subcontracting plan on file";

const BRACKWATER = KEY_PARTNER_FIRM.key;
const GALLBERRY = MEMBER_FIRM.key;
const seymour = findPastPerformance("pp-sjafb-desktop-support")!;

/** The Army hospital's IT services order: the job the DHA is asking about again. */
const HOSPITAL_IT = "HT001524F0193";

export const AWARD_SEEDS: AwardSeed<AgencyAwardAgency>[] = [
  // ── Brackwater Federal Solutions (4001): hospital IT at two Navy medical centers ──
  {
    id: "HT001525F0241",
    title: "Hospital IT services, Naval Medical Center Camp Lejeune (8(a) STARS III order)",
    winner: BRACKWATER,
    agency: "dha",
    obligated: 6_240_000,
    startedDaysAgo: 330,
    endsInDays: 400,
    city: "Camp Lejeune",
    state: "NC",
    naics: "541512",
    workType: "Service desk, deskside support and clinic network support for a Navy hospital",
    psc: "DE01",
    offers: 2,
    extent: FAIR_OPPORTUNITY,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4004, 1], [4003, 1]] },
  },
  {
    id: "HT001524F0306",
    title: "Hospital IT services, Naval Medical Center Portsmouth (8(a) STARS III order)",
    winner: BRACKWATER,
    agency: "dha",
    obligated: 11_820_000,
    startedDaysAgo: 610,
    endsInDays: 490,
    city: "Portsmouth",
    state: "VA",
    naics: "541512",
    workType: "Service desk, deskside techs and imaging across a hospital and its clinics",
    psc: "DE01",
    offers: 3,
    extent: FAIR_OPPORTUNITY,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4004, 1], [4003, 1]] },
  },

  // ── Gallberry Technology Group (4000): Hector's own Seymour Johnson job ──
  {
    id: "FA480924C0011",
    title: "Desktop support, 4th Communications Squadron, Seymour Johnson AFB",
    winner: GALLBERRY,
    agency: "seymour",
    obligated: seymour.totalValue,
    currentValue: seymour.totalValue,
    ceiling: seymour.totalValue,
    startedOn: seymour.periodStart,
    endsOn: seymour.periodEnd,
    city: "Seymour Johnson AFB",
    state: "NC",
    naics: "541513",
    workType: "Two on-site techs and an imaging surge for 1,100 Windows 11 laptops",
    psc: "DE02",
    offers: 5,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Larkspur Federal IT (4002): small-business ITES-3S orders at Fort Bragg ──
  {
    id: "W9124725FA102",
    title: "IT and information-sharing services, XVIII Airborne Corps (ITES-3S task order)",
    winner: 4002,
    agency: "braggMicc",
    obligated: 872_000,
    startedDaysAgo: 420,
    endsInDays: 210,
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "IT support and SharePoint sites for a corps headquarters, for ITES-3S holders only",
    psc: "DF01",
    offers: 12,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4003, 1]] },
  },
  {
    id: "W9124723F2517",
    title: "Knowledge management and SharePoint support, U.S. Army Reserve Command (ITES-3S task order)",
    winner: 4002,
    agency: "braggMicc",
    obligated: 510_000,
    startedOn: "2023-07-01",
    endsOn: "2025-06-30",
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "SharePoint and records support for the Army Reserve's headquarters, for ITES-3S holders only",
    psc: "DF01",
    offers: 4,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4003, 1]] },
  },

  // ── Northfork Cyber LLC (4003): security work for the NC Guard ──
  {
    id: "W9124226P0137",
    title: "Cybersecurity support and assessments, NC National Guard",
    winner: 4003,
    agency: "ncGuard",
    obligated: 286_400,
    startedDaysAgo: 60,
    endsInDays: 305,
    city: "Raleigh",
    state: "NC",
    naics: "541519",
    workType: "Security officer support, scans and fixes for the Guard's armories and offices",
    psc: "DJ01",
    offers: 4,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Pinecrest Signal Group (4004): cabling and audio-visual work ──
  {
    id: "W912HQ26P0094",
    title: "Conference-room video and audio upgrade, Fort Bragg",
    winner: 4004,
    agency: "usaceHecsa",
    obligated: 71_800,
    startedDaysAgo: 30,
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "New displays, cameras and wiring in two conference rooms; mostly equipment",
    psc: "N058",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "H9225726P0058",
    title: "Office IT rewire, MARSOC, Camp Lejeune",
    winner: 4004,
    agency: "marsoc",
    obligated: 43_900,
    startedDaysAgo: 140,
    city: "Camp Lejeune",
    state: "NC",
    naics: "541519",
    workType: "New network cable and switches for one office building",
    psc: "N058",
    offers: 5,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "FA480923D0011",
    title: "Base telecommunications systems support, Seymour Johnson AFB (IDIQ)",
    winner: 4004,
    agency: "seymour",
    obligated: 1_180_000,
    ceiling: 4_500_000,
    startedOn: "2023-02-01",
    endsOn: "2029-01-31",
    city: "Seymour Johnson AFB",
    state: "NC",
    naics: "541519",
    workType: "Cable, phone and network repair orders across the base",
    psc: "DG01",
    offers: 4,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Kettle Creek Technologies (4005): 8(a) work for the Army at Fort Bragg ──
  {
    id: "W9124724C9002",
    title: "TAC/C4 signal readiness support, U.S. Army Reserve Command G-6",
    winner: 4005,
    agency: "braggMicc",
    obligated: 10_100_000,
    startedDaysAgo: 700,
    endsInDays: 1120,
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Signal and network readiness support for the Army Reserve, a base year and four options",
    psc: "DG01",
    offers: 6,
    extent: AFTER_EXCL,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 0, subs: [[4004, 1]] },
  },
  {
    id: "W9124726P0388",
    solicitationId: "W91247-26-Q-0412",
    title: "Windows 11 upgrade surge, XVIII Airborne Corps G-6",
    winner: 4005,
    agency: "braggMicc",
    obligated: 165_540,
    startedDaysAgo: 50,
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Upgrade and re-image laptops across a corps headquarters; lowest price technically acceptable",
    psc: "DE02",
    offers: 5,
    extent: SIMPLIFIED,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "W9124725CA011",
    title: "GCSS-Army support, U.S. Army Reserve Command",
    winner: 4005,
    agency: "braggMicc",
    obligated: 2_170_000,
    startedDaysAgo: 210,
    endsOn: "2027-03-23",
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Help for Army Reserve units on the Army's supply and finance system, given to one 8(a) firm",
    psc: "DA01",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Ironweed Health IT (4006): the Army hospital's IT at Fort Bragg ──
  {
    id: HOSPITAL_IT,
    title: "IT services, the Army medical center at Fort Bragg (8(a) STARS III order)",
    winner: 4006,
    agency: "dha",
    obligated: 8_550_000,
    startedOn: "2024-08-26",
    endsOn: "2027-02-28",
    rebidIsOpen: true,
    city: "Fort Bragg",
    state: "NC",
    naics: "541512",
    workType: "Deskside support, the service desk and clinic network support for a hospital and its clinics",
    psc: "DE01",
    offers: 1,
    extent: FAIR_OPPORTUNITY,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: { distinct: 4, repeat: 1, subs: [[4004, 1]] },
  },

  // ── Sandy Ridge Technical Services (4007): Pope's 43 CS work ──
  {
    id: "FA445223P0031",
    title: "IT support services, 43rd Communications Squadron, Pope Army Airfield",
    winner: 4007,
    agency: "pope",
    obligated: 2_620_000,
    startedOn: "2023-09-29",
    endsOn: "2027-09-28",
    city: "Pope Army Airfield",
    state: "NC",
    naics: "541513",
    workType: "The squadron's help desk, network and phone support, given to one firm without a competition",
    psc: "DG01",
    offers: 1,
    extent: NOT_COMPETED_SIMPLIFIED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "FA445223F0082",
    title: "Medical network support, Pope Army Airfield (8(a) STARS III order)",
    winner: 4007,
    agency: "pope",
    obligated: 421_000,
    startedOn: "2023-06-01",
    endsOn: "2026-05-31",
    city: "Pope Army Airfield",
    state: "NC",
    naics: "541513",
    workType: "Network support for the airfield's clinic",
    psc: "DG01",
    offers: 1,
    extent: FAIR_OPPORTUNITY,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Granite Ledge Federal Systems (4101): large ITES-3S orders ──
  {
    id: "W9124722F0164",
    title: "Logistics systems field support, Fort Bragg (ITES-3S task order)",
    winner: 4101,
    agency: "braggMicc",
    obligated: 19_130_000,
    startedOn: "2021-11-30",
    endsOn: "2026-11-29",
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Field techs for the Army's logistics systems across the base",
    psc: "DD01",
    offers: 6,
    extent: FAIR_OPPORTUNITY,
    setAside: NO_SETASIDE,
    subPlan: PLAN_ON_FILE,
    bench: { distinct: 6, repeat: 2, subs: [[4002, 1], [4003, 1]] },
  },
  {
    id: "W9124723F2488",
    title: "FCCS support services, Fort Bragg (ITES-3S task order)",
    winner: 4101,
    agency: "braggMicc",
    obligated: 8_500_000,
    startedOn: "2023-02-01",
    endsOn: "2027-01-31",
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Network and communications support for units on the base",
    psc: "DG01",
    offers: 4,
    extent: FAIR_OPPORTUNITY,
    setAside: NO_SETASIDE,
    subPlan: PLAN_ON_FILE,
    bench: { distinct: 6, repeat: 2, subs: [[4002, 1], [4003, 1]] },
  },
  {
    id: "W9124722F0233",
    title: "Cybersecurity support, U.S. Army Reserve Command (ITES-3S task order)",
    winner: 4101,
    agency: "braggMicc",
    obligated: 10_400_000,
    startedOn: "2022-07-13",
    endsOn: "2027-07-12",
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Security officers and network defense for the Army Reserve",
    psc: "DJ01",
    offers: 5,
    extent: FAIR_OPPORTUNITY,
    setAside: NO_SETASIDE,
    subPlan: PLAN_ON_FILE,
    bench: { distinct: 6, repeat: 2, subs: [[4003, 2]] },
  },

  // ── Fallow Point Technologies (4102): end-user seats and the base network center ──
  {
    id: "H9240324C0011",
    title: "\"Labor for seats\" end-user support, U.S. Special Operations Command",
    winner: 4102,
    agency: "ussocom",
    obligated: 5_600_000,
    startedDaysAgo: 760,
    endsOn: "2028-09-30",
    city: "Fort Bragg",
    state: "NC",
    naics: "541519",
    workType: "Help-desk and desktop techs placed with special operations units",
    psc: "DE01",
    offers: 6,
    extent: AFTER_EXCL,
    setAside: EIGHT_A_COMPETED,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "W91RUS25FA061",
    title: "Fort Bragg IT services, the network enterprise center (IMCS IV task order)",
    winner: 4102,
    agency: "accApg",
    obligated: 6_940_000,
    startedDaysAgo: 380,
    endsInDays: 1400,
    city: "Fort Bragg",
    state: "NC",
    naics: "541513",
    workType: "Running the base network and its service desk, for IMCS IV holders only",
    psc: "DG01",
    offers: 15,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
];

/** Answers to the DHA's request for information, from the story's notice. */
function rfiDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 14;
}

/** The line on an award whose next job is already being asked about. */
export function openNowNote(awardId: string): string | undefined {
  if (awardId === HOSPITAL_IT) {
    return `The DHA is asking which firms could do the next one. Answers are due in ${rfiDays()} days, and it is expected to be ordered through 8(a) STARS III. Grant says to team up.`;
  }
  return undefined;
}

/** Awards the story saves on the Awards page: the Army hospital's IT and his Seymour Johnson job. */
export const STORY_SAVED_AWARD_IDS = [HOSPITAL_IT, "FA480924C0011"] as const;
