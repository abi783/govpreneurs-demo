// Ava's member state — what the member has told, approved, sent and accepted,
// per bid. The fixtures hold what Ava read; this holds what the member did.
// Nothing here is a fact about the buyer.
//
// DEMO: the prototype kept this in memory. The demo keeps it in the demo store
// (src/demo/runtime/store.ts, key "ava.states"), so it survives a reload and
// "Reset demo" clears it. A bid with no stored state starts from its seed.
//
// Every write goes through an action below, so a preview can never share a
// write path with a real action (D-D4), and every state the member can enter
// has an action that leaves it (D-D3): answers can be changed, risks withdrawn,
// a bid decision undone.

import { bus } from "../eventBus";
import { readDemoState, updateDemoState, writeDemoState } from "../../demo/runtime/store";
import { nowIso } from "./dates";
import type { Severity, Source } from "./types";

export interface AskAnswer {
  /** done: answered · forwarded: sent to someone, still open · dont-have: an option was chosen. */
  status: "done" | "forwarded" | "dont-have";
  at: string;
  /** Answer asks: the choice picked. */
  choiceId?: string;
  /** "I don't have this": the option picked. */
  optionId?: string;
  /** Upload asks: the file the member chose. */
  fileName?: string;
  /** Enter asks, or values Ava pulled from an upload and the member approved. */
  values?: Record<string, number | string>;
  /** Forwarded: to whom, in plain words. */
  forwardedTo?: string;
  /** The answer came from what the member told Grant, in their words. */
  fromGrant?: string;
  /** The addenda received when she answered. An addendum that changes the
   *  rule after that sets this answer aside (review panel, 7 October 2026). */
  addenda?: string[];
}

export interface RiskAcceptance {
  reason: string;
  severity: Severity;
  /** The label that stays on the package and checklist, never in the files. */
  label: string;
  at: string;
}

export interface BidDecisionState {
  reason: string;
  source?: Source;
  /** The ask whose answer sent the bid back, so the answer can be changed. */
  fromAskId?: string;
}

/** Her pick on one of Ava's decisions. "own": the words she wrote, in `text`. */
export interface DecisionPick {
  pick: "ava" | "other" | "own";
  text?: string;
  at: string;
}

/** Where a decision's pick is kept in BidState.decisions. */
export const decisionKey = (sectionId: string, decisionId: string) => `${sectionId}:${decisionId}`;

/** How long a paper will take to come, as she says it. */
export type LeadSaid = "days" | "week" | "weeks" | "unsure";

export interface BidState {
  /** The member decided to go and pressed Start. */
  started: boolean;
  /** The member read the Bid Brief and said it looks right. */
  briefConfirmed: boolean;
  /** What the member told Ava was wrong in the brief. */
  briefNote: string | null;
  answers: Record<string, AskAnswer>;
  /** Asks opened by an "I don't have this" option. */
  opened: Record<string, true>;
  /** Approved commitments, with the text as it read when approved, so an
   *  addendum that changes the text reopens the approval. */
  commitments: Record<string, { at: string; text: string }>;
  clarifications: Record<
    string,
    {
      sentAt?: string;
      reply?: string;
      replyAt?: string;
      readingId?: string;
      /** The member says the reply settles the question. A pasted reply alone does not. */
      settled?: boolean;
    }
  >;
  /** Findings and blocked files the member chose to go ahead on. */
  risks: Record<string, RiskAcceptance>;
  /** Exact-check fixes applied. */
  fixes: Record<string, true>;
  /** Addenda that have arrived (fixtures mark which arrive during the build). */
  addendaReceived: string[];
  /** Addenda the member has read the change report for. */
  addendaSeen: Record<string, true>;
  /** Accepted redlines: `${sectionId}:${challengeId}` → option id. */
  redlines: Record<string, string>;
  /** Ava's decisions she has made: `${sectionId}:${decisionId}` → her pick. */
  decisions: Record<string, DecisionPick>;
  /** Reviewer findings the member chose to leave as they are. */
  reviewerLeft: Record<string, string>;
  checklist: Record<string, boolean>;
  receipt: { fileName: string; at: string } | null;
  /** Addenda the member uploaded from a portal Ava cannot reach. */
  addendumUploads: { fileName: string; at: string }[];
  /** The member approved the whole price at this total. A change to any input
   *  (an addendum's quantities, a new pay rate) reopens it. */
  priceApproval: { at: string; total: number; rates?: Record<string, number> } | null;
  decision: BidDecisionState | null;
  walkedAway: boolean;
  /** What the member sent to their Mentor from Ava, by item: when, and where
   *  (the Mentor checkpoints). Ava never waits for an answer. */
  mentorAsks: Record<string, { at: string; reviewId: string }>;
  /** Changes she asked for on page 3, in her words, by the part of the bid. Ava
   *  shows each change before it happens; nothing changes until she accepts. */
  changeRequests: { pieceId: string; text: string; at: string }[];
  /** A typed portal: the steps she ticked on Ava's side while entering the bid
   *  on the portal. Ava cannot see the portal, so she ticks each one. */
  portalSteps: Record<string, true>;
  /** Prototype control: show a typed portal as if its questions were not in
   *  the buyer's files, so Ava must see the portal first. */
  portalUnseen: boolean;
  /** Screenshots or pasted questions she gave Ava of the portal's screens. */
  portalShots: { name: string; at: string }[];

