// DEMO: turns a written Grant brief (story/grantBriefs.ts, or one written in this
// folder in the same shape) into production's `GrantAnalysis`, field by field.
//
// The brief holds Grant's words. `Extras` holds what the page needs besides words:
// which phrase to bold, which clause backs which claim, the lead times, the
// trail of checks. A test (grant.test.ts) checks that every sentence of a brief
// shows up in the analysis, so nothing a brief says is lost on the way.

import { isoDaysFromNow, dateDaysFromNow } from "@/demo/story/clock";
import type { GrantBrief, ReadName } from "@/demo/story/grantBriefs";
import { PERSONA } from "@/demo/story/persona";
import type {
  AmendmentInfo,
  CapturePath,
  ComplianceRow,
  GrantAnalysis,
  NoticeType,
  OpenQuestion,
  Pin,
  Read,
  RedTeamObjection,
  RichLine,
  RoadmapItem,
  SectionCoverage,
  SuggestedChip,
  TrailGroup,
  TypedWarning,
  Verdict,
  WarningKind,
} from "@/lib/grant/types";
import type { OppFacts } from "./facts";
import { boldIn, firstSentence, rt } from "./rich";
import { clauseOf, clausePin, type Solicitation } from "./solicitation";

// ── The shapes ───────────────────────────────────────────────────────────

export type AuthoredChip =
  | string
  | { label: string; kind: "elicit"; target: string }
  | { label: string; kind: "route"; target: string };

/** A brief written in this folder. Same as a story brief, but a few reads and richer chips are allowed. */
export type AuthoredBrief = Omit<GrantBrief, "reads" | "chips"> & {
  reads: Partial<GrantBrief["reads"]>;
  chips: AuthoredChip[];
};

/** How a brief row in the compliance list maps to a clause of the solicitation. */
export interface RowSpec {
  match: RegExp;
  /** The clause kind that backs the row (see solicitation.ts). */
  kind: string;
  category: ComplianceRow["category"];
  required: string;
  /** Set false for a block that cannot be closed inside this bid window. */
  closable?: boolean;
  /** Replace the brief's note in the "you have" column. */
  firmValue?: string;
}

export interface Extras {
  path: CapturePath;
  noticeType?: NoticeType;
  checks: [number, number];
  /** Lead times in days: what a compliant bid needs before the due date. */
  lead: Partial<{ bonding: number; ppq: number; subQuote: number; writing: number }>;
  passedEvents?: { label: string; daysAgo: number }[];
  /** Bold phrase inside the brief's gist. */
  gistBold: string;
  /** Bold phrase inside each sentence of the thesis. */
  thesisBold: string[];
  /** The kind of each entry in `brief.limits`, in order. */
  limitKinds: WarningKind[];
  competitiveRisk?: string;
  readBold: Partial<Record<ReadName, string>>;
  readPins: Partial<Record<ReadName, Pin[]>>;
  readDossier?: Partial<Record<ReadName, string[]>>;
  /** The read that decides the call. */
  limiting?: ReadName;
  /** Reads that stop the bid. */
  blocking?: ReadName[];
  rows: RowSpec[];
  nextBold: string;
  wouldChangeBold?: (string | undefined)[];
  redTeamBold: (string | undefined)[];
  trail: TrailGroup[];
  coverage?: SectionCoverage[];
  openQuestions?: OpenQuestion[];
  amendment?: AmendmentInfo;
  roadmap?: RoadmapItem[];
  briefingBold?: (string | undefined)[];
  /** Gaps that stand between the member and the win, for the action block. */
  gapToWin?: { item: string; have: boolean }[];
  /** Words for "what would change" when the call cannot change. */
  remedy: string;
  citations: Pin[];
  clearance?: { fcl: string | null; personnel: string | null };
  /** A line that points at the member's risk, in plain words. */
  warningsExtra?: TypedWarning[];
}

export interface EncodeContext {
  f: OppFacts;
  sol: Solicitation;
}

// ── Small helpers ────────────────────────────────────────────────────────

/** Replace "26 days" in a story text with the live count, so every screen agrees on today's number. */
export function localize(text: string, f: OppFacts): string {
  const story = f.opp.closesInDays;
  if (story === f.daysLeft) return text;
  return text.replace(new RegExp(`\\b${story} days\\b`, "g"), `${f.daysLeft} days`);
}

const VERDICT: Record<string, Verdict> = { bid: "bid", review: "review", no_bid: "no-bid" };

