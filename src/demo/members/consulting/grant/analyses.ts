// THE CONSULTANT: what Grant's three hand-written reviews need besides words —
// which phrase to bold, which clause backs which claim, the lead times and the
// trail of checks. The words are in members/consulting/grantBriefs.ts (the hero)
// and briefs.ts (the twin and the team-up); src/demo/grant/encode.ts puts the two
// together.
//
// Whether a 1099 facilitator counts as a subcontractor turns on SBA's employee
// test (13 CFR 121.106), so Grant says "may count", never "counts".

import { coverageFor } from "@/demo/grant/coverage";
import type { RowSpec } from "@/demo/grant/encode";
import { PARTNER, usd } from "@/demo/grant/facts";
import type { Maker } from "@/demo/grant/heroAnalyses";
import { pinComputed, rt } from "@/demo/grant/rich";
import { clausePin, naicsLabel, type Solicitation } from "@/demo/grant/solicitation";
import { findPastPerformance } from "@/demo/story/persona";
import type { OpenQuestion, Pin, RoadmapItem } from "@/lib/grant/types";
import { HERO_IDS } from "../opportunities";
import { PERSONA } from "../persona";

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const revenue = usd(PERSONA.annualRevenue);
/** "Halyard Point": the partner's short name. */
const HP = PARTNER.name.split(" ").slice(0, 2).join(" ");

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
  { match: /VetCert/, kind: "setAside", category: "eligibility", required: "SDVOSB certified" },
];

// ═════════════════════════════════════════════════════════════════════════
// The hero: supervisor leadership program, Fayetteville VA — Bid as prime
// ═════════════════════════════════════════════════════════════════════════

