import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarCheck,
  Check,
  Crown,
  Gift,
  Loader2,
  Shield,
  Star,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { useGhlUser } from "../../lib/ghlUser";
import { getCredit, getUserSubscription, upgradePlan, type CreditDetails } from "../../lib/billing";
import {
  ELITE_PLAN_PRODUCT_ID,
  UPGRADE_PLAN_LINK,
  plansForProduct,
  type Plan,
} from "../../lib/plans";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Pilot → Expert → Elite upgrade journey, ported from the v1 frontend:
 * choose a plan → hit the checkout iframe → poll the subscription until the
 * upgrade lands, then refresh the session.
 */
export function UpgradePlanModal({ open, onOpenChange }: UpgradePlanModalProps) {
  const { session, refetch } = useGhlUser();
  const userId = session?.userId ?? "";
  const activeLocation = session?.activeLocation ?? session?.locationId ?? "";
  const productId = session?.productId ?? null;

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set once checkout is dismissed — drives the "waiting for payment" poll.
  const [pollingSince, setPollingSince] = useState<number | null>(null);

  const plans = useMemo(() => plansForProduct(productId), [productId]);
  // Current plan drives the trade-in credit label ("{Pilot} Trade-in credit"),
  // mirroring v1. Falls back to a generic label when the current plan isn't in
  // the shown ladder (e.g. Elite already).
  const currentPlanName = plans.find((p) => p.productId === productId)?.name ?? "";

  const { data: credits } = useQuery({
    queryKey: ["upgrade-credit", userId, activeLocation],
    queryFn: () => getCredit(userId, activeLocation),
    enabled: open && !!userId && !!activeLocation,
    staleTime: 60_000,
  });

  const upgradeMutation = useMutation({
    mutationFn: (nextProductId: string) =>
      upgradePlan({ userId, productId: nextProductId, altId: activeLocation }),
    onSuccess: (data) => setCheckoutUrl(data.link || UPGRADE_PLAN_LINK),
    onError: (err: Error) =>
      setError(err.message || "Couldn't start the upgrade. Please try again."),
  });

  // Poll the subscription while we wait for payment confirmation. When the
  // product id changes, the upgrade landed → refresh the session and close.
  useQuery({
    queryKey: ["subscription-poll", userId],
    queryFn: async () => {
      const sub = await getUserSubscription(userId);
      if (sub.productId && sub.productId !== productId) {
        setPollingSince(null);
        refetch();
        onOpenChange(false);
      } else if (pollingSince && Date.now() - pollingSince > 120_000) {
        // Give up after 2 minutes rather than polling forever.
        setPollingSince(null);
        setError("We couldn't confirm the payment. Please refresh and try again.");
      }
      return sub;
    },
    enabled: open && !!userId && pollingSince !== null,
    refetchInterval: pollingSince !== null ? 10_000 : false,
  });

  // Reset transient state whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setError(null);
    } else {
      setCheckoutUrl(null);
      setPollingSince(null);
    }
  }, [open]);

  const handleClose = (next: boolean) => {
    // Dismissing the checkout iframe doesn't close the modal — it switches to
    // the confirmation poll ("Confirming your upgrade…"), mirroring v1's
    // separate PaymentProcessDialog. The poll/waiting view are gated on `open`,
    // so we must keep the modal open here (return early) rather than propagate
    // the close. A second dismiss (checkoutUrl now cleared) closes normally.
    if (!next && checkoutUrl) {
      setCheckoutUrl(null);
      setPollingSince(Date.now());
      return;
    }
    onOpenChange(next);
  };

  const waitingForPayment = pollingSince !== null;

  return (
    <Modal.Root open={open} onOpenChange={handleClose}>
      <Modal.Content
        className={`upgrade-modal ${checkoutUrl || plans.length === 3 ? "upgrade-modal--wide" : ""}`}
        aria-describedby={undefined}
      >
        <Modal.Header
          title={waitingForPayment ? "Confirming your upgrade…" : "Choose your plan"}
          description={
            waitingForPayment
              ? undefined
              : "Get the tools and mentorship to win government contracts."
          }
        />

        <Modal.Body>
          {error && (
            <div className="upgrade-modal__error" role="alert">
              {error}
            </div>
          )}

          {waitingForPayment ? (
            <div className="upgrade-wait">
              <div className="upgrade-wait__spinner" aria-hidden>
                <Loader2 size={30} className="upgrade-wait__spin" />
              </div>
              <h3 className="upgrade-wait__title">Processing your payment…</h3>
              <p className="upgrade-wait__msg">
                We're waiting on confirmation from our payment provider. This usually takes 1–2
                minutes.
              </p>
              <p className="upgrade-wait__note">
                <Shield size={12} /> Please keep this window open.
              </p>
            </div>
          ) : checkoutUrl ? (
            <iframe
              src={checkoutUrl}
              title="Upgrade checkout"
              className="upgrade-checkout"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              allow="payment"
            />
          ) : (
            <div className={`upgrade-grid upgrade-grid--${plans.length}`}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.productId}
                  plan={plan}
                  isCurrent={plan.productId === productId}
                  credit={plan.productId !== productId ? credits : undefined}
                  currentPlanName={currentPlanName}
                  pending={upgradeMutation.isPending}
                  onUpgrade={() => {
                    setError(null);
                    upgradeMutation.mutate(plan.productId);
                  }}
                />
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

function PlanCard({
  plan,
  isCurrent,
  credit,
  currentPlanName,
  pending,
  onUpgrade,
}: {
  plan: Plan;
  isCurrent: boolean;
  credit: CreditDetails | null | undefined;
  currentPlanName: string;
  pending: boolean;
  onUpgrade: () => void;
}) {
  const isElite = plan.productId === ELITE_PLAN_PRODUCT_ID;
  const creditAmount = credit ? Number(credit.creditAmount) : 0;
  const dueToday = Math.max(0, Number(plan.price.replace(/,/g, "")) - creditAmount);

  return (
    <div className={`plan-card ${isElite ? "plan-card--featured" : ""}`}>
      {isElite && (
        <span className="plan-card__badge">
          <Star size={11} /> Best value
        </span>
      )}
      <div className="plan-card__name">{plan.name}</div>

      {credit && creditAmount > 0 ? (
        <>
          <div className="plan-card__credit">
            <div className="plan-card__credit-row">
              <span>{plan.name}</span>
              <span className="plan-card__strike">${plan.price}</span>
            </div>
            <div className="plan-card__credit-row plan-card__credit-row--save">
              <span>
                <Gift size={12} /> {currentPlanName ? `${currentPlanName} ` : ""}Trade-in credit
              </span>
              <span>-${creditAmount.toLocaleString()}</span>
            </div>
            <div className="plan-card__credit-total">
              <span>Due today</span>
              <strong>${dueToday.toLocaleString()}</strong>
            </div>
          </div>

          <span className="plan-card__save-pill">
            <Gift size={12} /> You save ${creditAmount.toLocaleString()}
          </span>
          <div className="plan-card__starts">
            <CalendarCheck size={13} /> Your new {plan.duration} starts today
          </div>
        </>
      ) : (
        <div className="plan-card__price">
          <span className="plan-card__amount">${plan.price}</span>
          <span className="plan-card__period">{plan.period}</span>
        </div>
      )}

      <div className="plan-card__consult">{plan.consultations}</div>

      <div className="plan-card__includes">{plan.includesLabel}</div>
      <ul className="plan-card__features">
        {plan.features.map((f) => (
          <li key={f}>
            <Check size={14} /> {f}
          </li>
        ))}
      </ul>

      <div className="plan-card__who">
        <div className="plan-card__who-title">
          <Crown size={13} /> Who's this for?
        </div>
        <p>{plan.whosThisFor}</p>
      </div>

      {isCurrent ? (
        <button type="button" className="btn btn-secondary plan-card__cta" disabled>
          Current plan
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary plan-card__cta"
          onClick={onUpgrade}
          disabled={pending}
        >
          {pending ? "Starting…" : "Upgrade now"}
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
