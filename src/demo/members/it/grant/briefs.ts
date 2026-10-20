// THE IT SERVICES FIRM: Grant's written reviews of the two story opportunities
// that members/it/grantBriefs.ts does not brief: the look-alike twin (No-bid) and
// the hospital IT team-up (prime no-go, subcontract go). The hero's brief is in
// members/it/grantBriefs.ts.
//
// Source: demo-storyboard/it-services-pack.md, sections 4 and 5.
// Rules for these words:
// - The twin is said plainly: only ITES-3S holders can quote, and ITES-3S takes
//   no new firms. Grant never says why the Army runs its work that way.
// - The hospital is "Fort Bragg's Army medical center", never by name.
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
const TWIN_MID = mid(twin);
const TEAM_MID = mid(teamUp);
/** "Brackwater": the partner's short name. */
const BLUE = PARTNER.name.split(" ")[0];
const BRAGG_MILES = PLACES[twin.place].milesFromBase;
/** "1.6": a year of the hospital order against his yearly revenue. */
const TEAM_TIMES = (TEAM_MID / PERSONA.annualRevenue).toFixed(1);

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── The twin: Army Reserve SharePoint support, ITES-3S holders only — No-bid ──
  [HERO_IDS.twin]: {
    oppId: HERO_IDS.twin,
    confidence: 5,
    gist: twin.grant.oneLine,
    thesis:
      "Only holders of the Army's ITES-3S contract can quote, and you are not one. ITES-3S takes no new firms, so nothing you send changes that. Spend the time on the help desk quote, and start on a team for ITES-4S.",
    reads: {
      "Is it your kind of work?": {
        rating: "good",
        text: "SharePoint and Microsoft 365 admin is work your team does for the clinics. Here, though, only ITES-3S holders can quote.",
      },
      "Does the size fit?": {
        rating: "good",
        text: `About ${usd(TWIN_MID)} a year, about a quarter of your revenue. On size alone it fits.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Marshall Hall is ${BRAGG_MILES} miles from your office, the same building as the help desk.`,
      },
      "Can you do the work?": {
        rating: "good",
        text: "Your admins could run the sites. What stops you is who can quote, not the work.",
      },
      "Can you win it?": {
        rating: "weak",
        text: "Only small-business holders of the Army's ITES-3S contract may submit. You are not one, so you can't send a quote.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "Not as prime. As a sub to a holder you'd price only your admins' hours, on the holder's terms.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: "No bond, and the staff would be one or two admins. Winning is not the problem; quoting is.",
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: "The Army Reserve has ordered this work through ITES-3S since 2021, so the holders get the orders. The way in is to be on the next contract.",
      },
      "Does this move you forward?": {
        rating: "watch",
        text: "Not this cycle. The help desk quote is the same office and the same customer, and it is open to 8(a) firms like yours.",
      },
    },
    limits: [
      "Holders only: this requirement will be competed as a task order under the Army ITES-3S IDIQ. Only small-business ITES-3S holders may submit, and you are not one.",
      "Closed: ITES-3S takes no new firms, and ITES-4S, the Army's next IT contract, is not awarded yet.",
    ],
    wouldChange: [
      "If the Army reposts this work open-market, as it did in 2018, I'd read it again.",
      "If an ITES-3S holder asks you to staff the SharePoint work, I'd look at that as a subcontract.",
    ],
    nextMove: {
      label: "Go to the help desk quote",
      to: `/opportunities/${HERO_IDS.hero}`,
      rationale: `Same office and same customer, and only 8(a) firms can quote. Its due date is ${hero.closesInDays} days out; spend this week there.`,
    },
    secondaryMove: { label: "Add the next step to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "Small business under the size standard", status: "have", note: "You are small." },
      { requirement: `Registered under NAICS ${twin.naics}`, status: "have", note: "Your primary code." },
      { requirement: "Holder of the Army's ITES-3S contract", status: "missing", note: "You are not one, and it takes no new firms." },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: `Am I too quick to pass on ${usd(TWIN_MID)} a year?`,
        answer: `No. You can't send a quote, so there is no ${usd(TWIN_MID)} to pass on. The help desk quote is the part open to you.`,
      },
      {
        challenge: "Could I team with a holder?",
        answer: "Yes, as a sub. Larkspur Federal IT is a small-business ITES-3S holder. Ask whether it is quoting this order and needs SharePoint admins.",
      },
      {
        challenge: "How do I get onto the Army's IT contracts?",
        answer: "Not ITES-3S; it is closed. ITES-4S comes next. A partner or a mentor-protégé joint venture is the realistic way onto it.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: twin.closesInDays - 10 },
      { label: "Quotes due", inDays: twin.closesInDays },
    ],
    railBriefing: [
      "I read the task order request and the work statement.",
      "I stopped at the clause on who can quote. Only ITES-3S holders can.",
      "Ask me anything, or pick a question below. There is no quote here for you this cycle.",
    ],
    chips: ["Why can't I bid this?", "How do I get on ITES-4S?", "What should I bid instead?"],
    railAnswers: {
      "Why can't I bid this?":
        "It will be competed as a task order under the Army's ITES-3S contract, and only small-business ITES-3S holders may submit. You are not one, and ITES-3S takes no new firms.",
      "How do I get on ITES-4S?":
        "ITES-4S is the Army's next IT contract. Awards are not expected before late 2027. A partner that is bidding it, or a mentor-protégé joint venture, is the realistic way on. Ask Sarah where to start.",
      "What should I bid instead?":
        "The Army Reserve help desk. Same office and same customer, and only 8(a) firms can quote. Open it from the button on this page.",
      "Why not bid?":
        "It will be competed as a task order under the Army's ITES-3S contract, and only small-business ITES-3S holders may submit. You are not one, and ITES-3S takes no new firms.",
      "Who could I staff it for?":
        "A small-business ITES-3S holder. Larkspur Federal IT is one. Ask whether it is quoting this order and needs SharePoint admins.",
      "Where am I weak?": "Here it is not your work. It is who can quote: only ITES-3S holders.",
      "Can I win it?": "No. You can't send a quote, because only ITES-3S holders can.",
      "Do I have enough time?": `Time is not the problem. The order is open for ${twin.closesInDays} days, but only ITES-3S holders can quote.`,
    },
  },

  // ── The team-up: the Army medical center's IT follow-on — prime no-go, subcontract go ──
  [HERO_IDS.teamUp]: {
    oppId: HERO_IDS.teamUp,
    confidence: 3,
    gist: teamUp.grant.oneLine,
    thesis: `The work fits, but the prime seat is not yours: only STARS III holders can quote it, and each year is about ${TEAM_TIMES} times your revenue. Team with ${PARTNER.name} and run the desk-side techs at the medical center.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Desk-side support and imaging is the work your techs do at Seymour Johnson, rated Very Good.",
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usd(TEAM_MID)} a year, about ${TEAM_TIMES} times your yearly revenue. As a sub you'd run nine desk-side techs, about $900K a year.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `The medical center is on Fort Bragg, ${PLACES[teamUp.place].milesFromBase} miles from your office. Your techs can be on site every day.`,
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Your techs can do the desk-side work. Nine more seats on top of the help desk means hiring, and clinics can't wait for a fix.",
      },
      "Can you win it?": {
        rating: "weak",
        text: `As a prime you can't quote: the agency expects to order it through 8(a) STARS III, and you hold no seat. As a subcontractor you share in the work if ${BLUE} wins.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: "A subcontract pays for your nine techs. Price them at or above the wage floor, and agree on your rate before the quote.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: `Nine new hires need payroll before the first payment, and you have no credit line. Price for being paid after ${BLUE} is paid.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The agency wants clinicians back at work fast: techs at the desk, not a queue. A team with local techs on post fits that.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A hospital IT job on your record, with a second Defense buyer. Teaming is how you get in while STARS III is closed.",
      },
    },
    limits: [
      "Contract: the agency expects to order this through GSA's 8(a) STARS III. You hold no seat, so you can't quote as prime.",
      `Size: about ${usd(TEAM_MID)} a year, about ${TEAM_TIMES} times your yearly revenue.`,
      `Teaming: nothing is signed with ${PARTNER.name} yet. A teaming agreement sets your share before the quote.`,
    ],
    wouldChange: [
      "If the agency competes the follow-on outside STARS III, I'd check it again, but the size still points to a subcontract.",
      `If ${BLUE} does not reply, I'd look for another STARS III holder on Partners.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${BLUE} wants a local firm for nine desk-side techs. Reply to ${PARTNER.contact} this week and ask for a teaming agreement before the quote.`,
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${teamUp.naics}`, status: "have", note: "One of your codes." },
      { requirement: "Holder of GSA's 8(a) STARS III contract, expected", status: "missing", note: "You are 8(a), but you hold no STARS III seat." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Similar jobs, with a contact for each", status: "have", note: "Your Seymour Johnson desktop support, rated Very Good." },
      { requirement: "Teaming agreement with a STARS III holder", status: "partial", note: `${BLUE} wants a local firm. Nothing is signed yet.` },
    ],
    redTeam: [
      {
        challenge: "Could I quote it myself, as an 8(a) firm?",
        answer: "Not as the lead. Only STARS III holders can quote, and a year of the work is more than your revenue.",
      },
      {
        challenge: "Can I staff nine more techs?",
        answer: "With time, yes. The award is not before 28 February 2027. Hire through the spring, and don't pull techs off the help desk.",
      },
      {
        challenge: `Does ${BLUE} need me?`,
        answer: "It says it does: it runs hospital IT at two Navy medical centers, but it has no techs near Fort Bragg. Your Seymour Johnson work is the proof to send.",
      },
    ],
    keyDates: [{ label: "Replies due", inDays: teamUp.closesInDays }],
    railBriefing: [
      "I read the request for information and the draft work statement.",
      "You can do part of this work, but not as prime. The contract and the size decide it.",
      "I have a question for you, or pick one below.",
    ],
    chips: ["Why not as prime?", "Who could I team with?", { label: `Tell Grant about ${BLUE}`, kind: "elicit", target: "talked-to-partner" }],
    railAnswers: {
      "Why not as prime?": `Two reasons. The agency expects to order it through 8(a) STARS III, and you hold no seat on it. And at about ${usd(TEAM_MID)} a year, it is about ${TEAM_TIMES} times your yearly revenue.`,
      "Who could I team with?": `${PARTNER.name}, an 8(a) firm in ${PARTNER.city} that holds STARS III. It runs hospital IT at two Navy medical centers, and it wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. ${PARTNER.contact}, its ${PARTNER.contactTitle.toLowerCase()}, is your contact.`,
      "How do I team with them?": `Open Partners and reply to ${PARTNER.contact}. Send your Seymour Johnson desktop support and its rating, and ask for a teaming agreement that names your share: the nine desk-side techs.`,
      "What should my reply say?": `You don't need to reply alone: ${BLUE} replies as the prime and names you as its partner. Send ${BLUE} a one-page note: your 8(a) status, your Security+ techs, your Seymour Johnson work and how fast you can hire.`,
      "What should my response say?": `You don't need to reply alone: ${BLUE} replies as the prime and names you as its partner. Send ${BLUE} a one-page note: your 8(a) status, your Security+ techs, your Seymour Johnson work and how fast you can hire.`,
      "Can I win it?": `No one can promise that. As a prime, no: only STARS III holders can quote. As a subcontractor, you share in the work if ${BLUE} wins it.`,
      "Do I have enough time?": `Yes. Replies are due in ${teamUp.closesInDays} days, and the quote comes in about 90. Reply to ${PARTNER.contact} this week so your name is in ${BLUE}'s reply.`,
      "Where am I weak?": `The contract and the size. You hold no STARS III seat, and nine new techs need payroll before the first payment. A teaming agreement with ${BLUE} settles the first; hiring early settles the second.`,
      "Is this a bid?": "No. A request for information asks which firms could do the work. There is no price and no award. The quote comes later.",
    },
  },
};
