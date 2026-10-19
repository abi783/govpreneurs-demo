// THE JANITORIAL FIRM's contract vehicles (read through src/lib/mock/vehicles.ts, which
// picks the active member). Source: demo-storyboard/janitorial-pack.md, section 13.
// Every vehicle and rule here is real except Gray Owl's own BPA, which is modeled on
// the 4th Contracting Squadron's pressure-washing BPA FA480924A0002.
//
// Sources (checked 19 Oct 2026):
//   Seymour Johnson pressure-washing BPA (model)  https://www.usaspending.gov/award/CONT_AWD_FA480925F0106_9700_FA480924A0002_9700
//   SBA HUBZone program (13 CFR 126; 10% price preference, FAR 19.1307)
//                                                  https://www.ecfr.gov/current/title-13/chapter-I/part-126
//   AbilityOne (41 U.S.C. 8504, FAR 8.7, 41 CFR 51-2.3)  https://www.acquisition.gov/far/subpart-8.7
//   Limits on subcontracting (13 CFR 125.6)        https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.6
//   DHA environmental cleaning IDIQ                https://www.usaspending.gov/award/CONT_AWD_HT940824F0031_9700_HT940824D0009_9700
//   NC statewide term contracts 0002A and 1411B    https://www.doa.nc.gov/divisions/purchase-contract/statewide-term-contracts

import type { Vehicle } from "@/lib/mock/vehicles";
import { HERO_IDS } from "../opportunities";

export const VEHICLES: Vehicle[] = [
  // ── Fits a janitorial firm ─────────────────────────────────────────
  {
    id: "veh-sj-washing-bpa",
    name: "Your exterior-washing BPA, Seymour Johnson AFB",
    type: "BPA",
    sponsor: "Air Force, 4th Contracting Squadron",
    ceilingValue: 0, // the squadron sets no total; each call is priced on its own
    setAside: "Total SB",
    scope:
      "Gray Owl's blanket purchase agreement (FA480924A0007) for washing dorms, sidewalks and pads at Seymour Johnson, January 2024 to January 2029. Each job is a call: the squadron sends the scope, you quote it.",
    openToNewEntrants: "Closed",
    recompeteWindow: "Runs to January 2029",
    fitsFood: true,
    fitReason:
      "You hold it, and the dorm job came through it. The next call is expected in the spring. Ask the COR for a reference letter now; the job was too small for a CPARS.",
    pursueLink: { label: "See the forecast", href: "/forecasts" },
  },
  {
    id: "veh-sba-hubzone",
    name: "SBA HUBZone Program",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "HUBZone",
    scope:
      "Lets agencies set work aside for certified HUBZone small businesses: firms based in a HUBZone with at least 35% of staff living in one. In full and open buys, a HUBZone firm's price also gets a 10% evaluation preference.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You hold it. Fort Bragg's pressure-washing bid is set aside under it. Watch two things: 41% of your staff live in a HUBZone, but night crews turn over, and your yearly recertification is due in 38 days.",
    pursueLink: { label: "See the pressure-washing bid", href: `/opportunities/${HERO_IDS.hero}` },
  },
  {
    id: "veh-8a-teaming",
    name: "Teaming with an 8(a) prime",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "8(a)",
    scope:
      "Much cleaning work near you is set aside for 8(a) firms: Seymour Johnson's base custodial and the Army Reserve centers. A firm outside the program can do part of it as a subcontractor. The 8(a) prime must keep at least half the work (13 CFR 125.6).",
    openToNewEntrants: "Open now",
    recompeteWindow: "Army Reserve follow-on expected in about 75 days",
    fitsFood: true,
    fitReason:
      "Ashepoo Facility Solutions holds both and wants a local crew for the North Carolina Army Reserve centers. Your share can be up to half.",
    pursueLink: { label: "See Ashepoo Facility Solutions", href: "/partners?view=find&company=4001" },
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-abilityone",
    name: "AbilityOne Procurement List (a rule, not a contract)",
    type: "Program",
    sponsor: "U.S. AbilityOne Commission",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "Services on the list must be bought from nonprofits that employ people who are blind or have significant disabilities (41 U.S.C. 8504, FAR 8.7). Fort Bragg's custodial and grounds, its DoD schools and the Fayetteville FAA tower are on it.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason:
      "Commercial firms can't join, and no quote can win listed work. The Commission posts proposed additions in the Federal Register with a comment period (41 CFR 51-2.3). If one ever takes work you hold, comment.",
    pursueLink: { label: "See why the custodial notice is a no", href: `/opportunities/${HERO_IDS.twin}` },
  },
  {
    id: "veh-dha-cleaning-idiq",
    name: "DHA Healthcare Environmental Cleaning IDIQ",
    type: "IDIQ",
    sponsor: "Defense Health Agency",
    ceilingValue: 0,
    setAside: "Total SB",
    scope:
      "The Defense Health Agency's pool of small firms for hospital and clinic cleaning (solicitation HT940823R0003). the Army hospital's and the 4th Medical Group's cleaning are ordered through it.",
    openToNewEntrants: "Closed — next on-ramp not announced",
    fitsFood: false,
    fitReason: "Only its holders see the orders, and you are not one. The hospital also pays the predecessor's union wages. Ask a holder about floor care later.",
  },
  {
    id: "veh-gsa-mas-facilities",
    name: "GSA Multiple Award Schedule, Facilities",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "The schedule's Facilities category: SIN 561210FAC carries janitor labor categories and 561730 covers grounds. Some agencies buy cleaning only from schedule holders.",
    openToNewEntrants: "Open now",
    fitsFood: false,
    fitReason: "You are not on it, and the buyers near you rarely use it. It is a later step, for buys that are schedule-only.",
  },
  {
    id: "veh-nc-term-contracts",
    name: "NC statewide term contracts 0002A and 1411B",
    type: "Program",
    sponsor: "State of North Carolina",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "Contract 0002A makes state agencies buy listed goods and services from nonprofit work centers for the blind and severely disabled, the state's own version of AbilityOne. 1411B covers sanitary paper supplies.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason:
      "There is nothing to join. State and local cleaning outside these lists is bid one job at a time; watch for it on Opportunities.",
  },
];

/** The type glosses that name the member's trade. */
export const TYPE_GLOSS = {
  MATOC:
    "Multiple Award Task Order Contract — a pool of pre-approved contractors that compete only against each other for task orders, such as cleaning on one base.",
  IDIQ: "Indefinite Delivery / Indefinite Quantity — a pre-approved contract an agency orders cleaning or grounds work from as needed, up to a ceiling.",
};
