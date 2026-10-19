// The sample award record for the Awards page, the Partners "Who's winning" strip,
// the Government Buyers panel and Carolina Dining Group's company file.
//
// Every winner is a made-up company from firms.ts. Every buyer is real.
// Dates are days back from today (clock.ts), so "Just awarded" stays true on any day
// the demo opens. Two jobs are history, and their dates stay fixed: Carolina Dining
// Group's 2019 Fort Bragg award and Amira's Womack award (persona.ts).

import { anyFirmByKey, AMIRA_FIRM, CAROLINA_DINING } from "./firms";
import { calendarDay, daysToDay } from "./dates";
import { PAST_PERFORMANCE, findPastPerformance } from "@/demo/story/persona";
import { getOpportunity } from "@/demo/story/opportunities";
import type { AwardBench, AwardRecord } from "@/lib/awardsApi";
import { HERO_IDS as CATERER_HERO } from "@/demo/members/caterer/opportunities";
import { byMember } from "@/demo/member";
import * as agencyMarket from "@/demo/members/agency/market/awards";

interface Agency {
  name: string;
  abbrev: string;
  isDefense: boolean;
}

/** The buyers. Government offices are real, so these names are real. */
export const AGENCIES = {
  braggMicc: { name: "Department of the Army, Mission and Installation Contracting Command (Fort Bragg)", abbrev: "MICC Fort Bragg", isDefense: true },
  womack: { name: "Womack Army Medical Center, Department of the Army", abbrev: "Womack AMC", isDefense: true },
  pope: { name: "43rd Air Mobility Operations Group, Pope Army Airfield", abbrev: "Pope AAF", isDefense: true },
  vaNco6: { name: "Department of Veterans Affairs, Network Contracting Office 6", abbrev: "VA NCO 6", isDefense: false },
  lejeune: { name: "Department of the Navy, NAVFAC Mid-Atlantic (Camp Lejeune)", abbrev: "NAVFAC Lejeune", isDefense: true },
  cherryPoint: { name: "Department of the Navy, NAVFAC Mid-Atlantic (MCAS Cherry Point)", abbrev: "NAVFAC Cherry Point", isDefense: true },
  newRiver: { name: "Department of the Navy, MCAS New River", abbrev: "MCAS New River", isDefense: true },
  sunnyPoint: { name: "Military Ocean Terminal Sunny Point, Department of the Army", abbrev: "MOTSU", isDefense: true },
  seymour: { name: "Department of the Air Force, 4th Contracting Squadron (Seymour Johnson AFB)", abbrev: "4th CONS", isDefense: true },
  gsa4: { name: "General Services Administration, Region 4", abbrev: "GSA Region 4", isDefense: false },
  ncng: { name: "North Carolina National Guard, Joint Force Headquarters", abbrev: "NC National Guard", isDefense: true },
  fortJackson: { name: "Department of the Army, Fort Jackson", abbrev: "Fort Jackson", isDefense: true },
  norfolk: { name: "Department of the Navy, Naval Station Norfolk", abbrev: "NS Norfolk", isDefense: true },
  littleCreek: { name: "Department of the Navy, Joint Expeditionary Base Little Creek", abbrev: "JEB Little Creek", isDefense: true },
  dodea: { name: "Department of Defense Education Activity, DoDEA Schools (Fort Bragg)", abbrev: "DoDEA", isDefense: true },
  jobCorps: { name: "Department of Labor, Job Corps (Kinston)", abbrev: "DOL Job Corps", isDefense: false },
  fortStewart: { name: "Department of the Army, Fort Stewart", abbrev: "Fort Stewart", isDefense: true },
  mayport: { name: "Department of the Navy, Naval Station Mayport", abbrev: "NS Mayport", isDefense: true },
} as const satisfies Record<string, Agency>;

type AgencyId = keyof typeof AGENCIES;

