// Government Buyers — operator-grade buyer directory for Marcus.
// People-first: each buyer has 3–12 officers (CO, SBLO, Specialist, Facilities POC).
// Contact details are MOCK / sample data — structure is realistic, values are not.
// Buyer rows reference real opportunity & awarded-contract IDs so the counts
// shown on Government Buyers match the Opportunities feed and Awarded tab
// (single source of truth).

import { OPPORTUNITIES, type Opportunity } from "./opportunities";
import { AWARDED_CONTRACTS } from "./awardedContracts";

export type BuyerType = "federal" | "sled";

export type OfficerRole =
  | "Contracting Officer"
  | "Small-Business Liaison"
  | "Contract Specialist"
  | "Facilities/Engineering POC";

export interface BuyerOfficer {
  id: string;
  name: string;
  role: OfficerRole;
  email: string; // sample
  phone: string; // sample
  notes?: string;
  recommendedFirstContact?: boolean;
}

export type PursueVerdict = "worth-it" | "maybe" | "not-yet";

export interface BuyerAnalysis {
  verdict: PursueVerdict;
  why: string;
  annualSpendByYear: { year: number; trade: number }[]; // last 3 yrs, his trade ($)
  smallBizPct: number;
  sdvosbPct: number;
  seasonalityNote: string;
  spendBreakdown: {
    category: string;
    byYear: { year: number; amount: number }[];
  }[];
  topAwardees: {
    company: string;
    awardsCount: number;
    totalDollars: number;
  }[];
}

export interface GovBuyer {
  id: string;
  name: string;
  type: BuyerType;
  location: string;
  distanceMiles: number; // from Fayetteville, NC
  whatTheyBuy: string;
  buysRoofing: boolean;
  /** Substrings of opportunity.agency / opportunity.subAgency to match the feed. */
  agencyMatchers: string[];
  /** Substrings used to find awarded contracts attributed to this buyer. */
  awardMatchers?: string[];
  officers: BuyerOfficer[];
  /** Optional seeded "should I pursue this buyer?" analysis. */
  analysis?: BuyerAnalysis;
}

// ───────────────────────── helpers ─────────────────────────

function matchesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n.toLowerCase()));
}

export function getOpenOppsForBuyer(b: GovBuyer): Opportunity[] {
  return OPPORTUNITIES.filter((o) => {
    const combined = `${o.agency} ${o.subAgency ?? ""}`;
    return matchesAny(combined, b.agencyMatchers);
  });
}

export function getRoofingAwardsForBuyer(b: GovBuyer) {
  const matchers = b.awardMatchers ?? b.agencyMatchers;
  return AWARDED_CONTRACTS.filter((a) => {
    const combined = `${a.agency} ${a.agencyAbbrev} ${a.subAgency ?? ""} ${a.location}`;
    return matchesAny(combined, matchers);
  });
}

export function searchBuyers(
  list: GovBuyer[],
  q: string,
  near: "nc" | "all",
  buys: "roofing" | "all",
): GovBuyer[] {
  const lower = q.trim().toLowerCase();
  return list.filter((b) => {
    if (buys === "roofing" && !b.buysRoofing) return false;
    if (near === "nc" && b.distanceMiles > 250) return false;
    if (!lower) return true;
    const hay = `${b.name} ${b.location} ${b.whatTheyBuy} ${b.officers.map((o) => o.name).join(" ")}`;
    return hay.toLowerCase().includes(lower);
  });
}

// ───────────────────────── seed dataset ─────────────────────────
// 16 NC-relevant buyers (federal + SLED) with realistic-looking sample officers.

const co = (id: string, name: string, email: string, phone: string, notes?: string): BuyerOfficer => ({
  id, name, role: "Contracting Officer", email, phone, notes,
});
const sblo = (id: string, name: string, email: string, phone: string, notes?: string): BuyerOfficer => ({
  id, name, role: "Small-Business Liaison", email, phone, notes, recommendedFirstContact: true,
});
const spec = (id: string, name: string, email: string, phone: string, notes?: string): BuyerOfficer => ({
  id, name, role: "Contract Specialist", email, phone, notes,
});
const facpoc = (id: string, name: string, email: string, phone: string, notes?: string): BuyerOfficer => ({
  id, name, role: "Facilities/Engineering POC", email, phone, notes,
});

