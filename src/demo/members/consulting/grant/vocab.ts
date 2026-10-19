// THE CONSULTANT's words for Grant's generated reviews (read through src/demo/grant/vocab.ts),
// and the risks the story's one-liners name for a few of its opportunities.
//
// Coppervale Advisory Group is an 11-person service-disabled veteran-owned
// consulting firm on Green St in Fayetteville, with 7 contract (1099)
// facilitators and a 30-seat training room (persona.ts). It carries no bond and
// runs its work at the buyer's sites, so distance is travel for class and
// session days.
//
// Whether a 1099 facilitator counts as a subcontractor turns on SBA's employee
// test (13 CFR 121.106), so Grant says "may count", never "counts".

import { dueTimeOf } from "../../../story/opportunities";
import { PARTNER, STAFF, type OppFacts } from "../../../grant/facts";
import type { Caveat } from "../../../grant/generator";
import type { ClausePatch } from "../../../grant/solicitation";
import type { GrantVocab } from "../../../grant/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** "Multiple sites (NC, VA, SC, GA, FL)" → "NC, VA, SC, GA and FL", for work that is not tied to one place. */
function areaOf(f: OppFacts): string | null {
  if (!/^Multiple/.test(f.place.city)) return null;
  const states = /\(([^)]+)\)/.exec(f.place.city)?.[1].split(/,\s*/);
  if (!states) return "all of North Carolina";
  return `${states.slice(0, -1).join(", ")} and ${states[states.length - 1]}`;
}

/** Sample rates in the shape of Service Contract Act wage determination 2015-4377 (Cumberland and Hoke counties). */
const WAGE_ROWS: string[][] = [
  ["Occupation", "Hourly rate", "Health and welfare"],
  ["Administrative Assistant", "$32.13", "$5.92"],
  ["Personnel Assistant (Employment) II", "$22.18", "$5.92"],
  ["Technical Instructor", "$26.48", "$5.92"],
  ["Technical Instructor/Course Developer", "$32.40", "$5.92"],
  ["Computer Based Training Specialist/Instructor", "$35.23", "$5.92"],
];

const isVa = (f: OppFacts): boolean => /Veterans/.test(f.opp.agency);

/** The set-aside clause for a service-disabled veteran-owned set-aside, which the shared text does not word. */
function sdvosbClause(f: OppFacts): string {
  return isVa(f)
    ? "This requirement is a set-aside for service-disabled veteran-owned small businesses under 38 U.S.C. 8127 and VAAR 852.219-73 (Veterans First). Only firms listed as SDVOSB in SBA's certification database at the time of the offer and at award can compete."
    : "This requirement is a set-aside for service-disabled veteran-owned small businesses under FAR 19.14 and 52.219-27. Only firms that SBA certifies as SDVOSB at the time of the offer can compete.";
}

/** VA's limit on subcontracting for services, as the certificate states it. */
const VA_SUBCONTRACTING =
  "VAAR 852.219-75 applies. The contractor shall not pay more than 50 percent of the amount paid by the government to firms that are not certified service-disabled or veteran-owned small businesses. The offeror signs the limitations on subcontracting certificate and sends it with the quote, and VA may ask for proof during performance.";

