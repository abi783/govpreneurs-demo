/**
 * The discounts of one wallet sale, in the one order that every document prints.
 *
 * Layer: Entities. Pure: no I/O, no env. The receipt email and every
 * provider's invoice all read this list,
 * so they cannot disagree on the order, the labels or which lines appear.
 */
import { couponLabel, PROMOTIONAL_DISCOUNT_LABEL, ROUNDING_ADJUSTMENT_LABEL } from "@sc/lib/walletCopy";
import type { WalletInvoiceRecord } from "./types";

/** The kind of a discount. A gateway may build its idempotency keys from it, so do not rename a kind. */
export type SaleDiscountKind = "coupon" | "promo" | "rounding";

/** One discount. `amount` is a positive dollar amount. */
export interface SaleDiscount {
  kind: SaleDiscountKind;
  label: string;
  amount: number;
}

/** The row fields that the discounts come from. */
export type SaleDiscountSource = Pick<
  WalletInvoiceRecord,
  "couponCode" | "couponDiscount" | "creditsApplied" | "roundingWriteOff"
>;

/** The coupon, the spent credits and the rounding write-off, in that order. A zero amount gives no entry. */
export function saleDiscounts(row: SaleDiscountSource): SaleDiscount[] {
  const all: SaleDiscount[] = [
    { kind: "coupon", label: couponLabel(row.couponCode), amount: row.couponDiscount },
    // PRD 1.3.2 §10.4 (D3 decided): spent complimentary credit is a promotional discount.
    { kind: "promo", label: PROMOTIONAL_DISCOUNT_LABEL, amount: row.creditsApplied },
    { kind: "rounding", label: ROUNDING_ADJUSTMENT_LABEL, amount: row.roundingWriteOff },
  ];
  return all.filter((discount) => discount.amount > 0);
}
