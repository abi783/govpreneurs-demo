// THE CONSULTANT's buyer directory for Government Buyers: offices that buy
// management consulting, HR consulting and leadership training near Coppervale
// Advisory Group's office in Fayetteville, NC (read through
// src/demo/explore/buyersData.ts, which picks the active member).
//
// Source: demo-storyboard/consulting-pack.md, section 13. The offices are real, and
// so is what they buy. The people are made up, and their addresses end in ".example".
// Where an opportunity page already names a buyer's contracting staff (Grant's
// contacts, src/demo/grant/facts.ts), the same people are read from there, so both
// pages name the same person.
//
// Spend figures are real: obligations for NAICS 541611, 541612, 541618 and 611430
// with work in NC, FY2023–FY2025, from USAspending (pulled 19 Oct 2026; office
// matched by award-id prefix, so close, not exact). The pack has three-year totals
// only, so no office carries a spend analysis, and the page says so. Offices with no
// NC baseline say that too.
//
// Sources:
//   USAspending search API      https://api.usaspending.gov/api/v2/search/spending_by_transaction/
//   VA Veterans First           https://www.law.cornell.edu/uscode/text/38/8127
//   PWC pay study RFP           https://www.faypwc.com/wp-content/uploads/2025/12/PWC2526055-RFP-Job-Analyses-Classification-and-Compensation-Study-SL.pdf
//   Harnett County study RFP    https://harnett.org/finance/downloads/addendum-1-compensation-study-rfp-2025.pdf
//   VHA Supervisor Ready order  https://www.usaspending.gov/award/CONT_AWD_36C10X24F0030_3600_47QRAA23D007J_4732

import { contactFor } from "../../../grant/facts";
import { getOpportunity } from "../../../story/opportunities";
import { PLACES } from "../../../story/places";
import type { BuyerOfficer, GovBuyer, OfficerRole } from "@/lib/mock/governmentBuyers";
import { HERO_IDS } from "../opportunities";

function person(role: OfficerRole, first: boolean) {
  return (id: string, name: string, email: string, phone: string, notes?: string): BuyerOfficer => ({
    id,
    name,
    role,
    email,
    phone,
    notes,
    ...(first ? { recommendedFirstContact: true } : {}),
  });
}
const sblo = person("Small-Business Liaison", true);
const co = person("Contracting Officer", false);
const pm = person("Program Manager", false);

/**
 * A contact that an opportunity page already names (Grant's contacts), so the two
 * pages agree. `secondary` picks the opportunity's second contact.
 */
function staffOf(id: string, oppId: string, secondary: boolean, notes?: string): BuyerOfficer {
  const c = contactFor(getOpportunity(oppId)!, secondary);
  return { id, name: c.name, role: c.title as OfficerRole, email: c.email, phone: c.phone, notes };
}

const first = (o: BuyerOfficer): BuyerOfficer => ({ ...o, recommendedFirstContact: true });

