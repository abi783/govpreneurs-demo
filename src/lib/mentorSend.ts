// Sending a record to a mentor — the opportunity page's wiring, shared by the
// surfaces that copied it (small orders, forecasts). See
// `routes/opportunities.$noticeId.tsx`:
//
//   · the plan gate: `allowSendToMentor(session.productId)`;
//   · the live wallet: `fetchWalletBalance(locationId)`, read only for a plan
//     that can send, since no other plan opens the modal;
//   · the send: `sendForReview()` to `POST /opportunities/send-for-review`,
//     which charges the wallet and opens the mentor thread, then
//     `refreshMentorReviews()` so Mentors and the unread badges see it.
//
// The record's id IS its `oppKey` in `opportunities`, so the backend reads it
// the way it reads any opportunity.
import { useEffect, useState } from "react";
import { sendForReview } from "./mentorApi";
import {
  attachFileToSentReview,
  MENTOR_ATTACH_FAILED,
  refreshMentorReviews,
} from "./mentorReviewsApi";
import { fetchWalletBalance } from "./walletApi";
import { allowSendToMentor } from "./entitlements";
import { useGhlUser } from "./ghlUser";

/** What the backend needs to find the record. */
export interface MentorSendTarget {
  /** The record's `oppKey`. */
  oppKey: string;
  /** The solicitation number, or null when the record has none. */
  solNumber: string | null;
  /**
   * Called when a file fails to attach after a paid send, beside `sendError`.
   * For a caller whose control unmounts on "sent" and so can never render
   * `sendError` — the small order's (see `OrderMentorNotice`).
   */
  onAttachFailed?: (message: string) => void;
}

/** The wallet, the plan gate and the send, for one record. */
export interface MentorSend {
  /** False on a plan without mentor reviews: the caller shows the upsell. */
  canSend: boolean;
  /** The GHL sub-account, for the modal's "Add funds" link. */
  locationId: string | undefined;
  /** Live balance and per-review charge, null until read. */
  wallet: { balance: number; chargeAmount: number } | null;
  walletLoading: boolean;
  walletError: string | null;
  sending: boolean;
  sendError: string | null;
  /**
   * Sends the record with her note, and attaches her file when she chose one.
   * Resolves true when the backend took the send. A file that fails to attach
   * after a paid send sets `sendError` to MENTOR_ATTACH_FAILED and still
   * resolves true: the send happened.
   */
  send: (note: string, file?: File | null) => Promise<boolean>;
}

/** Reads the wallet and sends one record for mentor review. */
export function useMentorSend({ oppKey, solNumber, onAttachFailed }: MentorSendTarget): MentorSend {
  const { session } = useGhlUser();
  const canSend = allowSendToMentor(session?.productId);
  const [wallet, setWallet] = useState<{ balance: number; chargeAmount: number } | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!canSend || !session?.locationId) return;
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
  }, [canSend, session?.locationId]);

  const send = async (note: string, file?: File | null): Promise<boolean> => {
    if (!session?.userId || !session?.locationId) return false;
    setSending(true);
    setSendError(null);
    try {
      // Backend keys primarily on opportunityId; the solicitation number is the
      // sol number, with the oppKey as the fallback.
      await sendForReview({
        userId: session.userId,
        locationId: session.locationId,
        solNumbers: [solNumber || oppKey],
        opportunityIds: [oppKey],
        message: note,
      });
      // The send is paid and the thread exists; a file that fails to attach
      // now is reported on its own, never as a failed send.
      if (file) {
        try {
          await attachFileToSentReview(oppKey, file);
        } catch (err) {
          console.error("Failed to attach file to mentor review", err);
          setSendError(MENTOR_ATTACH_FAILED);
          onAttachFailed?.(MENTOR_ATTACH_FAILED);
        }
      }
      // New thread now exists on the backend — refresh the shared store so
      // /mentors and the unread badges (Sidebar/home) pick it up.
      refreshMentorReviews().catch((err) =>
        console.error("Failed to refresh mentor reviews after send", err),
      );
      return true;
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send for review");
      console.error("Failed to send for review", err);
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    canSend,
    locationId: session?.locationId,
    wallet,
    walletLoading,
    walletError,
    sending,
    sendError,
    send,
  };
}
