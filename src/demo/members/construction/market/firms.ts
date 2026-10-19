// THE CONTRACTOR's company roster for the market pages (read through
// src/demo/explore/firms.ts, which picks the active member). Partners, Awards,
// Forecasts (Grant's take) and Government Buyers read names from here, so a
// company has one name, key and home town on every page.
//
// Every company here is made up (D13). Source: demo-storyboard/construction-pack.md,
// section 13 (names web-searched 19 Oct 2026, no builder by these names found).
// Keys use the caterer's slots: 4000 is the member and 4001 the team-up partner,
// so links such as /partners?company=4001 work for every member.

import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import type { Firm } from "../../../explore/firms";

/** Ninebark Builders itself. It appears as the winner of its Pope job. */
export const MEMBER_FIRM: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The service-disabled veteran-owned prime that wants him on the Fayetteville VA fan coils. */
export const KEY_PARTNER_FIRM: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "Durham",
  state: "NC",
  uei: "BJ7Q4N2WK8T3",
  cage: "9BJO4",
};

/** The other ranked companies. Fictional. */
export const OTHER_FIRMS: Firm[] = [
  // HUBZone general contractor on Fort Bragg's Vertical Construction MATOC; hired Ninebark as its electrical sub.
  { key: 4002, name: "Turnrow Federal", city: "Maxton", state: "NC", uei: "TF5M2R8XC1K6", cage: "4TRF7" },
  // HUBZone HVAC firm on Fort Bragg's Minor Construction MATOC.
  { key: 4003, name: "Pocosin Mechanical", city: "Lumberton", state: "NC", uei: "PM8N3Q6VD2H4", cage: "6PCM2" },
  // 8(a) general contractor.
  { key: 4004, name: "Wirefield Constructors", city: "Red Springs", state: "NC", uei: "WC2K7T4LB9R1", cage: "3WFC8" },
  // Service-disabled veteran-owned builder; did the VA's 3rd-floor fan coils.
  { key: 4005, name: "Galeway Veteran Builders", city: "Wilmington", state: "NC", uei: "GV6H1W9PX3M5", cage: "7GVB1" },
  // Small-business general contractor with USACE Savannah's barracks repair.
  { key: 4006, name: "Ironsprings Federal Constructors", city: "Virginia Beach", state: "VA", uei: "IF4R8D2NZ7Q9", cage: "2IFC5" },
];

/**
 * Companies that win building awards near Fort Bragg but do not fit him as
 * partners. None in this record: every winner in awards.ts is ranked.
 */
export const OTHER_WINNERS: Firm[] = [];
