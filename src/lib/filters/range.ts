// Open ranges for the Partners and Awards filter panels.
//
// Every number and date filter is a range the member types herself — "0 to 60 days ago",
// "$250,000 to $2,000,000". The buttons above each range only fill the boxes in. Shyam
// decided this on 10 Nov 2026: fixed presets alone lose the point of a filter.
//
// Pure functions, no React, so the pages and any check can share one reading of a range.

import { NOW } from "../format";

export type RangeUnit = "days" | "months" | "years";
export type RangeKind = "money" | "count" | "time";

/** An empty bound is null, never 0 — 0 is a real answer ("from today"). */
export interface Range {
  min: number | null;
  max: number | null;
  unit: RangeUnit;
}

export const ANY_RANGE: Range = { min: null, max: null, unit: "days" };

const UNIT_DAYS: Record<RangeUnit, number> = { days: 1, months: 30.44, years: 365.25 };
const MS_DAY = 86_400_000;

/** A number of days, months or years, in days. Both pages use this one reading. */
export const toDays = (value: number, unit: RangeUnit): number =>
  Math.round(value * UNIT_DAYS[unit]);

export const isAnyRange = (r: Range): boolean => r.min === null && r.max === null;

export const sameRange = (a: Range, b: Range): boolean =>
  a.min === b.min && a.max === b.max && a.unit === b.unit;

/**
 * Whether a value sits inside a range. A time range is compared in days.
 *
 * An unknown value never satisfies a range that is on (D-C4): a job we cannot date or count
 * drops out rather than sneaking in.
 */
export function inRange(value: number | null | undefined, r: Range, kind: RangeKind): boolean {
  if (isAnyRange(r)) return true;
  if (value === null || value === undefined) return false;
  const scale = kind === "time" ? UNIT_DAYS[r.unit] : 1;
  const lo = r.min === null ? null : r.min * scale;
  const hi = r.max === null ? null : r.max * scale;
  return (lo === null || value >= lo - 1e-6) && (hi === null || value <= hi + 1e-6);
}

/** Days from an ISO date back to the prototype's clock. */
export const daysAgo = (iso: string): number =>
  Math.max(0, Math.round((NOW.getTime() - new Date(iso).getTime()) / MS_DAY));

/** Days from the prototype's clock forward to an ISO date. Negative when it has passed. */
export const daysAhead = (iso: string): number =>
  Math.round((new Date(iso).getTime() - NOW.getTime()) / MS_DAY);

/** Reads "$1.5m", "250k", "250,000" or "1500000". Empty or unreadable is no bound. */
export function parseMoney(input: string): number | null {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[$,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([km])?$/);
  if (!m) return null;
  return Math.round(Number(m[1]) * (m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1_000 : 1));
}

/** Reads a whole number of zero or more. Empty or unreadable is no bound. */
export function parseCount(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

/** Builds a range from the two boxes. Bounds typed the wrong way round are swapped. */
export function rangeFrom(
  minText: string,
  maxText: string,
  kind: RangeKind,
  unit: RangeUnit,
): Range {
  const parse = kind === "money" ? parseMoney : parseCount;
  return tidy({ min: parse(minText), max: parse(maxText), unit: kind === "time" ? unit : "days" });
}

/**
 * Bounds the wrong way round are swapped. "0 or more" with no top is no range: it limits
 * nothing, and its words ("more than 0 days ago") say nothing.
 */
function tidy(r: Range): Range {
  let { min, max } = r;
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  if (min === 0 && max === null) return { ...ANY_RANGE, unit: r.unit };
  return { min, max, unit: r.unit };
}

/** Short money for chips and sentences: $250K, $1.5M. */
export function shortUsd(n: number): string {
  // $999,500 rounds to 1,000K, so it reads as $1M.
  if (n >= 999_500) return `$${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const unitWord = (n: number, unit: RangeUnit) => (n === 1 ? unit.slice(0, -1) : unit);

/**
 * A range in plain words. `direction` says which way a time range points from today.
 * Examples: "$250K to $2M" · "5 or more" · "in the last 60 days" · "1 year ago" ·
 * "at least 3 months ago". Both ends are included, so a lower bound reads "at least".
 */
export function rangeWords(r: Range, kind: RangeKind, direction: "ago" | "ahead" = "ago"): string {
  if (kind === "time") {
    const u = r.unit;
    const span = (n: number) => `${n} ${unitWord(n, u)}`;
    if (r.min !== null && r.max !== null && r.min === r.max) {
      return direction === "ago" ? `${span(r.max)} ago` : `in ${span(r.max)}`;
    }
    // A range that starts at 0 reads "in the last 6 months", not "0 to 6 months ago".
    if (r.min !== null && r.min > 0 && r.max !== null) {
      return direction === "ago"
        ? `${r.min} to ${span(r.max)} ago`
        : `in ${r.min} to ${span(r.max)}`;
    }
    if (r.max !== null) {
      return direction === "ago" ? `in the last ${span(r.max)}` : `in the next ${span(r.max)}`;
    }
    return direction === "ago"
      ? `at least ${span(r.min!)} ago`
      : `at least ${span(r.min!)} from today`;
  }
  const v = (n: number) => (kind === "money" ? shortUsd(n) : String(n));
  if (r.min !== null && r.max !== null)
    return r.min === r.max ? v(r.min) : `${v(r.min)} to ${v(r.max)}`;
  if (r.max !== null) return `up to ${v(r.max)}`;
  return `${v(r.min!)} or more`;
}

/**
 * Reads a range back from the URL. Anything malformed is "any", never a crash. An unknown
 * unit is "any" too: "6 weeks" must not become 6 days.
 */
export function readRange(input: unknown): Range {
  if (!input || typeof input !== "object") return ANY_RANGE;
  const o = input as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  if (o.unit !== undefined && o.unit !== "days" && o.unit !== "months" && o.unit !== "years")
    return ANY_RANGE;
  const unit: RangeUnit = o.unit === "months" || o.unit === "years" ? o.unit : "days";
  return tidy({ min: num(o.min), max: num(o.max), unit });
}

/** A preset button: a label and the range it fills in. */
export interface RangePreset {
  label: string;
  range: Range;
}

/** The date shortcuts. Both pages use the same ones. */
export const PAST_PRESETS: RangePreset[] = [
  { label: "Last 90 days", range: { min: 0, max: 90, unit: "days" } },
  { label: "Last 6 months", range: { min: 0, max: 6, unit: "months" } },
  { label: "Last 12 months", range: { min: 0, max: 12, unit: "months" } },
  { label: "Last 2 years", range: { min: 0, max: 2, unit: "years" } },
];

export const NEXT_PRESETS: RangePreset[] = [
  { label: "Next 90 days", range: { min: 0, max: 90, unit: "days" } },
  { label: "Next 6 months", range: { min: 0, max: 6, unit: "months" } },
  { label: "Next 12 months", range: { min: 0, max: 12, unit: "months" } },
  { label: "Next 2 years", range: { min: 0, max: 2, unit: "years" } },
];
