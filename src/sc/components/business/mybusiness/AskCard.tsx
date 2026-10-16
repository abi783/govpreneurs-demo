/**
 * One question, and a decline that sticks.
 *
 * ONE ASK PER VISIT — once she has answered or declined, the card is gone for
 * the rest of the visit, never replaced by the next one. Which question, and
 * whether there is one, is `nextAsk`, tested there.
 *
 * THE DECLINE IS PERMANENT. `POST …/[fieldKey]/decline` stamps `declinedAt` and
 * answers with the whole payload. Answering the field later clears it —
 * answering IS revoking.
 *
 * DECLINE IS NEVER OFFERED ON DIANA'S FOURTEEN, twice over: `nextAsk` never
 * returns one and the control renders only when `field.intake` is false. A
 * declined required field would strand the counter at 13 of 14 forever. The
 * endpoint 400s too, but the server is the last guard, not the only one.
 *
 * It only asks once `handoff.mode === "sent"`: one question at a time enriches
 * a record that exists; it is not how a form someone came to fill gets filled.
 *
 * Not a queue item — `queue.ts` does not count a `missing` field, so nothing
 * here is counted, badged or added to the rail.
 */

"use client";

import { useState, type ReactElement } from "react";
import { nextAsk } from "@sc/lib/businessProfile/nextAsk";
import { ControlFor } from "../controls";
import { useRecord } from "./RecordStore";
import { saveField } from "./recordApi";
import { call, type Outcome } from "./request";
import "./mybusiness.css";

/** The promise the card makes, and the reason the decline can be permanent. */
const ONCE = "Answer this once and we will not ask you again.";
/** Not "not now" — the decline is for good, so it has to read that way. */
const DECLINE_LABEL = "Do not ask me this again";
const DECLINE_MESSAGE = "That did not save. We will stop asking once it does.";
/** The one mode this card belongs in; see the header. */
const HANDED_OVER = "sent";

export interface AskCardProps {
  locationId: string;
}

/** The one question we ask her this visit, or nothing at all. */
export function AskCard({ locationId }: AskCardProps): ReactElement | null {
  /** The record the rail is counting — held above this card, not beside it. */
  const { payload: data, setPayload } = useRecord();
  /** Answered or declined this visit. One ask per visit: see the header. */
  const [asked, setAsked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = data.handoff.mode === HANDED_OVER ? nextAsk({ fields: data.fields, asked }) : null;
  if (!ask) return null;

  /**
   * One request, and then the asking ends for this visit.
   *
   * Both answers land the same way: the response IS the whole record (F7), so
   * one state update moves the rail, the counts and the rows below. A request
   * that does not land says so and leaves the question where it is — the visit
   * only ends on something that actually happened.
   */
  async function settle(request: Promise<Outcome>): Promise<void> {
    setBusy(true);
    setError(null);
    const outcome = await request;
    if (outcome.ok) {
      setPayload(outcome.payload);
      setAsked(true);
    } else setError(outcome.message);
    setBusy(false);
  }

  const declineUrl = `/api/portal/${locationId}/business-profile/${ask.fieldKey}/decline`;

  return (
    <section className="mb-ask" aria-labelledby="mb-ask-h">
      {/* The question in the catalog's own words — never the stored key, and
          never a label she has to translate into a question herself. */}
      <h2 className="mb-ask__q" id="mb-ask-h">
        {ask.question}
      </h2>
      <p className="mb-ask__note">{ONCE}</p>

      {/* THE SAME control `/intake` uses, chosen by `rowEditor` — the seam the
          record's own rows are edited through, not a third editing path. */}
      <ControlFor
        field={ask.editor.control}
        initialValue={ask.editor.initialValue}
        onSave={(value) => void settle(saveField(locationId, ask.fieldKey, value))}
        saving={busy}
      />

      {/* NEVER on one of the fourteen. `nextAsk` already excludes them; this is
          the guard that makes the control unrenderable rather than merely
          unreachable. */}
      {ask.field.intake ? null : (
        <div className="mb-ask__acts">
          <button
            type="button"
            className="gpds-btn-ghost mb-btn"
            disabled={busy}
            onClick={() => void settle(call(declineUrl, { method: "POST" }, DECLINE_MESSAGE))}
          >
            {DECLINE_LABEL}
          </button>
        </div>
      )}

      {error ? (
        <p className="mb-note" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
