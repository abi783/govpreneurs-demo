// THE JANITORIAL FIRM: what Grant's three hand-written reviews need besides
// words — which phrase to bold, which clause backs which claim, the lead times
// and the trail of checks. The words are in members/janitorial/grantBriefs.ts
// (the hero) and briefs.ts (the twin and the team-up); src/demo/grant/encode.ts
// puts the two together.

import { coverageFor } from "@/demo/grant/coverage";
import type { RowSpec } from "@/demo/grant/encode";
import { PARTNER, usd } from "@/demo/grant/facts";
import type { Maker } from "@/demo/grant/heroAnalyses";
import { pinComputed, rt } from "@/demo/grant/rich";
import { clausePin, naicsLabel, type Solicitation } from "@/demo/grant/solicitation";
import { findPastPerformance } from "@/demo/story/persona";
import { getOpportunity } from "@/demo/story/opportunities";
import { PERSONA } from "../persona";
import type { OpenQuestion, Pin, RoadmapItem } from "@/lib/grant/types";
import { HERO_IDS } from "../opportunities";

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const revenue = usd(PERSONA.annualRevenue);
/** "Ashepoo": the partner's short name. */
const ASH = PARTNER.name.split(" ")[0];

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
// The hero: pressure washing and sandblasting, Fort Bragg — Bid as prime
// ═════════════════════════════════════════════════════════════════════════

