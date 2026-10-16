/**
 * readyScore / sectionScore — the fraction the redesigned header, the rail's
 * score card and the section breakdown all read. Pure.
 *
 * THIS IS A DELIBERATE, RECORDED EXCEPTION TO THE RULE THE REST OF THIS FOLDER
 * ENFORCES. `recordView.ts`'s `knownCount` and `mbValue.ts`'s `itemCount` both
 * say a percentage/fraction is "the number this product does not show", and
 * `layout.tsx`'s header cites the GDS finding that a progress display
 * intimidated users without moving completion. The 2026-09 My Business
 * redesign chose to reintroduce a fraction anyway — "8 of 52" rather than a
 * bare count — for exactly the three surfaces this file feeds. Nothing else
 * in the folder changes: the rail's per-part badges are still `needsYou()`
 * open-item counts (`queue.ts`), never a score, and `knownCount` still backs
 * anything that isn't one of those three surfaces.
 *
 * Ported from the prototype's `src/lib/profile/score.ts`, against this app's
 * real `CATALOG`/`ProfileField` state rather than the prototype's mock `Held`
 * record:
 *
 *   - "core" vs "extra" is `catalog.ts`'s existing `priority`/`intake` split —
 *     `isExtra(f) = !f.intake && f.priority === 3` — the same rule the
 *     prototype's `trophy/catalogue.ts` used, needing no new data.
 *   - "answered" additionally excludes anything `rowContract.ts` marks
 *     `needsYou` (`needs_review` / `inferred` / `conflict` / `error`) even
 *     when it carries a value — a proposal read off paperwork isn't a settled
 *     fact until she confirms it. The prototype drew this line with its own
 *     `isAnswered`/`WAITING` pair; here it is `rowContract`, already the
 *     single definition of "a human must still look".
 *   - the denominator is trade-filtered exactly as `recordView.rowsIn` filters
 *     what a part ASKS: a row tagged `trade: "food"` counts against the total
 *     only for a member who has said she does that trade (or hasn't said
 *     yet — `worthAsking` treats "unknown" as "ask anyway"). Skipping this
 *     would make 52/52 unreachable for a roofer who will never see the four
 *     catering-only rows.
 *   - the two VIRTUAL rows (`profilePhoto`, `businessLogo` — `key: null`) are
 *     counted only when the caller passes `media`, which is the one thing that
 *     can say whether they are there. They used to be dropped outright, which
 *     left "Extras added" reading 0 of 21 against the prototype's 0 of 23 —
 *     two questions this page ASKS, with an upload card each at the top of
 *     Basic Info, counting toward nothing. Without `media` they still drop,
 *     because a total that cannot be reached is worse than a smaller one.
 */

import { CATALOG, fieldsIn, type CatalogField } from "./catalog";
import { isAnswered } from "./mbValue";
import type { CatalogPartId } from "./parts";
import type { RecordFieldPayload } from "./payload";
import { rowContract } from "./rowContract";
import { tradesOf, worthAsking } from "./relevance";
import { fieldKeyFor } from "./crosswalk";
import { noneIsAnAnswer } from "./legacyShapes";

export interface ReadyScore {
  /** `settled + extra` — every core and extra question answered, for the one
   *  place (if ever) that wants the two folded back together. */
  answered: number;
  /** How many rows were even in play — trade-filtered, virtual rows dropped. */
  questions: number;
  /** Core (non-extra) questions settled. */
  settled: number;
  /** Core (non-extra) questions in play. The headline's denominator. */
  total: number;
  /** Core, priority-1 rows not yet settled — the ones nothing else can start
   *  without. A subset of `open`. */
  blocking: CatalogField[];
  /** EVERY core question not yet settled, in catalog order — tier-1 gaps, the
   *  tier-2 and tier-3 ones behind them, and the rows carrying a value that
   *  still needs her look. The next-step control reads `blocking` first and
   *  falls back to this, so it keeps pointing somewhere while any core
   *  question is open rather than disappearing the moment the tier-1 rows are
   *  settled. */
  open: CatalogField[];
  /** Rows carrying a value that still needs a human look — read straight off
   *  `rowContract`, never recomputed. */
  waiting: RecordFieldPayload[];
  /** Extra (tier-3, non-intake) questions settled. */
  extra: number;
  /** Extra questions in play. */
  extraTotal: number;
  /** Every core question settled — the whole-part or whole-record tick. */
  done: boolean;
}

/** `catalogue.ts`'s rule in the prototype, unchanged: intake fields are never
 *  "extra" even at tier 3 — asked before the first call, they are core by
 *  definition regardless of how little else depends on them. */
function isExtra(field: CatalogField): boolean {
  return !field.intake && field.priority === 3;
}

/**
 * Whether the photo and the logo are there.
 *
 * THE TWO ROWS THE `fields` LIST CANNOT ANSWER. Both are stored on the
 * `SuccessCenter` row rather than as `ProfileField`s, so their catalog `key` is
 * null and nothing in `fields` will ever settle them. They were dropped from
 * the count for that reason, which made "Extras added" read 0 of 21 where the
 * prototype reads 0 of 23 — two questions the page ASKS, with two upload cards
 * at the top of Basic Info, counting toward nothing.
 *
 * Passing them in settles them properly. Counting them WITHOUT this would have
 * been the worse bug: a denominator of 23 that stops at 21 forever.
 */
