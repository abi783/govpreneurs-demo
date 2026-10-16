/**
 * Frontend placeholder normalisation for HigherGov-sourced display values.
 *
 * HigherGov notices carry junk sentinels in place of missing data — a
 * `popState` of "N/A"/"TBD", a `popCity` of "TBD", a value estimate of 0. This
 * module maps those (and genuinely-absent values) to a clean "NA" token for the
 * two composite display fields assembled on the frontend: Place of Performance
 * (a `city, state` join) and Estimated Contract Value (a numeric range). Doing
 * it here — rather than in the backend DTO — keeps the join/format logic and its
 * "NA" fallback in one place next to the code that renders them.
 *
 * Standalone contact/notice-type fields are already normalised server-side
 * (see `backend/.../placeholder.util.ts`); this mirrors its detection rules.
 */

export const NA = "NA";

/** Lower-cased sentinel tokens that stand in for "no real value". */
const PLACEHOLDER_TOKENS = new Set([
  "n/a",
  "na",
  "none",
  "null",
  "nil",
  "unknown",
  "tbd",
  "not available",
  "not applicable",
  "not specified",
]);

/**
 * True when a string is a data-placeholder sentinel rather than real content:
 * empty/blank, a known token ("N/A", "TBD", …), or an all-zero form ("0", "000").
 */
export function isPlaceholderText(value: string | null | undefined): boolean {
  if (value == null) return true;
  const s = value.trim();
  if (s === "") return true;
  if (PLACEHOLDER_TOKENS.has(s.toLowerCase())) return true;
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length > 0 && /^0+$/.test(digits) && /^[\s()+.\-0]+$/.test(s)) {
    return true;
  }
  return false;
}

/**
 * Joins city + state for display, dropping any placeholder part so a junk state
 * never masquerades as a real place ("Arlington, NA"). Returns the literal "NA"
 * when neither part is real.
 */
export function formatLocationNa(
  city: string | null | undefined,
  state: string | null | undefined,
): string {
  const parts = [city, state]
    .filter((p): p is string => !isPlaceholderText(p))
    .map((p) => p.trim());
  return parts.length ? parts.join(", ") : NA;
}

/**
 * Coerces a value-estimate bound to a real positive number, or null.
 *
 * HigherGov stores `valEstLow`/`valEstHigh` as *strings* ("0", "0.00",
 * "500000"), so a strict `=== 0` check misses the zero sentinels. This parses
 * the amount (stripping any currency punctuation) and treats 0, blank, and
 * non-numeric input as "no value".
 */
export function toRealAmount(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(n) || n === 0) return null;
  return n;
}

/** A value estimate is "real" only when a bound parses to a non-zero number. */
export function hasRealValue(
  low: number | string | null | undefined,
  high: number | string | null | undefined,
): boolean {
  return toRealAmount(low) != null || toRealAmount(high) != null;
}
