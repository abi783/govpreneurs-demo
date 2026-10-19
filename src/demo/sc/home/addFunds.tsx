// DEMO: the "Add funds" dialog.
//
// In production "Re-charge Wallet" opens the GoHighLevel billing page, where a
// member pays by card. The demo has no billing page, so these buttons open this
// dialog. It "pays" with a sample card, adds the money to the demo wallet
// (src/demo/state/wallet.ts) and shows the new balance.
//
//   openAddFunds()   open the dialog from anywhere (a lifted button, a click handler)
//   <AddFundsHost /> mount once on a page; it listens for `openAddFunds()`
//
// The Wallet page (src/routes/wallet.tsx) can call `openAddFunds()` too, if the
// lead wants "Add funds" to work there as well. Mount `<AddFundsHost />` on it.

import { useEffect, useState } from "react";
import { PERSONA } from "@/demo/story/persona";
import { demoRefresh } from "@/demo/runtime/refresh";

const EVENT = "gp-demo:add-funds";
const AMOUNTS = [100, 250, 500];

export function openAddFunds(): void {
  window.dispatchEvent(new CustomEvent(EVENT));
}

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function AddFundsHost() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(250);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ added: number; balance: number } | null>(null);

  useEffect(() => {
    const onOpen = () => {
      setDone(null);
      setError(null);
      setOpen(true);
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (!open) return null;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/${PERSONA.locationId}/wallet-topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json().catch(() => ({}))) as { balance?: number; error?: string };
      if (!res.ok || typeof data.balance !== "number") {
        setError(data.error ?? "The payment did not go through. Try again.");
        return;
      }
      setDone({ added: amount, balance: data.balance });
      demoRefresh();
    } catch {
      setError("The payment did not go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={() => !busy && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add funds to your wallet"
        className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <p className="text-base font-bold text-gray-900">Add funds to your wallet</p>
          <button
            type="button"
            onClick={() => !busy && setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#16a34a" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#ffffff" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{money(done.added)} added</p>
              <p className="text-sm text-gray-600 mt-1">Your wallet balance is now {money(done.balance)}.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2 text-sm font-bold"
              style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-5 py-5 flex flex-col gap-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Pick an amount. A sample card pays for it, and no real money moves.
            </p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Amount">
              {AMOUNTS.map((a) => {
                const on = a === amount;
                return (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAmount(a)}
                    className="px-3 py-3 text-base font-bold transition-colors"
                    style={
                      on
                        ? { borderRadius: 8, background: "#1d4ed8", color: "#ffffff", border: "1px solid #1d4ed8" }
                        : { borderRadius: 8, background: "#ffffff", color: "#1d4ed8", border: "1px solid #1d4ed8" }
                    }
                  >
                    {money(a)}
                  </button>
                );
              })}
            </div>
            {error && (
              <p className="text-xs font-semibold" style={{ color: "#b91c1c" }}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="w-full px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
              style={{ borderRadius: 8, background: "#1d4ed8", color: "#ffffff" }}
            >
              {busy ? "Adding…" : `Add ${money(amount)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
