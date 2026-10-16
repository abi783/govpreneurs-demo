// The closing window: an opportunity that closes in this many days or fewer does
// not leave enough time to prepare a bid. Inside the window Send to Mentor is
// refused and Grant calls it a No-Bid. Mirrors backend/src/common/closing-window.ts.

import { daysUntil } from "./format";

export const CLOSING_WINDOW_DAYS = 5;

/** The message a member sees when an action is refused inside the window. */
export const CLOSING_WINDOW_MESSAGE = `This closes in ${CLOSING_WINDOW_DAYS} days or fewer — there is not enough time to prepare for it.`;

/**
 * True when the due date falls inside the closing window (or has passed).
 * A missing or unparseable due date is not a closing deadline, so it is false.
 */
export function isInsideClosingWindow(
  dueDate: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!dueDate) return false;
  const iso = dueDate instanceof Date ? dueDate.toISOString() : dueDate;
  const days = daysUntil(iso, now);
  return !Number.isNaN(days) && days <= CLOSING_WINDOW_DAYS;
}
