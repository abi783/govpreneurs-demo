// Mentor reviews — real API client + shared store for the /mentors chat
// surface. Replaces the in-memory mock (`lib/mentorReviews.ts`, still used by
// tasks.ts / mock/bids.ts until Phase B) with the backend contract frozen in
// MENTOR_CHAT_PLAN.md:
//
//   GET  /mentor-reviews
//   GET  /mentor-reviews/:id
//   POST /mentor-reviews/:id/reply       (multipart: body + attachments[])
//   POST /mentor-reviews/:id/viewed
//
// Identity is server-derived (req.user.locationId) — no locationId/userId is
// sent from the client. `apiFetch` attaches X-GHL-Token automatically.

import { useEffect, useState } from "react";
import { apiFetch, buildApiError, API_BASE_URL } from "./api";

export type MentorReviewStatus = "pending" | "responded" | "closed";
export type MentorRecommendation = "discuss" | "pursue" | "pass" | null;
export type MentorMessageAuthor = "member" | "mentor";

export interface MentorMessageAttachment {
  name: string;
  url: string | null;
}

export interface MentorThreadMessage {
  id: string;
  author: MentorMessageAuthor;
  authorName: string;
  bodyHtml: string;
  at: string; // ISO
  attachments: MentorMessageAttachment[];
}

/** Row shape from `GET /mentor-reviews`. */
export interface MentorReviewSummary {
  id: string;
  oppKey: string | null;
  /**
   * True when oppKey resolved to a HigherGov opportunities doc — only then
   * does the UI deep-link the review title to the opp detail page (v1-era /
   * purged reviews can have an oppKey that no longer resolves).
   */
  oppResolved: boolean;
  /**
   * The item's HigherGov `sourceType` — `"dibbs"` for a small order. Absent
   * from an older backend; absent or null means an opportunity.
   */
  sourceType?: string | null;
  solNumber: string | null;
  title: string;
  status: MentorReviewStatus;
  recommendation: MentorRecommendation;
  mentorName: string | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessageAuthor: MentorMessageAuthor;
  lastMessagePreview: string;
  unread: boolean;
}

/**
 * Why `messages` is empty. Set only when there are zero messages — see
 * backend `MentorReviewsService.getReviewDetail` for exactly when each value
 * is used.
 */
export type MentorReviewEmptyReason =
  | "no_conversation"
  | "load_failed"
  | "unavailable";

/** Full thread shape from `GET /mentor-reviews/:id`. */
export interface MentorReviewThread extends MentorReviewSummary {
  messages: MentorThreadMessage[];
  emptyReason?: MentorReviewEmptyReason | null;
}

/** Human label for the conversation status (fallback when no decision yet). */
export const MENTOR_STATUS_LABEL: Record<MentorReviewStatus, string> = {
  pending: "Pending review",
  responded: "Responded",
  closed: "Closed",
};

/** Human label for a mentor decision (recommendation). */
export const MENTOR_RECOMMENDATION_LABEL: Record<Exclude<MentorRecommendation, null>, string> = {
  pursue: "Pursue",
  discuss: "Discuss",
  pass: "Pass",
};

/**
 * The badge shown on a review (title header + sidebar card). When the mentor has
 * made a decision, show it (Pursue/Discuss/Pass); otherwise fall back to the
 * conversation status. Returns both the label and the CSS modifier suffix so the
 * pill color matches (mentors-status--pursue etc. for decisions, --pending/
 * --responded/--closed for status).
 */
export function mentorBadge(review: {
  status: MentorReviewStatus;
  recommendation: MentorRecommendation;
}): { label: string; modifier: string } {
  if (review.recommendation) {
    return {
      label: MENTOR_RECOMMENDATION_LABEL[review.recommendation],
      modifier: review.recommendation, // "pursue" | "discuss" | "pass"
    };
  }
  return { label: MENTOR_STATUS_LABEL[review.status], modifier: review.status };
}

