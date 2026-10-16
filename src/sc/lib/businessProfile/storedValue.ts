/**
 * What the record will accept under one key, decided once and on the SERVER.
 * Pure.
 *
 * `parseMbValue` is the one parser, but until this module it ran only in the
 * browser. The member `PUT` is a no-token portal route that validated the key
 * and nothing else, so an oversized value was stored verbatim and every cap was
 * bypassable by anyone with the URL. A validator that runs only on the client
 * is not a validator.
 *
 * `storageFor(fieldKey)` picks the branch:
 *   mb     — the value IS an `MbValue`, so `parseMbValue` is the whole check.
 *   legacy — the shape on disk is older than the parser and deliberately not
 *            expressible in it (a `primary_industry` category lifts to a `Code`
 *            with an empty `code`, which the parser refuses by design), so
 *            running it here would 422 every good save on all 35 keys. They are
 *            checked by `legacyShapes`' own adapters: lift, then lower. A value
 *            no adapter can read lowers to `null` and is REFUSED — never stored
 *            as `null`, because silently emptying a row she just filled in is
 *            the data loss this module exists to stop.
 *
 * No second cap table and no truncation. A value the record cannot hold comes
 * back as a refusal with a sentence she can read; `reason` is the machine half,
 * for the log, never her sentence.
 */

import { ownRow, specOf } from "./catalog";
import { fromMb, storageFor, toMb } from "./legacyShapes";
import {
  MbValueError,
  parseMbValue,
  emailProblem,
  phoneProblem,
  websiteProblem,
  yearProblem,
  zipProblem,
  cageProblem,
  einProblem,
  ueiProblem,
  isUnknownValue,
  unknown as unknownValue,
  type Address,
} from "./mbValue";

/** The one sentence a member reads when the record refuses her answer. */
export const REFUSED_MESSAGE = "We could not store that answer as it is written.";

/** The value to write, once the record has agreed to hold it. */
export interface AcceptedValue {
  ok: true;
  /** What to store — the parsed `MbValue`, or the lowered legacy shape. */
  value: unknown;
}

/** A refusal: one sentence for her, one for the log. Never a truncation. */
export interface RefusedValue {
  ok: false;
  message: string;
  /** Why, in the validator's own words. For the server log only. */
  reason: string;
}

export type Acceptance = AcceptedValue | RefusedValue;

/** `message` defaults to the one sentence: a parser reason names catalog ids
 *  and payload paths, so only a rule that HAS member-facing words passes any. */
function refuse(reason: string, message: string = REFUSED_MESSAGE): RefusedValue {
  return { ok: false, message, reason };
}


/**
 * An `mb` key stores a parsed `MbValue`, so the single parser is the whole
 * check. No `RecordLookup` is passed: the only `optionsFrom` row in the catalog
 * is `service_to_sell_to_government`, which is a FROZEN key and therefore takes
 * the legacy branch — an `mb` key can never reach `parseChoice`'s lookup arm.
 */
function acceptMb(fieldKey: string, incoming: unknown): Acceptance {
  const field = ownRow(fieldKey);
  if (!field) return refuse(`"${fieldKey}" has no catalog row of its own to validate against`);
  try {
    return { ok: true, value: parseMbValue(incoming, specOf(field)) };
  } catch (error) {
    // A value the record refuses is an answer to report. Anything else is a
    // fault and is left to surface as one. A rule that can say what the answer
    // should LOOK like says it — a code's shape is one she can act on without
    // being told her code is wrong.
    if (error instanceof MbValueError) return refuse(error.message, error.memberMessage);
    throw error;
  }
}

/**
 * Shape rules a legacy key carries beyond "its adapter could read it", each
 * answering the member's own sentence or null.
 *
 * `company_address` widened into parts, and the parts are checkable in a way one
 * line never was — a ZIP either is one or is not. The rest are fields that took
 * any text at all: "asda" saved as a web address and went out to Hunter and onto
 * a capability statement as one.
 *
 * Every rule here is permissive by design. Each exists to catch a word, a
 * sentence or a wrong kind of thing — not to adjudicate what resolves or who
 * answers. A stricter pattern refuses real answers and she has no way to argue.
 */
const LEGACY_SHAPE_RULES: Record<string, (incoming: unknown) => string | null> = {
  company_address: (incoming) => zipProblem((incoming as Address | null)?.postalCode),
  // Same parts, same rule — and it applies to what Google fills in as much as
  // to what she types, which is why the ZIP+4 suffix is dropped on the way in.
  home_address: (incoming) => zipProblem((incoming as Address | null)?.postalCode),
  year_started_operating: (incoming) => yearProblem(incoming),
  // Was an inline branch in the member `PUT`, which meant every other channel
  // that can land an email — confirm, resolve-conflict, the learned-fact sync,
  // the warm-start webhook, the tell extractor — skipped it.
  email: (incoming) => emailProblem(incoming),
  phone: (incoming) => phoneProblem(incoming),
  // Her business line, checked exactly as her own is. It had no rule at
  // all, so the same value refused on one key was stored on the other.
  company_phone: (incoming) => phoneProblem(incoming),
  company_email: (incoming) => emailProblem(incoming),
  // The `{has, url}` shape: only the "yes" branch carries an address, and the
  // other two are answers in their own right with nothing to check.
  website: (incoming) => websiteProblem((incoming as { url?: unknown } | null)?.url),
};

