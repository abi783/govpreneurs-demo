"use client";

// Roadmap v3 — the new-customer intake offer, ported from the frozen
// prototype. Renders only when the server payload carries a real backing
// section and the member's window is still open; every figure is derived
// from the live catalog (listTotal is the sum of the five member-facing
// offers' real prices), never typed. Purchase goes through the same enroll
// endpoint as everything else.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUSD, parseMoney } from "./detailContent";
import type { V3Payload } from "@sc/lib/roadmapV3/types";
import { PromotionalCreditLine, PurchaseBreakdownLine } from "../WalletAmountLines";
import { purchaseBreakdown, walletAmountsFrom, type PurchaseBreakdown } from "@sc/lib/billing/walletDisplay";
import { CREDIT_COVERED_PURCHASE, WALLET_BALANCE_LABEL } from "@sc/lib/walletCopy";
import { useBusinessAddressGate } from "../useBusinessAddressGate";
import { AddressStep } from "../AddressStep";
import { RM3_ADDRESS_FORM_CLASSES } from "./addressFormClasses";
import { CheckCircle2, PlayCircle, UserRound, X } from "./Icon";
import { GovernmentFeeNotice, InvoiceReadyToast, PurchaseSuccessInvoice, TaxIncludedLine, TermsConsent } from "./PilotCheckout";
import { governmentFeeDisclosureFor } from "./checkoutTerms";
import { checkoutErrorText, termsRequestFields } from "../checkoutTerms";
import { useTermsGate } from "../useTermsGate";
import { usePurchaseInvoice } from "./usePurchaseInvoice";
import { PURCHASE_DONE, purchaseSuccessTitle } from "@sc/lib/walletCopy";

