// THE CONSULTANT: the hand-written page detail for its three story opportunities.
// Each entry adds to what the generic builder (src/demo/grant/detail.ts) makes: a
// quick summary in the buyer's terms, the accordions that matter for this notice,
// the solicitation clauses that Grant's source chips quote, and any document
// written out in full.
//
// Source: demo-storyboard/consulting-pack.md, sections 3–5. The hero is modeled on
// the Fayetteville VA's leadership training buys (36C24621P0974, 36C24622P1063);
// the twin on a GSA schedule order for manpower support at Fort Bragg
// (W9124723F0139), with eBuy wording written for the demo; the team-up on the
// Army's family readiness staff training order under HR Solutions PLS
// (W15QKN21F0263). There is no public work statement for the hero; it is written
// from VA programs.

import type { Builder } from "@/demo/grant/heroDetails";
import { longDate, PARTNER, termText, usd, type OppFacts } from "@/demo/grant/facts";
import { dueTimeOf } from "@/demo/story/opportunities";
import { HERO_IDS } from "../opportunities";

const range = (f: OppFacts): string => `${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}`;
const Term = (f: OppFacts): string => `${termText(f.years).charAt(0).toUpperCase()}${termText(f.years).slice(1)}`;

// ── The hero: supervisor leadership program, Fayetteville VA ─────────────

const SUBCONTRACTING =
  "VAAR 852.219-75 applies: the contractor shall not pay more than 50 percent of the amount paid by the government to firms that are not certified service-disabled or veteran-owned small businesses. The offeror signs the limitations on subcontracting certificate and sends it with the quote.";

const COACHES = "Each coach shall hold an International Coaching Federation (ICF) Professional Certified Coach (PCC) credential, or equal.";

