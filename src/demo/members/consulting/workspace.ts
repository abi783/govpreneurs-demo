// THE CONSULTANT, part 2 (read through src/demo/story/workspace.ts): Simone's
// work in progress — closed pursuits, mentor reviews, wallet and tasks.
// Source: demo-storyboard/consulting-pack.md, sections 11 and 12.
//
// The hero (the Fayetteville VA supervisor program) starts with NO mentor
// review: Tim sends it live on the call, and the presenter's "Diana answers"
// control plays the day forward. The threads below show the other two
// verdicts, Discuss and Pass, so all three are on screen.

import { HERO_IDS } from "./opportunities";
import { PERSONA } from "../../story/persona";
import type {
  ClosedPursuit,
  ClosedPursuitDetail,
  MentorReviewStory,
  StoryTask,
  ThreadMessageStory,
  WalletStory,
} from "../../story/workspace";

/** Pursuits whose opportunity is no longer open, so it is not in the feed. */
export const CLOSED_PURSUITS: ClosedPursuit[] = [
  {
    id: "W91247-26-Q-0388",
    title: "Family readiness staff and volunteer training — Fort Bragg Army Community Service",
    agency: "Department of the Army",
    stage: "submitted",
    value: 68_000,
    note: "Submitted 6 days ago. The Army expects to award in about 3 weeks.",
    daysAgo: 6,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "W91247-25-P-A061",
    title: "Lean review and staff training — Fort Bragg Army Community Service",
    agency: "Department of the Army",
    stage: "won",
    value: 118_400,
    note: "Won and delivered. Your first federal prime contract; no performance rating yet.",
    daysAgo: 202,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "HARCO-CS-2026-01",
    title: "Compensation strategy study — Harnett County",
    agency: "Harnett County, NC",
    stage: "not_awarded",
    value: 74_000,
    note: "Not awarded. Your price was second lowest; the debrief is in your notes.",
    daysAgo: 300,
    next: { label: "Read the debrief", to: "/pipeline" },
    scope: "sled",
  },
];

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-usar-prime",
    oppId: "W91247-27-R-0034",
    title: "Should I prime the Army Reserve analyst contract?",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Let's talk first. It's a staffing contract: full-time analysts at the Reserve's headquarters for five years. Bring your hiring plan and your wrap rate.",
    price: 97,
  },
  {
    id: "rev-oshr-pass",
    oppId: "OSHR-TD-2027-02",
    title: "Should I go after the state supervisor curriculum?",
    status: "closed",
    unread: false,
    openedDaysAgo: 9,
    lastMessageDaysAgo: 8,
    outcome: "Pass. Statewide work for Raleigh at $300K is a reach this year. Finish the VA program and use it as your reference.",
    price: 97,
  },
  {
    id: "rev-cpars-howto",
    oppId: null,
    title: "How do I ask for an interim CPARS on the ACS job?",
    status: "closed",
    unread: false,
    openedDaysAgo: 41,
    lastMessageDaysAgo: 38,
    outcome:
      "Email the contracting officer, copy the COR, name the contract and dates, and ask for an interim evaluation. Diana sent a template.",
    price: 0,
  },
];

export const WALLET: WalletStory = {
  balance: 306,
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — state supervisor curriculum", amount: -97, daysAgo: 9 },
    { label: "Mentor review — Army Reserve analysts", amount: -97, daysAgo: 2 },
  ],
};

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-va-program",
    title: "Answer Ava's 3 questions on the Fayetteville VA supervisor program",
    why: "Ava can't finish the quote without your program leads, who teaches the cohorts and how you meet the coach credential.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.hero}`,
    source: "ava",
  },
  {
    id: "task-count-hours",
    title: "Count W-2 and 1099 hours for the VA program",
    why: "At most half of what VA pays may go to firms that aren't certified veteran-owned. Your 1099 facilitators may count against that.",
    dueInDays: 5,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-halyard-point",
    title: "Reply to Halyard Point Human Capital about the Army training",
    why: "Grant says team up. They want a veteran-owned trainer near Fort Bragg for the Southeast classes.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "partners",
  },
  {
    id: "task-coach-question",
    title: "Send the coach question before Q&A closes",
    why: "Ask whether an ICF ACC with 100+ hours coaching federal supervisors counts as PCC \"or equal\". Q&A closes in 8 days.",
    dueInDays: 6,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-interim-cpars",
    title: "Request the interim CPARS on the ACS job",
    why: "Your Fort Bragg ACS job has no rating yet. An interim one gives every Army quote a reference.",
    dueInDays: 10,
    done: false,
    to: "/mentors/rev-cpars-howto",
    source: "mentor",
  },
  {
    id: "task-sub-certificate",
    title: "Sign the subcontracting certificate with the quote",
    why: "VA wants the 50% certificate signed and sent in with your quote.",
    dueInDays: 23,
    done: false,
    to: `/opportunities/${HERO_IDS.hero}`,
    source: "grant",
  },
  {
    id: "task-vetcert-renewal",
    title: "Renew your SBA VetCert",
    why: "Your eligibility ends 14 Jan 2027, in 87 days. The renewal window is open, and VA checks it at award.",
    dueInDays: 30,
    done: false,
    to: "/my-business",
    source: "roadmap",
  },
  {
    id: "task-gsa-offer",
    title: "Start the GSA schedule offer",
    why: "The Fort Bragg manpower order showed the cost of not having one. You need two years of financials and three references.",
    dueInDays: 30,
    done: false,
    to: "/my-business",
    source: "roadmap",
  },
];

