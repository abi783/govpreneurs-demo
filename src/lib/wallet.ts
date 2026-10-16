// Wallet — prepaid credit that pays for mentor reviews and DFY services.
// In-memory store seeded from mock data; resets on reload. Mutations publish
// on the event bus so subscribers re-render.

import { NOW, relativeTime } from "./format";
import { bus } from "./eventBus";

export interface Tx {
  id: string;
  date: string;
  description: string;
  type: "debit" | "credit";
  amountUSD: number;
  relatedTo?: { label: string; href: string };
}

export interface AutoRecharge {
  enabled: boolean;
  threshold: number;
  amount: number;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
}

export interface Wallet {
  balanceUSD: number;
  autoRecharge: AutoRecharge;
  paymentMethod?: PaymentMethod;
  transactions: Tx[];
}

export const MENTOR_REVIEW_COST = 97;
export const LOW_BALANCE_THRESHOLD = 97;
// Retained for backwards-compat (legacy listeners may still reference it).
// New code should subscribe through eventBus instead.
export const WALLET_CHANGED_EVENT = "wallet-changed";

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86_400_000).toISOString();
}

function seed(): Wallet {
  return {
    balanceUSD: 55.94,
    autoRecharge: { enabled: false, threshold: 20, amount: 100 },
    paymentMethod: { brand: "Visa", last4: "4242" },
    transactions: [
      { id: "tx_006", date: daysAgo(22), description: "Added funds", type: "credit", amountUSD: 100 },
      { id: "tx_005", date: daysAgo(18), description: "Mentor review — VA patient meal service", type: "debit", amountUSD: 97, relatedTo: { label: "View thread", href: "/mentors/rev_va_salisbury" } },
      { id: "tx_004", date: daysAgo(14), description: "Added funds", type: "credit", amountUSD: 100 },
      { id: "tx_003", date: daysAgo(10), description: "Capability Statement (DFY)", type: "debit", amountUSD: 2000, relatedTo: { label: "View in My Business", href: "/business-profile" } },
      { id: "tx_002", date: daysAgo(5), description: "Added funds", type: "credit", amountUSD: 50 },
      { id: "tx_001", date: daysAgo(2), description: "Mentor consult — second opinion on Fort Bragg", type: "debit", amountUSD: 97, relatedTo: { label: "View bid", href: "/pipeline" } },
    ],
  };
}

let state: Wallet = seed();

function commit(next: Wallet): Wallet {
  state = next;
  bus.publish("wallet");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WALLET_CHANGED_EVENT));
  }
  return state;
}

export function getWallet(): Wallet {
  return state;
}

export function setWallet(next: Wallet): Wallet {
  return commit(next);
}

export function addFunds(amount: number): Wallet {
  const tx: Tx = {
    id: `tx_${Date.now()}`,
    date: new Date().toISOString(),
    description: "Added funds",
    type: "credit",
    amountUSD: amount,
  };
  return commit({
    ...state,
    balanceUSD: Math.round((state.balanceUSD + amount) * 100) / 100,
    transactions: [...state.transactions, tx],
  });
}

export function setAutoRecharge(next: AutoRecharge): Wallet {
  return commit({ ...state, autoRecharge: next });
}

export function isLow(w?: Wallet): boolean {
  const wallet = w ?? state;
  return wallet.balanceUSD < LOW_BALANCE_THRESHOLD;
}

export function resetWallet(): void {
  commit(seed());
}

// Display helper — reverse-chron order.
export function recentTransactions(w: Wallet, limit?: number): Tx[] {
  const sorted = [...w.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function formatRelativeDate(iso: string): string {
  return relativeTime(iso);
}

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
