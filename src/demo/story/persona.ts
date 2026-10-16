// The one sample member the whole demo is about. Every screen reads these
// facts from here; no screen types them again.
// Source: Karthik's prototype `src/lib/mock/currentMember.ts` and
// `businessProfile.ts` (Haddad Catering replaced Marcus Williams on 25 Aug 2026).

export const PERSONA = {
  ownerFirstName: "Amira",
  ownerName: "Amira Haddad",
  businessName: "Haddad Catering & Food Services LLC",
  businessShortName: "Haddad Catering",
  entityType: "LLC",
  stateOfIncorporation: "North Carolina",
  formedOn: "March 3, 2024",
  hqCity: "Fayetteville",
  hqState: "NC",
  hqCounty: "Cumberland County",
  physicalAddress: "201 Hay St, Fayetteville, NC 28301",
  email: "amira@haddadcateringnc.com",
  website: "haddadcateringnc.com",
  uei: "LW1SL1HLED3",
  cage: "16WG0",
  samActiveUntil: "2027-04-15",
  primaryNaics: "722310",
  primaryNaicsLabel: "Food Service Contractors",
  secondaryNaics: [
    { code: "722320", label: "Caterers" },
    { code: "722330", label: "Mobile Food Services" },
    { code: "311991", label: "Perishable Prepared Food Manufacturing" },
  ],
  certifications: ["Small Business", "Woman-Owned Small Business (WOSB)"],
  employeesW2: 5,
  annualRevenue: 620_000,
  annualRevenueBand: "$500K–$1M",
  targetValueMin: 120_000,
  targetValueMax: 750_000,
  /** Largest bond she has ever carried. Grant uses it on Fort Bragg dining. */
  largestBond: 200_000,
  serviceStates: ["NC", "VA", "SC"],
  serviceRadiusMiles: 200,
  targetAgencies: ["U.S. Army (Fort Bragg)", "Department of Veterans Affairs", "NC school districts"],
  plan: "Elite",
  locationId: "demo-haddad-catering",
  userId: "demo-user-amira",
} as const;

export type Persona = typeof PERSONA;

/** The one mentor in the story. Every screen uses this name. */
export const MENTOR = {
  name: "Sarah Mitchell",
  firstName: "Sarah",
  title: "GovCon mentor · former Army contracting officer",
} as const;