/** Diana's written threads, keyed by review id (MENTOR_REVIEWS). */
export const MENTOR_THREADS: Record<string, ThreadMessageStory[]> = {
  "rev-usar-prime": [
    {
      author: "member",
      daysAgo: 2,
      hour: 7,
      html: "<p>Hi Diana — MICC Fort Bragg has an analyst contract for the Army Reserve's headquarters, small-business set-aside, about $925K a year for five years. I know the headquarters and the work. Should I prime it?</p>",
      attachments: ["Coppervale-USAR-analysts-first-look.pdf"],
    },
    {
      author: "mentor",
      daysAgo: 0,
      hour: 9,
      html: "<p>Simone, <strong>let's talk first</strong>. It's a staffing contract: full-time analysts at the Reserve's headquarters for five years. That's about 60% of your revenue in people you'd have to hire before day one.</p><p>Book 20 minutes with me and bring your hiring plan and your wrap rate. We'll see if prime is real. — Diana</p>",
    },
  ],
  "rev-oshr-pass": [
    {
      author: "member",
      daysAgo: 9,
      hour: 6,
      html: "<p>Diana, the Office of State Human Resources wants its statewide supervisor curriculum redesigned, $250K–$350K. It's our kind of work. Worth a try?</p>",
    },
    {
      author: "mentor",
      daysAgo: 8,
      hour: 14,
      html: "<p><strong>Pass.</strong> Statewide work for Raleigh at $300K is a reach this year: about twice your usual job, and they'll want a state reference you don't have yet. Finish the VA program and use it as your reference next time. — Diana</p>",
    },
    { author: "member", daysAgo: 8, hour: 16, html: "<p>Understood. Passing, and I'll put the VA program first.</p>" },
  ],
  "rev-cpars-howto": [
    {
      author: "member",
      daysAgo: 41,
      hour: 7,
      html: "<p>Our ACS job at Fort Bragg ended, but there's no CPARS yet. How do I ask for one?</p>",
    },
    {
      author: "mentor",
      daysAgo: 38,
      hour: 14,
      html: "<p>Email the contracting officer and copy the COR. Name the contract (W91247-25-P-A061) and its dates, and ask for an interim evaluation. Keep it short and add your results: walk-in waits fell from 38 to 14 minutes. I've attached a template.</p>",
      attachments: ["Interim-CPARS-request-template.docx"],
    },
  ],
};

/** Her verdict on each thread that has one. */
export const MENTOR_RECOMMENDATIONS: Record<string, "pursue" | "discuss" | "pass"> = {
  "rev-usar-prime": "discuss",
  "rev-oshr-pass": "pass",
};

/** What each closed pursuit's dialog on the Pipeline says. */
export function closedPursuitDetail(id: string, daysAgo: number): ClosedPursuitDetail | null {
  if (id === "W91247-26-Q-0388") {
    return {
      heading: "What you sent",
      lead: `You sent your quote ${daysAgo} days ago. The Army expects to award in about 3 weeks.`,
      points: [
        "Four half-day classes for family readiness staff and volunteers, taught at ACS.",
        "Your team: you as program manager and two W-2 trainers.",
        "Your references: the ACS Lean review and the Halyard Point family readiness classes.",
        "Your price: $68,000.",
      ],
      link: { label: "See Fort Bragg work coming up", to: "/forecasts" },
    };
  }
  if (id === "HARCO-CS-2026-01") {
    return {
      heading: "Debrief",
      lead: "The county picked another firm. Your price was the second lowest, and your project plan scored highest.",
      points: [
        "You lost on similar work: the county wanted three NC local pay studies, and you showed one.",
        "Next time, bid as a team with a firm that has done county pay studies, or build two smaller ones first.",
        `${PERSONA.ownerFirstName}, PWC has manager training for its new pay plan on your list now. It's a small step toward that record.`,
      ],
      link: { label: "See the PWC training", to: "/opportunities/PWC2627018" },
    };
  }
  if (id === "W91247-25-P-A061") {
    return {
      heading: "Award",
      lead: "You won this contract and delivered it. It was your first federal prime contract. The value was $118,400.",
      points: [
        "A Lean review of the ACS front desk and appointment flow, then Lean basics for 40 ACS staff.",
        "Walk-in waits fell from 38 to 14 minutes. The Army hasn't written its performance rating yet.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return null;
}
