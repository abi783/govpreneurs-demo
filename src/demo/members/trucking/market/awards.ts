// THE TRUCKING COMPANY's award record: the Awards page, the Partners "Who's winning"
// strip, the Government Buyers panel and the company files (read through
// src/demo/explore/awardsData.ts, which picks the active member).
//
// Source: demo-storyboard/trucking-pack.md, section 13. Each award is modeled on a
// real federal trucking or courier award near Fort Bragg (the model is named on
// each one): the buyer, the work, the value and the number of offers come from the
// real record. Changed: the winner is a made-up company (D13), the award id is
// invented in the buyer's format (the pack's ids were checked unused on USAspending,
// 19 Oct 2026), and most dates are counted from today so "Just awarded" stays true.
// Three are the story's own, not modeled on one record: the chilled routes'
// 2026 follow-on (about 7% under Tanya's $1.35M, workspace.ts), the Durham pharmacy
// courier (value estimated) and Tanya's own Fort Bragg job (persona.ts).
//
// Models (USAspending):
//   VA chilled routes, 8 sites    https://www.usaspending.gov/award/CONT_AWD_36C24622P0006_3600_-NONE-_-NONE-
//   VA Garner instruments         https://www.usaspending.gov/award/CONT_AWD_36C24625P1002_3600_-NONE-_-NONE-
//   VA Durham lab courier         https://www.usaspending.gov/award/CONT_AWD_36C24626P0035_3600_-NONE-_-NONE-
//   VA pharmacy courier           https://www.usaspending.gov/award/CONT_AWD_36C24626P0691_3600_-NONE-_-NONE-
//   Camp Lejeune trailers         https://www.usaspending.gov/award/CONT_AWD_M6700122P1144_9700_-NONE-_-NONE-
//   Fort Bragg trailer removal    https://www.usaspending.gov/award/CONT_AWD_W9124726PA027_9700_-NONE-_-NONE-
//   Fort Bragg barracks furniture https://www.usaspending.gov/award/CONT_AWD_W9124721P9054_9700_-NONE-_-NONE-
//   Mattamuskeet gravel           https://www.usaspending.gov/award/CONT_AWD_140FS325P0239_1448_-NONE-_-NONE-
//   Army hospital lab courier     https://www.usaspending.gov/award/CONT_AWD_W91YTZ25FA071_9700_W91YTZ23A0004_9700
//   Commissary grocery delivery   https://www.usaspending.gov/award/CONT_IDV_HQC00226DE001_9700
//   Fort Bragg EAGLE task order   https://www.usaspending.gov/award/CONT_AWD_0001_9700_W52P1J13G0027_9700
//   USACE dredge trucking         https://www.usaspending.gov/award/CONT_AWD_W912PM24P0017_9700_-NONE-_-NONE-

import { findPastPerformance } from "../../../story/persona";
import { getOpportunity } from "../../../story/opportunities";
import type { AwardSeed } from "../../../explore/awardsData";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, MEMBER_FIRM } from "./firms";

/** The buyers. Government offices are real, so these names are real. */
export const AWARD_AGENCIES = {
  vaNco6: { name: "Department of Veterans Affairs, Network Contracting Office 6", abbrev: "VA NCO 6", isDefense: false },
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  accRi: { name: "Department of the Army, Army Contracting Command – Rock Island", abbrev: "ACC-RI", isDefense: true },
  lejeune: { name: "Department of the Navy, Marine Corps Base Camp Lejeune", abbrev: "MCB Camp Lejeune", isDefense: true },
  mrcoEast: { name: "Department of the Army, Medical Readiness Contracting Office – East", abbrev: "MRCO East", isDefense: true },
  usaceWilmington: { name: "Department of the Army, U.S. Army Corps of Engineers, Wilmington District", abbrev: "USACE Wilmington", isDefense: true },
  fws: { name: "Department of the Interior, U.S. Fish and Wildlife Service", abbrev: "FWS", isDefense: false },
  deca: { name: "Department of Defense, Defense Commissary Agency", abbrev: "DeCA", isDefense: true },
} as const;

export type AgencyAwardAgency = keyof typeof AWARD_AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AWARD_AGENCY_LABEL: Record<AgencyAwardAgency, string> = {
  vaNco6: "the VA contracting office for North Carolina and Virginia",
  braggMicc: "the Army contracting office at Fort Bragg",
  accRi: "the Army's Rock Island contracting command",
  lejeune: "Marine Corps Base Camp Lejeune",
  mrcoEast: "the Army's medical contracting office for the East",
  usaceWilmington: "the Corps of Engineers' Wilmington District",
  fws: "the U.S. Fish and Wildlife Service",
  deca: "the Defense Commissary Agency",
};

