/**
 * One part's rows, and the only client state on a part screen.
 *
 * Reads the record from `RecordStore`, as `HandoffPanel` does.
 * Every row is live: a settled row can be changed, a row with nothing on it
 * opens its own prompt.
 *
 * `PUT .../business-profile/[fieldKey]` answers with the whole payload, so a
 * save is `setPayload(outcome.payload)` — no re-GET, and the request is
 * `recordApi`'s, the same one the handoff screen saves through.
 *
 * The rail and the "we know n things" line read the same store this save
 * writes, so one response moves rows, rail and heading in one render. There is
 * no `router.refresh()`.
 *
 * It decides nothing: which rows a part has is `recordView.rowsIn`, which
 * control changes one is `rowEditor`, what a row looks like is `Row`. This file
 * holds the payload, the one busy key, the one save message and the one message
 * about a refused yes or no.
 *
 * Nothing fails quietly: an answer that does not land says so, in her words,
 * beside the button she pressed.
 */

"use client";

import { useState, type ReactElement } from "react";
import { PRIORITY, catalogFor, fieldsIn } from "@sc/lib/businessProfile/catalog";
import type { RecordFieldPayload } from "@sc/lib/businessProfile/payload";
import type { CatalogPartId } from "@sc/lib/businessProfile/parts";
import { answerFailureMessage } from "@sc/lib/businessProfile/proposalAnswer";
import { rowsIn } from "@sc/lib/businessProfile/recordView";
import { recordLookup } from "@sc/lib/businessProfile/rowEditor";
import { Row } from "./Row";
import { SummaryList } from "./SummaryRow";
import { MediaUploads } from "./MediaUploads";
import { useRecord } from "./RecordStore";
import { uploadDocument } from "./documentApi";
import { confirmField, confirmProposal, rejectProposal, saveField } from "./recordApi";
import "./mybusiness.css";

export interface PartRecordProps {
  locationId: string;
  /** Never `"digital"` — that part holds no catalog rows and renders
   *  `DigitalIdentityPart` instead, at the one call site this has. */
  part: CatalogPartId;
}

