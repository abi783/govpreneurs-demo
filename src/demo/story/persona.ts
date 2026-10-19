// The sample member the whole demo is about. Every screen reads these facts
// from here; no screen types them again.
//
// DEMO: the demo can tell two stories (src/demo/member.ts). This file holds the
// shapes and picks the active member's data from src/demo/members/<member>/.

import { byMember } from "../member";
import * as agency from "../members/agency/persona";
import * as caterer from "../members/caterer/persona";

export interface Persona {
  ownerFirstName: string;
  ownerName: string;
  ownerTitle: string;
  businessName: string;
  businessShortName: string;
  entityType: string;
  stateOfIncorporation: string;
  formedOn: string;
  yearsInBusiness: number;
  hqCity: string;
  hqState: string;
  hqCounty: string;
  physicalAddress: string;
  mailingAddress: string;
  email: string;
  phone: string;
  website: string;
  uei: string;
  cage: string;
  samActiveUntil: string;
  primaryNaics: string;
  primaryNaicsLabel: string;
  secondaryNaics: readonly { code: string; label: string }[];
  /** SAM set-aside codes the member is eligible for. */
  setAsideEligibility: readonly ("SBA" | "WOSB")[];
  certifications: readonly string[];
  /** Security clearances held by the staff. */
  clearances: readonly string[];
  employeesW2: number;
  /** Caterer only: staff with a current food-handler (ServSafe) certificate. */
  foodHandlerCertified?: number;
  /** Where the work is made: a commercial kitchen, a studio. */
  kitchen?: string;
  annualRevenue: number;
  annualRevenueBand: string;
  targetValueMin: number;
  targetValueMax: number;
  /** Largest bond ever carried. */
  largestBond: number;
  serviceStates: readonly string[];
  serviceRadiusMiles: number;
  targetAgencies: readonly string[];
  differentiators: readonly string[];
  capabilityStatementFile: string;
  plan: string;
  locationId: string;
  userId: string;
  contactId: string;
}

export type PastPerformanceId = string;

export interface PastPerformance {
  id: PastPerformanceId;
  projectTitle: string;
  customerName: string;
  customerType: "federal_prime" | "federal_sub" | "local" | "commercial";
  role: "prime" | "sub";
  periodStart: string;
  periodEnd: string;
  totalValue: number;
  naicsCode: string;
  scopeDescription: string;
  referenceName?: string;
  referenceTitle?: string;
  /** CPARS (the federal performance rating) not yet written. */
  awaitingReview?: boolean;
}

export interface MentorProfile {
  name: string;
  firstName: string;
  title: string;
  bio: string;
}

/** The teaming partner at the center of the team-up story. */
export interface Partner {
  name: string;
  contact: string;
  contactTitle: string;
  city: string;
  holds: string;
  seeking: string;
}

export const PERSONA: Persona = byMember({ agency: agency.PERSONA, caterer: caterer.PERSONA });

// Past jobs are history, so their dates are fixed, not relative.
export const PAST_PERFORMANCE: PastPerformance[] = byMember({
  agency: agency.PAST_PERFORMANCE,
  caterer: caterer.PAST_PERFORMANCE,
});

/**
 * Find a past job by id. DEMO: it also finds the other member's jobs, so content
 * written for one member (an Ava bid, the awards page) still loads while the
 * other member is on stage. Lists and counts read PAST_PERFORMANCE only.
 */
export function findPastPerformance(id: PastPerformanceId): PastPerformance | undefined {
  return (
    PAST_PERFORMANCE.find((p) => p.id === id) ??
    byMember({ agency: caterer.PAST_PERFORMANCE, caterer: agency.PAST_PERFORMANCE }).find((p) => p.id === id)
  );
}

/**
 * The member's past jobs by the role they play in the story, for engines that
 * reach for "the local public job" or "the federal prime" by name. The roles are
 * the caterer's (written first); the agency maps its own jobs onto them.
 */
export interface PastPerformanceRoles {
  /** A local public-sector job she ran as prime. */
  county: PastPerformanceId;
  /** Federal work near Fort Bragg (the caterer's was a subcontract). */
  cdg: PastPerformanceId;
  /** A commercial job. */
  church: PastPerformanceId;
  /** Her federal prime contract. */
  womack: PastPerformanceId;
}

export const PAST_PERFORMANCE_ROLES: PastPerformanceRoles = byMember({
  agency: { county: "pp-fayetteville-stormwater", cdg: "pp-ncng-recruiting", church: "pp-two-rivers-dental", womack: "pp-ncng-recruiting" },
  caterer: { county: "pp-county-schools", cdg: "pp-cdg-sub", church: "pp-church", womack: "pp-womack" },
});

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = byMember({ agency: agency.MENTOR, caterer: caterer.MENTOR });

/** The partner at the center of the team-up story. */
export const KEY_PARTNER: Partner = byMember({ agency: agency.KEY_PARTNER, caterer: caterer.KEY_PARTNER });
