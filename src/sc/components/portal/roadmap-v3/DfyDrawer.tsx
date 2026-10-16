"use client";

// Roadmap v3 — the "Done for you" purchase drawer, ported from the frozen
// prototype with the mock wallet replaced by the real one:
//
//   price     TaskSection.servicePrice / servicePriceOptions (via payload) —
//             read, never typed. The server re-resolves the option and never
//             trusts a client price.
//   balance   GET /api/portal/:loc/wallet-balance (display; the enroll route
//             re-checks server-side before charging).
//   purchase  POST /api/portal/:loc/enroll — the same endpoint the current
//             roadmap uses, so a purchase here creates the same
//             ServiceEnrollment everything else already understands.
//   top-up    there is no in-app card charge; money is added in the GHL
//             wallet (deep link), then the balance is refetched here.
//
// The offer → topup → confirm → done flow is the prototype's. `confirm`
// exists because nothing on this product commits without a confirmation, and
// this is the largest single amount she will ever move here.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_COPY, formatUSD, parseMoney, scopeNote } from "./detailContent";
import { isDirectVideo, ytEmbedSrc } from "@sc/lib/video";
import type { V3Offer, V3Wallet } from "@sc/lib/roadmapV3/types";
import { PromotionalCreditLine } from "../WalletAmountLines";
import {
  paidBalanceAfter,
  paidBalanceAfterTopUp,
  purchaseBreakdown,
  walletAmountsFrom,
  type PurchaseBreakdown,
  type WalletAmounts,
} from "@sc/lib/billing/walletDisplay";
import {
  CREDIT_COVERED_PURCHASE,
  CREDIT_COVERS_PURCHASE,
  FROM_WALLET_LABEL,
  PROMOTIONAL_DISCOUNT_LABEL,
  WALLET_AFTER_TOP_UP_LABEL,
  WALLET_AND_CREDIT_TOTAL,
  WALLET_BALANCE_LABEL,
} from "@sc/lib/walletCopy";
import { useBusinessAddressGate } from "../useBusinessAddressGate";
import { AddressStep } from "../AddressStep";
import { RM3_ADDRESS_FORM_CLASSES } from "./addressFormClasses";
import { ArrowLeft, CheckCircle2, ClipboardList, Clock, UserRound, Wallet as WalletIcon, X } from "./Icon";
import { GovernmentFeeNotice, InvoiceReadyToast, PurchaseSuccessInvoice, TaxIncludedLine, TermsConsent } from "./PilotCheckout";
import { governmentFeeDisclosureFor } from "./checkoutTerms";
import { checkoutErrorText, termsRequestFields } from "../checkoutTerms";
import { useTermsGate } from "../useTermsGate";
import { usePurchaseInvoice } from "./usePurchaseInvoice";
import { PURCHASE_DONE, purchaseSuccessTitle } from "@sc/lib/walletCopy";

/**
 * Is in-app top-up switched on?
 *
 * SHE PICKS THE AMOUNT HERE; GHL'S BILLING PAGE TAKES THE MONEY.
 *
 * That split is the design, not a stopgap. GHL's recharge call — which this
 * app implements (lib/ghl/walletTopup.ts) — CREDITS a wallet from a Stripe
 * PaymentIntent that has already been PAID. There is no amount in its
 * payload; the money is in the intent. Nothing here can make that intent:
 * the member's Stripe customer lives on GHL's connected account
 * (acct_1PU8Pg…), this server holds no Stripe credentials for it, and the
 * intent is created and confirmed inside Stripe's own iframe on GHL's
 * billing page — the parent frame never sees the call, only the telemetry.
 *
 * It should stay that way even once it could be otherwise. Taking a card in
 * this drawer would pull us into PCI scope and in front of her saved payment
 * methods, to duplicate a page GHL already renders correctly.
 *
 * What was broken was never the charge. It was that this screen made her
 * work out how much she needed and then sent her away with the number in her
 * head. So the picker stays and does the arithmetic, and the button carries
 * the number to the page that can act on it. She comes back, presses "I
 * added money", refreshBalance() re-reads the wallet, and the purchase
 * unblocks. No dead button, no half-charge, no card in our hands.
 */