const supervisorProgram: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  const due = dueTimeOf(f.opp);
  return {
    quickSummary: `The Fayetteville VA Coastal Health Care System wants a leadership program for its new supervisors: four cohorts a year of up to 30 people, six classroom days per cohort at the Fayetteville VA Medical Center and the Wilmington Health Care Center, a 360 and three coaching sessions for each supervisor, and a quarterly report tied to the All Employee Survey. Coaches need an ICF PCC or equal. The contract is ${termText(f.years)}, set aside for service-disabled veteran-owned small businesses under Veterans First. The VA estimates ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Four cohorts a year of up to 30 new supervisors each.",
        "Six classroom days per cohort, at the Fayetteville VA Medical Center and the Wilmington Health Care Center.",
        "A 360 assessment and three coaching sessions for each supervisor.",
        "A quarterly report that ties each cohort's results to the VA's All Employee Survey.",
        "A named Program Manager and Lead Facilitator.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: Service-Disabled Veteran-Owned Small Business (SDVOSB), under 38 U.S.C. 8127 and VAAR 852.219-73. The firm must be listed as SDVOSB in SBA's certification database when it quotes and at award.",
        `NAICS code ${f.opp.naics}, Professional and Management Development Training.`,
        "Limitations on subcontracting (VAAR 852.219-75): at most 50 percent of what VA pays may go to firms that are not certified veteran-owned. The certificate is signed and sent with the quote.",
        "An active SAM registration when the quote is sent and through award.",
        "Coaches with an ICF PCC credential, or equal.",
        "General liability insurance of $1M for each occurrence, and workers' compensation.",
        "No bond is required.",
      ],
      evaluation_criteria: [
        "Best value. Technical approach first: the program plan, the coaching and how results reach the quarterly report.",
        "Past performance second: two references for similar programs.",
        "Price third. Price every line for the base year and each option year.",
        "The VA checks the firm's SDVOSB certification at the quote and again before award.",
      ],
      submission_instructions: [
        `Send the quote by email to ${f.contact.name} at ${f.contact.email} by ${due} on the due date.`,
        "Part 1: the price schedule. Part 2: a technical plan of up to five pages that names the Program Manager and Lead Facilitator. Part 3: two references.",
        "Sign the limitations on subcontracting certificate and send it with the quote.",
        "Send questions in writing before the question deadline. The VA answers them in an amendment.",
      ],
      deliverables: [
        "A program plan and a cohort calendar for each year",
        "Course materials, approved before the first class",
        "A 360 report and a coaching record for each supervisor",
        "A quarterly report tied to the All Employee Survey",
      ],
      technical_requirements: [
        "Classes held at the Fayetteville and Wilmington sites, in rooms the VA provides.",
        "A 360 tool that keeps each supervisor's answers private.",
        "Coaches with an ICF PCC credential, or equal.",
        "Course materials approved by the VA before use.",
      ],
      personnel_requirements: [
        "A named Program Manager and Lead Facilitator for the length of the contract.",
        "Facilitators with experience teaching new supervisors.",
        "A background check and a VA badge for anyone who works on site.",
      ],
      risks_and_gotchas: [
        "The 50% rule: contract (1099) facilitators may count as subcontractors. Count paid hours by person before you sign the certificate.",
        "The coach line: PCC or equal. Ask in Q&A whether an ACC with federal coaching hours counts.",
        "Wilmington is 90 miles away. Price the travel for its cohort days.",
        "SDVOSB eligibility must hold at award. Check your VetCert dates.",
      ],
      quick_checklist: [
        "Count W-2 and 1099 hours by person for the four cohorts.",
        "Send the coach question before Q&A closes.",
        "Name your Program Manager and Lead Facilitator.",
        "Price the base year and both option years.",
        "Sign the limitations on subcontracting certificate.",
        `Send the quote before ${due} on the due date.`,
      ],
    },
    patches: [
      { kind: "needs", text: "Run four cohorts a year of up to 30 new supervisors: six classroom days per cohort, a 360 assessment and three coaching sessions for each supervisor, and a quarterly report on results." },
      { kind: "place", text: "Classes take place at the Fayetteville VA Medical Center, Fayetteville, North Carolina, and the Wilmington Health Care Center, Wilmington, North Carolina." },
      { kind: "staff", section: "C", ref: "C.5", heading: "Program Manager and Lead Facilitator", text: "The contractor shall name a Program Manager and a Lead Facilitator in the quote. Either is replaced only with the contracting officer's written consent, by someone equally qualified." },
      { kind: "reports", section: "C", ref: "C.6", heading: "Quarterly report", text: "The contractor shall send a quarterly report of each cohort's attendance, 360 results and coaching sessions, tied to the facility's All Employee Survey results." },
      { kind: "cohorts", section: "C", ref: "C.7", heading: "Cohorts and classroom days", text: "The contractor shall run four cohorts a year of up to 30 supervisors each. Each cohort has six classroom days, held at the Fayetteville VA Medical Center or the Wilmington Health Care Center." },
      { kind: "coaches", section: "C", ref: "C.8", heading: "Coaching", text: `The contractor shall give each supervisor a 360 assessment and three coaching sessions on its results. ${COACHES}` },
            { kind: "factors", text: "Factors, in order of importance: (1) technical approach: the program plan, the coaching and the quarterly report, (2) past performance on similar programs, (3) price. Past performance means two references from the last three years." },
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
          { heading: "1. Background", paragraphs: ["The Fayetteville VA Coastal Health Care System promotes new supervisors every month. This work statement covers a leadership program that prepares them for the job."] },
          { heading: "2. Cohorts", paragraphs: ["Four cohorts a year of up to 30 new supervisors. Each cohort has six classroom days at the Fayetteville VA Medical Center or the Wilmington Health Care Center."] },
          { heading: "3. Assessment and coaching", paragraphs: [`A 360 assessment for each supervisor, then three coaching sessions on its results. ${COACHES}`] },
          { heading: "4. Program Manager and Lead Facilitator", paragraphs: ["The contractor names a Program Manager and a Lead Facilitator. The VA can reach one of them on any workday."] },
          { heading: "5. Reports", paragraphs: ["A quarterly report of attendance, 360 results and coaching sessions, tied to the facility's All Employee Survey results."] },
          { heading: "6. Limitations on subcontracting", paragraphs: [SUBCONTRACTING] },
          { heading: "7. Period of performance", paragraphs: [`${Term(f)}. Prices are firm and fixed for each year.`] },
          { heading: "8. Inspection and acceptance", paragraphs: ["The contracting officer's representative reviews each cohort and each quarterly report, and records any class or report that is late or missing."] },
        ],
      },
    },
  };
};

// ── The twin: manpower analysts, GSA schedule holders only ───────────────

const SCHEDULE_ONLY =
  "This request is issued through GSA eBuy to holders of a GSA Multiple Award Schedule contract under SIN 541611. Only schedule holders may quote. The order is set aside for service-disabled veteran-owned small businesses under FAR 8.405-5.";

const manpowerSchedule: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  return {
    quickSummary: `The Army wants manpower analysts to study staffing and write manpower requirements for Army units at Fort Bragg, ${termText(f.years)}. ${SCHEDULE_ONLY} The Army estimates ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Manpower analysts who study how Army units at Fort Bragg are staffed.",
        "Written manpower requirements and briefings for unit leaders.",
        "Full-time analysts on site, with a named program manager.",
        `The order is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        SCHEDULE_ONLY,
        `NAICS code ${f.opp.naics}, Administrative Management and General Management Consulting Services.`,
        "An active SAM registration and an active GSA schedule under SIN 541611.",
        "Labor categories and ceiling rates from the quoter's own schedule.",
      ],
      evaluation_criteria: [
        "Best value among the schedule holders who quote, under FAR 8.405.",
        "A firm without a GSA schedule can't quote.",
      ],
      submission_instructions: [
        `Schedule holders quote through GSA eBuy by ${dueTimeOf(f.opp)} on the due date.`,
        "The quote uses the labor categories on the holder's schedule.",
      ],
      risks_and_gotchas: [
        "Only GSA schedule holders can quote. Nothing a firm sends before the due date changes that.",
        "A schedule offer takes months of review, not weeks.",
        "Full-time analyst seats mean hiring before the first day.",
      ],
      quick_checklist: [
        "Read the clause on who can quote.",
        "If you have no GSA schedule, don't quote.",
        "Start a schedule offer for the next order.",
      ],
    },
    patches: [
      { kind: "vehicle", section: "A", ref: "A.5", heading: "Who can quote", text: SCHEDULE_ONLY },
      { kind: "needs", text: "Study how Army units at Fort Bragg are staffed, write manpower requirements and brief unit leaders, with full-time analysts on site." },
      { kind: "place", text: "Unit headquarters at Fort Bragg, North Carolina." },
      { kind: "evaluate", text: "The order goes to the schedule holder whose quote is the best value under FAR 8.405." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Quote.pdf`, title: "Request for quote (GSA eBuy)" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["Army units at Fort Bragg need current manpower requirements to staff their headquarters."] },
          { heading: "2. Who can quote", paragraphs: [SCHEDULE_ONLY] },
          { heading: "3. The work", paragraphs: ["Study each unit's work and staffing, write its manpower requirements, and brief its leaders."] },
          { heading: "4. Staff", paragraphs: ["Full-time analysts on site, and a named program manager."] },
          { heading: "5. Period of performance", paragraphs: [`${Term(f)}.`] },
        ],
      },
    },
  };
};

