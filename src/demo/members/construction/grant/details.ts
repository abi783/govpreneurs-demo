// THE CONTRACTOR: the hand-written page detail for its three story opportunities.
// Each entry adds to what the generic builder (src/demo/grant/detail.ts) makes: a
// quick summary in the buyer's terms, the accordions that matter for this notice,
// the solicitation clauses that Grant's source chips quote, and any document
// written out in full.
//
// Source: demo-storyboard/construction-pack.md, sections 3–5. The hero is modeled
// on USACE Wilmington's HUBZone sealed bids at Fort Bragg (W912PM21B0009,
// W912PM20B0017) and its chiller work (W912PM24R0021); the twin on a Vertical
// Construction MATOC task order (W9124724F0488), with VA's public "holders only"
// wording; the team-up on the Fayetteville VA's 3rd-floor fan coil job
// (36C24623C0027).

import type { Builder } from "@/demo/grant/heroDetails";
import { longDate, PARTNER, usd, type OppFacts } from "@/demo/grant/facts";
import { dueTimeOf } from "@/demo/story/opportunities";
import { HERO_IDS } from "../opportunities";

const range = (f: OppFacts): string => `${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}`;

/** The days to finish, from the story's summary: "240". */
const daysToFinish = (f: OppFacts, fallback: string): string => /(\d+) days/.exec(f.opp.summary)?.[1] ?? fallback;

const VERTICAL_MATOC = "W91247-20-R-0009";
const WAGE_DECISION = "NC20260122";

// ── The hero: HVAC and electrical upgrade, Fort Bragg training building ──

