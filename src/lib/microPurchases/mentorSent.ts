// Small orders — has she sent this order to a mentor?
//
// The opportunity page seeds its status from the opportunity's own
// `mentorReviewStatus`. A small order carries no such field, so the answer is
// the real Mentors list: a review whose `oppKey` is this order. An order sent
// in this visit counts at once, before that list is fetched again.
import { useEffect, useSyncExternalStore } from "react";
import {
  type MentorReviewSummary,
  getMentorReviewsSnapshot,
  hasMentorReviewsLoaded,
  refreshMentorReviews,
  subscribeMentorReviews,
} from "../mentorReviewsApi";

const sentThisVisit = new Set<string>();
const sentListeners = new Set<() => void>();

function subscribeSent(fn: () => void): () => void {
  const unsubscribe = subscribeMentorReviews(fn);
  sentListeners.add(fn);
  return () => {
    unsubscribe();
    sentListeners.delete(fn);
  };
}

/** Count an order as sent now, before the Mentors list is fetched again. */
export function markOrderMentorSent(orderId: string): void {
  sentThisVisit.add(orderId);
  sentListeners.forEach((fn) => fn());
}

function isSent(orderId: string): boolean {
  return sentThisVisit.has(orderId) || getMentorReviewsSnapshot().some((r) => r.oppKey === orderId);
}

/** True once a mentor review exists for this order. */
export function useOrderMentorSent(orderId: string): boolean {
  useEffect(() => {
    if (hasMentorReviewsLoaded()) return;
    refreshMentorReviews().catch((err) => console.error("Failed to load mentor reviews", err));
  }, []);
  return useSyncExternalStore(
    subscribeSent,
    () => isSent(orderId),
    () => isSent(orderId),
  );
}

// A sentence about a send that outlives the control that made it. Once an
// order counts as sent, every caller swaps its "Send to mentor" control for a
// "Sent" state, which unmounts `OrderMentor` — so a file that failed to attach
// AFTER the send (the review is already paid for) cannot be said by it. It is
// held here, per order, for this visit, and the sent state reads it.
const notices = new Map<string, string>();
const noticeListeners = new Set<() => void>();

export function reportOrderMentorNotice(orderId: string, text: string): void {
  notices.set(orderId, text);
  noticeListeners.forEach((fn) => fn());
}

function subscribeNotices(fn: () => void): () => void {
  noticeListeners.add(fn);
  return () => noticeListeners.delete(fn);
}

/** The sentence to show beside this order's sent state, or null. */
export function useOrderMentorNotice(orderId: string): string | null {
  return useSyncExternalStore(
    subscribeNotices,
    () => notices.get(orderId) ?? null,
    () => notices.get(orderId) ?? null,
  );
}

function reviewFor(oppKey: string): MentorReviewSummary | null {
  return getMentorReviewsSnapshot().find((r) => r.oppKey === oppKey) ?? null;
}

/**
 * The mentor review for a record, from the real Mentors list, or null. The
 * forecast page reads it for the status pill and the review's link. A record
 * sent in this visit has no review here until the list is fetched again, so
 * pair it with `useOrderMentorSent`.
 */
export function useMentorReviewFor(oppKey: string): MentorReviewSummary | null {
  useEffect(() => {
    if (hasMentorReviewsLoaded()) return;
    refreshMentorReviews().catch((err) => console.error("Failed to load mentor reviews", err));
  }, []);
  return useSyncExternalStore(
    subscribeMentorReviews,
    () => reviewFor(oppKey),
    () => reviewFor(oppKey),
  );
}
