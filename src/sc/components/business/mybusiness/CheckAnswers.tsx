/**
 * The fourteen, and read them back before they go.
 *
 * Two handoff modes render through one component because they are the same
 * list: `filling` is the intake questions, `ready` is the same plus "Check your
 * answers" and one Send button.
 *
 * ANSWERING THE FOURTEENTH SENDS NOTHING. Reaching 14 of 14 renders the button
 * and fires no request. The send is her decision and cannot be undone, so it
 * cannot be a side effect of a keystroke. Offering it only in `ready` is also
 * what keeps the route's 409 off her screen.
 *
 * It is a low-stakes button and says so: her answers are already saved field by
 * field, so sending tells a mentor the profile is worth reading rather than
 * moving data or closing anything.
 *
 * Rows are `Row` over `answersToCheck`, the same renderer and synthesised
 * `missing` rows the part pages use, so the fourteen are never restated here.
 *
 * SHE ANSWERS THEM HERE. Every row saves in place, including one that already
 * holds a value. This used to hand `Row` an `onEdit`, which wins over editing
 * in place, so "Change" on an answered row moved her to the part that holds it
 * — off the screen she was working down, for a one-word correction.
 */

"use client";

import type { ReactElement, ReactNode } from "react";
import type { UploadFile } from "../controls";
import { answersToCheck } from "@sc/lib/businessProfile/handoff";
import { INTAKE_SECTIONS, sectionForField } from "@sc/lib/businessProfile/intakeSections";
import type { MyBusinessPayload, RecordFieldPayload } from "@sc/lib/businessProfile/payload";
import { recordLookup } from "@sc/lib/businessProfile/rowEditor";
import { Row } from "./Row";
import { SummaryList } from "./SummaryRow";
import "./mybusiness.css";

/**
 * The questions, in the FORM's sections rather than the record's parts.
 *
 * Grouping by part made the card headings repeat the rail's destinations —
 * "Your legal details" over the questions on a screen the rail already calls
 * "Basic Info". A section with none of the asked questions in it is dropped,
 * and a question no section names falls into the last one rather than
 * vanishing off the screen.
 */
function groupsOf(
  rows: readonly RecordFieldPayload[],
): { id: string; title: string; note: string; rows: RecordFieldPayload[] }[] {
  const last = INTAKE_SECTIONS[INTAKE_SECTIONS.length - 1]!;
  return INTAKE_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    note: section.note,
    rows: rows.filter((row) => (sectionForField(row.catalogId) ?? last).id === section.id),
  })).filter((group) => group.rows.length > 0);
}

/** Who is waiting for it, when nobody is named on the record yet. */
const UNNAMED_MENTOR = "your mentor";

export interface CheckAnswersProps {
  payload: MyBusinessPayload;
  /** Answer or change one question, in place. Saves on its own, and SENDS
   *  NOTHING. Answers whether it saved: `false` keeps the editor open holding
   *  what she typed, so a refusal never costs her the answer. */
  onSave: (fieldKey: string, value: unknown) => Promise<boolean>;
  /** A row answered with a file — the certifications row takes one. Keyed like
   *  `onSave` because a document is stored against the row that asked for it;
   *  without this that row opens but can attach nothing. */
  onUpload: (fieldKey: string, file: File) => ReturnType<UploadFile>;
  onSend: () => void;
  /** "Yes, that is right" on a row we filled in for her. */
  onConfirm?: (fieldKey: string) => void;
  /** Yes or no to something a channel proposed for one of the fourteen —
   *  answered on the row that asks the question, since the queue that used to
   *  hold these is gone. `picked` carries the items she kept where the row
   *  asked her to choose. */
  onAnswerProposal?: (proposalId: string, yes: boolean, picked?: string[]) => void;
  /** The one row being saved, so a save disables that row and no other. */
  savingKey?: string | null;
  /** True only while the SEND is in flight; the button and the rows have
   *  separate busy states because they are separate acts. */
  sending?: boolean;
  /** The row whose last save was refused, and why — kept WITH its key so the
   *  reason renders on that row rather than under all fourteen. */
  failure?: { fieldKey: string; message: string } | null;
  /** The proposal whose last yes or no was refused, and why — kept with the
   *  PROPOSAL's id, so the sentence renders under the buttons she pressed. */
  proposalFailure?: { proposalId: string; message: string } | null;
  /** Named out loud when a SEND did not land. Never swallowed. */
  error?: string | null;
  /** The photo and the logo, rendered inside the first section's card. Passed
   *  in rather than imported so this component keeps knowing nothing about
   *  uploads. */
  images?: ReactNode;
}

