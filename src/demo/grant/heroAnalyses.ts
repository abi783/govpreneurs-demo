// DEMO: the six hand-written Grant reviews.
//
// Three come from the story's briefs (story/grantBriefs.ts): Camp Mackall field
// meals, the Fayetteville cafe and the Cumberland County detention meals. Three are
// written in heroBriefs.ts: Fort Bragg dining (bid as a subcontractor), the
// Camp Mackall restricted site (no-bid) and the Fort Bragg sources sought (reply).
//
// A brief holds Grant's words. This file adds the rest that a screen needs: which
// phrase to bold, which clause of the solicitation backs which claim, the lead
// times, the trail of checks. `encodeBrief` (encode.ts) puts the two together.

import { isoDaysFromNow } from "@/demo/story/clock";
import { getGrantBrief } from "@/demo/story/grantBriefs";
import { HERO_IDS, getOpportunity } from "@/demo/story/opportunities";
import { PERSONA } from "@/demo/story/persona";
import type { OpenQuestion, Pin, RoadmapItem, TrailGroup } from "@/lib/grant/types";
import { encodeBrief, type Extras, type RowSpec } from "./encode";
import { AUTHORED_BRIEFS } from "./heroBriefs";
import { coverageFor } from "./coverage";
import { CERTIFIED, COOKS, factsFor, PARTNER, PP, shareWords, UNCERTIFIED, usd, type OppFacts } from "./facts";
import { rt, pinComputed, pinPublic } from "./rich";
import { clausePin, naicsLabel, type Solicitation } from "./solicitation";
import { solicitationFor } from "./detail";

type Maker = (f: OppFacts, sol: Solicitation) => Extras;

const pct = (n: number): string => `${Math.round(n * 100)}%`;
const revenue = usd(PERSONA.annualRevenue);

/** Rows every brief shares: how a requirement maps to a clause. */
const COMMON_ROWS: RowSpec[] = [
  { match: /SAM/, kind: "sam", category: "eligibility", required: "active at award" },
  { match: /NAICS/, kind: "naics", category: "eligibility", required: "your NAICS code" },
  { match: /HACCP|food-safety plan/i, kind: "haccp", category: "submission", required: "a written plan" },
  { match: /General liability/, kind: "insurance", category: "insurance", required: "$1M per occurrence" },
  { match: /vehicle/i, kind: "insurance", category: "insurance", required: "commercial vehicle cover" },
];

const sourceOf = (sol: Solicitation, kind: string): string => {
  for (const s of sol.sections) {
    const c = s.clauses.find((x) => x.kind === kind);
    if (c) return `§${c.ref}`;
  }
  return "Notice";
};

// ═════════════════════════════════════════════════════════════════════════
// Camp Mackall field meals
// ═════════════════════════════════════════════════════════════════════════

