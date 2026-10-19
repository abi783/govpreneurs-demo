/**
 * What one "tell Hunter everything" submission becomes. Pure.
 *
 * Each extracted fact goes past `admitProposal` — the shared drop matrix — and
 * every survivor becomes an ordinary `open` proposal. There is no second commit
 * path and nothing here touches `ProfileField`.
 *
 * THE CHANNEL IS `member.told`, this surface's own. It borrowed
 * `hunter.learned` until it had one, which was wrong three times over: the card
 * read "From what Hunter learned" for words she had just typed, the note said
 * we had heard it somewhere, and a tell SUPERSEDED the learned-fact sync's open
 * card for the same field, since `createProposal` supersedes per
 * (centre, fieldKey, originKey). Two claims from two sources; neither may eat
 * the other.
 *
 * It is one of the SPOKEN origins, so `typed_wins` still drops a fact for a
 * field she answered herself rather than putting her own record back to her as
 * a question — and that drop is reported rather than quietly showing her fewer
 * results than she said.
 *
 * Three lists come back and together they account for every sentence: queued,
 * understood but deliberately not queued (with the reason), and not understood.
 */

import { fromMb } from "./legacyShapes";
import {
  admitProposal,
  type DropReason,
  type OriginKey,
} from "./proposalPolicy";
import type { ProfileFieldState } from "./registry";
import type { Extraction } from "./tellExtract";
import type { UploadAim } from "./tellModel";

/** The machine channel a tell enters the queue on. See the header. */
export const TELL_ORIGIN_KEY: OriginKey = "member.told";

/** Who wrote the row, for audit. She did — this one is typed by the member. */
export const TELL_WRITTEN_BY = "member";

/**
 * Why a fact she said is not in her queue, in her own reading language.
 *
 * Exhaustive over `DropReason` so a new reason cannot ship without a sentence
 * she can read. `stale_tag` is unreachable from here — a tell carries no
 * confidence tag, and nothing on this surface ever shows her one — but the
 * matrix owns the vocabulary, not this file.
 */
export const TELL_DROP_NOTE: Record<DropReason, string> = {
  no_change: "We already hold this, exactly as you said it.",
  /* ONLY A VERIFIED ROW REACHES THIS NOW. A value she typed no longer beats
     her own later sentence — that is the whole point of admitting `member.told`
     — so the one thing left that can outrank her here is a register having
     checked it. The old wording ("you have already answered this one yourself")
     would be a lie in the only case that still fires. */
  typed_wins: "This one was checked against an official register, so we left the confirmed answer in place.",
  // "what needs you" was a screen and is not one any more — these wait on the
  // row that asks the question, which is where she will meet this one.
  echo: "This is already waiting on the question it answers.",
  stale_tag: "We are not sure enough of this to put it to you.",
  no_registry_home: "There is nowhere in your record to keep this yet.",
};

/**
 * The longest submission we take. Long enough for two minutes of talking
 * written out; short enough that a paste of something else is refused before it
 * reaches the database. Shared with the textarea, so the box cannot accept what
 * the route will turn away.
 */
export const TELL_MAX_CHARS = 5_000;

/** She sent nothing, or something that is not text. */
export const TELL_EMPTY = "Type what you want to tell us, then send it.";
/** Refused before anything is written. The cap is the textarea's own. */
export const TELL_TOO_LONG = `That is longer than we can take at once. Send up to ${TELL_MAX_CHARS} characters.`;

/**
 * The text of a submission, or the sentence to answer with instead. Shared by
 * the My Business sheet and Hunter chat, so both refuse the same input.
 */
export function readTellText(body: unknown): { text: string } | { error: string } {
  const said = (body as { text?: unknown } | null)?.text;
  if (typeof said !== "string" || said.trim() === "") return { error: TELL_EMPTY };
  if (said.length > TELL_MAX_CHARS) return { error: TELL_TOO_LONG };
  return { text: said.trim() };
}

/* ── her words, kept ──────────────────────────────────────────────────── */

/** The one turn a tell is: everything she said, in one go. */
const TURN_ID = "tell-1";
/** `Provenance.type` already permits this and nothing used it until now. */
const CHAT = "chat";
/** Where a tell was said, for anything reading the provenance later. Not rendered. */
export interface TellSurface {
  /** Which surface the conversation happened on. */
  channel: string;
  ref: string;
}

/** The My Business sheet, "Tell Hunter everything". */
export const MY_BUSINESS_TELL_SURFACE: TellSurface = {
  channel: "my_business",
  ref: "member:tell-hunter-everything",
};

