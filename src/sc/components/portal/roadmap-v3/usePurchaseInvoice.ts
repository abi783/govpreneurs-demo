"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readyToastDue, startInvoicePoll, type InvoiceView } from "../invoicePoll";
import type { UsageReceipt } from "@sc/lib/billing/walletReceipt";

type ReadyView = Extract<InvoiceView, { kind: "ready" }>;

/** Reads the member receipt of one purchase. Throws on a failed answer, so the poll logs it and asks again. */
async function fetchPurchaseReceipt(locationId: string, enrollmentId: string): Promise<UsageReceipt | null> {
  const res = await fetch(
    `/api/portal/${encodeURIComponent(locationId)}/purchases/${encodeURIComponent(enrollmentId)}/receipt`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { receipt?: UsageReceipt } | null;
  return data?.receipt ?? null;
}

/**
 * The success view's invoice line (PRD §8.3). `track(enrollmentId)` starts the
 * poll after a purchase. `successVisible` says whether the success view is on
 * screen; if the invoice turns ready while it is not, `toast` is set.
 */
export function usePurchaseInvoice(locationId: string, successVisible: boolean) {
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [view, setView] = useState<InvoiceView | null>(null);
  const [toast, setToast] = useState<ReadyView | null>(null);
  const visibleRef = useRef(successVisible);

  useEffect(() => {
    visibleRef.current = successVisible;
  }, [successVisible]);

  useEffect(() => {
    if (!enrollmentId) return;
    let prev: InvoiceView | null = null;
    return startInvoicePoll({
      fetchReceipt: () => fetchPurchaseReceipt(locationId, enrollmentId),
      onView: (next) => {
        if (next.kind === "ready" && readyToastDue(prev, next, visibleRef.current)) setToast(next);
        prev = next;
        setView(next);
      },
      now: Date.now,
    });
  }, [locationId, enrollmentId]);

  const track = useCallback((id: string) => {
    setToast(null);
    setEnrollmentId(id);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  return { view, toast, track, dismissToast };
}