const fieldMeals: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  const trail: TrailGroup[] = [
    {
      title: "Reading the solicitation",
      checkCount: 8,
      items: [
        { glyph: "ok", text: rt("Set-aside: **woman-owned small business**. You hold the certification."), source: sourceOf(sol, "setAside") },
        { glyph: "ok", text: rt(`Industry code ${f.opp.naics}. It is your primary code, and you are small under it.`), source: sourceOf(sol, "naics") },
        { glyph: "ok", text: rt("**No bond** is required."), source: sourceOf(sol, "bond") },
        { glyph: "warn", text: rt(`Proof of a food-handler certificate for **every cook**. ${CERTIFIED} of ${COOKS} are on file.`), source: sourceOf(sol, "certs") },
        { glyph: "neutral", text: rt("Scoring: delivery plan first, menu variety second, then price."), source: sourceOf(sol, "factors") },
      ],
    },
    {
      title: "Checking the competition",
      checkCount: 6,
      items: [
        { glyph: "ok", text: rt("**No incumbent.** This is a new requirement."), source: "Award records" },
        { glyph: "neutral", text: rt("Six woman-owned caterers within 100 miles list your code."), source: "SAM.gov" },
      ],
    },
    {
      title: "Checking your business",
      checkCount: 7,
      items: [
        { glyph: "ok", text: rt("Two refrigerated vans can cover both drop points in one run."), source: "Your record" },
        { glyph: "ok", text: rt("HACCP plan on file from the Carolina Dining Group subcontract."), source: "Your record" },
        { glyph: "ok", text: rt("General liability and vehicle insurance on file."), source: "Your record" },
        { glyph: "warn", text: rt(`${UNCERTIFIED} of ${COOKS} cooks need a food-handler certificate.`), source: "Your record" },
        { glyph: "ok", text: rt(`The yearly value, about ${usd(annual)}, is ${shareWords(annual / PERSONA.annualRevenue)}.`), source: "Computed" },
      ],
    },
  ];
  return {
    path: "prime",
    checks: [21, 6],
    lead: { ppq: 5, writing: 3 },
    gistBold: "only woman-owned firms can bid",
    thesisBold: ["the right first federal prime for you"],
    limitKinds: ["responsibility", "winning-hurts", "proposal-weakness"],
    competitiveRisk: "the **other woman-owned caterers** near you. Six list your code within 100 miles",
    readBold: {
      "Is it your kind of work?": "you delivered 1,100 meals a day for the county schools",
      "Does the size fit?": "about a third of your revenue",
      "Can you perform there?": "can cover both drop points in one run",
      "Can you do the work?": "Two things need you before the due date",
      "Can you win it?": "no incumbent",
      "Will you make money?": "leaves room after the wage-determination rates",
      "Can you survive winning?": "The quote asks for no bond",
      "Do you understand the buyer's intent?": "On-time delivery is scored first",
      "Does this move you forward?": "A first federal prime at Fort Bragg",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope"), pinComputed("Your codes", `The notice uses NAICS ${f.opp.naics}, ${naicsLabel(f.opp.naics)}. That is your primary code. Your mobile food code is ${PERSONA.secondaryNaics.find((n) => n.label.startsWith("Mobile"))?.code ?? "722330"}.`)],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}. The Army's range is ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} over ${f.years} years.`)],
      "Can you perform there?": [cp("place"), pinComputed("Distance", `${PERSONA.physicalAddress} to ${f.place.city}: about ${f.miles} miles. Your service radius is ${PERSONA.serviceRadiusMiles} miles. You run two refrigerated vans.`)],
      "Can you do the work?": [cp("certs"), cp("hours")],
      "Can you win it?": [cp("setAside")],
      "Will you make money?": [cp("price"), cp("wage")],
      "Can you survive winning?": [cp("bond")],
      "Do you understand the buyer's intent?": [cp("factors")],
      "Does this move you forward?": [pinComputed("Your targets", `Your target buyers: ${PERSONA.targetAgencies.join("; ")}.`)],
    },
    readDossier: {
      "Can you do the work?": [
        `**Food-handler certificates.** The quote asks for proof for every cook. ${CERTIFIED} of your ${COOKS} cooks hold one. A one-day course and exam can certify the other ${UNCERTIFIED}.`,
        "**Early starts.** A 5:30 AM drop means the kitchen starts at 3:30 AM on rotation days. Plan the shifts before you price the quote.",
      ],
      "Can you win it?": [
        "Only woman-owned small businesses can bid. That removes the large caterers.",
        "Your work at Fort Bragg and a clear two-van plan set you apart from the other woman-owned firms.",
      ],
      "Will you make money?": [
        "The Army pays by the meal. Start from your usual food cost, add the wage-determination rates, and then add overtime for the 3:30 AM starts.",
      ],
      "Can you survive winning?": [
        "No bond means no surety wait and no cash tied up in a bond.",
        "The base year adds about a third to your yearly revenue. One part-time cook for peak weeks keeps the kitchen from stretching.",
      ],
      "Do you understand the buyer's intent?": [
        "The Army wants soldiers fed hot and on time without running field kitchens.",
        "That is why the delivery plan is scored first. Lead your quote with the two-van plan and the 3:30 AM start.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      ...COMMON_ROWS,
      { match: /Woman-owned|WOSB/, kind: "setAside", category: "eligibility", required: "WOSB certified" },
      { match: /Food-handler/, kind: "certs", category: "submission", required: "a certificate for every cook" },
      { match: /references/, kind: "content", category: "artifact", required: "two references" },
    ],
    nextBold: `${f.daysLeft} days is enough`,
    wouldChangeBold: ["Needs review", "third drop point"],
    redTeamBold: ["plan one part-time cook for those weeks", "The set-aside limits bidders to woman-owned small businesses"],
    trail,
    coverage: coverageFor(sol, { C: "reviewed_with_findings", H: "reviewed_complete" }),
    briefingBold: [undefined, "strong fit", undefined],
    remedy: "Get your last two cooks certified and I can call this with full confidence.",
    citations: [cp("setAside"), cp("factors")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// Fayetteville Public Works cafe
// ═════════════════════════════════════════════════════════════════════════

const cafe: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  return {
    path: "prime",
    checks: [17, 5],
    lead: { ppq: 1, writing: 1 },
    gistBold: "scored on approach",
    thesisBold: ["Bid it with your event work up front"],
    limitKinds: ["proposal-weakness", "responsibility"],
    competitiveRisk: "the **current cafe vendor**, who does not do events and may bid again for the cafe alone",
    readBold: {
      "Is it your kind of work?": "Events are your strongest work",
      "Does the size fit?": "a third of your revenue",
      "Can you perform there?": "3 miles from your kitchen",
      "Can you do the work?": "county summer program is your proof of daily service",
      "Can you win it?": "the best plan can beat the lowest price",
      "Will you make money?": "events carry the margin",
      "Can you survive winning?": "No bond, monthly invoicing",
      "Do you understand the buyer's intent?": "staff to eat on site",
      "Does this move you forward?": "A local anchor contract",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope"), pinComputed("Your events", `${PP.church.projectTitle}: ${PP.church.scopeDescription}`)],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}.`)],
      "Can you perform there?": [pinComputed("Distance", `${PERSONA.physicalAddress} to the Public Works campus: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("hours"), pinComputed("Daily service", `${PP.county.projectTitle}: ${PP.county.scopeDescription}`)],
      "Can you win it?": [cp("factors")],
      "Will you make money?": [cp("price")],
      "Can you survive winning?": [cp("term")],
      "Do you understand the buyer's intent?": [cp("needs")],
      "Does this move you forward?": [pinComputed("Your references", `Three references on file: ${PP.county.customerName}; ${PARTNER.name}; ${PP.church.customerName}.`)],
    },
    readDossier: {
      "Can you do the work?": [
        "A daily cafe is new for you. The county summer program is the closest proof: 1,100 meals a day for 11 weeks is daily service.",
        "**Addendum 1** asks you to name the cafe manager and the staffing for a 200-guest event on a cafe day. Answer it in section 2.",
      ],
      "Can you win it?": [
        "The city scores approach at 40 percent. A strong event plan and sample menu can beat a lower price.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      { match: /NC business/, kind: "ncreg", category: "submission", required: "an active NC registration" },
      { match: /City vendor/, kind: "sam", category: "submission", required: "on the city's vendor list" },
      { match: /permit/i, kind: "permit", category: "license", required: "a county food service permit" },
      { match: /references/i, kind: "content", category: "artifact", required: "three references" },
    ],
    nextBold: "Read her notes",
    wouldChangeBold: ["Needs review"],
    redTeamBold: ["does not do events"],
    amendment: {
      label: "Addendum 1",
      postedAt: "4 days ago",
      summary: rt("Moved the proposal due date by **one week** and added a question on **staffing**."),
      impact: rt(`I re-ran all 17 checks. The call stays **Bid**. Your section 2 must answer the staffing question.`),
    },
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("No set-aside: any qualified firm can compete."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt("Scoring: **approach 40, experience 30, price 30**."), source: sourceOf(sol, "factors") },
          { glyph: "warn", text: rt("Addendum 1 added a **staffing question**. Your answer goes in section 2."), source: "Addendum 1" },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 5,
        items: [
          { glyph: "neutral", text: rt("The current cafe vendor does not cater events. The city joined the two contracts."), source: "Notice" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("City vendor registration is current."), source: "Your record" },
          { glyph: "ok", text: rt(`Cumberland County food service permit is current.`), source: "Your record" },
          { glyph: "ok", text: rt("Three references: county schools, Carolina Dining Group, Riverside Fellowship Church."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { "2": "reviewed_with_findings" }),
    briefingBold: [undefined, "strong local fit", undefined],
    remedy: "Apply Sarah's three changes and I can call this with full confidence.",
    citations: [cp("factors"), cp("needs")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// Cumberland County detention meals
// ═════════════════════════════════════════════════════════════════════════

const detention: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  return {
    path: "prime",
    checks: [15, 4],
    lead: { bonding: 3, ppq: 0, writing: 1 },
    gistBold: "decided on price",
    thesisBold: ["once every cook has a food-handler certificate"],
    limitKinds: ["disqualifier", "winning-hurts"],
    competitiveRisk: "a **national food service firm** that can bid lower on price alone",
    readBold: {
      "Is it your kind of work?": "cooked off-site and delivered",
      "Does the size fit?": "more than half your revenue",
      "Can you perform there?": "minutes from your kitchen",
      "Can you do the work?": "You have 3 of 5",
      "Can you win it?": "Lowest price from a qualified bidder wins",
      "Will you make money?": "Hold food cost under 40% or walk away",
      "Can you survive winning?": "both within your $200K bonding history",
      "Do you understand the buyer's intent?": "no surprises",
      "Does this move you forward?": "Steady year-round volume",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${pct(annual / PERSONA.annualRevenue)}.`)],
      "Can you perform there?": [pinComputed("Distance", `${PERSONA.physicalAddress} to the annex: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("certs")],
      "Can you win it?": [cp("evaluate")],
      "Will you make money?": [cp("price")],
      "Can you survive winning?": [cp("bond"), pinComputed("Your bonding history", `Your largest bond is ${usd(PERSONA.largestBond)}. The 5% bid bond on a ${usd(annual)} bid is about ${usd(annual * 0.05)}.`)],
      "Do you understand the buyer's intent?": [cp("needs")],
      "Does this move you forward?": [cp("term")],
    },
    readDossier: {
      "Can you do the work?": [
        "The county **rejects any bid** without a food-handler certificate for every cook. Two of your five cooks need one. A one-day course and exam can certify them.",
      ],
      "Will you make money?": [
        "A sealed bid rewards discipline. Price from your real food cost, add the delivery run, and do not shave the labor line.",
      ],
    },
    limiting: "Can you do the work?",
    rows: [
      { match: /Food-handler/, kind: "certs", category: "submission", required: "a certificate for every cook" },
      { match: /bid bond/i, kind: "bond", category: "submission", required: "a 5% bid bond" },
      { match: /vendor registration/i, kind: "sam", category: "submission", required: "an active county vendor registration" },
    ],
    nextBold: "Two certificates unblock the whole bid",
    wouldChangeBold: ["No-bid"],
    redTeamBold: ["delivery costs from out of county are higher than yours"],
    trail: [
      {
        title: "Reading the invitation for bid",
        checkCount: 6,
        items: [
          { glyph: "ok", text: rt("Sealed bid: **lowest price** from a qualified bidder wins."), source: sourceOf(sol, "evaluate") },
          { glyph: "warn", text: rt("A bid without a food-handler certificate for **every cook** is rejected."), source: sourceOf(sol, "certs") },
          { glyph: "ok", text: rt("A 5% bid bond and a payment bond. Both fit your bonding history."), source: sourceOf(sol, "bond") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 4,
        items: [{ glyph: "neutral", text: rt("Sealed jail-meal bids draw national and regional firms. Price decides it."), source: "Award records" }],
      },
      {
        title: "Checking your business",
        checkCount: 5,
        items: [
          { glyph: "ok", text: rt("County vendor registration is active."), source: "Your record" },
          { glyph: "warn", text: rt(`${UNCERTIFIED} of ${COOKS} cooks need a food-handler certificate.`), source: "Your record" },
          { glyph: "ok", text: rt(`Your kitchen is ${f.miles} miles from the annex. Delivery cost is low.`), source: "Computed" },
        ],
      },
    ],
    coverage: coverageFor(sol, { "2": "reviewed_with_findings" }),
    briefingBold: [undefined, "paused on two certificates", undefined],
    remedy: "Upload the two certificates and I can call this with full confidence.",
    citations: [cp("certs"), cp("evaluate")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// Fort Bragg dining: bid as a subcontractor
// ═════════════════════════════════════════════════════════════════════════

const fortBraggDining: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  const award = pinPublic(`${PARTNER.name} contract`, "award:W912EE-19-C-0044#winner,awardedAt,workType", {
    award: {
      awardId: "W912EE-19-C-0044",
      title: "Dining facility food service, two facilities, Fort Bragg",
      description: null,
      awardeeName: PARTNER.name,
      agencyName: "Department of Defense · Army",
      naicsCode: "722310",
      naicsDescription: "Food Service Contractors",
      value: annual * 5,
      offers: null,
      fiscalYear: 2019,
      actionDate: "2019-06-14",
      setAside: "Total small business",
      extentCompeted: null,
      popState: "NC",
      solicitationId: null,
      sourceUrl: null,
      asOf: isoDaysFromNow(-6),
    },
  });
  const bondChat = (): Pin => ({
    label: "You told Hunter",
    provenance: {
      type: "chat",
      ref: "chat.bonding-capacity",
      quote: `The biggest single bond we have carried is about ${usd(PERSONA.largestBond)}, on the county summer meals job. Nothing above that.`,
      conversation: {
        channel: "hunter",
        occurredAt: isoDaysFromNow(-60, 15),
        citedTurnId: "c2",
        attested: true,
        turns: [
          { id: "c1", speaker: "Hunter", role: "agent", at: isoDaysFromNow(-60, 15), text: "Two more and your profile is complete. Has a surety company ever approved you for a bond? If so, what was the largest one?" },
          { id: "c2", speaker: "You", role: "member", at: isoDaysFromNow(-60, 15), text: `The biggest single bond we have carried is about ${usd(PERSONA.largestBond)}, on the county summer meals job. Nothing above that.` },
          { id: "c3", speaker: "Hunter", role: "agent", at: isoDaysFromNow(-60, 15), text: `Noted. I will treat ${usd(PERSONA.largestBond)} as your proven single-job bonding until a surety confirms a higher line.` },
        ],
        learning: `Proven single-job bonding is ${usd(PERSONA.largestBond)}, at county level. A federal job that needs a ${usd(annual)} bond needs a new surety line, or a prime to carry it.`,
        learningBy: "Hunter, from this exchange",
      },
    },
  });
  const mentorCall = (): Pin => ({
    label: "Sarah's positioning call",
    provenance: {
      type: "transcript",
      ref: "call.positioning",
      quote: "With a kitchen of five, go in as a subcontractor on the big dining contracts, build the federal record, and we look at prime in about a year.",
      conversation: {
        channel: "mentor-call",
        title: "Positioning call with Sarah",
        occurredAt: isoDaysFromNow(-70, 10),
        citedTurnId: "t2",
        attested: true,
        playAt: "14:32",
        turns: [
          { id: "t1", speaker: "Sarah Mitchell", role: "mentor", at: "14:11", text: "How far can your kitchen reach in a day, and how many of you are there?" },
          { id: "t2", speaker: "Sarah Mitchell", role: "mentor", at: "14:32", text: "With a kitchen of five, go in as a subcontractor on the big dining contracts, build the federal record, and we look at prime in about a year." },
          { id: "t3", speaker: "You", role: "member", at: "14:41", text: "That works for me. Fort Bragg is the one I know." },
        ],
        learning: "Sarah set the strategy as subcontractor first on large dining work, with prime a year out.",
        learningBy: "Grant, from the recording",
      },
    },
  });

  const openQuestions: OpenQuestion[] = [
    {
      id: "talked-to-partner",
      question: rt(`Have you talked with **${PARTNER.name}** about this recompete?`),
      payoff: rt("A yes turns the subcontract path from an idea into a **plan**."),
      verdictSwing: 0.6,
      input: { kind: "yesno" },
      status: "open",
      chipNoun: "prime",
    },
    {
      id: "which-meals",
      question: rt("Which meals could your kitchen cover as a subcontractor?"),
      payoff: rt("It tells me which **share of the work** to point you toward."),
      verdictSwing: 0.4,
      input: { kind: "text" },
      status: "open",
    },
  ];

  return {
    path: "sub",
    checks: [23, 6],
    lead: { subQuote: 7, ppq: 3, writing: 2 },
    gistBold: "as Carolina Dining Group's subcontractor",
    thesisBold: ["the bond is not", "Bid as a subcontractor under the firm that holds the contract"],
    limitKinds: ["responsibility", "winning-hurts", "proposal-weakness"],
    competitiveRisk: `**${PARTNER.name}**, which has held this work since 2019. The Army exercised all four options, so it may not want to switch`,
    readBold: {
      "Is it your kind of work?": `as ${PARTNER.name}'s subcontractor`,
      "Does the size fit?": "more than three times",
      "Can you perform there?": "already worked in two of its dining facilities",
      "Can you do the work?": "a crew many times the size",
      "Can you win it?": "As a subcontractor you ride the winning prime",
      "Will you make money?": "you carry no bond and little cash risk",
      "Can you survive winning?": "100% of the annual price",
      "Do you understand the buyer's intent?": "no gap in service",
      "Does this move you forward?": "builds the federal record",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope"), pinComputed("Your 2024 job", `${PP.cdg.projectTitle}: ${PP.cdg.scopeDescription}`)],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${(annual / PERSONA.annualRevenue).toFixed(1)} times.`)],
      "Can you perform there?": [pinComputed("Distance", `${PERSONA.physicalAddress} to Fort Bragg: about ${f.miles} miles.`)],
      "Can you do the work?": [cp("hours"), cp("certs")],
      "Can you win it?": [award, mentorCall()],
      "Will you make money?": [cp("price"), cp("wage")],
      "Can you survive winning?": [cp("bond"), bondChat()],
      "Do you understand the buyer's intent?": [award],
      "Does this move you forward?": [mentorCall()],
    },
    readDossier: {
      "Can you survive winning?": [
        `The bond is **${usd(annual)}**. Your largest bond is ${usd(PERSONA.largestBond)}. A surety needs weeks of underwriting and financial statements for a line ten times larger.`,
        "As a prime you would also pay wages and food for the first 90 days before the first invoice is paid. As a subcontractor, the prime carries both.",
      ],
      "Can you win it?": [
        `${PARTNER.name} has held this work since 2019, and the Army kept it for all four options. A new prime would need a clearly better price or record.`,
        "As a subcontractor you do not have to beat them. You join the team that the Army already trusts.",
      ],
      "Does this move you forward?": [
        "This becomes your second year at Fort Bragg dining, and your first as a named subcontractor on the recompete.",
        "With that record on file you can prime a smaller dining contract next year instead of subcontracting.",
      ],
    },
    limiting: "Can you survive winning?",
    blocking: ["Can you survive winning?"],
    rows: [
      ...COMMON_ROWS,
      { match: /Total small business/, kind: "setAside", category: "eligibility", required: "a small business" },
      { match: /bond/i, kind: "bond", category: "bonding", required: `${usd(annual)} single job`, closable: false, firmValue: `${usd(PERSONA.largestBond)} largest bond` },
      { match: /food protection manager/i, kind: "certs", category: "cert", required: "a certified manager on every shift", firmValue: `${CERTIFIED} of ${COOKS} staff certified` },
      { match: /references/i, kind: "factors", category: "artifact", required: "three references at size" },
    ],
    nextBold: "woman-owned subcontractors",
    wouldChangeBold: ["re-check the prime path", "Needs review"],
    redTeamBold: ["4 of 4 options exercised", "federal record", "No.", "fits your crew"],
    gapToWin: [
      { item: `A **${usd(annual)} bond** or a prime who carries it`, have: false },
      { item: "A **second reference** at $250,000 or more", have: false },
    ],
    openQuestions,
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 8,
        items: [
          { glyph: "ok", text: rt("Set-aside: **total small business**. You are small."), source: sourceOf(sol, "setAside") },
          { glyph: "ok", text: rt(`Industry code ${f.opp.naics}. Size standard $47.0M. You are small under it.`), source: sourceOf(sol, "naics") },
          { glyph: "blocked", text: rt(`**Performance and payment bond: ${usd(annual)}**, 100% of the annual price.`), source: sourceOf(sol, "bond") },
          { glyph: "warn", text: rt("A certified food protection manager on every shift, at both facilities."), source: sourceOf(sol, "certs") },
          { glyph: "warn", text: rt("Scoring: technical 40, past performance 30, price 30. Three references at $250,000 or more."), source: sourceOf(sol, "factors") },
        ],
      },
      {
        title: "Checking the competition",
        checkCount: 6,
        items: [
          { glyph: "warn", text: rt(`Holder: **${PARTNER.name}**, since 2019.`), source: "Award record W912EE-19-C-0044" },
          { glyph: "warn", text: rt("The Army exercised all four option years."), source: "Award records" },
          { glyph: "ok", text: rt(`${PARTNER.name} is looking for woman-owned subcontractors.`), source: "Partners" },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt(`Largest bond on file: **${usd(PERSONA.largestBond)}**.`), source: "Your record" },
          { glyph: "ok", text: rt(`You worked at two Fort Bragg dining facilities as a subcontractor in ${PP.cdg.periodStart.slice(0, 4)}.`), source: "Your record" },
          { glyph: "warn", text: rt(`${UNCERTIFIED} of ${COOKS} staff need a food-handler certificate.`), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { H: "reviewed_with_findings", L: "reviewed_with_findings", M: "reviewed_with_findings" }),
    briefingBold: [undefined, "not as prime", undefined],
    remedy: `Tell me whether you have talked with ${PARTNER.name} and I can call the subcontract path properly.`,
    citations: [cp("bond"), cp("factors"), award],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// Camp Mackall restricted site: no-bid
// ═════════════════════════════════════════════════════════════════════════

const restrictedSite: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  const annual = f.annual ?? 0;
  // The days left on Camp Mackall field meals: the quote the first roadmap step points at.
  const days = factsFor(getOpportunity(HERO_IDS.fieldMeals)!).daysLeft;
  const roadmap: RoadmapItem[] = [
    {
      item: rt("**Bid on Camp Mackall field meals** first"),
      whyItMattered: rt("It is the same base. A job there gives the Army a name to trust when a cleared-site contract comes."),
      whatItTakes: rt(`The quote is open now. Answer Ava's questions and certify two more cooks. That fits inside ${days} days.`),
    },
    {
      item: rt("A path to **cleared staff**"),
      whyItMattered: rt("Every on-site worker needs a Secret clearance on day one, and the Army will not sponsor new ones."),
      whatItTakes: rt("A teaming partner with cleared cooks, or a prime who can sponsor yours. This takes months."),
      cta: { kind: "mentor" },
    },
    {
      item: rt("A profile that **cleared primes can find**"),
      whyItMattered: rt("Primes with cleared staff look for small firms with Fort Bragg and Camp Mackall records."),
      whatItTakes: rt("A day to set up your visibility profile with the small business databases."),
      cta: { kind: "dfy", service: "SBS Visibility Setup" },
    },
    {
      item: rt("A **watch** on cleared-site dining notices"),
      whyItMattered: rt("The next cleared-site notice will give you more time if you see it on day one."),
      whatItTakes: rt("Save a Hunter search for Camp Mackall dining notices. It takes two minutes."),
    },
  ];
  return {
    path: "skip",
    checks: [12, 4],
    lead: { writing: 5, ppq: 5 },
    clearance: { fcl: null, personnel: "Secret" },
    gistBold: "Don't bid",
    thesisBold: ["closed to you today", "Put your time into Camp Mackall field meals"],
    limitKinds: ["disqualifier", "responsibility", "winning-hurts"],
    readBold: {
      "Is it your kind of work?": "Dining support is your food-service code",
      "Does the size fit?": "about the same as your yearly revenue",
      "Can you perform there?": "adds time to every shift",
      "Can you do the work?": "None of your 5 staff holds one",
      "Can you win it?": "firms that already have cleared staff",
      "Will you make money?": "raise your labor cost",
      "Can you survive winning?": "default",
      "Do you understand the buyer's intent?": "without escorting uncleared workers",
      "Does this move you forward?": "without one",
    },
    readPins: {
      "Is it your kind of work?": [cp("scope")],
      "Does the size fit?": [cp("value"), pinComputed("Size against revenue", `${usd(annual)} a year divided by ${revenue} yearly revenue is ${(annual / PERSONA.annualRevenue).toFixed(1)} times.`)],
      "Can you perform there?": [cp("access")],
      "Can you do the work?": [cp("clearance")],
      "Can you win it?": [cp("clearance")],
      "Will you make money?": [cp("price")],
      "Can you survive winning?": [cp("clearance"), cp("term")],
      "Do you understand the buyer's intent?": [cp("access")],
      "Does this move you forward?": [pinComputed("Your targets", `Your target buyers: ${PERSONA.targetAgencies.join("; ")}.`)],
    },
    readDossier: {
      "Can you do the work?": [
        "A Secret clearance cannot be bought. It needs a **sponsor** and an investigation of each person.",
        "That is a path of months. Nothing you send before the due date changes it.",
      ],
      "Does this move you forward?": [
        "Camp Mackall field meals is the same base and the same buyer, with no clearance. A job there is the record you need.",
      ],
    },
    limiting: "Can you do the work?",
    blocking: ["Can you do the work?"],
    rows: [
      ...COMMON_ROWS,
      { match: /Secret clearance/, kind: "clearance", category: "clearance", required: "Secret clearance", closable: false, firmValue: "none on file" },
      { match: /Food-handler/, kind: "certs", category: "submission", required: "a certificate for every cook" },
    ],
    nextBold: "Spend this month on that quote",
    wouldChangeBold: ["removed the clearance rule", "cleared staff"],
    redTeamBold: ["no way to rush that", "not only the prime"],
    gapToWin: [{ item: "An **active Secret clearance** for every on-site worker (needs a sponsor)", have: false }],
    roadmap,
    trail: [
      {
        title: "Reading the solicitation",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt("**Active Secret clearance** for every on-site worker, on day one."), source: sourceOf(sol, "clearance") },
          { glyph: "blocked", text: rt("The Army **will not sponsor** new clearances."), source: sourceOf(sol, "clearance") },
          { glyph: "ok", text: rt("No set-aside: any qualified firm can compete."), source: sourceOf(sol, "setAside") },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 6,
        items: [
          { glyph: "blocked", text: rt(`Cleared staff on your team: **none** of ${COOKS}.`), source: "Your record" },
          { glyph: "ok", text: rt("Food-service code, kitchen and HACCP plan fit the work."), source: "Your record" },
        ],
      },
    ],
    coverage: coverageFor(sol, { H: "reviewed_with_findings" }),
    briefingBold: [undefined, "I stopped at the clearance", undefined],
    remedy: "Nothing you tell me changes a clearance requirement.",
    citations: [cp("clearance")],
  };
};

// ═════════════════════════════════════════════════════════════════════════
// Fort Bragg sources sought: reply
// ═════════════════════════════════════════════════════════════════════════

const sourcesSought: Maker = (f, sol) => {
  const cp = (k: string, label?: string): Pin => clausePin(sol, k, label);
  return {
    path: "shape-watch",
    noticeType: "sources-sought",
    checks: [8, 3],
    lead: { writing: 1 },
    gistBold: "Reply",
    thesisBold: ["This is not a bid", "A woman-owned reply can push the Army to set that contract aside"],
    limitKinds: ["proposal-weakness", "proposal-weakness"],
    readBold: {
      "Is it your kind of work?": "work you did at Fort Bragg",
      "Does the size fit?": "team with a prime",
      "Can you do the work?": "the county school meals",
      "Can you win it?": "keeps you in the field",
      "Do you understand the buyer's intent?": "evidence for a set-aside",
      "Does this move you forward?": "costs you an hour and no money",
    },
    readPins: {
      "Is it your kind of work?": [cp("purpose"), pinComputed("Your 2024 job", `${PP.cdg.projectTitle}: ${PP.cdg.scopeDescription}`)],
      "Does the size fit?": [cp("noprice")],
      "Can you do the work?": [cp("ask")],
      "Can you win it?": [cp("disclaimer")],
      "Do you understand the buyer's intent?": [cp("setAside")],
      "Does this move you forward?": [cp("submit")],
    },
    readDossier: {
      "Do you understand the buyer's intent?": [
        "The Army uses the replies to choose between a set-aside and an open contract.",
        "Each woman-owned or small business that replies is evidence for the set-aside.",
      ],
    },
    limiting: "Does the size fit?",
    rows: [
      { match: /SAM/, kind: "sam", category: "eligibility", required: "registered in SAM" },
      { match: /Woman-owned|WOSB/, kind: "ask", category: "eligibility", required: "your certifications, listed" },
      { match: /Capability statement/, kind: "ask", category: "artifact", required: "what your firm does" },
      { match: /Two-part reply/, kind: "submit", category: "submission", required: "both parts, by email" },
    ],
    nextBold: "Read them, then send them by email",
    wouldChangeBold: ["request for price"],
    redTeamBold: ["binds you to nothing", "evidence for a set-aside"],
    trail: [
      {
        title: "Reading the notice",
        checkCount: 4,
        items: [
          { glyph: "ok", text: rt("Sources sought: the Army asks **who could do the work**."), source: sourceOf(sol, "purpose") },
          { glyph: "neutral", text: rt("**No price**, no award. A reply is not an offer."), source: sourceOf(sol, "noprice") },
          { glyph: "ok", text: rt("Two short parts, sent by email."), source: sourceOf(sol, "ask") },
        ],
      },
      {
        title: "Checking your business",
        checkCount: 4,
        items: [
          { glyph: "ok", text: rt("Capability statement is on file."), source: "Your record" },
          { glyph: "ok", text: rt("Woman-owned certification is active."), source: "Your record" },
        ],
      },
    ],
    briefingBold: [undefined, "short reply is the right move", undefined],
    remedy: "Send the reply and this call is complete.",
    citations: [cp("ask"), cp("submit")],
  };
};

export const HERO_EXTRAS: Record<string, Maker> = {
  [HERO_IDS.fieldMeals]: fieldMeals,
  "FAYNC-2026-R-08": cafe,
  "CUMCO-2026-014": detention,
  [HERO_IDS.fortBraggDining]: fortBraggDining,
  [HERO_IDS.classifiedSite]: restrictedSite,
  "W912EE-27-S-0004": sourcesSought,
};

/** Grant's hand-written review of an opportunity, or null when it has none. */
export function heroAnalysis(f: OppFacts) {
  const maker = HERO_EXTRAS[f.id];
  const brief = getGrantBrief(f.id) ?? AUTHORED_BRIEFS[f.id];
  if (!maker || !brief) return null;
  const sol = solicitationFor(f);
  return encodeBrief(brief, maker(f, sol), { f, sol });
}

