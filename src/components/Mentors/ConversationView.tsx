import { Link } from "@tanstack/react-router";
import { Paperclip } from "lucide-react";
import { useEffect, useRef } from "react";
import { relayWhenEmbedded } from "../../lib/ghlNav";
import { reviewedItemLink } from "../../lib/mentorReviewLink";
import {
  markMentorReviewViewed,
  mentorBadge,
  patchMentorReviewInCache,
  replyToMentorReview,
  type MentorReviewThread,
  type MentorThreadMessage,
} from "../../lib/mentorReviewsApi";
import { ReplyComposer } from "./ReplyComposer";
import { relTime } from "./format";
// DEMO: shows the numbers of a numbered list in a mentor's message.
import "../../demo/explore/explore.css";

function Initials({ name }: { name: string }) {
  const parts = name.split(/\s+/).filter(Boolean);
  const ini = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <span className="mentors-avatar" aria-hidden>
      {ini.toUpperCase()}
    </span>
  );
}

/** Copy shown in place of the message list when `messages` is empty. */
const EMPTY_REASON_COPY: Record<string, string> = {
  no_conversation: "This review doesn't have a conversation yet.",
  load_failed: "We couldn't load this conversation right now. Refresh to try again.",
  unavailable: "This conversation isn't available.",
};

function emptyReasonMessage(reason: string | null | undefined): string {
  return (reason && EMPTY_REASON_COPY[reason]) || EMPTY_REASON_COPY.unavailable;
}

export function ConversationView({
  review,
  onChange,
}: {
  review: MentorReviewThread;
  /** Called after a successful reply so the caller can refetch/patch the thread. */
  onChange: (message: MentorThreadMessage) => void;
}) {
  // Mark viewed once per thread load (id + message count) — avoids refiring
  // on every parent re-render while still catching newly-arrived messages.
  const viewedKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${review.id}:${review.messages.length}`;
    if (viewedKey.current === key) return;
    viewedKey.current = key;
    markMentorReviewViewed(review.id)
      .then(() => patchMentorReviewInCache(review.id, { unread: false }))
      .catch((err) => console.error("Failed to mark mentor review viewed", err));
  }, [review.id, review.messages.length]);

  const mentorName = review.mentorName || "Your mentor";
  const badge = mentorBadge(review);
  const itemLink = reviewedItemLink(review);
  // The opportunity, small-order and forecast pages live on their own
  // custom-menu-links, DIFFERENT GHL iframes. When embedded, intercept and relay
  // through the parent so it switches the TOP frame instead of nesting that app
  // inside the Mentors iframe. Standalone (local dev) falls through to the
  // <Link>'s in-app nav.
  const openItemPage = itemLink ? relayWhenEmbedded(itemLink.page, itemLink.route) : undefined;

  async function handleSend(html: string, attachments: File[]) {
    // The composer now passes editor HTML directly — send it through unchanged.
    const message = await replyToMentorReview(review.id, html, attachments);
    onChange(message);
  }

  return (
    <section className="mentors-conv">
      <header className="mentors-conv__header">
        <div className="mentors-conv__title-wrap">
          {itemLink?.page === "small-orders" ? (
            <Link
              to="/small-orders/$orderId"
              params={{ orderId: itemLink.id }}
              className="mentors-conv__title"
              onClick={openItemPage}
            >
              {review.title}
            </Link>
          ) : itemLink?.page === "forecasts" ? (
            <Link
              to="/forecasts/$forecastId"
              params={{ forecastId: itemLink.id }}
              className="mentors-conv__title"
              onClick={openItemPage}
            >
              {review.title}
            </Link>
          ) : itemLink ? (
            <Link
              to="/opportunities/$noticeId"
              params={{ noticeId: itemLink.id }}
              className="mentors-conv__title"
              onClick={openItemPage}
            >
              {review.title}
            </Link>
          ) : (
            <span className="mentors-conv__title">{review.title}</span>
          )}
          <div className="mentors-conv__sub">
            <span className={`mentors-status mentors-status--${badge.modifier}`}>
              {badge.label}
            </span>
          </div>
        </div>
        <div className="mentors-conv__mentor">
          <Initials name={mentorName} />
          <div>
            <div className="mentors-conv__mentor-name">{mentorName}</div>
          </div>
        </div>
      </header>

      <div className="mentors-conv__body">
        {review.messages.length === 0 ? (
          <div className="mentors-conv__notice">{emptyReasonMessage(review.emptyReason)}</div>
        ) : (
          <ol className="mentors-thread">
            {review.messages.map((m) => {
              const mine = m.author === "member";
              return (
                <li key={m.id} className={`mentors-msg mentors-msg--${mine ? "member" : "mentor"}`}>
                  {!mine && <Initials name={m.authorName} />}
                  <div className="mentors-msg__col">
                    <div className="mentors-msg__meta">
                      <span className="mentors-msg__author">{m.authorName}</span>
                      <span className="mentors-msg__time">{relTime(m.at)}</span>
                    </div>
                    <div
                      className="mentors-msg__bubble"
                      dangerouslySetInnerHTML={{ __html: m.bodyHtml }}
                    />
                    {m.attachments.length > 0 && (
                      <div className="mentors-msg__attachments">
                        {m.attachments.map((a, i) =>
                          a.url ? (
                            <a
                              key={i}
                              className="mentors-msg__file"
                              href={a.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Paperclip size={13} />
                              {a.name}
                            </a>
                          ) : (
                            <span key={i} className="mentors-msg__file">
                              <Paperclip size={13} />
                              {a.name}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {review.status !== "closed" && (
        <div className="mentors-conv__composer">
          <ReplyComposer mentorName={review.mentorName} onSend={handleSend} />
        </div>
      )}
      {review.status === "closed" && (
        <div className="mentors-conv__closed">
          This conversation is marked closed. Start a new mentor review from the opportunity if you
          want a fresh read.
        </div>
      )}
    </section>
  );
}
