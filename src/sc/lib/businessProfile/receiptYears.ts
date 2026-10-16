/**
 * Five years of receipts, each one told which year it is. Pure.
 *
 * The row was a plain list: five identical boxes reading "One number per year",
 * leaving her to remember which year she was on and in which direction. Nothing
 * on screen said, and nothing stored said either — the figures were positional,
 * so a deleted row silently re-dated every number under it.
 *
 * The year is now the item's `id`. `ListItem.id` is carried through untouched by
 * every adapter, so this needs no new storage shape and no migration: a row
 * saved as `{ id: "2024", text: "180000" }` reads back as the 2024 box.
 *
 * COMPLETED years only. The current year is not over, so asking for it invites
 * a part-year figure into a five-year total the size standard is computed from.
 */

import type { ListItem } from "./mbValue";

/** What the size standard averages. Five, and it is not a preference. */
export const RECEIPT_YEARS = 5;

/**
 * A figure, capped where a number stops being a receipt and starts being a typo.
 *
 * Nine digits is $999,999,999 — an order of magnitude above the largest SBA
 * receipts-based size standard, so it refuses nothing real while stopping the
 * pasted-too-many-zeros case that prompted this.
 */
export const MAX_RECEIPT_DIGITS = 9;

/** One box: the year it is for, and what she has typed in it. */
export interface ReceiptRow {
  year: number;
  /** Digits only, unformatted. "" for a year she has not filled in. */
  amount: string;
}

/** The five completed years, most recent first — the order she remembers them. */
export function yearsFor(now: Date): number[] {
  const first = now.getUTCFullYear() - 1;
  return Array.from({ length: RECEIPT_YEARS }, (_, i) => first - i);
}

/** Everything that is not a digit, discarded, and never more than a real figure. */
export function amountDigits(input: string): string {
  return input.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_RECEIPT_DIGITS);
}

/** `1200000` → `1,200,000`. Grouped as she types: an eight-digit figure with no
 *  separators is one she has to count with a finger to check. */
export function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * The five boxes, seeded from whatever is on the record.
 *
 * Two shapes arrive here. A row saved by this control carries its year as the
 * id and is matched to its own box. A row saved by the old plain list carries
 * an id that means nothing, and is laid down newest-first — which is the order
 * the question asked for, so it is the best reading available and it is a
 * reading, not a guess dressed as data.
 */
export function seedRows(initial: unknown, years: number[]): ReceiptRow[] {
  const items = Array.isArray(initial) ? (initial as ListItem[]) : [];
  const byYear = new Map<number, string>();
  const legacy: string[] = [];
  for (const item of items) {
    const text = amountDigits(String(item?.text ?? ""));
    if (text === "") continue;
    const year = Number(item?.id);
    if (Number.isInteger(year) && years.includes(year)) byYear.set(year, text);
    else legacy.push(text);
  }
  let next = 0;
  return years.map((year) => {
    const held = byYear.get(year);
    if (held !== undefined) return { year, amount: held };
    return { year, amount: legacy[next++] ?? "" };
  });
}

/** What gets stored: the years she answered, newest first, and no empty boxes. */
export function rowsToItems(rows: ReceiptRow[]): ListItem[] {
  return rows
    .filter((row) => row.amount !== "")
    .map((row) => ({ id: String(row.year), text: row.amount }));
}
