// DEMO: what other pages (Pipeline, Tasks) need to know about Ava's live state.
// Reads Ava's own stored state, so a bid Tim sends or the certificates he
// uploads during a call show on every page, not only on Ava's.

import { getBidState } from "@/lib/ava/store";

/** The day she told Ava she sent this bid, or null. */
export function avaSentAt(noticeId: string): string | null {
  return getBidState(noticeId).sentAt ?? null;
}

/** True once she has given Ava the food-handler certificates on the Cumberland bid. */
export function cumberlandCertificatesIn(): boolean {
  return Boolean(getBidState("CUMCO-2026-014").answers["ask-food-handlers"]);
}

/** True once she has changed anything on this bid in Ava. */
export function avaTouched(noticeId: string): boolean {
  const s = getBidState(noticeId);
  return Object.keys(s.answers).length > 0 || Boolean(s.sentAt);
}
