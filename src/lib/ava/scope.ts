// What Ava builds, and what it says no to — on day one, before any work
// (concept §3 "Honest scope, up front" and §11 "What it covers").
//
// Grant owns fit: eligibility, set-aside, insurance, bonding, licences and the
// real deadline (lib/grant/computeGates.ts). Ava does not judge them again. Its
// own check answers two questions (docs/ava/build-progression.md, item 4):
//   1. Can Ava build this kind of notice? (avaScope, before any work)
//   2. Does the bid need a GovPreneurs reviewer? (avaReview, once Ava has read
//      the files — by how hard the bid is, never by the notice number)

import type { AvaOpportunity as Opportunity } from "../../demo/ava/opportunity";
import type { AvaBid } from "./types";

export type ScopeCall = { ok: true } | { ok: false; title: string; reason: string };

/** Prototype control: show a reply to a sources sought as the simpler first
 *  version (a next step, no drafting) instead of Ava's drafted reply. */
export const REPLY_SIMPLE_KEY = "demo:reply-simple";

export function avaScope(opp: Opportunity): ScopeCall {
  // DEMO: every opportunity in the story is a contract notice that a prime can
  // answer, so the prototype's refusals (a forecast, a grant, a product buy, a
  // teaming notice, a notice with nothing to send yet) never apply. Forecasts
  // and small orders have their own pages. A sources sought is answered, not
  // bid: Ava drafts the reply (kind "reply").
  void opp;
  return { ok: true };
}

/** Whether a GovPreneurs reviewer checks this bid before she sends it, and
 *  why, in one plain line. By how hard the bid is: writing the buyer gives
 *  points for, or a best-value judgment of quality against price. Null when
 *  Ava's exact checks are enough. */
export function avaReview(bid: AvaBid): string | null {
  if (bid.award.method === "best-value")
    return "A GovPreneurs reviewer checks this bid before you send it. The buyer weighs quality against price.";
  if (bid.award.criteria.some((c) => c.kind === "scored-writing"))
    return "A GovPreneurs reviewer checks this bid before you send it. The buyer gives points for the writing.";
  return null;
}
