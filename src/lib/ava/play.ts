// Playing a bid forward: answer each question the way a person would, until a
// stopping point. The demo uses it to build the starting state of each bid out
// of real answers, and the prototype controls use it to open a bid at any
// screen of the design (cases.ts). A state built this way can only be a state
// the product can really get into.

import { DEMO, effectiveBid } from "./derive";
import { getAvaBid } from "./fixtures";
import {
  checkFixes,
  checkSig,
  downloadSig,
  flowOf,
  riskAllowed,
  STAFFING_KEY,
  type Flow,
  type Question,
} from "./flow";
import { withGrantFor } from "./grant";
import { approvalTotal, PRICE_YOURSELF_KEY, rates } from "./price";
import { decisionKey, emptyState, type BidState } from "./store";
import { roleFloors, sampleAnswer } from "./testLab";
import { nowIso } from "./dates";
import type { AvaBid } from "./types";

void DEMO;
void PRICE_YOURSELF_KEY;

/** The effective bid and flow for a state, as the workspace would see them. */
export function look(id: string, s: BidState): { bid: AvaBid; s: BidState; flow: Flow } {
  const base = getAvaBid(id)!;
  const g = withGrantFor(id, base, s, {});
  const bid = effectiveBid(g.fixture, g.s);
  return { bid, s: g.s, flow: flowOf(bid, g.s, { now: Date.now() }) };
}

/** Her plain answer to one question, as a state change. */
export function answerQuestion(bid: AvaBid, s: BidState, q: Question): BidState {
  const at = nowIso();
  const trail = [...s.trail.filter((k) => k !== q.key), q.key];
  if (q.kind === "must" && q.key.startsWith("must:")) {
    return { ...s, mustHave: { ...s.mustHave, [q.rule!.id]: { says: "have", at } }, trail };
  }
  if ((q.kind === "ask" || q.kind === "must") && q.ask) {
    return {
      ...s,
      answers: { ...s.answers, [q.ask.id]: sampleAnswer(q.ask, roleFloors(bid), at) },
      trail,
    };
  }
  if (q.kind === "promise" && q.commitment) {
    return {
      ...s,
      commitments: { ...s.commitments, [q.commitment.id]: { at, text: q.commitment.text } },
      trail,
    };
  }
  if (q.kind === "decision" && q.decision) {
    const k = decisionKey(q.decision.sectionId, q.decision.decision.id);
    return { ...s, decisions: { ...s.decisions, [k]: { pick: "ava", at } }, trail };
  }
  if (q.kind === "staffing")
    return {
      ...s,
      fixes: { ...s.fixes, [STAFFING_KEY]: true },
      trail: [...s.trail, `fix:${STAFFING_KEY}`],
    };
  if (q.kind === "price") {
    const r = rates(bid, s);
    if (r) return { ...s, priceApproval: { at, total: 0, rates: r }, trail };
    const total = approvalTotal(bid, s);
    return total === null ? s : { ...s, priceApproval: { at, total }, trail };
  }
  if (q.kind === "clar" && q.clar) {
    return {
      ...s,
      clarifications: {
        ...s.clarifications,
        [q.clar.id]: { ...s.clarifications[q.clar.id], sentAt: at },
      },
      trail,
    };
  }
  if (q.kind === "portal")
    return { ...s, portalShots: [...s.portalShots, { name: "Portal screens.png", at }], trail };
  if (q.kind === "fix" && q.finding) {
    if (q.finding.fix) return { ...s, fixes: { ...s.fixes, [q.finding.fix.key]: true }, trail };
    // A rule that rejects the bid is never taken at risk: the sample leaves it open.
    if (!riskAllowed(q.finding))
      return {
        ...s,
        left: { ...s.left, [q.key]: { at, for: "me" } },
        trail: [...s.trail, `left:${q.key}`],
      };
    return {
      ...s,
      risks: {
        ...s.risks,
        [q.finding.id]: {
          reason: "Sample",
          severity: q.finding.severity,
          label: q.finding.title,
          at,
        },
      },
      trail,
    };
  }
  return s;
}

