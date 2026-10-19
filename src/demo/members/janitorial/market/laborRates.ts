// THE JANITORIAL FIRM's labor pricing (read through src/lib/mock/laborRates.ts, which
// picks the active member). Source: demo-storyboard/janitorial-pack.md, "Wage rules".
// Every rate is real:
//
// 1. The wage floor: the Service Contract Act wage determination for Cumberland and
//    Hoke counties, NC, WD 2015-4377, Revision 33 (20 Aug 2026). Health and welfare
//    is $5.92 an hour ($5.42 where Executive Order 13706 paid sick leave applies).
//    The WD has no floor-care title, so floor techs are priced as janitors.
//    https://sam.gov/wage-determination/2015-4377/33
//    (raw text: https://sam.gov/api/prod/wdol/v1/wd/2015-4377/33)
// 2. Comparable awards: the award record in awards.ts (each modeled on a real award).
// 3. Local pay: BLS Occupational Employment and Wage Statistics, May 2025, Fayetteville
//    NC metro area (22180), hourly: low = 25th percentile, median, high = 75th
//    percentile (series OEUM0022180000000<SOC><07|08|09>, pulled 19 Oct 2026).
//    https://api.bls.gov/publicAPI/v2/timeseries/data/
//    Education and experience are the usual entry for each job, not from BLS.
//
// The WD's janitor rate ($16.46) equals the local median janitor pay, and its General
// Maintenance Worker rate ($21.41) the local median maintenance worker pay: the
// determination is built from these medians. Health and welfare comes on top.

import type { ComparableAward, LcatRate, PrevailingWage } from "@/lib/mock/laborRates";

const HEALTH_AND_WELFARE = 5.92;

export const PREVAILING_WAGES: PrevailingWage[] = [
  { trade: "Janitor (11150)", baseHourly: 16.46, fringeHourly: HEALTH_AND_WELFARE, notes: "Night custodians, and floor techs too: this determination has no floor-care title" },
  { trade: "Housekeeping Aide (11122)", baseHourly: 16.46, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Window Cleaner (11360)", baseHourly: 17.89, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Laborer, Grounds Maintenance (11210)", baseHourly: 17.21, fringeHourly: HEALTH_AND_WELFARE, notes: "Mowing and trimming" },
  { trade: "Laborer (23470)", baseHourly: 18.03, fringeHourly: HEALTH_AND_WELFARE },
  { trade: "Gardener (11090)", baseHourly: 21.75, fringeHourly: HEALTH_AND_WELFARE },
  {
    trade: "General Maintenance Worker (23370)",
    baseHourly: 21.41,
    fringeHourly: HEALTH_AND_WELFARE,
    notes: "The class the Army listed for exterior washing in 2021. Ask which one it expects now",
  },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland and Hoke counties, NC",
  determination: "WD 2015-4377, Rev. 33",
  effectiveDate: "2026-08-20",
  source: "U.S. Dept. of Labor — Service Contract Act wage determination (SAM.gov)",
};

export const COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "W9124721P0093",
    title: "Pressure washing and sandblasting, Fort Bragg, 2021–2026",
    agency: "Army / MICC Fort Bragg",
    awardValue: 782_100,
    unitNote: "Five years at about 41¢ a square foot; a HUBZone quote, one of 6",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "FA480925F0123",
    title: "Dormitory pressure washing, Seymour Johnson AFB (yours)",
    agency: "Air Force / 4th Contracting Squadron",
    awardValue: 84_600,
    unitNote: "One call under your BPA: 14 dorms, stairwells and pads",
    location: "Seymour Johnson AFB, NC",
  },
  {
    awardId: "W912PM26PA068",
    title: "Custodial and refuse service, Jordan Lake",
    agency: "Army / USACE Wilmington District",
    awardValue: 38_900,
    unitNote: "A 9-month base; the lowest of 30 quotes won",
    location: "Moncure, NC",
  },
  {
    awardId: "H9242126PE044",
    title: "Floor stripping and restroom cleaning, SOF building",
    agency: "Defense / USSOCOM, Fort Bragg",
    awardValue: 9_871,
    unitNote: "A one-time job, one of 3 quotes",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "36C24626P2588",
    title: "Janitorial, Durham VA Medical Center",
    agency: "VA / Network Contracting Office 6",
    awardValue: 2_646_000,
    unitNote: "Veteran-owned only; 44 quotes",
    location: "Durham, NC",
  },
];

// BLS local pay, Fayetteville metro, May 2025: 25th percentile, median, 75th percentile.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-janitorial-supervisor", category: "Custodial supervisor", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 18.27, median: 22.59, high: 28.43 },
  { id: "lcat-maintenance-worker", category: "General maintenance worker", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 17.43, median: 21.41, high: 26.98 },
  { id: "lcat-grounds-worker", category: "Grounds maintenance worker", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 15.47, median: 17.21, high: 19.75 },
  { id: "lcat-janitor", category: "Janitor and floor tech", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 14.04, median: 16.46, high: 17.73 },
  { id: "lcat-housekeeper", category: "Housekeeping cleaner", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 13.32, median: 14.48, high: 15.93 },
];

/** BLS, May 2025: a Fayetteville janitor's median pay, an hour. (The name is the agency's export.) */
export const LOCAL_DESIGNER_MEDIAN = 16.46;
