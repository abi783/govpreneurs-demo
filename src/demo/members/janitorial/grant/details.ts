// THE JANITORIAL FIRM: the hand-written page detail for its three story
// opportunities. Each entry adds to what the generic builder
// (src/demo/grant/detail.ts) makes: a quick summary in the buyer's terms, the
// accordions that matter for this notice, the solicitation clauses that Grant's
// source chips quote, and any document written out in full.
//
// Source: demo-storyboard/janitorial-pack.md, sections 3–5. The hero is modeled
// on MICC Fort Bragg's HUBZone pressure-washing RFQ (W9124721Q0002) and its 2026
// draft work statement; the twin on the post-wide AbilityOne custodial contract
// (W9124726DA001) and a mandatory-source notice (FA466426Q0004); the team-up on
// the 81st Readiness Division's janitorial and grounds (W912HP21C1001).

import type { Builder } from "@/demo/grant/heroDetails";
import { longDate, PARTNER, usd, type OppFacts } from "@/demo/grant/facts";
import { dueTimeOf } from "@/demo/story/opportunities";
import { HERO_IDS } from "../opportunities";

const range = (f: OppFacts): string => `${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}`;

const WAGE_DETERMINATION = "2015-4377, Rev. 33";
const POST_WIDE = "W9124726DA001";

// ── The hero: pressure washing and sandblasting, Fort Bragg ─────────────

