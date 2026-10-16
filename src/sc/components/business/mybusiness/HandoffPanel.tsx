/**
 * The three page modes, and the only client state on the landing screen.
 *
 * Reads the record from `RecordStore`; the mode drives everything —
 * `filling`/`ready` → `CheckAnswers`, `sent` → `HandoffDone`.
 *
 * It owns the intake line ("You have answered n of the 14 …"), which used to be
 * server-rendered in `page.tsx` and so could not move when she answered one.
 *
 * THE MODE IS KEYED OFF THE EVENT, NEVER THE COUNT. `handoffMode()` reads
 * `intakeSentAt` before the counter, and this component never re-derives it: a
 * field can fall back to `needs_review` months later, and a count-keyed screen
 * would drag her back into a form she finished in week one.
 *
 * Every mutation answers with the whole payload, so a save or send is
 * `setData(await res.json())` — never a mutation followed by a re-GET.
 *
 * Nothing fails quietly: a save that does not land says so, in her words, above
 * the button she pressed.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { CheckAnswers } from "./CheckAnswers";
import { HandoffDone } from "./HandoffDone";
import { MediaUploads } from "./MediaUploads";
import { useRecord } from "./RecordStore";
import { uploadDocument } from "./documentApi";
import { confirmField, confirmProposal, rejectProposal, saveField } from "./recordApi";
import { CONFLICT, call } from "./request";
import { answerFailureMessage } from "@sc/lib/businessProfile/proposalAnswer";

const SEND_MESSAGE = "That did not send. Nothing has gone to your mentor.";

export interface HandoffPanelProps {
  locationId: string;
}

/** The landing screen's handoff block, in whichever of the three modes she is in. */
export function HandoffPanel({ locationId }: HandoffPanelProps): ReactElement | null {
  const router = useRouter();
  /** The record the rail is counting — held above this component, not beside it. */
  const { payload: data, setPayload: setData } = useRecord();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  /** The one row being saved, and the one whose save was refused. Kept apart
   *  from `busy` above: saving a field and sending the fourteen are separate
   *  acts, and one in flight must not disable the other. */
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ fieldKey: string; message: string } | null>(null);
  /** The one proposal whose last yes or no was refused, and why. Keyed by the
   *  PROPOSAL, because that is what she answered and it is where the sentence
   *  belongs. */
  const [proposalFailure, setProposalFailure] = useState<
    { proposalId: string; message: string } | null
  >(null);

  /** Answering a question. It saves that one field and NOTHING ELSE — reaching
   *  the fourteenth fires no handoff, it only changes what this screen offers.
   *
   *  Answers whether it saved, so a refused value leaves the editor open
   *  holding what she typed rather than throwing it away. */
  /** Yes or no to something a channel proposed for one of the fourteen. The
   *  endpoints answer with the whole payload, as every write here does.
   *
   *  A REFUSED ANSWER IS SAID OUT LOUD. This used to drop the outcome, which
   *  contradicted the claim at the head of this file: the card stopped being
   *  busy and she was told nothing. `answerFailureMessage` turns the route's
   *  named reason into her sentence, so no machine word reaches the screen.
   *
   *  `picked` is the items she kept where the row asked her to choose. It goes
   *  out through `confirmProposal`, which owns the body. */
  async function answerProposal(
    proposalId: string,
    yes: boolean,
    picked?: string[],
  ): Promise<void> {
    setSavingKey(proposalId);
    setFailure(null);
    setProposalFailure(null);
    const outcome = yes
      ? await confirmProposal(locationId, proposalId, picked)
      : await rejectProposal(locationId, proposalId);
    if (outcome.ok) setData(outcome.payload);
    else setProposalFailure({ proposalId, message: answerFailureMessage(outcome.message) });
    setSavingKey(null);
  }

  async function save(fieldKey: string, value: unknown): Promise<boolean> {
    setSavingKey(fieldKey);
    setFailure(null);
    const outcome = await saveField(locationId, fieldKey, value);
    if (outcome.ok) setData(outcome.payload);
    else setFailure({ fieldKey, message: outcome.message });
    setSavingKey(null);
    return outcome.ok;
  }

  /** She agrees with a value we put on the record. One request, no retyping. */
  async function confirm(fieldKey: string): Promise<void> {
    setSavingKey(fieldKey);
    setFailure(null);
    const outcome = await confirmField(locationId, fieldKey);
    if (outcome.ok) setData(outcome.payload);
    else setFailure({ fieldKey, message: outcome.message });
    setSavingKey(null);
  }

  /** Her act, and the only thing that stamps `intakeSentAt`. */
  async function send(): Promise<void> {
    setBusy(true);
    setError(null);
    const outcome = await call(
      `/api/portal/${locationId}/business-profile/handoff`,
      { method: "POST" },
      SEND_MESSAGE,
    );
    if (outcome.ok) {
      setData(outcome.payload);
      setJustSent(true);
    } else {
      setError(outcome.message);
      if (outcome.status === CONFLICT) router.refresh();
    }
    setBusy(false);
  }

  // SENDING IS NOT AN ENDING. This used to return a receipt and nothing else,
  // so a member who had handed over her fourteen landed on one line with no
  // questions under it — the screen stopped being Basic Info the moment she
  // finished it. The list stays answerable afterwards: what she changes reaches
  // her mentor anyway, and `CheckAnswers` offers no Send outside `ready`, so
  // nothing can be sent twice. `HandoffDone` now speaks only in the render
  // after she presses send.
  const sent = data.handoff.mode === "sent" && data.handoff.sentAt !== null;

  return (
    <>
      {sent ? (
        <HandoffDone
          sentAt={data.handoff.sentAt!}
          sentMentor={data.handoff.sentMentor}
          justSent={justSent}
        />
      ) : null}

      {/* THE COUNT IS NOT HERE. It used to be a card of its own above this
          list — an eyebrow over "n of 14 answered" — which is the second place
          on one screen to print a fraction of the intake. It now sits in
          `DeadlineNote`'s banner at the top of the screen, beside the date it
          is the count for. */}
      <CheckAnswers
        payload={data}
        images={<MediaUploads locationId={locationId} />}
        savingKey={savingKey}
        sending={busy}
        failure={failure}
        proposalFailure={proposalFailure}
        error={error}
        onSave={save}
        onConfirm={confirm}
        onAnswerProposal={answerProposal}
        // The certifications row is one of the fourteen and takes a file. The
        // same upload the part screens use, so a document reaches the record
        // down one path however she got to the question (F17).
        onUpload={(fieldKey, file) => uploadDocument(locationId, fieldKey, file)}
        onSend={() => void send()}
      />
    </>
  );
}