export function verdictOf(f: OppFacts): Verdict {
  return VERDICT[f.opp.grant.verdict];
}

/** "Analyzed 3 hours ago", with a stable number for each opportunity. */
export function analyzedAt(f: OppFacts): { iso: string; line: RichLine } {
  let h = 0;
  for (const ch of f.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hours = 1 + (h % 9);
  const iso = new Date(Date.now() - hours * 3_600_000).toISOString();
  return { iso, line: rt(`Analyzed ${hours} ${hours === 1 ? "hour" : "hours"} ago.`) };
}

export function gateInputsFor(f: OppFacts, clearance?: Extras["clearance"]): GrantAnalysis["gateInputs"] {
  return {
    setAside: {
      required: f.setAside,
      firmHolds: [...PERSONA.setAsideEligibility],
      verified: f.eligibleSetAside,
    },
    naics: {
      code: f.opp.naics,
      sizeStandard: f.opp.naics === PERSONA.primaryNaics ? "$47.0M" : "",
      firmIsSmall: true,
    },
    sam: { activeThrough: PERSONA.samActiveUntil, awardWindowEnds: dateDaysFromNow(f.opp.closesInDays + 45) },
    license: { requiredState: f.place.state, firmLicensedStates: [...PERSONA.serviceStates] },
    ...(clearance ? { clearance: { fcl: clearance.fcl, personnel: clearance.personnel } } : {}),
  };
}

export function statusFor(rating: "strong" | "good" | "watch" | "weak", blocking: boolean): {
  status: Read["status"];
  epistemic: Read["epistemic"];
} {
  if (blocking) return { status: "blocking", epistemic: "verified" };
  switch (rating) {
    case "strong":
      return { status: "strong", epistemic: "verified" };
    case "good":
      return { status: "strong", epistemic: "stated" };
    case "watch":
      return { status: "mixed", epistemic: "stated" };
    case "weak":
      return { status: "weak", epistemic: "stated" };
  }
}

/** "Label: sentence" → bold label, then the rest. */
function labelled(text: string): RichLine {
  const at = text.indexOf(": ");
  if (at < 0 || at > 60) return [{ text }];
  return [{ text: text.slice(0, at), bold: true }, { text: text.slice(at) }];
}

/** Split a thesis into its sentences, one line each, with one bold phrase per line. */
function thesisLines(text: string, bolds: string[]): RichLine[] {
  const parts = text.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [text];
  return parts.map((s, i) => boldIn(s, bolds[i]));
}

function chipsFrom(chips: AuthoredChip[]): SuggestedChip[] {
  const slots = ["doubt", "improve", "act"] as const;
  return chips.slice(0, 3).map((c, i) => {
    if (typeof c === "string") return { slot: slots[i], label: c, kind: "ask" as const };
    return c.kind === "elicit"
      ? { slot: slots[i], label: c.label, kind: "elicit" as const, target: c.target }
      : { slot: slots[i], label: c.label, kind: "route" as const, target: c.target };
  });
}

// ── The encoder ──────────────────────────────────────────────────────────

export function encodeBrief(
  brief: AuthoredBrief,
  ex: Extras,
  { f, sol }: EncodeContext,
): GrantAnalysis {
  const verdict = verdictOf(f);
  const opp = f.opp;
  const when = analyzedAt(f);

  // Reads, in the order the brief wrote them.
  const readNames = Object.keys(brief.reads) as ReadName[];
  const reads: Read[] = readNames.map((name, i) => {
    const r = brief.reads[name]!;
    const isBlocking = ex.blocking?.includes(name) ?? false;
    const { status, epistemic } = statusFor(r.rating, isBlocking);
    const text = localize(r.text, f);
    const dossier = ex.readDossier?.[name]?.map((l) => rt(localize(l, f)));
    return {
      id: i + 1,
      name,
      status,
      epistemic,
      order: i,
      limiting: ex.limiting === name ? true : undefined,
      short: boldIn(firstSentence(text), ex.readBold[name] && firstSentence(text).includes(ex.readBold[name]!) ? ex.readBold[name] : undefined),
      sentence: boldIn(text, ex.readBold[name]),
      evidence: ex.readPins[name] ?? [],
      dossier,
    };
  });

  // Compliance matrix: one row for each line of the brief.
  const complianceMatrix: ComplianceRow[] = brief.compliance.map((c) => {
    const spec = ex.rows.find((r) => r.match.test(c.requirement));
    if (!spec) throw new Error(`${f.id}: no row spec for "${c.requirement}"`);
    const status: ComplianceRow["status"] =
      c.status === "have" ? "have" : c.status === "missing" ? "missing" : "confirm";
    return {
      requirement: rt(c.requirement),
      sourceClause: clausePin(sol, spec.kind),
      category: spec.category,
      requiredValue: spec.required,
      firmValue: spec.firmValue ?? c.note.replace(/\.$/, ""),
      status,
      closableInWindow: status === "missing" ? (spec.closable ?? false) : undefined,
    };
  });

  const warnings: TypedWarning[] = [
    ...brief.limits.map((l, i) => ({ kind: ex.limitKinds[i] ?? "proposal-weakness", summary: labelled(localize(l, f)) })),
    ...(ex.warningsExtra ?? []),
  ];

  const dots = brief.confidence;
  const level: "high" | "medium" | "low" = dots >= 4 ? "high" : dots === 3 ? "medium" : "low";
  const openQuestions = ex.openQuestions ?? [];

  const redTeam: RedTeamObjection[] = brief.redTeam.map((o, i) => ({
    challenge: rt(o.challenge),
    resolution: boldIn(localize(o.answer, f), ex.redTeamBold[i]),
  }));

  const keyDateTrail = brief.keyDates
    .map((k) => `${k.label} ${new Date(isoDaysFromNow(k.inDays)).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`)
    .join(" · ");
  const questionsRef = clauseOf(sol, "questions")?.clause.ref;
  const trail: TrailGroup[] = ex.trail.map((g, gi) =>
    gi === 0
      ? {
          ...g,
          checkCount: g.checkCount + 1,
          items: [
            ...g.items,
            { glyph: "neutral" as const, text: rt(`Key dates: ${keyDateTrail}`), source: questionsRef ? `§${questionsRef}` : "Notice" },
          ],
        }
      : g,
  );

  const nextRationale = localize(brief.nextMove.rationale, f);

  return {
    id: `grant-${f.id}`,
    opportunityId: f.id,
    firmProfileVersion: "demo",
    amendmentVersion: ex.amendment ? "1" : "0",
    amendment: ex.amendment,
    postNoBidRoadmap: ex.roadmap,
    sectionCoverage: ex.coverage,
    meta: {
      stage: "complete",
      analyzedAt: when.iso,
      checksRun: ex.checks[0],
      sourcesConsulted: ex.checks[1],
      freshnessLine: when.line,
      noticeType: ex.noticeType ?? "solicitation",
    },
    gateInputs: gateInputsFor(f, ex.clearance),
    realDeadlineInputs: {
      responseDue: f.closesAtISO,
      bondingLeadDays: ex.lead.bonding ?? 0,
      ppqTurnaroundDays: ex.lead.ppq ?? 0,
      subQuoteDays: ex.lead.subQuote ?? 0,
      writingDays: ex.lead.writing ?? 0,
      passedEvents: (ex.passedEvents ?? []).map((p) => ({ label: p.label, date: dateDaysFromNow(-p.daysAgo) })),
    },
    complianceMatrix,
    verdict: {
      value: verdict,
      path: ex.path,
      gist: boldIn(localize(brief.gist, f), ex.gistBold),
      warnings,
      headline: thesisLines(localize(brief.thesis, f), ex.thesisBold),
      wouldChange: brief.wouldChange.map((w, i) => boldIn(localize(w, f), ex.wouldChangeBold?.[i])),
      competitiveRisk: ex.competitiveRisk ? rt(ex.competitiveRisk) : undefined,
      confidence: {
        level,
        dots,
        openQuestions: openQuestions.length,
        remedy: rt(ex.remedy),
      },
    },
    reads,
    action: {
      path: ex.path,
      primary: { label: brief.nextMove.label, target: brief.nextMove.to },
      secondaries: brief.secondaryMove
        ? [
            brief.secondaryMove.to === "/mentors"
              ? { label: brief.secondaryMove.label, target: "mentor", price: 97 }
              : { label: brief.secondaryMove.label, target: brief.secondaryMove.to },
          ]
        : [],
      rationale: boldIn(nextRationale, ex.nextBold),
      gapToWin: ex.gapToWin?.map((g) => ({ item: rt(g.item), have: g.have })),
    },
    trail,
    findings: [],
    redTeam,
    citations: ex.citations,
    rail: {
      briefing: brief.railBriefing.map((l, i) => boldIn(localize(l, f), ex.briefingBold?.[i])),
      openQuestions,
      suggestedChips: chipsFrom(brief.chips),
    },
  };
}
