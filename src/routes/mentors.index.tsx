import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePageMeta } from "../components/Layout/page-meta";
import {
  getMentorReviewsSnapshot,
  hasMentorReviewsLoaded,
  refreshMentorReviews,
  subscribeMentorReviews,
} from "../lib/mentorReviewsApi";
import { ThreadList } from "../components/Mentors/ThreadList";
import { MentorEmptyState } from "../components/Mentors/MentorEmptyState";

export const Route = createFileRoute("/mentors/")({
  head: () => ({
    meta: [
      { title: "Mentors — GovPreneurs" },
      { name: "description", content: "Your conversations with GovCon mentors." },
    ],
  }),
  component: MentorsIndexPage,
});

function MentorsIndexPage() {
  usePageMeta({ layout: "wide" });
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(getMentorReviewsSnapshot);
  const [loaded, setLoaded] = useState(hasMentorReviewsLoaded);

  useEffect(() => {
    const sync = () => {
      setReviews(getMentorReviewsSnapshot());
      setLoaded(hasMentorReviewsLoaded());
    };
    sync();
    const unsubscribe = subscribeMentorReviews(sync);
    refreshMentorReviews()
      .then(sync)
      .catch((err) => console.error("Failed to load mentor reviews", err));
    return unsubscribe;
  }, []);

  // Auto-open the first conversation once the list has loaded, instead of
  // making the user pick one from an empty "Select a conversation" panel.
  useEffect(() => {
    if (loaded && reviews.length > 0) {
      navigate({
        to: "/mentors/$reviewId",
        params: { reviewId: reviews[0].id },
        replace: true,
      });
    }
  }, [loaded, reviews, navigate]);

  // While loading, keep the design shell up (no new spinner UI) — the list
  // simply renders empty until the first fetch resolves.
  if (loaded && reviews.length === 0) {
    return (
      <div className="mentors-shell mentors-shell--empty">
        <MentorEmptyState />
      </div>
    );
  }

  return (
    <div className="mentors-shell">
      <aside className="mentors-shell__list">
        <ThreadList reviews={reviews} />
      </aside>
      <section className="mentors-shell__conv">
        <div className="mentors-empty">
          <h2 className="mentors-empty__title">Select a conversation</h2>
          <p className="mentors-empty__body">
            Choose a mentor review from the list to view the conversation.
          </p>
        </div>
      </section>
    </div>
  );
}
