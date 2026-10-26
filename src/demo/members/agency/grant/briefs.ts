// THE AGENCY: Grant's written reviews of the two story opportunities that
// members/agency/grantBriefs.ts does not brief: the look-alike twin (No-bid) and
// the VA team-up (prime no-go, subcontract go). The hero's brief is in
// members/agency/grantBriefs.ts.
//
// Source: demo-storyboard/marketing-agency-pack.md (approved 19 Oct 2026).
// Rules for these words:
// - The twin is said neutrally. The work statement names one provider's own app,
//   crew and data; Grant says what that means for Dana, never why the Army wrote it.
// - No subcontracting-limit argument anywhere (13 CFR 125.6 can exclude mass-media
//   purchases, so it is not a sound No-bid reason).
// - No promise of a win.

import type { AuthoredBrief } from "@/demo/grant/encode";
import { numWord, PARTNER, shareWords, STAFF, usd } from "@/demo/grant/facts";
import { getOpportunity } from "@/demo/story/opportunities";
import { findPastPerformance, PERSONA } from "@/demo/story/persona";
import { PLACES } from "@/demo/story/places";
import { HERO_IDS } from "../opportunities";

const hero = getOpportunity(HERO_IDS.hero)!;
const twin = getOpportunity(HERO_IDS.twin)!;
const teamUp = getOpportunity(HERO_IDS.teamUp)!;