export function IntakeOfferModal({
  open,
  onOpenChange,
  intake,
  locationId,
  userToken,
  wallet,
  scopeItems,
  fixtureMode,
  purchaseConfirmation,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intake: NonNullable<V3Payload["intake"]>;
  locationId: string;
  userToken: string | null;
  wallet: V3Payload["wallet"];
  /** What the bundle includes — the five member-facing services' names. */
  scopeItems: string[];
  fixtureMode: boolean;
  /** The pilot checkout additions and success view (payload `purchaseConfirmation`, PRD §8.2, §8.3). */
  purchaseConfirmation: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* The split as planned when she paid. The wallet prop refreshes after the
     purchase, so the done screen must not re-plan against the new balance. */
  const [paidSplit, setPaidSplit] = useState<PurchaseBreakdown | null>(null);
  const terms = useTermsGate(purchaseConfirmation);
  const resetTerms = terms.reset;
  const addressGate = useBusinessAddressGate(locationId);
  const cancelAddress = addressGate.cancel;
  const invoice = usePurchaseInvoice(locationId, open && done);
  const invoiceToast = <InvoiceReadyToast view={invoice.toast} onDismiss={invoice.dismissToast} />;

  useEffect(() => {
    if (!open) {
      setDone(false);
      resetTerms();
      setError(null);
      cancelAddress();
    }
  }, [open, cancelAddress, resetTerms]);

  // The modal is closed, but a ready invoice still gets its toast.
  if (!open) return invoiceToast;

  const price = parseMoney(intake.price);
  const saving = Math.max(0, Math.round((intake.listTotal - price) * 100) / 100);
  const pctOff = intake.listTotal > 0 ? Math.floor((saving / intake.listTotal) * 100) : 0;
  const walletBalance = wallet?.balance ?? null;
  const enough = walletBalance != null && walletBalance >= price;
  const amounts = walletAmountsFrom(wallet);
  const breakdown = purchaseBreakdown(price, amounts);

  /* Every enroll records an invoice row (D14), so the address step always
     has its say before the charge. */
  async function enrol() {
    if (fixtureMode || paying) return;
    if (!terms.allowsPay()) return;
    await addressGate.run(submitEnrollment);
  }

  async function submitEnrollment() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${locationId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId: intake.stepId,
          serviceTitles: [intake.serviceTitle],
          ...termsRequestFields(purchaseConfirmation, terms.ticked),
          userToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(checkoutErrorText(data?.error, res.status));
        return;
      }
      if (purchaseConfirmation && typeof data?.enrollmentId === "string") invoice.track(data.enrollmentId);
      setPaidSplit(breakdown);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      {invoiceToast}
      <div className="dfyd__overlay" onClick={() => onOpenChange(false)} />
      <div className="iom" role="dialog" aria-modal="true" aria-label="New customer intake offer">
        <header className="dfyd__head">
          <div>
            <h2 className="dfyd__title">Start everything at once</h2>
            <p className="iom__sub">{intake.serviceTitle}</p>
          </div>
          <button type="button" className="dfyd__close" aria-label="Close" onClick={() => onOpenChange(false)}>
            <X size={16} aria-hidden />
          </button>
        </header>

        {done && purchaseConfirmation ? (
          <div className="dfyd__body dfyd__done">
            <span className="dfyd__done-icon" aria-hidden>
              <CheckCircle2 size={30} />
            </span>
            <p className="dfyd__done-title">{purchaseSuccessTitle(intake.serviceTitle)}</p>
            {paidSplit?.creditCoversAll && <p className="dfyd__done-body">{CREDIT_COVERED_PURCHASE}</p>}
            <PurchaseSuccessInvoice view={invoice.view} locationId={locationId} />
            <button type="button" className="rm2-btn rm2-btn--green" onClick={() => onOpenChange(false)}>
              {PURCHASE_DONE}
            </button>
          </div>
        ) : done ? (
          <div className="dfyd__body dfyd__done">
            <span className="dfyd__done-icon" aria-hidden>
              <CheckCircle2 size={30} />
            </span>
            <p className="dfyd__done-title">Our team has your order.</p>
            <p className="dfyd__done-body">
              {paidSplit?.creditCoversAll
                ? CREDIT_COVERED_PURCHASE
                : `${formatUSD(paidSplit?.fromWallet ?? price)} came out of your wallet.`}{" "}
              We will email you when the work starts.
              Nothing else is needed from you today.
            </p>
            <button type="button" className="rm2-btn rm2-btn--green" onClick={() => onOpenChange(false)}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="dfyd__body iom__body">
              <div className="iom__cols">
                <div>
                  <div className="dfyd__video dfyd__video--empty">
                    <PlayCircle size={26} aria-hidden />
                    <span>A short video about this offer is coming.</span>
                  </div>

                  <p className="dfyd__benefit">
                    Our team takes the whole Foundation and Credibility run off your plate — one
                    order, one intake, every registration filed by the people who do this all day.
                  </p>

                  <dl className="dfyd__facts">
                    <div className="dfyd__fact">
                      <dt>
                        <UserRound size={14} aria-hidden />
                        Who does it
                      </dt>
                      <dd>The GovPreneurs specialist teams</dd>
                    </div>
                    <div className="dfyd__fact">
                      <dt>
                        <CheckCircle2 size={14} aria-hidden />
                        What you do
                      </dt>
                      <dd>One intake about your business. We do the rest.</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="dfyd__h">What is included</h3>
                  <ul className="dfyd__list">
                    {scopeItems.map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={14} aria-hidden />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="iom__note">
                    Your website and email setup covers both phases. In this package you pay for it
                    once.
                  </p>
                </div>
              </div>
            </div>

            <footer className="dfyd__foot">
              {purchaseConfirmation && <GovernmentFeeNotice text={governmentFeeDisclosureFor(intake.slug)} />}
              <div className="dfyd__price-row">
                <span>Price</span>
                {saving > 0 ? (
                  <span className="iom__prices">
                    <span className="iom__was">
                      <span className="iom__was-num">{formatUSD(intake.listTotal)}</span>
                    </span>
                    <strong className="dfyd__price iom__now">{formatUSD(price)}</strong>
                    <span className="iom__off">{pctOff}% off</span>
                  </span>
                ) : (
                  <strong className="dfyd__price">{formatUSD(price)}</strong>
                )}
              </div>
              {saving > 0 && <p className="iom__save">You save {formatUSD(saving)}.</p>}
              <div className="dfyd__wallet">
                {WALLET_BALANCE_LABEL}: <strong>{amounts != null ? formatUSD(amounts.paidBalance) : "—"}</strong>
              </div>
              <PromotionalCreditLine amounts={amounts} format={formatUSD} className="dfyd__wallet" />
              <PurchaseBreakdownLine breakdown={breakdown} format={formatUSD} className="dfyd__wallet" />
              {purchaseConfirmation && <TaxIncludedLine />}
              {!enough && walletBalance != null && (
                <p className="dfyd__short">
                  You need {formatUSD(price - walletBalance)} more before you can enrol.
                </p>
              )}
              {purchaseConfirmation && enough && (
                <TermsConsent {...terms.box} disabled={paying || addressGate.asking} />
              )}
              {error && <p className="dfyd__short">{error}</p>}
              {fixtureMode && <p className="dfyd__short">Test state — enrolment is off.</p>}
              {/* The address form is its own <form>: it replaces the button. */}
              <AddressStep gate={addressGate} classes={RM3_ADDRESS_FORM_CLASSES}>
                <button
                  type="button"
                  className="rm2-btn rm2-btn--green"
                  disabled={!enough || paying || fixtureMode || terms.payDisabled}
                  onClick={enrol}
                >
                  {paying ? "Enrolling…" : enough ? "Enrol" : "Add money to your wallet"}
                </button>
              </AddressStep>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
