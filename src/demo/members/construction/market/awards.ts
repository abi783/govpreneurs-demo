// THE CONTRACTOR's award record: the Awards page, the Partners "Who's winning" strip,
// the Government Buyers panel and the company files (read through
// src/demo/explore/awardsData.ts, which picks the active member).
//
// Source: demo-storyboard/construction-pack.md, section 13. Each award is modeled on
// a real federal construction award with work at or near Fort Bragg (the model is
// named on each one): the buyer, the work, the value, the set-aside and the number
// of offers come from the real record. Changed: the winner is a made-up company
// (D13), the award id is invented in the buyer's format (the pack's ids were checked
// unused on USAspending, 19 Oct 2026; the two VA service orders' ids were not), and
// most dates are counted from today so "Just awarded" stays true. Two awards keep
// their real dates: the VA's 3rd-floor fan coils (the team-up's predecessor) and
// Derrick's own Pope job (persona.ts).
//
// Models (USAspending):
//   Barracks HVAC task order      https://www.usaspending.gov/award/CONT_AWD_W9124724F0488_9700_W9124723D9010_9700
//   HUBZone SOF HVAC, 9 offers    https://www.usaspending.gov/award/CONT_AWD_W912PM21C0014_9700_-NONE-_-NONE-
//   8(a) barracks HVAC            https://www.usaspending.gov/award/CONT_AWD_W9124725CA074_9700_-NONE-_-NONE-
//   USACE Savannah barracks       https://www.usaspending.gov/award/CONT_AWD_W912HN22C4007_9700_-NONE-_-NONE-
//   VA auxiliary chiller          https://www.usaspending.gov/award/CONT_AWD_36C24626C0024_3600_-NONE-_-NONE-
//   VA fan coils, 3rd floor       https://www.usaspending.gov/award/CONT_AWD_36C24623C0027_3600_-NONE-_-NONE-
//   VA health-record wiring       https://www.usaspending.gov/award/CONT_AWD_36C77626C0042_3600_-NONE-_-NONE-
//   VA breaker testing            https://www.usaspending.gov/award/CONT_AWD_36C24626P0998_3600_-NONE-_-NONE-
//   VA boiler plant services      https://www.usaspending.gov/award/CONT_AWD_36C24624P1848_3600_-NONE-_-NONE-
//   Pope electrical repair        https://www.usaspending.gov/award/CONT_AWD_FA445225P0042_9700_-NONE-_-NONE-
//   Pope B771 renovation (his)    https://www.usaspending.gov/award/CONT_AWD_FA445224C0007_9700_-NONE-_-NONE-
//   FAA HVAC                      https://www.usaspending.gov/award/CONT_AWD_6973GH21C00079_6920_-NONE-_-NONE-
//   Minor MATOC order             https://www.usaspending.gov/award/CONT_AWD_W9124725FA086_9700_W9124723D9007_9700

import { findPastPerformance } from "../../../story/persona";
import { getOpportunity } from "../../../story/opportunities";
import type { AwardSeed } from "../../../explore/awardsData";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, MEMBER_FIRM } from "./firms";

/** The buyers. Government offices are real, so these names are real. */
export const AWARD_AGENCIES = {
  usaceWilmington: { name: "Department of the Army, U.S. Army Corps of Engineers, Wilmington District", abbrev: "USACE Wilmington", isDefense: true },
  usaceSavannah: { name: "Department of the Army, U.S. Army Corps of Engineers, Savannah District", abbrev: "USACE Savannah", isDefense: true },
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  pope: { name: "Department of the Air Force, 763rd Enterprise Sourcing Squadron (Pope Army Airfield)", abbrev: "763 ESS Pope", isDefense: true },
  vaNco6: { name: "Department of Veterans Affairs, Network Contracting Office 6", abbrev: "VA NCO 6", isDefense: false },
  vaPcac: { name: "Department of Veterans Affairs, Program Contracting Activity Central", abbrev: "VA PCAC", isDefense: false },
  faa: { name: "Department of Transportation, Federal Aviation Administration", abbrev: "FAA", isDefense: false },
} as const;

export type AgencyAwardAgency = keyof typeof AWARD_AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AWARD_AGENCY_LABEL: Record<AgencyAwardAgency, string> = {
  usaceWilmington: "the Corps of Engineers' Wilmington District",
  usaceSavannah: "the Corps of Engineers' Savannah District",
  braggMicc: "the Army contracting office at Fort Bragg",
  pope: "Air Force contracting at Pope Army Airfield",
  vaNco6: "the VA contracting office for North Carolina and Virginia",
  vaPcac: "the VA's national contracting office",
  faa: "the Federal Aviation Administration",
};

