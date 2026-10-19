// THE IT SERVICES FIRM's contract vehicles (read through src/lib/mock/vehicles.ts,
// which picks the active member). Source: demo-storyboard/it-services-pack.md,
// section 13, "Vehicles that matter". Every vehicle and rule here is real. Hector
// holds GSA MAS SIN 54151S and is in the 8(a) program; he has no seat on ITES-3S or
// 8(a) STARS III, and both are closed. Teaming toward ITES-4S is Grant's "next time"
// step (gap 1).
//
// Sources (checked 19 Oct 2026):
//   ITES-4S RFI         https://sam.gov/opp/960b3ea931b74e04a6f248ffc23d46da/view
//   ITES-4S timing      https://www.govdash.com/blog/ites-4s-contract-guide-updates-strategies
//   ITES-3S to Sep 2027 https://www.army.mil/article/273787/army_chess_holds_ites_4s_roundtable_symposium
//   STARS III option    https://www.nemeansolutions.com/news/2026/7/30/nemean-awarded-gsa-8a-stars-iii-option-contract
//   No STARS III on-ramp https://govconfeed.com/article/federal-it-gwac-comparison-june-2026
//   SEWP VI             https://orangeslices.ai/nasa-announces-sewp-vi-contract-awardees/
//   IMCS IV order       https://www.usaspending.gov/award/CONT_AWD_W91RUS25FA046_9700_W91RUS23D0001_9700
//   SBA 8(a) program    https://www.ecfr.gov/current/title-13/chapter-I/part-124
//   SBA mentor-protégé  https://www.ecfr.gov/current/title-13/chapter-I/part-125/section-125.9
//   NCDIT 920S          https://it.nc.gov/services/statewide-it-contracts/920s-it-services
//   NC DPI Category Two https://sci.fi.ncsu.edu/?p=5598

import type { Vehicle } from "@/lib/mock/vehicles";
import { HERO_IDS } from "../opportunities";

