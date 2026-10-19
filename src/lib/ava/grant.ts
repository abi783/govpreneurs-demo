// The only place Ava reads Grant. Grant decides, Ava builds: Grant's call, his
// check of who can bid, his warnings and his real deadline show with his name
// on them, and Ava never works them out again. Ava adds only what Grant does
// not do: every rule in every file, the proof for each, and the build itself.
//
// withGrant() lays Grant's results on the sample bid before any page reads
// it, so every count, check and page agrees:
//   · a rule Grant checks, with nothing for Ava to collect, takes his result;
//   · a rule Ava collects proof for keeps its ask, with his result beside it;
//   · an ask Grant already asked takes the member's answer to Grant.

// DEMO: the prototype read Grant's full analysis (lib/grant). The demo reads a
// small private read built from the story (src/demo/ava/grantRead.ts).
import {
  grantFacts,
  PROOF_FACT,
  tellGrant,
  tellGrantCantMeet,
  untellGrant,
  type GrantFacts,
} from "../../demo/ava/grantFacts";
import {
  grantRead,
  realDeadlineFor,
  sampleFor,
  type GrantRowStatus,
} from "../../demo/ava/grantRead";
import { findOpportunity } from "../../demo/ava/opportunity";
import { requirementStatus } from "./checks";
import { bidDecision } from "./derive";
import type { BidState } from "./store";
import type { AvaBid, ReqStatus } from "./types";

/** The prototype control that shows a bid Grant has not read yet. */
export const NO_GRANT_KEY = "demo:no-grant";

export type GrantCheckStatus = GrantRowStatus;

export interface GrantCheck {
  id: string;
  label: string;
  status: GrantCheckStatus;
  /** What Grant found about the member: "Active until 15 April 2027". */
  found: string;
  /** Where the buyer states it: "§1.2". */
  ref: string;
}

export interface GrantView {
  call: "Bid" | "Review" | "No Bid";
  /** Grant's one-line reason. */
  gist: string;
  checks: GrantCheck[];
  /** Warnings, in Grant's words. They are also why a Mentor review is advised. */
  warnings: string[];
  /** The last day to start and still make it, after the time bonds,
   *  references and writing take. */
  realDeadline: Date;
  realStatus: "ok" | "tight" | "blocked";
  /** What takes the time: "reference questionnaires (5 days)". */
  takes: string[];
  /** Rules the member told Ava they cannot meet, as Grant received them. */
  cantMeet: string[];
}

/** Grant's read of this bid, with everything the member told him. Null when
 *  Grant has not read it (or the prototype control says so). */
export function grantView(noticeId: string, s: BidState, told: GrantFacts): GrantView | null {
  if (s.fixes[NO_GRANT_KEY]) return null;
  const opp = findOpportunity(noticeId);
  if (!opp) return null;
  const a = grantRead(opp, told);
  const d = realDeadlineFor(opp, sampleFor(opp).deadline);
  return {
    call: a.call,
    gist: a.gist,
    checks: a.rows.map((r) => ({
      id: r.id,
      label: r.requirement,
      status: r.status,
      found: r.firmValue,
      ref: r.ref,
    })),
    warnings: a.warnings,
    realDeadline: d.realDeadline,
    realStatus: d.status,
    takes: d.deductions.map(
      (x) => `${x.label.toLowerCase()} (${x.days} ${x.days === 1 ? "day" : "days"})`,
    ),
    cantMeet: a.cantMeet,
  };
}

const AS_RULE: Record<GrantCheckStatus, ReqStatus> = {
  have: "meets",
  missing: "not-yet",
  confirm: "confirm",
  unknown: "confirm",
};

/** Grant's result on one rule, in plain words. */
export function grantSays(c: GrantCheck | undefined, read: boolean): string {
  if (!read) return "Grant has not checked this yet.";
  if (!c) return "This rule is not in Grant's check.";
  switch (c.status) {
    case "have":
      return `Grant checked this: ${c.found}.`;
    case "missing":
      return `Grant found this missing: ${c.found}.`;
    default:
      return `Grant could not confirm this: ${c.found}.`;
  }
}

/** What Ava passes on to Grant so his read stays current: proof the member
 *  gave on page 2, answers to questions Grant also asks, and a rule they
 *  cannot meet. Grant weighs them (rail.applyFacts); Ava decides nothing.
 *  In production these are facts saved to the member's profile. */
export function passToGrant(noticeId: string, bid: AvaBid, s: BidState) {
  for (const r of bid.hardRequirements) {
    if (!r.grantRow || (!r.askId && (r.askIds ?? []).length === 0)) continue;
    const v = requirementStatus(bid, s, r);
    const id = `${PROOF_FACT}${r.grantRow}`;
    if (v.status === "meets") tellGrant(noticeId, id, v.evidence ?? "Proof on file");
    else untellGrant(noticeId, id);
  }
  for (const a of bid.asks) {
    if (!a.grantQuestion || !a.grantChoices || a.answer.type !== "answer") continue;
    const ans = s.answers[a.id];
    if (!ans || ans.fromGrant || ans.status !== "done") continue;
    const choice = a.answer.choices.find((c) => c.id === ans.choiceId);
    if (choice) tellGrant(noticeId, a.grantQuestion, choice.failsGate ? "No" : "Yes");
  }
  const d = bidDecision(bid, s);
  const rule = d?.fromAskId
    ? bid.hardRequirements.find(
        (r) => r.askId === d.fromAskId || (r.askIds ?? []).includes(d.fromAskId ?? ""),
      )?.label
    : undefined;
  tellGrantCantMeet(noticeId, d ? (rule ?? d.reason) : null);
}

/** Grant's read and the bid with it laid on, for one sample bid. The pages
 *  (useAva) and the list of bids both read this, so their counts agree. */
export function withGrantFor(
  noticeId: string,
  fixture: AvaBid,
  s: BidState,
  told: GrantFacts = grantFacts(noticeId),
): { fixture: AvaBid; s: BidState; grant: GrantView | null } {
  const grant = grantView(noticeId, s, told);
  return { ...withGrant(fixture, s, grant, told), grant };
}

/** The bid and state every page reads, with Grant's results laid on. */
export function withGrant(
  fixture: AvaBid,
  s: BidState,
  view: GrantView | null,
  told: GrantFacts,
): { fixture: AvaBid; s: BidState } {
  const read = view !== null;
  const hardRequirements = fixture.hardRequirements.map((r) => {
    if (!r.grantRow) return r;
    const c = view?.checks.find((x) => x.id === r.grantRow);
    const says = grantSays(c, read).replace(/\.\.$/, ".");
    const collects = !!r.askId || (r.askIds ?? []).length > 0;
    return {
      ...r,
      grantSays: says,
      evidence: says,
      // Nothing for Ava to collect: Grant's result is the rule's result.
      initial: collects ? r.initial : c ? AS_RULE[c.status] : ("confirm" as const),
    };
  });

  const answers = { ...s.answers };
  let answered = false;
  const asks = fixture.asks.map((a) => {
    const said = read && a.grantQuestion ? told[a.grantQuestion] : undefined;
    // An answer given to Ava itself is the member's; Ava passed it on to Grant.
    const own = s.answers[a.id];
    if (!said || (own && !own.fromGrant)) return a;
    const choiceId = a.grantChoices?.[said];
    if (choiceId && !answers[a.id]) {
      answers[a.id] = { status: "done", at: "", choiceId, fromGrant: said };
      answered = true;
    }
    return { ...a, toldGrant: said };
  });

  return {
    fixture: { ...fixture, hardRequirements, asks },
    s: answered ? { ...s, answers } : s,
  };
}
