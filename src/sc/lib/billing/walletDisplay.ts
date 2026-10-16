/**
 * What a member screen shows about her wallet: the paid balance and the
 * promotional credit as two numbers, and how one price will be paid
 * (design 2026-09-18-wallet-credit-vs-cash §6).
 *
 * Layer: Entities. Pure: no I/O. It plans with `planWalletSplit`, the same
 * planner that the sale routes use, so a screen can never promise a split
 * that the charge does not make.
 */
import { planWalletSplit, roundToCent } from "./walletSplit";
import type { WalletSplit } from "./types";

/** The two wallet pools, as a screen shows them. */
export interface WalletAmounts {
  /** Money the member paid in. The wallet calls it `balance`. */
  paidBalance: number;
  /** Complimentary credit. The wallet calls it `complimentaryCredits`. */
  promotionalCredit: number;
}

/** How one purchase will be paid, when promotional credit pays part or all of it. */
export interface PurchaseBreakdown {
  /** Credit applied plus any rounding write-off, as the invoice counts its discount. */
  promotionalDiscount: number;
  /** The amount taken from the paid balance. */
  fromWallet: number;
  /** True when nothing comes from the paid balance. */
  creditCoversAll: boolean;
  /** The paid balance after the purchase. */
  paidBalanceAfter: number;
}

/** True when a screen should show the promotional-credit line. */
export function showsPromotionalCredit(amounts: WalletAmounts | null): amounts is WalletAmounts {
  return amounts != null && amounts.promotionalCredit > 0;
}

/**
 * Reads `paidBalance` and `promotionalCredit` from a wallet-balance response
 * body or a `getWalletBalance` result. Returns null if either is missing.
 * The result holds the two amounts only.
 */
export function walletAmountsFrom(body: unknown): WalletAmounts | null {
  if (body == null || typeof body !== "object") return null;
  const { paidBalance, promotionalCredit } = body as Record<string, unknown>;
  if (typeof paidBalance !== "number" || typeof promotionalCredit !== "number") return null;
  return { paidBalance, promotionalCredit };
}

/** Plans `price` against the two pools. Returns null for an unknown or short wallet. */
function planFor(price: number, amounts: WalletAmounts | null): WalletSplit | null {
  if (amounts == null) return null;
  const plan = planWalletSplit({
    price,
    complimentaryCredits: amounts.promotionalCredit,
    paidBalance: amounts.paidBalance,
  });
  return plan.insufficient ? null : plan;
}

/** The paid balance after a purchase of `price`. Null for an unknown or short wallet. */
export function paidBalanceAfter(price: number, amounts: WalletAmounts | null): number | null {
  const plan = planFor(price, amounts);
  if (plan == null || amounts == null) return null;
  return roundToCent(amounts.paidBalance - plan.paidCharge);
}

/**
 * The paid balance after adding `topUp`. A top-up adds real money, so it goes
 * to the paid balance only. Null for an unknown wallet.
 */
export function paidBalanceAfterTopUp(amounts: WalletAmounts | null, topUp: number): number | null {
  if (amounts == null) return null;
  return roundToCent(amounts.paidBalance + topUp);
}

/**
 * How `price` will be paid. Null when there is no price, when no credit
 * applies, or when the wallet is unknown or short: each screen keeps its own
 * top-up message for a short wallet.
 */
export function purchaseBreakdown(price: number, amounts: WalletAmounts | null): PurchaseBreakdown | null {
  if (price <= 0) return null;
  const plan = planFor(price, amounts);
  if (plan == null || amounts == null || plan.creditsApplied <= 0) return null;
  return {
    promotionalDiscount: roundToCent(plan.creditsApplied + plan.roundingWriteOff),
    fromWallet: plan.paidCharge,
    creditCoversAll: plan.paidCharge === 0,
    paidBalanceAfter: roundToCent(amounts.paidBalance - plan.paidCharge),
  };
}
