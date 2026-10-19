// THE CONSULTANT: Grant's written reviews of the two story opportunities that
// members/consulting/grantBriefs.ts does not brief: the look-alike twin (No-bid)
// and the Army training team-up (prime no-go, subcontract go). The hero's brief
// is in members/consulting/grantBriefs.ts.
//
// Source: demo-storyboard/consulting-pack.md, sections 4 and 5.
// Rules for these words:
// - The twin is said plainly: only GSA schedule holders can quote, and she has no
//   schedule. Grant never says why the Army orders this way.
// - A 1099 facilitator "may count" as a subcontractor (13 CFR 121.106 decides);
//   Grant never says it "counts".
// - No promise of a win.

import type { AuthoredBrief } from "@/demo/grant/encode";
import { PARTNER, usd } from "@/demo/grant/facts";
import { getOpportunity } from "@/demo/story/opportunities";
import { PLACES } from "@/demo/story/places";
import { HERO_IDS } from "../opportunities";
import { PERSONA } from "../persona";

const hero = getOpportunity(HERO_IDS.hero)!;
const twin = getOpportunity(HERO_IDS.twin)!;
const teamUp = getOpportunity(HERO_IDS.teamUp)!;

const mid = (o: typeof twin): number => Math.round((o.valueLow! + o.valueHigh!) / 2);
const TWIN_YEAR = mid(twin);
const TEAM_YEAR = mid(teamUp);
const YEARS = PERSONA.yearsInBusiness;
const FORT_BRAGG_MILES = PLACES[twin.place].milesFromBase;
/** "Halyard Point": the partner's short name. */
const HP = PARTNER.name.split(" ").slice(0, 2).join(" ");

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── The twin: manpower analysts, GSA schedule holders only — No-bid ────
  [HERO_IDS.twin]: {
    oppId: HERO_IDS.twin,
    confidence: 5,
    gist: twin.grant.oneLine,
    thesis:
      "Only holders of a GSA schedule under SIN 541611 can quote, and you aren't one. A schedule offer takes months, not 16 days. Spend the hours on the VA program, and start the schedule offer now.",
    reads: {
      "Is it your kind of work?": {
        rating: "good",
        text: "Manpower studies are your consulting code and the kind of work you did as a deputy G-1. Here, though, only schedule holders can quote.",
      },
      "Does the size fit?": {
        rating: "watch",
        text: `About ${usd(TWIN_YEAR)} a year for five years, a third of your revenue each year in full-time analysts.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Fort Bragg is ${FORT_BRAGG_MILES} miles from your office, and you just delivered the ACS job there.`,
      },
      "Can you do the work?": {
        rating: "good",
        text: "Your firm could do the studies. What stops you is who can quote, not the work.",
      },
      "Can you win it?": {
        rating: "weak",
        text: "The request goes through GSA eBuy to schedule holders under SIN 541611. You have no GSA schedule, so you can't send a quote.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "Not this time. Schedule holders price from their own ceiling rates, and you have none on file.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: "Full-time analysts for five years means hiring before the first day. That is a staffing plan your firm doesn't have yet.",
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: "MICC Fort Bragg buys most of its competed small-business consulting as GSA schedule orders, so holders get the orders. The way in is a schedule of your own.",
      },
      "Does this move you forward?": {
        rating: "watch",
        text: "Not as a quote. Starting the schedule offer now is what opens the next order like this one.",
      },
    },
    limits: [
      "Schedule only: the request goes through GSA eBuy to holders of a GSA schedule under SIN 541611. You aren't one.",
      "Time: a schedule offer takes months of review. The quote is due in 16 days.",
    ],
    wouldChange: [
      "If the Army reposts this outside eBuy, open to veteran-owned firms, I'd read it again.",
      "If a schedule holder asks you to staff part of the work, I'd look at that as a subcontract.",
    ],
    nextMove: {
      label: "Open the VA supervisor program",
      to: `/opportunities/${HERO_IDS.hero}`,
      rationale: `It is your work, your set-aside and your town, and it is due in ${hero.closesInDays} days. Put these hours there.`,
    },
    secondaryMove: { label: "Add the schedule offer to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "SBA VetCert service-disabled veteran-owned certification", status: "have", note: "Certified 14 Jan 2024." },
      { requirement: `Registered under NAICS ${twin.naics}`, status: "have", note: "Your primary code." },
      { requirement: "GSA schedule holder under SIN 541611", status: "missing", note: "You have no GSA schedule." },
    ],
    redTeam: [
      {
        challenge: `Am I too quick to pass on ${usd(TWIN_YEAR)} a year at an office I know?`,
        answer: "No. You can't send a quote, so there is nothing to pass on. The office knowing you helps on the next order, not this one.",
      },
      {
        challenge: "Could I get a schedule in time?",
        answer: "No. A schedule offer takes months of review. Start it now for the next order.",
      },
      {
        challenge: "Am I ready to offer for a schedule?",
        answer: `Yes. With ${YEARS} years in business you meet GSA's two-year rule. You need two years of financials and three references, and your ACS job is one.`,
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: twin.closesInDays - 8 },
      { label: "Quotes due", inDays: twin.closesInDays },
    ],
    railBriefing: [
      "I read the request for quote and the performance work statement.",
      "I stopped at the clause on who can quote. Only GSA schedule holders can.",
      "Ask me anything, or pick a question below. There is no quote here for you this time.",
    ],
    chips: ["Why can't I bid this?", "How do I get a GSA schedule?", "What should I bid instead?"],
    railAnswers: {
      "Why can't I bid this?":
        "The Army sends this request through GSA eBuy to holders of a GSA schedule under SIN 541611, and you aren't one. A schedule offer takes months, and the quote is due in 16 days.",
      "How do I get a GSA schedule?":
        `Send an offer to GSA under the Professional Services and Human Capital categories. With ${YEARS} years in business you meet the two-year rule. You need two years of financials and three references, and GSA's review takes a few months. Start it now; Sarah can show you where.`,
      "What should I bid instead?":
        `The ${hero.plainTitle}. It is your work, your set-aside and 3 miles from your office, and it is due in ${hero.closesInDays} days.`,
      "Why not bid?":
        "Only GSA schedule holders under SIN 541611 can quote, and you aren't one. A schedule offer takes months, not 16 days.",
      "Where am I weak?": "Here it is not your work. It is who can quote: only GSA schedule holders.",
      "Can I win it?": "No. You can't send a quote, because only GSA schedule holders can.",
      "Do I have enough time?": "Time is not the problem. The quote is open for 16 days, but only schedule holders can send one, and a schedule takes months.",
    },
  },

  // ── The team-up: Army family readiness staff training — prime no-go, subcontract go ──
  [HERO_IDS.teamUp]: {
    oppId: HERO_IDS.teamUp,
    confidence: 3,
    gist: teamUp.grant.oneLine,
    thesis: `The work fits, but the prime seat is not yours: only holders of the Army's HR Solutions contract can compete for the order, and it is about ${usd(TEAM_YEAR)} a year. Team with ${PARTNER.name} and teach the in-person classes near Fort Bragg.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: `It is the training you taught as ${HP}'s subcontractor from 2023 to 2025: classes for family readiness staff.`,
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usd(TEAM_YEAR)} a year for five years, most of your yearly revenue each year. As a sub you'd take the in-person classes in NC, SC and VA.`,
      },
      "Can you perform there?": {
        rating: "good",
        text: "The classes run at installations across the Southeast and online. Fort Bragg and the NC, SC and VA sites are inside your area.",
      },
      "Can you do the work?": {
        rating: "strong",
        text: "Your facilitators know the curriculum and the audience. In-person classes near Fort Bragg are the part you can carry.",
      },
      "Can you win it?": {
        rating: "weak",
        text: `As a prime you can't compete: only holders of the Army's HR Solutions contract can. As ${HP}'s subcontractor you share in the work if it wins.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: "A subcontract pays for your classes. Price your facilitators from real hours, and agree on travel for each class day.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: `Your share is in-person classes, a size your firm runs today. Agree on it in writing, and price for being paid after ${HP} is paid.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The Army wants trained family readiness staff at every installation, without a gap between orders. A team that already taught the course fits that.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A second Army training subcontract keeps you in this work while you build toward a contract of your own.",
      },
    },
    limits: [
      "Contract holders only: the order goes on the Army's HR Solutions contract, and you don't hold it. You can't compete as prime.",
      `Size: about ${usd(TEAM_YEAR)} a year for five years, most of your yearly revenue each year.`,
      `Teaming: nothing is signed with ${PARTNER.name} yet. A teaming agreement sets your share before the order is quoted.`,
    ],
    wouldChange: [
      "If the Army opens the order to firms off the HR Solutions contract, I'd check it again, but the size still points to a subcontract.",
      `If ${HP} does not reply, I'd look for another HR Solutions holder on Partners.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${HP} wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. Reply to ${PARTNER.contact} this week and ask for a teaming agreement before the order is quoted.`,
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${teamUp.naics}`, status: "have", note: "One of your codes." },
      { requirement: "Holder of the Army's HR Solutions (PLS) contract", status: "missing", note: "You don't hold it." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Similar work, with a contact for each", status: "have", note: `Your ${HP} classes and your Fort Bragg ACS job.` },
      { requirement: "Teaming agreement with a contract holder", status: "partial", note: `${HP} wants a trainer near Fort Bragg. Nothing is signed yet.` },
    ],
    redTeam: [
      {
        challenge: "Could I prime it with a partner?",
        answer: "No. Only holders of the HR Solutions contract can compete, and the order is most of your yearly revenue each year.",
      },
      {
        challenge: `Does ${HP} need me?`,
        answer: `It says it does: it wants a veteran-owned trainer near Fort Bragg for in-person classes in NC, SC and VA. Your classes for it from 2023 to 2025 are the proof.`,
      },
      {
        challenge: "Is a subcontract worth it again?",
        answer: "Yes. It keeps you in Army training work and adds a second record with the same buyer while you build toward a schedule of your own.",
      },
    ],
    keyDates: [{ label: "Replies due", inDays: teamUp.closesInDays }],
    railBriefing: [
      "I read the sources sought notice and the draft work statement.",
      "You can teach part of this work, but not as prime. The contract and the size decide it.",
      "I have a question for you, or pick one below.",
    ],
    chips: ["Why not as prime?", "Who could I team with?", { label: `Tell Grant about ${HP}`, kind: "elicit", target: "talked-to-partner" }],
    railAnswers: {
      "Why not as prime?": `Two reasons. Only holders of the Army's HR Solutions contract can compete for the order, and you don't hold it. And at about ${usd(TEAM_YEAR)} a year, it is most of your yearly revenue each year.`,
      "Who could I team with?": `${PARTNER.name}, a service-disabled veteran-owned firm in ${PARTNER.city}. It holds the HR Solutions contract and taught this training with you before. ${PARTNER.contact}, its ${PARTNER.contactTitle.toLowerCase()}, is your contact.`,
      "How do I team with them?": `Open Partners and reply to ${PARTNER.contact}. Send your record from the ${HP} classes and your Fort Bragg ACS job, and ask for a teaming agreement that names the in-person classes you'd teach.`,
      "What should my reply say?": `You don't need to reply to the Army alone: ${HP} replies as the prime and names you as its partner. Send ${HP} a one-page note: your veteran-owned certification, your facilitators near Fort Bragg and the classes you taught for it.`,
      "What should my response say?": `You don't need to reply to the Army alone: ${HP} replies as the prime and names you as its partner. Send ${HP} a one-page note: your veteran-owned certification, your facilitators near Fort Bragg and the classes you taught for it.`,
      "Can I win it?": `No one can promise that. As a prime, no: only HR Solutions holders can compete. As a subcontractor, you share in the work if ${HP} wins it.`,
      "Do I have enough time?": `Yes. Replies are due in ${teamUp.closesInDays} days, and the order comes later. Reply to ${PARTNER.contact} this week so your name is in ${HP}'s reply.`,
      "Where am I weak?": `The contract and the size. You don't hold HR Solutions, and the order is most of your yearly revenue each year. A teaming agreement with ${HP} settles both.`,
      "Is this a bid?": "No. A sources sought asks which firms could do the work. There is no price and no award. The order comes later.",
    },
  },
};
