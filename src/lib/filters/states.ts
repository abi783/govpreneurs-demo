// Every place a member can pick in a "Choose states" list: all 50 states, DC and the five
// territories, A to Z by name. The list is the whole country on purpose — it never shrinks
// to the states that happen to appear in today's results, so she can always pick the
// state she means.

import { US_STATE_NAMES } from "../location/iso3166";

export interface StateOption {
  code: string;
  name: string;
}

export const ALL_STATES: StateOption[] = Object.entries(US_STATE_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const stateName = (code: string): string => US_STATE_NAMES[code] ?? code;

/** States for a chip, in the list's own words: names for 1 or 2, codes for 3 or 4, then a count. */
export const statesText = (codes: string[]): string =>
  codes.length <= 2
    ? codes.map(stateName).join(", ")
    : codes.length <= 4
      ? codes.join(", ")
      : `${codes.length} states`;

/** Keeps only real state codes, in capitals, so a hand-edited URL cannot add a blank chip. */
export const readStates = (input: unknown): string[] =>
  Array.isArray(input)
    ? [
        ...new Set(
          input
            .filter((s): s is string => typeof s === "string")
            .map((s) => s.trim().toUpperCase())
            .filter((s) => s in US_STATE_NAMES),
        ),
      ]
    : [];
