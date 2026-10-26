// THE AGENCY's Grant briefs (read through src/demo/story/grantBriefs.ts).
// The hero brief follows the approved pack (demo-storyboard/marketing-agency-pack.md)
// and the real Family Advocacy work statement it is modeled on. It must agree
// with the facts in persona.ts and opportunities.ts.

import type { GrantBrief } from "../../story/grantBriefs";

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO: Family Advocacy print and digital campaign — Bid as prime ────
  {
    oppId: "W91247-27-Q-0108",
    confidence: 4,
    gist: "Your work, your size, and only woman-owned firms can bid.",
    thesis:
      "This is a strong next federal prime for you: the work your team already does, sized for nine people, 12 miles from your office, and open only to woman-owned firms.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Short videos, social, display and search ads, and print buying. That is your advertising code, and you ran the NC Guard's recruiting campaign the same way.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $215K a year. That is about 15% of your revenue: big enough to matter, small enough to staff from your current team.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "Fort Bragg is 12 miles from your office, and the campaign reaches families within 30 miles of post. Your crew can shoot on post the same day.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "Two things need you before the due date: the work statement asks for ads on the contractor's own mobile app, which you don't have, and five fixed-price years of weekly print in four papers.",
      },
      "Can you win it?": {
        rating: "good",
        text: "Only woman-owned firms can bid, and the last award for this work went to a local publisher, not an agency. Your video crew is what that firm didn't have.",
      },
      "Will you make money?": {
        rating: "watch",
        text: "Print is the risk. Five fixed-price years with no locked rates is where small agencies lose money. Lock rates with all four papers before you price it.",
      },
      "Can you survive winning?": {
        rating: "good",
        text: "No bond. The Army pays in about 30 days, so plan to carry about two months of print and media buys before the first payment.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "The Family Advocacy Program wants military families to know where to get help before a crisis. Reach and plain, trusted messages are scored first.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A second federal prime, at Fort Bragg, is the record you need for the larger Army Community Service work that follows.",
      },
    },
    limits: [
      "The app line: ads on the contractor's own mobile app. You have no app; unasked, it's a compliance gap.",
      "Print rates: five fixed-price years of weekly ads in four local papers, with no rates locked yet.",
      "Thin federal prime record: the NC Guard campaign is your only federal prime, and its performance rating is not written yet.",
    ],
    wouldChange: [
      "If the Army's answer says only the contractor's own app counts, I'd move this to Needs review.",
      "If a paper won't lock its rates, I'd price that paper's option years with a stated increase.",
    ],
    nextMove: {
      label: "Build the quote with Ava",
      to: "/ava/W91247-27-Q-0108",
      rationale: "24 days is enough. Ava needs your project manager, your video plan and one decision about the app line.",
    },
    secondaryMove: { label: "Send to Diana for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "Woman-owned small business (WOSB) certification", status: "have", note: "Certified in SBA's MySBA Certifications." },
      { requirement: "Registered under NAICS 541810", status: "have", note: "Your primary code." },
      { requirement: "Ads on the contractor's own mobile app", status: "missing", note: "Ask in Q&A whether a news partner's app counts." },
      { requirement: "Named project manager and alternate", status: "partial", note: "Résumés not on file yet." },
      { requirement: "Weekly ads in four local papers", status: "partial", note: "Rates not locked for the option years." },
      { requirement: "General liability insurance, $1M per occurrence", status: "have", note: "On file." },
      { requirement: "Two past-performance references", status: "have", note: "NC Army National Guard and City of Fayetteville." },
    ],
    redTeam: [
      {
        challenge: "Is a nine-person team enough for 24 videos plus weekly print and digital?",
        answer: "Yes. Two videos a month fits your crew; book one freelancer for the months you shoot on post.",
      },
      {
        challenge: "Could the local publisher that held it before undercut you on print?",
        answer: "Only if they are woman-owned: the set-aside limits bidders. Lock your print rates and they have no price edge on the papers.",
      },
    ],
    keyDates: [
      { label: "Questions due", inDays: 9 },
      { label: "Quotes due", inDays: 24 },
      { label: "Expected award", inDays: 45 },
    ],
    railBriefing: [
      "I read the quote request, the work statement and the wage determination.",
      "It is a strong fit. Two items need you before the due date.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my response say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. Ask the app question in Q&A this week; questions close in 9 days, and every bidder sees the answer. Get signed rate quotes from all four papers, locked for 12 months with a stated increase per option year.",
      "Where am I weak?":
        "Your federal prime record. The NC Guard campaign is your only federal prime and has no rating yet. Lead with it anyway: same Army, same audience. And ask the Guard for an interim rating.",
      "What should my response say?":
        "Three things, in this order: reach (how you find families within 30 miles of post), the videos (your crew and a two-a-month plan), and trust (plain, captioned messages tested with families). Ava will draft it in that order.",
      "Can I win it?":
        "No one can promise that. What I can say: only woman-owned firms can bid, the last holder was a publisher without a video crew, and your record matches what the Army scores first.",
      "Do I have enough time?":
        "Yes. 24 days, and Ava needs about 3 hours of your answers. The items with a lead time are the app question and the print quotes.",
    },
  },
];
