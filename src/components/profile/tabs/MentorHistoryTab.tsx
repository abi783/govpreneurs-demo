import { Link } from "@tanstack/react-router";
import { MentorSessionCard } from "../MentorSessionCard";
import { useMentorSessions } from "../../../demo/profile/mentor";
import { MENTOR } from "../../../demo/story/persona";

// DEMO: the sessions come from the story's mentor reviews (Diana Potts) and the
// takeaways the visitor writes are kept in the demo store.
export function MentorHistoryTab() {
  const sessions = useMentorSessions();
  return (
    <div className="pp-tab">
      <header className="pp-tab-header">
        <h2 className="pp-tab-title">Mentor History</h2>
        <div className="pp-tab-actions">
          <Link to="/find-a-mentor" className="pp-btn-primary">
            Book your next session
          </Link>
        </div>
      </header>

      <p className="pp-import-note">
        Your mentor is {MENTOR.name}, {MENTOR.title.toLowerCase()}.
      </p>

      <div className="pp-list">
        {sessions.map((s) => (
          <MentorSessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