/** The buyer in a sentence, for "Won (job) for (buyer)". */
export const AGENCY_LABEL: Record<AgencyId, string> = {
  braggMicc: "the Army contracting office at Fort Bragg",
  womack: "Womack Army Medical Center",
  pope: "the 43rd Air Mobility Operations Group at Pope Army Airfield",
  vaNco6: "the VA contracting office for the Carolinas and Virginia",
  lejeune: "the Navy at Camp Lejeune",
  cherryPoint: "the Navy at MCAS Cherry Point",
  newRiver: "the Marine Corps at MCAS New River",
  sunnyPoint: "the Army at Military Ocean Terminal Sunny Point",
  seymour: "the 4th Contracting Squadron at Seymour Johnson AFB",
  gsa4: "GSA Region 4",
  ncng: "the North Carolina National Guard",
  fortJackson: "the Army at Fort Jackson",
  norfolk: "the Navy at Naval Station Norfolk",
  littleCreek: "the Navy at Joint Expeditionary Base Little Creek",
  dodea: "the DoD schools at Fort Bragg",
  jobCorps: "the Job Corps center in Kinston",
  fortStewart: "the Army at Fort Stewart",
  mayport: "the Navy at Naval Station Mayport",
};

export function agencyIdOf(award: { agency: { abbrev: string | null } }): AgencyId | null {
  const hit = (Object.keys(AGENCIES) as AgencyId[]).find((k) => AGENCIES[k].abbrev === award.agency.abbrev);
  return hit ?? null;
}

/** One award. `A` is the member's buyer table (the caterer's AGENCIES, or the agency's). */
export interface AwardSeed<A extends string = AgencyId> {
  id: string;
  solicitationId?: string;
  title: string;
  /** The winner's awardeeKey (firms.ts). */
  winner: number;
  agency: A;
  obligated: number;
  currentValue?: number;
  ceiling?: number;
  /** Days back from today that the work started, or a fixed history date. */
  startedDaysAgo?: number;
  startedOn?: string;
  /** Days from today that the current period ends (the job comes up for bid again). */
  endsInDays?: number;
  /** A fixed end date, for a contract whose end the story names (the VA hiring campaign). */
  endsOn?: string;
  /** The next contract is already open for bids: the story's Fort Bragg dining notice. */
  rebidIsOpen?: boolean;
  city: string | null;
  state: string | null;
  naics: string;
  workType: string;
  psc: string;
  offers: number | null;
  extent: string | null;
  setAside: string | null;
  subPlan: string | null;
  bench: { distinct: number; repeat: number; subs: [number, number][] } | null;
}

const FULL_OPEN = "Full and Open Competition";
const AFTER_EXCL = "Full and Open Competition after exclusion of sources";
const NOT_COMPETED = "Not Competed";
const SB_SETASIDE = "Small Business Set-Aside, total";
const WOSB_SETASIDE = "Women-Owned Small Business Set-Aside";

const CDG = CAROLINA_DINING.key;
const AMIRA = AMIRA_FIRM.key;

const womack = findPastPerformance("pp-womack")!;
const cdgSub = findPastPerformance("pp-cdg-sub")!;

