// The closed option sets behind a `multi_select` profile ask (enrichment #6).
//
// Three profile fields accept a CLOSED set of values, and every one of them is
// stored as a token some backend gate matches EXACTLY: `service_states` against
// `popState`, `naics_codes` against the allied-NAICS gate, `set_asides` against
// `userCertToCanonical`. Free text over a closed set therefore fails silently —
// "North Carolin" looks right on the profile and returns no North Carolina work.
// A picker makes the bad value un-typeable.
//
// Which fields are closed is declared on the BACKEND (`milestone-config.ts`'s
// `elicitShape: 'multi_select'`, the existing per-field "how this is collected"
// declaration). What the options ARE lives here, because every catalog is
// already client-side data: the filter drawer's set-aside chips, the taxonomy's
// state list, and the /naics/search endpoint the warm-start wizard uses.

import type { MSOption } from "../components/Hunter/SearchableMultiSelect";
import { SET_ASIDES } from "./vocab/filterOptions";
import { STATES, US_STATE_NAMES } from "./vocab/usStates";
import { searchNaics } from "./preview";
import { describeNaics, ensureNaicsDescriptions } from "./naicsCatalog";
import { lookupOwn } from "./lookup";

/**
 * A closed option set. `fixed` ships the whole catalog; `searched` is for one
 * too large to ship (NAICS: ~1,000 codes), which is looked up remotely and needs
 * `resolve` to label the values already on file.
 *
 * In every case the option `id` IS the token stored on the profile, so a value
 * already on file pre-selects and what the member picks needs no translation.
 */
export type ClosedSet =
  | { kind: "fixed"; options: MSOption[]; placeholder: string }
  | {
      kind: "searched";
      search: (q: string) => Promise<MSOption[]>;
      resolve: (ids: string[]) => Promise<MSOption[]>;
      placeholder: string;
    };

/** "Full and Open Competition" is a filter concept, not a qualification a
 *  business holds — the set-aside taxonomy excludes it from profile pages. */
const NOT_A_QUALIFICATION = "FULL_OPEN";

/** The 50 states + DC, labelled by name and sorted by it (the code stays the
 *  stored value — that is what `popState` matching keys off). */
const STATE_OPTIONS: MSOption[] = STATES.map((s) => ({
  id: s.id,
  label: US_STATE_NAMES[s.id] ?? s.id,
  detail: s.id,
})).sort((a, b) => a.label.localeCompare(b.label));

/** The same set-aside chips the filter drawer renders, minus full-and-open.
 *  Their ids are the token space `FilterDefaultsService.mapSetAsides` emits FROM
 *  the member's profile, so this write and that read speak one vocabulary. */
const SET_ASIDE_OPTIONS: MSOption[] = SET_ASIDES.filter((s) => s.id !== NOT_A_QUALIFICATION).map(
  (s) => ({ id: s.id, label: s.label }),
);

/** One NAICS row as an option: the description reads, the code is the value. */
function naicsOption(code: string, description?: string): MSOption {
  return { id: code, label: description ?? `NAICS ${code}`, detail: code };
}

const CLOSED_SETS: Record<string, ClosedSet> = {
  service_states: {
    kind: "fixed",
    options: STATE_OPTIONS,
    placeholder: "Search a state",
  },
  set_asides: {
    kind: "fixed",
    options: SET_ASIDE_OPTIONS,
    placeholder: "Search a set-aside",
  },
  naics_codes: {
    kind: "searched",
    placeholder: "Search a trade, industry, or NAICS code",
    search: async (q) => (await searchNaics(q)).map((r) => naicsOption(r.code, r.description)),
    resolve: async (codes) => {
      await ensureNaicsDescriptions(codes);
      return codes.map((code) => naicsOption(code, describeNaics(code)));
    },
  },
};

/** The closed option set for a profile field, or null when it has none (every
 *  other field is genuinely open-ended and stays free text). Own-property
 *  lookup: `__proto__`/`constructor`/`valueOf` resolve to nothing, not to an
 *  object the picker would then try to read `.options` off. */
export function closedSetFor(field: string): ClosedSet | null {
  return lookupOwn(CLOSED_SETS, field) ?? null;
}

/** Splits a stored fact value ("TX, NC") into the ids a picker pre-selects. */
export function selectedFromValue(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** A stored token → the catalog id it IS, case-insensitively, or null when the
 *  set does not contain it. Case folding is a CORRECTION ("tx" → "TX"), not a
 *  relaxation: the id that comes back is still exactly a catalog id. */
function canonicalId(options: readonly MSOption[], token: string): string | null {
  const exact = options.find((o) => o.id === token);
  if (exact) return exact.id;
  const folded = token.toLowerCase();
  return options.find((o) => o.id.toLowerCase() === folded)?.id ?? null;
}

/**
 * Splits what is on file into the ids the picker may pre-select and the tokens
 * that are not in the closed set at all.
 *
 * These fields are PICKED precisely because a value outside the set fails
 * SILENTLY downstream — "Atlantis" reads fine on a profile and matches no
 * `popState`. Pre-selecting such a token would let the member re-attest it with
 * one click, defeating the picker on the exact path that already holds bad data;
 * dropping it quietly would hide from them that it is going. So it is neither
 * selected nor hidden: the caller shows it as un-keepable.
 *
 * A `searched` catalog (NAICS) cannot be checked without a round trip, so its
 * tokens are all treated as on-file ids and resolved remotely for their labels.
 */
export function partitionStoredValue(
  set: ClosedSet,
  value: string | undefined,
): { selected: string[]; invalid: string[] } {
  const tokens = selectedFromValue(value);
  if (set.kind !== "fixed") return { selected: tokens, invalid: [] };
  const selected: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const id = canonicalId(set.options, token);
    if (id) selected.push(id);
    else invalid.push(token);
  }
  return { selected, invalid };
}

/** Joins picked ids back into the comma-list the fact write boundary expects —
 *  the SAME shape a typed answer produced, so nothing downstream knows or cares
 *  that a picker was used. Deduped, in the order they were picked. */
export function valueFromSelected(ids: string[]): string {
  return [...new Set(ids)].join(", ");
}
