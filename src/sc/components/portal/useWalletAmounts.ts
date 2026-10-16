"use client";

import { useEffect, useState } from "react";
import { walletAmountsFrom, type WalletAmounts } from "@sc/lib/billing/walletDisplay";

/**
 * The member's paid balance and promotional credit, read once when the
 * calling component mounts (a booking modal: when it opens). Null until the
 * read answers, and null if it fails. Display only: the sale routes re-read
 * the wallet before they charge.
 */
export function useWalletAmounts(locationId: string): WalletAmounts | null {
  const [amounts, setAmounts] = useState<WalletAmounts | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/portal/${locationId}/wallet-balance`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: unknown) => {
        if (live) setAmounts(walletAmountsFrom(body));
      })
      .catch((err: unknown) => console.warn("[wallet] balance read for display failed", err));
    return () => {
      live = false;
    };
  }, [locationId]);

  return amounts;
}
