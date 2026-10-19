// THE CONTRACTOR's labor pricing (read through src/lib/mock/laborRates.ts, which picks
// the active member). Source: demo-storyboard/construction-pack.md, "Wage rules".
// Every rate is real:
//
// 1. The wage floor: Davis-Bacon general wage decision NC20260122, Mod 1 (18 May 2026),
//    Building, Cumberland and Hoke counties, NC. It has no HVAC mechanic class;
//    unlisted classes are added after award (29 CFR 5.5(a)(1)(iii)).
//    https://sam.gov/wage-determination/NC20260122/1
//    (raw text: https://sam.gov/api/prod/wdol/v1/wd/NC20260122/1)
// 2. Comparable awards: the award record in awards.ts (each modeled on a real award).
// 3. Local pay: BLS Occupational Employment and Wage Statistics, May 2025, Fayetteville
//    NC metro area (22180), hourly: low = 25th percentile, median, high = 75th
//    percentile (series OEUM0022180000000<SOC><07|08|09>, pulled 19 Oct 2026).
//    https://api.bls.gov/publicAPI/v2/timeseries/data/
//    Education and experience are the usual entry for each trade, not from BLS.
//
// Base rates sit below local medians, but the pipefitter package ($47.44 an hour)
// is far above local plumber and pipefitter pay. NC has no state prevailing-wage
// law, so school and university jobs pay market wages.

import type { ComparableAward, LcatRate, PrevailingWage } from "@/lib/mock/laborRates";

export const PREVAILING_WAGES: PrevailingWage[] = [
  { trade: "Electrician", baseHourly: 22.15, fringeHourly: 5.93, notes: "Panels, switchboards, feeders and controls wiring" },
  { trade: "Pipefitter", baseHourly: 33.96, fringeHourly: 13.48, notes: "Price refrigerant and chilled-water piping here until the contracting officer names the class" },
  { trade: "Sheet Metal Worker", baseHourly: 19.67, fringeHourly: 13.27, notes: "Ductwork and air handler connections" },
  { trade: "Plumber", baseHourly: 23.4, fringeHourly: 0, notes: "Domestic water and drains" },
  { trade: "Carpenter", baseHourly: 19.8, fringeHourly: 4.89, notes: "Framing, ceilings and patching after the trades" },
  { trade: "Ironworker", baseHourly: 29.75, fringeHourly: 18, notes: "Steel supports and frames for new equipment" },
  { trade: "Painter", baseHourly: 15.55, fringeHourly: 1.05 },
  { trade: "Laborer (common)", baseHourly: 15, fringeHourly: 4.76, notes: "Demolition, cleanup and moving equipment" },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland and Hoke counties, NC",
  determination: "NC20260122, Mod 1 (Building)",
  effectiveDate: "2026-05-18",
  source: "U.S. Dept. of Labor — Davis-Bacon general wage decision (SAM.gov)",
};

export const COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "W912PM26C0017",
    title: "HVAC replacement, Special Operations building, Fort Bragg",
    agency: "Army / USACE Wilmington District",
    awardValue: 1_098_843,
    unitNote: "A HUBZone sealed bid; the lowest of 9 bids won",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "FA445225C0019",
    title: "HVAC and electrical repair, Pope office building (yours)",
    agency: "Air Force / 763 ESS, Pope Army Airfield",
    awardValue: 186_400,
    unitNote: "Six heat pumps and a new 400A panel, one of 5 offers",
    location: "Pope Army Airfield, NC",
  },
  {
    awardId: "36C24626C0093",
    title: "Replace auxiliary chiller, Fayetteville VA",
    agency: "VA / Network Contracting Office 6",
    awardValue: 682_942,
    unitNote: "One chiller and its pumps; 4 veteran-owned bids",
    location: "Fayetteville, NC",
  },
  {
    awardId: "6973GH24C00187",
    title: "HVAC upgrade, FAA radar site, Raeford",
    agency: "Transportation / FAA",
    awardValue: 215_808,
    unitNote: "A small job that drew 16 offers",
    location: "Raeford, NC",
  },
  {
    awardId: "FA445225P0057",
    title: "Electrical and bathroom repair, Pope Army Airfield",
    agency: "Air Force / 763 ESS, Pope Army Airfield",
    awardValue: 63_863,
    unitNote: "A small repair quote, one of 6 offers",
    location: "Pope Army Airfield, NC",
  },
];

// BLS local pay, Fayetteville metro, May 2025: 25th percentile, median, 75th percentile.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-construction-supervisor", category: "Construction trades supervisor", experience: "7–15 yrs", education: "HS", location: "Fayetteville", low: 28.7, median: 33.74, high: 40.84 },
  { id: "lcat-electrician", category: "Electrician", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 22.54, median: 27.74, high: 32.01 },
  { id: "lcat-hvac-mechanic", category: "HVAC mechanic and installer", experience: "3–7 yrs", education: "Associate", location: "Fayetteville", low: 22.52, median: 27.03, high: 30.22 },
  { id: "lcat-plumber-pipefitter", category: "Plumber, pipefitter and steamfitter", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 21.68, median: 24.87, high: 29.92 },
  { id: "lcat-carpenter", category: "Carpenter", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 20.5, median: 22.5, high: 27.31 },
  { id: "lcat-sheet-metal", category: "Sheet metal worker", experience: "3–7 yrs", education: "HS", location: "Fayetteville", low: 21.84, median: 22.12, high: 26.69 },
  { id: "lcat-painter", category: "Painter (construction)", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 16.87, median: 20, high: 22.51 },
  { id: "lcat-laborer", category: "Construction laborer", experience: "0–3 yrs", education: "HS", location: "Fayetteville", low: 17.31, median: 21.03, high: 23.41 },
];

/** BLS, May 2025: a Fayetteville electrician's median pay, an hour. (The name is the agency's export.) */
export const LOCAL_DESIGNER_MEDIAN = 27.74;