const CATERER_SEEDS: AwardSeed[] = [
  // ── Carolina Dining Group (4001) ───────────────────────────────────────
  {
    id: "W91247-19-C-0021",
    title: "Dining facility food service: two facilities, Fort Bragg",
    winner: CDG,
    agency: "braggMicc",
    obligated: 9_100_000,
    ceiling: 9_400_000,
    startedOn: "2019-10-01",
    endsInDays: 135,
    rebidIsOpen: true,
    city: "Fort Bragg",
    state: "NC",
    naics: "722310",
    workType: "Running two on-post dining halls",
    psc: "M1FD",
    offers: 5,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 7, repeat: 3, subs: [[AMIRA, 1], [4002, 2], [4009, 2], [4010, 1]] },
  },
  {
    id: "W91247-24-D-0051",
    title: "Event catering, Fort Bragg Morale, Welfare and Recreation (order as needed)",
    winner: CDG,
    agency: "braggMicc",
    obligated: 380_000,
    currentValue: 640_000,
    ceiling: 1_400_000,
    startedDaysAgo: 505,
    endsInDays: 300,
    city: "Fort Bragg",
    state: "NC",
    naics: "722320",
    workType: "Event and holiday catering",
    psc: "S206",
    offers: 4,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 7, repeat: 3, subs: [[AMIRA, 1], [4002, 2], [4009, 2], [4010, 1]] },
  },
  {
    id: "W91247-26-F-0114",
    title: "Dining facility attendant surge support, Fort Bragg",
    winner: CDG,
    agency: "braggMicc",
    obligated: 410_000,
    startedDaysAgo: 150,
    endsInDays: 215,
    city: "Fort Bragg",
    state: "NC",
    naics: "722310",
    workType: "Extra kitchen and serving crews",
    psc: "M1FD",
    offers: 1,
    extent: NOT_COMPETED,
    setAside: null,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 7, repeat: 3, subs: [[AMIRA, 1], [4002, 2], [4009, 2], [4010, 1]] },
  },

  // ── Haddad Catering & Food Services LLC (4000): the Womack award ───────
  {
    id: "W81K04-24-P-0187",
    solicitationId: "W81K04-24-Q-0187",
    title: "Patient meal support: Womack Army Medical Center",
    winner: AMIRA,
    agency: "womack",
    obligated: womack.totalValue,
    currentValue: womack.totalValue,
    ceiling: womack.totalValue,
    startedOn: womack.periodStart,
    city: "Fort Bragg",
    state: "NC",
    naics: "722310",
    workType: "Therapeutic diet trays for hospital wards",
    psc: "M1FD",
    offers: 4,
    extent: AFTER_EXCL,
    setAside: WOSB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: null,
  },

  // ── Longleaf Mess Services (4002) ──────────────────────────────────────
  {
    id: "W91247-23-C-0033",
    title: "Dining support services, Camp Mackall training site",
    winner: 4002,
    agency: "braggMicc",
    obligated: 3_200_000,
    startedDaysAgo: 1190,
    endsInDays: 240,
    city: "Camp Mackall",
    state: "NC",
    naics: "722310",
    workType: "Dining support for soldiers in training",
    psc: "M1FD",
    offers: 3,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 5, repeat: 2, subs: [[4010, 2], [4009, 1], [AMIRA, 1]] },
  },
  {
    id: "W91247-25-F-0188",
    title: "Field feeding surge support, Fort Bragg",
    winner: 4002,
    agency: "braggMicc",
    obligated: 780_000,
    startedDaysAgo: 590,
    city: "Fort Bragg",
    state: "NC",
    naics: "722310",
    workType: "Field meals for training rotations",
    psc: "M1FD",
    offers: 6,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 5, repeat: 2, subs: [[4010, 2], [4009, 1], [AMIRA, 1]] },
  },

  // ── Cape Fear Galley Partners (4003) ───────────────────────────────────
  {
    id: "W912PM-24-C-0066",
    title: "Cafeteria and catering services, Military Ocean Terminal Sunny Point",
    winner: 4003,
    agency: "sunnyPoint",
    obligated: 1_450_000,
    startedDaysAgo: 880,
    endsInDays: 400,
    city: "Southport",
    state: "NC",
    naics: "722310",
    workType: "Staff cafeteria and event catering",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 3, repeat: 1, subs: [[4010, 2], [4005, 1]] },
  },
  {
    id: "N40085-26-P-0212",
    title: "Family readiness event catering, MCAS Cherry Point",
    winner: 4003,
    agency: "cherryPoint",
    obligated: 540_000,
    startedDaysAgo: 70,
    city: "Havelock",
    state: "NC",
    naics: "722320",
    workType: "Event catering for base families",
    psc: "S206",
    offers: 5,
    extent: AFTER_EXCL,
    setAside: WOSB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 3, repeat: 1, subs: [[4010, 2], [4005, 1]] },
  },
  {
    id: "W9124M-25-P-0074",
    title: "Ceremony and official function catering, Pope Army Airfield",
    winner: 4003,
    agency: "pope",
    obligated: 295_000,
    currentValue: 295_000,
    ceiling: 420_000,
    startedDaysAgo: 610,
    endsInDays: 120,
    city: "Pope Army Airfield",
    state: "NC",
    naics: "722320",
    workType: "Ceremony and function catering",
    psc: "S206",
    offers: 4,
    extent: FULL_OPEN,
    setAside: WOSB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 3, repeat: 1, subs: [[4010, 2], [4005, 1]] },
  },

  // ── Tarheel Institutional Foods (4004) ─────────────────────────────────
  {
    id: "W912PM-24-C-0141",
    title: "Dining hall service, National Guard training center, Camp Butner",
    winner: 4004,
    agency: "ncng",
    obligated: 1_150_000,
    startedDaysAgo: 760,
    endsInDays: 330,
    city: "Butner",
    state: "NC",
    naics: "722310",
    workType: "Training-center dining hall",
    psc: "M1FD",
    offers: 4,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 4, repeat: 2, subs: [[4010, 2], [4006, 1]] },
  },
  {
    id: "36C24724P0098",
    title: "Dietary services support, Fayetteville VA Medical Center",
    winner: 4004,
    agency: "vaNco6",
    obligated: 1_900_000,
    currentValue: 1_900_000,
    ceiling: 2_300_000,
    startedDaysAgo: 420,
    endsInDays: 310,
    city: "Fayetteville",
    state: "NC",
    naics: "722310",
    workType: "Hospital kitchen and patient meal support",
    psc: "M1FD",
    offers: 6,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 4, repeat: 2, subs: [[4010, 2], [4006, 1]] },
  },

  // ── Pamlico Food Management (4005) ─────────────────────────────────────
  {
    id: "N40085-24-C-0112",
    title: "Mess attendant services, MCB Camp Lejeune",
    winner: 4005,
    agency: "lejeune",
    obligated: 1_200_000,
    startedDaysAgo: 960,
    endsInDays: 150,
    city: "Jacksonville",
    state: "NC",
    naics: "722310",
    workType: "Dishwashing, serving lines and cleaning in dining halls",
    psc: "M1FD",
    offers: 5,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 3, repeat: 1, subs: [[4003, 1], [4009, 1]] },
  },
  {
    id: "M67004-25-P-0031",
    title: "Galley support, Marine Corps Air Station New River",
    winner: 4005,
    agency: "newRiver",
    obligated: 860_000,
    startedDaysAgo: 650,
    city: "Jacksonville",
    state: "NC",
    naics: "722310",
    workType: "Galley staffing",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 3, repeat: 1, subs: [[4003, 1], [4009, 1]] },
  },

  // ── Yadkin Hospitality Contractors (4006) ──────────────────────────────
  {
    id: "47PA0425F0017",
    title: "Federal building cafeteria operation, Greensboro",
    winner: 4006,
    agency: "gsa4",
    obligated: 690_000,
    startedDaysAgo: 540,
    endsInDays: 200,
    city: "Greensboro",
    state: "NC",
    naics: "722310",
    workType: "Cafeteria for federal employees",
    psc: "M1FD",
    offers: 4,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 2, repeat: 0, subs: [[4010, 1], [4004, 1]] },
  },
  {
    id: "36C24425P0211",
    title: "Cafe and vending service, Winston-Salem VA clinic",
    winner: 4006,
    agency: "vaNco6",
    obligated: 410_000,
    startedDaysAgo: 330,
    city: "Winston-Salem",
    state: "NC",
    naics: "722514",
    workType: "Clinic cafe and vending",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: null,
    bench: { distinct: 2, repeat: 0, subs: [[4010, 1], [4004, 1]] },
  },

  // ── Palmetto Mess Management (4007) ────────────────────────────────────
  {
    id: "W912JF-23-C-0017",
    title: "Dining facility operations, two facilities, Fort Jackson",
    winner: 4007,
    agency: "fortJackson",
    obligated: 5_400_000,
    startedDaysAgo: 1360,
    endsInDays: 330,
    city: "Columbia",
    state: "SC",
    naics: "722310",
    workType: "Running two basic-training dining halls",
    psc: "M1FD",
    offers: 4,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 6, repeat: 2, subs: [[4009, 1], [4005, 1], [4011, 1]] },
  },
  {
    id: "W912JF-25-F-0099",
    title: "Field feeding support, basic training, Fort Jackson",
    winner: 4007,
    agency: "fortJackson",
    obligated: 1_100_000,
    startedDaysAgo: 85,
    city: "Columbia",
    state: "SC",
    naics: "722310",
    workType: "Field meals for recruits",
    psc: "M1FD",
    offers: 5,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 6, repeat: 2, subs: [[4009, 1], [4005, 1], [4011, 1]] },
  },

  // ── Tidewater Galley Solutions (4008) ──────────────────────────────────
  {
    id: "N40085-22-C-0140",
    title: "Galley services, three galleys, Naval Station Norfolk",
    winner: 4008,
    agency: "norfolk",
    obligated: 7_800_000,
    startedDaysAgo: 1470,
    endsInDays: 420,
    city: "Norfolk",
    state: "VA",
    naics: "722310",
    workType: "Running three Navy galleys",
    psc: "M1FD",
    offers: 4,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Plan on file",
    bench: { distinct: 9, repeat: 4, subs: [[4011, 3], [4007, 1]] },
  },
  {
    id: "N40085-26-C-0044",
    title: "Galley services, Naval Station Mayport",
    winner: 4008,
    agency: "mayport",
    obligated: 3_100_000,
    startedDaysAgo: 400,
    endsInDays: 600,
    city: "Jacksonville",
    state: "FL",
    naics: "722310",
    workType: "Running a Navy galley",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Plan on file",
    bench: { distinct: 9, repeat: 4, subs: [[4011, 3], [4007, 1]] },
  },

  // ── Falling Creek Dining Group (4009) ─────────────────────────────────────
  {
    id: "FA4800-26-P-0007",
    solicitationId: "FA4800-26-Q-0007",
    title: "Lodging breakfast service, Seymour Johnson AFB",
    winner: 4009,
    agency: "seymour",
    obligated: 180_700,
    startedDaysAgo: 45,
    // The Seymour Johnson forecast (forecastLocalSeeds.ts) expects the next buy in 230 days.
    endsInDays: 230,
    city: "Goldsboro",
    state: "NC",
    naics: "722310",
    workType: "Daily breakfast for base lodging guests",
    psc: "M1FD",
    offers: 4,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 4, repeat: 1, subs: [[4010, 2], [4002, 1]] },
  },
  {
    id: "FA4800-22-C-0035",
    title: "Dining facility service, two facilities, Seymour Johnson AFB",
    winner: 4009,
    agency: "seymour",
    obligated: 4_100_000,
    startedDaysAgo: 1440,
    endsInDays: 300,
    city: "Goldsboro",
    state: "NC",
    naics: "722310",
    workType: "Running two Air Force dining halls",
    psc: "M1FD",
    offers: 3,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 4, repeat: 1, subs: [[4010, 2], [4002, 1]] },
  },

  // ── Neuse River Provisioning (4010) ────────────────────────────────────
  {
    id: "DOL-JC-24-F-0021",
    title: "Food service, Kinston Job Corps Center",
    winner: 4010,
    agency: "jobCorps",
    obligated: 1_050_000,
    startedDaysAgo: 980,
    endsInDays: 190,
    city: "Kinston",
    state: "NC",
    naics: "722310",
    workType: "Three meals a day for a training center",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 2, repeat: 1, subs: [[4003, 1]] },
  },
  {
    id: "W912PM-26-P-0030",
    title: "Drill weekend meal service, Hope Mills Armory",
    winner: 4010,
    agency: "ncng",
    obligated: 215_000,
    startedDaysAgo: 330,
    endsInDays: 25,
    city: "Hope Mills",
    state: "NC",
    naics: "722310",
    workType: "Meals for drill weekends",
    psc: "M1FD",
    offers: 4,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 2, repeat: 1, subs: [[4003, 1]] },
  },
  {
    id: "W91247-25-P-0412",
    title: "Coffee and snack service, Soldier Support Center, Fort Bragg",
    winner: 4010,
    agency: "braggMicc",
    obligated: 42_000,
    startedDaysAgo: 260,
    city: "Fort Bragg",
    state: "NC",
    naics: "722515",
    workType: "Coffee and snack counter",
    psc: "M1FD",
    offers: 2,
    extent: "Competed under Simplified Acquisition Procedures",
    setAside: SB_SETASIDE,
    subPlan: null,
    bench: { distinct: 2, repeat: 1, subs: [[4003, 1]] },
  },

  // ── Hatteras Culinary Contractors (4011) ───────────────────────────────
  {
    id: "N40085-24-C-0207",
    title: "Mess attendant services, Joint Expeditionary Base Little Creek",
    winner: 4011,
    agency: "littleCreek",
    obligated: 2_200_000,
    startedDaysAgo: 910,
    endsInDays: 180,
    city: "Virginia Beach",
    state: "VA",
    naics: "722310",
    workType: "Dishwashing, serving lines and cleaning in galleys",
    psc: "M1FD",
    offers: 6,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 3, repeat: 1, subs: [[4008, 1], [4007, 1]] },
  },

  // ── Companies that are not partners for Amira ──────────────────────────
  {
    id: "36C24724D0031",
    title: "Patient and retail dining, VA Salisbury Health Care",
    winner: 4101,
    agency: "vaNco6",
    obligated: 5_800_000,
    startedDaysAgo: 745,
    endsInDays: 500,
    city: "Salisbury",
    state: "NC",
    naics: "722310",
    workType: "Patient meals and a retail cafe",
    psc: "M1FD",
    offers: 5,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Plan on file",
    bench: null,
  },
  {
    id: "36C24723C0152",
    title: "Hospital nutrition services, VA Durham Health Care",
    winner: 4102,
    agency: "vaNco6",
    obligated: 14_200_000,
    startedDaysAgo: 1120,
    endsInDays: 520,
    city: "Durham",
    state: "NC",
    naics: "722310",
    workType: "A whole hospital's patient meals",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: "Plan on file",
    bench: null,
  },
  {
    id: "W91247-22-C-0018",
    title: "Field rations and feeding support, Fort Bragg",
    winner: 4103,
    agency: "braggMicc",
    obligated: 11_900_000,
    startedDaysAgo: 1620,
    endsInDays: 260,
    city: "Fort Bragg",
    state: "NC",
    naics: "722310",
    workType: "Field feeding for large exercises",
    psc: "M1FD",
    offers: 3,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: "Plan on file",
    bench: { distinct: 14, repeat: 6, subs: [[4002, 2], [4010, 1]] },
  },
  {
    id: "HE125424F0066",
    title: "Cafeteria service, DoDEA schools, Fort Bragg",
    winner: 4104,
    agency: "dodea",
    obligated: 2_600_000,
    startedDaysAgo: 780,
    endsInDays: 410,
    city: "Fort Bragg",
    state: "NC",
    naics: "722310",
    workType: "School cafeterias",
    psc: "M1FD",
    offers: 4,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 2, repeat: 0, subs: [[4010, 1]] },
  },
  {
    id: "W91247-25-C-0090",
    title: "Facilities support including kitchen equipment upkeep, Fort Bragg",
    winner: 4101,
    agency: "braggMicc",
    obligated: 2_400_000,
    startedDaysAgo: 520,
    city: "Fort Bragg",
    state: "NC",
    naics: "561210",
    workType: "Building and kitchen equipment upkeep",
    psc: "S216",
    offers: 5,
    extent: FULL_OPEN,
    setAside: null,
    subPlan: "Plan on file",
    bench: null,
  },
  {
    id: "W912JF-24-F-0140",
    title: "Dining facility cleaning, Fort Jackson",
    winner: 4101,
    agency: "fortJackson",
    obligated: 780_000,
    startedDaysAgo: 700,
    city: "Columbia",
    state: "SC",
    naics: "561720",
    workType: "Cleaning dining halls",
    psc: "S201",
    offers: 6,
    extent: FULL_OPEN,
    setAside: SB_SETASIDE,
    subPlan: null,
    bench: null,
  },
  {
    id: "W912HN-25-C-0071",
    title: "Dining facility services, Fort Stewart",
    winner: 4007,
    agency: "fortStewart",
    obligated: 4_300_000,
    startedDaysAgo: 560,
    endsInDays: 700,
    city: "Hinesville",
    state: "GA",
    naics: "722310",
    workType: "Running Army dining halls",
    psc: "M1FD",
    offers: 4,
    extent: AFTER_EXCL,
    setAside: SB_SETASIDE,
    subPlan: "Not required (small business prime)",
    bench: { distinct: 6, repeat: 2, subs: [[4009, 1], [4005, 1], [4011, 1]] },
  },
];

