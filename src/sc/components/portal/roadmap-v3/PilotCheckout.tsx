"use client";

// Roadmap v3 — the pilot checkout additions (PRD §8.2) and the success view's
// invoice line (PRD §8.3). The drawer (DfyDrawer) and the intake offer
// (IntakeOfferModal) use them all; the booking sheet uses the terms box
// (TermsConsent, the shared TermsBox in the Design System classes). Only a member for whom
// the payload's `purchaseConfirmation` is true sees them. Every string is a
// placeholder in walletCopy.ts. Design System tokens only (roadmap-v3.css).

import type { ComponentProps } from "react";
import type { InvoiceView } from "../invoicePoll";
import { TermsBox, type TermsBoxClasses } from "../TermsBox";
import { followWalletHistoryLink, walletHistoryHref } from "../walletHistoryLink";
import {
  CHECKOUT_TAX_INCLUDED,
  INVOICE_TOAST_VIEW,
  PURCHASE_BILLING_HISTORY,
  PURCHASE_INVOICE_LATER,
  PURCHASE_INVOICE_PREPARING,
  PURCHASE_VIEW_INVOICE,
  invoiceReadyToast,
  purchaseInvoiceReady,
} from "@sc/lib/walletCopy";
import { X } from "./Icon";

/** The government fee disclosure. Renders nothing when the service has none. */
export function GovernmentFeeNotice({ text }: { text: string | null }) {
  return text ? <p className="dfyd__govfee">{text}</p> : null;
}

/** "Includes sales tax", under the breakdown. It has no amount: the provider computes the tax later. */
export function TaxIncludedLine() {
  return <p className="dfyd__confirm-note">{CHECKOUT_TAX_INCLUDED}</p>;
}

/** The Design System classes of the terms box on roadmap v3 (roadmap-v3.css). */
const RM3_TERMS_BOX_CLASSES: TermsBoxClasses = {
  root: "dfyd__terms",
  row: "dfyd__terms-row",
  note: "dfyd__confirm-note",
  error: "dfyd__terms-error",
};

/** The required terms box with its two links, and the invoice note under it, in roadmap v3's classes. */
export function TermsConsent(props: Omit<ComponentProps<typeof TermsBox>, "classes">) {
  return <TermsBox {...props} classes={RM3_TERMS_BOX_CLASSES} />;
}

/** The billing history link: the portal home with its Usage History drawer open. */
export function billingHistoryHref(locationId: string): string {
  return walletHistoryHref(locationId);
}

/** The invoice line of the success view, and the link to the billing history. */
export function PurchaseSuccessInvoice({ view, locationId }: { view: InvoiceView | null; locationId: string }) {
  return (
    <div className="dfyd__invoice">
      {view?.kind === "ready" ? (
        <p className="dfyd__invoice-line">
          {purchaseInvoiceReady(view.number)}
          {view.url && (
            <>
              {" · "}
              <a href={view.url} target="_blank" rel="noreferrer">
                {PURCHASE_VIEW_INVOICE}
              </a>
            </>
          )}
        </p>
      ) : (
        <p className="dfyd__invoice-line">
          {view?.kind === "later" ? PURCHASE_INVOICE_LATER : PURCHASE_INVOICE_PREPARING}
        </p>
      )}
      <a
        className="dfyd__invoice-history"
        href={billingHistoryHref(locationId)}
        onClick={(e) => followWalletHistoryLink(e.currentTarget, locationId)}
      >
        {PURCHASE_BILLING_HISTORY}
      </a>
    </div>
  );
}

/** The toast when the invoice turns ready after she closed the success view. */
export function InvoiceReadyToast({
  view,
  onDismiss,
}: {
  view: Extract<InvoiceView, { kind: "ready" }> | null;
  onDismiss: () => void;
}) {
  if (!view) return null;
  return (
    <div className="gpds-toast" role="status">
      <span>{invoiceReadyToast(view.number)}</span>
      {view.url && (
        <a className="rm3-toast-link" href={view.url} target="_blank" rel="noreferrer" onClick={onDismiss}>
          {INVOICE_TOAST_VIEW}
        </a>
      )}
      <button type="button" aria-label="Close" onClick={onDismiss}>
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
