// DEMO: the hand-written page detail for the six opportunities that have a full
// Grant review. Each entry adds to what the generic builder (detail.ts) makes: a
// quick summary in the buyer's own terms, the accordions that matter for this
// notice, and the solicitation clauses that Grant's source chips quote.
//
// Every number comes from the story (the opportunity record, the persona or the
// clock), so a change in the story reaches the page, the sample PDFs and Grant.

import { DEMO_TODAY } from "@/demo/story/clock";
import { calendarDay } from "./calendar";
import type { HeroDetail } from "./detail";
import { longDate, type OppFacts, termText, usd } from "./facts";
import { HERO_IDS as CATERER_HERO } from "@/demo/members/caterer/opportunities";
import { HERO_DETAILS as AGENCY_DETAILS } from "@/demo/members/agency/grant/details";
import { byMember } from "@/demo/member";

export type Builder = (f: OppFacts) => HeroDetail;

const dateIn = (f: OppFacts, days: number): string =>
  longDate(calendarDay(DEMO_TODAY, days));

/** Number the summary states, such as "about 18 rotations a year". */
const fromSummary = (f: OppFacts, re: RegExp, fallback: string): string => re.exec(f.opp.summary)?.[1] ?? fallback;

// ── Camp Mackall field meals ─────────────────────────────────────────────

const fieldMeals: Builder = (f) => {
  const rotations = fromSummary(f, /about (\d+) rotations a year/, "18");
  return {
    quickSummary: `The Army wants hot breakfast and dinner delivered to soldiers at Camp Mackall field sites during training rotations. There are about ${rotations} rotations a year. You cook and pack the meals, then deliver them in insulated containers to two drop points. The contract is ${termText(f.years)}. Only woman-owned small businesses can compete. The Army estimates the value at ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} over the full term.`,
    accordions: {
      what_the_buyer_needs: [
        "Hot breakfast and hot dinner for soldiers in the field on each rotation day.",
        "Breakfast drop at 5:30 AM. Dinner drop at 5:00 PM.",
        "Two drop points inside Camp Mackall. The Army gives the grid points at award.",
        `About ${rotations} rotations a year. Each rotation lasts about a week, with 150 to 600 soldiers. The Army confirms the headcount 72 hours ahead.`,
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: Women-Owned Small Business (WOSB). The firm must hold an active SBA certification when it sends the quote and at award.",
        "NAICS code 722310, Food Service Contractors. The size standard is $47.0 million in average annual receipts.",
        "An active SAM registration when the quote is sent and through award.",
        "Proof of a food-handler certificate for every cook, sent with the quote.",
        "A written food-safety plan (HACCP).",
        "General liability insurance of $1M for each occurrence, commercial vehicle insurance, and workers' compensation.",
        "Two past-performance references from the last three years.",
        "No bond is required.",
      ],
      evaluation_criteria: [
        "Best value. The Army scores the delivery plan first, menu variety second, and price third.",
        "Past performance is pass or fail: two references for similar work.",
        "The delivery plan must show how you reach both drop points on time on a 5:30 AM schedule.",
        "Price is the total for the base year, based on the Army's estimated meal counts.",
      ],
      submission_instructions: [
        `Send the quote by email to ${f.contact.name} at ${f.contact.email} by 5:00 PM Eastern on the due date.`,
        "Part 1: the price schedule, on the Army's form. Part 2: a delivery plan of up to three pages. Part 3: a 14-day sample menu.",
        "Attach the food-handler certificates, the HACCP plan and proof of insurance.",
        "Send questions in writing before the question deadline. The Army answers them in an amendment.",
      ],
      deliverables: [
        "A signed delivery ticket for each drop",
        "A temperature log for each delivery",
        "A 14-day rotation menu, approved by the unit",
        "A monthly invoice with the delivery tickets attached",
      ],
      technical_requirements: [
        "Hold hot food at 135 degrees F or hotter until the unit serves it.",
        "Use insulated containers that hold temperature for at least four hours.",
        "Label every container with the meal, the date, the time packed and the allergens.",
        "Take back the empty containers and the trash after each meal.",
      ],
      personnel_requirements: [
        "A rotation manager whom the unit can call at any hour.",
        "A food-handler certificate for every cook.",
        "A driver with a clean record. Base access and a background check before the first shift.",
      ],
      risks_and_gotchas: [
        "A 5:30 AM drop means a 3:30 AM start on rotation days.",
        "The schedule can change with 72 hours notice. Rotation dates move.",
        "The Army records late or cold deliveries. They count when it decides each option year.",
        "Wage rates follow the Service Contract Act wage determination. Rates can rise in an option year.",
      ],
      quick_checklist: [
        "Confirm that every cook has a food-handler certificate.",
        "Write a two-van delivery plan for both drop points.",
        "Draft the 14-day menu.",
        "Ask your questions before the question deadline.",
        "Price the quote per meal, using the wage determination.",
        "Send the quote before 5:00 PM Eastern on the due date.",
      ],
    },
    patches: [
      { kind: "hours", text: "The breakfast drop is at 5:30 AM. The dinner drop is at 5:00 PM. The Army can change the times with 72 hours notice." },
      { kind: "place", text: "Work is performed at two drop points inside Camp Mackall, North Carolina. The Army gives the grid points at award." },
      { kind: "certs", text: "The offeror shall send proof of a current food-handler certificate for every cook with the quote." },
      { kind: "bond", section: "H", heading: "Bonds", text: "No performance bond or payment bond is required for this requirement." },
      { kind: "factors", text: "Factors, in order of importance: (1) delivery plan and on-time record, (2) menu variety, (3) price. Past performance is pass or fail." },
    ],
  };
};

