// THE TRUCKING COMPANY: the hand-written page detail for its three story
// opportunities. Each entry adds to what the generic builder (src/demo/grant/detail.ts)
// makes: a quick summary in the buyer's terms, the accordions that matter for
// this notice, the solicitation clauses that Grant's source chips quote, and any
// document written out in full.
//
// Source: demo-storyboard/trucking-pack.md, sections 3–5. The hero is modeled on
// VA NCO 6's SDVOSB route buys (36C24621Q0455, 36C24623Q0325) and VA linen routes
// elsewhere (36C25224P0010); the twin on DLA Distribution's protective-service
// freight (SP3300-09-R-0053), whose eligibility sentence it keeps; the team-up on
// Fort Bragg's EAGLE task order (W52P1J13G0027) and its re-solicitation
// (W519TC23R0019).

import type { Builder } from "@/demo/grant/heroDetails";
import { longDate, termText, usd, type OppFacts } from "@/demo/grant/facts";
import { dueTimeOf } from "@/demo/story/opportunities";
import { HERO_IDS } from "../opportunities";

const range = (f: OppFacts): string => `${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}`;
const Term = (f: OppFacts): string => `${termText(f.years).charAt(0).toUpperCase()}${termText(f.years).slice(1)}`;

const WAGE_DETERMINATION = "2015-4377, Rev. 33";
const LICENSE_LINE = "Hazardous material license number: ______________";

// ── The hero: supply and linen runs for the Fayetteville VA ──────────────

