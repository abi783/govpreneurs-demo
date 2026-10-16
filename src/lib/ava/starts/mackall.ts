// Where the Camp Mackall bid starts in the demo. See src/lib/ava/start.ts.
//
// The story says: "answer my questions". Ava has 3 questions for Amira about
// delivery times and staff, and the card says so. Everything else is answered.
//
// The state is built from real answers. Ava asks the questions in her own
// order (flow.ts), and each one takes the answer Amira gave
// (fixtures/mackall.ts, `mackallAnswers`). Three questions stay open:
//   1. How her drivers get installation access (she picks one quick reply).
//   2. Her yes on the delivery times (breakfast by 5:30 AM, dinner by 5:00 PM).
//   3. Her yes on the staff (5 cooks, 2 of them also driving, 1 part-time cook).
// Her staffing plan and her price are already approved, at the real total.
// No check has run yet. When she answers the three, the check finds nothing
// and no new question comes up.
//
// This file does not import play.ts. play.ts reads every sample bid, and the
// bids read their starts, so the import would be a loop. The steps below are
// the same ones play.ts takes (play.ts, answerQuestion).

import { ISO } from "../fixtures/when";
import { effectiveBid } from "../derive";
import { flowOf, STAFFING_KEY, type Question } from "../flow";
import { MACKALL_ID, MACKALL_OPEN, mackallAnswers, mackallBid } from "../fixtures/mackall";
import { withGrantFor } from "../grant";
import { approvalTotal } from "../price";
import { decisionKey, emptyState, type BidState } from "../store";
import type { AvaBid } from "../types";

/** Her answer to one question, as a change to her state. She answered
 *  yesterday afternoon, one minute after the one before. */
function answer(bid: AvaBid, s: BidState, q: Question): BidState {
  const at = ISO(-1, 16, s.trail.length);
  const trail = [...s.trail.filter((k) => k !== q.key), q.key];
  // The other rules ask for a plain yes.
  if (q.kind === "must" && q.key.startsWith("must:") && q.rule)
    return { ...s, mustHave: { ...s.mustHave, [q.rule.id]: { says: "have", at } }, trail };
  if ((q.kind === "ask" || q.kind === "must") && q.ask) {
    const given = mackallAnswers[q.ask.id];
    if (!given) throw new Error(`The Camp Mackall start has no answer for ${q.ask.id}`);
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
  // Approving the plan is a fix in her state, so the chat history finds it by
  // that key (store.ava.fix).
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
    if (total === null) throw new Error("The Camp Mackall price has no total yet");
    return { ...s, priceApproval: { at, total }, trail };
  }
  throw new Error(`The Camp Mackall start cannot answer ${q.key}`);
}

export function mackallStart(): Partial<BidState> {
  let s: BidState = { ...emptyState(), started: true, briefConfirmed: true };
  // Ava has read the Army's files. She has not checked the bid yet.
  s = { ...s, read: { startedAt: 0, doneAt: 1 } };

  for (let i = 0; i < 100; i++) {
    const seen = withGrantFor(MACKALL_ID, mackallBid, s, {});
    const bid = effectiveBid(seen.fixture, seen.s);
    const flow = flowOf(bid, seen.s, { now: 0 });
    // The three questions wait on her. Every other question has its answer.
    const next = flow.queue.find((q) => !MACKALL_OPEN.includes(q.key));
    if (!next) break;
    s = answer(bid, s, next);
  }
  return s;
}
