/**
 * proposalPolicy.ts — who may write, who must ask, and what a confirm lands as.
 * ENTITY LAYER — pure, no Prisma, no React, fully unit-testable.
 *
 * FRAME (the four tables) + F6 (`admitProposal`).
 *
 * ── THE ONE SENTENCE ──────────────────────────────────────────────────────
 * INFERENCE PROPOSES; AUTHORITY WRITES. The member typing is the only direct
 * write. Everything else lands in `ProfileProposal` as an `open` row and waits
 * for her. A proposal is not part of the record, which is what makes it
 * impossible to mistake an unconfirmed extraction for data — and it is why the
 * counter cannot move on a proposal.
 *
 * ── `origin` vs `originKey`: THE MOST EASILY-MISSED PART OF THE PORT ───────
 * `ProfileField.origin` is MEMBER-FACING PROSE — "You told us", "From your
 * enrollment intake". Routing rules key off a machine channel, so they cannot
 * share the column: the day someone writes `if (origin === "You told us")` the
 * copy is frozen forever. Hence the new `originKey` column (F3), the
 * `ORIGIN_KEYS` vocabulary below, and `ORIGIN_PROSE` as the one place the two
 * are paired.
 */

import { isKnownFieldKey } from "./crosswalk";
import type { ProfileFieldState } from "./registry";

/** The machine channel a write came from. Stored in `ProfileField.originKey`
 *  and `ProfileProposal.originKey`. Add a channel here, and the exhaustive
 *  records below stop compiling until its route and copy are declared. */
export const ORIGIN_KEYS = [
  "member.typed",
  "member.confirmed",
  "ghl.contact",
  "intake.migration",
  "hunter.warm_start",
  "hunter.learned",
  "member.told",
  "capability_statement",
  "sam.gov",
] as const;

export type OriginKey = (typeof ORIGIN_KEYS)[number];

/**
 * How each channel reaches the record.
 *   direct   — commits straight to `ProfileField`. She is the authority on her
 *              own business, and there is nobody to confirm it to.
 *   queue    — lands in `ProfileProposal` as `open`; the record is untouched.
 *              `member.told` is here and not in `direct` although she is the one
 *              speaking: she said many things at once and something else read
 *              them into fields, so what lands is an EXTRACTION of her words,
 *              not a field she filled in. Inference proposes; authority writes.
 *              `capability_statement` is here for the same reason: a reader
 *              took the value out of the document she uploaded.
 *   register — an external validation; may land `verified`. Nothing routes here
 *              yet in Success Center (SAM writes `SuccessCenter` columns via the
 *              validators, not `ProfileField`), but the row exists so the state
 *              machine is complete before the first producer arrives.
 */
export const ORIGIN_ROUTE: Record<OriginKey, "direct" | "queue" | "register"> = {
  "member.typed": "direct",
  "member.confirmed": "direct",
  "ghl.contact": "direct",
  "intake.migration": "direct",
  "hunter.warm_start": "queue",
  "hunter.learned": "queue",
  "member.told": "queue",
  "capability_statement": "queue",
  "sam.gov": "register",
};

/**
 * The prose she reads, per channel. THE ONLY PLACE the machine key and the
 * member-facing sentence are paired. Copy rules: sentence case, no
 * exclamation, no "please", never an acronym alone, never a confidence score.
 *
 * `member.typed` renders "You told us" on a first answer and "You updated
 * this" on an edit — the route already makes that distinction and keeps it.
 *
 * `member.told` names Hunter because the surface does — "What you told Hunter"
 * is the sheet's own heading — and because it is the honest difference from
 * `member.typed`: she said it, in her own words, rather than filling this field
 * in. It is deliberately NOT "You told us", which is a different channel's
 * sentence and a backfilled row's key.
 *
 * `capability_statement` names the document she uploaded, because that is the
 * only thing she can check the value against. It names neither the reader that
 * read the document nor how sure that reader was.
 */
/**
 * The one sentence that is not a channel of its own: an EDIT by the member,
 * which is still `member.typed`. It lives beside `ORIGIN_PROSE` rather than in
 * it because the map is keyed by channel and this is a second face of one.
 */
