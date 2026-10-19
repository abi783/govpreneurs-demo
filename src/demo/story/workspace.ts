// THE STORY, part 2: the member's work in progress — closed pursuits, mentor
// reviews, wallet and tasks. Open pursuits live on the opportunities themselves
// (opportunities.ts `pursuit`), so the Pipeline is the union of those and the
// closed ones. DEMO: the data is per member (src/demo/members/<member>/workspace.ts).

import { own } from "../member";
import type { PursuitStage } from "./opportunities";
import { MENTOR } from "./persona";

const MEMBER_FILES = import.meta.glob<typeof import("../members/agency/workspace")>("/src/demo/members/*/workspace.ts", { eager: true });
const member = own(MEMBER_FILES);

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
  /** Federal unless set: a county or city job is "sled". */
  scope?: "fed" | "sled";
}

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

export interface WalletEntry {
  label: string;
  /** Positive = money in, negative = spent. */
  amount: number;
  daysAgo: number;
}

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

/** One message in a story thread with the mentor. Dates count back from the day the demo opens. */
export interface ThreadMessageStory {
  author: "member" | "mentor";
  daysAgo: number;
  hour: number;
  html: string;
  attachments?: string[];
}

/** What a closed pursuit's dialog on the Pipeline says. */
export interface ClosedPursuitDetail {
  heading: string;
  lead: string;
  points: string[];
  link?: { label: string; to: string };
}

export interface WalletStory {
  /** Balance after the entries below. */
  balance: number;
  /** The price of one mentor review. */
  mentorReviewPrice: number;
  entries: WalletEntry[];
}

export const MENTOR_NAME = MENTOR.name;

export const CLOSED_PURSUITS: ClosedPursuit[] = member.CLOSED_PURSUITS;
export const MENTOR_REVIEWS: MentorReviewStory[] = member.MENTOR_REVIEWS;
export const WALLET: WalletStory = member.WALLET;
export const TASKS: StoryTask[] = member.TASKS;
export const MENTOR_THREADS = member.MENTOR_THREADS;
export const MENTOR_RECOMMENDATIONS = member.MENTOR_RECOMMENDATIONS;
export const closedPursuitDetail = member.closedPursuitDetail;
