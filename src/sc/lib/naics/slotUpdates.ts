/**
 * Pure changes to `naicsBySource`. ENTITIES: no Prisma. Each returns a NEW
 * object and leaves every part it does not name byte-equal.
 *
 * `writeNaicsBySource` (`slotWrite.ts`) applies one of these (or a composition)
 * to the row it reads. A writer never edits the JSON by hand.
 */

import type {
  ExcludedNaicsCode,
  NaicsBySource,
  NaicsCodeSlot,
  NaicsSlotEntry,
} from "./naicsBySource";

/** One change to the column. Compose with `composeUpdates`. */
export type NaicsBySourceUpdate = (current: NaicsBySource) => NaicsBySource;

/**
 * Replaces one slot. When the new entry holds the same codes and primary as the
 * stored one, returns `current` UNCHANGED — `updatedAt` included — so a re-run
 * that found nothing new fires no profile-updated webhook (Decisions log D25).
 * `unattributed` stores `{ codes }` only. SC-1.
 */
export function setSlot(slot: NaicsCodeSlot, entry: NaicsSlotEntry): NaicsBySourceUpdate {
  return (current) => {
    if (slot === "unattributed") {
      if (sameCodes(current.unattributed?.codes, entry.codes)) return current;
      return { ...current, unattributed: { codes: [...entry.codes] } };
    }
    const stored = current[slot];
    if (stored && sameCodes(stored.codes, entry.codes) && samePrimary(stored, entry)) {
      return current;
    }
    return { ...current, [slot]: { ...entry, codes: [...entry.codes] } };
  };
}

/** Adds each code to `excluded` with `at`; a code already excluded keeps its
 *  first `at`. Only the member's picker save calls this (Decisions log D1). SC-1. */
export function excludeCodes(codes: readonly string[], at: string): NaicsBySourceUpdate {
  return (current) => {
    const held = current.excluded ?? [];
    const known = new Set(held.map((e) => e.code));
    const added: ExcludedNaicsCode[] = [];
    for (const code of codes) {
      if (known.has(code)) continue;
      known.add(code);
      added.push({ code, at });
    }
    return added.length === 0 ? current : { ...current, excluded: [...held, ...added] };
  };
}

/** Removes each code from `excluded`. Every My Business save calls this for the
 *  codes it submits. SC-1. */
export function unexcludeCodes(codes: readonly string[]): NaicsBySourceUpdate {
  return (current) => {
    const held = current.excluded ?? [];
    const drop = new Set(codes);
    const kept = held.filter((e) => !drop.has(e.code));
    return kept.length === held.length ? current : { ...current, excluded: kept };
  };
}

/** Applies the updates left to right. SC-1. */
export function composeUpdates(...updates: NaicsBySourceUpdate[]): NaicsBySourceUpdate {
  return (current) => updates.reduce((acc, update) => update(acc), current);
}

/** Same codes in the same order. Order matters: it sets the union order. */
function sameCodes(a: readonly string[] | undefined, b: readonly string[]): boolean {
  return a !== undefined && a.length === b.length && a.every((code, i) => code === b[i]);
}

/** Same primary, where an absent primary equals a null one. */
function samePrimary(a: NaicsSlotEntry, b: NaicsSlotEntry): boolean {
  return (a.primary ?? null) === (b.primary ?? null);
}
