import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Info, Plus } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { formatUSD } from "../lib/wallet";
import { useGhlUser } from "../lib/ghlUser";
import { fetchWalletBalance } from "../lib/walletApi";
import { showDemoNotice } from "../demo/ui/notice";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Prepaid credit · GovPreneurs" },
      {
        name: "description",
        content:
          "Prepaid credit for mentor reviews and done-for-you services.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  usePageMeta({});
  const { session } = useGhlUser();
  const [balanceData, setBalanceData] = useState<{
    balance: number;
    chargeAmount: number;
  } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState(false);

  // Fetch the live, per-location wallet balance from the backend.
  useEffect(() => {
    const locationId = session?.locationId;
    if (!locationId) return;
    let cancelled = false;
    setBalanceLoading(true);
    setBalanceError(false);
    fetchWalletBalance(locationId)
      .then((w) => {
        if (!cancelled) {
          setBalanceData(w);
          setBalanceLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load wallet balance", err);
        if (!cancelled) {
          setBalanceError(true);
          setBalanceLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session?.locationId]);

  const lowNow =
    !balanceLoading && !balanceError && balanceData !== null &&
    balanceData.balance < balanceData.chargeAmount;

  function handleAddFunds() {
    // DEMO: production opened the GHL billing page in a new tab. The demo shows a notice.
    showDemoNotice({
      title: "Add funds",
      message:
        "In the live product, this opens the billing page where a member adds funds to the wallet. The sample wallet needs no top-up.",
    });
  }

  return (
    <div>
      <header style={{ marginBottom: "var(--s-5)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>
          Billing
        </div>
        <h1 className="t-display-lg">Wallet</h1>
        <p
          className="t-body-sm"
          style={{ marginTop: "var(--s-2)", maxWidth: 640 }}
        >
          Prepaid credit for mentor reviews and done-for-you services.
        </p>
      </header>

      {/* Balance hero */}
      <section className="wallet-hero">
        <div className="wallet-hero__main">
          <div className="t-label">Your balance</div>
          <div className="wallet-amount" aria-live="polite">
            {balanceLoading ? (
              <span className="t-body-sm" style={{ color: "var(--text-2)" }}>
                Loading…
              </span>
            ) : balanceError || balanceData === null ? (
              <span className="t-body-sm" style={{ color: "var(--text-2)" }}>
                Balance unavailable
              </span>
            ) : (
              formatUSD(balanceData.balance)
            )}
          </div>
          {lowNow && (
            <div className="wallet-low-line">
              <Info size={13} />
              <span>
                A mentor review costs {formatUSD(balanceData!.chargeAmount)} —
                top up to send one.
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddFunds}
          disabled={!session?.locationId}
        >
          <Plus size={14} /> Add funds
        </button>
      </section>
    </div>
  );
}
