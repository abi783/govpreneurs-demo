// THE CONSULTANT's award record: the Awards page, the Partners "Who's winning" strip,
// the Government Buyers panel and the company files (read through
// src/demo/explore/awardsData.ts, which picks the active member).
//
// Source: demo-storyboard/consulting-pack.md, section 13. Each award is modeled on a
// real consulting or training award at Fort Bragg, the VA's NC network or the Army's
// HR Solutions contract (the model is named below): the buyer, the work, the value,
// the set-aside and the number of offers come from the real record. Changed: the
// winner is a made-up company (D13), the award id is invented in the buyer's format
// (each checked unused on USAspending, 19 Oct 2026), and most dates are counted from
// today so "Just awarded" stays true. Kept: Simone's own ACS job (persona.ts), and the
// real start dates of the two awards the story is built on.
//
// Two changes from the pack's table: the Army training-model order (a woman-owned
// set-aside) goes to Bellhaven Mission Partners, a woman-owned firm, not to the large
// Penhallow Federal Advisory, who could not win it. And the family readiness order
// (the team-up's incumbent) is assumed bridged to the new order, about 150 days out;
// no follow-on shows on USAspending yet. A small Fort Bragg chaplain class
// (W9124724P0013, $20,000; pack section 6) is added as a recent small win.
//
// Models (USAspending):
//   Family Advocacy support      https://www.usaspending.gov/award/CONT_AWD_W9124725CA078_9700_-NONE-_-NONE-
//   Manpower support (GSA)       https://www.usaspending.gov/award/CONT_AWD_W9124723F0139_9700_GS10F0190W_4730
//   USAR sustainment reporting   https://www.usaspending.gov/award/CONT_AWD_W9124726FA027_9700_47QRAA24D0003_4732
//   Army training model support  https://www.usaspending.gov/award/CONT_AWD_W9124721F0116_9700_47QRAA18D009D_4732
//   Chaplain training            https://www.usaspending.gov/award/CONT_AWD_W9124724P0013_9700_-NONE-_-NONE-
//   VA leadership training       https://www.usaspending.gov/award/CONT_AWD_36C24622P1063_3600_-NONE-_-NONE-
//   VA mediation training        https://www.usaspending.gov/award/CONT_AWD_36C24627P0012_3600_-NONE-_-NONE-
//   VA Hampton leadership (GSA)  https://www.usaspending.gov/award/CONT_AWD_36C24623F0256_3600_GS00F146DA_4732
//   VISN 6 HR support (GSA)      https://www.usaspending.gov/award/CONT_AWD_36C24622F0477_3600_GS00F280DA_4732
//   Family readiness staff (PLS) https://www.usaspending.gov/award/CONT_AWD_W15QKN21F0263_9700_W15QKN19D0049_9700
//   Guard family readiness (PLS) https://www.usaspending.gov/award/CONT_AWD_W15QKN26F0163_9700_W15QKN19D0049_9700

import { findPastPerformance } from "../../../story/persona";
import { getOpportunity } from "../../../story/opportunities";
import type { AwardSeed } from "../../../explore/awardsData";
import { HERO_IDS } from "../opportunities";
import { KEY_PARTNER_FIRM, MEMBER_FIRM } from "./firms";

/** The buyers. Government offices are real, so these names are real. */
export const AWARD_AGENCIES = {
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  vaNco6: { name: "Department of Veterans Affairs, Network Contracting Office 6", abbrev: "VA NCO 6", isDefense: false },
  accRi: { name: "Department of the Army, Army Contracting Command – Rock Island (Picatinny)", abbrev: "ACC–RI", isDefense: true },
} as const;

export type AgencyAwardAgency = keyof typeof AWARD_AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AWARD_AGENCY_LABEL: Record<AgencyAwardAgency, string> = {
  braggMicc: "the Army contracting office at Fort Bragg",
  vaNco6: "the VA contracting office for North Carolina and Virginia",
  accRi: "the Army office that orders on its HR Solutions contract",
};

const AFTER_EXCL = "Full and Open Competition after exclusion of sources";
const SIMPLIFIED = "Competed under simplified acquisition procedures";
const FAIR_OPPORTUNITY = "Subject to Multiple Award Fair Opportunity";
const NOT_COMPETED = "Not Competed";
const SB_SETASIDE = "Small Business Set-Aside, total";
const SDVOSB_SETASIDE = "Service-Disabled Veteran-Owned Small Business Set-Aside";
const WOSB_SETASIDE = "Women-Owned Small Business Set-Aside";
const SB_PRIME = "Not required (small business prime)";

