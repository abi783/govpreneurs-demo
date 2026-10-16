import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";

export function MentorEmptyState() {
  return (
    <div className="mentors-empty">
      <div className="mentors-empty__icon" aria-hidden>
        <MessagesSquare size={22} />
      </div>
      <h2 className="mentors-empty__title">No mentor reviews yet</h2>
      <p className="mentors-empty__body">
        When you send an opportunity to a mentor from its detail page, the conversation shows up
        here.
      </p>
      <Link to="/opportunities" className="mentors-empty__link">
        Browse opportunities →
      </Link>
    </div>
  );
}
