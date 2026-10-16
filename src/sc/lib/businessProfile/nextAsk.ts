/**
 * Which ONE question we ask her next, and the five we never ask. Pure.
 *
 * There are no component tests in this repo, so the decision lives here where
 * it is tested exhaustively; `AskCard.tsx` is markup over it.
 *
 * The exclusions:
 *  1. DECLINED — `declinedAt` is permanent. A decline that evaporates on reload
 *     is nagging with extra steps. Only a real answer brings it back, and the
 *     member `PUT` clears the date because answering IS revoking.
 *  2. DIANA'S FOURTEEN — they have their own surface, and asking one here would
 *     offer a decline on it, stranding the counter at 13 of 14 forever.
 *  3. ANSWERED — `isAnswered`, the same definition the record view uses.
 *  4. HER TRADE DOES NOT NEED IT — `relevance.ts`. An unknown trade excludes
 *     nothing; only a stated one does.
 *  5. NO EDITOR — a question she has no way to answer is not a question. This
 *     now excludes nothing, but keeps a later kind from being asked about
 *     before it can be answered.
 *
 * ONE ASK PER VISIT. `asked` ends the asking; swapping in the next question on
 * a decline is how twelve taps produced twelve questions in the prototype.
 *
 * Not a second queue: `queue.ts` remains the single producer of "what needs
 * you", and a `missing` field is deliberately not in it.
 */

import { CATALOG, type CatalogField } from "./catalog";
import { fieldKeyFor } from "./crosswalk";
import { isAnswered, none } from "./mbValue";
import type { RecordFieldPayload } from "./payload";
import { tradesOf, worthAsking } from "./relevance";
import { recordLookup, rowEditor, type RowEditor } from "./rowEditor";

/** A question worth asking, before the record is consulted. */
interface Askable {
  field: CatalogField;
  fieldKey: string;
  question: string;
}

export interface Ask extends Askable {
  /** The control she answers it in, seeded from the record. Never null: a
   *  question with nothing to open is not offered at all. */
  editor: RowEditor;
}

export interface AskInput {
  /** The record as the screen holds it — the payload, never a second shape. */
  fields: readonly RecordFieldPayload[];
  /** True once she has answered or declined this visit's question. One ask per
   *  visit; see the header. */
  asked?: boolean;
}

/**
 * Every question the card may ever ask, most useful first.
 *
 * Priority is the catalog's, and ties keep the authored order — so what she is
 * asked first is what the catalog already says matters most, read the way the
 * part reads. Built once; the catalog is a constant.
 */
const ASKABLE: readonly Askable[] = [...CATALOG]
  .sort((a, b) => a.priority - b.priority)
  .flatMap((field) => {
    const question = field.ask;
    if (!question || field.intake) return [];
    // THE BOUNDARY. A catalog id is not a fieldKey — `constraints`, `website`
    // and `owners` are spelled the same in both and silently take the wrong path.
    const fieldKey = fieldKeyFor(field.id);
    return fieldKey ? [{ field, fieldKey, question }] : [];
  });

/**
 * The one question to put in front of her, or nothing.
 *
 * The order of the checks is load-bearing: a declined or answered row is out
 * before its value is ever handed to an editor.
 */
export function nextAsk({ fields, asked }: AskInput): Ask | null {
  if (asked) return null;
  const byKey = new Map(fields.map((f) => [f.fieldKey, f]));
  // A row whose options are her own earlier answers needs the rest of the
  // record to have any; without it the editor closes and the question is not
  // asked, which is the right answer to "she has not listed them yet".
  const record = recordLookup(fields);
  // The catalog's fifth exclusion, and the one it authored but nobody read:
  // "shown only when her trade needs it". Without it the ask card sorts by
  // priority alone and puts "Do you have a health permit for your kitchen?" in
  // front of a roofing contractor. See `relevance.ts` for what an unknown trade
  // means (it is not "not a caterer").
  const trades = tradesOf(fields);

  for (const candidate of ASKABLE) {
    const row = byKey.get(candidate.fieldKey);
    if (row?.declinedAt) continue;
    const value = row?.value ?? none;
    if (isAnswered(value)) continue;
    if (!worthAsking(candidate.field, trades)) continue;
    const editor = rowEditor(candidate.fieldKey, value, record);
    if (editor) return { ...candidate, editor };
  }

  return null;
}