// ── Fort Bragg dining halls ──────────────────────────────────────────────

const fortBraggDining: Builder = (f) => {
  const bond = Math.round((f.opp.valueLow! + f.opp.valueHigh!) / 2);
  const soldiers = fromSummary(f, /about ([\d,]+) soldiers/, "1,400");
  return {
    quickSummary: `The Army wants one contractor to run two dining facilities at Fort Bragg: three meals a day, seven days a week, for about ${soldiers} soldiers. The contract is ${termText(f.years)} and is worth about ${usd(bond)} a year. It is a total small business set-aside. The winner must post a performance and payment bond equal to 100% of the annual price, about ${usd(bond)}.`,
    accordions: {
      what_the_buyer_needs: [
        "Run two on-post dining facilities. Cook and serve breakfast, lunch and dinner, seven days a week, holidays included.",
        `Feed about ${soldiers} soldiers. The Army supplies the buildings and the large equipment. The contractor supplies the food, the staff and the cleaning.`,
        "Follow the Army menu standard and the weekly menu that the dining facility manager approves.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "Set-aside: total small business. The firm must be small under the size standard when it sends the proposal.",
        "NAICS code 722310, Food Service Contractors. The size standard is $47.0 million in average annual receipts.",
        "An active SAM registration when the proposal is sent and through award.",
        `A performance bond and a payment bond. Each equals 100% of the annual price, about ${usd(bond)}. The bonds are due before performance starts. Evidence of bonding capacity comes with the proposal.`,
        "A certified food protection manager at each facility during all hours of food preparation and service.",
        "A written food-safety plan (HACCP) in the proposal.",
        "Three references on food service of $250,000 or more from the last three years.",
        "General liability insurance of $1M for each occurrence, commercial vehicle insurance, and workers' compensation.",
      ],
      risks_and_gotchas: [
        `The bond is ${usd(bond)}. A surety needs weeks to underwrite a line of that size.`,
        "The contract pays by the meal count. A low count lowers income.",
        "Wage rates follow the wage determination and can rise in each option year.",
        "The first 90 days are the hardest. The contractor hires, trains and buys food before the first invoice is paid.",
      ],
    },
    patches: [
      { kind: "hours", text: "The dining facilities serve breakfast, lunch and dinner seven days a week, including federal holidays." },
      { kind: "certs", text: "A certified food protection manager shall be present at each dining facility during all hours of food preparation and service. Proof is due within ten days of the start of performance." },
      { kind: "bond", section: "H", heading: "Performance and payment bonds", text: `The successful offeror shall give a performance bond and a payment bond. Each bond shall equal 100 percent of the annual contract price, about ${usd(bond)}. The bonds shall be in place before performance starts. Evidence of bonding capacity shall come with the proposal.` },
      { kind: "content", text: "The proposal has three volumes: a technical volume (up to 25 pages), a past performance volume with three references, and the price schedule. Send evidence of bonding capacity with the technical volume." },
      { kind: "factors", text: "Factors, in order of importance: (1) technical approach and staffing plan (40 percent), (2) past performance (30 percent), (3) price (30 percent). Past performance means three references on food service of $250,000 or more in the last three years." },
    ],
  };
};

