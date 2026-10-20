// THE TRUCKING COMPANY's buyer directory for Government Buyers: offices that buy
// trucking, hauling and courier work near Rockfish Run Freight's yard in
// Fayetteville, NC (read through src/demo/explore/buyersData.ts, which picks the
// active member).
//
// Source: demo-storyboard/trucking-pack.md, sections 6 and 13. The offices are real,
// and so is how they buy. The people are made up, and their addresses end in
// ".example". Where an opportunity page already names a buyer's contracting staff
// (Grant's contacts, src/demo/grant/facts.ts), the same people are read from there,
// so both pages name the same person.
//
// No dollar totals: the pack found no trustworthy spend baseline for any of these
// offices in her codes, so "what they buy" cites awards in awards.ts and the
// buying rules, and no office carries a spend analysis.
//
// Sources:
//   VA Veterans First (38 U.S.C. 8127)  https://www.law.cornell.edu/uscode/text/38/8127
//   DFTS II award HTC71124DR035         https://sam.gov/opp/61d327eafc4e4b13a15e4b73eebe32e3/view
//   TPS HTC711-13-R-R005                https://sam.gov/opp/ca41549209ab1ce43ba73def827cfcf2/view
//   USPS buys under 39 U.S.C. 410       https://www.law.cornell.edu/uscode/text/39/410
//   USPS supplier registration          https://about.usps.com/what/business-services/suppliers/becoming/registration.htm
//   NCDOT Division 8 hauling RFQ        https://connect.ncdot.gov/letting/Division%208%20Letting/11-25-2025/D08POCD1.PR29196_Hauling_Contract_Chatham,_Montgomery_and_Randolph_Counties_RFQ_Lttr_eSigned.pdf

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
    id: "va-nco6",
    agencyKey: 5401,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (buys for the Fayetteville VA and its clinics)",
    distanceMiles: PLACES.durham.milesFromBase,
    whatTheyBuy:
      "Route trucking and courier runs for the VA hospitals and clinics in North Carolina and Virginia: the chilled freight routes from Hampton, lab and pharmacy couriers in Durham, instrument runs to Garner. VA rules give veteran-owned firms first claim, so most are set aside for service-disabled veteran-owned firms like yours.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: ["VA NCO 6"],
    officers: [
      sblo("nco6-1", "Lorraine Sutphin", "l.sutphin@va.gov.example", "919-555-0611", "Small business specialist for the network. Ask her which route contracts end next year."),
      staffOf("nco6-2", HERO_IDS.hero, false, "Named on the Fayetteville supply and linen runs."),
      staffOf("nco6-3", HERO_IDS.hero, true),
      pm("nco6-4", "Cedric Faison", "c.faison@va.gov.example", "910-555-0614", "Logistics chief at the Fayetteville VA. Runs the warehouse the routes start from."),
    ],
  },
  {
    id: "micc-bragg",
    agencyKey: 5402,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Small hauling jobs on post, posted as small-business quotes: trailer removals, furniture moves in the spring move season, container and generator moves. Most run $5K–$55K and draw 5 to 11 quotes. Your 18th Airborne Corps job was one.",
    buysFood: true,
    agencyMatchers: ["Mission and Installation Contracting Command"],
    awardAgencies: ["MICC Fort Bragg"],
    officers: [
      first(staffOf("micc-1", "W91247-27-Q-0119", false, "Named on the on-call trailer and container quote. Signed your last job.")),
      staffOf("micc-2", "W91247-27-Q-0119", true),
      sblo("micc-3", "Gerard Monroe", "g.monroe@army.mil.example", "910-555-0623", "Small business specialist. Ask him which unit moves are coming before the spring season."),
    ],
  },
  {
    id: "acc-rock-island",
    agencyKey: 5403,
    name: "Army Contracting Command – Rock Island",
    abbreviation: "ACC-RI",
    type: "federal",
    location: "Rock Island, IL (buys Fort Bragg's base logistics)",
    distanceMiles: 870,
    whatTheyBuy:
      "Base logistics task orders under the Army's EAGLE agreement: motor pools, supply and transportation at one base each. Only agreement holders can bid, so a carrier comes in as a subcontractor.",
    buysFood: true,
    agencyMatchers: ["Rock Island"],
    awardAgencies: ["ACC-RI"],
    officers: [
      sblo("accri-1", "Desmond Keplinger", "d.keplinger@army.mil.example", "309-555-0631", "Deputy for Small Business. Ask him which EAGLE holders are teaming for Fort Bragg."),
      co("accri-2", "Marguerite Ellison", "m.ellison@army.mil.example", "309-555-0634", "Contracting officer for the Fort Bragg task order."),
    ],
  },
  {
    id: "dla-distribution",
    agencyKey: 5404,
    name: "DLA Distribution",
    abbreviation: "DLA",
    type: "federal",
    location: "Cherry Point, NC site (aboard MCAS Cherry Point)",
    distanceMiles: PLACES.cherryPoint.milesFromBase,
    whatTheyBuy:
      "Freight out of its depots. The secure-cargo runs are open only to carriers SDDC has approved for protective service, and the solicitation goes only to them.",
    buysFood: true,
    agencyMatchers: ["DLA Distribution"],
    awardAgencies: [],
    officers: [
      first(staffOf("dla-1", HERO_IDS.twin, false, "Named on the secure freight runs.")),
      staffOf("dla-2", HERO_IDS.twin, true),
    ],
  },
  {
    id: "mcb-lejeune",
    agencyKey: 5405,
    name: "Marine Corps Base Camp Lejeune Contracting Office",
    abbreviation: "MCB Camp Lejeune",
    type: "federal",
    location: "Camp Lejeune, NC",
    distanceMiles: PLACES.jacksonville.milesFromBase,
    whatTheyBuy:
      "On-call trailer moves and small hauling jobs around the base, set aside for small businesses. The last trailer contract ran four years and drew 5 quotes.",
    buysFood: true,
    agencyMatchers: ["Camp Lejeune"],
    awardAgencies: ["MCB Camp Lejeune"],
    officers: [
      first(staffOf("mcbl-1", "M6700127Q0058", false, "Named on the on-call trailer transport quote.")),
      staffOf("mcbl-2", "M6700127Q0058", true),
    ],
  },
  {
    id: "mrco-east",
    agencyKey: 5406,
    name: "Medical Readiness Contracting Office – East",
    abbreviation: "MRCO East",
    type: "federal",
    location: "Fort Bragg, NC (buys for the Army hospital on post)",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Courier work for the Army hospital at Fort Bragg: lab specimens twice a day from clinics on post, ordered each year under a courier agreement, with rush calls around the clock.",
    buysFood: true,
    agencyMatchers: ["MRCO East"],
    awardAgencies: ["MRCO East"],
    officers: [
      first(staffOf("mrco-1", "W81K0427QA014", false, "Named on the lab specimen courier quote.")),
      staffOf("mrco-2", "W81K0427QA014", true),
    ],
  },
  {
    id: "ustranscom",
    agencyKey: 5407,
    name: "U.S. Transportation Command (with SDDC)",
    abbreviation: "USTRANSCOM",
    type: "federal",
    location: "Scott Air Force Base, IL",
    distanceMiles: 800,
    whatTheyBuy:
      "DoD's freight programs. Most freight inside the US goes through Crowley under DFTS II, and carriers haul it as Crowley's subcontractors. Secure cargo goes to carriers approved for protective service. Neither is posted as single loads; you get in through SDDC's carrier registration.",
    buysFood: true,
    agencyMatchers: ["Transportation Command"],
    awardAgencies: [],
    officers: [
      first(sblo("tc-1", "Alyssa Brandt", "a.brandt@us.af.mil.example", "618-555-0671", "Small business office. Ask her when SDDC's carrier registration opens next.")),
      staffOf("tc-2", "HTC711-27-R-R004", false, "Named on the secure-freight program."),
    ],
  },
  {
    id: "usps-surface",
    agencyKey: 5408,
    name: "U.S. Postal Service, Surface Transportation",
    abbreviation: "USPS",
    type: "federal",
    location: "Fayetteville mail plant (bought from USPS headquarters)",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "Mail routes from the Fayetteville plant, paid a fixed rate per trip. USPS buys under its own rules, so there are no set-asides, and it posts routes in its own system, not SAM.gov.",
    buysFood: true,
    agencyMatchers: ["Postal Service"],
    awardAgencies: [],
    officers: [
      first(staffOf("usps-1", "HCR-28370", false, "Named on the Fayetteville mail route.")),
      staffOf("usps-2", "HCR-28370", true),
    ],
  },
  {
    id: "ncdot-div6",
    agencyKey: 5409,
    name: "NCDOT Division 6",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "On-call hauling after storms, bid once a year at hourly rates; the lowest responsible bid wins. You hauled for them in 2025.",
    buysFood: true,
    agencyMatchers: ["Division 6"],
    awardAgencies: [],
    officers: [
      first(staffOf("ncd6-1", "D6D2.POC.036", false, "Named on the 2027 on-call hauling bid.")),
      staffOf("ncd6-2", "D6D2.POC.036", true),
    ],
  },
  {
    id: "ncdot-div8",
    agencyKey: 5410,
    name: "NCDOT Division 8",
    abbreviation: null,
    type: "sled",
    location: "Carthage, NC",
    distanceMiles: PLACES.carthage.milesFromBase,
    whatTheyBuy: "The same on-call storm hauling as Division 6, bid by county group: Hoke, Moore and Lee this year.",
    buysFood: true,
    agencyMatchers: ["Division 8"],
    awardAgencies: [],
    officers: [
      first(co("ncd8-1", "Tobias Hinson", "t.hinson@ncdot.gov.example", "910-555-0651", "Division contract officer. Signs the county hauling bids.")),
      pm("ncd8-2", "Leanne Purvis", "l.purvis@ncdot.gov.example", "910-555-0654", "Division maintenance engineer. Calls the trucks out after a storm."),
    ],
  },
  {
    id: "cumberland-ems",
    agencyKey: 5411,
    name: "Cumberland County Emergency Services",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Trucks and drivers on standby for hurricane supply sites, paid for standby hours and for each run.",
    buysFood: true,
    agencyMatchers: ["Cumberland County, NC"],
    awardAgencies: [],
    officers: [
      first(staffOf("ccem-1", "RFP27-11-EM", false, "Named on the hurricane supply sites request.")),
      pm("ccem-2", "Ruthanne Gaddy", "r.gaddy@cumberlandcountync.gov.example", "910-555-0682", "Emergency logistics planner. Knows where the supply sites go."),
    ],
  },
  {
    id: "usfws",
    agencyKey: 5412,
    name: "U.S. Fish and Wildlife Service",
    abbreviation: "FWS",
    type: "federal",
    location: "Swan Quarter, NC (Mattamuskeet refuge)",
    distanceMiles: PLACES.mattamuskeet.milesFromBase,
    whatTheyBuy: "Gravel and stone delivered to refuge roads in eastern North Carolina, priced by the ton, about once a year.",
    buysFood: true,
    agencyMatchers: ["Fish & Wildlife"],
    awardAgencies: ["FWS"],
    officers: [
      first(staffOf("fws-1", "140FS327Q0021", false, "Named on the Mattamuskeet gravel quote.")),
      co("fws-2", "Wendell Ausband", "w.ausband@fws.gov.example", "252-555-0691", "Signs the refuge's road-material orders."),
    ],
  },
];
