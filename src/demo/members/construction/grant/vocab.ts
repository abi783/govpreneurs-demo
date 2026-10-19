// THE CONTRACTOR's words for Grant's generated reviews (read through src/demo/grant/vocab.ts),
// and the risks the story's one-liners name for a few of its opportunities.
//
// Ninebark Builders is a 25-person HUBZone general contractor on Grove Street in
// Fayetteville (persona.ts): two electrical crews, two HVAC crews and a carpentry
// crew, bonded to $1.5M a job and $4M in total, with $2.9M in use. Its work is on
// site, so distance is drive time for the crews every day.

import { dueTimeOf } from "../../../story/opportunities";
import { PARTNER, STAFF, usd, type OppFacts } from "../../../grant/facts";
import type { Caveat } from "../../../grant/generator";
import type { ClausePatch } from "../../../grant/solicitation";
import type { GrantVocab } from "../../../grant/vocab";
import { HERO_IDS, OPPORTUNITIES } from "../opportunities";
import { PERSONA } from "../persona";

const hero = OPPORTUNITIES.find((o) => o.id === HERO_IDS.hero)!;

/** Sample rates in the shape of Davis-Bacon decision NC20260122 (Building, Cumberland and Hoke counties). */
const WAGE_ROWS: string[][] = [
  ["Classification", "Hourly rate", "Fringe"],
  ["Electrician", "$22.15", "$5.93"],
  ["Pipefitter", "$33.96", "$13.48"],
  ["Sheet metal worker", "$19.67", "$13.27"],
  ["Plumber", "$23.40", "$0.00"],
  ["Carpenter", "$19.80", "$4.89"],
  ["Laborer (common)", "$15.00", "$4.76"],
];

/** The set-asides the shared clause text does not word. */
const SET_ASIDE_CLAUSE: Record<string, string> = {
  HZC: "This requirement is a set-aside for HUBZone small businesses under 13 CFR 126. Only firms that SBA certifies as HUBZone at the time of the offer and at award can compete.",
  SDVOSBC:
    "This requirement is a set-aside for service-disabled veteran-owned small businesses under 38 U.S.C. 8127. Only firms listed as SDVOSB in SBA's certification database at the time of the offer can compete.",
  "8A": "This requirement is reserved for a firm in the SBA's 8(a) Business Development Program. The buyer intends to award it without competition.",
};

const LINE = PERSONA.bondLine!;
/** "$1.1M": what is left in his bond total. */
const bondRoom = () => usd(LINE.aggregate - LINE.inUse);

