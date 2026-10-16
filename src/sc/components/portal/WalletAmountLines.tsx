// The promotional-credit line and the purchase-breakdown line (design
// 2026-09-18-wallet-credit-vs-cash §6.2, §7). The lines carry no style of
// their own: each screen passes its own formatter and its own classes, so a
// legacy screen keeps its legacy classes and roadmap v3 keeps its Design
// System classes. The amounts sit in <strong>, which the v3 styles set in
// tabular figures.

import {
  showsPromotionalCredit,
  type PurchaseBreakdown,
  type WalletAmounts,
} from "@sc/lib/billing/walletDisplay";
import {
  CREDIT_COVERS_PURCHASE,
  FROM_WALLET_LABEL,
  PROMOTIONAL_CREDIT_LABEL,
  PROMOTIONAL_CREDIT_NOTE,
  PROMOTIONAL_DISCOUNT_LABEL,
} from "@sc/lib/walletCopy";

type FormatMoney = (amount: number) => string;

/** "Promotional credit: $X · Used first on purchases. Not refundable." Renders nothing at $0. */
export function PromotionalCreditLine({
  amounts,
  format,
  className,
}: {
  amounts: WalletAmounts | null;
  format: FormatMoney;
  className?: string;
}) {
  if (!showsPromotionalCredit(amounts)) return null;
  return (
    <p className={className}>
      {PROMOTIONAL_CREDIT_LABEL}: <strong>{format(amounts.promotionalCredit)}</strong> · {PROMOTIONAL_CREDIT_NOTE}
    </p>
  );
}

/** How a purchase will be paid: the discount and the wallet part, or the fully covered sentence. */
export function PurchaseBreakdownLine({
  breakdown,
  format,
  className,
}: {
  breakdown: PurchaseBreakdown | null;
  format: FormatMoney;
  className?: string;
}) {
  if (breakdown == null) return null;
  if (breakdown.creditCoversAll) return <p className={className}>{CREDIT_COVERS_PURCHASE}</p>;
  return (
    <p className={className}>
      {PROMOTIONAL_DISCOUNT_LABEL} <strong>−{format(breakdown.promotionalDiscount)}</strong> · {FROM_WALLET_LABEL}{" "}
      <strong>{format(breakdown.fromWallet)}</strong>
    </p>
  );
}
