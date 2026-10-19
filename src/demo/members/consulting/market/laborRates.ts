// THE CONSULTANT's labor pricing (read through src/lib/mock/laborRates.ts, which picks
// the active member). Source: demo-storyboard/consulting-pack.md, "Labor rates".
// Every rate is real:
//
// 1. The wage floor: the Service Contract Act wage determination for Cumberland and
//    Hoke counties, NC, WD 2015-4377, Revision 33 (20 Aug 2026), for the titles a
//    consulting and training job might use. Most consultants are exempt professionals
//    and not covered. Health and welfare is $5.92 an hour.
//    https://sam.gov/wage-determination/2015-4377/33
// 2. Comparable awards: the award record in awards.ts (each modeled on a real award).
// 3. Labor categories: GSA CALC+ ceiling rates, current year, pulled 19 Oct 2026, on
//    SINs 541611, 541612 and 611430. Low = 25th percentile, median, high = 75th.
//    Education and experience are the typical stated minimum. The Lean Six Sigma row
//    rests on 15 rates, so treat it as thin.
//    https://api.gsa.gov/acquisition/calc/v3/api/ceilingrates/?keyword=facilitator&page=1&page_size=500
// 4. Local pay: BLS OEWS, May 2025, Fayetteville NC metro (22180): management
//    analysts' median wage $48.94 an hour (series OEUM002218000000013111108).
//    https://data.bls.gov/oes/

import type { ComparableAward, LcatRate, PrevailingWage } from "@/lib/mock/laborRates";

const HEALTH_AND_WELFARE = 5.92;

export const PREVAILING_WAGES: PrevailingWage[] = [
  { trade: "Computer Based Training Specialist / Instructor", baseHourly: 35.23, fringeHourly: HEALTH_AND_WELFARE, notes: "Builds and teaches online courses" },
  { trade: "Technical Instructor / Course Developer", baseHourly: 32.4, fringeHourly: HEALTH_AND_WELFARE, notes: "Writes and teaches a course" },
  { trade: "Administrative Assistant", baseHourly: 32.13, fringeHourly: HEALTH_AND_WELFARE, notes: "Schedules cohorts and keeps records" },
  { trade: "Technical Instructor", baseHourly: 26.48, fringeHourly: HEALTH_AND_WELFARE, notes: "Teaches a course someone else wrote" },
  { trade: "Personnel Assistant (Employment) II", baseHourly: 22.18, fringeHourly: HEALTH_AND_WELFARE, notes: "HR paperwork and data entry" },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland and Hoke counties, NC",
  determination: "WD 2015-4377, Rev. 33",
  effectiveDate: "2026-08-20",
  source: "U.S. Dept. of Labor — Service Contract Act wage determination (SAM.gov)",
};

export const COMPARABLE_AWARDS: ComparableAward[] = [
  {
    awardId: "36C24622P2071",
    title: "Leadership training, Fayetteville VA",
    agency: "VA / Network Contracting Office 6",
    awardValue: 152_838,
    unitNote: "Supervisor classes for one VA system; an earlier round ran $195K a year",
    location: "Fayetteville, NC",
  },
  {
    awardId: "W91247-25-P-A061",
    title: "Lean review and staff training, Fort Bragg ACS (yours)",
    agency: "Army / MICC Fort Bragg",
    awardValue: 118_400,
    unitNote: "12 months: a Lean review, then classes for 40 staff",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "W9124725CA091",
    title: "Family Advocacy Program support, Fort Bragg ACS",
    agency: "Army / MICC Fort Bragg",
    awardValue: 225_761,
    unitNote: "The first year, against 11 offers",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "W9124723F0152",
    title: "Manpower support services, Fort Bragg",
    agency: "Army / MICC Fort Bragg",
    awardValue: 2_104_835,
    unitNote: "About $530K a year of analysts, a GSA schedule order",
    location: "Fort Bragg, NC",
  },
  {
    awardId: "36C24627P0114",
    title: "Three-day mediation training, Asheville VA",
    agency: "VA / Network Contracting Office 6",
    awardValue: 21_750,
    unitNote: "One class, about $7,250 a day",
    location: "Asheville, NC",
  },
];

// GSA CALC+ ceiling rates on the consulting and training SINs: 25th percentile, median, 75th percentile.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-program-manager", category: "Program Manager", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 111.4, median: 131.86, high: 145.1 },
  { id: "lcat-management-consultant", category: "Management Consultant", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 127.75, median: 162.1, high: 210.38 },
  { id: "lcat-od-consultant", category: "Organizational Development Consultant", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 128.38, median: 179.16, high: 226.25 },
  { id: "lcat-facilitator", category: "Facilitator", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 107.94, median: 145.69, high: 198.01 },
  { id: "lcat-trainer", category: "Trainer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 91.49, median: 116.22, high: 154.71 },
  { id: "lcat-instructional-designer", category: "Instructional Designer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 99.34, median: 118.82, high: 147.18 },
  { id: "lcat-executive-coach", category: "Executive Coach", experience: "7–15 yrs", education: "Master", location: "Nationwide", low: 247.72, median: 333.57, high: 387.65 },
  { id: "lcat-lean-six-sigma", category: "Lean Six Sigma Practitioner (Black Belt level)", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 178.13, median: 193.1, high: 258.66 },
  { id: "lcat-management-analyst", category: "Management Analyst", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 90.04, median: 115.47, high: 144.63 },
  { id: "lcat-hr-specialist", category: "HR Specialist", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 88.17, median: 116.25, high: 142.34 },
  { id: "lcat-admin-assistant", category: "Administrative Assistant", experience: "0–3 yrs", education: "HS", location: "Nationwide", low: 52.47, median: 63, high: 76.03 },
];

/** BLS, May 2025: a Fayetteville management analyst's median pay, an hour. (The name is the agency's export.) */
export const LOCAL_DESIGNER_MEDIAN = 48.94;