const pressureWashing: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  const due = dueTimeOf(f.opp);
  return {
    quickSummary: `The Army's Directorate of Public Works wants the outsides of Fort Bragg's buildings washed: headquarters, child development centers, offices, barracks, bridges and tanks, at Fort Bragg, Pope, Simmons, Linden Oaks and the outlying training areas. Hot and cold water, 1,000 to 3,500 psi, about 377,000 square feet a year, with sandblasting in some extreme cases. One price per square foot for a base year, four option years and a six-month extension. Only HUBZone firms can quote, and the lowest price technically acceptable gets it. The Army puts the work at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Wash building exteriors and structures on the yearly list: about 4,000 square feet for a low building, 8,000 for a tall one.",
        "Hot and cold water at 1,000 to 3,500 psi, matched to each surface.",
        "Call orders for about 20% of buildings a year. Priority 1: on site in 2 hours, finished in 8.",
        "Sandblasting in some extreme cases, with the COR's approval, inside the same square-foot price.",
        "Child-safe chemicals at the child development centers, and wash water kept out of the storm drains.",
      ],
      eligibility_and_compliance: [
        "Set-aside: HUBZone small business. The firm must hold SBA's HUBZone certification when it quotes and at award.",
        `NAICS code ${f.opp.naics}, Other Services to Buildings and Dwellings.`,
        "An active SAM registration when the quote is sent and through award.",
        `The Service Contract Labor Standards apply: wage determination ${WAGE_DETERMINATION}, Cumberland and Hoke counties.`,
        "General liability insurance of $1M for each occurrence, and workers' compensation. No bond.",
      ],
      evaluation_criteria: [
        "Lowest price technically acceptable: every quote that meets the work statement ties, and the lowest price gets the award.",
        "Technically acceptable means a named Project Manager and QC manager, the equipment list with a backup, and a wash-water plan.",
        "Price is one rate per square foot, the same for every year.",
      ],
      submission_instructions: [
        `Quotes are due by ${due} on the due date.`,
        "Send the price schedule, the technical plan and the names of the Project Manager and QC manager.",
        `Send written questions to ${f.contact.name} at ${f.contact.email} before questions close. Every bidder sees the answers.`,
      ],
      deliverables: [
        "A wash schedule for the yearly list",
        "A completion sheet for each building, signed by the building manager",
        "A wash-water plan and safety data sheets for every chemical",
        "A monthly invoice by square foot",
      ],
      technical_requirements: [
        "Hot-water washers rated to 3,500 psi, and a backup rig for Priority 1 calls.",
        "Wash-water recovery where storm drains are near.",
        "Child-safe chemicals at child development centers.",
        "Sandblasting equipment, owned or subcontracted, for the cases the COR approves.",
      ],
      personnel_requirements: [
        "A Project Manager reachable from 7:00 AM to 3:30 PM on working days.",
        "A QC manager who inspects the work and answers findings.",
        "A background check and base pass for every worker.",
      ],
      risks_and_gotchas: [
        "Sandblasting sits inside the square-foot price. Ask how many square feet were blasted last year before you price.",
        "One rate for up to five years. Wage increases are adjusted at each option; fuel, chemicals and equipment are not.",
        "A 2-hour Priority 1 call when both rigs are booked: plan the backup before you quote.",
        "The Army pays in about 30 days. Carry five weeks of crew pay and fuel before the first payment.",
      ],
      quick_checklist: [
        "Send the sandblasting question before questions close.",
        "Ask which wage class DPW expects.",
        "Get a signed rate from a blasting sub.",
        "Name your Project Manager and QC manager.",
        "Plan the backup rig for Priority 1 calls.",
        `Send the quote before ${due} on the due date.`,
      ],
    },
    patches: [
      { kind: "needs", text: "Wash the exteriors of headquarters buildings, child development centers, offices, barracks, bridges and tanks on the yearly list, hot and cold, at 1,000 to 3,500 psi, with wash water kept out of the storm drains." },
      { kind: "demand", section: "C", ref: "C.9", heading: "Call orders", text: "About 20% of buildings a year are ordered on call. For a Priority 1 call the contractor shall be on site within 2 hours and finish within 8. The contractor shall keep backup equipment for these calls." },
      { kind: "sandblast", section: "C", ref: "C.10", heading: "Sandblasting", text: "In some extreme cases, and with the COR's approval, the contractor shall sandblast a surface. This work is priced inside the same square-foot rate." },
      { kind: "chemicals", text: "The contractor shall use child-safe chemicals at child development centers, and products from the approved list elsewhere, with a safety data sheet on site for each one." },
      { kind: "keyPersonnel", text: "The contractor shall name a Project Manager, reachable from 7:00 AM to 3:30 PM on working days, and a QC manager, and tell the contracting officer before replacing either one." },
      { kind: "price", text: "Quote one price per square foot. The same rate applies to the base year, each option year and the six-month extension." },
      { kind: "term", text: "The period of performance is a base year from 1 January 2027, four option years and a six-month extension." },
      { kind: "place", text: "Fort Bragg, Pope Army Airfield, Simmons Army Airfield, Linden Oaks and the outlying training areas, North Carolina." },
      { kind: "wage", text: `The Service Contract Labor Standards apply. Wage determination ${WAGE_DETERMINATION} (Cumberland and Hoke counties) is at Attachment 2. Wage increases are adjusted at each option year under FAR 52.222-43; other costs are not.` },
      { kind: "payments", section: "H", ref: "H.7", heading: "Payments", text: "The government pays monthly invoices for the square feet completed, about 30 days after a proper invoice." },
      { kind: "evaluate", text: "The government awards to the lowest-priced quote that is technically acceptable. Technically acceptable means a named Project Manager and QC manager, the equipment list with a backup rig, and a wash-water plan." },
      { kind: "factors", text: "Technical acceptability is pass or fail. Among acceptable quotes, price decides." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Quote.pdf`, title: "Solicitation" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
      { kind: "wage", fileName: `${f.id}_Wage-Determination-2015-4377.pdf`, title: "Wage determination" },
      { kind: "price", fileName: `${f.id}_Price-Schedule.pdf`, title: "Price schedule" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["The Directorate of Public Works keeps the exteriors of Fort Bragg's buildings and structures clean so they last longer. About 377,000 square feet are washed a year."] },
          { heading: "2. The work", paragraphs: ["Wash the buildings and structures on the yearly list, hot and cold, at the pressure each surface takes, from 1,000 to 3,500 psi."] },
          { heading: "3. Call orders", paragraphs: ["About 20% of buildings a year are ordered on call. Priority 1: on site in 2 hours, finished in 8. Keep backup equipment for these calls."] },
          { heading: "4. Sandblasting", paragraphs: ["In some extreme cases, with the COR's approval, sandblast the surface. This is inside the square-foot price."] },
          { heading: "5. Chemicals and wash water", paragraphs: ["Child-safe chemicals at child development centers. Keep wash water and chemicals out of the storm drains."] },
          { heading: "6. Key personnel", paragraphs: ["A Project Manager reachable from 7:00 AM to 3:30 PM on working days, and a QC manager."] },
          { heading: "7. Period of performance", paragraphs: ["A base year from 1 January 2027, four option years and a six-month extension."] },
        ],
      },
    },
  };
};

