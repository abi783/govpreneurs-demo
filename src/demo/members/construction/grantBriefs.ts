// THE CONTRACTOR's Grant briefs (read through src/demo/story/grantBriefs.ts).
// The hero brief follows the pack (demo-storyboard/construction-pack.md,
// section 3) and the USACE Wilmington HUBZone sealed bids it is modeled on. It
// must agree with the facts in persona.ts and opportunities.ts.

import type { GrantBrief } from "../../story/grantBriefs";

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO: HVAC and electrical upgrade, Fort Bragg training building — Bid as prime ──
  {
    oppId: "W912PM27B0004",
    confidence: 4,
    gist: "Both your trades, your size, and only HUBZone firms can bid.",
    thesis:
      "This is a strong first USACE job for you: HVAC and electrical work your own crews do, sized under your single bond, 12 miles from your shop, and open only to HUBZone firms.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Two air handlers, a chiller, controls and a new 800A service. That is both your trades, self-performed, and the same mix as your Pope job.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $730K. That is about 16% of your revenue and under your $1.5M single bond.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "Fort Bragg is 12 miles from your shop, and your crews already badge onto post from the Pope job.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "The chiller and the switchboard have long lead times against 240 days. USACE also wants a named quality control manager and a site safety officer.",
      },
      "Can you win it?": {
        rating: "good",
        text: "It's a sealed bid: the lowest responsive bid gets it. Two recent USACE HUBZone bids near Fort Bragg drew 9 and 11 offers, so price it sharp.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "The wage decision, NC20260122, has no HVAC mechanic class. Pipefitter is $33.96 plus $13.48 fringe; sheet metal worker is $19.67 plus $13.27. Price piping at the pipefitter rate until the Corps answers.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: "$730K on top of $2.9M in bonded work is $3.6M of your $4M aggregate. The Corps pays monthly progress payments, so carry about two months of equipment before the first one.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The unit keeps using the building during the work. The Corps scores nothing but price, but it will hold you to the phasing plan and the 14-day outage notice.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A first USACE job and a rating from it, before the Minor Construction MATOC follow-on asks for both.",
      },
    },
    limits: [
      "Bond room: this puts you at $3.6M of your $4M aggregate, with no written surety OK yet.",
      "The pipefitter rate: the wage decision has no HVAC mechanic class, so the piping rate is unconfirmed.",
      "Lead times: the chiller and switchboard dates are not in writing.",
    ],
    wouldChange: [
      "If your surety won't confirm the final bonds in writing, I'd move this to Don't bid.",
      "If the Corps says a cheaper class covers refrigerant piping, your price drops and this gets stronger.",
    ],
    nextMove: {
      label: "Build the bid with Ava",
      to: "/ava/W912PM27B0004",
      rationale: "30 days is enough. Ava needs your quality and safety staff, your controls plan and how you keep the building cool.",
    },
    secondaryMove: { label: "Send to Diana for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "HUBZone certification", status: "have", note: "Certified by SBA on 2 Dec 2023. Recertification is due in 44 days." },
      { requirement: "Registered under NAICS 238220", status: "have", note: "One of your codes." },
      { requirement: "Bid bond", status: "partial", note: "Ask your surety this week." },
      { requirement: "100% performance and payment bonds", status: "partial", note: "Get the surety's written OK for the final bonds." },
      { requirement: "Quality control manager and site safety officer", status: "missing", note: "Not named yet. Ava asks who." },
      { requirement: "Davis-Bacon wage decision NC20260122", status: "partial", note: "No HVAC mechanic class; ask which class covers piping." },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: "Can a 25-person firm run this and the summer school job at once?",
        answer: "Yes, if they don't share a superintendent. You have two crews of each trade; name a different lead for each job.",
      },
      {
        challenge: "Will a HUBZone firm from Lumberton or Maxton underbid you?",
        answer: "Some will try. You self-perform both trades, so you carry no sub markup on the electrical; that's your price edge.",
      },
    ],
    keyDates: [
      { label: "Site visit", inDays: 8 },
      { label: "Questions due", inDays: 15 },
      { label: "Bids open", inDays: 30 },
    ],
    railBriefing: [
      "I read the bid papers, the drawings list and wage decision NC20260122.",
      "It is a strong fit. Two items need you before bids open.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my bid say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. Call your surety this week for the bid bond and a written OK on the final bonds. Send the wage-class question before questions close in 15 days; every bidder sees the answer.",
      "Where am I weak?":
        "Bond room and lead times. You'd be at $3.6M of a $4M aggregate, and the chiller and switchboard dates aren't in writing. Fix both before you price it.",
      "What should my bid say?":
        "A sealed bid is mostly price and forms. Get the bid schedule right, sign every amendment, attach the bid bond, and name your quality control manager and safety officer. Ava will fill the forms in that order.",
      "Can I win it?":
        "No one can promise that. What I can say: only HUBZone firms can bid, the lowest responsive bid gets it, and you self-perform both trades, which keeps your price down.",
      "Do I have enough time?":
        "Yes. 30 days, and Ava needs about 3 hours of your answers. The items with a lead time are the surety letter and the equipment quotes.",
    },
  },
];
