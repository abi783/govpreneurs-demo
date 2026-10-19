// THE AGENCY: the hand-written page detail for its three story opportunities, and
// for the VA's schedule-only campaign. Each entry adds to what the generic builder
// (src/demo/grant/detail.ts) makes: a quick summary in the buyer's terms, the
// accordions that matter for this notice, the solicitation clauses that Grant's
// source chips quote, and any document written out in full.
//
// The hero and the twin are modeled on two real MICC Fort Bragg requirements for
// the Army Community Service Family Advocacy Program (PANMCC-21-P-000-009052 and
// PANMCC24P0000016825); the team-up on the VA's VHA Recruitment Marketing &
// Advertising contract. The twin's three clauses keep the 2024 notice's wording.

import type { Builder } from "@/demo/grant/heroDetails";
import { longDate, PARTNER, termText, usd, type OppFacts } from "@/demo/grant/facts";
import { dueTimeOf } from "@/demo/story/opportunities";
import { HERO_IDS } from "../opportunities";

const range = (f: OppFacts): string => `${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}`;

// ── The hero: Family Advocacy print and digital campaign ─────────────────

const familyAdvocacyPrint: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  const due = dueTimeOf(f.opp);
  return {
    quickSummary: `The Army wants a campaign that reaches military families within 30 miles of Fort Bragg with the Family Advocacy Program's prevention messages: 24 short videos a year, social, display and search ads, a weekly ad in four local papers, and ads on the contractor's own mobile app. The contract is ${termText(f.years)}. Only woman-owned small businesses can compete. The Army estimates the value at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Reach military families who live within 30 miles of Fort Bragg with the Family Advocacy Program's prevention messages.",
        "Make 24 short videos a year, with captions, for social and digital channels.",
        "Run social, display and search ads, and report what they reach.",
        "Place one ad each week in each of four local papers.",
        "Run app splash ads on the contractor's own mobile app.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: Women-Owned Small Business (WOSB). The firm must hold an active SBA certification when it sends the quote and at award.",
        `NAICS code ${f.opp.naics}, Advertising Agencies.`,
        "An active SAM registration when the quote is sent and through award.",
        "A named project manager and an alternate, reachable 8:00 AM to 4:30 PM on weekdays.",
        "General liability insurance of $1M for each occurrence, and workers' compensation.",
        "Two past-performance references from the last three years.",
        "No bond is required.",
      ],
      evaluation_criteria: [
        "Best value. The Army scores the approach first: how you reach families within 30 miles of post, and how plain and trusted the messages are.",
        "Past performance second: two references for similar campaigns.",
        "Price third. Price every line for the base year and each option year.",
        "The program approves every ad before it runs.",
      ],
      submission_instructions: [
        `Send the quote by email to ${f.contact.name} at ${f.contact.email} by ${due} on the due date.`,
        "Part 1: the price schedule, on the Army's form. Part 2: a technical plan of up to three pages. Part 3: work samples and two references.",
        "Name the project manager and the alternate in the technical plan.",
        "Send questions in writing before the question deadline. The Army answers them in an amendment.",
      ],
      deliverables: [
        "24 captioned videos a year, with social cut-downs",
        "Social, display and search ads each month, with a report",
        "Proof of each weekly print ad as it ran (tear sheets)",
        "App splash ads on the contractor's own app, with a monthly count",
        "A monthly report on reach, clicks and calls to the program",
      ],
      technical_requirements: [
        "Ads reach families who live within 30 miles of Fort Bragg.",
        "Captions on every video, and digital content that meets Section 508.",
        "Written approval from the program before any ad runs.",
        "Ad accounts and data set up in the Army's name.",
      ],
      personnel_requirements: [
        "A project manager and an alternate whom the Army can reach 8:00 AM to 4:30 PM on weekdays.",
        "A video producer and a designer for the length of the contract.",
        "Base access and a background check for anyone who shoots on post.",
      ],
      risks_and_gotchas: [
        "The app line: ads on the contractor's own mobile app. Ask in Q&A whether a partner's app counts.",
        "Print rates: five fixed-price years of weekly ads in four papers. Lock the rates before you price.",
        "The Army pays in about 30 days. Plan to carry about two months of print and media buys.",
        "Messages about family violence need care. The program approves every word.",
      ],
      quick_checklist: [
        "Send the app question before questions close.",
        "Get signed rate quotes from all four papers, locked 12 months, with a stated increase for each option year.",
        "Name your project manager and alternate.",
        "Write a three-page plan: reach first, then the videos, then trust.",
        "Price the base year and every option year.",
        `Send the quote before ${due} on the due date.`,
      ],
    },
    patches: [
      { kind: "needs", text: "Reach military families who live within 30 miles of Fort Bragg with the Family Advocacy Program's prevention messages. Plan the campaign and the media schedule, and get the program's approval before anything runs." },
      { kind: "place", text: "Ads run to families who live within 30 miles of Fort Bragg, North Carolina. Shoots take place on post and in nearby towns." },
      { kind: "videos", section: "C", ref: "C.7", heading: "Videos", text: "The contractor shall produce 24 short videos a year, with captions, for social and digital channels." },
      { kind: "print", section: "C", ref: "C.8", heading: "Print ads", text: "The contractor shall place one ad each week in each of four local newspapers. Prices are firm and fixed for each year of the contract, including each option year." },
      { kind: "app", section: "C", ref: "C.9", heading: "App splash ads", text: "The contractor shall run app splash ads for the program on the contractor's own mobile app, and report the count each month." },
      { kind: "staff", section: "C", ref: "C.10", heading: "Project manager and alternate", text: "The contractor shall name a project manager and an alternate. One of them shall be reachable from 8:00 AM to 4:30 PM, Monday to Friday." },
      { kind: "factors", text: "Factors, in order of importance: (1) approach: reach to families within 30 miles of Fort Bragg, and plain, trusted messages, (2) past performance on similar campaigns, (3) price. Past performance means two references from the last three years." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Quote.pdf`, title: "Solicitation" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
      { kind: "wage", fileName: `${f.id}_Wage-Determination.pdf`, title: "Wage determination" },
      { kind: "price", fileName: `${f.id}_Price-Schedule.pdf`, title: "Price schedule" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["The Army Community Service Family Advocacy Program at Fort Bragg helps military families prevent abuse and get help early. This work statement covers print and digital advertising for the program."] },
          { heading: "2. Audience and area", paragraphs: ["Military families, spouses and service members who live within 30 miles of Fort Bragg."] },
          { heading: "3. Videos", paragraphs: ["24 short videos a year, with captions. The program approves each script before the shoot, and each video before it runs."] },
          { heading: "4. Social, display and search ads", paragraphs: ["Ads on social media, websites and search, aimed at families in the area. A monthly report shows reach, clicks and calls to the program."] },
          { heading: "5. Print", paragraphs: ["One ad each week in each of four local newspapers. Proof of each ad as it ran (tear sheets) comes with the monthly invoice."] },
          { heading: "6. App splash ads", paragraphs: ["App splash ads for the program on the contractor's own mobile app, with a monthly count of views."] },
          { heading: "7. Project manager and alternate", paragraphs: ["The contractor names a project manager and an alternate. One of them is reachable 8:00 AM to 4:30 PM, Monday to Friday."] },
          { heading: "8. Period of performance", paragraphs: [`${termText(f.years).charAt(0).toUpperCase()}${termText(f.years).slice(1)}. Prices are firm and fixed for each year.`] },
          { heading: "9. Inspection and acceptance", paragraphs: ["The program's representative reviews each month's work. The Army accepts work that meets this statement and records any ad that is late or missing."] },
        ],
      },
    },
  };
};