const trainingBuilding: Builder = (f) => {
  const sow = `${f.id}_Statement-of-Work.pdf`;
  const schedule = `${f.id}_Bid-Schedule.pdf`;
  const days = daysToFinish(f, "240");
  const due = dueTimeOf(f.opp);
  return {
    quickSummary: `The Corps of Engineers wants a Special Operations training building at Fort Bragg upgraded: two new air-handling units, a 60-ton air-cooled chiller on a pad, new controls on the building's existing BACnet system, and an 800A switchboard and panels in place of the 400A service. The unit keeps using the building, so every outage is booked 14 days ahead. It is a sealed bid, open only to HUBZone small businesses, with ${days} days to finish. The Corps puts the work at ${range(f)}.`,
    accordions: {
      what_the_buyer_needs: [
        "Replace two air-handling units and the 60-ton air-cooled chiller on its pad.",
        "Put new controls on the building's existing BACnet system.",
        "Replace the 400A electrical service with an 800A switchboard and new panels.",
        "Keep the building in use: follow the phasing plan and book each outage 14 days ahead.",
        `Finish within ${days} calendar days of notice to proceed.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: HUBZone small business. The firm must hold SBA's HUBZone certification when it bids and at award.",
        `NAICS code ${f.opp.naics}, Plumbing, Heating, and Air-Conditioning Contractors.`,
        "An active SAM registration when the bid is opened and through award.",
        "A bid guarantee of 20 percent of the bid price with the bid, then 100% performance and payment bonds.",
        `Davis-Bacon wage decision ${WAGE_DECISION}, Modification 1, for building work in Cumberland and Hoke counties.`,
        "General liability insurance of $1M for each occurrence, and workers' compensation.",
      ],
      evaluation_criteria: [
        "Sealed bid: the lowest-priced responsive bid from a responsible bidder gets the award.",
        "Price is the only factor. There is no technical score.",
        "A bid without a bid guarantee, or that leaves out a signed amendment, is rejected.",
        "Before award, the Corps checks that the low bidder can do the work: its record, its bonding and its staff.",
      ],
      submission_instructions: [
        `Bids are due by ${due} on the due date and are opened in public at that time.`,
        "Send the signed bid schedule (SF 1442), the bid guarantee and every signed amendment.",
        "Go to the site visit. The Corps answers questions from it in an amendment.",
        `Send written questions to ${f.contact.name} at ${f.contact.email} before questions close.`,
      ],
      deliverables: [
        "Equipment submittals for the air handlers, chiller, switchboard and panels",
        "A phasing plan and an outage schedule, booked 14 days ahead",
        "Daily quality control reports and weekly certified payrolls",
        "Test, adjust and balance reports, as-built drawings and the operating manuals",
      ],
      technical_requirements: [
        "Controls that connect to the building's existing BACnet system.",
        "Refrigerant handled by EPA-certified technicians.",
        "Work to the Corps' safety manual (EM 385-1-1) and an accident prevention plan.",
        "Equipment that matches the specifications, or an approved equal.",
      ],
      personnel_requirements: [
        "A superintendent on site every work day.",
        "A quality control manager and a site safety officer, named before work starts.",
        "A background check and base pass for every worker.",
      ],
      risks_and_gotchas: [
        "Lead times: the chiller and the switchboard can take months. Get the dates in writing before you price.",
        `The wage decision has no HVAC mechanic class. Ask which class covers refrigerant piping; until then, price it at the pipefitter rate.`,
        "Bonds: check the job against your single and total bond limits before you bid.",
        "Progress payments come monthly, after the work is in place. Plan to carry about two months of equipment.",
      ],
      quick_checklist: [
        "Call your surety for the bid guarantee and a written OK on the final bonds.",
        "Get written lead times for the chiller and the switchboard.",
        "Go to the site visit.",
        "Send the wage-class question before questions close.",
        "Name your quality control manager and site safety officer.",
        `Send the bid before ${due} on the due date.`,
      ],
    },
    patches: [
      { kind: "needs", text: "Replace two air-handling units and the 60-ton air-cooled chiller, put new controls on the building's existing BACnet system, and replace the 400A service with an 800A switchboard and panels, in a building that stays in use." },
      { kind: "equipment", section: "C", ref: "C.3", heading: "Mechanical work", text: "The contractor shall replace two air-handling units and the 60-ton air-cooled chiller on its pad. New controls shall connect to the building's existing BACnet system." },
      { kind: "electrical", section: "C", ref: "C.7", heading: "Electrical service", text: "The contractor shall replace the 400A electrical service with an 800A switchboard and new panels, and test every circuit before it goes live." },
      { kind: "occupied", section: "C", ref: "C.5", heading: "Work in an occupied building", text: "The unit keeps using the building during the work. The contractor shall follow the phasing plan and book each outage of power, heating or cooling at least 14 days ahead, in writing." },
      { kind: "term", text: `The contractor shall finish all work within ${days} calendar days of notice to proceed.` },
      { kind: "place", text: "Building 2-4417, a Special Operations training building at Fort Bragg, North Carolina." },
      { kind: "wage", text: `The Davis-Bacon Act applies. General wage decision ${WAGE_DECISION}, Modification 1 (Building, Cumberland and Hoke counties), is at Attachment 2. The decision lists no HVAC mechanic class. A class it does not list is added after award.` },
      { kind: "bond", text: "Each bid shall include a bid guarantee of at least 20 percent of the bid price, up to $3 million. The successful bidder shall give performance and payment bonds, each equal to 100 percent of the contract price, before work starts." },
      { kind: "qualityControl", section: "H", ref: "H.6", heading: "Quality control and safety", text: "The contractor shall name a quality control manager and a site safety officer before work starts, keep a daily quality control report, and follow the Corps' safety manual (EM 385-1-1)." },
      { kind: "payments", section: "H", ref: "H.8", heading: "Payments", text: "The government pays monthly progress payments for work in place, on the contracting officer's approval of each payment request." },
      { kind: "submit", text: `Bids are due by ${longDate(f.closes)}, ${due}, and are opened in public at that time. A late bid is not considered.` },
      { kind: "content", text: "The bid has the signed bid schedule (SF 1442), the bid guarantee, the signed acknowledgment of each amendment, and the representations and certifications." },
      { kind: "evaluate", text: "The government awards to the lowest-priced bid that meets every requirement, from a bidder it finds responsible." },
      { kind: "factors", text: "Price is the only factor. The government does not score a technical volume." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Solicitation.pdf`, title: "Solicitation" },
      { kind: "custom", fileName: sow, title: "Statement of work" },
      { kind: "wage", fileName: `${f.id}_Wage-Decision-${WAGE_DECISION}.pdf`, title: "Wage determination" },
      { kind: "custom", fileName: schedule, title: "Bid schedule" },
    ],
    custom: {
      [sow]: {
        title: "STATEMENT OF WORK",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["Building 2-4417 is a Special Operations training building at Fort Bragg. Its air handlers, chiller and 400A service are past their service life. The unit keeps using the building during the work."] },
          { heading: "2. Mechanical", paragraphs: ["Take out and replace two air-handling units and the 60-ton air-cooled chiller on its pad. Connect the new equipment to the existing chilled-water piping, and start up, test and balance the system."] },
          { heading: "3. Controls", paragraphs: ["Put new controls on the building's existing BACnet system, so the base's operators can see and run the new equipment."] },
          { heading: "4. Electrical", paragraphs: ["Replace the 400A service with an 800A switchboard and new panels. Test every circuit and label every panel before it goes live."] },
          { heading: "5. Phasing and outages", paragraphs: ["Follow the phasing plan. Book each outage of power, heating or cooling at least 14 days ahead, in writing, with the building manager."] },
          { heading: "6. Quality and safety", paragraphs: ["Name a quality control manager and a site safety officer before work starts. Keep a daily quality control report. Follow EM 385-1-1."] },
          { heading: "7. Period of performance", paragraphs: [`${days} calendar days from notice to proceed.`] },
          { heading: "8. Closeout", paragraphs: ["Hand over test and balance reports, as-built drawings, warranties and the operating manuals, and train the building staff."] },
        ],
      },
      [schedule]: {
        title: "BID SCHEDULE",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "Item 0001", paragraphs: ["Mechanical work: air-handling units and chiller, complete. Lump sum $ ______________"] },
          { heading: "Item 0002", paragraphs: ["Controls on the existing BACnet system, complete. Lump sum $ ______________"] },
          { heading: "Item 0003", paragraphs: ["Electrical service: 800A switchboard and panels, complete. Lump sum $ ______________"] },
          { heading: "Total", paragraphs: ["Total bid, items 0001 to 0003: $ ______________", "Bidder: ______________________    Signature: ______________________    Date: ____________"] },
        ],
      },
    },
  };
};

