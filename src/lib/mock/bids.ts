// My Bids — Marcus's pursuit tracker.
// Derived from real opportunities + mentor reviews + a small seed of pursuit state.
// This is NOT a CRM: 3 bids, one primary next action each.

import { NOW, daysUntil, relativeTime } from "../format";
import { getReview, isUnread, type MentorReview } from "../mentorReviews";
import { OPPORTUNITIES, fmtValueRange, type Opportunity } from "./opportunities";

export type BidStage =
  | "saved"
  | "reviewing"
  | "with_mentor"
  | "drafting"
  | "submitted"
  | "won"
  | "not_awarded"
  | "declined";

export interface Bid {
  id: string;
  opportunityId: string;
  title: string;
  agency: string;
  mode: "prime" | "partner";
  deadline: string | null;
  stage: BidStage;
  grantVerdict?: { verdict: string; oneLine: string };
  mentorReviewId?: string;
  nextAction: { label: string; href: string };
  lastActivityAt: string;
  /** Days to deadline (negative = past); null when no deadline is known. */
  daysLeft: number | null;
  /** Deadline passed while still in an active (non-outcome) pursuit stage. */
  expired: boolean;
  /** Numeric midpoint for column pipeline totals (0 when value unknown). */
  valueMidUsd: number;
  /** Display value range, e.g. "$420K – $560K"; omitted when unknown. */
  value?: string;
  /** Fed vs SLED scope; omitted when unknown (e.g. real saved opps). */
  scope?: "fed" | "sled";
  /**
   * Pre-computed stage context line, used instead of `contextLineFor`'s
   * derivation. Set by adapters that map non-mock data (e.g. real mentor
   * reviews) into a `Bid` shape for the board, where `contextLineFor`'s own
   * lookups (keyed to the mock mentor-reviews store) wouldn't resolve.
   */
  contextOverride?: string;
  /**
   * A saved small order (a DIBBS row in `user_workspace.savedOpps`). Its links
   * open `/small-orders/$orderId`, not the opportunity page.
   */
  smallOrder?: boolean;
  /** A tracked forecast: the card opens the forecast page, and shows no countdown. */
  forecast?: boolean;
  /**
   * CTA override for the board's primary action, pointing at a mentor thread
   * (`/mentors/$reviewId`) instead of the opportunity page. Set by adapters
   * mapping real `MentorReviewSummary` rows into the with_mentor column.
   * `primary: false` renders the secondary button style (mirrors the design
   * reference's read/unread CTA treatment for with_mentor cards).
   */
  mentorActionOverride?: { label: string; reviewId: string; primary: boolean };
}

/** Outcome stages never render a deadline countdown or count as "expired". */
const OUTCOME_STAGES = new Set<BidStage>(["submitted", "won", "not_awarded", "declined"]);

// Pursuit seeds — the bid's own state (stage, override deadline, mentor link).
type BidSeed = {
  id: string;
  opportunityId: string;
  titleOverride?: string;
  modeOverride?: "prime" | "partner";
  deadlineDaysFromNow: number | null;
  stage: BidStage;
  mentorReviewId?: string;
  grantVerdict?: { verdict: string; oneLine: string };
  lastActivityDaysAgo: number;
};

const SEEDS: BidSeed[] = [
  {
    id: "bid_ftbragg_barracks",
    opportunityId: "W912EE-26-R-0066",
    deadlineDaysFromNow: 6,
    stage: "reviewing",
    grantVerdict: {
      verdict: "Review",
      oneLine: "Strong fit — capacity is the risk.",
    },
    lastActivityDaysAgo: 1,
  },
  {
    id: "bid_va_salisbury",
    opportunityId: "VA247-26-R-0166",
    deadlineDaysFromNow: 21,
    stage: "with_mentor",
    mentorReviewId: "rev_va_salisbury",
    grantVerdict: {
      verdict: "Review",
      oneLine: "Scope fit is clean; ceiling is a stretch.",
    },
    lastActivityDaysAgo: 1,
  },
  {
    id: "bid_lejeune_envelope",
    opportunityId: "N40085-26-Q-0089",
    titleOverride: "Camp Lejeune building envelope",
    modeOverride: "partner",
    deadlineDaysFromNow: null,
    stage: "saved",
    lastActivityDaysAgo: 4,
  },
  {
    id: "bid_pope_hangar_submitted",
    opportunityId: "W912PM-26-Q-0017",
    deadlineDaysFromNow: null,
    stage: "submitted",
    grantVerdict: {
      verdict: "Bid",
      oneLine: "Right in the lane — submitted on time.",
    },
    lastActivityDaysAgo: 8,
  },
  {
    id: "bid_cumberland_detention_won",
    opportunityId: "CUMCO-2026-014",
    deadlineDaysFromNow: null,
    stage: "won",
    grantVerdict: {
      verdict: "Bid",
      oneLine: "Local re-roof — awarded.",
    },
    lastActivityDaysAgo: 28,
  },
];

function findOpp(id: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.noticeId === id);
}