const HALYARD = KEY_PARTNER_FIRM.key;
const COPPERVALE = MEMBER_FIRM.key;
const acs = findPastPerformance("pp-acs-lean-review")!;

/** The Army's family readiness staff training: the order the team-up's sources sought asks about again. */
const FAMILY_READINESS_ORDER = "W15QKN21F0917";
/** The Fayetteville VA's last leadership program: the hero is its next round. */
const VA_LEADERSHIP_LAST = "36C24622P2071";
/** VISN 6 HR support on a GSA schedule: the next order is open now, for schedule holders only. */
const VISN6_HR_ORDER = "36C24622F0493";

export const AWARD_SEEDS: AwardSeed<AgencyAwardAgency>[] = [
  // ── Halyard Point Human Capital (4001): HR Solutions (PLS) orders ─────────
  {
    id: FAMILY_READINESS_ORDER,
    title: "Soldier and family readiness staff training support (order under the Army's HR Solutions contract)",
    winner: HALYARD,
    agency: "accRi",
    obligated: 5_517_405,
    startedOn: "2021-05-21",
    endsInDays: 150,
    rebidIsOpen: true,
    city: "Chesapeake",
    state: "VA",
    naics: "541612",
    workType: "Classes for Army family readiness staff, in person across the Southeast and online",
    psc: "U008",
    offers: 6,
    extent: FAIR_OPPORTUNITY,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4000, 1], [4005, 1]] },
  },
  {
    id: "W15QKN26F0809",
    title: "National Guard family readiness staff training (order under the Army's HR Solutions contract)",
    winner: HALYARD,
    agency: "accRi",
    obligated: 810_501,
    startedDaysAgo: 182,
    endsOn: "2027-04-20",
    city: "Chesapeake",
    state: "VA",
    naics: "541612",
    workType: "Classes for Guard family readiness staff, with an option year",
    psc: "U008",
    offers: 4,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 5, repeat: 2, subs: [[4005, 1]] },
  },

  // ── Coppervale Advisory Group (4000): Simone's own ACS job ───────────────
  {
    id: "W91247-25-P-A061",
    title: "Lean review and staff training, Army Community Service, Fort Bragg",
    winner: COPPERVALE,
    agency: "braggMicc",
    obligated: acs.totalValue,
    currentValue: acs.totalValue,
    ceiling: acs.totalValue,
    startedOn: acs.periodStart,
    endsOn: acs.periodEnd,
    city: "Fort Bragg",
    state: "NC",
    naics: "541611",
    workType: "A Lean review of the front desk and appointments, then Lean basics for 40 staff",
    psc: "R408",
    offers: 6,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Wickline Federal Analytics (4002): GSA schedule orders ──────────────
  {
    id: "W9124723F0152",
    title: "Manpower support services, Fort Bragg (GSA schedule order)",
    winner: 4002,
    agency: "braggMicc",
    obligated: 2_104_835,
    startedOn: "2023-05-01",
    endsOn: "2027-04-30",
    city: "Fort Bragg",
    state: "NC",
    naics: "541611",
    workType: "Manpower analysts for Army units, ordered only from GSA schedule holders",
    psc: "R408",
    offers: 4,
    extent: FAIR_OPPORTUNITY,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4003, 1]] },
  },
  {
    id: VISN6_HR_ORDER,
    title: "HR support services, VA Mid-Atlantic Health Care Network (GSA schedule order)",
    winner: 4002,
    agency: "vaNco6",
    obligated: 5_650_497,
    startedDaysAgo: 1480,
    endsInDays: 70,
    rebidIsOpen: true,
    city: "Durham",
    state: "NC",
    naics: "541612",
    workType: "HR staff for the VA's hospitals in NC and Virginia",
    psc: "R499",
    offers: 2,
    extent: FAIR_OPPORTUNITY,
    setAside: null,
    subPlan: SB_PRIME,
    bench: { distinct: 2, repeat: 1, subs: [[4003, 1]] },
  },

  // ── Bellhaven Mission Partners (4003): Army orders on its GSA schedule ──
  {
    id: "W9124726FA219",
    title: "Army Reserve sustainment-reporting support, Fort Bragg (GSA schedule order)",
    winner: 4003,
    agency: "braggMicc",
    obligated: 570_772,
    startedDaysAgo: 270,
    endsOn: "2027-01-22",
    city: "Fort Bragg",
    state: "NC",
    naics: "541611",
    workType: "Analysts who track and report readiness for the Army Reserve's headquarters",
    psc: "R408",
    offers: 14,
    extent: FAIR_OPPORTUNITY,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4004, 1]] },
  },
  {
    id: "W9124721F0129",
    title: "Army training model support, Fort Bragg (GSA schedule order)",
    winner: 4003,
    agency: "braggMicc",
    obligated: 7_614_827,
    startedOn: "2021-06-01",
    endsOn: "2026-05-31",
    city: "Fort Bragg",
    state: "NC",
    naics: "541611",
    workType: "Staff who build and update the Army's training models",
    psc: "R408",
    offers: 3,
    extent: FAIR_OPPORTUNITY,
    setAside: WOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: { distinct: 3, repeat: 1, subs: [[4004, 1]] },
  },

  // ── Corriher Lane Consulting (4004): Fort Bragg family programs ─────────
  {
    id: "W9124725CA091",
    title: "Family Advocacy Program support, Army Community Service, Fort Bragg",
    winner: 4004,
    agency: "braggMicc",
    obligated: 225_761,
    startedDaysAgo: 359,
    endsInDays: 6,
    city: "Fort Bragg",
    state: "NC",
    naics: "611430",
    workType: "Prevention classes and program support for families, one year at a time",
    psc: "U099",
    offers: 11,
    extent: AFTER_EXCL,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "W9124726P0391",
    title: "Leadership training for unit chaplains, Fort Bragg",
    winner: 4004,
    agency: "braggMicc",
    obligated: 20_000,
    startedDaysAgo: 40,
    city: "Fort Bragg",
    state: "NC",
    naics: "611430",
    workType: "A two-day class, bought as a small quote",
    psc: "U099",
    offers: 3,
    extent: SIMPLIFIED,
    setAside: SB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Tamarack Leadership Group (4005): VA leadership classes ─────────────
  {
    id: VA_LEADERSHIP_LAST,
    title: "Leadership training, Fayetteville VA Coastal Health Care System",
    winner: 4005,
    agency: "vaNco6",
    obligated: 152_838,
    startedOn: "2022-06-15",
    endsOn: "2025-10-14",
    rebidIsOpen: true,
    city: "Fayetteville",
    state: "NC",
    naics: "611430",
    workType: "Leadership classes for VA supervisors, given to one firm without a competition",
    psc: "U099",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: null,
    subPlan: SB_PRIME,
    bench: null,
  },
  {
    id: "36C24627P0114",
    title: "Three-day mediation training, Asheville VA",
    winner: 4005,
    agency: "vaNco6",
    obligated: 21_750,
    startedDaysAgo: 8,
    city: "Asheville",
    state: "NC",
    naics: "611430",
    workType: "A small class, set aside for service-disabled veteran-owned firms",
    psc: "U099",
    offers: 1,
    extent: SIMPLIFIED,
    setAside: SDVOSB_SETASIDE,
    subPlan: SB_PRIME,
    bench: null,
  },

  // ── Not a partner for Simone ────────────────────────────────────────────
  {
    id: "36C24623F0281",
    title: "Leadership and engagement training, Hampton VA Medical Center (GSA schedule order)",
    winner: 4101,
    agency: "vaNco6",
    obligated: 1_234_630,
    startedDaysAgo: 1100,
    endsInDays: 40,
    city: "Hampton",
    state: "VA",
    naics: "541611",
    workType: "Leader coaching and staff-engagement classes at one VA hospital",
    psc: "R408",
    offers: 1,
    extent: FAIR_OPPORTUNITY,
    setAside: null,
    subPlan: "Plan on file",
    bench: null,
  },
];

function daysLeft(oppId: string, fallback: number): number {
  return getOpportunity(oppId)?.closesInDays ?? fallback;
}

/** The line on an award whose next job is already being asked about. */
export function openNowNote(awardId: string): string | undefined {
  if (awardId === FAMILY_READINESS_ORDER) {
    return `The Army is asking which firms could do this work next. Replies are due in ${daysLeft(HERO_IDS.teamUp, 21)} days, and only holders of its HR Solutions contract can bid. Grant says to team up.`;
  }
  if (awardId === VA_LEADERSHIP_LAST) {
    return `The VA is taking quotes for the next supervisor program now, due in ${daysLeft(HERO_IDS.hero, 23)} days and set aside for service-disabled veteran-owned firms. Grant says to bid.`;
  }
  if (awardId === VISN6_HR_ORDER) {
    return `The VA is taking quotes for the next order now, due in ${daysLeft("36C24627Q0133", 15)} days, but only from GSA schedule holders.`;
  }
  return undefined;
}

/** Awards the story saves on the Awards page: the Army training order and her own ACS job. */
export const STORY_SAVED_AWARD_IDS = [FAMILY_READINESS_ORDER, "W91247-25-P-A061"] as const;
