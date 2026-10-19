/**
 * The terms rules that every checkout with the pilot terms box shares
 * (PRD §8.2, US-2): roadmap v3's drawer, intake offer and booking sheet, and
 * the legacy booking modals and renewal button.
 *
 * Layer: Interface Adapters (client). Pure. `enabled` is the server's
 * decision: roadmap v3 reads it from the payload's `purchaseConfirmation`,
 * the legacy checkouts from `useCheckoutTerms`. Null means "not known yet".
 */

import { TERMS_REQUIRED_CODE, TERMS_VERSION } from "@sc/lib/billing/purchaseTerms";
import { CHECKOUT_TERMS_REQUIRED } from "@sc/lib/walletCopy";

/**
 * Whether the terms keep Pay disabled: only while the decision is not known
 * yet. An unticked box never disables Pay: a press on Pay then shows why it
 * stops (`termsMissing`), because a disabled button tells her nothing.
 */
export function payDisabledByTerms(enabled: boolean | null): boolean {
  return enabled === null;
}

/**
 * Whether a press on Pay must stop at the terms box: only for a pilot member
 * who has not ticked it. The checkout then sends no request.
 */
export function termsMissing(enabled: boolean | null, ticked: boolean): boolean {
  return enabled === true && !ticked;
}

/**
 * The terms fields of the sale body. Empty outside the pilot. Inside it,
 * `termsShown` tells the server that this checkout showed the box, and the
 * acceptance follows only with the tick.
 */
export function termsRequestFields(
  enabled: boolean,
  ticked: boolean,
): { termsShown?: true; termsAccepted?: true; termsVersion?: string } {
  if (!enabled) return {};
  return ticked ? { termsShown: true, termsAccepted: true, termsVersion: TERMS_VERSION } : { termsShown: true };
}

/** The sentence for a failed sale: the server's text, with the terms code turned into a sentence. */
export function checkoutErrorText(error: unknown, status: number): string {
  if (error === TERMS_REQUIRED_CODE) return CHECKOUT_TERMS_REQUIRED;
  return typeof error === "string" ? error : `HTTP ${status}`;
}
