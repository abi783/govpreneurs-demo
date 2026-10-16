// The sample buyer directory for Government Buyers: food-service buyers near Amira
// Haddad's kitchen in Fayetteville, NC. The offices are real. The people are made up,
// and their addresses end in ".sample" so no one mistakes them for real contacts.
// The spend figures are sample figures, like the contacts.

import { AGENCIES, allAwardRecords } from "./awardsData";
import { anyFirmByKey } from "./firms";
import { PLACES } from "@/demo/story/places";
import type {
  BuyerAnalysis,
  BuyerOfficer,
  GovBuyer,
  OfficerRole,
  PursueVerdict,
} from "@/lib/mock/governmentBuyers";

const CURRENT_YEAR = new Date().getFullYear();
const y = (offset: number) => CURRENT_YEAR - offset;

type Abbrev = (typeof AGENCIES)[keyof typeof AGENCIES]["abbrev"];

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
const fpm = person("Food Program Manager", false);

/** Spend by year and by category, from three yearly totals and the share of each category. */
function spend(trade: [number, number, number], cats: [string, number][]) {
  const years = [y(2), y(1), y(0)];
  return {
    annualSpendByYear: years.map((year, i) => ({ year, trade: trade[i] })),
    spendBreakdown: cats.map(([category, share]) => ({
      category,
      byYear: years.map((year, i) => ({ year, amount: Math.round((trade[i] * share) / 1000) * 1000 })),
    })),
  };
}

