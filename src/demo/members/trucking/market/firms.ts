// THE TRUCKING COMPANY's company roster for the market pages (read through
// src/demo/explore/firms.ts, which picks the active member). Partners, Awards,
// Forecasts (Grant's take) and Government Buyers read names from here, so a
// company has one name, key and home town on every page.
//
// Every company here is made up (D13). Source: demo-storyboard/trucking-pack.md,
// section 13 (names web-searched 19 Oct 2026, no carrier by these names found).
// Keys use the caterer's slots: 4000 is the member and 4001 the team-up partner,
// so links such as /partners?company=4001 work for every member.

import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import type { Firm } from "../../../explore/firms";

/** Rockfish Run Freight itself. It appears as the winner of its Fort Bragg hauling job. */
export const MEMBER_FIRM: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The EAGLE agreement holder that runs Fort Bragg's logistics contract and wants her as its carrier. */
export const KEY_PARTNER_FIRM: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "Huntsville",
  state: "AL",
  uei: "BW5S8N3QH2T7",
  cage: "9BWS3",
};

/** The other ranked companies. Fictional. */
export const OTHER_FIRMS: Firm[] = [
  // Service-disabled veteran-owned courier carrier; runs VA NCO 6's instrument and lab runs.
  { key: 4002, name: "Tallow Creek Carriers", city: "Raleigh", state: "NC", uei: "TC4R7K2MV9D1", cage: "4TCC8" },
  // Small carrier with Camp Lejeune's on-call trailer transport.
  { key: 4003, name: "Bellamy Point Logistics", city: "Wilmington", state: "NC", uei: "BP8L3W6QZ2N5", cage: "6BPL3" },
  // Service-disabled veteran-owned refrigerated carrier; holds the VA's chilled freight routes.
  { key: 4004, name: "Quinlan Reefer Lines", city: "Florence", state: "SC", uei: "QR2F9T5KX8C4", cage: "2QRL7" },
  // Small hauler that wins Fort Bragg's trailer removals.
  { key: 4005, name: "Kelso Gap Hauling", city: "Sanford", state: "NC", uei: "KG6H2D8RW3P7", cage: "7KGH5" },
  // Small dump and flatbed hauler; delivered the Mattamuskeet refuge gravel.
  { key: 4006, name: "Gray Heron Freight", city: "Southern Pines", state: "NC", uei: "GH9M4V1TS6B2", cage: "3GHF9" },
];

/**
 * Companies that win trucking awards near Fort Bragg but do not fit her as
 * partners.
 */
export const OTHER_WINNERS: Firm[] = [
  { key: 4101, name: "Ashpole Courier Group", city: "Lumberton", state: "NC", uei: "AC3J8P5NL7W1", cage: "5ACG2" },
  { key: 4102, name: "Saltmarsh Cold Chain", city: "Jacksonville", state: "FL", uei: "SC7Q2X9FD4M8", cage: "8SCC4" },
  { key: 4103, name: "Pelham Ridge Movers", city: "Hammond", state: "LA", uei: "PR5N1K6YH3V9", cage: "1PRM6" },
];
