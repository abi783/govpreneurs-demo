// Structured insurance and bonding for the demo firm (Haddad Catering & Food
// Services LLC), so Grant's gate strip can compare what a notice requires with what
// the firm holds (PRD 96 §12 build note, PRD 97 §S1 silent-disqualifier, §4 firm-profile tool).
//
// DEMO: production's copy described a different sample firm. Every figure here is
// read from the story persona or is a plain fact about a five-person caterer.

import { PERSONA } from "@/demo/story/persona";

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

/** The caterer carries general liability, workers' compensation and vehicle cover for
 *  both vans. Her largest bond is the county summer meals job: the persona's `largestBond`. */
export function firmInsurance(): InsuranceBonding {
  return {
    coverages: [
      {
        type: "gl",
        perOccurrence: 1_000_000,
        aggregate: 2_000_000,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: "2027-03-31",
      },
      {
        type: "workers-comp",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Piedmont Mutual",
        amBest: "A (XV)",
        basis: "occurrence",
        expiry: "2027-03-31",
      },
      {
        type: "auto",
        perOccurrence: 1_000_000,
        aggregate: null,
        carrier: "Carolina Commercial Auto",
        amBest: "A- (XIV)",
        basis: "occurrence",
        expiry: "2027-02-28",
      },
    ],
    bonding: { single: PERSONA.largestBond, aggregate: PERSONA.largestBond },
  };
}
