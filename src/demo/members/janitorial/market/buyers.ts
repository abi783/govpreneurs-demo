// THE JANITORIAL FIRM's buyer directory for Government Buyers: offices that buy
// cleaning, grounds and exterior work near Gray Owl's office in Fayetteville, NC (read
// through src/demo/explore/buyersData.ts, which picks the active member).
//
// Source: demo-storyboard/janitorial-pack.md, section 13. The offices are real, and so
// is what they buy. The people are made up, and their addresses end in ".example".
// Where an opportunity page already names a buyer's contracting staff (Grant's
// contacts, src/demo/grant/facts.ts), the same people are read from there, so both
// pages name the same person.
//
// Totals in "what they buy" are real: FY2023–FY2025 obligations for NAICS 561720,
// 561730 and 561790 with work in North Carolina, from USAspending transactions
// (pulled 19 Oct 2026; office matched by award-id prefix, so close, not exact). The
// pack has three-year totals only, not a split by year, so no office carries a spend
// analysis, and the page says so.
//
// Sources:
//   USAspending search API       https://api.usaspending.gov/api/v2/search/spending_by_award/
//   NCDOT rest-area custodial    https://connect.ncdot.gov/letting/Roadside/54-SH-04-PR33540/Nash%20Janitorial%20Proposal%2026.pdf
//   Robeson County Housing Auth. https://constructionbidsource.com/state/north-carolina/county/robeson/743452

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
    agencyKey: 5301,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Cleaning, grounds and building services for the post: $71.8M in FY2023–FY2025, 93% of it to two AbilityOne nonprofits. What a commercial firm can win is the exterior work, such as Public Works' pressure washing (HUBZone), and one-off floor jobs.",
    buysFood: true,
    agencyMatchers: ["Mission and Installation Contracting Command"],
    awardAgencies: ["MICC Fort Bragg"],
    officers: [
      sblo("micc-1", "Vernell Strickland", "v.strickland@army.mil.example", "910-555-0612", "Small business specialist. Ask her which Public Works services are coming up."),
      staffOf("micc-2", HERO_IDS.hero, false, "Named on the pressure-washing quote."),
      staffOf("micc-3", HERO_IDS.hero, true),
      pm("micc-4", "Darnell Oxendine", "d.oxendine@army.mil.example", "910-555-0614", "Public Works contracting officer's representative for exterior cleaning."),
    ],
  },
  {
    id: "usace-wilmington",
    agencyKey: 5302,
    name: "U.S. Army Corps of Engineers, Wilmington District",
    abbreviation: "USACE Wilmington",
    type: "federal",
    location: "Wilmington, NC (lakes and locks across the state)",
    distanceMiles: PLACES.wilmington.milesFromBase,
    whatTheyBuy:
      "Custodial and mowing at its lakes and locks, bought as small quotes where the lowest price wins: $1.27M across 24 firms in FY2023–FY2025, with 17 to 30 quotes each. You lost Jordan Lake here on price.",
    buysFood: true,
    agencyMatchers: ["Wilmington District"],
    awardAgencies: ["USACE Wilmington"],
    officers: [
      sblo("usacew-1", "Odessa McLamb", "o.mclamb@usace.army.mil.example", "910-555-0621", "Deputy for Small Business. Ask her which lake and lock quotes are coming."),
      co("usacew-2", "Truett Bordeaux", "t.bordeaux@usace.army.mil.example", "910-555-0622", "Signs the lake custodial and mowing quotes."),
    ],
  },
  {
    id: "seymour-4cons",
    agencyKey: 5303,
    name: "4th Contracting Squadron (Seymour Johnson AFB)",
    abbreviation: "4th CONS",
    type: "federal",
    location: "Goldsboro, NC",
    distanceMiles: PLACES.goldsboro.milesFromBase,
    whatTheyBuy:
      "Base custodial (8(a)), grounds (HUBZone to 2024, veteran-owned since) and exterior washing through BPAs: $4.19M in FY2023–FY2025. Your dorm washing job was a call under your BPA here.",
    buysFood: true,
    agencyMatchers: ["4th Contracting Squadron"],
    awardAgencies: ["4th CONS"],
    officers: [
      first(co("sj-1", "Capt. Lorena Batchelor", "l.batchelor@us.af.mil.example", "919-555-0631", "Contracting officer for your BPA. Sends the calls.")),
      pm("sj-2", "MSgt. Andre Hinnant", "a.hinnant@us.af.mil.example", "919-555-0632", "The COR on your dorm job. Ask him for the reference letter."),
    ],
  },
  {
    id: "pope-763ess",
    agencyKey: 5304,
    name: "763rd Enterprise Sourcing Squadron (Pope Army Airfield)",
    abbreviation: "763 ESS",
    type: "federal",
    location: "Pope Army Airfield, NC",
    distanceMiles: PLACES.popeAaf.milesFromBase,
    whatTheyBuy:
      "Services for the Air Force units at Pope: grounds (AbilityOne) and small facility jobs such as floor care, $1.02M in FY2023–FY2025.",
    buysFood: true,
    agencyMatchers: ["763rd Enterprise Sourcing Squadron"],
    awardAgencies: [],
    officers: [
      first(staffOf("pope-1", "FA445227Q0031", false, "Named on the quarterly floor care quote.")),
      staffOf("pope-2", "FA445227Q0031", true),
    ],
  },
  {
    id: "va-nco6",
    agencyKey: 5305,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (buys for the VA hospitals and clinics in NC)",
    distanceMiles: PLACES.durham.milesFromBase,
    whatTheyBuy:
      "Janitorial for VA hospitals and clinics: $10.0M across 16 firms in FY2023–FY2025. VA rules set it aside for veteran-owned firms (21 to 44 quotes each); small one-off jobs, like deep cleans, go to small businesses.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: ["VA NCO 6"],
    officers: [
      sblo("nco6-1", "Celestine Vann", "c.vann@va.gov.example", "919-555-0651", "Small business specialist for the network."),
      staffOf("nco6-2", "36C24627Q0083", false, "Named on the Durham janitorial quote."),
    ],
  },
  {
    id: "dha",
    agencyKey: 5306,
    name: "Defense Health Agency",
    abbreviation: "DHA",
    type: "federal",
    location: "Falls Church, VA (buys cleaning for Fort Bragg's Army hospital and the 4th Medical Group)",
    distanceMiles: 300,
    whatTheyBuy:
      "Hospital and clinic cleaning through a small-business IDIQ, for its holders only: $13.6M in FY2023–FY2025, plus $20.6M bought by Army Medical before that.",
    buysFood: true,
    agencyMatchers: ["Defense Health Agency"],
    awardAgencies: ["DHA"],
    officers: [
      sblo("dha-1", "Rochelle Batts", "r.batts@health.mil.example", "703-555-0661", "Small business office. Ask when the cleaning IDIQ opens to new holders."),
    ],
  },
  {
    id: "usace-charleston",
    agencyKey: 5307,
    name: "U.S. Army Corps of Engineers, Charleston District",
    abbreviation: "USACE Charleston",
    type: "federal",
    location: "Charleston, SC (buys for the 81st Readiness Division's Army Reserve centers)",
    distanceMiles: PLACES.charleston.milesFromBase,
    whatTheyBuy:
      "Janitorial and grounds at Army Reserve centers in North and South Carolina, set aside for 8(a) firms: $1.14M in FY2023–FY2025.",
    buysFood: true,
    agencyMatchers: ["Charleston District"],
    awardAgencies: ["USACE Charleston"],
    officers: [
      sblo("usacec-1", "Marisa Legare", "m.legare@usace.army.mil.example", "843-555-0671", "Deputy for Small Business. Keeps the list of 8(a) primes."),
      staffOf("usacec-2", HERO_IDS.teamUp, false, "Named on the Army Reserve sources sought."),
    ],
  },
  {
    id: "ncdot-div6",
    agencyKey: 5308,
    name: "NCDOT Division 6",
    abbreviation: "NCDOT",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "Custodial for the I-95 rest areas, staffed 16 hours a day, every day. The lowest responsible bid wins, with the state's own wage floor ($14.48 for an attendant).",
    buysFood: true,
    agencyMatchers: ["North Carolina Department of Transportation"],
    awardAgencies: [],
    officers: [
      first(staffOf("ncdot-1", "54-SH-06-PR34172", false, "Roadside Environmental. Named on the rest-area bid.")),
      staffOf("ncdot-2", "54-SH-06-PR34172", true),
    ],
  },
  {
    id: "rcha",
    agencyKey: 5309,
    name: "Robeson County Housing Authority",
    abbreviation: null,
    type: "sled",
    location: "Lumberton, NC",
    distanceMiles: PLACES.lumberton.milesFromBase,
    whatTheyBuy:
      "Office cleaning in four towns, bid on its own under HUD rules. Section 3 hiring of local low-income residents can score.",
    buysFood: true,
    agencyMatchers: ["Robeson County Housing Authority"],
    awardAgencies: [],
    officers: [first(staffOf("rcha-1", "RCHA-110626", false, "Procurement. Named on the office cleaning bid."))],
  },
  {
    id: "fayetteville-pwc",
    agencyKey: 5310,
    name: "Fayetteville Public Works Commission",
    abbreviation: "PWC",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Custodial and floor care at its water treatment plants and offices. Crews need the plant's safety training first.",
    buysFood: true,
    agencyMatchers: ["Fayetteville Public Works Commission"],
    awardAgencies: [],
    officers: [
      first(staffOf("pwc-1", "PWC-2627-22", false, "Purchasing. Named on the water plants bid.")),
      pm("pwc-2", "Lucinda Faison", "l.faison@faypwc.com.example", "910-555-0682", "Plant operations. Runs the safety training."),
    ],
  },
];
