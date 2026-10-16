import { MentorSessionCard, type MentorSession } from "../MentorSessionCard";

const SESSIONS: MentorSession[] = [
  {
    id: "session-2026-04-22",
    date: "April 22, 2026",
    time: "9:00 AM",
    mentor: "Sarah Mitchell",
    status: "completed",
    takeaway:
      "Focus on USACE small business set-asides; capability statement needs more recent past performance.",
  },
];

export function MentorHistoryTab() {
  return (
    <div className="pp-tab">
      <header className="pp-tab-header">
        <h2 className="pp-tab-title">Mentor History</h2>
        <div className="pp-tab-actions">
          <button
            type="button"
            className="pp-btn-primary"
            onClick={() => console.log("Book your next session clicked")}
          >
            Book your next session
          </button>
        </div>
      </header>

      <div className="pp-list">
        {SESSIONS.map((s) => (
          <MentorSessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
