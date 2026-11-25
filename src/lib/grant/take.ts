// Grant's take — the view model behind the rebuilt verdict card.
//
// Pure derivation from an existing GrantAnalysis plus the two computed objects
// (gate strip, real deadline). It invents nothing: every line here traces to a
// field the analysis already carries, so fixtures and the real analyses render
// the same shape. Where a field is absent the section drops out rather than
// filling with placeholder copy.

import type {
  ComplianceRow,
  GateStrip,
  GrantAnalysis,
  OpenItem,
  Pin,
  RealDeadline,
  RichLine,
  Verdict,
} from "./types";

const t = (text: string, bold = false) => ({ text, bold });

export type TakeKind = "strength" | "blocker" | "risk";

export interface TakeItem {
  kind: TakeKind;
  /** "blocked" → stop sign, "warn" → triangle, "ok" → check. */
  tone: "ok" | "warn" | "blocked";
  title: string;
  body: RichLine;
  /** Required-vs-held rows, e.g. Bond required $2.0M / Your capacity $200K. */
  pairs?: { label: string; value: string }[];
  evidence?: Pin[];
}

export interface PathCall {
  label: string;
  state: "go" | "no-go" | "unknown";
}

export interface ChangeLine {
  path: string;
  state: "go" | "no-go" | "unknown";
  headline: string;
  reason: RichLine;
}

/** Something Grant still has to ask — one tap opens it in the rail. */
export interface TakeQuestion {
  id: string;
  text: RichLine;
}

/** A question the member already answered. One tap opens it in the rail to change. */
export interface TakeAnswer {
  id: string;
  text: RichLine;
  value: string;
  /** Set when the answer came from another of the member's opportunities. */
  reusedFrom?: { title: string | null; date: string };
}

export interface GrantTake {
  callWord: string;
  tone: "ok" | "warn" | "blocked";
  confidence: { level: "high" | "medium" | "low"; filled: number; of: number };
  paths: PathCall[];
  summary: RichLine | null;
  strengths: TakeItem[];
  limits: TakeItem[];
  questions: TakeQuestion[];
  answered: TakeAnswer[];
  counts: { strengths: number; blockers: number; risks: number; questions: number };
  changes: ChangeLine[];
  thesis: RichLine[];
  /** DEMO: lines that say what would change the call. */
  wouldChange: RichLine[];
  competitiveRisk: RichLine | null;
  next: { title: string; body: RichLine | null } | null;
}

const CALL_WORD: Record<Verdict, string> = {
  bid: "Bid",
  review: "Needs review",
  "no-bid": "No-bid",
};
const TONE: Record<Verdict, "ok" | "warn" | "blocked"> = {
  bid: "ok",
  review: "warn",
  "no-bid": "blocked",
};
// Five dots is the scale; the level chooses how many are lit.
const DOTS: Record<"high" | "medium" | "low", number> = { high: 5, medium: 3, low: 1 };

function plain(line: RichLine | undefined): string {
  return (line ?? []).map((s) => s.text).join("");
}

/** Title-cases a read name into the card's small-caps item heading. */
function itemTitle(s: string): string {
  return s.replace(/[?.]$/, "");
}

/** g45-items: the limit heading for each kind of open item. */
const ITEM_TITLE: Record<OpenItem["kind"], string> = {
  documents: "Missing documents",
  eligibility: "Eligibility",
  license: "License to confirm",
  qualification: "Qualification to confirm",
  bond: "Bond to confirm",
  insurance: "Insurance to confirm",
  experience: "Experience to confirm",
  financial: "Financial records",
  place: "Place of work",
  scope: "Kind of work",
  time: "Time",
  meeting: "Mandatory meeting",
};
/** g45-items: how many open items the limits show. */
const MAX_ITEM_LIMITS = 3;
/** The "Can you win it?" read. */
const WIN_READ_ID = 1;

/**
 * g45-items: the top open items as limits, in weight order. An item
 * that a gate blocker above already states is left out.
 */
function itemLimits(
  items: OpenItem[],
  legalBlocked: boolean,
  runwayBlocked: boolean,
  slots = MAX_ITEM_LIMITS,
): TakeItem[] {
  return items
    .filter((i) => !(legalBlocked && i.kind === "eligibility") && !(runwayBlocked && i.kind === "time"))
    .slice(0, slots)
    .map(itemLimit);
}

/** One open item as a limit. */
function itemLimit(i: OpenItem): TakeItem {
  return {
    kind: i.weight === "blocker" ? "blocker" : "risk",
    tone: i.weight === "blocker" ? "blocked" : "warn",
    title: ITEM_TITLE[i.kind],
    body: [t(i.sentence)],
    evidence: [i.evidence],
  };
}

