// Polls the live wallet balance while the Send-to-Mentor modal is showing the
// insufficient-balance / recharge state, so a member who tops up in GHL
// billing (a separate tab/page) sees the modal flip to sendable without
// closing and reopening it. Mirrors the cancelled-flag + effect-cleanup
// pattern used by useFacetCounts.ts.

import { useEffect, useRef, useState } from "react";
import { fetchWalletBalance, type WalletBalance } from "./walletApi";

const POLL_INTERVAL_MS = 1000;

/**
 * Polls `GET /wallet/balance` every 1s while `active` is true, stopping as
 * soon as a poll reports `balance >= threshold` (the per-review charge) — the
 * hook decides "caught up" internally so the caller doesn't need to feed a
 * poll result back into its own `active` argument (which would either lag by
 * a render or require reading state before it's computed).
 *
 * `active` should express only "the modal wants polling right now" (e.g.
 * `open && promptedInsufficient`, derived from the caller's own one-shot
 * balance) — the caller does not need to (and should not) factor the poll
 * result back into it.
 *
 * Overlapping requests are skipped (a slow tick just waits for the next
 * interval); poll errors are swallowed (no error UI churn while the member is
 * off paying) and simply retried next tick.
 */
export function useWalletBalancePolling(
  locationId: string | undefined,
  active: boolean,
  threshold: number,
): WalletBalance | null {
  const [latest, setLatest] = useState<WalletBalance | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!active || !locationId) return;
    let cancelled = false;
    let caughtUp = false;
    const interval = window.setInterval(() => {
      if (inFlightRef.current || caughtUp) return; // skip overlapping/late tick
      inFlightRef.current = true;
      fetchWalletBalance(locationId)
        .then((w) => {
          if (cancelled) return;
          setLatest(w);
          if (w.balance >= threshold) {
            caughtUp = true;
            window.clearInterval(interval);
          }
        })
        .catch(() => {
          // Swallow — try again next tick.
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [active, locationId, threshold]);

  // Reset once the caller stops requesting polling (modal closed, or it left
  // the insufficient state some other way), so a later re-entry starts clean
  // rather than showing a stale balance from a previous open.
  useEffect(() => {
    if (!active) setLatest(null);
  }, [active]);

  return latest;
}
