/**
 * The source chips on the "Your trade" picker: which source gave a NAICS code,
 * in the words the member reads. ENTITIES: pure, no Prisma, no React. SC-5.
 *
 * A code that a named source lists never also reads "Unverified": that chip
 * means no source we can name gave the code. A code no slot holds at all is
 * unverified too — a column that was never written holds today's codes as
 * `unattributed` (Decisions log D30).
 *
 * The picker shows them as the columns of its sources table
 * (`TradeSourcesTable.tsx`), not as coloured chips (Shyam, 9 Oct 2026).
 */

import { NAICS_SOURCE_SLOTS, type NaicsCodeSlot, type NaicsSourceSlot } from "./naicsBySource";

/** The chip label for each code-bearing slot. */
export const SOURCE_CHIP_LABEL = {
  sam: "SAM",
  sbs: "SBA",
  capability_statement: "Capability statement",
  my_business: "You picked",
  unattributed: "Unverified",
} as const satisfies Record<NaicsCodeSlot, string>;

/** One source chip: the slot that gave the code, and the words the member reads. */
export interface SourceChip {
  slot: NaicsCodeSlot;
  label: (typeof SOURCE_CHIP_LABEL)[NaicsCodeSlot];
}

function chipFor(slot: NaicsCodeSlot): SourceChip {
  return { slot, label: SOURCE_CHIP_LABEL[slot] };
}

/** The code lists `sourceChips` reads: each source slot's codes, nothing else. */
export type CodeListsBySource = { readonly [S in NaicsSourceSlot]?: { readonly codes: readonly string[] } };

/** The chips for one code, in `NAICS_CODE_SLOTS` order. Never empty. */
export function sourceChips(code: string, bySource: CodeListsBySource): SourceChip[] {
  const named = NAICS_SOURCE_SLOTS.filter((slot) => bySource[slot]?.codes.includes(code));
  if (named.length === 0) return [chipFor("unattributed")];
  return named.map(chipFor);
}
