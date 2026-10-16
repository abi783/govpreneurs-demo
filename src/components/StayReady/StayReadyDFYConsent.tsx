import { useEffect, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ShieldCheck, Wallet as WalletIcon, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { startRenewal, sendReminderText, MASKED_PHONE, type TrackedItem } from "../../lib/stayReady";
// DEMO: the wallet is the shared demo wallet, so the charge shows on the Wallet page.
import { chargeWallet, getWalletBalance } from "../../demo/state/wallet";
import { subscribeDemoState } from "../../demo/runtime/store";
import { PERSONA } from "../../demo/story/persona";

const formatUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 ? 2 : 0 });

function useWalletBalance(): number {
  return useSyncExternalStore(
    (cb) => subscribeDemoState("wallet.entries", cb),
    () => getWalletBalance(),
    () => getWalletBalance(),
  );
}

export function StayReadyDFYConsent({
  item,
  open,
  onOpenChange,
}: {
  item: TrackedItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const balance = useWalletBalance();
  const [sms, setSms] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) setConfirmed(false);
  }, [open]);

  if (!item) return null;

  const price = item.dfyPriceUSD;
  const enough = balance >= price;

  function handleConfirm() {
    if (!item || !enough) return;
    chargeWallet(`${item.name} renewal — done for you`, price);
    startRenewal(item.id, "dfy");
    if (sms) {
      sendReminderText(
        `[GovPreneurs] Got it ${PERSONA.ownerFirstName} — we'll handle your ${item.shortName} renewal. You'll hear back within 2 business days.`,
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
              <Dialog.Title className="ky-modal-title">We've got it from here.</Dialog.Title>
              <Dialog.Description className="ky-modal-body">
                Your renewal is in progress. We'll text you when it's done.
              </Dialog.Description>
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
                  <WalletIcon size={12} /> drawn from your Wallet ({formatUSD(balance)})
                </div>
              </div>

              {!enough && (
                <div className="sr-dfy-low">
                  Your Wallet is short {formatUSD(price - balance)}.
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
                <span>Also text me at {MASKED_PHONE} when it's done.</span>
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
