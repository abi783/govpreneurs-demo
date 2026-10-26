// THE CONTRACTOR: Derrick Faircloth, Ninebark Builders LLC — a HUBZone
// general contractor in Fayetteville. Read through src/demo/story/persona.ts,
// which picks the active member.
// Source: demo-storyboard/construction-pack.md (19 Oct 2026; the pack's owner is
// renamed Derrick Faircloth). The business, its people and its commercial
// clients are fictional; government buyers are real.

import { dateDaysFromNow } from "../../story/clock";
import type { MentorProfile, PastPerformance, Persona, Partner, PastPerformanceRoles } from "../../story/persona";

export const PERSONA: Persona = {
  ownerFirstName: "Derrick",
  ownerName: "Derrick Faircloth",
  ownerTitle: "Owner and president",
  businessName: "Ninebark Builders LLC",
  businessShortName: "Ninebark Builders",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "March 12, 2012",
  yearsInBusiness: 14,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "418 Grove St, Fayetteville, NC 28301",
  mailingAddress: "PO Box 2291, Fayetteville, NC 28302",
  email: "derrick@ninebarkbuilders.example",
  phone: "(910) 555-0148",
  website: "ninebarkbuilders.example",
  uei: "NB4KF7RW2JX8",
  cage: "8NBK2",
  /** SAM registration lasts a year; he renewed 183 days ago (sc/timeline.ts). */
  samActiveUntil: dateDaysFromNow(182),
  primaryNaics: "236220",
  primaryNaicsLabel: "Commercial and Institutional Building Construction",
  secondaryNaics: [
    { code: "238210", label: "Electrical Contractors and Other Wiring Installation Contractors" },
    { code: "238220", label: "Plumbing, Heating, and Air-Conditioning Contractors" },
  ],
  setAsideEligibility: ["SBA", "HZC"],
  // No NC HUB: North Carolina ended HUB certification on 7 July 2026 (S.L. 2026-41).
  certifications: ["Small Business", "HUBZone (SBA, certified 2 Dec 2023)"],
  clearances: [],
  employeesW2: 25,
  kitchen: "Shop and yard on Grove St: 2 electrical crews, 2 HVAC crews and a carpentry crew",
  annualRevenue: 4_600_000,
  annualRevenueBand: "$2.5M–$5M",
  targetValueMin: 50_000,
  targetValueMax: 1_500_000,
  /** The Cumberland County Schools HVAC job, summer 2024. */
  largestBond: 612_000,
  bondLine: { single: 1_500_000, aggregate: 4_000_000, inUse: 2_900_000 },
  serviceStates: ["NC"],
  serviceRadiusMiles: 100,
  targetAgencies: [
    "U.S. Army Corps of Engineers (Wilmington District)",
    "U.S. Army (Fort Bragg)",
    "U.S. Air Force (Pope Army Airfield)",
    "Federal Aviation Administration",
    "Cumberland County Schools",
    "Fayetteville State University",
  ],
  differentiators: [
    "Self-performs both trades building repairs need: electrical and HVAC",
    "Two crews of each, so one job can't stall another",
    "Crews already badge onto post from the Pope job",
    "Bonded to $1.5M a job, $4M in total",
  ],
  capabilityStatementFile: "/demo-files/ninebark-builders-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-ninebark-builders",
  userId: "demo-user-derrick",
  contactId: "demo-contact-derrick",
};

export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-pope-office-hvac",
    projectTitle: "HVAC and electrical repair, Pope Army Airfield office building",
    customerName: "763rd Enterprise Sourcing Squadron, Pope Army Airfield, U.S. Air Force",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2025-04-07",
    periodEnd: "2025-09-19",
    totalValue: 186_400,
    naicsCode: "238220",
    scopeDescription:
      "Replaced six split-system heat pumps, moved two old panels to a new 400A panel and tied the units into the building's controls. Done in 5½ months; CPARS Very Good.",
  },
  {
    id: "pp-turnrow-barracks-electrical",
    projectTitle: "Barracks HVAC job at Fort Bragg: the electrical scope",
    customerName: "Turnrow Federal (HUBZone MATOC holder)",
    customerType: "federal_sub",
    role: "sub",
    periodStart: "2024-03-04",
    periodEnd: "2025-02-28",
    totalValue: 412_000,
    naicsCode: "238210",
    scopeDescription:
      "Power for new air handlers and condensing units in a Fort Bragg barracks, new feeders and disconnects, and the controls wiring, as Turnrow Federal's electrical subcontractor.",
    referenceName: "Wade Lockamy",
    referenceTitle: "Project Manager, Turnrow Federal",
  },
  {
    id: "pp-ccs-school-hvac",
    projectTitle: "HVAC replacement, a Cumberland County elementary school",
    customerName: "Cumberland County Schools, Facilities Department",
    customerType: "local",
    role: "prime",
    periodStart: "2024-06-10",
    periodEnd: "2024-08-16",
    totalValue: 612_000,
    naicsCode: "238220",
    scopeDescription:
      "Replaced the split systems and two boilers in an occupied elementary school between the last school day and the first teacher workday. Bonded; finished 4 days early.",
    referenceName: "Lorna Batchelor",
    referenceTitle: "Director of Facilities, Cumberland County Schools",
  },
  {
    id: "pp-tallow-branch-medical",
    projectTitle: "Service upgrade and HVAC, Tallow Branch Medical Offices",
    customerName: "Tallow Branch Medical Offices",
    customerType: "commercial",
    role: "prime",
    periodStart: "2023-02-13",
    periodEnd: "2023-09-29",
    totalValue: 338_000,
    naicsCode: "236220",
    scopeDescription:
      "A new electrical service and HVAC for a three-building medical park, phased so every practice stayed open.",
    referenceName: "Dr. Imani Royster",
    referenceTitle: "Managing Partner, Tallow Branch Medical Offices",
  },
];

/** His past jobs by the role they play in the story (PastPerformanceRoles). */
export const PAST_PERFORMANCE_ROLES: PastPerformanceRoles = {
  county: "pp-ccs-school-hvac",
  cdg: "pp-turnrow-barracks-electrical",
  church: "pp-tallow-branch-medical",
  womack: "pp-pope-office-hvac",
};

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = {
  name: "Diana Potts",
  firstName: "Diana",
  title: "Mentor",
  bio: "Diana helps members position their business and understand how government contracting works, including disaster-related opportunities.",
};

/** The veteran-owned prime at the center of the VA team-up. Fictional. */
export const KEY_PARTNER: Partner = {
  name: "Blackjack Oak Federal Builders",
  contact: "Curtis Vann",
  contactTitle: "Capture Director",
  city: "Durham, NC",
  holds: "Service-disabled veteran-owned general contracting for VA medical centers in North Carolina",
  seeking: "A HUBZone firm that self-performs the mechanical and electrical work at the Fayetteville VA",
};