const FULL_OPEN = "Full and Open Competition";
const SIMPLIFIED = "Competed under simplified acquisition procedures";
const SB_SETASIDE = "Small Business Set-Aside, total";
const SDVOSB_SETASIDE = "Service-Disabled Veteran-Owned Small Business Set-Aside";
const SB_PRIME = "Not required (small business prime)";

const BRIGHTWATER = KEY_PARTNER_FIRM.key;
const ROCKFISH = MEMBER_FIRM.key;
const bragg = findPastPerformance("pp-bragg-trailer-hauling")!;

/** Fort Bragg's logistics task order: the job the Army is writing again (the team-up). */
const BRAGG_LOGISTICS = "W52P1J13G0083";
/** Camp Lejeune's on-call trailer transport: ended, and the rebid is open now. */
const LEJEUNE_TRAILERS = "M6700122P1187";
/** The Durham VA's pharmacy courier: the rebid is open now. */
const DURHAM_PHARMACY = "36C24626P1958";

export const AWARD_SEEDS: AwardSeed<AgencyAwardAgency>[] = [
  // ── Brightwater Sustainment Group (4001): Fort Bragg's logistics contract ──
  {
    id: BRAGG_LOGISTICS,
    title: "Logistics Readiness Center maintenance, supply and transportation, Fort Bragg (EAGLE task order 0001)",
    winner: BRIGHTWATER,
    agency: "accRi",
    obligated: 605_990_330,
    startedOn: "2016-02-19",
    endsInDays: 254,
    rebidIsOpen: true,
    city: "Fort Bragg",
    state: "NC",
    naics: "561210",
    workType: "Running the base's motor pools, supply warehouses and transportation division",
    psc: "R706",
    offers: 19,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: "Subcontracting plan required (large business prime)",
    bench: { distinct: 9, repeat: 3, subs: [[4003, 1], [4005, 2]] },
  },

  // ── Rockfish Run Freight (4000): Tanya's own Fort Bragg job ──────────────
  {
    id: "W9124725PA044",
    title: "On-call trailer and container hauling, 18th Airborne Corps, Fort Bragg",
    winner: ROCKFISH,
    agency: "braggMicc",
    obligated: bragg.totalValue,
    currentValue: bragg.totalValue,
    ceiling: bragg.totalValue,
    startedOn: bragg.periodStart,
    endsOn: bragg.periodEnd,
    city: "Fort Bragg",
    state: "NC",
    naics: "484220",
    workType: "46 on-call moves of office trailers, containers and generators in 12 months",
    psc: "V129",
    offers: 4,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Tallow Creek Carriers (4002): VA courier and instrument runs ─────────
  {
    id: "36C24625P1016",
    title: "Sterile instrument transport, Garner VA clinic",
    winner: 4002,
    agency: "vaNco6",
    obligated: 154_899,
    startedDaysAgo: 490,
    endsInDays: 238,
    city: "Garner",
    state: "NC",
    naics: "492110",
    workType: "Daily runs of sealed instrument cases between the clinic and the Durham VA",
    psc: "V112",
    offers: null,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },
  {
    id: "36C24626P1893",
    title: "Lab specimen courier, Durham VA Medical Center",
    winner: 4002,
    agency: "vaNco6",
    obligated: 251_916,
    startedDaysAgo: 383,
    endsInDays: 270,
    city: "Durham",
    state: "NC",
    naics: "492110",
    workType: "Scheduled and rush specimen runs between the hospital and its clinics",
    psc: "V112",
    offers: null,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },
  {
    id: DURHAM_PHARMACY,
    title: "Emergency pharmacy courier, Durham VA Medical Center",
    winner: 4002,
    agency: "vaNco6",
    obligated: 96_300,
    startedDaysAgo: 335,
    endsInDays: 30,
    rebidIsOpen: true,
    city: "Durham",
    state: "NC",
    naics: "492110",
    workType: "Rush prescription runs to veterans' homes and clinics, day and night",
    psc: "V112",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },

  // ── Bellamy Point Logistics (4003): Camp Lejeune and the Wilmington District ──
  {
    id: LEJEUNE_TRAILERS,
    title: "On-call trailer transport, Marine Corps Base Camp Lejeune",
    winner: 4003,
    agency: "lejeune",
    obligated: 164_400,
    startedOn: "2022-09-26",
    endsOn: "2026-09-25",
    rebidIsOpen: true,
    city: "Camp Lejeune",
    state: "NC",
    naics: "484220",
    workType: "On-call moves of office and storage trailers around the base, over four years",
    psc: "V129",
    offers: 5,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },
  {
    id: "W912PM26P0071",
    title: "Truck transport of dredge parts, Wilmington District",
    winner: 4003,
    agency: "usaceWilmington",
    obligated: 14_700,
    startedDaysAgo: 45,
    city: "Wilmington",
    state: "NC",
    naics: "484121",
    workType: "One heavy load from a supplier's yard to the district's dredge, with permits",
    psc: "V129",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Quinlan Reefer Lines (4004): the VA's chilled freight routes ─────────
  {
    id: "36C24622P0031",
    title: "Chilled freight routes, Hampton VA to eight VISN 6 sites (2021–2026)",
    winner: 4004,
    agency: "vaNco6",
    obligated: 1_481_323,
    startedOn: "2021-10-01",
    endsOn: "2026-09-30",
    city: "Hampton",
    state: "VA",
    naics: "484220",
    workType: "Weekly refrigerated routes from Hampton to Fayetteville and seven other VA sites",
    psc: "V113",
    offers: 2,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "36C24627P0019",
    title: "Chilled freight routes, Hampton VA to eight VISN 6 sites",
    winner: 4004,
    agency: "vaNco6",
    obligated: 1_262_040,
    startedDaysAgo: 18,
    endsInDays: 1_808,
    city: "Hampton",
    state: "VA",
    naics: "484220",
    workType: "The same routes for five more years; your quote was about 7% higher",
    psc: "V113",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Kelso Gap Hauling (4005): Fort Bragg's trailer removals ──────────────
  {
    id: "W9124726PA052",
    title: "Trailer removal, 18th Airborne Corps, Fort Bragg",
    winner: 4005,
    agency: "braggMicc",
    obligated: 7_200,
    startedDaysAgo: 180,
    city: "Fort Bragg",
    state: "NC",
    naics: "484220",
    workType: "Hauling four modular office trailers off post",
    psc: "V129",
    offers: 5,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Gray Heron Freight (4006): refuge gravel ─────────────────────────────
  {
    id: "140FS325P0688",
    title: "Gravel delivered to Mattamuskeet National Wildlife Refuge",
    winner: 4006,
    agency: "fws",
    obligated: 259_850,
    startedOn: "2025-09-22",
    endsOn: "2026-09-30",
    rebidIsOpen: true,
    city: "Swan Quarter",
    state: "NC",
    naics: "484220",
    workType: "Gravel for the refuge roads, priced by the ton delivered",
    psc: "V129",
    offers: null,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Other winners, not partners ──────────────────────────────────────────
  {
    id: "W91YTZ25FA391",
    title: "Lab specimen courier, Army Medical Center, Fort Bragg (order under a courier BPA)",
    winner: 4101,
    agency: "mrcoEast",
    obligated: 128_023,
    startedDaysAgo: 140,
    endsInDays: 224,
    city: "Fort Bragg",
    state: "NC",
    naics: "492110",
    workType: "Specimen pickups twice a day from clinics on post, plus rush calls",
    psc: "V112",
    offers: null,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "HQC00226DE004",
    title: "Commissary grocery delivery, 16 stores nationwide (first order)",
    winner: 4102,
    agency: "deca",
    obligated: 122_928,
    startedDaysAgo: 250,
    city: "Fort Bragg",
    state: "NC",
    naics: "484121",
    workType: "Truckloads of grocery stock to 16 commissaries, both Fort Bragg stores among them",
    psc: "V113",
    offers: 26,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "W9124721P9617",
    title: "Barracks furniture removal, Fort Bragg",
    winner: 4103,
    agency: "braggMicc",
    obligated: 24_782,
    startedOn: "2021-04-12",
    endsOn: "2021-05-28",
    city: "Fort Bragg",
    state: "NC",
    naics: "484210",
    workType: "Moving old furniture out of barracks during the spring move season",
    psc: "V129",
    offers: 8,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
];

function daysToReply(id: string, fallback: number): number {
  return getOpportunity(id)?.closesInDays ?? fallback;
}

/** The line on an award whose next job is already open for bids. */
export function openNowNote(awardId: string): string | undefined {
  if (awardId === BRAGG_LOGISTICS) {
    return `The Army has posted a draft of the next contract. Comments are due in ${daysToReply(HERO_IDS.teamUp, 28)} days, and only holders of its EAGLE agreement can bid. Grant says to team up.`;
  }
  if (awardId === LEJEUNE_TRAILERS) {
    return `The base is taking quotes for the next one now. Quotes are due in ${daysToReply("M6700127Q0058", 16)} days.`;
  }
  if (awardId === DURHAM_PHARMACY) {
    return `The VA is taking quotes for the next one now. Quotes are due in ${daysToReply("36C24627Q0113", 24)} days.`;
  }
  if (awardId === "140FS325P0688") {
    return `The refuge is taking quotes for next year's gravel now. Quotes are due in ${daysToReply("140FS327Q0021", 15)} days.`;
  }
  return undefined;
}

/** Awards the story saves on the Awards page: Fort Bragg's logistics contract and her own job. */
export const STORY_SAVED_AWARD_IDS = [BRAGG_LOGISTICS, "W9124725PA044"] as const;
