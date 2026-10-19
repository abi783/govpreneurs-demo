// THE AGENCY's buyer directory for Government Buyers: offices that buy advertising
// and marketing near Lantern Row Creative's studio in Fayetteville, NC (read through
// src/demo/explore/buyersData.ts, which picks the active member).
//
// The offices are real, and so is what they buy (sources below). The people are
// made up, and their addresses end in ".example". Where an opportunity page already
// names a buyer's contracting staff (Grant's contacts, src/demo/grant/facts.ts), the
// same people are read from there, so both pages name the same person.
//
// Spend figures are real: federal obligations for NAICS 541810, 541613, 541430,
// 512110, 541820 and 541890, fiscal years 2023 to 2025, from USAspending (pulled
// 19 Oct 2026; office matched by its award-id prefix, so treat them as close, not
// exact). One story fact is added: Dana's own NC Guard award ($86,400, FY2025, to a
// woman-owned firm). Offices with no trustworthy baseline (MICC Fort Bragg, whose ad
// buys are mostly by card; the VA's national office, which is one campaign; state and
// local buyers) carry no spend analysis, and the page says so.
//
// Sources:
//   USAspending search API            https://api.usaspending.gov/api/v2/search/spending_over_time/
//   Fort Bragg print and digital, 2019 https://www.usaspending.gov/award/CONT_AWD_W9124719P1860_9700_-NONE-_-NONE-
//   Fort Bragg school-age ads, 2018    https://www.usaspending.gov/award/CONT_AWD_W9124718P0099_9700_-NONE-_-NONE-
//   Fort Bragg ACS cable TV ads, WOSB set-aside, 2018  https://sam.gov/opp/12c34720dcc541dd7aeff59b642be4fc/view
//   More Powerful NC, $2.5M of TV, radio and billboards  https://www.wfdd.org/2019-04-04/north-carolina-launches-campaign-to-combat-opioid-crisis
//   Governor's Highway Safety Program grants, Oct 2025   https://governor.nc.gov/news/press-releases/2025/10/23/governor-stein-announces-more-25-million-grants-promote-safer-roads
//   VA Veterans First (veteran-owned firms first)        https://www.law.cornell.edu/uscode/text/38/8127

import { contactFor } from "../../../grant/facts";
import { getOpportunity } from "../../../story/opportunities";
import { PLACES } from "../../../story/places";
import { allAwardRecords } from "../../../explore/awardsData";
import type { BuyerAnalysis, BuyerOfficer, GovBuyer, OfficerRole, PursueVerdict } from "@/lib/mock/governmentBuyers";
import { HERO_IDS } from "../opportunities";
import { MEMBER_FIRM } from "./firms";

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
const spec = person("Contract Specialist", false);
const pm = person("Program Manager", false);

/**
 * A contact that an opportunity page already names (Grant's contacts), so the two
 * pages agree. `secondary` picks the opportunity's second contact.
 */
function staffOf(id: string, oppId: string, secondary: boolean, notes?: string): BuyerOfficer {
  const c = contactFor(getOpportunity(oppId)!, secondary);
  return { id, name: c.name, role: c.title as OfficerRole, email: c.email, phone: c.phone, notes };
}

/** Three fiscal years of spend, one category per row (shares of each year). */
function spend(byYear: [number, number][], cats: [string, number][]) {
  return {
    annualSpendByYear: byYear.map(([year, trade]) => ({ year, trade })),
    spendBreakdown: cats.map(([category, share]) => ({
      category,
      byYear: byYear.map(([year, total]) => ({ year, amount: Math.round((total * share) / 1000) * 1000 })),
    })),
  };
}

/** The firms that won most from these buyers, counted from the award record. */
function awardeesFrom(abbrevs: readonly string[]): BuyerAnalysis["topAwardees"] {
  const by = new Map<string, { count: number; total: number }>();
  for (const a of allAwardRecords()) {
    if (!abbrevs.includes(a.agency.abbrev ?? "")) continue;
    if (a.winner.awardeeKey === MEMBER_FIRM.key) continue; // Dana herself
    const row = by.get(a.winner.name) ?? { count: 0, total: 0 };
    row.count += 1;
    row.total += a.obligated ?? 0;
    by.set(a.winner.name, row);
  }
  return [...by.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4)
    .map(([company, v]) => ({ company, awardsCount: v.count, totalDollars: v.total }));
}

function analysis(
  verdict: PursueVerdict,
  why: string,
  s: ReturnType<typeof spend>,
  smallBizPct: number,
  wosbPct: number,
  seasonalityNote: string,
  topAwardees: BuyerAnalysis["topAwardees"],
): BuyerAnalysis {
  return { verdict, why, ...s, smallBizPct, wosbPct, seasonalityNote, topAwardees };
}