/** Risks the story's one-liners name that the facts alone do not show. */
export const CAVEATS: Record<string, Caveat> = {
  "W91247-27-Q-0139": {
    limit: "Performance rating: your Fort Bragg ACS job has no performance rating yet. Ask the contracting officer for an interim rating before you send the quote.",
    kind: "proposal-weakness",
    change: "If the interim rating isn't in before the due date, I'd lead with the 38-to-14-minute result and your ACS contact instead.",
    ref: "pp-acs-lean-review",
  },
  "W91247-27-R-0034": {
    limit: "Hiring: full-time analysts for five years, at about 60% of your revenue. You would hire most of them before the first day.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the hiring plan",
    change: "If you can name the analysts you'd hire and your wrap rate holds, I'd move this to **Bid**.",
    read: {
      name: "Can you survive winning?",
      rating: "watch",
      text: "A win means hiring full-time analysts before the first day and carrying their pay until the Army pays. Know who you would hire before you price it.",
      bold: "Know who you would hire",
    },
    question: {
      id: "hiring-plan",
      question: "Could you name the **analysts you would hire** if you won?",
      payoff: "A yes shows whether the **hiring plan** is a real limit.",
      chip: "hiring",
      yes: { gist: "You can name the analysts you'd hire, so the hiring plan is less of a limit.", ack: "Good. Named people and a real wrap rate make the prime path workable. I raised my confidence." },
      no: { gist: "You can't name the analysts yet, so the hiring plan stays a real limit.", ack: "Then the hiring plan stays a real limit. Talk it through with Sarah before you price it. My confidence stays where it was." },
    },
  },
  "W91247-27-Q-0158": {
    limit: "License: every assessor must be a licensed psychologist with a doctorate. No one on your staff is.",
    kind: "disqualifier",
    decides: true,
    phrase: "the psychologist license",
    change: "If the Army drops the license rule for the coaching part, I'd look at that part again.",
    trail: "Who can assess: **licensed psychologists only**. No one on your staff is one.",
    read: {
      name: "Can you do the work?",
      rating: "weak",
      text: "Every assessor must hold a doctorate in clinical or counseling psychology and a state license. Your coaches hold ICF credentials, not that license.",
      bold: "not that license",
    },
    roadmap: {
      item: "A **licensed partner** for clinical assessments",
      why: "Army leader assessments that need a psychologist come up every few years. A licensed firm may want you for the coaching and the classes.",
      takes: "Ask Sarah which licensed firms bid Fort Bragg assessments, and offer them your coaches.",
    },
  },
  "36C24627Q0118": {
    limit: "Licensed course: only the publisher's licensed partners may teach this brand-name course.",
    kind: "disqualifier",
    decides: true,
    phrase: "the publisher's license",
    change: "If the VA opens the buy to an equal course, I'd run the checks again.",
    trail: "Who can teach: **the publisher's licensed partners only**.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "The VA asks for one brand-name course, and only the publisher's licensed partners may teach it. You are not one, so you can't quote.",
      bold: "you can't quote",
    },
    roadmap: {
      item: "A **course of your own** VA can buy",
      why: "VA buys communication and leadership classes often. Your own course, with your own results, competes where a brand-name one is not required.",
      takes: "Package your supervisor course with its results, and show it on your capability statement.",
    },
  },
  "36C24627Q0133": {
    limit: "Schedule: the VA sends this request through GSA eBuy to GSA schedule holders only. You are not on a schedule.",
    kind: "disqualifier",
    decides: true,
    phrase: "the GSA schedule",
    change: "If the VA posts this work outside eBuy, open to veteran-owned firms, I'd run the checks again. The size would still point to a partner.",
    trail: "Who can quote: **GSA schedule holders only**, through GSA eBuy.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only GSA schedule holders can quote: the VA sends this request through GSA eBuy. You are not on a schedule, so you can't send a quote.",
      bold: "You are not on a schedule",
    },
    roadmap: {
      item: "A **GSA schedule** of your own",
      why: "Much of the VA's and the Army's consulting near you is ordered off GSA schedules. With 8 years in business you meet GSA's two-year rule for an offer.",
      takes: "An offer under the Professional Services and Human Capital categories: two years of financials, three references and a few months of review.",
    },
  },
  "36C24627Q0141": {
    limit: "Kind of work: these are contract specialists who buy for the VA. That is contracting staff, not consulting or training.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "the kind of work",
    change: "If the VA splits out training for its contracting staff, I'd look at that part.",
    read: {
      name: "Is it your kind of work?",
      rating: "weak",
      text: "The VA wants contract specialists in seats, writing and awarding its contracts. Your firm runs programs and reviews, not contracting staff.",
      bold: "not contracting staff",
    },
  },
  "FSU-OD-2027-04": {
    limit: "References: the university asks for three campus projects. You have none yet.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "the campus references",
    change: "If the university accepts a public-sector review in place of a campus one, I'd move this to **Bid**.",
    question: {
      id: "campus-reference",
      question: "Would the university take your **Fort Bragg ACS review** in place of a campus project?",
      payoff: "A yes shows whether the **campus references** are a real limit.",
      chip: "reference",
      yes: { gist: "The university would take a public-sector review, so the campus references are less of a limit.", ack: "Good. Lead with the ACS review and its wait-time result. I raised my confidence." },
      no: { gist: "The university wants campus projects only, so the references stay a real limit.", ack: "Then the references stay a real limit. Team with a firm that has done campus work, or pass. My confidence stays where it was." },
    },
  },
  "OSHR-TD-2027-02": {
    limit: "Size: a statewide curriculum at about twice your usual job, for a buyer you haven't worked for.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the statewide size",
    change: "If you can free two staff for the year, or team with a curriculum firm, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "It's your work, but statewide: a curriculum for every state agency's supervisors. Your 11 staff would carry it alongside the VA program.",
      bold: "alongside the VA program",
    },
    question: {
      id: "statewide-team",
      question: "Could you free **two staff for a year** for a statewide curriculum?",
      payoff: "A yes shows whether the **statewide size** is a real limit.",
      chip: "staff",
      yes: { gist: "You can free two staff for the year, so the size is less of a limit.", ack: "Good. Two people on it all year makes it workable. I raised my confidence." },
      no: { gist: "You can't free two staff for the year, so the size stays a real limit.", ack: "Then finish the VA program first and use it as the reference next time. My confidence stays where it was." },
    },
  },
  "NCDHHS-OD-2027-06": {
    limit: "Skills: the review needs call-center data work, such as call volumes, wait times and staffing models. You would hire that skill in.",
    kind: "responsibility",
    decides: true,
    phrase: "the call-center data",
    change: "If you team with a call-center analyst, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Your Lean method fits, but a call center runs on volume and staffing data. Your analysts haven't modeled one.",
      bold: "haven't modeled one",
    },
    question: {
      id: "call-center-analyst",
      question: "Do you know a **call-center analyst** you could team with?",
      payoff: "A yes shows whether the **call-center data** is a real limit.",
      chip: "data",
      yes: { gist: "You know a call-center analyst to team with, so the data work is less of a limit.", ack: "Good. Your Lean method plus their data model is a strong team. I raised my confidence." },
      no: { gist: "You don't have a call-center analyst, so the data work stays a real limit.", ack: "Then the data work stays a real limit. Ask Sarah who has done state call-center reviews. My confidence stays where it was." },
    },
  },
  "DURPS-SP-2027-03": {
    limit: "Reference: the district wants a school strategic plan on your record. Yours are for a town and a hospital.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "the school reference",
    change: "If the district counts your Hope Mills plan as similar work, I'd move this to **Bid**.",
    question: {
      id: "school-reference",
      question: "Would the district count your **Hope Mills plan** as similar work?",
      payoff: "A yes shows whether the **school reference** is a real limit.",
      chip: "reference",
      yes: { gist: "The district would count your town plan, so the school reference is less of a limit.", ack: "Good. Lead with the public workshops and the board's vote. Plan the 85-mile trips. I raised my confidence." },
      no: { gist: "The district wants a school plan, so the reference stays a real limit.", ack: "Then the reference stays a real limit, with 85 miles on top. My confidence stays where it was." },
    },
  },
};