const FULL_OPEN = "Full and Open Competition";
const AFTER_EXCL = "Full and Open Competition after exclusion of sources";
const SIMPLIFIED = "Competed under simplified acquisition procedures";
const FAIR_OPPORTUNITY = "Subject to Multiple Award Fair Opportunity";
const NOT_COMPETED = "Not Competed";
const SB_SETASIDE = "Small Business Set-Aside, total";
const HUBZONE_SETASIDE = "HUBZone Set-Aside";
const SDVOSB_SETASIDE = "Service-Disabled Veteran-Owned Small Business Set-Aside";
const EIGHT_A_SOLE = "8(a) Sole Source";
const SB_PRIME = "Not required (small business prime)";

const BLACKJACK = KEY_PARTNER_FIRM.key;
const NINEBARK = MEMBER_FIRM.key;
const pope = findPastPerformance("pp-pope-office-hvac")!;

/** The VA's 3rd-floor fan coils: the job the VA is asking about again for floors 2 and 4. */
const FAN_COILS_3RD_FLOOR = "36C24623C0189";

export const AWARD_SEEDS: AwardSeed<AgencyAwardAgency>[] = [
  // ── Blackjack Oak Federal Builders (4001): the Fayetteville VA's wiring job ──
  {
    id: "36C77626C0311",
    title: "Health-record infrastructure upgrades, Fayetteville VA Medical Center",
    winner: BLACKJACK,
    agency: "vaPcac",
    obligated: 21_588_052,
    startedDaysAgo: 150,
    endsInDays: 420,
    city: "Fayetteville",
    state: "NC",
    naics: "236220",
    workType: "New wiring, telecom rooms and power for the VA's new health-record system",
    psc: "Z2DA",
    offers: 6,
    extent: AFTER_EXCL,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 7, repeat: 2, subs: [[4003, 1], [4004, 1]] },
  },

  // ── Ninebark Builders (4000): Derrick's own Pope job ─────────────────────
  {
    id: "FA445225C0019",
    title: "HVAC and electrical repair, office building, Pope Army Airfield",
    winner: NINEBARK,
    agency: "pope",
    obligated: pope.totalValue,
    currentValue: pope.totalValue,
    ceiling: pope.totalValue,
    startedOn: pope.periodStart,
    endsOn: pope.periodEnd,
    city: "Pope Army Airfield",
    state: "NC",
    naics: "238220",
    workType: "Six heat pumps, a new 400A panel and controls in an office building",
    psc: "Z2AA",
    offers: 5,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Turnrow Federal (4002): Vertical Construction MATOC task orders ──────
  {
    id: "W9124726F0412",
    title: "Barracks HVAC repair, Fort Bragg (task order under the Vertical Construction MATOC)",
    winner: 4002,
    agency: "braggMicc",
    obligated: 2_273_756,
    startedDaysAgo: 70,
    endsInDays: 260,
    city: "Fort Bragg",
    state: "NC",
    naics: "236220",
    workType: "New air handlers, piping and controls in an occupied barracks",
    psc: "Z2JZ",
    offers: 5,
    extent: FAIR_OPPORTUNITY,
    setAside: HUBZONE_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 6, repeat: 2, subs: [[4000, 1], [4003, 1]] },
  },

  // ── Pocosin Mechanical (4003): HUBZone HVAC work ─────────────────────────
  {
    id: "W912PM26C0017",
    title: "HVAC replacement, Special Operations building, Fort Bragg",
    winner: 4003,
    agency: "usaceWilmington",
    obligated: 1_098_843,
    startedDaysAgo: 230,
    city: "Fort Bragg",
    state: "NC",
    naics: "238220",
    workType: "A sealed bid: air handlers, a chiller and controls in an occupied building",
    psc: "Z2AA",
    offers: 9,
    extent: AFTER_EXCL,
    setAside: HUBZONE_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4004, 1]] },
  },
  {
    id: "6973GH24C00187",
    title: "HVAC upgrade, FAA radar site, Raeford",
    winner: 4003,
    agency: "faa",
    obligated: 215_808,
    startedDaysAgo: 760,
    city: "Raeford",
    state: "NC",
    naics: "238220",
    workType: "New HVAC for a radar equipment building, kept cool during the switch",
    psc: "Z2AZ",
    offers: 16,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4004, 1]] },
  },
  {
    id: "W9124726FA233",
    title: "Exit signs and emergency lights, Fort Bragg (order under the Minor Construction MATOC)",
    winner: 4003,
    agency: "braggMicc",
    obligated: 23_000,
    startedDaysAgo: 30,
    city: "Fort Bragg",
    state: "NC",
    naics: "238210",
    workType: "A small electrical order for MATOC holders only",
    psc: "Z2JZ",
    offers: 3,
    extent: FAIR_OPPORTUNITY,
    setAside: HUBZONE_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Wirefield Constructors (4004): 8(a) work at Fort Bragg and Pope ──────
  {
    id: "W9124726CA019",
    title: "Barracks and HVAC repair, Fort Bragg",
    winner: 4004,
    agency: "braggMicc",
    obligated: 3_951_352,
    startedDaysAgo: 160,
    endsInDays: 200,
    city: "Fort Bragg",
    state: "NC",
    naics: "236220",
    workType: "Barracks repairs and new HVAC, given to one 8(a) firm without a competition",
    psc: "Z2JZ",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: { distinct: 4, repeat: 1, subs: [[4003, 1]] },
  },
  {
    id: "FA445225P0057",
    title: "Electrical and bathroom repair, Pope Army Airfield",
    winner: 4004,
    agency: "pope",
    obligated: 63_863,
    startedDaysAgo: 480,
    city: "Pope Army Airfield",
    state: "NC",
    naics: "236220",
    workType: "A small repair job: new circuits and a restroom",
    psc: "Z2AA",
    offers: 6,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 4, repeat: 1, subs: [[4003, 1]] },
  },

  // ── Galeway Veteran Builders (4005): Fayetteville VA mechanical work ─────
  {
    id: FAN_COILS_3RD_FLOOR,
    title: "Replace fan coil units, Building 1, 3rd floor, Fayetteville VA Medical Center",
    winner: 4005,
    agency: "vaNco6",
    obligated: 3_002_879,
    startedOn: "2023-06-26",
    endsOn: "2025-07-31",
    rebidIsOpen: true,
    city: "Fayetteville",
    state: "NC",
    naics: "236220",
    workType: "Fan coils, piping and power on one floor of an open hospital",
    psc: "Z2DA",
    offers: 2,
    extent: AFTER_EXCL,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4003, 2]] },
  },
  {
    id: "36C24626C0093",
    title: "Replace auxiliary chiller, Fayetteville VA Medical Center",
    winner: 4005,
    agency: "vaNco6",
    obligated: 682_942,
    startedDaysAgo: 120,
    city: "Fayetteville",
    state: "NC",
    naics: "238220",
    workType: "A sealed bid for one chiller and its pumps",
    psc: "Z2DA",
    offers: 4,
    extent: AFTER_EXCL,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4003, 2]] },
  },
  {
    id: "36C24626P1043",
    title: "Electrical breaker testing, stage 2, Fayetteville VA Medical Center",
    winner: 4005,
    agency: "vaNco6",
    obligated: 318_400,
    startedDaysAgo: 330,
    endsInDays: 315,
    city: "Fayetteville",
    state: "NC",
    naics: "238210",
    workType: "Testing and servicing the hospital's breakers, one building at a time",
    psc: "J059",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4003, 2]] },
  },
  {
    id: "36C24624P1907",
    title: "Boiler plant services, Fayetteville VA Medical Center",
    winner: 4005,
    agency: "vaNco6",
    obligated: 176_500,
    startedDaysAgo: 760,
    endsInDays: 335,
    city: "Fayetteville",
    state: "NC",
    naics: "238220",
    workType: "Service and repair of the hospital's boiler plant",
    psc: "J045",
    offers: 2,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4003, 2]] },
  },

  // ── Ironsprings Federal Constructors (4006): USACE Savannah's barracks ───
  {
    id: "W912HN25C3011",
    title: "Barracks repair, Fort Bragg",
    winner: 4006,
    agency: "usaceSavannah",
    obligated: 24_149_862,
    startedDaysAgo: 400,
    endsInDays: 240,
    city: "Fort Bragg",
    state: "NC",
    naics: "236220",
    workType: "A whole-barracks repair, with the electrical and HVAC work subcontracted",
    psc: "Z2JZ",
    offers: 5,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 8, repeat: 2, subs: [[4003, 1], [4002, 1]] },
  },
];

/** Replies to the VA's sources sought, from the story's notice. */
function vaRepliesDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 14;
}

/** The line on an award whose next job is already being asked about. */
export function openNowNote(awardId: string): string | undefined {
  if (awardId === FAN_COILS_3RD_FLOOR) {
    return `The VA is asking which firms could do floors 2 and 4 next. Replies are due in ${vaRepliesDays()} days, and it is expected to be set aside for service-disabled veteran-owned firms. Grant says to team up.`;
  }
  return undefined;
}

/** Awards the story saves on the Awards page: the VA's 3rd-floor fan coils and his Pope job. */
export const STORY_SAVED_AWARD_IDS = [FAN_COILS_3RD_FLOOR, "FA445225C0019"] as const;
