/**
 * What the expanded row of one wallet charge shows (PRD §8.4, row detail).
 *
 * Layer: Entities. Pure: no I/O, no env. The drawer draws the lines that this
 * module returns and computes nothing itself.
 *
 * A charge with an invoice row shows the whole sale: the full price, each
 * discount from `saleDiscounts` (the same list and order as the invoice and
 * the receipt email), the tax inside the total when the provider reported
 * more than 0, and the amount paid from the wallet. A charge with no row, or
 * a row that the audience may not see, shows only what the charge itself has.
 */
import {
  ORDER_ID_LABEL,
  PAYMENT_METHOD_WALLET,
  RECEIPT_NUMBER_LABEL,
  RECEIPT_PAID_LABEL,
  RECEIPT_TAX_INCLUDED_LABEL,
  USAGE_PRICE_LABEL,
} from "@sc/lib/walletCopy";
import { saleDiscounts } from "./saleDiscounts";
import type { UsageReceipt } from "./walletReceipt";
import { roundToCent } from "./walletSplit";

/** The `WalletInvoice` columns that a breakdown reads. */
export const CHARGE_BREAKDOWN_SELECT = {
  id: true,
  price: true,
  couponCode: true,
  couponDiscount: true,
  creditsApplied: true,
  roundingWriteOff: true,
  paidCharge: true,
  reportedTax: true,
  currency: true,
} as const;

/** The money of one sale, from its `WalletInvoice` row. Dollars. */
export interface ChargeBreakdown {
  /** The `WalletInvoice` id. */
  rowId: string;
  /** The price after the coupon, as the row stores it. */
  price: number;
  couponCode: string | null;
  couponDiscount: number;
  creditsApplied: number;
  roundingWriteOff: number;
  /** The invoice total: the amount taken from the paid balance. */
  paidCharge: number;
  /** The tax inside the total, as the provider reported it. Null: no figure. */
  reportedTax: number | null;
  currency: string;
}

/** The charge fields that the detail reads. */
export interface DetailSource {
  /** The charge's own id: the enrollment or the booking. */
  id: string;
  amount: number;
  currency: string;
  breakdown?: ChargeBreakdown;
  receipt?: UsageReceipt;
}

/** One money line of the detail. A discount amount is positive; the screen shows it as a deduction. */
export interface ChargeDetailLine {
  kind: "price" | "discount" | "tax" | "paid";
  label: string;
  amount: number;
}

/** One reference that the member can copy. */
export interface ChargeReference {
  label: string;
  value: string;
}

/** Everything the expanded row shows. */
export interface ChargeDetail {
  lines: ChargeDetailLine[];
  currency: string;
  paymentMethod: string;
  references: ChargeReference[];
}

function saleLines(b: ChargeBreakdown): ChargeDetailLine[] {
  const lines: ChargeDetailLine[] = [
    { kind: "price", label: USAGE_PRICE_LABEL, amount: roundToCent(b.price + b.couponDiscount) },
    ...saleDiscounts(b).map(({ label, amount }): ChargeDetailLine => ({ kind: "discount", label, amount })),
  ];
  if (b.reportedTax !== null && b.reportedTax > 0) {
    lines.push({ kind: "tax", label: RECEIPT_TAX_INCLUDED_LABEL, amount: b.reportedTax });
  }
  lines.push({ kind: "paid", label: RECEIPT_PAID_LABEL, amount: b.paidCharge });
  return lines;
}

/** The detail of one charge. */
export function chargeDetail(charge: DetailSource): ChargeDetail {
  const { breakdown, receipt } = charge;
  const references: ChargeReference[] = [];
  if (receipt?.number) references.push({ label: RECEIPT_NUMBER_LABEL, value: receipt.number });
  references.push({ label: ORDER_ID_LABEL, value: charge.id });
  return {
    lines: breakdown ? saleLines(breakdown) : [{ kind: "paid", label: RECEIPT_PAID_LABEL, amount: charge.amount }],
    currency: breakdown?.currency ?? charge.currency,
    paymentMethod: PAYMENT_METHOD_WALLET,
    references,
  };
}
