import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Info, Plus } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { formatUSD } from "../lib/wallet";
import { useGhlUser } from "../lib/ghlUser";
import { fetchWalletBalance, fetchWalletLedger, type LedgerTx } from "../lib/walletApi";
import { formatDateAbsolute } from "../lib/format";
// DEMO: "Add funds" opens an in-app top-up that always succeeds.
import { TopUpDialog } from "../demo/explore/TopUpDialog";

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
  const [topUpOpen, setTopUpOpen] = useState(false);
  // DEMO: the page lists the wallet's activity (the live billing page does).
  const [ledger, setLedger] = useState<LedgerTx[] | null>(null);
  const [ledgerError, setLedgerError] = useState(false);

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

  function loadLedger() {
    fetchWalletLedger()
      .then((entries) => {
        // Newest first.
        setLedger([...entries].sort((a, b) => b.date.localeCompare(a.date)));
        setLedgerError(false);
      })
      .catch((err) => {
        console.error("Failed to load wallet activity", err);
        setLedgerError(true);
      });
  }

  useEffect(() => {
    loadLedger();
  }, []);

  const lowNow =
    !balanceLoading && !balanceError && balanceData !== null &&
    balanceData.balance < balanceData.chargeAmount;

  function handleAddFunds() {
    // DEMO: production opened the GHL billing page in a new tab. The demo opens a top-up dialog.
    setTopUpOpen(true);
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

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        onAdded={(wallet) => {
          setBalanceData(wallet);
          setBalanceError(false);
          loadLedger();
        }}
      />

      <section className="wallet-card" aria-labelledby="wallet-activity">
        <div className="wallet-card__head">
          <h2 id="wallet-activity" className="wallet-card__title">
            Activity
          </h2>
        </div>
        {ledgerError ? (
          <p className="wallet-card__help">We could not load your wallet activity. Reload the page to try again.</p>
        ) : ledger === null ? (
          <p className="wallet-card__help">Loading…</p>
        ) : ledger.length === 0 ? (
          <p className="wallet-card__help">No activity yet. Mentor reviews and top-ups show here.</p>
        ) : (
          <ul className="wallet-tx">
            {ledger.map((tx) => (
              <li key={tx.id} className="wallet-tx-row">
                <span className="wallet-tx-row__date">{formatDateAbsolute(tx.date)}</span>
                <span className="wallet-tx-row__desc">
                  {tx.description.startsWith("Mentor review") ? (
                    <Link to="/mentors" className="wallet-tx-row__link">
                      {tx.description}
                    </Link>
                  ) : (
                    tx.description
                  )}
                </span>
                <span className={`wallet-tx-row__amount wallet-tx-row__amount--${tx.type}`}>
                  {tx.type === "debit" ? "−" : "+"}
                  {formatUSD(tx.amountUSD)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
