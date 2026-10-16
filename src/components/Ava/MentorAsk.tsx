// The Mentor, at Ava's three checkpoints (Ava-Simplified, "Where the rest goes"):
//   1. before Ava, on the decision to bid (the Bid Brief shows the Mentor's input);
//   2. on any item Ava cannot verify (page 2 rows, the writing and the price);
//   3. on the finished package (page 3).
//
// ONE conversation per bid, in Mentors. The first request opens it through the
// same Send-to-a-Mentor review Grant's page uses, at the same price. Every later
// request is a message in that conversation, so a member never pays twice for
// one bid. Nothing is sent until the member reads the message and says so, and
// Ava never waits for the Mentor: the build keeps going.

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, UsersRound } from "lucide-react";
import { SendToMentorModal } from "./SendToMentorModal";
import { Modal } from "../ui/Modal";
import { fullDate } from "../../lib/ava/dates";
import { ava } from "../../lib/ava/store";
import { useLiveSlice } from "../../lib/eventBus";
import { getGrantSummary } from "../../demo/ava/grantSummary";
import { findOpportunity } from "../../demo/ava/opportunity";
import { appendMessage, createReview, getReviewByOpportunity } from "../../demo/ava/mentorReviews";
import type { AvaContext } from "./useAva";

export function MentorAsk({
  ctx,
  itemKey,
  message,
  label = "Review with your Mentor",
  quiet = false,
}: {
  ctx: AvaContext;
  /** What the request is about: "checkpoint-3", "ask:ask-bid-bond". */
  itemKey: string;
  /** The message Ava drafts. The member can change it before it goes. */
  message: string;
  label?: string;
  /** A ghost button, for rows where another action is primary. */
  quiet?: boolean;
}) {
  const { id, s } = ctx;
  const [draft, setDraft] = useState<string | null>(null);
  // The message waiting for the paid review, once the member moves on to its price.
  const [pending, setPending] = useState<string | null>(null);
  const review = useLiveSlice("mentorReviews", () => getReviewByOpportunity(id));
  const sent = s.mentorAsks[itemKey];
  const opp = findOpportunity(id);

  if (sent) {
    return (
      <p className="ava-mentor__sent">
        <Check size={13} strokeWidth={2.25} aria-hidden />
        <span>Sent to your Mentor on {fullDate(new Date(sent.at))}. Ava keeps building.</span>
        <Link to="/mentors/$reviewId" params={{ reviewId: sent.reviewId }} className="ava-linkbtn">
          Open the conversation
        </Link>
      </p>
    );
  }

  // An open conversation takes the request as a new message, at no new cost.
  const live = review && review.status !== "closed" ? review : null;
  const text = (draft ?? message).trim();

  return (
    <>
      <button
        type="button"
        className={`btn btn-sm ${quiet ? "btn-ghost" : "btn-secondary"}`}
        onClick={(e) => {
          e.stopPropagation();
          setDraft(message);
        }}
      >
        <UsersRound size={13} aria-hidden /> {label}
      </button>

      <Modal.Root open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <Modal.Content size="sm" className="ava-modal" aria-describedby={undefined}>
          <Modal.Header title="Ask your Mentor" />
          <Modal.Body>
            <label className="ava-field">
              <span className="ava-field__label">Your Mentor reads this</span>
              <textarea
                className="ava-textarea"
                value={draft ?? ""}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
            <p className="ava-dialog__p">
              {live
                ? "It goes in your Mentor conversation for this bid. It costs nothing more."
                : "Your first question on this bid starts a Mentor review, as on Grant's page. The next step shows its price. Later questions on this bid cost nothing more."}
            </p>
            <p className="ava-dialog__p">Ava keeps building while you wait for the answer.</p>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close asChild>
              <button type="button" className="btn btn-ghost">
                Not now
              </button>
            </Modal.Close>
            {!text ? (
              <span className="ava-dialog__need">Write what you want your Mentor to check.</span>
            ) : live ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  appendMessage(live.id, text);
                  ava.sentToMentor(id, itemKey, live.id);
                  setDraft(null);
                }}
              >
                Send to your Mentor
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setPending(text);
                  setDraft(null);
                }}
              >
                See the price and send
              </button>
            )}
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      {opp && !live ? (
        <SendToMentorModal
          opp={opp}
          summary={getGrantSummary(opp)}
          open={pending !== null}
          onOpenChange={(o) => {
            if (!o) setPending(null);
          }}
          onConfirm={(note) => {
            const asked = pending ?? message;
            const r = createReview({
              opportunityId: id,
              opportunityTitle: opp.title,
              verdict: getGrantSummary(opp).call,
              rationale: getGrantSummary(opp).rationale,
              note: note.trim() ? `${asked}\n\n${note.trim()}` : asked,
            });
            ava.sentToMentor(id, itemKey, r.id);
            setPending(null);
          }}
        />
      ) : null}
    </>
  );
}
