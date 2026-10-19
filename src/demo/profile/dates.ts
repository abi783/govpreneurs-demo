// DEMO: date helpers for the profile surfaces. Every date comes from the demo
// clock (src/demo/story/clock.ts), so nothing the visitor sees is a fixed
// calendar date that can fall into the past between sales calls.

import { DEMO_TODAY, daysFromNow, isoDaysFromNow } from "../story/clock";

export { DEMO_TODAY, daysFromNow, isoDaysFromNow };

const MS_PER_DAY = 86_400_000;

/** `Oct 16, 2026` */
export function fmtShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** `October 16, 2026` */
export function fmtLong(d: Date | string): string {
  const date = typeof d === "string" ? parseDateOnly(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** `Mar 2024` from `2024-03-15`. Date-only strings are read as UTC so the month never slips. */
export function fmtMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** A `YYYY-MM-DD` string is a calendar day, not an instant. Read it in local time. */
export function parseDateOnly(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return new Date(value);
}

/** `2021-03-03` from any date text such as `March 3, 2021`. */
export function toIsoDay(value: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDateOnly(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Whole calendar days between `iso` and today. A daylight-saving change cannot move it. */
export function daysAgo(iso: string): number {
  const then = new Date(iso);
  const now = new Date();
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / MS_PER_DAY));
}

/** A readable money amount: `$726K`, `$1.34M`, `$900`. */
export function fmtMoneyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export function fmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