// ── Camp Mackall restricted site ─────────────────────────────────────────

const restrictedSite: Builder = (f) => ({
  quickSummary: `The Army wants dining support at a restricted training site inside Camp Mackall. Every on-site worker must hold an active Secret clearance when the contract starts, and the government will not sponsor new clearances. No set-aside applies. The Army estimates the value at ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} over the full term.`,
  accordions: {
    what_the_buyer_needs: [
      "Dining support at a restricted training site inside Camp Mackall.",
      "Cook and serve meals on the training calendar. The Army posts the calendar 30 days ahead.",
      "Staff the site only with workers who hold an active Secret clearance.",
      `The contract is ${termText(f.years)}.`,
    ],
    eligibility_and_compliance: [
      f.opp.clearanceRequired ?? "Every on-site worker needs an active Secret clearance before day one.",
      "The government will not sponsor new clearances for this contract.",
      "No set-aside. Any qualified firm can compete.",
      "NAICS code 722310, Food Service Contractors.",
      "An active SAM registration when the proposal is sent and through award.",
      "A food-handler certificate for each person who prepares food.",
    ],
    risks_and_gotchas: [
      "A clearance takes months to get, and only a sponsor can start one.",
      "The proposal must list each proposed worker and the date of his or her clearance.",
      "Entry to a restricted site takes time. Late arrivals affect every meal.",
    ],
  },
  patches: [
    { kind: "clearance", section: "H", heading: "Security clearance", text: "Every contractor employee who works at the restricted site shall hold an active SECRET security clearance on the first day of performance. The Government will not sponsor new clearances for this contract. The proposal shall list each proposed employee and the date of his or her clearance." },
    { kind: "access", text: "The Government issues an entry badge for the restricted site after it checks each clearance. A worker without a badge cannot enter." },
    { kind: "hours", text: "Dining support follows the training calendar. The Government posts the calendar 30 days ahead." },
  ],
});

// ── Fayetteville Public Works cafe ───────────────────────────────────────

const cafe: Builder = (f) => ({
  quickSummary: `The City of Fayetteville wants one vendor to run the staff cafe at the Public Works campus, five days a week, and to cater about 20 city events a year. The contract is ${termText(f.years)}. Any qualified firm can compete. The city scores approach and experience as well as price. The city estimates the value at ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)}.`,
  accordions: {
    what_the_buyer_needs: [
      "Run the staff cafe at the Public Works campus five days a week.",
      "Cater about 20 city events a year, from small meetings to large dinners.",
      "Offer a daily menu with a hot choice, a cold choice and a healthy choice.",
      "One vendor for the cafe and the events: the city combined the two contracts.",
      `The contract is ${termText(f.years)}.`,
    ],
    eligibility_and_compliance: [
      "No set-aside. Any qualified firm can compete.",
      "An active North Carolina business registration.",
      "A City of Fayetteville vendor registration, complete before award.",
      "A food service permit from Cumberland County.",
      "Three references: customers you fed in the last three years.",
      "General liability insurance of $1M for each occurrence, commercial vehicle insurance, and workers' compensation.",
    ],
    evaluation_criteria: [
      "Best value. Approach counts 40 percent, experience 30 percent, and price 30 percent.",
      "The approach section holds a sample weekly cafe menu and a plan for staffing the events.",
      "Experience means customers you fed on a daily basis and events you catered.",
      "The city can choose a higher-priced proposal if the approach is better.",
    ],
    submission_instructions: [
      `Send the proposal by email to ${f.contact.name} at ${f.contact.email}, or through the city's portal, by 5:00 PM Eastern on the due date.`,
      "Section 1: a one-page summary. Section 2: approach and experience, up to ten pages. Section 3: three references. Section 4: the price schedule.",
      "Answer the staffing question that Addendum 1 added.",
    ],
  },
  patches: [
    { kind: "hours", text: "The cafe is open five days a week, Monday to Friday, from 6:30 AM to 2:00 PM. The city can ask for an event on any day." },
    { kind: "factors", text: "Factors and weights: approach (40 percent), experience (30 percent), price (30 percent). The city can choose a higher-priced proposal if the approach is better." },
    { kind: "ncreg", section: "1", ref: "1.9", heading: "State registration", text: "The vendor shall hold an active North Carolina business registration with the Secretary of State." },
    { kind: "staffing", section: "2", heading: "Staffing (added by Addendum 1)", text: "Describe how you staff the cafe each day and how you staff an event of 200 guests at the same time. Name the cafe manager." },
  ],
  amendment: {
    label: "Addendum 1",
    daysAgo: 4,
    summary: "Addendum 1 moved the proposal due date by one week. It also added a question on staffing: describe how you staff the cafe and an event of 200 guests on the same day. Answer it in section 2.",
  },
});

