/**
 * The tools-exclusive summit offer.
 *
 * One definition, because the code now appears in two places — the scorecard's
 * AI pitch (where the backend supplies it on the response) and the post-sign-in
 * SummitInvite modal (which builds it here). Two literals would drift the first
 * time the code changes, and a wrong discount code is worse than none: the
 * member only finds out at checkout.
 *
 * The backend's copy lives in summit-pitch.service.ts. If this ever changes,
 * both move together — and the code must exist in the ticketing system BEFORE
 * either ships, or every member who copies it hits an error.
 *
 * Deliberately no prices here. Ticket tiers live on summit.govpreneurs.com and
 * move faster than this file does; a stale price beside a live discount invites
 * a member to compute a total checkout will not honour.
 */
export const SUMMIT_COUPON = "SUMMIT20";
export const SUMMIT_DISCOUNT_LABEL = "20% off";
export const SUMMIT_URL = "https://summit.govpreneurs.com/";
