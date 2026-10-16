import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import * as Switch from "@radix-ui/react-switch";
import { usePageMeta } from "../components/Layout/page-meta";
import { expiredBidCount, pickHunterNudge, type Bid } from "../lib/mock/bids";
import { relativeTime } from "../lib/format";
import { savedDetailToBid } from "../lib/bids/savedDetailToBid";
import { useDismissibleHint } from "../lib/uiState";
import { useGhlUser } from "../lib/ghlUser";
import { crossPageClick, isEmbeddedInGhl, requestCrossPageNav } from "../lib/ghlNav";
import { BidsBoard } from "../components/Bids/BidsBoard";
import { fetchSavedOppDetails } from "../lib/workspace";
import {
  getMentorReviewsSnapshot,
  hasMentorReviewsLoaded,
  refreshMentorReviews,
  subscribeMentorReviews,
  type MentorReviewSummary,
} from "../lib/mentorReviewsApi";

/** The opportunities feed lives on the Opportunities custom page (a separate
 * GHL iframe) whose feed is served at that app's root. When embedded, relay
 * through the parent frame (landing on the app root) instead of navigating
 * inside the My Bids iframe — same mechanism the bid cards use for detail. */
function openOpportunitiesFeed(e: React.MouseEvent) {
  if (!isEmbeddedInGhl()) return;
  e.preventDefault();
  requestCrossPageNav("opportunities", "/");
}

/**
 * Adapter: maps a real `MentorReviewSummary` (backend-backed /mentors chat)
 * into a `Bid`-shaped card for the board's "Mentor review" column. The board
 * and BidCard are typed around the mock pursuit-tracker `Bid` — rather than
 * loosen that typing, this is the smallest clean seam: a real review becomes
 * a with_mentor "bid" whose primary action points at the mentor thread, not
 * an opportunity page (the review has no tracked opportunity notice id, and
 * a review with `oppKey: null` — sent about a manually-noted item — has
 * nothing to link to anyway).
 */
function mentorReviewToBid(review: MentorReviewSummary): Bid {
  const now = new Date();
  const lastMentorLine = review.unread
    ? `Mentor replied ${relativeTime(review.lastMessageAt, now)}.`
    : review.lastMessageAuthor === "mentor"
      ? `Mentor reviewing — replied ${relativeTime(review.lastMessageAt, now)}.`
      : "Mentor reviewing — awaiting reply.";
  return {
    id: `mentor_${review.id}`,
    opportunityId: review.oppKey ?? review.id,
    title: review.title,
    agency: "",
    mode: "prime",
    deadline: null,
    stage: "with_mentor",
    nextAction: {
      label: review.unread ? "Read reply" : "Open thread",
      href: `/mentors/${review.id}`,
    },
    lastActivityAt: review.lastMessageAt,
    daysLeft: null,
    expired: false,
    valueMidUsd: 0,
    contextOverride: lastMentorLine,
    mentorActionOverride: {
      label: review.unread ? "Read reply →" : "Open thread →",
      reviewId: review.id,
      primary: review.unread,
    },
  };
}

/** Cards for the "with_mentor" board column: every review not yet closed. */
function mentorReviewsToBids(reviews: MentorReviewSummary[]): Bid[] {
  return reviews.filter((r) => r.status !== "closed").map(mentorReviewToBid);
}

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Pursuit pipeline · GovPreneurs" },
      {
        name: "description",
        content: "Your pursuit pipeline — every saved bid, its stage, and its next move.",
      },
    ],
  }),
  component: MyBidsPage,
});

function MyBidsPage() {
  usePageMeta({});
  const [showExpired, setShowExpired] = useState(false);
  const { dismissed: hunterDismissed, dismiss: dismissHunter } = useDismissibleHint("bids.hunter");
  const { session } = useGhlUser();
  const [savedBids, setSavedBids] = useState<Bid[]>([]);
  const [mentorReviews, setMentorReviews] =
    useState<MentorReviewSummary[]>(getMentorReviewsSnapshot);

  useEffect(() => {
    if (!session?.locationId) return;
    fetchSavedOppDetails()
      .then((details) => setSavedBids(details.map(savedDetailToBid)))
      .catch((err) => console.error("Failed to load saved opportunities", err));
  }, [session?.locationId]);

  // Mentor reviews are a shared store (also backing /mentors and the Tasks
  // "mentor replied" row) — subscribe so the board's Mentor review column
  // refreshes the moment that store loads or changes, not just on this
  // component's mount.
  useEffect(() => {
    const sync = () => setMentorReviews(getMentorReviewsSnapshot());
    sync();
    const unsubscribe = subscribeMentorReviews(sync);
    if (!hasMentorReviewsLoaded()) {
      refreshMentorReviews()
        .then(sync)
        .catch((err) => console.error("Failed to load mentor reviews for pipeline", err));
    }
    return unsubscribe;
  }, []);

  // My Bids runs on real data only. Saved opps and mentor reviews are wired;
  // the remaining stages (reviewing, drafting, outcomes) stay empty until
  // they get a real backend source — the board's other columns show their
  // empty state.
  const bids = useMemo(
    () => [...savedBids, ...mentorReviewsToBids(mentorReviews)],
    [savedBids, mentorReviews],
  );
  const nudge = useMemo(() => pickHunterNudge(bids), [bids]);
  // "N hidden" counts the saved items the "Show expired" switch hides. Only a
  // saved item can expire: a mentor-review card carries no deadline.
  const hiddenExpired = useMemo(() => expiredBidCount(savedBids), [savedBids]);

  if (bids.length === 0) {
    return (
      <div>
        <BidsHeader />
        <div className="bids-empty">
          <p className="t-body" style={{ margin: 0 }}>
            Nothing in your pipeline yet. Save an opportunity from the feed and it shows up here to
            track.
          </p>
          <Link
            to="/opportunities"
            className="btn btn-primary btn-sm"
            onClick={openOpportunitiesFeed}
          >
            Browse opportunities <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BidsHeader />

      {!hunterDismissed && nudge && (
        <div className="bids-hunter" role="note">
          <Sparkles size={13} className="bids-hunter__icon" />
          <span className="bids-hunter__msg">{nudge.message}</span>
          {nudge.cta && (
            <Link
              to={nudge.cta.href}
              className="bids-hunter__cta"
              onClick={crossPageClick(nudge.cta.href)}
            >
              {nudge.cta.label} <ArrowRight size={11} />
            </Link>
          )}
          <button
            type="button"
            className="bids-hunter__dismiss"
            aria-label="Dismiss"
            onClick={dismissHunter}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="bids-toolbar bids-toolbar--board">
        <label className="bids-expired-toggle">
          <Switch.Root
            className="wallet-switch"
            checked={showExpired}
            onCheckedChange={setShowExpired}
            aria-label="Show expired opportunities"
          >
            <Switch.Thumb className="wallet-switch__thumb" />
          </Switch.Root>
          <span>
            Show expired
            {!showExpired && hiddenExpired > 0 && (
              <span className="bids-expired-toggle__count">{hiddenExpired} hidden</span>
            )}
          </span>
        </label>
      </div>

      <BidsBoard bids={bids} showExpired={showExpired} />
    </div>
  );
}

function BidsHeader() {
  return (
    <header style={{ marginBottom: "var(--s-4)" }}>
      <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>
        Workspace
      </div>
      <h1 className="t-display-lg">Pipeline</h1>
      <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 640 }}>
        Every pursuit, its stage, and its next move — saved, reviewed, drafted, decided.
      </p>
    </header>
  );
}