const mid = (o: typeof hero): number => Math.round((o.valueLow! + o.valueHigh!) / 2);
const TWIN_ANNUAL = mid(twin);
const TEAM_ANNUAL = mid(teamUp);
/** "six": a year of the VA campaign against her yearly revenue. */
const TIMES = numWord(Math.round(TEAM_ANNUAL / PERSONA.annualRevenue));
/** "Bluestone": the partner's short name. */
const BLUE = PARTNER.name.split(" ")[0];
const HIRES = /(\d+) hires/.exec(findPastPerformance("pp-longleaf-hiring")?.scopeDescription ?? "")?.[1] ?? "140";
const FORT_BRAGG_MILES = PLACES[twin.place].milesFromBase;

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── The twin: Family Advocacy TV and streaming ads — No-bid ────────────
  [HERO_IDS.twin]: {
    oppId: HERO_IDS.twin,
    confidence: 5,
    gist: twin.grant.oneLine,
    thesis:
      "The work statement names one provider's own streaming app, production team and viewer data. Only that provider can deliver all three, so you would be reselling a package you don't control. Spend this month on the print and digital campaign instead.",
    reads: {
      "Is it your kind of work?": {
        rating: "good",
        text: "Commercials for the Family Advocacy Program are your advertising code, and your crew makes captioned video. Here, though, the provider's own team makes the ads.",
      },
      "Does the size fit?": {
        rating: "good",
        text: `About ${usd(TWIN_ANNUAL)} a year, ${shareWords(TWIN_ANNUAL / PERSONA.annualRevenue)} and inside your range. On size alone it fits.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Fort Bragg is ${FORT_BRAGG_MILES} miles from your office, and the ads reach households around post.`,
      },
      "Can you do the work?": {
        rating: "weak",
        text: "The work statement requires streaming through one local provider's own subscriber app, commercials made by that provider's production team, and that provider's viewer data. You don't own any of the three.",
      },
      "Can you win it?": {
        rating: "weak",
        text: "Only the provider that owns that app, crew and data can meet all three. Any other firm would be reselling its package.",
      },
      "Will you make money?": {
        rating: "weak",
        text: "As a reseller you would add a markup to the provider's own price. The provider can quote the same package without one.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: "Every deliverable would come from another company: its app, its crew and its reports. Your name would be on the contract.",
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: "The Family Advocacy Program wants its messages on the screens families around post watch, with viewer numbers it can report.",
      },
      "Does this move you forward?": {
        rating: "weak",
        text: "Not much. Reselling another firm's package builds no video record of your own. The print and digital campaign does.",
      },
    },
    limits: [
      "Provider lock: the work statement requires one local provider's own subscriber app, production team and viewer data. You don't own any of them.",
      "Reselling: any other firm would pass that provider's package through with a markup, and control none of the work.",
    ],
    wouldChange: [
      `If an amendment lets other platforms and production teams qualify, an "or equal", I'd read the notice again and tell you.`,
      "If the provider asked you to produce its spots, I'd look at that as a subcontract.",
    ],
    nextMove: {
      label: "Go to the print and digital campaign",
      to: `/opportunities/${HERO_IDS.hero}`,
      rationale: "Same office, same program, and only woman-owned firms can bid. Spend this month on that quote.",
    },
    secondaryMove: { label: "Add the next step to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "Total small business set-aside", status: "have", note: "You are a small business." },
      { requirement: "Registered under NAICS 541810", status: "have", note: "Your primary code." },
      { requirement: "Streaming through the provider's own subscriber app", status: "missing", note: "You don't own it." },
      { requirement: "Commercials made by the provider's production team", status: "missing", note: "Your crew is not that team." },
      { requirement: "The provider's viewer data and dashboard", status: "missing", note: "Only the provider holds it." },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: `Am I too quick to pass on ${usd(TWIN_ANNUAL)} a year?`,
        answer: `No. Your share would be a markup on another company's package, not ${usd(TWIN_ANNUAL)} of your own work.`,
      },
      {
        challenge: "Could I team with the provider?",
        answer: "Only if it asks. The work statement names its own production team, so it does not need a producer.",
      },
      {
        challenge: "Can a buyer name one provider?",
        answer: `Yes. A buyer can ask for a platform when it needs that audience or that data. The time to ask for "or equal" is the sources sought, before the work statement is written.`,
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: twin.closesInDays - 12 },
      { label: "Quotes due", inDays: twin.closesInDays },
      { label: "Expected award", inDays: twin.closesInDays + 21 },
    ],
    railBriefing: [
      "I read the quote request and the work statement.",
      "I stopped at the streaming clause. It names one provider's own app, crew and viewer data.",
      "Ask me anything, or pick a question below. There is no bid here this cycle.",
    ],
    chips: ["Why can't I bid this?", "What should I bid instead?", "How do I get in next time?"],
    railAnswers: {
      "Why can't I bid this?":
        "The work statement requires streaming through one local provider's own subscriber app, commercials made by that provider's production team, and that provider's viewer data. You don't own any of the three, so you could only resell that provider's package.",
      "What should I bid instead?": `The print and digital campaign for the same program. Same office, only woman-owned firms can bid, about ${usd(mid(hero))} a year, and it is open for ${hero.closesInDays} days. Open it from the button on this page.`,
      "How do I get in next time?": `Watch for the next sources sought for Family Advocacy video. Reply, and ask the Army to accept "or equal" platforms and production teams. That is when a work statement can still change.`,
      "What would put me in range?": `A reply to the next sources sought for this work, asking for "or equal" platforms and production teams. Until then, the print and digital campaign is the one to bid.`,
      "Why not bid?":
        "The work statement requires streaming through one local provider's own subscriber app, commercials made by that provider's production team, and that provider's viewer data. You don't own any of the three, so you could only resell that provider's package.",
      "Where am I weak?": "Here it is not your work. It is the provider lock: the app, the crew and the viewer data belong to one company.",
      "How do I team with them?": "Only if the provider asks. Its own production team is named, so it does not need one. Spend the time on the print and digital campaign.",
      "Can I win it?": "No. You can't deliver the provider's own app, crew or viewer data, so the Army could not award it to you.",
      "Do I have enough time?": `Time is not the problem. The notice is open for ${twin.closesInDays} days, but the requirement names another company's app and crew.`,
    },
  },

  // ── The team-up: VA hiring campaign — prime no-go, subcontract go ──────
  [HERO_IDS.teamUp]: {
    oppId: HERO_IDS.teamUp,
    confidence: 3,
    gist: teamUp.grant.oneLine,
    thesis: `The work fits, but the prime seat is not yours: the VA expects to set it aside for service-disabled veteran-owned firms, and a year of it is about ${TIMES} times your revenue. Team with ${PARTNER.name} and run the Southeast video shoots.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: `Hiring campaigns are your record: ${HIRES} hires for Longleaf Home Health, with recruiting videos, paid social and a lead form. The VA's campaign is the same work at national size.`,
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usd(TEAM_ANNUAL)} a year. That is about ${TIMES} times your revenue. As a subcontractor you take a share sized for your team.`,
      },
      "Can you perform there?": {
        rating: "good",
        text: "The shoots are at VA medical centers across the Southeast, including Fayetteville, Durham and Salisbury. Your crew can reach most of the NC, VA and SC sites in a day.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: `A national campaign needs strategy, a national media buy, a hiring website and shoots in many states. Your ${STAFF}-person team can run the Southeast shoots, not the whole program.`,
      },
      "Can you win it?": {
        rating: "weak",
        text: `As a prime you can't compete: the VA expects only service-disabled veteran-owned firms to be eligible. As a subcontractor you share in the work if ${BLUE} wins.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: "A subcontract pays for your crew's shoot and edit days, not the media buy. The margin is in that work, and you carry none of the national media cost.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: `No bond. ${BLUE} pays you after the VA pays it, often 30 days later, so price for a longer wait.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The VA wants doctors, nurses and staff to apply when the current contract ends in September 2027. Local stories filmed at each center are part of the work it describes.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A VA subcontract adds a second federal buyer and a national program to your record. It is the step toward priming VA work in your region.",
      },
    },
    limits: [
      "Set-aside: the VA expects to set the follow-on aside for service-disabled veteran-owned firms. You can't hold the prime contract.",
      `Size: about ${usd(TEAM_ANNUAL)} a year, about ${TIMES} times your revenue.`,
      `Teaming: nothing is signed with ${PARTNER.name} yet. A teaming agreement sets your share before the RFP.`,
    ],
    wouldChange: [
      "If the VA opens the follow-on to all small businesses, I'd check it again, but the size still points to a subcontract.",
      `If ${BLUE} does not reply, I'd look for another veteran-owned prime on Partners.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${BLUE} wants a woman-owned video crew for VA medical center shoots in NC, VA and SC. Reply to ${PARTNER.contact} this week and ask for a teaming agreement before the RFP.`,
    },
    secondaryMove: { label: "Send to Diana for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${teamUp.naics}`, status: "have", note: "One of your codes." },
      { requirement: "Service-disabled veteran-owned small business (SDVOSB), expected", status: "missing", note: "You are woman-owned, not veteran-owned." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Recruitment campaign record", status: "have", note: `Longleaf Home Health: ${HIRES} hires.` },
      { requirement: "Teaming agreement with a veteran-owned prime", status: "partial", note: `${BLUE} asked for a woman-owned crew. Nothing is signed yet.` },
    ],
    redTeam: [
      {
        challenge: "Could I lead it with a veteran-owned partner?",
        answer: `Not as the lead. The veteran-owned firm has to lead, and a year of this is about ${TIMES} times your revenue.`,
      },
      {
        challenge: "Is a subcontract worth it?",
        answer: "Yes. A national VA program on your record is worth more than the margin. It is what lets you prime VA work in your region later.",
      },
      {
        challenge: `Does ${BLUE} need me?`,
        answer: "It says it does: it wants a woman-owned crew for shoots in NC, VA and SC. Your hiring videos for Longleaf Home Health are the proof to send.",
      },
    ],
    keyDates: [{ label: "Replies due", inDays: teamUp.closesInDays }],
    railBriefing: [
      "I read the sources sought notice and the work it describes.",
      "You can do part of this work, but not as prime. The set-aside and the size decide it.",
      "I have a question for you, or pick one below.",
    ],
    chips: ["Why not as prime?", "Who could I team with?", { label: `Tell Grant about ${BLUE}`, kind: "elicit", target: "talked-to-partner" }],
    railAnswers: {
      "Why not as prime?": `Two reasons. The VA expects to set the follow-on aside for service-disabled veteran-owned firms, and you are woman-owned. And a year of it is about ${usd(TEAM_ANNUAL)}, about ${TIMES} times your revenue.`,
      "Who could I team with?": `${PARTNER.name}, a service-disabled veteran-owned firm in ${PARTNER.city}. It runs ${PARTNER.holds.charAt(0).toLowerCase()}${PARTNER.holds.slice(1)}, and it wants a woman-owned video crew for VA medical center shoots in NC, VA and SC. ${PARTNER.contact}, its ${PARTNER.contactTitle.toLowerCase()}, is your contact.`,
      "How do I team with them?": `Open Partners and reply to ${PARTNER.contact}. Send your hiring videos for Longleaf Home Health and ask for a teaming agreement that names your share: the Southeast shoots and edits.`,
      "What should my reply say?": `You don't need to reply to the VA: the notice asks who could run the whole campaign, and ${BLUE} replies. Send ${BLUE} a one-page note instead: your woman-owned certification, your 2-person video crew, the Longleaf hiring campaign and the NC Guard recruiting videos.`,
      "What should my response say?": `You don't need to reply to the VA: the notice asks who could run the whole campaign, and ${BLUE} replies. Send ${BLUE} a one-page note instead: your woman-owned certification, your 2-person video crew, the Longleaf hiring campaign and the NC Guard recruiting videos.`,
      "Can I win it?": `No one can promise that. As a prime, no: the set-aside rules you out. As a subcontractor, you share in the work if ${BLUE} wins it.`,
      "Do I have enough time?": `Yes. Replies are due in ${teamUp.closesInDays} days, and the contract itself comes later. Reply to ${PARTNER.contact} this week so your name is in ${BLUE}'s reply.`,
      "Where am I weak?": `Size and federal record. A year of this is about ${TIMES} times your revenue, and your only federal prime is the NC Guard campaign. A subcontract with ${BLUE} builds both.`,
      "Is this a bid?": "No. A sources sought asks which firms could do the work. There is no price and no award. The bid comes later, as a request for proposals.",
    },
  },
};
