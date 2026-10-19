// THE TRUCKING COMPANY's labor pricing (read through src/lib/mock/laborRates.ts, which
// picks the active member). Source: demo-storyboard/trucking-pack.md, "Wage rules".
// Every rate is real:
//
// 1. The wage floor: Service Contract Act wage determination 2015-4377, Rev. 33
//    (20 Aug 2026), Cumberland and Hoke counties, NC. Health and welfare is $5.92 an
//    hour for every title ($5.42 where EO 13706 paid sick leave applies). FAR 52.222-43
//    raises the price when a new determination comes with an option year.
//    https://sam.gov/wage-determination/2015-4377/33
//    (raw text: https://sam.gov/api/prod/wdol/v1/wd/2015-4377/33)
// 2. Comparable awards: the award record in awards.ts (each modeled on a real award).
// 3. Local pay: BLS Occupational Employment and Wage Statistics, May 2025, Fayetteville
//    NC metro area (22180), hourly: low = 25th percentile, median, high = 75th
//    percentile (series OEUM0022180000000<SOC><07|08|09>, pulled 19 Oct 2026).
//    https://api.bls.gov/publicAPI/v2/timeseries/data/
//    Experience and education are the usual entry for each job, not from BLS.
//
// The heavy-truck floor ($24.03) is the local median, so a driver paid the floor is
// paid what the market pays. Grant prices the 26-ft box trucks as Heavy, the safe
// reading (the pack could not verify the SCA's tonnage cut-offs).

import type { ComparableAward, LcatRate, PrevailingWage } from "@/lib/mock/laborRates";

const HW = 5.92;

export const PREVAILING_WAGES: PrevailingWage[] = [
  { trade: "Truckdriver, Heavy (31363)", baseHourly: 24.03, fringeHourly: HW, notes: "Price the 26-ft box trucks here, the safe reading" },
  { trade: "Truckdriver, Tractor-Trailer (31364)", baseHourly: 24.03, fringeHourly: HW, notes: "Dry-van and reefer truckload" },
  { trade: "Truckdriver, Medium (31362)", baseHourly: 20.11, fringeHourly: HW },
  { trade: "Truckdriver, Light (31361)", baseHourly: 18.83, fringeHourly: HW, notes: "The cargo van" },
  { trade: "Driver Courier (31043)", baseHourly: 17.52, fringeHourly: HW, notes: "Lab and pharmacy courier runs" },
  { trade: "Dispatcher, Motor Vehicle (01060)", baseHourly: 22.44, fringeHourly: HW },
  { trade: "Forklift Operator (21020)", baseHourly: 24.74, fringeHourly: HW },
  { trade: "Material Handling Laborer (21050)", baseHourly: 18.03, fringeHourly: HW, notes: "Helpers on furniture moves" },
  { trade: "Motor Vehicle Mechanic (05190)", baseHourly: 22.53, fringeHourly: HW },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland and Hoke counties, NC",
  determination: "WD 2015-4377, Rev. 33",
  effectiveDate: "2026-08-20",
  source: "U.S. Dept. of Labor — Service Contract Act wage determination (SAM.gov)",
};

export const COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "W9124725PA044",
    title: "On-call trailer and container hauling, 18th Airborne Corps (yours)",
    agency: "Army / MICC Fort Bragg",
    awardValue: 41_400,
    unitNote: "46 on-call moves in 12 months, about $900 a move",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "M6700122P1187",
    title: "On-call trailer transport, Camp Lejeune",
    agency: "Navy / MCB Camp Lejeune",
    awardValue: 164_400,
    unitNote: "Four years of on-call moves, about $41K a year; one of 5 quotes",
    location: "Camp Lejeune, NC",
  },
  {
    awardId: "36C24622P0031",
    title: "Chilled freight routes, Hampton VA to eight sites",
    agency: "VA / Network Contracting Office 6",
    awardValue: 1_481_323,
    unitNote: "Weekly routes for five years, about $296K a year; 2 veteran-owned quotes",
    location: "Hampton, VA",
  },
  {
    awardId: "36C24626P1893",
    title: "Lab specimen courier, Durham VA",
    agency: "VA / Network Contracting Office 6",
    awardValue: 251_916,
    unitNote: "Scheduled and rush courier runs",
    location: "Durham, NC",
  },
  {
    awardId: "W9124721P9617",
    title: "Barracks furniture removal, Fort Bragg",
    agency: "Army / MICC Fort Bragg",
    awardValue: 24_782,
    unitNote: "A box-truck job that drew 8 quotes; an out-of-state mover won",
    location: "Fort Bragg, NC",
  },
];

// BLS local pay, Fayetteville metro, May 2025: 25th percentile, median, 75th percentile.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-heavy-truck-driver", category: "Heavy and tractor-trailer truck driver", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 22.09, median: 24.03, high: 28.35 },
  { id: "lcat-light-truck-driver", category: "Light truck driver", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 14.14, median: 18.83, high: 21.68 },
  { id: "lcat-courier", category: "Courier", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 16.54, median: 17.57, high: 19.81 },
  { id: "lcat-dispatcher", category: "Dispatcher", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 19.66, median: 21.96, high: 26.87 },
  { id: "lcat-truck-mechanic", category: "Truck and diesel mechanic", experience: "3–7 yrs", education: "Associate", location: "Fayetteville", low: 21.69, median: 26.81, high: 29.98 },
  { id: "lcat-mover-helper", category: "Laborer and freight mover", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 15.88, median: 18.03, high: 19.66 },
];

/** BLS, May 2025: a Fayetteville heavy-truck driver's median pay, an hour. (The name is the agency's export.) */
export const LOCAL_DESIGNER_MEDIAN = 24.03;
