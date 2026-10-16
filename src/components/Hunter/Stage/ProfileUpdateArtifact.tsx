// The profile update card — the `ProfileUpdatePayload` artifact on the stage.
//
// Hunter proposed changes to her My Business page. NOTHING IS SAVED until she
// taps Save on a change, and three properties follow from that:
//
//   1. Each change has its own Save and Cancel. A change is "Saved" only when
//      the server's answer names the saved row (`readProfileUpdateAnswer`).
//   2. An answer is remembered for the page session, by proposal id, so a card
//      shown again from the chat thread does not offer a Save it already took.
//   3. A failed Save states that nothing was saved, in the server's sentence or
//      in fixed copy — never silence, which reads as success.
//
// Every value renders as a React text node. Nothing here builds markup.

import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import type {
  ProfileUpdateAnswer,
  ProfileUpdateCard,
  ProfileUpdatePayload,
} from "../../../lib/hunterChat";
import { confirmProfileUpdate, rejectProfileUpdate } from "../../../lib/hunter/profileUpdate";
import {
  boundedList,
  MAX_PROFILE_UPDATE_CARDS,
  MAX_PROFILE_UPDATE_ITEMS,
  MAX_PROFILE_UPDATE_LINES,
} from "../../../lib/renderLimits";

/** Fixed copy. Exported so the tests read the same words the card prints. */
export const PROFILE_UPDATE_COPY = {
  kicker: "Changes to your My Business page",
  intro: "Nothing is saved yet. Tap Save on each change you want to keep.",
  heardPrefix: "You said:",
  save: "Save",
  saving: "Saving…",
  cancel: "Cancel",
  saved: (label: string) => `Saved to ${label}.`,
  cancelled: "Cancelled. Your profile did not change.",
  pickCount: (picked: number, max: number) => `${picked} of ${max} picked`,
  notesHeading: "Not changed from chat",
  empty: "No change is ready to save.",
} as const;

/** Where one change stands. `failed` keeps Save open, so she can try again. */
type CardState =
  | { phase: "open" }
  | { phase: "busy" }
  | { phase: "done"; answer: ProfileUpdateAnswer }
  | { phase: "failed"; message: string };

/**
 * Settled answers for this page session, by proposal id. A module value, not
 * sessionStorage: a reload loses it, and the server then answers a second Save
 * with "already answered", which the card shows.
 */
const settled = new Map<string, ProfileUpdateAnswer>();

/** The sentence a settled change shows. */
function doneSentence(answer: ProfileUpdateAnswer): string {
  switch (answer.status) {
    case "confirmed":
      return PROFILE_UPDATE_COPY.saved(answer.label);
    case "rejected":
      return PROFILE_UPDATE_COPY.cancelled;
    default:
      return answer.message;
  }
}

/** The first `maxItems` items, which the pick starts with. */
function initialPick(card: ProfileUpdateCard): string[] {
  if (!card.choice) return [];
  return card.choice.items.slice(0, Math.max(0, card.choice.maxItems));
}

/** The checkbox list for a change that keeps fewer items than it names. */
function ChoicePicker({
  card,
  picked,
  disabled,
  onToggle,
}: {
  card: ProfileUpdateCard;
  picked: string[];
  disabled: boolean;
  onToggle: (item: string) => void;
}) {
  const choice = card.choice;
  const items = useMemo(
    () => boundedList(choice?.items ?? [], MAX_PROFILE_UPDATE_ITEMS).shown,
    [choice],
  );
  if (!choice) return null;
  return (
    <fieldset className="hunter-update__choice" disabled={disabled}>
      <legend className="hunter-update__choice-note">{choice.note}</legend>
      {items.map((item, i) => (
        <label key={i} className="hunter-update__choice-item">
          <input type="checkbox" checked={picked.includes(item)} onChange={() => onToggle(item)} />
          <span>{item}</span>
        </label>
      ))}
      <p className="hunter-update__choice-count">
        {PROFILE_UPDATE_COPY.pickCount(picked.length, choice.maxItems)}
      </p>
    </fieldset>
  );
}

