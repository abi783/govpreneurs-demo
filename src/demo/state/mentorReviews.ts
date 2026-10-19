// DEMO: mentor reviews — the story's three threads with Sarah Mitchell, plus
// any review the visitor sends during the demo. One state for Mentor Reviews,
// the Pipeline, the opportunity page and the forecast / small-order pages.

import { readDemoState, updateDemoState } from "@/demo/runtime/store";
import { isoDaysFromNow } from "@/demo/story/clock";
import { getOpportunity } from "@/demo/story/opportunities";
import { describeSaved } from "@/demo/state/workspace";
import { MENTOR, PERSONA } from "@/demo/story/persona";
import {
  MENTOR_RECOMMENDATIONS,
  MENTOR_REVIEWS,
  MENTOR_THREADS,
  type MentorReviewStory,
} from "@/demo/story/workspace";
import { mentorReplyFor, type MentorVerdict } from "@/demo/story/mentorReplies";
import type {
  MentorReviewSummary,
  MentorReviewThread,
  MentorThreadMessage,
} from "@/lib/mentorReviewsApi";

interface StoredReview {
  summary: MentorReviewSummary;
  messages: MentorThreadMessage[];
}

const KEY = "mentorReviews";

/** Makes ids unique even for two sends in the same millisecond. */
let seq = 0;

const STATUS: Record<MentorReviewStory["status"], MentorReviewSummary["status"]> = {
  awaiting_mentor: "pending",
  mentor_replied: "responded",
  closed: "closed",
};

function msg(
  id: string,
  author: "member" | "mentor",
  daysAgo: number,
  hour: number,
  bodyHtml: string,
  attachments: { name: string; url: string | null }[] = [],
): MentorThreadMessage {
  return {
    id,
    author,
    authorName: author === "mentor" ? MENTOR.name : PERSONA.ownerName,
    bodyHtml,
    at: isoDaysFromNow(-daysAgo, hour),
    attachments,
  };
}

/** The member's written threads (story/workspace.ts), as messages. */
function threadOf(reviewId: string): MentorThreadMessage[] {
  return (MENTOR_THREADS[reviewId] ?? []).map((m, i) =>
    msg(`m${i + 1}`, m.author, m.daysAgo, m.hour, m.html, (m.attachments ?? []).map((name) => ({ name, url: null }))),
  );
}

function initial(): StoredReview[] {
  return MENTOR_REVIEWS.map((r) => {
    const messages = threadOf(r.id);
    const last = messages[messages.length - 1];
    const opp = r.oppId ? getOpportunity(r.oppId) : undefined;
    return {
      summary: {
        id: r.id,
        oppKey: r.oppId,
        oppResolved: Boolean(opp),
        sourceType: null,
        solNumber: r.oppId,
        title: r.title,
        status: STATUS[r.status],
        recommendation: MENTOR_RECOMMENDATIONS[r.id] ?? null,
        mentorName: MENTOR.name,
        createdAt: isoDaysFromNow(-r.openedDaysAgo, 10),
        lastMessageAt: last?.at ?? isoDaysFromNow(-r.lastMessageDaysAgo, 10),
        lastMessageAuthor: last?.author ?? "mentor",
        lastMessagePreview: last ? last.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140) : "",
        unread: r.unread,
      },
      messages,
    };
  });
}

function all(): StoredReview[] {
  return readDemoState<StoredReview[]>(KEY, initial);
}

function update(fn: (prev: StoredReview[]) => StoredReview[]): void {
  updateDemoState<StoredReview[]>(KEY, initial, fn);
}

