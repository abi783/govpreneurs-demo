// Where the bid is, and what needs the member — the two things the member
// sees instead of Ava's internal steps (concept §5).
//
//   Progress: Understanding → Building → Reviewing → Ready. It reads
//   "complete except N items", never a percentage (settled invariant).
//   Flags: Needs you · Clarification needed · Blocked · Back with Grant (a
//   rule the member cannot meet went back to Grant, and Ava paused).
//   Several at once, or none.

import { acceptedRisks, blockingFindings } from "./checks";
import {
  bidDecision,
  blockedFiles,
  effectiveBid,
  minutesOf,
  openBidAsks,
  openClarifications,
  openCommitments,
  receivedAddenda,
} from "./derive";
import { approvalTotal } from "./price";
import type { BidState } from "./store";
import type { AvaBid } from "./types";

export type Step = "understanding" | "building" | "reviewing" | "ready";

export type Phase =
  | "not-started"
  | "understanding"
  | "building"
  | "reviewing"
  | "ready"
  | "submitted"
  | "walked-away";

export interface Progress {
  phase: Phase;
  /** The step the progress line highlights. */
  step: Step;
  /** "complete except N items". Zero on Understanding, Ready and after. */
  remaining: number;
  /** A bid decision paused the build. */
  paused: boolean;
}

export interface Flag {
  id: "needs-you" | "clarification" | "blocked" | "bid-decision";
  label: string;
}

/** Items that keep the bid in Building: open asks the bid needs (not the
 *  ones due only at award), promises to approve, and the price itself once
 *  it can be approved. */
export function buildingItems(bid: AvaBid, s: BidState): number {
  const total = approvalTotal(bid, s);
  const priceOpen =
    total !== null && (!s.priceApproval || Math.abs(s.priceApproval.total - total) > 0.005) ? 1 : 0;
  return openBidAsks(bid, s).length + openCommitments(bid, s).length + priceOpen;
}

/** `bid` is the fixture; the effective bid (addenda applied) is built here. */
export function progress(fixture: AvaBid, s: BidState): Progress {
  const bid = effectiveBid(fixture, s);
  const paused = !!bidDecision(bid, s);
  if (s.walkedAway)
    return { phase: "walked-away", step: "understanding", remaining: 0, paused: false };
  if (!s.started) return { phase: "not-started", step: "understanding", remaining: 0, paused };
  if (s.receipt) {
    // The receipt makes it submitted. It does not make the unfinished steps
    // finished: the line keeps the real step and what was still open.
    const building = s.briefConfirmed ? buildingItems(bid, s) : 0;
    const reviewing = blockingFindings(bid, s).filter(
      (f) => !s.briefConfirmed || !MIRRORS_LIST(f.id),
    ).length;
    const step: Step = !s.briefConfirmed
      ? "understanding"
      : building > 0
        ? "building"
        : reviewing > 0
          ? "reviewing"
          : "ready";
    return { phase: "submitted", step, remaining: building + reviewing, paused: false };
  }
  if (!s.briefConfirmed)
    return { phase: "understanding", step: "understanding", remaining: 0, paused };
  const building = buildingItems(bid, s);
  if (building > 0) return { phase: "building", step: "building", remaining: building, paused };
  const reviewing = blockingFindings(bid, s).length;
  if (reviewing > 0) return { phase: "reviewing", step: "reviewing", remaining: reviewing, paused };
  return { phase: "ready", step: "ready", remaining: 0, paused };
}

/** Findings that restate an item already on the member's list. */
export const MIRRORS_LIST = (id: string) =>
  id === "price-approval" ||
  id === "price-incomplete" ||
  id === "commitments" ||
  id === "gaps" ||
  /^(req|late|file|clar):/.test(id);

export function flags(fixture: AvaBid, s: BidState): Flag[] {
  const bid = effectiveBid(fixture, s);
  if (!s.started || s.walkedAway || s.receipt || !s.briefConfirmed) return [];
  const out: Flag[] = [];
  const paused = !!bidDecision(bid, s);
  if (paused) out.push({ id: "bid-decision", label: "Back with Grant" });
  if (blockedFiles(bid, s).length > 0) out.push({ id: "blocked", label: "Blocked" });
  if (openClarifications(bid, s).length > 0)
    out.push({ id: "clarification", label: "Clarification needed" });
  if (!paused && buildingItems(bid, s) > 0) out.push({ id: "needs-you", label: "Needs you" });
  return out;
}

/** The member's remaining time on their list. */
export function remainingMinutes(fixture: AvaBid, s: BidState): number {
  const bid = effectiveBid(fixture, s);
  return minutesOf(openBidAsks(bid, s));
}

/** Addenda that arrived and the member has not read the report for. */
export function unseenAddenda(fixture: AvaBid, s: BidState) {
  return receivedAddenda(fixture, s).filter((a) => a.arrivesDuringBuild && !s.addendaSeen[a.id]);
}

/** The label the package carries when the member went ahead at risk.
 *  Critical wins: "Ready, not checked against Exhibit D". */
export function readyLabel(s: BidState): string | null {
  const risks = acceptedRisks(s);
  const critical = risks.find((r) => r.severity === "critical");
  if (critical) return critical.label;
  const material = risks.find((r) => r.severity === "material");
  if (material) return material.label;
  return null;
}
