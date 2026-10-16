/**
 * Plans how one sale price splits between free credits and the paid balance (spec §4).
 *
 * Layer: Entities. Pure: no I/O, no env, no clock. Imports only `./types`.
 * The rules keep the split that the wallet's `chargeWallet` used before
 * this module: credits first with a 1-cent margin, then a write-off of up to 2 cents.
 */
import type { TaxFor, WalletSplitInput, WalletSplitResult } from "./types";

const CENTS_PER_DOLLAR = 100;

/**
 * The wallet stores credits with sub-cent precision, but reads and debits round to the cent.
 * A debit of the full rounded value can fail, so 1 cent of credits stays unused.
 */
const CREDIT_MARGIN = 0.01;

/** The largest gap, in cents, that the seller absorbs when the credit margin leaves one. */
const MAX_WRITE_OFF_CENTS = 2;

/** Rounds a dollar amount to the nearest cent. */
export function roundToCent(n: number): number {
  return Math.round(n * CENTS_PER_DOLLAR) / CENTS_PER_DOLLAR;
}

/**
 * Truncates a dollar amount down to the cent, and one cent lower on about 5% of
 * values: `0.29 * 100` is `28.999999999999996` in floating point, so `0.29`
 * floors to `0.28`. This matches the arithmetic `chargeWallet` used before the
 * wallet-invoice build, so the plan and the charge can never disagree, and the
 * lost cent becomes a rounding write-off rather than a larger debit. Decision
 * B11 keeps it: an exact floor would take one more cent from the member.
 */
function floorToCent(n: number): number {
  return Math.floor(n * CENTS_PER_DOLLAR) / CENTS_PER_DOLLAR;
}

/** Returns the free credits that a debit can use: floored to the cent, less the 1-cent margin. */
export function usableCredits(complimentaryCredits: number): number {
  return Math.max(0, roundToCent(floorToCent(complimentaryCredits) - CREDIT_MARGIN));
}

/** Returns the paid balance that a debit can use: floored to the cent. */
export function spendablePaid(paidBalance: number): number {
  return floorToCent(paidBalance);
}

/** The tax seam of this build. It always returns 0. */
export const zeroTax: TaxFor = () => 0;

/**
 * Splits `price` between free credits and the paid balance.
 * Credits pay first and never pay tax. The paid balance pays the rest and all tax.
 * If the paid balance cannot cover its part, the result is `{ insufficient: true, shortfall }`.
 */
export function planWalletSplit(
  input: WalletSplitInput,
  taxFor: TaxFor = zeroTax,
): WalletSplitResult {
  const paidAvailable = spendablePaid(input.paidBalance);
  const creditsApplied = roundToCent(Math.min(usableCredits(input.complimentaryCredits), input.price));
  const remainder = roundToCent(input.price - creditsApplied);
  const gapCents = Math.round((remainder - paidAvailable) * CENTS_PER_DOLLAR);
  const roundingWriteOff =
    gapCents > 0 && gapCents <= MAX_WRITE_OFF_CENTS ? gapCents / CENTS_PER_DOLLAR : 0;
  const taxableAmount = roundToCent(remainder - roundingWriteOff);
  const tax = roundToCent(taxFor(taxableAmount));
  const paidCharge = roundToCent(taxableAmount + tax);

  if (paidCharge > paidAvailable) {
    return { insufficient: true, shortfall: roundToCent(paidCharge - paidAvailable) };
  }
  return { insufficient: false, creditsApplied, roundingWriteOff, taxableAmount, tax, paidCharge };
}