// ── The team-up: Army family readiness staff training, sources sought ────

const PLS_ONLY =
  "The Army expects to place this order on the Army HR Solutions Personnel Lifecycle Support (PLS) multiple-award contract. Only PLS holders will be able to compete for the order.";

const familyReadiness: Builder = (f) => {
  const draft = `${f.id}_Draft-PWS.pdf`;
  const c = f.contact;
  return {
    quickSummary: `This is not a bid. The Army asks who could train its soldier and family readiness staff for five more years, in person and online, as the current order ends. It expects to place the order on its HR Solutions Personnel Lifecycle Support (PLS) contract in about 150 days, so only PLS holders can compete. The Army puts the work at ${range(f)} a year. A reply has no price.`,
    accordions: {
      what_the_buyer_needs: [
        "Market research for the next order of soldier and family readiness staff training.",
        "The work: classes for family readiness staff, in person at installations and online.",
        "A short reply by email: what your firm does, and similar work with a contact for each.",
        "No price. A reply is not an offer, and the Army will not award a contract from it.",
      ],
      eligibility_and_compliance: [
        PLS_ONLY,
        `NAICS code ${f.opp.naics}, Human Resources Consulting Services.`,
        "Any firm can reply. A firm that would team should name its partners and each one's share of the work.",
      ],
      evaluation_criteria: [
        "Nothing is scored. A sources sought is market research.",
        "The Army reads the replies to plan the order and its set-aside.",
      ],
      submission_instructions: [
        `Reply by email to ${c.name} at ${c.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "Only PLS holders can compete for the order. A firm off the contract joins as a subcontractor.",
        "The order runs five years at more than $1M a year, far past a small firm's usual job.",
        "A subcontractor's share is set by the teaming agreement. Agree on it before the order is quoted.",
      ],
      quick_checklist: [
        `Reply to ${PARTNER.contact} at ${PARTNER.name}.`,
        "Send your family readiness class record and your Fort Bragg ACS job.",
        "Ask for a teaming agreement that names the in-person classes you would teach.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "Who can compete", text: `This is not a solicitation. ${PLS_ONLY} The Army has not decided whether to set the order aside among PLS holders.` },
      { kind: "current", ref: "1.4", heading: "The work so far", text: `The last order for this training ran from May 2021 to May 2026. The next order runs five years, at about ${range(f)} a year, and the Army expects to place it in about 150 days.` },
      { kind: "work", ref: "2.4", heading: "The work", text: "Train soldier and family readiness staff and volunteers: in-person classes at installations in the Southeast and elsewhere, and online cohorts." },
      { kind: "teaming", ref: "2.5", heading: "Teaming", text: "A firm that would team should name its partners and the part of the work each would do." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Sources-Sought-Notice.pdf`, title: "Sources sought notice" },
      { kind: "custom", fileName: draft, title: "Draft performance work statement" },
    ],
    custom: {
      [draft]: {
        title: "DRAFT PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Purpose", paragraphs: ["The Army trains the staff and volunteers who run soldier and family readiness programs. This draft covers the next five years of that training."] },
          { heading: "2. Classes", paragraphs: ["In-person classes at installations, and online cohorts, on the family readiness curriculum."] },
          { heading: "3. Contract", paragraphs: [PLS_ONLY] },
          { heading: "4. Note", paragraphs: [`This draft is for market research, posted on ${longDate(f.posted)}. The final work statement may change.`] },
        ],
      },
    },
  };
};

export const HERO_DETAILS: Record<string, Builder> = {
  [HERO_IDS.hero]: supervisorProgram,
  [HERO_IDS.twin]: manpowerSchedule,
  [HERO_IDS.teamUp]: familyReadiness,
};
