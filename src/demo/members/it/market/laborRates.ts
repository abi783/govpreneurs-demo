// THE IT SERVICES FIRM's labor pricing (read through src/lib/mock/laborRates.ts, which
// picks the active member). Source: demo-storyboard/it-services-pack.md, section 13,
// "Labor rates". Every rate is real:
//
// 1. The wage floor: the Service Contract Act wage determination for Cumberland and
//    Hoke counties, NC, WD 2015-4377, Revision 33 (20 Aug 2026), for the computer
//    titles it lists. Health and welfare is $5.92 an hour ($5.42 where Executive Order
//    13706 paid sick leave applies). Analysts and programmers paid $27.63 an hour or
//    more are exempt; help-desk techs are covered.
//    https://sam.gov/wage-determination/2015-4377/33
//    (raw text: https://sam.gov/api/prod/wdol/v1/wd/2015-4377/33)
// 2. Comparable awards: the award record in awards.ts (each modeled on a real award).
// 3. Labor categories: GSA CALC+ ceiling rates on SIN 54151S, current year, no
//    clearance, pulled 19 Oct 2026. Low = 25th percentile, median, high = 75th
//    percentile. Education and experience are the most common stated minimum.
//    https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/?keyword=help%20desk&filter=sin:54151S
// 4. Local pay: BLS Occupational Employment and Wage Statistics, May 2025, Fayetteville
//    NC metro area (22180): computer user support specialists' median $27.76 an hour
//    (series OEUM002218000000015123208). https://api.bls.gov/publicAPI/v1/timeseries/data/

import type { ComparableAward, LcatRate, PrevailingWage } from "@/lib/mock/laborRates";

const HEALTH_AND_WELFARE = 5.92;

export const PREVAILING_WAGES: PrevailingWage[] = [
  { trade: "Personal Computer Support Technician", baseHourly: 37.5, fringeHourly: HEALTH_AND_WELFARE, notes: "Walk-up, phone and desk-side support; the help desk's main title" },
  { trade: "System Support Specialist", baseHourly: 41.53, fringeHourly: HEALTH_AND_WELFARE, notes: "Tier 2 and the site lead's hands-on work" },
  { trade: "Computer Operator I", baseHourly: 27.06, fringeHourly: HEALTH_AND_WELFARE, notes: "Imaging, asset tags and simple tickets" },
  { trade: "Computer Operator II", baseHourly: 30.27, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Computer Operator III", baseHourly: 33.76, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Computer Operator IV", baseHourly: 37.5, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Computer Operator V", baseHourly: 41.53, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Peripheral Equipment Operator", baseHourly: 27.06, fringeHourly: HEALTH_AND_WELFARE, notes: "Printers, scanners and video-conference gear" },
  { trade: "Computer Programmer I", baseHourly: 24.97, fringeHourly: HEALTH_AND_WELFARE, notes: "Exempt once paid $27.63 an hour or more" },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland and Hoke counties, NC",
  determination: "WD 2015-4377, Rev. 33",
  effectiveDate: "2026-08-20",
  source: "U.S. Dept. of Labor — Service Contract Act wage determination (SAM.gov)",
};

export const COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "W9124724C9002",
    title: "TAC/C4 signal readiness support, Army Reserve headquarters",
    agency: "Army / MICC Fort Bragg",
    awardValue: 10_100_000,
    unitNote: "An 8(a) competition with 6 offers; about $2M a year over five years",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "W9124726P0388",
    title: "Windows 11 upgrade surge, XVIII Airborne Corps (you lost on price)",
    agency: "Army / MICC Fort Bragg",
    awardValue: 165_540,
    unitNote: "Lowest price won; every tech priced at exactly the wage floor",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "FA480924C0011",
    title: "Desktop support, Seymour Johnson AFB (yours)",
    agency: "Air Force / 4th Contracting Squadron",
    awardValue: 492_600,
    unitNote: "Two on-site techs and an imaging surge, about $164K a year",
    location: "Seymour Johnson AFB, NC",
  },
  {
    awardId: "H9240324C0011",
    title: "\"Labor for seats\" end-user support, Special Operations Command",
    agency: "Special Operations / USSOCOM",
    awardValue: 5_600_000,
    unitNote: "Help-desk and desktop techs priced by the seat; an 8(a) competition with 6 offers",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "W9124725FA102",
    title: "IT and information-sharing services, XVIII Airborne Corps",
    agency: "Army / MICC Fort Bragg",
    awardValue: 872_000,
    unitNote: "An ITES-3S task order that drew 12 offers",
    location: "Fort Bragg, NC",
  },
];

// GSA CALC+ ceiling rates on SIN 54151S, no clearance: 25th percentile, median, 75th percentile.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-help-desk", category: "Help Desk Specialist", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 61.91, median: 80.09, high: 103.55 },
  { id: "lcat-service-desk", category: "Service Desk Analyst", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 53.28, median: 70.97, high: 96.9 },
  { id: "lcat-desktop-tech", category: "Desktop Support Technician", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 52.03, median: 63.05, high: 77.44 },
  { id: "lcat-network-admin", category: "Network Administrator", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 89.38, median: 109.13, high: 134.79 },
  { id: "lcat-systems-admin", category: "Systems Administrator", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 91.64, median: 112.98, high: 137.57 },
  { id: "lcat-network-engineer", category: "Network Engineer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 103.8, median: 128.49, high: 157.65 },
  { id: "lcat-cyber-analyst", category: "Cybersecurity Analyst", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 110.15, median: 129.58, high: 153.03 },
  { id: "lcat-sharepoint", category: "SharePoint Administrator / Developer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 103.2, median: 121.05, high: 148.8 },
  { id: "lcat-task-lead", category: "Task Lead (site lead)", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 118.87, median: 135.28, high: 164.02 },
  { id: "lcat-it-pm", category: "IT Project Manager", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 127.38, median: 154.16, high: 185.05 },
];

/** BLS, May 2025: a Fayetteville computer support specialist's median pay, an hour. (The name is the agency's export.) */
export const LOCAL_DESIGNER_MEDIAN = 27.76;
