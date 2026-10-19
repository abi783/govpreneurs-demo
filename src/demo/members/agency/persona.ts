// THE AGENCY: Dana Okafor, Lantern Row Creative LLC — the Level Up story.
// Read through src/demo/story/persona.ts, which picks the active member.
// Source: demo-storyboard/marketing-agency-pack.md (approved 19 Oct 2026). The
// business, its people and its commercial clients are fictional; government
// buyers are real.

import { dateDaysFromNow } from "../../story/clock";
import type { MentorProfile, PastPerformance, Persona, Partner } from "../../story/persona";

export const PERSONA: Persona = {
  ownerFirstName: "Dana",
  ownerName: "Dana Okafor",
  ownerTitle: "Owner and creative director",
  businessName: "Lantern Row Creative LLC",
  businessShortName: "Lantern Row Creative",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "April 8, 2019",
  yearsInBusiness: 7,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "112 Person St, Fayetteville, NC 28301",
  mailingAddress: "PO Box 3307, Fayetteville, NC 28302",
  email: "dana@lanternrowcreative.example",
  phone: "(910) 555-0172",
  website: "lanternrowcreative.example",
  uei: "QK7RN2LW4TC9",
  cage: "9LRC4",
  /** SAM registration lasts a year; she renewed 183 days ago (sc/timeline.ts). */
  samActiveUntil: dateDaysFromNow(182),
  primaryNaics: "541810",
  primaryNaicsLabel: "Advertising Agencies",
  secondaryNaics: [
    { code: "541613", label: "Marketing Consulting Services" },
    { code: "541430", label: "Graphic Design Services" },
    { code: "512110", label: "Motion Picture and Video Production" },
    { code: "541820", label: "Public Relations Agencies" },
  ],
  setAsideEligibility: ["SBA", "WOSB"],
  // No NC HUB: North Carolina ended HUB certification on 7 July 2026 (S.L. 2026-41).
  certifications: ["Small Business", "Woman-Owned Small Business (WOSB)"],
  clearances: [],
  employeesW2: 9,
  kitchen: "Studio and edit suite at 112 Person St, a 2-person video crew",
  annualRevenue: 1_400_000,
  annualRevenueBand: "$1M–$2.5M",
  targetValueMin: 25_000,
  targetValueMax: 450_000,
  /** She has never needed a bond: ad work is not bonded. */
  largestBond: 0,
  serviceStates: ["NC", "VA", "SC"],
  serviceRadiusMiles: 200,
  targetAgencies: ["U.S. Army (Fort Bragg)", "NC National Guard", "Department of Veterans Affairs", "NC state agencies"],
  differentiators: [
    "Reaches military families: 7 years of campaigns around Fort Bragg",
    "In-house captioned video: a 2-person crew and an edit suite",
    "Paid social, search and display, run in-house",
    "Lead forms that text a recruiter or caseworker within 5 minutes",
  ],
  capabilityStatementFile: "/demo-files/lantern-row-creative-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-lantern-row-creative",
  userId: "demo-user-dana",
  contactId: "demo-contact-dana",
};

export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-ncng-recruiting",
    projectTitle: "NC Army National Guard digital recruiting campaign",
    customerName: "NC Army National Guard Recruiting & Retention Battalion, U.S. Army",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2025-03-01",
    periodEnd: "2026-02-27",
    totalValue: 86_400,
    naicsCode: "541810",
    scopeDescription:
      "Six 15-second videos, geofenced ads around 40 high schools and the State Fair, and a lead form routed to recruiters within 5 minutes. 12 months.",
    awaitingReview: true,
  },
  {
    id: "pp-fayetteville-stormwater",
    projectTitle: "City of Fayetteville stormwater public-education campaign",
    customerName: "City of Fayetteville, Stormwater Services",
    customerType: "local",
    role: "prime",
    periodStart: "2023-03-01",
    periodEnd: "2023-10-31",
    totalValue: 38_500,
    naicsCode: "541810",
    scopeDescription:
      "Bus-shelter and social ads, two short videos and a bilingual flyer telling residents what not to pour down storm drains.",
    referenceName: "Teresa Wynn",
    referenceTitle: "Public Education Coordinator, City of Fayetteville",
  },
  {
    id: "pp-longleaf-hiring",
    projectTitle: "Longleaf Home Health nurse and aide hiring campaign",
    customerName: "Longleaf Home Health",
    customerType: "commercial",
    role: "prime",
    periodStart: "2024-01-15",
    periodEnd: "2024-12-15",
    totalValue: 96_000,
    naicsCode: "541613",
    scopeDescription:
      "A year-long hiring campaign for nurses and home-health aides: recruiting videos, paid social and search, and a lead form that texts the recruiter. 140 hires.",
    referenceName: "Gloria Pratt",
    referenceTitle: "Director of People, Longleaf Home Health",
  },
  {
    id: "pp-two-rivers-dental",
    projectTitle: "Two Rivers Family Dental patient-growth retainer",
    customerName: "Two Rivers Family Dental",
    customerType: "commercial",
    role: "prime",
    periodStart: "2022-10-01",
    periodEnd: "2026-09-30",
    totalValue: 312_000,
    naicsCode: "541810",
    scopeDescription:
      "Monthly paid search and social, landing pages and appointment reminders for a three-office dental practice. $78,000 a year since 2022.",
    referenceName: "Dr. Kevin Ames",
    referenceTitle: "Owner, Two Rivers Family Dental",
  },
];

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
  bio: "Sarah spent 14 years as an Army contracting officer at Fort Bragg and Fort Stewart before joining GovPreneurs. She reviews services bids, including outreach for Army family programs.",
};

/** The veteran-owned prime at the center of the VA team-up. Fictional. */
export const KEY_PARTNER: Partner = {
  name: "Bluestone Veteran Media Group",
  contact: "Andre Hale",
  contactTitle: "Capture Director",
  city: "Arlington, VA",
  holds: "Recruitment and outreach campaigns for federal health and veterans agencies",
  seeking: "A woman-owned video crew for VA medical center shoots in NC, VA and SC",
};
