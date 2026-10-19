// THE JANITORIAL FIRM: Reggie Tyndall, Gray Owl Facility Services LLC — a
// HUBZone janitorial and facilities firm in Fayetteville. Read through
// src/demo/story/persona.ts, which picks the active member.
// Source: demo-storyboard/janitorial-pack.md (19 Oct 2026). The business, its
// people and its commercial clients are fictional; government buyers are real.

import { dateDaysFromNow } from "../../story/clock";
import type { MentorProfile, PastPerformance, Persona, Partner, PastPerformanceRoles } from "../../story/persona";

export const PERSONA: Persona = {
  ownerFirstName: "Reggie",
  ownerName: "Reggie Tyndall",
  ownerTitle: "Owner and president",
  businessName: "Gray Owl Facility Services LLC",
  businessShortName: "Gray Owl",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "May 5, 2014",
  yearsInBusiness: 12,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "1140 Gillespie St, Fayetteville, NC 28306",
  mailingAddress: "PO Box 3317, Fayetteville, NC 28302",
  email: "reggie@grayowlfacility.example",
  phone: "(910) 555-0186",
  website: "grayowlfacility.example",
  uei: "GW7TN3QK5RL2",
  cage: "9GWL4",
  /** SAM registration lasts a year; he renewed 183 days ago (sc/timeline.ts). */
  samActiveUntil: dateDaysFromNow(182),
  primaryNaics: "561720",
  primaryNaicsLabel: "Janitorial Services",
  secondaryNaics: [
    { code: "561790", label: "Other Services to Buildings and Dwellings" },
    { code: "561740", label: "Carpet and Upholstery Cleaning Services" },
    { code: "561730", label: "Landscaping Services" },
  ],
  setAsideEligibility: ["SBA", "HZC"],
  // No NC HUB: North Carolina ended HUB certification on 7 July 2026.
  certifications: ["Small Business", "HUBZone (SBA, certified 2023; recertifies yearly)"],
  clearances: [],
  employeesW2: 38,
  kitchen:
    "Office and equipment yard on Gillespie St: 29 night custodians, 4 floor techs, 2 exterior techs and 2 hot-water pressure-washing trailers",
  annualRevenue: 1_700_000,
  annualRevenueBand: "$1M–$2.5M",
  targetValueMin: 8_000,
  targetValueMax: 600_000,
  /** No bond: cleaning contracts don't ask for one. */
  largestBond: 0,
  serviceStates: ["NC"],
  serviceRadiusMiles: 100,
  targetAgencies: [
    "U.S. Army (Fort Bragg, Directorate of Public Works)",
    "U.S. Air Force (Seymour Johnson AFB)",
    "U.S. Air Force (Pope Army Airfield)",
    "U.S. Army Corps of Engineers (Wilmington District)",
    "Department of Veterans Affairs",
    "North Carolina Department of Transportation",
  ],
  differentiators: [
    "Night crews across Cumberland, Hoke and Robeson counties",
    "Floor care in house: strip, wax, burnish and carpet extraction",
    "Hot-water pressure washing with wash-water recovery",
    "Crews already badged for Fort Bragg and Seymour Johnson",
  ],
  capabilityStatementFile: "/demo-files/gray-owl-facility-services-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-gray-owl-facility",
  userId: "demo-user-reggie",
  contactId: "demo-contact-reggie",
};

export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-sj-dorm-wash",
    projectTitle: "Dormitory pressure washing, 14 buildings, Seymour Johnson AFB",
    customerName: "4th Contracting Squadron, Seymour Johnson AFB, U.S. Air Force",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2025-09-08",
    periodEnd: "2025-11-21",
    totalValue: 84_600,
    naicsCode: "561790",
    scopeDescription:
      "Hot-water washing of 14 dormitories, their stairwells, sidewalks and dumpster pads, with the wash water kept out of the storm drains, scheduled around the airmen. A call under Gray Owl's pressure-washing BPA; too small for a CPARS.",
  },
  {
    id: "pp-redtail-va-floors",
    projectTitle: "Floor care at two VA clinics",
    customerName: "Redtail Veteran Facility Services (SDVOSB prime)",
    customerType: "federal_sub",
    role: "sub",
    periodStart: "2023-03-01",
    periodEnd: "2024-12-20",
    totalValue: 61_000,
    naicsCode: "561720",
    scopeDescription:
      "Strip, wax and burnish schedules and carpet extraction at two VA outpatient clinics, worked at night as Redtail's floor-care subcontractor.",
    referenceName: "Omar Gaddy",
    referenceTitle: "Project Manager, Redtail Veteran Facility Services",
  },
  {
    id: "pp-hope-mills-custodial",
    projectTitle: "Night custodial: town hall, police station and park restrooms",
    customerName: "Town of Hope Mills, NC",
    customerType: "local",
    role: "prime",
    periodStart: "2021-07-01",
    periodEnd: "2026-06-30",
    totalValue: 260_000,
    naicsCode: "561720",
    scopeDescription:
      "Five nights a week at the town hall and police station, daily park restrooms, and quarterly floor care. $52,000 a year since 2021; the current term runs to 30 June 2027.",
    referenceName: "Denise Autry",
    referenceTitle: "Town Manager, Town of Hope Mills",
  },
  {
    id: "pp-briar-glen-medical",
    projectTitle: "Night janitorial and floor care, six-building medical office park",
    customerName: "Briar Glen Medical Offices",
    customerType: "commercial",
    role: "prime",
    periodStart: "2019-02-01",
    periodEnd: "2026-01-31",
    totalValue: 2_380_000,
    naicsCode: "561720",
    scopeDescription:
      "Nightly cleaning of exam rooms, offices and restrooms across six buildings, with floor care on a set schedule. $340,000 a year since 2019.",
    referenceName: "Lyle Bracey",
    referenceTitle: "Property Manager, Briar Glen Medical Offices",
  },
  {
    id: "pp-two-creeks-stores",
    projectTitle: "Floor care and pressure washing, 12 grocery stores",
    customerName: "Two Creeks Markets",
    customerType: "commercial",
    role: "prime",
    periodStart: "2020-04-01",
    periodEnd: "2026-03-31",
    totalValue: 1_260_000,
    naicsCode: "561790",
    scopeDescription:
      "Overnight floor care inside 12 stores and hot-water washing of their fronts, carts and loading docks. $210,000 a year since 2020.",
    referenceName: "Janelle Hardee",
    referenceTitle: "Facilities Director, Two Creeks Markets",
  },
];

/** His past jobs by the role they play in the story (PastPerformanceRoles). */
export const PAST_PERFORMANCE_ROLES: PastPerformanceRoles = {
  county: "pp-hope-mills-custodial",
  cdg: "pp-redtail-va-floors",
  church: "pp-briar-glen-medical",
  womack: "pp-sj-dorm-wash",
};

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
  bio: "Sarah spent 14 years as an Army contracting officer at Fort Bragg and Fort Stewart before joining GovPreneurs. She reviews services bids, including custodial, grounds and exterior-cleaning contracts on Army and Air Force bases.",
};

/** The 8(a) prime at the center of the Army Reserve team-up. Fictional. */
export const KEY_PARTNER: Partner = {
  name: "Ashepoo Facility Solutions",
  contact: "Gerald Mims",
  contactTitle: "Capture Manager",
  city: "North Charleston, SC",
  holds: "8(a) janitorial and grounds contracts for Army Reserve centers in North and South Carolina, and Seymour Johnson's base custodial",
  seeking: "A local subcontractor to clean and mow the North Carolina centers within 60 miles of Fayetteville",
};