const vaLinenRoutes: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  const stops = `${f.id}_Routes-and-Stops.pdf`;
  const due = dueTimeOf(f.opp);
  return {
    quickSummary: `The VA wants two daily truck routes, Monday to Friday, out of the Fayetteville VA Medical Center warehouse: clean linen and supplies out to the Fayetteville clinic and the Sanford, Goldsboro, Jacksonville, Wilmington and Brunswick sites, and soiled linen and returns back. That is about 400 miles a day. The contract is ${termText(f.years)}, at fixed prices. Only service-disabled veteran-owned small businesses can quote. The VA puts the work at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Route 1: the warehouse to the Fayetteville clinic, Sanford and Goldsboro, and back.",
        "Route 2: the warehouse to Jacksonville, Wilmington and Brunswick, and back.",
        "Clean linen and supplies out; soiled linen in sealed carts and returns back, kept apart.",
        "Every weekday except federal holidays, with the warehouse loading from 6:00 AM.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: Service-Disabled Veteran-Owned Small Business (SDVOSB), under 38 U.S.C. 8127. The firm must be listed in SBA's certification database when it quotes.",
        `NAICS code ${f.opp.naics}, General Freight Trucking, Local.`,
        "An active SAM registration when the quote is sent and through award.",
        "USDOT and MC operating authority, and the vehicle and cargo insurance in the insurance clause.",
        "Bonded drivers who pass the VA's background check.",
        "The price schedule asks for a hazardous material license number. The notice does not say which license.",
        "No bid or performance bond is required.",
      ],
      evaluation_criteria: [
        "Best value. The VA scores the route plan first: trucks, drivers, the spare and the backup.",
        "Past performance second: two references for scheduled route work.",
        "Price third. Price every line for the base year and each option year.",
      ],
      submission_instructions: [
        `Send the quote by email to ${f.contact.name} at ${f.contact.email} by ${due} on the due date.`,
        "Part 1: the price schedule, on the VA's form, with every line filled. Part 2: an operating plan of up to three pages. Part 3: two references.",
        "Name the project manager and the alternate in the operating plan.",
        "Send questions in writing before Q&A closes. The VA answers them in an amendment that every bidder sees.",
      ],
      deliverables: [
        "A signed delivery ticket at every stop",
        "A daily route log with GPS times",
        "A monthly invoice that matches the signed tickets",
        "A backup plan for a breakdown or a missing driver",
      ],
      technical_requirements: [
        "Box trucks with lift gates, closed and clean, with clean and soiled loads kept apart.",
        "GPS on every truck, with times the VA can check.",
        "Carts strapped and secured for every leg.",
      ],
      personnel_requirements: [
        "A project manager and an alternate the VA can reach from 6:00 AM to 6:00 PM on weekdays.",
        "Drivers who pass the VA's background check and are bonded.",
        "A dispatcher on duty while the routes run.",
      ],
      risks_and_gotchas: [
        "The license line: the price schedule asks for a hazardous material license number. Ask in Q&A which license, and what bond the drivers need.",
        "Fuel: five fixed-price years and no fuel clause. Ask whether the VA will add a fuel adjustment; if not, quote diesel at a stated base price.",
        "Wages are not a fixed-price risk: FAR 52.222-43 adjusts the price when a new wage determination comes with an option year.",
        "A missed route is a failed day for six sites. Keep a spare truck ready.",
      ],
      quick_checklist: [
        "Send the license and bond question before Q&A closes.",
        "Ask whether the VA will add a fuel adjustment.",
        "Name your project manager and alternate.",
        "Pick the two trucks and the spare, and the two drivers and the backup.",
        "Price the base year and every option year, with your diesel base price written in.",
        `Send the quote before ${due} on the due date.`,
      ],
    },
    patches: [
      { kind: "needs", text: "Run two daily routes, Monday to Friday, out of the Fayetteville VA Medical Center warehouse: clean linen and supplies to six sites, and soiled linen and returns back, about 400 miles a day in all." },
      { kind: "place", text: "Routes start and end at the Fayetteville VA Medical Center warehouse, Fayetteville, North Carolina. Stops are at VA sites in Fayetteville, Sanford, Goldsboro, Jacksonville, Wilmington and Brunswick County." },
      { kind: "routes", section: "C", ref: "C.3", heading: "Routes", text: "Route 1 serves the Fayetteville clinic, Sanford and Goldsboro. Route 2 serves Jacksonville, Wilmington and Brunswick. Each route runs every weekday except federal holidays, leaves the warehouse after loading from 6:00 AM, and returns the same day." },
      { kind: "equipment", section: "C", ref: "C.7", heading: "Trucks", text: "The contractor shall run closed box trucks with lift gates and GPS. Clean linen and supplies shall be kept apart from soiled linen on every leg." },
      { kind: "staff", section: "C", ref: "C.8", heading: "Project manager and alternate", text: "The contractor shall name a project manager and an alternate. One of them shall be reachable from 6:00 AM to 6:00 PM, Monday to Friday." },
      { kind: "drivers", section: "C", ref: "C.9", heading: "Drivers", text: "Each driver shall pass the VA's background check before the first route and shall be bonded. The amount of the bond is not stated." },
      { kind: "license", section: "C", ref: "C.10", heading: "License on the price schedule", text: `The price schedule includes the line: "${LICENSE_LINE}". The work statement does not say which license this means.` },
      { kind: "price", text: "Price every line on the price schedule for the base year and each option year. Prices are firm and fixed for each year. The contract has no economic price adjustment for fuel." },
      { kind: "wage", text: `The Service Contract Labor Standards apply. Wage determination ${WAGE_DETERMINATION} (Cumberland and Hoke counties) is at Attachment 2. FAR 52.222-43 applies: when a new wage determination comes with an option year, the price is adjusted for it.` },
      { kind: "factors", text: "Factors, in order of importance: (1) the route plan: trucks, drivers, the spare and the backup, (2) past performance on scheduled route work, (3) price. Past performance means two references from the last three years." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Quote.pdf`, title: "Solicitation" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
      { kind: "custom", fileName: stops, title: "Routes and stops" },
      { kind: "wage", fileName: `${f.id}_Wage-Determination.pdf`, title: "Wage determination" },
      { kind: "price", fileName: `${f.id}_Price-Schedule.pdf`, title: "Price schedule" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["The Fayetteville VA Coastal Health Care System sends clean linen and supplies from the medical center warehouse to its clinics every weekday, and brings soiled linen and returns back."] },
          { heading: "2. Routes", paragraphs: ["Route 1: the Fayetteville clinic, Sanford and Goldsboro. Route 2: Jacksonville, Wilmington and Brunswick. About 400 miles a day for the two routes together."] },
          { heading: "3. Trucks", paragraphs: ["Closed box trucks with lift gates and GPS. Clean and soiled loads kept apart, with carts strapped for every leg."] },
          { heading: "4. Drivers", paragraphs: ["Drivers pass the VA's background check and are bonded before the first route. A backup driver covers a missing driver the same day."] },
          { heading: "5. Project manager and alternate", paragraphs: ["The contractor names a project manager and an alternate. One of them is reachable 6:00 AM to 6:00 PM, Monday to Friday."] },
          { heading: "6. Records", paragraphs: ["A signed delivery ticket at every stop, and a daily route log with GPS times, sent with the monthly invoice."] },
          { heading: "7. Period of performance", paragraphs: [`${Term(f)}. Prices are firm and fixed for each year.`] },
          { heading: "8. Inspection and acceptance", paragraphs: ["The VA's representative checks the tickets and the GPS log each month, and records any stop that is late or missed."] },
        ],
      },
      [stops]: {
        title: "ROUTES AND STOPS",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "Start and end", paragraphs: ["Fayetteville VA Medical Center warehouse, Fayetteville, NC. Loading from 6:00 AM."] },
          { heading: "Route 1", paragraphs: ["Fayetteville clinic · Sanford clinic · Goldsboro clinic · back to the warehouse."] },
          { heading: "Route 2", paragraphs: ["Jacksonville clinic · Wilmington clinic · Brunswick County clinic · back to the warehouse."] },
          { heading: "Note", paragraphs: ["The VA can add or move a stop with 30 days' notice. An added stop is priced on its own line."] },
        ],
      },
    },
  };
};

