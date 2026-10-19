// THE IT SERVICES FIRM's company roster for the market pages (read through
// src/demo/explore/firms.ts, which picks the active member). Partners, Awards,
// Forecasts (Grant's take) and Government Buyers read names from here, so a
// company has one name, key and home town on every page.
//
// Every company here is made up (D13). Source: demo-storyboard/it-services-pack.md,
// section 13. The pack's names (Brackwater, Northfork, Pinecrest, Larkspur, Kettle
// Creek) were web-searched on 19 Oct 2026 with no match; Ironweed Health IT, Sandy
// Ridge Technical Services, Granite Ledge Federal Systems and Fallow Point
// Technologies were added for the build and are not checked.
// Keys use the caterer's slots: 4000 is the member and 4001 the team-up partner,
// so links such as /partners?company=4001 work for every member.

import { KEY_PARTNER, PERSONA } from "../../../story/persona";
import type { Firm } from "../../../explore/firms";

/** Gallberry Technology Group itself. It appears as the winner of its Seymour Johnson job. */
export const MEMBER_FIRM: Firm = {
  key: 4000,
  name: PERSONA.businessName,
  city: PERSONA.hqCity,
  state: PERSONA.hqState,
  uei: PERSONA.uei,
  cage: PERSONA.cage,
};

/** The 8(a) STARS III holder that wants his techs at the Army hospital at Fort Bragg. */
export const KEY_PARTNER_FIRM: Firm = {
  key: 4001,
  name: KEY_PARTNER.name,
  city: "Chesapeake",
  state: "VA",
  uei: "BW4F8K2NQ6T9",
  cage: "8BWF3",
};

/** The other ranked companies. Fictional. */
export const OTHER_FIRMS: Firm[] = [
  // Small-business ITES-3S holder; held the Army Reserve's knowledge management order.
  { key: 4002, name: "Larkspur Federal IT", city: "Hampton", state: "VA", uei: "LF6P3W8MD2K5", cage: "5LFI7" },
  // Security officers and CMMC help for small firms.
  { key: 4003, name: "Northfork Cyber LLC", city: "Raleigh", state: "NC", uei: "NC9T2H5RB7X4", cage: "3NFC9" },
  // Cabling and audio-visual installer; the sub Gallberry sends cabling to.
  { key: 4004, name: "Pinecrest Signal Group", city: "Sanford", state: "NC", uei: "PS4K7Q1VJ8N3", cage: "7PSG2" },
  // 8(a) rival; won the Windows 11 surge on price.
  { key: 4005, name: "Kettle Creek Technologies", city: "Fayetteville", state: "NC", uei: "KC2M8X4TL6R1", cage: "2KCT6" },
  // 8(a) STARS III holder; runs the Army hospital's IT at Fort Bragg now.
  { key: 4006, name: "Ironweed Health IT", city: "Norfolk", state: "VA", uei: "IH7R3N9WC5Q2", cage: "6IHI4" },
  // 8(a) firm owned by an Alaska Native corporation; Pope's 43 CS IT support went to it twice.
  { key: 4007, name: "Sandy Ridge Technical Services", city: "Fayetteville", state: "NC", uei: "SR5J1D6KP9V8", cage: "4SRT8" },
];

/**
 * Companies that win IT awards near Fort Bragg but do not fit him as partners.
 * Awards link to them, and Partners opens them with the reasons. Fictional.
 */
export const OTHER_WINNERS: Firm[] = [
  // Large ITES-3S holder: Fort Bragg's logistics systems, network and cyber orders.
  { key: 4101, name: "Granite Ledge Federal Systems", city: "Herndon", state: "VA", uei: "GL3W9B5TX2M7", cage: "9GLF5" },
  // USSOCOM's end-user seats and the Fort Bragg network enterprise center's IT.
  { key: 4102, name: "Fallow Point Technologies", city: "Tampa", state: "FL", uei: "FP8N2C7HZ4L6", cage: "1FPT3" },
];