export const GOV_BUYERS: GovBuyer[] = [
  {
    id: "usace-wilmington",
    name: "USACE Wilmington District",
    type: "federal",
    location: "Wilmington, NC",
    distanceMiles: 95,
    whatTheyBuy:
      "Building repair & re-roofing for Fort Bragg, Pope AAF, Camp Mackall and Coastal NC installations. Heavy MATOC/SDVOSB usage.",
    buysRoofing: true,
    agencyMatchers: ["USACE", "Wilmington District", "Fort Bragg", "Pope AAF", "Camp Mackall"],
    awardMatchers: ["Wilmington", "Fort Bragg", "Pope", "Bragg"],
    officers: [
      sblo("usace-w-1", "Karen J. Whitfield", "karen.whitfield@usace.army.mil.sample", "910-251-4827", "Routes small business inquiries for the district."),
      co("usace-w-2", "Maj. David R. Holcomb", "david.holcomb@usace.army.mil.sample", "910-251-4631", "Lead CO on Fort Bragg roofing MATOCs."),
      co("usace-w-3", "LaTonya Brewer", "latonya.brewer@usace.army.mil.sample", "910-251-4499", "Pope AAF / Camp Mackall awards."),
      spec("usace-w-4", "Brian Yates", "brian.yates@usace.army.mil.sample", "910-251-4501"),
      spec("usace-w-5", "Marissa Cole", "marissa.cole@usace.army.mil.sample", "910-251-4574"),
      facpoc("usace-w-6", "Sgt. Hector Alvarez", "hector.alvarez@bragg.army.mil.sample", "910-396-2018", "Walks roof scopes pre-RFP at Fort Bragg DPW."),
    ],
  },
  {
    id: "usace-savannah",
    name: "USACE Savannah District",
    type: "federal",
    location: "Savannah, GA",
    distanceMiles: 235,
    whatTheyBuy:
      "Roofing, paving & facility renovation across the Carolinas/Georgia. Awards regularly to NC-based SDVOSBs.",
    buysRoofing: true,
    agencyMatchers: ["Savannah District", "USACE.*Savannah"],
    awardMatchers: ["Savannah", "Charleston"],
    officers: [
      sblo("usace-s-1", "Renee Atkinson", "renee.atkinson@usace.army.mil.sample", "912-652-5063", "SBLO — friendly to first-time NC primes."),
      co("usace-s-2", "Mark E. Petersen", "mark.petersen@usace.army.mil.sample", "912-652-5512"),
      co("usace-s-3", "Janelle Ortiz", "janelle.ortiz@usace.army.mil.sample", "912-652-5418"),
      spec("usace-s-4", "Cory Bishop", "cory.bishop@usace.army.mil.sample", "912-652-5230"),
    ],
  },
  {
    id: "bragg-dpw",
    name: "Fort Bragg DPW",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: 12,
    whatTheyBuy:
      "On-post facility sustainment: roofing, envelope, HVAC, paving for barracks and admin buildings.",
    buysRoofing: true,
    agencyMatchers: ["Fort Bragg DPW", "Bragg DPW"],
    awardMatchers: ["Bragg"],
    officers: [
      sblo("bragg-1", "Tanya Whitlock", "tanya.whitlock@bragg.army.mil.sample", "910-432-1077", "Triages all small-business outreach for DPW."),
      facpoc("bragg-2", "Sgt. First Class Andre King", "andre.king@bragg.army.mil.sample", "910-432-1184", "Roofing/envelope walk-throughs."),
      co("bragg-3", "Capt. Lisa Reardon", "lisa.reardon@bragg.army.mil.sample", "910-432-1119"),
      spec("bragg-4", "Devon Petty", "devon.petty@bragg.army.mil.sample", "910-432-1062"),
      spec("bragg-5", "Marcus Holloway", "marcus.holloway@bragg.army.mil.sample", "910-432-1050"),
    ],
  },
  {
    id: "navfac-lejeune",
    name: "NAVFAC Mid-Atlantic — Camp Lejeune",
    type: "federal",
    location: "Jacksonville, NC",
    distanceMiles: 120,
    whatTheyBuy:
      "Roof PM, family-housing re-roofing, envelope repair at MCB Camp Lejeune and outlying training areas.",
    buysRoofing: true,
    agencyMatchers: ["NAVFAC", "Camp Lejeune", "Navy"],
    awardMatchers: ["Lejeune", "NAVFAC"],
    officers: [
      sblo("lej-1", "Stephanie Crowder", "stephanie.crowder@navy.mil.sample", "757-444-9211", "Mid-Atlantic small-business deputy."),
      co("lej-2", "LCDR Patrick Doyle", "patrick.doyle@navy.mil.sample", "910-451-2287"),
      co("lej-3", "Adrienne Marsh", "adrienne.marsh@navy.mil.sample", "910-451-2241"),
      spec("lej-4", "Will Crawford", "will.crawford@navy.mil.sample", "910-451-2310"),
      facpoc("lej-5", "Cpl. Dion Tate", "dion.tate@usmc.mil.sample", "910-451-7733"),
    ],
  },
  {
    id: "navfac-cherrypoint",
    name: "NAVFAC Mid-Atlantic — MCAS Cherry Point",
    type: "federal",
    location: "Cherry Point, NC",
    distanceMiles: 175,
    whatTheyBuy:
      "Shingle & metal roofing on family housing and shop buildings; hangar envelope repair.",
    buysRoofing: true,
    agencyMatchers: ["Cherry Point", "MCAS"],
    awardMatchers: ["Cherry Point", "Cherrypoint", "Cherry"],
    officers: [
      sblo("chp-1", "Yvonne Pickett", "yvonne.pickett@navy.mil.sample", "252-466-3380"),
      co("chp-2", "LtCol Hannah Greer", "hannah.greer@usmc.mil.sample", "252-466-2914"),
      spec("chp-3", "Jerome Akins", "jerome.akins@navy.mil.sample", "252-466-3104"),
    ],
  },
  {
    id: "seymour-johnson",
    name: "Seymour Johnson AFB — 4th CONS",
    type: "federal",
    location: "Goldsboro, NC",
    distanceMiles: 70,
    whatTheyBuy:
      "Hangar roof repair, building re-roofs, small construction. Active Total Small Business set-asides.",
    buysRoofing: true,
    agencyMatchers: ["Seymour Johnson", "4th CONS", "Air Force.*Seymour"],
    awardMatchers: ["Seymour"],
    officers: [
      sblo("sj-1", "Tasha Mendenhall", "tasha.mendenhall.4@us.af.mil.sample", "919-722-1108"),
      co("sj-2", "Capt. Eli Soto", "eli.soto.2@us.af.mil.sample", "919-722-1145"),
      spec("sj-3", "MSgt. Brent Hicks", "brent.hicks@us.af.mil.sample", "919-722-1171"),
      facpoc("sj-4", "TSgt. Carla Owens", "carla.owens@us.af.mil.sample", "919-722-2890"),
    ],
  },
  {
    id: "pope-aaf",
    name: "Pope Army Airfield",
    type: "federal",
    location: "Pope AAF, NC",
    distanceMiles: 14,
    whatTheyBuy:
      "Hangar TPO re-roofing, single-ply membrane work, building envelope.",
    buysRoofing: true,
    agencyMatchers: ["Pope AAF", "Pope Army"],
    awardMatchers: ["Pope"],
    officers: [
      sblo("pope-1", "Ronda Pierce", "ronda.pierce@us.af.mil.sample", "910-394-2207"),
      co("pope-2", "Maj. Trent Larkin", "trent.larkin.2@us.af.mil.sample", "910-394-2118"),
      spec("pope-3", "SSgt. Wendell Park", "wendell.park@us.af.mil.sample", "910-394-2141"),
    ],
  },
  {
    id: "va-fayetteville",
    name: "VA Fayetteville Health Care Center",
    type: "federal",
    location: "Fayetteville, NC",
    distanceMiles: 4,
    whatTheyBuy:
      "Facility re-roofing, repair, and small construction on the medical campus. SDVOSB-preferred per VA rule.",
    buysRoofing: true,
    agencyMatchers: ["Veterans Affairs", "VA.*Fayetteville", "Fayetteville.*VA", "VHA"],
    awardMatchers: ["Fayetteville", "VA"],
    officers: [
      sblo("vaf-1", "Charlene Boykin", "charlene.boykin@va.gov.sample", "910-488-2120 x7714", "VA SBLO — actively recruits SDVOSB roofers."),
      co("vaf-2", "Aaron Whitt", "aaron.whitt@va.gov.sample", "910-488-2120 x7681"),
      spec("vaf-3", "Felicia Daughtry", "felicia.daughtry@va.gov.sample", "910-488-2120 x7702"),
      facpoc("vaf-4", "Robert Sinclair", "robert.sinclair@va.gov.sample", "910-488-2120 x7330"),
    ],
  },
  {
    id: "va-salisbury",
    name: "VA Salisbury Health Care System",
    type: "federal",
    location: "Salisbury, NC",
    distanceMiles: 155,
    whatTheyBuy:
      "Hospital facility re-roofing and repair across Salisbury, Charlotte, and Kernersville campuses.",
    buysRoofing: true,
    agencyMatchers: ["Salisbury.*VA", "VA.*Salisbury", "W. G. Bill Hefner"],
    awardMatchers: ["Salisbury"],
    officers: [
      sblo("vas-1", "Deidra Hollings", "deidra.hollings@va.gov.sample", "704-638-9000 x2210"),
      co("vas-2", "Marcus Antonelli", "marcus.antonelli@va.gov.sample", "704-638-9000 x2188"),
      spec("vas-3", "Pat Whiteside", "pat.whiteside@va.gov.sample", "704-638-9000 x2151"),
    ],
  },
  {
    id: "gsa-r4",
    name: "GSA Region 4 — Atlanta",
    type: "federal",
    location: "Atlanta, GA (serves NC)",
    distanceMiles: 245,
    whatTheyBuy:
      "Federal building re-roofing and envelope repair across the Southeast region; GSA MAS Facilities pathways.",
    buysRoofing: true,
    agencyMatchers: ["GSA", "Region 4", "General Services"],
    awardMatchers: ["GSA", "Greensboro"],
    officers: [
      sblo("gsa-1", "Crystal Vaughn", "crystal.vaughn@gsa.gov.sample", "404-331-5101", "GSA R4 small-business advocate."),
      co("gsa-2", "Henry Park", "henry.park@gsa.gov.sample", "404-331-5247"),
      co("gsa-3", "Lila Domingo", "lila.domingo@gsa.gov.sample", "404-331-5290"),
      spec("gsa-4", "Trevor Reems", "trevor.reems@gsa.gov.sample", "404-331-5318"),
    ],
  },
  {
    id: "nc-ng",
    name: "NC National Guard — Construction & Facilities",
    type: "sled",
    location: "Raleigh, NC",
    distanceMiles: 60,
    whatTheyBuy:
      "Armory roofing, weatherproofing, small construction across 70+ NC armories.",
    buysRoofing: true,
    agencyMatchers: ["NC National Guard", "NCNG", "National Guard.*North Carolina"],
    awardMatchers: ["National Guard", "NCNG"],
    officers: [
      sblo("ncng-1", "Glenda Pope", "glenda.pope@ncdps.gov.sample", "919-664-6700"),
      co("ncng-2", "CW3 Eric Sanderson", "eric.sanderson@ncdps.gov.sample", "919-664-6217"),
      spec("ncng-3", "Hannah Brisbane", "hannah.brisbane@ncdps.gov.sample", "919-664-6238"),
    ],
  },
  {
    id: "cumberland-county",
    name: "Cumberland County, NC — General Services",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: 0,
    whatTheyBuy:
      "County buildings, detention facilities, schools-adjacent roofing & exterior work.",
    buysRoofing: true,
    agencyMatchers: ["Cumberland County"],
    awardMatchers: ["Cumberland"],
    officers: [
      sblo("cum-1", "Vanessa Whitaker", "vwhitaker@cumberlandcountync.gov.sample", "910-678-7775"),
      co("cum-2", "Greg Lassiter", "glassiter@cumberlandcountync.gov.sample", "910-678-7782"),
      spec("cum-3", "Naomi Brock", "nbrock@cumberlandcountync.gov.sample", "910-678-7790"),
    ],
  },
  {
    id: "cumberland-schools",
    name: "Cumberland County Schools",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: 0,
    whatTheyBuy:
      "School re-roofing programs (frequently multi-school packages), repair & maintenance.",
    buysRoofing: true,
    agencyMatchers: ["Cumberland County Schools"],
    awardMatchers: ["Cumberland.*Schools"],
    officers: [
      sblo("ccs-1", "Marquis Rivera", "marquis.rivera@ccs.k12.nc.us.sample", "910-678-2300"),
      facpoc("ccs-2", "Linda Hollifield", "linda.hollifield@ccs.k12.nc.us.sample", "910-678-2455", "Director of Maintenance — walks every roofing scope."),
      co("ccs-3", "Greg Underwood", "greg.underwood@ccs.k12.nc.us.sample", "910-678-2367"),
    ],
  },
  {
    id: "city-fayetteville",
    name: "City of Fayetteville — Purchasing",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: 0,
    whatTheyBuy:
      "City facilities, fire stations, public works buildings. Small re-roofs and exterior repair.",
    buysRoofing: true,
    agencyMatchers: ["City of Fayetteville"],
    awardMatchers: ["Fayetteville"],
    officers: [
      sblo("fay-1", "Tamika Holloway", "tholloway@fayettevillenc.gov.sample", "910-433-1990"),
      co("fay-2", "Sean Maguire", "smaguire@fayettevillenc.gov.sample", "910-433-1822"),
      spec("fay-3", "Pedro Castillo", "pcastillo@fayettevillenc.gov.sample", "910-433-1817"),
    ],
  },
  {
    id: "nc-state-construction",
    name: "NC State Construction Office",
    type: "sled",
    location: "Raleigh, NC",
    distanceMiles: 60,
    whatTheyBuy:
      "State-owned facility roofing & envelope across NC agencies and universities.",
    buysRoofing: true,
    agencyMatchers: ["State Construction Office", "NC SCO", "NC Department of Administration"],
    awardMatchers: ["Raleigh", "State Construction"],
    officers: [
      sblo("sco-1", "DeShawn Pittman", "deshawn.pittman@doa.nc.gov.sample", "919-807-4100"),
      co("sco-2", "Margaret Olufemi", "margaret.olufemi@doa.nc.gov.sample", "919-807-4117"),
      spec("sco-3", "Bryce Tillery", "bryce.tillery@doa.nc.gov.sample", "919-807-4129"),
    ],
  },
  {
    id: "robeson-schools",
    name: "Robeson County Schools",
    type: "sled",
    location: "Lumberton, NC",
    distanceMiles: 42,
    whatTheyBuy:
      "School roof replacement and weatherproofing; standing-seam metal common.",
    buysRoofing: true,
    agencyMatchers: ["Robeson County Schools"],
    awardMatchers: ["Robeson"],
    officers: [
      sblo("rob-1", "Cheryl Locklear", "cheryl.locklear@robeson.k12.nc.us.sample", "910-738-4841"),
      co("rob-2", "Anthony Strickland", "anthony.strickland@robeson.k12.nc.us.sample", "910-738-4867"),
    ],
  },
];