type AnySeed = AwardSeed<string>;

// DEMO: two members. The agency's awards and buyers are in src/demo/members/agency/market/awards.ts.
const SEEDS: readonly AnySeed[] = byMember<readonly AnySeed[]>({ agency: agencyMarket.AWARD_SEEDS, caterer: CATERER_SEEDS });
const BUYERS: Record<string, Agency> = byMember<Record<string, Agency>>({ agency: agencyMarket.AWARD_AGENCIES, caterer: AGENCIES });
const BUYER_LABELS: Record<string, string> = byMember<Record<string, string>>({
  agency: agencyMarket.AWARD_AGENCY_LABEL,
  caterer: AGENCY_LABEL,
});

export const AWARD_SEEDS: readonly AnySeed[] = SEEDS;

/** The buyer of an award in a sentence ("the Army contracting office at Fort Bragg"), or null. */
export function buyerLabelOf(award: { agency: { abbrev: string | null } }): string | null {
  const id = Object.keys(BUYERS).find((k) => BUYERS[k].abbrev === award.agency.abbrev);
  return id ? BUYER_LABELS[id] : null;
}

/** Whole days between two ISO dates (a later than b gives a positive number). */
function daysBetween(laterIso: string, earlierIso: string): number {
  return Math.round((new Date(laterIso).getTime() - new Date(earlierIso).getTime()) / 86_400_000);
}

