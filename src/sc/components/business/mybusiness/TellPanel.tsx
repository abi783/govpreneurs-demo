/**
 * Say everything at once, then check what was understood.
 *
 * A destination at `/[locationId]/business/tell`, not a side panel and not an
 * external link: what she says has to become proposals in HER record.
 *
 * IT DECIDES NOTHING. What her words become is `tellExtract.ts`/`tellModel.ts`;
 * what may enter the queue is the shared drop matrix run by `planTell`.
 *
 * NOTHING SAID HERE LANDS IN THE RECORD. The route creates `open` proposals
 * only. She confirms each fact one at a time: on its item in the review below,
 * or on the record row that the fact answers. This screen has no control that
 * accepts several facts at once and must never grow one — a button that accepts
 * nine facts at once accepts nothing.
 *
 * AND IT NEVER SILENTLY EATS WHAT SHE SAID. The review accounts for every
 * sentence: queued, deliberately left alone with the reason, or not understood.
 *
 * Typing and speaking share the same box: dictation (`useDictation`) fills the
 * textarea and she reads it before submitting, because the extractor quotes her
 * characters back as evidence and Whisper hallucinates on non-speech. The audio
 * is never stored.
 *
 * The route answers with the whole payload plus its account of the submission,
 * so one `setPayload` moves the rail while the review renders.
 */

"use client";

import Link from "next/link";
import { useCallback, useState, type ReactElement } from "react";
import { catalogFor } from "@sc/lib/businessProfile/catalog";
import { formatFieldValue } from "@sc/lib/businessProfile/formatValue";
import type { MyBusinessPayload } from "@sc/lib/businessProfile/payload";
import { KEEP_THESE, answerFailureMessage, proposalChoice } from "@sc/lib/businessProfile/proposalAnswer";
import { canConfirm, orderedPick } from "@sc/lib/businessProfile/subsetConfirm";
import { labelFor } from "@sc/lib/businessProfile/recordView";
import {
  TELL_DROP_NOTE,
  TELL_MAX_CHARS,
  type TellDrop,
  type TellPlan,
  type TellProposal,
} from "@sc/lib/businessProfile/tell";
import { CONTROL_INPUT } from "../controlStyles";
import { ItemPicker } from "./ItemPicker";
import { useRecord } from "./RecordStore";
import { LONG_RECORDING_SECONDS, useDictation } from "./useDictation";
import { call } from "./request";
import { confirmProposal, rejectProposal } from "./recordApi";
import { ACTION_LABEL } from "@sc/lib/businessProfile/rowContract";
import "./mybusiness.css";

/** The one route on this family that answers with more than the record. */
type TellResponse = MyBusinessPayload & { tell: TellPlan };

const PROMPT = "Say everything at once. Take as long as you like.";
const HELPER =
  "What you sell, who you sell it to, what you drive, how long you can wait to be paid. Anything at all.";
const SEND = "Write this down";
const AGAIN = "Say something else";
const SEND_MESSAGE = "That did not send. Nothing was lost — you can try again.";
/* TWO DIFFERENT ANSWERS THAT LOOKED LIKE ONE. Both used to print "I did not
   understand any of it", because both leave no proposal — but "nothing was
   understood" and "everything was understood and none of it was new" are
   opposite outcomes, and the second was calling itself the first directly above
   a list of five facts it had just read correctly. She would reasonably
   conclude the feature was broken. */
const NOTHING_UNDERSTOOD = "I did not understand any of it.";
const NOTHING_NEW = "I understood all of this — none of it is new to your record.";
/* WHERE THEY ACTUALLY ARE. This read "waiting for you in what needs you" —
   the screen that held them, which no longer exists. They are on the row that
   asks the question now, so the sentence says so. */
const WAITING =
  "Each of these is waiting on the question it answers, in your record. Nothing is on your record until you say yes to it.";
const LEFTOVER_NOTE =
  "None of this went anywhere. You can say it again in other words, or write it into your record yourself.";
const UPLOAD_HEADING = "These need you, not words";
/* SHE WAS UNDERSTOOD. That is the whole point of separating this from "What I
   did not understand" — saying "my insurance is at xyz.com" is perfectly clear,
   and the answer is that a certificate is a file and not a sentence. Putting it
   in the leftovers told her she had been unclear, which was untrue and left her
   with nothing to do. */
const UPLOAD_NOTE =
  "I understood these. They are just not things a sentence can settle — each one says what it needs.";
