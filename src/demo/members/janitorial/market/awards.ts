// THE JANITORIAL FIRM's award record: the Awards page, the Partners "Who's winning"
// strip, the Government Buyers panel and the company files (read through
// src/demo/explore/awardsData.ts, which picks the active member).
//
// Source: demo-storyboard/janitorial-pack.md, section 13. Each award is modeled on a
// real cleaning, grounds or exterior award near Fort Bragg or Seymour Johnson (the
// model is named on each one): the buyer, the work, the value, the set-aside and the
// number of offers come from the real record. Changed: the winner is a made-up
// company (D13), the award id is invented in the buyer's format (the pack's ids were
// checked unused on SAM.gov and USAspending, 19 Oct 2026; the SOF floor job's id,
// added here so two awards are recent, was not), and most dates are counted from
// today so "Just awarded" stays true. Real dates kept: the post-wide AbilityOne
// custodial (March 2026), the pressure-washing contract (to 31 Dec 2026, the hero's
// predecessor), the Army Reserve contract (to 28 Jan 2027, the team-up's
// predecessor) and Reggie's own Seymour Johnson job (persona.ts).
//
// Models (USAspending):
//   Post-wide custodial (AbilityOne)  https://sam.gov/opp/8ac652dc7b6a491db27a9b307eca686f/view
//   Pressure washing, 6 offers        https://www.usaspending.gov/award/CONT_AWD_W9124721P0010_9700_-NONE-_-NONE-
//   Garrison grounds (AbilityOne)     https://www.usaspending.gov/award/CONT_AWD_W9124722C0004_9700_-NONE-_-NONE-
//   Seymour Johnson custodial (8(a))  https://www.usaspending.gov/award/CONT_AWD_FA480922P0009_9700_-NONE-_-NONE-
//   81st RD janitorial and grounds    https://www.usaspending.gov/award/CONT_AWD_W912HP21C1001_9700_-NONE-_-NONE-
//   Womack hospital cleaning          https://www.usaspending.gov/award/CONT_AWD_HT940824F0031_9700_HT940824D0009_9700
//   Durham VA janitorial, 44 offers   https://www.usaspending.gov/award/CONT_AWD_36C24626P0207_3600_-NONE-_-NONE-
//   Jordan Lake custodial, 30 offers  https://www.usaspending.gov/award/CONT_AWD_W912PM26PA058_9700_-NONE-_-NONE-
//   EPA RTP custodial, 21 offers      https://www.usaspending.gov/award/CONT_AWD_68HERC25C0054_6800_-NONE-_-NONE-
//   FAA Fayetteville tower            https://www.usaspending.gov/award/CONT_AWD_697DCK23C00411_6920_-NONE-_-NONE-
//   SOF floor stripping, 3 offers     https://www.usaspending.gov/award/CONT_AWD_H9242126PE029_9700_-NONE-_-NONE-
//   Seymour Johnson dorms (his)       https://www.usaspending.gov/award/CONT_AWD_FA480925F0106_9700_FA480924A0002_9700

import { findPastPerformance } from "../../../story/persona";
import { getOpportunity } from "../../../story/opportunities";
import type { AwardSeed } from "../../../explore/awardsData";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, MEMBER_FIRM } from "./firms";

/** The buyers. Government offices are real, so these names are real. */
export const AWARD_AGENCIES = {
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  seymour: { name: "Department of the Air Force, 4th Contracting Squadron (Seymour Johnson AFB)", abbrev: "4th CONS", isDefense: true },
  usaceCharleston: { name: "Department of the Army, U.S. Army Corps of Engineers, Charleston District", abbrev: "USACE Charleston", isDefense: true },
  usaceWilmington: { name: "Department of the Army, U.S. Army Corps of Engineers, Wilmington District", abbrev: "USACE Wilmington", isDefense: true },
  dha: { name: "Department of Defense, Defense Health Agency", abbrev: "DHA", isDefense: true },
  socom: { name: "Department of Defense, U.S. Special Operations Command (Fort Bragg)", abbrev: "USSOCOM", isDefense: true },
  vaNco6: { name: "Department of Veterans Affairs, Network Contracting Office 6", abbrev: "VA NCO 6", isDefense: false },
  epa: { name: "Environmental Protection Agency, Office of Acquisition Solutions (RTP)", abbrev: "EPA", isDefense: false },
  faa: { name: "Department of Transportation, Federal Aviation Administration", abbrev: "FAA", isDefense: false },
} as const;

export type AgencyAwardAgency = keyof typeof AWARD_AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AWARD_AGENCY_LABEL: Record<AgencyAwardAgency, string> = {
  braggMicc: "the Army contracting office at Fort Bragg",
  seymour: "the 4th Contracting Squadron at Seymour Johnson AFB",
  usaceCharleston: "the Corps of Engineers' Charleston District",
  usaceWilmington: "the Corps of Engineers' Wilmington District",
  dha: "the Defense Health Agency",
  socom: "Special Operations Command at Fort Bragg",
  vaNco6: "the VA contracting office for North Carolina and Virginia",
  epa: "the EPA",
  faa: "the Federal Aviation Administration",
};

