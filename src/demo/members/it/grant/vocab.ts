// THE IT SERVICES FIRM's words for Grant's generated reviews (read through
// src/demo/grant/vocab.ts), and the risks the story's one-liners name for a few
// of its opportunities.
//
// Gallberry Technology Group is a 16-person 8(a) IT services firm on Raeford Road
// in Fayetteville (persona.ts): 11 techs, 2 network admins and a security officer,
// with a second crew on site at Seymour Johnson AFB. Its techs work at the
// buyer's desks, so distance is the daily drive to the site. It carries no bond
// and has no credit line. It holds GSA MAS (SIN 54151S) but no seat on the
// Army's or GSA's closed IT contracts.

import { dueTimeOf } from "../../../story/opportunities";
import { PARTNER, STAFF } from "../../../grant/facts";
import type { Caveat } from "../../../grant/generator";
import type { ClausePatch } from "../../../grant/solicitation";
import type { GrantVocab } from "../../../grant/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** Sample rates in the shape of SCA wage determination 2015-4377, Rev. 33 (Cumberland and Hoke counties). */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Personal Computer Support Technician", "$37.50", "$5.92"],
  ["Computer Systems Support Specialist", "$41.53", "$5.92"],
  ["Computer Operator I", "$27.06", "$5.92"],
  ["Computer Operator II", "$30.27", "$5.92"],
  ["Computer Operator III", "$33.76", "$5.92"],
  ["Peripheral Equipment Operator", "$27.06", "$5.92"],
];

/** The set-asides the shared clause text does not word. An 8(a) notice is competed unless it says it is going to one firm. */
function setAsideClause(code: string, title: string): string | undefined {
  if (code === "8A")
    return /sole source/i.test(title)
      ? "This requirement is reserved for a firm in the SBA's 8(a) Business Development Program. The buyer intends to award it to one 8(a) firm without competition."
      : "This requirement is a competitive set-aside for firms in the SBA's 8(a) Business Development Program under 13 CFR 124. Only firms in the program at the time of the offer and at award can compete.";
  if (code === "SDVOSBC")
    return "This requirement is a set-aside for service-disabled veteran-owned small businesses under 38 U.S.C. 8127. Only firms listed as SDVOSB in SBA's certification database at the time of the offer can compete.";
  if (code === "HZC")
    return "This requirement is a set-aside for HUBZone small businesses under 13 CFR 126. Only firms that SBA certifies as HUBZone at the time of the offer and at award can compete.";
  return undefined;
}

/** A Defense notice, where CMMC applies. */
const isDefense = (agency: string): boolean => /Army|Navy|Air Force|Defense/.test(agency);