const supervisorProgram: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  return {
    path: "prime",
    checks: [23, 7],
    lead: { ppq: 5, writing: 3 },
    gistBold: "your set-aside",
    thesisBold: ["the program you already run", "Two things need fixing"],
    limitKinds: ["responsibility", "responsibility", "proposal-weakness"],
    competitiveRisk: "the **other service-disabled veteran-owned training firms** in North Carolina, including the Durham firm that won the VA's last leadership buys",
    readBold: {
      "Is it your kind of work?": "your nurse-manager academy",
      "Does the size fit?": "about 13% of your revenue",
      "Can you perform there?": "3 miles from your office",
      "Can you do the work?": "one PCC and two ACC coaches",
      "Can you win it?": "Only service-disabled veteran-owned firms can quote",
      "Will you make money?": "near the GSA median",
      "Can you survive winning?": "who may count as subcontractors",
      "Do you understand the buyer's intent?": "ties each cohort to the All Employee Survey",
      "Does this move you forward?": "A VA prime with option years",
    },
    readPins: {
      "Is it your kind of work?": [cp("cohorts"), cp("coaches"), record("pp-tidewell-academy", "Your nurse-manager academy")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}. The VA's range is ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} a year, for ${f.years} years.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to the Fayetteville VA Medical Center: about ${f.miles} miles. Wilmington is about 90 miles.`)],
      "Can you do the work?": [cp("coaches"), cp("staff")],
      "Can you win it?": [cp("setAside"), cp("factors")],
      "Will you make money?": [cp("price"), pinComputed("GSA rates", "GSA CALC+ medians: Facilitator $145.69 an hour, Executive Coach $333.57, Program Manager $131.86.")],
      "Can you survive winning?": [cp("subcontracting"), pinComputed("Your staff", `${PERSONA.employeesW2} W-2 staff and 7 contract (1099) facilitators. Two of your four cohort leads are 1099 facilitators.`)],
      "Do you understand the buyer's intent?": [cp("reports"), cp("factors")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "**The coach line.** The work statement asks for coaches with an ICF PCC or equal. You have one PCC and two ACC coaches. Ask in Q&A whether an ACC with 100+ hours coaching federal supervisors meets it; every quoter sees the answer.",
        "**Key people.** The VA wants a named Program Manager and Lead Facilitator. Ava asks who.",
      ],
      "Can you survive winning?": [
        "**The 50% rule.** VAAR 852.219-75: at most half of what VA pays may go to firms that aren't certified veteran-owned. A 1099 facilitator may count as a subcontractor; SBA's employee test decides, so plan as if yours do.",
        "Count paid hours by person. If W-2 staff carry less than half, move one facilitator to payroll before you quote, then sign the certificate that goes in with the quote. VA can ask you to prove it.",
      ],
      "Will you make money?": [
        "Price the Wilmington cohort days with travel. Four cohorts of 30 spread the cost of the 360 tool.",
      ],
    },
    limiting: "Can you survive winning?",
    rows: [
      ...COMMON_ROWS,
      { match: /subcontracting certificate/, kind: "subcontracting", category: "submission", required: "at most 50% paid to firms that aren't certified veteran-owned", closable: true },
      { match: /PCC/, kind: "coaches", category: "artifact", required: "ICF PCC or equal", closable: true },
      { match: /Program Manager/, kind: "staff", category: "artifact", required: "named in the quote", closable: true },
      { match: /Quarterly report/, kind: "reports", category: "artifact", required: "tied to the All Employee Survey" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Don't bid", "the 50% rule stops being a risk"],
    redTeamBold: ["spread across the year", "You're 3 miles away"],
    trail: [
      {
        title: "Reading the request for quote",
        checkCount: 9,
        items: [
          { glyph: "ok", text: rt("Set-aside: **service-disabled veteran-owned**, under Veterans First. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. It is one of your codes.`), source: sourceOf(sol, "naics") },
          { glyph: "warn", text: rt("**Limitations on subcontracting**: at most 50% paid to firms that aren't certified veteran-owned."), source: sourceOf(sol, "subcontracting") },
          { glyph: "warn", text: rt("Coaches need an **ICF PCC or equal**."), source: sourceOf(sol, "coaches") },
          { glyph: "neutral", text: rt("A Program Manager and Lead Facilitator, named in the quote."), source: sourceOf(sol, "staff") },
          { glyph: "ok", text: rt("No bond is required."), source: sourceOf(sol, "insurance") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "neutral", text: rt("The VA's last two Fayetteville leadership buys went to a veteran-owned firm, at **$153K and $195K**."), source: "Award records" },
          { glyph: "neutral", text: rt("A Durham veteran-owned training firm won the VA's mediation class this month."), source: "Award records" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Nurse-manager academy: the same cohorts, 360s and coaching."), source: "Your record" },
          { glyph: "warn", text: rt("Two of four cohort leads are **1099 facilitators**, who may count as subcontractors."), source: "Your record" },
          { glyph: "warn", text: rt("Coaches: **one PCC, two ACC**."), source: "Your record" },
          { glyph: "warn", text: rt("VetCert eligibility ends 14 Jan 2027. The VA checks it at award."), source: "Your record" },
          { glyph: "ok", text: rt("General liability insurance on file."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings", H: "reviewed_with_findings" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Count your hours by person and get the VA's answer on the coach line, and I can call this with full confidence.",
    citations: [cp("setAside"), cp("subcontracting")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The twin: manpower analysts, GSA schedule holders only — No-bid
// ═════════════════════════════════════════════════════════════════════════

const manpowerSchedule: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const roadmap: RoadmapItem[] = [
    {
      item: rt("A **GSA schedule** of your own"),
      whyItMattered: rt("MICC Fort Bragg buys most of its competed small-business consulting as GSA schedule orders. A schedule is how you see orders like this one."),
      whatItTakes: rt(`An offer under the Professional Services and Human Capital categories: two years of financials and three references. With ${PERSONA.yearsInBusiness} years in business you meet the two-year rule. Diana can show you where to start.`),
      cta: { kind: "mentor" },
    },
    {
      item: rt("A reply to the **next sources sought** at Fort Bragg"),
      whyItMattered: rt(`Answering tells the office that a veteran-owned firm is ${f.miles} miles away, before it decides how to buy the next order.`),
      whatItTakes: rt("A two-page reply with your ACS job. Save a Hunter search for Fort Bragg consulting notices."),
    },
    {
      item: rt("An **interim rating** on your ACS job"),
      whyItMattered: rt("A rating from the same office is the reference a schedule offer and the next order both ask for."),
      whatItTakes: rt("An email to the contracting officer, copying the COR, asking for an interim evaluation."),
    },
  ];
  return {
    path: "skip",
    checks: [14, 5],
    lead: { writing: 1 },
    gistBold: "Don't bid",
    thesisBold: ["you aren't one", "months, not", "start the schedule offer now"],
    limitKinds: ["disqualifier", "responsibility"],
    readBold: {
      "Is it your kind of work?": "only schedule holders can quote",
      "Does the size fit?": "a third of your revenue",
      "Can you perform there?": `${f.miles} miles from your office`,
      "Can you do the work?": "who can quote, not the work",
      "Can you win it?": "you can't send a quote",
      "Will you make money?": "you have none on file",
      "Can you survive winning?": "hiring before the first day",
      "Do you understand the buyer's intent?": "The way in is a schedule of your own",
      "Does this move you forward?": "Starting the schedule offer now",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-acs-lean-review", "Your Fort Bragg ACS job")],
      "Does the size fit?": [cp("value")],
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
        "One clause decides it: the request is issued through GSA eBuy to holders of a GSA schedule under SIN 541611, and only they may quote.",
        "Nothing you send before the due date puts you on a schedule.",
      ],
      "Does this move you forward?": [
        "The manpower follow-on and the VA's HR staffing support are both schedule orders. A schedule of your own opens them.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /GSA schedule/, kind: "vehicle", category: "eligibility", required: "a GSA schedule under SIN 541611", closable: false, firmValue: "no GSA schedule" },
    ],
    nextBold: "your work, your set-aside and your town",
    wouldChangeBold: ["reposts this outside eBuy", "staff part of the work"],
    redTeamBold: ["You can't send a quote", "months of review", "you meet GSA's two-year rule"],
    gapToWin: [{ item: "A **GSA schedule** under SIN 541611", have: false }],
    roadmap,
    trail: [
      {
        title: "Reading the request for quote",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Quotes **only from GSA schedule holders** under SIN 541611, through GSA eBuy."), source: sourceOf(sol, "vehicle") },
          { glyph: "ok", text: rt("Set-aside: **service-disabled veteran-owned**. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "neutral", text: rt(`About **${usd(f.annual ?? 0)} a year**, for five years.`), source: sourceOf(sol, "value") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("The last manpower order at Fort Bragg was a schedule order and drew 4 quotes."), source: "Award records" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 4,
        items: [
          { glyph: "blocked", text: rt("GSA schedule: **none**."), source: "Your record" },
          { glyph: "ok", text: rt("Fort Bragg ACS job, delivered for the same office."), source: "Your record" },
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
// The team-up: Army family readiness staff training — prime no-go, subcontract go
// ═════════════════════════════════════════════════════════════════════════

const familyReadiness: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const openQuestions: OpenQuestion[] = [
    {
      id: "talked-to-partner",
      question: rt(`Have you talked with **${PARTNER.name}** about the next order?`),
      payoff: rt("A yes turns the subcontract path from an idea into a **plan**."),
      verdictSwing: 0.6,
      input: { kind: "yesno" },
      status: "open",
      chipNoun: "prime",
    },
  ];
  return {
    // The notice is a sources sought, but the call is about the order behind it:
    // the page shows Bid with the prime path no-go and the subcontract path go.
    path: "sub",
    checks: [15, 5],
    lead: { subQuote: 5, writing: 1 },
    gistBold: "Team up",
    thesisBold: ["the prime seat is not yours", "teach the in-person classes near Fort Bragg"],
    limitKinds: ["disqualifier", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "other **training firms** that HR Solutions holders already use",
    readBold: {
      "Is it your kind of work?": "the training you taught",
      "Does the size fit?": "most of your yearly revenue",
      "Can you perform there?": "inside your area",
      "Can you do the work?": "the part you can carry",
      "Can you win it?": `As ${HP}'s subcontractor you share in the work`,
      "Will you make money?": "agree on travel for each class day",
      "Can you survive winning?": "a size your firm runs today",
      "Do you understand the buyer's intent?": "without a gap between orders",
      "Does this move you forward?": "keeps you in this work",
    },
    readPins: {
      "Is it your kind of work?": [cp("work"), record("pp-halyard-family-readiness", "Your family readiness classes")],
      "Does the size fit?": [cp("current")],
      "Can you perform there?": [cp("work")],
      "Can you do the work?": [cp("work")],
      "Can you win it?": [cp("setAside")],
      "Will you make money?": [cp("teaming")],
      "Can you survive winning?": [cp("teaming")],
      "Do you understand the buyer's intent?": [cp("current"), cp("work")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "The Army expects to place the order on its HR Solutions Personnel Lifecycle Support contract. Only its holders can compete, and you aren't one.",
        `${HP} holds it and taught this training before, with you as its subcontractor. It wants a veteran-owned trainer near Fort Bragg for in-person classes in NC, SC and VA. Your share comes from the teaming agreement.`,
      ],
      "Does this move you forward?": [
        "Large Army training orders near you go through contracts like HR Solutions. A subcontract with a holder is how a firm your size stays in the work.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
      { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
      { match: /HR Solutions/, kind: "setAside", category: "eligibility", required: "a holder of the HR Solutions contract", closable: false, firmValue: "not a holder" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Similar work/, kind: "ask", category: "artifact", required: "similar work, with a contact" },
      { match: /Teaming agreement/, kind: "teaming", category: "submission", required: "partners and the share each does" },
    ],
    nextBold: `Reply to ${PARTNER.contact} this week`,
    wouldChangeBold: ["the size still points to a subcontract", "another HR Solutions holder"],
    redTeamBold: ["Only holders of the HR Solutions contract can compete", "Your classes for it", "keeps you in Army training work"],
    gapToWin: [
      { item: "A **holder of the HR Solutions contract** to team with", have: false },
      { item: "A **teaming agreement** that names your classes", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the notice",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Sources sought: the Army asks **who could train its family readiness staff** for five more years."), source: sourceOf(sol, "purpose") },
          { glyph: "blocked", text: rt("The order goes on the **HR Solutions contract**: holders only."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt(`About **${usd(f.annual ?? 0)} a year**, with the order in about 150 days.`), source: sourceOf(sol, "current") },
          { glyph: "neutral", text: rt("Teaming replies should name the partners and each one's share."), source: sourceOf(sol, "teaming") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("The last order drew 6 offers from HR Solutions holders."), source: "Award records" },
          { glyph: "ok", text: rt(`${PARTNER.name} is looking for a veteran-owned trainer near Fort Bragg.`), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 5,
        items: [
          { glyph: "blocked", text: rt("HR Solutions contract: **not a holder**."), source: "Your record" },
          { glyph: "ok", text: rt(`Family readiness classes for ${HP}, 2023 to 2025.`), source: "Your record" },
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
  [HERO_IDS.hero]: supervisorProgram,
  [HERO_IDS.twin]: manpowerSchedule,
  [HERO_IDS.teamUp]: familyReadiness,
};
