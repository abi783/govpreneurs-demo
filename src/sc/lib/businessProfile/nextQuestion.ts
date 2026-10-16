/**
 * Which question "Answer the next one" sends her to. Pure.
 *
 * A MODULE OF ITS OWN BECAUSE IT IS A DECISION, and this one has been wrong
 * twice in two different ways while living inside a component that renders it:
 *
 *   · it took the first open row in CATALOG order, and `parts.ts` says of
 *     itself that "RENDER order lives on `PARTS` and is deliberately
 *     different" — so it pointed at `business`, the LAST part on the rail,
 *     while `sell`, the first, still had rows open;
 *   · it read a row's STATE to decide it was answered, and clearing a row
 *     leaves it `attested` with a null value — so a blank question counted as
 *     done and the link walked straight past it.
 *
 * Both are orderings and predicates, which are exactly the things a test can
 * hold and a rendered component cannot.
 */

import { CATALOG_PART_IDS, PARTS } from "./parts";
import type { CatalogField } from "./catalog";
import type { RecordFieldPayload } from "./payload";
import { answersToCheck } from "./handoff";
import { isSettled } from "./score";

/** The order she is OFFERED the parts in, which is not the order they are
 *  declared in. `SectionBreakdown` filters the same list the same way. */
export const RAIL_ORDER: readonly string[] = PARTS.filter((part) =>
  (CATALOG_PART_IDS as readonly string[]).includes(part.id),
).map((part) => part.id);

/** Where to send her: Basic Info, or one part of the record. */
export interface NextQuestion {
  /** `null` for Basic Info — it is the landing screen, not a part. */
  part: string | null;
  /** The row to scroll to, or null for a virtual row with no key. */
  fieldKey: string | null;
}

/**
 * The first of Diana's fourteen she has not settled, in the order she was
 * asked them — `answersToCheck` is the same walk the check-answers screen
 * uses, so "the next one" and the form she fills read one list in one order.
 */
export function firstUnansweredBasic(
  fields: readonly RecordFieldPayload[],
): RecordFieldPayload | undefined {
  return answersToCheck(fields).find((row) => !isSettled(row));
}

/**
 * The earliest PART on the rail with an open row, and within it the first.
 *
 * Strictly-less-than on the rail index, so a part that ties keeps the earlier
 * field — the list arrives in catalog order, which is the order the rows are
 * asked in INSIDE a part, and that is what that order is for.
 */
export function firstInRailOrder(fields: readonly CatalogField[]): CatalogField | undefined {
  let best: CatalogField | undefined;
  let bestIndex = Number.POSITIVE_INFINITY;
  for (const field of fields) {
    const index = RAIL_ORDER.indexOf(field.part);
    if (index !== -1 && index < bestIndex) {
      bestIndex = index;
      best = field;
    }
  }
  // A row whose part is not on the rail still deserves a destination.
  return best ?? fields[0];
}

/**
 * BASIC INFO FIRST, WHOLE.
 *
 * The fourteen are what a mentor reads before the first call and they carry a
 * deadline the rest of the record does not, so one of them still open outranks
 * any part row — a tier-1 one included. They are not a part: they live on the
 * landing screen and their fields are spread across all five, which is why
 * this cannot fall out of the rail walk and has to be asked first.
 */
export function nextQuestion(
  fields: readonly RecordFieldPayload[],
  blocking: readonly CatalogField[],
  open: readonly CatalogField[],
): NextQuestion | null {
  const basic = firstUnansweredBasic(fields);
  if (basic) return { part: null, fieldKey: basic.fieldKey };
  const rail = firstInRailOrder(blocking) ?? firstInRailOrder(open);
  return rail ? { part: rail.part, fieldKey: rail.key } : null;
}