/** `POST /mentor-reviews/:id/reply` response. */
export interface MentorReplyResponse {
  message: MentorThreadMessage;
}

/**
 * fetch wrapper for multipart bodies. `apiFetch` is JSON-oriented enough
 * elsewhere in the app that callers pass `Content-Type: application/json`
 * explicitly; for FormData we must NOT set Content-Type ourselves (the
 * browser sets the multipart boundary), so this is a thin sibling rather
 * than a change to apiFetch's shared signature.
 */
function apiFetchForm(url: string, formData: FormData): Promise<Response> {
  return apiFetch(url, { method: "POST", body: formData });
}

/**
 * Wraps an idempotent GET's `apiFetch` call with a single retry after a
 * short delay when the browser rejects with a network-level `TypeError`
 * (e.g. "Failed to fetch" from a stale pooled keep-alive connection on
 * localhost/proxy setups). HTTP error responses (4xx/5xx) resolve normally
 * and are never retried here — only a rejected fetch promise is a network
 * failure. Not safe for non-idempotent requests (reply/viewed), so it is
 * intentionally not used for those.
 */
async function fetchWithNetworkRetry(
  url: string,
  options: RequestInit = {},
  retryDelayMs = 250,
): Promise<Response> {
  try {
    return await apiFetch(url, options);
  } catch (err) {
    if (!(err instanceof TypeError)) throw err;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    return apiFetch(url, options);
  }
}

/** GET /mentor-reviews */
export async function fetchMentorReviews(): Promise<MentorReviewSummary[]> {
  const response = await fetchWithNetworkRetry(`${API_BASE_URL}/mentor-reviews`);
  if (!response.ok) {
    return await buildApiError(response, "Failed to load mentor reviews");
  }
  const body = (await response.json()) as { reviews: MentorReviewSummary[] };
  return body.reviews;
}

/** GET /mentor-reviews/:id */
export async function fetchMentorReviewThread(id: string): Promise<MentorReviewThread> {
  const response = await fetchWithNetworkRetry(
    `${API_BASE_URL}/mentor-reviews/${encodeURIComponent(id)}`,
  );
  if (!response.ok) {
    return await buildApiError(response, "Failed to load mentor review");
  }
  return response.json() as Promise<MentorReviewThread>;
}

/** POST /mentor-reviews/:id/reply — multipart body + attachments. */
export async function replyToMentorReview(
  id: string,
  body: string,
  attachments: File[] = [],
): Promise<MentorThreadMessage> {
  const formData = new FormData();
  formData.set("body", body);
  for (const file of attachments) {
    formData.append("attachments", file, file.name);
  }
  const response = await apiFetchForm(
    `${API_BASE_URL}/mentor-reviews/${encodeURIComponent(id)}/reply`,
    formData,
  );
  if (!response.ok) {
    return await buildApiError(response, "Failed to send reply");
  }
  const parsed = (await response.json()) as MentorReplyResponse;
  return parsed.message;
}

/**
 * Attach a file to the review a send just opened. `send-for-review` takes JSON
 * only, so the send-to-mentor dialog's optional file follows the send as the
 * member's first message on that thread — the same multipart reply the
 * Mentors chat uses, so both mentor providers already carry it. Reads the list
 * fresh (not through `refreshMentorReviews`, which could hand back a request
 * that started before the send) and finds the review by the item's oppKey.
 * Throws when the review is not there yet or the upload fails.
 */
export async function attachFileToSentReview(oppKey: string, file: File): Promise<void> {
  const reviews = await fetchMentorReviews();
  const review = reviews.find((r) => r.oppKey === oppKey);
  if (!review) throw new Error("The mentor review for this item was not found");
  // A real sentence, not an empty body: an empty body makes the backend post
  // its Freshdesk `&nbsp;` placeholder, and on Intercom (every deployed
  // location) that is not a blank bubble to rely on. Fixed text, so nothing she
  // typed is sent unescaped.
  await replyToMentorReview(review.id, MENTOR_ATTACHMENT_NOTE, [file]);
}