export const ORIGIN_PROSE_EDIT = "You updated this";

export const ORIGIN_PROSE: Record<OriginKey, string> = {
  "member.typed": "You told us",
  "member.confirmed": "You confirmed this",
  "ghl.contact": "From your GovPreneurs contact",
  "intake.migration": "From your enrollment intake",
  "hunter.warm_start": "Hunter warm-start wizard",
  "hunter.learned": "From what Hunter learned",
  "member.told": "You told Hunter",
  "capability_statement": "From your capability statement",
  "sam.gov": "From SAM.gov",
};

/**
 * THE MIGRATION BACKFILL WHITELIST. The migration backfills `originKey` from
 * exactly these, WITH NO `ELSE`: an unrecognised origin stays NULL and is
 * treated conservatively as member-held, because machine-written is the class a
 * sync is allowed to overwrite.
 *
 * A BACKFILL MAP, NOT A PROSE LOOKUP. "You told Hunter" is deliberately absent —
 * no row predating this map carries it and the tell route passes its own
 * `originKey`, so a seventh `CASE` arm would cover rows that cannot exist.
 *
 * Confirmed against production 2026-08-18: five of the six appear (559 rows,
 * none unclassified); "From your enrollment intake" has no rows yet. Re-check
 * with `SELECT DISTINCT origin FROM "ProfileField";` before applying.
 */
export const PROSE_TO_ORIGIN_KEY: Record<string, OriginKey> = {
  [ORIGIN_PROSE["member.typed"]]: "member.typed",
  [ORIGIN_PROSE_EDIT]: "member.typed",
  [ORIGIN_PROSE["member.confirmed"]]: "member.confirmed",
  [ORIGIN_PROSE["ghl.contact"]]: "ghl.contact",
  [ORIGIN_PROSE["intake.migration"]]: "intake.migration",
  [ORIGIN_PROSE["hunter.warm_start"]]: "hunter.warm_start",
};

/** The channels that must ask before they write. */
export type QueueOriginKey = Extract<
  OriginKey,
  "hunter.warm_start" | "hunter.learned" | "member.told" | "capability_statement"
>;

/**
 * What a CONFIRMED proposal lands as. Exhaustive over the queue origins, so a
 * new channel is a compile-visible decision rather than a fallthrough.
 *
 * Every channel lands `attested`: a claim she confirms is still a claim, and
 * `verified` requires external validation. Promoting one would put a
 * self-reported input behind a gate, which the gate rule forbids.
 */
export const CONFIRMED_STATE: Record<QueueOriginKey, ProfileFieldState> = {
  "hunter.warm_start": "attested",
  "hunter.learned": "attested",
  "member.told": "attested",
  "capability_statement": "attested",
};

/** Why a proposal never reached the queue. Dropping is an OUTCOME, not an
 *  error — a channel re-hearing what the record already holds is the normal
 *  case, and reporting why is what keeps the emitter honest. */
export type DropReason =
  /** The record already holds this exact value. */
  | "no_change"
  /** She typed it; a channel disagrees. What she typed wins — she was more
   *  deliberate when she typed it. Supersedes `isProtectedState`. */
  | "typed_wins"
  /** The source's freshness window has passed; re-fetch before proposing. */
  | "stale_tag"
  /** The incoming value is our own earlier proposal coming back round. */
  | "echo"
  /** No catalog row and no registry entry owns this key. */
  | "no_registry_home";

export type Admission = { admit: true } | { admit: false; reason: DropReason };

export interface AdmissionInput {
  fieldKey: string;
  originKey: OriginKey;
  /** The incoming value, already lowered to its storage shape. */
  incoming: unknown;
  /** The record row today, or null when nothing is held. */
  held: { value: unknown; state: ProfileFieldState; originKey: string | null } | null;
  /** This channel's currently-open proposal for the same field, if any. */
  openProposal: { value: unknown } | null;
  /** Stored for audit and NEVER rendered. Only `stale_tag` reads it. */
  confidenceTag?: string | null;
}

