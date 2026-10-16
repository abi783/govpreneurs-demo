import { useState } from "react";
import { Check } from "lucide-react";
import { answerProfileAsk, type ProfileAsk, type FactProvenance } from "../../lib/hunterChat";
import type { ElicitShape } from "../../lib/enrichment";
import { closedSetFor } from "../../lib/askOptions";
import { ClosedSetAsk } from "./ClosedSetAsk";
import { ProjectListBuilder, parseProjects } from "./ProjectListBuilder";
import { stripInvisible } from "../../lib/displayText";
import { boundedList, MAX_RANGE_BANDS } from "../../lib/renderLimits";

/** Sentinel answer meaning "I don't know" — writes nothing server-side (#5).
 *  Mirrors the backend `NOT_SURE` in elicitation.service.ts. */
const NOT_SURE = "not_sure";

/** Optional answer routing. When supplied (e.g. the enrichment journey, #6), a
 *  confirmed value goes to `answer` and a "not sure"/"Later" escape goes to `skip`
 *  (skip is sacred) instead of the default `/hunter-chat/profile/answer` path. */
export interface ProfileAskHandlers {
  answer: (input: {
    field: string;
    value: string;
    documentUrl?: string;
    freeText?: boolean;
    /** `{ written: false }` — the text was routed elsewhere (e.g. a question sent
     *  to chat) and nothing was saved, so the ask must stay actionable. */
  }) => Promise<{ written: boolean } | void>;
  skip: (field: string) => Promise<void>;
}

/** A plain-English provenance line for a signal-backed proposal — the visible
 *  evidence that lets a value appear at all (#5). Every branch returns: a source
 *  outside the union used to fall off the end and render an EMPTY stamp beside a
 *  value that still had a Confirm button, which is the one thing #5's honest-ask
 *  contract forbids. */
function provenanceLabel(p: FactProvenance): string {
  switch (p.source) {
    case "signal":
      return p.signal ? `Inferred from ${p.signal}` : "Inferred from a signal";
    case "document":
      return "From a document on file";
    case "success_center":
      return "From your Success Center profile";
    case "member_stated":
      return "From what you told us";
    default:
      return "From an unrecognised source";
  }
}

/** An open ask: a plain prompt with NO pre-filled default. */
/** The card's "move on" control. It sits in the SAME row as the shape's primary
 *  button, because skipping is the other thing a member can do with the question
 *  in front of them — as a link under the card it read as fine print.
 *
 *  Every shape passes its own `onSubmit`, so skipping stays exactly what it has
 *  always been: `NOT_SURE`, which writes nothing and is never re-asked. */
function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      className="hunter-learn__btn hunter-learn__btn--skip"
      onClick={onSkip}
      title="Move on — nothing is written, and this is not asked again"
    >
      Skip
    </button>
  );
}

function OpenAsk({
  ask,
  value,
  setValue,
  onSubmit,
}: {
  ask: ProfileAsk;
  value: string;
  setValue: (v: string) => void;
  onSubmit: (value: string) => void;
}) {
  return (
    <div className="hunter-learn__actions">
      <input
        type="text"
        className="hunter-learn__input"
        placeholder="Type your answer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={ask.label}
      />
      <button
        type="button"
        className="hunter-learn__btn hunter-learn__btn--primary"
        disabled={!value.trim()}
        onClick={() => onSubmit(value.trim())}
      >
        Save
      </button>
      <SkipButton onSkip={() => onSubmit(NOT_SURE)} />
    </div>
  );
}

/** A confirm ask: shows the signal-backed value + its provenance, or (with NO
 *  proposal, or once the member picks "Change") an open prompt — never a
 *  fabricated default. */
