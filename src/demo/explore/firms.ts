// The fictional companies of the Explore pages. Partners, Awards, Forecasts
// (Grant's take) and the Pipeline all read their names from this one roster, so
// a company has the same name, key and home town on every page.
// Every company here is made up. Do not add a real company name.
//
// DEMO: two members (src/demo/member.ts). The caterer's roster is below; the
// agency's is in src/demo/members/agency/market/firms.ts. The export names are the
// caterer's: AMIRA_FIRM is the member, CAROLINA_DINING the team-up partner.

import { byMember } from "@/demo/member";
import { KEY_PARTNER, PERSONA } from "@/demo/story/persona";
import * as agency from "@/demo/members/agency/market/firms";

export interface Firm {
  /** The number that Partners and Awards use to join a company (awardeeKey). */
  key: number;
  name: string;
  /** Home town. */
  city: string;
  state: string;
  /** Twelve characters, made up. */
  uei: string;
  /** Five characters, made up. */
  cage: string;
}

/** Haddad Catering itself. It appears as the winner of the Womack award. */
const CATERER_SELF: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The prime that holds Fort Bragg dining and is looking for woman-owned subcontractors. */
const CATERER_PARTNER: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "Fayetteville",
  state: "NC",
  uei: "CD7M2K9PQ4L3",
  cage: "6CDG1",
};

/** The other partners. Fictional. */
const CATERER_OTHERS: Firm[] = [
  { key: 4002, name: "Longleaf Mess Services", city: "Southern Pines", state: "NC", uei: "LM4R8T1VX6N2", cage: "7LMS4" },
  { key: 4003, name: "Cape Fear Galley Partners", city: "Wilmington", state: "NC", uei: "CF9H3W5ZB7Q1", cage: "5CFG9" },
  { key: 4004, name: "Tarheel Institutional Foods", city: "Raleigh", state: "NC", uei: "TI2K6P8DM4Y9", cage: "8TIF2" },
  { key: 4005, name: "Pamlico Food Management", city: "Jacksonville", state: "NC", uei: "PF5N1C7XG3J8", cage: "4PFM7" },
  { key: 4006, name: "Yadkin Hospitality Contractors", city: "Greensboro", state: "NC", uei: "YH8Q4L2RV6T5", cage: "3YHC6" },
  { key: 4007, name: "Palmetto Mess Management", city: "Columbia", state: "SC", uei: "PM3D7S9KW1B4", cage: "9PMM3" },
  { key: 4008, name: "Tidewater Galley Solutions", city: "Norfolk", state: "VA", uei: "TG6V2N4HJ8Z7", cage: "2TGS8" },
  { key: 4009, name: "Falling Creek Dining Group", city: "Goldsboro", state: "NC", uei: "FC1X5M3QC9F6", cage: "1FCD5" },
  { key: 4010, name: "Neuse River Provisioning", city: "Kinston", state: "NC", uei: "NR7J9T6LY2P3", cage: "6NRP1" },
  { key: 4011, name: "Hatteras Culinary Contractors", city: "Virginia Beach", state: "VA", uei: "HC4B8G1ZS5W2", cage: "0HCC9" },
];

/** The member's own company. It wins one award in the record. */
export const AMIRA_FIRM: Firm = byMember({ agency: agency.MEMBER_FIRM, caterer: CATERER_SELF });
/** The team-up partner: Carolina Dining Group, or Bluestone Veteran Media Group. */
export const CAROLINA_DINING: Firm = byMember({ agency: agency.KEY_PARTNER_FIRM, caterer: CATERER_PARTNER });
export const OTHER_FIRMS: Firm[] = byMember({ agency: agency.OTHER_FIRMS, caterer: CATERER_OTHERS });

export const ALL_FIRMS: Firm[] = [CAROLINA_DINING, ...OTHER_FIRMS];

export function firmByKey(key: number): Firm | undefined {
  return key === AMIRA_FIRM.key ? AMIRA_FIRM : ALL_FIRMS.find((f) => f.key === key);
}

/**
 * Companies that win food-service awards near Amira but do not fit her as partners
 * (too large, or outside her states). Awards link to them, and Partners opens them
 * with the reasons they are not one of her matches. Fictional.
 */
const CATERER_OTHER_WINNERS: Firm[] = [
  { key: 4101, name: "Ironwood Federal Facilities", city: "Charlotte", state: "NC", uei: "IF2L8Q4MR6X1", cage: "3IFF7" },
  { key: 4102, name: "Summit Healthcare Nutrition", city: "Durham", state: "NC", uei: "SH6T3Z9KB5N8", cage: "7SHN2" },
  { key: 4103, name: "Atlantic Field Feeding", city: "Norfolk", state: "VA", uei: "AF1C7V4DW2Y6", cage: "5AFF3" },
  { key: 4104, name: "Magnolia School Foods", city: "Charleston", state: "SC", uei: "MS8P5J2XH9Q4", cage: "8MSF6" },
];

export const OTHER_WINNERS: Firm[] = byMember({ agency: agency.OTHER_WINNERS, caterer: CATERER_OTHER_WINNERS });

/** Every fictional company, Amira included, for a lookup by key. */
export const EVERY_FIRM: Firm[] = [AMIRA_FIRM, ...ALL_FIRMS, ...OTHER_WINNERS];

export function anyFirmByKey(key: number): Firm | undefined {
  return EVERY_FIRM.find((f) => f.key === key);
}
