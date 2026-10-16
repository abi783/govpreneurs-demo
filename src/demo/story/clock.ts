// The demo clock. Every date in the sample data is an offset from the day the
// demo opens, so deadlines never fall into the past between sales calls.

const MS_PER_DAY = 86_400_000;

/** Midnight, local time, on the day the demo was opened. */
export const DEMO_TODAY: Date = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

/** A Date `days` from today (negative = in the past), at the given hour.
 *  Counts calendar days, so a daylight-saving change in between cannot move
 *  the date by one day. */
export function daysFromNow(days: number, hour = 12): Date {
  return new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate() + days, hour, 0, 0, 0);
}

/** ISO timestamp `days` from today. */
export function isoDaysFromNow(days: number, hour = 12): string {
  return daysFromNow(days, hour).toISOString();
}

/** `YYYY-MM-DD` `days` from today. */
export function dateDaysFromNow(days: number): string {
  const d = daysFromNow(days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Whole days from today to `date` (negative when it is past). */
export function daysUntil(date: Date | string): number {
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  return Math.round((t - DEMO_TODAY.getTime()) / MS_PER_DAY);
}

/** A response deadline `closesInDays` from today, at midnight at the start of
 *  that day. Production shows "Closes in N days" as ceil(deadline - now), so a
 *  midnight deadline reads N all day on every page. Use this for every
 *  deadline in the demo. */
export function deadlineIso(closesInDays: number): string {
  return daysFromNow(closesInDays, 0).toISOString();
}

/** A posted date `postedDaysAgo` days back, at noon. A notice posted 7 days
 *  ago or less always counts as "new this week" (posted >= now - 7 days). */
export function postedIso(postedDaysAgo: number): string {
  const noon = daysFromNow(-postedDaysAgo, 12);
  if (postedDaysAgo > 7) return noon.toISOString();
  const floor = Date.now() - 7 * MS_PER_DAY + 6 * 3_600_000;
  return new Date(Math.max(noon.getTime(), floor)).toISOString();
}