// ── Cumberland County detention meals ────────────────────────────────────

const detention: Builder = (f) => {
  const payBond = Math.round(((f.annual ?? 0) * 0.5) / 5000) * 5000;
  return {
    quickSummary: `Cumberland County wants three meals a day for about 240 people at the detention annex, cooked off site and delivered hot. This is a sealed bid: the lowest price from a qualified bidder wins. Any qualified firm can compete. The county estimates the value at ${usd(f.opp.valueLow!)} to ${usd(f.opp.valueHigh!)} a year. A 5% bid bond comes with the bid, and a performance and payment bond of half the first-year price comes after award.`,
    accordions: {
      what_the_buyer_needs: [
        "Breakfast, lunch and dinner for about 240 people at the detention center annex, every day of the year.",
        "Cook off site and deliver hot to the annex. Meals leave the kitchen at set times.",
        "Meet the state jail standards for calories. Offer medical, religious and allergen diets when the jail orders them.",
        "Count the meals with the jail staff at each delivery and sign the ticket.",
        `The contract is ${termText(f.years)}.`,
      ],
      eligibility_and_compliance: [
        "No set-aside. Any qualified firm can compete.",
        "A food-handler certificate for every cook. The county rejects a bid that leaves one out.",
        "A bid bond of 5% of the bid, sent with the bid.",
        `A payment bond of ${usd(payBond)} (half of one year's estimated price) from the winning bidder before the first delivery.`,
        "A county vendor registration, active at the time of the bid.",
        "A food service permit for the kitchen that prepares the meals.",
        "General liability insurance of $1M for each occurrence, commercial vehicle insurance, and workers' compensation.",
      ],
      evaluation_criteria: [
        "The county awards to the lowest bid from a bidder that is qualified and responsible.",
        "Price is the only scored factor. There is no technical score.",
        "A bid that leaves out a required document is rejected.",
      ],
      submission_instructions: [
        `Send the sealed bid to the county Purchasing office, or by email to ${f.contact.email}, by 5:00 PM Eastern on the due date.`,
        "The bid has one document: the signed price schedule. Add the bid bond, the food-handler certificates and proof of insurance.",
        "A pre-bid conference is optional. It is the best time to ask about delivery entry and badges.",
      ],
      risks_and_gotchas: [
        "A sealed bid is decided on price. Thin margins leave no room for waste.",
        "Entry to a secure site takes time. A late delivery starts a chain of problems.",
        "A missing certificate for one cook can end the bid.",
      ],
    },
    patches: [
      { kind: "certs", text: "The county rejects any bid that does not include a current food-handler certificate for every cook who will prepare food for this contract." },
      { kind: "bond", section: "5", heading: "Bonds", text: `Each bidder shall send a bid bond equal to 5 percent of its bid. The winning bidder shall give a payment bond of ${usd(payBond)}, half of one year's estimated price, before the first delivery.` },
      { kind: "hours", text: "Meals are delivered every day of the year: breakfast at 6:00 AM, lunch at 11:30 AM and dinner at 4:30 PM." },
      { kind: "prebid", section: "1", ref: "1.8", heading: "Pre-bid conference", text: `A pre-bid conference is on ${dateIn(f, 4)} at 10:00 AM Eastern at the county Finance building. Attendance is optional.` },
    ],
  };
};

// ── Fort Bragg sources sought ────────────────────────────────────────────

