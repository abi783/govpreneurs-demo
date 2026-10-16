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

export interface GrantTake {
  callWord: string;
  tone: "ok" | "warn" | "blocked";
  confidence: { level: "high" | "medium" | "low"; filled: number; of: number };
  paths: PathCall[];
  summary: RichLine | null;
  strengths: TakeItem[];
  limits: TakeItem[];
  counts: { strengths: number; blockers: number; risks: number };
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
        body: [t(r.firmValue && r.firmValue !== "—" ? `${r.firmValue.replace(/\s*✓\s*$/, "").replace(/\.$/, "")}.` : "You meet this requirement.")],
        evidence: r.sourceClause ? [r.sourceClause] : undefined,
      })),
  ];

  // ── Blockers: the hard gate first, then anything the matrix marks missing.
  const limits: TakeItem[] = [];
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
  for (const row of complianceMatrix.filter((r) => r.status === "missing")) {
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
  if (verdict.competitiveRisk) {
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
          ? [t("No unresolved issue currently blocks bidding as the prime.")]
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
      reason: blockerUnrecoverable
        ? lockedReason
        : subState === "go"
          ? [t("No unresolved issue currently prevents pursuing this as a sub.")]
          : verdict.confidence.remedy,
    },
  ];

  return {
    callWord: CALL_WORD[verdict.value],
    tone: TONE[verdict.value],
    confidence: {
      level: verdict.confidence.level,
      // DEMO: a story review can light 4 of the 5 dots.
      filled: Math.min(5, Math.max(1, verdict.confidence.dots ?? DOTS[verdict.confidence.level])),
      of: 5,
    },
    paths,
    summary: verdict.gist ?? null,
    strengths,
    limits,
    counts,
    changes,
    thesis: verdict.headline ?? [],
    wouldChange: verdict.wouldChange ?? [],
    competitiveRisk: verdict.competitiveRisk ?? null,
    next: action.primary ? { title: action.primary.label, body: action.rationale ?? null } : null,
  };
}