export const VOCAB: GrantVocab = {
  base: "your office",
  crew: "your firm",
  teamOf: `an ${STAFF}-person firm`,
  peers: "consulting firms",
  bigWork: "federal consulting work",
  nearRun: "Your facilitators can teach there and be home the same day.",
  farTrip: "Each class or session day there is a long drive, or a hotel night, for your facilitators.",
  travelCost: "travel and hotel nights for your facilitators",
  frontCost: "you staff up and carry payroll",
  priceAdvice: "Price from your real hours by person and the GSA medians for your labor categories. A site this close keeps travel cost low.",
  fitsWin: "A win fits the staff you have.",
  canRun: `Your ${STAFF}-person firm can run this work, with a contract facilitator in busy months.`,
  fitsYou: "your work and your size",
  edge: "a nearby office and a record with the same buyers",
  cashLine: "A **GSA schedule** and more staff on payroll",
  localPartner: "A local partner makes the class and session days possible.",
  recordWhy: "A second federal prime near your office, with a rating, is the record larger buyers and the GSA schedule offer look for.",
  firstMatch: `The ${hero.plainTitle}`,
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    /Veterans/.test(f.opp.agency) ||
    /National Guard/.test(f.opp.office) ||
    (/Army/.test(f.opp.agency) && /Fort Bragg/.test(f.place.city)),
  wide: (f) => {
    const area = areaOf(f);
    return area ? `The work covers ${area}. Online classes run from your office; only in-person classes need travel.` : null;
  },

  cost: "your real hours by person",
  insuranceLine: "No bond is asked for. Your general liability insurance is on file, and it meets the notice.",
  nearLine: "That is close enough for your facilitators to teach there and be home the same day.",
  farLine: "Plan class days around the drive, and price the hotel nights.",
  sizeFix: "Only with a partner or more staff on payroll. Hiring takes time, and on a set-aside contract facilitators may count against the limit on subcontracting. Open Partners to find a prime.",
  partnerHint: (opp) => (/Army/.test(opp.agency) && opp.scope === "fed" ? `${PARTNER.name} wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. ` : ""),
  localQuestion: {
    question: (place) => `Could you plan the **class and session days** in ${place}, or work with a facilitator there?`,
    payoff: "A yes shows whether the **drive** is a real limit.",
    yes: { gist: "You said you can plan the trips or work with a facilitator there, so the distance is less of a limit.", ack: "Good. Planned trips, or a facilitator on site, make the distance workable. Price the hotel nights. I raised my confidence." },
    no: { gist: "You cannot plan the trips or work with a facilitator there, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A partner on Partners may be the way around it. My confidence stays where it was." },
  },
  reactions: Object.fromEntries(
    Object.values(CAVEATS).flatMap((c) => (c.question ? [[c.question.id, { yes: c.question.yes, no: c.question.no }]] : [])),
  ),

  eligibility: () => [
    "Résumés for the key people the notice names.",
    "General liability insurance of $1M for each occurrence, and workers' compensation.",
  ],
  collect: "Collect résumés, insurance proof and references.",
  attachments: "résumés and references",
  travelRisk: "Travel for class and session days adds cost.",

  trade: "Consulting",
  // The demo states no size-standard figure for the consultant's codes.
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
      insurance: `The contractor shall carry commercial general liability insurance of $1,000,000 for each occurrence and $2,000,000 in total, and workers' compensation at the legal limit. Proof is due with the ${offer}.`,
      access: f.isFederal
        ? "Anyone who works on the buyer's site needs a background check and a base pass or site badge. The contractor starts these checks within five days of award."
        : null,
    };
    if (f.setAside === "SDVOSBC") out.setAside = sdvosbClause(f);
    if (offer === "quote") out.content = "The quote has three parts: the price schedule, a short technical plan (up to five pages) that names the key people, and two references for similar work.";
    if (offer === "proposal") out.content = "The proposal has three parts: a technical volume (up to ten pages) with résumés for the key people, a past performance volume with three references, and the price schedule.";
    if (area) out.place = `Classes run in person at sites in ${area}, and online. The buyer names the sites at award.`;
    return out;
  },
  extraClauses: (f): ClausePatch[] => {
    const fed = f.isFederal;
    const work = fed ? "C" : "2";
    const terms = fed ? "H" : "5";
    const out: ClausePatch[] = [
      { kind: "approval", section: work, ref: `${work}.4`, heading: "Approval of materials", text: "The contractor shall send course materials, session plans and draft reports to the buyer's representative for written approval before use." },
      { kind: "staff", section: work, ref: `${work}.5`, heading: "Key personnel", text: "The contractor shall name a project manager and a lead facilitator or lead analyst in the offer. A key person is replaced only with the buyer's written consent, by someone equally qualified." },
      { kind: "reports", section: work, ref: `${work}.6`, heading: "Reports", text: "The contractor shall send a monthly status report: work done, attendance where there are classes, results against the agreed measures, and open issues." },
      {
        kind: "rights",
        section: terms,
        ref: `${terms}.${fed ? 3 : 2}`,
        heading: "Rights in the work",
        text: `${fed ? "The Government owns" : "The buyer owns"} the reports, plans and course materials made under this contract, and may use them again. The contractor keeps the rights to tools it brought to the work.`,
      },
    ];
    if (fed && isVa(f) && f.setAside === "SDVOSBC") {
      out.push({ kind: "subcontracting", section: terms, ref: `${terms}.4`, heading: "Limitations on subcontracting", text: VA_SUBCONTRACTING });
    }
    return out;
  },
  wageRows: WAGE_ROWS,
  offTrade: {
    item: "A contract in **your own work**",
    why: "This notice is not leadership, Lean, planning or HR work, so it does not build the record you want.",
  },
};