/** A profile change she asked for in Hunter chat. */
export const HUNTER_CHAT_TELL_SURFACE: TellSurface = {
  channel: "hunter_chat",
  ref: "member:hunter-chat",
};
/** How the sheet labels the one speaker there is. */
const SPEAKER = "You";
const MEMBER_ROLE = "member";
/** What the source chip on the card says, and the sheet's heading. */
export const TELL_SOURCE_LABEL = "What you told Hunter";

/** The `Provenance` row a tell writes, as `SourceSheet` reads one. */
export interface TellProvenance {
  type: string;
  ref: string;
  sourceLabel: string;
  conversation: {
    channel: string;
    title: string;
    occurred_at: string;
    turns: { id: string; speaker: string; role: string; text: string }[];
    cited_turn_id: string;
  };
}

/**
 * Everything she said, kept whole and attached to every fact it produced.
 *
 * `Provenance.type` already permits `"chat"` and the `conversation` column was
 * provisioned for exactly this shape; both were unused until now. One turn,
 * cited by itself, so the proof sheet the record already ships opens on her own
 * words — "what did I actually say" is one tap from every card.
 *
 * `retrievedAt` is deliberately NOT set, as on every other provenance this app
 * writes: the sheet prints it verbatim in its footer, and an ISO timestamp is
 * not a sentence a member should be shown. When it happened is on the
 * conversation, where it is data rather than copy.
 */
export function tellProvenance(
  text: string,
  at: Date,
  surface: TellSurface = MY_BUSINESS_TELL_SURFACE,
): TellProvenance {
  const occurredAt = at.toISOString();
  return {
    type: CHAT,
    ref: surface.ref,
    sourceLabel: TELL_SOURCE_LABEL,
    conversation: {
      channel: surface.channel,
      title: TELL_SOURCE_LABEL,
      occurred_at: occurredAt,
      turns: [{ id: TURN_ID, speaker: SPEAKER, role: MEMBER_ROLE, text }],
      cited_turn_id: TURN_ID,
    },
  };
}

/** The record row as it stands today, or null when nothing is held. */
export interface HeldRow {
  value: unknown;
  state: ProfileFieldState;
  originKey: string | null;
}

export interface TellPlanInput {
  /** What the extractor made of her text. Never the text itself — that is what
   *  lets an async extractor be swapped in without touching this function. */
  extraction: Extraction;
  /** The record today, per key. */
  held: (fieldKey: string) => HeldRow | null;
  /** This channel's own open card for the key, if it has one. */
  openProposal: (fieldKey: string) => { value: unknown } | null;
}

/** One fact, ready for `createProposal`. `value` is already lowered to the
 *  shape the key stores. */
export interface TellProposal {
  fieldKey: string;
  value: unknown;
  /** Her own sentence. Stored on the proposal and shown on the card. */
  heard: string;
}

/** One fact that was understood and deliberately not queued. */
export interface TellDrop {
  fieldKey: string;
  heard: string;
  reason: DropReason;
}

export interface TellPlan {
  proposals: TellProposal[];
  dropped: TellDrop[];
  /** Said, and understood by nothing. Carried straight through. */
  leftover: string[];
  /** Understood perfectly, and answerable only by a document. Also carried
   *  straight through: there is nothing to plan, only something to say. */
  needsUpload: UploadAim[];
}

/**
 * One submission → what to write and what to tell her.
 *
 * The value is lowered by `fromMb` BEFORE the admission check, because the
 * matrix compares it against what is on disk and the two have to be in the
 * same shape or every fact would look like a change.
 */
export function planTell(input: TellPlanInput): TellPlan {
  const proposals: TellProposal[] = [];
  const dropped: TellDrop[] = [];

  for (const fact of input.extraction.facts) {
    const value = fromMb(fact.fieldKey, fact.value)[fact.fieldKey];
    const admission = admitProposal({
      fieldKey: fact.fieldKey,
      originKey: TELL_ORIGIN_KEY,
      incoming: value,
      held: input.held(fact.fieldKey),
      openProposal: input.openProposal(fact.fieldKey),
    });
    if (admission.admit) proposals.push({ fieldKey: fact.fieldKey, value, heard: fact.heard });
    else dropped.push({ fieldKey: fact.fieldKey, heard: fact.heard, reason: admission.reason });
  }

  return {
    proposals,
    dropped,
    leftover: input.extraction.leftover,
    needsUpload: input.extraction.needsUpload,
  };
}
