// THE TRUCKING COMPANY's Grant briefs (read through src/demo/story/grantBriefs.ts).
// The hero brief follows the pack (demo-storyboard/trucking-pack.md, section 3)
// and the VA NCO 6 SDVOSB trucking buys it is modeled on. It must agree with the
// facts in persona.ts and opportunities.ts. Wages are not a fixed-price risk:
// FAR 52.222-43 adjusts the price when a new wage determination comes with an
// option year.

import type { GrantBrief } from "../../story/grantBriefs";

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO: supply and linen runs for the Fayetteville VA — Bid as prime ──
  {
    oppId: "36C24627Q0088",
    confidence: 4,
    gist: "Your trucks, your size, and only service-disabled veteran-owned firms can quote.",
    thesis:
      "This is the VA trucking you're built for: two daily box-truck routes, about $235K a year, across town from your yard, and open only to service-disabled veteran-owned firms.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Scheduled box-truck routes with lift gates and GPS, out and back every weekday. It's the same work as your daily clinic routes for Quarry Lane Medical Supply.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $235K a year, about 9% of your revenue, for a base year and 4 options.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "The routes start at the Fayetteville VA warehouse, across town from your yard. The far stops, Wilmington and Brunswick, are inside your 200-mile area.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Two routes need two box trucks every day and a spare; you have four. The price schedule asks for a \"hazardous material license number\", and none of your drivers holds a hazmat endorsement.",
      },
      "Can you win it?": {
        rating: "good",
        text: "Only service-disabled veteran-owned firms can quote. VA's chilled routes out of Hampton drew 2 offers, so expect a short field, and price it to the work.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "Five fixed-price years at about 400 miles a day, with no fuel clause. At 8 mpg, every 50-cent rise in diesel costs you about $6,000 a year. Wages are not your risk: a new wage determination with each option year raises the price.",
      },
      "Can you survive winning?": {
        rating: "strong",
        text: "VA pays monthly, in arrears. Your $150K credit line carries the first two months of fuel and payroll.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "VA wants the linen and supplies on time every day, with a named PM and Alternate it can call from 6 AM to 6 PM, and drivers who pass its background checks.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A five-year VA contract and a rating from it. It's the work your Hampton loss pointed you to, with no reefer leg.",
      },
    },
    limits: [
      "The license line: no driver holds a hazmat endorsement, and the bond amount is not stated.",
      "Fuel: five fixed-price years with no adjustment clause.",
      "PM and Alternate: not named yet.",
    ],
    wouldChange: [
      "If VA says the license line means a hazmat endorsement for every driver, I'd move this to Look closer.",
      "If VA adds a fuel adjustment, your biggest price risk goes away and this gets stronger.",
    ],
    nextMove: {
      label: "Build the quote with Ava",
      to: "/ava/36C24627Q0088",
      rationale: "24 days is enough. Ava needs your PM and Alternate, which trucks run the routes and how you answer the license line.",
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "SBA VetCert, service-disabled veteran-owned", status: "have", note: "Certified Dec 2023. Eligibility ends in 47 days; the renewal window is open." },
      { requirement: "Registered under NAICS 484110", status: "have", note: "Your primary code." },
      { requirement: "USDOT and MC authority", status: "have", note: "Since 2017." },
      { requirement: "Hazardous material license number", status: "missing", note: "No driver holds a hazmat endorsement. Ask in Q&A which license they mean." },
      { requirement: "Bonded drivers who pass VA background checks", status: "partial", note: "The bond amount isn't stated. Ask in Q&A." },
      { requirement: "Named PM and Alternate", status: "missing", note: "Not named yet. Ava asks who." },
      { requirement: "Service Contract Act wage determination 2015-4377", status: "have", note: "Truck drivers at $24.03 an hour plus $5.92 health and welfare; you pay above it." },
    ],
    redTeam: [
      {
        challenge: "Can 12 drivers cover two daily routes and the Quarry Lane and Cypress Bend runs?",
        answer: "Yes, with the third box truck as the spare. Name which two drivers run the VA routes and who covers a sick day.",
      },
      {
        challenge: "Will the carrier already on VA's other routes quote lower?",
        answer: "It may try. Your yard is across town from the warehouse, so you carry no empty miles to the first stop; that's your price edge.",
      },
    ],
    keyDates: [
      { label: "Q&A closes", inDays: 9 },
      { label: "Quotes due", inDays: 24 },
    ],
    railBriefing: [
      "I read the quote papers, the price schedule and wage determination 2015-4377.",
      "It is a strong fit. Two items need you before Q&A closes.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my quote say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. Ask the contract specialist which license the hazardous material line means and what bond drivers need, and whether VA will add a fuel adjustment. Q&A closes in 9 days, and every bidder sees the answers.",
      "Where am I weak?":
        "The license line and fuel. None of your drivers holds a hazmat endorsement, and five fixed-price years of diesel is unpriced risk. Ask both questions before you price it.",
      "What should my quote say?":
        "Your two routes, truck by truck, and the spare. Name your PM and Alternate, show GPS on every truck, and state your diesel base price if VA won't add a fuel clause. Ava will fill the price schedule in that order.",
      "Can I win it?":
        "No one can promise that. What I can say: only service-disabled veteran-owned firms can quote, your yard is across town from the warehouse, and you already run daily clinic routes.",
      "Do I need a bond?":
        "Not a bid or performance bond. The VA wants bonded drivers but doesn't say the amount, so ask in Q&A with the license question.",
      "Do I have enough time?":
        "Yes. 24 days, and Ava needs about 2 hours of your answers. The items with a lead time are the Q&A answers and your drivers' background checks.",
    },
  },
];
