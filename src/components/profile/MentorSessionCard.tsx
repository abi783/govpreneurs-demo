import { AlertTriangle } from "lucide-react";

export type SessionStatus = "completed" | "scheduled" | "cancelled";

export interface MentorSession {
  id: string;
  date: string;
  time: string;
  mentor: string;
  status: SessionStatus;
  takeaway?: string;
}

const log = (action: string, id: string) =>
  console.log("MentorSession action:", action, id);

export function MentorSessionCard({ session }: { session: MentorSession }) {
  const hasTakeaway = Boolean(session.takeaway);

  return (
    <article className="mh-card">
      <div className="mh-head">
        <h3 className="mh-title">
          {session.date} · {session.time} with {session.mentor}
        </h3>
        <span className={`mh-status-pill mh-status-${session.status}`}>
          {session.status === "completed"
            ? "Completed"
            : session.status === "scheduled"
              ? "Scheduled"
              : "Cancelled"}
        </span>
      </div>

      {!hasTakeaway && (
        <div className="mh-missing-banner">
          <AlertTriangle size={14} aria-hidden />
          <span>
            No takeaway captured yet — one sentence helps Hunter and Grant build on what you
            discussed
          </span>
          <div className="mh-missing-actions">
            <button
              type="button"
              className="pp-btn-primary pp-btn-sm"
              onClick={() => log("add-takeaway", session.id)}
            >
              Add takeaway
            </button>
            <button
              type="button"
              className="mh-link-btn"
              onClick={() => log("request-notes", session.id)}
            >
              Have us request notes from {session.mentor.split(" ")[0]} →
            </button>
          </div>
        </div>
      )}

      {hasTakeaway && (
        <>
          <div className="mh-label">Your takeaway:</div>
          <div className="mh-takeaway">&ldquo;{session.takeaway}&rdquo;</div>
          <div className="mh-card-footer">
            <button
              type="button"
              className="mh-link-btn"
              onClick={() => log("edit-takeaway", session.id)}
            >
              Edit takeaway
            </button>
            <span className="mh-sep">·</span>
            <button
              type="button"
              className="mh-link-btn"
              onClick={() => log("book-another", session.id)}
            >
              Book another session →
            </button>
          </div>
        </>
      )}
    </article>
  );
}
