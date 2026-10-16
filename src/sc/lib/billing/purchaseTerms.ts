/**
 * The terms acceptance that a checkout sends with a sale (PRD §8.2 "Terms", US-2).
 *
 * Layer: Entities. Pure, and safe for the browser: the checkout imports
 * `TERMS_VERSION` from here. The gate that decides whether a member must
 * accept is server-only, in `purchaseConfirmation.ts`.
 */

import type { TermsConsentRecord } from "./types";

/**
 * The terms version that the checkout shows and the row stores. It names the
 * official pages on govpreneurs.com (`TERMS_URL`, `REFUND_POLICY_URL` in
 * `walletCopy.ts`) and the date that the checkout started to link to them,
 * because the pages show no "last updated" date. Bump it whenever the website
 * text of either page changes.
 */
export const TERMS_VERSION = "govpreneurs.com-2026-10-05";

/** The longest version text that the server stores. A longer one is refused. */
export const TERMS_VERSION_MAX = 64;

/** The 400 error code when a member who must accept the terms did not. */
export const TERMS_REQUIRED_CODE = "terms_required";

/** The longest User-Agent text that the row stores. The server cuts a longer one. */
export const TERMS_USER_AGENT_MAX = 512;

/** One stored acceptance: when she ticked the box, and which terms she saw. */
export interface TermsAcceptance {
  acceptedAt: Date;
  version: string;
  /** Who accepted, and from where. Absent when the caller did not record it. */
  consent?: TermsConsentRecord;
}

/**
 * The request body fields that carry the acceptance. `termsShown` says that
 * the checkout showed the terms box.
 */
export interface TermsBody {
  termsShown?: unknown;
  termsAccepted?: unknown;
  termsVersion?: unknown;
}

/**
 * The acceptance in a request body, or null when there is none. It needs
 * `termsAccepted` to be exactly `true` and a non-empty `termsVersion` of at
 * most `TERMS_VERSION_MAX` characters.
 */
export function termsAcceptanceFrom(body: TermsBody | null, now: Date): TermsAcceptance | null {
  if (body?.termsAccepted !== true) return null;
  const version = typeof body.termsVersion === "string" ? body.termsVersion.trim() : "";
  if (!version || version.length > TERMS_VERSION_MAX) return null;
  return { acceptedAt: now, version };
}
