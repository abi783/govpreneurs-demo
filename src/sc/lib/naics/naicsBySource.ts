/**
 * `SuccessCenter.naicsBySource` — which source gave which NAICS code.
 * ENTITIES: pure types, constants and one pure narrowing function. No Prisma.
 *
 * THE CROSS-REPO CONTRACT. Hunter declares the same shape as
 * `NaicsBySourceWire` in `backend/src/business-profile/naics-by-source.types.ts`.
 * The two must stay field-for-field equal; SPEC-naics-sources.md §A.1 is the
 * authority. `GET /api/portal/profile` and the profile-updated webhook carry it.
 *
 * ARCHITECTURE-naics-sources.md (Hunter worktree) §2 is the contract for the
 * `src/lib/naics/` module.
 */

import { NAICS_CODE } from "@sc/lib/businessProfile/mbValue";
import { hasOwnKey } from "@sc/lib/businessProfile/untrustedInput";

/** The four sources that each own one slot. */
export const NAICS_SOURCE_SLOTS = ["sam", "sbs", "capability_statement", "my_business"] as const;

/** One source slot name. */
export type NaicsSourceSlot = (typeof NAICS_SOURCE_SLOTS)[number];

/** Every slot that holds codes, in UNION ORDER: `computeNaics` lists codes in
 *  the order they first appear walking these slots. */
export const NAICS_CODE_SLOTS = [...NAICS_SOURCE_SLOTS, "unattributed"] as const;

/** One code-bearing slot name. */
export type NaicsCodeSlot = (typeof NAICS_CODE_SLOTS)[number];

/** The validator service key that writes each source slot (SC-2). `my_business`
 *  has no validator: the My Business save writes it (SC-3). */
export const VALIDATOR_NAICS_SLOT = {
  sam: "sam",
  sbs: "sbs",
  capability: "capability_statement",
} as const satisfies Record<string, NaicsSourceSlot>;

/** One source's codes. `primary` is written for `sam` and `capability_statement`
 *  only. `updatedAt` is ISO-8601. */
export interface NaicsSlotEntry {
  codes: string[];
  primary?: string | null;
  updatedAt: string;
}

/** A code the member unticked on her My Business page. `at` is ISO-8601. */
export interface ExcludedNaicsCode {
  code: string;
  at: string;
}

/** Codes the centre held before sources were recorded (SC-6 backfill). */
export interface UnattributedNaics {
  codes: string[];
}

/** The whole column. A slot no source has written is absent. */
export interface NaicsBySource {
  sam?: NaicsSlotEntry;
  sbs?: NaicsSlotEntry;
  capability_statement?: NaicsSlotEntry;
  my_business?: NaicsSlotEntry;
  excluded?: ExcludedNaicsCode[];
  unattributed?: UnattributedNaics;
}

/**
 * Narrows the stored JSON (or any untrusted value) into `NaicsBySource`. NULL
 * and anything unreadable become `{}`, never a throw. Drops a code that fails
 * `NAICS_CODE` (`src/lib/businessProfile/mbValue.ts`), and reads keys through
 * `hasOwnKey` (`src/lib/businessProfile/untrustedInput.ts`). SC-1.
 */
export function parseNaicsBySource(json: unknown): NaicsBySource {
  if (!isRecord(json)) return {};
  const out: NaicsBySource = {};
  for (const slot of NAICS_SOURCE_SLOTS) {
    const entry = hasOwnKey(json, slot) ? parseSlotEntry(json[slot]) : null;
    if (entry) out[slot] = entry;
  }
  const excluded = hasOwnKey(json, "excluded") ? parseExcluded(json.excluded) : null;
  if (excluded) out.excluded = excluded;
  const unattributed = hasOwnKey(json, "unattributed") ? parseCodeList(json.unattributed) : null;
  if (unattributed) out.unattributed = { codes: unattributed };
  return out;
}

/**
 * The column as it goes to Hunter: null when the column is NULL, else the
 * parsed shape. Never the raw column, because Hunter refuses a malformed wire
 * whole, and never a type other than an object or null. SC-4.
 */
export function naicsBySourceWire(json: unknown): NaicsBySource | null {
  return json == null ? null : parseNaicsBySource(json);
}

/**
 * The slots a write starts from. A column that was NEVER written (NULL) holds
 * today's `naicsCodes` as `unattributed`, so a write that lands before the
 * SC-6 backfill keeps every code the member has now (Decisions log D30).
 * `writeNaicsBySource` compares its result with this to decide whether to
 * write; the SC-6 backfill uses it to say in a dry run what that write would
 * do. SC-1.
 */
export function startingNaicsBySource(stored: unknown, naicsCodes: unknown): NaicsBySource {
  if (stored !== null && stored !== undefined) return parseNaicsBySource(stored);
  const codes = naicsCodeList(naicsCodes);
  return codes.length > 0 ? { unattributed: { codes } } : {};
}

/** True for a plain object (not null, not an array). THE one copy (D132). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A NAICS code read from untrusted input: trimmed, then `NAICS_CODE`; null for
 * anything else. THE one rule (D132). It returns the code rather than acting as
 * a type guard, because a guard that trims would pass " 561790" on untrimmed.
 */
export function toNaicsCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim();
  return NAICS_CODE.test(code) ? code : null;
}

/**
 * A list of NAICS codes read from untrusted JSON: each entry through
 * `toNaicsCode`, deduplicated in first-seen order. Anything that is not a list
 * reads as none. THE one list parser (D132): the trade save, the validators,
 * the stored column and the backfill all read codes through it.
 */
export function naicsCodeList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const codes = raw.map(toNaicsCode).filter((code): code is string => code !== null);
  return [...new Set(codes)];
}

/**
 * An ISO-8601 date or instant. Hunter refuses the whole wire for a date it
 * cannot parse (Hunter D51), so the parser drops such a slot or entry and the
 * wire never carries one (D133).
 */
const ISO_8601 = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/** True for a string in ISO-8601 form that names a real date. */
function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_8601.test(value) && Number.isFinite(Date.parse(value));
}

/** The `codes` of `{ codes: [...] }`, NAICS codes only; null when unreadable. */
function parseCodeList(raw: unknown): string[] | null {
  if (!isRecord(raw) || !hasOwnKey(raw, "codes") || !Array.isArray(raw.codes)) return null;
  return naicsCodeList(raw.codes);
}

/** One source slot; null when it has no code list or no ISO `updatedAt`. A
 *  `primary` that is not a NAICS code reads as null. */
function parseSlotEntry(raw: unknown): NaicsSlotEntry | null {
  const codes = parseCodeList(raw);
  if (!codes || !isRecord(raw) || !isIsoDate(raw.updatedAt)) return null;
  // Keys in the SPEC §A.1 order, so a parsed entry serialises like the stored one.
  if (!hasOwnKey(raw, "primary")) return { codes, updatedAt: raw.updatedAt };
  return { codes, primary: toNaicsCode(raw.primary), updatedAt: raw.updatedAt };
}

/** The `excluded` list, keeping only entries with a NAICS code and an ISO `at`. */
function parseExcluded(raw: unknown): ExcludedNaicsCode[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ExcludedNaicsCode[] = [];
  for (const e of raw) {
    const code = isRecord(e) ? toNaicsCode(e.code) : null;
    if (code && isRecord(e) && isIsoDate(e.at)) out.push({ code, at: e.at });
  }
  return out;
}
