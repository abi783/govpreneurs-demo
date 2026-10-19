// Where the agency's Family Advocacy quote starts in the demo. See
// src/lib/ava/start.ts. DEMO: the agency's hero bid.
//
// The story says: "answer my questions". Ava has 3 questions for Dana about
// her team, the videos and the app line (the pack, section 8), and the card
// says so. Everything else is answered, the same way Camp Mackall's start is
// built (starts/mackall.ts): Ava asks in her own order (flow.ts), and each
// question takes the answer Dana gave (fixtures/familyAdvocacy.ts). Her
// promises, her staffing plan and her price are approved, at the real total.
// No check has run yet. When she answers the three, the check finds nothing
// that holds the bid.
//
// Like mackall.ts, this file does not import play.ts (the import would loop).

import { effectiveBid } from "../derive";
import {
  FAMILY_ADVOCACY_ID,
  FAMILY_ADVOCACY_OPEN,
  familyAdvocacyAnswers,
  familyAdvocacyBid,
} from "../fixtures/familyAdvocacy";
import { ISO } from "../fixtures/when";
import { flowOf, STAFFING_KEY, type Question } from "../flow";
import { withGrantFor } from "../grant";
import { approvalTotal } from "../price";
import { decisionKey, emptyState, type BidState } from "../store";
import type { AvaBid } from "../types";

/** Her answer to one question, as a change to her state. She answered
 *  yesterday afternoon, one minute after the one before. */
function answer(bid: AvaBid, s: BidState, q: Question): BidState {
  const at = ISO(-1, 16, s.trail.length);
  const trail = [...s.trail.filter((k) => k !== q.key), q.key];
  if (q.kind === "must" && q.key.startsWith("must:") && q.rule)
    return { ...s, mustHave: { ...s.mustHave, [q.rule.id]: { says: "have", at } }, trail };
  if ((q.kind === "ask" || q.kind === "must") && q.ask) {
    const given = familyAdvocacyAnswers[q.ask.id];
    if (!given) throw new Error(`The Family Advocacy start has no answer for ${q.ask.id}`);
    return { ...s, answers: { ...s.answers, [q.ask.id]: given }, trail };
  }
  if (q.kind === "promise" && q.commitment)
    return {
      ...s,
      commitments: { ...s.commitments, [q.commitment.id]: { at, text: q.commitment.text } },
      trail,
    };
  if (q.kind === "decision" && q.decision) {
    const key = decisionKey(q.decision.sectionId, q.decision.decision.id);
    return { ...s, decisions: { ...s.decisions, [key]: { pick: "ava", at } }, trail };
  }
  if (q.kind === "staffing") {
    const key = `fix:${STAFFING_KEY}`;
    return {
      ...s,
      fixes: { ...s.fixes, [STAFFING_KEY]: true },
      trail: [...s.trail.filter((k) => k !== key), key],
    };
  }
  if (q.kind === "price") {
    const total = approvalTotal(bid, s);
    if (total === null) throw new Error("The Family Advocacy price has no total yet");
    return { ...s, priceApproval: { at, total }, trail };
  }
  throw new Error(`The Family Advocacy start cannot answer ${q.key}`);
}

export function familyAdvocacyStart(): Partial<BidState> {
  // Ava has read the Army's files. She has not checked the bid yet.
  let s: BidState = {
    ...emptyState(),
    started: true,
    briefConfirmed: true,
    read: { startedAt: 0, doneAt: 1 },
  };
  for (let i = 0; i < 100; i++) {
    const seen = withGrantFor(FAMILY_ADVOCACY_ID, familyAdvocacyBid, s, {});
    const bid = effectiveBid(seen.fixture, seen.s);
    const flow = flowOf(bid, seen.s, { now: 0 });
    // The three questions wait on her. Every other question has its answer.
    const next = flow.queue.find((q) => !FAMILY_ADVOCACY_OPEN.includes(q.key));
    if (!next) break;
    s = answer(bid, s, next);
  }
  return s;
}
