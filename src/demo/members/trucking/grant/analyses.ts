// THE TRUCKING COMPANY: what Grant's three hand-written reviews need besides
// words — which phrase to bold, which clause backs which claim, the lead times
// and the trail of checks. The words are in members/trucking/grantBriefs.ts (the
// hero) and briefs.ts (the twin and the team-up); src/demo/grant/encode.ts puts
// the two together.

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
/** "Brightwater Sustainment": the partner's short name. */
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

const COMMON_ROWS: RowSpec[] = [
  { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
  { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
];

// ═════════════════════════════════════════════════════════════════════════
// The hero: supply and linen runs for the Fayetteville VA — Bid as prime
// ═════════════════════════════════════════════════════════════════════════

const vaLinenRoutes: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  return {
    path: "prime",
    checks: [22, 6],
    lead: { ppq: 5, writing: 3 },
    gistBold: "only service-disabled veteran-owned firms can quote",
    thesisBold: ["the VA trucking you're built for"],
    limitKinds: ["responsibility", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "the **other service-disabled veteran-owned carriers** and the courier firms that already run VA routes in the region",
    readBold: {
      "Is it your kind of work?": "the same work as your daily clinic routes",
      "Does the size fit?": "about 9% of your revenue",
      "Can you perform there?": "across town from your yard",
      "Can you do the work?": "none of your drivers holds a hazmat endorsement",
      "Can you win it?": "Only service-disabled veteran-owned firms can quote",
      "Will you make money?": "every 50-cent rise in diesel costs you about $6,000 a year",
      "Can you survive winning?": "Your $150K credit line carries the first two months",
      "Do you understand the buyer's intent?": "a named PM and Alternate it can call from 6 AM to 6 PM",
      "Does this move you forward?": "A five-year VA contract and a rating from it",
    },
    readPins: {
      "Is it your kind of work?": [cp("routes"), cp("equipment"), record("pp-quarry-lane-routes", "Your Quarry Lane routes")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}. The VA's range is ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} a year, for ${f.years} years.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to the Fayetteville VA Medical Center: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("license"), cp("drivers"), cp("routes")],
      "Can you win it?": [cp("setAside"), cp("factors")],
      "Will you make money?": [cp("price"), cp("wage"), pinComputed("Fuel", "About 400 miles a day for 250 days is 100,000 miles a year. At 8 miles a gallon that is 12,500 gallons, so each 50-cent rise in diesel costs about $6,250 a year.")],
      "Can you survive winning?": [cp("term"), cp("insurance")],
      "Do you understand the buyer's intent?": [cp("staff"), cp("factors")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you do the work?": [
        "**The license line.** The price schedule asks for a hazardous material license number. None of your drivers holds a hazmat endorsement, and linen and supplies are not usually hazmat. Ask in Q&A which license they mean; every bidder sees the answer.",
        "**The bond.** Drivers must be bonded, but the amount is not stated. Ask in the same question.",
      ],
      "Can you win it?": [
        "Only service-disabled veteran-owned firms can quote. That removes the large carriers and most courier firms.",
        "Your yard is across town from the warehouse, so your trucks start the day with no empty miles.",
      ],
      "Will you make money?": [
        "The VA pays a fixed price for each year. If diesel rises in year three, the rise comes out of your margin unless you priced it in.",
        "Wages are different: FAR 52.222-43 adjusts the price when a new wage determination comes with an option year.",
      ],
      "Do you understand the buyer's intent?": [
        "Six sites wait for clean linen every morning. A missed route is a day of patient care without supplies.",
        "That is why the route plan, the spare truck and the backup driver are scored first.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      ...COMMON_ROWS,
      { match: /VetCert/, kind: "setAside", category: "eligibility", required: "SDVOSB certified" },
      { match: /USDOT/, kind: "authority", category: "eligibility", required: "active operating authority" },
      { match: /Hazardous material/, kind: "license", category: "submission", required: "a license number on the price schedule", closable: true },
      { match: /Bonded drivers/, kind: "drivers", category: "eligibility", required: "bonded drivers who pass the VA's check" },
      { match: /PM and Alternate/, kind: "staff", category: "artifact", required: "a named PM and Alternate", closable: true },
      { match: /wage determination/, kind: "wage", category: "submission", required: "the wage determination's rates" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Look closer", "your biggest price risk goes away"],
    redTeamBold: ["the third box truck as the spare", "you carry no empty miles to the first stop"],
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Set-aside: **service-disabled veteran-owned small business**. You hold the certification."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. It is your primary code.`), source: sourceOf(sol, "naics") },
          { glyph: "warn", text: rt("The price schedule asks for a **hazardous material license number**."), source: sourceOf(sol, "license") },
          { glyph: "warn", text: rt("Drivers must be **bonded**; the amount is not stated."), source: sourceOf(sol, "drivers") },
          { glyph: "warn", text: rt("Five **fixed-price** years, with no fuel adjustment."), source: sourceOf(sol, "price") },
          { glyph: "ok", text: rt("**No bid or performance bond** is required."), source: sourceOf(sol, "insurance") },
          { glyph: "neutral", text: rt("Scoring: the route plan first, past performance second, then price."), source: sourceOf(sol, "factors") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("VA's chilled routes out of Hampton, set aside the same way, drew **2 offers**."), source: "Award records" },
          { glyph: "neutral", text: rt("Bidders on Durham's 2026 courier asked the same license and bond questions."), source: "SAM.gov" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 7,
        items: [
          { glyph: "ok", text: rt("Four box trucks with lift gates: two for the routes and a spare."), source: "Your record" },
          { glyph: "ok", text: rt("Quarry Lane Medical Supply: daily box-truck routes to 14 clinics since 2021."), source: "Your record" },
          { glyph: "warn", text: rt("**No hazmat endorsements** among your 12 drivers."), source: "Your record" },
          { glyph: "warn", text: rt("No résumés on file yet for a PM and an Alternate."), source: "Your record" },
          { glyph: "ok", text: rt(`The yearly value, about ${usd(annual)}, is about ${pct(annual / PERSONA.annualRevenue)} of your yearly revenue.`), source: "Computed" },
        ],
      },
    ],
    coverage: coverageFor(sol, { C: "reviewed_with_findings" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Get the VA's answer on the license line and the fuel clause, and I can call this with full confidence.",
    citations: [cp("license"), cp("price")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The twin: secure freight runs from DLA Distribution Cherry Point — No-bid
// ═════════════════════════════════════════════════════════════════════════

const secureFreight: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  const roadmap: RoadmapItem[] = [
    {
      item: rt("**Bid the VA routes** first"),
      whyItMattered: rt("Your trucks, your size and your set-aside. A five-year VA contract is the record every federal freight buyer reads."),
      whatItTakes: rt("The quote is open now. Answer Ava's three questions and send the license and fuel questions before Q&A closes."),
    },
    {
      item: rt("A place in **SDDC's carrier program**"),
      whyItMattered: rt("DoD books its freight through carriers SDDC has registered. Every secure-cargo carrier started there."),
      whatItTakes: rt("Three straight years of DOT authority (you have nine), a SCAC, a Syncada account, a DoD bond and cargo insurance. Diana's checklist covers it."),
      cta: { kind: "mentor" },
    },
    {
      item: rt("A few years of **DoD freight**"),
      whyItMattered: rt("Protective-service approval goes to carriers with a DoD record. Hauling DoD loads builds it."),
      whatItTakes: rt("Loads through SDDC once you are registered, or as a carrier under Crowley's DoD freight contract."),
    },
    {
      item: rt("A **watch** on secure-freight notices"),
      whyItMattered: rt("When you are ready, the next protective-service notice gives you more time if you see it on day one."),
      whatItTakes: rt("Save a Hunter search for DLA and USTRANSCOM secure freight. It takes two minutes."),
    },
  ];
  return {
    path: "skip",
    checks: [14, 4],
    lead: { writing: 1 },
    gistBold: "Don't bid",
    thesisBold: ["you are not one", "a security clearance for your company and cleared drivers", "start SDDC's carrier program"],
    limitKinds: ["disqualifier", "responsibility"],
    readBold: {
      "Is it your kind of work?": "You haul neither",
      "Does the size fit?": "On size alone it would fit",
      "Can you perform there?": "long trips and nights away",
      "Can you do the work?": "You have neither",
      "Can you win it?": "you can't even get the papers",
      "Will you make money?": "there is no price to make",
      "Can you survive winning?": "would take years and a sponsor",
      "Do you understand the buyer's intent?": "settled before the notice posts",
      "Does this move you forward?": "SDDC's carrier program is the first step",
    },
    readPins: {
      "Is it your kind of work?": [cp("needs"), record("pp-cypress-bend-reefer", "Your Cypress Bend loads")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}.`)],
      "Can you perform there?": [cp("place")],
      "Can you do the work?": [cp("clearance"), cp("hazmat")],
      "Can you win it?": [cp("carrier")],
      "Will you make money?": [cp("carrier")],
      "Can you survive winning?": [cp("clearance")],
      "Do you understand the buyer's intent?": [cp("carrier"), cp("needs")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "One clause decides it: only Surface Deployment and Distribution Command (SDDC) Protective Security Service (PSS) approved freight carriers are eligible to receive this solicitation.",
        "Nothing you send before the due date puts you on that list.",
      ],
      "Does this move you forward?": [
        "SDDC's Freight Carrier Registration Program is the door to DoD freight. You meet its three-year authority rule today.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /small business set-aside/, kind: "setAside", category: "eligibility", required: "a small business" },
      { match: /SDDC/, kind: "carrier", category: "eligibility", required: "an SDDC-approved secure carrier", closable: false, firmValue: "not approved" },
      { match: /clearance/, kind: "clearance", category: "eligibility", required: "a company clearance and cleared drivers", closable: false, firmValue: "none" },
      { match: /Hazmat/, kind: "hazmat", category: "eligibility", required: "hazmat endorsements", closable: false, firmValue: "none of your drivers" },
    ],
    nextBold: "Spend this month on that quote",
    wouldChangeBold: ["outside SDDC's approved list", "join SDDC's carrier program"],
    redTeamBold: ["You can't even get the solicitation", "every driver on a SECRET load needs a clearance", "You meet its three-year authority rule"],
    gapToWin: [
      { item: "**SDDC approval** for protective security service", have: false },
      { item: "A **company clearance** and cleared drivers", have: false },
    ],
    roadmap,
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("Only **SDDC-approved protective service carriers** can receive it."), source: sourceOf(sol, "carrier") },
          { glyph: "blocked", text: rt("SECRET cargo: a **company clearance** and cleared drivers."), source: sourceOf(sol, "clearance") },
          { glyph: "warn", text: rt("Hazmat on some loads: **hazmat endorsements**."), source: sourceOf(sol, "hazmat") },
          { glyph: "ok", text: rt("Set-aside: **total small business**. You are small."), source: sourceOf(sol, "setAside") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("Only carriers already on SDDC's approved list can offer."), source: "Notice" },
          { glyph: "neutral", text: rt("DLA's last protective-service freight award drew 5 offers."), source: "Award records" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 4,
        items: [
          { glyph: "blocked", text: rt("SDDC approval, company clearance, cleared drivers: **none** of the three."), source: "Your record" },
          { glyph: "ok", text: rt("Truckload runs across NC and SC fit the rest of the work."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { A: "reviewed_with_findings", C: "reviewed_with_findings" }),
    briefingBold: [undefined, "I stopped at the clause on who can receive the solicitation", undefined],
    remedy: "Nothing you tell me changes who can receive this solicitation.",
    citations: [cp("carrier"), cp("clearance")],
    clearance: { fcl: "SECRET", personnel: "SECRET" },
  };
};

// ═════════════════════════════════════════════════════════════════════════
// The team-up: Fort Bragg's base logistics contract — prime no-go, subcontract go
// ═════════════════════════════════════════════════════════════════════════

const braggLogistics: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  const openQuestions: OpenQuestion[] = [
    {
      id: "talked-to-partner",
      question: rt(`Have you talked with **${PARTNER.name}** about Fort Bragg's logistics contract?`),
      payoff: rt("A yes turns the subcontract path from an idea into a **plan**."),
      verdictSwing: 0.6,
      input: { kind: "yesno" },
      status: "open",
      chipNoun: "prime",
    },
  ];
  return {
    // The notice is a draft for comment, but the call is about the contract behind
    // it: the page shows Bid with the prime path no-go and the subcontract path go.
    path: "sub",
    checks: [16, 5],
    lead: { subQuote: 5, writing: 1 },
    gistBold: "Team up",
    thesisBold: ["the prime seat is not yours", "run the local freight and trailer moves"],
    limitKinds: ["disqualifier", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "other **local carriers** that EAGLE holders already use",
    readBold: {
      "Is it your kind of work?": "You made 46 of those moves",
      "Does the size fit?": "about 20 times your revenue",
      "Can you perform there?": "you know its gates",
      "Can you do the work?": "Supply and maintenance are not your trades",
      "Can you win it?": `As a subcontractor you share in the work if ${BLUE} wins`,
      "Will you make money?": "agree on the rates in the teaming agreement",
      "Can you survive winning?": "Price for being paid after",
      "Do you understand the buyer's intent?": "no gap when the current contract ends",
      "Does this move you forward?": "Teaming is how you get in",
    },
    readPins: {
      "Is it your kind of work?": [cp("work"), record("pp-bragg-trailer-hauling", "Your 18th Airborne Corps hauling")],
      "Does the size fit?": [cp("current"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${Math.round(annual / PERSONA.annualRevenue)} times.`)],
      "Can you perform there?": [cp("work")],
      "Can you do the work?": [cp("work")],
      "Can you win it?": [cp("setAside")],
      "Will you make money?": [cp("teaming")],
      "Can you survive winning?": [cp("teaming")],
      "Do you understand the buyer's intent?": [cp("current")],
      "Does this move you forward?": [targets()],
    },
    readDossier: {
      "Can you win it?": [
        "Only holders of the Army's EAGLE ordering agreement can bid on the task order. A carrier off the agreement can't hold the prime contract.",
        `${BLUE} holds the agreement and runs Fort Bragg's logistics contract today. It wants a local service-disabled veteran-owned carrier for the transportation division. Your share comes from the teaming agreement.`,
      ],
      "Does this move you forward?": [
        "Your federal record today is one prime: the 18th Airborne Corps hauling. Five years of freight on Fort Bragg's logistics contract adds a second, larger one.",
      ],
    },
    limiting: "Can you win it?",
    blocking: ["Can you win it?"],
    rows: [
      ...COMMON_ROWS,
      { match: /EAGLE agreement/, kind: "setAside", category: "eligibility", required: "an EAGLE agreement holder", closable: false, firmValue: "not a holder" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Similar work/, kind: "ask", category: "artifact", required: "similar work, with a contact" },
      { match: /Teaming agreement/, kind: "teaming", category: "submission", required: "partners and the share each does" },
    ],
    nextBold: `Reply to ${PARTNER.contact} this week`,
    wouldChangeBold: ["the size still points to a subcontract", "another EAGLE holder"],
    redTeamBold: ["Only EAGLE holders can bid", "for five years", "Your 46 moves for the 18th Airborne Corps"],
    gapToWin: [
      { item: "An **EAGLE agreement holder** to team with", have: false },
      { item: "A **teaming agreement** that names your share", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the notice",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Draft for comment: the Army asks **what firms think** of the work statement."), source: sourceOf(sol, "purpose") },
          { glyph: "blocked", text: rt("Only **EAGLE agreement holders** can bid on the task order."), source: sourceOf(sol, "setAside") },
          { glyph: "warn", text: rt(`About **${usd(annual)} a year** when the current task order ends on June 30, 2027.`), source: sourceOf(sol, "current") },
          { glyph: "ok", text: rt("Transportation includes **trailer and container moves** on post."), source: sourceOf(sol, "work") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [
          { glyph: "neutral", text: rt("The 2016 task order drew 19 offers, full and open, among EAGLE holders."), source: "Award records" },
          { glyph: "ok", text: rt(`${PARTNER.name} is looking for a local service-disabled veteran-owned carrier.`), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("EAGLE agreement: **not a holder**."), source: "Your record" },
          { glyph: "ok", text: rt("46 trailer and container moves for the 18th Airborne Corps, 2025–2026."), source: "Your record" },
          { glyph: "ok", text: rt(`A yard ${f.miles} miles from Fort Bragg, and a driver who knows its gates.`), source: "Your record" },
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
  [HERO_IDS.hero]: vaLinenRoutes,
  [HERO_IDS.twin]: secureFreight,
  [HERO_IDS.teamUp]: braggLogistics,
};
