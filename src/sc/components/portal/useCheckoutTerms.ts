"use client";

import { useEffect, useState } from "react";

/**
 * Whether this legacy checkout shows the pilot terms box, as the server
 * decides (`GET …/checkout-terms`). It reads once when `active` turns true
 * (a modal: when it opens). Null until the read answers, so the checkout
 * keeps Pay off until it knows (`payDisabledByTerms`). If the read fails, it
 * answers false: the checkout then sends no `termsShown`, and the server
 * requires nothing, as for an old tab.
 */
export function useCheckoutTerms(locationId: string, active = true): boolean | null {
  const [showTerms, setShowTerms] = useState<boolean | null>(null);

  useEffect(() => {
    if (!active) return;
    let live = true;
    fetch(`/api/portal/${locationId}/checkout-terms`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { showTerms?: unknown } | null) => {
        if (live) setShowTerms(body?.showTerms === true);
      })
      .catch((err: unknown) => {
        console.warn("[wallet] checkout terms read failed", err);
        if (live) setShowTerms(false);
      });
    return () => {
      live = false;
    };
  }, [locationId, active]);

  return showTerms;
}
