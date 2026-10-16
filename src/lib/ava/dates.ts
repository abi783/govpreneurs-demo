// Ava's dates. ONE clock: every date is an offset from the demo clock
// (src/demo/story/clock.ts), so fixture dates, ask dates and the deadline can
// never drift apart (D-B7). Dates are written out in full ("21 May 2026"),
// never "5/21" or "May 21" (plain-English bar).
//
// DEMO: the prototype pinned its clock to 7 May 2026. The demo counts from the
// day it opens, so a deadline never falls into the past between sales calls.

import { DEMO_TODAY } from "../../demo/story/clock";

const DAY = 86_400_000;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Midnight UTC on the calendar day the demo opened (the local day, so the
 *  date on screen is the date the visitor sees on their own calendar). */
export function today(): Date {
  return new Date(Date.UTC(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate()));
}

/** The calendar day `n` days from today (UTC midnight). */
export function dayFromNow(n: number): Date {
  return new Date(today().getTime() + n * DAY);
}

/** "21 May 2026". */
export function fullDate(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "21 May" — only where the year is plainly this year (tables, lists). */
export function dayMonth(d: Date): string {
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "Thursday 21 May 2026". */
export function weekdayDate(d: Date): string {
  return `${WEEKDAYS[d.getUTCDay()]} ${fullDate(d)}`;
}

/** Whole days from today to `d` (negative when past). */
export function daysFromToday(d: Date): number {
  return Math.round((d.getTime() - today().getTime()) / DAY);
}

/** Business days are what surety and buyers count in. Moves back over weekends. */
export function minusBusinessDays(d: Date, n: number): Date {
  let out = new Date(d);
  let left = n;
  while (left > 0) {
    out = new Date(out.getTime() - DAY);
    const wd = out.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return out;
}

/** The later of two dates. */
export function later(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

/** "about 3 hours", "about 40 minutes". Never a false precision. */
export function aboutTime(minutes: number): string {
  if (minutes <= 0) return "no time";
  if (minutes < 55) return `about ${Math.max(5, Math.round(minutes / 5) * 5)} minutes`;
  const hours = Math.round(minutes / 30) / 2;
  if (hours <= 1) return "about 1 hour";
  const whole = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `about ${whole} hours`;
}

/** The demo's "now" as an ISO string, used to stamp answers. It is noon UTC
 *  on today's calendar day, so every stamp shows today's date. */
export function nowIso(): string {
  return new Date(today().getTime() + 12 * 3_600_000).toISOString();
}
