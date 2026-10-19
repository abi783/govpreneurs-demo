// THE AGENCY's labor pricing (read through src/lib/mock/laborRates.ts, which picks the
// active member). Every rate is real:
//
// 1. The wage floor: the Service Contract Act wage determination for Cumberland and
//    Hoke counties, NC, WD 2015-4377, Revision 33 (20 Aug 2026), for the creative
//    titles it lists. Health and welfare is $5.92 an hour ($5.42 where Executive Order
//    13706 paid sick leave applies). https://sam.gov/wage-determination/2015-4377/33
//    (raw text: https://sam.gov/api/prod/wdol/v1/wd/2015-4377/33)
// 2. Comparable awards: the award record in awards.ts (each modeled on a real award).
// 3. Labor categories: GSA CALC+ ceiling rates, current year, pulled 19 Oct 2026,
//    for rows on the Marketing and Public Relations SINs (541810, 541430, 541613,
//    512110, 541910, 541820). Low = 25th percentile, median, high = 75th percentile.
//    Education is the most common stated minimum; experience is the median minimum.
//    https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/?keyword=graphic%20designer&page=1&page_size=500
// 4. Local pay: BLS Occupational Employment and Wage Statistics, May 2025, Fayetteville
//    NC metro area (22180): graphic designers' median wage $23.63 an hour (series
//    OEUM002218000000027102408). https://data.bls.gov/oes/

import type { ComparableAward, LcatRate, PrevailingWage } from "@/lib/mock/laborRates";

const HEALTH_AND_WELFARE = 5.92;

export const PREVAILING_WAGES: PrevailingWage[] = [
  { trade: "Graphic Artist", baseHourly: 23.63, fringeHourly: HEALTH_AND_WELFARE, notes: "Layouts, production art and social graphics" },
  { trade: "Illustrator II", baseHourly: 25.81, fringeHourly: HEALTH_AND_WELFARE, notes: "Designs ads and infographics from a brief" },
  { trade: "Illustrator III", baseHourly: 31.57, fringeHourly: HEALTH_AND_WELFARE, notes: "Leads the design work on a campaign" },
  { trade: "Photographer II", baseHourly: 19.35, fringeHourly: HEALTH_AND_WELFARE, notes: "Event and portrait shoots" },
  { trade: "Photographer III", baseHourly: 23.97, fringeHourly: HEALTH_AND_WELFARE, notes: "Planned shoots, lighting and editing" },
  { trade: "Photographer IV", baseHourly: 29.33, fringeHourly: HEALTH_AND_WELFARE, notes: "Senior photographer or videographer" },
  { trade: "Media Specialist II", baseHourly: 20.83, fringeHourly: HEALTH_AND_WELFARE, notes: "Runs audiovisual and media equipment" },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland County, NC",
  determination: "WD 2015-4377, Rev. 33",
  effectiveDate: "2026-08-20",
  source: "U.S. Dept. of Labor — Service Contract Act wage determination (SAM.gov)",
};

export const COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "W91247-19-P-1874",
    title: "Print and digital advertisements, Army Community Service, Fort Bragg",
    agency: "Army / MICC Fort Bragg",
    awardValue: 356_624,
    unitNote: "Two years of weekly print and digital ads, about $178K a year",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "W91242-25-P-A118",
    title: "Digital recruiting campaign: NC Army National Guard (yours)",
    agency: "Army / NC Army National Guard",
    awardValue: 86_400,
    unitNote: "12 months of videos, geofenced ads and lead routing, $7,200 a month",
    location: "Raleigh, NC",
  },
  {
    awardId: "H92257-25-P-0041",
    title: "Geofencing and lead-generation recruiting campaign, MARSOC",
    agency: "Special Operations / MARSOC",
    awardValue: 129_712,
    unitNote: "The first year; up to $688K with the option years",
    location: "Camp Lejeune, NC",
  },
  {
    awardId: "36C24626P2971",
    title: "Patient-education and outreach video production, Durham VA",
    agency: "VA / Network Contracting Office 6",
    awardValue: 200_000,
    unitNote: "The first year; up to $800K with the option years",
    location: "Durham, NC",
  },
];

// GSA CALC+ ceiling rates on the marketing SINs: 25th percentile, median, 75th percentile.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-account-director", category: "Account Director", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 179.73, median: 205.8, high: 230.57 },
  { id: "lcat-creative-director", category: "Creative Director", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 154.25, median: 185.53, high: 217.88 },
  { id: "lcat-art-director", category: "Art Director", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 122.59, median: 145.95, high: 167.86 },
  { id: "lcat-project-manager", category: "Project Manager (marketing)", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 119.72, median: 144.63, high: 177.22 },
  { id: "lcat-account-executive", category: "Account Executive", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 107.06, median: 129.81, high: 157.88 },
  { id: "lcat-copywriter", category: "Copywriter", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 105.58, median: 133.53, high: 153.05 },
  { id: "lcat-video-producer", category: "Video Producer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 100.78, median: 123.56, high: 138.62 },
  { id: "lcat-video-editor", category: "Video Editor", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 85.12, median: 93.13, high: 108.61 },
  { id: "lcat-graphic-designer", category: "Graphic Designer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 87.58, median: 108.61, high: 132.93 },
  { id: "lcat-media-buyer", category: "Media Buyer / Media Planner", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 98.72, median: 121.23, high: 146.6 },
  { id: "lcat-social-media", category: "Social Media Manager / Specialist", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 102.87, median: 125.5, high: 142.02 },
  { id: "lcat-digital-marketing", category: "Digital Marketing Specialist", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 131.52, median: 151.49, high: 167.12 },
  { id: "lcat-web-developer", category: "Web Developer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 113.01, median: 138.08, high: 164.55 },
];

/** BLS, May 2025: a Fayetteville graphic designer's median pay, an hour. */
export const LOCAL_DESIGNER_MEDIAN = 23.63;
