import { apiFetch, buildApiError, API_BASE_URL } from "./api";

// Billing / plan-upgrade API — same backend endpoints the v1 frontend uses for
// the Pilot → Expert → Elite upgrade journey.

/** Trade-in credit the user's current plan earns toward an upgrade. */
export interface CreditDetails {
  planCharges: number;
  /** Comes back as a string, e.g. "14.75". */
  perDayCharge: string;
  /** Comes back as a string, e.g. "4351.25". */
  creditAmount: string;
}

/**
 * Response from POST /opportunities/upgradePlan. The backend returns one of
 * three shapes depending on trade-in credit — a bare `{ link }`, or a full GHL
 * coupon document — but all of them carry a `.link` (the GHL hosted payment-link
 * URL, with a `couponCode` appended when a credit coupon was minted). Callers
 * only need `link`; it is optional here so a missing link falls back safely.
 */
export interface UpgradePlanResponse {
  link?: string;
  [key: string]: unknown;
}

/**
 * GET /opportunities/get-credit — trade-in credit toward an upgrade.
 *
 * The backend reads only `userId` (locationId is sent for parity with v1 but
 * ignored server-side) and returns `null` when the user has no prior order to
 * credit — so callers must handle a null result (→ show full price, no trade-in).
 */
export async function getCredit(userId: string, locationId: string): Promise<CreditDetails | null> {
  const params = new URLSearchParams({ userId, locationId });
  const response = await apiFetch(`${API_BASE_URL}/opportunities/get-credit?${params.toString()}`);
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch upgrade credit");
  }
  return response.json() as Promise<CreditDetails | null>;
}

/** POST /opportunities/upgradePlan — returns a checkout link for the plan. */
export async function upgradePlan(payload: {
  userId: string;
  productId: string;
  altId: string;
}): Promise<UpgradePlanResponse> {
  const response = await apiFetch(`${API_BASE_URL}/opportunities/upgradePlan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    return await buildApiError(response, "Failed to start the upgrade");
  }
  return response.json() as Promise<UpgradePlanResponse>;
}

/** GET /users/:userId/subscription — the user's current subscription/product. */
export async function getUserSubscription(userId: string): Promise<{ productId: string | null }> {
  const response = await apiFetch(
    `${API_BASE_URL}/users/${encodeURIComponent(userId)}/subscription`,
  );
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch subscription");
  }
  return response.json() as Promise<{ productId: string | null }>;
}
