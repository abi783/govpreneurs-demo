"use client";

import { useEffect } from "react";
import type { TaskSourceView } from "@sc/lib/tasks/read";
import { PROGRAM_TZ } from "@sc/lib/businessProfile/deadline";

/**
 * The receipt for a task a mentor asked for on a call.
 *
 * WHY A SHEET AND NOT A LINE ON THE CARD. The claim being made is "a person
 * asked you for this", and the evidence is a sentence somebody actually said.
 * That belongs at full size, quoted, attributed and dated — not folded into a
 * drawer under a chip, where it reads as decoration.
 *
 * ONLY THE CITED SENTENCE. PR 41's own sheet shows the turns either side of
 * the quote, because "$2M" means nothing without the question that prompted
 * it. We do not have them: the extraction stores one excerpt per task and no
 * surrounding transcript, so showing a lone turn styled as a thread would
 * imply context we cannot supply. One quotation, presented as one quotation.
 *
 * NO AUDIO. There is no play control, by instruction. `deepLink` is not opened
 * from here either — the sheet stands on the verbatim text.
 *
 * VERBATIM IS THE WHOLE POINT, and the footer says so. `meeting.ts` slices the
 * model's excerpt but never rewrites it, so what is quoted here is what was
 * said. If that ever stops being true, this sheet becomes a lie rather than a
 * receipt.
 */
export function SourceSheet({
  source,
  taskTitle,
  onClose,
}: {
  source: TaskSourceView;
  taskTitle: string;
  onClose: () => void;
}) {
  // Escape closes it. A sheet with no keyboard exit traps a keyboard user.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const who = source.actorName ?? "Your mentor";
  // The label is "<mentor> · <meeting> · <date>". The mentor is already the
  // subject of every line here, so its repetition is dropped.
  const meeting = source.label.startsWith(who + " · ")
    ? source.label.slice(who.length + 3)
    : source.label;
  const when = source.occurredAt
    ? new Date(source.occurredAt).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: PROGRAM_TZ,
      })
    : null;

  return (
    <div className="gpds-sheetwrap" role="presentation" onClick={onClose}>
      <div
        className="gpds-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`What ${who} said`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sh-head">
          <span className="sh-kind">Source · {who}, on the call</span>
          <span className="sh-headright">
            {/* Said out loud on a call and recorded. Nothing here is editable,
                and the reader should not have to test that by trying. */}
            <span className="sh-ro">View only</span>
            <button type="button" className="sh-x" onClick={onClose} aria-label="Close">
              ×
            </button>
          </span>
        </header>

        {/* THE CLAIM SITS ON THE AI LANE, and that is the point rather than a
            decoration: the task's title was DRAFTED BY A MODEL off this call,
            and the sentence below is the evidence for it. Amber says which of
            the two the reader is looking at. */}
        <div className="sh-claim">
          <p className="sh-claimwho">{who} said</p>
          <p>{taskTitle}</p>
        </div>

        {/* Where in the source we are. Mono, because it is a coordinate. */}
        <p className="sh-loc">
          <span>{meeting}</span>
          {when ? <span>{when}</span> : null}
        </p>

        <div className="sh-thread">
          {/* The speaker is a narrow right-aligned column beside the utterance,
              so the eye reads down the text and not around a label. The role
              tints the NAME only — never the words, which are ground truth
              whoever said them. */}
          <div className="sh-turn sh-turn--pinned sh-turn--mentor">
            <span className="sh-who">{who}</span>
            <span className="sh-text">{source.excerpt}</span>
          </div>
        </div>

        <p className="sh-attest">Said directly, on the record</p>

        <footer className="sh-foot">
          {who} said this · verbatim, not paraphrased
        </footer>
      </div>
    </div>
  );
}
