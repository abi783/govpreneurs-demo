// THE TRUCKING COMPANY's words for Grant's generated reviews (read through
// src/demo/grant/vocab.ts), and the risks the story's one-liners name for a few
// of its opportunities.
//
// Rockfish Run Freight is a 15-person service-disabled veteran-owned carrier in
// Fayetteville (persona.ts): 12 drivers, 7 tractors, 9 trailers, 4 box trucks
// with lift gates and a cargo van. It carries no surety bond line. Distance is
// empty miles: every run starts and ends at the yard.

import { dueTimeOf } from "../../../story/opportunities";
import { PARTNER, STAFF, type OppFacts } from "../../../grant/facts";
import type { Caveat } from "../../../grant/generator";
import type { ClausePatch } from "../../../grant/solicitation";
import type { GrantVocab } from "../../../grant/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** "all of North Carolina", "NC, VA, SC, GA and FL", for work that is not tied to one place. */
function areaOf(f: OppFacts): string | null {
  if (!/^Multiple/.test(f.place.city)) return null;
  const states = /\(([^)]+)\)/.exec(f.place.city)?.[1].split(/,\s*/);
  if (!states) return "all of North Carolina";
  return `${states.slice(0, -1).join(", ")} and ${states[states.length - 1]}`;
}

/** Rates from Service Contract Act wage determination 2015-4377, Rev. 33 (Cumberland and Hoke counties, NC). */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Truckdriver, Light (31361)", "$18.83", "$5.92"],
  ["Truckdriver, Medium (31362)", "$20.11", "$5.92"],
  ["Truckdriver, Heavy (31363)", "$24.03", "$5.92"],
  ["Truckdriver, Tractor-Trailer (31364)", "$24.03", "$5.92"],
  ["Driver Courier (31043)", "$17.52", "$5.92"],
  ["Dispatcher, Motor Vehicle (01060)", "$22.44", "$5.92"],
  ["Material Handling Laborer (21050)", "$18.03", "$5.92"],
];

/** The set-asides the shared clause text does not word. */
const SET_ASIDE_CLAUSE: Record<string, string> = {
  SDVOSBC:
    "This requirement is a set-aside for service-disabled veteran-owned small businesses under 38 U.S.C. 8127. Only firms listed as SDVOSB in SBA's certification database at the time of the offer can compete.",
  HZC: "This requirement is a set-aside for HUBZone small businesses under 13 CFR 126. Only firms that SBA certifies as HUBZone at the time of the offer and at award can compete.",
  "8A": "This requirement is reserved for a firm in the SBA's 8(a) Business Development Program. The buyer intends to award it without competition.",
};

