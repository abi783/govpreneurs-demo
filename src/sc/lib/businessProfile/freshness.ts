/**
 * How old an answer is, said the way she would say it.
 *
 * `ProfileField.freshnessLabel` is a STORED string, written as the literal
 * "today" by every write path and never rewritten — so a row saved in March
 * still told her it was saved today, on the screen whose job is saying when
 * each answer came in.
 *
 * The column is neither dropped nor rewritten: it is READ THROUGH here, which
 * re-derives the date labels from the row's own timestamps and passes the rest
 * through. Two stored labels are not dates — "on file" and "not answered" —
 * and re-deriving those would replace a true statement about WHAT the row is
 * with a misleading one about when.
 */

/** The freshness a value carries the moment she acts on it. Re-derived on read. */
export const FRESHNESS_TODAY = "today";

/** A value that came off the GHL contact snapshot on day zero, not from her. */
export const FRESHNESS_ON_FILE = "on file";

/** A field she declined: there is no answer, so there is no date. */
export const FRESHNESS_DECLINED = "not answered";

/**
 * The stored labels that MEAN "as of the write", and so must be re-derived.
 *
 * A whitelist of what to replace, not of what to leave alone: anything else —
 * `FRESHNESS_ON_FILE`, `FRESHNESS_DECLINED`, an empty label, or a label some
 * future writer adds — passes through exactly as stored. Those two say WHERE a
 * row came from and that she declined; replacing either with a date would swap
 * a true statement for a misleading one. Enumerating the non-dates instead
 * would mean every new label was silently overwritten until someone remembered
 * to add it here, which is the failure that cannot be noticed from the screen.
 */
const DERIVED_FROM_TIMESTAMP: ReadonlySet<string> = new Set([FRESHNESS_TODAY]);

/** The timestamps an answer's age can be read from. */
export interface FreshnessRow {
  freshnessLabel: string;
  attestedAt: Date | null;
  verifiedAt: Date | null;
  confirmedAt: Date | null;
  updatedAt: Date;
}

const MS_PER_DAY = 86_400_000;

/**
 * Whole days between two instants, counted on UTC day boundaries.
 *
 * Pinned to UTC on purpose. The same bug bit `mbValue.fullDate`: comparing raw
 * millisecond differences makes "today" flip to "yesterday" partway through the
 * afternoon, and comparing local days makes the answer depend on the server's
 * zone, so a member west of UTC reads a different age than the record holds.
 */
function daysBetween(earlier: Date, later: Date): number {
  const a = Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate());
  const b = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * When the answer was last established: the newest of the three moments a value
 * actually became true — she typed it, a register verified it, or she confirmed
 * someone else's proposal — falling back to the row's last write.
 *
 * The fallback matters more than it looks: `upsertProfileField` only stamps
 * `attestedAt` when the state is `attested`, and NULLS it otherwise, so a
 * `needs_review` row written by a sync has none of the three. `updatedAt` then
 * reads as "when we heard this", which is the honest answer for that row.
 */
function answeredAt(row: FreshnessRow): Date | null {
  const stamps = [row.attestedAt, row.verifiedAt, row.confirmedAt].filter(usable);
  if (stamps.length > 0) return stamps.reduce((newest, d) => (d > newest ? d : newest));
  // `updatedAt` is the fallback and NOT part of the max above: it moves on every
  // write, so including it would always win and the three meaningful moments
  // would never be read at all.
  return usable(row.updatedAt) ? row.updatedAt : null;
}

function usable(d: unknown): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** Plain-language age, in the register's own voice. Never a precise date — she
 *  is being told how current an answer is, not audited. */
function ageLabel(days: number): string {
  if (days <= 0) return FRESHNESS_TODAY; // future stamps (clock skew) read as today
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 61) return "last month";
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  if (days < 730) return "last year";
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * The label a row should show now, given what it stored and when it was
 * answered. Pure: `now` is passed in so the boundaries are testable, and so one
 * payload cannot straddle midnight mid-build.
 */
export function freshnessLabelFor(row: FreshnessRow, now: Date): string {
  if (!DERIVED_FROM_TIMESTAMP.has(row.freshnessLabel)) return row.freshnessLabel;
  const at = answeredAt(row);
  // No usable stamp at all: say what was stored rather than invent an age.
  if (!at) return row.freshnessLabel;
  return ageLabel(daysBetween(at, now));
}
