/**
 * What each of the nine states means, written down once. Pure.
 *
 * `satisfies Record<ProfileFieldState, RowContract>` removes the fallback that
 * let `conflict`, `pending_dfy` and `missing` silently render as "You told us":
 * a tenth state is now a compile error until its row exists. `ProfileFieldState`
 * comes from `registry.ts`, which gains zero diff lines.
 *
 * `chip`/`tone` are what she sees; `value` how it is treated; `action` the one
 * thing the row offers; `provenance` whether there is an origin worth citing.
 * `needsYou` is the SINGLE definition of "a human must look at this" — the rail
 * badges reach it through `queue.ts`. `gates` encodes
 * that a gate may rely only on a `verified` value.
 *
 * A settled state carries no chip: `attested`/`verified` are the record at
 * rest, and `missing` already has its authored `addPrompt`.
 *
 * NO CONFIDENCE SCORE, EVER. The state is the confidence and it is discrete;
 * `confidenceTag` is stored for audit, absent from the payload, never rendered.
 *
 * NOTHING MISSING USES AN ERROR COLOUR — `missing` is a question nobody has
 * asked yet. Only `error`, which is our failure, carries the `problem` tone.
 */

import type { CatalogField } from "./catalog";
import { describeFieldValue, type DisplayPart } from "./formatValue";
import { fromMb } from "./legacyShapes";
import { isUnknownValue } from "./mbValue";
import type { MbValue } from "./mbValue";
import type { ProfileFieldState } from "./registry";

/** How the row treats the value itself. */
export type ValueTreatment =
  /** The value, as she reads it. */
  | "plain"
  /** Ours until she confirms it, so it is set back a shade — never greyed out
   *  to the point of looking disabled. */
  | "muted"
  /** No value yet: the row IS the authored `addPrompt`, live. */
  | "prompt"
  /** Two values, both origins, and the question. Never merged, never
   *  last-write-wins. */
  | "both";

/** The one action a row can ask for. */
export type RowAction = "confirm" | "resolve" | "retry" | "answer";

export interface RowContract {
  /** The word she reads on the chip, or null where the row is settled and a
   *  chip would be noise. Never an acronym, never a score. */
  chip: string | null;
  /** Maps to a DS token pair in `mybusiness.css`. `problem` is reserved for
   *  our failure; nothing absent may use it. */
  tone: "neutral" | "good" | "attention" | "problem";
  /** How the value renders. */
  value: ValueTreatment;
  /** The one action the row offers, or null when the row is settled. */
  action: RowAction | null;
  /** Does the row cite an origin at all? "You told us · never" under an
   *  unanswered question is a lie with a dot in it. Even where true, the source
   *  chip inside renders only when provenance exists. */
  provenance: boolean;
  /** THE single definition of "a human has to look". Read only via `queue.ts`. */
  needsYou: boolean;
  /** May a gate rely on this value? Only `verified`. */
  gates: boolean;
}

export const ROW_CONTRACT = {
  verified: { chip: null, tone: "good", value: "plain", action: null, provenance: true, needsYou: false, gates: true },
  attested: { chip: null, tone: "neutral", value: "plain", action: null, provenance: true, needsYou: false, gates: false },
  needs_review: { chip: "Check this", tone: "attention", value: "plain", action: "confirm", provenance: true, needsYou: true, gates: false },
  inferred: { chip: "Worked out for you", tone: "attention", value: "muted", action: "confirm", provenance: true, needsYou: true, gates: false },
  stale: { chip: "Checked a while ago", tone: "neutral", value: "plain", action: "retry", provenance: true, needsYou: false, gates: false },
  missing: { chip: null, tone: "neutral", value: "prompt", action: "answer", provenance: false, needsYou: false, gates: false },
  conflict: { chip: "Two answers disagree", tone: "attention", value: "both", action: "resolve", provenance: true, needsYou: true, gates: false },
  pending_dfy: { chip: "We are doing this for you", tone: "neutral", value: "plain", action: null, provenance: true, needsYou: false, gates: false },
  error: { chip: "We could not check this", tone: "problem", value: "plain", action: "retry", provenance: true, needsYou: true, gates: false },
} satisfies Record<ProfileFieldState, RowContract>;

/** The contract for one state. Total by construction — there is no fallback. */
export function rowContract(state: ProfileFieldState): RowContract {
  return ROW_CONTRACT[state];
}

