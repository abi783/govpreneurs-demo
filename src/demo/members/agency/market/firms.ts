// THE AGENCY's company roster for the market pages (read through
// src/demo/explore/firms.ts, which picks the active member). Partners, Awards,
// Forecasts (Grant's take) and Government Buyers read names from here, so a
// company has one name, key and home town on every page.
//
// Every company here is made up (D13). The names were web-searched on 19 Oct 2026
// and none matched an agency. Keys use the caterer's slots: 4000 is the member and
// 4001 the team-up partner, so links such as /partners?company=4001 work for both.

import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import type { Firm } from "../../../explore/firms";

/** Lantern Row Creative itself. It appears as the winner of its NC Guard award. */
export const MEMBER_FIRM: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The service-disabled veteran-owned prime that holds the VA's hiring campaign. */
export const KEY_PARTNER_FIRM: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "Arlington",
  state: "VA",
  uei: "BV3K8M2QT7L4",
  cage: "8BVM2",
};

/** The other ranked companies. Fictional. */
export const OTHER_FIRMS: Firm[] = [
  { key: 4002, name: "Hollowell Pike Communications", city: "Raleigh", state: "NC", uei: "HP6R2W9KD4M1", cage: "5HPC8" },
  { key: 4003, name: "Kestrel Point Federal Marketing", city: "Virginia Beach", state: "VA", uei: "KP8T4N1XV6Q3", cage: "3KPF6" },
  { key: 4004, name: "Sandhill Signal Media", city: "Southern Pines", state: "NC", uei: "SS2M7J5LC9R8", cage: "7SSM1" },
  { key: 4005, name: "Quillmark Creative", city: "Fayetteville", state: "NC", uei: "QC5H9V3TB2W6", cage: "2QMC4" },
  { key: 4006, name: "Ironline Recruiting Media", city: "Columbia", state: "SC", uei: "IR4D1Z8PK7N5", cage: "9IRM3" },
  { key: 4007, name: "Harbor Nine Productions", city: "Norfolk", state: "VA", uei: "HN7Q3B6WM1X9", cage: "4HNP7" },
];

/**
 * Companies that win advertising awards near Dana but do not fit her as partners
 * (no record of hiring outside firms, or no recent wins). Awards link to them, and
 * Partners opens them with the reasons. Fictional.
 */
export const OTHER_WINNERS: Firm[] = [
  { key: 4101, name: "Calder Bay Federal Communications", city: "Reston", state: "VA", uei: "OF9L2C6RT4H8", cage: "6OFC2" },
  { key: 4102, name: "Wrenfield Public Relations", city: "Durham", state: "NC", uei: "WP3X7G1MN5D2", cage: "1WPR9" },
];
