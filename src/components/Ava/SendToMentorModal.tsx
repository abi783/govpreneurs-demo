// Send something from Ava to the mentor, Sarah Mitchell: her whole bid, the bid
// so far, or a rule she cannot meet.
//
// DEMO: the prototype reused the opportunity page's dialog. The demo's version
// of that dialog is a different, longer form, built for an opportunity. This
// one is small and says only what Ava needs: what is sent, what it costs, what
// the wallet holds and when Sarah replies. The review itself is sent through
// the shared mentor state, so the $97 charge and the Mentor Reviews page agree
// (src/demo/ava/mentorReviews.ts).

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Send } from "lucide-react";
import { Modal } from "../ui/Modal";
import { formatUSD } from "../../lib/wallet";
import type { AvaOpportunity } from "../../demo/ava/opportunity";
import type { GrantSummary } from "../../demo/ava/grantSummary";
import { MENTOR, MENTOR_REPLY, sendCheck } from "../../demo/ava/mentorReviews";

/** How long "Done" ignores a press after Send, in milliseconds. */
const SETTLE_MS = 700;

export function SendToMentorModal({
  opp,
  summary,
  open,
  onOpenChange,
  onConfirm,
  sending,
  service,
}: {
  opp: AvaOpportunity;
  summary: GrantSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
  /** What she sends, when it is not the opportunity: her whole bid. */
  sending?: { title: string; lines: string[] };
  /** What the mentor does, in the same words as the card she opened this from. */
  service?: string;
}) {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  // When she pressed Send. "Done" takes the place of "Send" under her finger, so a
  // double press must not close the dialog before she reads that it was sent.
  const sentAt = useRef(0);
  useEffect(() => {
    if (!open) {
      setNote("");
      setSent(false);
      sentAt.current = 0;
    }
  }, [open]);
  const money = sendCheck();
  const first = MENTOR.name.split(" ")[0];

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content
        size="sm"
        className="ava-modal"
        aria-describedby={undefined}
        // The receipt is shorter than the form, so the dialog shrinks under a
        // double press and the second press lands on the page behind it. That
        // press must not close the dialog before she reads the receipt.
        onInteractOutside={(e) => {
          if (sentAt.current && Date.now() - sentAt.current < SETTLE_MS) e.preventDefault();
        }}
      >
        <Modal.Header title={`Send to ${MENTOR.name}`} />
        <Modal.Body>
          {sent ? (
            <div className="ava-mentormodal__done" role="status">
              <p className="ava-dialog__p">
                <strong>Sent to {MENTOR.name}.</strong> She replies in Mentor Reviews,{" "}
                {MENTOR_REPLY}. You can keep working while you wait.
              </p>
              <p className="ava-dialog__p">{formatUSD(money.cost)} was charged to your wallet.</p>
            </div>
          ) : (
            <>
              <div className="ava-mentormodal__sending">
                <span className="ava-field__label">What you send</span>
                <strong>{sending?.title ?? opp.title}</strong>
                {sending ? (
                  sending.lines.map((l) => <span key={l}>{l}</span>)
                ) : (
                  <span>
                    Grant says: {summary.call}. {summary.rationale}
                  </span>
                )}
              </div>
              <label className="ava-field">
                <span className="ava-field__label">A note for {first} (optional)</span>
                <textarea
                  className="ava-textarea"
                  rows={3}
                  placeholder="What do you want a second opinion on?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <p className="ava-dialog__p">
                <strong>{formatUSD(money.cost)}</strong>, charged to your wallet.{" "}
                {service ?? `${first} replies in Mentor Reviews, ${MENTOR_REPLY}.`}
              </p>
              {!money.enough ? (
                <p className="ava-dialog__p ava-mentormodal__short" role="note">
                  Your wallet has {formatUSD(money.balance)}, and a review costs{" "}
                  {formatUSD(money.cost)}.{" "}
                  <Link to="/wallet" className="ava-linkbtn">
                    Add funds <ArrowRight size={12} aria-hidden />
                  </Link>
                </p>
              ) : (
                <p className="ava-dialog__p ava-muted">
                  Your wallet has {formatUSD(money.balance)}.
                </p>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {sent ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (Date.now() - sentAt.current > SETTLE_MS) onOpenChange(false);
              }}
            >
              Done
            </button>
          ) : (
            <>
              <Modal.Close asChild>
                <button type="button" className="btn btn-ghost">
                  Not now
                </button>
              </Modal.Close>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!money.enough}
                onClick={() => {
                  // One press sends one review, even if the press repeats.
                  if (sentAt.current) return;
                  sentAt.current = Date.now();
                  onConfirm(note.trim());
                  setSent(true);
                }}
              >
                <Send size={14} aria-hidden /> Send for {formatUSD(money.cost)}
              </button>
            </>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
