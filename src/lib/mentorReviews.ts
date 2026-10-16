// Mentor reviews — RETIRED mock store for the /mentors chat surface.
// The real /mentors chat now runs on `lib/mentorReviewsApi.ts` (backend-backed
// shared store). This file's seeded threads ("Sarah Mitchell" and the
// old sample member) are intentionally emptied out so nothing fictional renders
// anywhere. It is kept alive — types, functions, exports all still work —
// purely for compile compatibility of the remaining mock-only consumers
// (`lib/tasks.ts`'s non-mentor task blocks stay on other mocks; `lib/mock/bids.ts`
// still models bid stages other than "with_mentor" on mock data). Delete this
// file once bids.ts and any other holdouts move to real data.

import { bus } from "./eventBus";

export const MENTOR_REVIEWS_CHANGED_EVENT = "mentor-reviews:changed";

export type MentorReviewStatus = "pending" | "responded" | "closed";

export interface MentorMessage {
  id: string;
  from: "member" | "mentor";
  authorName: string;
  body: string; // may contain light inline HTML (b/i/ul/li/br)
  sentAt: string; // ISO
  attachments?: Array<{ name: string; type: string }>;
}

export interface MentorReview {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  /** Where the review was sent from, so its title links back there. Opportunities when absent. */
  surface?: "opportunity" | "forecast";
  status: MentorReviewStatus;
  sentAt: string;
  memberNote?: string;
  grantVerdictSnapshot: {
    verdict: string;
    rationale: string;
  };
  messages: MentorMessage[];
  mentorName?: string;
  mentorCredential?: string;
  lastViewedAt?: string;
}

const MENTOR_NAME = "Sarah Mitchell";
const MENTOR_CRED = "GovCon mentor · 12 yrs federal contracting";
const MEMBER_NAME = "Amira Haddad";

// Retired: this store's fictional seed threads are gone for good — the
// /mentors surface is real now (see `lib/mentorReviewsApi.ts`). `MENTOR_NAME`
// / `MENTOR_CRED` / `MEMBER_NAME` above are left in place only because
// `createReview`/`appendMessage`/`markViewed` below (dead code paths for any
// real caller, kept for compile compatibility) still reference them.
const SEEDED: MentorReview[] = [];

let memberCreated: MentorReview[] = [];
let cachedSnapshot: MentorReview[] | null = null;
let cachedFromVersion = -1;
let version = 0;

function cloneReview<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readMemberCreated(): MentorReview[] {
  return memberCreated;
}

function emitReviewsChanged() {
  bus.publish("mentorReviews");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MENTOR_REVIEWS_CHANGED_EVENT));
  }
}

function writeMemberCreated(list: MentorReview[]) {
  memberCreated = list;
  version += 1;
  emitReviewsChanged();
}

function mergedAll(): MentorReview[] {
  const created = readMemberCreated();
  const ids = new Set(created.map((r) => r.id));
  const seedKept = SEEDED.filter((r) => !ids.has(r.id));
  return [...created, ...seedKept];
}

function sortReviews(list: MentorReview[]): MentorReview[] {
  const rank = (r: MentorReview) => {
    const lastMsgFromMentor =
      r.messages.length > 0 && r.messages[r.messages.length - 1].from === "mentor";
    const unread =
      lastMsgFromMentor &&
      (!r.lastViewedAt ||
        new Date(r.messages[r.messages.length - 1].sentAt) > new Date(r.lastViewedAt));
    if (r.status === "responded" && unread) return 0;
    if (r.status === "pending") return 1;
    if (r.status === "responded") return 2;
    return 3;
  };

  return [...list].sort((a, b) => {
    const ranked = rank(a) - rank(b);
    if (ranked !== 0) return ranked;
    const at = new Date(a.messages[a.messages.length - 1]?.sentAt ?? a.sentAt).getTime();
    const bt = new Date(b.messages[b.messages.length - 1]?.sentAt ?? b.sentAt).getTime();
    return bt - at;
  });
}

