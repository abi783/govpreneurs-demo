// DEMO: the past-performance entries on the Business Profile. They start from the
// four jobs in the story (PAST_PERFORMANCE) and the visitor can add, edit,
// confirm and delete them.

import { PAST_PERFORMANCE, type PastPerformance } from "../story/persona";
import { newId, readDemoState, updateDemoState, useDemoState } from "./store";

export type PpCustomerType = "Federal Prime" | "Federal Sub" | "State Government" | "Local Government" | "Commercial" | "Non-Profit" | "Other";

export interface PpEntry {
  id: string;
  title: string;
  customer: string;
  customerType: PpCustomerType;
  /** Contract type such as FFP. Not in the story, so it is only shown when the visitor adds it. */
  contractType?: string;
  /** `YYYY-MM-DD` */
  periodStart: string;
  periodEnd: string;
  value: number;
  role: "Prime" | "Sub";
  naics: string;
  scope: string;
  referenceName?: string;
  referenceTitle?: string;
  referenceEmail?: string;
  referencePhone?: string;
  /** The CPARS (federal performance) rating, or a plain "Awaiting rating". */
  cpars?: string;
  /** Names of the supporting files the visitor attached. */
  documents?: string[];
  /** `needs_review` shows the "confirm this" actions. */
  status: "attested" | "needs_review";
  /** Where the entry came from, for the review banner. */
  extractedFrom?: string;
}

const CUSTOMER_LABEL: Record<PastPerformance["customerType"], PpCustomerType> = {
  federal_prime: "Federal Prime",
  federal_sub: "Federal Sub",
  local: "Local Government",
  commercial: "Commercial",
};

function fromStory(p: PastPerformance): PpEntry {
  return {
    id: p.id,
    title: p.projectTitle,
    customer: p.customerName,
    customerType: CUSTOMER_LABEL[p.customerType],
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    value: p.totalValue,
    role: p.role === "prime" ? "Prime" : "Sub",
    naics: p.naicsCode,
    scope: p.scopeDescription,
    referenceName: p.referenceName,
    referenceTitle: p.referenceTitle,
    cpars: p.awaitingReview ? "Awaiting rating" : undefined,
    status: "attested",
  };
}

const KEY = "profile.pastPerformance";
const seed = (): PpEntry[] => PAST_PERFORMANCE.map(fromStory);

export function usePastPerformance(): PpEntry[] {
  const [entries] = useDemoState<PpEntry[]>(KEY, seed);
  return entries;
}

export function getPastPerformance(): PpEntry[] {
  return readDemoState<PpEntry[]>(KEY, seed);
}

export function addPastPerformance(entry: Omit<PpEntry, "id">): PpEntry {
  const full: PpEntry = { ...entry, id: newId("pp") };
  updateDemoState<PpEntry[]>(KEY, seed, (prev) => [...prev, full]);
  return full;
}

export function updatePastPerformance(id: string, patch: Partial<PpEntry>): void {
  updateDemoState<PpEntry[]>(KEY, seed, (prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export function deletePastPerformance(id: string): void {
  updateDemoState<PpEntry[]>(KEY, seed, (prev) => prev.filter((e) => e.id !== id));
}

/** `Federal`, `Local`, `Commercial` counts for the summary line. */
export function summarize(entries: PpEntry[]): { total: number; federal: number; local: number; commercial: number; other: number } {
  const total = entries.reduce((s, e) => s + e.value, 0);
  const federal = entries.filter((e) => e.customerType === "Federal Prime" || e.customerType === "Federal Sub").length;
  const local = entries.filter((e) => e.customerType === "Local Government" || e.customerType === "State Government").length;
  const commercial = entries.filter((e) => e.customerType === "Commercial").length;
  return { total, federal, local, commercial, other: entries.length - federal - local - commercial };
}