/** Risks the story's one-liners name that the facts alone do not show. */
export const CAVEATS: Record<string, Caveat> = {
  FA480927Q0006: {
    limit: "Your rating: the squadron rated you Very Good. Send the interim CPARS with the quote, and price the techs at or above the wage floor.",
    kind: "proposal-weakness",
    change: "If the squadron adds seats or a new imaging surge in an amendment, I'd check the staffing again.",
    ref: "pp-sjafb-desktop-support",
  },
  FA445227R0004: {
    limit: "The reply: the last two contracts went to one firm without competition. Two or more capable 8(a) replies can turn the next one into a competition.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "the reply",
    change: "If your Seymour Johnson rating and two similar jobs are ready to send, I'd tell you to answer it this week.",
    ref: "pp-sjafb-desktop-support",
    question: {
      id: "pope-reply",
      question: "Is your **Seymour Johnson CPARS** ready to send with the reply?",
      payoff: "A yes shows whether **the reply** is ready.",
      chip: "reply",
      yes: { gist: "Your Seymour Johnson rating is ready, so the reply can go this week.", ack: "Good. Send it with two similar jobs well before it closes. Diana wants 20 minutes on it first. I raised my confidence." },
      no: { gist: "Your Seymour Johnson rating is not ready, so the reply stays the thing to fix.", ack: "Then ask the squadron for the interim rating this week. Without it your reply is weaker. My confidence stays where it was." },
    },
  },
  "FAY-IT-2027-03": {
    limit: "Hours: the city wants cover 24 hours a day, every day. You staff weekdays.",
    kind: "responsibility",
    decides: true,
    phrase: "the 24-hour cover",
    change: "If you can staff nights, weekends and holidays, or the city takes weekdays only, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Your techs can take the calls. The city wants them answered 24 hours a day, every day, and you staff weekdays.",
      bold: "you staff weekdays",
    },
    question: {
      id: "after-hours",
      question: "Could you staff **nights, weekends and holidays**?",
      payoff: "A yes shows whether **the 24-hour cover** is a real limit.",
      chip: "hours",
      yes: { gist: "You can staff nights, weekends and holidays, so the 24-hour cover is less of a limit.", ack: "Good. Price the night shifts at their real cost. I raised my confidence." },
      no: { gist: "You can't staff nights and weekends, so the 24-hour cover stays a real limit.", ack: "Then ask the city in Q&A whether it would split weekdays from nights. My confidence stays where it was." },
    },
  },
  "40-RQ27003152": {
    limit: "E-Rate: the contract needs an E-Rate service provider number and partner status with a network maker. You have neither.",
    kind: "responsibility",
    decides: true,
    phrase: "the E-Rate provider number",
    change: "If you get an E-Rate provider number and a maker's partner status before it closes, I'd move this to **Bid**.",
    question: {
      id: "erate-spin",
      question: "Do you have an **E-Rate service provider number**?",
      payoff: "A yes shows whether **the E-Rate provider number** is a real limit.",
      chip: "E-Rate",
      yes: { gist: "You have an E-Rate service provider number, so that part is less of a limit.", ack: "Good. Then the maker's partner status is the last piece. I raised my confidence." },
      no: { gist: "You don't have an E-Rate service provider number, so it stays a real limit.", ack: "Then this one is a stretch for this cycle. The number takes a form and a few weeks. My confidence stays where it was." },
    },
  },
  W912HQ27Q0007: {
    limit: "Gear: most of the price is displays, cameras and codecs. Get a firm quote from an audio-visual supplier before you price.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the equipment quote",
    change: "If an audio-visual supplier gives you a firm quote held through award, I'd move this to **Bid**.",
    read: {
      name: "Will you make money?",
      rating: "watch",
      text: "Most of the price is gear, not labor. Without a firm supplier quote, your margin is a guess.",
      bold: "your margin is a guess",
    },
    question: {
      id: "av-quote",
      question: "Do you have a **firm quote** from an audio-visual supplier?",
      payoff: "A yes shows whether **the equipment quote** is a real limit.",
      chip: "quote",
      yes: { gist: "You have a firm supplier quote, so the gear price is less of a limit.", ack: "Good. Price the labor on top of it and send the quote. I raised my confidence." },
      no: { gist: "You don't have a firm supplier quote, so the gear price stays a real limit.", ack: "Then ask two suppliers this week. 12 days is short for a gear job. My confidence stays where it was." },
    },
  },
  "W91242-27-Q-0021": {
    limit: "Resale: most of the price is phone and internet lines you would resell, and the last two orders went through ITES-3S.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the line resale",
    change: "If the Guard posts the support work apart from the lines, I'd move this to **Bid**.",
    read: {
      name: "Will you make money?",
      rating: "watch",
      text: "Most of the money passes through to the carriers. Your share is the small support part, so the margin is thin.",
      bold: "the margin is thin",
    },
    question: {
      id: "carrier-resale",
      question: "Do you have an agreement with a **carrier** to resell its lines?",
      payoff: "A yes shows whether **the line resale** is a real limit.",
      chip: "carrier",
      yes: { gist: "You have a carrier agreement, so the resale is less of a limit.", ack: "Good. Price the lines at cost and the support at your real rates. I raised my confidence." },
      no: { gist: "You have no carrier agreement, so the resale stays a real limit.", ack: "Then this is mostly another firm's product. My confidence stays where it was." },
    },
  },
  "CUMCO-IT-2027-02": {
    limit: "Hardware: most of the price is switches. A network maker's partner price decides who wins.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the switch price",
    change: "If a maker's partner gives you a held quote for the switches, I'd move this to **Bid**.",
    question: {
      id: "switch-quote",
      question: "Do you have a **held quote** for the switches from a maker's partner?",
      payoff: "A yes shows whether **the switch price** is a real limit.",
      chip: "quote",
      yes: { gist: "You have a held switch quote, so the hardware price is less of a limit.", ack: "Good. Then your admins' labor is what you price. I raised my confidence." },
      no: { gist: "You don't have a held switch quote, so the hardware price stays a real limit.", ack: "Then ask a maker's partner this week. Without it you can't price the job. My confidence stays where it was." },
    },
  },
  "FSU-IT-2027-05": {
    limit: "Certification: the university wants installers certified by the Wi-Fi maker it names. No one on your team holds that certification.",
    kind: "responsibility",
    decides: true,
    phrase: "the maker's certification",
    change: "If the university accepts an equal maker, or a certified partner installs under you, I'd move this to **Bid**.",
    question: {
      id: "wifi-cert",
      question: "Could a **certified partner** install the access points under you?",
      payoff: "A yes shows whether **the maker's certification** is a real limit.",
      chip: "partner",
      yes: { gist: "A certified partner can install under you, so the certification is less of a limit.", ack: "Good. Name the partner and its certification in the bid. I raised my confidence." },
      no: { gist: "No certified partner can install under you, so the certification stays a real limit.", ack: "Then the certification stays a real limit for this bid. My confidence stays where it was." },
    },
  },
  "PWC-2027-IT-07": {
    limit: "Testers: the work covers the utility's control systems, and no one on your team holds a penetration-testing certification.",
    kind: "responsibility",
    decides: true,
    phrase: "the testers' certifications",
    change: "If you team with a security firm whose testers hold the certification, I'd look at it again as the prime with a sub.",
    question: {
      id: "pen-partner",
      question: "Could you team with a **security firm** whose testers hold the certification?",
      payoff: "A yes shows whether **the testers' certifications** are a real limit.",
      chip: "partner",
      yes: { gist: "You can team with a security firm with certified testers, so the certifications are less of a limit.", ack: "Good. Name its testers in the proposal, and keep the report and the project lead yours. I raised my confidence." },
      no: { gist: "You can't team with certified testers, so the certifications stay a real limit.", ack: "Then skip this one. A test on control systems needs certified testers. My confidence stays where it was." },
    },
  },
  "W91247-27-R-0009": {
    limit: "Who can bid: only holders of the Army's ITES-3S contract can bid, and each year is more than your revenue.",
    kind: "disqualifier",
    decides: true,
    phrase: "the ITES-3S lock",
    change: "If the Army moves this work off ITES-3S, I'd run the checks again, but the size still points to a subcontract.",
    trail: "Who can bid: **ITES-3S holders only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only holders of the Army's ITES-3S contract can bid, and ITES-3S takes no new firms. You can't send a proposal.",
      bold: "You can't send a proposal",
    },
    roadmap: {
      item: "A team for **ITES-4S**, the Army's next IT contract",
      why: "Most Fort Bragg IT support of this size is ordered through the Army's IT contracts. A seat on the next one is how you see these orders.",
      takes: "A partner or a mentor-protégé joint venture before the ITES-4S proposals are due. Ask Diana where to start.",
    },
  },
  M6785427R4902: {
    limit: "Sole source: the Marine Corps plans to give this work to one 8(a) firm without competition.",
    kind: "disqualifier",
    decides: true,
    phrase: "the sole-source award",
    change: "If the Marine Corps cancels the sole-source plan and competes the work, I'd run the checks again.",
    trail: "Who can bid: **no one**. It goes to one 8(a) firm without competition.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "The Marine Corps plans to give this work to one 8(a) firm without competition. There is nothing to bid.",
      bold: "There is nothing to bid",
    },
    roadmap: {
      item: "A **subcontract** with the 8(a) firm",
      why: "A base network this size needs local techs. The firm that gets it may need a team near Camp Lejeune.",
      takes: "A call to the firm once the award posts. Diana can tell you how to make it.",
    },
  },
  "36C24627Q0187": {
    limit: "Set-aside: only service-disabled veteran-owned firms can quote. You are 8(a) and small, not veteran-owned.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If the VA reposts this open to small businesses, I'd run the checks again.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can quote. You are 8(a) and small, not veteran-owned, so you can't hold this contract.",
      bold: "you can't hold this contract",
    },
  },
  "W91247-27-Q-0152": {
    limit: "Set-aside: only service-disabled veteran-owned firms can quote. You are 8(a) and small, not veteran-owned.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If a veteran-owned firm asks you to run the SharePoint work as its sub, I'd look at that as a subcontract.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can quote, and you are not one. Your Microsoft 365 admins could do the work as a sub.",
      bold: "you are not one",
    },
  },
};

