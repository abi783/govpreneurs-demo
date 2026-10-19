"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@sc/components/ui/Card";
import { WalletUsageDrawer, type WalletUsageItem } from "./WalletUsageDrawer";
import { opensWalletHistory, takeWalletHistoryNote, WALLET_HISTORY_PARAM } from "./walletHistoryLink";
import { PromotionalCreditLine } from "./WalletAmountLines";
import type { WalletAmounts } from "@sc/lib/billing/walletDisplay";
import { roundToCent } from "@sc/lib/billing/walletSplit";
import { TOTAL_CREDIT_LABEL, WALLET_BALANCE_LABEL } from "@sc/lib/walletCopy";
// DEMO: the Add funds dialog replaces the link to the GoHighLevel billing page.
import { openAddFunds } from "@/demo/sc/home/addFunds";

function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

interface Props {
  locationId: string;
  /** Both pools added. Decides only whether to try the owed-balance collection. */
  walletBalance: number | null;
  /** The paid balance (the big number) and the promotional credit (the line under it). */
  walletAmounts: WalletAmounts | null;
  walletCurrency: string;
  freeRemaining: number;
  hideWalletConversionNote: boolean;
  rechargeUrl: string;
  usage: WalletUsageItem[];
  totalSpent: number;
  /** Outstanding wallet debt in dollars (GHL wouldn't overdraw at charge
   *  time). Shown as a negative; auto-collected here once funds arrive. */
  walletOwed: number;
}

export function WalletCard({
  locationId, walletBalance, walletAmounts, walletCurrency, freeRemaining, hideWalletConversionNote, rechargeUrl, usage, totalSpent, walletOwed,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Opened by the "View billing history" link of a purchase (?billing=history).
  // Read in the initializer, so the server and the browser draw the same thing.
  const [usageOpen, setUsageOpen] = useState(() => opensWalletHistory(searchParams.get(WALLET_HISTORY_PARAM)));

  // Inside GHL the same link goes through the sidebar, which drops our query,
  // so it leaves a note in localStorage instead. Browser storage exists only
  // after hydration, hence the effect. The note is taken in the timer, so a
  // cleared timer (React runs effects twice in development) takes nothing.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (takeWalletHistoryNote(Date.now())) setUsageOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const [owed, setOwed] = useState(walletOwed);
  const [userToken, setUserToken] = useState<string | null>(null);
  const collectAttempted = useRef(false);

  useEffect(() => { setOwed(walletOwed); }, [walletOwed]);

  // Token relay — same pattern as AssignedMentorCard.
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return;
    if (owed <= 0) return;
    const PARENT_ORIGIN = "https://app.govpreneurs.com";
    let pendingId: string | null = null;
    function requestToken() {
      pendingId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      window.parent.postMessage({ message: "REQUEST_AUTH_TOKEN", requestId: pendingId, forceRefresh: true }, PARENT_ORIGIN);
    }
    function onMessage(ev: MessageEvent) {
      if (ev.origin !== PARENT_ORIGIN) return;
      const data = ev.data as { message?: string; requestId?: string; payload?: string; error?: string } | null;
      if (!data || data.message !== "REQUEST_AUTH_TOKEN_RESPONSE") return;
      if (pendingId && data.requestId !== pendingId) return;
      if (data.error || !data.payload) return;
      setUserToken(data.payload);
    }
    window.addEventListener("message", onMessage);
    requestToken();
    return () => window.removeEventListener("message", onMessage);
  }, [owed]);

  // Auto-collect the outstanding balance once we have funds + a token.
  // Fires at most once per mount; chips away partially if funds are short.
  useEffect(() => {
    if (collectAttempted.current) return;
    if (owed <= 0 || !userToken) return;
    if ((walletBalance ?? 0) <= 0) return;
    collectAttempted.current = true;
    fetch(`/api/portal/${locationId}/collect-owed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userToken }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.owed === "number") setOwed(d.owed);
        if (d?.collected > 0) router.refresh();
      })
      .catch(() => { /* stays owed; retried next visit */ });
  }, [owed, userToken, walletBalance, locationId, router]);

  return (
    <>
      <Card className="p-5 flex flex-col gap-2.5">
        <div className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-[var(--text-muted)] flex items-center gap-1.5">
          <span className="block w-3 h-px bg-[var(--gold)] opacity-60" />
          Your GovPreneurs Wallet
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[1.75rem] font-extrabold text-white leading-none">
            {walletAmounts === null
              ? "—"
              : formatMoney(roundToCent(walletAmounts.paidBalance + walletAmounts.promotionalCredit), walletCurrency)}
          </span>
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">{TOTAL_CREDIT_LABEL}</span>
        </div>
        {walletAmounts !== null && (
          <div className="flex flex-col gap-0.5">
            <p className="text-[0.72rem] text-[var(--text-secondary)] leading-relaxed">
              {WALLET_BALANCE_LABEL} <strong>{formatMoney(walletAmounts.paidBalance, walletCurrency)}</strong>
            </p>
            <PromotionalCreditLine
              amounts={walletAmounts}
              format={(n) => formatMoney(n, walletCurrency)}
              className="text-[0.72rem] text-[var(--text-secondary)] leading-relaxed"
            />
          </div>
        )}
        {owed > 0 && (
          <div className="flex items-center gap-1.5 text-[0.72rem] font-semibold" style={{ color: "#f87171" }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>Outstanding: −{formatMoney(owed, walletCurrency)} — deducted automatically when you add funds.</span>
          </div>
        )}
        {freeRemaining > 0 && !hideWalletConversionNote && (
          <p className="text-[0.72rem] text-[var(--gold)] leading-relaxed border-l-2 border-[var(--gold)] pl-2.5">
            Your prior wallet credit was converted to <b>free sessions with your assigned mentor</b> under our new program model.
          </p>
        )}
        <p className="text-[0.8rem] text-[var(--text-secondary)] leading-relaxed">
          You can use your wallet balance and complimentary credit for Consultation Sessions or Strategy Calls with GovPreneurs experts.
        </p>
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => setUsageOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] bg-white/[0.04] border border-white/[0.08] text-[var(--text-secondary)] text-[0.75rem] font-semibold hover:bg-white/[0.08] transition-colors"
          >
            Usage History
            {totalSpent > 0 && (
              <span className="text-[var(--text-muted)]">· {formatMoney(totalSpent, usage[0]?.currency ?? walletCurrency)}</span>
            )}
          </button>
          {/* DEMO: was <a href={rechargeUrl} target="_blank">. A button opens the in-app Add funds dialog. */}
          <button
            type="button"
            onClick={openAddFunds}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[var(--radius-sm)] bg-[var(--gold)] text-white text-[0.8rem] font-bold hover:bg-[var(--gold-bright)] transition-colors"
          >
            Re-charge Wallet
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </Card>

      <WalletUsageDrawer open={usageOpen} onClose={() => setUsageOpen(false)} usage={usage} />
    </>
  );
}