// ── The twin: secure freight runs from DLA Distribution Cherry Point ─────

const ELIGIBLE =
  "Only Surface Deployment and Distribution Command (SDDC) Protective Security Service (PSS) approved freight carriers are eligible to receive this solicitation.";
const CARGO = "The contractor shall move SECRET and CONFIDENTIAL cargo, and hazardous materials, by truckload between DLA Distribution Cherry Point and sites across the lower 48 states.";

const secureFreight: Builder = (f) => {
  const pws = `${f.id}_Performance-Work-Statement.pdf`;
  return {
    quickSummary: `DLA Distribution wants truckload runs of SECRET and CONFIDENTIAL cargo, and hazardous materials, from its Cherry Point site to sites across the lower 48 states. ${ELIGIBLE} The contract is ${termText(f.years)}. It is a total small business set-aside. DLA puts the work at ${range(f)} a year.`,
    accordions: {
      what_the_buyer_needs: [
        "Truckload runs of SECRET and CONFIDENTIAL cargo from DLA Distribution Cherry Point.",
        "Hazardous materials on some loads.",
        "Deliveries to sites across the lower 48 states.",
        "Protective security service: the cargo watched under SDDC's rules for the whole trip.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        ELIGIBLE,
        "Set-aside: total small business. The firm must be small under the size standard when it sends the proposal.",
        `NAICS code ${f.opp.naics}, General Freight Trucking, Long-Distance, Truckload.`,
        "A security clearance for the company, and cleared drivers, for SECRET cargo.",
        "Hazmat endorsements for drivers who haul hazardous materials.",
      ],
      evaluation_criteria: [
        "Best value among the approved carriers that receive the solicitation.",
        "A carrier that is not approved does not receive the papers, so it can't offer.",
      ],
      submission_instructions: [
        `Approved carriers send their proposal to ${f.contact.name} at ${f.contact.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "The solicitation goes only to carriers on SDDC's approved list.",
      ],
      risks_and_gotchas: [
        "Only carriers SDDC has approved for protective service receive the solicitation. Nothing a firm sends before the due date changes that.",
        "Approval needs a company clearance and cleared drivers, which take years, not weeks.",
        "The way in starts with SDDC's carrier program and a record hauling DoD freight.",
      ],
      quick_checklist: [
        "Read the clause on who can receive the solicitation.",
        "If you are not an approved carrier, don't spend time on this one.",
        "Start your SDDC carrier registration instead.",
      ],
    },
    patches: [
      { kind: "carrier", section: "A", ref: "A.5", heading: "Who can receive the solicitation", text: ELIGIBLE },
      { kind: "needs", text: CARGO },
      { kind: "place", text: "Loads start at DLA Distribution Cherry Point, aboard Marine Corps Air Station Cherry Point, Havelock, North Carolina, and go to sites across the lower 48 states." },
      { kind: "clearance", text: "SECRET cargo moves under protective security service. The carrier holds a facility security clearance, and every driver on a SECRET load holds a clearance." },
      { kind: "hazmat", section: "C", ref: "C.8", heading: "Hazardous materials", text: "Drivers on loads with hazardous materials shall hold a hazmat endorsement, and every load shall be placarded and documented under the hazardous materials rules." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Request-for-Proposal.pdf`, title: "Solicitation" },
      { kind: "custom", fileName: pws, title: "Performance work statement" },
      { kind: "price", fileName: `${f.id}_Price-Schedule.pdf`, title: "Price schedule" },
    ],
    custom: {
      [pws]: {
        title: "PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Background", paragraphs: ["DLA Distribution Cherry Point ships classified and sensitive cargo to sites across the country. This work statement covers that freight by truckload."] },
          { heading: "2. Who can receive this solicitation", paragraphs: [ELIGIBLE] },
          { heading: "3. Cargo", paragraphs: [CARGO] },
          { heading: "4. Protective security service", paragraphs: ["The cargo is watched for the whole trip under SDDC's protective security rules. Every truck is tracked by satellite."] },
          { heading: "5. Drivers", paragraphs: ["Cleared drivers on SECRET loads, and hazmat endorsements on loads with hazardous materials."] },
          { heading: "6. Period of performance", paragraphs: [`${Term(f)}.`] },
        ],
      },
    },
  };
};

