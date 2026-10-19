// THE CONSULTANT's company roster for the market pages (read through
// src/demo/explore/firms.ts, which picks the active member). Partners, Awards,
// Forecasts (Grant's take) and Government Buyers read names from here, so a
// company has one name, key and home town on every page.
//
// Every company here is made up (D13). Source: demo-storyboard/consulting-pack.md,
// section 13 (names web-searched 19 Oct 2026, no match). Keys use the caterer's
// slots: 4000 is the member and 4001 the team-up partner, so links such as
// /partners?company=4001 work for every member.

import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import type { Firm } from "../../../explore/firms";

/** Coppervale Advisory Group itself. It appears as the winner of its Fort Bragg ACS job. */
export const MEMBER_FIRM: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The service-disabled veteran-owned prime that holds the Army's family readiness staff training. */
export const KEY_PARTNER_FIRM: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "Chesapeake",
  state: "VA",
  uei: "HP4K9T2WQ7M3",
  cage: "8HPH5",
};

/** The other ranked companies. Fictional. */
export const OTHER_FIRMS: Firm[] = [
  // Service-disabled veteran-owned analytics firm on a GSA schedule; holds Fort Bragg's manpower support.
  { key: 4002, name: "Wickline Federal Analytics", city: "McLean", state: "VA", uei: "WF7N3R8KD2L5", cage: "5WFA9" },
  // Woman-owned consulting firm on a GSA schedule; wins Army Reserve and training-model orders.
  { key: 4003, name: "Bellhaven Mission Partners", city: "Raleigh", state: "NC", uei: "BM2Q6H9TX4C8", cage: "3BMP7" },
  // Service-disabled veteran-owned and 8(a); the local rival on Fort Bragg family programs.
  { key: 4004, name: "Corriher Lane Consulting", city: "Fayetteville", state: "NC", uei: "CL8V1M5PJ3W6", cage: "7CLC2" },
  // Service-disabled veteran-owned leadership trainer; ran the Fayetteville VA's last program.
  { key: 4005, name: "Tamarack Leadership Group", city: "Durham", state: "NC", uei: "TL5D4X7NB9R1", cage: "2TLG6" },
];

/**
 * Companies that win consulting awards near Simone but do not fit her as
 * partners. Awards link to them, and Partners opens them with the reasons. Fictional.
 */
export const OTHER_WINNERS: Firm[] = [
  // A large firm: its VA orders come off a GSA schedule with no small-business plan to join.
  { key: 4101, name: "Penhallow Federal Advisory", city: "Reston", state: "VA", uei: "PF3T8L2GK6Z9", cage: "6PFA4" },
];
