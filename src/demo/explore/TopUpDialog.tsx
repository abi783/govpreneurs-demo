// DEMO: the in-app "Add funds" step. The live product sends the member to a
// billing page. Here the member picks an amount and the funds are added at once
// to the sample wallet (a card ending 4242), so the demo never leaves the app.

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatUSD } from "@/lib/wallet";
import { topUpWallet, type WalletBalance } from "@/lib/walletApi";

const PRESETS = [50, 100, 250, 500];

export function TopUpDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new balance once the funds are in. */
  onAdded?: (wallet: WalletBalance, amount: number) => void;
}) {
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ amount: number; balance: number } | null>(null);

  useEffect(() => {
    if (open) return;
    // Start fresh the next time the dialog opens.
    setAmount(100);
    setCustom("");
    setBusy(false);
    setError(null);
    setAdded(null);
  }, [open]);

  const customValue = custom.trim() === "" ? null : Number(custom);
  const chosen = customValue !== null ? customValue : amount;
  const valid = Number.isFinite(chosen) && chosen >= 10 && chosen <= 5000;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const wallet = await topUpWallet(chosen);
      setAdded({ amount: chosen, balance: wallet.balance });
      onAdded?.(wallet, chosen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add funds. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="sm">
        {added ? (
          <>
            <Modal.Header title="Funds added" />
            <Modal.Body>
              <p className="t-body" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 0 }}>
                <CheckCircle2 size={18} aria-hidden style={{ color: "var(--ok-9, #1a7f4b)" }} />
                We added {formatUSD(added.amount)} to your wallet.
              </p>
              <p className="t-body-sm" style={{ marginBottom: 0 }}>
                Your balance is now <strong>{formatUSD(added.balance)}</strong>.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close asChild>
                <button type="button" className="btn btn-primary btn-sm">
                  Done
                </button>
              </Modal.Close>
            </Modal.Footer>
          </>
        ) : (
          <>
            <Modal.Header title="Add funds" description="Prepaid credit pays for mentor reviews and done-for-you services." />
            <Modal.Body>
              <div className="add-funds-presets" role="group" aria-label="Amount to add">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`add-funds-preset${customValue === null && amount === p ? " is-selected" : ""}`}
                    aria-pressed={customValue === null && amount === p}
                    onClick={() => {
                      setAmount(p);
                      setCustom("");
                    }}
                  >
                    ${p}
                  </button>
                ))}
              </div>
              <label className="add-funds-custom">
                <span className="add-funds-custom__prefix">$</span>
                <input
                  className="add-funds-custom__input"
                  type="number"
                  min={10}
                  max={5000}
                  inputMode="decimal"
                  placeholder="Other amount"
                  aria-label="Other amount in dollars"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </label>
              <div className="add-funds-total" style={{ marginTop: 14 }}>
                <span className="t-label">You add</span>
                <span className="add-funds-total__amount">{valid ? formatUSD(chosen) : "—"}</span>
                <span className="add-funds-total__pm">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CreditCard size={12} aria-hidden /> Visa ending 4242
                  </span>
                </span>
              </div>
              {!valid && (
                <p className="t-body-sm" role="alert" style={{ color: "var(--text-2)", marginBottom: 0 }}>
                  Enter an amount from $10 to $5,000.
                </p>
              )}
              {error && (
                <p className="t-body-sm" role="alert" style={{ color: "var(--urg-9)", marginBottom: 0 }}>
                  {error}
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Modal.Close asChild>
                <button type="button" className="btn btn-secondary btn-sm">
                  Cancel
                </button>
              </Modal.Close>
              <button type="button" className="btn btn-primary btn-sm" disabled={!valid || busy} onClick={() => void submit()}>
                {busy ? "Adding…" : valid ? `Add ${formatUSD(chosen)}` : "Add funds"}
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal.Content>
    </Modal.Root>
  );
}
