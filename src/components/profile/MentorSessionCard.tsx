import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { fmtShort } from "../../demo/profile/dates";
import { setTakeaway, type MentorSessionRecord } from "../../demo/profile/mentor";
import { useEditMode } from "./BusinessProfileMode";

export type SessionStatus = "completed" | "scheduled" | "cancelled";

// DEMO: the card reads a session from the demo store and saves the takeaway there.
export function MentorSessionCard({ session }: { session: MentorSessionRecord }) {
  const editMode = useEditMode();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.takeaway ?? "");
  const [notesAsked, setNotesAsked] = useState(false);
  const hasTakeaway = Boolean(session.takeaway);
  const first = session.mentor.split(" ")[0];
  const when = new Date(session.at);
  const time = when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const startEdit = () => {
    setDraft(session.takeaway ?? "");
    setEditing(true);
  };
  const save = () => {
    setTakeaway(session.id, draft);
    setEditing(false);
  };

  const editor = (
    <div className="mh-session-edit">
      <textarea
        aria-label="Your takeaway"
        value={draft}
        placeholder="In one sentence: what will you do because of this session?"
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="mh-session-edit-actions">
        <button type="button" className="pp-btn-primary pp-btn-sm" disabled={!draft.trim()} onClick={save}>
          Save takeaway
        </button>
        <button type="button" className="pp-btn-secondary pp-btn-sm" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <article className="mh-card">
      <div className="mh-head">
        <h3 className="mh-title">
          {fmtShort(when)} · {time} with {session.mentor}
        </h3>
        <span className={`mh-status-pill mh-status-${session.status}`}>
          {session.status === "completed"
            ? "Completed"
            : session.status === "scheduled"
              ? "Scheduled"
              : "Cancelled"}
        </span>
      </div>
      {session.title && (
        <p className="mh-session-title">
          {session.reviewId ? (
            <Link to="/mentors/$reviewId" params={{ reviewId: session.reviewId }} className="bp-inline-link">
              {session.title}
            </Link>
          ) : (
            session.title
          )}
        </p>
      )}

      {!hasTakeaway && !editing && (
        <div className="mh-missing-banner">
          <AlertTriangle size={14} aria-hidden />
          <span>
            No takeaway captured yet — one sentence helps Hunter and Grant build on what you
            discussed
          </span>
          {editMode && (
            <div className="mh-missing-actions">
              <button type="button" className="pp-btn-primary pp-btn-sm" onClick={startEdit}>
                Add takeaway
              </button>
              {notesAsked ? (
                <span className="mh-link-btn" role="status">
                  Request sent. We will ask {first} for her notes.
                </span>
              ) : (
                <button type="button" className="mh-link-btn" onClick={() => setNotesAsked(true)}>
                  Have us request notes from {first} →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {editing && editor}

      {hasTakeaway && !editing && (
        <>
          <div className="mh-label">Your takeaway:</div>
          <div className="mh-takeaway">&ldquo;{session.takeaway}&rdquo;</div>
          <div className="mh-card-footer">
            {editMode && (
              <>
                <button type="button" className="mh-link-btn" onClick={startEdit}>
                  Edit takeaway
                </button>
                <span className="mh-sep">·</span>
              </>
            )}
            <Link to="/find-a-mentor" className="mh-link-btn">
              Book another session →
            </Link>
          </div>
        </>
      )}
    </article>
  );
}
