// The one sample member the whole demo is about. Every screen reads these
// facts from here; no screen types them again.
// Source: Karthik's prototype `src/lib/mock/currentMember.ts` and
// `businessProfile.ts` (Haddad Catering replaced Marcus Williams on 25 Aug 2026).
// Changes from the prototype: the business was formed in 2021, not 2024, so
// that her 2021 church catering job is not older than the business itself;
// the church is fictional; she has a capability statement, because Hunter's
// "Why these?" panel needs one.

export const PERSONA = {
  ownerFirstName: "Amira",
  ownerName: "Amira Haddad",
  ownerTitle: "Owner and executive chef",
  businessName: "Haddad Catering & Food Services LLC",
  businessShortName: "Haddad Catering",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "March 3, 2021",
  yearsInBusiness: 5,
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "201 Hay St, Fayetteville, NC 28301",
  mailingAddress: "PO Box 5512, Fayetteville, NC 28302",
  email: "amira@haddadcateringnc.com",
  phone: "(910) 555-0148",
  website: "haddadcateringnc.com",
  uei: "LW1SL1HLED37",
  cage: "16WG0",
  samActiveUntil: "2027-04-15",
  primaryNaics: "722310",
  primaryNaicsLabel: "Food Service Contractors",
  secondaryNaics: [
    { code: "722320", label: "Caterers" },
    { code: "722330", label: "Mobile Food Services" },
    { code: "311991", label: "Perishable Prepared Food Manufacturing" },
  ],
  /** SAM set-aside codes she is eligible for. */
  setAsideEligibility: ["SBA", "WOSB"],
  certifications: ["Small Business", "Woman-Owned Small Business (WOSB)"],
  /** Security clearances held by her staff. None. */
  clearances: [] as string[],
  employeesW2: 5,
  /** Staff who hold a current food-handler (ServSafe) certificate. */
  foodHandlerCertified: 3,
  kitchen: "Commercial kitchen at 201 Hay St, 2 refrigerated delivery vans",
  annualRevenue: 620_000,
  annualRevenueBand: "$500K–$1M",
  targetValueMin: 120_000,
  targetValueMax: 750_000,
  /** Largest bond she has ever carried. Grant uses it on Fort Bragg dining. */
  largestBond: 200_000,
  serviceStates: ["NC", "VA", "SC"],
  serviceRadiusMiles: 200,
  targetAgencies: ["U.S. Army (Fort Bragg)", "Department of Veterans Affairs", "NC school districts"],
  differentiators: [
    "Cooks and delivers 1,100 meals a day from one kitchen",
    "Therapeutic diets (renal, diabetic, pureed) to a dietitian's order",
    "Halal and allergen-labelled menus as standard",
    "Two refrigerated vans for same-day delivery inside 60 miles",
  ],
  capabilityStatementFile: "/demo-files/haddad-catering-capability-statement.pdf",
  plan: "Elite",
  locationId: "demo-haddad-catering",
  userId: "demo-user-amira",
} as const;

export type Persona = typeof PERSONA;

export type PastPerformanceId = "pp-county-schools" | "pp-cdg-sub" | "pp-church" | "pp-womack";

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

// Past jobs are history, so their dates are fixed, not relative.
export const PAST_PERFORMANCE: PastPerformance[] = [
  {
    id: "pp-county-schools",
    projectTitle: "Cumberland County Schools summer meals program",
    customerName: "Cumberland County Schools",
    customerType: "local",
    role: "prime",
    periodStart: "2023-06-01",
    periodEnd: "2023-08-18",
    totalValue: 198_000,
    naicsCode: "722310",
    scopeDescription:
      "Cooked and delivered 1,100 breakfasts and lunches a day to nine summer meal sites across Fayetteville. USDA meal-pattern menus, daily temperature logs, allergen-labelled trays.",
    referenceName: "Janet Reyes",
    referenceTitle: "Child Nutrition Director, Cumberland County Schools",
  },
  {
    id: "pp-cdg-sub",
    projectTitle: "Fort Bragg dining facility support (subcontract)",
    customerName: "Carolina Dining Group (prime), U.S. Army Fort Bragg",
    customerType: "federal_sub",
    role: "sub",
    periodStart: "2024-01-08",
    periodEnd: "2024-12-20",
    totalValue: 340_000,
    naicsCode: "722310",
    scopeDescription:
      "Weekend and holiday meal service at two on-post dining facilities as a 30% subcontractor. Short-order line, salad bar, dish room, full HACCP records under the prime's quality plan.",
    referenceName: "Mike Sutton",
    referenceTitle: "Operations Manager, Carolina Dining Group",
  },
  {
    id: "pp-church",
    projectTitle: "Riverside Fellowship Church event catering",
    customerName: "Riverside Fellowship Church",
    customerType: "commercial",
    role: "prime",
    periodStart: "2021-06-01",
    periodEnd: "2021-09-15",
    totalValue: 62_000,
    naicsCode: "722320",
    scopeDescription:
      "Catered eleven events from 80 to 400 guests: weddings, memorials and a community iftar. Menu planning, on-site cooking, servers, setup and clean-up.",
    referenceName: "Pastor David Hall",
    referenceTitle: "Senior Pastor, Riverside Fellowship Church",
  },
  {
    id: "pp-womack",
    projectTitle: "Womack Army Medical Center patient meal support",
    customerName: "Womack Army Medical Center, U.S. Army",
    customerType: "federal_prime",
    role: "prime",
    periodStart: "2024-02-15",
    periodEnd: "2024-08-30",
    totalValue: 126_000,
    naicsCode: "722310",
    scopeDescription:
      "Therapeutic diet trays for the inpatient wards during a kitchen refit. Renal, diabetic and pureed diets to dietitian order, tray-line temperature checks every service.",
    awaitingReview: true,
  },
];

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
  bio: "Sarah spent 14 years as an Army contracting officer at Fort Bragg and Fort Stewart before joining GovPreneurs. She reviews food-service and facilities bids.",
} as const;

/** The incumbent and teaming partner at the centre of the Fort Bragg story. */
export const KEY_PARTNER = {
  name: "Carolina Dining Group",
  contact: "Mike Sutton",
  contactTitle: "Operations Manager",
  city: "Fayetteville, NC",
  holds: "Fort Bragg dining facility food service, held since 2019 (4 of 4 options exercised)",
  seeking: "Woman-owned catering subcontractors for the Fort Bragg recompete",
} as const;