/** The message the file is posted with, as her first reply on the thread. */
export const MENTOR_ATTACHMENT_NOTE = "Here is a supporting file for my question.";

/** Shown when the send went through and only the file did not. */
export const MENTOR_ATTACH_FAILED =
  "Sent to a mentor, but the file didn't attach. Add it to the conversation in Mentors.";

/**
 * POST /mentor-reviews/:id/viewed. Idempotent (sets lastViewedAt=now on the
 * server regardless of how many times it's called), so — like the GETs — it
 * gets the single network-TypeError retry. The reply POST is NOT idempotent
 * and must never use this retry helper.
 */
export async function markMentorReviewViewed(id: string): Promise<void> {
  const response = await fetchWithNetworkRetry(
    `${API_BASE_URL}/mentor-reviews/${encodeURIComponent(id)}/viewed`,
    { method: "POST" },
  );
  if (!response.ok) {
    await buildApiError(response, "Failed to mark review viewed");
  }
}

// ─── Shared store ───────────────────────────────────────────────────────
// Module-level cache of the reviews list, mirroring the event-bus style of
// the mock `mentorReviews.ts` (bespoke listener set here rather than the app
// eventBus, since this store's data source is the network, not another
// in-memory slice). ThreadList, Sidebar, and Home all read from this so a
// single fetch backs the list + unread badge everywhere.

type Listener = () => void;

let reviewsCache: MentorReviewSummary[] = [];
let hasLoaded = false;
let inFlight: Promise<MentorReviewSummary[]> | null = null;
const listeners = new Set<Listener>();

function emitChanged() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn("mentorReviewsApi listener failed", e);
    }
  });
}

/** Subscribe to store changes (list refreshed). Returns an unsubscribe fn. */
export function subscribeMentorReviews(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current cached reviews list (may be stale/empty until refreshed once). */
export function getMentorReviewsSnapshot(): MentorReviewSummary[] {
  return reviewsCache;
}

/** Whether the store has completed at least one successful fetch. */
export function hasMentorReviewsLoaded(): boolean {
  return hasLoaded;
}

/** Count of reviews with unread === true. */
export function getUnreadCount(): number {
  return reviewsCache.reduce((n, r) => (r.unread ? n + 1 : n), 0);
}

/**
 * Refetch the reviews list from the server and update the shared store.
 * Concurrent callers share one in-flight request. Throws on failure (callers
 * that just want best-effort refresh — e.g. after a send — should catch).
 */
export function refreshMentorReviews(): Promise<MentorReviewSummary[]> {
  if (inFlight) return inFlight;
  inFlight = fetchMentorReviews()
    .then((reviews) => {
      reviewsCache = reviews;
      hasLoaded = true;
      emitChanged();
      return reviews;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/**
 * Locally patch a single review's summary fields in the shared cache (e.g.
 * after marking a thread viewed) without a full refetch. No-ops if the
 * review isn't in the cache.
 */
export function patchMentorReviewInCache(
  id: string,
  patch: Partial<MentorReviewSummary>,
): void {
  const idx = reviewsCache.findIndex((r) => r.id === id);
  if (idx === -1) return;
  reviewsCache = reviewsCache.slice();
  reviewsCache[idx] = { ...reviewsCache[idx], ...patch };
  emitChanged();
}

/** React hook: live unread count, refreshing the store on mount if unloaded. */
export function useMentorUnread(): number {
  const [count, setCount] = useState(getUnreadCount);

  useEffect(() => {
    const sync = () => setCount(getUnreadCount());
    sync();
    const unsubscribe = subscribeMentorReviews(sync);
    if (!hasMentorReviewsLoaded()) {
      refreshMentorReviews().catch((err) => {
        console.error("Failed to load mentor reviews for unread count", err);
      });
    }
    return unsubscribe;
  }, []);

  return count;
}
