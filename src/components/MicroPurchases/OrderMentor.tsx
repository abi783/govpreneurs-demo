// Send a small order to a mentor — the opportunity page's wiring, copied as is
// (owner's call, 2026-09-15). See `routes/opportunities.$noticeId.tsx`:
//
//   · the plan gate: `allowSendToMentor(session.productId)`, and the upsell
//     modal for a plan without it;
//   · the deadline gate: `isTooCloseToDeadline()`, the same 5-day closing window the
//     backend enforces, read from the order's closing day;
//   · the live wallet: `fetchWalletBalance(locationId)`;
//   · the send: `sendForReview()` to `POST /opportunities/send-for-review`,
//     which charges the wallet and opens the mentor thread, then
//     `refreshMentorReviews()` so Mentors and the unread badges see it.
//
// A small order's id IS its `oppKey` in `opportunities`, so the backend reads
// it the way it reads any opportunity.
import { useEffect, useState, type ReactNode } from "react";
import { Send } from "lucide-react";
import type { MicroOrder } from "../../lib/microPurchases/order";
import { SendOrderToMentorModal } from "./SendOrderToMentorModal";
import { MentorUpsellModal } from "../Opportunity/MentorUpsellModal";
import { sendForReview } from "../../lib/mentorApi";
import {
  attachFileToSentReview,
  MENTOR_ATTACH_FAILED,
  refreshMentorReviews,
} from "../../lib/mentorReviewsApi";
import type { MentorRequest } from "../Mentors/MentorSendModal";
import {
  markOrderMentorSent,
  reportOrderMentorNotice,
  useOrderMentorNotice,
  useOrderMentorSent,
} from "../../lib/microPurchases/mentorSent";
import { fetchWalletBalance } from "../../lib/walletApi";
import {
  allowSendToMentor,
  isTooCloseToDeadline,
  MENTOR_DEADLINE_TOO_CLOSE_MESSAGE,
} from "../../lib/entitlements";
import { useGhlUser } from "../../lib/ghlUser";

const TOAST = {
  className: "mentor-modal__shortfall",
  role: "alert",
  style: {
    position: "fixed",
    bottom: "var(--s-4)",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
  },
} as const;

/**
 * What still needs saying about a SENT order — today, only a file that did
 * not attach. Render it wherever the caller swaps the control for its sent
 * state, because the control unmounts there.
 */
export function OrderMentorNotice({ orderId }: { orderId: string }) {
  const notice = useOrderMentorNotice(orderId);
  return notice ? <div {...TOAST}>{notice}</div> : null;
}

/**
 * The "Send to mentor" control and everything behind it. Renders nothing once
 * the order is sent: each caller shows its own sent state.
 */
export function OrderMentor(props: OrderMentorProps) {
  // Hidden inside the deadline gate: nothing to render, so nothing to load.
  if (props.hideWhenTooLate && isTooCloseToDeadline(props.order.closesOn)) return null;
  return <OrderMentorControl {...props} />;
}

interface OrderMentorProps {
  order: MicroOrder;
  whatSheIsSending: string;
  label: ReactNode;
  className: string;
  /** Hide the control, rather than disable it, inside the deadline gate. */
  hideWhenTooLate?: boolean;
}

function OrderMentorControl({
  order: o,
  whatSheIsSending,
  label,
  className,
  hideWhenTooLate = false,
}: OrderMentorProps) {
  const { session } = useGhlUser();
  const sent = useOrderMentorSent(o.id);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Live wallet balance/charge from the backend; null until fetched.
  const [wallet, setWallet] = useState<{ balance: number; chargeAmount: number } | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Elite-plan gating for the Send-to-Mentor feature.
  const canSendToMentor = allowSendToMentor(session?.productId);
  // Deadline gating: a mentor review can't turn around in time once the order
  // is within 3 days of its closing day (or already past it).
  const sendToMentorTooLate = isTooCloseToDeadline(o.closesOn);

  // Fetch the live wallet balance so the modal shows real numbers. Only for
  // plans that can send (others never open the modal).
  useEffect(() => {
    if (!canSendToMentor || !session?.locationId) return;
    let cancelled = false;
    setWalletLoading(true);
    setWalletError(null);
    fetchWalletBalance(session.locationId)
      .then((w) => {
        if (cancelled) return;
        setWallet(w);
        setWalletLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load wallet balance", err);
        if (cancelled) return;
        setWalletError(err instanceof Error ? err.message : "Failed to load wallet balance");
        setWalletLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canSendToMentor, session?.locationId]);

  const handleMentorConfirm = ({ message: note, file }: MentorRequest) => {
    if (!session?.userId || !session?.locationId) return;
    // Backend keys primarily on opportunityId; the solicitation number is the
    // sol number, with the oppKey as the fallback.
    const solNumbers = [o.solicitation || o.id];
    const opportunityIds = [o.id];
    setIsSending(true);
    setSendError(null);
    sendForReview({
      userId: session.userId,
      locationId: session.locationId,
      solNumbers,
      opportunityIds,
      message: note,
    })
      .then(async () => {
        // The send is paid and the thread exists; a file that fails to
        // attach now is reported on its own, never as a failed send.
        if (file) {
          try {
            await attachFileToSentReview(o.id, file);
          } catch (err) {
            console.error("Failed to attach file to mentor review", err);
            // Said by OrderMentorNotice: the caller unmounts this control
            // once the order counts as sent, a moment from now.
            reportOrderMentorNotice(o.id, MENTOR_ATTACH_FAILED);
          }
        }
        setMentorModalOpen(false);
        markOrderMentorSent(o.id);
        // New thread now exists on the backend — refresh the shared store so
        // /mentors and the unread badges (Sidebar/home) pick it up.
        refreshMentorReviews().catch((err) =>
          console.error("Failed to refresh mentor reviews after send", err),
        );
      })
      .catch((err) => {
        setSendError(err instanceof Error ? err.message : "Failed to send for review");
        console.error("Failed to send order for review", err);
      })
      .finally(() => setIsSending(false));
  };

  const errorToast = sendError && <div {...TOAST}>{sendError}</div>;

  // Sent: the control stands down, but a file that did not attach still
  // needs saying.
  if (sent) return <OrderMentorNotice orderId={o.id} />;

  let control: ReactNode;
  if (canSendToMentor && sendToMentorTooLate) {
    control = hideWhenTooLate ? null : (
      <span title={MENTOR_DEADLINE_TOO_CLOSE_MESSAGE}>
        <button type="button" className={className} disabled>
          <Send size={14} aria-hidden /> {label}
        </button>
      </span>
    );
  } else {
    control = (
      <button
        type="button"
        className={className}
        onClick={() => (canSendToMentor ? setMentorModalOpen(true) : setUpsellOpen(true))}
      >
        <Send size={14} aria-hidden /> {label}
      </button>
    );
  }

  return (
    <>
      {control}
      <SendOrderToMentorModal
        order={o}
        whatSheIsSending={whatSheIsSending}
        open={mentorModalOpen}
        onOpenChange={setMentorModalOpen}
        onConfirm={handleMentorConfirm}
        balance={wallet?.balance ?? 0}
        chargeAmount={wallet?.chargeAmount ?? 0}
        sending={isSending}
        loading={walletLoading}
        error={walletError ? "Couldn't load your wallet balance — try again" : null}
        locationId={session?.locationId}
      />
      {errorToast}
      <MentorUpsellModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        onContinueSelfQualification={() => setUpsellOpen(false)}
      />
    </>
  );
}
