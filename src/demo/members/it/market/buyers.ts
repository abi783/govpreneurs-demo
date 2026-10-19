// THE IT SERVICES FIRM's buyer directory for Government Buyers: offices that buy IT
// support near Gallberry Technology Group's office in Fayetteville, NC (read through
// src/demo/explore/buyersData.ts, which picks the active member).
//
// Source: demo-storyboard/it-services-pack.md, section 13. The offices are real, and
// so is what they buy. The people are made up, and their addresses end in ".example".
// Where an opportunity page already names a buyer's contracting staff (Grant's
// contacts, src/demo/grant/facts.ts), the same people are read from there, so both
// pages name the same person. The Army hospital at Fort Bragg is never named:
// "Womack" is one of the caterer's own words.
//
// Totals in "what they buy" are real: obligations FY2023–FY2025 for IT codes (NAICS
// 541512, 541519, 541513, 518210, 541511) with the work in North Carolina, from
// USAspending transactions (pulled 19 Oct 2026; office matched by award-id prefix,
// so close, not exact). The pack has three-year totals only, not award counts or a
// split by year, so no office carries a spend analysis. State and local buyers have
// no spend baseline.
//
// Sources:
//   USAspending search API   https://api.usaspending.gov/api/v2/search/spending_by_transaction/
//   NCDIT 920S IT services   https://it.nc.gov/services/statewide-it-contracts/920s-it-services
//   Town managed-IT RFP model https://www.butnernc.org/media/9071

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
    agencyKey: 5301,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "IT support for the Army Reserve, XVIII Airborne Corps and other units on post: $63.9M in FY2023–FY2025. Some is competed in the open as 8(a) set-asides; much is ordered only through ITES-3S, for its holders.",
    buysFood: true,
    agencyMatchers: ["Mission and Installation Contracting Command"],
    awardAgencies: ["MICC Fort Bragg"],
    officers: [
      sblo("micc-1", "Lorraine Bellamy", "l.bellamy@army.mil.example", "910-555-0611", "Small business specialist. Ask her which IT buys will be open-market rather than ITES-3S."),
      staffOf("micc-2", HERO_IDS.hero, false, "Named on the Army Reserve help desk quote."),
      staffOf("micc-3", HERO_IDS.hero, true),
      pm("micc-4", "Maj. Desmond Rouse", "d.rouse@army.mil.example", "910-555-0614", "Army Reserve G-6. Owns the help desk work statement."),
    ],
  },
  {
    id: "dha-bragg",
    agencyKey: 5302,
    name: "Defense Health Agency (the Army medical center at Fort Bragg)",
    abbreviation: "DHA",
    type: "federal",
    location: "Buys for the Army hospital at Fort Bragg and its clinics",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "The hospital's IT services, ordered through 8(a) STARS III: $12.2M in FY2023–FY2025. Only STARS III holders can quote, so a firm like yours comes in as a subcontractor.",
    buysFood: true,
    agencyMatchers: ["Defense Health Agency"],
    awardAgencies: ["DHA"],
    officers: [
      sblo("dha-1", "Patrice Odum", "p.odum@health.mil.example", "703-555-0621", "Small business office. Keeps the list of STARS III primes looking for local subs."),
      staffOf("dha-2", HERO_IDS.teamUp, false, "Named on the hospital IT request for information."),
      staffOf("dha-3", HERO_IDS.teamUp, true),
    ],
  },
  {
    id: "pope-763ess",
    agencyKey: 5303,
    name: "763rd Enterprise Sourcing Squadron (Pope Army Airfield)",
    abbreviation: "763 ESS",
    type: "federal",
    location: "Pope Army Airfield, NC",
    distanceMiles: PLACES.popeAaf.milesFromBase,
    whatTheyBuy:
      "IT support for the 43rd Communications Squadron and the airfield's clinic: $3.3M in FY2023–FY2025. The last two support contracts went to one 8(a) firm without a competition.",
    buysFood: true,
    agencyMatchers: ["763rd Enterprise Sourcing Squadron"],
    awardAgencies: ["763 ESS Pope"],
    officers: [
      first(staffOf("pope-1", "FA445227R0004", false, "Named on the 43 CS sources sought.")),
      pm("pope-3", "Capt. Renata Voss", "r.voss@us.af.mil.example", "910-555-0633", "43rd Communications Squadron. Writes the support requirements."),
    ],
  },
  {
    id: "seymour-4cons",
    agencyKey: 5304,
    name: "4th Contracting Squadron (Seymour Johnson AFB)",
    abbreviation: "4th CONS",
    type: "federal",
    location: "Goldsboro, NC",
    distanceMiles: PLACES.goldsboro.milesFromBase,
    whatTheyBuy:
      "Desktop support and base telecom work, competed as small-business set-asides: $2.5M in FY2023–FY2025. Your desktop support contract is one, and its follow-on is open now.",
    buysFood: true,
    agencyMatchers: ["4th Contracting Squadron"],
    awardAgencies: ["4th CONS"],
    officers: [
      first(staffOf("sj-1", "FA480927Q0006", false, "Named on the desktop support follow-on. Rated your work Very Good.")),
      staffOf("sj-2", "FA480927Q0006", true),
    ],
  },
  {
    id: "uspfo-nc",
    agencyKey: 5305,
    name: "USPFO for North Carolina (NC National Guard)",
    abbreviation: "USPFO NC",
    type: "federal",
    location: "Raleigh, NC",
    distanceMiles: PLACES.raleigh.milesFromBase,
    whatTheyBuy:
      "Laptops, imaging, security and phone lines for Guard offices across the state: $1.6M in FY2023–FY2025. Your laptop imaging quote is waiting on their award.",
    buysFood: true,
    agencyMatchers: ["USPFO for North Carolina"],
    awardAgencies: ["USPFO NC"],
    officers: [
      first(staffOf("ncng-1", "W91242-27-Q-0021", false, "Named on the recruiting office phone and internet quote.")),
      staffOf("ncng-2", "W91242-27-Q-0021", true),
    ],
  },
  {
    id: "va-nco6",
    agencyKey: 5306,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (buys for the Fayetteville VA Medical Center)",
    distanceMiles: PLACES.durham.milesFromBase,
    whatTheyBuy:
      "IT for the Fayetteville and Durham VA medical centers: $11.2M in FY2023–FY2025, mostly software for medical devices. VA rules give veteran-owned firms first claim, so its IT jobs near you are rarely open to you.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: [],
    officers: [
      sblo("nco6-1", "Gilbert Faison", "g.faison@va.gov.example", "919-555-0661", "Small business specialist for the network."),
      staffOf("nco6-2", "36C24627Q0187", false, "Named on the clinic cabling quote."),
    ],
  },
  {
    id: "marsoc",
    agencyKey: 5307,
    name: "Marine Forces Special Operations Command (MARSOC), Camp Lejeune",
    abbreviation: "MARSOC",
    type: "federal",
    location: "Camp Lejeune, NC",
    distanceMiles: PLACES.jacksonville.milesFromBase,
    whatTheyBuy:
      "Small IT jobs posted as ordinary quotes, such as office rewires and switch installs. Offices at Camp Lejeune spent $17.2M on IT in FY2023–FY2025.",
    buysFood: true,
    agencyMatchers: ["Marine Forces Special Operations Command"],
    awardAgencies: ["MARSOC"],
    officers: [first(staffOf("marsoc-1", "H9225727Q0012", false, "Named on the office rewire quote.")), staffOf("marsoc-2", "H9225727Q0012", true)],
  },
  {
    id: "ncdit",
    agencyKey: 5308,
    name: "NC Department of Information Technology",
    abbreviation: "NCDIT",
    type: "sled",
    location: "Raleigh, NC",
    distanceMiles: PLACES.raleigh.milesFromBase,
    whatTheyBuy:
      "Statewide IT term contracts that state agencies order from, such as 920S IT services. A new one is open now.",
    buysFood: true,
    agencyMatchers: ["NC Department of Information Technology"],
    awardAgencies: [],
    officers: [first(staffOf("ncdit-1", "ITS-402276-001", false, "Named on the IT specialty services term contract.")), staffOf("ncdit-2", "ITS-402276-001", true)],
  },
  {
    id: "fayetteville-city",
    agencyKey: 5309,
    name: "City of Fayetteville",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Help-desk overflow, after-hours support and network work for city offices, bid one job at a time.",
    buysFood: true,
    agencyMatchers: ["City of Fayetteville"],
    awardAgencies: [],
    officers: [
      sblo("fay-1", "Vernice Spivey", "v.spivey@fayettevillenc.gov.example", "910-555-0691", "Small and local business outreach. Ask her about the city's bidders list."),
      staffOf("fay-2", "FAY-IT-2027-03", false, "IT department. Named on the help desk overflow bid."),
    ],
  },
  {
    id: "cumberland-county",
    agencyKey: 5310,
    name: "Cumberland County Government",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Network refreshes and IT support for the courthouse, social services and other county offices.",
    buysFood: true,
    agencyMatchers: ["Cumberland County, NC"],
    awardAgencies: [],
    officers: [first(staffOf("cc-1", "CUMCO-IT-2027-02", false, "Information Services. Named on the switch refresh.")), staffOf("cc-2", "CUMCO-IT-2027-02", true)],
  },
  {
    id: "ftcc",
    agencyKey: 5311,
    name: "Fayetteville Technical Community College",
    abbreviation: "FTCC",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Evening and weekend help desk for students and staff, and classroom technology support. It pays in 30 days.",
    buysFood: true,
    agencyMatchers: ["Fayetteville Technical Community College"],
    awardAgencies: [],
    officers: [first(staffOf("ftcc-1", "FTCC-IT-2027-04", false, "Purchasing. Runs the student help desk bid.")), staffOf("ftcc-2", "FTCC-IT-2027-04", true)],
  },
];
