/**
 * proposalAnswer.ts — the pick a proposal asks for on a record row, and what the
 * member reads when the server refuses her answer. ENTITY LAYER — pure, no
 * Prisma, no React, no clock, no environment.
 *
 * WHY THIS EXISTS. F5a refuses a confirm that carries no pick when a proposal
 * names more items than the row keeps, and F5b put the tick boxes on the queue
 * card. Three screens carry the same proposal: the part record, the Basic Info
 * list and the tell review. Each one offered a yes the route always refuses, and
 * each one then failed in its own way — two said nothing at all, and the third
 * put the route's machine word into state. The queue card could not rescue them,
 * because no page mounted it, and it was deleted (F5g).
 *
 * So the row asks for the pick itself. This module gives a row the
 * `CardChoice` shape, and `ItemPicker` renders it on every surface that asks.
 *
 * IT HOLDS NO RULE. Whether a proposal needs a choice is `subsetRule`, what a
 * tap does is `toggleItem`, and what may be sent is `canConfirm` with
 * `orderedPick` — all in `subsetConfirm.ts`. The sentence for a named refusal is
 * `subsetRefusalMessage`. This module lowers the value the way the confirm
 * route reads it, and carries the words the row says.
 */

import { fromMb } from "./legacyShapes";
import type { MbValue } from "./mbValue";
import { SUBSET_REFUSALS, subsetRule, type SubsetRefusal } from "./subsetConfirm";
import { hasOwnKey } from "./untrustedInput";

/** The yes on a proposal she had to pick from. "Yes, that is right" is false
 *  there: she agreed with some of it and left the rest behind. */
export const KEEP_THESE = "Keep these";

/**
 * The pick a proposal asks for when a channel proposed more than the row keeps.
 *
 * EVERY RULE IN IT COMES FROM `subsetConfirm.ts` — the cap, the items on offer,
 * and what may be confirmed. This shape carries only the WORDS the screen says
 * about them, so the screen renders and never decides.
 */
export interface CardChoice {
  /** The most items she may keep. */
  maxItems: number;
  /** Every item the proposal named, in the order it named them. */
  items: string[];
  /** One line saying that not all of it fits, and how many she may keep. */
  note: string;
}

/**
 * The running count beside the picker, so a confirm she cannot press has its
 * reason on the screen rather than only in the code. It names the cap in full —
 * "2 of 3" alone reads as two of three offered items, which is a different fact.
 */
export function keptNote(kept: number, maxItems: number): string {
  return `You kept ${kept} of the ${maxItems} you may keep.`;
}

/**
 * The confirm route refuses a value that the member's own save gate
 * (`acceptStoredValue`) refuses. Without it, a confirm lands a value that she
 * cannot then re-save unchanged.
 *
 * It is declared HERE and not beside the route because this entity module must
 * give it a sentence, and an entity module must not import from the app layer.
 * It is not in `SUBSET_REFUSALS`, because it is not a rule about her pick.
 */
export const UNSAVABLE_VALUE = "unsavable_value";

/** Every named reason the confirm route can answer 400 with. */
export type ConfirmRefusal = SubsetRefusal | typeof UNSAVABLE_VALUE;

/**
 * What the member reads when the confirm route refuses her answer.
 *
 * The route answers with a named reason, which is a machine word and must never
 * reach her. Each sentence here says what happened and what she does next, so
 * the screen stays usable. THIS RECORD ADDS NO RULE: it does not decide which
 * refusals are possible, and this record is exhaustive, so a reason added to
 * `ConfirmRefusal` fails to compile until it has a sentence.
 */
const SUBSET_REFUSAL_MESSAGE: Readonly<Record<ConfirmRefusal, string>> = {
  [UNSAVABLE_VALUE]:
    "Your record cannot store this card as it is written. Say no to it, then type the answer on the row yourself.",
  [SUBSET_REFUSALS.subsetRequired]:
    "This card holds more than the row keeps. Choose the ones you keep first.",
  [SUBSET_REFUSALS.emptySubset]:
    "You kept nothing. Choose at least one, or say no to the whole card.",
  [SUBSET_REFUSALS.overCap]: "You kept more than the row holds. Take one off, then try again.",
  [SUBSET_REFUSALS.duplicateItem]: "The same one was sent twice. Choose them again.",
  [SUBSET_REFUSALS.unknownItem]:
    "One of those is no longer on this card. Reload the page to see what it holds now.",
  [SUBSET_REFUSALS.notCapped]: "This card takes no choice. Say yes to keep all of it.",
  [SUBSET_REFUSALS.malformedBody]: "We could not read what you kept. Choose them again.",
};

/**
 * The sentence for one refusal reason, or null when the reason is not one of
 * ours. A null sends the screen to its ordinary failure line, which is the
 * honest answer for something this record cannot explain. The lookup uses
 * `hasOwnKey`, because the reason arrives in a response body: a bare lookup
 * would read `toString` off the prototype chain.
 */
export function subsetRefusalMessage(reason: string): string | null {
  if (!hasOwnKey(SUBSET_REFUSAL_MESSAGE, reason)) return null;
  return SUBSET_REFUSAL_MESSAGE[reason as ConfirmRefusal];
}

/**
 * What she is told when a channel names more than the row keeps.
 *
 * It states the shortfall first and the instruction last, so she knows what the
 * list is for before she reads it. It never says which items to drop: the choice
 * is the whole point, and truncating for her is the bug F5a removed.
 */
function pickNote(count: number, maxItems: number): string {
  return `Not all of this fits. This row keeps ${maxItems} of these ${count}. Tick the ones you keep.`;
}

/**
 * The pick this proposal asks the member for, with the words to ask it, or
 * `null` when the whole value confirms.
 *
 * `fromMb` lowers the payload's value back to the shape the confirm route reads,
 * which is the shape the cap is declared against. So the row offers exactly the
 * strings the route will check her pick against — a second reading of the value
 * here is how a row comes to offer an item the route then refuses.
 */
export function proposalChoice(fieldKey: string, value: MbValue): CardChoice | null {
  const rule = subsetRule(fieldKey, fromMb(fieldKey, value)[fieldKey]);
  if (!rule) return null;
  return { ...rule, note: pickNote(rule.items.length, rule.maxItems) };
}

/**
 * What the member reads when the server refuses her yes or no.
 *
 * The route names a refusal with a machine word, which must never reach her.
 * `subsetRefusalMessage` holds the sentence for each one; anything else is
 * already a sentence and is passed through.
 */
export function answerFailureMessage(message: string): string {
  return subsetRefusalMessage(message) ?? message;
}