// ── The twin: Family Advocacy TV and streaming ads ───────────────────────

const STREAMING = "Commercials shall stream via the exclusive subscriber-based local provider app.";
const PRODUCTION = "Commercials shall be fully produced by the exclusive provider production team.";
const VIEWERS = "The contractor shall give monthly viewer reports from the provider's own subscriber data, through the provider's online dashboard.";

const familyAdvocacyStreaming: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  return {
    quickSummary: `The Army wants TV and streaming commercials for the Family Advocacy Program, aimed at households around Fort Bragg. The work statement requires streaming through one local provider's own subscriber app, commercials made by that provider's production team, and that provider's viewer reports. The contract is ${termText(f.years)}. It is a total small business set-aside. The Army estimates the value at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "TV and streaming commercials for the Family Advocacy Program, aimed at households around Fort Bragg.",
        "Streaming via the local subscriber-based provider's own app.",
        "Commercials fully produced by that provider's production team.",
        "Monthly viewer reports from the provider's own subscriber data, through its online dashboard.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: total small business. The firm must be small under the size standard when it sends the quote.",
        `NAICS code ${f.opp.naics}, Advertising Agencies.`,
        "An active SAM registration when the quote is sent and through award.",
        "Streaming, production and viewer data from the one local provider the work statement names.",
        "General liability insurance of $1M for each occurrence, and workers' compensation.",
      ],
      risks_and_gotchas: [
        "Only the provider that owns the app, the production team and the viewer data can meet all three requirements.",
        "Any other firm would resell that provider's package and control none of the work.",
        `The time to ask for "or equal" platforms is a sources sought, before the work statement is written.`,
      ],
      quick_checklist: [
        "Read the streaming, production and viewer-report clauses.",
        "Compare them with what your firm owns.",
        "If you can't meet all three, put the time into the print and digital campaign.",
      ],
    },
    patches: [
      { kind: "place", text: "Commercials reach households in and around Fort Bragg, North Carolina." },
      { kind: "streaming", section: "C", ref: "C.7", heading: "Streaming", text: STREAMING },
      { kind: "production", section: "C", ref: "C.8", heading: "Production", text: PRODUCTION },
      { kind: "viewers", section: "C", ref: "C.9", heading: "Viewer reports", text: VIEWERS },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Quote.pdf`, title: "Solicitation" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
      { kind: "price", fileName: `${f.id}_Price-Schedule.pdf`, title: "Price schedule" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["The Army Community Service Family Advocacy Program at Fort Bragg helps military families prevent abuse and get help early. This work statement covers television and streaming commercials for the program."] },
          { heading: "2. Commercials", paragraphs: ["Television and streaming commercials for the program, aimed at households in and around Fort Bragg. The program approves each script."] },
          { heading: "3. Streaming", paragraphs: [STREAMING] },
          { heading: "4. Production", paragraphs: [PRODUCTION] },
          { heading: "5. Viewer reports", paragraphs: [VIEWERS] },
          { heading: "6. Period of performance", paragraphs: [`${termText(f.years).charAt(0).toUpperCase()}${termText(f.years).slice(1)}.`] },
        ],
      },
    },
  };
};