const AFTER_EXCL = "Full and Open Competition after exclusion of sources";
const SIMPLIFIED = "Competed under simplified acquisition procedures";
const FAIR_OPPORTUNITY = "Subject to Multiple Award Fair Opportunity";
const NOT_COMPETED = "Not Competed";
const SB_SETASIDE = "Small Business Set-Aside, total";
const HUBZONE_SETASIDE = "HUBZone Set-Aside";
const SDVOSB_SETASIDE = "Service-Disabled Veteran-Owned Small Business Set-Aside";
const EIGHT_A_SOLE = "8(a) Sole Source";
const ABILITYONE = "AbilityOne mandatory source (FAR 8.7)";
const SB_PRIME = "Not required (small business prime)";
const NONPROFIT = "Not required (AbilityOne nonprofit)";

const ASHEPOO = KEY_PARTNER_FIRM.key;
const GRAY_OWL = MEMBER_FIRM.key;
const QUILLMOOR = 4101;
const CLEARLINE = 4102;
const dorms = findPastPerformance("pp-sj-dorm-wash")!;

/** Fort Bragg's pressure-washing contract: the hero's predecessor, extended to 31 Dec 2026. */
const PRESSURE_WASHING = "W9124721P0093";
/** The 81st Readiness Division's janitorial and grounds: the team-up's predecessor. */
const ARMY_RESERVE = "W912HP21C1006";

