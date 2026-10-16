// Stay Ready — proactive tracking of time-bound obligations.
// In-memory state seeded from SEED; resets on reload.

import { useSyncExternalStore } from "react";
import { NOW, daysUntil } from "./format";
import { saveRenewalConfirmation } from "./knowledgeBase";
import { bus } from "./eventBus";

export type ItemKind = "sam" | "nc-license" | "insurance" | "sdvosb-cert";
export type ItemStatus =
  | "ok"
  | "upcoming"
  | "due_soon"
  | "urgent"
  | "overdue"
  | "in_progress"
  | "done";

export interface WorkflowState {
  mode: "self" | "dfy";
  startedAt: string;
  steps: { label: string; done: boolean }[];
  confirmationNumber?: string;
  completedAt?: string;
}

export interface TrackedItem {
  id: string;
  kind: ItemKind;
  name: string;
  shortName: string;
  dueDate: string;
  dfyAvailable: boolean;
  dfyPriceUSD: number;
  smsOptIn: boolean;
  stakes: string;
  govLink?: string;
  workflow?: WorkflowState;
  snoozedUntil?: string;
  lastReminderStage?: number;
  lastConfirmationFileId?: string;
  completedAt?: string;
}

export const STAY_READY_CHANGED_EVENT = "stay-ready-changed";

function daysFromNow(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString();
}

function seed(): TrackedItem[] {
  return [
    {
      id: "sam",
      kind: "sam",
      name: "SAM.gov registration",
      shortName: "SAM.gov",
      dueDate: daysFromNow(30),
      dfyAvailable: true,
      dfyPriceUSD: 290,
      smsOptIn: true,
      stakes:
        "SAM must stay active to be awarded contracts. If it lapses, you can't win work until it's renewed.",
      govLink: "https://sam.gov",
    },
    {
      id: "sdvosb",
      kind: "sdvosb-cert",
      name: "SDVOSB verification",
      shortName: "SDVOSB cert",
      dueDate: daysFromNow(14),
      dfyAvailable: true,
      dfyPriceUSD: 450,
      smsOptIn: true,
      stakes:
        "Your SDVOSB status is how you compete on set-aside work. If it lapses, you lose access to SDVOSB-only solicitations until you re-verify.",
      govLink: "https://veterans.certify.sba.gov",
    },
    {
      id: "nc-license",
      kind: "nc-license",
      name: "NC general contractor license",
      shortName: "NC GC license",
      dueDate: daysFromNow(75),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "Your NC contractor license is required on any state or local job. Letting it lapse blocks all NC-side work.",
      govLink: "https://www.nclbgc.org",
    },
    {
      id: "insurance",
      kind: "insurance",
      name: "General liability & bonding",
      shortName: "Insurance",
      dueDate: daysFromNow(120),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "Most federal and state solicitations require active GL + bonding. An expired policy means you can't submit.",
    },
  ];
}

let items: TrackedItem[] = seed();

function commit(next: TrackedItem[]) {
  items = next;
  bus.publish("stayReady");
}

export function computeStatus(item: TrackedItem): ItemStatus {
  if (item.workflow?.completedAt) return "done";
  if (item.workflow && !item.workflow.completedAt) return "in_progress";
  const d = daysUntil(item.dueDate);
  if (d < 0) return "overdue";
  if (d <= 14) return "urgent";
  if (d <= 30) return "due_soon";
  if (d <= 90) return "upcoming";
  return "ok";
}

export function isSnoozed(item: TrackedItem): boolean {
  if (!item.snoozedUntil) return false;
  return new Date(item.snoozedUntil).getTime() > NOW.getTime();
}

export function statusChip(status: ItemStatus): { label: string; tone: string } {
  switch (status) {
    case "ok": return { label: "On track", tone: "ok" };
    case "upcoming": return { label: "Upcoming", tone: "upcoming" };
    case "due_soon": return { label: "Due soon", tone: "due-soon" };
    case "urgent": return { label: "Urgent", tone: "urgent" };
    case "overdue": return { label: "Overdue", tone: "overdue" };
    case "in_progress": return { label: "In progress", tone: "in-progress" };
    case "done": return { label: "Renewed", tone: "done" };
  }
}

export function formatDueLine(item: TrackedItem): string {
  const d = daysUntil(item.dueDate);
  const date = new Date(item.dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (d < 0) return `expired ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ago (${date})`;
  if (d === 0) return `expires today (${date})`;
  if (d === 1) return `expires tomorrow (${date})`;
  return `expires in ${d} days (${date})`;
}

export function listTrackedItems(): TrackedItem[] {
  return items;
}

export function getItem(id: string): TrackedItem | undefined {
  return items.find((i) => i.id === id);
}

export function snoozeItem(id: string, days: number) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const next = [...items];
  next[idx] = { ...next[idx], snoozedUntil: daysFromNow(days) };
  commit(next);
}

