// The Real Deadline — a first-class, deterministic, computed-in-code object
// (PRD 96 §3, §11.6 · PRD 97 §S1 "computed output"). It is NOT the response due
// date: it's response_due minus the lead times a compliant bid actually needs,
// hard-stopped by any already-passed mandatory event.
//
// Pure function. Uses the app's shared mock anchor (NOW) as "today" so the days
// align with the rest of the UI ("closes in 18 days"); no wall-clock reads.

import { CLOSING_WINDOW_DAYS } from "../closingWindow";
import { NOW, daysUntil } from "../format";
import type { RealDeadline, RealDeadlineInputs, RichLine } from "./types";

/** Two weeks or less of real runway reads as tight. */
const TIGHT_RUNWAY_DAYS = 14;

type LeadTimeKey = "bondingLeadDays" | "ppqTurnaroundDays" | "subQuoteDays" | "writingDays";

/**
 * The lead times a compliant bid needs, in deduction order. `label` names the
 * row; `phrase` is the words the sentence uses. The rail brief names the same
 * lead times (backend grant-rail-context.ts); keep the two in step.
 */
const LEAD_TIMES: { key: LeadTimeKey; label: string; phrase: string }[] = [
  { key: "bondingLeadDays", label: "Bonding lead time", phrase: "bonding" },
  { key: "ppqTurnaroundDays", label: "Reference questionnaires", phrase: "past-performance forms" },
  { key: "subQuoteDays", label: "Sub quotes", phrase: "sub quotes" },
  { key: "writingDays", label: "Writing the proposal", phrase: "writing" },
];

type Deduction = RealDeadline["deductions"][number];

/** "5 days for past-performance forms and 3 for writing" — the first count
 *  carries its unit, the rest read off it. */
function deductionClause(deductions: Deduction[]): string {
  const parts = deductions.map((d, i) =>
    i === 0
      ? `${d.days} ${d.days === 1 ? "day" : "days"} for ${d.phrase}`
      : `${d.days} for ${d.phrase}`,
  );
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** "The notice says 6 days. After …, you have 0." — the deductions stand next
 *  to the number they produce. */
function runwaySentence(noticeDays: number, runwayDays: number, deductions: Deduction[]): RichLine {
  const left = `${Math.max(runwayDays, 0)}`;
  const head: RichLine = [{ text: "The notice says " }, { text: `${noticeDays} days`, bold: true }];
  if (deductions.length === 0) {
    return [...head, { text: ". You have " }, { text: left, bold: true }, { text: "." }];
  }
  return [
    ...head,
    { text: `. After ${deductionClause(deductions)}, you have ` },
    { text: left, bold: true },
    { text: "." },
  ];
}

export function computeRealDeadline(inputs: RealDeadlineInputs, now: Date = NOW): RealDeadline {
  // `responseDue` comes off the notice via the backend, so it can be absent or
  // unparseable. Everything below does date arithmetic on it — and
  // `new Date(NaN).toISOString()` THROWS, which takes the whole canvas (the
  // member's entire take) down with it. Fail into an honest "I can't read the
  // date" state instead of crashing or inventing a runway.
  const responseDue = inputs.responseDue;
  const dueMs = new Date(responseDue ?? "").getTime();
  if (responseDue === null || Number.isNaN(dueMs)) {
    return {
      responseDue: inputs.responseDue,
      realDeadline: inputs.responseDue,
      noticeDays: 0,
      realRunwayDays: 0,
      deductions: [],
      passedEvents: [],
      status: "tight",
      sentence: [
        { text: "I couldn't read the response date on this notice — " },
        { text: "check the solicitation", bold: true },
        { text: " before you plan around it." },
      ],
    };
  }

  const deductions = LEAD_TIMES.map(({ key, label, phrase }) => ({
    label,
    phrase,
    days: inputs[key],
  })).filter((d) => d.days > 0);

  const totalDeducted = deductions.reduce((sum, d) => sum + d.days, 0);

  // A closed notice yields a negative count. Members must never be shown "-2401
  // days"; the number is floored at 0 and the copy says the date has passed.
  const rawNoticeDays = daysUntil(responseDue, now);
  const noticeClosed = rawNoticeDays < 0;
  const noticeDays = Math.max(rawNoticeDays, 0);
  const realRunwayDays = noticeDays - totalDeducted;

  const realDeadline = new Date(dueMs - totalDeducted * 86_400_000).toISOString();

  const passedEvents = inputs.passedEvents.map((e) => ({
    ...e,
    missed: new Date(e.date).getTime() < now.getTime(),
  }));
  const anyMissed = passedEvents.some((e) => e.missed);

  // Only the closing window blocks. A runway that the lead times use up is a
  // warning: the lead times are estimates, and the notice date is a fact.
  const insideWindow = noticeDays <= CLOSING_WINDOW_DAYS;
  const status: RealDeadline["status"] = insideWindow
    ? "blocked"
    : realRunwayDays <= TIGHT_RUNWAY_DAYS || anyMissed
      ? "tight"
      : "ok";

  const sentence: RichLine = noticeClosed
    ? [
        { text: "The response date on this notice has " },
        { text: "already passed", bold: true },
        { text: "." },
      ]
    : insideWindow
      ? [
          { text: "The notice closes in " },
          { text: `${noticeDays} days`, bold: true },
          { text: ". There is not enough time to prepare for this opportunity." },
        ]
      : status === "ok"
        ? [
            { text: "The notice says " },
            { text: `${noticeDays} days`, bold: true },
            { text: ` — and you have the runway.` },
          ]
        : runwaySentence(noticeDays, realRunwayDays, deductions);

  return {
    responseDue: inputs.responseDue,
    realDeadline,
    noticeDays,
    realRunwayDays,
    deductions,
    passedEvents,
    status,
    sentence,
  };
}