// ── The team-up: Fort Bragg's base logistics contract, draft for comment ──

const EAGLE_ONLY = "The task order will be competed only among holders of the Army's EAGLE basic ordering agreement.";

const braggLogistics: Builder = (f) => {
  const draft = `${f.id}_Draft-Performance-Work-Statement.pdf`;
  const c = f.contact;
  return {
    quickSummary: `This is not a bid. The Army is asking for comments on its draft of Fort Bragg's next maintenance, supply and transportation contract, about $250M to $300M over 5 years. ${EAGLE_ONLY} The RFP is expected in about 100 days, and the current contract ends in 254 days. The transportation work inside it includes central-receiving runs, installation freight, and trailer and container moves. A reply has no price.`,
    accordions: {
      what_the_buyer_needs: [
        "Comments on the draft work statement for Fort Bragg's Logistics Readiness Center.",
        "The work: supply and warehouses, maintenance, and installation transportation.",
        "The transportation division: central-receiving runs, installation freight, and trailer and container moves on post.",
        "No price. A reply is not an offer, and the Army will not award a contract from it.",
      ],
      eligibility_and_compliance: [
        EAGLE_ONLY,
        `NAICS code ${f.opp.naics}, Facilities Support Services.`,
        "No set-aside. The current task order was competed full and open.",
        "A firm that is not an EAGLE holder can join a holder's team as a subcontractor.",
      ],
      evaluation_criteria: [
        "Nothing is scored. A draft for comment is market research.",
        "The Army reads the comments before it writes the RFP.",
      ],
      submission_instructions: [
        `Send comments by email to ${c.name} at ${c.email} by ${dueTimeOf(f.opp)} on the due date.`,
        "Keep comments to the draft's sections, in one PDF.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "Only EAGLE agreement holders can hold the task order.",
        "A year of the work is many times a small carrier's revenue.",
        "A subcontractor's share is set by its teaming agreement with the prime. Agree on it before the RFP.",
      ],
      quick_checklist: [
        "Reply to the EAGLE holder that wants a local carrier.",
        "Send your Fort Bragg trailer hauling and your daily routes.",
        "Ask for a teaming agreement that names the freight and trailer work as yours.",
      ],
    },
    patches: [
      { kind: "setAside", heading: "Who can bid", text: `This is not a solicitation. ${EAGLE_ONLY} No set-aside is planned.` },
      { kind: "current", ref: "1.4", heading: "The current contract", text: `The current task order for this work ends on June 30, 2027. The Army expects the RFP in about 100 days, and the follow-on to run five years at about $250M to $300M in all, or ${range(f)} a year.` },
      { kind: "work", ref: "2.4", heading: "Transportation", text: "The transportation division runs central-receiving runs, installation freight, and trailer and container moves between unit areas, warehouses and off-post yards." },
      { kind: "teaming", ref: "2.5", heading: "Teaming", text: "EAGLE holders that would team should name their partners and the part of the work each would do." },
    ],
    documents: [
      { kind: "solicitation", fileName: `${f.id}_Draft-RFP-Notice.pdf`, title: "Draft for comment" },
      { kind: "custom", fileName: draft, title: "Draft work statement" },
    ],
    custom: {
      [draft]: {
        title: "DRAFT PERFORMANCE WORK STATEMENT",
        subtitle: `${f.opp.title} · ${f.id}`,
        sections: [
          { heading: "1. Purpose", paragraphs: ["Fort Bragg's Logistics Readiness Center runs supply, maintenance and transportation for the installation. This draft covers the next task order for that work."] },
          { heading: "2. Supply", paragraphs: ["Warehouses, central receiving, and issue and turn-in of unit equipment."] },
          { heading: "3. Maintenance", paragraphs: ["Field maintenance of unit vehicles and equipment."] },
          { heading: "4. Transportation", paragraphs: ["Central-receiving runs, installation freight, and trailer and container moves between unit areas, warehouses and off-post yards."] },
          { heading: "5. Who can bid", paragraphs: [EAGLE_ONLY] },
          { heading: "6. Note", paragraphs: [`This draft is for comment, posted on ${longDate(f.posted)}. The final work statement may change.`] },
        ],
      },
    },
  };
};

export const HERO_DETAILS: Record<string, Builder> = {
  [HERO_IDS.hero]: vaLinenRoutes,
  [HERO_IDS.twin]: secureFreight,
  [HERO_IDS.teamUp]: braggLogistics,
};