/**
 * The open item that states the reason for a No-bid (backend g-reason-first),
 * when the limits must show it first. A set-aside reason
 * is left out when the legal gate already states it.
 */
function callReasonLimit(items: OpenItem[] | undefined, legalBlocked: boolean): OpenItem | null {
  const reason = items?.find((i) => i.callReason) ?? null;
  return reason && !(legalBlocked && reason.kind === "eligibility") ? reason : null;
}

function moneyPairs(row: ComplianceRow): { label: string; value: string }[] | undefined {
  if (!row.requiredValue || !row.firmValue) return undefined;
  return [
    { label: "Required", value: String(row.requiredValue) },
    { label: "You have", value: String(row.firmValue) },
  ];
}

export function buildTake(
  analysis: GrantAnalysis,
  gates: GateStrip,
  deadline: RealDeadline,
): GrantTake {
  const { verdict, action, complianceMatrix, reads } = analysis;

  // ── The two capture paths, read off the single path the analysis committed to.
  // `deadline` is computed live from `now` (computeRealDeadline), so it can go
  // "blocked" after the analysis was run — the runway ran out while the member
  // was reading it. Without checking it here, the path boxes could still read
  // "Go" right beside a "No runway left" blocker in the limits column below.
  const runwayBlocked = deadline.status === "blocked";
  const primeState: PathCall["state"] =
    verdict.value === "no-bid" || gates.legal.tone === "blocked" || runwayBlocked
      ? "no-go"
      : verdict.path === "prime"
        ? "go"
        : verdict.path === "sub"
          ? "no-go"
          : "unknown";
  const subState: PathCall["state"] =
    verdict.value === "no-bid" || runwayBlocked
      ? "no-go"
      : verdict.path === "sub" || verdict.path === "prime"
        ? "go"
        : "unknown";
  const paths: PathCall[] = [
    { label: "Prime path", state: primeState },
    { label: "Subcontract path", state: subState },
  ];

  // ── Strengths: the reads Grant scored strong, plus every requirement already met.
  const strengths: TakeItem[] = [
    ...reads
      .filter((r) => r.status === "strong")
      .map<TakeItem>((r) => ({
        kind: "strength",
        tone: "ok",
        title: itemTitle(r.name),
        body: r.short ?? r.sentence,
        evidence: r.evidence,
      })),
    ...complianceMatrix
      .filter((r) => r.status === "have")
      .map<TakeItem>((r) => ({
        kind: "strength",
        tone: "ok",
        title: itemTitle(plain(r.requirement)),
        // DEMO: say what meets it ("Active until April 2027"), not the same line seven times.
        body: [t(r.selfReported ? "You told me you meet this." : r.firmValue && r.firmValue !== "—" ? `${r.firmValue.replace(/\s*✓\s*$/, "").replace(/\.$/, "")}.` : "You meet this requirement.")],
        evidence: r.sourceClause ? [r.sourceClause] : undefined,
      })),
  ];

  // ── Every open question, the same list and order the rail asks from.
  const questions: TakeQuestion[] = (analysis.rail.openQuestions ?? []).map((q) => ({
    id: q.id,
    text: q.display ?? q.question,
  }));
  const holdsReason = (fallback: string): RichLine =>
    questions.length > 0
      ? [
          t(
            questions.length === 1
              ? "This stays a go unless you answer no to the open question."
              : `This stays a go unless you answer no to one of the ${questions.length} open questions.`,
          ),
        ]
      : [t(fallback)];

  // ── Blockers: the reason for a No-bid first, then the hard gate, then anything the matrix marks missing.
  const limits: TakeItem[] = [];
  const reason = callReasonLimit(analysis.openItems, gates.legal.tone === "blocked");
  if (reason) limits.push(itemLimit(reason));
  if (gates.legal.tone === "blocked" && gates.legal.blocker) {
    limits.push({
      kind: "blocker",
      tone: "blocked",
      title: "Hard blocker",
      body: gates.legal.reason,
      evidence: gates.legal.evidence,
    });
  }
  if (deadline.status === "blocked") {
    limits.push({
      kind: "blocker",
      tone: "blocked",
      title: "No runway left",
      body: deadline.sentence,
    });
  }
  const items = analysis.openItems;
  if (items) {
    const rest = reason ? items.filter((i) => i !== reason) : items;
    limits.push(
      ...itemLimits(rest, gates.legal.tone === "blocked", runwayBlocked, MAX_ITEM_LIMITS - (reason ? 1 : 0)),
    );
  }
  for (const row of items ? [] : complianceMatrix.filter((r) => r.status === "missing")) {
    limits.push({
      kind: "risk",
      tone: "warn",
      title: "Capacity constraint",
      body: row.requirement,
      pairs: moneyPairs(row),
      evidence: row.sourceClause ? [row.sourceClause] : undefined,
    });
  }
  for (const w of verdict.warnings ?? []) {
    // "2 required items…" only counts what the question list names outright.
    if (w.kind === "proposal-weakness" && questions.length > 0) continue;
    limits.push({
      kind: w.kind === "disqualifier" ? "blocker" : "risk",
      tone: w.kind === "disqualifier" ? "blocked" : "warn",
      title:
        w.kind === "disqualifier"
          ? "Hard blocker"
          : w.kind === "winning-hurts"
            ? "Delivery risk"
            : w.kind === "responsibility"
              ? "Responsibility risk"
              : "Proposal weakness",
      body: w.summary,
    });
  }
  // With the open items on, an open field is never both a strength and a limit.
  const winIsStrength = reads.some((r) => r.id === WIN_READ_ID && r.status === "strong");
  if (verdict.competitiveRisk && !(items && winIsStrength)) {
    limits.push({
      kind: "risk",
      tone: "warn",
      title: "Competitive weakness",
      body: verdict.competitiveRisk,
    });
  }

  const counts = {
    strengths: strengths.length,
    blockers: limits.filter((l) => l.kind === "blocker").length,
    risks: limits.filter((l) => l.kind === "risk").length,
    questions: questions.length,
  };

  // ── What would move each path, stated per path rather than as one remedy line.
  // A runway that has actually run out is just as unrecoverable within this
  // solicitation as an unclosable legal gate — it locks both paths, not only
  // whichever gate tripped it, so it takes the same "Locked" wording.
  const legalUnrecoverable =
    gates.legal.tone === "blocked" && gates.legal.blocker?.closableInWindow === false;
  const blockerUnrecoverable = legalUnrecoverable || runwayBlocked;
  const lockedReason = runwayBlocked ? deadline.sentence : gates.legal.reason;
  const changes: ChangeLine[] = [
    {
      path: "Prime recommendation",
      state: primeState,
      headline:
        primeState === "go"
          ? "Remains go"
          : blockerUnrecoverable
            ? "Locked at no-go for this solicitation"
            : "Currently no-go",
      reason: blockerUnrecoverable
        ? lockedReason
        : primeState === "go"
          ? holdsReason("No unresolved issue currently blocks bidding as the prime.")
          : verdict.confidence.remedy,
    },
    {
      path: "Subcontract recommendation",
      state: subState,
      headline:
        subState === "go"
          ? "Remains go"
          : blockerUnrecoverable
            ? "Locked at no-go for this solicitation"
            : "Currently no-go",
      // DEMO: a bond that blocks the prime path does not block a subcontract, so a path
      // that is still "go" never shows the reason that locks the other.
      reason:
        subState === "go"
          ? holdsReason("No unresolved issue currently prevents pursuing this as a sub.")
          : blockerUnrecoverable
            ? lockedReason
            : verdict.confidence.remedy,
    },
  ];

  // DEMO: a sources sought is a notice to reply to, not a bid. It has no prime or subcontract
  // path, and its call word is "Reply".
  const isNotice = analysis.meta.noticeType === "sources-sought";
  return {
    callWord: isNotice && verdict.value === "bid" ? "Reply" : CALL_WORD[verdict.value],
    tone: TONE[verdict.value],
    confidence: {
      level: verdict.confidence.level,
      // DEMO: a story review can light 4 of the 5 dots.
      filled: Math.min(5, Math.max(1, verdict.confidence.dots ?? DOTS[verdict.confidence.level])),
      of: 5,
    },
    paths: isNotice ? [] : paths,
    summary: verdict.gist ?? null,
    strengths,
    limits,
    questions,
    answered: (analysis.rail.answeredQuestions ?? []).map((a) => ({
      id: a.id,
      text: a.display ?? a.question,
      value: a.value,
      ...(a.reusedFrom ? { reusedFrom: a.reusedFrom } : {}),
    })),
    counts,
    changes: isNotice ? [] : changes,
    // The live analysis builds its headline from the same sentence as the gist.
    // Showing both prints the paragraph twice, so a repeat drops out.
    thesis: (verdict.headline ?? []).filter((ln) => plain(ln) !== plain(verdict.gist)),
    wouldChange: verdict.wouldChange ?? [],
    competitiveRisk: verdict.competitiveRisk ?? null,
    next: action.primary ? { title: action.primary.label, body: action.rationale ?? null } : null,
  };
}