/** Risks the story's one-liners name that the facts alone do not show. */
export const CAVEATS: Record<string, Caveat> = {
  "W91247-27-Q-0119": {
    limit: "Rating: your 18th Airborne Corps job has no performance rating yet. Ask Fort Bragg for an interim rating before you send the quote.",
    kind: "proposal-weakness",
    change: "If Fort Bragg can't give an interim rating before the due date, I'd lead with your NCDOT storm hauling reference instead.",
    ref: "pp-bragg-trailer-hauling",
  },
  "D6D2.POC.036": {
    limit: "Price: the lowest responsible bid gets it. Price an hourly rate you can hold through a busy storm season.",
    kind: "winning-hurts",
    change: "If Division 6 changes its hourly rate sheet, I'd check your price again.",
    ref: "pp-ncdot-storm-hauling",
  },
  "W91247-27-Q-0183": {
    limit: "Competition: past orders for this work went to movers from out of state. Price it tight.",
    kind: "proposal-weakness",
    change: "If the Army asks for a crew larger than four, I'd check that your routes still run that week.",
  },
  "RFP27-11-EM": {
    limit: "Standby hours: the county pays for standby hours and for each run. Price the standby, not just the runs.",
    kind: "winning-hurts",
    change: "If the county caps the standby hours, I'd check the price again.",
    ref: "pp-ncdot-storm-hauling",
  },
  M6700127Q0058: {
    limit: "Empty miles: every call at Camp Lejeune starts about 100 miles from your yard. Price the drive out and back into each move.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the empty-mile cost",
    change: "If you can price each move with the drive back, or park a truck near the base, I'd move this to **Bid**.",
    read: {
      name: "Will you make money?",
      rating: "watch",
      text: "Each move is paid as one move, but your truck drives about 200 miles to make it. Price the empty miles into every move, or the margin goes.",
      bold: "Price the empty miles into every move",
    },
    question: {
      id: "lejeune-miles",
      question: "Can you price each move with the **drive back to your yard**, or park a truck near Camp Lejeune?",
      payoff: "A yes shows whether the **empty miles** are a real limit.",
      chip: "miles",
      yes: { gist: "You can price the drive back or park a truck near the base, so the empty miles are less of a limit.", ack: "Good. With the miles in the price, this is your trailer work again. I raised my confidence." },
      no: { gist: "You can't price the drive back or park a truck there, so the empty miles stay a real limit.", ack: "Then each move may cost more than it pays. Price one before you quote. My confidence stays where it was." },
    },
  },
  W81K0427QA014: {
    limit: "Night calls: rush calls must be answered within 2 hours, day or night. Your dispatch runs 5 AM to 9 PM, so you need a third driver on call at night.",
    kind: "responsibility",
    decides: true,
    phrase: "the night-call coverage",
    change: "If you can put a third driver on call every night, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "The scheduled runs fit your drivers. Rush calls around the clock don't: one night driver can't cover two calls at once, so you need a third driver on call.",
      bold: "you need a third driver on call",
    },
    question: {
      id: "night-driver",
      question: "Could you put a **third driver on call** every night?",
      payoff: "A yes shows whether the **night calls** are a real limit.",
      chip: "driver",
      yes: { gist: "You can put a third driver on call at night, so the night calls are less of a limit.", ack: "Good. Price the on-call nights into the quote. I raised my confidence." },
      no: { gist: "You can't put a third driver on call at night, so the night calls stay a real limit.", ack: "Then the response time is a real risk, and it is scored. My confidence stays where it was." },
    },
  },
  "HCR-28370": {
    limit: "USPS rules: the route is posted and awarded in USPS's own system, not SAM.gov. There are no set-asides, and it pays a fixed rate per trip.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "USPS's own system",
    change: "If you register as a USPS supplier and the rate per trip covers your miles, I'd move this to **Bid**.",
    read: {
      name: "Can you win it?",
      rating: "watch",
      text: "USPS buys under its own rules, so there is no set-aside and any carrier can offer. You'd register in USPS's supplier system before you could see the papers.",
      bold: "You'd register in USPS's supplier system",
    },
    question: {
      id: "usps-supplier",
      question: "Are you registered as a **USPS supplier**?",
      payoff: "A yes shows whether **USPS's own system** is a real limit.",
      chip: "USPS",
      yes: { gist: "You are registered as a USPS supplier, so USPS's own system is less of a limit.", ack: "Good. Then it comes down to whether the rate per trip covers your miles. I raised my confidence." },
      no: { gist: "You aren't registered as a USPS supplier, so USPS's own system stays a real limit.", ack: "Then register first. It is free, but it takes time. My confidence stays where it was." },
    },
  },
  "140FS327Q0021": {
    limit: "Price per ton: the gravel is paid by the ton delivered, at the far end of your area, and you'd rent a dump trailer.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the price per ton",
    change: "If a rented dump trailer and the trip still leave a margin per ton, I'd move this to **Bid**.",
    read: {
      name: "Will you make money?",
      rating: "watch",
      text: "You are paid by the ton delivered, and each trip is a long day. Price a rented dump trailer and the trip per ton before you quote.",
      bold: "Price a rented dump trailer and the trip per ton",
    },
    question: {
      id: "dump-trailer",
      question: "Have you priced a **rented dump trailer** and the trip, per ton?",
      payoff: "A yes shows whether the **price per ton** is a real limit.",
      chip: "price",
      yes: { gist: "You have priced the dump trailer and the trip per ton, so the price is less of a limit.", ack: "Good. If the margin holds per ton, it is a fair job for a slow month. I raised my confidence." },
      no: { gist: "You haven't priced the dump trailer and the trip, so the price per ton stays a real limit.", ack: "Then get a rental rate first. Without it, the price is a guess. My confidence stays where it was." },
    },
  },
  "36C24627Q0102": {
    limit: "Second yard: the daily routes start in Durham, about 85 miles from your yard. They need trucks and drivers based there.",
    kind: "responsibility",
    decides: true,
    phrase: "the second yard",
    change: "If you can base two trucks and their drivers near Durham, I'd move this to **Bid**.",
    read: {
      name: "Can you perform there?",
      rating: "watch",
      text: "The routes start in Durham, about 85 miles from your yard. A daily route that far away needs trucks and drivers based there.",
      bold: "needs trucks and drivers based there",
    },
    question: {
      id: "durham-yard",
      question: "Could you **base two trucks** and their drivers near Durham?",
      payoff: "A yes shows whether the **second yard** is a real limit.",
      chip: "yard",
      yes: { gist: "You can base two trucks and drivers near Durham, so the second yard is less of a limit.", ack: "Good. Then it is your route work again. Price the parking and the local hires. I raised my confidence." },
      no: { gist: "You can't base trucks near Durham, so the second yard stays a real limit.", ack: "Then the daily drive eats the margin. Bid the Fayetteville routes first. My confidence stays where it was." },
    },
  },
  "W91242-27-Q-0041": {
    limit: "Equipment: the Guard's vehicles move on lowboy trailers with oversize permits. You have no lowboys.",
    kind: "responsibility",
    decides: true,
    phrase: "the lowboy rental",
    change: "If you can rent lowboys and get the oversize permits before the first move, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Your drivers can haul it, but your flatbeds can't carry Guard vehicles. The moves need lowboy trailers and oversize permits you don't have.",
      bold: "lowboy trailers and oversize permits you don't have",
    },
    question: {
      id: "lowboy-rental",
      question: "Could you **rent lowboys** and get the oversize permits in time?",
      payoff: "A yes shows whether the **lowboys** are a real limit.",
      chip: "equipment",
      yes: { gist: "You can rent lowboys and get the permits in time, so the equipment is less of a limit.", ack: "Good. Price the rental and the permits into each move. I raised my confidence." },
      no: { gist: "You can't rent lowboys or get the permits in time, so the equipment stays a real limit.", ack: "Then this is not one to quote yet. My confidence stays where it was." },
    },
  },
  "CCS-27-014": {
    limit: "Crew: the moves happen in school-day hours with two-person crews, the same hours your drivers run their routes.",
    kind: "responsibility",
    decides: true,
    phrase: "the school-day crew",
    change: "If you can free two drivers during school days, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Your box trucks fit the work. The moves run in school-day hours with two-person crews, the hours your drivers are on their routes.",
      bold: "the hours your drivers are on their routes",
    },
    question: {
      id: "school-crew",
      question: "Could you free **two drivers** during school days for the moves?",
      payoff: "A yes shows whether the **school-day crews** are a real limit.",
      chip: "crew",
      yes: { gist: "You can free two drivers during school days, so the crew is less of a limit.", ack: "Good. Then it is box-truck work close to home. I raised my confidence." },
      no: { gist: "You can't free two drivers during school days, so the crew stays a real limit.", ack: "Then hire a helper first, or let this one go. My confidence stays where it was." },
    },
  },
  "D08POCD1.PR31042": {
    limit: "Storm days: Division 8 calls come on the same storm days as Division 6's. With both contracts, the same trucks get two calls at once.",
    kind: "responsibility",
    decides: true,
    phrase: "the storm-day overlap",
    ref: "pp-ncdot-storm-hauling",
    change: "If you can cover both divisions on the same storm day, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "It is Division 6's work again, run from Carthage. Storms hit both divisions on the same days, so the same trucks would get two calls at once.",
      bold: "the same trucks would get two calls at once",
    },
    question: {
      id: "two-divisions",
      question: "Could you cover **both divisions** on the same storm day?",
      payoff: "A yes shows whether the **storm-day overlap** is a real limit.",
      chip: "trucks",
      yes: { gist: "You can cover both divisions on the same storm day, so the overlap is less of a limit.", ack: "Good. Then bid both, and name which trucks go where. I raised my confidence." },
      no: { gist: "You can't cover both divisions on the same storm day, so the overlap stays a real limit.", ack: "Then bid Division 6 first; it is your buyer. My confidence stays where it was." },
    },
  },
  "36C24627Q0113": {
    limit: "Rush runs: daily rush runs to the Durham VA need a driver based in Durham, about 85 miles from your yard.",
    kind: "responsibility",
    decides: true,
    phrase: "the Durham driver",
    change: "If you can base a driver and a van in Durham, I'd move this to **Bid**.",
    read: {
      name: "Can you perform there?",
      rating: "watch",
      text: "The pharmacy is about 85 miles from your yard. A rush run can't start in Fayetteville, so you need a driver based in Durham.",
      bold: "you need a driver based in Durham",
    },
    question: {
      id: "durham-driver",
      question: "Could you **base a driver** and a van in Durham?",
      payoff: "A yes shows whether the **Durham driver** is a real limit.",
      chip: "driver",
      yes: { gist: "You can base a driver and a van in Durham, so the distance is less of a limit.", ack: "Good. Then it is courier work you can run. I raised my confidence." },
      no: { gist: "You can't base a driver in Durham, so the distance stays a real limit.", ack: "Then the rush times are out of reach. My confidence stays where it was." },
    },
  },
  W912PM27Q0014: {
    limit: "Oversize load: one heavy load over legal size needs permits, escorts and a trailer rated for it.",
    kind: "responsibility",
    decides: true,
    phrase: "the oversize load",
    change: "If you have a trailer rated for the load and the permits in time, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "It is one load, but it is heavy and over legal size. Check the permits, the escorts and whether your flatbeds are rated for it.",
      bold: "Check the permits",
    },
    question: {
      id: "oversize-trailer",
      question: "Do you have a **trailer rated for the load**, or a carrier to rent one from?",
      payoff: "A yes shows whether the **oversize permits** are a real limit.",
      chip: "trailer",
      yes: { gist: "You have a trailer rated for the load, so the oversize load is less of a limit.", ack: "Good. Get the permits and the escort booked before you quote. I raised my confidence." },
      no: { gist: "You don't have a trailer rated for the load, so the oversize load stays a real limit.", ack: "Then pass, or ask a heavy-haul carrier to take it with you. My confidence stays where it was." },
    },
  },
  "HQC005-27-Q-E031": {
    limit: "Equipment: six weeks of reefer trailer rental, and your one reefer runs Cypress Bend Foods every week.",
    kind: "responsibility",
    decides: true,
    phrase: "the booked reefer",
    change: "If you can rent a second reefer for the six weeks, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "It is trailer rental, not hauling, and your one reefer is booked every week. You'd need a second one for the six weeks.",
      bold: "your one reefer is booked every week",
    },
    question: {
      id: "second-reefer",
      question: "Could you **rent a second reefer** for the six weeks?",
      payoff: "A yes shows whether the **booked reefer** is a real limit.",
      chip: "reefer",
      yes: { gist: "You can rent a second reefer for the six weeks, so the equipment is less of a limit.", ack: "Good. Price the rental under the quote and it can work. I raised my confidence." },
      no: { gist: "You can't rent a second reefer, so the equipment stays a real limit.", ack: "Then let this one go. My confidence stays where it was." },
    },
  },
  "HTC711-27-R-R004": {
    limit: "Approval: only carriers SDDC has already approved for secure cargo can offer. You have no approval and no clearance.",
    kind: "disqualifier",
    decides: true,
    phrase: "the SDDC approval",
    change: "Nothing changes this cycle. After SDDC's carrier program and a few years of DoD freight, I'd look again.",
    trail: "Who can offer: **carriers SDDC has already approved** for secure cargo.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only carriers SDDC has already approved for secure cargo can offer. You have no approval and no clearance, so you can't send an offer.",
      bold: "you can't send an offer",
    },
    roadmap: {
      item: "A place in **SDDC's carrier program**",
      why: "DoD books its freight through carriers SDDC has registered. Registration comes first; secure cargo comes years later.",
      takes: "Three straight years of DOT authority (you have nine), a SCAC, a Syncada account, a DoD bond and cargo insurance. Diana's checklist covers it.",
    },
  },
  "36C24627Q0074": {
    limit: "Trade: wheelchair rides for patients need wheelchair vans, trained attendants and the VA's patient rules. It isn't freight.",
    kind: "disqualifier",
    decides: true,
    phrase: "patient transport",
  },
  COF2741182RFP: {
    limit: "Trade: garbage collection needs packer trucks and landfill permits. It isn't freight.",
    kind: "disqualifier",
    decides: true,
    phrase: "garbage collection",
  },
  "36C24627Q0121": {
    limit: "Permit: medical waste needs a state medical-waste permit and a treatment site.",
    kind: "disqualifier",
    decides: true,
    phrase: "the medical-waste permit",
  },
  PANMCC27P0000011836: {
    limit: "Trade: packing household goods is a mover's trade, with its own claims rules.",
    kind: "disqualifier",
    decides: true,
    phrase: "household-goods packing",
  },
};

