// THE IT SERVICES FIRM: the hand-written page detail for its three story
// opportunities. Each entry adds to what the generic builder
// (src/demo/grant/detail.ts) makes: a quick summary in the buyer's terms, the
// accordions that matter for this notice, the solicitation clauses that Grant's
// source chips quote, and any document written out in full.
//
// Source: demo-storyboard/it-services-pack.md, sections 3–5. The hero is modeled
// on USARC G-6's competed 8(a) buys at MICC Fort Bragg (W91247-18-R-4P0N,
// W91247-18-T-R019); the twin on USARC knowledge management ordered through
// ITES-3S (W9124722F0019, W9124723F2461); the team-up on the Army medical center's
// IT services on 8(a) STARS III (HT001524F0117). The hospital is never named.

import type { Builder } from "@/demo/grant/heroDetails";
import { longDate, PARTNER, termText, usd, type OppFacts } from "@/demo/grant/facts";
import { dueTimeOf } from "@/demo/story/opportunities";
import { HERO_IDS } from "../opportunities";

const range = (f: OppFacts): string => `${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}`;
const Term = (years: number): string => `${termText(years).charAt(0).toUpperCase()}${termText(years).slice(1)}`;

const WAGE_DETERMINATION = "2015-4377, Revision 33";

// ── The hero: Army Reserve headquarters help desk ────────────────────────