export function DfyDrawer({
  offer,
  subStepLabel,
  includes,
  duration,
  drawer,
  locationId,
  userToken,
  wallet,
  walletVideoUrl,
  fixtureMode,
  purchaseConfirmation,
  onClose,
}: {
  /** The drawer is open whenever this is set. */
  offer: V3Offer | null;
  subStepLabel: string;
  includes: { title: string; description?: string }[];
  /** The sub-step's own estimate, which beats the service's general one. */
  duration?: string | null;
  /** Admin-configured drawer copy for this step (/admin/roadmapv3). */
  drawer?: {
    videoUrl?: string;
    benefit?: string;
    deliveredBy?: string;
    turnaround?: string;
    yourPart?: string;
  };
  locationId: string;
  userToken: string | null;
  wallet: V3Wallet | null;
  walletVideoUrl: string | null;
  /** ?scenario= mode — everything renders, nothing charges. */
  fixtureMode: boolean;
  /** The pilot checkout additions and success view (payload `purchaseConfirmation`, PRD §8.2, §8.3). */
  purchaseConfirmation: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"offer" | "topup" | "confirm" | "done">("offer");
  const [optionId, setOptionId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(wallet?.balance ?? null);
  const [amounts, setAmounts] = useState<WalletAmounts | null>(walletAmountsFrom(wallet));
  /* The split as planned when she paid, for the done screen. */
  const [paidSplit, setPaidSplit] = useState<PurchaseBreakdown | null>(null);
  const [coupon, setCoupon] = useState("");
  const [couponState, setCouponState] = useState<
    | { kind: "idle" }
    | { kind: "checking" }
    | { kind: "invalid"; reason: string }
    | { kind: "valid"; code: string; discount: number }
  >({ kind: "idle" });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addCustom, setAddCustom] = useState(false);
  const [addAmount, setAddAmount] = useState(0);
  const terms = useTermsGate(purchaseConfirmation);
  const resetTerms = terms.reset;
  const addressGate = useBusinessAddressGate(locationId);
  const cancelAddress = addressGate.cancel;

  const open = offer != null;
  const invoice = usePurchaseInvoice(locationId, open && step === "done");
  const invoiceToast = <InvoiceReadyToast view={invoice.toast} onDismiss={invoice.dismissToast} />;

  useEffect(() => {
    if (!open) {
      setStep("offer");
      resetTerms();
      setOptionId(null);
      setCoupon("");
      setCouponState({ kind: "idle" });
      setPayError(null);
      cancelAddress();
    }
  }, [open, cancelAddress, resetTerms]);

  // Freshest balance the moment the drawer opens — she is about to spend it.
  useEffect(() => {
    if (open) void refreshBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function refreshBalance() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/portal/${locationId}/wallet-balance`);
      const data = await res.json().catch(() => null);
      if (typeof data?.balance === "number") setBalance(data.balance);
      setAmounts((prev) => walletAmountsFrom(data) ?? prev);
    } catch {
      /* display only — the server re-checks */
    } finally {
      setRefreshing(false);
    }
  }


  // The drawer is closed, but a ready invoice still gets its toast.
  if (!offer) return invoiceToast;

  const copy = SERVICE_COPY[offer.slug];
  // Admin overrides beat the static catalog copy, field by field.
  const benefit = drawer?.benefit ?? copy?.benefit;
  const deliveredBy = drawer?.deliveredBy ?? copy?.deliveredBy;
  const yourPart = drawer?.yourPart ?? copy?.yourPart;
  const videoUrl = drawer?.videoUrl ?? null;
  const videoEmbed = videoUrl && !isDirectVideo(videoUrl) ? ytEmbedSrc(videoUrl) : null;
  const options = offer.priceOptions;
  const option = options ? (options.find((o) => o.id === optionId) ?? options[0]!) : null;
  const listAmount = option ? parseMoney(option.price) : parseMoney(offer.price);
  const discount = couponState.kind === "valid" ? couponState.discount : 0;
  const amount = Math.max(0, Math.round((listAmount - discount) * 100) / 100);
  const enough = balance != null && balance >= amount;
  const breakdown = purchaseBreakdown(amount, amounts);
  const walletAfter = paidBalanceAfter(amount, amounts);
  const shortfall = Math.max(0, Math.round((amount - (balance ?? 0)) * 100) / 100);
  /* Enough to clear the shortfall, rounded up to a whole dollar — the preset
     she will almost always want. */
  const suggestedTopUp = Math.max(1, Math.ceil(shortfall));
  const topUpAmount = addCustom ? Math.max(0, Math.floor(addAmount)) : suggestedTopUp;
  const walletAfterTopUp = paidBalanceAfterTopUp(amounts, topUpAmount);
  const scope = includes;

  async function applyCoupon() {
    const code = coupon.trim();
    if (!code) return;
    setCouponState({ kind: "checking" });
    try {
      const res = await fetch(`/api/portal/${locationId}/coupon-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.valid) {
        setCouponState({ kind: "invalid", reason: data?.reason ?? "That code did not work." });
        return;
      }
      const value = Number(data.discountValue) || 0;
      const disc =
        data.discountType === "percent"
          ? Math.round(listAmount * (value / 100) * 100) / 100
          : Math.min(value, listAmount);
      setCouponState({ kind: "valid", code: data.code, discount: disc });
    } catch {
      setCouponState({ kind: "invalid", reason: "Could not check that code. Try again." });
    }
  }

  /* Every enroll records an invoice row, a $0.00 one too (D14), so the
     address step always has its say before the charge. */
  async function pay() {
    if (fixtureMode || paying) return;
    if (!terms.allowsPay()) return;
    await addressGate.run(enroll);
  }

  async function enroll() {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch(`/api/portal/${locationId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepId: offer!.stepId,
          serviceTitles: [offer!.serviceTitle],
          ...(option ? { priceOptionIds: { [offer!.serviceTitle]: option.id } } : {}),
          ...(couponState.kind === "valid" ? { couponCode: couponState.code } : {}),
          ...termsRequestFields(purchaseConfirmation, terms.ticked),
          userToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      // 402 usually means "not enough in the wallet" → top-up screen. But a
      // FAILED charge is also a 402 (chargeFailed flag), and sending someone
      // whose balance is fine to top-up would misdiagnose it — show the
      // error instead.
      if (res.status === 402 && !data?.chargeFailed) {
        if (typeof data?.balance === "number") setBalance(data.balance);
        setStep("topup");
        return;
      }
      if (!res.ok) {
        setPayError(checkoutErrorText(data?.error, res.status));
        return;
      }
      if (typeof data?.balance === "number") setBalance(data.balance);
      if (purchaseConfirmation && typeof data?.enrollmentId === "string") invoice.track(data.enrollmentId);
      setPaidSplit(breakdown);
      setStep("done");
      router.refresh();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : String(err));
    } finally {
      setPaying(false);
    }
  }

  return (
    <>
      {invoiceToast}
      <div className="dfyd__overlay" onClick={onClose} />
      <div className="dfyd" role="dialog" aria-modal="true" aria-label={`${subStepLabel} — Done for you`}>
        <header className="dfyd__head">
          <h2 className="dfyd__title">{subStepLabel} — Done for you</h2>
          <button type="button" className="dfyd__close" aria-label="Close" onClick={onClose}>
            <X size={16} aria-hidden />
          </button>
        </header>

        {step === "done" && purchaseConfirmation ? (
          <div className="dfyd__body dfyd__done">
            <span className="dfyd__done-icon" aria-hidden>
              <CheckCircle2 size={30} />
            </span>
            <p className="dfyd__done-title">{purchaseSuccessTitle(offer.serviceTitle)}</p>
            {paidSplit?.creditCoversAll && <p className="dfyd__done-body">{CREDIT_COVERED_PURCHASE}</p>}
            <PurchaseSuccessInvoice view={invoice.view} locationId={locationId} />
            {/* The service's next step (book the first call) is on the status
                panel that this closes to. */}
            <button type="button" className="rm2-btn rm2-btn--green" onClick={onClose}>
              {PURCHASE_DONE}
            </button>
          </div>
        ) : step === "done" ? (
          <div className="dfyd__body dfyd__done">
            <span className="dfyd__done-icon" aria-hidden>
              <CheckCircle2 size={30} />
            </span>
            <p className="dfyd__done-title">Your payment is done.</p>
            <p className="dfyd__done-body">
              A receipt will be sent to your email. You can close this now.
            </p>
            {paidSplit?.creditCoversAll && <p className="dfyd__done-body">{CREDIT_COVERED_PURCHASE}</p>}
            <button type="button" className="rm2-btn rm2-btn--green" onClick={onClose}>
              Close
            </button>
          </div>
        ) : step === "confirm" ? (
          <div className="dfyd__body dfyd__confirm">
            <h3 className="dfyd__confirm-h">Check this before you pay</h3>
            {purchaseConfirmation && <GovernmentFeeNotice text={governmentFeeDisclosureFor(offer.slug)} />}
            <dl className="dfyd__check">
              <div className="dfyd__check-row">
                <dt>What you are buying</dt>
                <dd>{option ? `${offer.serviceTitle} — ${option.label}` : offer.serviceTitle}</dd>
              </div>
              {discount > 0 && (
                <div className="dfyd__check-row">
                  <dt>Coupon {couponState.kind === "valid" ? couponState.code : ""}</dt>
                  <dd className="dfyd__check-amount">−{formatUSD(discount)}</dd>
                </div>
              )}
              <div className="dfyd__check-row">
                <dt>What it costs</dt>
                <dd className="dfyd__check-amount">{formatUSD(amount)}</dd>
              </div>
              {breakdown && (
                <div className="dfyd__check-row">
                  <dt>{PROMOTIONAL_DISCOUNT_LABEL}</dt>
                  <dd className="dfyd__check-amount">−{formatUSD(breakdown.promotionalDiscount)}</dd>
                </div>
              )}
              {breakdown && (
                <div className="dfyd__check-row">
                  <dt>{FROM_WALLET_LABEL}</dt>
                  <dd className="dfyd__check-amount">{formatUSD(breakdown.fromWallet)}</dd>
                </div>
              )}
              {walletAfter != null && (
                <div className="dfyd__check-row">
                  <dt>Your wallet after this</dt>
                  <dd className="dfyd__check-amount">{formatUSD(walletAfter)}</dd>
                </div>
              )}
            </dl>
            {purchaseConfirmation && <TaxIncludedLine />}

            <p className="dfyd__confirm-note">
              {breakdown?.creditCoversAll
                ? CREDIT_COVERS_PURCHASE
                : "This comes out of your wallet. Nothing is charged to your card today."}
            </p>
            {purchaseConfirmation && (
              <TermsConsent {...terms.box} disabled={paying || addressGate.asking} />
            )}
            {payError && <p className="dfyd__short">{payError}</p>}
            {fixtureMode && <p className="dfyd__short">Test state — payment is off.</p>}
            {/* The address form is its own <form>: it replaces this area,
                never sits inside it. The coupon is chosen on the first screen,
                and the kept purchase holds the coupon of the moment she
                pressed pay. */}
            <AddressStep gate={addressGate} classes={RM3_ADDRESS_FORM_CLASSES}>
              <div className="dfyd__confirm-acts">
                <button
                  type="button"
                  className="rm2-btn rm2-btn--green"
                  disabled={paying || fixtureMode || terms.payDisabled}
                  onClick={pay}
                >
                  {paying ? "Paying…" : `Confirm and pay ${formatUSD(amount)}`}
                </button>
                <button type="button" className="dfyd__back" onClick={() => setStep("offer")}>
                  <ArrowLeft size={14} aria-hidden /> Go back
                </button>
              </div>
            </AddressStep>
          </div>
        ) : step === "topup" ? (
          /* Her wallet is short. There is no in-app card charge — money is
             added in the GHL wallet, so this screen says exactly how much is
             missing, hands her the door, and refreshes the balance when she
             comes back. */
          <div className="dfyd__body dfyd__addmoney">
            <h3 className="dfyd__confirm-h">Add money to your wallet</h3>
            {/* An unread balance is not an empty one. `balance ?? 0` told a
                member with money in her wallet that she had none and asked
                her to top up — the wallet read returns null when GHL cannot
                be reached, and null formatted as $0.00. Say which it is. */}
            {balance != null ? (
              <p className="dfyd__addmoney-why">
                This costs {formatUSD(amount)}. {WALLET_AND_CREDIT_TOTAL} {formatUSD(balance)}, so
                you need {formatUSD(shortfall)} more.
              </p>
            ) : (
              <p className="dfyd__addmoney-why">
                This costs {formatUSD(amount)}. We could not read your wallet balance just
                now — open it below to check, or try again in a moment.
              </p>
            )}

            {walletVideoUrl && (
              <p className="dfyd__confirm-note">
                <a href={walletVideoUrl} target="_blank" rel="noreferrer" className="dfyd__topup">
                  Watch how to add money
                </a>
              </p>
            )}

            {/* The arithmetic she should not have to do in her head: what
                this costs, what she holds, what she still needs. The number
                it produces is what the button below carries to GHL. */}
            <>
                <div className="add-funds-presets">
                  <button
                    type="button"
                    className={`add-funds-preset${!addCustom ? " is-selected" : ""}`}
                    onClick={() => { setAddCustom(false); setAddAmount(suggestedTopUp); }}
                  >
                    {formatUSD(suggestedTopUp)}
                    <span className="dfyd__preset-note">enough for this</span>
                  </button>
                  <button
                    type="button"
                    className={`add-funds-preset${addCustom ? " is-selected" : ""}`}
                    onClick={() => { setAddCustom(true); setAddAmount(suggestedTopUp); }}
                  >
                    A different amount
                  </button>
                </div>

                {addCustom && (
                  <label className="add-funds-custom">
                    <span className="add-funds-custom__prefix">$</span>
                    <input
                      className="add-funds-custom__input"
                      type="number"
                      min={1}
                      max={10000}
                      value={addAmount || ""}
                      onChange={(e) => setAddAmount(Number(e.target.value))}
                      aria-label="How much to add"
                    />
                  </label>
                )}

                <div className="add-funds-total">
                  <span>{WALLET_AFTER_TOP_UP_LABEL}</span>
                  <div className="add-funds-total__amount">
                    {walletAfterTopUp != null ? formatUSD(walletAfterTopUp) : "—"}
                  </div>
                </div>
            </>

            <div className="dfyd__confirm-acts">
              {/* ONE action, not two. This used to be an "Add $X" button that
                  always failed, sitting beside the link that actually worked.
                  target="_top" is load-bearing: the portal renders inside
                  GHL's iframe, so the billing page has to replace the top
                  frame or it loads nested inside a drawer she cannot use. */}
              <a
                className="rm2-btn rm2-btn--green"
                href={`https://app.govpreneurs.com/v2/location/${locationId}/settings/company-billing/billing?tab=wallet_transactions`}
                target="_top"
              >
                <WalletIcon size={15} aria-hidden /> Add {formatUSD(topUpAmount)} in your wallet
              </a>
              <button
                type="button"
                className="rm2-btn rm2-btn--blue-outline"
                onClick={refreshBalance}
                disabled={refreshing}
              >
                {refreshing ? "Checking…" : "I added money — check again"}
              </button>
              <button type="button" className="dfyd__back" onClick={() => setStep("offer")}>
                <ArrowLeft size={14} aria-hidden /> Go back
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="dfyd__body">
              {/* Only a REAL video earns the slot — an empty "coming soon"
                  placeholder was removed 2026-08-21. */}
              {videoUrl &&
                (isDirectVideo(videoUrl) ? (
                  <video className="dfyd__video" controls preload="metadata">
                    <source src={videoUrl} />
                  </video>
                ) : videoEmbed ? (
                  <iframe
                    className="dfyd__video"
                    src={videoEmbed}
                    title="About this service"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ aspectRatio: "16 / 9", width: "100%", border: 0 }}
                  />
                ) : null)}

              <div className="dfyd__svc">{copy?.name ?? offer.serviceTitle}</div>
              {benefit ? <p className="dfyd__benefit">{benefit}</p> : null}

              {deliveredBy && (
                <section className="dfyd__block">
                  <h3 className="dfyd__block-title">
                    <UserRound size={16} aria-hidden />
                    Who does it
                  </h3>
                  <p className="dfyd__block-value">{deliveredBy}</p>
                </section>
              )}

              <section className="dfyd__block">
                <h3 className="dfyd__block-title">
                  <ClipboardList size={16} aria-hidden />
                  What our team does
                </h3>
                <ul className="dfyd__list">
                  {scope.map((item) => {
                    // Admin-written description first; the static explainer
                    // catalog still covers the untouched lines.
                    const note = item.description ?? scopeNote(item.title);
                    return (
                      <li key={item.title}>
                        <CheckCircle2 size={15} aria-hidden />
                        <span className="dfyd__item">
                          <span className="dfyd__item-name">{item.title}</span>
                          {note && <span className="dfyd__item-note">{note}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {(drawer?.turnaround ?? duration ?? offer.turnaround ?? copy?.turnaround) && (
                <section className="dfyd__block">
                  <h3 className="dfyd__block-title">
                    <Clock size={16} aria-hidden />
                    How long it takes
                  </h3>
                  <p className="dfyd__block-value">{drawer?.turnaround ?? duration ?? offer.turnaround ?? copy?.turnaround}</p>
                </section>
              )}

              {/* THE COUPON, UNDER "HOW LONG IT TAKES" (owner, 30 Sep 2026) — on
                  this first screen, before she presses Purchase, so the price
                  and the wallet check below already count it. The confirm
                  screen still shows the coupon line in its summary. */}
              <section className="dfyd__block">
                <label className="dfyd__block-title" htmlFor="rm3-coupon">
                  Have a coupon?
                </label>
                <div className="dfyd__coupon">
                  <input
                    id="rm3-coupon"
                    className="dfyd__coupon-input"
                    type="text"
                    value={coupon}
                    onChange={(e) => {
                      setCoupon(e.target.value);
                      if (couponState.kind !== "idle") setCouponState({ kind: "idle" });
                    }}
                    placeholder="Code"
                    disabled={addressGate.asking}
                  />
                  <button
                    type="button"
                    className="rm2-btn rm2-btn--blue-outline dfyd__coupon-apply"
                    onClick={applyCoupon}
                    disabled={couponState.kind === "checking" || !coupon.trim() || addressGate.asking}
                  >
                    {couponState.kind === "checking" ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponState.kind === "invalid" && <p className="dfyd__short">{couponState.reason}</p>}
                {couponState.kind === "valid" && (
                  <p className="dfyd__confirm-note">
                    Coupon {couponState.code} applied — you save {formatUSD(couponState.discount)}.
                  </p>
                )}
              </section>

              {yourPart && (
                <section className="dfyd__block">
                  <h3 className="dfyd__block-title">
                    <CheckCircle2 size={16} aria-hidden />
                    What you do
                  </h3>
                  <p className="dfyd__block-value">{yourPart}</p>
                </section>
              )}
            </div>

            <footer className="dfyd__foot">
              {options && (
                <fieldset className="dfyd__tiers">
                  <legend className="dfyd__tiers-legend">Choose a package</legend>
                  {options.map((o) => (
                    <label key={o.id} className={`dfyd__tier${o.id === option?.id ? " is-picked" : ""}`}>
                      <input
                        type="radio"
                        name="dfy-tier"
                        value={o.id}
                        checked={o.id === option?.id}
                        onChange={() => {
                          setOptionId(o.id);
                          /* The discount was worked out on the old package's
                             price; she applies the code again. */
                          if (couponState.kind !== "idle") setCouponState({ kind: "idle" });
                        }}
                      />
                      <span className="dfyd__tier-name">{o.label}</span>
                      <span className="dfyd__tier-price">{formatUSD(parseMoney(o.price))}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <div className="dfyd__price-row">
                <span>Price</span>
                <strong className="dfyd__price">
                  {discount > 0 ? (
                    <>
                      <s style={{ opacity: 0.55, fontWeight: 400, marginRight: 6 }}>{formatUSD(listAmount)}</s>
                      {formatUSD(amount)}
                    </>
                  ) : formatUSD(listAmount)}
                </strong>
              </div>
              <div className="dfyd__wallet">
                {WALLET_BALANCE_LABEL}: <strong>{amounts != null ? formatUSD(amounts.paidBalance) : "—"}</strong>
              </div>
              <PromotionalCreditLine amounts={amounts} format={formatUSD} className="dfyd__wallet" />
              {!enough && balance != null && (
                <p className="dfyd__short">You need {formatUSD(shortfall)} more to buy this.</p>
              )}
              {fixtureMode && <p className="dfyd__short">Test state — buying is off.</p>}
              <button
                type="button"
                className="rm2-btn rm2-btn--green"
                disabled={fixtureMode}
                onClick={() => setStep(enough ? "confirm" : "topup")}
              >
                {enough ? (
                  "Purchase"
                ) : (
                  <>
                    <WalletIcon size={15} aria-hidden /> Add money to your wallet
                  </>
                )}
              </button>
            </footer>
          </>
        )}
      </div>
    </>
  );
}
