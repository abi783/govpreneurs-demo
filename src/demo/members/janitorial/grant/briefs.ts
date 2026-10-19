// THE JANITORIAL FIRM: Grant's written reviews of the two story opportunities
// that members/janitorial/grantBriefs.ts does not brief: the look-alike twin
// (No-bid) and the Army Reserve team-up (prime no-go, subcontract go). The
// hero's brief is in members/janitorial/grantBriefs.ts.
//
// Source: demo-storyboard/janitorial-pack.md, sections 4 and 5.
// Rules for these words:
// - The twin is said plainly: the work is headed to AbilityOne, and the law
//   sends Procurement List work to nonprofit agencies. No firm can win it on price.
// - On a services contract the 8(a) prime keeps at least half the work, so a
//   subcontractor's share tops out at half.
// - No promise of a win.

import type { AuthoredBrief } from "@/demo/grant/encode";
import { PARTNER, usd, usdAbout } from "@/demo/grant/facts";
import { getOpportunity } from "@/demo/story/opportunities";
import { PLACES } from "@/demo/story/places";
import { HERO_IDS } from "../opportunities";

const hero = getOpportunity(HERO_IDS.hero)!;
const twin = getOpportunity(HERO_IDS.twin)!;
const teamUp = getOpportunity(HERO_IDS.teamUp)!;

const mid = (o: typeof twin): number => Math.round((o.valueLow! + o.valueHigh!) / 2);
const TWIN_MID = mid(twin);
const TEAM_MID = mid(teamUp);
/** His most as the prime's subcontractor: half the job. */
const TEAM_HALF = usdAbout(TEAM_MID / 2);
/** "Ashepoo": the partner's short name. */
const ASH = PARTNER.name.split(" ")[0];
const FORT_BRAGG_MILES = PLACES[twin.place].milesFromBase;
const HERO_TITLE = hero.plainTitle.charAt(0).toLowerCase() + hero.plainTitle.slice(1);