const helpDesk: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  const due = dueTimeOf(f.opp);
  return {
    quickSummary: `The Army Reserve wants its headquarters help desk at Marshall Hall, Fort Bragg, run by a contractor: phone and walk-up Tier 1, Tier 2 at the desk, imaging and asset tracking, and video conferencing in 14 rooms, for about 1,900 users. Six techs on site 7:00 to 5:00 on weekdays, a named site lead and alternate, a 30-day phase-in, and Security+ for every tech with admin rights from day one. The contract is ${termText(f.years)}. Only 8(a) firms can compete. The Army estimates the value at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Run the help desk for about 1,900 users in Marshall Hall: phone, email and walk-up Tier 1.",
        "Fix problems at the user's desk at Tier 2, and image, set up and track laptops and desktops.",
        "Support video conferencing in 14 rooms, and set up each call that is booked.",
        "Six techs on site from 7:00 AM to 5:00 PM, Monday to Friday, with a named site lead and alternate.",
        "Take over from the current contractor in a 30-day phase-in.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: competitive 8(a). The firm must be in the SBA's 8(a) program when it sends the quote and at award.",
        `NAICS code ${f.opp.naics}, Other Computer Related Services.`,
        "An active SAM registration when the quote is sent and through award.",
        "Security+ (or an equal DoD 8140 certification) for every tech with admin rights, on day one.",
        "CMMC Level 1 (Self), posted in SPRS.",
        `The Service Contract Act applies: wage determination ${WAGE_DETERMINATION}, Cumberland and Hoke counties.`,
        "General liability insurance of $1M for each occurrence, and workers' compensation.",
        "No bond is required.",
      ],
      evaluation_criteria: [
        "Best value. The Army scores the staffing plan and phase-in first: named techs, their certifications, and the site lead and alternate.",
        "Past performance second: up to three similar contracts from the last three years.",
        "Price third. Price every tech for the base year and each option year.",
        "A tech priced below the wage determination is a reason to reject the quote.",
      ],
      submission_instructions: [
        `Send the quote by email to ${f.contact.name} at ${f.contact.email} by ${due} on the due date.`,
        "Part 1: the price schedule, on the Army's form. Part 2: a technical plan of up to five pages with the staffing plan. Part 3: résumés and certifications for the six techs, the site lead and the alternate.",
        "Send questions in writing before the question deadline. The Army answers them in an amendment.",
      ],
      deliverables: [
        "A staffing plan with six named techs and their certifications",
        "A 30-day phase-in plan, by week",
        "A monthly ticket report: opened, closed, aged and response times",
        "An updated asset list each quarter",
        "A video-conference log for the 14 rooms",
      ],
      technical_requirements: [
        "Security+ or an equal DoD 8140 certification before any admin access is granted.",
        "Tickets in the Army's own ticketing system, with response times by priority.",
        "Imaging with the Army's standard Windows image and tools.",
        "Common Access Cards and network accounts for every tech before the start date.",
      ],
      personnel_requirements: [
        "A site lead and an alternate. One of them is on site 7:00 AM to 5:00 PM, Monday to Friday.",
        "Six techs on site in the posted hours.",
        "A background check, base access and a Common Access Card for every tech.",
      ],
      risks_and_gotchas: [
        "Security+ on day one: a tech without it can't be named. Book exams before you send the quote.",
        "The wage floor: a PC support technician is $37.50 an hour plus $5.92 health and welfare. Price at or above it.",
        "A 30-day phase-in means hiring before award, and the first payment comes after the first month.",
        "Ask in Q&A whether the Army issues the laptops and tools the techs use.",
      ],
      quick_checklist: [
        "Book Security+ exams for the techs who don't hold it.",
        "Name your site lead and alternate.",
        "Send the question about laptops and tools before questions close.",
        "Price every tech at or above the wage floor, line by line.",
        "Write the 30-day phase-in by week.",
        `Send the quote before ${due} on the due date.`,
      ],
    },
    patches: [
      { kind: "needs", text: "Run the help desk for about 1,900 users in Marshall Hall: phone, email and walk-up Tier 1, Tier 2 at the desk, imaging and asset tracking, and video conferencing in 14 rooms." },
      { kind: "place", text: "Marshall Hall, the U.S. Army Reserve Command headquarters, Fort Bragg, North Carolina." },
      { kind: "seats", section: "C", ref: "C.5", heading: "Hours and staffing", text: "The contractor shall staff six techs on site from 7:00 AM to 5:00 PM, Monday to Friday, except federal holidays, and name a site lead and an alternate. One of them shall be on site in those hours." },
      { kind: "vtc", section: "C", ref: "C.6", heading: "Video conferencing", text: "The contractor shall support video conferencing in 14 rooms, set up each booked call, and keep a log of every call and fault." },
      { kind: "security", section: "C", ref: "C.7", heading: "Certifications for admin rights", text: "Each contractor employee with privileged (admin) access shall hold CompTIA Security+ or an equal DoD 8140 baseline certification on the first day of performance. An employee without it shall not be given admin access." },
      { kind: "phaseIn", section: "C", ref: "C.8", heading: "Phase-in", text: "The contractor shall take over all work within 30 days of award, with every tech badged, carded and certified before the first day on site." },
      { kind: "wage", text: `The Service Contract Act applies. Wage determination ${WAGE_DETERMINATION} (Cumberland and Hoke counties) is at Attachment 2. Personal Computer Support Technician: $37.50 an hour, plus health and welfare of $5.92 an hour.` },
      { kind: "cmmc", section: "H", ref: "H.7", heading: "CMMC", text: "The contractor shall have a current CMMC Level 1 (Self) status in SPRS at award and keep it through the contract (DFARS 252.204-7021)." },
      { kind: "factors", text: "Factors, in order of importance: (1) staffing plan and phase-in: named techs and their certifications, and the site lead and alternate, (2) past performance on similar help desk support, (3) price. Factors 1 and 2 together are about equal to price." },
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
          { heading: "1. Background", paragraphs: ["The U.S. Army Reserve Command G-6 runs IT for about 1,900 users at Marshall Hall, Fort Bragg. This work statement covers the help desk and the end-user support behind it."] },
          { heading: "2. Tier 1", paragraphs: ["Answer phone, email and walk-up requests. Reset accounts, fix common problems and log every request in the Army's ticketing system."] },
          { heading: "3. Tier 2", paragraphs: ["Fix problems at the user's desk. Image, set up and track laptops and desktops, and keep the asset list current."] },
          { heading: "4. Video conferencing", paragraphs: ["Support video conferencing in 14 rooms. Set up each booked call and log every call and fault."] },
          { heading: "5. Hours and staffing", paragraphs: ["Six techs on site from 7:00 AM to 5:00 PM, Monday to Friday. A named site lead and alternate; one of them on site in those hours."] },
          { heading: "6. Certifications", paragraphs: ["CompTIA Security+ or an equal DoD 8140 certification for every tech with admin rights, on the first day of performance."] },
          { heading: "7. Phase-in", paragraphs: ["Take over all work within 30 days of award, with every tech badged, carded and certified before the first day on site."] },
          { heading: "8. Period of performance", paragraphs: [`${Term(f.years)}. Prices are firm and fixed for each year.`] },
          { heading: "9. Inspection and acceptance", paragraphs: ["The contracting officer's representative reviews the monthly ticket report against the response times. The Army records any desk left without cover."] },
        ],
      },
    },
  };
};

// ── The twin: Army Reserve SharePoint support, ITES-3S holders only ──────

const HOLDERS_ONLY = "This requirement will be competed as a task order under the Army ITES-3S IDIQ. Only small-business ITES-3S contract holders may submit.";

const sharePoint: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  return {
    quickSummary: `The Army Reserve wants knowledge management and SharePoint support for its headquarters at Fort Bragg: running the sites, moving old content, building simple workflows and training site owners. ${HOLDERS_ONLY} The contract is ${termText(f.years)}. The Army estimates the value at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Run the Army Reserve headquarters' SharePoint sites: pages, libraries, lists and permissions.",
        "Move content from old sites to new ones, and check every permission after the move.",
        "Build simple forms and workflows the staff ask for, and train the site owners.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        HOLDERS_ONLY,
        "The order is set aside for small businesses among the ITES-3S holders.",
        `NAICS code ${f.opp.naics}, Other Computer Related Services.`,
        "Security+ or an equal DoD 8140 certification for anyone with admin rights.",
        "General liability insurance of $1M for each occurrence, and workers' compensation.",
      ],
      evaluation_criteria: [
        "Fair opportunity among the ITES-3S holders: the order goes to the holder whose quote is the best value under the base contract's terms.",
        "A firm that does not hold ITES-3S can't send a quote.",
      ],
      submission_instructions: [
        `ITES-3S holders send their quote to ${f.contact.name} at ${f.contact.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "The quote follows the base contract's task order instructions.",
      ],
      risks_and_gotchas: [
        "Only ITES-3S holders can quote. Nothing a firm sends before the due date changes that.",
        "ITES-3S takes no new firms. The Army's next IT contract, ITES-4S, is not awarded yet.",
        "A firm that wants the work can offer its SharePoint admins to one of the holders.",
      ],
      quick_checklist: [
        "Read the clause on who can quote.",
        "If you are not a holder, don't send a quote.",
        "Put the time into the help desk quote.",
      ],
    },
    patches: [
      { kind: "vehicle", section: "A", ref: "A.5", heading: "Who can quote", text: HOLDERS_ONLY },
      { kind: "setAside", text: "This task order is set aside for small businesses among the ITES-3S holders. Only ITES-3S holders may submit." },
      { kind: "needs", text: "Run the Army Reserve headquarters' SharePoint sites, move content from old sites to new ones, build simple workflows and train the site owners." },
      { kind: "place", text: "Marshall Hall, the U.S. Army Reserve Command headquarters, Fort Bragg, North Carolina." },
      { kind: "evaluate", text: "The order goes to the ITES-3S holder whose quote is the best value under the base contract's fair opportunity terms." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Task-Order-Request.pdf`, title: "Task order request" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
      { kind: "wage", fileName: `${f.id}_Wage-Determination.pdf`, title: "Wage determination" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["The U.S. Army Reserve Command G-6 keeps its headquarters' documents and sites on SharePoint. This work statement covers running and improving them."] },
          { heading: "2. Who can quote", paragraphs: [HOLDERS_ONLY] },
          { heading: "3. Site administration", paragraphs: ["Run the sites, libraries, lists and permissions. Set permissions by group, and report every change each month."] },
          { heading: "4. Migration", paragraphs: ["Move content from old sites to new ones, and check every permission after the move."] },
          { heading: "5. Training", paragraphs: ["Train the site owners in each office, and keep the guides current."] },
          { heading: "6. Period of performance", paragraphs: [`${Term(f.years)}.`] },
        ],
      },
    },
  };
};