  // ── The two-phase build (docs/ava/build-handoff-two-phase.md) ──

  /** The order she answered things in, by question key ("ask:<id>",
   *  "must:<ruleId>", "price", …). The conversation reads it: the app's clock
   *  stamps every answer with the same instant, so the stamps cannot order it.
   *  A key leaves the trail when its answer is taken back. */
  trail: string[];
  /** Ava reading the buyer's files: when she started and when she finished.
   *  Milliseconds on the device's own clock. They time Ava's work on the
   *  screen and nothing else; every date in the bid comes from dates.ts. */
  read: { startedAt: number; doneAt: number | null } | null;
  /** Ava checking the whole bid for mistakes, on the same clock as `read`.
   *  `sig` is what the bid looked like when the check started (flow.ts
   *  checkSig): an answer changed since then makes the check run again. */
  check: { startedAt: number; doneAt: number | null; sig: string; failed?: boolean } | null;
  /** Her word on a rule that can get the bid rejected, before any paper:
   *  "have" (she has it; the copy is asked later) or "getting" (she can get
   *  it before the due date). Never a pass on its own: the rule's own ask
   *  still decides it, and an unanswered copy holds the download. */
  mustHave: Record<string, { says: "have" | "getting"; at: string; addenda?: string[] }>;
  /** How long she says a paper she is getting will take to come, keyed by the
   *  ask. Ava asks her rather than guess from a table (PRD OD2, Shyam, 8
   *  October 2026: "ask the customer itself how long it might take"). */
  lead?: Record<string, LeadSaid>;
  /** Things she chose to leave open for herself or her mentor. Each stays a
   *  marked hole in her bid until it is filled. Keyed by question key. */
  left: Record<string, { at: string; for: "me" | "mentor" }>;
  /** A photo or file she sent that Ava has read but she has not confirmed.
   *  Nothing goes in her bid until she says it is right. */
  pending: Record<string, { fileName: string; photo: boolean; at: string }>;
  /** Fixes Ava made by herself while checking, in plain words. Each one is
   *  also in `fixes`; `unfix` takes it back from both. */
  avaFixes: Record<string, { text: string; at: string }>;
  /** She pressed "Read my bid": the bid moves to the middle (phase 2). */
  readOpened: boolean;
  /** She built the bid although her mentor said not to pursue it. */
  overMentor: boolean;
  /** Every time she downloaded, with how many holes were still open, and
   *  her bid as it stood (flow.ts checkSig): a later change makes the
   *  download older than her bid. */
  downloads: { at: string; what: string; holes: number; sig?: string; whole?: boolean }[];
  /** Sentences rewritten while she reads: by her (saved only when she
   *  presses "Use these words"), or by her mentor from the mentor dashboard
   *  in Command Center v2, marked with the mentor's name. The bid reads `now`
   *  in place of `was`. "Keep mine" takes either back. Keyed by sentence. */
  edits: Record<
    string,
    {
      sectionId: string;
      paragraph: number;
      was: string;
      now: string;
      by: "you" | "mentor";
      at: string;
    }
  >;
  /** DEMO: she told Ava she sent the bid (or the reply). Ava never sends: she
   *  only keeps the day, so the list and the header can say "You sent it".
   *  The prototype had no such step (Shyam, 7 October 2026); the demo adds it
   *  so a walk through the bid ends in a finished state. */
  sentAt?: string | null;
}