const SENT_HEADING = "What you sent me";
/* Named for what it does rather than where it goes — "what needs you" was a
   screen and is not one any more. */
const ANSWER_THEM = "Go and answer them";
const BACK_TO_RECORD = "Back to your record";
/* While the model is reading her words. Said plainly: she has just written
   several sentences and pressed a button, and a button that only greys out
   leaves her wondering whether it took. */
const PARSING = "Parsing…";

/** No "Or": the button sits beside the question now rather than beside Send, so
 *  the position already says it is one of two ways to answer and the word was
 *  doing work the layout does. */
const SPEAK = "Say it out loud";
const STOP_SPEAKING = "Stop and write it down";
/** Named for what is happening to HER words, not for what a provider is doing. */
const WRITING_DOWN = "Writing down what you said…";
/** Said once she is past what we can carry, so the cut is not a surprise she
 *  meets afterwards. It does not stop her — she may want to finish. */
const GETTING_LONG = "That is about as much as we can write down at once — you may want to stop soon.";

/** Shown only once she is close enough for the number to mean something. */
const COUNT_FROM = 3_500;
/** And said in red inside this much of the cap. */
const COUNT_CLOSE = 500;

/** m:ss. Minutes are what she is judging; hours are not a case this has. */
function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export interface TellPanelProps {
  locationId: string;
}

