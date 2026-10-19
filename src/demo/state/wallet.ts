// DEMO: the member's prepaid wallet. Starts from the story (workspace.ts
// WALLET) and records every charge the visitor makes during the demo.

import { readDemoState, updateDemoState } from "@/demo/runtime/store";
import { WALLET } from "@/demo/story/workspace";
import { isoDaysFromNow } from "@/demo/story/clock";

export interface WalletTx {
  id: string;
  label: string;
  amount: number;
  at: string;
}

const KEY = "wallet.entries";

const initial = (): WalletTx[] =>
  WALLET.entries.map((e, i) => ({ id: `tx-${i}`, label: e.label, amount: e.amount, at: isoDaysFromNow(-e.daysAgo, 10) }));

export function getWalletEntries(): WalletTx[] {
  return readDemoState<WalletTx[]>(KEY, initial);
}

export function getWalletBalance(): number {
  return getWalletEntries().reduce((s, e) => s + e.amount, 0);
}

export const MENTOR_REVIEW_PRICE = WALLET.mentorReviewPrice;

export function chargeWallet(label: string, amount: number): void {
  updateDemoState<WalletTx[]>(KEY, initial, (prev) => [
    ...prev,
    { id: `tx-${Date.now()}`, label, amount: -Math.abs(amount), at: new Date().toISOString() },
  ]);
}

export function topUpWallet(amount: number): void {
  updateDemoState<WalletTx[]>(KEY, initial, (prev) => [
    ...prev,
    { id: `tx-${Date.now()}`, label: "Wallet top-up", amount: Math.abs(amount), at: new Date().toISOString() },
  ]);
}