// ───────────────────────── verdict-led analysis ─────────────────────────
// Seeded for the NC-relevant buyers Marcus actually pursues. Other buyers
// fall back to a derived light verdict (see `deriveLightAnalysis`).

const CURRENT_YEAR = new Date().getFullYear();
const y = (offset: number) => CURRENT_YEAR - offset;

const ANALYSIS_SEED: Record<string, BuyerAnalysis> = {
  "usace-wilmington": {
    verdict: "worth-it",
    why: "They spend ~$4M+/yr on roofing at Bragg/Pope, hit their 23% SDVOSB goal, and most awards land Mar–Aug — that's your window.",
    annualSpendByYear: [
      { year: y(2), trade: 3_800_000 },
      { year: y(1), trade: 4_200_000 },
      { year: y(0), trade: 5_100_000 },
    ],
    smallBizPct: 41,
    sdvosbPct: 23,
    seasonalityNote: "Most active Mar–Aug — start outreach now.",
    spendBreakdown: [
      { category: "Roofing & envelope", byYear: [
        { year: y(2), amount: 2_400_000 },
        { year: y(1), amount: 2_800_000 },
        { year: y(0), amount: 3_400_000 },
      ] },
      { category: "General construction", byYear: [
        { year: y(2), amount: 1_100_000 },
        { year: y(1), amount: 1_050_000 },
        { year: y(0), amount: 1_300_000 },
      ] },
      { category: "Other facilities", byYear: [
        { year: y(2), amount: 300_000 },
        { year: y(1), amount: 350_000 },
        { year: y(0), amount: 400_000 },
      ] },
    ],
    topAwardees: [
      { company: "Bordeaux Construction", awardsCount: 4, totalDollars: 42_000_000 },
      { company: "Hensel Phelps", awardsCount: 3, totalDollars: 48_000_000 },
      { company: "M.A. Mortenson", awardsCount: 2, totalDollars: 35_000_000 },
      { company: "Sterling Roofing", awardsCount: 2, totalDollars: 5_900_000 },
      { company: "T.A. Loving Co.", awardsCount: 2, totalDollars: 6_400_000 },
    ],
  },
  "bragg-dpw": {
    verdict: "worth-it",
    why: "Right next door, steady $2–3M/yr in small-roof work, and the liaison actually answers the phone.",
    annualSpendByYear: [
      { year: y(2), trade: 2_100_000 },
      { year: y(1), trade: 2_600_000 },
      { year: y(0), trade: 2_900_000 },
    ],
    smallBizPct: 48,
    sdvosbPct: 27,
    seasonalityNote: "Steady year-round; small task orders monthly.",
    spendBreakdown: [
      { category: "Roofing", byYear: [
        { year: y(2), amount: 1_300_000 },
        { year: y(1), amount: 1_650_000 },
        { year: y(0), amount: 1_900_000 },
      ] },
      { category: "Envelope & weatherproofing", byYear: [
        { year: y(2), amount: 500_000 },
        { year: y(1), amount: 600_000 },
        { year: y(0), amount: 650_000 },
      ] },
      { category: "Other facilities", byYear: [
        { year: y(2), amount: 300_000 },
        { year: y(1), amount: 350_000 },
        { year: y(0), amount: 350_000 },
      ] },
    ],
    topAwardees: [
      { company: "Cumberland Roofing", awardsCount: 5, totalDollars: 2_300_000 },
      { company: "Sandhills Roofing", awardsCount: 3, totalDollars: 1_800_000 },
      { company: "T.A. Loving Co.", awardsCount: 2, totalDollars: 1_200_000 },
    ],
  },
  "va-fayetteville": {
    verdict: "worth-it",
    why: "VA mandates SDVOSB preference — your SAM/VA paperwork puts you near the front of a short line.",
    annualSpendByYear: [
      { year: y(2), trade: 1_400_000 },
      { year: y(1), trade: 1_700_000 },
      { year: y(0), trade: 1_900_000 },
    ],
    smallBizPct: 62,
    sdvosbPct: 38,
    seasonalityNote: "Federal fiscal year-end push Jul–Sep — be ready.",
    spendBreakdown: [
      { category: "Roofing", byYear: [
        { year: y(2), amount: 900_000 },
        { year: y(1), amount: 1_100_000 },
        { year: y(0), amount: 1_250_000 },
      ] },
      { category: "Building envelope", byYear: [
        { year: y(2), amount: 350_000 },
        { year: y(1), amount: 400_000 },
        { year: y(0), amount: 450_000 },
      ] },
      { category: "Small construction", byYear: [
        { year: y(2), amount: 150_000 },
        { year: y(1), amount: 200_000 },
        { year: y(0), amount: 200_000 },
      ] },
    ],
    topAwardees: [
      { company: "Williams Construction LLC (you)", awardsCount: 1, totalDollars: 280_000 },
      { company: "Cape Fear Roofing Co.", awardsCount: 2, totalDollars: 540_000 },
      { company: "Roof Solutions of NC", awardsCount: 2, totalDollars: 720_000 },
    ],
  },
  "navfac-lejeune": {
    verdict: "maybe",
    why: "Big dollars but the bench is locked up by Sterling and Clark — your shot is as a sub, not a prime.",
    annualSpendByYear: [
      { year: y(2), trade: 6_400_000 },
      { year: y(1), trade: 7_100_000 },
      { year: y(0), trade: 6_800_000 },
    ],
    smallBizPct: 28,
    sdvosbPct: 14,
    seasonalityNote: "Active spring/summer; family-housing work spikes Apr–Jul.",
    spendBreakdown: [
      { category: "Roofing & envelope", byYear: [
        { year: y(2), amount: 3_900_000 },
        { year: y(1), amount: 4_400_000 },
        { year: y(0), amount: 4_100_000 },
      ] },
      { category: "Housing modernization", byYear: [
        { year: y(2), amount: 1_800_000 },
        { year: y(1), amount: 1_900_000 },
        { year: y(0), amount: 1_900_000 },
      ] },
      { category: "Other facilities", byYear: [
        { year: y(2), amount: 700_000 },
        { year: y(1), amount: 800_000 },
        { year: y(0), amount: 800_000 },
      ] },
    ],
    topAwardees: [
      { company: "Sterling Roofing", awardsCount: 3, totalDollars: 9_400_000 },
      { company: "Clark Construction", awardsCount: 2, totalDollars: 22_000_000 },
      { company: "Whiting-Turner", awardsCount: 2, totalDollars: 18_000_000 },
    ],
  },
  "cumberland-schools": {
    verdict: "maybe",
    why: "Local and SDVOSB-friendly, but most roofs go to one incumbent on a 5-yr program — chase the recompete.",
    annualSpendByYear: [
      { year: y(2), trade: 900_000 },
      { year: y(1), trade: 1_100_000 },
      { year: y(0), trade: 1_000_000 },
    ],
    smallBizPct: 71,
    sdvosbPct: 18,
    seasonalityNote: "Summer-only work (Jun–Aug) when schools are out.",
    spendBreakdown: [
      { category: "School re-roofing", byYear: [
        { year: y(2), amount: 700_000 },
        { year: y(1), amount: 850_000 },
        { year: y(0), amount: 800_000 },
      ] },
      { category: "Repair & maintenance", byYear: [
        { year: y(2), amount: 200_000 },
        { year: y(1), amount: 250_000 },
        { year: y(0), amount: 200_000 },
      ] },
    ],
    topAwardees: [
      { company: "Roof Solutions of NC", awardsCount: 4, totalDollars: 4_800_000 },
      { company: "Cumberland Roofing", awardsCount: 1, totalDollars: 280_000 },
    ],
  },
  "gsa-r4": {
    verdict: "not-yet",
    why: "Regional spend is real, but you need GSA MAS first — without it you're not in the door.",
    annualSpendByYear: [
      { year: y(2), trade: 5_200_000 },
      { year: y(1), trade: 4_900_000 },
      { year: y(0), trade: 5_400_000 },
    ],
    smallBizPct: 35,
    sdvosbPct: 11,
    seasonalityNote: "Year-round; Q4 fiscal push Jul–Sep.",
    spendBreakdown: [
      { category: "Federal building re-roofing", byYear: [
        { year: y(2), amount: 3_200_000 },
        { year: y(1), amount: 3_100_000 },
        { year: y(0), amount: 3_400_000 },
      ] },
      { category: "Envelope repair", byYear: [
        { year: y(2), amount: 1_400_000 },
        { year: y(1), amount: 1_300_000 },
        { year: y(0), amount: 1_400_000 },
      ] },
      { category: "Other facilities", byYear: [
        { year: y(2), amount: 600_000 },
        { year: y(1), amount: 500_000 },
        { year: y(0), amount: 600_000 },
      ] },
    ],
    topAwardees: [
      { company: "Archer Western", awardsCount: 3, totalDollars: 8_900_000 },
      { company: "Bordeaux Construction", awardsCount: 1, totalDollars: 4_200_000 },
    ],
  },
};

for (const b of GOV_BUYERS) {
  if (ANALYSIS_SEED[b.id]) b.analysis = ANALYSIS_SEED[b.id];
}

export const VERDICT_LABEL: Record<PursueVerdict, string> = {
  "worth-it": "Worth it",
  maybe: "Maybe",
  "not-yet": "Not yet",
};

export function getBuyer(id: string): GovBuyer | undefined {
  return GOV_BUYERS.find((b) => b.id === id);
}

