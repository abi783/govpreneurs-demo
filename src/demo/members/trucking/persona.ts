// THE TRUCKING COMPANY: Tanya Merritt, Rockfish Run Freight LLC — a
// service-disabled veteran-owned carrier in Fayetteville. Read through
// src/demo/story/persona.ts, which picks the active member.
// Source: demo-storyboard/trucking-pack.md (19 Oct 2026). The pack puts the yard
// in Hope Mills; the demo moves it inside Fayetteville city limits, so every
// distance counts from src/demo/story/places.ts. The business, its people and
// its commercial clients are fictional; government buyers are real.

import { dateDaysFromNow } from "../../story/clock";
import type { MentorProfile, PastPerformance, Persona, Partner, PastPerformanceRoles } from "../../story/persona";

export const PERSONA: Persona = {
  ownerFirstName: "Tanya",
  ownerName: "Tanya Merritt",
  ownerTitle: "Owner and president",
  businessName: "Rockfish Run Freight LLC",
  businessShortName: "Rockfish Run Freight",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "May 8, 2017",
  yearsInBusiness: 9,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "2215 Gillespie St, Fayetteville, NC 28306",
  mailingAddress: "PO Box 64417, Fayetteville, NC 28306",
  email: "tanya@rockfishrunfreight.example",
  phone: "(910) 555-0173",
  website: "rockfishrunfreight.example",
  uei: "RR7TM3KQ9WF2",
  cage: "9RRF4",
  /** SAM registration lasts a year; she renewed 183 days ago (sc/timeline.ts). */
  samActiveUntil: dateDaysFromNow(182),
  primaryNaics: "484110",
  primaryNaicsLabel: "General Freight Trucking, Local",
  secondaryNaics: [
    { code: "484121", label: "General Freight Trucking, Long-Distance, Truckload" },
    { code: "484220", label: "Specialized Freight (except Used Goods) Trucking, Local" },
    { code: "484210", label: "Used Household and Office Goods Moving" },
    { code: "492110", label: "Couriers and Express Delivery Services" },
    { code: "488490", label: "Other Support Activities for Road Transportation" },
  ],
  setAsideEligibility: ["SBA", "SDVOSBC"],
  certifications: ["Small Business", "Service-Disabled Veteran-Owned (SBA VetCert, certified Dec 2023)"],
  clearances: [],
  employeesW2: 15,
  kitchen: "Truck yard and shop on Gillespie St: 7 tractors, 9 trailers, 4 box trucks with lift gates and a cargo van",
  annualRevenue: 2_600_000,
  annualRevenueBand: "$2.5M–$5M",
  targetValueMin: 15_000,
  targetValueMax: 750_000,
  /** No surety bond line: trucking is bought without bid or performance bonds. */
  largestBond: 0,
  serviceStates: ["NC", "SC", "VA"],
  serviceRadiusMiles: 200,
  targetAgencies: [
    "Department of Veterans Affairs (VISN 6)",
    "U.S. Army (Fort Bragg)",
    "U.S. Marine Corps (Camp Lejeune)",
    "NCDOT Division 6",
    "NCDOT Division 8",
  ],
  differentiators: [
    "Run by a former Army truck driver who knows Fort Bragg's gates and access rules",
    "Box trucks with lift gates, dry vans, a reefer and flatbeds",
    "Dispatch from 5 AM to 9 PM, and GPS on every truck",
    "Service-disabled veteran-owned and small",
  ],
  capabilityStatementFile: "/demo-files/rockfish-run-freight-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-rockfish-run-freight",
  userId: "demo-user-tanya",
  contactId: "demo-contact-tanya",
};

export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-bragg-trailer-hauling",
    projectTitle: "On-call trailer and container hauling, 18th Airborne Corps",
    customerName: "Mission and Installation Contracting Command, Fort Bragg, U.S. Army",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2025-10-01",
    periodEnd: "2026-09-30",
    totalValue: 41_400,
    naicsCode: "484220",
    scopeDescription:
      "46 on-call moves of modular office trailers, CONEX containers and generators between unit areas and off-post yards. 12 months; her first federal prime.",
    awaitingReview: true,
  },
  {
    id: "pp-ncdot-storm-hauling",
    projectTitle: "On-call storm-work hauling, NCDOT Division 6",
    customerName: "NC Department of Transportation, Division 6",
    customerType: "local",
    role: "prime",
    periodStart: "2025-06-02",
    periodEnd: "2025-12-19",
    totalValue: 57_800,
    naicsCode: "484220",
    scopeDescription:
      "Trucks and drivers on call after storms, hauling debris and road materials in Cumberland County at the state's hourly rates.",
    referenceName: "Dwayne Lockhart",
    referenceTitle: "Division Maintenance Engineer, NCDOT Division 6",
  },
  {
    id: "pp-quarry-lane-routes",
    projectTitle: "Daily box-truck routes to 14 clinics",
    customerName: "Quarry Lane Medical Supply",
    customerType: "commercial",
    role: "prime",
    periodStart: "2021-03-01",
    periodEnd: "2026-09-30",
    totalValue: 186_000,
    naicsCode: "484110",
    scopeDescription:
      "Two box trucks run supplies to 14 clinics every weekday and bring returns back. $186,000 a year since 2021.",
    referenceName: "Renata Bostic",
    referenceTitle: "Distribution Manager, Quarry Lane Medical Supply",
  },
  {
    id: "pp-cypress-bend-reefer",
    projectTitle: "Weekly refrigerated runs to stores",
    customerName: "Cypress Bend Foods",
    customerType: "commercial",
    role: "prime",
    periodStart: "2022-04-04",
    periodEnd: "2026-09-30",
    totalValue: 142_000,
    naicsCode: "484121",
    scopeDescription: "Weekly refrigerated truckload runs to stores in NC and SC. $142,000 a year since 2022.",
    referenceName: "Hollis Varner",
    referenceTitle: "Logistics Director, Cypress Bend Foods",
  },
];

/** Her past jobs by the role they play in the story (PastPerformanceRoles). */
export const PAST_PERFORMANCE_ROLES: PastPerformanceRoles = {
  county: "pp-ncdot-storm-hauling",
  cdg: "pp-bragg-trailer-hauling",
  church: "pp-quarry-lane-routes",
  womack: "pp-bragg-trailer-hauling",
};

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
  bio: "Sarah spent 14 years as an Army contracting officer at Fort Bragg and Fort Stewart before joining GovPreneurs. She reviews services bids, including the motor-pool and freight work run by Fort Bragg's Logistics Readiness Center.",
};

/** The prime at the center of the Fort Bragg logistics team-up. Fictional. */
export const KEY_PARTNER: Partner = {
  name: "Brightwater Sustainment Group",
  contact: "Owen Pritchard",
  contactTitle: "Capture Director",
  city: "Huntsville, AL",
  holds: "The Army's EAGLE ordering agreement for base logistics, and the current Fort Bragg logistics contract",
  seeking: "A local service-disabled veteran-owned carrier for Fort Bragg's freight runs and trailer moves",
};