// ── The twin: custodial for ten buildings, headed to AbilityOne ─────────

const ABILITYONE = `This requirement is being considered for the AbilityOne Program in accordance with FAR Subpart 8.7. If it is added to the Procurement List, the buildings join the post-wide AbilityOne custodial contract (${POST_WIDE}).`;

const tenBuildings: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  return {
    quickSummary: `The Army posted a work statement for daily custodial work in the Soldier Support Center and nine administrative buildings at Fort Bragg. ${ABILITYONE} Work on the Procurement List must be bought from a nonprofit agency that employs people who are blind or have significant disabilities. The Army puts the work at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Daily custodial work in the Soldier Support Center and nine administrative buildings.",
        "Trash, restrooms, dusting, vacuuming and mopping on the work statement's schedule.",
        "Periodic floor care and carpet extraction.",
        "Responses to the notice within 14 days.",
      ],
      eligibility_and_compliance: [
        ABILITYONE,
        "Under 41 U.S.C. 8504, the Army must buy Procurement List services from a nonprofit agency the AbilityOne Commission names.",
        "No set-aside is shown, because the work is not headed to a competition.",
        `NAICS code ${f.opp.naics}, Janitorial Services.`,
      ],
      evaluation_criteria: [
        "Nothing is scored. The notice tells firms the work is being considered for the Procurement List.",
        "A commercial firm's quote can't be accepted for Procurement List work.",
      ],
      submission_instructions: [
        `Responses go to ${f.contact.name} at ${f.contact.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "The AbilityOne Commission posts proposed additions in the Federal Register, with a comment period.",
      ],
      risks_and_gotchas: [
        "No commercial firm can win Procurement List work, at any price.",
        "Fort Bragg's custodial work went to one AbilityOne nonprofit in March 2026.",
        "A firm that holds work proposed for the list can comment on the addition and show the harm.",
      ],
      quick_checklist: [
        "Read the AbilityOne line in the notice.",
        "Don't price it.",
        "Spend the time on the pressure-washing quote.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "AbilityOne", text: ABILITYONE },
      { kind: "mandatorySource", section: "A", ref: "A.5", heading: "Mandatory source", text: "Under 41 U.S.C. 8504 and FAR 8.002, services on the Procurement List shall be bought from the nonprofit agency the AbilityOne Commission names. Quotes from other firms will not be considered." },
      { kind: "needs", text: "Daily custodial work in the Soldier Support Center and nine administrative buildings at Fort Bragg: trash, restrooms, dusting, vacuuming and mopping, with periodic floor care." },
      { kind: "place", text: "The Soldier Support Center and nine administrative buildings at Fort Bragg, North Carolina." },
      { kind: "term", text: "A base year and four option years, through the post-wide AbilityOne custodial contract." },
      { kind: "evaluate", text: "This is a special notice, not a competition. If the work is added to the Procurement List, it is ordered from the nonprofit agency under the post-wide contract." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Special-Notice.pdf`, title: "Special notice" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["The Soldier Support Center and nine administrative buildings at Fort Bragg need daily custodial work."] },
          { heading: "2. Mandatory source", paragraphs: [ABILITYONE] },
          { heading: "3. The work", paragraphs: ["Trash, restrooms, dusting, vacuuming and mopping every working day. Strip, wax and burnish hard floors and extract carpets on the periodic schedule."] },
          { heading: "4. Hours", paragraphs: ["Daily cleaning after the buildings' working hours. A supervisor reachable during them."] },
        ],
      },
    },
  };
};

// ── The team-up: Army Reserve centers in NC and SC, sources sought ──────

const armyReserve: Builder = (f) => {
  const draft = `${f.id}_Draft-PWS.pdf`;
  const c = f.contact;
  return {
    quickSummary: `This is not a bid. The Corps of Engineers, Charleston District, asks which firms could clean and mow the 81st Readiness Division's Army Reserve centers in North and South Carolina for five years, with one prime for every site. A request for proposals is expected in about 75 days, set aside for 8(a) firms, at ${range(f)} over the term. A reply has no price.`,
    accordions: {
      what_the_buyer_needs: [
        "Market research for janitorial and grounds work at Army Reserve centers in North and South Carolina.",
        "One prime for every site, on a base year and four option years.",
        "A short reply by email: what your firm does, and similar jobs with a contact for each.",
        "No price. A reply is not an offer, and no contract is awarded from it.",
      ],
      eligibility_and_compliance: [
        "The Corps expects to set the proposal aside for firms in the SBA's 8(a) program.",
        `NAICS code ${f.opp.naics}, Janitorial Services.`,
        "Any firm can reply. A firm that would team should name its partners and each one's share of the work.",
        "The Service Contract Labor Standards will apply, with a wage determination for each county.",
      ],
      evaluation_criteria: [
        "Nothing is scored. A sources sought is market research.",
        "The Corps reads the replies to decide whether enough 8(a) firms can cover every site.",
      ],
      submission_instructions: [
        `Reply by email to ${c.name} at ${c.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "Only an 8(a) firm is expected to hold the prime contract.",
        "The sites run across two states, more than a local firm can cover alone.",
        "A subcontractor's share is set in the teaming agreement. Agree on the sites and the share before the proposal.",
      ],
      quick_checklist: [
        `Reply to ${PARTNER.contact} at ${PARTNER.name}.`,
        "Send your Hope Mills town work and your VA clinic floor care.",
        "Ask for a teaming agreement that names the North Carolina sites you'd cover.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "Set-aside expected", text: "This is not a solicitation. The Corps expects to set the proposal aside for firms in the SBA's 8(a) Business Development Program. It uses the replies to confirm that enough of them can do the work." },
      { kind: "current", ref: "1.4", heading: "The work so far", text: `The current contract for these centers ends in early 2027. The Corps expects a request for proposals in about 75 days, for five years, at about ${range(f)}.` },
      { kind: "work", ref: "2.4", heading: "The work", text: "Clean the Army Reserve centers on a set schedule, and mow and trim their grounds through the growing season, at sites in North and South Carolina. One prime covers every site." },
      { kind: "teaming", ref: "2.5", heading: "Teaming", text: "A firm that would team should name its partners and the sites or share of the work each would do." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Sources-Sought-Notice.pdf`, title: "Sources sought notice" },
      { kind: "custom", fileName: draft, title: "Draft work statement" },
    ],
    custom: {
      [draft]: {
        title: "DRAFT PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Purpose", paragraphs: ["Janitorial and grounds maintenance for the 81st Readiness Division's Army Reserve centers in North and South Carolina."] },
          { heading: "2. Janitorial", paragraphs: ["Clean offices, drill halls, restrooms and break rooms on a set schedule, with periodic floor care. Centers are busiest on drill weekends."] },
          { heading: "3. Grounds", paragraphs: ["Mow, trim and edge the grounds through the growing season, and keep walkways clear."] },
          { heading: "4. Term", paragraphs: ["A base year and four option years. One prime for every site."] },
          { heading: "5. Note", paragraphs: [`This draft is for market research, posted on ${longDate(f.posted)}. The final work statement may change.`] },
        ],
      },
    },
  };
};

export const HERO_DETAILS: Record<string, Builder> = {
  [HERO_IDS.hero]: pressureWashing,
  [HERO_IDS.twin]: tenBuildings,
  [HERO_IDS.teamUp]: armyReserve,
};