// ── The team-up: VA hiring campaign sources sought ───────────────────────

const vaHiring: Builder = (f) => {
  const draft = `${f.id}_Draft-Work-Statement.pdf`;
  const c = f.contact;
  return {
    quickSummary: `This is not a bid. The VA is asking which firms could run its national campaign to recruit doctors, nurses and staff when the current contract ends in September 2027: strategy, paid media, video shoots at VA medical centers and a hiring website. The VA expects to set the follow-on aside for service-disabled veteran-owned firms, at about ${range(f)} a year. A reply has no price.`,
    accordions: {
      what_the_buyer_needs: [
        "Market research for the follow-on to the VA's national recruitment campaign for its medical centers.",
        "The work: recruitment strategy, a national paid media buy, a hiring website, and video shoots at VA medical centers.",
        "A short reply by email: what your firm does, and what you did for past customers.",
        "No price. A reply is not an offer, and the VA will not award a contract from it.",
      ],
      eligibility_and_compliance: [
        "The VA expects to set the follow-on aside for Service-Disabled Veteran-Owned Small Businesses (SDVOSB).",
        `NAICS code ${f.opp.naics}, Marketing Consulting Services.`,
        "Any firm can reply. A firm that would team should name its partners and each one's share of the work.",
      ],
      evaluation_criteria: [
        "Nothing is scored. A sources sought is market research.",
        "The VA reads the replies to decide how to write the follow-on, and whether enough veteran-owned firms can do the work.",
      ],
      submission_instructions: [
        `Reply by email to ${c.name} at ${c.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "Only a service-disabled veteran-owned firm is expected to hold the prime contract.",
        "A year of the work is many times the size of a small agency.",
        "A subcontractor's share is set by the teaming agreement. Agree on it before the RFP.",
      ],
      quick_checklist: [
        `Reply to ${PARTNER.contact} at ${PARTNER.name}.`,
        "Send your hiring videos and the Longleaf results.",
        "Ask for a teaming agreement that names your share.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "Set-aside expected", text: "This is not a solicitation. The VA expects to set the follow-on aside for Service-Disabled Veteran-Owned Small Businesses (SDVOSB). It uses the replies to confirm that enough of them can do the work." },
      { kind: "current", ref: "1.4", heading: "The current contract", text: `The current contract ends on September 24, 2027. The VA expects the follow-on to run five years, at about ${range(f)} a year.` },
      { kind: "work", ref: "2.4", heading: "The work", text: "The follow-on covers recruitment strategy, a national paid media buy, a hiring website, and video shoots at VA medical centers across the country." },
      { kind: "teaming", ref: "2.5", heading: "Teaming", text: "A firm that would team should name its partners and the part of the work each would do." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Sources-Sought-Notice.pdf`, title: "Sources sought notice" },
      { kind: "custom", fileName: draft, title: "Draft work statement" },
    ],
    custom: {
      [draft]: {
        title: "DRAFT WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Purpose", paragraphs: ["The VA recruits doctors, nurses and staff for its medical centers. This draft describes the campaign the follow-on contract would run."] },
          { heading: "2. Strategy and media", paragraphs: ["A national recruitment strategy and a paid media buy: social, search, display and streaming."] },
          { heading: "3. Video at medical centers", paragraphs: ["Short videos filmed at VA medical centers, with staff telling their own stories. Shoots take place across the country, including the Southeast."] },
          { heading: "4. Hiring website", paragraphs: ["A hiring website with a lead form that sends each inquiry to a VA recruiter."] },
          { heading: "5. Reports", paragraphs: ["Monthly reports of leads, applications and hires."] },
          { heading: "6. Note", paragraphs: [`This draft is for market research, posted on ${longDate(f.posted)}. The final work statement may change.`] },
        ],
      },
    },
  };
};

