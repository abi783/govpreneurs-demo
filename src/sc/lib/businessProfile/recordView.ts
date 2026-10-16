/**
 * The questionnaire the payload does not carry. Pure.
 *
 * `read.ts` sends the RECORD — the rows that exist — and deliberately not the
 * 75 questions, which are static. But `Row.tsx` renders `missing`, and a
 * `missing` row by definition has no stored row to come from. That synthesis
 * must happen in EXACTLY ONE place: a page that walks the catalog itself is a
 * second reader of it, and two readers is how the record and the intake form
 * drift apart.
 *
 * THE NAMESPACE HAZARD: a catalog `id` (camelCase) and a `fieldKey`
 * (snake_case) are different vocabularies that COLLIDE on `constraints`,
 * `website` and `owners`. Every function in this folder silently takes the
 * legacy path if handed an id — no error, a wrong answer. This module walks by
 * id, so it translates once at the boundary with `fieldKeyFor`.
 *
 * `knownCount` is to-date and never to-go: there is no surface that shows how
 * far there is left, so there is no function that returns one.
 */

import { PRIORITY, catalogFor, copyFor, fieldsIn, type CatalogField, type Priority } from "./catalog";
import { fieldKeyFor } from "./crosswalk";
import { isAnswered, none } from "./mbValue";
import type { PartId } from "./parts";
import type { RecordFieldPayload } from "./payload";
import { tradesOf, worthAsking } from "./relevance";

/** The three priority tiers, in reading order. */
const TIERS: readonly Priority[] = [1, 2, 3];

/**
 * A question with no row on disk yet.
 *
 * `origin` and `freshnessLabel` are empty rather than invented: `ROW_CONTRACT`
 * marks `missing` as carrying no provenance, so neither is rendered, and
 * "you told us · never" under a question nobody has asked her would be a lie
 * with a dot in it.
 */
function missingRow(field: CatalogField, fieldKey: string): RecordFieldPayload {
  return {
    fieldKey,
    catalogId: field.id,
    part: field.part,
    value: none,
    state: "missing",
    origin: "",
    originKey: null,
    freshnessLabel: "",
    confirmedAt: null,
    expiresAt: null,
    declinedAt: null,
    conflict: null,
    errorMessage: null,
    provenance: null,
  };
}

/**
 * One stored row per catalog row, keyed by catalog id.
 *
 * A row can be reached by more than one key — `can_get_bonding` renders inside
 * the `bonding_capacity` row — so the host key wins where both are stored and
 * the record never shows one question twice.
 */
function storedByCatalogId(
  fields: readonly RecordFieldPayload[],
): Map<string, RecordFieldPayload> {
  const byId = new Map<string, RecordFieldPayload>();
  for (const field of fields) {
    const isHost = fieldKeyFor(field.catalogId) === field.fieldKey;
    if (isHost || !byId.has(field.catalogId)) byId.set(field.catalogId, field);
  }
  return byId;
}

/** One priority tier of unanswered questions, with the catalog's own copy. */
export interface BlankTier {
  priority: Priority;
  label: string;
  note: string;
  rows: RecordFieldPayload[];
}

export interface PartRows {
  /** What we hold, in catalog order. */
  held: RecordFieldPayload[];
  /** What we do not, grouped by tier. Only tiers with something in them. */
  blank: BlankTier[];
}

/**
 * Every row of one part: the stored one where it exists, a `missing` one where
 * it does not, split into what we hold and what is still open.
 *
 * The two rows backed by no `ProfileField` key at all (the photo and the logo,
 * which live on `SuccessCenter` columns) are left out — they have no key for a
 * row to be keyed on, and `ImageUploadCard` is their surface.
 *
 * ── WHAT HER TRADE LEAVES OUT, AND WHAT IT CANNOT ─────────────────────────
 * The catalog tags ten rows with a `trade` and says "Shown only when her trade
 * needs it"; `relevance.worthAsking` is that sentence. It is applied to ONE
 * class of row and no other: a question with no `ProfileField` row behind it,
 * that she has therefore never been asked. A row she has ANSWERED is her record
 * and stays; so does a row we hold anything about at all — a decline, an error,
 * a conflict — because dropping it would take the state with it. Her trade is
 * read from the record she was handed, so nothing new crosses the wire.
 */
export function rowsIn(part: PartId, fields: readonly RecordFieldPayload[]): PartRows {
  const stored = storedByCatalogId(fields);
  const trades = tradesOf(fields);
  const held: RecordFieldPayload[] = [];
  const open: Array<[Priority, RecordFieldPayload]> = [];

  for (const field of fieldsIn(part)) {
    // THE BOUNDARY. Never `field.id` — see the namespace hazard above.
    const fieldKey = fieldKeyFor(field.id);
    if (!fieldKey) continue;
    const row = stored.get(field.id);
    if (row && isAnswered(row.value)) {
      held.push(row);
    } else if (row || worthAsking(field, trades)) {
      open.push([field.priority, row ?? missingRow(field, fieldKey)]);
    }
  }

  const blank = TIERS.map((priority) => ({
    priority,
    label: PRIORITY[priority].label,
    note: PRIORITY[priority].note,
    rows: open.filter(([p]) => p === priority).map(([, row]) => row),
  })).filter((tier) => tier.rows.length > 0);

  return { held, blank };
}

/**
 * How many things we know about her business. A COUNT, and it is the number the
 * page's first line is built from.
 *
 * Counted by catalog row, so the two keys that share the bonding row are one
 * thing we know rather than two.
 */
export function knownCount(fields: readonly RecordFieldPayload[]): number {
  return [...storedByCatalogId(fields).values()].filter((f) => isAnswered(f.value)).length;
}

/**
 * The words a field is named by, from `copyFor` — registry copy where the key
 * has a registry home, the catalog's own where it does not. Never restated
 * here. A key with no catalog home reads as itself rather than as a blank.
 */
export function labelFor(fieldKey: string): string {
  const field = catalogFor(fieldKey);
  return field ? copyFor(field).label : fieldKey;
}
