// THE CONTRACTOR: Grant's written reviews of the two story opportunities that
// members/construction/grantBriefs.ts does not brief: the look-alike twin (No-bid)
// and the VA team-up (prime no-go, subcontract go). The hero's brief is in
// members/construction/grantBriefs.ts.
//
// Source: demo-storyboard/construction-pack.md, sections 4 and 5.
// Rules for these words:
// - The twin is said plainly: only MATOC holders can offer, and the bond is over
//   his single limit. Grant never says why the Army runs its work that way.
// - An SDVOSB prime may pay up to 85% (materials excluded) to other firms on
//   general construction (13 CFR 125.6), so a half-share subcontract is allowed.
// - No promise of a win.

import type { AuthoredBrief } from "@/demo/grant/encode";
import { PARTNER, usd, usdAbout } from "@/demo/grant/facts";
import { getOpportunity } from "@/demo/story/opportunities";
import { PERSONA } from "../persona";
import { PLACES } from "@/demo/story/places";
import { HERO_IDS } from "../opportunities";

const twin = getOpportunity(HERO_IDS.twin)!;
const teamUp = getOpportunity(HERO_IDS.teamUp)!;

const mid = (o: typeof twin): number => Math.round((o.valueLow! + o.valueHigh!) / 2);
const TWIN_MID = mid(twin);
const TEAM_MID = mid(teamUp);
/** His share as the prime's subcontractor: about half the job. */
const TEAM_HALF = usdAbout(TEAM_MID / 2);
const LINE = PERSONA.bondLine!;
const SINGLE = usd(LINE.single);
/** "Blackjack Oak": the partner's short name. */
const BLUE = PARTNER.name.split(" ").slice(0, 2).join(" ");
const FORT_BRAGG_MILES = PLACES[twin.place].milesFromBase;
const VA_MILES = PLACES[teamUp.place].milesFromBase;
const SOURCES_SOUGHT = "W91247-27-R-0007";

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── The twin: barracks HVAC repair, MATOC holders only — No-bid ───────
  [HERO_IDS.twin]: {
    oppId: HERO_IDS.twin,
    confidence: 5,
    gist: twin.grant.oneLine,
    thesis:
      "Only the firms on Fort Bragg's HUBZone Vertical Construction MATOC can offer, and you are not on it. The bond for the full price is also more than your single-job bond. Price the HVAC for one of the holders, and answer the Minor Construction MATOC sources sought.",
    reads: {
      "Is it your kind of work?": {
        rating: "good",
        text: "Barracks HVAC is your trades: air handlers, piping and controls, the same kind of job you did as Turnrow Federal's electrical sub. Here, though, only MATOC holders can offer.",
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usd(TWIN_MID)}. That is more than your ${SINGLE} single-job bond, and with the ${usd(LINE.inUse)} you have in use it would top your ${usd(LINE.aggregate)} total.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Fort Bragg is ${FORT_BRAGG_MILES} miles from your shop, and your crews already badge onto post.`,
      },
      "Can you do the work?": {
        rating: "good",
        text: "Your crews could do the work. What stops you is who can offer, not the work.",
      },
      "Can you win it?": {
        rating: "weak",
        text: "Offers will be accepted only from holders of Fort Bragg's Vertical Construction MATOC. You are not on it, so you can't send an offer.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "Not as prime. As a sub to a holder you'd price only the HVAC work, on the holder's terms.",
      },
      "Can you survive winning?": {
        rating: "weak",
        text: `As prime you'd need bonds of about ${usd(TWIN_MID)} for one job, more than your single limit. Your surety would have to raise your line first.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: "Fort Bragg buys most of its HUBZone repair work through its MATOCs, so the holders get the orders. The way in is to be on the next one.",
      },
      "Does this move you forward?": {
        rating: "watch",
        text: "Not as prime. Pricing the HVAC for a holder adds Fort Bragg barracks work to your record, and the Minor Construction MATOC sources sought is your way onto the next vehicle.",
      },
    },
    limits: [
      "Holders only: offers will be accepted only from holders of the Fort Bragg DPW Vertical Construction MA IDIQ. You are not on it.",
      `Bond: about ${usd(TWIN_MID)} for one job, more than your ${SINGLE} single-job bond.`,
    ],
    wouldChange: [
      "If the Army opens this order to firms off the MATOC, I'd read it again, but the bond would still need a larger line.",
      "If a holder asks you to price the HVAC work, I'd look at that as a subcontract.",
    ],
    nextMove: {
      label: "Go to the MATOC sources sought",
      to: `/opportunities/${SOURCES_SOUGHT}`,
      rationale: "It is the way onto the Minor Construction MATOC, where most of Fort Bragg's HUBZone repair work goes. Answer it before it closes.",
    },
    secondaryMove: { label: "Add the next step to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "HUBZone certification", status: "have", note: "Certified by SBA on 2 Dec 2023." },
      { requirement: `Registered under NAICS ${twin.naics}`, status: "have", note: "Your primary code." },
      { requirement: "Holder of the Vertical Construction MATOC", status: "missing", note: "You are not on it." },
      { requirement: `Performance and payment bonds, about ${usd(TWIN_MID)}`, status: "missing", note: `More than your ${SINGLE} single-job bond.` },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: `Am I too quick to pass on ${usd(TWIN_MID)}?`,
        answer: `No. You can't send an offer, so there is no ${usd(TWIN_MID)} to pass on. Pricing the HVAC for a holder is the part open to you.`,
      },
      {
        challenge: "Could I team with a holder?",
        answer: "Yes, as a sub. Turnrow Federal holds this MATOC and hired your electricians for a barracks job before. Ask whether it is pricing this order.",
      },
      {
        challenge: "How do I get on a MATOC?",
        answer: "Answer the sources sought when the next one is planned. Fort Bragg's Minor Construction MATOC follow-on is asking now: three similar jobs from the last six years, a surety letter and your ratings.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: twin.closesInDays - 10 },
      { label: "Proposals due", inDays: twin.closesInDays },
      { label: "Expected award", inDays: twin.closesInDays + 30 },
    ],
    railBriefing: [
      "I read the task order request and the statement of work.",
      "I stopped at the clause on who can offer. Only holders of Fort Bragg's Vertical Construction MATOC can.",
      "Ask me anything, or pick a question below. There is no bid here for you this cycle.",
    ],
    chips: ["Why can't I bid this?", "How do I get on the MATOC?", "Who could I price it for?"],
    railAnswers: {
      "Why can't I bid this?":
        "Offers will be accepted only from holders of Fort Bragg's Vertical Construction MATOC, and you are not on it. The bond for the full price would also be more than your single-job bond.",
      "How do I get on the MATOC?":
        "Answer the sources sought for the next one. Fort Bragg's Minor Construction MATOC follow-on is asking now: send three similar jobs from the last six years, a surety letter with your single and total limits, and your Pope rating. Open it from the button on this page.",
      "Who could I price it for?":
        "A holder of the Vertical Construction MATOC. Turnrow Federal holds it and hired your electricians for a Fort Bragg barracks job before. Ask whether it is pricing this order and needs the HVAC work.",
      "Why not bid?":
        "Offers will be accepted only from holders of Fort Bragg's Vertical Construction MATOC, and you are not on it. The bond for the full price would also be more than your single-job bond.",
      "What should I bid instead?":
        "Answer the Minor Construction MATOC sources sought; it is the way onto the next vehicle. To bid now, the training building HVAC and electrical upgrade is open to HUBZone firms and fits your size.",
      "What would put me in range?":
        "A seat on a Fort Bragg MATOC and more bond room. The Minor Construction MATOC sources sought is asking now; your surety can tell you what a larger line needs.",
      "Where am I weak?": "Here it is not your work. It is who can offer: only MATOC holders. The bond is the second limit.",
      "Can I win it?": "No. You can't send an offer, because only MATOC holders can.",
      "Do I have enough time?": `Time is not the problem. The order is open for ${twin.closesInDays} days, but only MATOC holders can offer.`,
    },
  },

  // ── The team-up: Fayetteville VA fan coils — prime no-go, subcontract go ──
  [HERO_IDS.teamUp]: {
    oppId: HERO_IDS.teamUp,
    confidence: 3,
    gist: teamUp.grant.oneLine,
    thesis: `The work fits, but the prime seat is not yours: the VA expects to set it aside for service-disabled veteran-owned firms, and it is more than twice your single-job bond. Team with ${PARTNER.name} and self-perform the fan coils, piping and power.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Fan coils, piping and power are both your trades. Your Pope job joined the same HVAC and electrical work, and was rated Very Good.",
      },
      "Does the size fit?": {
        rating: "weak",
        text: `About ${usd(TEAM_MID)}, more than twice your ${SINGLE} single-job bond. As a sub you'd take about half, about ${TEAM_HALF}.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `The Fayetteville VA is ${VA_MILES} miles from your shop. Your crews can be on site every day.`,
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Your crews can self-perform the fan coils, piping and power, about half the job. The medical center stays open, so infection control slows every room.",
      },
      "Can you win it?": {
        rating: "weak",
        text: `As a prime you can't compete: the VA expects only service-disabled veteran-owned firms to be eligible. As a subcontractor you share in the work if ${BLUE} wins.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: "A subcontract pays for your crews' half of the work. Price it from real equipment quotes, and agree on who carries the bond.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: `Your half, about ${TEAM_HALF}, is more than your single-job bond. Agree on sub bonds before you sign, and price for being paid after ${BLUE} is paid.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The VA wants the work done floor by floor while the medical center stays open, as it did on the 3rd floor. A team that has phased work in occupied buildings fits that.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A VA subcontract adds a medical center job to your record, and VA construction near you is veteran-owned first. Teaming is how you get in.",
      },
    },
    limits: [
      "Set-aside: the VA expects to set the sealed bid aside for service-disabled veteran-owned firms. You can't hold the prime contract.",
      `Size: about ${usd(TEAM_MID)}, more than twice your ${SINGLE} single-job bond.`,
      `Teaming: nothing is signed with ${PARTNER.name} yet. A teaming agreement sets your share and the sub bonds before the bid.`,
    ],
    wouldChange: [
      "If the VA opens the bid to HUBZone or small businesses, I'd check it again, but the size still points to a subcontract.",
      `If ${BLUE} does not reply, I'd look for another veteran-owned prime on Partners.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${BLUE} wants a HUBZone firm that self-performs the mechanical and electrical work. Reply to ${PARTNER.contact} this week and ask for a teaming agreement before the bid.`,
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${teamUp.naics}`, status: "have", note: "Your primary code." },
      { requirement: "Service-disabled veteran-owned small business (SDVOSB), expected", status: "missing", note: "You are HUBZone, not veteran-owned." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Similar jobs, with a contact for each", status: "have", note: "Your Pope office building job, rated Very Good." },
      { requirement: "Teaming agreement with a veteran-owned prime", status: "partial", note: `${BLUE} wants a HUBZone firm. Nothing is signed yet.` },
    ],
    redTeam: [
      {
        challenge: "Could I lead it with a veteran-owned partner?",
        answer: "Not as the lead. The veteran-owned firm has to lead, and the job is more than twice your single-job bond.",
      },
      {
        challenge: "Can the prime give half the job to a sub?",
        answer: "Yes. On general construction a veteran-owned prime may pay up to 85 percent of the price, less materials, to firms that are not veteran-owned. Half is well inside that.",
      },
      {
        challenge: `Does ${BLUE} need me?`,
        answer: "It says it does: its crews are tied up on the Fayetteville VA's health-record wiring job, and it wants a HUBZone firm that self-performs the mechanical and electrical work. Your Pope job is the proof to send.",
      },
    ],
    keyDates: [{ label: "Replies due", inDays: teamUp.closesInDays }],
    railBriefing: [
      "I read the sources sought notice and the draft scope.",
      "You can do half of this work, but not as prime. The set-aside and the size decide it.",
      "I have a question for you, or pick one below.",
    ],
    chips: ["Why not as prime?", "Who could I team with?", { label: `Tell Grant about ${BLUE}`, kind: "elicit", target: "talked-to-partner" }],
    railAnswers: {
      "Why not as prime?": `Two reasons. The VA expects to set the bid aside for service-disabled veteran-owned firms, and you are HUBZone, not veteran-owned. And at about ${usd(TEAM_MID)}, it is more than twice your ${SINGLE} single-job bond.`,
      "Who could I team with?": `${PARTNER.name}, a service-disabled veteran-owned general contractor in ${PARTNER.city}. It builds for VA medical centers in North Carolina, and it wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. ${PARTNER.contact}, its ${PARTNER.contactTitle.toLowerCase()}, is your contact.`,
      "How do I team with them?": `Open Partners and reply to ${PARTNER.contact}. Send your Pope job and your Fort Bragg barracks electrical work, and ask for a teaming agreement that names your share, the fan coils, piping and power, and who bonds it.`,
      "What should my reply say?": `You don't need to reply to the VA alone: ${BLUE} replies as the prime and names you as its partner. Send ${BLUE} a one-page note: your HUBZone certification, your two HVAC and two electrical crews, your Pope job and your bond line.`,
      "What should my response say?": `You don't need to reply to the VA alone: ${BLUE} replies as the prime and names you as its partner. Send ${BLUE} a one-page note: your HUBZone certification, your two HVAC and two electrical crews, your Pope job and your bond line.`,
      "Can I win it?": `No one can promise that. As a prime, no: the set-aside rules you out. As a subcontractor, you share in the work if ${BLUE} wins it.`,
      "Do I have enough time?": `Yes. Replies are due in ${teamUp.closesInDays} days, and the bid itself comes later. Reply to ${PARTNER.contact} this week so your name is in ${BLUE}'s reply.`,
      "Where am I weak?": `Set-aside and size. You are not veteran-owned, and your half of the job, about ${TEAM_HALF}, is more than your single-job bond. A teaming agreement with ${BLUE} settles both.`,
      "Is this a bid?": "No. A sources sought asks which firms could do the work. There is no price and no award. The sealed bid comes later.",
    },
  },
};
