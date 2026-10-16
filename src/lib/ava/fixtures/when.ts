// Dates for the sample bids. Every date a bid shows, quotes or compares is a
// day offset from the demo clock (src/demo/story/clock.ts), never a calendar
// date typed into the file: the demo opens on a different day each time, and a
// date that was typed in would fall into the past.
//
// Day 0 is today. `D(26)` is the day the Camp Mackall quote is due. The prototype
// counted from 7 May 2026, so an old date "2 June 2026" is `D(26)` here.
//
//   D(26)    "11 November 2026"             Ava's own words (dates.ts fullDate)
//   WD(26)   "Wednesday 11 November 2026"   Ava's words, with the weekday
//   DM(26)   "11 November"                  no year, where the year is plain
//   WDM(4)   "Monday 20 October"            weekday and day, no year
//   DAY(4)   "Monday"                       the weekday alone
//   US(26)   "November 11, 2026"            the buyer's own style, in a quotation
//   USWD(26) "Wednesday, November 11, 2026" the buyer's own style, with weekday
//   ISO(-2)  "2026-10-14T12:00:00.000Z"     a stamp for a saved answer
//
// A negative offset is a day in the past. Past performance dates (the 2023 and
// 2024 jobs, the day the company formed) are history: they come from
// src/demo/story/persona.ts and stay fixed.

import { dayFromNow, fullDate, weekdayDate } from "../dates";

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

export const D = (n: number): string => fullDate(dayFromNow(n));
export const WD = (n: number): string => weekdayDate(dayFromNow(n));
export const DM = (n: number): string => {
  const d = dayFromNow(n);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
export const DAY = (n: number): string => WEEKDAYS[dayFromNow(n).getUTCDay()];
export const WDM = (n: number): string => `${DAY(n)} ${DM(n)}`;
export const US = (n: number): string => {
  const d = dayFromNow(n);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};
export const USWD = (n: number): string => `${DAY(n)}, ${US(n)}`;
/** "May 26" (US style, no year). */
export const USDM = (n: number): string => {
  const d = dayFromNow(n);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
/** A stamp for a saved answer, at the given hour (UTC) on that day. */
export const ISO = (n: number, hour = 12, minute = 0): string =>
  new Date(dayFromNow(n).getTime() + hour * 3_600_000 + minute * 60_000).toISOString();

/** The UTC offset of US Eastern time on day `n`: -4 in daylight time (from the
 *  second Sunday of March to the first Sunday of November), else -5. A due time
 *  such as "2:00 PM Eastern" is a different instant either side of that change,
 *  and the demo opens on a different day each time. */
export const ET_OFFSET = (n: number): number => {
  const d = dayFromNow(n);
  const y = d.getUTCFullYear();
  const firstSunday = (month: number) => {
    const dow = new Date(Date.UTC(y, month, 1)).getUTCDay();
    return 1 + ((7 - dow) % 7);
  };
  const start = Date.UTC(y, 2, firstSunday(2) + 7);
  const end = Date.UTC(y, 10, firstSunday(10));
  return d.getTime() >= start && d.getTime() < end ? -4 : -5;
};

// ─── Facts of the member that carry a date ───

import { PERSONA } from "../../../demo/story/persona";

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** The day her federal registration ends, "15 April 2027" (her SAM.gov record). */
export const SAM_ACTIVE_UNTIL = longDate(PERSONA.samActiveUntil);

/** The day the company was formed, "3 March 2021". A fixed fact: history. */
export const FORMED_ON = (() => {
  const d = new Date(`${PERSONA.formedOn} 12:00 UTC`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
})();
