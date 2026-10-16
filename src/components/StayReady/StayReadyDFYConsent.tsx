import { useEffect, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ShieldCheck, Wallet as WalletIcon, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  getWallet,
  setWallet as commitWallet,
  formatUSD,
} from "../../lib/wallet";
import { bus } from "../../lib/eventBus";
import { startRenewal, type TrackedItem } from "../../lib/stayReady";
import { sendMockSMS, MOCK_PHONE } from "../../lib/mockSMS";

export function StayReadyDFYConsent({
  item,
  open,
  onOpenChange,
}: {
  item: TrackedItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const wallet = useSyncExternalStore(
    (cb) => bus.subscribe("wallet", cb),
    () => getWallet(),
    () => getWallet(),
  );
  const [sms, setSms] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) setConfirmed(false);
  }, [open]);

  if (!item) return null;

  const price = item.dfyPriceUSD;
  const enough = wallet.balanceUSD >= price;

  function handleConfirm() {
    if (!item || !enough) return;
    const w = getWallet();
    commitWallet({
      ...w,
      balanceUSD: Math.round((w.balanceUSD - price) * 100) / 100,
      transactions: [
        ...w.transactions,
        {
          id: `tx_${Date.now()}`,
          date: new Date().toISOString(),
          description: `${item.name} renewal — DFY`,
          type: "debit",
          amountUSD: price,
          relatedTo: { label: "View renewal", href: `/stay-ready/${item.id}` },
        },
      ],
    });
    startRenewal(item.id, "dfy");
    if (sms) {
      sendMockSMS(
        `[Govpreneurs] Got it Marcus — we'll handle your ${item.shortName} renewal. You'll hear back within 2 business days.`,
        item.id,
      );
    }
    setConfirmed(true);
    window.setTimeout(() => onOpenChange(false), 1400);
  }


  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="ky-modal-content sr-dfy-modal">
          {confirmed ? (
            <div className="sr-dfy-success">
              <div className="sr-dfy-success-icon"><Check size={20} strokeWidth={2.5} /></div>
              <h3>We've got it from here.</h3>
              <p>Your renewal is in progress. We'll text you when it's done.</p>
            </div>
          ) : (
            <>
              <Dialog.Title className="ky-modal-title">
                Have us renew your {item.shortName}
              </Dialog.Title>
              <Dialog.Description className="ky-modal-body">
                We'll file your {item.name} renewal on your behalf and email
                you the confirmation. Most renewals complete within 2 business
                days.
              </Dialog.Description>

              <div className="sr-dfy-price">
                <div className="sr-dfy-price-amt">{formatUSD(price)}</div>
                <div className="sr-dfy-price-meta">
                  <WalletIcon size={12} /> drawn from your Wallet ({formatUSD(wallet.balanceUSD)})
                </div>
              </div>

              {!enough && (
                <div className="sr-dfy-low">
                  Your Wallet is short {formatUSD(price - wallet.balanceUSD)}.
                  <Link
                    to="/wallet"
                    className="sr-dfy-topup"
                    onClick={() => onOpenChange(false)}
                  >
                    Top up your Wallet →
                  </Link>
                </div>
              )}

              <label className="sr-sms-toggle">
                <input
                  type="checkbox"
                  checked={sms}
                  onChange={(e) => setSms(e.target.checked)}
                />
                <span>Also text me at {MOCK_PHONE} when it's done.</span>
              </label>

              <div className="ky-modal-actions">
                <button
                  type="button"
                  className="ky-btn-primary"
                  disabled={!enough}
                  onClick={handleConfirm}
                >
                  Confirm — charge my Wallet {formatUSD(price)}
                </button>
                <button
                  type="button"
                  className="ky-btn-secondary"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </button>
              </div>

              <div className="sr-dfy-foot">
                <ShieldCheck size={11} /> One-time charge. Nothing is auto-billed.
              </div>
            </>
          )}
          <Dialog.Close asChild>
            <button type="button" className="ky-modal-close" aria-label="Close">
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