export type Stop = (f: Flow, s: BidState, bid: AvaBid) => boolean;
/** A different answer for one question: return the new state, or null. */
export type Pick = (q: Question, s: BidState, bid: AvaBid) => BidState | null;

/** Play the bid forward from `s` until `stop` says so. Reading and checking
 *  finish at once, as they would after a few minutes. */
export function play(id: string, s: BidState, stop: Stop, pick?: Pick): BidState {
  const t = Date.now();
  let cur: BidState = {
    ...s,
    started: true,
    briefConfirmed: true,
    read: s.read ?? { startedAt: t - 180_000, doneAt: t },
  };
  for (let i = 0; i < 300; i++) {
    const { bid, s: seen, flow } = look(id, cur);
    cur = { ...cur, answers: seen.answers };
    if (stop(flow, cur, bid)) return cur;
    if (flow.stage === "checking") {
      const fixes = checkFixes(bid, cur);
      cur = {
        ...cur,
        fixes: { ...cur.fixes, ...Object.fromEntries(fixes.map((f) => [f.key, true as const])) },
        avaFixes: {
          ...cur.avaFixes,
          ...Object.fromEntries(fixes.map((f) => [f.key, { text: f.text, at: nowIso() }])),
        },
        check: { startedAt: t - 40_000, doneAt: t, sig: "" },
      };
      cur = { ...cur, check: { ...cur.check!, sig: checkSig(cur) } };
      continue;
    }
    if (!flow.current) return cur;
    const next = pick?.(flow.current, cur, bid) ?? answerQuestion(bid, cur, flow.current);
    if (next === cur) return cur;
    cur = next;
  }
  return cur;
}

export const at =
  (key: string): Stop =>
  (f) =>
    f.current?.key === key;
export const stage =
  (id: Flow["stage"]): Stop =>
  (f) =>
    f.stage === id;
export const started = (fixes: Record<string, true> = {}): BidState => ({
  ...emptyState(),
  started: true,
  briefConfirmed: true,
  fixes,
});
/** Leave these questions open, for her (or her mentor, with "mentor:"). */
export const leaving =
  (keys: string[]): Pick =>
  (q, s) => {
    const k = keys.find((x) => x.replace(/^mentor:/, "") === q.key);
    if (!k) return null;
    const who = k.startsWith("mentor:") ? ("mentor" as const) : ("me" as const);
    return {
      ...s,
      left: { ...s.left, [q.key]: { at: nowIso(), for: who } },
      trail: [...s.trail, `left:${q.key}`],
    };
  };
/** Her most likely path (Amira has general liability only): she can get the
 *  insurance certificate in time, and says she will call her agent. */
export const gettingInsurance: Pick = (q, s) => {
  if (q.key === "must:hr-insurance")
    return {
      ...s,
      mustHave: { ...s.mustHave, "hr-insurance": { says: "getting", at: nowIso() } },
      trail: [...s.trail, q.key],
    };
  if (q.key === "ask:ask-insurance")
    return {
      ...s,
      answers: {
        ...s.answers,
        "ask-insurance": {
          status: "forwarded",
          at: nowIso(),
          forwardedTo: "a call to your insurance agent",
        },
      },
      trail: [...s.trail, q.key],
    };
  return null;
};
export const ready = (id: string, s: BidState = started(), pick?: Pick) =>
  play(id, s, stage("ready"), pick);
export const reading = (s: BidState): BidState => ({ ...s, readOpened: true });
export const downloaded = (s: BidState): BidState => ({
  ...s,
  downloads: [
    ...s.downloads,
    {
      at: nowIso(),
      what: "Your whole bid",
      holes: Object.keys(s.left).length,
      sig: downloadSig(s),
      whole: true,
    },
  ],
});
/** Ava's check as it stands after the last change: she already checked it. */
export const checkedNow = (s: BidState): BidState =>
  s.check ? { ...s, check: { ...s.check, sig: checkSig(s) } } : s;
