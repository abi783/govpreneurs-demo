/**
 * The one piece of paperwork everything else waits on.
 *
 * It takes the file itself: the same upload the `doc_llc_paperwork` row on
 * "What you sell" opens — one `uploadDocument`, one endpoint, one
 * `MemberDocument`, one `llcUploadedAt` stamp. The card is a shortcut to that
 * row, not a rival to it, and `/tasks`' "Upload your LLC paperwork" step
 * deep-links here. The roadmap link stays on the answer that needs it: she
 * cannot upload paperwork for a company she has not formed.
 *
 * Since 2026-09-03 the upload also feeds the ROADMAP: the endpoint runs the
 * same Articles-of-Organization check the roadmap's own upload runs, and this
 * card carries the last step that check needs — reviewing what was read off
 * the document and confirming it. Under the cohort lock this page is the only
 * one a new member can reach, so without that step her roadmap's LLC item
 * could never complete.
 *
 * "I do not have one yet" is an answer, not a dismissal — held for the visit
 * and stored nowhere. There is no key for it, and inventing one would put a
 * fact on the record she was never asked to confirm.
 *
 * Nothing here is red and nothing is a badge: not having an LLC yet is the
 * ordinary starting position for this cohort, not a failure state.
 */

"use client";

import { useRef, useState, type ReactElement } from "react";
import { CheckIcon } from "@sc/components/portal/tasks/Icon";
import { useRecord } from "./RecordStore";
import { uploadDocument } from "./documentApi";
import { saveField } from "./recordApi";
import "./mybusiness.css";

const TITLE = "Your LLC paperwork";
const BODY =
  "Articles of Organization, certificate of formation, or the filing receipt. We keep it on file for your mentor.";
const ON_FILE = "On file. Your mentor can read it before the call.";
const VERIFIED =
  "On file and verified — this is checked off on your roadmap too.";
const NOT_YET =
  "Noted — forming the company is the first thing on your roadmap, and nothing here waits on it.";
const ROADMAP_LABEL = "Go to my roadmap";
const UPLOAD_LABEL = "Upload it";
const REPLACE_LABEL = "Upload a different document";
/** The upload now includes the document check, so it takes a few seconds. */
const SENDING_LABEL = "Checking your document…";
const CONFIRM_LABEL = "Yes, that's my business — confirm";
const CONFIRMING_LABEL = "Confirming…";
/** The row this card is a shortcut to — the same one "What you sell" holds. */
const LLC_KEY = "doc_llc_paperwork";

export interface LlcCardProps {
  locationId: string;
  /** The roadmap's entity-registration step, as GHL addresses it. */
  roadmapHref: string;
}

/** Where her formation paperwork stands, and one of the two places it goes. */
export function LlcCard({ locationId, roadmapHref }: LlcCardProps): ReactElement {
  const { payload, setPayload, mergePayload } = useRecord();
  /** Held for the visit only — see the header. */
  const [notYet, setNotYet] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const onFile = payload.onboarding.llcUploadedAt !== null;
  const v = payload.onboarding.llcVerification;
  const needsConfirm = v?.status === "needs_input" && v.requiresConfirmation;
  const verified = v?.status === "pass";
  const failed = v?.status === "fail";

  /** Store the file, then record it on its row — the same two steps the row's
   *  own control takes, so the card and the row cannot end up disagreeing.
   *  The save answers with the whole record — `llcUploadedAt` AND the fresh
   *  `llcVerification` — so this card and the rail move together. */
  async function send(file: File): Promise<void> {
    setSending(true);
    setError(null);
    const stored = await uploadDocument(locationId, LLC_KEY, file);
    const outcome = stored.ok ? await saveField(locationId, LLC_KEY, stored.file) : stored;
    setSending(false);
    if (outcome.ok) setPayload(outcome.payload);
    else setError(outcome.message);
  }

  /** The member reviewed what the check read off her document and says it is
   *  hers — the same confirm the roadmap's panel posts, one row either way. */
  async function confirm(): Promise<void> {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${locationId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validationKey: "llc", action: "confirm" }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(json?.error ?? `That did not save (HTTP ${res.status}). Please try again.`);
        return;
      }
      mergePayload((cur) => ({
        ...cur,
        onboarding: {
          ...cur.onboarding,
          llcVerification: v
            ? { ...v, status: "pass", requiresConfirmation: false }
            : { status: "pass", message: null, requiresConfirmation: false, legalName: null },
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirming(false);
    }
  }

  const uploadControls = (replace: boolean) => (
    <div className="mb-llc__acts">
      <input
        ref={picker}
        type="file"
        className="hidden"
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          if (chosen) void send(chosen);
        }}
      />
      <button
        type="button"
        className={replace ? "gpds-btn-ghost mb-btn" : "gpds-btn mb-btn"}
        disabled={sending || confirming}
        onClick={() => picker.current?.click()}
      >
        {sending ? SENDING_LABEL : replace ? REPLACE_LABEL : UPLOAD_LABEL}
      </button>
      {!replace && (
        <button type="button" className="gpds-btn-ghost mb-btn" onClick={() => setNotYet(true)}>
          I do not have an LLC yet
        </button>
      )}
    </div>
  );

  return (
    <section className="mb-llc" aria-labelledby="mb-llc-h">
      <h2 className="mb-llc__h" id="mb-llc-h">
        {TITLE}
      </h2>
      {needsConfirm && v ? (
        <div className="mb-llc__review">
          <p className="mb-llc__body">
            {v.message ?? "Please review and confirm the information we found in your document."}
          </p>
          {v.legalName ? (
            <p className="mb-llc__fact">
              <span className="mb-llc__fact-k">Name on the document</span>
              <span className="mb-llc__fact-v">{v.legalName}</span>
            </p>
          ) : null}
          <div className="mb-llc__acts">
            <button
              type="button"
              className="gpds-btn mb-btn"
              disabled={confirming || sending}
              onClick={() => void confirm()}
            >
              {confirming ? CONFIRMING_LABEL : CONFIRM_LABEL}
            </button>
          </div>
          {uploadControls(true)}
        </div>
      ) : verified ? (
        <p className="mb-llc__done">
          <CheckIcon className="mb-llc__tick" />
          {VERIFIED}
        </p>
      ) : failed && v ? (
        <>
          <p className="mb-llc__body">
            {v.message ?? "We could not read that document — a clearer scan usually does it."}
          </p>
          {uploadControls(true)}
        </>
      ) : onFile ? (
        <p className="mb-llc__done">
          <CheckIcon className="mb-llc__tick" />
          {ON_FILE}
        </p>
      ) : notYet ? (
        <p className="mb-llc__body">
          {NOT_YET}{" "}
          {/* DEMO: stays in the app (no target="_top"). */}
          <a className="mb-llc__undo" href={roadmapHref}>
            {ROADMAP_LABEL}
          </a>{" "}
          <button type="button" className="mb-llc__undo" onClick={() => setNotYet(false)}>
            I have it after all
          </button>
        </p>
      ) : (
        <>
          <p className="mb-llc__body">{BODY}</p>
          {uploadControls(false)}
        </>
      )}
      {/* Never red: a failed upload is ours, not hers, and nothing here
          waits on it — she can type her answers instead. */}
      {error ? <p className="mb-llc__body">{error}</p> : null}
    </section>
  );
}