function ConfirmAsk({ ask, onSubmit }: { ask: ProfileAsk; onSubmit: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  if (!ask.proposal || editing) {
    return <OpenAsk ask={ask} value={draft} setValue={setDraft} onSubmit={onSubmit} />;
  }
  const { value, provenance } = ask.proposal;
  // Confirm is an ATTESTATION: the member is agreeing to the string in front of
  // them. A bidi override or a zero-width joiner makes the rendered string and
  // the stored one differ, so what is displayed is what is submitted — and it is
  // isolated (`<bdi>`) so a strong-RTL run cannot re-order the card around it.
  const shown = stripInvisible(value);
  return (
    <>
      <div className="hunter-learn__conflict-body">
        <bdi className="hunter-learn__new">{shown}</bdi>
      </div>
      <div className="hunter-msg-stamp">{provenanceLabel(provenance)}</div>
      <div className="hunter-learn__actions">
        <button
          type="button"
          className="hunter-learn__btn hunter-learn__btn--primary"
          onClick={() => onSubmit(shown)}
        >
          Confirm
        </button>
        <button type="button" className="hunter-learn__btn" onClick={() => setEditing(true)}>
          Change
        </button>
        <SkipButton onSkip={() => onSubmit(NOT_SURE)} />
      </div>
    </>
  );
}

/** A paragraph ask: a free-text textarea for a longer, unstructured answer
 *  (e.g. a capability summary) — no "not sure" escape. `initialValue` prefills
 *  the textarea with a synthesized draft (F1) or a prior thin answer to expand
 *  (F2) — the member confirms/edits/extends before Save. */
function ParagraphAsk({
  ask,
  onSubmit,
  initialValue,
}: {
  ask: ProfileAsk;
  onSubmit: (value: string) => void;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  return (
    <div className="hunter-learn__actions">
      <textarea
        className="hunter-learn__textarea"
        placeholder="Type your answer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={ask.label}
      />
      <button
        type="button"
        className="hunter-learn__btn hunter-learn__btn--primary"
        disabled={!value.trim()}
        onClick={() => onSubmit(value.trim())}
      >
        Save
      </button>
      <SkipButton onSkip={() => onSubmit(NOT_SURE)} />
    </div>
  );
}

/** A range ask: selectable bands + a "not sure" escape. No pre-selected default.
 *  `bands` is server-supplied, and a range ask is a CHOICE — past
 *  {@link MAX_RANGE_BANDS} it is not a choosable set, so the list is bounded
 *  rather than rendering one button per array entry.
 *
 *  The bands are the ONE closed set the server itself supplies, so they render
 *  as the same amber pills the dock's suggestion row uses: picking one is the
 *  answer, exactly as it is for a suggestion. */
function RangeAsk({ ask, onSubmit }: { ask: ProfileAsk; onSubmit: (value: string) => void }) {
  const bands = boundedList(ask.bands ?? [], MAX_RANGE_BANDS);
  return (
    <div className="hunter-ask__chips">
      {bands.shown.map((band) => (
        <button
          key={band}
          type="button"
          className="hunter-suggestion-chip"
          onClick={() => onSubmit(band)}
        >
          {band}
        </button>
      ))}
      {ask.allowNotSure && (
        <button type="button" className="hunter-suggestion-chip" onClick={() => onSubmit(NOT_SURE)}>
          Not sure
        </button>
      )}
      {bands.hidden > 0 && (
        <span className="hunter-msg-stamp">and {bands.hidden} more not shown</span>
      )}
      <SkipButton onSkip={() => onSubmit(NOT_SURE)} />
    </div>
  );
}

/** A doc ask: use the on-file document, provide a link, or defer.
 *
 *  "Use the one on file" NAMES the document and submits no URL. It used to send
 *  the stored `documentUrl` straight back as the member's own answer while never
 *  showing it — a one-click path from a poisoned stored URL to a member-attested
 *  write, and a member cannot attest to what they were never shown. Confirming
 *  the document already on file needs no URL from the client: the server holds
 *  it, and "yes, that one" is the whole answer. */
function DocAsk({
  ask,
  onSubmit,
}: {
  ask: ProfileAsk;
  onSubmit: (value: string, documentUrl?: string) => void;
}) {
  const [url, setUrl] = useState("");
  const onFile = ask.proposal?.provenance.documentUrl;
  const onFileName = ask.proposal?.value;
  return (
    <>
      {onFile && (
        <div className="hunter-learn__actions">
          {onFileName && <span className="hunter-learn__onfile">{stripInvisible(onFileName)}</span>}
          <button
            type="button"
            className="hunter-learn__btn hunter-learn__btn--primary"
            onClick={() => onSubmit(ask.label)}
          >
            Use the one on file
          </button>
        </div>
      )}
      <div className="hunter-learn__actions">
        <input
          type="url"
          className="hunter-learn__input"
          placeholder="Paste a document link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label={`${ask.label} document link`}
        />
        <button
          type="button"
          className="hunter-learn__btn hunter-learn__btn--primary"
          disabled={!url.trim()}
          onClick={() => onSubmit(ask.label, url.trim())}
        >
          Upload
        </button>
        <button type="button" className="hunter-learn__btn" onClick={() => onSubmit(NOT_SURE)}>
          Later
        </button>
        <SkipButton onSkip={() => onSubmit(NOT_SURE)} />
      </div>
    </>
  );
}

/** One honest ask card — owns the submit + done state, delegates rendering to the
 *  per-kind body. A "not sure"/"Later" answer writes nothing server-side (#5).
 *  `elicitShape` (enrichment journey only) routes multi_select/list/project_list/
 *  paragraph fields to their dedicated builders instead of the plain `askType`
 *  rendering. */
function ProfileAskCard({
  ask,
  handlers,
  elicitShape,
  initialValue,
  onAskHunter,
  onBack,
  onFinishLater,
}: {
  ask: ProfileAsk;
  handlers?: ProfileAskHandlers;
  elicitShape?: ElicitShape;
  initialValue?: string;
  onAskHunter?: (question: string) => void;
  onBack?: () => void;
  /** Close the whole builder and keep the member's place. Optional: an ask
   *  rendered outside the enrichment journey has no builder to close. */
  onFinishLater?: () => void;
}) {
  const [openValue, setOpenValue] = useState("");
  const [done, setDone] = useState<string | null>(null);
  // A save is several seconds (it re-scores matches for the payoff delta), so the
  // ask MUST show it is working — otherwise the click reads as dead. Also guards
  // against double-submits while the request is in flight.
  const [busy, setBusy] = useState(false);

  // The two bodies rendered by components outside this file. They own their own
  // action rows and cannot host a `SkipButton`, so the card keeps supplying the
  // escape for them. Mirrors the first two branches of `AskBody` — if a shape
  // moves in or out of that pair, this must move with it.
  const bodyHasNoSkip =
    (elicitShape === "multi_select" && closedSetFor(ask.field) != null) ||
    elicitShape === "project_list";

  const submit = async (value: string, documentUrl?: string, opts?: { freeText?: boolean }) => {
    if (busy) return;
    setBusy(true);
    try {
      if (handlers) {
        if (value === NOT_SURE) await handlers.skip(ask.field);
        else {
          const outcome = await handlers.answer({
            field: ask.field,
            value,
            documentUrl,
            freeText: opts?.freeText,
          });
          // Nothing was saved (the text went to chat as a question) — leave the ask
          // open and editable rather than claiming "Saved:" over a refused write.
          if (outcome && outcome.written === false) return;
        }
      } else {
        await answerProfileAsk({ askId: ask.id, field: ask.field, value, documentUrl });
      }
    } catch (err) {
      console.warn("Failed to answer profile ask:", err);
      return; // leave the ask actionable so the member can retry
    } finally {
      // Cleared on failure too, so a failed save stays retryable.
      setBusy(false);
    }
    setDone(value === NOT_SURE ? "Skipped — no guess saved" : `Saved: ${value}`);
  };

  // The ask is one of Hunter's TURNS, not a form parked in the thread: it sits in
  // the same `from-hunter` row every reply uses, and the head names the question
  // above whatever body collects the answer. The prototype's `__why` and `__hint`
  // slots have no server source — `/enrichment/next` sends question, label,
  // askType, bands and an optional proposal, and nothing else — so neither is
  // rendered rather than filled with copy we made up.
  return (
    <div className="hunter-msg-row from-hunter">
      <div className="hunter-ask" role="group" aria-label={ask.question}>
        <div className="hunter-ask__head">
          <div className="hunter-ask__title">{ask.question}</div>
        </div>
        {done ? (
          <div className="hunter-learn__done">
            <Check size={12} aria-hidden />
            {done}
          </div>
        ) : (
          <div className={busy ? "hunter-learn__pending" : undefined} aria-busy={busy || undefined}>
            <AskBody
              ask={ask}
              submit={submit}
              openValue={openValue}
              setOpenValue={setOpenValue}
              elicitShape={elicitShape}
              initialValue={initialValue}
            />
            {!busy && (
              <div className="hunter-learn__escapes">
                {/* Step back to the card before this one, re-offered pre-filled so a
                    wrong answer can be corrected. Only rendered when there IS one
                    behind us (`canGoBack`), and it edits rather than undoes —
                    nothing already saved is removed until it is replaced. */}
                {onBack && (
                  <button type="button" className="hunter-ask__skip" onClick={onBack}>
                    Back
                  </button>
                )}
                {/* Asking IS possible (the composer is live and the journey survives
                    a chat turn) — but nothing said so, and members typed the question
                    into the answer box instead, which used to corrupt the profile. */}
                {onAskHunter && (
                  <button
                    type="button"
                    className="hunter-ask__skip"
                    onClick={() => onAskHunter(`What do you mean by "${ask.label}"?`)}
                    title="Ask Hunter what this question means"
                  >
                    Help?
                  </button>
                )}
                {/* EVERY shape gets a skip, with no exceptions — but most now
                    render it themselves, beside their own primary button. The
                    two bodies that come from OTHER components cannot, so the
                    card still supplies one for them.

                    Range and doc asks DO get one of their own, beside their
                    other controls. "Not sure" is an answer among the bands and
                    "Later" defers the document; neither is "move past this
                    question", which is why those cards carry both. */}
                {bodyHasNoSkip && (
                  <button
                    type="button"
                    className="hunter-ask__skip"
                    onClick={() => void submit(NOT_SURE)}
                    title="Move on — nothing is written, and this is not asked again"
                  >
                    Skip
                  </button>
                )}
                {/* Leaving the whole builder, not this one question — so it sits
                    LAST, and the stylesheet pushes it to the far end of the row:
                    the two escapes before it stay inside the journey, this one
                    leaves it. Nothing is discarded, which is why the word is
                    "later" and not "close". */}
                {onFinishLater && (
                  <button
                    type="button"
                    className="hunter-ask__skip"
                    onClick={onFinishLater}
                    title="Your answers are saved — pick this up whenever you like"
                  >
                    Finish later
                  </button>
                )}
              </div>
            )}
            {busy && (
              <div className="hunter-learn__saving" role="status">
                <span className="stream-dot" />
                <span className="stream-dot" style={{ animationDelay: "0.2s" }} />
                <span className="stream-dot" style={{ animationDelay: "0.4s" }} />
                Saving…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Routes an ask to the right per-kind body (keeps ProfileAskCard simple).
 *  `elicitShape` takes precedence for multi_select/list/project_list/paragraph fields; every
 *  other shape (including no shape at all, e.g. the adaptive follow-up) falls
 *  back to the existing `askType` rendering. `initialValue` seeds the shaped
 *  body with a synthesized draft (F1) or the member's prior answer to a
 *  now-being-followed-up-on field (F2) — never a replacement, an extension. */
function AskBody({
  ask,
  submit,
  openValue,
  setOpenValue,
  elicitShape,
  initialValue,
}: {
  ask: ProfileAsk;
  submit: (value: string, documentUrl?: string, opts?: { freeText?: boolean }) => void;
  openValue: string;
  setOpenValue: (v: string) => void;
  elicitShape?: ElicitShape;
  initialValue?: string;
}) {
  // A closed set of values (states, set-asides, NAICS) — a picker, never a text
  // box: those tokens are matched EXACTLY by the backend gates, so a typo is
  // invisible ("North Carolin" reads fine and returns no North Carolina work).
  // A field with no catalog on the client falls through to free text rather than
  // rendering an empty picker the member cannot answer.
  if (elicitShape === "multi_select" && closedSetFor(ask.field)) {
    return <ClosedSetAsk ask={ask} initialValue={initialValue} onSubmit={(v) => submit(v)} />;
  }
  // List fields take free-form input like everything else: a member should be able
  // to answer however they naturally would — "we do X, Y and Z" or a bare list —
  // instead of being forced through an add-an-item builder. The value is always
  // prose from here, so it is flagged freeText and the backend normalizes it into
  // the comma-list shape the embedding expects.
  if (elicitShape === "list") {
    return (
      <ParagraphAsk
        ask={ask}
        initialValue={initialValue}
        onSubmit={(v) => submit(v, undefined, { freeText: true })}
      />
    );
  }
  if (elicitShape === "project_list") {
    const initialProjects = initialValue ? parseProjects(initialValue) : undefined;
    return (
      <ProjectListBuilder ask={ask} initialProjects={initialProjects} onSubmit={(v) => submit(v)} />
    );
  }
  if (elicitShape === "paragraph")
    return <ParagraphAsk ask={ask} initialValue={initialValue} onSubmit={(v) => submit(v)} />;

  switch (ask.askType) {
    case "range":
      return <RangeAsk ask={ask} onSubmit={(v) => submit(v)} />;
    case "doc":
      return <DocAsk ask={ask} onSubmit={(v, u) => submit(v, u)} />;
    case "confirm":
      return <ConfirmAsk ask={ask} onSubmit={(v) => submit(v)} />;
    default:
      return (
        <OpenAsk ask={ask} value={openValue} setValue={setOpenValue} onSubmit={(v) => submit(v)} />
      );
  }
}

/** Renders the honest profile questions (#5) under a hunter reply. Each ask is
 *  confirm / range / doc / open; a confirm/open ask never shows a fabricated
 *  default — a value appears only with visible provenance. `elicitShape` (the
 *  enrichment journey's single current ask, #6) additionally routes
 *  list/project_list/paragraph fields to their dedicated builders.
 *  `initialValue` seeds that builder with a synthesized draft (F1) or the
 *  member's prior thin answer (F2) instead of starting blank. */
export function ProfileAskBlock({
  asks,
  handlers,
  elicitShape,
  initialValue,
  onAskHunter,
  onBack,
  onFinishLater,
}: {
  asks: ProfileAsk[];
  handlers?: ProfileAskHandlers;
  elicitShape?: ElicitShape;
  initialValue?: string;
  /** Ask Hunter what the question means, as a normal chat turn. */
  onAskHunter?: (question: string) => void;
  /** Step back one card (enrichment journey). Omitted when there is none. */
  onBack?: () => void;
  /** Close the whole builder and keep the member's place. Optional: an ask
   *  rendered outside the enrichment journey has no builder to close. */
  onFinishLater?: () => void;
}) {
  return (
    <div className="hunter-learn">
      {asks.map((ask) => (
        <ProfileAskCard
          key={ask.id}
          onAskHunter={onAskHunter}
          onBack={onBack}
          onFinishLater={onFinishLater}
          ask={ask}
          handlers={handlers}
          elicitShape={elicitShape}
          initialValue={initialValue}
        />
      ))}
    </div>
  );
}