export const AUTHORED_BRIEFS: Record<string, AuthoredBrief> = {
  // ── The twin: custodial for ten buildings, headed to AbilityOne — No-bid ──
  [HERO_IDS.twin]: {
    oppId: HERO_IDS.twin,
    confidence: 5,
    gist: twin.grant.oneLine,
    thesis:
      "The work is yours, but the buyer can't take it from you: these buildings are headed to the AbilityOne list, and that work goes to nonprofit agencies by law. Spend the time on the pressure-washing quote.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Daily custodial and floor care in office buildings is your primary code and your night crews' work.",
      },
      "Does the size fit?": {
        rating: "good",
        text: `About ${usd(TWIN_MID)} a year, about a fifth of your revenue. The size would fit.`,
      },
      "Can you perform there?": {
        rating: "strong",
        text: `Fort Bragg is ${FORT_BRAGG_MILES} miles from your office, and your crews already badge onto post.`,
      },
      "Can you do the work?": {
        rating: "good",
        text: "Your crews could do the work. What stops you is who the Army may buy it from, not the work.",
      },
      "Can you win it?": {
        rating: "weak",
        text: "No. The notice says the work is being considered for the AbilityOne Program, and Procurement List work must go to a nonprofit agency. A quote from you can't be accepted at any price.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "There is no price to make money on. The work is not headed to a competition.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: "No bond, and the payroll would fit. It doesn't matter here, because there is nothing to win.",
      },
      "Do you understand the buyer's intent?": {
        rating: "good",
        text: "Fort Bragg buys its custodial work from AbilityOne nonprofits; in March the whole post went to one. These buildings are being added to that contract.",
      },
      "Does this move you forward?": {
        rating: "weak",
        text: "Not this one. Fort Bragg's exterior and specialty work is what's open to you, and the pressure-washing quote is due first.",
      },
    },
    limits: [
      "AbilityOne: the work is being considered for the AbilityOne Program under FAR Subpart 8.7. Procurement List work goes to nonprofit agencies by law.",
      "Who can win: no commercial firm, at any price.",
    ],
    wouldChange: [
      "If the Army drops the AbilityOne plan and competes the work, I'd read it again.",
      "If the Commission ever proposes adding work you hold to the list, comment in the Federal Register and show the harm.",
    ],
    nextMove: {
      label: "Go to the pressure-washing quote",
      to: `/opportunities/${HERO_IDS.hero}`,
      rationale: `Same office, same post, and open to HUBZone firms. Quotes are due in ${hero.closesInDays} days; put this time there.`,
    },
    secondaryMove: { label: "Add the next step to my Roadmap", to: "/roadmap" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${twin.naics}`, status: "have", note: "Your primary code." },
      { requirement: "A nonprofit agency named by the AbilityOne Commission", status: "missing", note: "Gray Owl is a commercial firm." },
      { requirement: "General liability insurance", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: `Am I too quick to pass on ${usd(TWIN_MID)} a year?`,
        answer: `No. A quote from you can't be accepted, so there is no ${usd(TWIN_MID)} to pass on.`,
      },
      {
        challenge: "Could I work for the nonprofit?",
        answer: "Not on the cleaning. An AbilityOne nonprofit must do the work with its own workforce, most of it people who are blind or have significant disabilities.",
      },
      {
        challenge: "What if AbilityOne comes for work I already hold?",
        answer: "The Commission posts proposed additions in the Federal Register with a comment period. Comment, and show what the loss would do to your firm.",
      },
    ],
    keyDates: [{ label: "Responses due", inDays: twin.closesInDays }],
    railBriefing: [
      "I read the special notice and the work statement.",
      "I stopped at the AbilityOne line. This work is headed to a nonprofit agency, and no commercial firm can win it.",
      "Ask me anything, or pick a question below. There is no quote here for you.",
    ],
    chips: ["Why can't I bid this?", "What is AbilityOne?", "What should I bid instead?"],
    railAnswers: {
      "Why can't I bid this?":
        "The notice says the work is being considered for the AbilityOne Program. Work on the Procurement List must be bought from a nonprofit agency that employs people who are blind or have significant disabilities, so a quote from you can't be accepted at any price.",
      "What is AbilityOne?":
        "A federal program that buys products and services from nonprofit agencies employing people who are blind or have significant disabilities. Once work is on its Procurement List, the government must buy it from those agencies. Fort Bragg's custodial and grounds work is on it.",
      "What should I bid instead?": `The ${HERO_TITLE}. Same office, same post, open to HUBZone firms, and quotes are due in ${hero.closesInDays} days. The one-time floor jobs on post are open to you too.`,
      "Why not bid?":
        "The work is headed to the AbilityOne list, and that work goes to nonprofit agencies by law. A quote from you can't be accepted at any price.",
      "Can I win it?": "No. No commercial firm can win Procurement List work.",
      "Where am I weak?": "Here it is not your work or your size. It is who the Army may buy it from: an AbilityOne nonprofit.",
      "Do I have enough time?": `Time is not the problem. Responses are due in ${twin.closesInDays} days, but no quote from you can be accepted.`,
      "What would put me in range?": "Nothing you can change. Work on the Procurement List stays there unless the Commission removes it. The exterior and specialty work at Fort Bragg is where you are in range.",
    },
  },

  // ── The team-up: Army Reserve centers in NC and SC — prime no-go, subcontract go ──
  [HERO_IDS.teamUp]: {
    oppId: HERO_IDS.teamUp,
    confidence: 3,
    gist: teamUp.grant.oneLine,
    thesis: `The work fits, but the prime seat is not yours: the Corps expects to set it aside for 8(a) firms, and one prime must cover sites in two states. Team with ${PARTNER.name} and clean and mow the North Carolina centers near you.`,
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Cleaning offices and drill halls and mowing the grounds is your crews' work. Your Hope Mills job is the same mix for a town.",
      },
      "Does the size fit?": {
        rating: "watch",
        text: `About ${usd(TEAM_MID)} over five years, across two states. As a sub you'd take part of it: at most half, about ${TEAM_HALF}.`,
      },
      "Can you perform there?": {
        rating: "watch",
        text: "The North Carolina centers near Fayetteville are in your range. The South Carolina sites are not; the prime covers those.",
      },
      "Can you do the work?": {
        rating: "good",
        text: "Your night crews and your grounds code cover it. Drill weekends mean some weekend shifts.",
      },
      "Can you win it?": {
        rating: "weak",
        text: `As a prime you can't compete: the Corps expects only 8(a) firms to be eligible. As a subcontractor you share in the work if ${ASH} wins.`,
      },
      "Will you make money?": {
        rating: "watch",
        text: "A subcontract pays for the sites you cover. Price each site from real crew hours and the county wage rates.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: `No bond. Price for being paid after ${ASH} is paid, about 30 days after the Army pays it.`,
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The Corps wants one prime for every site and clean centers on drill weekends. A prime with local crews in each state fits that.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "An Army Reserve subcontract adds federal custodial work to your record, and 8(a) work near you comes only through a prime. Teaming is how you get in.",
      },
    },
    limits: [
      "Set-aside: the Corps expects to set the proposal aside for 8(a) firms. You can't hold the prime contract.",
      "Reach: one prime must cover sites in North and South Carolina.",
      `Teaming: nothing is signed with ${PARTNER.name} yet. A teaming agreement sets your sites and your share before the proposal.`,
    ],
    wouldChange: [
      "If the Corps opens the proposal to HUBZone or small businesses, I'd check it again, but the reach still points to a subcontract.",
      `If ${ASH} does not reply, I'd look for another 8(a) firm on Partners.`,
    ],
    nextMove: {
      label: `See ${PARTNER.name} on Partners`,
      to: "/partners",
      rationale: `${ASH} wants a local subcontractor for the North Carolina centers. Reply to ${PARTNER.contact} this week and ask for a teaming agreement before the reply is due.`,
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: `Registered under NAICS ${teamUp.naics}`, status: "have", note: "Your primary code." },
      { requirement: "8(a) Business Development Program, expected", status: "missing", note: "You are HUBZone, not 8(a)." },
      { requirement: "Capability statement", status: "have", note: "On file in My Business." },
      { requirement: "Similar jobs, with a contact for each", status: "have", note: "Your Hope Mills town work and your VA clinic floor care." },
      { requirement: "Teaming agreement with an 8(a) prime", status: "partial", note: `${ASH} wants a local sub. Nothing is signed yet.` },
    ],
    redTeam: [
      {
        challenge: "Could I lead it with an 8(a) partner?",
        answer: "Not as the lead. The 8(a) firm has to lead, and it has to cover sites in two states.",
      },
      {
        challenge: "How much of the work could I get?",
        answer: "Up to half. On a services contract the 8(a) prime keeps at least half the work. The North Carolina centers near you are a natural share.",
      },
      {
        challenge: `Does ${ASH} need me?`,
        answer: `It says it does: it holds the current contract from ${PARTNER.city} and wants a local subcontractor for the North Carolina centers. Your Hope Mills job is the proof to send.`,
      },
    ],
    keyDates: [{ label: "Replies due", inDays: teamUp.closesInDays }],
    railBriefing: [
      "I read the sources sought notice and the draft work statement.",
      "You can do part of this work, but not as prime. The set-aside and the reach decide it.",
      "I have a question for you, or pick one below.",
    ],
    chips: ["Why not as prime?", "Who could I team with?", { label: `Tell Grant about ${ASH}`, kind: "elicit", target: "talked-to-partner" }],
    railAnswers: {
      "Why not as prime?": "Two reasons. The Corps expects to set the proposal aside for 8(a) firms, and you are HUBZone, not 8(a). And one prime must cover sites in North and South Carolina.",
      "Who could I team with?": `${PARTNER.name}, an 8(a) firm in ${PARTNER.city}. It holds the current contract, and it wants ${PARTNER.seeking.charAt(0).toLowerCase()}${PARTNER.seeking.slice(1)}. ${PARTNER.contact}, its ${PARTNER.contactTitle.toLowerCase()}, is your contact.`,
      "How do I team with them?": `Open Partners and reply to ${PARTNER.contact}. Send your Hope Mills town work and your VA clinic floor care, and ask for a teaming agreement that names the North Carolina centers you'd cover.`,
      "What should my reply say?": `You don't need to reply to the Corps alone: ${ASH} replies as the prime and names you as its partner. Send ${ASH} a one-page note: your HUBZone certification, your night crews, your Hope Mills job and the centers within an hour of Fayetteville.`,
      "What should my response say?": `You don't need to reply to the Corps alone: ${ASH} replies as the prime and names you as its partner. Send ${ASH} a one-page note: your HUBZone certification, your night crews, your Hope Mills job and the centers within an hour of Fayetteville.`,
      "Can I win it?": `No one can promise that. As a prime, no: the set-aside rules you out. As a subcontractor, you share in the work if ${ASH} wins it.`,
      "Do I have enough time?": `Yes. Replies are due in ${teamUp.closesInDays} days, and the proposal comes later. Reply to ${PARTNER.contact} this week so your name is in ${ASH}'s reply.`,
      "Where am I weak?": `Set-aside and reach. You are not 8(a), and you can't cover South Carolina. A teaming agreement with ${ASH} settles both.`,
      "Is this a bid?": "No. A sources sought asks which firms could do the work. There is no price and no award. The request for proposals comes later.",
    },
  },
};
