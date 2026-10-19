// THE CONTRACTOR's buyer directory for Government Buyers: offices that buy building
// construction and repair near Ninebark Builders' shop in Fayetteville, NC (read
// through src/demo/explore/buyersData.ts, which picks the active member).
//
// Source: demo-storyboard/construction-pack.md, section 13. The offices are real,
// and so is what they buy. The people are made up, and their addresses end in
// ".example". Where an opportunity page already names a buyer's contracting staff
// (Grant's contacts, src/demo/grant/facts.ts), the same people are read from there,
// so both pages name the same person.
//
// Award counts and totals in "what they buy" are real: construction awards signed
// FY2023–FY2025 with work in Cumberland or Hoke County (NAICS 236220, 236210, 238210,
// 238220, 238290, 238990), from USAspending (pulled 19 Oct 2026; office matched by
// award-id prefix, so close, not exact). The pack has three-year totals only, not a
// split by year, so no office carries a spend analysis, and the page says so.
//
// Sources:
//   USAspending search API      https://api.usaspending.gov/api/v2/search/spending_by_award/
//   Cumberland County Schools 2026 HVAC bids  https://www.constructionbidsource.com/state/north-carolina/county/cumberland/820798
//   Crown Complex chiller bid   https://www.constructionbidsource.com/state/north-carolina/county/cumberland/821899
//   FSU notice to bidders       https://www.uncfsu.edu/assets/Documents/Facilities%20Management/2025/000109%20-%20Notice%20to%20Bidders.pdf
//   VA Veterans First           https://www.law.cornell.edu/uscode/text/38/8127

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
    id: "usace-wilmington",
    agencyKey: 5201,
    name: "U.S. Army Corps of Engineers, Wilmington District",
    abbreviation: "USACE Wilmington",
    type: "federal",
    location: "Wilmington, NC (builds and repairs at Fort Bragg)",
    distanceMiles: PLACES.wilmington.milesFromBase,
    whatTheyBuy:
      "Repairs and new buildings for Special Operations units at Fort Bragg, often as HUBZone sealed bids where the lowest responsive bid wins: 35 awards, $150.5M in FY2023–FY2025.",
    buysFood: true,
    agencyMatchers: ["Wilmington District"],
    awardAgencies: ["USACE Wilmington"],
    officers: [
      sblo("usacew-1", "Theodora Pruitt", "t.pruitt@usace.army.mil.example", "910-555-0511", "Deputy for Small Business. Ask her which HUBZone bids are coming."),
      staffOf("usacew-2", HERO_IDS.hero, false, "Named on the training building sealed bid."),
      staffOf("usacew-3", HERO_IDS.hero, true),
    ],
  },
  {
    id: "micc-bragg",
    agencyKey: 5202,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Public works repairs on post: 262 awards, $56.6M in FY2023–FY2025. Most go through two HUBZone MATOCs, for holders only, or to 8(a) firms without a competition. Small jobs are posted as small-business quotes.",
    buysFood: true,
    agencyMatchers: ["Mission and Installation Contracting Command"],
    awardAgencies: ["MICC Fort Bragg"],
    officers: [
      sblo("micc-1", "Gerald Ashby", "g.ashby@army.mil.example", "910-555-0521", "Small business specialist. He runs the MATOC industry days."),
      staffOf("micc-2", HERO_IDS.twin, false, "Named on the barracks HVAC task order."),
      staffOf("micc-3", HERO_IDS.twin, true),
      pm("micc-4", "Corinne Lassiter", "c.lassiter@army.mil.example", "910-555-0524", "Public Works project manager for barracks repairs."),
    ],
  },
  {
    id: "pope-763ess",
    agencyKey: 5203,
    name: "763rd Enterprise Sourcing Squadron (Pope Army Airfield)",
    abbreviation: "763 ESS",
    type: "federal",
    location: "Pope Army Airfield, NC",
    distanceMiles: PLACES.popeAaf.milesFromBase,
    whatTheyBuy:
      "Small repairs at Pope, competed as small-business set-asides: HVAC, electrical and building repairs, 31 awards and $9.4M in FY2023–FY2025. Your office building job was one.",
    buysFood: true,
    agencyMatchers: ["763rd Enterprise Sourcing Squadron"],
    awardAgencies: ["763 ESS Pope"],
    officers: [
      first(staffOf("pope-1", "FA445227Q0007", false, "Named on the split systems quote. Rated your last job Very Good.")),
      staffOf("pope-2", "FA445227Q0007", true),
      pm("pope-3", "Lt. Marisol Ventura", "m.ventura@us.af.mil.example", "910-555-0533", "Civil engineering. Writes the repair scopes."),
    ],
  },
  {
    id: "usace-savannah",
    agencyKey: 5204,
    name: "U.S. Army Corps of Engineers, Savannah District",
    abbreviation: "USACE Savannah",
    type: "federal",
    location: "Savannah, GA (barracks and airfield work at Fort Bragg)",
    distanceMiles: 260,
    whatTheyBuy:
      "Large barracks repairs and airfield work at Fort Bragg: 11 awards, $106.2M in FY2023–FY2025. Most are far past your bond line, so the way in is the winners' electrical and HVAC packages.",
    buysFood: true,
    agencyMatchers: ["Savannah District"],
    awardAgencies: ["USACE Savannah"],
    officers: [
      sblo("usaces-1", "Wendell Okonkwo", "w.okonkwo@usace.army.mil.example", "912-555-0541", "Deputy for Small Business. Keeps the list of primes looking for subs."),
      staffOf("usaces-2", "W912HN27R4012", false, "Named on the barracks repair."),
    ],
  },
  {
    id: "va-nco6",
    agencyKey: 5205,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (buys for the Fayetteville VA Medical Center)",
    distanceMiles: PLACES.durham.milesFromBase,
    whatTheyBuy:
      "Renovations, chillers and building systems at the Fayetteville VA: 29 awards, $46.4M in FY2023–FY2025. VA rules give veteran-owned firms first claim, so a firm like yours comes in as a subcontractor.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: ["VA NCO 6"],
    officers: [
      sblo("nco6-1", "Rosalind Teague", "r.teague@va.gov.example", "919-555-0551", "Small business specialist for the network."),
      staffOf("nco6-2", HERO_IDS.teamUp, false, "Named on the fan coil sources sought."),
      staffOf("nco6-3", HERO_IDS.teamUp, true),
      pm("nco6-4", "Harlan Mewborn", "h.mewborn@va.gov.example", "910-555-0554", "Facilities engineer at the Fayetteville VA."),
    ],
  },
  {
    id: "faa-esa",
    agencyKey: 5206,
    name: "Federal Aviation Administration, Eastern Service Area",
    abbreviation: "FAA",
    type: "federal",
    location: "College Park, GA (buys for FAA sites in North Carolina)",
    distanceMiles: 360,
    whatTheyBuy:
      "HVAC and power at radar and tower sites near you: 3 awards, $0.55M in FY2023–FY2025. Small jobs that draw many bids.",
    buysFood: true,
    agencyMatchers: ["Federal Aviation Administration"],
    awardAgencies: ["FAA"],
    officers: [
      first(staffOf("faa-1", "6973GH-27-R-00031", false, "Named on the airport HVAC replacement.")),
      staffOf("faa-2", "6973GH-27-R-00031", true),
    ],
  },
  {
    id: "cumberland-schools",
    agencyKey: 5207,
    name: "Cumberland County Schools",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "HVAC replacements bid each spring for work over the summer break: four in 2026. Bonds over $300,000. You did one of their schools in 2024.",
    buysFood: true,
    agencyMatchers: ["Cumberland County Schools"],
    awardAgencies: [],
    officers: [
      first(staffOf("ccs-1", "173-27004", false, "Facilities. Signs the summer HVAC bids.")),
      staffOf("ccs-2", "173-27004", true),
      pm("ccs-3", "Delmar Pittman", "d.pittman@ccs.k12.nc.us.example", "910-555-0563", "Maintenance director. Knows which schools are next."),
    ],
  },
  {
    id: "fsu",
    agencyKey: 5208,
    name: "Fayetteville State University",
    abbreviation: "FSU",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "Repair and renovation of campus buildings under state rules: formal bids from $500,000, with bonds. You lost a classroom HVAC job here on price this year.",
    buysFood: true,
    agencyMatchers: ["Fayetteville State University"],
    awardAgencies: [],
    officers: [
      first(staffOf("fsu-1", "27-0118", false, "Facilities Management. Named on the residence hall switchgear bid.")),
      staffOf("fsu-2", "27-0118", true),
    ],
  },
  {
    id: "fayetteville-city",
    agencyKey: 5209,
    name: "City of Fayetteville",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Lighting, electrical and HVAC work at recreation centers, fire stations and city buildings, bid one job at a time.",
    buysFood: true,
    agencyMatchers: ["City of Fayetteville"],
    awardAgencies: [],
    officers: [
      sblo("fay-1", "Antoinette Gaskins", "a.gaskins@fayettevillenc.gov.example", "910-555-0571", "Small and local business outreach. Ask her about the city's bidders list."),
      staffOf("fay-2", "B27-014", false, "Purchasing. Named on the recreation center lighting bid."),
    ],
  },
  {
    id: "cumberland-county",
    agencyKey: 5210,
    name: "Cumberland County Government",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "HVAC work in county buildings, such as the Crown Complex chiller bid in 2026 and the courthouse air handlers now.",
    buysFood: true,
    agencyMatchers: ["Cumberland County, NC"],
    awardAgencies: [],
    officers: [
      first(staffOf("cc-1", "CC-27-06", false, "Facilities Management. Named on the courthouse air handler bid.")),
      staffOf("cc-2", "CC-27-06", true),
    ],
  },
  {
    id: "ftcc",
    agencyKey: 5211,
    name: "Fayetteville Technical Community College",
    abbreviation: "FTCC",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Air handler, controls and lighting work in classroom buildings, often done on nights and weekends during the term.",
    buysFood: true,
    agencyMatchers: ["Fayetteville Technical Community College"],
    awardAgencies: [],
    officers: [
      first(co("ftcc-1", "Clement Ivey", "c.ivey@faytechcc.edu.example", "910-555-0581", "Purchasing. Runs the air handler bid.")),
      pm("ftcc-2", "Sondra Heath", "s.heath@faytechcc.edu.example", "910-555-0582", "Facilities director."),
    ],
  },
];
