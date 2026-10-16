// DEMO API area: Wallet and plan upgrade.
// Owns: /wallet/*, /opportunities/get-credit, /opportunities/upgradePlan.
// State lives in src/demo/state/wallet.ts (shared with the mentor send flow).

import type { DemoRouteDef } from "../runtime/router";
import { getWalletBalance, getWalletEntries, MENTOR_REVIEW_PRICE } from "../state/wallet";

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/wallet/balance",
    handler: () => ({ balance: getWalletBalance(), chargeAmount: MENTOR_REVIEW_PRICE }),
  },
  {
    method: "GET",
    path: "/wallet/ledger",
    handler: () => ({
      entries: getWalletEntries().map((e) => ({
        id: e.id,
        date: e.at,
        description: e.label,
        type: e.amount >= 0 ? "credit" : "debit",
        amountUSD: Math.abs(e.amount),
      })),
    }),
  },
  {
    method: "GET",
    path: "/opportunities/get-credit",
    handler: () => ({ credit: 0 }),
  },
  {
    method: "POST",
    path: "/opportunities/upgradePlan",
    handler: () => ({ success: true }),
  },
];
