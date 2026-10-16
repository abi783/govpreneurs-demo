// DEMO: time-zone helpers for the sample appointments and the booking slots.
//
// The member lives in Fayetteville, NC, so the sample contact's time zone is
// Eastern. Every slot and every sample appointment is built as an Eastern wall
// time ("10:30 in New York") and turned into a real instant. The booking modals
// then show the same wall time, whatever zone the laptop is set to.

export const CONTACT_TIMEZONE = "America/New_York";

const formatters = new Map<string, Intl.DateTimeFormat>();

function parts(at: Date, timeZone: string): Record<string, string> {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, f);
  }
  return Object.fromEntries(f.formatToParts(at).map((p) => [p.type, p.value]));
}

/** How far `timeZone` is ahead of UTC at the instant `at`, in milliseconds. */
function offsetMs(timeZone: string, at: Date): number {
  const p = parts(at, timeZone);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** `YYYY-MM-DD` of the instant `at`, as the wall clock of `timeZone` shows it. */
export function ymdIn(at: Date, timeZone: string): string {
  const p = parts(at, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** The instant at which the wall clock of `timeZone` shows this date and time. */
export function wallToInstant(ymd: string, hour: number, minute: number, timeZone: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  const first = guess - offsetMs(timeZone, new Date(guess));
  const second = guess - offsetMs(timeZone, new Date(first));
  return new Date(second);
}

/** The weekday (0 = Sunday) of a `YYYY-MM-DD` date. */
export function weekdayOf(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** `YYYY-MM-DD` that is `days` after `ymd`. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** Today's date in Eastern time. It reads the real clock, so the slots start tomorrow in any time zone. */
export function todayEastern(): string {
  return ymdIn(new Date(), CONTACT_TIMEZONE);
}

/** An instant `days` from today at this Eastern wall time. Negative = in the past. */
export function easternInstant(days: number, hour: number, minute = 0): Date {
  return wallToInstant(addDays(todayEastern(), days), hour, minute, CONTACT_TIMEZONE);
}

/** The next `count` business days (Monday to Friday) after today, as `YYYY-MM-DD`. */
export function nextBusinessDays(count: number): string[] {
  const out: string[] = [];
  let day = todayEastern();
  while (out.length < count) {
    day = addDays(day, 1);
    const wd = weekdayOf(day);
    if (wd !== 0 && wd !== 6) out.push(day);
  }
  return out;
}

/** "Tue, Oct 20 at 10:30 AM ET" */
export function formatSlot(iso: string, timeZone = CONTACT_TIMEZONE): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone });
  return `${day} at ${time} ET`;
}
