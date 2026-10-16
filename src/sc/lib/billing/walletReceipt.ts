/**
 * What one wallet charge shows about its receipt.
 *
 * Layer: Entities. Pure: no I/O. It turns a `WalletInvoice` row, or its
 * absence, into one of four states, and it decides what each audience sees.
 *
 * The member sees the receipt, never the invoice (owner, 22 Sep 2026): the
 * invoice document reads "Amount due" and offers a payment link even after the
 * wallet has paid, while the receipt records the payment. The link goes to our
 * receipt route (`receiptPath`), which redirects to the provider's hosted page.
 * That page shows the invoice as paid and offers the receipt.
 *
 * The states follow the PRD's roadmap table (§8.5): ready, preparing, and
 * unavailable for a sale made before invoices existed. Staff see one more,
 * `failed`, with the reason the row stores, because staff are the people who
 * can fix it. A member is told only that no receipt is available.
 */

import { absoluteAppUrl } from "@sc/lib/appUrl";
import { WALLET_INVOICE_PAID } from "./types";

/** Ready (paid, with its number), preparing (not yet issued), unavailable, or failed (staff only). */
export type ReceiptState = "ready" | "preparing" | "unavailable" | "failed";

/** Who is looking. Staff see failures and their reasons; a member does not. */
export type ReceiptAudience = "member" | "staff";

/** One charge's receipt, as a screen shows it. */
export interface UsageReceipt {
  state: ReceiptState;
  /** The invoice number, once issued. */
  number?: string;
  /** Our receipt route (`receiptPath`), when the provider has a hosted page. Not every provider has one. */
  url?: string;
  /** Staff only: the error the row stores, such as `customer_not_found`. */
  reason?: string;
}

/** The `WalletInvoice` columns this reads. */
export interface ReceiptSourceRow {
  id: string;
  status: string;
  ghlInvoiceNumber: string | null;
  /** Set when the provider has a hosted page. Only its presence is read here — see `receiptPath`. */
  invoiceUrl: string | null;
  lastError: string | null;
}

/** The select that reads a `ReceiptSourceRow`, plus the key the caller joins on. */
export const RECEIPT_SOURCE_SELECT = {
  id: true,
  sourceId: true,
  status: true,
  ghlInvoiceNumber: true,
  invoiceUrl: true,
  lastError: true,
} as const;

/**
 * The link a screen or the email shows for a receipt: our own route, never the
 * stored provider link.
 *
 * WHY. A provider's hosted invoice link can expire 30 days after the due date, and a
 * wallet invoice is due the day it is issued, so a stored link goes dead a
 * month after the sale. The provider guarantees that a link fetched fresh from its
 * API works for at least 10 days. So the route asks for one on every click and
 * redirects to it. See `app/api/portal/[locationId]/receipts/[id]`.
 */
export function receiptPath(ghlLocationId: string, rowId: string): string {
  return `/api/portal/${encodeURIComponent(ghlLocationId)}/receipts/${encodeURIComponent(rowId)}`;
}

/** The receipt link for an email: the app base (trailing slashes removed) + receiptPath. */
export function absoluteReceiptUrl(appUrl: string, ghlLocationId: string, rowId: string): string {
  return absoluteAppUrl(appUrl, receiptPath(ghlLocationId, rowId));
}

const WAITING_STATUSES = new Set(["pending", "created"]);

function withReason(receipt: UsageReceipt, row: ReceiptSourceRow, audience: ReceiptAudience): UsageReceipt {
  return audience === "staff" && row.lastError ? { ...receipt, reason: row.lastError } : receipt;
}

/**
 * The receipt of one charge. `row` is undefined when the sale has no invoice
 * row. `ghlLocationId` is the member's, so the link can name her route.
 */
export function receiptFor(
  row: ReceiptSourceRow | undefined,
  audience: ReceiptAudience,
  ghlLocationId: string,
): UsageReceipt {
  if (!row) return { state: "unavailable" };
  if (row.status === WALLET_INVOICE_PAID) {
    const receipt: UsageReceipt = { state: "ready" };
    if (row.ghlInvoiceNumber) receipt.number = row.ghlInvoiceNumber;
    if (row.invoiceUrl) receipt.url = receiptPath(ghlLocationId, row.id);
    return receipt;
  }
  if (WAITING_STATUSES.has(row.status)) return withReason({ state: "preparing" }, row, audience);
  if (row.status === "failed") {
    return audience === "staff" ? withReason({ state: "failed" }, row, audience) : { state: "unavailable" };
  }
  return { state: "unavailable" };
}
