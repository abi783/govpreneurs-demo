// THE JANITORIAL FIRM's words for Grant's generated reviews (read through
// src/demo/grant/vocab.ts), and the risks the story's one-liners name for a few
// of its opportunities.
//
// Gray Owl Facility Services is a 38-person HUBZone cleaning firm on Gillespie
// Street in Fayetteville (persona.ts): night custodial crews, four floor techs,
// two exterior techs and two hot-water washing rigs. No bond, no credit line.
// Its work is on site, so distance is drive time for the crews every night.

import { dueTimeOf } from "../../../story/opportunities";
import { PARTNER, STAFF, type OppFacts } from "../../../grant/facts";
import type { Caveat } from "../../../grant/generator";
import type { ClausePatch } from "../../../grant/solicitation";
import type { GrantVocab } from "../../../grant/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** Rates from SCA wage determination 2015-4377, Rev. 33 (Cumberland and Hoke counties). */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Janitor (11150)", "$16.46", "$5.92"],
  ["Housekeeping Aide (11122)", "$16.46", "$5.92"],
  ["Window Cleaner (11360)", "$17.89", "$5.92"],
  ["Laborer, Grounds Maintenance (11210)", "$17.21", "$5.92"],
  ["General Maintenance Worker (23370)", "$21.41", "$5.92"],
  ["Laborer (23470)", "$18.03", "$5.92"],
];

/** The set-asides the shared clause text does not word. */
const SET_ASIDE_CLAUSE: Record<string, string> = {
  HZC: "This requirement is a set-aside for HUBZone small businesses under 13 CFR 126. Only firms that SBA certifies as HUBZone at the time of the offer and at award can compete.",
  SDVOSBC:
    "This requirement is a set-aside for service-disabled veteran-owned small businesses. Only firms listed as SDVOSB in SBA's certification database at the time of the offer can compete.",
  "8A": "This requirement is set aside for firms in the SBA's 8(a) Business Development Program. Only 8(a) firms can compete.",
};

/** The AbilityOne line, for notices on the Procurement List. */
const ABILITYONE_READ = {
  name: "Can you win it?" as const,
  rating: "weak" as const,
  text: "The work goes to AbilityOne nonprofits by law, so the Army can't accept a quote from a commercial firm at any price.",
  bold: "at any price",
};

