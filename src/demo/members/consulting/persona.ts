// THE CONSULTANT: Simone Strayhorn, Coppervale Advisory Group LLC — a
// service-disabled veteran-owned management consulting firm in Fayetteville.
// Read through src/demo/story/persona.ts, which picks the active member.
// Source: demo-storyboard/consulting-pack.md (19 Oct 2026; the pack's business is
// renamed Coppervale Advisory Group, and its commercial client Tidewell Health
// Partners). The business, its people and its commercial clients are fictional;
// government buyers are real.

import { dateDaysFromNow } from "../../story/clock";
import type { MentorProfile, PastPerformance, Persona, Partner, PastPerformanceRoles } from "../../story/persona";

export const PERSONA: Persona = {
  ownerFirstName: "Simone",
  ownerName: "Simone Strayhorn",
  ownerTitle: "Founder and principal consultant",
  businessName: "Coppervale Advisory Group LLC",
  businessShortName: "Coppervale Advisory",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "May 7, 2018",
  yearsInBusiness: 8,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "225 Green St, Suite 410, Fayetteville, NC 28301",
  mailingAddress: "PO Box 1187, Fayetteville, NC 28302",
  email: "simone@coppervaleadvisory.example",
  phone: "(910) 555-0173",
  website: "coppervaleadvisory.example",
  uei: "CV7PR3KM9WD2",
  cage: "9CVA4",
  /** SAM registration lasts a year; she renewed 183 days ago (sc/timeline.ts). */
  samActiveUntil: dateDaysFromNow(182),
  primaryNaics: "541611",
  primaryNaicsLabel: "Administrative Management and General Management Consulting Services",
  secondaryNaics: [
    { code: "541612", label: "Human Resources Consulting Services" },
    { code: "611430", label: "Professional and Management Development Training" },
    { code: "541618", label: "Other Management Consulting Services" },
  ],
  setAsideEligibility: ["SBA", "SDVOSBC"],
  // No NC HUB: North Carolina ended HUB certification on 7 July 2026. No GSA schedule, OASIS+, 8(a), HUBZone or WOSB.
  certifications: [
    "Small Business",
    "Service-disabled veteran-owned (SBA VetCert, certified 14 Jan 2024)",
  ],
  clearances: [],
  employeesW2: 11,
  kitchen: "Office and a 30-seat training room on Green St: 11 staff and 7 contract facilitators",
  annualRevenue: 1_600_000,
  annualRevenueBand: "$1M–$2.5M",
  targetValueMin: 25_000,
  targetValueMax: 650_000,
  largestBond: 0,
  serviceStates: ["NC", "SC", "VA"],
  serviceRadiusMiles: 150,
  targetAgencies: [
    "Department of Veterans Affairs (VISN 6, NCO 6)",
    "U.S. Army (MICC Fort Bragg)",
    "North Carolina National Guard",
    "State of North Carolina",
    "Cumberland County",
    "City of Fayetteville",
  ],
  differentiators: [
    "Ran HR for an Army corps in uniform: retired lieutenant colonel, former deputy G-1",
    "Cohort leadership programs with 360s and coaching",
    "Lean reviews that cut wait times: 38 to 14 minutes at Fort Bragg ACS",
    "Strategic plans that boards adopt",
  ],
  capabilityStatementFile: "/demo-files/coppervale-advisory-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-coppervale-advisory",
  userId: "demo-user-simone",
  contactId: "demo-contact-simone",
};

export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-acs-lean-review",
    projectTitle: "Lean review and staff training, Army Community Service, Fort Bragg",
    customerName: "Mission and Installation Contracting Command (MICC) — Fort Bragg, for Army Community Service",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2025-04-01",
    periodEnd: "2026-03-31",
    totalValue: 118_400,
    naicsCode: "541611",
    scopeDescription:
      "A Lean review of the ACS front desk and appointment flow, then Lean basics for 40 ACS staff. Walk-in waits fell from 38 to 14 minutes. SDVOSB set-aside, contract W91247-25-P-A061.",
    awaitingReview: true,
  },
  {
    id: "pp-halyard-family-readiness",
    projectTitle: "Family readiness staff classes, Southeast virtual cohorts",
    customerName: "Halyard Point Human Capital, for the U.S. Army",
    customerType: "federal_sub",
    role: "sub",
    periodStart: "2023-03-01",
    periodEnd: "2025-05-30",
    totalValue: 96_000,
    naicsCode: "541612",
    scopeDescription:
      "Taught the Southeast virtual cohorts of the Army's family readiness staff training, as Halyard Point Human Capital's subcontractor.",
    referenceName: "Renata Oduya",
    referenceTitle: "Program Manager, Halyard Point Human Capital",
  },
  {
    id: "pp-hope-mills-plan",
    projectTitle: "Town strategic plan, with five public workshops",
    customerName: "Town of Hope Mills, NC",
    customerType: "local",
    role: "prime",
    periodStart: "2024-02-05",
    periodEnd: "2024-10-25",
    totalValue: 42_500,
    naicsCode: "541611",
    scopeDescription:
      "Ran five public workshops and wrote the town's five-year strategic plan, which the board adopted unchanged.",
    referenceName: "Corinne Pettaway",
    referenceTitle: "Assistant Town Manager, Town of Hope Mills",
  },
  {
    id: "pp-tidewell-academy",
    projectTitle: "Nurse-manager leadership academy",
    customerName: "Tidewell Health Partners",
    customerType: "commercial",
    role: "prime",
    periodStart: "2023-01-09",
    periodEnd: "2025-06-27",
    totalValue: 138_000,
    naicsCode: "611430",
    scopeDescription:
      "A cohort leadership academy for new nurse managers: classroom days, a 360 for each manager and three coaching sessions.",
    referenceName: "Dr. Lena Abernathy",
    referenceTitle: "Chief Nursing Officer, Tidewell Health Partners",
  },
];

/** Her past jobs by the role they play in the story (PastPerformanceRoles). */
export const PAST_PERFORMANCE_ROLES: PastPerformanceRoles = {
  county: "pp-hope-mills-plan",
  cdg: "pp-halyard-family-readiness",
  church: "pp-tidewell-academy",
  womack: "pp-acs-lean-review",
};

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
  bio: "Sarah spent 14 years as an Army contracting officer at Fort Bragg and Fort Stewart before joining GovPreneurs. She reviews services bids at Army and VA offices, including training and program support.",
};

/** The veteran-owned prime at the center of the Army training team-up. Fictional. */
export const KEY_PARTNER: Partner = {
  name: "Halyard Point Human Capital",
  contact: "Gavin Toller",
  contactTitle: "Capture Director",
  city: "Chesapeake, VA",
  holds: "Service-disabled veteran-owned HR and training firm with 85 staff; holds the Army's HR Solutions contract and a GSA schedule",
  seeking: "A veteran-owned trainer near Fort Bragg for in-person classes in NC, SC and VA",
};