function offsetIso(days: number): string {
  const d = new Date(NOW.getTime() + days * 86_400_000);
  return d.toISOString();
}

function nextActionFor(seed: BidSeed, review: MentorReview | null): Bid["nextAction"] {
  const oppHref = `/opportunities/${seed.opportunityId}`;
  switch (seed.stage) {
    case "saved":
      return { label: "Review with Grant", href: oppHref };
    case "reviewing":
      return { label: "Send to a mentor", href: oppHref };
    case "with_mentor": {
      if (review && isUnread(review)) {
        return { label: "Read reply in Mentors", href: `/mentors/${review.id}` };
      }
      return { label: "Open mentor thread", href: `/mentors/${review?.id ?? ""}` };
    }
    case "drafting":
      return { label: "Continue draft with Ava", href: oppHref };
    case "submitted":
      return { label: "View submission", href: oppHref };
    case "won":
    case "not_awarded":
    case "declined":
      return { label: "View opportunity", href: oppHref };
  }
}

export function listBids(): Bid[] {
  return SEEDS.map((seed): Bid | null => {
    const opp = findOpp(seed.opportunityId);
    if (!opp) return null;
    const review = seed.mentorReviewId ? getReview(seed.mentorReviewId) : null;
    const deadline = seed.deadlineDaysFromNow === null ? null : offsetIso(seed.deadlineDaysFromNow);
    const daysLeft = deadline ? Math.ceil(daysUntil(deadline)) : null;
    return {
      id: seed.id,
      opportunityId: seed.opportunityId,
      title: seed.titleOverride ?? opp.title,
      agency: opp.agency,
      mode: seed.modeOverride ?? opp.mode,
      deadline,
      stage: seed.stage,
      grantVerdict: seed.grantVerdict,
      mentorReviewId: seed.mentorReviewId,
      nextAction: nextActionFor(seed, review),
      lastActivityAt: offsetIso(-seed.lastActivityDaysAgo),
      daysLeft,
      expired: !OUTCOME_STAGES.has(seed.stage) && daysLeft !== null && daysLeft < 0,
      valueMidUsd: (opp.valueLow + opp.valueHigh) / 2,
      value: fmtValueRange(opp.valueLow, opp.valueHigh),
      scope: opp.scope,
    };
  }).filter((b): b is Bid => b !== null);
}

// ── Grouping ───────────────────────────────────────────────────────────────

type UrgencyGroups = {
  needsAction: Bid[];
  inProgress: Bid[];
  saved: Bid[];
  closed: Bid[];
};

const CLOSED_STAGES = new Set<BidStage>(["won", "not_awarded", "declined"]);

function needsMarcus(bid: Bid): boolean {
  if (bid.stage === "reviewing") return true;
  if (bid.stage === "drafting") return true;
  if (bid.stage === "with_mentor") {
    const r = bid.mentorReviewId ? getReview(bid.mentorReviewId) : null;
    if (r && isUnread(r)) return true;
  }
  if (bid.deadline) {
    const d = daysUntil(bid.deadline);
    if (d >= 0 && d <= 7 && bid.stage !== "submitted") return true;
  }
  return false;
}

export function groupByUrgency(bids: Bid[]): UrgencyGroups {
  const needsAction: Bid[] = [];
  const inProgress: Bid[] = [];
  const saved: Bid[] = [];
  const closed: Bid[] = [];

  for (const b of bids) {
    if (CLOSED_STAGES.has(b.stage) || b.stage === "submitted") {
      closed.push(b);
      continue;
    }
    // Saved opps always stay in the saved group, regardless of deadline urgency.
    if (b.stage === "saved") {
      saved.push(b);
      continue;
    }
    if (needsMarcus(b)) {
      needsAction.push(b);
      continue;
    }
    inProgress.push(b);
  }

  needsAction.sort((a, b) => {
    const ad = a.deadline ? daysUntil(a.deadline) : Number.MAX_SAFE_INTEGER;
    const bd = b.deadline ? daysUntil(b.deadline) : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  });

  return { needsAction, inProgress, saved, closed };
}

export const STAGE_ORDER: BidStage[] = [
  "saved",
  "reviewing",
  "with_mentor",
  "drafting",
  "submitted",
  "won",
  "not_awarded",
  "declined",
];

export const STAGE_LABEL: Record<BidStage, string> = {
  saved: "Saved",
  reviewing: "Reviewing",
  with_mentor: "With Mentor",
  drafting: "Drafting",
  submitted: "Submitted",
  won: "Won",
  not_awarded: "Not Awarded",
  declined: "Declined",
};

export function groupByStage(bids: Bid[]): Array<{ stage: BidStage; bids: Bid[] }> {
  return STAGE_ORDER.map((stage) => ({
    stage,
    bids: bids.filter((b) => b.stage === stage),
  })).filter((g) => g.bids.length > 0);
}

// ── Stage context line ─────────────────────────────────────────────────────

