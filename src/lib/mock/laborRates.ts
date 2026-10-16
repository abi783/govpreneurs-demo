// Labor pricing seed data — Davis-Bacon construction prevailing wages
// (default view for a roofer) plus service-contract LCAT benchmarks
// (operator depth, scoped correctly).

export interface PrevailingWage {
  trade: string;
  baseHourly: number;
  fringeHourly: number;
  // total = base + fringe
  notes?: string;
}

// Cumberland County, NC — illustrative Davis-Bacon roofing/construction rates.
// Mock numbers, realistic ranges.
export const PREVAILING_WAGES_CUMBERLAND_NC: PrevailingWage[] = [
  { trade: "Roofer", baseHourly: 24.86, fringeHourly: 8.42, notes: "Built-up, single-ply, metal" },
  { trade: "Laborer (Group 1, General)", baseHourly: 18.12, fringeHourly: 7.05 },
  { trade: "Sheet Metal Worker", baseHourly: 27.40, fringeHourly: 11.85, notes: "Flashing, gutters, metal panels" },
  { trade: "Carpenter", baseHourly: 25.95, fringeHourly: 9.20, notes: "Deck repair, framing" },
  { trade: "Equipment Operator (Group 2)", baseHourly: 26.50, fringeHourly: 9.40, notes: "Lifts, telehandler" },
  { trade: "Truck Driver (Heavy)", baseHourly: 22.15, fringeHourly: 7.90 },
];

export const PREVAILING_WAGE_META = {
  county: "Cumberland County, NC",
  determination: "NC20240013, Mod 14",
  effectiveDate: "2026-01-15",
  source: "U.S. Dept. of Labor — Wage Determinations (mock)",
};

// Comparable awarded roofing jobs in the region — links into Awarded tab.
export interface ComparableAward {
  contractId: string; // matches AwardedContract.id in awardedContracts.ts
  title: string;
  agency: string;
  awardValue: number;
  squareFootage?: string;
  pricePerSqFt?: number; // approximated
  location: string;
}

export const COMPARABLE_ROOFING_AWARDS: ComparableAward[] = [
  {
    contractId: "AWD-sterling-lejeune",
    title: "Camp Lejeune barracks envelope renovation",
    agency: "Navy / NAVFAC Mid-Atlantic",
    awardValue: 3_200_000,
    squareFootage: "~95K sq ft",
    pricePerSqFt: 33.7,
    location: "Jacksonville, NC",
  },
  {
    contractId: "AWD-ccs-fayetteville",
    title: "Cumberland County Schools — 4 elementary roof replacements",
    agency: "Cumberland County Schools",
    awardValue: 1_180_000,
    squareFootage: "~38K sq ft",
    pricePerSqFt: 31.1,
    location: "Fayetteville, NC",
  },
  {
    contractId: "AWD-archer-greensboro",
    title: "VA Greensboro CBOC roof replacement",
    agency: "VA",
    awardValue: 845_000,
    squareFootage: "~22K sq ft",
    pricePerSqFt: 38.4,
    location: "Greensboro, NC",
  },
];

// ── Service-contract LCAT rates (CALC-style) ──────────────────────────
export type ExperienceTier = "0–3 yrs" | "3–7 yrs" | "7–15 yrs" | "15+ yrs";
export type EducationLevel = "HS" | "Associate" | "Bachelor" | "Master" | "PhD";

export interface LcatRate {
  id: string;
  category: string;
  experience: ExperienceTier;
  education: EducationLevel;
  location: "Nationwide" | "DC Metro" | "Raleigh-Durham" | "Charlotte";
  low: number; // fully-burdened hourly $
  median: number;
  high: number;
}

// Mock CALC-style benchmark rates. Service contracts only — not construction.
export const LCAT_RATES: LcatRate[] = [
  { id: "lcat-pm-sr", category: "Program Manager (Sr)", experience: "15+ yrs", education: "Bachelor", location: "Nationwide", low: 142, median: 168, high: 215 },
  { id: "lcat-pm-mid", category: "Program Manager (Mid)", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 108, median: 132, high: 162 },
  { id: "lcat-se-sr", category: "Software Engineer (Sr)", experience: "7–15 yrs", education: "Bachelor", location: "DC Metro", low: 138, median: 165, high: 198 },
  { id: "lcat-se-mid", category: "Software Engineer (Mid)", experience: "3–7 yrs", education: "Bachelor", location: "DC Metro", low: 95, median: 118, high: 145 },
  { id: "lcat-cyber-sr", category: "Cybersecurity Analyst (Sr)", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 132, median: 158, high: 195 },
  { id: "lcat-helpdesk-2", category: "Help Desk Specialist (Tier 2)", experience: "3–7 yrs", education: "Associate", location: "Nationwide", low: 58, median: 72, high: 88 },
  { id: "lcat-data-sci", category: "Data Scientist", experience: "3–7 yrs", education: "Master", location: "DC Metro", low: 142, median: 175, high: 220 },
  { id: "lcat-admin", category: "Administrative Assistant", experience: "3–7 yrs", education: "HS", location: "Nationwide", low: 38, median: 52, high: 68 },
  { id: "lcat-tech-writer", category: "Technical Writer", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 62, median: 82, high: 105 },
  { id: "lcat-sys-arch", category: "Systems Architect (Sr)", experience: "15+ yrs", education: "Master", location: "DC Metro", low: 165, median: 195, high: 248 },
  { id: "lcat-ba-sr", category: "Business Analyst (Sr)", experience: "7–15 yrs", education: "Bachelor", location: "Nationwide", low: 102, median: 128, high: 158 },
  { id: "lcat-trainer", category: "Training Specialist", experience: "3–7 yrs", education: "Bachelor", location: "Nationwide", low: 65, median: 85, high: 108 },
];

export function fmtRate(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
