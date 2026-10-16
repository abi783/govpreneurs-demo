/**
 * Which "Your trade" codes she CHOSE herself. ENTITIES: pure, no React, no
 * Prisma. Decisions log D152.
 *
 * The `my_business` slot holds every code in her saved answer, and a prefill
 * (the old picker's save, a proposal she confirmed, a sync) can put codes there
 * that she never picked. The "You picked" chip must not claim those. The
 * owner's rule: a code she picked is either under one of the trades in her
 * answer, or a code she added through "Search all NAICS codes".
 *
 * The picker records the second half in the saved answer as `searched` (the
 * codes she added through the search, kept only while they stay in `naics`).
 * An answer saved before that record existed has no `searched` member, and
 * nothing on disk tells a search pick from a prefill (D153). For such an
 * answer, a code outside her trades is read as a search pick only when no
 * other source (SAM, SBA, her capability statement) lists it: no prefill from
 * those sources can have put it there.
 *
 * THE SAVED ANSWER IS THE EVIDENCE (D156). A code she chose, and that is in
 * her saved answer's `naics`, reads "You picked" even when the `my_business`
 * slot does not list it: the slot is missing until the backfill runs, and it
 * goes stale. A code under her trade that is NOT in her saved answer is not
 * hers.
 *
 * This decides what the chip SAYS. It never decides what matching uses.
 */

import { NAICS_SOURCE_SLOTS, isRecord, naicsCodeList, type NaicsBySource } from "@sc/lib/naics/naicsBySource";
import type { CodeListsBySource } from "@sc/lib/naics/sourceChips";
import { hasOwnKey } from "./untrustedInput";
import { WORK_TYPE_TO_NAICS } from "./workTypeTaxonomy";

/** The sources other than her own answer. */
const OTHER_SOURCE_SLOTS = NAICS_SOURCE_SLOTS.filter((slot) => slot !== "my_business");

/** True when a source other than her own answer (SAM, SBA, her capability statement) lists `code`. */
export function listedByOtherSource(code: string, bySource: NaicsBySource): boolean {
  return OTHER_SOURCE_SLOTS.some((slot) => bySource[slot]?.codes.includes(code));
}

/** The saved answer's trades and codes, read defensively. */
function answerOf(stored: unknown): { categories: string[]; naics: string[] } {
  if (!isRecord(stored)) return { categories: [], naics: [] };
  const categories = Array.isArray(stored.categories)
    ? stored.categories.filter((s): s is string => typeof s === "string")
    : [];
  return { categories, naics: naicsCodeList(stored.naics) };
}

/** Every code the given trades hold. A trade name with no codes holds none. */
export function codesUnder(categories: readonly string[]): Set<string> {
  return new Set(categories.flatMap((trade) => WORK_TYPE_TO_NAICS[trade] ?? []));
}

/**
 * The stored search record: the codes she added through the search that are
 * still in her answer. Null when the answer has no readable record (saved
 * before it existed, or not a list).
 */
export function storedSearchPicks(stored: unknown): string[] | null {
  if (!isRecord(stored) || !hasOwnKey(stored, "searched") || !Array.isArray(stored.searched)) return null;
  const naics = new Set(answerOf(stored).naics);
  return naicsCodeList(stored.searched).filter((code) => naics.has(code));
}

/**
 * Her search picks as the picker opens: the stored record, or for an answer
 * saved before it, each code outside her trades that no other source lists.
 */
export function searchPicksAtOpen(stored: unknown, bySource: NaicsBySource): string[] {
  const recorded = storedSearchPicks(stored);
  if (recorded) return recorded;
  const { categories, naics } = answerOf(stored);
  const underTrades = codesUnder(categories);
  return naics.filter((code) => !underTrades.has(code) && !listedByOtherSource(code, bySource));
}

/**
 * The codes the "You picked" chip names: the codes in her saved answer that
 * are under a trade in that answer, and her search picks (D156).
 */
export function chosenCodes(stored: unknown, bySource: NaicsBySource): Set<string> {
  const { categories, naics } = answerOf(stored);
  const underTrades = codesUnder(categories);
  return new Set([...naics.filter((code) => underTrades.has(code)), ...searchPicksAtOpen(stored, bySource)]);
}

/**
 * Her sources for one code, with her own answer set by `chosen` alone: listed
 * when she chose the code, left out when she did not (D152, D156).
 */
export function chipSources(code: string, bySource: NaicsBySource, chosen: ReadonlySet<string>): CodeListsBySource {
  const others: CodeListsBySource = { ...bySource, my_business: undefined };
  return chosen.has(code) ? { ...others, my_business: { codes: [code] } } : others;
}