/**
 * The legacy shape rule for one key, or null where it has none.
 *
 * Exported so the EDITOR can ask the same question before sending. `mb` keys
 * were already refused in the browser — `lowerForSave` runs `parseMbValue`
 * locally, which is why a malformed UEI never leaves the page — but a legacy
 * key had no client-side check at all, so a bad ZIP or year made a round trip
 * and came back a 422. Same table, both sides: the server stays the gate that
 * decides, and the editor stops making her wait to be told.
 */
export function legacyProblem(fieldKey: string, incoming: unknown): string | null {
  if (incoming === null || incoming === "") return null;
  return LEGACY_SHAPE_RULES[fieldKey]?.(incoming) ?? null;
}

/**
 * A legacy key stores the shape it has always stored, so its own adapter is the
 * check: lift it, lower it, and store what came back.
 *
 * Lowering the lifted value is what applies the adapter's two documented
 * absent-member normalisations (a `primary_industry` row gains `naics: []`, a
 * `geographic_coverage` row gains `cities: []`) — the same normalisations
 * `Row.tsx` already seeds its editors through. Nothing is dropped by them.
 */
function acceptLegacy(fieldKey: string, incoming: unknown): Acceptance {
  // Clearing a row is always allowed: every adapter reads `null` and `""` as an
  // absence rather than as an answer, and there is nothing in either to cap.
  if (incoming === null || incoming === "") return { ok: true, value: incoming };

  // Checked on the INCOMING value, before the adapter sees it. A rule the
  // adapter cannot enforce itself, because `toMb` must never throw — a bad row
  // has to stay readable or her whole record fails to load — and one that has
  // to run FIRST: an adapter that cannot read a value lowers it to null, which
  // is refused with the general sentence, so a rule reading the lowered value
  // would never fire on exactly the answers it exists to explain.
  const problem = LEGACY_SHAPE_RULES[fieldKey]?.(incoming);
  if (problem) return refuse(`"${fieldKey}" failed its shape rule`, problem);

  const lowered = fromMb(fieldKey, toMb(fieldKey, incoming))[fieldKey];
  if (lowered === null || lowered === undefined) {
    return refuse(`"${fieldKey}" was not sent in the shape that key stores`);
  }
  return { ok: true, value: lowered };
}

/**
 * The text she typed, out of either storage shape — or null when this answer is
 * not text at all.
 *
 * NULL IS WHAT KEEPS THE ESCAPE HATCH WORKING. "I am not sure" stores
 * `{kind:"unknown"}`, which is a real and honest answer; a shape rule that
 * fired on it would refuse the one response she can always give.
 */
function saidText(incoming: unknown): string | null {
  if (typeof incoming === "string") return incoming;
  if (incoming !== null && typeof incoming === "object") {
    const value = incoming as { kind?: unknown; text?: unknown };
    if (value.kind === "text" && typeof value.text === "string") return value.text;
  }
  return null;
}

/**
 * Rules that belong to a KEY rather than to its type, for keys whose answer is
 * plain text.
 *
 * SEPARATE FROM `LEGACY_SHAPE_RULES` BECAUSE IT SPANS BOTH BRANCHES. `ein` and
 * `uei` are frozen legacy keys and `cage_code` is an `mb` key, and all three are
 * fixed-width identifiers issued by somebody else. Putting them on one table
 * means the branch a key happens to store through cannot decide whether it is
 * checked — which is how `cage_code` ended up with no rule while its two
 * neighbours had one.
 *
 * Each is a FIXED WIDTH set by its issuer, so a wrong length is not a near
 * miss. It is certainly wrong, and SAM.gov will reject it later at a point
 * where she cannot tell which answer caused it.
 */
const TEXT_SHAPE_RULES: Record<string, (said: string) => string | null> = {
  ein: einProblem,
  uei: ueiProblem,
  cage_code: cageProblem,
};

/** The key rule for a plain-text answer, or null. Exported so the EDITOR asks
 *  the same question one keystroke earlier. */
export function textShapeProblem(fieldKey: string, incoming: unknown): string | null {
  const said = saidText(incoming);
  if (said === null || said.trim() === "") return null;
  return TEXT_SHAPE_RULES[fieldKey]?.(said) ?? null;
}

/**
 * The value this key may be written with, or a refusal to show her.
 *
 * THE SERVER-SIDE GATE. Every write through the member `PUT` goes through it,
 * before `upsertProfileField` and before the `SuccessCenter` mirror, so the two
 * see the same checked value the record does.
 */
export function acceptStoredValue(fieldKey: string, incoming: unknown): Acceptance {
  /* "I AM NOT SURE" IS AN ANSWER TO EVERY QUESTION, and it is stored as the
     `MbValue` itself whatever shape the key normally holds.

     Before everything else, because everything else is about a shape this
     answer does not have. The legacy branch lifts a value and lowers it back,
     and `unknown` has no legacy representation — it lowered to `null`, which
     this module refuses on purpose, so 32 of the 77 keys answered the button
     with "We could not store that answer as it is written." Eleven of those
     were among the fourteen a mentor reads before the first call. The shape
     rules are skipped for the same reason: `year_started_operating` refused it
     as a bad year, and it is not a year at all. */
  if (isUnknownValue(incoming)) return { ok: true, value: unknownValue };

  // Before the branch, so a key is checked whichever shape it stores through.
  const shape = textShapeProblem(fieldKey, incoming);
  if (shape) return refuse(`"${fieldKey}" failed its shape rule`, shape);

  return storageFor(fieldKey) === "legacy"
    ? acceptLegacy(fieldKey, incoming)
    : acceptMb(fieldKey, incoming);
}
