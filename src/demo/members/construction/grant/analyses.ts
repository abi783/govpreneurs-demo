// THE CONTRACTOR: what Grant's three hand-written reviews need besides words —
// which phrase to bold, which clause backs which claim, the lead times and the
// trail of checks. The words are in members/construction/grantBriefs.ts (the hero)
// and briefs.ts (the twin and the team-up); src/demo/grant/encode.ts puts the two
// together.

import { coverageFor } from "@/demo/grant/coverage";
import type { RowSpec } from "@/demo/grant/encode";
import { PARTNER, usd } from "@/demo/grant/facts";
import type { Maker } from "@/demo/grant/heroAnalyses";
import { pinComputed, rt } from "@/demo/grant/rich";
import { clausePin, naicsLabel, type Solicitation } from "@/demo/grant/solicitation";
import { findPastPerformance } from "@/demo/story/persona";
import { PERSONA } from "../persona";
import type { OpenQuestion, Pin, RoadmapItem } from "@/lib/grant/types";
import { HERO_IDS } from "../opportunities";

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const revenue = usd(PERSONA.annualRevenue);
const LINE = PERSONA.bondLine!;
/** "Blackjack Oak": the partner's short name. */
const BLUE = PARTNER.name.split(" ").slice(0, 2).join(" ");

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
const bondRoom = (job: number): Pin =>
  pinComputed(
    "Bond room",
    `Single job: ${usd(job)} against your ${usd(LINE.single)} limit. Total: ${usd(LINE.inUse)} in use plus ${usd(job)} is ${usd(LINE.inUse + job)}, against your ${usd(LINE.aggregate)} limit.`,
  );