export function contextLineFor(bid: Bid): string | null {
  if (bid.contextOverride) return bid.contextOverride;
  switch (bid.stage) {
    case "reviewing":
      return bid.grantVerdict
        ? `Grant: ${bid.grantVerdict.verdict} — ${bid.grantVerdict.oneLine}`
        : "Waiting on your bid/no-bid decision.";
    case "with_mentor": {
      const r = bid.mentorReviewId ? getReview(bid.mentorReviewId) : null;
      if (!r) return "Sent to a mentor.";
      const lastMentor = [...r.messages].reverse().find((m) => m.from === "mentor");
      if (lastMentor) return `Mentor reviewing — replied ${relativeTime(lastMentor.sentAt)}.`;
      return "Mentor reviewing — awaiting reply.";
    }
    case "saved":
      return "Saved — not yet reviewed.";
    case "drafting":
      return "Draft in progress with Ava.";
    case "submitted":
      return "Submitted — awaiting outcome.";
    case "won":
      return "Awarded.";
    case "not_awarded":
      return "Not awarded.";
    case "declined":
      return "Declined.";
  }
}

// ── Hunter early-warning nudge ─────────────────────────────────────────────

export function pickHunterNudge(
  bids: Bid[],
): { message: string; cta?: { label: string; href: string } } | null {
  // Closest-deadline bid that hasn't gone to a mentor yet.
  const candidates = bids
    .filter((b) => b.deadline && b.stage !== "with_mentor" && b.stage !== "submitted")
    .filter((b) => !CLOSED_STAGES.has(b.stage))
    .map((b) => ({ b, d: daysUntil(b.deadline as string) }))
    .filter((x) => x.d >= 0 && x.d <= 7)
    .sort((a, b) => a.d - b.d);

  if (candidates.length === 0) return null;

  const { b, d } = candidates[0];
  const dayWord = d === 1 ? "day" : "days";
  return {
    message: `The ${shortTitle(b.title)} closes in ${d} ${dayWord} and hasn't gone to a mentor yet — want to send it now?`,
    cta: { label: "Send to a mentor", href: `/opportunities/${b.opportunityId}` },
  };
}

function shortTitle(t: string): string {
  // Light shorten: take the part before " — " if present.
  const i = t.indexOf(" — ");
  return i > 0 ? t.slice(0, i) : t;
}

// ── Kanban columns (the pipeline board) ────────────────────────────────────

export type BoardColumnId = "saved" | "mentor" | "proposal" | "outcome";

export interface BoardColumn {
  id: BoardColumnId;
  title: string;
  sub: string;
  bids: Bid[];
  /** Pipeline value in this column (sum of opp value midpoints, active bids). */
  totalUsd: number;
}

const COLUMN_STAGES: Record<BoardColumnId, BidStage[]> = {
  saved: ["saved", "reviewing"],
  mentor: ["with_mentor"],
  proposal: ["drafting"],
  outcome: ["submitted", "won", "not_awarded", "declined"],
};

const COLUMN_META: Record<BoardColumnId, { title: string; sub: string }> = {
  saved: { title: "Saved", sub: "Worth pursuing" },
  mentor: { title: "Mentor review", sub: "Second opinion in flight" },
  proposal: { title: "Proposal", sub: "Crafting, pricing, submission" },
  outcome: { title: "Outcome", sub: "Submitted & results" },
};

const OUTCOME_ORDER: Record<string, number> = {
  submitted: 0,
  won: 1,
  not_awarded: 2,
  declined: 3,
};

/**
 * Group bids into the four pipeline columns.
 * `showExpired=false` (default) hides expired cards from the active columns —
 * the Outcome column is history by design and never filters.
 */
export function groupByColumn(bids: Bid[], showExpired: boolean): BoardColumn[] {
  return (Object.keys(COLUMN_STAGES) as BoardColumnId[]).map((id) => {
    const stages = new Set(COLUMN_STAGES[id]);
    let cols = bids.filter((b) => stages.has(b.stage));
    if (id !== "outcome" && !showExpired) cols = cols.filter((b) => !b.expired);
    cols =
      id === "outcome"
        ? [...cols].sort(
            (a, b) =>
              (OUTCOME_ORDER[a.stage] ?? 9) - (OUTCOME_ORDER[b.stage] ?? 9) ||
              new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
          )
        : [...cols].sort(
            (a, b) =>
              (a.daysLeft ?? Number.MAX_SAFE_INTEGER) - (b.daysLeft ?? Number.MAX_SAFE_INTEGER),
          );
    const totalUsd = cols
      .filter((b) => !b.expired && b.stage !== "not_awarded" && b.stage !== "declined")
      .reduce((s, b) => s + b.valueMidUsd, 0);
    return { id, ...COLUMN_META[id], bids: cols, totalUsd };
  });
}

/** Count of expired cards currently hidden behind the "Show expired" toggle. */
export function expiredBidCount(bids: Bid[]): number {
  return bids.filter((b) => !OUTCOME_STAGES.has(b.stage) && b.expired).length;
}
