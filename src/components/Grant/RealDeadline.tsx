// The Real Deadline — time made visual (PRD 96 §11.6). A single horizontal
// timeline: Today → your REAL deadline (bold, colored) → the date on the notice
// (quiet), with any passed mandatory event marked. The spatial gap IS the message.
// Renders only when the answer is tight/blocked.
import { X } from "lucide-react";
import type { RealDeadline as RealDeadlineT } from "../../lib/grant/types";
import { RichText } from "./primitives";

export function RealDeadline({ deadline }: { deadline: RealDeadlineT }) {
  if (deadline.status === "ok") return null;

  const notice = Math.max(deadline.noticeDays, 1);
  const realPct = Math.min(Math.max((deadline.realRunwayDays / notice) * 100, 4), 96);
  const tone = deadline.status === "blocked" ? "blocked" : "warn";

  return (
    <div className="grant-deadline" role="group" aria-label="Your real deadline">
      <div className="grant-deadline__track">
        <span className="grant-deadline__mark grant-deadline__mark--today">
          <i className="grant-deadline__dot" aria-hidden />
          <em>Today</em>
        </span>
        <span
          className={`grant-deadline__mark grant-deadline__mark--real grant-deadline__mark--${tone}`}
          style={{ left: `${realPct}%` }}
        >
          <i className="grant-deadline__dot" aria-hidden />
          <em>
            Your real deadline ·{" "}
            <span className="mono">{Math.max(deadline.realRunwayDays, 0)}d</span>
          </em>
        </span>
        <span className="grant-deadline__mark grant-deadline__mark--due">
          <i className="grant-deadline__dot" aria-hidden />
          <em>
            Notice says <span className="mono">{deadline.noticeDays}d</span>
          </em>
        </span>
      </div>

      <p className="grant-deadline__sentence">
        <RichText line={deadline.sentence} />
      </p>

      {deadline.passedEvents.some((e) => e.missed) ? (
        <ul className="grant-deadline__passed">
          {deadline.passedEvents
            .filter((e) => e.missed)
            .map((e) => (
              <li key={e.label}>
                <X
                  size={13}
                  strokeWidth={2.4}
                  className="grant-glyph grant-glyph--blocked"
                  aria-hidden
                />
                <span>
                  <b>{e.label}</b> already passed
                </span>
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
}
