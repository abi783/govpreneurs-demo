// THE CONSULTANT's contract vehicles (read through src/lib/mock/vehicles.ts, which
// picks the active member). Source: demo-storyboard/consulting-pack.md, section 13.
// Every vehicle and rule here is real. Simone is on no schedule or multiple-award
// contract: starting the GSA schedule offer is Grant's "next time" step (gap 1).
//
// Sources (checked 19 Oct 2026):
//   GSA MAS SINs 541611 and 611430, holder counts
//     https://www.gsaelibrary.gsa.gov/ElibMain/sinDetails.do?scheduleNumber=MAS&specialItemNumber=541611&executeQuery=YES
//   Two years in business, or Startup Springboard
//     https://www.gsa.gov/sell-to-government/step-1-learn-about-government-contracting/how-to-access-contract-opportunities
//   Orders set aside among schedule holders (FAR 8.405-5)  https://www.acquisition.gov/far/8.405-5
//   OASIS+ Phase II, Human Capital domain
//     https://www.gsa.gov/about-gsa/newsroom/news-releases/next-phase-of-gsas-oasis-contract-enabling-procurement-consolidation-12042025
//   HCaTS ended 25 Sep 2026   https://www.usaspending.gov/award/CONT_IDV_GS02Q16DCR0040_4732
//   Army HR Solutions PLS     https://www.usaspending.gov/award/CONT_IDV_W15QKN19D0049_9700
//   VA course-materials IDIQ  https://www.usaspending.gov/award/CONT_AWD_36C24624N1187_3600_36C24624D0072_3600
//   VA Veterans First (38 U.S.C. 8127; VAAR 852.219-73)  https://www.law.cornell.edu/cfr/text/48/852.219-73
//   VetCert eligibility (13 CFR 128.306)  https://www.law.cornell.edu/cfr/text/13/128.306
//   SBA mentor-protégé joint ventures (13 CFR 125.9)  https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.9
//   NC statewide term contracts  https://www.doa.nc.gov/divisions/purchase-contract/statewide-term-contracts

import type { Vehicle } from "@/lib/mock/vehicles";
import { HERO_IDS } from "../opportunities";

export const VEHICLES: Vehicle[] = [
  // ── Fits a consulting firm ─────────────────────────────────────────
  {
    id: "veh-gsa-mas-consulting",
    name: "GSA MAS: Professional Services and Human Capital",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0, // GSA MAS has no fixed ceiling
    setAside: "Unrestricted",
    scope:
      "The government-wide schedule's consulting and training SINs: 541611 Management and Financial Consulting (3,107 holders), 611430 Professional and Management Development Training (1,146 holders) and the Human Capital SINs such as 541612HC. Agencies can set orders aside for small or veteran-owned holders only.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You are not on it yet, and Fort Bragg buys most of its competed consulting through it: the manpower order you passed on was for schedule holders only. With 8 years in business you meet the two-year rule. Expect months of work before the first order. This is Grant's \"next time\" step.",
    pursueLink: { label: "Plan your next steps", href: "/roadmap" },
  },
  {
    id: "veh-sba-vetcert",
    name: "SBA VetCert: Service-Disabled Veteran-Owned Small Business",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "SDVOSB",
    scope:
      "Lets agencies set work aside for certified service-disabled veteran-owned small businesses. At the VA, Veterans First puts these firms first, and the VA checks certification at offer and at award.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You hold it, and the Fayetteville VA supervisor program is set aside under it. Your eligibility ends on 14 January 2027, and the renewal window is open now. Renew before the VA awards.",
    pursueLink: { label: "See the VA supervisor program", href: `/opportunities/${HERO_IDS.hero}` },
  },
  {
    id: "veh-sba-mentor-protege",
    name: "SBA Mentor-Protégé Program (teaming with a larger firm)",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "A small business partners with a larger firm that coaches it. The two can bid together as a joint venture on set-aside work that the smaller firm, the protégé, qualifies for.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "A joint venture with a schedule-holding mentor could bid veteran-owned set-asides above your size. It does not get you onto the Army's HR Solutions contract: for the family readiness training, a subcontract with Halyard Point is the way in.",
    pursueLink: { label: "See Halyard Point Human Capital", href: "/partners?view=find&company=4001" },
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-army-hr-solutions-pls",
    name: "Army HR Solutions: Personnel Lifecycle Support (PLS) MATOC",
    type: "MATOC",
    sponsor: "Army Contracting Command – Rock Island",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "The Army's pool of HR and training contractors. Family readiness staff training and other Army HR orders go only to its holders. It orders through 31 December 2028.",
    openToNewEntrants: "Closed — next on-ramp not announced",
    recompeteWindow: "Orders through December 2028",
    fitsFood: true,
    fitReason:
      "You are not a holder, so you cannot bid the family readiness training yourself. Halyard Point holds it and wants a trainer near Fort Bragg: team up as their subcontractor.",
    pursueLink: { label: "See the family readiness training", href: `/opportunities/${HERO_IDS.teamUp}` },
  },
  {
    id: "veh-gsa-oasis-plus",
    name: "GSA OASIS+ (Management and Advisory; Human Capital)",
    type: "IDIQ",
    sponsor: "GSA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "GSA's large professional-services contract, open for offers continuously since January 2026, with unrestricted and small-business pools. Phase II added a Human Capital domain; GSA's older HCaTS contract ended on 25 September 2026. Offers are scored on qualifying projects.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "Your projects are too small to score well yet. Get on the GSA schedule first and come back once you have two or three federal jobs over $250K.",
  },
  {
    id: "veh-va-course-idiq",
    name: "VA NCO 6 Course Materials IDIQ",
    type: "IDIQ",
    sponsor: "VA Network Contracting Office 6",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope: "Licensed, brand-name courses for VA staff, ordered from the publisher's partners who hold this contract (36C24624D0072).",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "Only licensed partners of each course's publisher deliver these, so the Salisbury communication course is closed to you.",
  },
  {
    id: "veh-nc-term-contracts",
    name: "NC statewide term contracts (none for consulting)",
    type: "Program",
    sponsor: "State of North Carolina",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "The state's term contracts cover goods and some services, but none covers consulting or training. State agencies post each consulting job on NC eVP one at a time.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "There is nothing to join. Watch for each state and local job on the Opportunities feed.",
  },
];

/** The type glosses that name the member's trade. */
export const TYPE_GLOSS = {
  "GSA MAS":
    "GSA Multiple Award Schedule — a long-term contract any agency can order from. It has categories for management consulting, training and human capital work.",
  MATOC:
    "Multiple Award Task Order Contract — a pool of pre-approved contractors that compete only against each other for orders, such as the Army's HR and training work.",
};
