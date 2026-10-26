// THE TRUCKING COMPANY: Grant's written reviews of the two story opportunities
// that members/trucking/grantBriefs.ts does not brief: the look-alike twin
// (No-bid) and the Fort Bragg team-up (prime no-go, subcontract go). The hero's
// brief is in members/trucking/grantBriefs.ts.
//
// Source: demo-storyboard/trucking-pack.md, sections 4 and 5.
// Rules for these words:
// - The twin is said plainly: only SDDC-approved protective-service carriers get
//   the papers, and SECRET cargo needs a company clearance and cleared drivers.
//   Grant keeps the clearance at that level and never says why DoD runs it so.
// - The EAGLE task order was competed full and open, so Grant cites no limit on
//   subcontracting there.
// - No promise of a win.

import type { AuthoredBrief } from "@/demo/grant/encode";
import { PARTNER, usd, usdAbout } from "@/demo/grant/facts";
import { getOpportunity } from "@/demo/story/opportunities";
import { PLACES } from "@/demo/story/places";
import { PERSONA } from "../persona";
import { HERO_IDS } from "../opportunities";

const twin = getOpportunity(HERO_IDS.twin)!;
const teamUp = getOpportunity(HERO_IDS.teamUp)!;

const mid = (o: typeof twin): number => Math.round((o.valueLow! + o.valueHigh!) / 2);
const TWIN_MID = mid(twin);
const TEAM_MID = mid(teamUp);
const TWIN_SHARE = `${Math.round((TWIN_MID / PERSONA.annualRevenue) * 100)}%`;
/** "Brightwater Sustainment": the partner's short name. */
const BLUE = PARTNER.name.split(" ").slice(0, 2).join(" ");
const CHERRY_POINT_MILES = PLACES[twin.place].milesFromBase;
const BRAGG_MILES = PLACES[teamUp.place].milesFromBase;

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── The twin: secure freight runs from DLA Distribution Cherry Point — No-bid ──
  [HERO_IDS.twin]: {
    oppId: HERO_IDS.twin,
    confidence: 5,
    gist: twin.grant.oneLine,
    thesis:
      "Only carriers SDDC has approved for protective service can even get the papers, and you are not one. That approval needs a security clearance for your company and cleared drivers. Spend this month on the VA routes, and start SDDC's carrier program.",
    reads: {
      "Is it your kind of work?": {
        rating: "watch",
        text: "Truckload is one of your codes, but this is secure cargo: SECRET and CONFIDENTIAL loads and hazmat, watched for the whole trip across the lower 48. You haul neither.",
      },
      "Does the size fit?": {
        rating: "good",
        text: `About ${usd(TWIN_MID)} a year, about ${TWIN_SHARE} of your revenue. On size alone it would fit.`,
      },
      "Can you perform there?": {
        rating: "watch",
        text: `Cherry Point is ${CHERRY_POINT_MILES} miles from your yard, and the loads go across the lower 48. That means long trips and nights away.`,
      },
      "Can you do the work?": {
        rating: "weak",
        text: "Every SECRET load needs cleared drivers, and some loads need hazmat endorsements. You have neither.",
      },
      "Can you win it?": {
        rating: "weak",
        text: "Only carriers SDDC has approved for protective service are eligible to receive the solicitation. You are not approved, so you can't even get the papers.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "Not this cycle. You can't send an offer, so there is no price to make.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: "A company clearance and cleared drivers would take years and a sponsor. It is not something you fix before the due date.",
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: "DoD wants its secure cargo with carriers it has already checked. Who can carry it is settled before the notice posts.",
      },
      "Does this move you forward?": {
        rating: "watch",
        text: "Not this one. SDDC's carrier program is the first step: register, haul DoD freight for a few years, then look at secure cargo.",
      },
    },
    limits: [
      "Approval: only carriers SDDC has approved for protective service can receive the solicitation. You are not one.",
      "Clearance: SECRET cargo needs a security clearance for your company and cleared drivers. You have neither.",
    ],
    wouldChange: [
      "If DLA opened the solicitation to carriers outside SDDC's approved list, I'd read it again, but the clearance would still stop you.",
      "If you join SDDC's carrier program and haul DoD freight for a few years, I'd look at secure cargo with you again.",
    ],
    nextMove: {
      label: "Go to the VA routes",
      to: `/opportunities/${HERO_IDS.hero}`,
      rationale: "It is your trucks, your size and your set-aside. Spend this month on that quote, and start your SDDC carrier paperwork alongside it.",
    },
    secondaryMove: { label: "Add the next step to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${twin.naics}`, status: "have", note: "One of your codes." },
      { requirement: "Total small business set-aside", status: "have", note: "You are small." },
      { requirement: "SDDC protective security service approval", status: "missing", note: "You are not approved." },
      { requirement: "Facility security clearance and cleared drivers", status: "missing", note: "None." },
      { requirement: "Hazmat endorsements", status: "missing", note: "None of your drivers holds one." },
    ],
    redTeam: [
      {
        challenge: `Am I too quick to pass on ${usd(TWIN_MID)} a year?`,
        answer: `No. You can't even get the solicitation, so there is no ${usd(TWIN_MID)} to pass on. The VA routes are open to you now.`,
      },
      {
        challenge: "Could I sub to an approved carrier?",
        answer: "Not on the secure loads: every driver on a SECRET load needs a clearance. Hauling DoD freight through SDDC's carrier program is how you build toward it.",
      },
      {
        challenge: "How do I get approved?",
        answer: "Start with SDDC's Freight Carrier Registration Program. You meet its three-year authority rule. Haul DoD freight for a few years, then look at protective service and the clearance it needs.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: twin.closesInDays - 10 },
      { label: "Proposals due", inDays: twin.closesInDays },
      { label: "Expected award", inDays: twin.closesInDays + 30 },
    ],
    railBriefing: [
      "I read the solicitation notice and the work statement.",
      "I stopped at the clause on who can receive the solicitation. Only carriers SDDC has approved for protective service can.",
      "Ask me anything, or pick a question below. There is no bid here for you this cycle.",
    ],
    chips: ["Why can't I bid this?", "How do I get approved?", "What should I bid instead?"],
    railAnswers: {
      "Why can't I bid this?":
        "Only carriers SDDC has approved for protective service are eligible to receive the solicitation, and you are not one. SECRET cargo also needs a security clearance for your company and cleared drivers.",
      "How do I get approved?":
        "Start with SDDC's Freight Carrier Registration Program: three straight years of DOT authority (you have nine), a SCAC, a Syncada account, a DoD bond and cargo insurance. Haul DoD freight for a few years, then look at protective service.",
      "What should I bid instead?":
        "The supply and linen runs for the Fayetteville VA. It is your trucks, your size and your set-aside, and only service-disabled veteran-owned firms can quote. Open it from the button on this page.",
      "What should my response say?":
        "Nothing this cycle. You can't send a proposal, because only SDDC-approved secure carriers receive the solicitation. Put the time into the VA routes quote.",
      "Why not bid?":
        "Only carriers SDDC has approved for protective service are eligible to receive the solicitation, and you are not one. SECRET cargo also needs a security clearance for your company and cleared drivers.",
      "What would put me in range?":
        "SDDC's carrier program first, then a few years of DoD freight, then protective-service approval with a company clearance and cleared drivers. It is years, not weeks.",
      "Where am I weak?": "Here it is not your trucks. It is who can receive the papers: only SDDC-approved secure carriers. The clearance is the second limit.",
      "Can I win it?": "No. You can't even get the solicitation, because only SDDC-approved secure carriers receive it.",
      "Do I have enough time?": `Time is not the problem. Proposals are due in ${twin.closesInDays} days, but only SDDC-approved secure carriers can send one.`,
    },
  },

  // ── The team-up: Fort Bragg's base logistics contract — prime no-go, subcontract go ──
  [HERO_IDS.teamUp]: {
    oppId: HERO_IDS.teamUp,
    confidence: 3,
    gist: teamUp.grant.oneLine,
    thesis: `The freight work fits, but the prime seat is not yours: only EAGLE agreement holders can bid, and a year of it is about 20 times your revenue. Team with ${PARTNER.name} and run the local freight and trailer moves.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "The transportation part is your work: central-receiving runs, installation freight, and trailer and container moves. You made 46 of those moves for the 18th Airborne Corps.",
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usdAbout(TEAM_MID)} a year, about 20 times your revenue. Only the transportation part is sized for you.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Fort Bragg is ${BRAGG_MILES} miles from your yard, and you know its gates.`,
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Your trucks can run the freight and trailer moves. Supply and maintenance are not your trades, and a prime has to run them.",
      },
      "Can you win it?": {
        rating: "weak",
        text: `Only holders of the Army's EAGLE agreement can bid, and you are not one. As a subcontractor you share in the work if ${BLUE} wins.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: "A subcontract pays for your trucks and drivers on the freight work. Price it from your real miles and hours, and agree on the rates in the teaming agreement.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: `Steady freight on post could mean more drivers and trucks. Price for being paid after ${BLUE} is paid, and grow into it.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The Army wants no gap when the current contract ends in 254 days. A prime with a local carrier that already hauls on post fits that.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "Fort Bragg is your main target, and this is its base logistics work for five years. Teaming is how you get in.",
      },
    },
    limits: [
      "EAGLE: only holders of the Army's EAGLE agreement can bid. You are not one.",
      "Size: a year of the work is about 20 times your revenue.",
      `Teaming: nothing is signed with ${PARTNER.name} yet. A teaming agreement sets your share before the RFP.`,
    ],
    wouldChange: [
      "If the Army opened the next task order outside EAGLE, the size still points to a subcontract.",
      `If ${BLUE} does not reply, I'd look for another EAGLE holder on Partners.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${BLUE} wants a local service-disabled veteran-owned carrier for Fort Bragg's freight runs and trailer moves. Reply to ${PARTNER.contact} this week and ask for a teaming agreement before the RFP.`,
    },
    secondaryMove: { label: "Send to Diana for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${teamUp.naics}`, status: "partial", note: "Not one of your codes. The prime bids under it; your freight work is under 484110." },
      { requirement: "Holder of the Army's EAGLE agreement", status: "missing", note: "You are not one." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Similar work, with a contact", status: "have", note: "Your trailer and container hauling for the 18th Airborne Corps." },
      { requirement: "Teaming agreement with an EAGLE holder", status: "partial", note: `${BLUE} wants a local carrier. Nothing is signed yet.` },
    ],
    redTeam: [
      {
        challenge: "Could I bid it myself?",
        answer: "No. Only EAGLE holders can bid, and a year of the work is about 20 times your revenue.",
      },
      {
        challenge: "Is the freight share worth it?",
        answer: "Yes. Steady freight and trailer moves on post, close to your yard, for five years, and a record with the Army's logistics center.",
      },
      {
        challenge: `Does ${BLUE} need me?`,
        answer: "It says it does: it wants a local service-disabled veteran-owned carrier for the transportation division. Your 46 moves for the 18th Airborne Corps are the proof to send.",
      },
    ],
    keyDates: [{ label: "Comments due", inDays: teamUp.closesInDays }],
    railBriefing: [
      "I read the draft for comment and the draft work statement.",
      "You can run the freight part of this, but not as prime. The EAGLE rule and the size decide it.",
      "I have a question for you, or pick one below.",
    ],
    chips: ["Why not as prime?", "Who could I team with?", { label: `Tell Grant about ${BLUE}`, kind: "elicit", target: "talked-to-partner" }],
    railAnswers: {
      "Why not as prime?": `Two reasons. Only holders of the Army's EAGLE agreement can bid, and you are not one. And at about ${usdAbout(TEAM_MID)} a year, it is about 20 times your revenue.`,
      "Who could I team with?": `${PARTNER.name}, an EAGLE agreement holder in ${PARTNER.city} that runs Fort Bragg's logistics contract today. It wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. ${PARTNER.contact}, its ${PARTNER.contactTitle.toLowerCase()}, is your contact.`,
      "How do I team with them?": `Open Partners and reply to ${PARTNER.contact}. Send your Fort Bragg trailer hauling and your daily routes, and ask for a teaming agreement that names the local freight and trailer moves as yours.`,
      "What should my reply say?": `You don't need to reply to the Army alone: ${BLUE} comments as the prime and names you as its partner. Send ${BLUE} a one-page note: your service-disabled veteran-owned certification, your trucks and drivers, and your 46 moves for the 18th Airborne Corps.`,
      "What should my response say?": `You don't need to reply to the Army alone: ${BLUE} comments as the prime and names you as its partner. Send ${BLUE} a one-page note: your service-disabled veteran-owned certification, your trucks and drivers, and your 46 moves for the 18th Airborne Corps.`,
      "Can I win it?": `No one can promise that. As a prime, no: only EAGLE holders can bid. As a subcontractor, you share in the work if ${BLUE} wins it.`,
      "Do I have enough time?": `Yes. Comments are due in ${teamUp.closesInDays} days, and the RFP comes later. Reply to ${PARTNER.contact} this week so your name is on ${BLUE}'s team.`,
      "Where am I weak?": `The EAGLE rule and the size. You are not a holder, and a year of the work is about 20 times your revenue. A teaming agreement with ${BLUE} settles both.`,
      "Is this a bid?": "No. A draft for comment asks what firms think of the work statement. There is no price and no award. The RFP comes later.",
    },
  },
};