/** Risks the story's one-liners name that the facts alone do not show. */
export const CAVEATS: Record<string, Caveat> = {
  "45-RQ300517R": {
    limit: "Site visit: the 14 October site visit was mandatory for every bidder, and you weren't there.",
    kind: "disqualifier",
    decides: true,
    phrase: "the missed site visit",
    change: "If the department reopens the bid with a new site visit, I'd run the checks again.",
    trail: "Who can quote: **only firms at the 14 October site visit**. You were not there.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "The site visit on 14 October was mandatory. You weren't there, so a quote from you won't be accepted.",
      bold: "a quote from you won't be accepted",
    },
    roadmap: {
      item: "A **calendar of site visits** for the state buyers near you",
      why: "State cleaning bids often make the site visit mandatory, and it comes early. Missing it ends the bid before you price.",
      takes: "Save a Hunter search for NC state cleaning bids, and put each site visit on your calendar the day the bid posts.",
    },
  },
  "54-SH-06-PR34172": {
    limit: "Seven days: the rest areas are staffed 16 hours a day, every day of the year, holidays included, with a supervisor within 50 miles.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the seven-day staffing",
    change: "If you build a seven-day schedule and its payroll still leaves a margin at NCDOT's wage floor, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Two rest areas, 16 hours a day, every day of the year. That is a seven-day staffing business more than a night cleaning job.",
      bold: "a seven-day staffing business",
    },
    question: {
      id: "seven-day-schedule",
      question: "Have you built a **seven-day schedule** with its payroll cost?",
      payoff: "A yes shows whether the **seven-day staffing** is a real limit.",
      chip: "staffing",
      yes: { gist: "You have a seven-day schedule and its payroll, so the staffing is less of a limit.", ack: "Good. Bring it to Sarah; if the payroll leaves a margin, this can work. I raised my confidence." },
      no: { gist: "You haven't built a seven-day schedule yet, so the staffing stays a real limit.", ack: "Then build it before you price: 16 hours a day, 365 days, with holidays. My confidence stays where it was." },
    },
  },
  W9124727QA026: {
    limit: "Certification: hood, duct and fan cleaning has to meet NFPA 96, and you don't hold that certification yet.",
    kind: "responsibility",
    decides: true,
    phrase: "the NFPA 96 certification",
    change: "If you get two techs certified for NFPA 96 hood cleaning, I'd tell you to answer this and get ready for the bid.",
    question: {
      id: "nfpa-96",
      question: "Could you get two techs **certified for NFPA 96** hood cleaning before the bid?",
      payoff: "A yes shows whether the **certification** is a real limit.",
      chip: "certification",
      yes: { gist: "You can get two techs certified for NFPA 96, so the certification is less of a limit.", ack: "Good. Say so in your reply; a strong small-business answer can open this up. I raised my confidence." },
      no: { gist: "You can't get techs certified in time, so the certification stays a real limit.", ack: "Then answer anyway, and say when you'll be certified. My confidence stays where it was." },
    },
  },
  "RCC-27-004": {
    limit: "Rebid: the college bid this in 2025 and again in 2026 without a contract that lasted.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "the rebid",
    change: "If the college says what changed since the last two bids, I'd look at the price again.",
    question: {
      id: "rcc-what-changed",
      question: "Do you know **what changed** since the college's last two bids?",
      payoff: "A yes shows whether the **rebid** is a real risk.",
      chip: "rebid",
      yes: { gist: "You know what changed since the last two bids, so the rebid is less of a risk.", ack: "Good. Price to that, not to the old bids. I raised my confidence." },
      no: { gist: "You don't know what changed, so the rebid stays a real risk.", ack: "Then ask the business office before you price. My confidence stays where it was." },
    },
  },
  "FTCC-RFP-27-05": {
    limit: "Pilot: NC community colleges mostly clean in house, so this may be a trial, not a lasting contract.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the pilot",
    change: "If the college confirms a full term with options, I'd move this to **Bid**.",
    question: {
      id: "ftcc-pilot",
      question: "Has the college said whether this is **a pilot** or a full term?",
      payoff: "A yes shows whether you'd be **staffing for a trial**.",
      chip: "pilot",
      yes: { gist: "The college confirmed the term, so staffing up is less of a risk.", ack: "Good. Then staff it as steady work. I raised my confidence." },
      no: { gist: "You don't know if it's a pilot, so staffing up stays a risk.", ack: "Then ask before you hire for it. My confidence stays where it was." },
    },
  },
  "PWC-2627-22": {
    limit: "Plant safety: every worker needs the utility's plant safety training before the first shift.",
    kind: "responsibility",
    change: "If the training takes longer than the start date allows, I'd look at this again.",
  },
  W912PM27QA004: {
    limit: "Price: the lowest price gets it, and mowing draws a crowd of local firms. Price it lean.",
    kind: "proposal-weakness",
    change: "If the Corps adds sites or visits in an amendment, I'd check the price again.",
  },
  W912PM27QA013: {
    limit: "Competition: 23 firms quoted the last version of this tiny job.",
    kind: "proposal-weakness",
    change: "If the Corps adds the other Wake County offices, I'd look at it again.",
  },
  W9124727RA002: {
    limit: "AbilityOne: Fort Bragg's grounds work is on the AbilityOne Procurement List, so it goes to nonprofit agencies by law.",
    kind: "disqualifier",
    decides: true,
    phrase: "the AbilityOne list",
    change: "If the work comes off the Procurement List, I'd run the checks again.",
    trail: "Who can quote: **AbilityOne nonprofit agencies only**. A commercial firm can't.",
    read: ABILITYONE_READ,
    roadmap: {
      item: "The **exterior and specialty work** Fort Bragg buys from firms like yours",
      why: "Custodial and grounds at Fort Bragg are AbilityOne work. DPW's pressure washing and the one-time floor jobs are open to you.",
      takes: `Bid the ${hero.plainTitle.charAt(0).toLowerCase()}${hero.plainTitle.slice(1)}, and save a Hunter search for one-time floor jobs on post.`,
    },
  },
  W9124727RA008: {
    limit: "AbilityOne: the headquarters custodial work is on the AbilityOne Procurement List, so it goes to nonprofit agencies by law.",
    kind: "disqualifier",
    decides: true,
    phrase: "the AbilityOne list",
    change: "If the work comes off the Procurement List, I'd look at it again, but it would still be nearly your whole revenue.",
    trail: "Who can quote: **AbilityOne nonprofit agencies only**. A commercial firm can't.",
    read: ABILITYONE_READ,
    roadmap: {
      item: "The **exterior and specialty work** Fort Bragg buys from firms like yours",
      why: "Custodial and grounds at Fort Bragg are AbilityOne work. DPW's pressure washing and the one-time floor jobs are open to you.",
      takes: `Bid the ${hero.plainTitle.charAt(0).toLowerCase()}${hero.plainTitle.slice(1)}.`,
    },
  },
  "36C24627Q0083": {
    limit: "Set-aside: only service-disabled veteran-owned firms can quote. You are HUBZone and small, not veteran-owned.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If the VA reposts this open to HUBZone or small businesses, I'd run the checks again.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can quote, and 44 did last time. You are not veteran-owned, so you can't hold this contract.",
      bold: "you can't hold this contract",
    },
    roadmap: {
      item: "Floor care as a **subcontractor** to a veteran-owned prime",
      why: "VA janitorial near you is veteran-owned first. You did floor care at two VA clinics as a subcontractor before.",
      takes: "Ask your past veteran-owned prime whether it is quoting this, and offer your floor crew.",
    },
  },
  W912PM27QA009: {
    limit: "Set-aside: only service-disabled veteran-owned firms can quote. You are not veteran-owned.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If the Corps reposts this open to small businesses, I'd run the checks again.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can quote, and you are not one.",
      bold: "you are not one",
    },
  },
  HQC00827R0012: {
    limit: "Set-aside: only service-disabled veteran-owned firms can bid, and most of the work is shelf stocking.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If the agency splits the custodial work out, open to small businesses, I'd look at that part.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can bid, and you are not one. Most of the work is stocking shelves besides.",
      bold: "you are not one",
    },
  },
  "47PE0627Q0011": {
    limit: "Set-aside: only 8(a) firms can quote. You are HUBZone, not 8(a).",
    kind: "disqualifier",
    decides: true,
    phrase: "the 8(a) set-aside",
    change: "If GSA reposts this open to HUBZone or small businesses, I'd run the checks again.",
    trail: "Set-aside: **8(a) firms only**. You are not in the program.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only 8(a) firms can quote. You are HUBZone, not 8(a), so you can't hold this contract.",
      bold: "you can't hold this contract",
    },
  },
};

