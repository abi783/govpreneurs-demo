// DEMO: deadlines and posting dates, by calendar day.
//
// A response deadline is MIDNIGHT at the start of day N, counted in calendar days.
// Production shows "Closes in N days" as the rounded-up gap between the deadline and
// now, so a midnight deadline reads N all day and agrees with the Hunter feed card.
// A deadline at 5 PM would read N+1 in the morning. Days are added to the calendar
// date, never as blocks of 24 hours, so a clock change (1 November) cannot move a date.
//
// `deadlineIso` and `postedIso` are re-exported from story/clock.ts.

import { DEMO_TODAY } from "@/demo/story/clock";

/** Midnight, local time, `offset` calendar days after (or before) `base`. */
export function calendarDay(base: Date, offset: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, 0, 0, 0);
}

/** The response deadline of an opportunity that closes in `closesInDays` days. */
export function deadlineDate(closesInDays: number): Date {
  return calendarDay(DEMO_TODAY, closesInDays);
}

// One implementation for every page: the feed card and this page must agree.
export { deadlineIso, postedIso } from "@/demo/story/clock";

/** The day an opportunity was posted. */
export function postedDate(postedDaysAgo: number): Date {
  return calendarDay(DEMO_TODAY, -postedDaysAgo);
}


