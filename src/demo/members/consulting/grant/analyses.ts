// THE AGENCY: what Grant's three hand-written reviews need besides words — which
// phrase to bold, which clause backs which claim, the lead times and the trail of
// checks. The words are in members/agency/grantBriefs.ts (the hero) and briefs.ts
// (the twin and the team-up); src/demo/grant/encode.ts puts the two together.

import { coverageFor } from "@/demo/grant/coverage";
import type { RowSpec } from "@/demo/grant/encode";
import { factsFor, PARTNER, usd } from "@/demo/grant/facts";
import type { Maker } from "@/demo/grant/heroAnalyses";
import { pinComputed, rt } from "@/demo/grant/rich";
import { clausePin, naicsLabel, type Solicitation } from "@/demo/grant/solicitation";
import { getOpportunity } from "@/demo/story/opportunities";
import { findPastPerformance, PERSONA } from "@/demo/story/persona";
import type { OpenQuestion, Pin, RoadmapItem } from "@/lib/grant/types";
import { HERO_IDS } from "../opportunities";

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const revenue = usd(PERSONA.annualRevenue);
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
// The hero: Family Advocacy print and digital campaign — Bid as prime
// ═════════════════════════════════════════════════════════════════════════

const familyAdvocacyPrint: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  return {
    path: "prime",
    checks: [22, 6],
    lead: { ppq: 5, subQuote: 7, writing: 3 },
    gistBold: "only woman-owned firms can bid",
    thesisBold: ["a strong next federal prime for you"],
    limitKinds: ["responsibility", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "the **other woman-owned agencies and publishers** near Fort Bragg who list your code",
    readBold: {
      "Is it your kind of work?": "you ran the NC Guard's recruiting campaign the same way",
      "Does the size fit?": "about 15% of your revenue",
      "Can you perform there?": "12 miles from your office",
      "Can you do the work?": "Two things need you before the due date",
      "Can you win it?": "Your video crew",
      "Will you make money?": "Lock rates with all four papers",
      "Can you survive winning?": "carry about two months of print and media buys",
      "Do you understand the buyer's intent?": "Reach and plain, trusted messages are scored first",
      "Does this move you forward?": "A second federal prime, at Fort Bragg",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope"), record("pp-ncng-recruiting", "Your NC Guard campaign")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}. The Army's range is ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} a year, for ${f.years} years.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to Fort Bragg: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("app"), cp("print")],
      "Can you win it?": [cp("setAside"), cp("factors")],
      "Will you make money?": [cp("print"), cp("price")],
      "Can you survive winning?": [cp("insurance"), cp("term")],
      "Do you understand the buyer's intent?": [cp("factors"), cp("needs")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "**The app line.** The work statement asks for ads on the contractor's own mobile app. You have none. Ask in Q&A whether a news partner's app counts; every bidder sees the answer.",
        "**Print rates.** One ad a week in each of four papers, at a fixed price for up to five years. Get signed quotes from all four, locked 12 months, with a stated increase for each option year.",
      ],
      "Can you win it?": [
        "Only woman-owned small businesses can bid. That removes the large agencies and most publishers.",
        "Your own crew makes the 24 videos. That is the part a publisher would have to buy.",
      ],
      "Will you make money?": [
        "The Army pays a fixed price for each year. If a paper raises its rates in year three, the increase comes out of your margin unless you priced it in.",
      ],
      "Can you survive winning?": [
        "No bond, so no cash is tied up before the work starts.",
        `The base year adds about ${pct(annual / PERSONA.annualRevenue)} to your yearly revenue. One freelancer for the busy shoot months keeps the team from stretching.`,
      ],
      "Do you understand the buyer's intent?": [
        "The Family Advocacy Program helps military families prevent abuse and get help early. It wants families to know where help is before a crisis.",
        "That is why reach is scored first. Lead your quote with how you reach families within 30 miles of post.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      ...COMMON_ROWS,
      { match: /WOSB/, kind: "setAside", category: "eligibility", required: "WOSB certified" },
      { match: /mobile app/, kind: "app", category: "submission", required: "ads on the contractor's own app", closable: true },
      { match: /project manager/, kind: "staff", category: "artifact", required: "a named project manager and alternate" },
      { match: /local papers/, kind: "print", category: "submission", required: "a weekly ad in each of four papers" },
      { match: /references/, kind: "content", category: "artifact", required: "two references" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Needs review", "a stated increase"],
    redTeamBold: ["Two videos a month fits your crew", "the set-aside limits bidders"],
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Set-aside: **woman-owned small business**. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. It is your primary code.`), source: sourceOf(sol, "naics") },
          { glyph: "warn", text: rt("Ads on **the contractor's own mobile app**. You have no app."), source: sourceOf(sol, "app") },
          { glyph: "warn", text: rt("A weekly ad in **four local papers**, at a fixed price for up to five years."), source: sourceOf(sol, "print") },
          { glyph: "ok", text: rt("**No bond** is required."), source: sourceOf(sol, "insurance") },
          { glyph: "neutral", text: rt("Scoring: reach and messages first, past performance second, then price."), source: sourceOf(sol, "factors") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("The last award for this work went to a **local publisher**, not an agency."), source: "Award records" },
          { glyph: "neutral", text: rt("Four woman-owned agencies within 100 miles list your code."), source: "SAM.gov" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 7,
        items: [
          { glyph: "ok", text: rt("Your 2-person video crew can make two videos a month."), source: "Your record" },
          { glyph: "warn", text: rt("NC Guard campaign: same Army, same audience. **No performance rating** written yet."), source: "Your record" },
          { glyph: "warn", text: rt("No résumés on file yet for a project manager and an alternate."), source: "Your record" },
          { glyph: "ok", text: rt("General liability insurance on file."), source: "Your record" },
          { glyph: "ok", text: rt(`The yearly value, about ${usd(annual)}, is about ${pct(annual / PERSONA.annualRevenue)} of your yearly revenue.`), source: "Computed" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Get the Army's answer on the app line and lock your print rates, and I can call this with full confidence.",
    citations: [cp("app"), cp("factors")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The twin: Family Advocacy TV and streaming ads — No-bid
// ═════════════════════════════════════════════════════════════════════════

const familyAdvocacyStreaming: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  // The days left on the print and digital campaign: the quote the roadmap points at.
  const days = factsFor(getOpportunity(HERO_IDS.hero)!).daysLeft;
  const roadmap: RoadmapItem[] = [
    {
      item: rt("**Bid the print and digital campaign** first"),
      whyItMattered: rt("Same office and same program. Work there puts your name in front of the people who write the next video notice."),
      whatItTakes: rt(`The quote is open now. Answer Ava's three questions and lock your print rates. That fits inside ${days} days.`),
    },
    {
      item: rt("A reply to the next **sources sought**"),
      whyItMattered: rt(`A sources sought comes before the work statement. That is when a buyer can still add "or equal" platforms and production teams.`),
      whatItTakes: rt(`An hour to reply when it posts: say what you can deliver, and ask for "or equal".`),
      cta: { kind: "mentor" },
    },
    {
      item: rt("A profile that **video buyers can find**"),
      whyItMattered: rt("Buyers search SBA's small business database before they write a notice. Video work and samples on your profile put you on their list."),
      whatItTakes: rt("A day to set up your visibility profile."),
      cta: { kind: "dfy", service: "SBS Visibility Setup" },
    },
    {
      item: rt("A **watch** on Family Advocacy video notices"),
      whyItMattered: rt("The next video notice gives you more time if you see it on day one."),
      whatItTakes: rt("Save a Hunter search for Fort Bragg TV and streaming notices. It takes two minutes."),
    },
  ];
  return {
    path: "skip",
    checks: [14, 4],
    lead: { writing: 3 },
    gistBold: "Don't bid",
    thesisBold: ["one provider's own streaming app", "reselling a package you don't control", "the print and digital campaign"],
    limitKinds: ["disqualifier", "winning-hurts"],
    readBold: {
      "Is it your kind of work?": "the provider's own team makes the ads",
      "Does the size fit?": "On size alone it fits",
      "Can you perform there?": `${f.miles} miles from your office`,
      "Can you do the work?": "You don't own any of the three",
      "Can you win it?": "Only the provider that owns that app, crew and data can meet all three",
      "Will you make money?": "add a markup to the provider's own price",
      "Can you survive winning?": "Every deliverable would come from another company",
      "Do you understand the buyer's intent?": "with viewer numbers it can report",
      "Does this move you forward?": "builds no video record of your own",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope"), cp("production")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}.`)],
      "Can you perform there?": [cp("place")],
      "Can you do the work?": [cp("streaming"), cp("production"), cp("viewers")],
      "Can you win it?": [cp("streaming")],
      "Will you make money?": [cp("price")],
      "Can you survive winning?": [cp("viewers"), cp("term")],
      "Do you understand the buyer's intent?": [cp("needs")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "Three clauses decide it: streaming via the provider's own subscriber app, commercials fully produced by the provider's production team, and monthly reports from the provider's own viewer data.",
        "Each one names something only that provider owns. Nothing you send before the due date changes that.",
      ],
      "Does this move you forward?": [
        "The print and digital campaign is the same office and the same program, and only woman-owned firms can bid. Work there is the record you want.",
      ],
    },
    limiting: "Can you do the work?",
    blocking: ["Can you do the work?"],
    rows: [
      ...COMMON_ROWS,
      { match: /small business set-aside/, kind: "setAside", category: "eligibility", required: "a small business" },
      { match: /subscriber app/, kind: "streaming", category: "eligibility", required: "the provider's own app", closable: false, firmValue: "none of your own" },
      { match: /production team/, kind: "production", category: "eligibility", required: "the provider's production team", closable: false, firmValue: "your crew is not that team" },
      { match: /viewer data/, kind: "viewers", category: "eligibility", required: "the provider's viewer data", closable: false, firmValue: "only the provider holds it" },
    ],
    nextBold: "Spend this month on that quote",
    wouldChangeBold: ["or equal", "a subcontract"],
    redTeamBold: ["a markup on another company's package", "Only if it asks", "the sources sought"],
    gapToWin: [{ item: "The provider's own **subscriber app**, production team and viewer data", have: false }],
    roadmap,
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Streaming **via the provider's own subscriber app**."), source: sourceOf(sol, "streaming") },
          { glyph: "blocked", text: rt("Commercials **made by the provider's production team**."), source: sourceOf(sol, "production") },
          { glyph: "blocked", text: rt("Monthly reports from **the provider's viewer data**."), source: sourceOf(sol, "viewers") },
          { glyph: "ok", text: rt("Set-aside: **total small business**. You are small."), source: sourceOf(sol, "setAside") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("Only the provider that owns the app, the crew and the data can meet all three."), source: "Notice" },
          { glyph: "neutral", text: rt("The 2024 sources sought for this work used the same wording."), source: "SAM.gov" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 4,
        items: [
          { glyph: "blocked", text: rt("Streaming app, production team, viewer data: **none** of the three."), source: "Your record" },
          { glyph: "ok", text: rt("Captioned video and ad buying fit the rest of the work."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings" }),
    briefingBold: [undefined, "I stopped at the streaming clause", undefined],
    remedy: "Nothing you tell me changes who owns the app, the crew and the data.",
    citations: [cp("streaming"), cp("production")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The team-up: VA hiring campaign — prime no-go, subcontract go
// ═════════════════════════════════════════════════════════════════════════

const vaHiring: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  const openQuestions: OpenQuestion[] = [
    {
      id: "talked-to-partner",
      question: rt(`Have you talked with **${PARTNER.name}** about this campaign?`),
      payoff: rt("A yes turns the subcontract path from an idea into a **plan**."),
      verdictSwing: 0.6,
      input: { kind: "yesno" },
      status: "open",
      chipNoun: "prime",
    },
  ];
  return {
    // The notice is a sources sought, but the call is about the contract behind it:
    // the page shows Bid with the prime path no-go and the subcontract path go (a
    // "sources-sought" notice type would show "Reply" and hide both paths).
    path: "sub",
    checks: [16, 5],
    lead: { subQuote: 5, writing: 1 },
    gistBold: "Team up",
    thesisBold: ["the prime seat is not yours", "run the Southeast video shoots"],
    limitKinds: ["disqualifier", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "other **video crews** that veteran-owned primes already use",
    readBold: {
      "Is it your kind of work?": "Hiring campaigns are your record",
      "Does the size fit?": "times your revenue",
      "Can you perform there?": "Your crew can reach most of the NC, VA and SC sites in a day",
      "Can you do the work?": "not the whole program",
      "Can you win it?": `As a subcontractor you share in the work if ${BLUE} wins`,
      "Will you make money?": "you carry none of the national media cost",
      "Can you survive winning?": "price for a longer wait",
      "Do you understand the buyer's intent?": "Local stories filmed at each center",
      "Does this move you forward?": "a second federal buyer and a national program",
    },
    readPins: {
      "Is it your kind of work?": [cp("purpose"), record("pp-longleaf-hiring", "Your Longleaf campaign")],
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
        "The VA expects to set the follow-on aside for service-disabled veteran-owned firms. A woman-owned firm can't hold the prime contract.",
        `${BLUE} is service-disabled veteran-owned and wants a woman-owned crew for the Southeast shoots. Your share comes from the teaming agreement.`,
      ],
      "Does this move you forward?": [
        "Your federal record today is one prime: the NC Guard campaign. A national VA program adds a second buyer and a larger program.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /SDVOSB/, kind: "setAside", category: "eligibility", required: "service-disabled veteran-owned", closable: false, firmValue: "woman-owned, not veteran-owned" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Recruitment campaign/, kind: "ask", category: "artifact", required: "past customers, with a contact" },
      { match: /Teaming agreement/, kind: "teaming", category: "submission", required: "partners and the share each does" },
    ],
    nextBold: `Reply to ${PARTNER.contact} this week`,
    wouldChangeBold: ["the size still points to a subcontract", "another veteran-owned prime"],
    redTeamBold: ["The veteran-owned firm has to lead", "worth more than the margin", "wants a woman-owned crew"],
    gapToWin: [
      { item: "A **service-disabled veteran-owned prime** to team with", have: false },
      { item: "A **teaming agreement** that names your share", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the notice",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Sources sought: the VA asks **who could run the campaign**."), source: sourceOf(sol, "purpose") },
          { glyph: "blocked", text: rt("Set-aside expected: **service-disabled veteran-owned** firms."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt(`About **${usd(annual)} a year** when the current contract ends in September 2027.`), source: sourceOf(sol, "current") },
          { glyph: "neutral", text: rt("Teaming replies should name the partners and each one's share."), source: sourceOf(sol, "teaming") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [{ glyph: "ok", text: rt(`${PARTNER.name} is looking for a woman-owned video crew.`), source: "Partners" }],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Veteran-owned certification: **none**. You are woman-owned."), source: "Your record" },
          { glyph: "ok", text: rt("Longleaf Home Health hiring campaign: recruiting videos, paid social and a lead form."), source: "Your record" },
          { glyph: "ok", text: rt("A 2-person video crew and an edit suite in Fayetteville."), source: "Your record" },
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
  [HERO_IDS.hero]: familyAdvocacyPrint,
  [HERO_IDS.twin]: familyAdvocacyStreaming,
  [HERO_IDS.teamUp]: vaHiring,
};
