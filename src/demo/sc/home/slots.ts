// DEMO: the free slots that the booking modals show.
//
// A slot is a start time on a half-hour. For one calendar the generator opens
// the next ten business days. A slot is free when it is inside the mentor's
// hours, the sample diary does not mark it taken, and the member has no other
// call at that time. The diary is a fixed pattern (a hash of the calendar and
// the time), so the same slots show every time the modal opens.

import { nextBusinessDays, wallToInstant, weekdayOf, ymdIn } from "./time";
import { takenStarts } from "./store";

export interface SlotCalendar {
  id: string;
  hours: { start: number; end: number; lunch?: number };
  days: number[];
  busyShare: number;
}

/** The calendar of the program team: onboarding and strategy calls. */
export const TEAM_CALENDAR: SlotCalendar = {
  id: "program-team",
  hours: { start: 10, end: 16, lunch: 12 },
  days: [1, 2, 3, 4, 5],
  busyShare: 0.4,
};

/** How many business days ahead the modals open. */
export const BOOKABLE_BUSINESS_DAYS = 10;

/** A small string hash, as a number from 0 up to (not including) 1. */
function unit(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10_000) / 10_000;
}

/**
 * Free slots between `startMs` and `endMs`, grouped by the day they fall on in
 * `timeZone`. `exceptAppointmentId` is the call that the member is moving, so
 * its own time does not block the new list.
 */
export function freeSlots(
  calendar: SlotCalendar,
  startMs: number,
  endMs: number,
  timeZone: string,
  exceptAppointmentId?: string,
): Record<string, string[]> {
  const taken = takenStarts(exceptAppointmentId);
  const out: Record<string, string[]> = {};
  for (const day of nextBusinessDays(BOOKABLE_BUSINESS_DAYS)) {
    if (!calendar.days.includes(weekdayOf(day))) continue;
    const picked: string[] = [];
    for (let hour = calendar.hours.start; hour <= calendar.hours.end; hour++) {
      if (calendar.hours.lunch === hour) continue;
      for (const minute of [0, 30]) {
        if (hour === calendar.hours.end && minute === 30) continue;
        const at = wallToInstant(day, hour, minute, "America/New_York");
        if (taken.has(at.getTime())) continue;
        if (unit(`${calendar.id}|${day}|${hour}:${minute}`) < calendar.busyShare) continue;
        picked.push(at.toISOString());
      }
    }
    // A diary never looks empty: keep at least three slots on a day the mentor works.
    if (picked.length < 3) {
      for (const hour of [10, 11, 14, 15].filter((h) => h >= calendar.hours.start && h <= calendar.hours.end)) {
        const at = wallToInstant(day, hour, 0, "America/New_York");
        const iso = at.toISOString();
        if (!taken.has(at.getTime()) && !picked.includes(iso)) picked.push(iso);
        if (picked.length >= 3) break;
      }
      picked.sort();
    }
    for (const iso of picked) {
      const t = new Date(iso).getTime();
      if (t < startMs || t > endMs) continue;
      const key = ymdIn(new Date(iso), timeZone);
      (out[key] ??= []).push(iso);
    }
  }
  return out;
}

/** True when `iso` is one of the calendar's free slots. */
export function isFreeSlot(calendar: SlotCalendar, iso: string, exceptAppointmentId?: string): boolean {
  const t = new Date(iso).getTime();
  const slots = freeSlots(calendar, t, t, "America/New_York", exceptAppointmentId);
  return Object.values(slots).some((list) => list.includes(new Date(iso).toISOString()));
}
