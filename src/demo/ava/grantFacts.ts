// DEMO: what the member has told Grant, per opportunity.
//
// Grant's page layers these facts on his read, and Ava reads the same facts,
// so a member never answers the same question twice. In production these are
// the saved answers to Grant's questions and the member's profile facts. In
// the demo they live in the demo store (key "ava.grantFacts"), so they survive
// a reload and "Reset demo" clears them.
//
// Ava adds two kinds of fact. PROOF_FACT: the member gave Ava the proof for one
// of Grant's rows. KNOCKOUT_FACT: the member cannot meet a pass-or-fail rule.
// Grant weighs both like any other fact, so the bid call stays his.

import { readDemoState, updateDemoState, writeDemoState } from "../runtime/store";
import { bus } from "../../lib/eventBus";

export type GrantFacts = Record<string, string>;

/** Facts from Ava that start with this: the member cannot meet a pass-or-fail
 *  rule. The value is the rule. */
export const KNOCKOUT_FACT = "knockout:";

/** Facts from Ava that start with this: the member gave Ava the proof for one
 *  of Grant's rows. The id after it is the row; the value is the proof. */
export const PROOF_FACT = "proof:";

const EMPTY: GrantFacts = {};
const KEY = "ava.grantFacts";

// The Camp Mackall bid is already in progress: the member answered Grant's
// question about her certification before she started it.
const SEEDED: Record<string, GrantFacts> = {
  "SP4701-26-Q-0021": { "mk-wosb-cert": "Yes" },
};

type FactMap = Record<string, GrantFacts>;

function stored(): FactMap {
  return readDemoState<FactMap>(KEY, {});
}

/** A stable object per opportunity, so live readers do not loop. */
export function grantFacts(noticeId: string): GrantFacts {
  return stored()[noticeId] ?? SEEDED[noticeId] ?? EMPTY;
}

function put(noticeId: string, facts: GrantFacts): void {
  updateDemoState<FactMap>(KEY, {}, (prev) => ({ ...prev, [noticeId]: facts }));
  bus.publish("ava");
}

export function tellGrant(noticeId: string, factId: string, value: string): void {
  const now = grantFacts(noticeId);
  if (now[factId] === value) return;
  put(noticeId, { ...now, [factId]: value });
}

export function untellGrant(noticeId: string, factId: string): void {
  const now = grantFacts(noticeId);
  if (!(factId in now)) return;
  const next = { ...now };
  delete next[factId];
  put(noticeId, next);
}

/** The pass-or-fail rule Ava passed on for this bid, if any. One at a time:
 *  the bid pauses on the first. */
export function tellGrantCantMeet(noticeId: string, rule: string | null): void {
  const id = `${KNOCKOUT_FACT}ava`;
  if (rule) tellGrant(noticeId, id, rule);
  else untellGrant(noticeId, id);
}

/** Back to the start, for the prototype controls. */
export function resetGrantFacts(noticeId: string): void {
  updateDemoState<FactMap>(KEY, {}, (prev) => {
    const next = { ...prev };
    delete next[noticeId];
    return next;
  });
  bus.publish("ava");
}

/** Back to the start for every opportunity (tests). */
export function resetAllGrantFacts(): void {
  writeDemoState<FactMap>(KEY, {});
  bus.publish("ava");
}