export const VOCAB: GrantVocab = {
  base: "your yard",
  crew: "your fleet",
  teamOf: `a ${STAFF}-person carrier`,
  peers: "carriers",
  bigWork: "federal freight work",
  nearRun: "Your trucks can run out and back the same day.",
  farTrip: "Each run there is a long day for a driver, and empty miles home.",
  travelCost: "fuel and driver time",
  frontCost: "you buy fuel and carry payroll",
  priceAdvice: "Price from your real miles, fuel and driver hours, with the empty miles back to your yard, and the wage determination's rates.",
  fitsWin: "A win fits the trucks and drivers you have.",
  canRun: `Your ${STAFF}-person company can run this work with the trucks you have.`,
  fitsYou: "your trucks and your size",
  edge: "a yard close to the work and a driver who knows the gates",
  cashLine: "A **credit line** for fuel and payroll",
  localPartner: "A local carrier near the site makes the daily runs possible.",
  recordWhy: "A federal prime near your yard, with a rating, is the record VA and Fort Bragg buyers look for.",
  firstMatch: `The ${hero.plainTitle}`,
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    /Veterans/.test(f.opp.agency) ||
    /Transportation/.test(f.opp.agency) ||
    (/Army|Navy/.test(f.opp.agency) && /Fort Bragg|Jacksonville/.test(f.place.city)),
  wide: (f) => {
    const area = areaOf(f);
    return area ? `The work covers ${area}. Your trucks run from your yard, with long trips and nights away.` : null;
  },

  cost: "your real miles, fuel and driver hours",
  insuranceLine: "No bond is asked for. Your vehicle, cargo and general liability insurance are on file, and they meet the notice.",
  nearLine: "That is close enough for your trucks to run out and back the same day.",
  farLine: "Price the empty miles home, or park a truck near the site.",
  sizeFix: "Only with a partner or more trucks. New tractors and drivers take months to add. Open Partners to find a prime who needs a local carrier.",
  partnerHint: (opp) =>
    /Army/.test(opp.agency) && opp.place === "fortBragg"
      ? `${PARTNER.name} wants a local service-disabled veteran-owned carrier for Fort Bragg's freight runs and trailer moves. `
      : "",
  localQuestion: {
    question: (place) => `Could you park a truck near **${place}**, or work with a local carrier there?`,
    payoff: "A yes shows whether the **drive** is a real limit.",
    yes: { gist: "You said you can park a truck near the site or work with a local carrier, so the distance is less of a limit.", ack: "Good. A truck based near the site cuts the empty miles. Price the parking. I raised my confidence." },
    no: { gist: "You can't base a truck near the site, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A carrier near the site may be the way around it. My confidence stays where it was." },
  },
  reactions: Object.fromEntries(
    Object.values(CAVEATS).flatMap((c) => (c.question ? [[c.question.id, { yes: c.question.yes, no: c.question.no }]] : [])),
  ),

  eligibility: () => [
    "USDOT and MC operating authority from the Federal Motor Carrier Safety Administration.",
    "Vehicle liability insurance of $1M on every truck, and cargo insurance.",
    "Drivers with the license class each truck needs, and clean records.",
  ],
  collect: "Collect your authority letter, insurance certificates, driver list and two references.",
  attachments: "your insurance certificates, driver list and references",
  travelRisk: "Empty miles to and from a far site add cost.",

  trade: "Trucking",
  // The demo states no size-standard figure for the carrier's codes.
  sizeStandard: null,
  dueInClauses: dueTimeOf,
  clauses: (f, offer) => {
    const area = areaOf(f);
    const out: Record<string, string | null> = {
      permit: null,
      certs: null,
      haccp: null,
      hours: null,
      bond: null,
      ...(f.setAside && SET_ASIDE_CLAUSE[f.setAside] ? { setAside: SET_ASIDE_CLAUSE[f.setAside] } : {}),
      insurance: `The contractor shall carry automobile liability insurance of $1,000,000 for each occurrence on every truck, motor truck cargo insurance of $100,000, commercial general liability insurance of $1,000,000, and workers' compensation at the legal limit. Proof is due with the ${offer}.`,
      access: f.isFederal
        ? "Each driver needs a background check and base or site access before the first run. The contractor starts these checks within five days of award."
        : null,
    };
    if (offer === "quote") out.content = "The quote has three parts: the price schedule, a short operating plan (up to three pages) naming the trucks and drivers, and two references.";
    if (offer === "proposal") out.content = "The proposal has three parts: a technical volume (up to ten pages) with the operating plan, a past performance volume with three references, and the price schedule.";
    if (area) out.place = `Loads move between sites across ${area} that the buyer names at award.`;
    return out;
  },
  extraClauses: (f): ClausePatch[] => {
    const fed = f.isFederal;
    const work = fed ? "C" : "2";
    const terms = fed ? "H" : "5";
    return [
      { kind: "tracking", section: work, ref: `${work}.4`, heading: "Tracking", text: "Every truck on this contract shall carry GPS. The contractor shall give the buyer's representative pickup and delivery times on request." },
      { kind: "securement", section: work, ref: `${work}.5`, heading: "Loading and securement", text: "The contractor shall load, block, brace and tie down every load to the federal cargo securement rules (49 CFR 393), and report any damage the same day." },
      { kind: "backup", section: work, ref: `${work}.6`, heading: "Backup trucks and drivers", text: "The contractor shall replace a truck that breaks down, or a driver who is out, in time to finish the day's work." },
      {
        kind: "authority",
        section: terms,
        ref: `${terms}.${fed ? 6 : 2}`,
        heading: "Operating authority",
        text: "The contractor shall hold active USDOT and MC operating authority, keep a satisfactory safety rating, and keep every driver within the federal hours-of-service rules.",
      },
    ];
  },
  wageRows: WAGE_ROWS,
  priceOnlyWin: "The lowest responsible bid wins. A yard close to the work keeps your empty miles, and your price, down.",
  priceOnlyMoney: "A bid like this is won on price. Price from your real truck hours and fuel, or walk away.",
  offTrade: {
    item: "A contract in **freight you haul**",
    why: "This notice isn't freight hauling, so it doesn't build the record you want.",
  },
};
