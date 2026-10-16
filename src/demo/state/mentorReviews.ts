// DEMO: mentor reviews — the story's three threads with Sarah Mitchell, plus
// any review the visitor sends during the demo. One state for Mentor Reviews,
// the Pipeline, the opportunity page and the forecast / small-order pages.

import { readDemoState, updateDemoState } from "@/demo/runtime/store";
import { isoDaysFromNow } from "@/demo/story/clock";
import { getOpportunity } from "@/demo/story/opportunities";
import { describeSaved } from "@/demo/state/workspace";
import { MENTOR, PERSONA } from "@/demo/story/persona";
import { MENTOR_REVIEWS, type MentorReviewStory } from "@/demo/story/workspace";
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

/** The written threads. Keyed by review id from the story. */
const THREADS: Record<string, MentorThreadMessage[]> = {
  "rev-fayetteville-proposal": [
    msg("m1", "member", 2, 16,
      "<p>Hi Sarah — Ava finished my proposal for the Fayetteville Public Works cafe and events contract. It's due in two weeks. Could you read it before I send it? I'm most worried about section 2, our experience, because we have never run a daily cafe.</p>",
      [{ name: "Haddad-Catering-Fayetteville-proposal.docx", url: null }]),
    msg("m2", "mentor", 0, 9,
      "<p>Amira, this is a strong draft. Three changes before you send it:</p><ol><li><strong>Move your event work to the top of section 2.</strong> The city scores approach at 40%. Your church and county events are your best evidence; right now they are on page 6.</li><li><strong>Call the county summer program what it is: daily service.</strong> 1,100 meals a day for 11 weeks answers the \"never run a cafe\" worry better than any sentence about it.</li><li><strong>Name Janet Reyes as your first reference.</strong> Purchasing officers call the first name on the list.</li></ol><p>Your price is in the right place. Don't lower it. — Sarah</p>"),
  ],
  "rev-mackall-pursue": [
    msg("m1", "member", 3, 11,
      "<p>Sarah, Hunter put the Camp Mackall field meals quote at the top of my list and Grant says bid. Before Ava starts — should I pursue it? It would be my biggest federal job as prime.</p>"),
    msg("m2", "mentor", 2, 15,
      "<p><strong>Pursue it.</strong> It is woman-owned only, it has no incumbent, and it is sized for your kitchen. Two things this week:</p><ul><li>Get your last two cooks food-handler certified. The quote asks for proof for every cook.</li><li>Plan the 3:30 AM starts now, before you price it. Early starts cost overtime.</li></ul><p>Lead with your Carolina Dining Group work at Fort Bragg. Same base, same kind of work. — Sarah</p>"),
    msg("m3", "member", 2, 17, "<p>Thank you! Booking the food-handler course for Thursday.</p>"),
  ],
  "rev-womack-closeout": [
    msg("m1", "member", 38, 10,
      "<p>My Womack Army Medical Center contract ended, but there is no performance rating for it. How do I get one? Grant says it would help my next VA bid.</p>"),
    msg("m2", "mentor", 35, 14,
      "<p>Email the contracting officer and ask for an interim CPARS rating — CPARS is the federal performance rating system. Keep it short: the contract number, the dates, and one line on what you delivered. I've attached a template you can copy.</p>",
      [{ name: "CPARS-request-template.docx", url: null }]),
  ],
};

const RECOMMENDATION: Record<string, MentorReviewSummary["recommendation"]> = {
  "rev-mackall-pursue": "pursue",
  "rev-fayetteville-proposal": "discuss",
};

function initial(): StoredReview[] {
  return MENTOR_REVIEWS.map((r) => {
    const messages = THREADS[r.id] ?? [];
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
        recommendation: RECOMMENDATION[r.id] ?? null,
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