const sourcesSought: Builder = (f) => {
  const noticeFile = `${f.id}_Sources-Sought-Notice.pdf`;
  const formatFile = `${f.id}_Reply-Format.pdf`;
  return {
    quickSummary: `This is not a bid. The Army is asking small businesses whether they could run installation dining at Fort Bragg before it writes the next contract. A reply has two short parts, sent by email, with no price. The Army uses the replies to decide whether to set the next contract aside for small businesses.`,
    accordions: {
      what_the_buyer_needs: [
        "Market research: which small businesses could run installation dining at Fort Bragg.",
        "A two-part reply by email: what your firm does, and what you did for past customers.",
        "No price. A reply is not an offer, and the Army will not award a contract from it.",
      ],
      eligibility_and_compliance: [
        "No set-aside has been decided. The Army uses the replies to decide.",
        "NAICS code 722310, Food Service Contractors.",
        "Any firm can reply. A reply from a small or woman-owned firm helps the Army decide on a set-aside.",
      ],
      submission_instructions: [
        `Reply by email to ${f.contact.name} at ${f.contact.email} by 5:00 PM Eastern on the due date.`,
        "Put both parts in one PDF of up to four pages. Name the PDF with your firm name and the notice number.",
        "Do not send a price.",
      ],
      risks_and_gotchas: [
        "A missing part can count as no reply. Send both parts.",
        "The Army will not award a contract from this notice. A reply does not guarantee a place in the next one.",
      ],
      quick_checklist: [
        "Read the reply format.",
        "Check Ava's two-part draft.",
        "Send the PDF by email before 5:00 PM Eastern on the due date.",
      ],
    },
    patches: [],
    documents: [
      { kind: "custom", fileName: noticeFile, title: "Sources sought notice" },
      { kind: "custom", fileName: formatFile, title: "Reply format" },
    ],
    custom: {
      [noticeFile]: {
        title: "SOURCES SOUGHT NOTICE",
        subtitle: `${f.opp.title} · Notice ${f.id}`,
        sections: [
          { heading: "Purpose", paragraphs: [`${f.opp.agency}, ${f.opp.office}, is doing market research. It wants to know which small businesses could provide installation dining services at Fort Bragg before it writes the next contract.`, `The notice was posted on ${longDate(f.posted)}. Replies are due ${longDate(f.closes)}, 5:00 PM Eastern.`] },
          { heading: "What the Army asks", paragraphs: ["Reply with two short parts. Part 1: what your firm does, with your NAICS codes, your size and your certifications. Part 2: what you did for past customers, with a contact for each.", "Do not send a price. A reply is not an offer."] },
          { heading: "How the Army uses the replies", paragraphs: ["The Army reads the replies to decide whether to set the next contract aside for small businesses, and how large to make it.", "The Army will not award a contract from this notice."] },
        ],
      },
      [formatFile]: {
        title: "REPLY FORMAT",
        subtitle: `Notice ${f.id}`,
        sections: [
          { heading: "Part 1: your firm", paragraphs: ["Name, address, UEI and CAGE code.", "NAICS codes and size. Certifications, such as woman-owned small business.", "Three sentences on what your firm does and how many people it employs."] },
          { heading: "Part 2: past customers", paragraphs: ["List up to three past customers. For each one, give the customer, the dates, the value, what you did and a contact.", "Say if you were a prime or a subcontractor."] },
          { heading: "Send", paragraphs: [`One PDF of up to four pages, by email to ${f.contact.email}, by ${longDate(f.closes)}, 5:00 PM Eastern.`] },
        ],
      },
    },
  };
};

const CATERER_DETAILS: Record<string, Builder> = {
  [CATERER_HERO.hero]: fieldMeals,
  [CATERER_HERO.teamUp]: fortBraggDining,
  [CATERER_HERO.twin]: restrictedSite,
  "FAYNC-2026-R-08": cafe,
  "CUMCO-2026-014": detention,
  "W912EE-27-S-0004": sourcesSought,
};

/** The hand-written detail, by opportunity id. DEMO: the agency's are in src/demo/members/agency/grant/details.ts. */
export const HERO_DETAILS: Record<string, Builder> = byMember({ agency: AGENCY_DETAILS, caterer: CATERER_DETAILS });
