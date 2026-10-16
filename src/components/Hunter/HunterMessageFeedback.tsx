import { useState } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { usePostHog } from "posthog-js/react";
import { useGhlUser } from "../../lib/ghlUser";
import { postHunterFeedback } from "../../lib/hunterChat";

type FeedbackType = "up" | "down" | "flag";

const COMMENT_LIMIT = 300;

/** Frames a handed-off note as a correction, so Hunter reads it as one. */
const HAND_OFF_PREFIX: Record<Exclude<FeedbackType, "up">, string> = {
  down: "Correction — ",
  flag: "That looks inaccurate — ",
};

/**
 * Per-message feedback for Hunter chat replies. Mirrors v1's grants-chat
 * `ResponseFeedback` (copy + thumbs-up / thumbs-down / flag), but built to the
 * frontend-v2 idiom used by `EvidenceBlock`: plain CSS-class buttons,
 * `usePostHog` + `useGhlUser`, and an inline (not modal) comment box so it fits
 * the narrow chat rail. Every rating goes to PostHog; a rating on a persisted
 * turn also goes to the backend, and a rating on a message that was never a
 * turn goes to the composer via {@link onHandOff}.
 */
export function HunterMessageFeedback({
  content,
  messageId,
  sessionId,
  turnId,
  onHandOff,
}: {
  content: string;
  messageId: string;
  sessionId?: string;
  /** Id of the persisted chat-log document for this turn. When absent (e.g.
   *  server-side logging failed), feedback is still captured to PostHog but
   *  not sent to the backend. */
  turnId?: string | null;
  /** Where a note goes when this message has no `turnId`. `POST
   *  /hunter-chat/feedback` writes onto a turn, so a message that was never one
   *  — the seed — cannot post. The caller pre-fills the composer with the note
   *  instead, and sending it makes the objection a real turn. */
  onHandOff?: (draft: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [pending, setPending] = useState<Exclude<FeedbackType, "up"> | null>(null);
  const [comment, setComment] = useState("");
  const [handedOff, setHandedOff] = useState(false);
  const posthog = usePostHog();
  const { session } = useGhlUser();

  // No turn to write onto, but a composer to write into: the note becomes the
  // member's next message instead of a request the backend would reject.
  const handsOff = !turnId && Boolean(onHandOff);

  const baseProps = {
    message_id: messageId,
    session_id: sessionId,
    user_id: session?.userId,
    email: session?.email,
    source: "hunter_chat",
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  };

  // Thumbs-up rates immediately; down/flag rate immediately too, then open an
  // optional comment box (deferred final state until submit/skip).
  const rate = (type: FeedbackType) => {
    if (feedback || pending) return;
    posthog?.capture("hunter_chat_response_rated", {
      ...baseProps,
      rating: type === "up" ? "helpful" : type === "flag" ? "flagged" : "not_helpful",
    });
    if (turnId) {
      void postHunterFeedback(turnId, type);
    }
    if (type === "up") {
      setFeedback("up");
    } else {
      setPending(type);
    }
  };

  const submitComment = () => {
    if (!pending) return;
    const text = comment.trim();
    if (text) {
      posthog?.capture("hunter_chat_response_feedback_comment", {
        ...baseProps,
        feedback_type: pending,
        comment_text: text,
      });
      if (turnId) {
        void postHunterFeedback(turnId, pending, text);
      } else if (onHandOff) {
        onHandOff(`${HAND_OFF_PREFIX[pending]}${text}`);
        setHandedOff(true);
      }
    }
    setFeedback(pending);
    setPending(null);
    setComment("");
  };

  const skipComment = () => {
    setFeedback(pending);
    setPending(null);
    setComment("");
  };

  if (pending) {
    const isFlag = pending === "flag";
    return (
      <div className="hunter-fb-comment">
        <div className="hunter-fb-comment__head">
          {isFlag ? <Flag size={13} aria-hidden /> : <ThumbsDown size={13} aria-hidden />}
          <span className="hunter-fb-comment__title">
            {isFlag ? "What felt inaccurate?" : "What could be better?"}
          </span>
          {/* Not optional on the hand-off path: with no turn to attach it to,
              an empty note would reach nothing. */}
          {!handsOff && <span className="hunter-fb-comment__optional">(optional)</span>}
        </div>
        {/* Says where the note lands. Hunter did not log this message, so there
            is no turn to attach it to — the composer is the honest destination,
            and the member is told so before they write. */}
        {handsOff && (
          <p className="hunter-fb-comment__handoff">
            Your note goes to the message box. Send it from there and Hunter answers it.
          </p>
        )}
        <textarea
          className="hunter-fb-comment__input"
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, COMMENT_LIMIT))}
          placeholder={
            isFlag
              ? "What was inaccurate, misleading, or missing?"
              : "Tell us what you expected instead."
          }
          maxLength={COMMENT_LIMIT}
          aria-label="Feedback comment"
        />
        <div className="hunter-fb-comment__actions">
          <span className="hunter-fb-comment__count">
            {comment.length}/{COMMENT_LIMIT}
          </span>
          <div className="hunter-fb-comment__buttons">
            <button type="button" className="btn btn-ghost btn-sm" onClick={skipComment}>
              Skip
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={submitComment}
              disabled={handsOff && !comment.trim()}
            >
              {handsOff ? "Send to Hunter" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hunter-fb">
      <button
        type="button"
        className="hunter-fb-btn"
        onClick={() => void handleCopy()}
        aria-label="Copy response"
      >
        {copied ? <Check size={13} className="hunter-fb-btn__ok" /> : <Copy size={13} />}
      </button>
      <button
        type="button"
        className={`hunter-fb-btn${feedback === "up" ? " is-up" : ""}`}
        onClick={() => rate("up")}
        disabled={feedback !== null}
        aria-label="Helpful"
      >
        <ThumbsUp size={13} />
      </button>
      <button
        type="button"
        className={`hunter-fb-btn${feedback === "down" ? " is-down" : ""}`}
        onClick={() => rate("down")}
        disabled={feedback !== null}
        aria-label="Not helpful"
      >
        <ThumbsDown size={13} />
      </button>
      <button
        type="button"
        className={`hunter-fb-btn${feedback === "flag" ? " is-down" : ""}`}
        onClick={() => rate("flag")}
        disabled={feedback !== null}
        aria-label="Flag as inaccurate"
      >
        <Flag size={13} />
      </button>
      {feedback && (
        <span className="hunter-fb-thanks">
          {handedOff ? "Added to the message box" : "Feedback received"}
        </span>
      )}
    </div>
  );
}