export const BUYERS: GovBuyer[] = [
  {
    id: "micc-bragg",
    agencyKey: 5601,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Manpower and analyst support, training models and family programs: 78 awards, $26.6M in FY2023–FY2025. Most competed small-business work goes out as GSA schedule orders, for holders only. You delivered the ACS Lean review here.",
    buysFood: true,
    agencyMatchers: ["Mission and Installation Contracting Command"],
    awardAgencies: ["MICC Fort Bragg"],
    officers: [
      sblo("micc-1", "Lorraine Batts", "l.batts@army.mil.example", "910-555-0611", "Small business specialist. Ask her which family-program buys are coming."),
      staffOf("micc-2", HERO_IDS.twin, false, "Named on the manpower support order."),
      staffOf("micc-3", "W91247-27-Q-0146", false, "Named on the in- and out-processing review."),
      pm("micc-4", "Darnell Spivey", "d.spivey@army.mil.example", "910-555-0614", "Army Community Service. Was the COR on your Lean review; ask him about your interim rating."),
    ],
  },
  {
    id: "va-nco6",
    agencyKey: 5602,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (buys for the Fayetteville VA and the rest of VISN 6)",
    distanceMiles: PLACES.durham.milesFromBase,
    whatTheyBuy:
      "Leadership and HR training, often as small set-asides for service-disabled veteran-owned firms: 35 awards, $9.3M in NC in FY2023–FY2025. Under Veterans First, firms like yours come first.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: ["VA NCO 6"],
    officers: [
      sblo("nco6-1", "Yvette Bunch", "y.bunch@va.gov.example", "919-555-0621", "Veteran-owned small business liaison for the network."),
      staffOf("nco6-2", HERO_IDS.hero, false, "Named on the supervisor leadership program."),
      staffOf("nco6-3", HERO_IDS.hero, true),
      pm("nco6-4", "Dr. Maurice Lanier", "m.lanier@va.gov.example", "910-555-0624", "Workforce development at the Fayetteville VA. Owns the supervisor program."),
    ],
  },
  {
    id: "acc-ri",
    agencyKey: 5603,
    name: "Army Contracting Command – Rock Island (Picatinny)",
    abbreviation: "ACC–RI",
    type: "federal",
    location: "Picatinny Arsenal, NJ (orders for Army HR and family readiness work)",
    distanceMiles: 500,
    whatTheyBuy:
      "Orders on the Army's HR Solutions contract for HR and family readiness training: 6 awards, $1.5M with work in NC in FY2023–FY2025. Only holders can bid, so the way in is a holder's team.",
    buysFood: true,
    agencyMatchers: ["Army Contracting Command — Rock Island"],
    awardAgencies: ["ACC–RI"],
    officers: [
      // Not read from the sources sought: its generated contact is also the twin's at MICC (people.test.ts).
      first(co("accri-1", "Desmond Achterberg", "d.achterberg@army.mil.example", "309-555-0631", "Orders on the HR Solutions contract, including family readiness training.")),
      pm("accri-2", "Lt. Col. Andrea Whitlock", "a.whitlock@army.mil.example", "309-555-0632", "Army family readiness program office. Owns the training requirement."),
    ],
  },
  {
    id: "usasoc",
    agencyKey: 5604,
    name: "U.S. Army Special Operations Command, Contracting",
    abbreviation: "USASOC",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Instructors, assessment and selection support and media: 83 awards, $19.3M in FY2023–FY2025. Much of it needs cleared staff, so watch it rather than chase it.",
    buysFood: true,
    agencyMatchers: ["Special Operations Command"],
    awardAgencies: [],
    officers: [
      sblo("usasoc-1", "Terrence Odom", "t.odom@socom.mil.example", "910-555-0641", "Small business office. Ask which buys need no clearance."),
    ],
  },
  {
    id: "va-sac-frederick",
    agencyKey: 5605,
    name: "VA Strategic Acquisition Center – Frederick",
    abbreviation: "VA SAC",
    type: "federal",
    location: "Frederick, MD (national VHA programs)",
    distanceMiles: 330,
    whatTheyBuy:
      "National leadership programs for VA staff, such as Supervisor Ready, ordered from GSA schedule holders set aside for service-disabled veteran-owned firms. No NC baseline: one national program.",
    buysFood: true,
    agencyMatchers: ["Strategic Acquisition Center"],
    awardAgencies: [],
    officers: [
      sblo("sac-1", "Glenda Fortune", "g.fortune@va.gov.example", "301-555-0651", "Veteran-owned small business liaison. Ask when Supervisor Ready is next ordered."),
    ],
  },
  {
    id: "uspfo-nc",
    agencyKey: 5606,
    name: "USPFO for North Carolina (NC National Guard)",
    abbreviation: "USPFO NC",
    type: "federal",
    location: "Raleigh, NC",
    distanceMiles: PLACES.raleigh.milesFromBase,
    whatTheyBuy:
      "Rare consulting and training buys: none found in your codes in FY2023–FY2025, and one trainer course in 2021. The family-programs strategic plan now open is new work.",
    buysFood: true,
    agencyMatchers: ["USPFO for North Carolina"],
    awardAgencies: [],
    officers: [
      first(staffOf("uspfo-1", "W91242-27-Q-0037", false, "Named on the family programs strategic plan.")),
      staffOf("uspfo-2", "W91242-27-Q-0037", true),
    ],
  },
  {
    id: "fay-pwc",
    agencyKey: 5607,
    name: "Fayetteville Public Works Commission",
    abbreviation: "PWC",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "Pay and classification studies and the training that follows them: a job analysis and pay study went out in December 2025, and manager training for the new plan is open now.",
    buysFood: true,
    agencyMatchers: ["Fayetteville Public Works Commission"],
    awardAgencies: [],
    officers: [
      first(staffOf("pwc-1", "PWC2627018", false, "Purchasing. Named on the manager training.")),
      pm("pwc-2", "Annette Royal", "a.royal@faypwc.com.example", "910-555-0672", "HR director. Owns the new pay plan."),
    ],
  },
  {
    id: "fayetteville-city",
    agencyKey: 5608,
    name: "City of Fayetteville",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Supervisor training for city staff, with a classification and pay study expected in fiscal 2028.",
    buysFood: true,
    agencyMatchers: ["City of Fayetteville"],
    awardAgencies: [],
    officers: [
      first(staffOf("fay-1", "FAY-HR-2027-03", false, "Human Resource Development. Named on the supervisor academy.")),
      staffOf("fay-2", "FAY-HR-2027-03", true),
    ],
  },
  {
    id: "cumberland-county",
    agencyKey: 5609,
    name: "Cumberland County Government",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Process reviews of county services, such as social-services intake now, and a strategic plan update expected in fiscal 2028.",
    buysFood: true,
    agencyMatchers: ["Cumberland County, NC"],
    awardAgencies: [],
    officers: [
      first(staffOf("cc-1", "CUMCO-DSS-2027-02", false, "Social Services. Named on the intake review.")),
      staffOf("cc-2", "CUMCO-DSS-2027-02", true),
    ],
  },
  {
    id: "harnett-county",
    agencyKey: 5610,
    name: "Harnett County Government",
    abbreviation: null,
    type: "sled",
    location: "Lillington, NC",
    distanceMiles: PLACES.lillington.milesFromBase,
    whatTheyBuy:
      "A compensation strategy study in 2025, which you bid and lost on similar work, and upkeep of the new pay plan expected in fiscal 2028.",
    buysFood: true,
    agencyMatchers: ["Harnett County"],
    awardAgencies: [],
    officers: [
      first(co("harco-1", "Bettina Langdon", "b.langdon@harnett.org.example", "910-555-0691", "Purchasing. Gave you the debrief on the pay study.")),
      pm("harco-2", "Rufus Tart", "r.tart@harnett.org.example", "910-555-0692", "HR director. Owns the pay plan."),
    ],
  },
];
