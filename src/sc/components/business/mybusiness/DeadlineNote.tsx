/**
 * DeadlineNote — what is due, how much of it is left, and when. FRAMEWORKS &
 * DRIVERS.
 *
 * F20. `onboarding.profileDueAt` was carried in the payload and read by nothing
 * after the old page was deleted, which is the whole reason the intake had any
 * urgency at all (PRD §6.3).
 *
 * IT IS A BANNER, AND IT OPENS THE SCREEN. It was a 13px grey sentence three
 * blocks down, inside the card that also carried the count — so the one dated
 * fact on the page sat below the undated ones and read as a caption.
 *
 * THE COUNT BELONGS WITH THE DEADLINE, not with the score. They are two
 * different fractions: this is n of the FOURTEEN a mentor needs by a date, and
 * the rail's dial is n of the fifty-odd the whole record holds. Same numerator
 * on some days, different questions, and only this one has a date attached —
 * which is why the separate "before your first call" count card is gone.
 *
 * IT RETIRES WHEN THE FOURTEEN GO. A deadline that outlives its own completion
 * is the page contradicting itself, so `sent` renders nothing here and the
 * receipt speaks instead.
 *
 * The sentence and the rule that there is none until a call is booked are
 * `deadline.ts`'s, tested there. This file decides nothing.
 */

"use client";

import type { ReactElement } from "react";
import {
  deadlineLead,
  deadlineNote,
  fullRecordLead,
  fullRecordNote,
} from "@sc/lib/businessProfile/deadline";
import { useRecord } from "./RecordStore";
import "./mybusiness.css";

/** What she still owes before the call, and when it is due. */
export function DeadlineNote(): ReactElement | null {
  const { payload } = useRecord();
  // Handed over already: the receipt above says so, and a deadline for it
  // would contradict that.
  if (payload.handoff.mode === "sent") return null;

  /* TWO DEADLINES, ONE BANNER, NEVER BOTH AT ONCE. Before the positioning call
     the fourteen are the only thing asked of her; after it they are behind her
     and the rest of the record has a week. So the second replaces the first
     rather than joining it — two dated demands at the top of one screen is a
     page shouting. */
  const afterLead = fullRecordLead(payload.onboarding);
  const afterNote = fullRecordNote(payload.onboarding);
  if (afterLead && afterNote) {
    return (
      <aside className="mb-due">
        <span className="mb-due__i" aria-hidden>
          <CalendarIcon />
        </span>
        <div className="mb-due__t">
          <p className="mb-due__when">{afterLead}</p>
          <p className="mb-due__what">{afterNote}</p>
        </div>
      </aside>
    );
  }

  const note = deadlineNote(payload.onboarding);
  /* HOW SOON, IN THE FIRST WORDS. "Before your first call" is true on every
     visit and so says nothing about today; the prototype opens with "Due
     tomorrow". It stays the fallback for the member with no call booked, who
     has a count to finish and no date to finish it by. */
  const lead = deadlineLead(payload.onboarding) ?? "Before your first call";
  const { answered, total } = payload.counter;
  const outstanding = Math.max(0, total - answered);

  /* NO DATE AND NOTHING OWED IS NOT A DEADLINE, AND MUST NOT LOOK LIKE ONE.
     This rendered whenever the handoff was not yet sent, so a member with no
     call booked and all fourteen answered still met a calendar icon, an urgency
     tint and the words "Before your first call" — a deadline banner announcing
     neither a deadline nor anything to do before it. At 14 of 14 the only thing
     left is to send it, and `HandoffPanel` is what says so.

     The two halves are separately load-bearing, which is why this is not simply
     `if (!note) return null`:

       · a DATE always earns the banner, however much is answered — it is the
         one dated fact on the page and it belongs at the top;
       · with no date, only OUTSTANDING questions earn it, because then the
         count is a real prompt rather than a decoration.  */
  if (!note && outstanding === 0) return null;

  return (
    <aside className="mb-due">
      <span className="mb-due__i" aria-hidden>
        <CalendarIcon />
      </span>
      <div className="mb-due__t">
        <p className="mb-due__when">
          {lead}
          <span className="gpds-mono mb-due__of">
            {answered} of {total} answered
          </span>
        </p>
        {/* Only a booked call gives a date. Without one the count still stands
            on its own — it is true whether or not anything is in the diary. */}
        {note ? <p className="mb-due__what">{note}</p> : null}
      </div>
    </aside>
  );
}

/** The one glyph this banner needs, inline — the drawing convention the rest of
 *  this folder follows. */
function CalendarIcon(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M8 2v4M16 2v4M3.5 9.5h17M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