export const VOCAB: GrantVocab = {
  base: "your office",
  crew: "your firm",
  teamOf: `a ${STAFF}-person firm`,
  peers: "IT firms",
  bigWork: "federal IT support",
  nearRun: "Your techs can drive in each morning, and a spare can cover a sick day.",
  farTrip: "Techs on site every day there means hiring near the site, or a long daily drive.",
  travelCost: "drive time and per diem for your techs",
  frontCost: "you hire the techs and carry their payroll",
  priceAdvice: "Price from your techs' real pay and overhead. On federal work, no tech goes below the wage determination's rate.",
  fitsWin: "A win fits the techs you have, with a hire or two.",
  canRun: `Your ${STAFF}-person firm can staff this with the techs you have and a hire or two.`,
  fitsYou: "your techs and your size",
  edge: "Security+ techs who already work Army and Air Force tickets, close to the site",
  cashLine: "A **credit line** for the payroll before the first payment",
  localPartner: "A local partner makes the daily on-site work possible.",
  recordWhy: "A federal prime near your office, with a rating, is the record the Army's next IT contracts look for.",
  firstMatch: `The ${hero.plainTitle}`,
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    (/Army|Air Force|Defense Health/.test(f.opp.agency) && /Fort Bragg|Pope|Goldsboro|Seymour/.test(f.place.city)) ||
    /National Guard/.test(f.opp.office),
  wide: () => null,

  cost: "your real tech pay and overhead",
  insuranceLine: "No bond is asked for. Your general liability insurance is on file, and it meets the notice.",
  nearLine: "That is close enough for your techs to drive in each morning.",
  farLine: "Plan for a tech who lives near the site, or price the drive and per diem.",
  sizeFix: "Only with a partner or more techs. Hiring takes weeks, and you have no credit line to carry the payroll. Open Partners to find a prime that needs local techs.",
  partnerHint: (opp) => (/Defense Health/.test(opp.agency) ? `${PARTNER.name} wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. ` : ""),
  localQuestion: {
    question: (place) => `Could you hire a tech who lives near **${place}**, or work with a local partner?`,
    payoff: "A yes shows whether the **drive** is a real limit.",
    yes: { gist: "You said you can hire near the site or work with a local partner, so the distance is less of a limit.", ack: "Good. A tech who lives near the site, or a local partner, makes the distance workable. I raised my confidence." },
    no: { gist: "You can't hire near the site or work with a local partner, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A partner near the site may be the way around it. My confidence stays where it was." },
  },
  reactions: Object.fromEntries(
    Object.values(CAVEATS).flatMap((c) => (c.question ? [[c.question.id, { yes: c.question.yes, no: c.question.no }]] : [])),
  ),

  eligibility: () => [
    "Security+ or an equal DoD 8140 certification for techs with admin rights, where the notice asks for it.",
    "General liability insurance of $1M for each occurrence, and workers' compensation.",
  ],
  collect: "Collect your techs' certifications, insurance proof and references.",
  attachments: "your techs' certifications, résumés and references",
  travelRisk: "Drive time and per diem for the techs add cost.",

  trade: "IT services",
  // The demo states no size-standard figure for the firm's codes.
  sizeStandard: null,
  dueInClauses: dueTimeOf,
  clauses: (f, offer) => {
    const sa = f.setAside ? setAsideClause(f.setAside, f.opp.title) : undefined;
    const out: Record<string, string | null> = {
      permit: null,
      certs: null,
      haccp: null,
      hours: null,
      // IT services carry no bond.
      bond: null,
      ...(sa ? { setAside: sa } : {}),
      insurance: `The contractor shall carry commercial general liability insurance of $1,000,000 for each occurrence and $2,000,000 in total, and workers' compensation at the legal limit. Proof is due with the ${offer}.`,
      access: f.isFederal
        ? "Each tech needs a background check and base access before the first day on site, and a Common Access Card where the work needs network access. The contractor starts these checks within five days of award."
        : null,
    };
    if (offer === "quote") out.content = "The quote has three parts: the price schedule, a technical plan of up to five pages with a staffing plan, and résumés and certifications for the named staff.";
    if (offer === "proposal") out.content = "The proposal has three parts: a technical volume (up to ten pages) with a staffing plan, a past performance volume with three references, and the price schedule.";
    return out;
  },
  extraClauses: (f): ClausePatch[] => {
    const fed = f.isFederal;
    const work = fed ? "C" : "2";
    const terms = fed ? "H" : "5";
    const out: ClausePatch[] = [
      { kind: "tickets", section: work, ref: `${work}.4`, heading: "Tickets and response times", text: "The contractor shall log every request in the buyer's ticketing system, meet the response time for each priority, and send a monthly report of tickets opened, closed and aged." },
      {
        kind: "security",
        section: work,
        ref: `${work}.5`,
        heading: fed ? "Certifications for admin rights" : "Data and accounts",
        text: fed
          ? "Each person with privileged (admin) access shall hold a DoD 8140 baseline certification, such as CompTIA Security+, before that access is granted."
          : "The contractor shall protect the buyer's data and accounts, use multi-factor sign-in on every admin account, and follow the buyer's IT policies.",
      },
      { kind: "property", section: terms, ref: `${terms}.6`, heading: "Equipment", text: "The buyer furnishes the computers, phones and tools that stay on its site. The contractor returns them, and every badge and account, at the end of the contract." },
    ];
    if (fed && isDefense(f.opp.agency))
      out.push({ kind: "cmmc", section: terms, ref: `${terms}.7`, heading: "CMMC", text: "The contractor shall have a current CMMC Level 1 (Self) status in SPRS at award and keep it through the contract (DFARS 252.204-7021)." });
    return out;
  },
  wageRows: WAGE_ROWS,
  priceOnlyWin: "The lowest price from a qualified bidder wins. Resellers and installers with a maker's best price usually set it.",
  priceOnlyMoney: "A sealed bid is won on price. Price from a held equipment quote and your techs' real hours, or walk away.",
  offTrade: {
    item: "A contract in **IT services**",
    why: "This notice is mostly products, not the support work your techs do, so it does not build the record you want.",
  },
};
