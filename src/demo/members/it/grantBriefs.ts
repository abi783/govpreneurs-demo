// THE IT SERVICES FIRM's Grant briefs (read through src/demo/story/grantBriefs.ts).
// The hero brief follows the pack (demo-storyboard/it-services-pack.md,
// section 3) and the competed USARC 8(a) buys it is modeled on. It must agree
// with the facts in persona.ts and opportunities.ts.

import type { GrantBrief } from "../../story/grantBriefs";

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO: Army Reserve headquarters help desk, Fort Bragg — Bid as prime ──
  {
    oppId: "W91247-27-Q-0131",
    confidence: 4,
    gist: "Your work, your size, and only 8(a) firms can quote.",
    thesis:
      "This is a strong next step for you: help desk and desk-side support your own techs already do on Army and Air Force networks, sized for a firm of 16, 12 miles from your office, and open only to 8(a) firms.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Tier 1 and Tier 2 support, imaging, asset tracking and video-conference rooms for about 1,900 users. It's the work you did in help-desk seats on Fort Bragg and do now at Seymour Johnson.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $620K a year, about a quarter of your revenue, for six techs and a site lead.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "Marshall Hall is 12 miles from your office, and your techs already work Army tickets.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Every tech with admin rights needs Security+ on day one. Two of the six you'd put there don't have it, and the phase-in is only 30 days.",
      },
      "Can you win it?": {
        rating: "good",
        text: "The Army Reserve competed its last big IT buy here as an 8(a) set-aside, and it drew six offers. You have a real shot if the staffing plan is solid.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "The wage determination for Cumberland County sets $37.50 an hour plus $5.92 health and welfare for a PC support technician. Fayetteville's median is $27.76. Quote below the floor and you pay the difference yourself.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: "Three new hires and a 30-day phase-in mean about $95K of payroll before the first payment, and you have no credit line.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The Army Reserve wants the desks covered from day one: six named techs, a site lead and alternate, and no gap at the handover.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A five-year Army prime with your own rating, before your 8(a) term ends in March 2030.",
      },
    },
    limits: [
      "Security+: two of the six techs don't hold it yet.",
      "The wage floor is about $10 an hour above what you pay now.",
      "Cash: about $95K of payroll before the first payment, with no credit line.",
    ],
    wouldChange: [
      "If the two techs can't sit Security+ before the start date and you can't hire certified ones, I'd move this to Don't bid.",
      "If the Army answers that it issues the laptops and tools, your price drops and this gets stronger.",
    ],
    nextMove: {
      label: "Build the quote with Ava",
      to: "/ava/W91247-27-Q-0131",
      rationale: "26 days is enough. Ava needs your site lead, your staffing plan and how you price the techs.",
    },
    secondaryMove: { label: "Send to Sarah for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "SBA 8(a) certification", status: "have", note: "In the program since March 2021; the term ends March 2030." },
      { requirement: "Registered under NAICS 541519", status: "have", note: "Your primary code." },
      { requirement: "Security+ (DoD 8140) for every tech with admin rights", status: "partial", note: "4 of the 6 have it. Book the other two exams this week." },
      { requirement: "Named site lead and alternate", status: "missing", note: "Not named yet. Ava asks who." },
      { requirement: "CMMC Level 1 (Self)", status: "have", note: "Affirmed in SPRS." },
      { requirement: "Service Contract Act wage determination", status: "partial", note: "Price every tech at or above $37.50 plus $5.92." },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
    ],
    redTeam: [
      {
        challenge: "Can a 16-person firm staff six more seats in 30 days?",
        answer: "Yes, if three come from your own techs and you hire three now. Backfill Seymour Johnson before you move anyone.",
      },
      {
        challenge: "Will a rival price every tech at exactly the floor, as Kettle Creek did on the Windows 11 surge?",
        answer: "Probably. Show the floor line by line, and put any premium only where the work statement asks for experience.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: 10 },
      { label: "Quotes due", inDays: 26 },
    ],
    railBriefing: [
      "I read the quote papers, the work statement and the wage determination for Cumberland County.",
      "It is a strong fit. Two items need you before quotes are due.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my quote say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. Book the two Security+ exams this week, and name all six techs in the quote. Send your question about laptops and tools before Q&A closes in 10 days; every bidder sees the answer.",
      "Where am I weak?":
        "Certifications and price. Two techs lack Security+, and the wage floor is about $10 an hour above your pay now. Fix both before you price it.",
      "What should my quote say?":
        "Name six techs and their certifications, your site lead and alternate, and a 30-day phase-in by week. Then show every tech priced at or above the wage floor, line by line.",
      "Can I win it?":
        "No one can promise that. What I can say: only 8(a) firms can quote, the last one like it drew six offers, and your techs already work Army tickets.",
      "Do I have enough time?":
        "Yes. 26 days, and Ava needs about 3 hours of your answers. The item with a lead time is the two Security+ exams.",
    },
  },
];