const SEEDED_SNAPSHOT = sortReviews(cloneReview(SEEDED));

export function subscribeReviews(onStoreChange: () => void): () => void {
  return bus.subscribe("mentorReviews", onStoreChange);
}

export function listReviewsServerSnapshot(): MentorReview[] {
  return SEEDED_SNAPSHOT;
}

export function listReviewsSnapshot(): MentorReview[] {
  if (cachedSnapshot && cachedFromVersion === version) {
    return cachedSnapshot;
  }
  cachedFromVersion = version;
  cachedSnapshot = sortReviews(mergedAll());
  return cachedSnapshot;
}

export function listReviews(): MentorReview[] {
  return listReviewsSnapshot();
}

export function getReview(id: string): MentorReview | null {
  return listReviewsSnapshot().find((r) => r.id === id) ?? null;
}

export function getReviewByOpportunity(noticeId: string): MentorReview | null {
  return listReviewsSnapshot().find((r) => r.opportunityId === noticeId) ?? null;
}

export function isUnread(r: MentorReview): boolean {
  if (r.messages.length === 0) return false;
  const last = r.messages[r.messages.length - 1];
  if (last.from !== "mentor") return false;
  if (!r.lastViewedAt) return true;
  return new Date(last.sentAt) > new Date(r.lastViewedAt);
}

export function createReview(input: {
  opportunityId: string;
  opportunityTitle: string;
  verdict: string;
  rationale: string;
  note: string;
  surface?: "opportunity" | "forecast";
}): MentorReview {
  const now = new Date().toISOString();
  const stamp = Date.now();
  const review: MentorReview = {
    id: `rev_${input.opportunityId}_${stamp}`,
    opportunityId: input.opportunityId,
    opportunityTitle: input.opportunityTitle,
    surface: input.surface,
    status: "pending",
    sentAt: now,
    mentorName: MENTOR_NAME,
    mentorCredential: MENTOR_CRED,
    memberNote: input.note || undefined,
    grantVerdictSnapshot: {
      verdict: input.verdict,
      rationale: input.rationale,
    },
    messages: [
      {
        id: `m_${stamp}`,
        from: "member",
        authorName: MEMBER_NAME,
        body: input.note?.trim()
          ? input.note.trim()
          : "Sending this opportunity over for your read. Grant's take is attached above.",
        sentAt: now,
      },
    ],
  };
  const created = readMemberCreated().filter((r) => r.opportunityId !== input.opportunityId);
  created.push(review);
  writeMemberCreated(created);
  return review;
}

export function appendMessage(
  reviewId: string,
  body: string,
  attachments?: Array<{ name: string; type: string }>
): MentorReview | null {
  const created = readMemberCreated();
  let target = created.find((r) => r.id === reviewId);

  if (!target) {
    const seeded = SEEDED.find((r) => r.id === reviewId);
    if (!seeded) return null;
    target = cloneReview(seeded);
    created.push(target);
  }

  target.messages.push({
    id: `m_${Date.now()}`,
    from: "member",
    authorName: MEMBER_NAME,
    body,
    sentAt: new Date().toISOString(),
    attachments,
  });
  writeMemberCreated(created);
  return target;
}

export function markViewed(reviewId: string) {
  const created = readMemberCreated();
  let target = created.find((r) => r.id === reviewId);

  if (!target) {
    const seeded = SEEDED.find((r) => r.id === reviewId);
    if (!seeded) return;
    target = cloneReview(seeded);
    created.push(target);
  }

  target.lastViewedAt = new Date().toISOString();
  writeMemberCreated(created);
}

export function addReview(noticeId: string, note: string): MentorReview {
  return createReview({
    opportunityId: noticeId,
    opportunityTitle: noticeId,
    verdict: "—",
    rationale: "—",
    note,
  });
}