export const VOCAB: GrantVocab = {
  base: "your office",
  crew: "your crews",
  teamOf: `a ${STAFF}-person firm`,
  peers: "cleaning firms",
  bigWork: "federal cleaning work",
  nearRun: "Your crews can drive out each night and be home the same night.",
  farTrip: "Each shift there is a long drive for your crews, or a motel bill.",
  travelCost: "drive time and fuel for your crews",
  frontCost: "you hire, train and carry payroll",
  priceAdvice: "Price from your real crew hours, the wage determination's rates and your chemicals. A site this close keeps travel cost low.",
  fitsWin: "A win fits the crews you have.",
  canRun: `Your ${STAFF}-person firm can run this work with the crews you have.`,
  fitsYou: "your crews and your size",
  edge: "local night crews, already badged, close to the site",
  cashLine: "A **credit line** for weekly payroll",
  localPartner: "A local cleaning firm makes the nightly site work possible.",
  recordWhy: "A federal prime near your office, with a rating, is the record larger buyers look for.",
  firstMatch: `The ${hero.plainTitle}`,
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    (/Army|Air Force/.test(f.opp.agency) && /Fort Bragg|Pope|Seymour/.test(f.place.city)) ||
    /Transportation|Veterans/.test(f.opp.agency),
  wide: (f) => (/Statewide|Multiple/.test(f.place.city) ? "The sites run across the region. Your crews would cover the ones near Fayetteville." : null),

  cost: "your real crew hours and chemical costs",
  insuranceLine: "No bond is asked for. Your general liability insurance is on file, and it meets the notice.",
  nearLine: "That is close enough for your crews to drive out each night.",
  farLine: "Plan for drive time or a motel for the crews, and price it.",
  sizeFix: "Only with more crews or a partner. Night crews take weeks to hire and train, and weekly payroll against 30-day pay needs cash. Open Partners to find a prime who needs local crews.",
  partnerHint: (opp) =>
    /Army Reserve|Readiness|Seymour/.test(`${opp.title} ${opp.office}`) ? `${PARTNER.name} wants a local subcontractor for the North Carolina sites. ` : "",
  localQuestion: {
    question: (place) => `Could you run a crew out of **${place}**, or work with a local cleaning firm there?`,
    payoff: "A yes shows whether the **drive** is a real limit.",
    yes: { gist: "You said you can run a crew there or work with a local firm, so the distance is less of a limit.", ack: "Good. A local crew, or a local partner, makes the distance workable. Price the drive. I raised my confidence." },
    no: { gist: "You can't run a crew there, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A local firm there may be the way around it. My confidence stays where it was." },
  },
  reactions: Object.fromEntries(
    Object.values(CAVEATS).flatMap((c) => (c.question ? [[c.question.id, { yes: c.question.yes, no: c.question.no }]] : [])),
  ),

  eligibility: () => [
    "General liability insurance of $1M for each occurrence, and workers' compensation.",
    "A background check and a base pass or badge for each worker on a federal site.",
  ],
  collect: "Collect your insurance proof, your crew roster and three similar jobs.",
  attachments: "your insurance proof and three similar jobs",
  travelRisk: "Drive time and fuel for the crews add cost.",

  trade: "Building cleaning",
  // The demo states no size-standard figure for the firm's codes.
  sizeStandard: null,
  dueInClauses: dueTimeOf,
  clauses: (f, offer) => ({
    permit: null,
    certs: null,
    haccp: null,
    hours: f.isFederal
      ? "Recurring cleaning is done after the buyer's working hours, Monday to Friday. The contractor's supervisor is reachable from 7:00 AM to 3:30 PM on working days."
      : null,
    bond: null,
    ...(f.setAside && SET_ASIDE_CLAUSE[f.setAside] ? { setAside: SET_ASIDE_CLAUSE[f.setAside] } : {}),
    insurance: `The contractor shall carry commercial general liability insurance of $1,000,000 for each occurrence and $2,000,000 in total, automobile liability of $1,000,000, and workers' compensation at the legal limit. Proof is due with the ${offer}.`,
    access: f.isFederal
      ? "Each worker needs a background check and a base pass before the first shift. The contractor starts these checks within five days of award."
      : null,
  }),
  extraClauses: (f): ClausePatch[] => {
    const fed = f.isFederal;
    const work = fed ? "C" : "2";
    const terms = fed ? "H" : "5";
    return [
      { kind: "chemicals", section: work, ref: fed ? "C.7" : "2.9", heading: "Chemicals", text: "The contractor shall use cleaning products from the buyer's approved list and keep a safety data sheet on site for each one." },
      { kind: "qualityControl", section: work, ref: fed ? "C.8" : "2.10", heading: "Quality control", text: "The contractor shall keep a quality control plan, inspect its own work each week, and fix any finding within one working day." },
      {
        kind: "keyPersonnel",
        section: terms,
        ref: `${terms}.6`,
        heading: "Key personnel",
        text: "The contractor shall name a project manager and a quality control manager, and tell the contracting officer before replacing either one.",
      },
    ];
  },
  wageRows: WAGE_ROWS,
  priceOnlyWin: "The lowest price from a qualified bidder wins. Local night crews and no travel keep yours down.",
  priceOnlyMoney: "A price-only bid is won on price. Build it from real crew hours and the wage floor, or walk away.",
  offTrade: {
    item: "A contract in **building cleaning**",
    why: "This notice is not cleaning work, so it does not build the record you want.",
  },
};
