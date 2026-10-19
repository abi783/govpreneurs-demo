// THE AGENCY's contract vehicles (read through src/lib/mock/vehicles.ts, which picks
// the active member). Every vehicle here is real. Dana is not on a GSA schedule:
// getting on one is Grant's "next time" step (marketing-agency-pack.md, gap 1).
//
// Sources (checked 19 Oct 2026):
//   GSA MAS, Marketing and Public Relations SINs and contractor counts
//     https://www.gsaelibrary.gsa.gov/ElibMain/scheduleSummary.do?scheduleNumber=MAS
//     https://www.gsaelibrary.gsa.gov/ElibMain/sinDetails.do?scheduleNumber=MAS&specialItemNumber=541810&executeQuery=YES
//   Two years in business, or Startup Springboard
//     https://www.gsa.gov/sell-to-government/step-1-learn-about-government-contracting/how-to-access-contract-opportunities
//   ChooseVA posted to GSA eBuy for MAS 541810 holders  https://sam.gov/opp/edd02746c0fa40558ceb4e5ef7935f2d/view
//   NC Guard recruiting website ordered through a GSA schedule
//     https://www.usaspending.gov/award/CONT_AWD_W9124225FA076_9700_GS07F0382X_4732
//   SBA mentor-protégé joint ventures: the set-asides the protégé qualifies for
//     https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.9
//     https://www.ecfr.gov/current/title-13/chapter-I/part-128/section-128.402
//   SBA Women-Owned Small Business Federal Contract Program  https://www.sba.gov/federal-contracting/contracting-assistance-programs/women-owned-small-business-federal-contract-program
//   NC statewide term contracts (77 listed, none for advertising, marketing or PR)
//     https://www.doa.nc.gov/divisions/purchase-contract/statewide-term-contracts
//   GSA VETS 2: service-disabled veteran-owned only, IT services, $6.1B ceiling
//     https://gsablogs.gsa.gov/technology/?p=4490

import type { Vehicle } from "@/lib/mock/vehicles";
import { HERO_IDS } from "../opportunities";

export const VEHICLES: Vehicle[] = [
  // ── Fits an ad agency ──────────────────────────────────────────────
  {
    id: "veh-gsa-mas-marketing",
    name: "GSA MAS: Marketing and Public Relations",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0, // GSA MAS has no fixed ceiling
    setAside: "Unrestricted",
    scope:
      "The government-wide schedule's marketing category: SIN 541810 Advertising Services, 541613 Marketing Consulting, 541430 Graphic Design, 512110 Video/Film Production, 541820 Public Relations, 541511 Web Based Marketing and 541910 Marketing Research. SIN 541810ODC lets you pass through media costs, such as TV, radio or social ad spots, alongside those services.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You are not on it yet, and some buyers only buy here: the VA posted its ChooseVA campaign to schedule holders under SIN 541810, and the NC Guard ordered its recruiting website through a schedule. With 7 years in business you meet the two-year rule. Expect months of work before the first order. This is Grant's \"next time\" step.",
    pursueLink: { label: "Plan your next steps", href: "/roadmap" },
  },
  {
    id: "veh-sba-wosb",
    name: "SBA Women-Owned Small Business Federal Contract Program",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "WOSB",
    scope:
      "Lets agencies set work aside for certified woman-owned small businesses in industries where women are underrepresented. Only certified firms can bid those jobs.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You hold this certification. The Fort Bragg Family Advocacy quote is set aside under it, so only woman-owned firms can bid. Keep your certification current.",
    pursueLink: { label: "See the Family Advocacy quote", href: `/opportunities/${HERO_IDS.hero}` },
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
      "A joint venture could bid small-business and woman-owned set-asides above your size. It cannot bid work set aside for service-disabled veteran-owned firms, because you are not one. For the VA hiring campaign, a subcontract with Bluestone is the way in.",
    pursueLink: { label: "See Bluestone Veteran Media Group", href: "/partners?view=find&company=4001" },
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-nc-term-contracts",
    name: "NC Statewide Term Contracts (Division of Purchase and Contract)",
    type: "BPA",
    sponsor: "NC Department of Administration",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "Price lists that NC agencies can buy from without running their own bid. The state lists 77 of them; none covers advertising, marketing, media buying or public relations. The closest, 8014B Promotional Items, buys goods.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason:
      "There is no state contract to join for your work. NC agencies such as NCDHHS and NCDOT bid each campaign on its own, so watch for their requests on the Opportunities feed.",
  },
  {
    id: "veh-vets-2",
    name: "GSA VETS 2",
    type: "GWAC",
    sponsor: "GSA",
    ceilingValue: 6_100_000_000,
    setAside: "SDVOSB",
    scope: "Government-wide IT services, open only to service-disabled veteran-owned small businesses.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "IT services, and only for service-disabled veteran-owned firms. Not a path for an ad agency.",
  },
];

/** The type glosses that name the member's trade. */
export const TYPE_GLOSS = {
  "GSA MAS":
    "GSA Multiple Award Schedule — a long-term contract any agency can order from. It has a category for marketing and public relations.",
  BPA: "Blanket Purchase Agreement — a quick-ordering account for recurring needs, such as printing or ad space.",
};
