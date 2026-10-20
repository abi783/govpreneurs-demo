// Where the consulting firm's hero bid starts in the demo. See src/lib/ava/start.ts.
//
// The story says: "answer my questions". Ava has 3 questions for Simone about
// her Program Manager and Lead Facilitator, who teaches the four cohorts and
// the coach credential (the pack, section 8). Everything else is answered the way the
// agency's start is built (src/lib/ava/starts/familyAdvocacy.ts): Ava asks in
// her own order and each question takes the answer she gave (fixture.ts). Her
// promises, her staffing plan and her price are approved. No check has run yet.
//
// Like the agency's start, this file does not import play.ts (the import would loop).

import { effectiveBid } from "../../../../lib/ava/derive";
import { ISO } from "../../../../lib/ava/fixtures/when";
import { flowOf, STAFFING_KEY, type Question } from "../../../../lib/ava/flow";
import { withGrantFor } from "../../../../lib/ava/grant";
import { approvalTotal } from "../../../../lib/ava/price";
import { decisionKey, emptyState, type BidState } from "../../../../lib/ava/store";
import type { AvaBid } from "../../../../lib/ava/types";
import { consultingAnswers, consultingBid, HERO_NOTICE, HERO_OPEN } from "./fixture";

/** Her answer to one question, as a change to her state. She answered
 *  yesterday afternoon, one minute after the one before. */
function answer(bid: AvaBid, s: BidState, q: Question): BidState {
  const at = ISO(-1, 16, s.trail.length);
  const trail = [...s.trail.filter((k) => k !== q.key), q.key];
  if (q.kind === "must" && q.key.startsWith("must:") && q.rule)
    return { ...s, mustHave: { ...s.mustHave, [q.rule.id]: { says: "have", at } }, trail };
  if ((q.kind === "ask" || q.kind === "must") && q.ask) {
    const given = consultingAnswers[q.ask.id];
    if (!given) throw new Error(`The consulting firm's start has no answer for ${q.ask.id}`);
    return { ...s, answers: { ...s.answers, [q.ask.id]: given }, trail };
  }
  if (q.kind === "clar" && q.clar)
    return {
      ...s,
      clarifications: {
        ...s.clarifications,
        [q.clar.id]: { ...s.clarifications[q.clar.id], sentAt: at },
      },
      trail,
    };
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
    if (total === null) throw new Error("The consulting firm's price has no total yet");
    return { ...s, priceApproval: { at, total }, trail };
  }
  throw new Error(`The consulting firm's start cannot answer ${q.key}`);
}

export function consultingStart(): Partial<BidState> {
  // Ava has read VA's files. She has not checked the bid yet.
  let s: BidState = {
    ...emptyState(),
    started: true,
    briefConfirmed: true,
    read: { startedAt: 0, doneAt: 1 },
  };
  for (let i = 0; i < 100; i++) {
    const seen = withGrantFor(HERO_NOTICE, consultingBid, s, {});
    const bid = effectiveBid(seen.fixture, seen.s);
    const flow = flowOf(bid, seen.s, { now: 0 });
    // The three questions wait on her. Every other question has its answer.
    const next = flow.queue.find((q) => !HERO_OPEN.includes(q.key));
    if (!next) break;
    s = answer(bid, s, next);
  }
  return s;
}
