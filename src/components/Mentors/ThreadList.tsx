import { Link } from "@tanstack/react-router";
import { mentorBadge, type MentorReviewSummary } from "../../lib/mentorReviewsApi";
import { preview, relTime } from "./format";

export function ThreadList({
  reviews,
  activeId,
}: {
  reviews: MentorReviewSummary[];
  activeId?: string;
}) {
  return (
    <nav className="mentors-list" aria-label="Mentor reviews">
      <div className="mentors-list__header">
        <h2 className="mentors-list__title">Reviews</h2>
        <span className="mentors-list__count">{reviews.length}</span>
      </div>
      <ul className="mentors-list__items">
        {reviews.map((r) => {
          const active = r.id === activeId;
          const badge = mentorBadge(r);
          return (
            <li key={r.id}>
              <Link
                to="/mentors/$reviewId"
                params={{ reviewId: r.id }}
                className={`mentors-list__row${active ? " is-active" : ""}${r.unread ? " is-unread" : ""}`}
              >
                <div className="mentors-list__row-top">
                  <span className={`mentors-status mentors-status--${badge.modifier}`}>
                    {badge.label}
                  </span>
                  {r.unread && <span className="mentors-list__unread-dot" aria-label="Unread" />}
                </div>
                <div className="mentors-list__row-title">{r.title}</div>
                <div className="mentors-list__row-meta">
                  {r.mentorName ?? "Your mentor"} · {relTime(r.lastMessageAt)}
                </div>
                <div className="mentors-list__row-preview">
                  {r.lastMessagePreview.trim() === ""
                    ? "Sent for review"
                    : `${r.lastMessageAuthor === "mentor" ? "" : "You: "}${preview(r.lastMessagePreview)}`}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
