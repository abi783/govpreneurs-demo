/**
 * The ONE computation of `SuccessCenter.naicsCodes` and `primaryNaics` from
 * `naicsBySource`. ENTITIES: pure, no Prisma. Every writer reaches it through
 * `writeNaicsBySource` (`slotWrite.ts`); nothing else derives these columns.
 *
 * SPEC-naics-sources.md §A.3:
 *   naicsCodes   — union of the `sam`, `sbs`, `capability_statement`,
 *                  `my_business` and `unattributed` codes, in `NAICS_CODE_SLOTS`
 *                  order, minus `excluded`, deduplicated with first-seen order.
 *   primaryNaics — SAM's primary when present, else the current value.
 *                  An excluded code is never the primary (Decisions log D18):
 *                  it falls to the current value, then to null.
 */

import { NAICS_CODE_SLOTS, type NaicsBySource } from "./naicsBySource";

/** The two columns `computeNaics` owns. */
export interface ComputedNaics {
  naicsCodes: string[];
  primaryNaics: string | null;
}

/** What the computation needs from the row as it is now. */
export interface CurrentNaics {
  primaryNaics: string | null;
}

/** Computes `naicsCodes` and `primaryNaics` from the slots. An empty or null
 *  `naicsBySource` yields `naicsCodes: []`, never a throw. SC-1. */
export function computeNaics(
  naicsBySource: NaicsBySource | null,
  current: CurrentNaics,
): ComputedNaics {
  const slots = naicsBySource ?? {};
  const excluded = new Set((slots.excluded ?? []).map((e) => e.code));
  const union = new Set<string>();
  for (const slot of NAICS_CODE_SLOTS) {
    for (const code of slots[slot]?.codes ?? []) {
      if (!excluded.has(code)) union.add(code);
    }
  }
  const usable = (code: string | null | undefined): code is string =>
    typeof code === "string" && code !== "" && !excluded.has(code);
  const samPrimary = slots.sam?.primary;
  let primaryNaics: string | null = null;
  if (usable(samPrimary)) primaryNaics = samPrimary;
  else if (usable(current.primaryNaics)) primaryNaics = current.primaryNaics;
  return { naicsCodes: [...union], primaryNaics };
}