/** One proposed change, with its own Save and Cancel. */
function ChangeCard({ card }: { card: ProfileUpdateCard }) {
  const [state, setState] = useState<CardState>(() => {
    const known = settled.get(card.proposalId);
    return known ? { phase: "done", answer: known } : { phase: "open" };
  });
  const [picked, setPicked] = useState<string[]>(() => initialPick(card));
  const lines = useMemo(
    () => boundedList(card.lines ?? [], MAX_PROFILE_UPDATE_LINES).shown,
    [card.lines],
  );

  const busy = state.phase === "busy";
  const maxItems = card.choice?.maxItems ?? 0;
  const pickValid = !card.choice || (picked.length > 0 && picked.length <= maxItems);

  const toggle = (item: string) =>
    setPicked((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));

  const settle = async (request: Promise<ProfileUpdateAnswer>) => {
    setState({ phase: "busy" });
    const answer = await request;
    // A refusal or an unreachable server wrote nothing, so Save stays open.
    if (answer.status === "refused" || answer.status === "unavailable") {
      setState({ phase: "failed", message: answer.message });
      return;
    }
    settled.set(card.proposalId, answer);
    setState({ phase: "done", answer });
  };

  const onSave = () =>
    settle(confirmProfileUpdate(card.proposalId, card.choice ? picked : undefined));
  const onCancel = () => settle(rejectProfileUpdate(card.proposalId));

  return (
    <li className={`hunter-update__card is-${state.phase}`}>
      <h4 className="hunter-update__label">{card.label}</h4>
      {lines.length > 0 && (
        <ul className="hunter-update__lines">
          {lines.map((line, i) => (
            <li key={i} className="hunter-update__line">
              {line.label && <span className="hunter-update__line-label">{line.label}: </span>}
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}
      {card.heard && (
        <p className="hunter-update__heard">
          {PROFILE_UPDATE_COPY.heardPrefix} “{card.heard}”
        </p>
      )}

      {state.phase === "done" ? (
        <p className={`hunter-update__result hunter-update__result--${state.answer.status}`}>
          {doneSentence(state.answer)}
        </p>
      ) : (
        <>
          <ChoicePicker card={card} picked={picked} disabled={busy} onToggle={toggle} />
          {state.phase === "failed" && (
            <p className="hunter-update__error" role="alert">
              {state.message}
            </p>
          )}
          <div className="hunter-update__actions">
            <button
              type="button"
              className="hunter-update__save"
              disabled={busy || !pickValid}
              onClick={onSave}
            >
              {busy ? PROFILE_UPDATE_COPY.saving : PROFILE_UPDATE_COPY.save}
            </button>
            <button
              type="button"
              className="hunter-update__cancel"
              disabled={busy}
              onClick={onCancel}
            >
              {PROFILE_UPDATE_COPY.cancel}
            </button>
          </div>
        </>
      )}
    </li>
  );
}

/** Renders the changes Hunter proposed, each waiting for her Save. */
export function ProfileUpdateArtifact({ payload }: { payload: ProfileUpdatePayload }) {
  const cards = useMemo(
    () => boundedList(payload?.cards ?? [], MAX_PROFILE_UPDATE_CARDS).shown,
    [payload?.cards],
  );
  const notes = useMemo(
    () => boundedList(payload?.notes ?? [], MAX_PROFILE_UPDATE_CARDS).shown,
    [payload?.notes],
  );

  return (
    <div className="hunter-update">
      <div className="hunter-update__head">
        <PencilLine size={13} aria-hidden />
        <span className="hunter-update__kicker">{PROFILE_UPDATE_COPY.kicker}</span>
      </div>

      {cards.length > 0 ? (
        <>
          <p className="hunter-update__intro">{PROFILE_UPDATE_COPY.intro}</p>
          <ul className="hunter-update__cards">
            {cards.map((card) => (
              <ChangeCard key={card.proposalId} card={card} />
            ))}
          </ul>
        </>
      ) : (
        <p className="hunter-update__empty">{PROFILE_UPDATE_COPY.empty}</p>
      )}

      {notes.length > 0 && (
        <div className="hunter-update__notes">
          <p className="hunter-update__notes-heading">{PROFILE_UPDATE_COPY.notesHeading}</p>
          <ul>
            {notes.map((note, i) => (
              <li key={i} className="hunter-update__note">
                <span className="hunter-update__note-label">{note.label}:</span> {note.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Test seam: forgets every settled answer. */
export function resetSettledProfileUpdates(): void {
  settled.clear();
}
