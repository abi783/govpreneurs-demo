/**
 * subsetConfirm.ts — the item cap on a list field, and the subset the member
 * keeps. ENTITY LAYER — pure, no Prisma, no React, no clock, no environment.
 *
 * WHY THIS EXISTS. A capability statement can name more services than
 * `primary_services` holds. The old answer was to truncate the list on the way
 * in, which chose for her and told her nothing. F5a keeps every item on the
 * card and lets her pick the ones she keeps.
 *
 * TWO RULES LIVE HERE, AND NOWHERE ELSE.
 *   1. THE CAP — one record, one number per capped field. The editor and the
 *      confirm route read it. A second cap constant is how the editor and the
 *      route come to disagree about what the record holds.
 *   2. THE PICK — a subset is valid only against the proposal's OWN items. The
 *      client picks; it never supplies. So a body that names a value the
 *      proposal never offered is refused, and no caller can write text that no
 *      channel proposed.
 *
 * Q12: a pick updates Success Center only. Hunter keeps every document item for
 * matching, so nothing here builds a rejection. See ARCHITECTURE.md §5.4.
 */

import { hasOwnKey, isFilledString } from "./untrustedInput";

/** The most items each capped list field stores, by field key. */
export const CAPPED_LIST_MAX_ITEMS: Readonly<Record<string, number>> = {
  primary_services: 3,
};

/** The most services `primary_services` stores. The editor and the confirm
 *  route share this one number. */
export const PRIMARY_SERVICES_MAX_ITEMS = CAPPED_LIST_MAX_ITEMS.primary_services;

/**
 * Why a confirm is refused. The route answers 400 and names one of these. Each
 * reason is a rule the member can act on, so none of them is a generic error.
 */
export const SUBSET_REFUSALS = {
  /** The proposal holds more items than the field, and she kept none of them. */
  subsetRequired: "subset_required",
  /** She kept nothing. A confirm that keeps nothing is a reject. */
  emptySubset: "empty_subset",
  /** She kept more items than the field holds. */
  overCap: "over_cap",
  /** She sent the same item twice. */
  duplicateItem: "duplicate_item",
  /** She sent an item the proposal never offered. */
  unknownItem: "unknown_item",
  /** The proposal takes no pick: the field stores every item it is sent, or the
   *  proposed value is not a list of filled strings. */
  notCapped: "not_capped",
  /** The body is not JSON, or it carries no list of filled strings. */
  malformedBody: "malformed_body",
} as const;

/** One named refusal reason. */
export type SubsetRefusal = (typeof SUBSET_REFUSALS)[keyof typeof SUBSET_REFUSALS];

/** The pick a card asks for: the cap, and every item the proposal offers. */
export interface SubsetChoice {
  maxItems: number;
  items: string[];
}

/** A checked pick, or the named reason the route refuses it. */
export type SubsetOutcome =
  | { ok: true; value: string[] }
  | { ok: false; reason: SubsetRefusal };

/**
 * The items a capped proposal offers, or `null` when the proposal takes no
 * pick. The key is checked with `hasOwnKey`, because a field key reaches this
 * module from a stored row: a bare lookup would read `toString` off the
 * prototype chain and report a cap that nobody declared.
 */
function cappedItems(fieldKey: string, proposalValue: unknown): string[] | null {
  if (!hasOwnKey(CAPPED_LIST_MAX_ITEMS, fieldKey)) return null;
  if (!Array.isArray(proposalValue)) return null;
  if (!proposalValue.every(isFilledString)) return null;
  return proposalValue as string[];
}

/** The items a body carries, or `null` when it carries no usable list. */
function chosenItems(body: unknown): string[] | null {
  if (typeof body !== "object" || body === null) return null;
  const items = (body as Record<string, unknown>).items;
  if (!Array.isArray(items)) return null;
  if (!items.every(isFilledString)) return null;
  return items as string[];
}

/**
 * The pick this proposal asks the member for. It is `null` when the field is
 * not capped, when the proposed value is not a list of filled strings, or when
 * the proposal already fits the cap — those three cases confirm whole.
 */
export function subsetRule(fieldKey: string, proposalValue: unknown): SubsetChoice | null {
  const items = cappedItems(fieldKey, proposalValue);
  if (items === null) return null;
  const maxItems = CAPPED_LIST_MAX_ITEMS[fieldKey];
  if (items.length <= maxItems) return null;
  return { maxItems, items };
}

/**
 * The value a confirm stores when the member sent a pick, or the named reason
 * the route refuses it. Items are compared exactly, so a value that differs in
 * case or spacing is an item the proposal never offered.
 */
export function validateSubset(
  fieldKey: string,
  proposalValue: unknown,
  body: unknown,
): SubsetOutcome {
  const offered = cappedItems(fieldKey, proposalValue);
  if (offered === null) return { ok: false, reason: SUBSET_REFUSALS.notCapped };

  const chosen = chosenItems(body);
  if (chosen === null) return { ok: false, reason: SUBSET_REFUSALS.malformedBody };
  if (chosen.length === 0) return { ok: false, reason: SUBSET_REFUSALS.emptySubset };
  if (chosen.length > CAPPED_LIST_MAX_ITEMS[fieldKey]) {
    return { ok: false, reason: SUBSET_REFUSALS.overCap };
  }
  if (new Set(chosen).size !== chosen.length) {
    return { ok: false, reason: SUBSET_REFUSALS.duplicateItem };
  }
  if (chosen.some((item) => !offered.includes(item))) {
    return { ok: false, reason: SUBSET_REFUSALS.unknownItem };
  }
  return { ok: true, value: chosen };
}

/* ── what the picker on the card does · F5b ───────────────────────────────
 * The three below are the picker's WHOLE rule set. The card renders items and
 * calls these; it decides nothing. That is what keeps one cap in one file —
 * a card that knew the cap would be a second place to change it, and the one
 * that was forgotten would let her keep four.
 * ─────────────────────────────────────────────────────────────────────── */

/** The fewest items a confirm may keep. Below it the confirm is a reject. */
const MIN_KEPT_ITEMS = 1;

/**
 * The items she keeps after she taps one.
 *
 * A tap on an item she keeps removes it, so a second tap undoes the first. A
 * tap on a new item at the cap adds nothing: the cap is enforced here, and
 * never by a disabled control, because a control is a hint and not a rule. The
 * given list is never changed.
 */
export function toggleItem(
  selected: readonly string[],
  item: string,
  maxItems: number,
): string[] {
  if (selected.includes(item)) return selected.filter((kept) => kept !== item);
  if (selected.length >= maxItems) return [...selected];
  return [...selected, item];
}

/** True when the member may confirm the pick she holds. */
export function canConfirm(selected: readonly string[]): boolean {
  return selected.length >= MIN_KEPT_ITEMS;
}

/**
 * The pick in the order the card offered it, ready for the confirm body.
 *
 * The confirm route stores the items in the order it is sent them, so the
 * record reads in the order the document named them and not in the order she
 * happened to tap. An item the card never offered is dropped here, so the
 * route is never sent one.
 */
export function orderedPick(offered: readonly string[], selected: readonly string[]): string[] {
  return offered.filter((item) => selected.includes(item));
}