/** The `filling` and `ready` screens: Diana's fourteen, and — only when they
 *  are all answered — the button that hands them over. */
export function CheckAnswers({
  payload,
  onSave,
  onUpload,
  onSend,
  onConfirm,
  onAnswerProposal,
  savingKey,
  sending,
  failure,
  proposalFailure,
  error,
  images,
}: CheckAnswersProps): ReactElement {
  const ready = payload.handoff.mode === "ready";
  const mentor = payload.onboarding.mentorName ?? UNNAMED_MENTOR;
  /** One of the fourteen picks from her answer to another of them, so the list
   *  hands every row the rest of the record. */
  const record = recordLookup(payload.fields);
  const groups = groupsOf(answersToCheck(payload.fields));
  /* The open proposals, by the row they belong to — one per row, newest first,
     the same rule the part screens use. Basic Info shows the fourteen wherever
     they live, so a proposal is matched on the field key rather than the part. */
  const proposalByKey = new Map<string, (typeof payload.proposals)[number]>();
  for (const proposal of payload.proposals) {
    if (!proposalByKey.has(proposal.fieldKey)) proposalByKey.set(proposal.fieldKey, proposal);
  }
  const first = groups[0]?.id;

  return (
    <section className="mb-check" aria-label="Your answers">
      {/* THE FOURTEEN IN THE PARTS THEY BELONG TO, each group a card with its
          own band — the shape the source design gives this screen, and the one
          every part screen now uses. A flat list of fourteen made her read the
          whole thing to find the two she had not answered, and said nothing
          about why any of them was asked. Groups keep the catalog's order, and
          a part with none of the fourteen in it renders nothing at all. */}
      <div className="mb-secs">
        {groups.map((group) => (
          <section className="mb-fsec" key={group.id}>
            <header className="mb-fsec__head">
              <h3 className="mb-fsec__h">{group.title}</h3>
              <p className="mb-fsec__note">{group.note}</p>
            </header>
            <div className="mb-fsec__body">
              {/* The two images open the FIRST section, inside its card, where
                  the source design puts them — above that section's questions
                  rather than floating over every card. */}
              {group.id === first ? <div className="mb-fsec__images">{images}</div> : null}
              <SummaryList>
                {group.rows.map((field) => {
                  // Read once. The row needs the proposal itself for four of its
                  // props, and a second lookup per prop is how one of them comes
                  // to name another row.
                  const proposal = proposalByKey.get(field.fieldKey);
                  return (
                    <Row
                      key={field.fieldKey}
                      field={field}
                      record={record}
                      asForm
                      busy={savingKey === field.fieldKey}
                      error={failure && failure.fieldKey === field.fieldKey ? failure.message : null}
                      proposal={proposal}
                      onAcceptProposal={
                        proposal && onAnswerProposal
                          ? (picked) => onAnswerProposal(proposal.id, true, picked)
                          : undefined
                      }
                      onRejectProposal={
                        proposal && onAnswerProposal
                          ? () => onAnswerProposal(proposal.id, false)
                          : undefined
                      }
                      // Why her last yes or no did not land, under the buttons
                      // she pressed.
                      proposalError={
                        proposal && proposalFailure?.proposalId === proposal.id
                          ? proposalFailure.message
                          : null
                      }
                      onSave={(value) => onSave(field.fieldKey, value)}
                      onConfirm={onConfirm ? () => onConfirm(field.fieldKey) : undefined}
                      onUpload={(file) => onUpload(field.fieldKey, file)}
                    />
                  );
                })}
              </SummaryList>
            </div>
          </section>
        ))}
      </div>

      {ready ? (
        <div className="mb-send">
          {/* The mentor is never the first word: with nobody assigned yet it is
              "your mentor", and a sentence cannot open lower case. */}
          <p className="mb-send__note">
            It goes to {mentor}, who reads it before your call, so you do not have to go through it
            there. You can still change any answer afterwards.
          </p>
          <button type="button" className="gpds-btn mb-btn" onClick={onSend} disabled={sending === true}>
            {sending === true ? "Sending" : `Send to ${mentor}`}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-note" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