export function emptyState(): BidState {
  return {
    started: false,
    briefConfirmed: false,
    briefNote: null,
    answers: {},
    opened: {},
    commitments: {},
    clarifications: {},
    risks: {},
    fixes: {},
    addendaReceived: [],
    addendaSeen: {},
    redlines: {},
    decisions: {},
    reviewerLeft: {},
    checklist: {},
    receipt: null,
    addendumUploads: [],
    priceApproval: null,
    decision: null,
    walkedAway: false,
    mentorAsks: {},
    changeRequests: [],
    portalSteps: {},
    portalUnseen: false,
    portalShots: [],
    trail: [],
    read: null,
    check: null,
    mustHave: {},
    lead: {},
    left: {},
    pending: {},
    avaFixes: {},
    readOpened: false,
    overMentor: false,
    downloads: [],
    edits: {},
    sentAt: null,
  };
}

/** The trail with `key` moved to its end: she answered it last. */
function onTrail(s: BidState, key: string): string[] {
  return [...s.trail.filter((k) => k !== key), key];
}

/** The trail without `key`: she took the answer back. */
function offTrail(s: BidState, key: string): string[] {
  return s.trail.filter((k) => k !== key);
}

// ── The store ──────────────────────────────────────────────────────────────

/** A seed is a state, or a function that builds it the first time it is read. */
type Seed = Partial<BidState> | (() => Partial<BidState>);

const STATES_KEY = "ava.states";
let seeds: Record<string, Seed> = {};
/** Seeds, built once per page load, so a bid that was never written keeps one
 *  object (useSyncExternalStore compares by reference). */
const seedCache = new Map<string, BidState>();
/** Stored states, filled in against the current shape once per object. */
const shaped = new WeakMap<object, BidState>();

type StateMap = Record<string, BidState>;

/** Fixtures register their starting state once (fixtures/index.ts). */
export function registerSeeds(s: Record<string, Seed>): void {
  seeds = s;
  seedCache.clear();
}

function seeded(noticeId: string): BidState {
  const seed = seeds[noticeId];
  const part = typeof seed === "function" ? seed() : (seed ?? {});
  return { ...emptyState(), ...part };
}

function stored(): StateMap {
  return readDemoState<StateMap>(STATES_KEY, {});
}

/** Stable identity between writes — useSyncExternalStore compares by reference. */
export function getBidState(noticeId: string): BidState {
  const own = stored()[noticeId];
  if (own) {
    let fit = shaped.get(own);
    if (!fit) {
      fit = { ...emptyState(), ...own };
      shaped.set(own, fit);
    }
    return fit;
  }
  let s = seedCache.get(noticeId);
  if (!s) {
    s = seeded(noticeId);
    seedCache.set(noticeId, s);
  }
  return s;
}

/** Every bid that has a seed that starts it, for tests and the controls. */
export function startedIds(): string[] {
  const ids = new Set<string>();
  for (const [id, s] of Object.entries(stored())) if (s.started) ids.add(id);
  for (const id of Object.keys(seeds)) if (getBidState(id).started) ids.add(id);
  return [...ids];
}

function put(noticeId: string, next: BidState): void {
  updateDemoState<StateMap>(STATES_KEY, {}, (prev) => ({ ...prev, [noticeId]: next }));
  bus.publish("ava");
}

function write(noticeId: string, change: (s: BidState) => BidState): void {
  put(noticeId, change(getBidState(noticeId)));
}

