/**
 * The invoice line of the purchase success view (PRD §8.3): it polls the
 * purchase receipt every 5 seconds for up to 60 seconds.
 *
 * Layer: Interface Adapters (client). No React and no fetch, so a node test
 * can drive it with fake timers. `usePurchaseInvoice` wraps it for a screen.
 */

import type { UsageReceipt } from "@sc/lib/billing/walletReceipt";

/** How often the success view asks for the receipt. */
export const INVOICE_POLL_INTERVAL_MS = 5_000;

/** How long it keeps asking before it points to the billing history. */
export const INVOICE_POLL_LIMIT_MS = 60_000;

/** What the invoice line shows: preparing, ready, or "it will appear in your billing history". */
export type InvoiceView =
  | { kind: "preparing" }
  | { kind: "ready"; number?: string; url?: string }
  | { kind: "later" };

/** The view for one receipt read. `receipt` is null when the read failed or has not run. */
export function invoiceViewFor(receipt: UsageReceipt | null, elapsedMs: number): InvoiceView {
  if (receipt?.state === "ready") {
    const view: InvoiceView = { kind: "ready" };
    if (receipt.number) view.number = receipt.number;
    if (receipt.url) view.url = receipt.url;
    return view;
  }
  // A member sees a failed invoice as unavailable: no invoice will come to this screen.
  if (receipt?.state === "unavailable" || receipt?.state === "failed") return { kind: "later" };
  return elapsedMs >= INVOICE_POLL_LIMIT_MS ? { kind: "later" } : { kind: "preparing" };
}

/** What the poll needs. `now` is in milliseconds. */
export interface InvoicePollDeps {
  fetchReceipt: () => Promise<UsageReceipt | null>;
  onView: (view: InvoiceView) => void;
  now: () => number;
}

/**
 * Shows preparing at once, then asks every `INVOICE_POLL_INTERVAL_MS` until
 * the view is no longer preparing. Returns the function that stops it.
 */
export function startInvoicePoll(deps: InvoicePollDeps): () => void {
  const startedAt = deps.now();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    let receipt: UsageReceipt | null = null;
    try {
      receipt = await deps.fetchReceipt();
    } catch (err) {
      console.warn("[wallet-invoice] success view poll failed", err);
    }
    if (stopped) return;
    const view = invoiceViewFor(receipt, deps.now() - startedAt);
    deps.onView(view);
    if (view.kind === "preparing") timer = setTimeout(tick, INVOICE_POLL_INTERVAL_MS);
  }

  deps.onView({ kind: "preparing" });
  timer = setTimeout(tick, INVOICE_POLL_INTERVAL_MS);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

/**
 * Whether the "your invoice is ready" toast is due: the invoice has just
 * turned ready and the success view is not on screen.
 */
export function readyToastDue(prev: InvoiceView | null, next: InvoiceView, successVisible: boolean): boolean {
  return next.kind === "ready" && prev?.kind !== "ready" && !successVisible;
}
