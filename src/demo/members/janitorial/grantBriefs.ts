// THE JANITORIAL FIRM's Grant briefs (read through src/demo/story/grantBriefs.ts).
// The hero brief follows the pack (demo-storyboard/janitorial-pack.md, section 3)
// and the MICC Fort Bragg HUBZone pressure-washing RFQ it is modeled on. It must
// agree with the facts in persona.ts and opportunities.ts.

import type { GrantBrief } from "../../story/grantBriefs";

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO: Pressure washing and sandblasting, Fort Bragg — Bid as prime ──
  {
    oppId: "W9124727QA014",
    confidence: 4,
    gist: "Your work, your set-aside, and you've done it for the Air Force.",
    thesis:
      "This is a strong first Army prime for you: hot-water washing your exterior techs already do, about 10% of your revenue, 12 miles from your office, and open only to HUBZone firms.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Hot and cold washing of buildings, barracks, bridges and tanks, up to 3,500 psi, with the storm drains kept clear. That is the Seymour Johnson dorm job, on a bigger post.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $170K a year, roughly 10% of your revenue. Big enough to matter, small enough to carry.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "Fort Bragg is 12 miles from your office, and your crews are already badged for post.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Two gaps. Sandblasting is in the price \"in some extreme cases\", and you don't own a blaster. And a Priority 1 call needs a crew there in 2 hours, so you need a backup rig when both trailers are booked.",
      },
      "Can you win it?": {
        rating: "good",
        text: "Only HUBZone firms can quote, and the lowest technically acceptable price gets it. Six firms quoted in 2016 and again in 2021.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "One square-foot price for up to five years. The last award was $782,100 for five years, about 41¢ a square foot. Build up from the Cumberland County wage determination: General Maintenance Worker $21.41 plus $5.92 health and welfare. Wage increases are adjusted at each option; fuel, chemicals and equipment are not.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: "No bond. The Army pays in about 30 days, so carry five weeks of crew pay and fuel before the first payment.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "DPW wants exteriors cleaned so they last longer, child-safe chemicals at the child development centers, and a named Project Manager and QC manager it can reach from 7:00 to 3:30.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "Your first Army prime and a CPARS from it. DPW buys other exterior work, and this record carries to it.",
      },
    },
    limits: [
      "Sandblasting: no blaster, no signed sub rate, and no number yet for how much was blasted last year.",
      "The wage class: the Army listed General Maintenance Worker in 2021, but the class is your call until DPW says what it expects.",
      "Backup equipment: two rigs for a contract that requires a backup for 2-hour calls.",
    ],
    wouldChange: [
      "If the Q&A shows heavy sandblasting or lead-painted surfaces inside the square-foot price, I'd move this to Look closer.",
      "If DPW confirms a lower wage class, your floor drops and this gets stronger.",
    ],
    nextMove: {
      label: "Build the quote with Ava",
      to: "/ava/W9124727QA014",
      rationale: "21 days is enough. Ava needs your project and QC managers, your sandblasting plan and how you'll cover a 2-hour call.",
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "HUBZone certification", status: "have", note: "Certified by SBA in 2023. Recertification is due in 38 days." },
      { requirement: "Registered under NAICS 561790", status: "have", note: "One of your codes." },
      { requirement: "Named Project Manager and QC manager", status: "partial", note: "Reggie can be PM; no QC manager résumé on file. Ava asks who." },
      { requirement: "Sandblasting capability", status: "missing", note: "No blaster. Get a signed rate from a blasting sub." },
      { requirement: "Backup equipment for Priority 1 calls", status: "partial", note: "Two rigs, both often booked. Ava asks how you'll cover it." },
      { requirement: "Service Contract Act wage determination 2015-4377", status: "partial", note: "Ask DPW which class it expects." },
      { requirement: "General liability insurance", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: "Will the incumbent underprice you?",
        answer: "It may. It holds the work today and knows the real square footage. Ask for the historical workload sheet so you price the same work it does.",
      },
      {
        challenge: "Can a 38-person firm answer 2-hour calls on a post this size?",
        answer: "Yes, if one rig stays on post on weekdays. Your two exterior techs and a floor tech trained on the rig cover it.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: 8 },
      { label: "Quotes due", inDays: 21 },
      { label: "Work starts", inDays: 74 },
    ],
    railBriefing: [
      "I read the quote papers, the draft work statement and wage determination 2015-4377.",
      "It is a strong fit. Two items need you before quotes are due.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my quote say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. Send the sandblasting question before questions close in 8 days; every bidder sees the answer. Get a signed rate from a blasting sub, and ask DPW which wage class it expects.",
      "Where am I weak?":
        "Sandblasting and backup equipment. You don't own a blaster, and two rigs is thin for 2-hour calls. Fix both before you price it.",
      "What should my quote say?":
        "Lowest price technically acceptable, so be acceptable on every line and sharp on price. Name your Project Manager and QC manager, show your backup rig, and point to the Seymour Johnson dorms. Ava will fill the forms in that order.",
      "Can I win it?":
        "No one can promise that. What I can say: only HUBZone firms can quote, six did last time, and the lowest acceptable price gets it.",
      "Do I have enough time?":
        "Yes. 21 days, and Ava needs about 3 hours of your answers. The item with a lead time is the blasting sub's signed rate.",
    },
  },
];
