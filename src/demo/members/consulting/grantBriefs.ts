// THE CONSULTANT's Grant briefs (read through src/demo/story/grantBriefs.ts).
// The hero brief follows the pack (demo-storyboard/consulting-pack.md,
// section 3) and the Fayetteville VA leadership training buys it is modeled on.
// It must agree with the facts in persona.ts and opportunities.ts.
//
// Whether a 1099 facilitator counts as a subcontractor turns on SBA's employee
// test (13 CFR 121.106), so Grant says "may count", never "counts".

import type { GrantBrief } from "../../story/grantBriefs";

export const GRANT_BRIEFS: GrantBrief[] = [
  // ── HERO: supervisor leadership program, Fayetteville VA — Bid as prime ──
  {
    oppId: "36C24627Q0094",
    confidence: 4,
    gist: "Your work, your set-aside and your town.",
    thesis:
      "This is the program you already run, for a buyer that sets it aside for service-disabled veteran-owned firms, 3 miles from your office. Two things need fixing before you quote.",
    reads: {
      "Is it your kind of work?": {
        rating: "strong",
        text: "Cohorts of new supervisors with classroom days, a 360 and coaching each. That is your nurse-manager academy, for a federal buyer.",
      },
      "Does the size fit?": {
        rating: "strong",
        text: "About $200K a year, about 13% of your revenue, inside your usual job size.",
      },
      "Can you perform there?": {
        rating: "strong",
        text: "The Fayetteville VA Medical Center is 3 miles from your office. Wilmington is 90 miles, for some cohort days.",
      },
      "Can you do the work?": {
        rating: "watch",
        text: "The coaches need an ICF PCC \"or equal\". You have one PCC and two ACC coaches. Ask in Q&A whether an ACC with 100+ hours coaching federal supervisors counts.",
      },
      "Can you win it?": {
        rating: "good",
        text: "Only service-disabled veteran-owned firms can quote. The last two Fayetteville VA leadership buys went to a firm like yours, at $153K and $195K.",
      },
      "Will you make money?": {
        rating: "good",
        text: "Price your facilitators near the GSA median ($146 an hour) and your coaches below the executive coach median. Four cohorts of 30 carry the cost of the 360s.",
      },
      "Can you survive winning?": {
        rating: "watch",
        text: "At most half of what VA pays may go to firms that aren't certified veteran-owned. Two of your four cohort leads are 1099 facilitators, who may count as subcontractors.",
      },
      "Do you understand the buyer's intent?": {
        rating: "strong",
        text: "VA wants better supervisors, measured: the quarterly report ties each cohort to the All Employee Survey. Show how you'll report it.",
      },
      "Does this move you forward?": {
        rating: "strong",
        text: "A VA prime with option years, and a reference for every VA leadership buy in VISN 6 after it.",
      },
    },
    limits: [
      "The 50% rule: W-2 staff must carry at least half the paid hours, and you haven't counted them yet.",
      "The coach line: one PCC and two ACC coaches, against PCC \"or equal\".",
      "No performance rating yet on your ACS job.",
    ],
    wouldChange: [
      "If VA answers that ACC coaches don't meet \"or equal\" and you can't hire a PCC, I'd move this to Don't bid.",
      "If you move one facilitator to payroll before you quote, the 50% rule stops being a risk.",
    ],
    nextMove: {
      label: "Build the quote with Ava",
      to: "/ava/36C24627Q0094",
      rationale: "23 days is enough. Ava needs your program leads, who teaches the cohorts and how you meet the coach line.",
    },
    secondaryMove: { label: "Send to Diana for a second opinion", to: "/mentors" },
    compliance: [
      { requirement: "SAM registration active", status: "have", note: "Active for another 182 days." },
      { requirement: "SBA VetCert service-disabled veteran-owned certification", status: "have", note: "Certified 14 Jan 2024. Eligibility ends 14 Jan 2027; VA checks it at award." },
      { requirement: "Registered under NAICS 611430", status: "have", note: "One of your codes." },
      { requirement: "Limitations on subcontracting certificate (VAAR 852.219-75)", status: "partial", note: "Count W-2 and 1099 hours, then sign it with the quote." },
      { requirement: "Coaches with an ICF PCC or equal", status: "partial", note: "One PCC, two ACC. Ask in Q&A." },
      { requirement: "Named Program Manager and Lead Facilitator", status: "missing", note: "Not named yet. Ava asks who." },
      { requirement: "Quarterly report tied to the All Employee Survey", status: "have", note: "You report results this way for the hospital academy." },
    ],
    redTeam: [
      {
        challenge: "Can an 11-person firm teach four cohorts a year and keep the ACS work going?",
        answer: "Yes, if the cohorts are spread across the year. Put two W-2 leads on each cohort and keep one facilitator in reserve.",
      },
      {
        challenge: "Will a Durham firm that won VA's last leadership buys underbid you?",
        answer: "It may. You're 3 miles away, with no travel cost, and you ran HR for a corps. Say both.",
      },
    ],
    keyDates: [
      { label: "Q&A closes", inDays: 8 },
      { label: "Quotes due", inDays: 23 },
    ],
    railBriefing: [
      "I read the quote request and the Veterans First clauses.",
      "It is a strong fit. Two items need you before you quote.",
      "Ask me anything, or pick a question below.",
    ],
    chips: ["Can I fix this in time?", "Where am I weak?", "What should my quote say?"],
    railAnswers: {
      "Can I fix this in time?":
        "Yes. Count paid hours by person this week, and move one facilitator to payroll if W-2 staff carry less than half. Send the coach question before Q&A closes in 8 days.",
      "Where am I weak?":
        "The 50% rule and the coach line. Two of your four cohort leads are 1099 facilitators, who may count as subcontractors, and you have one PCC coach, not three.",
      "What should my quote say?":
        "Name your Program Manager and Lead Facilitator, show who teaches each cohort, and show how each cohort's results reach the quarterly report. Lead with your ACS job.",
      "Can I win it?":
        "No one can promise that. What I can say: only service-disabled veteran-owned firms can quote, and you're the closest one.",
      "Do I have enough time?":
        "Yes. 23 days, and Ava needs about 3 hours of your answers. The item with a deadline is the coach question: Q&A closes in 8 days.",
    },
  },
];
