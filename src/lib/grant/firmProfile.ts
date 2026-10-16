// Structured Insurance & Bonding for the canonical demo firm (Marcus Williams /
// Williams Construction LLC), ported from the prototype's `mock/businessProfile.ts`
// insuranceBonding record so Grant's Gate Strip can compare required-vs-held
// (PRD 96 §12 build note · PRD 97 §S1 silent-disqualifier + §4 firm-profile tool).
//
// frontend-v2's `mock/businessProfile.ts` has no insurance record yet, so this
// module is the standalone home for the type + the mock data until the real
// Business Profile module grows one.

export type InsuranceCoverageType =
  | "gl" // Commercial General Liability
  | "professional-eo" // Professional Liability / E&O
  | "tech-eo" // Technology E&O
  | "cyber" // Cyber Liability
  | "auto" // Business Auto
  | "workers-comp" // Workers' Comp / Employers' Liability
  | "umbrella"; // Umbrella / Excess

export interface InsuranceCoverage {
  type: InsuranceCoverageType;
  perOccurrence: number | null;
  aggregate: number | null;
  carrier: string;
  amBest: string; // A.M. Best rating, e.g. "A+ (XV)" — carriers below a floor get rejected
  basis: string;
  expiry: string; // ISO
}

export interface InsuranceBonding {
  coverages: InsuranceCoverage[];
  /** null = not on file → Grant's Gate Strip reads "Confirm", not "Blocked", and
   *  the rail asks for it as the highest-value open question. */
  bonding: { single: number; aggregate: number } | null;
}

/** Marcus carries the trade basics (GL, WC, auto) but NOT Professional/Tech E&O or
 *  Cyber (he's a roofer, not an IT vendor) — and his federal bonding line is not yet
 *  on file, which is deliberate: it keeps the Fort Bragg "Confirm → bid-as-sub"
 *  elicitation intact and is realistic for a first-time federal bidder. */
export function firmInsurance(): InsuranceBonding {
  return {
    coverages: [
      {
        type: "gl",
        perOccurrence: 1_000_000,
        aggregate: 2_000_000,
        carrier: "The Hartford",
        amBest: "A+ (XV)",
        basis: "occurrence",
        expiry: "2026-12-31",
      },
      {
        type: "workers-comp",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Builders Mutual",
        amBest: "A (IX)",
        basis: "occurrence",
        expiry: "2026-11-30",
      },
      {
        type: "auto",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Progressive Commercial",
        amBest: "A+ (XV)",
        basis: "occurrence",
        expiry: "2027-02-28",
      },
    ],
    bonding: null,
  };
}
