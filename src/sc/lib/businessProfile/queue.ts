/**
 * What needs her (`needsYou`), computed in exactly one place. Pure, so every surface that
 * counts open items reads the same array. Today that is the rail
 * (`SectionNav.tsx`). Computed separately, two counts disagree.
 *
 * Three sources:
 *   1. `open` `ProfileProposal` rows — the queue proper.
 *   2. `ProfileField` rows whose state has `needsYou: true` in `rowContract.ts`.
 *      Existing `needs_review` rows were left on the record by decision, so the
 *      queue must read both or they become invisible.
 *   3. Papers expiring inside the window — the reason `Paper.expiresAt` exists.
 *
 * ABSENT IS NOT A CALL TO ACTION. A `missing` field never enters this queue;
 * `AskCard` offers it one at a time, with a permanent decline.
 *
 * The producer applies no cap, so a count and a list read from it stay the
 * same array.
 */

import { CATALOG, catalogFor, type CatalogField } from "./catalog";
import { expiringPapers, type MbValue } from "./mbValue";
import type { PartId } from "./parts";
import type { ProfileFieldState } from "./registry";
import { rowContract } from "./rowContract";

export interface QueueItem {
  /** The `ProfileField` key this is about. */
  fieldKey: string;
  catalogId: string;
  part: PartId;
  /** What she is being asked to do. `proposal` carries a `proposalId`; the
   *  rest are states already on the record. */
  kind: "proposal" | "review" | "conflict" | "error" | "renewal";
  /** Present only when `kind === "proposal"`. The handle confirm/reject uses. */
  proposalId?: string;
}

export interface NeedsYouInput {
  /** `RecordFieldPayload` satisfies this as it stands — the screen counts from
   *  the payload it already has, never from a second shape. */
  fields: Array<{ fieldKey: string; state: ProfileFieldState; value: MbValue }>;
  /** `ProposalPayload` (ISO string) and `ProposalRow` (a `Date`) both satisfy
   *  this, so the reader and the store need no adapter between them. */
  proposals: Array<{ id: string; fieldKey: string; proposedAt: string | Date }>;
  /** Passed in, never `new Date()` inside — a pure function that reads the
   *  clock cannot be tested at a boundary. */
  now: Date;
}

/** The reading order. A fact she has just produced sits above a problem that has
 *  been sitting there, and a renewal months out is the least urgent of all. */
const KIND_ORDER: readonly QueueItem["kind"][] = ["proposal", "review", "conflict", "error", "renewal"];

/** Every catalog row ranked by priority, ties broken by authored order — so
 *  what she is asked about first is what the catalog already says matters most,
 *  in the order she reads the part in. Built once; the catalog is a constant. */
const RANK_BY_CATALOG_ID: Map<string, number> = new Map(
  [...CATALOG].sort((a, b) => a.priority - b.priority).map((f, index) => [f.id, index]),
);

function makeItem(
  field: CatalogField,
  fieldKey: string,
  kind: QueueItem["kind"],
  proposalId?: string,
): QueueItem {
  return { fieldKey, catalogId: field.id, part: field.part, kind, ...(proposalId ? { proposalId } : {}) };
}

/** Which of the three record kinds a state contributes. Only states that
 *  `rowContract` marks `needsYou` ever reach here. */
function kindForState(state: ProfileFieldState): QueueItem["kind"] {
  if (state === "conflict") return "conflict";
  if (state === "error") return "error";
  return "review";
}

/**
 * The one thing a row asks of her, or nothing.
 *
 * `rowContract(state).needsYou` is the SINGLE definition of "a human has to
 * look" — `missing` is false there, which is why an unanswered question never
 * lands in the queue. A row offers one action, so a papers row that is already
 * asking to be resolved does not also ask to be renewed.
 */
function recordItem(
  field: NeedsYouInput["fields"][number],
  now: Date,
): QueueItem | null {
  const catalog = catalogFor(field.fieldKey);
  if (!catalog) return null; // No catalog home: there is no row to send her to.
  if (rowContract(field.state).needsYou) return makeItem(catalog, field.fieldKey, kindForState(field.state));
  if (expiringPapers(field.value, now).length > 0) return makeItem(catalog, field.fieldKey, "renewal");
  return null;
}

function proposalItems(proposals: NeedsYouInput["proposals"]): QueueItem[] {
  return [...proposals]
    .sort((a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime())
    .flatMap((p) => {
      const catalog = catalogFor(p.fieldKey);
      return catalog ? [makeItem(catalog, p.fieldKey, "proposal", p.id)] : [];
    });
}

/** Every item was built from a catalog row, so the rank is always there; the
 *  fallback keeps the comparator total without a non-null assertion. */
function rankOf(item: QueueItem): number {
  return RANK_BY_CATALOG_ID.get(item.catalogId) ?? RANK_BY_CATALOG_ID.size;
}

/**
 * Everything that needs a human, newest evidence first, then by catalog
 * priority. Uncapped by design — see the header.
 */
export function needsYou(input: NeedsYouInput): QueueItem[] {
  const record = input.fields
    .flatMap((f) => recordItem(f, input.now) ?? [])
    .sort((a, b) => rankOf(a) - rankOf(b));
  // A stable sort, so proposals keep their newest-first order and record items
  // keep their priority order inside each kind.
  return [...proposalItems(input.proposals), ...record].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );
}

/**
 * The same list, filtered to one part. Used by the rail's per-part badge.
 *
 * A FILTER, never a second walk of the record: this is what makes the per-part
 * counts sum to the total, so the rail and the heading cannot disagree.
 */
export function needsYouIn(part: PartId, input: NeedsYouInput): QueueItem[] {
  return needsYou(input).filter((item) => item.part === part);
}
