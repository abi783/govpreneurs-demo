// THE CONTRACTOR's contract vehicles (read through src/lib/mock/vehicles.ts, which
// picks the active member). Source: demo-storyboard/construction-pack.md, section 13.
// Every vehicle and rule here is real. Derrick is on neither Fort Bragg HUBZone
// MATOC: answering the Minor Construction follow-on's sources sought is Grant's
// "next time" step (gap 1).
//
// Sources (checked 19 Oct 2026):
//   Minor Construction MATOC   https://sam.gov/opp/a41d8e4d855e416a8e27e0960c99e810/view
//                              https://sam.gov/opp/e8f19762271a46c29789f636a4f11794/view
//   Vertical Construction MATOC https://sam.gov/opp/f21282ed70464a2c8ad2d063c6560cf8/view
//   SBA HUBZone program (13 CFR 126)  https://www.ecfr.gov/current/title-13/chapter-I/part-126
//   SBA mentor-protégé joint ventures (13 CFR 125.9)  https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.9
//   VA Veterans First (38 U.S.C. 8127)  https://www.law.cornell.edu/uscode/text/38/8127
//   DoDEA Fort Bragg 8(a) IDIQ  https://www.usaspending.gov/award/CONT_IDV_W9123625D6004_9700
//   NC bid and bond thresholds (G.S. 143-129, 44A-26)
//     https://ftp.ncleg.gov/EnactedLegislation/Statutes/PDF/BySection/Chapter_44A/GS_44A-26.pdf

import type { Vehicle } from "@/lib/mock/vehicles";
import { HERO_IDS } from "../opportunities";

export const VEHICLES: Vehicle[] = [
  // ── Fits a general contractor ──────────────────────────────────────
  {
    id: "veh-bragg-minor-matoc",
    name: "Fort Bragg DPW Minor Construction MATOC (HUBZone)",
    type: "MATOC",
    sponsor: "Army MICC, Fort Bragg",
    ceilingValue: 0, // the Army has not published a total; about $7M went to each holder
    setAside: "HUBZone",
    scope:
      "Fort Bragg's pool of HUBZone contractors for small electrical, HVAC and repair orders (NAICS 238210, 238220, 238990). Awarded in February 2023, about $7M to each holder; it orders through 31 January 2028. Only holders see the orders.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "Sources sought open now; the follow-on is expected in about 8 months",
    fitsFood: true,
    fitReason:
      "You are not on it yet, and most of the base's HUBZone repair work goes through it. The Army is asking about the follow-on now: answer with three similar jobs from the last six years, a surety letter and your CPARS. This is Grant's \"next time\" step.",
    pursueLink: { label: "See the sources sought", href: "/opportunities/W91247-27-R-0007" },
  },
  {
    id: "veh-sba-hubzone",
    name: "SBA HUBZone Program",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "HUBZone",
    scope:
      "Lets agencies set work aside for certified HUBZone small businesses: firms based in a HUBZone with at least 35% of staff living in one. Certification is renewed every three years.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You hold it. The Fort Bragg training building bid is set aside under it. Two things to watch: 9 of your 25 staff live in a HUBZone (36%), so one out-of-zone hire drops you under 35%, and your recertification is due in 44 days.",
    pursueLink: { label: "See the training building bid", href: `/opportunities/${HERO_IDS.hero}` },
  },
  {
    id: "veh-sba-mentor-protege",
    name: "SBA Mentor-Protégé Program (teaming with a larger firm)",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "A small business partners with a larger firm that coaches it. The two can bid together as a joint venture on set-aside work that the smaller firm, the protégé, qualifies for, and lean on the mentor's bonding.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "A joint venture could bid HUBZone and small-business jobs above your $1.5M single bond. It cannot bid VA work set aside for service-disabled veteran-owned firms, because you are not one. For the Fayetteville VA fan coils, a subcontract with Blackjack Oak is the way in.",
    pursueLink: { label: "See Blackjack Oak Federal Builders", href: "/partners?view=find&company=4001" },
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-bragg-vertical-matoc",
    name: "Fort Bragg DPW Vertical Construction MA IDIQ (HUBZone)",
    type: "MATOC",
    sponsor: "Army MICC, Fort Bragg",
    ceilingValue: 0,
    setAside: "HUBZone",
    scope:
      "Fort Bragg's pool of HUBZone contractors for larger building repairs, with orders up to about $2.4M. It drew 19 offers, was awarded in September 2023 and orders through 31 August 2028.",
    openToNewEntrants: "Closed — next on-ramp not announced",
    recompeteWindow: "Orders through August 2028",
    fitsFood: true,
    fitReason:
      "The barracks HVAC repair is only for its holders, and you are not one. Its orders are also above your single bond. If you want that work, price the HVAC for a holder such as Turnrow Federal.",
    pursueLink: { label: "See the barracks HVAC repair", href: `/opportunities/${HERO_IDS.twin}` },
  },
  {
    id: "veh-va-veterans-first",
    name: "VA Veterans First (a rule, not a contract)",
    type: "Program",
    sponsor: "Department of Veterans Affairs",
    ceilingValue: 0,
    setAside: "SDVOSB",
    scope:
      "When two or more veteran-owned firms can bid, the VA must set the work aside for them (38 U.S.C. 8127). Its construction near you is veteran-owned first.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "You are not veteran-owned, so VA construction near you means working under a veteran-owned prime.",
  },
  {
    id: "veh-sba-8a",
    name: "SBA 8(a) Business Development Program",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "8(a)",
    scope:
      "Most Fort Bragg trade jobs go to 8(a) firms without a competition and never post. DoDEA's Fort Bragg school repairs run through an 8(a) IDIQ to 2030 (W9123625D6004).",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "You are not in the 8(a) program. Ask the 8(a) firms that win these jobs for the electrical and HVAC work instead.",
  },
  {
    id: "veh-nc-public-bidding",
    name: "NC public bidding rules (no state contract to join)",
    type: "Program",
    sponsor: "State of North Carolina",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "Schools, universities, counties and cities bid each construction job on its own. Formal bids start at $500,000 (G.S. 143-129). Performance and payment bonds are needed when a local project tops $300,000 and a contract tops $50,000 (G.S. 44A-26; state agencies $500,000).",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason:
      "There is nothing to join. Watch for each job on the Opportunities feed. NC has no state prevailing-wage law, so these jobs pay market wages.",
  },
];

/** The type glosses that name the member's trade. */
export const TYPE_GLOSS = {
  MATOC:
    "Multiple Award Task Order Contract — a pool of pre-approved contractors that compete only against each other for task orders, such as building repairs on one base.",
  IDIQ: "Indefinite Delivery / Indefinite Quantity — a pre-approved contract an agency orders construction or repair work from as needed, up to a ceiling.",
};
