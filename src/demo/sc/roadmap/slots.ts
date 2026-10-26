// DEMO: believable free times for the Roadmap and Tasks booking calendars.
//
// Production asks a GoHighLevel calendar for free slots and groups them by day in
// the time zone the member picked. The demo builds the same answer from rules:
// the mentor works 9:30 to 16:30 Eastern, Monday to Friday, takes a break at
// 12:00, and has a few slots already taken. Only the next 10 business days are
// open. Every date starts from the demo clock (`clock.ts`), so the calendar never
// runs out between sales calls.

import { DEMO_TODAY } from "@/demo/story/clock";

/** The mentor's own time zone. Diana works from Fayetteville. */
export const MENTOR_TIME_ZONE = "America/New_York";

/** How many business days ahead the calendar is open. */
export const OPEN_BUSINESS_DAYS = 10;

/** Length of one slot in minutes. */
export const SLOT_MINUTES = 30;

const WORK_START = 9.5; // 9:30
const WORK_END = 16.5; // 16:30 (last slot starts at 16:00)
const BREAK_START = 12;
const BREAK_END = 13;

/** The offset of `tz` from UTC at the instant `at`, in milliseconds. */
function zoneOffsetMs(at: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** The instant that is `hour:minute` on a calendar day in `tz`. */
export function zonedTimeToUtcMs(
  y: number,
  m: number,
  d: number,
  hour: number,
  minute: number,
  tz: string,
): number {
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const first = guess - zoneOffsetMs(guess, tz);
  // A second pass fixes the hour around a daylight saving change.
  return guess - zoneOffsetMs(first, tz);
}

/** `YYYY-MM-DD` of an instant in `tz`. */
export function dayKeyInZone(ms: number, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** A small stable number from a string, so the same day always has the same gaps. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The business days that are open: tomorrow and the days after it, no weekends. */
function openCalendarDays(): { y: number; m: number; d: number }[] {
  const out: { y: number; m: number; d: number }[] = [];
  const cursor = new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth(), DEMO_TODAY.getDate());
  while (out.length < OPEN_BUSINESS_DAYS) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow === 0 || dow === 6) continue;
    out.push({ y: cursor.getFullYear(), m: cursor.getMonth() + 1, d: cursor.getDate() });
  }
  return out;
}

/**
 * Every open slot in the window, as ISO times, grouped by day in the time zone
 * the member asked for. `seed` makes two calendars (for example Positioning and
 * Targeting) differ a little. `taken` lists start times to leave out.
 */
export function freeSlots(opts: {
  startMs: number;
  endMs: number;
  timezone?: string | null;
  seed: string;
  taken?: string[];
}): Record<string, string[]> {
  const tz = isZone(opts.timezone) ? opts.timezone : MENTOR_TIME_ZONE;
  const taken = new Set((opts.taken ?? []).map((t) => new Date(t).getTime()));
  const out: Record<string, string[]> = {};
  for (const { y, m, d } of openCalendarDays()) {
    const dayKey = `${y}-${m}-${d}`;
    for (let h = WORK_START; h < WORK_END; h += SLOT_MINUTES / 60) {
      if (h >= BREAK_START && h < BREAK_END) continue;
      const hour = Math.floor(h);
      const minute = Math.round((h - hour) * 60);
      // About one slot in four is already booked by someone else.
      if (hash(`${opts.seed}|${dayKey}|${h}`) % 4 === 0) continue;
      const ms = zonedTimeToUtcMs(y, m, d, hour, minute, MENTOR_TIME_ZONE);
      if (ms < opts.startMs || ms >= opts.endMs) continue;
      if (taken.has(ms)) continue;
      (out[dayKeyInZone(ms, tz)] ??= []).push(new Date(ms).toISOString());
    }
  }
  return out;
}

/** True when the browser accepts `tz` as a time zone. */
function isZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