/**
 * THE DROP MATRIX. F6 covers all five reasons plus the admit case.
 *
 * Ordering matters and is asserted: `no_registry_home` first (we cannot store
 * it at all), then `no_change`, then `typed_wins`, then `echo`, then
 * `stale_tag`. Reporting the wrong reason is how a channel gets "fixed" for a
 * problem it does not have.
 */
export function admitProposal(input: AdmissionInput): Admission {
  const { fieldKey, originKey, incoming, held, openProposal, confidenceTag } = input;

  if (!isKnownFieldKey(fieldKey)) return drop("no_registry_home");
  if (held && sameValue(held.value, incoming)) return drop("no_change");
  if (held && typedWins(originKey, held.state)) return drop("typed_wins");
  if (openProposal && sameValue(openProposal.value, incoming)) return drop("echo");
  if (confidenceTag === STALE_CONFIDENCE_TAG) return drop("stale_tag");

  return { admit: true };
}

/** The confidence tag a source uses to say it no longer trusts its own answer.
 *  Never rendered — it only ever decides whether she is asked at all. */
const STALE_CONFIDENCE_TAG = "stale";

/**
 * The queue channels that carry a claim SOMEONE ELSE made about her.
 *
 * Both are inferences drawn from her behaviour rather than statements she made:
 * a warm-start guess and a fact learned from a conversation with Hunter. A
 * field she typed into is the more deliberate answer than either, so they lose
 * to it rather than queueing against it.
 *
 * The guard is deliberately narrow: `capability_statement` routes `queue` too
 * but does NOT appear here, because an uploaded document still queues against a
 * typed value — she uploaded it deliberately, and only she can say which is
 * current.
 *
 * `member.told` USED TO BE HERE, on the grounds that "putting her own record
 * back to her as a question because she mentioned it in passing" was the defect
 * to guard against. That is the wrong comparison. It is not someone else's
 * claim about her — it is HER, saying something later than she typed it, and a
 * record that refuses her own correction is worse than one that asks her to
 * confirm it. "Tell Hunter everything" was the only surface where a filled
 * field could not be changed: she would say her phone number had changed and be
 * told "You have already answered this one yourself, so we left your answer
 * alone."
 *
 * Nothing is overwritten by removing it. An admitted claim becomes a
 * `ProfileProposal` row with `status: OPEN` — a card on the row, which she
 * accepts or rejects. `ProfileField` is untouched until she says so. The cost
 * of being wrong is a card she dismisses; the cost of the guard was a
 * correction she could not make.
 *
 * `verified` is still protected above: only a register may argue with a
 * register, whoever is speaking.
 */
const SPOKEN_ORIGIN_KEYS: ReadonlySet<OriginKey> = new Set<OriginKey>([
  "hunter.warm_start",
  "hunter.learned",
]);

function drop(reason: DropReason): Admission {
  return { admit: false, reason };
}

/**
 * Does what she already holds beat this channel?
 *
 *   · `attested` — she typed it. A spoken or learned claim that disagrees is
 *     dropped, not queued: she was more deliberate when she typed it.
 *   · `verified` — externally validated. Only another register may argue with
 *     it; every other class loses.
 */
function typedWins(originKey: OriginKey, state: ProfileFieldState): boolean {
  if (state === "verified") return ORIGIN_ROUTE[originKey] !== "register";
  return state === "attested" && SPOKEN_ORIGIN_KEYS.has(originKey);
}

/** Deep structural equality over stored shapes. Key order must never decide
 *  whether she is asked a question, so this compares structure rather than
 *  serialised output. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((item, i) => sameValue(item, b[i]))
    );
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every((key) => key in right && sameValue(left[key], right[key]))
  );
}

/**
 * What the record lands in when a proposal from this channel is confirmed.
 * `direct` and `register` channels never reach here; they land through their
 * own route. Frame, because it is a lookup over the authored table above.
 */
export function landingState(originKey: OriginKey): ProfileFieldState {
  return ORIGIN_ROUTE[originKey] === "queue"
    ? CONFIRMED_STATE[originKey as QueueOriginKey]
    : "attested";
}
