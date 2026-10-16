/**
 * Display helpers for opportunity surfaces. These read the existing API
 * `noticeType` / `setAside` strings — they do NOT change backend data.
 */

const SOLICITATION_NOTICE = /\b(solicitation|rfp|rfq|request for proposal|request for quote|combined synopsis)\b/i;

/** "Proposal Due Date" for solicitation/RFP-style notices, else "Response Due Date". */
export function dueDateLabel(
  noticeType: string | null | undefined,
): "Response Due Date" | "Proposal Due Date" {
  return noticeType && SOLICITATION_NOTICE.test(noticeType)
    ? "Proposal Due Date"
    : "Response Due Date";
}

const FULL_OPEN = /full\s*(&|and)\s*open/i;

/** True when a raw set-aside string represents Full & Open competition. */
export function isFullAndOpen(raw: string | null | undefined): boolean {
  return !!raw && FULL_OPEN.test(raw);
}

/** Normalizes raw set-aside values; standardizes Full & Open, passes others through. */
export function setAsideDisplayLabel(raw: string | null | undefined): string {
  if (!raw) return raw ?? "";
  if (isFullAndOpen(raw)) return "Full and Open Competition";
  return raw;
}
