// THE TRUCKING COMPANY's contract vehicles (read through src/lib/mock/vehicles.ts,
// which picks the active member). Source: demo-storyboard/trucking-pack.md, section
// 13. Every vehicle and rule here is real. Tanya qualifies for SDDC's Freight
// Carrier Registration Program and is not in it yet: that is Grant's "next time"
// step (gap 1).
//
// Sources (checked 19 Oct 2026):
//   SDDC carrier registration   https://public-inspection.federalregister.gov/2019-12733.pdf
//                               https://www.overdriveonline.com/business/article/14885647/how-to-get-access-to-military-freight
//   DFTS II award HTC71124DR035 https://sam.gov/opp/61d327eafc4e4b13a15e4b73eebe32e3/view
//   TPS HTC711-13-R-R005        https://sam.gov/opp/ca41549209ab1ce43ba73def827cfcf2/view
//   EAGLE II BOA synopsis       https://sam.gov/opp/9cbb5a628f3e4db3bb76485315542662/view
//   GSA FMP rate offer (FY23)   https://origin-www.gsa.gov/system/files/FY23%20RFO%20-%20GSA%20General%20Rates%20-%20AX.pdf
//   GSA MAS categories          https://www.gsaelibrary.gsa.gov/ElibMain/scheduleSummary.do?scheduleNumber=MAS
//   USPS (39 U.S.C. 410)        https://www.law.cornell.edu/uscode/text/39/410
//   VA Veterans First           https://www.law.cornell.edu/uscode/text/38/8127

import type { Vehicle } from "@/lib/mock/vehicles";
import { HERO_IDS } from "../opportunities";

export const VEHICLES: Vehicle[] = [
  // ── Fits a trucking company ──────────────────────────────────────────
  {
    id: "veh-sddc-fcrp",
    name: "SDDC Freight Carrier Registration Program",
    type: "Program",
    sponsor: "Military Surface Deployment and Distribution Command (SDDC)",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "The door to DoD freight booked through SDDC. A carrier needs three straight years of DOT authority, a SCAC for each mode, a U.S. Bank Syncada account, a DoD performance bond and cargo insurance. Registration opens in seasons.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "Opens in seasons; watch SDDC's site",
    fitsFood: true,
    fitReason:
      "You qualify (nine years of authority, a SCAC) and aren't in yet, so DoD freight can't be booked with you. This is Grant's \"next time\" step, and the first rung toward secure cargo.",
  },
  {
    id: "veh-va-veterans-first",
    name: "VA Veterans First (a rule, not a contract)",
    type: "Program",
    sponsor: "Department of Veterans Affairs",
    ceilingValue: 0,
    setAside: "SDVOSB",
    scope:
      "When two or more veteran-owned firms can do the work at a fair price, the VA must set it aside for them (38 U.S.C. 8127). Its trucking and courier work in North Carolina is set aside for service-disabled veteran-owned firms first.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You hold SBA's service-disabled veteran-owned certificate, so these set-asides are yours to bid. The Fayetteville VA supply and linen runs are one. Your recertification window is open now; don't let it lapse.",
    pursueLink: { label: "See the VA supply runs", href: `/opportunities/${HERO_IDS.hero}` },
  },
  {
    id: "veh-eagle-boa",
    name: "Army EAGLE Basic Ordering Agreement (base logistics)",
    type: "Program",
    sponsor: "Army Contracting Command – Rock Island",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "The Army's pool of companies that may bid its base logistics task orders: motor pools, supply and transportation at one base each. New holders join through one proposal window a year.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "One proposal window a year",
    fitsFood: true,
    fitReason:
      "Primes only, and each base's order is far past your size. Fort Bragg's next one is coming, so team with a holder: Brightwater wants a local carrier for its transportation division.",
    pursueLink: { label: "See Brightwater Sustainment Group", href: "/partners?view=find&company=4001" },
  },
  {
    id: "veh-dfts-ii",
    name: "Defense Freight Transportation Services (DFTS II)",
    type: "IDIQ",
    sponsor: "U.S. Transportation Command",
    ceilingValue: 2_300_000_000,
    setAside: "Unrestricted",
    scope:
      "One company, Crowley Government Services, manages DoD freight moved inside the US and books it with its network of carriers. Base period August 2024 to July 2026, plus five one-year options.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Options run from 1 August each year",
    fitsFood: true,
    fitReason:
      "You can't bid it, but you can haul under it: carriers join Crowley's network as subcontractors. Ask Crowley how, once you're in SDDC's carrier program.",
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-gsa-fmp",
    name: "GSA Freight Management Program (TMSS 2.0)",
    type: "Program",
    sponsor: "GSA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "Civilian agencies tender loads to approved carriers in GSA's TMSS 2.0: over 1,000 carriers, 48 bureaus and 174 shipping sites. Carriers file rate offers in a yearly cycle.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "Next rate cycle in about 10 months",
    fitsFood: false,
    fitReason:
      "Civilian freight is booked here, not posted on SAM.gov. File a rate offer in the next cycle if you want those loads.",
  },
  {
    id: "veh-tps",
    name: "Transportation Protective Services (TPS)",
    type: "IDIQ",
    sponsor: "U.S. Transportation Command",
    ceilingValue: 655_000_000,
    setAside: "Unrestricted",
    scope:
      "DoD's contract for secure cargo: classified and sensitive freight across the lower 48. 24 carriers held it in 2014. Only carriers SDDC has approved for protective service can join.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason:
      "It needs a security clearance for your company and cleared drivers. Join SDDC's carrier program, haul DoD freight for a few years, then look again.",
    pursueLink: { label: "See why Grant said no to the secure runs", href: `/opportunities/${HERO_IDS.twin}` },
  },
  {
    id: "veh-usps-hcr",
    name: "USPS highway contract routes",
    type: "Program",
    sponsor: "U.S. Postal Service",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "Mail routes paid a fixed rate per trip, solicited and awarded in USPS's own CLEAR system; carriers work through its Logistics Gateway. USPS buys under its own rules (39 U.S.C. 410), so there are no set-asides.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Route by route",
    fitsFood: false,
    fitReason: "Open to you, but your certificate doesn't help here. Register as a USPS supplier to see the routes.",
    pursueLink: { label: "See the Fayetteville mail route", href: "/opportunities/HCR-28370" },
  },
  {
    id: "veh-gsa-mas",
    name: "GSA Multiple Award Schedule (MAS)",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "GSA's catalog of pre-priced services. It has no motor-freight category; only Package Delivery (NAICS 492110, 492210) fits a carrier, for courier work.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: false,
    fitReason: "Only your courier work would fit, and the VA and Army buy that by quote anyway. Not worth the offer for you yet.",
  },
];

/** The type glosses that name the member's trade. */
export const TYPE_GLOSS = {
  IDIQ: "Indefinite Delivery / Indefinite Quantity — a pre-approved contract an agency orders freight moves or hauling from as needed, up to a ceiling.",
};
