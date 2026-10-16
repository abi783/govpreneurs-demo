// DEMO: Ava's view of the mentor reviews.
//
// The prototype kept its own review list (lib/mentorReviews). The demo has one:
// src/demo/state/mentorReviews.ts holds Sarah Mitchell's threads, and sending a
// review there charges the wallet (src/demo/state/wallet.ts, $97). This file
// reads that list in the shape Ava was built on, and sends through it, so the
// Mentor Reviews page, the wallet and Ava always agree.
//
// Three kinds of review can exist for one bid (the prototype's "subject"):
//   · "opportunity": Sarah's read of the opportunity, sent from Grant's page;
//   · "bid": Sarah's read of the bid Ava built, sent from Ava;
//   · "paused": a question about a rule she cannot meet, sent from Ava.
// The shared list holds one thread for each opportunity key. A bid or paused
// review of Ava's is kept under the key `<noticeId>:bid` or `<noticeId>:paused`,
// so it never replaces the thread that Grant's page sent.

import { bus } from "../../lib/eventBus";
import { readDemoState, subscribeDemoState, updateDemoState } from "../runtime/store";
import { MENTOR as STORY_MENTOR, PERSONA } from "../story/persona";
import {
  addMemberReply,
  createReview as createSharedReview,
  findReviewByOppKey,
  getMentorReviewThread,
  listMentorReviews,
} from "../state/mentorReviews";
import { chargeWallet, getWalletBalance, MENTOR_REVIEW_PRICE } from "../state/wallet";
import type { MentorReviewSummary, MentorThreadMessage } from "../../lib/mentorReviewsApi";

export type MentorReviewStatus = "pending" | "responded" | "closed";
export type ReviewSubject = "opportunity" | "bid" | "paused";

export interface MentorMessage {
  id: string;
  from: "member" | "mentor";
  authorName: string;
  /** May contain light inline HTML (p, b, ul, li, ol, br). */
  body: string;
  sentAt: string;
  attachments?: Array<{ name: string; type: string }>;
}

export interface MentorReview {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  status: MentorReviewStatus;
  sentAt: string;
  memberNote?: string;
  grantVerdictSnapshot: { verdict: string; rationale: string };
  messages: MentorMessage[];
  mentorName?: string;
  mentorCredential?: string;
  lastViewedAt?: string;
  subject?: ReviewSubject;
  /** The mentor's call on an opportunity review. */
  verdict?: "pursue" | "dont-pursue";
}

/** The mentor in the story. One owner: every screen uses this name. */
export const MENTOR = { name: STORY_MENTOR.name, credential: STORY_MENTOR.title } as const;

/** How long a mentor usually takes, in business days, and the words for it. */
export const MENTOR_REPLY_DAYS = 1;
export const MENTOR_REPLY = "usually within 1 business day";

/** The price of one review, from the wallet. */
export const MENTOR_REVIEW_COST = MENTOR_REVIEW_PRICE;
export { getWalletBalance };

/** Story threads that are about a bid, not about an opportunity. */
const BID_THREADS: Record<string, string> = {
  "rev-fayetteville-proposal": "FAYNC-2026-R-08",
};

// ─── Reading the shared list ───

function split(oppKey: string | null): { id: string; subject: ReviewSubject } | null {
  if (!oppKey) return null;
  const m = /^(.*):(bid|paused)$/.exec(oppKey);
  return m ? { id: m[1], subject: m[2] as ReviewSubject } : { id: oppKey, subject: "opportunity" };
}

function subjectOf(s: MentorReviewSummary): { id: string; subject: ReviewSubject } | null {
  const bidFor = BID_THREADS[s.id];
  if (bidFor) return { id: bidFor, subject: "bid" };
  return split(s.oppKey);
}

function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const mapped = new WeakMap<MentorReviewSummary, { messages: unknown; review: MentorReview }>();

function toReview(s: MentorReviewSummary): MentorReview | null {
  const key = subjectOf(s);
  if (!key) return null;
  const thread = getMentorReviewThread(s.id);
  if (!thread) return null;
  const hit = mapped.get(s);
  if (hit && hit.messages === thread.messages) return hit.review;
  const messages: MentorMessage[] = thread.messages.map((m: MentorThreadMessage) => ({
    id: m.id,
    from: m.author,
    authorName: m.authorName,
    body: m.bodyHtml,
    sentAt: m.at,
    attachments: m.attachments.map((a) => ({ name: a.name, type: "file" })),
  }));
  const first = messages.find((m) => m.from === "member");
  const review: MentorReview = {
    id: s.id,
    opportunityId: key.id,
    opportunityTitle: s.title,
    status: s.status,
    sentAt: s.createdAt,
    memberNote: first ? plain(first.body) : undefined,
    grantVerdictSnapshot: { verdict: "Bid", rationale: "" },
    messages,
    mentorName: s.mentorName ?? MENTOR.name,
    mentorCredential: MENTOR.credential,
    lastViewedAt: s.unread ? undefined : s.lastMessageAt,
    subject: key.subject,
    verdict: key.subject === "opportunity" && s.recommendation === "pursue" ? "pursue" : undefined,
  };
  mapped.set(s, { messages: thread.messages, review });
  return review;
}

