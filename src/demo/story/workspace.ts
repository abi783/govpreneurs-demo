// THE STORY, part 2: Amira's work in progress — closed pursuits, mentor
// reviews, wallet and tasks. Open pursuits live on the opportunities
// themselves (opportunities.ts `pursuit`), so the Pipeline is the union of
// those and the closed ones below.

import { HERO_IDS } from "./opportunities";
import type { PursuitStage } from "./opportunities";
import { MENTOR } from "./persona";

/** Pursuits whose opportunity is no longer open, so it is not in the feed. */
export interface ClosedPursuit {
  id: string;
  title: string;
  agency: string;
  stage: Extract<PursuitStage, "submitted" | "won" | "not_awarded">;
  value: number;
  note: string;
  /** Days since the last event (submission, award, or loss). */
  daysAgo: number;
  next: { label: string; to: string };
}

export const CLOSED_PURSUITS: ClosedPursuit[] = [
  {
    id: "W912PM-26-Q-0009",
    title: "Holiday event catering — Fort Bragg MWR",
    agency: "Department of the Army",
    stage: "submitted",
    value: 96_000,
    note: "Submitted 6 days ago. The Army expects to award in about 3 weeks.",
    daysAgo: 6,
    next: { label: "See what you sent", to: "/pipeline" },
  },
  {
    id: "W81K04-24-Q-0187",
    title: "Patient meal support — Womack Army Medical Center",
    agency: "Department of the Army",
    stage: "won",
    value: 126_000,
    note: "Won and delivered. Your first federal prime contract.",
    daysAgo: 140,
    next: { label: "Add it to My Business", to: "/my-business" },
  },
  {
    id: "FA4800-26-Q-0007",
    title: "Lodging breakfast service — Seymour Johnson AFB",
    agency: "Department of the Air Force",
    stage: "not_awarded",
    value: 188_000,
    note: "Not awarded. Lost on price by about 4%; the debrief is in your notes.",
    daysAgo: 45,
    next: { label: "Read the debrief notes", to: "/pipeline" },
  },
];

export type MentorReviewStatus = "awaiting_mentor" | "mentor_replied" | "closed";

export interface MentorReviewStory {
  id: string;
  /** Opportunity id, or null for a general question. */
  oppId: string | null;
  title: string;
  status: MentorReviewStatus;
  /** True when Sarah's latest reply is unread. */
  unread: boolean;
  openedDaysAgo: number;
  lastMessageDaysAgo: number;
  /** What Sarah concluded, in one line. The thread itself is written in
   *  the Mentor Reviews page's data file. */
  outcome: string;
  /** Wallet charge for the review. */
  price: number;
}

export const MENTOR_REVIEWS: MentorReviewStory[] = [
  {
    id: "rev-fayetteville-proposal",
    oppId: "FAYNC-2026-R-08",
    title: "Review my Fayetteville Public Works proposal",
    status: "mentor_replied",
    unread: true,
    openedDaysAgo: 2,
    lastMessageDaysAgo: 0,
    outcome:
      "Strong draft. Move the event-catering examples to the top of section 2, and name Janet Reyes as your first reference.",
    price: 97,
  },
  {
    id: "rev-mackall-pursue",
    oppId: HERO_IDS.fieldMeals,
    title: "Should I pursue Camp Mackall field meals?",
    status: "closed",
    unread: false,
    openedDaysAgo: 3,
    lastMessageDaysAgo: 2,
    outcome: "Pursue it. Get your last two cooks food-handler certified this week.",
    price: 97,
  },
  {
    id: "rev-womack-closeout",
    oppId: null,
    title: "How do I get a performance rating for my Womack contract?",
    status: "closed",
    unread: false,
    openedDaysAgo: 38,
    lastMessageDaysAgo: 35,
    outcome:
      "Email the contracting officer and ask for an interim CPARS rating. Sarah sent a template.",
    price: 0,
  },
];

export const MENTOR_NAME = MENTOR.name;

export interface WalletEntry {
  label: string;
  /** Positive = money in, negative = spent. */
  amount: number;
  daysAgo: number;
}

export const WALLET = {
  /** Balance after the entries below. */
  balance: 306,
  /** The price of one mentor review. */
  mentorReviewPrice: 97,
  entries: [
    { label: "Wallet top-up", amount: 500, daysAgo: 20 },
    { label: "Mentor review — Camp Mackall field meals", amount: -97, daysAgo: 3 },
    { label: "Mentor review — Fayetteville Public Works proposal", amount: -97, daysAgo: 2 },
  ] satisfies WalletEntry[],
} as const;

export interface StoryTask {
  id: string;
  title: string;
  why: string;
  dueInDays: number | null;
  done: boolean;
  /** Where the task's button takes her. */
  to: string;
  source: "ava" | "mentor" | "roadmap" | "grant" | "partners";
}

export const TASKS: StoryTask[] = [
  {
    id: "task-ava-mackall",
    title: "Answer Ava's 3 questions on Camp Mackall field meals",
    why: "Ava can't finish the quote without your delivery times and staffing plan.",
    dueInDays: 3,
    done: false,
    to: `/ava/${HERO_IDS.fieldMeals}`,
    source: "ava",
  },
  {
    id: "task-certificates",
    title: "Upload food-handler certificates for your last 2 cooks",
    why: "Cumberland County needs one for every cook. Ava paused that bid until you upload them.",
    dueInDays: 7,
    done: false,
    to: "/ava/CUMCO-2026-014",
    source: "ava",
  },
  {
    id: "task-read-sarah",
    title: "Read Sarah's notes on your Fayetteville proposal",
    why: "She replied today. The proposal is due in 14 days.",
    dueInDays: 2,
    done: false,
    to: "/mentors/rev-fayetteville-proposal",
    source: "mentor",
  },
  {
    id: "task-send-reply",
    title: "Send your Fort Bragg sources-sought reply",
    why: "Ava drafted it. A reply costs nothing and can shape the next dining contract.",
    dueInDays: 10,
    done: false,
    to: "/ava/W912EE-27-S-0004",
    source: "ava",
  },
  {
    id: "task-contact-cdg",
    title: "Contact Carolina Dining Group about Fort Bragg dining",
    why: "Grant says this is a team bid. They are looking for woman-owned subcontractors.",
    dueInDays: 5,
    done: false,
    to: "/partners",
    source: "grant",
  },
  {
    id: "task-targeting-call",
    title: "Book your quarterly targeting call with Sarah",
    why: "Plan your next quarter of bids around Fort Bragg and the VA.",
    dueInDays: 14,
    done: false,
    to: "/roadmap",
    source: "roadmap",
  },
  {
    id: "task-cap-statement",
    title: "Upload your capability statement",
    why: "Hunter uses it to explain every match.",
    dueInDays: null,
    done: true,
    to: "/my-business",
    source: "roadmap",
  },
  {
    id: "task-positioning-call",
    title: "Positioning call with Sarah",
    why: "Sarah set your targets: Fort Bragg, the VA and NC school districts.",
    dueInDays: null,
    done: true,
    to: "/roadmap",
    source: "roadmap",
  },
];