/** Risks the story's one-liners name that the facts alone do not show. */
export const CAVEATS: Record<string, Caveat> = {
  W912PM27B0006: {
    limit: `Bond room: you have ${bondRoom()} left in your bond total. With the training building job, this one would put you past it.`,
    kind: "winning-hurts",
    decides: true,
    phrase: "the bond room",
    change: "If your surety confirms in writing that it will bond both Fort Bragg jobs, I'd move this to **Bid**.",
    read: {
      name: "Can you survive winning?",
      rating: "watch",
      text: `About $450K, bonded. You have ${bondRoom()} of bond room, and the training building job uses most of it. Ask your surety about both before you bid.`,
      bold: "Ask your surety about both",
    },
    question: {
      id: "surety-both",
      question: "Has your surety agreed to bond **both Fort Bragg jobs**?",
      payoff: "A yes shows whether the **bond room** is a real limit.",
      chip: "bond",
      yes: { gist: "Your surety will bond both Fort Bragg jobs, so the bond room is less of a limit.", ack: "Good. With the surety's word in writing, both jobs fit your line. I raised my confidence." },
      no: { gist: "Your surety has not agreed to both jobs, so the bond room stays a real limit.", ack: "Then bid one of the two. The training building job is the better fit. My confidence stays where it was." },
    },
  },
  "173-27004": {
    limit: "Summer window: the work has to fit between the last school day and the first teacher workday, and the chiller lead time decides if it can.",
    kind: "responsibility",
    decides: true,
    phrase: "the summer window",
    change: "If the chiller supplier puts a delivery date before the last school day in writing, I'd move this to **Bid**.",
    ref: "pp-ccs-school-hvac",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "You did this district's 2024 summer job four days early. This one has a chiller, and its lead time decides whether the work fits the break.",
      bold: "its lead time decides",
    },
    question: {
      id: "chiller-date",
      question: "Do you have the chiller supplier's **delivery date in writing**?",
      payoff: "A yes shows whether the **summer window** is a real limit.",
      chip: "lead time",
      yes: { gist: "You have the chiller's delivery date in writing, so the summer window is less of a limit.", ack: "Good. A written date before the last school day makes the window workable. I raised my confidence." },
      no: { gist: "You don't have the chiller's delivery date in writing, so the summer window stays a real limit.", ack: "Then ask the supplier this week. Without the date, the summer window is a guess. My confidence stays where it was." },
    },
  },
  "FTCC-IFB-27-03": {
    limit: "Superintendent: this job runs in the same month as the Fort Bragg training building job, and you have one superintendent for both.",
    kind: "responsibility",
    decides: true,
    phrase: "the superintendent",
    change: "If you can name a second superintendent for this job, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Your crews can do the work, nights and weekends. It runs in the same month as the training building job, and one superintendent can't run both.",
      bold: "one superintendent can't run both",
    },
    question: {
      id: "second-super",
      question: "Could you name a **second superintendent** for this job?",
      payoff: "A yes shows whether the **superintendent** is a real limit.",
      chip: "staff",
      yes: { gist: "You can name a second superintendent, so running both jobs is less of a limit.", ack: "Good. A lead for each job is what lets both run. I raised my confidence." },
      no: { gist: "You can't name a second superintendent, so running both jobs stays a real limit.", ack: "Then pick one. The training building job is the better fit. My confidence stays where it was." },
    },
  },
  "6973GH-27-R-00031": {
    limit: "Competition: the last HVAC job at an FAA site near you drew 16 bids. Price it tight.",
    kind: "proposal-weakness",
    change: "If the FAA's equipment list changes in an amendment, I'd check the price again.",
  },
  FA480927Q0014: {
    limit: `Bond room: if you get the training building job, this one would top your $4M bond total.`,
    kind: "winning-hurts",
    change: "If your surety raises your total, or the training building job goes another way, I'd look at this again.",
  },
  "DAC-27-0412": {
    limit: "Secure site: escorts, tool counts and daily checks slow every day inside a prison.",
    kind: "responsibility",
    decides: true,
    phrase: "the secure-site rules",
    change: "If you price the slower days and your crews clear the state's checks, I'd move this to **Bid**.",
    read: {
      name: "Can you do the work?",
      rating: "watch",
      text: "Your electricians can do the work. Inside a prison, escorts, tool counts and daily checks slow every day, so price fewer hours of work per shift.",
      bold: "slow every day",
    },
    question: {
      id: "secure-site",
      question: "Can your crews work under **secure-site rules**: escorts, tool counts and daily checks?",
      payoff: "A yes shows whether the **secure-site rules** are a real limit.",
      chip: "site",
      yes: { gist: "Your crews can work under secure-site rules, so the site is less of a limit.", ack: "Good. Price the slower days and it can work. I raised my confidence." },
      no: { gist: "Your crews can't work under secure-site rules yet, so the site stays a real limit.", ack: "Then the site stays a real limit. Ask Sarah who has done state prison work. My confidence stays where it was." },
    },
  },
  "CC-27-06": {
    limit: "Bond room: if you get the training building job, this one would put you past your $4M bond total.",
    kind: "winning-hurts",
    decides: true,
    phrase: "the bond room",
    change: "If your surety confirms room for this and the training building job, I'd move this to **Bid**.",
    read: {
      name: "Can you survive winning?",
      rating: "watch",
      text: "About $600K, bonded. With the training building job it would put you past your $4M bond total. Ask your surety first.",
      bold: "Ask your surety first",
    },
    question: {
      id: "surety-county",
      question: "Has your surety confirmed room for **this and the training building job**?",
      payoff: "A yes shows whether the **bond room** is a real limit.",
      chip: "bond",
      yes: { gist: "Your surety has room for both jobs, so the bond room is less of a limit.", ack: "Good. Then this is a good local job to bid. I raised my confidence." },
      no: { gist: "Your surety has not confirmed room for both jobs, so the bond room stays a real limit.", ack: "Then wait for the training building result before you price this. My confidence stays where it was." },
    },
  },
  "W91247-27-R-0007": {
    limit: "The reply: Fort Bragg wants three similar jobs from the last six years, a surety letter and your ratings.",
    kind: "proposal-weakness",
    decides: true,
    phrase: "the reply package",
    change: "If you have the three jobs and the surety letter ready, I'd tell you to send the reply this week.",
    ref: "pp-pope-office-hvac",
    question: {
      id: "matoc-package",
      question: "Do you have **three similar jobs** from the last six years and a surety letter?",
      payoff: "A yes shows whether the **reply package** is ready.",
      chip: "package",
      yes: { gist: "You have three similar jobs and a surety letter, so the reply package is ready.", ack: "Good. Send the reply well before it closes; it is the way onto the MATOC. I raised my confidence." },
      no: { gist: "You don't have the reply package together yet, so it stays the thing to fix.", ack: "Then start with the surety letter; it takes the longest. Sarah's checklist covers the rest. My confidence stays where it was." },
    },
  },
  "36C24627B0009": {
    limit: "Set-aside: only service-disabled veteran-owned firms can bid. You are HUBZone and small, not veteran-owned.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If the VA reposts this open to HUBZone or small businesses, I'd run the checks again.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can bid. You are HUBZone and small, not veteran-owned, so you can't hold this contract.",
      bold: "you can't hold this contract",
    },
    roadmap: {
      item: "A **veteran-owned prime** to team with",
      why: "VA construction near you is veteran-owned first. A subcontract under a veteran-owned prime is how you get in.",
      takes: `Reply to ${PARTNER.contact} at ${PARTNER.name} about the fan coil job, and ask about this one too.`,
    },
  },
  "W91247-27-Q-0044": {
    limit: "8(a) award: the Army says this work is going to an 8(a) firm without competition.",
    kind: "disqualifier",
    decides: true,
    phrase: "the 8(a) award",
    change: "If the Army cancels the 8(a) award and competes the work, I'd run the checks again.",
    trail: "Who can bid: **no one**. It goes to an 8(a) firm without competition.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "The Army plans to give this work to an 8(a) firm without competition. There is nothing to bid.",
      bold: "There is nothing to bid",
    },
    roadmap: {
      item: "A **subcontract** with the 8(a) firm",
      why: "Most Fort Bragg trade jobs go to 8(a) firms without competition. The firm that gets one often needs electrical and HVAC crews.",
      takes: "Ask the 8(a) firm whether it needs your trades. Sarah can tell you how to make the call.",
    },
  },
  "36C77627R0015": {
    limit: "Set-aside: only service-disabled veteran-owned firms can bid, and the job is many times your bond line.",
    kind: "disqualifier",
    decides: true,
    phrase: "the veteran-owned set-aside",
    change: "If a veteran-owned prime asks for your electrical crews, I'd look at that as a subcontract.",
    trail: "Set-aside: **service-disabled veteran-owned firms only**. You are not one.",
    read: {
      name: "Can you win it?",
      rating: "weak",
      text: "Only service-disabled veteran-owned firms can bid, and you are not one. At $15M to $25M it is also far past your bond line.",
      bold: "you are not one",
    },
  },
};

