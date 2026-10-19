/**
 * The `sent` handoff mode: who has it, when it went, then out of the way — the
 * record stays fully usable underneath.
 *
 * It leads with the consequence, not the completion: her mentor reads this
 * before the call and she need do nothing else. No badge, streak or score.
 *
 * `sent` IS TERMINAL. A new proposal does not bring the form back — a register
 * contradicting her months later belongs on the record row it contradicts, not
 * in a form she finished in week one. `handoffMode()` checks `sentAt` before the count, which
 * is where that rule lives.
 *
 * IT RENDERS ONLY IN THE MOMENT OF SENDING. `justSent` is true for the one
 * render that follows her pressing the button; every later visit shows nothing
 * here at all. The celebration is not replayed forever, and neither is the
 * receipt that replaced it — a line that can never change again does not earn
 * the top of a screen she came to change something on.
 *
 * `intakeSentAt` is never retro-stamped: members already at 14 of 14 land in
 * `ready` and send when they choose, because back-filling a date would tell
 * Diana a packet arrived that she never got.
 */

"use client";

import type { ReactElement } from "react";
import { fullDate } from "@sc/lib/businessProfile/mbValue";

/** Who has it, when nobody is named on the record yet. */
const UNNAMED_MENTOR = "your mentor";

export interface HandoffDoneProps {
  sentAt: string;
  /** The mentor it went to, as recorded at send time — not resolved live, so a
   *  later reassignment does not rewrite history. */
  sentMentor: string | null;
  /** True only in the render that follows her pressing send. On every later
   *  visit this is the quiet receipt instead. */
  justSent?: boolean;
}

/** What happens next, said once — in the render after she sends, and never
 *  again. */
export function HandoffDone({
  sentAt,
  sentMentor,
  justSent,
}: HandoffDoneProps): ReactElement | null {
  const mentor = sentMentor ?? UNNAMED_MENTOR;
  const when = fullDate(sentAt);

  // THE STANDING RECEIPT IS GONE. On every visit after the send it printed
  // "Your answers went to {mentor} on {date}" above the questions — a sentence
  // that never changes again, at the top of a screen she opens to change
  // something. The fact it carried is not lost: the questions underneath are
  // live, and `CheckAnswers`' own lede already says her mentor has them and
  // sees what she changes.
  if (justSent !== true) return null;

  return (
    <section className="mb-sent" aria-labelledby="mb-sent-h">
      {/* The mentor is never the first word: with nobody assigned yet it is
          "your mentor", and a heading cannot open lower case. */}
      <h2 className="mb-sec__h" id="mb-sent-h">
        It is with {mentor}
      </h2>
      <p className="mb-sub">
        She reads it before your call, so you do not have to go through it again there. You do not
        need to do anything else.
      </p>
      <p className="mb-sent__receipt">
        Sent on <span className="gpds-mono">{when}</span>. You can still change any answer, and she
        sees the change.
      </p>
    </section>
  );
}
