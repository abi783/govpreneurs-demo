// DEMO: Grant's written reviews for the three hero opportunities that the story
// does not brief: Fort Bragg dining (bid as a subcontractor), the Camp Mackall
// restricted site (no-bid), and the Fort Bragg sources sought (reply).
//
// They have the same shape as the story's briefs (story/grantBriefs.ts) and go
// through the same encoder. Every fact comes from the story: the persona, the
// key partner, the places and the opportunity record. Production's fixtures for
// the first two were about a roofing firm, and Karthik's catering versions used an
// older shape and a different set-aside, so these are rewritten to agree with the
// story exactly.

import { HERO_IDS, getOpportunity } from "@/demo/story/opportunities";
import { PERSONA } from "@/demo/story/persona";
import { PLACES } from "@/demo/story/places";
import type { AuthoredBrief } from "./encode";
import { CERTIFIED, COOKS, customerShort, PARTNER, PP, shareWords, usd } from "./facts";

const dining = getOpportunity(HERO_IDS.fortBraggDining)!;
const mackall = getOpportunity(HERO_IDS.classifiedSite)!;
const fieldMeals = getOpportunity(HERO_IDS.fieldMeals)!;
const sought = getOpportunity("W912EE-27-S-0004")!;

/** Yearly value of Fort Bragg dining: the buyer states it per year. */
const DINING_ANNUAL = Math.round((dining.valueLow! + dining.valueHigh!) / 2);
const BOND = DINING_ANNUAL; // 100% of the annual price
const SOLDIERS = /about ([\d,]+) soldiers/.exec(dining.summary)?.[1] ?? "1,400";
const CDG_YEAR = PP.cdg.periodStart.slice(0, 4);
const HELD_SINCE = /since (\d{4})/.exec(PARTNER.holds)?.[1] ?? "2019";
/** Past jobs worth $250,000 or more: the size the Army asks references for. */
const BIG_JOBS = [PP.county, PP.cdg, PP.church, PP.womack].filter((p) => p.totalValue >= 250_000).length;
const MACKALL_ANNUAL = Math.round((mackall.valueLow! + mackall.valueHigh!) / 2 / 3);
const MACKALL_SHARE = MACKALL_ANNUAL / PERSONA.annualRevenue;

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── Fort Bragg dining: bid as a subcontractor ────────────────────────
  [HERO_IDS.fortBraggDining]: {
    oppId: HERO_IDS.fortBraggDining,
    confidence: 3,
    gist: dining.grant.oneLine,
    thesis: `The work is yours, but the bond is not. Bid as a subcontractor under the firm that holds the contract.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: `Daily meal service at two on-post dining facilities is the work you did in ${CDG_YEAR} as ${PARTNER.name}'s subcontractor.`,
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usd(DINING_ANNUAL)} a year. That is ${shareWords(DINING_ANNUAL / PERSONA.annualRevenue)}. The bond alone is ${usd(BOND)}.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Fort Bragg is ${PLACES[dining.place].milesFromKitchen} miles from your kitchen, and you have already worked in two of its dining facilities.`,
      },
      "Can you do the work?": {
        rating: "watch",
        text: `Three meals a day, seven days a week, for about ${SOLDIERS} soldiers needs a crew many times the size of your ${COOKS}-person kitchen. As a subcontractor you cover a share, as you did in ${CDG_YEAR}.`,
      },
      "Can you win it?": {
        rating: "weak",
        text: `${PARTNER.name} has held this work since ${HELD_SINCE}, and the Army exercised all four options. As a prime you would need a clearly better price or record. As a subcontractor you ride the winning prime.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: `As a prime, the bond and the first 90 days of payroll eat the margin. As a subcontractor you earn less per meal, but you carry no bond and little cash risk.`,
      },
      "Can you survive winning?": {
        rating: "weak",
        text: `The bond is 100% of the annual price: ${usd(BOND)}. Your largest bond is ${usd(PERSONA.largestBond)}. A surety needs weeks to approve a line ten times larger, and the notice closes in ${dining.closesInDays} days.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: `The Army wants no gap in service. It exercised all four option years, so it values a steady record over a new name.`,
      },
      "Does this move you forward?": {
        rating: "strong",
        text: `A second year at Fort Bragg dining, with the prime that holds the contract, builds the federal record that lets you prime a smaller contract next.`,
      },
    },
    limits: [
      `Bond: the notice asks for a performance and payment bond of 100% of the annual price, ${usd(BOND)}. Your largest bond is ${usd(PERSONA.largestBond)}.`,
      `Cash: as a prime you would pay wages and food for the first 90 days before the first invoice is paid.`,
      `Record: the Army asks for three references on food service of $250,000 or more. You have ${BIG_JOBS}: your ${CDG_YEAR} subcontract.`,
    ],
    wouldChange: [
      `If a surety approves a ${usd(BOND)} line before the due date, I'd re-check the prime path. That is unlikely in ${dining.closesInDays} days.`,
      `If ${PARTNER.name} does not bid, I'd move this to Needs review, because you would need another prime.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${PARTNER.name} is looking for woman-owned subcontractors. Ask ${PARTNER.contact} for the sub quote deadline. A prime needs your quote about a week before the due date.`,
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active until April 2027." },
      { requirement: "Small business under NAICS 722310", status: "have", note: `Your yearly revenue is ${usd(PERSONA.annualRevenue)}. The size standard is $47.0M.` },
      { requirement: "Total small business set-aside", status: "have", note: "You are a small business." },
      { requirement: `Performance and payment bond, 100% of the annual price (${usd(BOND)})`, status: "missing", note: `Your largest bond is ${usd(PERSONA.largestBond)}.` },
      { requirement: "Certified food protection manager on every shift", status: "partial", note: `${CERTIFIED} of ${COOKS} staff hold a food-handler certificate.` },
      { requirement: "Written food-safety plan (HACCP)", status: "have", note: `Used on the ${PARTNER.name} subcontract.` },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
      { requirement: "Three references on food service of $250K or more", status: "partial", note: `${BIG_JOBS} of 3 at that size.` },
    ],
    redTeam: [
      {
        challenge: "Is the current contractor really out of reach?",
        answer: `As a prime, almost. The Army exercised 4 of 4 options, which means it is satisfied. You would need a clearly better price or record, and you have neither today.`,
      },
      {
        challenge: "Is subcontracting worth the thin margin?",
        answer: `Yes. The federal record is worth more than this contract's margin. It is what lets you prime next time.`,
      },
      {
        challenge: `Could the ${usd(BOND)} bond come together in time?`,
        answer: `No. A surety needs weeks of underwriting and financial statements. Your largest bond is ${usd(PERSONA.largestBond)}.`,
      },
      {
        challenge: `Does a kitchen of ${COOKS} cover two dining facilities?`,
        answer: `Not as prime. As a subcontractor on weekends and holidays, as in ${CDG_YEAR}, it fits your crew.`,
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: dining.closesInDays - 11 },
      { label: "Proposals due", inDays: dining.closesInDays },
      { label: "Expected award", inDays: dining.closesInDays + 32 },
    ],
    railBriefing: [
      "I read the request for proposal, the work statement and the price form.",
      "You can do this work, but not as prime. The bond decides it.",
      "Ask me anything, or pick a question below.",
    ],
    chips: [
      "Why not as prime?",
      { label: "Tell Grant about the prime", kind: "elicit", target: "talked-to-partner" },
      { label: `Find ${PARTNER.name}`, kind: "route", target: "/partners" },
    ],
    railAnswers: {
      "Why not as prime?": `The notice asks for a performance and payment bond equal to 100% of the annual price. That is ${usd(BOND)}. Your largest bond is ${usd(PERSONA.largestBond)}. A surety needs weeks to approve a line ten times larger, and the notice closes in ${dining.closesInDays} days.`,
      "Who is the incumbent?": `${PARTNER.name}. It has held this work since ${HELD_SINCE}, and the Army exercised all four option years. You worked for it as a 30% subcontractor in ${CDG_YEAR}, so ${PARTNER.contact} knows your work.`,
      "How do I team with them?": `Open Partners. ${PARTNER.name} is looking for woman-owned catering subcontractors. Ask ${PARTNER.contact} for the sub quote deadline. A prime usually needs your quote about a week before the due date.`,
      "Can I win it?": `No one can promise that. As a prime, almost certainly not: the bond blocks it and the holder has a four-year record. As a subcontractor, you would share in a win if ${PARTNER.name} wins.`,
      "Do I have enough time?": `As a subcontractor, yes. ${dining.closesInDays} days is enough if you call ${PARTNER.contact} this week. As a prime, no: the bond takes longer than that.`,
      "Where am I weak?": `Size and record. The contract is ${shareWords(DINING_ANNUAL / PERSONA.annualRevenue)}, and you have ${BIG_JOBS} past job at the size the Army asks for. A subcontract fixes both over time.`,
      "What should my response say?": `As a subcontractor you do not send a proposal. The prime does. You send the prime a short sub quote and your ${CDG_YEAR} record: weekend and holiday meals at two on-post facilities, with full HACCP records.`,
    },
  },

  // ── Camp Mackall restricted site: no-bid ─────────────────────────────
  [HERO_IDS.classifiedSite]: {
    oppId: HERO_IDS.classifiedSite,
    confidence: 5,
    gist: mackall.grant.oneLine,
    thesis: `This contract is closed to you today. Every worker needs a Secret clearance on day one, and the Army will not sponsor one. Put your time into Camp Mackall field meals instead.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: `Dining support is your food-service code, ${mackall.naics}. The work would suit your kitchen.`,
      },
      "Does the size fit?": {
        rating: "watch",
        text: `The Army estimates $1.8M to $2.6M over the term. That is about ${usd(MACKALL_ANNUAL)} a year, ${shareWords(MACKALL_SHARE)}.`,
      },
      "Can you perform there?": {
        rating: "good",
        text: `Camp Mackall is ${PLACES[mackall.place].milesFromKitchen} miles from your kitchen. Entry to a restricted site adds time to every shift.`,
      },
      "Can you do the work?": {
        rating: "weak",
        text: `Every on-site worker needs an active Secret clearance on day one. None of your ${COOKS} staff holds one.`,
      },
      "Can you win it?": {
        rating: "weak",
        text: `The clearance rule limits the field to firms that already have cleared staff. You are not one of them.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: `Cleared workers cost more than uncleared workers. Hiring them would raise your labor cost before you earn a dollar.`,
      },
      "Can you survive winning?": {
        rating: "weak",
        text: `You could not start on day one, so a win would turn into a default.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: `The Army wants dining support inside a secured site without escorting uncleared workers.`,
      },
      "Does this move you forward?": {
        rating: "weak",
        text: `Not this year. A clearance takes months, and Camp Mackall field meals build the same record without one.`,
      },
    },
    limits: [
      `Clearance: every on-site worker needs an active Secret clearance on day one. None of your ${COOKS} staff holds one.`,
      `Sponsorship: the Army will not sponsor new clearances for this contract, so you cannot get cleared inside the bid window.`,
      `Size: the yearly value is ${shareWords(MACKALL_SHARE)}, which is a lot to add to a five-person kitchen.`,
    ],
    wouldChange: [
      `If the Army removed the clearance rule in an amendment, I'd read the notice again and tell you.`,
      `If a prime with cleared staff asked you to join its team, I'd check the clearance rule for subcontractors first.`,
    ],
    nextMove: {
      label: "Go to Camp Mackall field meals",
      to: `/opportunities/${HERO_IDS.fieldMeals}`,
      rationale: `It is the same base. It needs no clearance, and only woman-owned firms can bid. Spend this month on that quote.`,
    },
    secondaryMove: { label: "Add the clearance gap to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active until April 2027." },
      { requirement: `Registered under NAICS ${mackall.naics}`, status: "have", note: "Your primary code." },
      { requirement: "Active Secret clearance for every on-site worker", status: "missing", note: `None of your ${COOKS} staff holds one.` },
      { requirement: "Food-handler certificate for every cook", status: "partial", note: `${CERTIFIED} of ${COOKS} cooks certified.` },
      { requirement: "Written food-safety plan (HACCP)", status: "have", note: `Used on the ${PARTNER.name} subcontract.` },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: "Am I too harsh on the clearance?",
        answer: `No. The notice says every on-site worker needs an active Secret clearance on day one, and the Army will not sponsor new ones. There is no way to rush that.`,
      },
      {
        challenge: "Could you sub for a firm that has cleared staff?",
        answer: `No. The rule covers every on-site worker, not only the prime. A subcontractor's cooks would need the clearance too.`,
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: mackall.closesInDays - 20 },
      { label: "Proposals due", inDays: mackall.closesInDays },
      { label: "Expected award", inDays: mackall.closesInDays + 30 },
    ],
    railBriefing: [
      "I read the request for proposal and the security clause.",
      "I stopped at the clearance. Every on-site worker needs a Secret clearance on day one.",
      "Ask me anything, or pick a question below. There is no bid here this cycle.",
    ],
    chips: ["Why can't I get cleared in time?", "What would put me in range?", "What should I bid instead?"],
    railAnswers: {
      "Why can't I get cleared in time?": `A Secret clearance needs a sponsor, and the Army will not sponsor one for this contract. Even with a sponsor, an investigation takes months. The notice closes in ${mackall.closesInDays} days.`,
      "What would put me in range?": `Three things, in order: work at Camp Mackall, starting with the field meals quote, so the Army knows your name; a cleared teaming partner or a prime who can sponsor cooks; and a Hunter search that alerts you when a cleared-site dining notice comes out.`,
      "What should I bid instead?": `Camp Mackall field meals. It is the same base, it needs no clearance, only woman-owned firms can bid, and it is open for ${fieldMeals.closesInDays} days. Open it from the button on this page.`,
      "Can I win it?": `No. You cannot meet the clearance rule on day one, so the Army could not award it to you.`,
      "Do I have enough time?": `Time is not the problem. The notice is open for ${mackall.closesInDays} days, but a clearance takes months.`,
    },
  },

  // ── Fort Bragg sources sought: reply ─────────────────────────────────
  "W912EE-27-S-0004": {
    oppId: "W912EE-27-S-0004",
    confidence: 4,
    gist: sought.grant.oneLine,
    thesis: `This is not a bid. It is a short reply that puts you on the Army's list before the next contract is written. A woman-owned reply can push the Army to set that contract aside.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: `Installation dining is the work you did at Fort Bragg as a subcontractor in ${CDG_YEAR}.`,
      },
      "Does the size fit?": {
        rating: "watch",
        text: `The notice states no value. Fort Bragg dining runs about ${usd(DINING_ANNUAL)} a year, above your range, so say in your reply that you could take part of the work or team with a prime.`,
      },
      "Can you do the work?": {
        rating: "good",
        text: `The notice asks what you did before. You have the ${CDG_YEAR} subcontract, the county school meals and ${customerShort(PP.womack)}.`,
      },
      "Can you win it?": {
        rating: "good",
        text: `Nothing is awarded from this notice. A reply keeps you in the field for the contract that follows.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: `The Army is deciding how to write the next contract: set aside or open. Each small business that replies is evidence for a set-aside.`,
      },
      "Does this move you forward?": {
        rating: "strong",
        text: `A reply puts your name in front of the buying office before any bid is written. It costs you an hour and no money.`,
      },
    },
    limits: [
      `Format: the Army asks for two short parts by email. A missing part can count as no reply.`,
      `Size: the reply should say plainly that you could do part of a program of about ${usd(DINING_ANNUAL)} a year, or team with a prime.`,
    ],
    wouldChange: [`If the Army adds a request for price, I'd tell you, because this notice says there is none.`],
    nextMove: {
      label: "Read the reply Ava drafted",
      to: "/ava/W912EE-27-S-0004",
      rationale: `Ava finished both parts. Read them, then send them by email. The reply is due in ${sought.closesInDays} days.`,
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active until April 2027." },
      { requirement: "Woman-owned small business (WOSB) certification", status: "have", note: "Certified in SBA's MySBA Certifications." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Two-part reply, sent by email", status: "partial", note: "Drafted by Ava. Not sent yet." },
    ],
    redTeam: [
      {
        challenge: "Does a reply commit me to anything?",
        answer: `No. A sources-sought reply is not an offer. It binds you to nothing, and the Army cannot award from it.`,
      },
      {
        challenge: "Could a reply hurt me?",
        answer: `No. The Army uses replies to choose how to write the contract. A reply from a woman-owned firm is evidence for a set-aside.`,
      },
    ],
    keyDates: [{ label: "Replies due", inDays: sought.closesInDays }],
    railBriefing: [
      "I read the sources sought notice and the two questions it asks.",
      "This is not a bid. A short reply is the right move.",
      "Ask me anything, or pick a question below.",
    ],
    chips: [
      "Is this a bid?",
      "What should my reply say?",
      { label: "Open the reply with Ava", kind: "route", target: "/ava/W912EE-27-S-0004" },
    ],
    railAnswers: {
      "Is this a bid?": `No. A sources-sought notice asks which firms could do the work. There is no price, no award, and no promise either way. A reply costs you about an hour.`,
      "What should my reply say?": `Two parts. First: what your firm does, in three sentences, with your NAICS codes and your woman-owned certification. Second: what you did for past customers, led by the ${CDG_YEAR} Fort Bragg subcontract. Ava has drafted both.`,
      "Can I win it?": `Nothing is awarded here. The reply puts you on the list for the contract that follows.`,
      "Do I have enough time?": `Yes. The reply is due in ${sought.closesInDays} days, and Ava has already drafted it.`,
      "Where am I weak?": `Size. Fort Bragg dining runs about ${usd(DINING_ANNUAL)} a year. Say in your reply that you could take part of it or team with a prime.`,
    },
  },
};
