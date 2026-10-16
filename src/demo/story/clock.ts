// The demo clock. Every date in the sample data is an offset from the day the
// demo opens, so deadlines never fall into the past between sales calls.

const MS_PER_DAY = 86_400_000;

/** Midnight, local time, on the day the demo was opened. */
export const DEMO_TODAY: Date = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

/** A Date `days` from today (negative = in the past), at the given hour. */
export function daysFromNow(days: number, hour = 12): Date {
  const d = new Date(DEMO_TODAY.getTime() + days * MS_PER_DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
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