export const VOCAB: GrantVocab = {
  base: "your shop",
  crew: "your firm",
  teamOf: `a ${STAFF}-person firm`,
  peers: "contractors",
  bigWork: "federal construction work",
  nearRun: "Your crews can drive out each morning and be back at the shop the same day.",
  farTrip: "Each day on site is a long drive for your crews, or a motel bill.",
  travelCost: "drive time and per diem for your crews",
  frontCost: "you buy the equipment and carry payroll",
  priceAdvice: "Price from your real crew hours, equipment quotes and the wage decision's rates. A site this close keeps travel cost low.",
  fitsWin: "A win fits the crews you have.",
  canRun: `Your ${STAFF}-person firm can run this work with the crews you have.`,
  fitsYou: "your trades and your size",
  edge: "your own electrical and HVAC crews, close to the site",
  cashLine: "More **bond room** and a credit line",
  localPartner: "A local subcontractor makes the daily site work possible.",
  recordWhy: "A federal prime near your shop, with a rating, is the record larger buyers and the Fort Bragg MATOCs look for.",
  firstMatch: `The ${hero.plainTitle}`,
  isTarget: (f) =>
    Boolean(f.opp.targetAgency) ||
    ((/Army|Air Force/.test(f.opp.agency)) && /Fort Bragg|Pope/.test(f.place.city)) ||
    /Cumberland County Schools|Fayetteville State/.test(f.opp.agency),
  wide: () => null,

  cost: "your real crew hours and equipment quotes",
  insuranceLine: "No bond is asked for here. Your general liability insurance is on file, and it meets the notice.",
  nearLine: "That is close enough for your crews to drive out each morning.",
  farLine: "Plan for drive time or a motel for the crews, and price it.",
  sizeFix: "Only with more bond room or a partner. A surety needs your latest financials to raise a line, and that takes weeks. Open Partners to find a prime who needs your trades.",
  partnerHint: (opp) => (/Veterans/.test(opp.agency) ? `${PARTNER.name} wants a HUBZone firm that self-performs the mechanical and electrical work at the Fayetteville VA. ` : ""),
  localQuestion: {
    question: (place) => `Could your crews stay near **${place}** for the job, or work with a local subcontractor?`,
    payoff: "A yes shows whether the **drive** is a real limit.",
    yes: { gist: "You said your crews can stay near the site or work with a local subcontractor, so the distance is less of a limit.", ack: "Good. Crews on site, or a local sub, make the distance workable. Price the per diem. I raised my confidence." },
    no: { gist: "Your crews can't stay near the site, so the distance stays a real limit.", ack: "Then the distance stays a real limit. A subcontractor near the site may be the way around it. My confidence stays where it was." },
  },
  reactions: Object.fromEntries(
    Object.values(CAVEATS).flatMap((c) => (c.question ? [[c.question.id, { yes: c.question.yes, no: c.question.no }]] : [])),
  ),

  eligibility: () => [
    "A North Carolina general contractor's license for the size of the job.",
    "Performance and payment bonds where the notice asks for them, from a surety on the Treasury's list.",
    "General liability insurance of $1M for each occurrence, and workers' compensation.",
  ],
  collect: "Collect your surety letter, insurance proof, license and three similar jobs.",
  attachments: "your bid bond, license and three similar jobs",
  travelRisk: "Drive time and per diem for the crews add cost.",

  trade: "Construction",
  // The demo states no size-standard figure for the contractor's codes.
  sizeStandard: null,
  dueInClauses: dueTimeOf,
  clauses: (f, offer) => {
    const value = f.mid ?? 0;
    const fed = f.isFederal;
    const bonded = fed ? value > 150_000 : value > 300_000;
    return {
      permit: null,
      certs: null,
      haccp: null,
      hours: null,
      ...(f.setAside && SET_ASIDE_CLAUSE[f.setAside] ? { setAside: SET_ASIDE_CLAUSE[f.setAside] } : {}),
      wage: fed
        ? "The Davis-Bacon Act applies. The contractor and every subcontractor shall pay at least the rates and fringe benefits in the wage decision at Attachment 2, and send certified payrolls each week."
        : null,
      insurance: `The contractor shall carry commercial general liability insurance of $1,000,000 for each occurrence and $2,000,000 in total, automobile liability of $1,000,000, and workers' compensation at the legal limit. Proof is due with the ${offer}.`,
      bond: bonded
        ? fed
          ? `${offer === "bid" ? "Each bid over $150,000 shall include a bid guarantee of 20 percent of the bid price. " : ""}The successful offeror shall give a performance bond and a payment bond, each equal to 100 percent of the contract price, from a surety on the Treasury's list. The bonds shall be in place before work starts.`
          : "Each bid shall include a bid bond of 5 percent of the bid. The successful bidder shall give performance and payment bonds, each equal to 100 percent of the contract price, under G.S. 44A-26."
        : null,
      access: fed
        ? "Each worker needs a background check and a base pass before the first day on site. The contractor starts these checks within five days of award."
        : null,
    };
  },
  extraClauses: (f): ClausePatch[] => {
    const fed = f.isFederal;
    const work = fed ? "C" : "2";
    const terms = fed ? "H" : "5";
    return [
      { kind: "submittals", section: work, ref: `${work}.4`, heading: "Submittals", text: "The contractor shall send product data and shop drawings for every piece of equipment for approval before ordering it." },
      { kind: "occupied", section: work, ref: `${work}.5`, heading: "Work in an occupied building", text: "The building stays in use during the work. The contractor shall book each outage of power, heating or cooling at least 14 days ahead, in writing." },
      { kind: "closeout", section: work, ref: `${work}.6`, heading: "Testing and closeout", text: "The contractor shall test and start up every system, train the building staff, and hand over as-built drawings, warranties and the operating manuals." },
      {
        kind: "qualityControl",
        section: terms,
        ref: `${terms}.6`,
        heading: "Quality control and safety",
        text: fed
          ? "The contractor shall name a quality control manager and a site safety officer before work starts, and keep a daily quality control report."
          : "The contractor shall name a superintendent who is on site every work day, and keep a written safety plan.",
      },
      { kind: "warranty", section: terms, ref: `${terms}.7`, heading: "Warranty", text: "The contractor warrants the work for one year from acceptance, and passes on every equipment maker's warranty." },
    ];
  },
  wageRows: WAGE_ROWS,
  wageLaw: "Davis-Bacon Act, building construction",
  priceOnlyWin: "The lowest price from a qualified bidder wins. Self-performing both trades keeps yours down.",
  priceOnlyMoney: "A sealed bid is won on price. Price from real equipment quotes and crew hours, or walk away.",
  offTrade: {
    item: "A contract in **your own trades**",
    why: "This notice is not electrical, HVAC or building work, so it does not build the record you want.",
  },
};