/** The box, then the account of what it became. */
export function TellPanel({ locationId }: TellPanelProps): ReactElement {
  const { payload, setPayload } = useRecord();
  const [said, setSaid] = useState("");
  /** Null until she has sent something: the screen has two states and no more. */
  const [review, setReview] = useState<TellPlan | null>(null);
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Which understood facts she has answered HERE, and how. The open proposal
   *  vanishes from the record the moment she answers, so without this the row
   *  would simply lose its buttons and say nothing about what happened. */
  const [settled, setSettled] = useState<Record<string, "yes" | "no">>({});
  const [answering, setAnswering] = useState<string | null>(null);
  /** The one proposal whose last yes or no was refused, and why. Keyed by the
   *  PROPOSAL, so the sentence renders under the buttons she pressed — the
   *  review screen is a list, and a message at the foot of it names nothing. */
  const [answerFailure, setAnswerFailure] = useState<
    { proposalId: string; message: string } | null
  >(null);

  /** A transcript ADDS to what is already in the box rather than replacing it:
   *  she may have typed a little, then decided to say the rest, and losing her
   *  own sentences to a recording would be the worst possible trade. */
  const onTranscript = useCallback((text: string) => {
    setSaid((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
  }, []);

  const dictation = useDictation(locationId, onTranscript);

  /**
   * Say yes or no to a fact, HERE, on the screen that reported it.
   *
   * She had to open each row to answer, one part at a time, for facts this
   * screen had just listed in front of her — the record's own "answer it where
   * the question is" rule applied to a surface that is not asking a question,
   * it is reporting an answer. The row still works and is unchanged; this is
   * the same two endpoints, which return the whole payload, so one response
   * moves the rail and every count with it.
   *
   * A REFUSED ANSWER KEEPS ITS OWN SENTENCE, ON THIS LIST. It used to go into
   * `error`, which this screen renders only above the box — so on the review it
   * was set and shown nowhere. It also went in as the response carried it, and
   * the confirm route names a refusal with a machine word.
   * `answerFailureMessage` is what turns that word into her sentence.
   *
   * `picked` is the items she kept where the fact asked her to choose. It goes
   * out through `confirmProposal`, which owns the body.
   */
  async function answer(
    fieldKey: string,
    proposalId: string,
    yes: boolean,
    picked?: string[],
  ): Promise<void> {
    setAnswering(proposalId);
    setAnswerFailure(null);
    const outcome = yes
      ? await confirmProposal(locationId, proposalId, picked)
      : await rejectProposal(locationId, proposalId);
    if (outcome.ok) {
      setPayload(outcome.payload);
      setSettled((current) => ({ ...current, [fieldKey]: yes ? "yes" : "no" }));
    } else {
      setAnswerFailure({ proposalId, message: answerFailureMessage(outcome.message) });
    }
    setAnswering(null);
  }

  async function send(): Promise<void> {
    setBusy(true);
    setError(null);
    const outcome = await call<TellResponse>(
      `/api/portal/${locationId}/business-profile/tell`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: said }),
      },
      SEND_MESSAGE,
    );
    setBusy(false);
    if (!outcome.ok) {
      setError(outcome.message);
      return;
    }
    // The rail's counts and the review below move from this one object.
    setPayload(outcome.payload);
    setSent(said.trim());
    setReview(outcome.payload.tell);
    setSaid("");
  }

  if (review) {
    return (
      <Review
        plan={review}
        sent={sent}
        locationId={locationId}
        /* The OPEN proposals as the record now holds them — that is where the
           ids live. `plan` is the pure decision and never carried one. */
        openProposals={payload.proposals}
        settled={settled}
        answering={answering}
        failure={answerFailure}
        onAnswer={answer}
        onAgain={() => {
          setReview(null);
          setSent("");
        }}
      />
    );
  }

  return (
    <section className="mb-say" aria-labelledby="mb-say-h">
      {/* Speaking belongs WITH THE BOX, not with Send: it is a second way to
          fill the field, and putting it in the action row made "another way to
          answer" look like a sibling of "answer now". */}
      <div className="mb-say__head">
        <div className="mb-say__ask">
          <label className="mb-say__label" id="mb-say-h" htmlFor="mb-say-box">
            {PROMPT}
          </label>
          <p className="mb-sub">{HELPER}</p>
        </div>
        {/* Dictation is a SECOND way in, never the only one: the button is not
            rendered at all where the browser cannot record, rather than offered
            and then apologising when pressed. */}
        {dictation.supported ? (
          <button
            type="button"
            className={`mb-say__speak${dictation.state === "recording" ? " is-recording" : ""}`}
            disabled={busy || dictation.state === "working"}
            // Said out loud as well as shown: a screen reader gets the state,
            // not just a label that happens to have changed.
            aria-pressed={dictation.state === "recording"}
            onClick={() => {
              dictation.dismissError();
              if (dictation.state === "recording") dictation.stop();
              else void dictation.start();
            }}
          >
            {dictation.state === "recording" ? (
              <>
                <span className="mb-say__dot" aria-hidden />
                {STOP_SPEAKING}
                <span className="mb-say__clock">{clock(dictation.seconds)}</span>
              </>
            ) : dictation.state === "working" ? (
              WRITING_DOWN
            ) : (
              <>
                <span aria-hidden>🎙</span>
                {SPEAK}
              </>
            )}
          </button>
        ) : null}
      </div>
      <textarea
        id="mb-say-box"
        className={`${CONTROL_INPUT} resize-y mb-say__box`}
        rows={9}
        maxLength={TELL_MAX_CHARS}
        value={said}
        onChange={(e) => setSaid(e.target.value)}
      />
      {said.length >= COUNT_FROM ? (
        <p className={`mb-say__count${said.length >= TELL_MAX_CHARS - COUNT_CLOSE ? " is-close" : ""}`}>
          {TELL_MAX_CHARS - said.length} characters left
        </p>
      ) : null}
      {dictation.error ? (
        <p className="mb-note" role="alert">
          {dictation.error}
        </p>
      ) : null}
      {dictation.state === "recording" && dictation.seconds >= LONG_RECORDING_SECONDS ? (
        <p className="mb-note">{GETTING_LONG}</p>
      ) : null}
      {/* One thing to press. The way back is the rail and the page header, both
          of which are on screen the whole time; a third control here only ever
          competed with the two that mean something. */}
      {/* One part for all of them, or the record's landing screen. */}
      <div className="mb-say__acts">
        <button
          type="button"
          className="gpds-btn mb-btn mb-say__send"
          disabled={busy || dictation.state !== "idle" || said.trim() === ""}
          // Says it is working, for anyone not watching the button change.
          aria-busy={busy}
          onClick={() => void send()}
        >
          {busy ? (
            <>
              <Spinner />
              {PARSING}
            </>
          ) : (
            SEND
          )}
        </button>
      </div>

      {error ? (
        <p className="mb-note" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}

/**
 * What was understood, and what was not — in that order, and both plainly
 * visible. Every sentence she sent is in exactly one of the three groups.
 */
/**
 * The one glyph this panel needs while the model reads her words.
 *
 * Inline, like every other icon in this folder — and `aria-hidden`, because the
 * button's own text changes to "Parsing…" and a screen reader should hear that
 * once, not once as text and again as a graphic.
 */
function Spinner(): ReactElement {
  return (
    <svg className="mb-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Review({
  plan,
  sent,
  locationId,
  openProposals,
  settled,
  answering,
  failure,
  onAnswer,
  onAgain,
}: {
  plan: TellPlan;
  openProposals: MyBusinessPayload["proposals"];
  settled: Record<string, "yes" | "no">;
  answering: string | null;
  /** The proposal whose last yes or no was refused, and why. */
  failure: { proposalId: string; message: string } | null;
  onAnswer: (
    fieldKey: string,
    proposalId: string,
    yes: boolean,
    picked?: string[],
  ) => void | Promise<void>;
  sent: string;
  locationId: string;
  onAgain: () => void;
}): ReactElement {
  const base = `/${locationId}/business`;
  const parts = new Set(
    plan.proposals.flatMap((proposal) => {
      const part = catalogFor(proposal.fieldKey)?.part;
      return part ? [part] : [];
    }),
  );
  const only = parts.size === 1 ? [...parts][0] : null;
  const answerHref = only ? `${base}/${only}` : base;
  /* NEWEST FIRST, so one per row. `payload.proposals` arrives newest first and
     a channel that has proposed twice for the same question has only one live
     card — the same rule `PartRecord` keeps, and for the same reason. */
  const openByKey = new Map<string, MyBusinessPayload["proposals"][number]>();
  for (const open of openProposals) {
    if (!openByKey.has(open.fieldKey)) openByKey.set(open.fieldKey, open);
  }

  return (
    <section className="mb-said" aria-labelledby="mb-said-h">
      <h3 className="mb-said__h" id="mb-said-h">
        What I understood
      </h3>
      {/* WHERE TO SEND HER. The proposals sit on the rows that ask their
          questions, so the useful destination is the part holding them — but
          only when they all share one. Spread across parts, the record's own
          landing screen is the honest answer, and the rail carries a count
          beside each part from there. */}
      {plan.proposals.length === 0 ? (
        /* `dropped` is what was read and then not put to her: already held,
           already answered, already waiting. Its presence is the proof she was
           understood, so it is what tells the two outcomes apart. */
        <p className="mb-sub">
          {plan.dropped.length > 0 ? NOTHING_NEW : NOTHING_UNDERSTOOD}
        </p>
      ) : (
        <>
          <p className="mb-sub">{WAITING}</p>
          <ul className="mb-said__list">
            {plan.proposals.map((proposal) => (
              <Understood
                key={proposal.fieldKey}
                proposal={proposal}
                open={openByKey.get(proposal.fieldKey)}
                settled={settled[proposal.fieldKey]}
                answering={answering}
                failure={failure}
                onAnswer={onAnswer}
              />
            ))}
          </ul>
        </>
      )}

      {/* Understood, and deliberately not queued. Said out loud, because the
          alternative is a member who told us five things and is shown four
          with no explanation for the fifth. */}
      {plan.dropped.length > 0 ? (
        <>
          <h3 className="mb-said__h">What I left alone</h3>
          <ul className="mb-said__list">
            {plan.dropped.map((drop) => (
              <LeftAlone key={drop.fieldKey} drop={drop} />
            ))}
          </ul>
        </>
      ) : null}

      {plan.needsUpload.length > 0 ? (
        <>
          <h3 className="mb-said__h">{UPLOAD_HEADING}</h3>
          <p className="mb-sub">{UPLOAD_NOTE}</p>
          <ul className="mb-said__list">
            {plan.needsUpload.map((aim) => (
              <li className="mb-said__item" key={aim.fieldKey}>
                <p className="mb-said__heard">&ldquo;{aim.quote}&rdquo;</p>
                {/* The row, then what to do about it. A name alone would leave
                    her where the leftovers did — told it went nowhere, and not
                    told where it should go. */}
                <p className="mb-sub">
                  <strong>{aim.label}</strong> — {aim.instead}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {plan.leftover.length > 0 ? (
        <>
          <h3 className="mb-said__h">What I did not understand</h3>
          <p className="mb-sub">{LEFTOVER_NOTE}</p>
          <ul className="mb-said__list">
            {/* Keyed by position as well as text: she may well say the same
                thing twice, and both times are hers. */}
            {plan.leftover.map((sentence, i) => (
              <li className="mb-said__item" key={`${i}${sentence}`}>
                <p className="mb-said__heard">“{sentence}”</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* Her whole submission, kept on the screen that reports on it. The same
          words are on the source every card it produced cites. */}
      <h3 className="mb-said__h">{SENT_HEADING}</h3>
      <p className="mb-said__sent">{sent}</p>

      <div className="mb-say__acts">
        <Link className="gpds-btn mb-btn" href={answerHref}>
          {plan.proposals.length > 0 ? ANSWER_THEM : BACK_TO_RECORD}
        </Link>
        <button type="button" className="gpds-btn-ghost mb-btn" onClick={onAgain}>
          {AGAIN}
        </button>
      </div>
    </section>
  );
}

/**
 * One fact that is now a question on the row it answers.
 *
 * SHE KEEPS WHAT SHE WANTS OF IT, HERE. A channel can name more items than the
 * row keeps, and the route refuses a confirm that carries no pick. So this item
 * asks for the pick with the same `ItemPicker` the record row uses, and the yes
 * carries what she kept. `proposalChoice` decides whether to
 * ask, and `canConfirm` decides whether the yes may go. This screen holds no cap
 * and no rule.
 *
 * THE PICKER REPLACES THE VALUE LINE, because the items ARE the value: printing
 * them twice would ask her to read the same five services before choosing among
 * them.
 */
function Understood({
  proposal,
  open,
  settled,
  answering,
  failure,
  onAnswer,
}: {
  proposal: TellProposal;
  open: MyBusinessPayload["proposals"][number] | undefined;
  settled: "yes" | "no" | undefined;
  answering: string | null;
  failure: { proposalId: string; message: string } | null;
  onAnswer: (
    fieldKey: string,
    proposalId: string,
    yes: boolean,
    picked?: string[],
  ) => void | Promise<void>;
}): ReactElement {
  /** Built from the OPEN proposal, never from `plan`. The route checks a pick
   *  against the value the record holds, and `plan` is the pure reading of her
   *  words. A pick built from the wrong one would name a different list. */
  const choose = open ? proposalChoice(open.fieldKey, open.value) : null;
  /** The items she has kept so far, when this fact asked her to choose. */
  const [kept, setKept] = useState<string[]>([]);
  /** What the yes carries, in the order the proposal named them. `orderedPick`
   *  drops anything this proposal no longer offers, so the button is judged on
   *  what it would actually send. */
  const picked = choose ? orderedPick(choose.items, kept) : undefined;
  const ready = picked ? canConfirm(picked) : true;
  const refused = open && failure?.proposalId === open.id ? failure.message : null;
  return (
    <li className="mb-said__item">
      <p className="mb-said__label">{labelFor(proposal.fieldKey)}</p>
      {/* The same renderer the record and the mentor drawer use, over the same
          stored value — one value, one string, one definition. */}
      {choose && !settled ? (
        <ItemPicker
          choose={choose}
          kept={kept}
          onKept={setKept}
          busy={answering !== null}
        />
      ) : (
        <p className="mb-said__v">{formatFieldValue(proposal.fieldKey, proposal.value)}</p>
      )}
      <p className="mb-said__heard">You said: “{proposal.heard}”</p>
      {/* ANSWERED HERE, on the screen that reported it. She had to open each
          row, one part at a time, to say yes to facts already listed in front
          of her. The row still asks the same question in the same words — the
          labels come from `ACTION_LABEL`, so the two surfaces cannot drift. */}
      {settled ? (
        <p className="mb-said__why">
          {settled === "yes" ? "Added to your record." : "Left off your record."}
        </p>
      ) : open ? (
        <p className="mb-prop__acts">
          <button
            type="button"
            className="mb-row__yes"
            onClick={() => void onAnswer(proposal.fieldKey, open.id, true, picked)}
            disabled={answering !== null || !ready}
          >
            {/* "Yes, that is right" is false about a pick: she agreed with three
                of five, not with the whole of it. The record row's own label, so
                the two surfaces cannot drift. */}
            {choose ? KEEP_THESE : ACTION_LABEL.confirm}
          </button>
          <button
            type="button"
            className="mb-prop__no"
            onClick={() => void onAnswer(proposal.fieldKey, open.id, false)}
            disabled={answering !== null}
          >
            No, leave it
          </button>
        </p>
      ) : null}
      {/* Said beside the buttons that made it, never at the foot of the list. */}
      {refused ? (
        <p className="mb-note" role="alert">
          {refused}
        </p>
      ) : null}
    </li>
  );
}

/** One fact that was understood and left where it was, and why. */
function LeftAlone({ drop }: { drop: TellDrop }): ReactElement {
  return (
    <li className="mb-said__item">
      <p className="mb-said__label">{labelFor(drop.fieldKey)}</p>
      <p className="mb-said__why">{TELL_DROP_NOTE[drop.reason]}</p>
      <p className="mb-said__heard">You said: “{drop.heard}”</p>
    </li>
  );
}
