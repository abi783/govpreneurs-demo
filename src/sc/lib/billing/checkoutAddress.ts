/**
 * The business address that a member types before a wallet purchase.
 *
 * Layer: Entities. Pure: no I/O, no env. This check only saves a round trip.
 * The `company_address` PUT stays the gate that decides (`acceptStoredValue`).
 * The ZIP rule is `zipProblem` from `mbValue.ts`, the one definition that the
 * PUT and `resolveBillingAddress` also accept.
 */

import { zipProblem, type Address } from "@sc/lib/businessProfile/mbValue";
import {
  ADDRESS_CITY_REQUIRED,
  ADDRESS_LINE1_REQUIRED,
  ADDRESS_STATE_INVALID,
  ADDRESS_STATE_REQUIRED,
  ADDRESS_ZIP_INVALID,
  ADDRESS_ZIP_REQUIRED,
} from "@sc/lib/walletCopy";

/** What the member typed. Every field is a string; empty means not given. */
export interface CheckoutAddressDraft {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

/** One field of the draft. */
export type CheckoutAddressField = keyof CheckoutAddressDraft;

/** The result of the check: the value to save, or one sentence per wrong field. */
export type CheckoutAddressCheck =
  | { ok: true; value: Address }
  | { ok: false; errors: Partial<Record<CheckoutAddressField, string>> };

const STATE_CODE = /^[A-Za-z]{2}$/;
const WHITE_SPACE = /\s+/g;

function stateError(state: string): string | undefined {
  if (!state) return ADDRESS_STATE_REQUIRED;
  return STATE_CODE.test(state) ? undefined : ADDRESS_STATE_INVALID;
}

function zipError(postalCode: string): string | undefined {
  if (!postalCode) return ADDRESS_ZIP_REQUIRED;
  return zipProblem(postalCode) === null ? undefined : ADDRESS_ZIP_INVALID;
}

/** Drops the fields that have no error. */
function presentErrors(
  errors: Record<CheckoutAddressField, string | undefined>,
): Partial<Record<CheckoutAddressField, string>> {
  return Object.fromEntries(Object.entries(errors).filter(([, sentence]) => sentence !== undefined));
}

/** Checks the draft. Pure. The error sentences come from walletCopy.ts. */
export function checkCheckoutAddress(draft: CheckoutAddressDraft): CheckoutAddressCheck {
  const line1 = draft.line1.trim();
  const line2 = draft.line2.trim();
  const city = draft.city.trim();
  const state = draft.state.trim();
  const postalCode = draft.postalCode.replace(WHITE_SPACE, "");

  const errors = presentErrors({
    line1: line1 ? undefined : ADDRESS_LINE1_REQUIRED,
    line2: undefined,
    city: city ? undefined : ADDRESS_CITY_REQUIRED,
    state: stateError(state),
    postalCode: zipError(postalCode),
  });
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const value: Address = { line1, city, state: state.toUpperCase(), postalCode };
  if (line2) value.line2 = line2;
  return { ok: true, value };
}
