import { apiFetch, buildApiError, API_BASE_URL } from "./api";
import type { Tx } from "./wallet";

/**
 * Wallet-balance API client. Backed by the real backend endpoint
 * `GET /wallet/balance?locationId=...` (see backend `WalletController`),
 * which returns the live sub-account balance plus the configured per-review
 * charge. This is distinct from the in-memory mock in `wallet.ts`.
 *
 * The `locationId` is passed explicitly in the URL in ALL environments (the
 * endpoint requires it as a real query param and does not rely on the
 * mock-auth `?locationId=` helper).
 */

/** The wallet balance response: current balance and per-review charge amount. */
export interface WalletBalance {
  balance: number;
  chargeAmount: number;
}

/** GET /wallet/balance — the live wallet balance for a GHL sub-account. */
export async function fetchWalletBalance(
  locationId: string,
): Promise<WalletBalance> {
  const response = await apiFetch(
    `${API_BASE_URL}/wallet/balance?locationId=${encodeURIComponent(locationId)}`,
  );
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch wallet balance");
  }
  return response.json() as Promise<WalletBalance>;
}

/**
 * An immutable wallet ledger entry (order record) — the PRD §3.3 `LedgerTx`
 * contract returned by `GET /wallet/ledger`. Shape-identical to the in-memory
 * `Tx`, reused here so the two never drift.
 */
export type LedgerTx = Tx;

/**
 * GET /wallet/ledger — the caller's immutable ledger entries, newest first.
 * Identity is server-derived from the authenticated GHL session (no locationId
 * is sent from the client; `apiFetch` injects the mock override in dev/staging).
 */
export async function fetchWalletLedger(): Promise<LedgerTx[]> {
  const response = await apiFetch(`${API_BASE_URL}/wallet/ledger`);
  if (!response.ok) {
    return await buildApiError(response, "Failed to fetch wallet ledger");
  }
  const body = (await response.json()) as { entries: LedgerTx[] };
  return body.entries;
}

/**
 * GHL's own billing page for a sub-account's wallet — "Add funds" deep-links
 * here rather than through a custom payment backend (ported from v1's
 * `frontend/src/config/constant.ts`). `{locationId}` is replaced with the
 * real GHL locationId before opening.
 */
export const GHL_WALLET_BILLING_URL =
  (import.meta.env.VITE_GHL_WALLET_BILLING_URL as string | undefined) ||
  "https://app.govpreneurs.com/v2/location/{locationId}/settings/company-billing/billing?tab=wallet_transactions";

/**
 * DEMO: a top-up that always succeeds. The live product sends the member to the GHL billing
 * page. The demo adds the funds to the sample wallet and records a "Wallet top-up" entry.
 */
export async function topUpWallet(amount: number): Promise<WalletBalance> {
  const response = await apiFetch(`${API_BASE_URL}/wallet/top-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    return await buildApiError(response, "Could not add funds");
  }
  return response.json() as Promise<WalletBalance>;
}