// ─── Reviews the prototype controls place (Shift+Alt+A) ───

const OVERRIDES = "ava.mentorOverrides";
type Overrides = Record<string, MentorReview>;
const overrideKey = (id: string, subject: ReviewSubject) => `${id}|${subject}`;

/** The review of an opportunity, of her bid for it, or of a paused rule. */
export function getReviewByOpportunity(
  noticeId: string,
  subject: ReviewSubject = "opportunity",
): MentorReview | null {
  const placed = readDemoState<Overrides>(OVERRIDES, {})[overrideKey(noticeId, subject)];
  if (placed) return placed;
  for (const s of listMentorReviews()) {
    const key = subjectOf(s);
    if (key && key.id === noticeId && key.subject === subject) return toReview(s);
  }
  return null;
}

// ─── Sending ───

export interface SendResult {
  review: MentorReview;
  /** False when a thread for this bid already existed: no new charge. */
  charged: boolean;
}

/** What a send would cost her now, and whether her wallet covers it. */
export function sendCheck(): { balance: number; cost: number; enough: boolean } {
  const balance = getWalletBalance();
  return { balance, cost: MENTOR_REVIEW_COST, enough: balance >= MENTOR_REVIEW_COST };
}

/** Sends a review to Sarah and charges the wallet once. A second send about
 *  the same thing finds the first and charges nothing. */
export function createReview(input: {
  opportunityId: string;
  opportunityTitle: string;
  verdict?: string;
  rationale?: string;
  note: string;
  subject?: ReviewSubject;
}): MentorReview {
  const subject = input.subject ?? "opportunity";
  const oppKey =
    subject === "opportunity" ? input.opportunityId : `${input.opportunityId}:${subject}`;
  const existing = findReviewByOppKey(oppKey);
  if (!existing) {
    const title =
      subject === "bid"
        ? `Review my bid: ${input.opportunityTitle}`
        : subject === "paused"
          ? `Help with a rule I cannot meet: ${input.opportunityTitle}`
          : `Review: ${input.opportunityTitle}`;
    const message =
      input.note.trim() ||
      (subject === "bid"
        ? "Sarah, I am sending you my whole bid. Ava built it and checked it. Could you read it before I send it?"
        : subject === "paused"
          ? "Sarah, I cannot meet one rule on this bid, so Ava paused it. Should I still bid?"
          : "Sarah, could you read this opportunity for me?");
    createSharedReview({ oppKey, title, message });
    chargeWallet(`Mentor review — ${input.opportunityTitle}`, MENTOR_REVIEW_PRICE);
  }
  bus.publish("mentorReviews");
  return getReviewByOpportunity(input.opportunityId, subject)!;
}

/** Adds her words to a conversation that is already open. No new charge. */
export function appendMessage(reviewId: string, body: string): void {
  const html = `<p>${body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n+/g, "</p><p>")}</p>`;
  addMemberReply(reviewId, html, []);
  bus.publish("mentorReviews");
}

// Any change to the shared list reaches Ava's live readers.
subscribeDemoState("mentorReviews", () => bus.publish("mentorReviews"));

/** PROTOTYPE CONTROLS ONLY: place a review as the mentor dashboard would leave
 *  it. The product has no such path: reviews come from the member sending and
 *  the mentor answering. */
export const demoMentor = {
  set(review: MentorReview) {
    updateDemoState<Overrides>(OVERRIDES, {}, (prev) => ({
      ...prev,
      [overrideKey(review.opportunityId, review.subject ?? "opportunity")]: review,
    }));
    bus.publish("mentorReviews");
  },
  clear(noticeId: string) {
    updateDemoState<Overrides>(OVERRIDES, {}, (prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (k.startsWith(`${noticeId}|`)) delete next[k];
      return next;
    });
    bus.publish("mentorReviews");
  },
  /** A mentor's message, as the dashboard sends it. */
  message(body: string, sentAt: string): MentorMessage {
    return { id: `m_demo_${sentAt}`, from: "mentor", authorName: MENTOR.name, body, sentAt };
  },
  member: PERSONA.ownerName,
};
