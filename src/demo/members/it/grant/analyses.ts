// THE IT SERVICES FIRM: what Grant's three hand-written reviews need besides
// words — which phrase to bold, which clause backs which claim, the lead times and
// the trail of checks. The words are in members/it/grantBriefs.ts (the hero) and
// briefs.ts (the twin and the team-up); src/demo/grant/encode.ts puts the two
// together.

import { coverageFor } from "@/demo/grant/coverage";
import type { RowSpec } from "@/demo/grant/encode";
import { factsFor, PARTNER, usd } from "@/demo/grant/facts";
import type { Maker } from "@/demo/grant/heroAnalyses";
import { pinComputed, rt } from "@/demo/grant/rich";
import { clausePin, naicsLabel, type Solicitation } from "@/demo/grant/solicitation";
import { getOpportunity } from "@/demo/story/opportunities";
import { findPastPerformance } from "@/demo/story/persona";
import type { OpenQuestion, Pin, RoadmapItem } from "@/lib/grant/types";
import { HERO_IDS } from "../opportunities";
import { PERSONA } from "../persona";

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const revenue = usd(PERSONA.annualRevenue);
/** "Brackwater": the partner's short name. */
const BLUE = PARTNER.name.split(" ")[0];

const sourceOf = (sol: Solicitation, kind: string): string => {
  for (const s of sol.sections) {
    const c = s.clauses.find((x) => x.kind === kind);
    if (c) return `§${c.ref}`;
  }
  return "Notice";
};

const targets = (): Pin => pinComputed("Your targets", `Your target buyers: ${PERSONA.targetAgencies.join("; ")}.`);
const record = (id: string, label: string): Pin => {
  const p = findPastPerformance(id)!;
  return pinComputed(label, `${p.projectTitle}: ${p.scopeDescription}`);
};

