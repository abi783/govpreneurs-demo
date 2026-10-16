import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import {
  fetchMentorReviewThread,
  getMentorReviewsSnapshot,
  hasMentorReviewsLoaded,
  refreshMentorReviews,
  subscribeMentorReviews,
  type MentorReviewThread,
  type MentorThreadMessage,
} from "../lib/mentorReviewsApi";
import { ThreadList } from "../components/Mentors/ThreadList";
import { ConversationView } from "../components/Mentors/ConversationView";
import { MentorEmptyState } from "../components/Mentors/MentorEmptyState";

const POLL_INTERVAL_MS = 60_000;
const RECONCILE_DELAY_MS = 2_000;

/** Plain-text preview of a sent message body, capped like server previews. */
function plainTextPreview(html: string, n = 140): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > n ? text.slice(0, n - 1) + "…" : text;
}

export const Route = createFileRoute("/mentors/$reviewId")({
  head: () => ({
    meta: [
      { title: "Mentor review — GovPreneurs" },
      { name: "description", content: "Your conversation with a GovCon mentor." },
    ],
  }),
  component: MentorReviewPage,
});

function MentorReviewPage() {
  const { reviewId } = Route.useParams();
  usePageMeta({ layout: "wide" });

  // List (shared store, for the left rail + empty-state gating).
  const [reviews, setReviews] = useState(getMentorReviewsSnapshot);
  const [listLoaded, setListLoaded] = useState(hasMentorReviewsLoaded);

  useEffect(() => {
    const sync = () => {
      setReviews(getMentorReviewsSnapshot());
      setListLoaded(hasMentorReviewsLoaded());
    };
    sync();
    const unsubscribe = subscribeMentorReviews(sync);
    refreshMentorReviews()
      .then(sync)
      .catch((err) => console.error("Failed to load mentor reviews", err));
    return unsubscribe;
  }, []);

  // Thread detail (per-id fetch, 60s poll while tab is visible + focus refetch).
  const [thread, setThread] = useState<MentorReviewThread | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadThread = useCallback((id: string) => {
    fetchMentorReviewThread(id)
      .then((t) => {
        setThread(t);
        setNotFound(false);
      })
      .catch((err) => {
        console.error("Failed to load mentor review thread", err);
        setNotFound(true);
      });
  }, []);

  useEffect(() => {
    setThread(null);
    setNotFound(false);
    loadThread(reviewId);

    const refreshList = () => {
      refreshMentorReviews().catch((err) =>
        console.error("Failed to refresh mentor reviews list", err),
      );
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadThread(reviewId);
      refreshList();
    }, POLL_INTERVAL_MS);
    const onFocus = () => {
      loadThread(reviewId);
      refreshList();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [reviewId, loadThread]);

  // Reconcile timer for the optimistic-append path below — cleared on
  // unmount/id change so a stale reconcile never fires against a thread the
  // user has since navigated away from.
  const reconcileTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (reconcileTimeoutRef.current !== null) {
        window.clearTimeout(reconcileTimeoutRef.current);
        reconcileTimeoutRef.current = null;
      }
    };
  }, [reviewId]);

  const handleThreadChange = useCallback(
    (message: MentorThreadMessage) => {
      // Optimistically append the just-sent message so it appears
      // immediately, without waiting for Freshdesk's eventual consistency
      // to catch up on the next full refetch.
      setThread((prev) => {
        if (!prev) return prev;
        if (!prev.messages.every((m) => m.id !== message.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
          lastMessageAt: message.at,
          lastMessageAuthor: "member",
          lastMessagePreview: plainTextPreview(message.bodyHtml),
        };
      });

      // Reconcile against server truth shortly after (attachment URLs etc.);
      // loadThread replaces the whole thread, and the id-dedupe above
      // prevents any duplicate if the message is already present by then.
      if (reconcileTimeoutRef.current !== null) {
        window.clearTimeout(reconcileTimeoutRef.current);
      }
      reconcileTimeoutRef.current = window.setTimeout(() => {
        reconcileTimeoutRef.current = null;
        loadThread(reviewId);
      }, RECONCILE_DELAY_MS);
    },
    [loadThread, reviewId],
  );

  if (listLoaded && reviews.length === 0) {
    return (
      <div className="mentors-shell mentors-shell--empty">
        <MentorEmptyState />
      </div>
    );
  }

  return (
    <div className="mentors-shell">
      <aside className="mentors-shell__list">
        <ThreadList reviews={reviews} activeId={reviewId} />
      </aside>
      <section className="mentors-shell__conv">
        {thread ? (
          <ConversationView
            review={thread}
            onChange={handleThreadChange}
          />
        ) : notFound ? (
          <div className="mentors-empty">
            <h2 className="mentors-empty__title">Review not found</h2>
            <p className="mentors-empty__body">
              That mentor review doesn't exist or has been removed.
            </p>
            <Link to="/mentors" className="mentors-empty__link">
              <ArrowLeft size={14} /> Back to Mentors
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