const SELF_STEPS: Record<ItemKind, string[]> = {
  sam: [
    "Sign in to SAM.gov with your account",
    "Confirm entity info (UEI, CAGE, NAICS)",
    "Update your POCs and banking",
    "Submit your renewal",
  ],
  "sdvosb-cert": [
    "Sign in to the VetCert portal",
    "Re-upload your DD-214 if expired",
    "Confirm ownership and control",
    "Submit your re-verification",
  ],
  "nc-license": [
    "Sign in to the NCLBGC portal",
    "Pay your annual license fee",
    "Confirm classifications and financial statement",
    "Submit your renewal",
  ],
  insurance: [
    "Contact your broker for a renewal quote",
    "Confirm coverage limits still meet contract requirements",
    "Receive new COI",
    "Upload new COI here",
  ],
};

const DFY_STEPS: string[] = [
  "Confirmation received by Govpreneurs",
  "Documents prepared and reviewed",
  "Filed on your behalf",
  "Confirmation received",
];

export function startRenewal(id: string, mode: "self" | "dfy") {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const it = items[idx];
  const steps = mode === "self" ? SELF_STEPS[it.kind] : DFY_STEPS;
  const next = [...items];
  next[idx] = {
    ...it,
    workflow: {
      mode,
      startedAt: new Date().toISOString(),
      steps: steps.map((label, i) => ({
        label,
        done: mode === "dfy" && i === 0,
      })),
    },
  };
  commit(next);
}

export function toggleWorkflowStep(id: string, stepIndex: number) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0 || !items[idx].workflow) return;
  const wf = items[idx].workflow!;
  const steps = wf.steps.map((s, i) => (i === stepIndex ? { ...s, done: !s.done } : s));
  const next = [...items];
  next[idx] = { ...items[idx], workflow: { ...wf, steps } };
  commit(next);
}

export function completeRenewal(id: string, confirmationNumber: string) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0 || !items[idx].workflow) return;
  const it = items[idx];
  const now = new Date();
  const file = saveRenewalConfirmation({
    itemName: it.name,
    confirmationNumber,
    year: now.getFullYear() + 1,
  });
  const nextDate = new Date(it.dueDate);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  const next = [...items];
  next[idx] = {
    ...it,
    workflow: {
      ...it.workflow!,
      steps: it.workflow!.steps.map((s) => ({ ...s, done: true })),
      confirmationNumber,
      completedAt: now.toISOString(),
    },
    completedAt: now.toISOString(),
    dueDate: nextDate.toISOString(),
    lastConfirmationFileId: file.id,
    snoozedUntil: undefined,
  };
  commit(next);
}

export function resetItemDemo(_id: string) {
  commit(seed());
}

export function resetStayReady(): void {
  commit(seed());
}

export function toggleSms(id: string) {
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return;
  const next = [...items];
  next[idx] = { ...next[idx], smsOptIn: !next[idx].smsOptIn };
  commit(next);
}

function snapshot(): TrackedItem[] { return items; }

export function useStayReady(): TrackedItem[] {
  return useSyncExternalStore(
    (cb) => bus.subscribe("stayReady", cb),
    snapshot,
    snapshot,
  );
}

export function useStayReadySummary(): {
  headline: string;
  tone: "calm" | "warn" | "alert";
  urgentCount: number;
  nextItem?: TrackedItem;
} {
  const list = useStayReady();
  const active = list.filter((i) => computeStatus(i) !== "done");
  const sorted = [...active].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const urgent = sorted.filter((i) => {
    const s = computeStatus(i);
    return s === "urgent" || s === "overdue";
  });
  if (urgent.length > 0) {
    return {
      headline: `${urgent.length} urgent item${urgent.length === 1 ? "" : "s"} need${urgent.length === 1 ? "s" : ""} attention.`,
      tone: "alert",
      urgentCount: urgent.length,
      nextItem: urgent[0],
    };
  }
  const dueSoon = sorted.find((i) => computeStatus(i) === "due_soon");
  if (dueSoon) {
    const d = daysUntil(dueSoon.dueDate);
    return {
      headline: `You're current. Next renewal is ${dueSoon.shortName} in ${d} days.`,
      tone: "warn",
      urgentCount: 0,
      nextItem: dueSoon,
    };
  }
  const next = sorted[0];
  if (!next) {
    return { headline: "You're all current.", tone: "calm", urgentCount: 0 };
  }
  const d = daysUntil(next.dueDate);
  return {
    headline: `You're all current. Next renewal is ${next.shortName} in ${d} days.`,
    tone: "calm",
    urgentCount: 0,
    nextItem: next,
  };
}

export function activeReminders(): TrackedItem[] {
  return items.filter((i) => {
    if (isSnoozed(i)) return false;
    const s = computeStatus(i);
    return s === "due_soon" || s === "urgent" || s === "overdue";
  });
}

export function mostUrgentReminder(): TrackedItem | undefined {
  const active = activeReminders();
  const order: ItemStatus[] = ["overdue", "urgent", "due_soon"];
  return [...active].sort((a, b) => {
    const sa = order.indexOf(computeStatus(a));
    const sb = order.indexOf(computeStatus(b));
    if (sa !== sb) return sa - sb;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];
}