// ── The VA's employer-brand campaign: GSA schedule holders only ──────────

const chooseVa: Builder = (f) => ({
  quickSummary: `The VA wants an employer-brand campaign for its ChooseVA hiring program. The request goes out through GSA eBuy to holders of the GSA Multiple Award Schedule only. The VA estimates the value at ${range(f)} over the full term.`,
  accordions: {
    eligibility_and_compliance: [
      "Only holders of the GSA Multiple Award Schedule can quote. The VA sends this request through GSA eBuy.",
      `NAICS code ${f.opp.naics}, Advertising Agencies.`,
      "An active SAM registration and an active GSA schedule when the quote is sent.",
      "General liability insurance of $1M for each occurrence, and workers' compensation.",
    ],
    risks_and_gotchas: [
      "A firm without a GSA schedule can't see or answer the request in eBuy.",
      "A schedule takes months to get, so it can't be fixed inside this window.",
    ],
  },
  patches: [
    {
      kind: "setAside",
      heading: "Who can quote",
      text: "This request is a task order under the GSA Multiple Award Schedule (MAS). The VA sends it through GSA eBuy to schedule holders in the advertising services category. Only a schedule holder can send a quote.",
    },
  ],
});

export const HERO_DETAILS: Record<string, Builder> = {
  [HERO_IDS.hero]: familyAdvocacyPrint,
  [HERO_IDS.twin]: familyAdvocacyStreaming,
  [HERO_IDS.teamUp]: vaHiring,
  "36C10X27Q0007": chooseVa,
};
