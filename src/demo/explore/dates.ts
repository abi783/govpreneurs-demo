// Dates for the Explore pages, counted in calendar days from today.
//
// A due date is the start of day N (local midnight). Production shows "N days left"
// as the ceiling of (deadline - now), so midnight reads N all day long and agrees with
// the Hunter feed. These helpers sit on clock.ts, which counts calendar days, so a
// daylight-saving change (1 November) cannot move a date by one day.

import { DEMO_TODAY, dateDaysFromNow, daysFromNow, deadlineIso } from "@/demo/story/clock";

const MS_PER_DAY = 86_400_000;

/** Local midnight at the start of the day `n` calendar days from today (negative = past). */
export function calendarMidnight(n: number): Date {
  return daysFromNow(n, 0);
}

/** ISO timestamp of that midnight. */
export function calendarIso(n: number): string {
  return deadlineIso(n);
}

/** `YYYY-MM-DD` of the day `n` calendar days from today. */
export function calendarDay(n: number): string {
  return dateDaysFromNow(n);
}

/** Local midnight of a `YYYY-MM-DD` day, as an ISO timestamp. */
export function dayToIso(day: string): string {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0).toISOString();
}

/** Whole calendar days from today to a `YYYY-MM-DD` day (negative when it is past). */
export function daysToDay(day: string): number {
  const [y, m, d] = day.slice(0, 10).split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - DEMO_TODAY.getTime()) / MS_PER_DAY);
}