/** Every row of one part, each one hers to change. */
export function PartRecord({ locationId, part }: PartRecordProps): ReactElement {
  /** The record the rail is counting — held above this component, not beside it. */
  const { payload: data, setPayload } = useRecord();
  /** The one row being saved, so a save disables that row and no other. */
  const [busyKey, setBusyKey] = useState<string | null>(null);
  /** The one row whose last save was refused, and why. Kept WITH its key so the
   *  reason renders on that row rather than at the foot of the part. */
  const [failure, setFailure] = useState<{ fieldKey: string; message: string } | null>(null);
  /** The one proposal whose last yes or no was refused, and why. Keyed by the
   *  PROPOSAL, because that is what she answered and it is where the sentence
   *  belongs. */
  const [proposalFailure, setProposalFailure] = useState<
    { proposalId: string; message: string } | null
  >(null);

  /** Answer or change one field. It saves that field and nothing else, and says
   *  whether it saved — a refused answer leaves the editor open, holding what
   *  she typed. */
  async function save(fieldKey: string, value: unknown): Promise<boolean> {
    setBusyKey(fieldKey);
    setFailure(null);
    const outcome = await saveField(locationId, fieldKey, value);
    // One response, one state update: these rows, the rail's counts and the
    // heading above them all re-render from it.
    if (outcome.ok) setPayload(outcome.payload);
    else setFailure({ fieldKey, message: outcome.message });
    setBusyKey(null);
    return outcome.ok;
  }

  /** She agrees with a value we put on the record. One request, no retyping. */
  async function confirm(fieldKey: string): Promise<void> {
    setBusyKey(fieldKey);
    setFailure(null);
    const outcome = await confirmField(locationId, fieldKey);
    if (outcome.ok) setPayload(outcome.payload);
    else setFailure({ fieldKey, message: outcome.message });
    setBusyKey(null);
  }

  const { held, blank } = rowsIn(part, data.fields);

  /* EVERY ROW OF THE PART, GROUPED BY TIER — answered and unanswered in the
     same card, which is what the source design does and what a member reading
     "Needed to find you work" expects to find under it. The old shape put the
     answered rows in one flat list and the open ones under "Not answered yet",
     so a tier's heading described only its unanswered half, and a question
     changed card the moment she answered it.

     Order inside a tier is the CATALOG's. `held` and `blank` are each in
     catalog order, so concatenating them would sort by accident of state
     rather than by question. */
  const order = new Map(fieldsIn(part).map((field, i) => [field.id, i]));
  const everyRow = [...held, ...blank.flatMap((tier) => tier.rows)].sort(
    (a, b) => (order.get(a.catalogId) ?? 0) - (order.get(b.catalogId) ?? 0),
  );
  const tiers = ([1, 2, 3] as const)
    .map((priority) => ({
      priority,
      label: PRIORITY[priority].label,
      note: PRIORITY[priority].note,
      rows: everyRow.filter((row) => catalogFor(row.fieldKey)?.priority === priority),
    }))
    // GOV.UK's task list: a group with nothing in it renders nothing at all.
    .filter((tier) => tier.rows.length > 0);
  /** Built once for the part, not once per row: one row's options are her own
   *  answers to another, and a radio with nothing on it cannot be answered. */
  const record = recordLookup(data.fields);

  /** Say yes or no to something a channel proposed. Both endpoints answer with
   *  the whole payload, so one response moves the row, the rail and the counts.
   *
   *  A REFUSED ANSWER IS SAID OUT LOUD. This used to drop the outcome: the card
   *  stopped being busy, the proposal stayed where it was, and she was told
   *  nothing. `answerFailureMessage` turns the route's named reason into her
   *  sentence, so no machine word reaches the screen.
   *
   *  `picked` is the items she kept where the row asked her to choose. It goes
   *  out through `confirmProposal`, which owns the body. */
  async function answerProposal(
    proposalId: string,
    yes: boolean,
    picked?: string[],
  ): Promise<void> {
    setBusyKey(proposalId);
    setFailure(null);
    setProposalFailure(null);
    const outcome = yes
      ? await confirmProposal(locationId, proposalId, picked)
      : await rejectProposal(locationId, proposalId);
    if (outcome.ok) setPayload(outcome.payload);
    else setProposalFailure({ proposalId, message: answerFailureMessage(outcome.message) });
    setBusyKey(null);
  }

  /* THE OPEN PROPOSALS FOR THIS PART, BY THE ROW THEY BELONG TO.
     One per row: if a channel has proposed twice for the same question the
     newest is the live one, and `payload.proposals` arrives newest first. */
  const proposalByKey = new Map<string, (typeof data.proposals)[number]>();
  for (const proposal of data.proposals) {
    if (proposal.part !== part) continue;
    if (!proposalByKey.has(proposal.fieldKey)) proposalByKey.set(proposal.fieldKey, proposal);
  }

  /** One row, live. Held and open rows are the same row — only the state differs. */
  const rowFor = (field: RecordFieldPayload): ReactElement => {
    // Read once. The row needs the proposal itself for three of its props, and
    // a second lookup per prop is how one of them comes to name another row.
    const proposal = proposalByKey.get(field.fieldKey);
    return (
      <Row
        key={field.fieldKey}
        field={field}
        record={record}
        // Busy on either key: answering a proposal is keyed by the proposal's id,
        // and it is this row that must show it working.
        busy={busyKey === field.fieldKey || busyKey === proposal?.id}
        error={failure?.fieldKey === field.fieldKey ? failure.message : null}
        onSave={(value) => save(field.fieldKey, value)}
        // THE CONFIRM LIVES ON THE ROW IT BELONGS TO. Without it a row we filled
        // in for her offered only "open the editor and retype it", which is the
        // whole cost of the question with none of the benefit.
        onConfirm={() => void confirm(field.fieldKey)}
        // A document row is answered by sending a file. What comes back is saved
        // through `onSave` above, so the record, the rail and the counts all move
        // down the one path a typed answer takes (F17).
        onUpload={(file) => uploadDocument(locationId, field.fieldKey, file)}
        // Answered HERE, on the row that asks the question — the queue that used
        // to hold these is gone, and without this they are written, counted on
        // the rail, and unreachable.
        proposal={proposal}
        onAcceptProposal={
          proposal ? (picked) => void answerProposal(proposal.id, true, picked) : undefined
        }
        onRejectProposal={proposal ? () => void answerProposal(proposal.id, false) : undefined}
        // Why her last yes or no did not land, under the buttons she pressed.
        proposalError={
          proposal && proposalFailure?.proposalId === proposal.id ? proposalFailure.message : null
        }
      />
    );
  };

  return (
    <>
      {everyRow.length > 0 ? (
        <div className="mb-secs">
          {tiers.map((tier) => (
              <section className="mb-fsec" key={tier.priority}>
                {/* Priority is a heading, never a per-row badge — it explains
                    why a question matters instead of pricing it. */}
                <header className="mb-fsec__head">
                  <h3 className="mb-fsec__h">{tier.label}</h3>
                  <p className="mb-fsec__note">{tier.note}</p>
                </header>
                {/* ONE LIST PER TIER, AND NO BOX INSIDE THE BOX. The tier-3
                    section used to split its rows again — the ones also asked
                    before the first call in the open list, the rest in a
                    bordered `.mb-tier--extra` inset. On "Your legal details"
                    that meant Website sat flush in the card and "Your title"
                    and "Doing business as" sat in a framed box below it, under
                    a heading already saying "Extra, when you have time". The
                    split predates these tier sections, which now carry the
                    distinction in their own heading. */}
                <div className="mb-fsec__body">
                  {tier.rows.length > 0 ? <SummaryList>{tier.rows.map(rowFor)}</SummaryList> : null}
                  {/* F19. The photo and the logo — the two rows no
                      `ProfileField` backs, so `rowsIn` leaves them out. They
                      belong to whichever tier the catalog files them under,
                      which is this one. */}
                  {tier.priority === 3 ? (
                    <MediaUploads locationId={locationId} part={part} />
                  ) : null}
                </div>
              </section>
          ))}
        </div>
      ) : null}

    </>
  );
}