/** PROTOTYPE CONTROLS — they jump a bid to a whole state. The product has no
 *  such path: members reach every state by answering. */
export const avaDemo = {
  load(id: string, state: BidState) {
    put(id, state);
  },
  /** Back to where the sample bid starts (its seed). */
  reset(id: string) {
    seedCache.delete(id);
    updateDemoState<StateMap>(STATES_KEY, {}, (prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    bus.publish("ava");
  },
};

/** Back to the start for every bid (tests). */
export function resetAva(): void {
  seedCache.clear();
  writeDemoState<StateMap>(STATES_KEY, {});
  bus.publish("ava");
}

// ── Actions ────────────────────────────────────────────────────────────────

export const ava = {
  start(id: string) {
    write(id, (s) => ({ ...s, started: true }));
  },
  confirmBrief(id: string) {
    write(id, (s) => ({ ...s, briefConfirmed: true }));
  },
  noteBrief(id: string, note: string) {
    write(id, (s) => ({ ...s, briefNote: note.trim() || null }));
  },
  answer(id: string, askId: string, a: Omit<AskAnswer, "at">) {
    write(id, (s) => {
      const pending = { ...s.pending };
      delete pending[`ask:${askId}`];
      const left = { ...s.left };
      delete left[`ask:${askId}`];
      return {
        ...s,
        answers: { ...s.answers, [askId]: { ...a, at: nowIso(), addenda: [...s.addendaReceived] } },
        trail: onTrail(s, `ask:${askId}`),
        pending,
        left,
      };
    });
  },
  /** "Change": the answer goes away and the ask is open again. */
  reopenAsk(id: string, askId: string) {
    write(id, (s) => {
      const answers = { ...s.answers };
      delete answers[askId];
      return { ...s, answers, trail: offTrail(s, `ask:${askId}`) };
    });
  },
  openAsk(id: string, askId: string) {
    write(id, (s) => ({ ...s, opened: { ...s.opened, [askId]: true } }));
  },
  forward(id: string, askIds: string[], to: string) {
    write(id, (s) => {
      const answers = { ...s.answers };
      let trail = s.trail;
      for (const a of askIds) {
        if (!answers[a]) answers[a] = { status: "forwarded", at: nowIso(), forwardedTo: to };
        trail = [...trail.filter((k) => k !== `ask:${a}`), `ask:${a}`];
      }
      return { ...s, answers, trail };
    });
  },
  approveCommitment(id: string, commitmentId: string, text: string) {
    write(id, (s) => ({
      ...s,
      commitments: { ...s.commitments, [commitmentId]: { at: nowIso(), text } },
      trail: onTrail(s, `promise:${commitmentId}`),
    }));
  },
  withdrawCommitment(id: string, commitmentId: string) {
    write(id, (s) => {
      const commitments = { ...s.commitments };
      delete commitments[commitmentId];
      return { ...s, commitments, trail: offTrail(s, `promise:${commitmentId}`) };
    });
  },
  markSent(id: string, clarificationId: string) {
    write(id, (s) => ({
      ...s,
      clarifications: {
        ...s.clarifications,
        [clarificationId]: { ...s.clarifications[clarificationId], sentAt: nowIso() },
      },
      trail: onTrail(s, `clar:${clarificationId}`),
    }));
  },
  /** Take back "I sent it" on a question for the buyer. */
  unmarkSent(id: string, clarificationId: string) {
    write(id, (s) => {
      const c = { ...s.clarifications[clarificationId] };
      delete c.sentAt;
      return {
        ...s,
        clarifications: { ...s.clarifications, [clarificationId]: c },
        trail: offTrail(s, `clar:${clarificationId}`),
      };
    });
  },
  recordReply(id: string, clarificationId: string, reply: string) {
    write(id, (s) => ({
      ...s,
      clarifications: {
        ...s.clarifications,
        [clarificationId]: { ...s.clarifications[clarificationId], reply, replyAt: nowIso() },
      },
    }));
  },
  /** The member says whether the buyer's reply settles the question. */
  settleClarification(id: string, clarificationId: string, settled: boolean) {
    write(id, (s) => ({
      ...s,
      clarifications: {
        ...s.clarifications,
        [clarificationId]: { ...s.clarifications[clarificationId], settled },
      },
    }));
  },
  uploadAddendum(id: string, fileName: string) {
    write(id, (s) => ({
      ...s,
      addendumUploads: [...s.addendumUploads, { fileName, at: nowIso() }],
    }));
  },
  chooseReading(id: string, clarificationId: string, readingId: string) {
    write(id, (s) => ({
      ...s,
      clarifications: {
        ...s.clarifications,
        [clarificationId]: { ...s.clarifications[clarificationId], readingId },
      },
    }));
  },
  acceptRisk(id: string, key: string, r: Omit<RiskAcceptance, "at">) {
    write(id, (s) => ({ ...s, risks: { ...s.risks, [key]: { ...r, at: nowIso() } } }));
  },
  withdrawRisk(id: string, key: string) {
    write(id, (s) => {
      const risks = { ...s.risks };
      delete risks[key];
      return { ...s, risks };
    });
  },
  fix(id: string, key: string) {
    write(id, (s) => ({
      ...s,
      fixes: { ...s.fixes, [key]: true },
      trail: onTrail(s, `fix:${key}`),
    }));
  },
  /** Undo a fix: "Add it to the price" and the like are never one-way. A fix
   *  Ava made by herself while checking goes the same way. */
  unfix(id: string, key: string) {
    write(id, (s) => {
      const fixes = { ...s.fixes };
      delete fixes[key];
      const avaFixes = { ...s.avaFixes };
      delete avaFixes[key];
      return { ...s, fixes, avaFixes, trail: offTrail(s, `fix:${key}`) };
    });
  },
  receiveAddendum(id: string, addendumId: string) {
    write(id, (s) =>
      s.addendaReceived.includes(addendumId)
        ? s
        : { ...s, addendaReceived: [...s.addendaReceived, addendumId] },
    );
  },
  seeAddendum(id: string, addendumId: string) {
    write(id, (s) => ({ ...s, addendaSeen: { ...s.addendaSeen, [addendumId]: true } }));
  },
  acceptRedline(id: string, key: string, optionId: string) {
    write(id, (s) => ({ ...s, redlines: { ...s.redlines, [key]: optionId } }));
  },
  /** She makes one of Ava's decisions: Ava's wording, the other one, or her own. */
  decide(id: string, key: string, pick: DecisionPick["pick"], text?: string) {
    write(id, (s) => ({
      ...s,
      decisions: { ...s.decisions, [key]: { pick, text: text?.trim() || undefined, at: nowIso() } },
      trail: onTrail(s, `decision:${key}`),
    }));
  },
  undecide(id: string, key: string) {
    write(id, (s) => {
      const decisions = { ...s.decisions };
      delete decisions[key];
      return { ...s, decisions, trail: offTrail(s, `decision:${key}`) };
    });
  },
  undoRedline(id: string, key: string) {
    write(id, (s) => {
      const redlines = { ...s.redlines };
      delete redlines[key];
      return { ...s, redlines };
    });
  },
  leaveFinding(id: string, findingId: string, reason: string) {
    write(id, (s) => ({ ...s, reviewerLeft: { ...s.reviewerLeft, [findingId]: reason } }));
  },
  unleaveFinding(id: string, findingId: string) {
    write(id, (s) => {
      const reviewerLeft = { ...s.reviewerLeft };
      delete reviewerLeft[findingId];
      return { ...s, reviewerLeft };
    });
  },
  toggleChecklist(id: string, itemId: string) {
    write(id, (s) => ({ ...s, checklist: { ...s.checklist, [itemId]: !s.checklist[itemId] } }));
  },
  uploadReceipt(id: string, fileName: string) {
    write(id, (s) => ({ ...s, receipt: { fileName, at: nowIso() } }));
  },
  approvePrice(id: string, total: number) {
    write(id, (s) => ({
      ...s,
      priceApproval: { at: nowIso(), total },
      trail: onTrail(s, "price"),
    }));
  },
  /** A rate list: she approves every line's rate, and there is no total. */
  approveRates(id: string, rates: Record<string, number>) {
    write(id, (s) => ({
      ...s,
      priceApproval: { at: nowIso(), total: 0, rates },
      trail: onTrail(s, "price"),
    }));
  },
  unapprovePrice(id: string) {
    write(id, (s) => ({ ...s, priceApproval: null, trail: offTrail(s, "price") }));
  },
  removeReceipt(id: string) {
    write(id, (s) => ({ ...s, receipt: null }));
  },
  sendBack(id: string, d: BidDecisionState) {
    write(id, (s) => ({ ...s, decision: d, trail: onTrail(s, "paused") }));
  },
  /** Fix it: the bid goes on. If an answer sent it back, that answer is cleared. */
  keepGoing(id: string) {
    write(id, (s) => {
      const answers = { ...s.answers };
      let trail = offTrail(s, "paused");
      if (s.decision?.fromAskId) {
        delete answers[s.decision.fromAskId];
        trail = trail.filter((k) => k !== `ask:${s.decision?.fromAskId}`);
      }
      return { ...s, decision: null, answers, trail };
    });
  },
  walkAway(id: string) {
    write(id, (s) => ({ ...s, walkedAway: true }));
  },
  undoWalkAway(id: string) {
    write(id, (s) => ({ ...s, walkedAway: false }));
  },
  /** The member sent an item to their Mentor. The message itself lives in the
   *  Mentors conversation; Ava keeps only that it was sent, and where. */
  askChange(id: string, pieceId: string, text: string) {
    const t = text.trim();
    if (!t) return;
    write(id, (s) => ({
      ...s,
      changeRequests: [...(s.changeRequests ?? []), { pieceId, text: t, at: nowIso() }],
    }));
  },
  tickPortalStep(id: string, stepId: string, done: boolean) {
    write(id, (s) => {
      const steps = { ...(s.portalSteps ?? {}) };
      if (done) steps[stepId] = true;
      else delete steps[stepId];
      return { ...s, portalSteps: steps };
    });
  },
  setPortalUnseen(id: string, unseen: boolean) {
    write(id, (s) => ({ ...s, portalUnseen: unseen }));
  },
  addPortalShot(id: string, name: string) {
    write(id, (s) => ({
      ...s,
      portalShots: [...(s.portalShots ?? []), { name, at: nowIso() }],
      trail: onTrail(s, "portal"),
    }));
  },
  sentToMentor(id: string, key: string, reviewId: string) {
    write(id, (s) => ({
      ...s,
      mentorAsks: { ...s.mentorAsks, [key]: { at: nowIso(), reviewId } },
    }));
  },
  // ── The two-phase build ──

  /** Ava starts reading the buyer's files. */
  startReading(id: string, at: number) {
    write(id, (s) => (s.read ? s : { ...s, read: { startedAt: at, doneAt: null } }));
  },
  finishReading(id: string, at: number) {
    write(id, (s) => (s.read && !s.read.doneAt ? { ...s, read: { ...s.read, doneAt: at } } : s));
  },
  /** Ava starts checking the bid. `sig` is the bid as it stands now. */
  startCheck(id: string, at: number, sig: string) {
    write(id, (s) => ({ ...s, check: { startedAt: at, doneAt: null, sig } }));
  },
  /** The check finished. Ava applies the fixes she can make by herself,
   *  each with its plain-words line, so she can take any one back. A check
   *  that could not finish applies nothing (PRD D39). */
  finishCheck(id: string, at: number, avaFixes: { key: string; text: string }[], failed = false) {
    write(id, (s) => {
      if (!s.check || s.check.doneAt) return s;
      if (failed) return { ...s, check: { ...s.check, doneAt: at, failed: true } };
      const fixes = { ...s.fixes };
      const made = { ...s.avaFixes };
      for (const f of avaFixes) {
        fixes[f.key] = true;
        made[f.key] = { text: f.text, at: nowIso() };
      }
      return { ...s, fixes, avaFixes: made, check: { ...s.check, doneAt: at } };
    });
  },
  /** Her word on a rule that can get the bid rejected. */
  /** How long a paper she is getting will take, in her words. */
  sayLead(id: string, askId: string, said: LeadSaid) {
    write(id, (s) => ({ ...s, lead: { ...(s.lead ?? {}), [askId]: said } }));
  },
  sayMustHave(id: string, ruleId: string, says: "have" | "getting") {
    // Her word is on the rule as it reads now, with every addendum she has.
    write(id, (s) => ({
      ...s,
      mustHave: {
        ...s.mustHave,
        [ruleId]: { says, at: nowIso(), addenda: [...s.addendaReceived] },
      },
      trail: onTrail(s, `must:${ruleId}`),
    }));
  },
  unsayMustHave(id: string, ruleId: string) {
    write(id, (s) => {
      const mustHave = { ...s.mustHave };
      delete mustHave[ruleId];
      return { ...s, mustHave, trail: offTrail(s, `must:${ruleId}`) };
    });
  },
  /** She leaves something open for herself or her mentor. It stays a hole. */
  leave(id: string, key: string, who: "me" | "mentor") {
    write(id, (s) => ({
      ...s,
      left: { ...s.left, [key]: { at: nowIso(), for: who } },
      trail: onTrail(s, `left:${key}`),
    }));
  },
  /** "Fill it now": the hole is asked again. */
  unleave(id: string, key: string) {
    write(id, (s) => {
      const left = { ...s.left };
      delete left[key];
      return { ...s, left, trail: offTrail(s, `left:${key}`) };
    });
  },
  /** She sent a photo or file. Ava shows what she read before it is used. */
  sendFile(id: string, askId: string, fileName: string, photo: boolean) {
    write(id, (s) => ({
      ...s,
      pending: { ...s.pending, [`ask:${askId}`]: { fileName, photo, at: nowIso() } },
    }));
  },
  /** "Choose another": the file she sent is not used. */
  dropFile(id: string, askId: string) {
    write(id, (s) => {
      const pending = { ...s.pending };
      delete pending[`ask:${askId}`];
      return { ...s, pending };
    });
  },
  /** "Read my bid": the bid moves to the middle. */
  openRead(id: string, open: boolean) {
    write(id, (s) => ({ ...s, readOpened: open }));
  },
  /** She builds the bid although her mentor said not to pursue it. */
  buildOverMentor(id: string, yes: boolean) {
    write(id, (s) => ({ ...s, overMentor: yes }));
  },
  /** She downloaded her bid, or one file of it. */
  downloaded(id: string, what: string, holes: number, sig?: string, whole = true) {
    write(id, (s) => ({
      ...s,
      downloads: [...s.downloads, { at: nowIso(), what, holes, sig, whole }],
    }));
  },
  /** "Check it again": Ava runs her check of the bid once more (PRD D39). */
  recheck(id: string) {
    write(id, (s) => {
      const fixes = { ...s.fixes };
      delete fixes["demo:check-fails"];
      return { ...s, fixes, check: null };
    });
  },
  /** Her new words for a sentence, or her mentor's. Applied when she says so. */
  edit(
    id: string,
    key: string,
    e: { sectionId: string; paragraph: number; was: string; now: string; by: "you" | "mentor" },
  ) {
    write(id, (s) => ({ ...s, edits: { ...s.edits, [key]: { ...e, at: nowIso() } } }));
  },
  /** DEMO: she sent the bid herself and tells Ava. Ava sends nothing. */
  sendBid(id: string) {
    write(id, (s) => ({ ...s, sentAt: nowIso() }));
  },
  /** She did not send it after all. */
  unsendBid(id: string) {
    write(id, (s) => ({ ...s, sentAt: null }));
  },
  /** "Keep mine": the sentence goes back to how it was. */
  unedit(id: string, key: string) {
    write(id, (s) => {
      const edits = { ...s.edits };
      delete edits[key];
      return { ...s, edits };
    });
  },
};

/** True while a bid still has its starting state: the visitor has not changed
 *  anything on it yet. The list then shows the story's own status line. */
export function isUntouched(noticeId: string): boolean {
  return stored()[noticeId] === undefined;
}
