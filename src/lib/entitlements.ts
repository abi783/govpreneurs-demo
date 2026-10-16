// Subscription-tier entitlements for v2.
//
// "Send to Mentor" is available to Expert and Elite plans (Pilot is excluded,
// and is separately walled out of the feed entirely by `isPilotPlan`).
// The v2 session (see ./ghlUser.tsx) exposes `productId: string | null`, which
// is the GHL product identifying the user's subscription plan.

import { isMockEnv } from "./env";
import {
  CLOSING_WINDOW_DAYS,
  CLOSING_WINDOW_MESSAGE,
  isInsideClosingWindow,
} from "./closingWindow";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The closing window as a lead time, for copy that names it (the forecast page). */
export const MENTOR_REVIEW_MIN_LEAD_MS = CLOSING_WINDOW_DAYS * DAY_MS;

export const ELITE_PLAN_PRODUCT_ID =
  (import.meta.env.VITE_ELITE_PLAN_PRODUCT_ID as string | undefined) ||
  "prod_RyCniw2GwDwIJw";

export const EXPERT_PLAN_PRODUCT_ID =
  (import.meta.env.VITE_EXPERT_PLAN_PRODUCT_ID as string | undefined) ||
  "prod_RyCnZGtd77e3a6";

const SEND_TO_MENTOR_PRODUCT_IDS = [
  EXPERT_PLAN_PRODUCT_ID,
  ELITE_PLAN_PRODUCT_ID,
];

/**
 * Whether the user's subscription entitles them to the "Send to Mentor"
 * feature. Expert and Elite. Pass `session.productId` from `useGhlUser()`.
 */
export function allowSendToMentor(
  productId: string | null | undefined,
): boolean {
  // Local dev bypass: the bare mock user carries no productId, so unlock the
  // feature to keep local dev usable. But when the mock session DOES resolve a
  // real plan (e.g. `?locationId=` mirrors a real account through
  // /users/from-highlevel), honor it — so the Pilot upsell path is reachable
  // locally. Staging/production always apply the real plan check.
  if (isMockEnv() && productId == null) {
    return true;
  }
  return SEND_TO_MENTOR_PRODUCT_IDS.includes(productId ?? "");
}

export const MENTOR_DEADLINE_TOO_CLOSE_MESSAGE = CLOSING_WINDOW_MESSAGE;

/**
 * Whether an opportunity closes inside the closing window (or has passed), so
 * a mentor review can't come back in time. A mentor review costs the member
 * $97 and takes days to turn around, so sending an opp this close wastes it.
 * No deadline (empty/invalid ISO string, e.g. a HigherGov doc with no
 * `dueDate`) is never gated — there's nothing to be "too close" to.
 */
export function isTooCloseToDeadline(
  deadline: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return isInsideClosingWindow(deadline, now);
}