// ── The team-up: the Army medical center's IT support, request for information ──

const hospitalIt: Builder = (f) => {
  const draft = `${f.id}_Draft-Work-Statement.pdf`;
  const c = f.contact;
  return {
    quickSummary: `This is not a bid. The Defense Health Agency is asking which firms could provide IT services for Fort Bragg's Army medical center and its clinics when the current order ends in 2027: desk-side support, the service desk and clinic network support. It expects to order the work through GSA's 8(a) STARS III contract, with quotes in about 90 days and an award by 28 February 2027, at about ${range(f)} a year. A reply has no price.`,
    accordions: {
      what_the_buyer_needs: [
        "Market research for the follow-on to the medical center's IT services order.",
        "The work: desk-side support at the medical center and its clinics, the service desk, and clinic network support.",
        "A short reply by email: what your firm does, and similar jobs with a contact for each.",
        "No price. A reply is not an offer, and the agency will not award a contract from it.",
      ],
      eligibility_and_compliance: [
        "The agency expects to order the follow-on through GSA's 8(a) STARS III contract. Only STARS III holders could quote.",
        `NAICS code ${f.opp.naics}, Computer Systems Design Services.`,
        "Any firm can reply. A firm that would team should name its partners and each one's share of the work.",
      ],
      evaluation_criteria: [
        "Nothing is scored. A request for information is market research.",
        "The agency reads the replies to decide how to write the follow-on.",
      ],
      submission_instructions: [
        `Reply by email to ${c.name} at ${c.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "Only a STARS III holder is expected to hold the order.",
        "A year of the work is more than a 16-person firm's yearly revenue.",
        "A subcontractor's share is set by the teaming agreement. Agree on it before the quote.",
      ],
      quick_checklist: [
        `Reply to ${PARTNER.contact} at ${PARTNER.name}.`,
        "Send your Seymour Johnson desktop support and its rating.",
        "Ask for a teaming agreement that names your share: the desk-side techs.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "Contract expected", text: "This is not a solicitation. The agency expects to order the follow-on through GSA's 8(a) STARS III contract. Only STARS III holders would be able to quote." },
      { kind: "current", ref: "1.4", heading: "The current order", text: `The current order's last option runs to 28 February 2027. The agency expects quotes in about 90 days and an award by that date, at about ${range(f)} a year.` },
      { kind: "work", ref: "2.4", heading: "The work", text: "The follow-on covers desk-side support at the medical center and its clinics, the service desk, and clinic network support." },
      { kind: "teaming", ref: "2.5", heading: "Teaming", text: "A firm that would team should name its partners and the part of the work each would do." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Information.pdf`, title: "Request for information" },
      { kind: "custom", fileName: draft, title: "Draft work statement" },
    ],
    custom: {
      [draft]: {
        title: "DRAFT WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Purpose", paragraphs: ["Fort Bragg's Army medical center and its clinics need IT services when the current order ends. This draft describes the follow-on."] },
          { heading: "2. Desk-side support", paragraphs: ["Techs at the medical center and its clinics who fix problems at the user's desk, image and set up devices, and keep the asset list current."] },
          { heading: "3. Service desk", paragraphs: ["A service desk that answers calls from clinical staff at all hours and logs every request."] },
          { heading: "4. Clinic networks", paragraphs: ["Support for the clinics' networks and links back to the medical center."] },
          { heading: "5. Note", paragraphs: [`This draft is for market research, posted on ${longDate(f.posted)}. The final work statement may change.`] },
        ],
      },
    },
  };
};

export const HERO_DETAILS: Record<string, Builder> = {
  [HERO_IDS.hero]: helpDesk,
  [HERO_IDS.twin]: sharePoint,
  [HERO_IDS.teamUp]: hospitalIt,
};