// ── The twin: barracks HVAC repair, MATOC holders only ───────────────────

const HOLDERS_ONLY = `Offers will be accepted only from holders of the Fort Bragg DPW Vertical Construction MA IDIQ (${VERTICAL_MATOC}).`;

const barracksHoldersOnly: Builder = (f) => {
  const sow = `${f.id}_Statement-of-Work.pdf`;
  return {
    quickSummary: `The Army wants the air handlers, piping and controls in a Fort Bragg barracks replaced, as a task order under Fort Bragg's HUBZone Vertical Construction MATOC. ${HOLDERS_ONLY} The Army puts the work at ${range(f)}, with performance and payment bonds for the full price.`,
    accordions: {
      what_the_buyer_needs: [
        "Replace the air handlers, piping and controls in Building C-4613, a Fort Bragg barracks.",
        "Keep the soldiers housed: work in phases, with the rooms that are out of use agreed ahead.",
        "Start up, test and balance the system, and hand over the papers.",
        `The work is a task order under the Vertical Construction MATOC, which orders through August 2028.`,
      ],
      eligibility_and_compliance: [
        HOLDERS_ONLY,
        "The order is set aside for HUBZone small businesses, as the MATOC is.",
        `NAICS code ${f.opp.naics}, Commercial and Institutional Building Construction.`,
        "Performance and payment bonds, each equal to 100 percent of the order price.",
        "Davis-Bacon wages and weekly certified payrolls.",
      ],
      evaluation_criteria: [
        "Fair opportunity among the MATOC holders: the order goes to the holder whose offer is the best value under the base contract's terms.",
        "A firm that does not hold the MATOC can't send an offer.",
      ],
      submission_instructions: [
        `MATOC holders send their offer to ${f.contact.name} at ${f.contact.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "The offer follows the base contract's task order instructions.",
      ],
      risks_and_gotchas: [
        "Only the firms on the Vertical Construction MATOC can offer. Nothing a firm sends before the due date changes that.",
        "The bond for the full price is more than a $1.5M single-job line.",
        "A firm that wants the work can price its trade for one of the holders.",
      ],
      quick_checklist: [
        "Read the clause on who can offer.",
        "If you are not a holder, don't send an offer.",
        "Offer to price the HVAC work for a holder you know.",
      ],
    },
    patches: [
      { kind: "vehicle", section: "A", ref: "A.5", heading: "Who can offer", text: HOLDERS_ONLY },
      { kind: "setAside", text: "This task order is set aside for HUBZone small businesses, as the base MATOC is. Only MATOC holders may offer." },
      { kind: "needs", text: "Replace the air handlers, piping and controls in a Fort Bragg barracks, in phases that keep the building housing soldiers." },
      { kind: "place", text: "Building C-4613, a barracks at Fort Bragg, North Carolina." },
      { kind: "term", text: "The period of performance is set in the task order, counted from notice to proceed." },
      { kind: "bond", text: "The successful offeror shall give a performance bond and a payment bond, each equal to 100 percent of the task order price, before work starts." },
      { kind: "evaluate", text: "The order goes to the MATOC holder whose offer is the best value under the base contract's fair opportunity terms." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Task-Order-Request.pdf`, title: "Task order request" },
      { kind: "custom", fileName: sow, title: "Statement of work" },
      { kind: "wage", fileName: `${f.id}_Wage-Decision-${WAGE_DECISION}.pdf`, title: "Wage determination" },
    ],
    custom: {
      [sow]: {
        title: "STATEMENT OF WORK",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["Building C-4613 is a barracks at Fort Bragg. Its air handlers, piping and controls need replacing."] },
          { heading: "2. Who can offer", paragraphs: [HOLDERS_ONLY] },
          { heading: "3. The work", paragraphs: ["Replace the air handlers, the piping that serves them and their controls. Start up, test and balance the system."] },
          { heading: "4. Phasing", paragraphs: ["Work in phases agreed with the housing office, so the building keeps housing soldiers."] },
          { heading: "5. Bonds and wages", paragraphs: ["Performance and payment bonds of 100 percent of the order price. Davis-Bacon wages, with weekly certified payrolls."] },
        ],
      },
    },
  };
};

