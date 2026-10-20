// THE JANITORIAL FIRM's company roster for the market pages (read through
// src/demo/explore/firms.ts, which picks the active member). Partners, Awards,
// Forecasts (Grant's take) and Government Buyers read names from here, so a
// company has one name, key and home town on every page.
//
// Every company here is made up (D13). Source: demo-storyboard/janitorial-pack.md,
// section 13 (names web-searched 19 Oct 2026, no cleaning firm by these names found).
// The pack's AbilityOne nonprofit is renamed Quillmoor Industries here: its first
// name is another member's word. Keys use the caterer's slots: 4000 is the member
// and 4001 the team-up partner, so links such as /partners?company=4001 work for
// every member.

import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import type { Firm } from "../../../explore/firms";

/** Gray Owl itself. It appears as the winner of its Seymour Johnson dorm job. */
export const MEMBER_FIRM: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The 8(a) prime that wants a local sub for the Army Reserve centers in North Carolina. */
export const KEY_PARTNER_FIRM: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "North Charleston",
  state: "SC",
  uei: "AF4K8M2QT6W9",
  cage: "8AFS3",
};

/** The other ranked companies. Fictional. */
export const OTHER_FIRMS: Firm[] = [
  // Service-disabled veteran-owned; VA janitorial. Hired Gray Owl for floor care at two clinics.
  { key: 4002, name: "Redtail Veteran Facility Services", city: "Fayetteville", state: "NC", uei: "RV6N2H8KD3P1", cage: "5RVF2" },
  // HUBZone; Fort Bragg's pressure-washing incumbent and his main rival on the hero bid.
  { key: 4003, name: "Highland Brook Exterior Services", city: "Raeford", state: "NC", uei: "HB3T9W5LC7M2", cage: "7HBX4" },
  // Small business; Corps lake custodial and the EPA campus in RTP.
  { key: 4004, name: "Kingsdale Custodial Group", city: "Charlotte", state: "NC", uei: "KC8R1V4NZ6J3", cage: "2KCG9" },
  // Small business; beat him at Jordan Lake on price.
  { key: 4005, name: "Peachline Commercial Cleaning", city: "Austell", state: "GA", uei: "PC5D7Q3XH9B4", cage: "4PCC6" },
];

/**
 * Companies that win cleaning awards near Fort Bragg but are not partners for him:
 * the AbilityOne nonprofit (it must use its own workforce) and Womack's IDIQ holder.
 */
export const OTHER_WINNERS: Firm[] = [
  { key: 4101, name: "Quillmoor Industries", city: "Fayetteville", state: "NC", uei: "QI2M6T9RK4L8", cage: "3QMI7" },
  { key: 4102, name: "Clearline Health Services JV", city: "San Antonio", state: "TX", uei: "CH7P3B8WN5S1", cage: "6CLH8" },
];