/** The firms that won most from these buyers, counted from the award record. */
function awardeesFrom(abbrevs: readonly string[]): BuyerAnalysis["topAwardees"] {
  const by = new Map<string, { count: number; total: number }>();
  for (const a of allAwardRecords()) {
    if (!abbrevs.includes(a.agency.abbrev ?? "")) continue;
    if (a.winner.awardeeKey === 4000) continue; // Amira herself
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

/** Winners for buyers whose awards are not in the federal record (schools, counties). */
function localAwardees(rows: [number, number, number][]): BuyerAnalysis["topAwardees"] {
  return rows.map(([key, count, total]) => ({ company: anyFirmByKey(key)!.name, awardsCount: count, totalDollars: total }));
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

const A = AGENCIES;
const ab = (...k: Abbrev[]) => k as string[];

export const BUYER_SEED: GovBuyer[] = [
  {
    id: "bragg-micc",
    agencyKey: 5001,
    name: "Fort Bragg Contracting Command (MICC)",
    abbreviation: "MICC Fort Bragg",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromKitchen,
    whatTheyBuy:
      "Dining facility operations, field feeding, event catering and mess attendant services for soldiers at Fort Bragg, Pope Army Airfield and Camp Mackall. Many of its awards are set aside for small and woman-owned businesses.",
    buysFood: true,
    agencyMatchers: ["Fort Bragg", "Camp Mackall"],
    awardAgencies: ab(A.braggMicc.abbrev),
    officers: [
      sblo("bragg-1", "Marguerite Albright", "m.albright@army.mil.sample", "910-555-0131", "Sends small businesses to the right contracting officer."),
      co("bragg-2", "Maj. Terrence Hale", "t.hale@army.mil.sample", "910-555-0132", "Signs the dining facility and field feeding awards."),
      co("bragg-3", "Priya Venkataraman", "p.venkataraman@army.mil.sample", "910-555-0133", "Event catering and order-as-needed contracts."),
      spec("bragg-4", "Gregory Lindqvist", "g.lindqvist@army.mil.sample", "910-555-0134"),
      fpm("bragg-5", "SFC Maria Okafor", "m.okafor@army.mil.sample", "910-555-0135", "Oversees the dining facilities and tells the office what the meals must be like."),
    ],
    analysis: analysis(
      "worth-it",
      "Fort Bragg buys about $20M a year in food service, 4 of every 10 dollars go to small business, and you have already worked on this base twice. Start with the liaison.",
      spend([18_400_000, 21_100_000, 22_600_000], [
        ["Dining facility operations", 0.55],
        ["Field feeding", 0.22],
        ["Event catering", 0.12],
        ["Mess attendant services", 0.11],
      ]),
      41,
      8,
      "Most awards land from July to September, when the Army spends the year's money.",
      awardeesFrom(ab(A.braggMicc.abbrev)),
    ),
  },
  {
    id: "womack",
    agencyKey: 5002,
    name: "Womack Army Medical Center",
    abbreviation: "Womack AMC",
    type: "federal",
    location: "Fort Bragg, NC",
    distanceMiles: PLACES.fortBragg.milesFromKitchen,
    whatTheyBuy:
      "Patient meals, therapeutic diets and kitchen support for the hospital on Fort Bragg.",
    buysFood: true,
    agencyMatchers: ["Womack"],
    awardAgencies: ab(A.womack.abbrev),
    officers: [
      sblo("wom-1", "Denise Tran", "d.tran@army.mil.sample", "910-555-0141", "Small business advocate for the medical center's contracts."),
      co("wom-2", "Capt. Dwayne Ellison", "d.ellison@army.mil.sample", "910-555-0142", "Signed your 2024 patient meal job. Ask this office for a performance rating."),
      spec("wom-3", "Harold Beckett", "h.beckett@army.mil.sample", "910-555-0143"),
      fpm("wom-4", "Lt. Col. Alicia Brandt", "a.brandt@army.mil.sample", "910-555-0144", "Runs nutrition care. She knows your trays."),
    ],
    analysis: analysis(
      "worth-it",
      "You already delivered here. A performance rating from this office is the proof the VA and other hospitals ask for.",
      spend([1_100_000, 1_300_000, 1_500_000], [
        ["Patient meals and therapeutic diets", 0.7],
        ["Kitchen support during refits", 0.2],
        ["Staff cafe and events", 0.1],
      ]),
      38,
      12,
      "Awards are spread across the year. Kitchen refits create short, urgent jobs.",
      awardeesFrom(ab(A.womack.abbrev)),
    ),
  },
  {
    id: "pope-aaf",
    agencyKey: 5003,
    name: "Pope Army Airfield (43rd Air Mobility Operations Group)",
    abbreviation: "Pope AAF",
    type: "federal",
    location: "Pope Army Airfield, NC",
    distanceMiles: PLACES.popeAaf.milesFromKitchen,
    whatTheyBuy:
      "Ceremonies, official functions and unit events with catering for 50 to 600 guests. Often set aside for woman-owned firms.",
    buysFood: true,
    agencyMatchers: ["43rd Air Mobility", "Pope Army"],
    awardAgencies: ab(A.pope.abbrev),
    officers: [
      sblo("pope-1", "Ronda Pierce", "r.pierce@af.mil.sample", "910-555-0151"),
      co("pope-2", "Maj. Elena Kowalski", "e.kowalski@af.mil.sample", "910-555-0152", "Signs the event catering awards."),
      spec("pope-3", "SSgt. Terrell Jacobs", "t.jacobs@af.mil.sample", "910-555-0153"),
    ],
    analysis: analysis(
      "worth-it",
      "Event catering is your strongest work, the awards are small enough for your kitchen, and the next ceremony catering job is set aside for woman-owned firms.",
      spend([380_000, 420_000, 510_000], [
        ["Ceremony and official function catering", 0.65],
        ["Unit events and holidays", 0.35],
      ]),
      55,
      24,
      "Events peak in spring and around the holidays. Quotes usually give 2 to 3 weeks.",
      awardeesFrom(ab(A.pope.abbrev)),
    ),
  },
  {
    id: "va-nco6",
    agencyKey: 5004,
    name: "VA Network Contracting Office 6",
    abbreviation: "VA NCO 6",
    type: "federal",
    location: "Durham, NC (serves the Fayetteville VA Medical Center)",
    distanceMiles: PLACES.durham.milesFromKitchen,
    whatTheyBuy:
      "Patient meals, hospital kitchen support and retail dining at VA medical centers in North Carolina and Virginia.",
    buysFood: true,
    agencyMatchers: ["Network Contracting Office 6"],
    awardAgencies: ab(A.vaNco6.abbrev),
    officers: [
      sblo("va-1", "Monique Fairbanks", "m.fairbanks@va.gov.sample", "919-555-0161", "Small business specialist for the network."),
      co("va-2", "Walter Nakamura", "w.nakamura@va.gov.sample", "919-555-0162"),
      co("va-3", "Lorraine Dubois", "l.dubois@va.gov.sample", "919-555-0163", "Patient meal and dietary contracts."),
      spec("va-4", "Kevin Adeyemi", "k.adeyemi@va.gov.sample", "919-555-0164"),
      fpm("va-5", "Dr. Samantha Rowe", "s.rowe@va.gov.sample", "910-555-0165", "Chief of nutrition and food service, Fayetteville VA Medical Center."),
    ],
    analysis: analysis(
      "worth-it",
      "The VA is one of your three target buyers, it buys patient meals, and your Womack job shows you can run therapeutic diets. Ask for a performance rating first.",
      spend([6_800_000, 7_400_000, 8_100_000], [
        ["Patient meals and dietary support", 0.6],
        ["Retail dining and cafes", 0.25],
        ["Catering and events", 0.15],
      ]),
      44,
      9,
      "Awards come all year. The VA often renews in October and April.",
      awardeesFrom(ab(A.vaNco6.abbrev)),
    ),
  },
  {
    id: "cumberland-county",
    agencyKey: 5005,
    name: "Cumberland County Government",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: 3,
    whatTheyBuy:
      "Detention center meals, senior nutrition and catering for county departments. Sealed bids go to the lowest price from a qualified bidder.",
    buysFood: true,
    agencyMatchers: ["Cumberland County, NC"],
    awardAgencies: [],
    officers: [
      sblo("cc-1", "Anita Rivers", "a.rivers@co.cumberland.nc.us.sample", "910-555-0171", "Runs small business outreach for purchasing."),
      co("cc-2", "Calvin Moore", "c.moore@co.cumberland.nc.us.sample", "910-555-0172", "Purchasing manager. Signs sealed-bid awards."),
      spec("cc-3", "Joy Mathis", "j.mathis@co.cumberland.nc.us.sample", "910-555-0173"),
      fpm("cc-4", "Capt. Roberto Salinas", "r.salinas@co.cumberland.nc.us.sample", "910-555-0174", "Detention center food service."),
    ],
    analysis: analysis(
      "worth-it",
      "You fed this county's children in the schools program, and a sealed bid is decided on price, not on writing. Get every cook food-handler certified before you bid.",
      spend([1_700_000, 1_900_000, 2_100_000], [
        ["Detention center meals", 0.6],
        ["Senior nutrition", 0.25],
        ["Department catering", 0.15],
      ]),
      47,
      11,
      "Bids open in spring and fall, after the county sets its budget.",
      localAwardees([[4010, 3, 1_240_000], [4006, 1, 410_000], [4004, 1, 380_000]]),
    ),
  },
  {
    id: "cumberland-schools",
    agencyKey: 5006,
    name: "Cumberland County Schools",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: 3,
    whatTheyBuy:
      "School breakfast and lunch, summer meal sites and meals for school events. USDA meal-pattern menus and allergen labels are required.",
    buysFood: true,
    agencyMatchers: ["Cumberland County Schools"],
    awardAgencies: [],
    officers: [
      sblo("ccs-1", "Tamika Bell", "t.bell@ccs.k12.nc.us.sample", "910-555-0181", "Outreach for small and local vendors."),
      co("ccs-2", "Gordon Yates", "g.yates@ccs.k12.nc.us.sample", "910-555-0182", "Purchasing director."),
      fpm("ccs-3", "Janet Reyes", "j.reyes@ccs.k12.nc.us.sample", "910-555-0183", "Child Nutrition Director. Your reference from the 2023 summer meals job."),
    ],
    analysis: analysis(
      "worth-it",
      "You cooked 1,100 meals a day here in 2023, and the person who runs the program is your reference. This is your best local buyer.",
      spend([5_200_000, 5_600_000, 6_100_000], [
        ["School meal service", 0.7],
        ["Summer meal sites", 0.2],
        ["Event catering", 0.1],
      ]),
      36,
      10,
      "Summer meals go to bid in the spring. School year contracts go to bid in the winter.",
      localAwardees([[4104, 2, 1_900_000], [4010, 2, 780_000]]),
    ),
  },
  {
    id: "fayetteville-city",
    agencyKey: 5007,
    name: "City of Fayetteville",
    abbreviation: null,
    type: "sled",
    location: "Fayetteville, NC",
    distanceMiles: 3,
    whatTheyBuy:
      "Staff cafes, event catering and meals for city programs, including the Public Works Commission.",
    buysFood: true,
    agencyMatchers: ["City of Fayetteville"],
    awardAgencies: [],
    officers: [
      sblo("fay-1", "Lena Hargrove", "l.hargrove@fayettevillenc.gov.sample", "910-555-0191", "Local business program."),
      co("fay-2", "Dominic Reyes", "d.reyes@fayettevillenc.gov.sample", "910-555-0192"),
      spec("fay-3", "Ayesha Khan", "a.khan@fayettevillenc.gov.sample", "910-555-0193"),
    ],
    analysis: analysis(
      "maybe",
      "Small jobs, close to home, scored on approach. Good for your event menus. The amounts are small, so treat it as a steady side business.",
      spend([420_000, 380_000, 450_000], [
        ["Staff cafe service", 0.5],
        ["Event catering", 0.5],
      ]),
      52,
      14,
      "Requests come out in the fall for the next budget year.",
      localAwardees([[4006, 1, 190_000]]),
    ),
  },
  {
    id: "ncng",
    agencyKey: 5008,
    name: "North Carolina National Guard",
    abbreviation: "NCNG",
    type: "sled",
    location: "Raleigh, NC (armory in Hope Mills)",
    distanceMiles: 65,
    whatTheyBuy:
      "Drill weekend meals at armories, training center dining and unit events across the state.",
    buysFood: true,
    agencyMatchers: ["North Carolina National Guard"],
    awardAgencies: ab(A.ncng.abbrev),
    officers: [
      sblo("ng-1", "Sgt. Maj. Curtis Lowe", "c.lowe@ng.army.mil.sample", "919-555-0201"),
      co("ng-2", "Beth Anne Parrish", "b.parrish@ng.army.mil.sample", "919-555-0202", "State purchasing, Joint Force Headquarters."),
      fpm("ng-3", "CW3 Raymond Ortega", "r.ortega@ng.army.mil.sample", "910-555-0203", "Armory food program, Hope Mills."),
    ],
    analysis: analysis(
      "maybe",
      "The Hope Mills drill meals are close and small, and the current request is open now. The pay is low per meal, so price it carefully.",
      spend([1_300_000, 1_450_000, 1_600_000], [
        ["Drill weekend meals", 0.6],
        ["Training center dining", 0.3],
        ["Unit events", 0.1],
      ]),
      58,
      9,
      "Drill weekends repeat monthly. New contracts start in October.",
      awardeesFrom(ab(A.ncng.abbrev)),
    ),
  },
  {
    id: "navfac-lejeune",
    agencyKey: 5009,
    name: "NAVFAC Mid-Atlantic: Camp Lejeune and New River",
    abbreviation: "NAVFAC Lejeune",
    type: "federal",
    location: "Jacksonville, NC",
    distanceMiles: 100,
    whatTheyBuy:
      "Mess attendant services, galley support and dining halls at Marine Corps Base Camp Lejeune and MCAS New River.",
    buysFood: true,
    agencyMatchers: ["Camp Lejeune", "New River"],
    awardAgencies: ab(A.lejeune.abbrev, A.newRiver.abbrev),
    officers: [
      sblo("lej-1", "Yvette Hammond", "y.hammond@navy.mil.sample", "910-555-0211", "Mid-Atlantic small business deputy."),
      co("lej-2", "LCDR Nathan Brooks", "n.brooks@navy.mil.sample", "910-555-0212"),
      co("lej-3", "Colleen Pruitt", "c.pruitt@navy.mil.sample", "910-555-0213", "Mess attendant contracts."),
      spec("lej-4", "Isaiah Greer", "i.greer@navy.mil.sample", "910-555-0214"),
      fpm("lej-5", "MSgt. Omar Castillo", "o.castillo@usmc.mil.sample", "910-555-0215", "Oversees the dining halls."),
    ],
    analysis: analysis(
      "maybe",
      "Lots of food service work, but the base is 100 miles from your kitchen. Mess attendant jobs are small and staff-heavy. Look at teaming with a firm that is already there.",
      spend([7_900_000, 8_600_000, 9_300_000], [
        ["Dining hall operations", 0.5],
        ["Mess attendant services", 0.35],
        ["Galley support", 0.15],
      ]),
      33,
      6,
      "Awards cluster from April to September.",
      awardeesFrom(ab(A.lejeune.abbrev, A.newRiver.abbrev)),
    ),
  },
  {
    id: "seymour-johnson",
    agencyKey: 5010,
    name: "Seymour Johnson AFB: 4th Contracting Squadron",
    abbreviation: "4th CONS",
    type: "federal",
    location: "Goldsboro, NC",
    distanceMiles: 75,
    whatTheyBuy:
      "Dining facility service, lodging breakfast and base events. Active small business set-asides.",
    buysFood: true,
    agencyMatchers: ["4th Contracting Squadron"],
    awardAgencies: ab(A.seymour.abbrev),
    officers: [
      sblo("sj-1", "Bridget Okonkwo", "b.okonkwo@af.mil.sample", "919-555-0221"),
      co("sj-2", "Capt. Jordan Meyers", "j.meyers@af.mil.sample", "919-555-0222", "Signed the lodging breakfast award you bid on."),
      spec("sj-3", "MSgt. Calvin Reeves", "c.reeves@af.mil.sample", "919-555-0223"),
      fpm("sj-4", "TSgt. Naomi Fletcher", "n.fletcher@af.mil.sample", "919-555-0224"),
    ],
    analysis: analysis(
      "maybe",
      "You lost the lodging breakfast job here by about 4% on price. That is close. Ask for the debrief, and watch for the next dining facility request.",
      spend([2_900_000, 3_300_000, 3_700_000], [
        ["Dining facility service", 0.7],
        ["Lodging breakfast", 0.15],
        ["Base events", 0.15],
      ]),
      39,
      7,
      "Awards land from June to September.",
      awardeesFrom(ab(A.seymour.abbrev)),
    ),
  },
  {
    id: "cherry-point",
    agencyKey: 5011,
    name: "MCAS Cherry Point (NAVFAC Mid-Atlantic)",
    abbreviation: "NAVFAC Cherry Point",
    type: "federal",
    location: "Havelock, NC",
    distanceMiles: 140,
    whatTheyBuy:
      "Community center and family housing catering, galley support and base events.",
    buysFood: true,
    agencyMatchers: ["Cherry Point"],
    awardAgencies: ab(A.cherryPoint.abbrev),
    officers: [
      sblo("chp-1", "Harriet Boyd", "h.boyd@navy.mil.sample", "252-555-0231"),
      co("chp-2", "LtCol Samuel Whitaker", "s.whitaker@usmc.mil.sample", "252-555-0232"),
      spec("chp-3", "Tobias Sandoval", "t.sandoval@navy.mil.sample", "252-555-0233"),
    ],
    analysis: analysis(
      "not-yet",
      "Event work is a fit, and the awards are set aside for woman-owned firms. But 140 miles is a long way to bring a catering crew. Look at this after Fort Bragg and the VA.",
      spend([1_200_000, 1_100_000, 1_400_000], [
        ["Community center catering", 0.45],
        ["Galley support", 0.4],
        ["Base events", 0.15],
      ]),
      48,
      18,
      "Requests come out in spring.",
      awardeesFrom(ab(A.cherryPoint.abbrev)),
    ),
  },
  {
    id: "robeson-schools",
    agencyKey: 5012,
    name: "Public Schools of Robeson County",
    abbreviation: null,
    type: "sled",
    location: "Lumberton, NC",
    distanceMiles: 35,
    whatTheyBuy: "Cafeteria service and school meals. Cafeteria contracts are bid by school.",
    buysFood: true,
    agencyMatchers: ["Robeson County"],
    awardAgencies: [],
    officers: [
      sblo("rob-1", "Patricia Lowry", "p.lowry@robeson.k12.nc.us.sample", "910-555-0241"),
      co("rob-2", "Terrence Bullard", "t.bullard@robeson.k12.nc.us.sample", "910-555-0242"),
      fpm("rob-3", "Gail Henderson", "g.henderson@robeson.k12.nc.us.sample", "910-555-0243", "Child nutrition services."),
    ],
    analysis: analysis(
      "maybe",
      "35 miles from your kitchen, and your county schools work counts as a reference. The cafeteria contract for Lumberton Senior High is open now.",
      spend([2_400_000, 2_600_000, 2_700_000], [
        ["School cafeteria service", 0.8],
        ["Summer meals", 0.2],
      ]),
      41,
      8,
      "Cafeteria contracts renew in the spring for the school year.",
      localAwardees([[4010, 2, 940_000], [4104, 1, 610_000]]),
    ),
  },
  {
    id: "durham-county",
    agencyKey: 5013,
    name: "Durham County Government",
    abbreviation: null,
    type: "sled",
    location: "Durham, NC",
    distanceMiles: 85,
    whatTheyBuy: "Senior nutrition and meals for county social service programs.",
    buysFood: true,
    agencyMatchers: ["Durham County"],
    awardAgencies: [],
    officers: [
      sblo("dur-1", "Monica Alvarez", "m.alvarez@dconc.gov.sample", "919-555-0251"),
      co("dur-2", "Edward Kincaid", "e.kincaid@dconc.gov.sample", "919-555-0252"),
      fpm("dur-3", "Lakisha Monroe", "l.monroe@dconc.gov.sample", "919-555-0253", "Senior nutrition program."),
    ],
    analysis: analysis(
      "not-yet",
      "Senior meals are a fit for your diet menus, but Durham is 85 miles away. Start with buyers inside your 60-mile delivery range.",
      spend([780_000, 820_000, 900_000], [
        ["Senior nutrition", 0.75],
        ["Program meals", 0.25],
      ]),
      50,
      13,
      "Contracts renew in July.",
      localAwardees([[4004, 1, 540_000]]),
    ),
  },
  {
    id: "gsa-r4",
    agencyKey: 5014,
    name: "GSA Region 4 (federal buildings)",
    abbreviation: "GSA Region 4",
    type: "federal",
    location: "Greensboro, NC",
    distanceMiles: 115,
    whatTheyBuy: "Cafeterias and food service in federal buildings across the Southeast.",
    buysFood: true,
    agencyMatchers: ["GSA Region 4", "General Services Administration"],
    awardAgencies: ab(A.gsa4.abbrev),
    officers: [
      sblo("gsa-1", "Veronica Pratt", "v.pratt@gsa.gov.sample", "336-555-0261"),
      co("gsa-2", "Dale Harmon", "d.harmon@gsa.gov.sample", "336-555-0262"),
      spec("gsa-3", "Jun Tanaka", "j.tanaka@gsa.gov.sample", "336-555-0263"),
    ],
    analysis: analysis(
      "not-yet",
      "A daily cafeteria 115 miles from your kitchen is hard to staff. Keep it on your radar for later.",
      spend([1_900_000, 2_000_000, 2_100_000], [
        ["Federal building cafeterias", 0.8],
        ["Vending and cafes", 0.2],
      ]),
      37,
      8,
      "Awards come all year.",
      awardeesFrom(ab(A.gsa4.abbrev)),
    ),
  },
  {
    id: "fort-jackson",
    agencyKey: 5015,
    name: "Fort Jackson (U.S. Army)",
    abbreviation: "Fort Jackson",
    type: "federal",
    location: "Columbia, SC",
    distanceMiles: 110,
    whatTheyBuy: "Basic training dining halls and field feeding for recruits.",
    buysFood: true,
    agencyMatchers: ["Fort Jackson"],
    awardAgencies: ab(A.fortJackson.abbrev),
    officers: [
      sblo("fj-1", "Gloria Ashby", "g.ashby@army.mil.sample", "803-555-0271"),
      co("fj-2", "Maj. Peter Lindgren", "p.lindgren@army.mil.sample", "803-555-0272"),
      fpm("fj-3", "SFC Anthony Duval", "a.duval@army.mil.sample", "803-555-0273"),
    ],
    analysis: analysis(
      "not-yet",
      "South Carolina is inside your service area, but the jobs are large dining hall contracts. Team with a prime that holds one.",
      spend([9_100_000, 9_800_000, 10_400_000], [
        ["Dining facility operations", 0.7],
        ["Field feeding", 0.3],
      ]),
      35,
      5,
      "Awards cluster in the summer.",
      awardeesFrom(ab(A.fortJackson.abbrev)),
    ),
  },
  {
    id: "ns-norfolk",
    agencyKey: 5016,
    name: "Naval Station Norfolk",
    abbreviation: "NS Norfolk",
    type: "federal",
    location: "Norfolk, VA",
    distanceMiles: PLACES.norfolk.milesFromKitchen,
    whatTheyBuy: "Galley services and mess attendants for the Navy's largest base.",
    buysFood: true,
    agencyMatchers: ["Naval Station Norfolk"],
    awardAgencies: ab(A.norfolk.abbrev),
    officers: [
      sblo("nor-1", "Rhonda Saunders", "r.saunders@navy.mil.sample", "757-555-0281"),
      co("nor-2", "LCDR Katherine Moyer", "k.moyer@navy.mil.sample", "757-555-0282"),
      spec("nor-3", "Elliott Voss", "e.voss@navy.mil.sample", "757-555-0283"),
    ],
    analysis: analysis(
      "not-yet",
      "Virginia is inside your service area on paper, but 220 miles is too far for a daily galley. Only look at it as a subcontractor.",
      spend([12_400_000, 13_300_000, 13_900_000], [
        ["Galley services", 0.65],
        ["Mess attendant services", 0.35],
      ]),
      31,
      4,
      "Awards cluster in the fall.",
      awardeesFrom(ab(A.norfolk.abbrev)),
    ),
  },
];