function startedOn(s: AnySeed): string {
  if (s.startedOn) return s.startedOn;
  return calendarDay(-(s.startedDaysAgo ?? 365));
}

function benchOf(s: AnySeed): AwardBench | null {
  if (!s.bench) return null;
  return {
    distinctSubs: s.bench.distinct,
    repeatSubs: s.bench.repeat,
    sampleSubs: s.bench.subs.map(([key, awards]) => {
      const f = anyFirmByKey(key)!;
      return { name: f.name, uei: f.uei, awards };
    }),
  };
}

/** The Army is already taking bids for the next Fort Bragg dining contract. The days come from the story's notice. */
function catererOpenNowNote(): string {
  const notice = getOpportunity(CATERER_HERO.teamUp)!;
  return `The Army is taking bids for this job again now. Proposals are due in ${notice.closesInDays} days. Grant says to bid as a subcontractor.`;
}

const openNowNote: (awardId: string) => string | undefined = byMember({
  agency: agencyMarket.openNowNote,
  caterer: () => catererOpenNowNote(),
});

/** The award as the page reads it, with recency counted from today. */
export function toAwardRecord(s: AnySeed): AwardRecord {
  const winner = anyFirmByKey(s.winner)!;
  const agency = BUYERS[s.agency];
  const awardedAt = startedOn(s);
  const days = Math.max(0, daysBetween(calendarDay(0), awardedAt));
  const recompeteAt = s.endsOn ?? (s.endsInDays !== undefined ? calendarDay(s.endsInDays) : null);
  const note = s.rebidIsOpen ? openNowNote(s.id) : undefined;
  const months = recompeteAt ? daysToDay(recompeteAt) / 30 : null;
  return {
    awardId: s.id,
    title: s.title,
    solicitationId: s.solicitationId ?? null,
    winner: { name: winner.name, uei: winner.uei, awardeeKey: winner.key, parentUei: null },
    agency: { name: agency.name, abbrev: agency.abbrev, isDefense: agency.isDefense },
    obligated: s.obligated,
    currentValue: s.currentValue ?? s.obligated,
    ceiling: s.ceiling ?? s.obligated,
    recency: {
      awardedAt,
      daysSinceAward: days,
      justAwarded: days <= 90,
      comingUpAgain: months !== null && months > 0 && months <= 12,
      recompeteAt,
      ...(note ? { openNowNote: note } : {}),
      reportingLagNote: agency.isDefense
        ? "Defense awards are usually published about three months after they are signed, so this job may be older than it looks."
        : "Awards are usually published about a month after they are signed, so this may be a little older than it looks.",
    },
    location: { city: s.city, state: s.state },
    naicsCode: s.naics,
    workType: s.workType,
    pscCode: s.psc,
    offersReceived: s.offers,
    extentCompeted: s.extent,
    setAside: s.setAside,
    subcontractingPlan: s.subPlan,
    bench: benchOf(s),
    sourceUrl: null,
  };
}

export function allAwardRecords(): AwardRecord[] {
  return SEEDS.map(toAwardRecord);
}

export function findAwardRecord(awardId: string): AwardRecord | null {
  const s = SEEDS.find((x) => x.id === awardId);
  return s ? toAwardRecord(s) : null;
}

/** Awards that one company won. */
export function awardsWonBy(awardeeKey: number): AwardRecord[] {
  return allAwardRecords().filter((a) => a.winner.awardeeKey === awardeeKey);
}

/** The subcontract that links Amira to Carolina Dining Group (persona.ts). */
export const AMIRA_SUBCONTRACT = cdgSub;