/**
 * The words on the row's one action. `answer` is the fallback only — such a row
 * is labelled with the field's own `addPrompt`, and one catalog row of 75 has
 * none.
 */
export const ACTION_LABEL = {
  confirm: "Yes, that is right",
  resolve: "Pick the right one",
  retry: "Try again",
  answer: "Add this",
} satisfies Record<RowAction, string>;

/** A settled row asks nothing of her, but the answer is still hers to change. */
export const CHANGE_LABEL = "Change";

/**
 * What a SCREEN can do with a row. `answer` is not one of them: an empty row's
 * action is its own prompt, rendered in place of the value, so no second button
 * belongs beside it.
 */
export type RowCapability = Exclude<RowAction, "answer"> | "change";

/**
 * The one action a row offers ON A SCREEN, or null.
 *
 * The state's own action where the screen can perform it, and the quiet
 * "change" where it cannot — never nothing. Stopping at the state's action is
 * how a `needs_review` row reached the part page with a chip and no button:
 * that page passes a save and no confirm, so the row asked her to check
 * something and gave her no way to do it.
 *
 * Which screen offers which capability stays the screen's business — this only
 * decides what to do with what it has.
 */
export function offeredAction(
  contract: RowContract,
  can: (capability: RowCapability) => boolean,
): RowCapability | null {
  const own = contract.action;
  if (own === "answer") return null;
  if (own && can(own)) return own;
  return can("change") ? "change" : null;
}

/**
 * The call to action on an empty row — HER catalogue's wording, never generated.
 *
 * The catalog carries 74 hand-transcribed prompts. Templating one off a label
 * once shipped "Add you are registered to sell to the us government", so the
 * only row that may fall back is the one with no authored prompt at all.
 */
export function promptFor(field: CatalogField): string {
  return field.addPrompt ?? ACTION_LABEL.answer;
}

/**
 * The official government name to print under the label, or null.
 *
 * Suppressed when it only repeats the label: `samRegistration` and
 * `capabilityStatement` both carry a `term` identical to their inherited label,
 * and a row that explains its jargon with itself is noise. The catalog data is
 * correct and ported verbatim — the suppression belongs here, in the renderer.
 */
export function termToShow(label: string, term: string | undefined): string | null {
  const trimmed = term?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase() === label.trim().toLowerCase() ? null : trimmed;
}

/**
 * The lines a row shows for a value.
 *
 * NOT A SECOND FORMATTER. It lowers the record's `MbValue` back to the shape(s)
 * on disk with `fromMb` and hands each one to `describeFieldValue` — the single
 * definition F2 exists to be. Two things fall out of doing it that way:
 *
 *   · a row assembled from several keys (`past_performance` and its two legacy
 *     siblings, the bonding split) renders all of them, in key order;
 *   · a legacy past-performance job renders WITHOUT a customer type or a role.
 *     `toMb` supplies `private`/`prime` because `JobEntry` requires them; the
 *     lowering drops them again, so nothing she never said reaches the screen.
 *
 * A value that renders as nothing yields NO lines, so the row shows its prompt
 * rather than an em dash.
 */
export function valueLines(fieldKey: string, value: MbValue): DisplayPart[] {
  /* "Not sure" IS THE LINE. It never goes through the lowering below: it has no
     shape on disk to lower to, so `fromMb` hands back a null and the row prints
     the em dash it prints for a question nobody has answered. She answered it.
     Told through `describeFieldValue` directly, which knows this value. */
  if (isUnknownValue(value)) return describeFieldValue(fieldKey, value).parts;

  const lines: DisplayPart[] = [];
  for (const [key, stored] of Object.entries(fromMb(fieldKey, value))) {
    const display = describeFieldValue(key, stored);
    if (display.empty) continue;
    /* EVERY PIECE GETS ITS OWN LINE, labelled or not.
       An unlabelled set used to be re-joined into `display.text` and pushed as
       ONE line, so "Your top services" read "Speed, Test" — three services on
       one line, separated by commas, in a box wide enough for all three. The
       prototype bullets them, and every producer of an unlabelled multi-part
       value here is a genuine list: services, codes, chosen options, files,
       whole jobs, whole papers. A single-item list still yields one part and so
       still renders as one line. */
    lines.push(...display.parts);
  }
  return lines;
}
