// Labor pricing seed data for a food service business in Fayetteville, NC.
// DEMO: the wage data was replaced with food service rates. The rates below are sample figures
// in the shape of a Service Contract Act wage determination (the legal minimum pay on
// federal service contracts), plus sample hourly benchmarks for professional services.

// DEMO: two members. The agency's rates (all real: SCA wage determination, GSA CALC+)
// are in src/demo/members/agency/market/laborRates.ts. The exports below pick one.

import { dateDaysFromNow } from "@/demo/story/clock";
import { byMember } from "@/demo/member";
import * as agency from "@/demo/members/agency/market/laborRates";

export interface PrevailingWage {
  trade: string;
  baseHourly: number;
  fringeHourly: number;
  // total = base + fringe
  notes?: string;
}

// Cumberland County, NC. Sample figures in the shape of a wage determination.
// Health and welfare is the same for every title, as on a real determination.
const HEALTH_AND_WELFARE = 5.36;

const CATERER_WAGES: PrevailingWage[] = [
  { trade: "Cook I", baseHourly: 15.12, fringeHourly: HEALTH_AND_WELFARE, notes: "Line cook, prep cook, short-order" },
  { trade: "Cook II", baseHourly: 17.4, fringeHourly: HEALTH_AND_WELFARE, notes: "Lead cook, diet kitchen, therapeutic menus" },
  { trade: "Food Service Worker", baseHourly: 12.8, fringeHourly: HEALTH_AND_WELFARE, notes: "Serving line, salad bar, tray assembly" },
  { trade: "Dishwasher / Kitchen Helper", baseHourly: 12.8, fringeHourly: HEALTH_AND_WELFARE, notes: "Paid at the food service worker rate" },
  { trade: "Dining Facility Attendant", baseHourly: 13.25, fringeHourly: HEALTH_AND_WELFARE, notes: "Dining room setup, cleaning, sanitizing" },
  { trade: "Food Service Supervisor", baseHourly: 21.6, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Delivery Driver (Light Truck)", baseHourly: 14.95, fringeHourly: HEALTH_AND_WELFARE, notes: "Refrigerated van, same-day delivery" },
];

const CATERER_WAGE_META = {
  county: "Cumberland County, NC",
  determination: "2015-5213, Rev. 31 (sample)",
  effectiveDate: dateDaysFromNow(-200),
  source: "U.S. Dept. of Labor — Service Contract Act wage determinations (sample)",
};

// Comparable awarded food service jobs in the region. Each links to an award on the Awards page.
export interface ComparableAward {
  awardId: string; // matches an award id in src/demo/explore/awardsData.ts
  title: string;
  agency: string;
  awardValue: number;
  /** How the job is priced, in plain words. */
  unitNote: string;
  location: string;
}

const CATERER_COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "FA4800-26-P-0007",
    title: "Lodging breakfast service, Seymour Johnson AFB",
    agency: "Air Force / 4th Contracting Squadron",
    awardValue: 180_700,
    unitNote: "About 60 guests a day, about $8.25 per breakfast",
    location: "Goldsboro, NC",
  },
  {
    awardId: "W81K04-24-P-0187",
    title: "Patient meal support: Womack Army Medical Center",
    agency: "Army / Womack Army Medical Center",
    awardValue: 126_000,
    unitNote: "About 75 therapeutic trays a day, about $8.50 per tray",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "W9124M-25-P-0074",
    title: "Ceremony and official function catering, Pope Army Airfield",
    agency: "Air Force / 43rd Air Mobility Operations Group",
    awardValue: 295_000,
    unitNote: "Orders as needed, about $38 per guest at 600-guest dinners",
    location: "Pope Army Airfield, NC",
  },
  {
    awardId: "N40085-24-C-0112",
    title: "Mess attendant services, MCB Camp Lejeune",
    agency: "Navy / NAVFAC Mid-Atlantic",
    awardValue: 1_200_000,
    unitNote: "Priced by labor hour, about $24.50 an hour billed",
    location: "Jacksonville, NC",
  },
];

// ── Professional service labor rates (sample benchmarks) ───────────────
export type ExperienceTier = "0–3 yrs" | "3–7 yrs" | "7–15 yrs" | "15+ yrs";
export type EducationLevel = "HS" | "Associate" | "Bachelor" | "Master" | "PhD";

export type LcatLocation = "Nationwide" | "Fayetteville" | "Raleigh-Durham" | "Charlotte" | "Norfolk";

export interface LcatRate {
  id: string;
  category: string;
  experience: ExperienceTier;
  education: EducationLevel;
  location: LcatLocation;
  low: number; // fully-burdened hourly $
  median: number;
  high: number;
}

// Sample benchmark rates for the roles a food service contractor bills by the hour.
const CATERER_LCAT_RATES: LcatRate[] = [
  { id: "lcat-site-mgr-sr", category: "Food Service Site Manager (Sr)", experience: "7–15 yrs", education: "Bachelor", location: "Fayetteville", low: 68, median: 82, high: 104 },
  { id: "lcat-site-mgr", category: "Food Service Site Manager", experience: "3–7 yrs", education: "Associate", location: "Fayetteville", low: 52, median: 64, high: 79 },
  { id: "lcat-exec-chef", category: "Executive Chef", experience: "7–15 yrs", education: "Associate", location: "Raleigh-Durham", low: 58, median: 71, high: 90 },
  { id: "lcat-dietitian", category: "Registered Dietitian", experience: "3–7 yrs", education: "Bachelor", location: "Fayetteville", low: 62, median: 76, high: 95 },
  { id: "lcat-qa-haccp", category: "Quality Assurance Manager (HACCP)", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 66, median: 81, high: 102 },
  { id: "lcat-cook-lead", category: "Lead Cook", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 31, median: 38, high: 47 },
  { id: "lcat-cook", category: "Cook", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 26, median: 31, high: 38 },
  { id: "lcat-fsw", category: "Food Service Worker", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 22, median: 26, high: 32 },
  { id: "lcat-catering-coord", category: "Catering Coordinator", experience: "3–7 yrs", education: "Associate", location: "Charlotte", low: 42, median: 52, high: 66 },
  { id: "lcat-driver", category: "Delivery Driver", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 25, median: 30, high: 37 },
  { id: "lcat-admin", category: "Administrative Assistant", experience: "3–7 yrs", education: "HS", location: "Nationwide", low: 38, median: 52, high: 68 },
  { id: "lcat-galley-mgr", category: "Galley / Dining Hall Manager", experience: "7–15 yrs", education: "Associate", location: "Norfolk", low: 60, median: 74, high: 93 },
];

/** The wage floor table: the caterer's sample determination, or the agency's real one. */
export const PREVAILING_WAGES_CUMBERLAND_NC: PrevailingWage[] = byMember({
  agency: agency.PREVAILING_WAGES,
  caterer: CATERER_WAGES,
});
export const PREVAILING_WAGE_META = byMember({ agency: agency.PREVAILING_WAGE_META, caterer: CATERER_WAGE_META });
/** Comparable awarded jobs in the member's trade. Each links to an award on the Awards page. */
export const COMPARABLE_FOOD_AWARDS: ComparableAward[] = byMember({
  agency: agency.COMPARABLE_AWARDS,
  caterer: CATERER_COMPARABLE_AWARDS,
});
export const LCAT_RATES: LcatRate[] = byMember({ agency: agency.LCAT_RATES, caterer: CATERER_LCAT_RATES });

export function fmtRate(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