// ── The team-up: Fayetteville VA fan coils, sources sought ───────────────

const vaFanCoils: Builder = (f) => {
  const draft = `${f.id}_Draft-Scope.pdf`;
  const c = f.contact;
  return {
    quickSummary: `This is not a bid. The Fayetteville VA is asking which firms could replace the fan coil units, piping and power on floors 2 and 4 of its main building, as the 3rd floor was done in 2023–2025. The VA expects a sealed bid in about 150 days, set aside for service-disabled veteran-owned firms, at ${range(f)}. A reply has no price.`,
    accordions: {
      what_the_buyer_needs: [
        "Market research for the fan coil replacement on floors 2 and 4 of Building 1.",
        "The work: new fan coil units, the piping that serves them and their power, while the medical center stays open.",
        "A short reply by email: what your firm does, and similar jobs with a contact for each.",
        "No price. A reply is not an offer, and the VA will not award a contract from it.",
      ],
      eligibility_and_compliance: [
        "The VA expects to set the sealed bid aside for Service-Disabled Veteran-Owned Small Businesses (SDVOSB), under 38 U.S.C. 8127.",
        `NAICS code ${f.opp.naics}, Commercial and Institutional Building Construction.`,
        "Any firm can reply. A firm that would team should name its partners and each one's share of the work.",
        "The sealed bid will ask for a bid guarantee and performance and payment bonds.",
      ],
      evaluation_criteria: [
        "Nothing is scored. A sources sought is market research.",
        "The VA reads the replies to decide whether enough veteran-owned firms can do the work.",
      ],
      submission_instructions: [
        `Reply by email to ${c.name} at ${c.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "Only a service-disabled veteran-owned firm is expected to hold the prime contract.",
        "The job is more than twice a $1.5M single-job bond.",
        "A subcontractor's share, and whether it must bond its part, is set by the teaming agreement. Agree on both before the bid.",
      ],
      quick_checklist: [
        `Reply to ${PARTNER.contact} at ${PARTNER.name}.`,
        "Send your Pope job and your Fort Bragg barracks electrical work.",
        "Ask for a teaming agreement that names your share and the sub bonds.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "Set-aside expected", text: "This is not a solicitation. The VA expects to set the sealed bid aside for Service-Disabled Veteran-Owned Small Businesses (SDVOSB) under 38 U.S.C. 8127. It uses the replies to confirm that enough of them can do the work." },
      { kind: "current", ref: "1.4", heading: "The work so far", text: `The fan coil units on the 3rd floor of Building 1 were replaced in 2023–2025. This notice covers floors 2 and 4. The VA expects a sealed bid in about 150 days, at about ${range(f)}.` },
      { kind: "work", ref: "2.4", heading: "The work", text: "Replace the fan coil units, the piping that serves them and their power on floors 2 and 4 of Building 1, in phases, while the medical center stays open." },
      { kind: "teaming", ref: "2.5", heading: "Teaming", text: "A firm that would team should name its partners and the part of the work each would do." },
      { kind: "bonds", ref: "2.6", heading: "Bonds", text: "The sealed bid will require a bid guarantee and performance and payment bonds, each equal to 100 percent of the contract price." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Sources-Sought-Notice.pdf`, title: "Sources sought notice" },
      { kind: "custom", fileName: draft, title: "Draft scope of work" },
    ],
    custom: {
      [draft]: {
        title: "DRAFT SCOPE OF WORK",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Purpose", paragraphs: ["The Fayetteville VA Medical Center is replacing the fan coil units in Building 1, floor by floor. The 3rd floor is done. This draft covers floors 2 and 4."] },
          { heading: "2. Mechanical", paragraphs: ["Take out the old fan coil units and replace them, with the chilled and hot water piping that serves them."] },
          { heading: "3. Electrical", paragraphs: ["New power and disconnects for each unit, and controls wiring to the building's system."] },
          { heading: "4. Phasing", paragraphs: ["Work a few rooms at a time, with infection control, while the medical center stays open."] },
          { heading: "5. Note", paragraphs: [`This draft is for market research, posted on ${longDate(f.posted)}. The final scope may change.`] },
        ],
      },
    },
  };
};

export const HERO_DETAILS: Record<string, Builder> = {
  [HERO_IDS.hero]: trainingBuilding,
  [HERO_IDS.twin]: barracksHoldersOnly,
  [HERO_IDS.teamUp]: vaFanCoils,
};