export interface MediaHeld {
  photoUrl: string | null;
  logoUrl: string | null;
}

/** Which `MediaHeld` line answers each keyless catalog row. */
const MEDIA_ROWS: Record<string, keyof MediaHeld> = {
  profilePhoto: "photoUrl",
  businessLogo: "logoUrl",
};

function isCore(field: CatalogField): boolean {
  return !isExtra(field);
}

/**
 * One stored row per catalog row, host key wins.
 *
 * Duplicated from `recordView.ts`'s private `storedByCatalogId` rather than
 * exported from there — that file is stable and heavily pinned by
 * `recordView.test.ts`, and widening its public surface for this one caller
 * risked more than a 12-line duplicate does. Keep the two in sync by hand if
 * the host-key rule ever changes.
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

/** A row counts as SETTLED only with a value AND no outstanding human check —
 *  `rowContract(state).needsYou` is that single check, read rather than
 *  reimplemented.
 *
 *  EXPORTED for "Answer the next one", which asks the same question of Diana's
 *  fourteen. State alone is not the test: clearing a row leaves it `attested`
 *  with a null value, so a state-only check calls an empty answer answered —
 *  which is exactly what sent the link past a blank question. */
export function isSettled(row: RecordFieldPayload | undefined): boolean {
  if (!row) return false;
  // `value` is null on a cleared row at runtime, whatever the type says.
  const stated = row.value?.kind === "none" && noneIsAnAnswer(row.fieldKey);
  if (!stated && !isAnswered(row.value)) return false;
  return !rowContract(row.state).needsYou;
}

/**
 * The fraction for one catalog slice (the whole record, or one part via
 * `sectionScore`). Filtered to what her trade actually asks, so the
 * per-section rows sum to the headline by construction — same slice, same
 * filter, walked once each.
 */
export function readyScore(
  fields: readonly RecordFieldPayload[],
  catalog: readonly CatalogField[] = CATALOG,
  media?: MediaHeld,
): ReadyScore {
  const stored = storedByCatalogId(fields);
  const trades = tradesOf(fields);

  /** One answer to "is this row settled", whichever store holds it. */
  const settledAt = (field: CatalogField): boolean =>
    field.key === null
      ? media !== undefined && media[MEDIA_ROWS[field.id] ?? "photoUrl"] !== null
      : isSettled(stored.get(field.id));

  const askable = catalog.filter((field) => {
    // The photo and the logo count only where the caller can say whether they
    // are there. Without `media` they behave as they always did and drop out,
    // so no caller is given a total it can never reach.
    if (field.key === null) return media !== undefined && field.id in MEDIA_ROWS;
    // A row with no prompt to add it is WORKED OUT, never asked (`size_status`,
    // the same rule `tellModel.mayFill` applies). Nothing works it out yet, so
    // counting it would stop every member one short of done, forever.
    if (!field.addPrompt) return false;
    const row = stored.get(field.id);
    return isSettled(row) || worthAsking(field, trades);
  });

  const core = askable.filter(isCore);
  const extras = askable.filter(isExtra);

  const settled = core.filter(settledAt).length;
  const extra = extras.filter(settledAt).length;

  const open = core.filter((field) => !settledAt(field));
  const blocking = open.filter((field) => field.priority === 1);

  const waiting = askable.flatMap((field) => {
    const row = stored.get(field.id);
    return row && rowContract(row.state).needsYou ? [row] : [];
  });

  return {
    answered: settled + extra,
    questions: askable.length,
    settled,
    total: core.length,
    blocking,
    open,
    waiting,
    extra,
    extraTotal: extras.length,
    done: settled === core.length,
  };
}

/**
 * A `settled / total` pair as a bar width, in whole percent.
 *
 * CLAMPED: a numerator above its denominator must never run a fill past the
 * end of its track. Lives here, beside the fraction it draws, so the clamp
 * cannot drift away from the numbers — every track on the page reads this one
 * function rather than repeating the arithmetic. It returns a number, not a
 * CSS string, so it carries no presentation knowledge.
 */
export function fillPercent(settled: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((settled / total) * 100)) : 0;
}

/** The same fraction, filtered to one part — the breakdown row that has to
 *  sum, over all five parts, to the headline `readyScore(fields)`. */
export function sectionScore(
  part: CatalogPartId,
  fields: readonly RecordFieldPayload[],
  media?: MediaHeld,
): ReadyScore {
  return readyScore(fields, fieldsIn(part), media);
}

/** The rail's per-part tick: nothing answered, some, or every core question
 *  in the part settled. */
export function partState(
  part: CatalogPartId,
  fields: readonly RecordFieldPayload[],
  media?: MediaHeld,
): "empty" | "partly" | "settled" {
  const score = sectionScore(part, fields, media);
  if (score.answered === 0) return "empty";
  return score.done ? "settled" : "partly";
}
