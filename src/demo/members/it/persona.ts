// THE IT SERVICES FIRM: Hector Salinas, Gallberry Technology Group LLC — an
// 8(a) IT services firm in Fayetteville. Read through src/demo/story/persona.ts,
// which picks the active member.
// Source: demo-storyboard/it-services-pack.md (19 Oct 2026; the pack's business
// is renamed Gallberry Technology Group, as "Rockfish" belongs to another
// member). The business, its people and its commercial clients are fictional;
// government buyers are real.

import { dateDaysFromNow } from "../../story/clock";
import type { MentorProfile, PastPerformance, Persona, Partner, PastPerformanceRoles } from "../../story/persona";

export const PERSONA: Persona = {
  ownerFirstName: "Hector",
  ownerName: "Hector Salinas",
  ownerTitle: "Founder and president",
  businessName: "Gallberry Technology Group LLC",
  businessShortName: "Gallberry Tech",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "June 4, 2018",
  yearsInBusiness: 8,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "5420 Raeford Rd, Fayetteville, NC 28304",
  mailingAddress: "PO Box 53118, Fayetteville, NC 28305",
  email: "hector@gallberrytech.example",
  phone: "(910) 555-0136",
  website: "gallberrytech.example",
  uei: "GT7HS3QW9LM2",
  cage: "9GTG3",
  /** SAM registration lasts a year; he renewed 183 days ago (sc/timeline.ts). */
  samActiveUntil: dateDaysFromNow(182),
  primaryNaics: "541519",
  primaryNaicsLabel: "Other Computer Related Services",
  secondaryNaics: [
    { code: "541512", label: "Computer Systems Design Services" },
    { code: "541513", label: "Computer Facilities Management Services" },
    { code: "518210", label: "Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services" },
  ],
  setAsideEligibility: ["SBA", "8A"],
  // No NC HUB: North Carolina ended HUB certification on 7 July 2026 (S.L. 2026-41).
  certifications: [
    "Small Business",
    "SBA 8(a) (since March 2021; the term ends March 2030)",
    "Small Disadvantaged Business (SDB)",
  ],
  clearances: [],
  employeesW2: 16,
  kitchen: "Office and repair bench on Raeford Rd: 11 techs, 2 network admins and a security officer, with a second crew on site at Seymour Johnson AFB",
  annualRevenue: 2_600_000,
  annualRevenueBand: "$2.5M–$5M",
  targetValueMin: 50_000,
  targetValueMax: 1_200_000,
  /** IT services are not bonded. */
  largestBond: 0,
  serviceStates: ["NC", "SC", "VA"],
  serviceRadiusMiles: 150,
  targetAgencies: [
    "U.S. Army (Fort Bragg)",
    "U.S. Air Force (Seymour Johnson AFB and Pope Army Airfield)",
    "Defense Health Agency (the Army medical center at Fort Bragg)",
    "NC National Guard",
    "NC local governments and schools",
  ],
  differentiators: [
    "Techs who already work Army and Air Force tickets",
    "9 of 11 techs hold Security+",
    "At your desk within 2 hours inside 30 miles",
    "Microsoft 365, Intune and SharePoint admin in house",
  ],
  capabilityStatementFile: "/demo-files/gallberry-technology-group-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-gallberry-technology-group",
  userId: "demo-user-hector",
  contactId: "demo-contact-hector",
};

export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-sjafb-desktop-support",
    projectTitle: "Desktop support, 4th Communications Squadron, Seymour Johnson AFB",
    customerName: "4th Contracting Squadron, Seymour Johnson AFB, U.S. Air Force",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2024-03-01",
    periodEnd: "2027-02-28",
    totalValue: 492_600,
    naicsCode: "541513",
    scopeDescription:
      "Two on-site techs for the squadron's desktop support, plus an imaging surge for 1,100 Windows 11 laptops. A base year and two options; interim CPARS Very Good.",
  },
  {
    id: "pp-bragg-helpdesk-seats",
    projectTitle: "Help-desk seats on Fort Bragg",
    customerName: "Tarbridge Federal Systems (large IT prime)",
    customerType: "federal_sub",
    role: "sub",
    periodStart: "2019-01-07",
    periodEnd: "2023-09-29",
    totalValue: 1_140_000,
    naicsCode: "541519",
    scopeDescription:
      "Staffed Tier 1 and Tier 2 help-desk seats for Army units on Fort Bragg as Tarbridge Federal's subcontractor, phone and walk-up, five days a week.",
    referenceName: "Denise Holloman",
    referenceTitle: "Program Manager, Tarbridge Federal Systems",
  },
  {
    id: "pp-ccs-chromebook-reimage",
    projectTitle: "Summer Chromebook re-imaging, 4,800 devices",
    customerName: "Cumberland County Schools, Technology Services",
    customerType: "local",
    role: "prime",
    periodStart: "2023-06-12",
    periodEnd: "2023-08-11",
    totalValue: 61_000,
    naicsCode: "541519",
    scopeDescription:
      "Wiped, re-imaged, tagged and returned 4,800 student Chromebooks over the summer break, ahead of the first school day.",
    referenceName: "Raymond Pittman",
    referenceTitle: "Director of Technology Services, Cumberland County Schools",
  },
  {
    id: "pp-sandhills-managed-it",
    projectTitle: "Managed IT and help desk, four clinics",
    customerName: "Sandhills Family Medicine",
    customerType: "commercial",
    role: "prime",
    periodStart: "2021-04-01",
    periodEnd: "2026-10-19",
    totalValue: 96_000,
    naicsCode: "541512",
    scopeDescription:
      "Help desk, Microsoft 365 and network support for four family-medicine clinics, about $96,000 a year since 2021.",
    referenceName: "Dr. Alma Ferebee",
    referenceTitle: "Managing Physician, Sandhills Family Medicine",
  },
];

/** His past jobs by the role they play in the story (PastPerformanceRoles). */
export const PAST_PERFORMANCE_ROLES: PastPerformanceRoles = {
  county: "pp-ccs-chromebook-reimage",
  cdg: "pp-bragg-helpdesk-seats",
  church: "pp-sandhills-managed-it",
  womack: "pp-sjafb-desktop-support",
};

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR: MentorProfile = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
  bio: "Sarah spent 14 years as an Army contracting officer at Fort Bragg and Fort Stewart before joining GovPreneurs. She reviews IT services bids, including help desk and network support for Army units at Fort Bragg.",
};

/** The 8(a) STARS III holder at the center of the hospital IT team-up. Fictional. */
export const KEY_PARTNER: Partner = {
  name: "Brackwater Federal Solutions",
  contact: "Colleen Ashby",
  contactTitle: "Capture Director",
  city: "Chesapeake, VA",
  holds: "An 8(a) STARS III contract; it runs hospital IT at two Navy medical centers",
  seeking: "A local firm to run 9 deskside techs at Fort Bragg's Army medical center and its clinics",
};
