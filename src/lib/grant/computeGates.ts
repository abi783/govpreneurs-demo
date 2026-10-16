// The Gate Strip — two binary lights, computed in code before any reasoning
// (PRD 96 §3, §11.2). Driven by the resolved compliance matrix (the same object
// that powers the Compliance Matrix artifact, so they can never disagree, §8)
// plus the Real Deadline. If a hard gate fails, it dominates — no pillar theater.

import type {
  ComplianceRow,
  GateLight,
  GateStrip,
  NoticeType,
  RealDeadline,
  RichLine,
} from "./types";

const LEGAL_CATEGORIES: ComplianceRow["category"][] = [
  "eligibility",
  "insurance",
  "bonding",
  "clearance",
  "license",
  "cert",
];
const SUBMISSION_CATEGORIES: ComplianceRow["category"][] = ["submission", "artifact"];

/** An unlock path is only offered when a gate is closable in the window (§12.6). */
const CLOSABLE_UNLOCK: Partial<Record<ComplianceRow["category"], { path: string; time: string }>> =
  {
    insurance: { path: "Add the required coverage with your carrier", time: "~1–2 weeks" },
    license: { path: "Register for the state license", time: "~2–4 weeks" },
    cert: { path: "File the certification", time: "varies" },
    submission: { path: "Complete the submission item", time: "before the deadline" },
  };

function plain(row: ComplianceRow): string {
  return row.requirement.map((s) => s.text).join("");
}

function legalLight(matrix: ComplianceRow[]): GateLight {
  const rows = matrix.filter((r) => LEGAL_CATEGORIES.includes(r.category));
  const missing = rows.filter((r) => r.status === "missing");
  const confirm = rows.filter((r) => r.status === "confirm" || r.status === "unknown");

  const question = "Can you legally bid this?";

  if (missing.length > 0) {
    // Headline the most severe: an unclosable block first.
    const blockerRow = missing.find((r) => r.closableInWindow === false) ?? missing[0];
    const closable = blockerRow.closableInWindow !== false;
    const unlock = closable ? CLOSABLE_UNLOCK[blockerRow.category] : undefined;
    const reason: RichLine = [
      { text: `${plain(blockerRow)} — `, bold: true },
      {
        text: closable
          ? "required, and not on file yet."
          : "required, and it can't be cleared inside this bid window.",
      },
    ];
    return {
      question,
      tone: "blocked",
      word: "Blocked",
      glyph: "x",
      reason,
      blocker: {
        gate: plain(blockerRow),
        unlockPath: unlock?.path ?? "",
        closableInWindow: closable,
        timeToClear: unlock?.time ?? "not within this window",
      },
      evidence: [blockerRow.sourceClause],
    };
  }

  if (confirm.length > 0) {
    const row = confirm[0];
    const reason: RichLine = [
      { text: `${plain(row)} — `, bold: true },
      { text: "not on your profile yet. Confirm it and I can call this properly." },
    ];
    return {
      question,
      tone: "confirm",
      word: "Confirm",
      glyph: "help",
      reason,
      evidence: [row.sourceClause],
    };
  }

  return {
    question,
    tone: "ok",
    word: "Clear",
    glyph: "check",
    reason: [{ text: "You clear every eligibility gate on this one." }],
    evidence: rows.slice(0, 2).map((r) => r.sourceClause),
  };
}

function submittableLight(
  matrix: ComplianceRow[],
  deadline: RealDeadline,
  noticeType: NoticeType,
): GateLight {
  const question = "Can you get a compliant bid in?";

  // Sources Sought / RFI / presolicitation: a short response, not a full bid (§10).
  if (noticeType !== "solicitation") {
    return {
      question: "Can you respond in time?",
      tone: "ok",
      word: "Yes",
      glyph: "check",
      reason: [
        { text: "This is a " },
        { text: noticeType === "sources-sought" ? "Sources Sought" : "pre-bid notice", bold: true },
        { text: " — a short response, not a full proposal." },
      ],
      evidence: [],
    };
  }

  const missingSubmission = matrix.filter(
    (r) => SUBMISSION_CATEGORIES.includes(r.category) && r.status === "missing",
  );

  if (deadline.status === "blocked" || missingSubmission.length > 0) {
    const passed = deadline.passedEvents.find((e) => e.missed);
    const reason: RichLine =
      missingSubmission.length > 0
        ? [
            { text: `${plain(missingSubmission[0])} — `, bold: true },
            { text: "a mandatory item you can't meet." },
          ]
        : passed
          ? [
              { text: `${passed.label} already passed — `, bold: true },
              { text: "that gate is closed." },
            ]
          : [
              { text: "No real runway left", bold: true },
              { text: " once the lead times come out." },
            ];
    return { question, tone: "blocked", word: "No", glyph: "x", reason, evidence: [] };
  }

  if (deadline.status === "tight") {
    // Keep this line distinct from the timeline's own sentence below it (no dupe).
    return {
      question,
      tone: "warn",
      word: `Tight — ${Math.max(deadline.realRunwayDays, 0)} days`,
      glyph: "alert-triangle",
      reason: [{ text: "Bonding and reference lead times eat into your window." }],
      evidence: [],
    };
  }

  return {
    question,
    tone: "ok",
    word: `Yes — ${deadline.realRunwayDays} days`,
    glyph: "check",
    reason: [
      { text: "Real runway after the lead times: " },
      { text: `${deadline.realRunwayDays} days`, bold: true },
      { text: "." },
    ],
    evidence: [],
  };
}

export function computeGates(
  matrix: ComplianceRow[],
  deadline: RealDeadline,
  noticeType: NoticeType,
): GateStrip {
  const legal = legalLight(matrix);
  const submittable = submittableLight(matrix, deadline, noticeType);
  return { legal, submittable, dominated: legal.tone === "blocked" };
}