export const AWARD_SEEDS: AwardSeed<AgencyAwardAgency>[] = [
  // ── Ashepoo Facility Solutions (4001): the 8(a) prime ─────────────────────
  {
    id: ARMY_RESERVE,
    title: "Janitorial and grounds maintenance, 81st Readiness Division sites in NC and SC",
    winner: ASHEPOO,
    agency: "usaceCharleston",
    obligated: 1_900_573,
    startedOn: "2021-07-29",
    endsOn: "2027-01-28",
    rebidIsOpen: true,
    city: "Fort Bragg",
    state: "NC",
    naics: "561720",
    workType: "Cleaning and mowing at Army Reserve centers across two states, one prime for every site",
    psc: "S201",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4004, 1]] },
  },
  {
    id: "FA480922P0187",
    title: "Base custodial, Seymour Johnson AFB",
    winner: ASHEPOO,
    agency: "seymour",
    obligated: 3_020_119,
    startedDaysAgo: 1_480,
    endsInDays: 163,
    city: "Goldsboro",
    state: "NC",
    naics: "561720",
    workType: "Custodial across the base's offices and shops, given to one 8(a) firm without a competition",
    psc: "S201",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: EIGHT_A_SOLE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4004, 1]] },
  },

  // ── Gray Owl (4000): Reggie's own Seymour Johnson job ─────────────────────
  {
    id: "FA480925F0123",
    title: "Dormitory pressure washing, 14 buildings, Seymour Johnson AFB (call under his BPA)",
    winner: GRAY_OWL,
    agency: "seymour",
    obligated: dorms.totalValue,
    currentValue: dorms.totalValue,
    ceiling: dorms.totalValue,
    startedOn: dorms.periodStart,
    endsOn: dorms.periodEnd,
    city: "Goldsboro",
    state: "NC",
    naics: "561790",
    workType: "Hot-water washing of dorms, stairwells, sidewalks and dumpster pads, wash water kept out of the drains",
    psc: "S299",
    offers: 1,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Redtail Veteran Facility Services (4002): VA janitorial ──────────────
  {
    id: "36C24626P2588",
    title: "Janitorial, Durham VA Medical Center",
    winner: 4002,
    agency: "vaNco6",
    obligated: 2_646_000,
    startedDaysAgo: 60,
    city: "Durham",
    state: "NC",
    naics: "561720",
    workType: "Janitorial for a VA hospital, set aside for service-disabled veteran-owned firms",
    psc: "S201",
    offers: 44,
    extent: AFTER_EXCL,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4000, 1]] },
  },
  {
    id: "H9242126PE044",
    title: "Floor stripping and restroom cleaning, SOF building, Fort Bragg",
    winner: 4002,
    agency: "socom",
    obligated: 9_871,
    startedDaysAgo: 50,
    city: "Fort Bragg",
    state: "NC",
    naics: "561720",
    workType: "A one-time floor strip, wax and restroom deep clean",
    psc: "S201",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4000, 1]] },
  },

  // ── Highland Brook Exterior Services (4003): the pressure-washing incumbent ─
  {
    id: PRESSURE_WASHING,
    title: "Pressure washing and sandblasting, external facilities, Fort Bragg",
    winner: 4003,
    agency: "braggMicc",
    obligated: 782_100,
    startedOn: "2021-07-01",
    endsOn: "2026-12-31",
    rebidIsOpen: true,
    city: "Fort Bragg",
    state: "NC",
    naics: "561790",
    workType: "Hot and cold washing of buildings, barracks and bridges, priced by the square foot (377,000 a year)",
    psc: "S299",
    offers: 6,
    extent: SIMPLIFIED,
    setAside: HUBZONE_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Kingsdale Custodial Group (4004): Corps lakes and the EPA campus ──────
  {
    id: "68HERC25C0057",
    title: "Custodial support, EPA campus, Research Triangle Park",
    winner: 4004,
    agency: "epa",
    obligated: 3_348_564,
    startedDaysAgo: 400,
    city: "Durham",
    state: "NC",
    naics: "561720",
    workType: "Custodial for a large federal campus of labs and offices",
    psc: "S201",
    offers: 21,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4005, 1]] },
  },

  // ── Peachline Commercial Cleaning (4005): beat him at Jordan Lake ─────────
  {
    id: "W912PM26PA068",
    title: "Custodial and refuse service, B. Everett Jordan Dam (Jordan Lake)",
    winner: 4005,
    agency: "usaceWilmington",
    obligated: 38_900,
    startedDaysAgo: 140,
    endsInDays: 130,
    city: "Moncure",
    state: "NC",
    naics: "561720",
    workType: "Restrooms and trash at lake recreation areas, three visits a week in season; a 9-month base",
    psc: "S201",
    offers: 30,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Quillmoor Industries (4101): the AbilityOne nonprofit ─────────────────
  {
    id: "W9124726DA041",
    title: "Post-wide custodial, Fort Bragg (AbilityOne IDIQ)",
    winner: QUILLMOOR,
    agency: "braggMicc",
    obligated: 46_073_926,
    startedOn: "2026-03-17",
    endsOn: "2030-03-31",
    city: "Fort Bragg",
    state: "NC",
    naics: "561720",
    workType: "Custodial for the whole post, bought from the AbilityOne list: no commercial firm may bid",
    psc: "S201",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: ABILITYONE,
    subPlan: NONPROFIT,
    bench: null,
  },
  {
    id: "W9124722C0187",
    title: "Garrison grounds maintenance, Fort Bragg (AbilityOne)",
    winner: QUILLMOOR,
    agency: "braggMicc",
    obligated: 10_734_266,
    startedDaysAgo: 1_560,
    endsInDays: 250,
    city: "Fort Bragg",
    state: "NC",
    naics: "561730",
    workType: "Mowing and grounds care across the post, bought from the AbilityOne list",
    psc: "S208",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: ABILITYONE,
    subPlan: NONPROFIT,
    bench: null,
  },
  {
    id: "697DCK23C00488",
    title: "Janitorial, Fayetteville air traffic control tower",
    winner: QUILLMOOR,
    agency: "faa",
    obligated: 201_005,
    startedOn: "2023-10-01",
    endsOn: "2028-09-30",
    city: "Fayetteville",
    state: "NC",
    naics: "561720",
    workType: "Janitorial for the tower and its base building, bought from the AbilityOne list",
    psc: "S201",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: ABILITYONE,
    subPlan: NONPROFIT,
    bench: null,
  },

  // ── Clearline Health Services JV (4102): Womack, IDIQ holders only ────────
  {
    id: "HT940824F0036",
    title: "Hospital cleaning, Fort Bragg's Army hospital (order under DHA's cleaning IDIQ)",
    winner: CLEARLINE,
    agency: "dha",
    obligated: 22_224_697,
    startedDaysAgo: 760,
    city: "Fort Bragg",
    state: "NC",
    naics: "561720",
    workType: "Environmental cleaning for a hospital, at the predecessor's union wages",
    psc: "S201",
    offers: 13,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
];

function heroQuoteDays(): number {
  return getOpportunity(HERO_IDS.hero)?.closesInDays ?? 21;
}
function reserveReplyDays(): number {
  return getOpportunity(HERO_IDS.teamUp)?.closesInDays ?? 12;
}

/** The line on an award whose next job is already being asked about. */
export function openNowNote(awardId: string): string | undefined {
  if (awardId === PRESSURE_WASHING) {
    return `The next contract is open now, set aside for HUBZone firms again. Quotes are due in ${heroQuoteDays()} days. Grant says bid it.`;
  }
  if (awardId === ARMY_RESERVE) {
    return `The Corps is asking about the follow-on now, and it is expected to be for 8(a) firms. Replies are due in ${reserveReplyDays()} days. Grant says to team up.`;
  }
  return undefined;
}

/** Awards the story saves on the Awards page: the Army Reserve contract and his dorm job. */
export const STORY_SAVED_AWARD_IDS = [ARMY_RESERVE, "FA480925F0123"] as const;
