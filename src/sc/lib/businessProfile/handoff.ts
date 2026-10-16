/**
 * handoff.ts — `filling` / `ready` / `sent`, decided in one place.
 * ENTITY LAYER — pure.
 *
 * FRAME (`handoffMode`) + F14 (`answersToCheck`).
 *
 * ── THE THREE RULES, AND ALL THREE ARE EASY TO BREAK ──────────────────────
 * 1. ANSWERING THE FOURTEENTH SENDS NOTHING. Reaching 14 of 14 moves her to
 *    `ready` — a screen with a Send button — and fires no request. Auto-sending
 *    on the last keystroke takes the decision away from her and cannot be
 *    undone.
 * 2. `sent` IS TERMINAL. Once `intakeSentAt` is stamped, a later proposal —
 *    or a register contradicting her months on — must NOT drag her back into a
 *    form she finished in week one. The queue still shows the proposal; the
 *    handoff does not reopen.
 * 3. `intakeSentAt` IS NEVER RETRO-STAMPED. Members already sitting at 14 of 14
 *    when this ships have not handed anything over; back-filling a date would
 *    tell Diana a packet arrived that she never received.
 */

import { PART_IDS } from "./parts";
import type { HandoffMode, RecordFieldPayload } from "./payload";
import { rowsIn } from "./recordView";
import { BEFORE_FIRST_CALL } from "./catalog";

export type { HandoffMode };

export interface HandoffInput {
  /** From `refreshAnsweredCount` — only `attested`/`verified` count. */
  answered: number;
  /** Fixed at 14 (`BEFORE_FIRST_CALL_TOTAL`). Passed in so the pure function never
   *  reaches for a module constant it cannot be tested against. */
  total: number;
  /** `MemberOnboarding.intakeSentAt`, or null. */
  sentAt: Date | null;
}

/**
 * Frame, not feature: the terminality of `sent` is the whole decision, and it
 * is one line. Rule 2 lives in the order of these two statements — the
 * `sentAt` check comes FIRST, so no count can un-send a handoff.
 */
export function handoffMode(input: HandoffInput): HandoffMode {
  if (input.sentAt) return "sent";
  return input.answered >= input.total ? "ready" : "filling";
}

/**
 * Has she finished Basic Info? The gate the five parts sit behind.
 *
 * THE QUESTION IS "HAS SHE FINISHED THE INTAKE", NOT "ARE ALL FOURTEEN GREEN
 * RIGHT NOW", and the two come apart the moment a register contradicts her.
 * Months in, a member can have two of the fourteen back in `needs_review`
 * because SAM.gov disagreed with what she typed in week one. Gating on "all
 * fourteen settled today" would lock her entire record over that — the whole of
 * what she sells, her papers, her legal details — for a member who filled the
 * form and had it read by her mentor months ago. It would drag her back into a
 * form she finished in week one, which is the one thing this lock must not do.
 *
 * So the door is `filling`, and once through it does not shut again: the door
 * was the intake, and the intake is behind her. `handoffMode` puts `sentAt`
 * first, so no later count can un-send a handoff and re-lock the record.
 *
 * Read by the rail (which parts are offered) and by the part route itself
 * (which parts will render). Both ask this, so they cannot disagree.
 */
export function basicInfoDone(mode: HandoffMode): boolean {
  return mode !== "filling";
}

/**
 * Diana's fourteen, in the Success Center's own order, ready to be read back.
 *
 * The order is `BEFORE_FIRST_CALL` — the order she was asked in — so the
 * check-answers screen reads as the form she filled rather than as a report
 * sorted by something we care about. A key with nothing stored comes back as
 * the `missing` row `recordView` synthesises: the same one the part pages
 * render, so a question is never described two ways.
 */
export function answersToCheck(
  fields: readonly RecordFieldPayload[],
): RecordFieldPayload[] {
  const stored = new Map(fields.map((field) => [field.fieldKey, field]));
  const questionnaire = new Map<string, RecordFieldPayload>();
  for (const part of PART_IDS) {
    const { held, blank } = rowsIn(part, fields);
    for (const row of held) questionnaire.set(row.fieldKey, row);
    for (const tier of blank) for (const row of tier.rows) questionnaire.set(row.fieldKey, row);
  }

  const rows: RecordFieldPayload[] = [];
  for (const key of BEFORE_FIRST_CALL) {
    const row = stored.get(key) ?? questionnaire.get(key);
    if (row) rows.push(row);
  }
  return rows;
}