// USPFO NC: $384,144 / $286,662 / $173,192 in FY2023–FY2025, all to small businesses,
// none to woman-owned firms; plus Dana's $86,400 in FY2025. Woman-owned share:
// 86,400 / 930,398 = 9%.
const NCNG_SPEND: [number, number][] = [[2023, 384_144], [2024, 286_662], [2025, 259_592]];
// VA NCO 6: $103,049 / $5,998 / $79,271; small businesses $168,318 of $188,318 (89%); woman-owned 0%.
const NCO6_SPEND: [number, number][] = [[2023, 103_049], [2024, 5_998], [2025, 79_271]];
// MARSOC: $580,475 / $398,876 / $534,364; small businesses $437,091 of $1,513,715 (29%);
// woman-owned $41,844 (3%).
const MARSOC_SPEND: [number, number][] = [[2023, 580_475], [2024, 398_876], [2025, 534_364]];

export const BUYERS: GovBuyer[] = [
  {
    id: "bragg-micc",
    agencyKey: 5101,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Advertising for Army Community Service and other family programs at Fort Bragg: print and digital ads, cable and streaming spots, and short videos. Its last large ad contracts were print and digital ads in 2019 (about $357K) and school-age program ads in 2018 (about $130K). It has set ad work aside for woman-owned firms before.",
    buysFood: true,
    agencyMatchers: ["Mission and Installation Contracting Command"],
    awardAgencies: ["MICC Fort Bragg"],
    officers: [
      sblo("bragg-1", "Rochelle Banerjee", "r.banerjee@army.mil.example", "910-555-0311", "Sends small businesses to the right contracting officer."),
      staffOf("bragg-2", HERO_IDS.hero, false, "Named on the Family Advocacy print and digital quote."),
      staffOf("bragg-3", HERO_IDS.hero, true),
      pm("bragg-4", "Yvette Calloway", "y.calloway@army.mil.example", "910-555-0314", "Runs the Family Advocacy Program and tells the office what the campaign must do."),
    ],
  },
  {
    id: "uspfo-nc",
    agencyKey: 5102,
    name: "NC Army National Guard (USPFO for North Carolina)",
    abbreviation: "USPFO NC",
    type: "federal",
    location: "Raleigh, NC",
    distanceMiles: PLACES.raleigh.milesFromBase,
    whatTheyBuy:
      "Recruiting ads for the NC Army National Guard: video ads on screens in DMV offices, sports sponsorships, digital and social campaigns, plus its recruiting website and design support. Most buys are small quotes set aside for small businesses.",
    buysFood: true,
    agencyMatchers: ["USPFO for North Carolina"],
    awardAgencies: ["USPFO NC"],
    officers: [
      sblo("ncng-1", "Darnell Whitcomb", "d.whitcomb@army.mil.example", "919-555-0321", "Small business liaison for the Guard's contracting office."),
      co("ncng-2", "Maj. Lucinda Farrow", "l.farrow@army.mil.example", "919-555-0322", "Handles the Guard's recruiting and advertising buys."),
      pm("ncng-3", "SFC Raymond Tolliver", "r.tolliver@army.mil.example", "919-555-0323", "Runs marketing for the Recruiting and Retention Battalion."),
    ],
    analysis: analysis(
      "worth-it",
      "You already delivered for them, they buy ads every year, and every dollar of the last three years went to small businesses. Ask for your interim rating first.",
      spend(NCNG_SPEND, [["Recruiting ads, websites and design", 1]]),
      100,
      9,
      "Most awards land in August and September, at the end of the federal fiscal year.",
      awardeesFrom(["USPFO NC"]),
    ),
  },
  {
    id: "va-pcac",
    agencyKey: 5103,
    name: "VA Program Contracting Activity Central (PCAC)",
    abbreviation: "VA PCAC",
    type: "federal",
    location: "Independence, OH (buys for the VA nationwide)",
    distanceMiles: 560,
    whatTheyBuy:
      "The VA's national marketing, above all the campaign that recruits doctors, nurses and staff for VA hospitals: about $25M over the last three fiscal years. The current campaign is set aside for service-disabled veteran-owned firms.",
    buysFood: true,
    agencyMatchers: ["Program Contracting Activity Central"],
    awardAgencies: ["VA PCAC"],
    officers: [
      sblo("pcac-1", "Bernard Esterline", "b.esterline@va.gov.example", "216-555-0331", "Small business specialist for national VA contracts."),
      staffOf("pcac-2", HERO_IDS.teamUp, false, "Named on the hiring campaign's sources sought."),
      staffOf("pcac-3", HERO_IDS.teamUp, true),
    ],
  },
  {
    id: "va-nco6",
    agencyKey: 5104,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (serves the Fayetteville VA Medical Center)",
    distanceMiles: PLACES.durham.milesFromBase,
    whatTheyBuy:
      "Small marketing buys for VA hospitals in North Carolina and Virginia, including Durham and Fayetteville: printed and digital pieces for public-affairs campaigns, patient-education video and podcasts. VA rules give veteran-owned firms first claim when two of them can bid.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: ["VA NCO 6"],
    officers: [
      sblo("nco6-1", "Gwendolyn Pacheco", "g.pacheco@va.gov.example", "919-555-0341", "Small business specialist for the network."),
      co("nco6-2", "Arturo Lindell", "a.lindell@va.gov.example", "919-555-0342", "Public affairs and patient-education buys."),
      pm("nco6-3", "Nia Holloway", "n.holloway@va.gov.example", "910-555-0343", "Public affairs officer, Fayetteville VA Coastal Health Care System."),
    ],
    analysis: analysis(
      "maybe",
      "The VA is one of your target buyers, but this office buys little marketing, and veteran-owned firms come first. Its newest video work went to one firm without a competition. Get known here before the next buy.",
      spend(NCO6_SPEND, [["Promotion, printing and video", 1]]),
      89,
      0,
      "Most of its awards land in August and September.",
      awardeesFrom(["VA NCO 6"]),
    ),
  },
  {
    id: "marsoc",
    agencyKey: 5105,
    name: "Marine Forces Special Operations Command (MARSOC)",
    abbreviation: "MARSOC",
    type: "federal",
    location: "Camp Lejeune, NC",
    distanceMiles: PLACES.jacksonville.milesFromBase,
    whatTheyBuy:
      "The busiest federal ad buyer in North Carolina's award record: airport, billboard and magazine ads bought from the media owners, plus geofenced recruiting campaigns, feature articles and video shoots.",
    buysFood: true,
    agencyMatchers: ["MARSOC", "Marine Forces Special Operations"],
    awardAgencies: ["MARSOC"],
    officers: [
      sblo("marsoc-1", "Celeste Varga", "c.varga@socom.mil.example", "910-555-0351"),
      co("marsoc-2", "Capt. Owen Brandauer", "o.brandauer@socom.mil.example", "910-555-0352", "Signs the recruiting and advertising awards."),
      pm("marsoc-3", "MSgt Dale Kinnear", "d.kinnear@socom.mil.example", "910-555-0353", "Runs recruiting marketing for the command."),
    ],
    analysis: analysis(
      "maybe",
      "It buys the most advertising of any federal office in the state, but most of the money buys ad space straight from airports and billboard owners. The campaign and video work is small-business sized. Camp Lejeune is about 100 miles from your office.",
      spend(MARSOC_SPEND, [["Recruiting and advertising", 1]]),
      29,
      3,
      "Awards come all year. Airport and billboard space often renews in the summer.",
      awardeesFrom(["MARSOC"]),
    ),
  },
  {
    id: "bragg-mwr",
    agencyKey: 5106,
    name: "Fort Bragg Family and MWR",
    abbreviation: "Fort Bragg MWR",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromBase,
    whatTheyBuy:
      "Posters, social graphics, event promotion and short videos for Fort Bragg's recreation and family programs. It buys with non-appropriated funds, so its contracts do not appear in the federal award record.",
    buysFood: true,
    agencyMatchers: ["Family and MWR"],
    awardAgencies: [],
    officers: [
      sblo("mwr-1", "Tobias Maddox", "t.maddox@army.mil.example", "910-555-0361", "Points vendors to the non-appropriated fund contracting office."),
      co("mwr-2", "Lorna Feeney", "l.feeney@army.mil.example", "910-555-0362", "NAF contracting officer."),
      pm("mwr-3", "Holly Strickland", "h.strickland@army.mil.example", "910-555-0363", "Marketing director for Family and MWR."),
    ],
  },
  {
    id: "ncdhhs",
    agencyKey: 5107,
    name: "NC Department of Health and Human Services",
    abbreviation: "NCDHHS",
    type: "sled",
    location: "Raleigh, NC",
    distanceMiles: PLACES.raleigh.milesFromBase,
    whatTheyBuy:
      "Statewide public-health and social-services campaigns, such as More Powerful NC, the opioid campaign that launched in 2019 with $2.5 million of TV, radio and billboard ads, and foster-parent recruitment.",
    buysFood: true,
    agencyMatchers: ["Department of Health and Human Services"],
    awardAgencies: [],
    officers: [
      co("dhhs-1", "Imelda Castro", "i.castro@dhhs.nc.gov.example", "919-555-0371", "Purchasing and contracts for the Division of Social Services."),
      pm("dhhs-2", "Quentin Abara", "q.abara@dhhs.nc.gov.example", "919-555-0372", "Communications lead for foster-parent recruitment."),
      sblo("dhhs-3", "Felicia Dorsett", "f.dorsett@dhhs.nc.gov.example", "919-555-0373", "Runs small business outreach for the department."),
    ],
  },
  {
    id: "ncdot-ghsp",
    agencyKey: 5108,
    name: "NCDOT Governor's Highway Safety Program",
    abbreviation: "NCDOT GHSP",
    type: "sled",
    location: "Raleigh, NC",
    distanceMiles: PLACES.raleigh.milesFromBase,
    whatTheyBuy:
      "Paid media for highway-safety enforcement campaigns such as \"Booze It & Lose It\", and a statewide roadside-safety campaign on the Move Over Law in this year's grants.",
    buysFood: true,
    agencyMatchers: ["Department of Transportation"],
    awardAgencies: [],
    officers: [
      sblo("ghsp-1", "Wendell Ibarra", "w.ibarra@ncdot.gov.example", "919-555-0381", "Small business outreach for NCDOT purchasing."),
      co("ghsp-2", "Carmen Holbrook", "c.holbrook@ncdot.gov.example", "919-555-0382", "Signs the paid-media contracts."),
    ],
  },
  {
    id: "fayetteville-city",
    agencyKey: 5109,
    name: "City of Fayetteville",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "Public-education and outreach campaigns for city departments, such as the stormwater campaign you made in 2023 and marketing for FAST, the city's bus system.",
    buysFood: true,
    agencyMatchers: ["City of Fayetteville"],
    awardAgencies: [],
    officers: [
      sblo("fay-1", "Shonda Pettiford", "s.pettiford@fayettevillenc.gov.example", "910-555-0391", "Small and local business outreach. Ask her about the city's vendor list."),
      staffOf("fay-2", "FAY-TR-2027-04", false, "Purchasing. Signs the FAST ridership contract."),
      staffOf("fay-3", "FAY-TR-2027-04", true),
      pm("fay-4", "Victor Almanza", "v.almanza@fayettevillenc.gov.example", "910-555-0394", "Marketing for FAST, the city's bus system."),
    ],
  },
  {
    id: "cumberland-county",
    agencyKey: 5110,
    name: "Cumberland County Government",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy:
      "Public-information campaigns for county departments: public health, emergency services and hurricane preparedness. Proposals are scored, and price counts.",
    buysFood: true,
    agencyMatchers: ["Cumberland County, NC"],
    awardAgencies: [],
    officers: [
      staffOf("cc-1", "CUMCO-PH-2027-03", false, "Purchasing manager. Sent you the hurricane campaign debrief."),
      staffOf("cc-2", "CUMCO-PH-2027-03", true),
      { ...pm("cc-3", "Renata Kowal", "r.kowal@co.cumberland.nc.us.example", "910-555-0403", "Public information director."), recommendedFirstContact: true },
    ],
  },
  {
    id: "cumberland-schools",
    agencyKey: 5111,
    name: "Cumberland County Schools",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Recruiting ads for teachers and bus drivers, and outreach to families about enrollment.",
    buysFood: true,
    agencyMatchers: ["Cumberland County Schools"],
    awardAgencies: [],
    officers: [
      { ...staffOf("ccs-1", "CCS-HR-2027-05", true), recommendedFirstContact: true },
      staffOf("ccs-2", "CCS-HR-2027-05", false),
      pm("ccs-3", "Doreen Applewhite", "d.applewhite@ccs.k12.nc.us.example", "910-555-0413", "Runs teacher recruiting in Human Resources."),
    ],
  },
  {
    id: "ftcc",
    agencyKey: 5112,
    name: "Fayetteville Technical Community College",
    abbreviation: "FTCC",
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: PLACES.fayetteville.milesFromBase,
    whatTheyBuy: "Enrollment marketing: paid social, search and streaming ads, student-story videos and landing pages.",
    buysFood: true,
    agencyMatchers: ["Fayetteville Technical Community College"],
    awardAgencies: [],
    officers: [
      { ...co("ftcc-1", "Marisa Quintero", "m.quintero@faytechcc.edu.example", "910-555-0421", "Purchasing. Runs the enrollment campaign request."), recommendedFirstContact: true },
      pm("ftcc-2", "Lionel Haskett", "l.haskett@faytechcc.edu.example", "910-555-0422", "Marketing director."),
    ],
  },
];