const COMMON_ROWS: RowSpec[] = [
  { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
  { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
  { match: /General liability/, kind: "insurance", category: "insurance", required: "$1M per occurrence" },
];

// ═════════════════════════════════════════════════════════════════════════
// The hero: Army Reserve headquarters help desk — Bid as prime
// ═════════════════════════════════════════════════════════════════════════

const helpDesk: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  // Year one at the wage floor, as Ava prices it (six techs, a site lead, overhead); the range's midpoint is $715K.
  const annual = 710_000;
  return {
    path: "prime",
    checks: [23, 7],
    lead: { ppq: 3, writing: 3 },
    gistBold: "only 8(a) firms can quote",
    thesisBold: ["a strong next step for you"],
    limitKinds: ["responsibility", "winning-hurts", "winning-hurts"],
    competitiveRisk: "the **other 8(a) IT firms** around Fort Bragg, some of which price every tech at exactly the wage floor",
    readBold: {
      "Is it your kind of work?": "It's the work you did in help-desk seats on Fort Bragg",
      "Does the size fit?": "about a quarter of your revenue",
      "Can you perform there?": "12 miles from your office",
      "Can you do the work?": "Two of the six you'd put there don't have it",
      "Can you win it?": "You have a real shot if the staffing plan is solid",
      "Will you make money?": "Quote below the floor and you pay the difference yourself",
      "Can you survive winning?": "about $95K of payroll before the first payment",
      "Do you understand the buyer's intent?": "wants the desks covered from day one",
      "Does this move you forward?": "A five-year Army prime with your own rating",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-bragg-helpdesk-seats", "Your Fort Bragg help-desk seats")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `About ${usd(annual)} a year at the wage floor, divided by ${revenue} yearly revenue, is ${pct(annual / PERSONA.annualRevenue)}. The Army's range is ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} a year, for ${f.years} years.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to Fort Bragg: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("security"), cp("phaseIn")],
      "Can you win it?": [cp("setAside"), cp("factors")],
      "Will you make money?": [cp("wage"), pinComputed("Wage floor against local pay", "Wage determination 2015-4377: PC support technician $37.50 an hour plus $5.92 health and welfare. Fayetteville's median for computer user support specialists: $27.76 an hour.")],
      "Can you survive winning?": [cp("phaseIn"), cp("term")],
      "Do you understand the buyer's intent?": [cp("seats"), cp("factors")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "**Security+.** Every tech with admin rights needs it on day one. Two of your six don't hold it. Book their exams this week, and name all six in the quote with their certifications.",
        "**Phase-in.** 30 days to badge, card and certify six techs. Three come from your own team; hire the other three now, and backfill Seymour Johnson before you move anyone.",
      ],
      "Can you win it?": [
        "Only 8(a) firms can quote. The Army Reserve's last big IT buy here was competed the same way, and it drew six offers.",
        "Staffing comes first in the scoring. Named techs with their certifications, and a named site lead and alternate, are what the Army reads first.",
      ],
      "Will you make money?": [
        "The Service Contract Act sets the floor: $37.50 an hour plus $5.92 health and welfare for a PC support technician. You pay about $10 an hour less today.",
        "You lost the Windows 11 surge by $3.50 an hour. Show the floor line by line, and put any premium only where the work statement asks for experience.",
      ],
      "Can you survive winning?": [
        "No bond, so no cash is tied up before the work starts.",
        "Three new hires and a 30-day phase-in mean about $95K of payroll before the Army's first payment. You have no credit line, so plan the cash now.",
      ],
      "Do you understand the buyer's intent?": [
        "The Army Reserve runs its headquarters from Marshall Hall. A desk left without cover on the first day is what it fears most.",
        "That is why the staffing plan and the phase-in are scored first.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      ...COMMON_ROWS,
      { match: /8\(a\)/, kind: "setAside", category: "eligibility", required: "in the 8(a) program" },
      { match: /Security\+/, kind: "security", category: "cert", required: "Security+ for every tech with admin rights" },
      { match: /site lead/, kind: "seats", category: "artifact", required: "a named site lead and alternate", closable: true },
      { match: /CMMC/, kind: "cmmc", category: "cert", required: "CMMC Level 1 (Self) in SPRS" },
      { match: /Service Contract Act/, kind: "wage", category: "submission", required: "the wage determination's rates" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Don't bid", "this gets stronger"],
    redTeamBold: ["hire three now", "Show the floor line by line"],
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 9,
        items: [
          { glyph: "ok", text: rt("Set-aside: **competitive 8(a)**. You are in the program."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. It is your primary code.`), source: sourceOf(sol, "naics") },
          { glyph: "warn", text: rt("**Security+ on day one** for every tech with admin rights."), source: sourceOf(sol, "security") },
          { glyph: "warn", text: rt("Service Contract Act: **$37.50 plus $5.92** an hour for a PC support technician."), source: sourceOf(sol, "wage") },
          { glyph: "neutral", text: rt("Six techs on site 7:00 to 5:00, a named site lead and alternate, and a 30-day phase-in."), source: sourceOf(sol, "seats") },
          { glyph: "ok", text: rt("**No bond** is required."), source: sourceOf(sol, "insurance") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "neutral", text: rt("The Army Reserve's last competed 8(a) IT buy here drew **six offers**."), source: "Award records" },
          { glyph: "neutral", text: rt("Kettle Creek Technologies won the Windows 11 surge by pricing every tech at the floor."), source: "Your record" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Seymour Johnson desktop support: your own federal prime, CPARS **Very Good**."), source: "Your record" },
          { glyph: "ok", text: rt("Four years of help-desk seats on Fort Bragg as a sub."), source: "Your record" },
          { glyph: "warn", text: rt("Security+: **4 of the 6** techs you'd name hold it."), source: "Your record" },
          { glyph: "warn", text: rt("No credit line; about **$95K of payroll** before the first payment."), source: "Computed" },
          { glyph: "ok", text: rt(`The yearly value, about ${usd(annual)}, is about ${pct(annual / PERSONA.annualRevenue)} of your yearly revenue.`), source: "Computed" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Book the two Security+ exams and price to the wage floor, and I can call this with full confidence.",
    citations: [cp("security"), cp("wage")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The twin: Army Reserve SharePoint support, ITES-3S holders only — No-bid
// ═════════════════════════════════════════════════════════════════════════

const sharePoint: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  // The days left on the help desk quote: the bid the roadmap points at.
  const days = factsFor(getOpportunity(HERO_IDS.hero)!).daysLeft;
  const roadmap: RoadmapItem[] = [
    {
      item: rt("**Quote the help desk** first"),
      whyItMattered: rt("Same office and same customer, and only 8(a) firms can quote. A prime there puts your name in front of the people who write the next SharePoint notice."),
      whatItTakes: rt(`The quote is open now. Answer Ava's three questions and book the two Security+ exams. That fits inside ${days} days.`),
    },
    {
      item: rt("A team for **ITES-4S**, the Army's next IT contract"),
      whyItMattered: rt("The Army Reserve orders this work through its IT contracts. A seat on the next one is how you see orders like this."),
      whatItTakes: rt("A partner that is bidding ITES-4S, or a mentor-protégé joint venture. Diana can tell you where to start."),
      cta: { kind: "mentor" },
    },
    {
      item: rt("A **subcontract** with a holder"),
      whyItMattered: rt("Larkspur Federal IT is a small-business ITES-3S holder. Staffing its SharePoint work keeps you in the Army Reserve's IT."),
      whatItTakes: rt("A call to Larkspur Federal IT this week, and a rate for one SharePoint admin."),
    },
    {
      item: rt("A **question** to the office"),
      whyItMattered: rt("In 2018 this work was its own contract, open to small firms. Asking whether the next one can go open-market costs nothing."),
      whatItTakes: rt("A short email to the contracting office after this order is awarded."),
    },
  ];
  return {
    path: "skip",
    checks: [14, 4],
    lead: { writing: 1 },
    gistBold: "Don't bid",
    thesisBold: ["you are not one", "nothing you send changes that", "the help desk quote"],
    limitKinds: ["disqualifier", "responsibility"],
    readBold: {
      "Is it your kind of work?": "only ITES-3S holders can quote",
      "Does the size fit?": "On size alone it fits",
      "Can you perform there?": `${f.miles} miles from your office`,
      "Can you do the work?": "who can quote, not the work",
      "Can you win it?": "You are not one",
      "Will you make money?": "price only your admins' hours",
      "Can you survive winning?": "Winning is not the problem",
      "Do you understand the buyer's intent?": "The way in is to be on the next contract",
      "Does this move you forward?": "open to 8(a) firms like yours",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-sandhills-managed-it", "Your clinics' Microsoft 365")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}.`)],
      "Can you perform there?": [cp("place")],
      "Can you do the work?": [cp("needs")],
      "Can you win it?": [cp("vehicle")],
      "Will you make money?": [cp("evaluate")],
      "Can you survive winning?": [cp("term")],
      "Do you understand the buyer's intent?": [cp("vehicle"), cp("setAside")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "One clause decides it: the work will be competed as a task order under the Army ITES-3S IDIQ, and only small-business ITES-3S holders may submit.",
        "ITES-3S takes no new firms. Nothing you send before the due date puts you on it.",
      ],
      "Does this move you forward?": [
        "The help desk quote is the same office and the same customer, and only 8(a) firms can quote. Work there is the record you want.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /Small business/, kind: "setAside", category: "eligibility", required: "a small business" },
      { match: /ITES-3S/, kind: "vehicle", category: "eligibility", required: "an ITES-3S holder", closable: false, firmValue: "not a holder" },
    ],
    nextBold: "spend this week there",
    wouldChangeBold: ["open-market", "a subcontract"],
    redTeamBold: ["there is no", "Larkspur Federal IT is a small-business ITES-3S holder", "ITES-4S comes next"],
    gapToWin: [{ item: "A seat on the Army's **ITES-3S** contract", have: false }],
    roadmap,
    trail: [
      {
        title: "Reading the task order request",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Quotes **only from small-business ITES-3S holders**."), source: sourceOf(sol, "vehicle") },
          { glyph: "ok", text: rt("Set-aside: **small business**. You are small."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt("**No bond** is required."), source: sourceOf(sol, "insurance") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("Only ITES-3S holders can quote. A recent Fort Bragg IT order under it drew 12 offers."), source: "Award records" },
          { glyph: "neutral", text: rt("The 2018 contract for this work was open to small firms."), source: "Award records" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 4,
        items: [
          { glyph: "blocked", text: rt("ITES-3S: **not a holder**, and it takes no new firms."), source: "Your record" },
          { glyph: "ok", text: rt("SharePoint and Microsoft 365 admin fit the work."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { A: "reviewed_with_findings", C: "reviewed_with_findings" }),
    briefingBold: [undefined, "I stopped at the clause on who can quote", undefined],
    remedy: "Nothing you tell me changes who can quote on this order.",
    citations: [cp("vehicle"), cp("setAside")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The team-up: the Army medical center's IT follow-on — prime no-go, subcontract go
// ═════════════════════════════════════════════════════════════════════════

const hospitalIt: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  const openQuestions: OpenQuestion[] = [
    {
      id: "talked-to-partner",
      question: rt(`Have you talked with **${PARTNER.name}** about this work?`),
      payoff: rt("A yes turns the subcontract path from an idea into a **plan**."),
      verdictSwing: 0.6,
      input: { kind: "yesno" },
      status: "open",
      chipNoun: "prime",
    },
  ];
  return {
    // The notice is a request for information, but the call is about the order
    // behind it: the page shows Bid with the prime path no-go and the subcontract
    // path go.
    path: "sub",
    checks: [16, 5],
    lead: { subQuote: 5, writing: 1 },
    gistBold: "Team up",
    thesisBold: ["the prime seat is not yours", "run the desk-side techs at the medical center"],
    limitKinds: ["disqualifier", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "other **local IT firms** that STARS III holders already use",
    readBold: {
      "Is it your kind of work?": "the work your techs do at Seymour Johnson",
      "Does the size fit?": "times your yearly revenue",
      "Can you perform there?": "Your techs can be on site every day",
      "Can you do the work?": "Nine more seats on top of the help desk means hiring",
      "Can you win it?": `As a subcontractor you share in the work if ${BLUE} wins`,
      "Will you make money?": "agree on your rate before the quote",
      "Can you survive winning?": "you have no credit line",
      "Do you understand the buyer's intent?": "techs at the desk, not a queue",
      "Does this move you forward?": "Teaming is how you get in",
    },
    readPins: {
      "Is it your kind of work?": [cp("work"), record("pp-sjafb-desktop-support", "Your Seymour Johnson desktop support")],
      "Does the size fit?": [cp("current"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${(annual / PERSONA.annualRevenue).toFixed(1)} times.`)],
      "Can you perform there?": [cp("work")],
      "Can you do the work?": [cp("work")],
      "Can you win it?": [cp("setAside")],
      "Will you make money?": [cp("work")],
      "Can you survive winning?": [cp("teaming")],
      "Do you understand the buyer's intent?": [cp("current"), cp("work")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "The agency expects to order the follow-on through GSA's 8(a) STARS III. Your 8(a) status is not enough: only firms with a STARS III seat can quote, and STARS III takes no new firms.",
        `${BLUE} holds STARS III and wants a local firm for nine desk-side techs. Your share comes from the teaming agreement.`,
      ],
      "Does this move you forward?": [
        "Your federal prime record today is Seymour Johnson. Hospital IT at Fort Bragg adds a second Defense buyer and a larger program.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /STARS III contract/, kind: "setAside", category: "eligibility", required: "a STARS III holder", closable: false, firmValue: "8(a), but no STARS III seat" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Similar jobs/, kind: "ask", category: "artifact", required: "similar jobs, with a contact" },
      { match: /Teaming agreement/, kind: "teaming", category: "submission", required: "partners and the share each does" },
    ],
    nextBold: `Reply to ${PARTNER.contact} this week`,
    wouldChangeBold: ["the size still points to a subcontract", "another STARS III holder"],
    redTeamBold: ["Not as the lead", "Hire through the spring", "it has no techs near Fort Bragg"],
    gapToWin: [
      { item: "A **STARS III holder** to team with", have: false },
      { item: "A **teaming agreement** that names your share", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the notice",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Request for information: the agency asks **who could run the medical center's IT**."), source: sourceOf(sol, "purpose") },
          { glyph: "blocked", text: rt("Contract expected: **8(a) STARS III**, holders only."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt(`About **${usd(annual)} a year**, with an award by 28 February 2027.`), source: sourceOf(sol, "current") },
          { glyph: "neutral", text: rt("Teaming replies should name the partners and each one's share."), source: sourceOf(sol, "teaming") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("The current order drew **1 offer** under STARS III."), source: "Award records" },
          { glyph: "ok", text: rt(`${PARTNER.name} is looking for a local firm for nine desk-side techs.`), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("STARS III: **no seat**. You are 8(a), but not a holder."), source: "Your record" },
          { glyph: "ok", text: rt("Seymour Johnson desktop support: desk-side work and imaging, CPARS Very Good."), source: "Your record" },
          { glyph: "warn", text: rt("Nine more techs on top of the help desk: **hiring** and payroll before the first payment."), source: "Computed" },
        ],
      },
    ],
    coverage: coverageFor(sol, { "1": "reviewed_with_findings", "2": "reviewed_with_findings" }),
    briefingBold: [undefined, "not as prime", undefined],
    remedy: `Tell me whether you have talked with ${PARTNER.name} and I can call the subcontract path properly.`,
    citations: [cp("setAside"), cp("work")],
  };
};

export const HERO_EXTRAS: Record<string, Maker> = {
  [HERO_IDS.hero]: helpDesk,
  [HERO_IDS.twin]: sharePoint,
  [HERO_IDS.teamUp]: hospitalIt,
};
