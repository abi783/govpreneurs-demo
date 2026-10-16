import type { Address } from "@sc/lib/businessProfile/mbValue";

/**
 * Google address components → our `Address` parts.
 *
 * Pure, so the mapping is testable without a key or a network: everything that
 * can be wrong here is a shape question, and shape questions should not need
 * Google to answer.
 */

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/** One suggestion, as the picker shows it. */
export interface PlaceSuggestion {
  placeId: string;
  text: string;
}

const pick = (parts: GoogleAddressComponent[], type: string): GoogleAddressComponent | undefined =>
  parts.find((p) => p.types.includes(type));

/**
 * Build our five parts from Google's component list.
 *
 * Notes on the choices, each of which has bitten someone somewhere:
 *
 * - `line1` is street number + route, in that order. Google returns them as
 *   two components and never as a street line.
 * - `city` falls back through `locality` → `postal_town` → `sublocality` →
 *   the borough-ish `administrative_area_level_3`. A New York address answers
 *   on `sublocality`, and a UK-style one only on `postal_town`.
 * - `state` takes `short_name` ("CA"), because `Address.state` is documented as
 *   the two-letter USPS code and the rest of the app treats it that way.
 * - `postal_code_suffix` is deliberately dropped: `zipProblem` checks for a
 *   5-character ZIP, so appending "-1351" would make every picked address
 *   read as wrong.
 * - `line2` is only ever `subpremise`, and usually absent — Google frequently
 *   drops "Suite 7620" from a picked result entirely. The member types it, so
 *   this NEVER overwrites a line2 that is already there (see `mergeAddress`).
 */
export function addressFromComponents(parts: GoogleAddressComponent[]): Address | null {
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const number = pick(parts, "street_number")?.long_name ?? "";
  const route = pick(parts, "route")?.long_name ?? "";
  const line1 = [number, route].filter(Boolean).join(" ").trim();
  if (line1 === "") return null; // not a street address — a city or a business

  const city =
    pick(parts, "locality")?.long_name ??
    pick(parts, "postal_town")?.long_name ??
    pick(parts, "sublocality")?.long_name ??
    pick(parts, "administrative_area_level_3")?.long_name;

  const address: Address = { line1 };
  const line2 = pick(parts, "subpremise")?.long_name;
  if (line2) address.line2 = line2;
  if (city) address.city = city;
  const state = pick(parts, "administrative_area_level_1")?.short_name;
  if (state) address.state = state.toUpperCase();
  const postalCode = pick(parts, "postal_code")?.long_name;
  if (postalCode) address.postalCode = postalCode;
  return address;
}

/**
 * Lay a picked address over what she has already typed.
 *
 * A pick replaces the parts Google actually answered on and leaves the rest
 * alone — the case that matters being `line2`: she types "Apt 4B", picks the
 * street from the list to fill the city and ZIP, and Google returns no
 * subpremise. Clobbering it there would delete the one part only she knows.
 */
export function mergeAddress(current: Address, picked: Address): Address {
  return {
    ...current,
    ...picked,
    line2: picked.line2 ?? current.line2,
  };
}
