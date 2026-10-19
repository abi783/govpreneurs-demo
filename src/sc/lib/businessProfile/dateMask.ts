/**
 * Typing a date without a calendar, and without a mouse. Pure.
 *
 * She types eight digits — `08222026` — and reads back `08/22/2026`. The
 * separators are produced, never typed and never tabbed between: the whole
 * point is that a date is one field she can fill without leaving the keyboard.
 *
 * MONTH FIRST. These are US federal contracting records and every date on this
 * page is a US one, so `03/04/2027` is 4 March. The order is a decision, not a
 * default: read the other way the same eight digits are a different day, and
 * the value this feeds is a certificate expiry the renewal queue fires on.
 *
 * DIGITS ARE THE STATE, not the formatted string. Formatting on every keystroke
 * from the digits alone is what makes backspace behave — deleting a separator
 * is meaningless, so the caller drops the digit in front of it instead.
 *
 * A partial date is not a date. `isoFrom` answers null until all eight are
 * there AND they name a day that exists, so 02/31 never reaches storage.
 */

/** What she is filling in, in the order she fills it. */
export const DATE_HINT = "MM/DD/YYYY";
/** Eight: two month, two day, four year. */
export const DATE_DIGITS = 8;

const MONTH = 2;
const DAY = 4;

/** Everything that is not a digit, discarded — a paste of "3/4/27" or
 *  "2027-03-04" is just its digits, and so is a keystroke. */
export function digitsOf(input: string): string {
  return input.replace(/\D/g, "").slice(0, DATE_DIGITS);
}

/**
 * The digits, with the separators she never types.
 *
 * Trailing separators are NOT added: showing "08/" before she has typed the day
 * puts the caret behind a character she cannot delete, which is how a mask
 * starts fighting the person using it.
 */
export function formatMask(digits: string): string {
  const d = digitsOf(digits);
  if (d.length <= MONTH) return d;
  if (d.length <= DAY) return `${d.slice(0, MONTH)}/${d.slice(MONTH)}`;
  return `${d.slice(0, MONTH)}/${d.slice(MONTH, DAY)}/${d.slice(DAY)}`;
}

/** Whether these three name a day that actually exists — the check that keeps
 *  31 February and month 13 off the record. */
function realDay(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= last;
}

/**
 * The ISO date these digits mean, or null while they do not mean one yet.
 *
 * Null covers both "not finished" and "not a real day", because the caller does
 * the same thing with each: keep her in the field and store nothing.
 */
export function isoFrom(digits: string): string | null {
  const d = digitsOf(digits);
  if (d.length !== DATE_DIGITS) return null;
  const month = Number(d.slice(0, MONTH));
  const day = Number(d.slice(MONTH, DAY));
  const year = Number(d.slice(DAY));
  if (!realDay(year, month, day)) return null;
  return `${d.slice(DAY)}-${d.slice(0, MONTH)}-${d.slice(MONTH, DAY)}`;
}

/** The digits behind a stored `YYYY-MM-DD`, so an existing answer seeds the
 *  field in the order she reads it. Anything else seeds empty rather than
 *  guessing — a half-parsed date is worse than an empty box. */
export function digitsFromIso(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  return m ? `${m[2]}${m[3]}${m[1]}` : "";
}

/**
 * What the next value should be, given what the box held and what it holds now.
 *
 * The one case a plain "strip the non-digits" gets wrong is backspacing over a
 * separator: the digits are unchanged, so nothing would happen and the caret
 * would sit there refusing to move. Deleting the separator is taken to mean
 * deleting the digit it follows, which is what every masked field does and what
 * she is already expecting.
 */
export function nextDigits(before: string, typed: string): string {
  const wasDigits = digitsOf(before);
  const nowDigits = digitsOf(typed);
  const deletedOnlySeparator =
    typed.length < formatMask(wasDigits).length && nowDigits === wasDigits;
  return deletedOnlySeparator ? wasDigits.slice(0, -1) : nowDigits;
}