const COMMON_ROWS: RowSpec[] = [
  { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
  { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
  { match: /General liability/, kind: "insurance", category: "insurance", required: "$1M per occurrence" },
];

// ═════════════════════════════════════════════════════════════════════════
// The hero: HVAC and electrical upgrade, Fort Bragg training building — Bid as prime
// ═════════════════════════════════════════════════════════════════════════

const trainingBuilding: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const job = f.mid ?? 0;
  return {
    path: "prime",
    checks: [24, 7],
    lead: { bonding: 7, subQuote: 7, writing: 3 },
    gistBold: "only HUBZone firms can bid",
    thesisBold: ["a strong first USACE job for you"],
    limitKinds: ["responsibility", "winning-hurts", "responsibility"],
    competitiveRisk: "the **other HUBZone contractors** around Fort Bragg, in Lumberton, Maxton and Raeford",
    readBold: {
      "Is it your kind of work?": "both your trades, self-performed",
      "Does the size fit?": `under your ${usd(LINE.single)} single bond`,
      "Can you perform there?": "12 miles from your shop",
      "Can you do the work?": "long lead times against 240 days",
      "Can you win it?": "the lowest responsive bid gets it",
      "Will you make money?": "Price piping at the pipefitter rate",
      "Can you survive winning?": `of your ${usd(LINE.aggregate)} aggregate`,
      "Do you understand the buyer's intent?": "hold you to the phasing plan",
      "Does this move you forward?": "A first USACE job and a rating from it",
    },
    readPins: {
      "Is it your kind of work?": [cp("equipment"), cp("electrical"), record("pp-pope-office-hvac", "Your Pope job")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(job)} divided by ${revenue} yearly revenue is ${pct(job / PERSONA.annualRevenue)}. Your single-job bond is ${usd(LINE.single)}.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to Fort Bragg: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("equipment"), cp("qualityControl")],
      "Can you win it?": [cp("setAside"), cp("evaluate")],
      "Will you make money?": [cp("wage"), pinComputed("Wage rates", "NC20260122: pipefitter $33.96 plus $13.48 fringe; sheet metal worker $19.67 plus $13.27; no HVAC mechanic class.")],
      "Can you survive winning?": [cp("bond"), cp("payments"), bondRoom(job)],
      "Do you understand the buyer's intent?": [cp("occupied"), cp("evaluate")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "**Lead times.** A 60-ton chiller and an 800A switchboard can each take months. Get written dates from the suppliers before you price, and plan the outages around them.",
        "**Staff.** The Corps wants a quality control manager and a site safety officer named before work starts. Ava asks who.",
      ],
      "Will you make money?": [
        "The wage decision lists no HVAC mechanic class. A class it does not list is added after award, so ask before questions close which class covers refrigerant piping.",
        "Until the Corps answers, price piping at the pipefitter rate: $33.96 plus $13.48 fringe.",
      ],
      "Can you survive winning?": [
        `You have ${usd(LINE.inUse)} of bonded work. This job takes your total to about ${usd(LINE.inUse + job)} of ${usd(LINE.aggregate)}.`,
        "The Corps pays monthly for work in place. The chiller and switchboard are paid for before the first payment, so plan to carry about two months.",
      ],
      "Do you understand the buyer's intent?": [
        "A Special Operations unit keeps training in the building. An outage it did not plan for costs more than a high price.",
        "That is why the phasing plan and the 14-day outage notice matter, even in a price-only bid.",
      ],
    },
    limiting: "Can you survive winning?",
    rows: [
      ...COMMON_ROWS,
      { match: /HUBZone/, kind: "setAside", category: "eligibility", required: "HUBZone certified" },
      { match: /Bid bond/, kind: "bond", category: "bonding", required: "20% of the bid price" },
      { match: /performance and payment/, kind: "bond", category: "bonding", required: "100% of the contract price" },
      { match: /Quality control/, kind: "qualityControl", category: "artifact", required: "named before work starts", closable: true },
      { match: /Davis-Bacon/, kind: "wage", category: "submission", required: "the wage decision's classes" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Don't bid", "your price drops"],
    redTeamBold: ["name a different lead for each job", "you carry no sub markup on the electrical"],
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 9,
        items: [
          { glyph: "ok", text: rt("Set-aside: **HUBZone small business**. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. It is one of your codes.`), source: sourceOf(sol, "naics") },
          { glyph: "ok", text: rt("Sealed bid: **the lowest responsive bid** gets the award."), source: sourceOf(sol, "evaluate") },
          { glyph: "warn", text: rt("A **bid guarantee**, then 100% performance and payment bonds."), source: sourceOf(sol, "bond") },
          { glyph: "warn", text: rt("Wage decision NC20260122 has **no HVAC mechanic class**."), source: sourceOf(sol, "wage") },
          { glyph: "neutral", text: rt("A quality control manager and a site safety officer, named before work starts."), source: sourceOf(sol, "qualityControl") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "neutral", text: rt("Two recent USACE HUBZone bids near Fort Bragg drew **9 and 11 offers**."), source: "Award records" },
          { glyph: "neutral", text: rt("HUBZone contractors in Lumberton, Maxton and Raeford list these codes."), source: "SAM.gov" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Pope office building: the same HVAC and electrical mix, CPARS **Very Good**."), source: "Your record" },
          { glyph: "ok", text: rt("Two HVAC crews and two electrical crews, all badged onto post."), source: "Your record" },
          { glyph: "warn", text: rt(`Bond room: ${usd(LINE.inUse)} in use plus this job is about **${usd(LINE.inUse + job)} of ${usd(LINE.aggregate)}**.`), source: "Computed" },
          { glyph: "warn", text: rt("No written lead times yet for the chiller or the switchboard."), source: "Your record" },
          { glyph: "ok", text: rt("General liability insurance on file."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings", H: "reviewed_with_findings" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Get your surety's written OK and the Corps' answer on the piping class, and I can call this with full confidence.",
    citations: [cp("setAside"), cp("bond")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The twin: barracks HVAC repair, MATOC holders only — No-bid
// ═════════════════════════════════════════════════════════════════════════

const barracksHoldersOnly: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const job = f.mid ?? 0;
  const roadmap: RoadmapItem[] = [
    {
      item: rt("A reply to the **Minor Construction MATOC** sources sought"),
      whyItMattered: rt("Most of Fort Bragg's HUBZone repair work goes through its MATOCs. A seat on the next one is how you see orders like this."),
      whatItTakes: rt("Three similar jobs from the last six years, a surety letter with your single and total limits, and your Pope rating. Sarah's checklist covers the rest."),
      cta: { kind: "mentor" },
    },
    {
      item: rt("A **subcontract** with a MATOC holder"),
      whyItMattered: rt("Turnrow Federal holds this MATOC and hired your electricians for a barracks job before. Pricing the HVAC for a holder keeps you in Fort Bragg barracks work."),
      whatItTakes: rt("A call to Turnrow Federal this week, and a price for the HVAC work."),
    },
    {
      item: rt("More **bond room**"),
      whyItMattered: rt(`This order would need about ${usd(job)} in bonds for one job. Your single-job limit is ${usd(LINE.single)}.`),
      whatItTakes: rt("Your latest financials and a talk with your surety about a larger line after the training building job."),
    },
    {
      item: rt("A **watch** on Fort Bragg MATOC notices"),
      whyItMattered: rt("The next sources sought for a MATOC gives you more time if you see it on day one."),
      whatItTakes: rt("Save a Hunter search for Fort Bragg construction MATOCs. It takes two minutes."),
    },
  ];
  return {
    path: "skip",
    checks: [15, 5],
    lead: { writing: 1 },
    gistBold: "Don't bid",
    thesisBold: ["you are not on it", "more than your single-job bond", "answer the Minor Construction MATOC sources sought"],
    limitKinds: ["disqualifier", "responsibility"],
    readBold: {
      "Is it your kind of work?": "only MATOC holders can offer",
      "Does the size fit?": `more than your ${usd(LINE.single)} single-job bond`,
      "Can you perform there?": `${f.miles} miles from your shop`,
      "Can you do the work?": "who can offer, not the work",
      "Can you win it?": "You are not on it",
      "Will you make money?": "price only the HVAC work",
      "Can you survive winning?": "more than your single limit",
      "Do you understand the buyer's intent?": "The way in is to be on the next one",
      "Does this move you forward?": "the Minor Construction MATOC sources sought",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-turnrow-barracks-electrical", "Your barracks electrical job")],
      "Does the size fit?": [cp("value"), bondRoom(job)],
      "Can you perform there?": [cp("place")],
      "Can you do the work?": [cp("needs")],
      "Can you win it?": [cp("vehicle")],
      "Will you make money?": [cp("evaluate")],
      "Can you survive winning?": [cp("bond"), bondRoom(job)],
      "Do you understand the buyer's intent?": [cp("vehicle"), cp("setAside")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "One clause decides it: offers will be accepted only from holders of the Fort Bragg DPW Vertical Construction MA IDIQ. The MATOC was awarded in 2023 and orders through August 2028.",
        "Nothing you send before the due date puts you on it.",
      ],
      "Does this move you forward?": [
        "Fort Bragg's Minor Construction MATOC follow-on is asking for sources now. That is the vehicle for electrical, HVAC and small repair work like yours.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /HUBZone/, kind: "setAside", category: "eligibility", required: "HUBZone certified" },
      { match: /MATOC/, kind: "vehicle", category: "eligibility", required: "a holder of the MATOC", closable: false, firmValue: "not a holder" },
      { match: /Performance and payment/, kind: "bond", category: "bonding", required: "100% of the order price", closable: false, firmValue: `${usd(LINE.single)} single-job bond` },
    ],
    nextBold: "the way onto the Minor Construction MATOC",
    wouldChangeBold: ["opens this order to firms off the MATOC", "price the HVAC work"],
    redTeamBold: ["You can't send an offer", "Turnrow Federal holds this MATOC", "is asking now"],
    gapToWin: [
      { item: "A seat on Fort Bragg's **Vertical Construction MATOC**", have: false },
      { item: `A bond line over **${usd(job)}** for one job`, have: false },
    ],
    roadmap,
    trail: [
      {
        title: "Reading the task order request",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Offers **only from holders** of the Vertical Construction MATOC."), source: sourceOf(sol, "vehicle") },
          { glyph: "ok", text: rt("Set-aside: **HUBZone**, as the MATOC is. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt(`Performance and payment bonds of **about ${usd(job)}**.`), source: sourceOf(sol, "bond") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("Only the MATOC's holders can offer. A recent barracks HVAC order under it drew 5 offers."), source: "Award records" },
          { glyph: "neutral", text: rt("Turnrow Federal, which hired your electricians before, is a holder."), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 5,
        items: [
          { glyph: "blocked", text: rt("Vertical Construction MATOC: **not a holder**."), source: "Your record" },
          { glyph: "blocked", text: rt(`Single-job bond: ${usd(LINE.single)}, **less than this order**.`), source: "Your record" },
          { glyph: "ok", text: rt("Barracks HVAC and electrical work fit your crews."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { A: "reviewed_with_findings", H: "reviewed_with_findings" }),
    briefingBold: [undefined, "I stopped at the clause on who can offer", undefined],
    remedy: "Nothing you tell me changes who can offer on this order.",
    citations: [cp("vehicle"), cp("bond")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The team-up: Fayetteville VA fan coils — prime no-go, subcontract go
// ═════════════════════════════════════════════════════════════════════════

const vaFanCoils: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const job = f.mid ?? 0;
  const openQuestions: OpenQuestion[] = [
    {
      id: "talked-to-partner",
      question: rt(`Have you talked with **${PARTNER.name}** about this job?`),
      payoff: rt("A yes turns the subcontract path from an idea into a **plan**."),
      verdictSwing: 0.6,
      input: { kind: "yesno" },
      status: "open",
      chipNoun: "prime",
    },
  ];
  return {
    // The notice is a sources sought, but the call is about the contract behind it:
    // the page shows Bid with the prime path no-go and the subcontract path go.
    path: "sub",
    checks: [16, 5],
    lead: { subQuote: 5, writing: 1 },
    gistBold: "Team up",
    thesisBold: ["the prime seat is not yours", "self-perform the fan coils, piping and power"],
    limitKinds: ["disqualifier", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "other **mechanical and electrical firms** that veteran-owned primes already use",
    readBold: {
      "Is it your kind of work?": "both your trades",
      "Does the size fit?": "more than twice your",
      "Can you perform there?": `${f.miles} miles from your shop`,
      "Can you do the work?": "infection control slows every room",
      "Can you win it?": `As a subcontractor you share in the work if ${BLUE} wins`,
      "Will you make money?": "agree on who carries the bond",
      "Can you survive winning?": "Agree on sub bonds before you sign",
      "Do you understand the buyer's intent?": "while the medical center stays open",
      "Does this move you forward?": "Teaming is how you get in",
    },
    readPins: {
      "Is it your kind of work?": [cp("work"), record("pp-pope-office-hvac", "Your Pope job")],
      "Does the size fit?": [cp("current"), bondRoom(job)],
      "Can you perform there?": [cp("work")],
      "Can you do the work?": [cp("work")],
      "Can you win it?": [cp("setAside")],
      "Will you make money?": [cp("bonds")],
      "Can you survive winning?": [cp("bonds"), cp("teaming")],
      "Do you understand the buyer's intent?": [cp("current"), cp("work")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "The VA expects to set the bid aside for service-disabled veteran-owned firms under its Veterans First rule. A HUBZone firm can't hold the prime contract.",
        `${BLUE} is service-disabled veteran-owned, and its crews are tied up on the VA's health-record wiring job. It wants a HUBZone firm for the mechanical and electrical work. Your share comes from the teaming agreement.`,
      ],
      "Does this move you forward?": [
        "VA construction near you is veteran-owned first. A subcontract with a veteran-owned prime is how a HUBZone firm gets VA work on its record.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
      { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
      { match: /SDVOSB/, kind: "setAside", category: "eligibility", required: "service-disabled veteran-owned", closable: false, firmValue: "HUBZone, not veteran-owned" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Similar jobs/, kind: "ask", category: "artifact", required: "similar jobs, with a contact" },
      { match: /Teaming agreement/, kind: "teaming", category: "submission", required: "partners and the share each does" },
    ],
    nextBold: `Reply to ${PARTNER.contact} this week`,
    wouldChangeBold: ["the size still points to a subcontract", "another veteran-owned prime"],
    redTeamBold: ["The veteran-owned firm has to lead", "up to 85 percent", "its crews are tied up"],
    gapToWin: [
      { item: "A **service-disabled veteran-owned prime** to team with", have: false },
      { item: "A **teaming agreement** that names your share and the sub bonds", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the notice",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Sources sought: the VA asks **who could replace the fan coils** on floors 2 and 4."), source: sourceOf(sol, "purpose") },
          { glyph: "blocked", text: rt("Set-aside expected: **service-disabled veteran-owned** firms."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt(`About **${usd(job)}**, with a sealed bid in about 150 days.`), source: sourceOf(sol, "current") },
          { glyph: "neutral", text: rt("Teaming replies should name the partners and each one's share."), source: sourceOf(sol, "teaming") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("The 3rd floor drew 2 bids from veteran-owned firms in 2023."), source: "Award records" },
          { glyph: "ok", text: rt(`${PARTNER.name} is looking for a HUBZone firm for the mechanical and electrical work.`), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Veteran-owned certification: **none**. You are HUBZone."), source: "Your record" },
          { glyph: "ok", text: rt("Pope office building: HVAC and electrical work, CPARS Very Good."), source: "Your record" },
          { glyph: "warn", text: rt(`Your half, about ${usd(Math.round(job / 2))}, is more than your ${usd(LINE.single)} single-job bond.`), source: "Computed" },
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
  [HERO_IDS.hero]: trainingBuilding,
  [HERO_IDS.twin]: barracksHoldersOnly,
  [HERO_IDS.teamUp]: vaFanCoils,
};