const pressureWashing: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? f.mid ?? 0;
  return {
    path: "prime",
    checks: [24, 7],
    lead: { subQuote: 8, writing: 3 },
    gistBold: "your set-aside",
    thesisBold: ["a strong first Army prime for you"],
    limitKinds: ["responsibility", "proposal-weakness", "responsibility"],
    competitiveRisk: "the **incumbent and the other HUBZone cleaning firms** near Fort Bragg",
    readBold: {
      "Is it your kind of work?": "That is the Seymour Johnson dorm job",
      "Does the size fit?": "roughly 10% of your revenue",
      "Can you perform there?": "12 miles from your office",
      "Can you do the work?": "you don't own a blaster",
      "Can you win it?": "Only HUBZone firms can quote",
      "Will you make money?": "One square-foot price for up to five years",
      "Can you survive winning?": "carry five weeks of crew pay and fuel",
      "Do you understand the buyer's intent?": "child-safe chemicals at the child development centers",
      "Does this move you forward?": "Your first Army prime and a CPARS from it",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-sj-dorm-wash", "Your Seymour Johnson job")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to Fort Bragg: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("sandblast"), cp("demand")],
      "Can you win it?": [cp("setAside"), cp("evaluate")],
      "Will you make money?": [cp("price"), cp("wage"), pinComputed("Wage rates", "WD 2015-4377, Rev. 33: General Maintenance Worker $21.41 plus $5.92 health and welfare; Janitor $16.46 plus $5.92.")],
      "Can you survive winning?": [cp("payments")],
      "Do you understand the buyer's intent?": [cp("chemicals"), cp("keyPersonnel")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "**Sandblasting.** It is inside the same square-foot price, with the COR's approval. Ask how many square feet were blasted last year, and whether lead-painted surfaces are excluded.",
        "**Backup.** A Priority 1 call needs a crew on site in 2 hours. Keep one rig on post on weekdays, or line up a third.",
      ],
      "Will you make money?": [
        "The last award was $782,100 for five years: about 41¢ a square foot on 377,000 square feet a year.",
        "Wage increases are adjusted at each option year. Fuel, chemicals and equipment are not, so build them in for five years.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      ...COMMON_ROWS,
      { match: /HUBZone/, kind: "setAside", category: "eligibility", required: "HUBZone certified" },
      { match: /Project Manager/, kind: "keyPersonnel", category: "artifact", required: "named in the quote", closable: true },
      { match: /Sandblast/, kind: "sandblast", category: "artifact", required: "owned or subcontracted", closable: true },
      { match: /Backup/, kind: "demand", category: "artifact", required: "a backup rig for Priority 1 calls", closable: true },
      { match: /wage determination/, kind: "wage", category: "submission", required: "the wage determination's rates" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Look closer", "this gets stronger"],
    redTeamBold: ["Ask for the historical workload sheet", "if one rig stays on post on weekdays"],
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 9,
        items: [
          { glyph: "ok", text: rt("Set-aside: **HUBZone small business**. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. It is one of your codes.`), source: sourceOf(sol, "naics") },
          { glyph: "ok", text: rt("**Lowest price technically acceptable**: price decides among acceptable quotes."), source: sourceOf(sol, "evaluate") },
          { glyph: "warn", text: rt("**Sandblasting** sits inside the square-foot price."), source: sourceOf(sol, "sandblast") },
          { glyph: "warn", text: rt("Priority 1 calls: on site in **2 hours**, with backup equipment."), source: sourceOf(sol, "demand") },
          { glyph: "neutral", text: rt("A named Project Manager and QC manager."), source: sourceOf(sol, "keyPersonnel") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "neutral", text: rt("The 2016 and 2021 quotes each drew **6 HUBZone offers**."), source: "Award records" },
          { glyph: "neutral", text: rt("The 2021 award: **$782,100 for five years**, about 41¢ a square foot."), source: "Award records" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Seymour Johnson dorms: the same hot-water washing, **delivered in 2025**."), source: "Your record" },
          { glyph: "ok", text: rt("Two hot-water rigs and wash-water recovery; crews badged for post."), source: "Your record" },
          { glyph: "warn", text: rt("**No sandblaster** and no signed blasting-sub rate."), source: "Your record" },
          { glyph: "warn", text: rt("No QC manager résumé on file."), source: "Your record" },
          { glyph: "ok", text: rt("General liability insurance on file. No bond needed."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings", B: "reviewed_with_findings" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Get the Army's answer on sandblasting and the wage class, and a signed blasting-sub rate, and I can call this with full confidence.",
    citations: [cp("setAside"), cp("sandblast")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The twin: custodial for ten buildings, headed to AbilityOne — No-bid
// ═════════════════════════════════════════════════════════════════════════

const tenBuildings: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const hero = getOpportunity(HERO_IDS.hero)!;
  const roadmap: RoadmapItem[] = [
    {
      item: rt("The **pressure-washing quote** at Fort Bragg"),
      whyItMattered: rt("Same office, same post, and open to HUBZone firms. It is the competed cleaning work Fort Bragg buys from firms like yours."),
      whatItTakes: rt(`Answer Ava's three questions and send the sandblasting question before questions close. Quotes are due in ${hero.closesInDays} days.`),
    },
    {
      item: rt("A **watch** on AbilityOne additions"),
      whyItMattered: rt("The Commission posts proposed additions in the Federal Register with a comment period. If one ever targets work you hold, that is your chance to show the harm."),
      whatItTakes: rt("Save a Hunter search for Procurement List notices in North Carolina. It takes two minutes."),
    },
    {
      item: rt("The **one-time floor jobs** on post"),
      whyItMattered: rt("Special Operations and the Guard buy floor and deep-clean jobs on their own, set aside for small businesses."),
      whatItTakes: rt("Quote the SOF floor and restroom deep clean this week. Your floor crew can do it over a weekend."),
    },
    {
      item: rt("A **mentor's read** on where else to grow"),
      whyItMattered: rt("Most custodial work near Fort Bragg is AbilityOne, 8(a) or veteran-owned. Diana knows which buyers still compete it."),
      whatItTakes: rt("Ask Diana for 20 minutes on the buyers that compete custodial work in your area."),
      cta: { kind: "mentor" },
    },
  ];
  return {
    path: "skip",
    checks: [14, 5],
    lead: { writing: 1 },
    gistBold: "Don't bid",
    thesisBold: ["headed to the AbilityOne list", "Spend the time on the pressure-washing quote"],
    limitKinds: ["disqualifier", "disqualifier"],
    readBold: {
      "Is it your kind of work?": "your night crews' work",
      "Does the size fit?": "The size would fit",
      "Can you perform there?": `${f.miles} miles from your office`,
      "Can you do the work?": "who the Army may buy it from, not the work",
      "Can you win it?": "can't be accepted at any price",
      "Will you make money?": "There is no price to make money on",
      "Can you survive winning?": "there is nothing to win",
      "Do you understand the buyer's intent?": "These buildings are being added to that contract",
      "Does this move you forward?": "the pressure-washing quote is due first",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-hope-mills-custodial", "Your Hope Mills job")],
      "Does the size fit?": [cp("value")],
      "Can you perform there?": [cp("place")],
      "Can you do the work?": [cp("needs")],
      "Can you win it?": [cp("setAside"), cp("mandatorySource")],
      "Will you make money?": [cp("evaluate")],
      "Can you survive winning?": [cp("insurance")],
      "Do you understand the buyer's intent?": [cp("mandatorySource")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "One line decides it: the work is being considered for the AbilityOne Program under FAR Subpart 8.7.",
        "Under 41 U.S.C. 8504 the Army must buy Procurement List services from a nonprofit agency that employs people who are blind or have significant disabilities. Nothing you send changes that.",
      ],
      "Do you understand the buyer's intent?": [
        "In March 2026 Fort Bragg's whole post-wide custodial contract went to one AbilityOne nonprofit. These ten buildings join it.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /AbilityOne/, kind: "mandatorySource", category: "eligibility", required: "a nonprofit agency the Commission names", closable: false, firmValue: "a commercial firm" },
    ],
    nextBold: "Same office, same post",
    wouldChangeBold: ["competes the work", "comment in the Federal Register"],
    redTeamBold: ["can't be accepted", "its own workforce", "Comment"],
    gapToWin: [{ item: "Being an **AbilityOne nonprofit agency**", have: false }],
    roadmap,
    trail: [
      {
        title: "Reading the special notice",
        checkCount: 5,
        items: [
          { glyph: "blocked", text: rt("The work is being considered for the **AbilityOne Program**."), source: sourceOf(sol, "setAside") },
          { glyph: "blocked", text: rt("Procurement List services go to **nonprofit agencies** by law."), source: sourceOf(sol, "mandatorySource") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, your primary code.`), source: sourceOf(sol, "naics") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("Fort Bragg's post-wide custodial went to **one AbilityOne nonprofit** in March 2026."), source: "Award records" },
          { glyph: "neutral", text: rt("No commercial firm has won custodial work on the post since."), source: "Award records" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 5,
        items: [
          { glyph: "blocked", text: rt("AbilityOne nonprofit agency: **no**. You are a commercial firm."), source: "Your record" },
          { glyph: "ok", text: rt("Custodial and floor care fit your crews, and they badge onto post."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { A: "reviewed_with_findings", C: "reviewed_with_findings" }),
    briefingBold: [undefined, "I stopped at the AbilityOne line", undefined],
    remedy: "Nothing you tell me changes who the Army may buy this from.",
    citations: [cp("setAside"), cp("mandatorySource")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The team-up: Army Reserve centers in NC and SC — prime no-go, subcontract go
// ═════════════════════════════════════════════════════════════════════════

const armyReserve: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
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
    // The notice is a sources sought, but the call is about the contract behind it:
    // the page shows Bid with the prime path no-go and the subcontract path go.
    path: "sub",
    checks: [16, 5],
    lead: { subQuote: 5, writing: 1 },
    gistBold: "Team up",
    thesisBold: ["the prime seat is not yours", "clean and mow the North Carolina centers near you"],
    limitKinds: ["disqualifier", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "other **local cleaning firms** that 8(a) primes already use",
    readBold: {
      "Is it your kind of work?": "your crews' work",
      "Does the size fit?": "at most half",
      "Can you perform there?": "The South Carolina sites are not",
      "Can you do the work?": "Drill weekends mean some weekend shifts",
      "Can you win it?": `As a subcontractor you share in the work if ${ASH} wins`,
      "Will you make money?": "Price each site from real crew hours",
      "Can you survive winning?": "No bond",
      "Do you understand the buyer's intent?": "one prime for every site",
      "Does this move you forward?": "Teaming is how you get in",
    },
    readPins: {
      "Is it your kind of work?": [cp("work"), record("pp-hope-mills-custodial", "Your Hope Mills job")],
      "Does the size fit?": [cp("current")],
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
        "The Corps expects to set the proposal aside for 8(a) firms. A HUBZone firm can't hold the prime contract.",
        `${ASH} holds the current contract and wants a local subcontractor for the North Carolina centers. Your share comes from the teaming agreement.`,
      ],
      "Does this move you forward?": [
        "Army Reserve and Seymour Johnson custodial near you are 8(a) work. A subcontract with an 8(a) prime is how a HUBZone firm gets it on its record.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
      { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
      { match: /Teaming agreement/, kind: "teaming", category: "submission", required: "partners and the share each does" },
      { match: /8\(a\)/, kind: "setAside", category: "eligibility", required: "an 8(a) firm", closable: false, firmValue: "HUBZone, not 8(a)" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Similar jobs/, kind: "ask", category: "artifact", required: "similar jobs, with a contact" },
    ],
    nextBold: `Reply to ${PARTNER.contact} this week`,
    wouldChangeBold: ["the reach still points to a subcontract", "another 8(a) firm"],
    redTeamBold: ["The 8(a) firm has to lead", "Up to half", "wants a local subcontractor"],
    gapToWin: [
      { item: "An **8(a) prime** to team with", have: false },
      { item: "A **teaming agreement** that names your sites and your share", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the notice",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Sources sought: the Corps asks **who could clean and mow** the Army Reserve centers."), source: sourceOf(sol, "purpose") },
          { glyph: "blocked", text: rt("Set-aside expected: **8(a) firms**."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt("**One prime for every site**, in two states."), source: sourceOf(sol, "work") },
          { glyph: "neutral", text: rt("Teaming replies should name the partners and each one's share."), source: sourceOf(sol, "teaming") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("The 2021 contract went to an 8(a) firm without competition."), source: "Award records" },
          { glyph: "ok", text: rt(`${PARTNER.name} is looking for a local subcontractor in North Carolina.`), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("8(a) certification: **none**. You are HUBZone."), source: "Your record" },
          { glyph: "ok", text: rt("Hope Mills: night custodial and park work for a town, since 2021."), source: "Your record" },
          { glyph: "warn", text: rt("No crews in South Carolina."), source: "Your record" },
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
  [HERO_IDS.hero]: pressureWashing,
  [HERO_IDS.twin]: tenBuildings,
  [HERO_IDS.teamUp]: armyReserve,
};