export const VEHICLES: Vehicle[] = [
  // ── Fits an IT services firm ───────────────────────────────────────
  {
    id: "veh-gsa-mas-it",
    name: "GSA MAS: Information Technology (SIN 54151S)",
    type: "GSA MAS",
    sponsor: "GSA",
    ceilingValue: 0, // GSA MAS has no fixed ceiling
    setAside: "Unrestricted",
    scope:
      "The government-wide schedule's IT category. SIN 54151S covers IT professional services: help desk, desktop and network support, systems administration and project management, billed by labor category. Cyber work such as penetration tests sits on a separate SIN, 54151HACS.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You hold it (SIN 54151S, awarded 2024). Agencies can order from you without a full competition, and your schedule rates are what buyers check your quotes against. You don't hold 54151HACS, so cyber assessments are out for now.",
    pursueLink: { label: "See labor rates", href: "/labor-pricing" },
  },
  {
    id: "veh-sba-8a",
    name: "SBA 8(a) Business Development Program",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "8(a)",
    scope:
      "Lets agencies set work aside for 8(a) firms, or give it to one without a competition. Much of Fort Bragg's IT goes this way: the Army Reserve's signal readiness was an 8(a) competition with 6 offers. A firm's term lasts nine years.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "You're in it, and the Army Reserve help desk is set aside under it. Your term ends in March 2030, so you have about three and a half years to win work that isn't 8(a). In 2026 SBA suspended firms that didn't send financial records; you sent yours and are active.",
    pursueLink: { label: "See the help desk quote", href: `/opportunities/${HERO_IDS.hero}` },
  },
  {
    id: "veh-sba-mentor-protege",
    name: "SBA Mentor-Protégé Program (teaming with a larger firm)",
    type: "Program",
    sponsor: "SBA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "A small business partners with a larger firm that coaches it. The two can bid together as a joint venture on set-aside work the smaller firm, the protégé, qualifies for, including seats on the next big contracts.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Continuous (rolling)",
    fitsFood: true,
    fitReason:
      "A joint venture is the realistic way onto ITES-4S, the Army's next IT contract. Until then, a subcontract with a holder is how you reach work that only holders can quote, such as the Army hospital's IT with Brackwater.",
    pursueLink: { label: "See Brackwater Federal Solutions", href: "/partners?view=find&company=4001" },
  },
  {
    id: "veh-ites-4s",
    name: "Army ITES-4S (the follow-on to ITES-3S)",
    type: "IDIQ",
    sponsor: "Army CHESS",
    ceilingValue: 12_100_000_000,
    setAside: "Unrestricted",
    scope:
      "The Army's next IT services contract, about $12.1B, with seats set aside for small businesses. The Army has asked industry about it; the request for proposals is expected, and awards are not expected before the third quarter of fiscal 2027. It may be merged with another Army IT contract.",
    openToNewEntrants: "On-ramp expected",
    recompeteWindow: "Proposals expected in 2027",
    fitsFood: true,
    fitReason:
      "The one to watch. Most Army IT at Fort Bragg is ordered through ITES-3S today, and this replaces it. Decide whether to bid it yourself or as part of a team with an ITES-3S holder such as Larkspur Federal IT.",
    pursueLink: { label: "See the ITES-4S forecast", href: "/forecasts/b4625c71c4f8023b0b1a527fb63b2b1c" },
  },
  {
    id: "veh-nc-920s",
    name: "NCDIT statewide IT term contracts (920S IT services)",
    type: "BPA",
    sponsor: "NC Department of Information Technology",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "North Carolina's term contracts for IT services. State agencies order from the firms on them as they need, and the state opens a new solicitation from time to time. Bids go through the state's eProcurement site.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Proposals due in about five weeks",
    fitsFood: true,
    fitReason:
      "It opens state agency orders near you. The paperwork is heavy, so answer it only if you want state work as well as Army work.",
    pursueLink: { label: "See the state term contract", href: "/opportunities/ITS-402276-001" },
  },

  // ── Worth knowing, not for you yet ─────────────────────────────────
  {
    id: "veh-ites-3s",
    name: "Army ITES-3S (IT Enterprise Solutions — Services)",
    type: "IDIQ",
    sponsor: "Army CHESS",
    ceilingValue: 12_100_000_000,
    setAside: "Unrestricted",
    scope:
      "The Army's main IT services contract today. Units at Fort Bragg order knowledge management, cyber, logistics systems and network support through it, and only its holders may quote. It takes no new companies and runs through September 2027.",
    openToNewEntrants: "Closed",
    recompeteWindow: "Orders through September 2027",
    fitsFood: true,
    fitReason:
      "The Army Reserve's SharePoint support is for its holders only, and you're not one. Ask the office whether the next one can be bought on the open market, as it was in 2018.",
    pursueLink: { label: "See the SharePoint support notice", href: `/opportunities/${HERO_IDS.twin}` },
  },
  {
    id: "veh-stars-iii",
    name: "GSA 8(a) STARS III",
    type: "GWAC",
    sponsor: "GSA",
    ceilingValue: 50_000_000_000,
    setAside: "8(a)",
    scope:
      "A government-wide IT services contract for 8(a) firms only. The Defense Health Agency orders the Army hospital's IT at Fort Bragg through it. Its option period runs to July 2029, and no new holders have been announced.",
    openToNewEntrants: "Closed — next on-ramp not announced",
    recompeteWindow: "Option period to July 2029",
    fitsFood: true,
    fitReason:
      "You're 8(a), but not a holder, and it is closed. For the hospital's IT, a subcontract with a holder such as Brackwater is the way in.",
    pursueLink: { label: "See the hospital IT request", href: `/opportunities/${HERO_IDS.teamUp}` },
  },
  {
    id: "veh-imcs-iv",
    name: "Army IMCS IV (network operations, small business)",
    type: "IDIQ",
    sponsor: "Army Contracting Command",
    ceilingValue: 0,
    setAside: "Total SB",
    scope:
      "The Army network command's contract for running base networks and service desks, for small businesses. It runs from 2023 to 2028 and takes no new companies. Fort Bragg's network enterprise center orders through it.",
    openToNewEntrants: "Closed",
    recompeteWindow: "Orders through 2028",
    fitsFood: true,
    fitReason: "Your kind of work, but only its holders can quote. Watch its winners for subcontract seats on the base network.",
  },
  {
    id: "veh-nasa-sewp",
    name: "NASA SEWP (IT products)",
    type: "GWAC",
    sponsor: "NASA",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "A government-wide contract for IT products: laptops, network gear and software, with the services that come with them. SEWP VI was awarded in June 2026 and starts taking orders on 1 November 2026; SEWP V runs to 31 January 2027.",
    openToNewEntrants: "Closed",
    fitsFood: false,
    fitReason: "It buys products, and you don't resell hardware. Not a path for a services firm like yours.",
  },
  {
    id: "veh-nc-erate",
    name: "NC DPI E-Rate Category Two contract (school Wi-Fi)",
    type: "Program",
    sponsor: "NC Department of Public Instruction",
    ceilingValue: 0,
    setAside: "Unrestricted",
    scope:
      "The state's master contract for school Wi-Fi and network gear under the federal E-Rate program. Districts buy from it through mini-bids. Proposals for the next one are due in early November 2026.",
    openToNewEntrants: "Open now",
    recompeteWindow: "Proposals due 6 November 2026",
    fitsFood: false,
    fitReason:
      "It's mostly equipment, and it needs an E-Rate provider number and a Wi-Fi maker's partner status, which you don't have.",
  },
];

/** The type glosses that name the member's trade. */
export const TYPE_GLOSS = {
  IDIQ: "Indefinite Delivery / Indefinite Quantity — a pre-approved contract an agency orders IT work from as needed, up to a ceiling. Only its holders may quote the orders.",
  GWAC: "Government-Wide Acquisition Contract — an IT contract any federal agency can order from, such as 8(a) STARS III.",
  "GSA MAS":
    "GSA Multiple Award Schedule — a long-term contract any agency can order from. It has a category for IT services, billed by labor category.",
  BPA: "Blanket Purchase Agreement or term contract — a quick-ordering account for recurring needs, such as a state's IT services.",
};