export function listMentorReviews(): MentorReviewSummary[] {
  return all()
    .map((r) => r.summary)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export function getMentorReviewThread(id: string): MentorReviewThread | null {
  const r = all().find((x) => x.summary.id === id);
  return r ? ({ ...r.summary, messages: r.messages } as MentorReviewThread) : null;
}

export function findReviewByOppKey(oppKey: string): MentorReviewSummary | null {
  return all().find((r) => r.summary.oppKey === oppKey)?.summary ?? null;
}

export function markReviewViewed(id: string): void {
  update((prev) => prev.map((r) => (r.summary.id === id ? { ...r, summary: { ...r.summary, unread: false } } : r)));
}

export function addMemberReply(id: string, bodyHtml: string, attachmentNames: string[]): MentorThreadMessage | null {
  let created: MentorThreadMessage | null = null;
  update((prev) =>
    prev.map((r) => {
      if (r.summary.id !== id) return r;
      created = {
        id: `m-${Date.now()}-${++seq}`,
        author: "member",
        authorName: PERSONA.ownerName,
        bodyHtml: bodyHtml || "<p>(attachment)</p>",
        at: new Date().toISOString(),
        attachments: attachmentNames.map((name) => ({ name, url: null })),
      };
      return {
        summary: {
          ...r.summary,
          status: r.summary.status === "closed" ? "closed" : "pending",
          lastMessageAt: created.at,
          lastMessageAuthor: "member",
          lastMessagePreview: bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140),
        },
        messages: [...r.messages, created],
      };
    }),
  );
  return created;
}

/** A new review the visitor sends from an opportunity, forecast or small order. */
export function createReview(input: { oppKey: string; title: string; message: string; sourceType?: string | null }): MentorReviewSummary {
  const existing = findReviewByOppKey(input.oppKey);
  if (existing) return existing;
  const now = new Date().toISOString();
  const first: MentorThreadMessage = {
    id: `m-${Date.now()}-${++seq}`,
    author: "member",
    authorName: PERSONA.ownerName,
    bodyHtml: input.message ? `<p>${escapeHtml(input.message)}</p>` : "<p>Could you review this one for me?</p>",
    at: now,
    attachments: [],
  };
  const summary: MentorReviewSummary = {
    id: `rev-${Date.now()}-${++seq}`,
    oppKey: input.oppKey,
    // DEMO: forecasts and small orders are records too, so their reviews link back.
    oppResolved: Boolean(getOpportunity(input.oppKey)) || describeSaved(input.oppKey) !== null,
    sourceType: input.sourceType ?? null,
    solNumber: input.oppKey,
    title: input.title,
    status: "pending",
    recommendation: null,
    mentorName: MENTOR.name,
    createdAt: now,
    lastMessageAt: now,
    lastMessageAuthor: "member",
    lastMessagePreview: first.bodyHtml.replace(/<[^>]+>/g, " ").trim().slice(0, 140),
    unread: false,
  };
  update((prev) => [...prev, { summary, messages: [first] }]);
  return summary;
}

/** Reviews still waiting for Sarah, newest first. */
export function pendingReviews(): MentorReviewSummary[] {
  return listMentorReviews().filter((r) => r.status === "pending");
}

/**
 * DEMO (presenter control C1): Sarah answers a pending review. The presenter
 * shows a "One business day later" card first; this writes her reply into the
 * thread, so Mentor Reviews, the opportunity page and the Pipeline all agree.
 */
export function answerReview(id: string, verdict: MentorVerdict): MentorReviewSummary | null {
  let answered: MentorReviewSummary | null = null;
  update((prev) =>
    prev.map((r) => {
      if (r.summary.id !== id) return r;
      const at = new Date().toISOString();
      const bodyHtml = mentorReplyFor(r.summary.oppKey, verdict);
      const reply: MentorThreadMessage = {
        id: `m-${Date.now()}-${++seq}`,
        author: "mentor",
        authorName: MENTOR.name,
        bodyHtml,
        at,
        attachments: [],
      };
      answered = {
        ...r.summary,
        status: "responded",
        recommendation: verdict,
        lastMessageAt: at,
        lastMessageAuthor: "mentor",
        lastMessagePreview: bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140),
        unread: true,
      };
      return { summary: answered, messages: [...r.messages, reply] };
    }),
  );
  return answered;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
