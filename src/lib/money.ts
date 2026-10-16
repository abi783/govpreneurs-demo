// Dollar amounts in compact form, for every page that shows a buyer's value
// estimate: the opportunities feed, its key-info row and the forecast pages.
// Pure. The forecast band wording ("$5M to $10M") lives in lib/forecasts/engine.ts.

import { toRealAmount } from "./naDisplay";

/** At most one decimal after K, M or B: "$225.2K", never "$225.25K". */
const MONEY_FRACTION_DIGITS = 1;
const MONEY_FRACTION_SCALE = 10 ** MONEY_FRACTION_DIGITS;
/** The step at which a figure moves to the next unit: 1000K is 1M. */
const MONEY_UNIT_STEP = 1000;

/** The compact units, largest first. Below the smallest, the whole dollar amount is written. */
const MONEY_UNITS = [
  { size: 1_000_000_000, suffix: "B" },
  { size: 1_000_000, suffix: "M" },
  { size: 1_000, suffix: "K" },
] as const;

/** A figure rounded to MONEY_FRACTION_DIGITS. `String` drops a trailing ".0". */
function roundedFigure(value: number): number {
  return Math.round(value * MONEY_FRACTION_SCALE) / MONEY_FRACTION_SCALE;
}

/**
 * A dollar amount in compact form: "$950", "$250K", "$225.2K", "$1.5M", "$4B".
 * The amount is rounded to whole dollars first, so "$999.6" never appears.
 * Written by hand: Intl's compact currency output differs between ICU versions
 * ("$1M" on one Node, "$1.0M" on another).
 */
export function money(n: number): string {
  const whole = Math.round(n);
  const sign = whole < 0 ? "-" : "";
  const abs = Math.abs(whole);
  for (let i = 0; i < MONEY_UNITS.length; i++) {
    const unit = MONEY_UNITS[i];
    if (abs < unit.size) continue;
    const figure = roundedFigure(abs / unit.size);
    // 999,950 rounds to "1000K": write the next unit up instead.
    const larger = MONEY_UNITS[i - 1];
    if (figure >= MONEY_UNIT_STEP && larger) {
      return `${sign}$${roundedFigure(abs / larger.size)}${larger.suffix}`;
    }
    return `${sign}$${figure}${unit.suffix}`;
  }
  return `${sign}$${abs}`;
}

/**
 * DHS's open-ended "Over $100M" bracket arrives as a $100B high end. It is no
 * maximum. The API already sends it as null; this guards a stale record.
 */
export const OPEN_ENDED_HIGH_SENTINEL = 100_000_000_000;

/** A high end the buyer set, or null when it is absent or the open-ended placeholder. */
export function openEndedHigh(high: number | null): number | null {
  return high === OPEN_ENDED_HIGH_SENTINEL ? null : high;
}

/**
 * An opportunity's value estimate for the feed and its key-info row: "$5M–$10M",
 * "$100M or more", "Up to $5M", or one figure when both ends agree. Null when
 * neither end is a real amount: a zero, blank or unparseable end is no end
 * (`toRealAmount`), and the $100B placeholder is no high end.
 */
export function valueEstimate(
  low: number | string | null | undefined,
  high: number | string | null | undefined,
): string | null {
  const l = toRealAmount(low);
  const h = openEndedHigh(toRealAmount(high));
  if (l != null && h != null) return l === h ? money(l) : `${money(l)}–${money(h)}`;
  if (l != null) return `${money(l)} or more`;
  if (h != null) return `Up to ${money(h)}`;
  return null;
}
