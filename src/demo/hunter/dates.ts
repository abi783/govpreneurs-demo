// DEMO (Hunter): dates for the feed, counted from the day the demo opened.
//
// The feed shows "Closes in N days" from `ceil(deadline - now)`. A deadline at
// 17:00 shows N + 1 in the morning and N in the evening. A deadline at midnight
// shows N all day, so the card always agrees with `closesInDays` in the story.
// The helper counts calendar days, not 24-hour blocks, so a daylight-saving
// change between today and the deadline cannot move the date by one day.

import { DEMO_TODAY } from "../story/clock";

const DAY_MS = 86_400_000;

/** Local date `days` from the day the demo opened, at `hour` o'clock. */
export function calendarDay(days: number, hour = 0): Date {
  return new Date(
    DEMO_TODAY.getFullYear(),
    DEMO_TODAY.getMonth(),
    DEMO_TODAY.getDate() + days,
    hour,
    0,
    0,
    0,
  );
}

/** The response deadline: midnight at the start of day N, so the card reads N days. */
export function deadlineIso(closesInDays: number): string {
  return calendarDay(closesInDays, 0).toISOString();
}

/**
 * The posted date. A notice posted 7 days ago or less must count as "new this
 * week" for the feed's own check (`postedAt >= now - 7 days`), at any hour of
 * the day. For those notices the time moves up if it would fall just outside.
 */
export function postedIso(postedDaysAgo: number): string {
  const noon = calendarDay(-postedDaysAgo, 12);
  if (postedDaysAgo > 7) return noon.toISOString();
  const floor = Date.now() - 7 * DAY_MS + 6 * 3_600_000;
  return new Date(Math.max(noon.getTime(), floor)).toISOString();
}

/** "Nov 11" for the deadline of a notice that closes in N days. */
export function shortDate(daysFromToday: number): string {
  return calendarDay(daysFromToday, 12).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Wednesday, Nov 11" for chat replies. */
export function longDate(daysFromToday: number): string {
  return calendarDay(daysFromToday, 12).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
