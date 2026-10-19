// Stay Ready — proactive tracking of time-bound obligations.
// DEMO: the items, their reminders and the text alerts live in the demo store
// (keys `profile.stayReady` and `profile.sms`), so a renewal, a snooze or an order
// survives a reload and "Reset demo" restores the start. Dates come from the demo
// clock, so nothing in the list falls into the past between sales calls.

import { byMember, own } from "../demo/member";
import { PERSONA } from "../demo/story/persona";
import { daysFromNow as clockDaysFromNow, daysUntil as clockDaysUntil, isoDaysFromNow } from "../demo/story/clock";
import { readDemoState, updateDemoState, useDemoState } from "../demo/runtime/store";
import { saveRenewalConfirmation } from "./knowledgeBase";

const copy = own(
  import.meta.glob<typeof import("../demo/members/agency/copy")>("/src/demo/members/*/copy.tsx", { eager: true }),
);

export type ItemKind = "sam" | "permit" | "wosb-cert" | "insurance";
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
  /** The name of the file she attached as proof, if she attached one. */
  proofFileName?: string;
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
  /** The site where the renewal is filed, shown by name. The demo never opens it. */
  govLink?: string;
  workflow?: WorkflowState;
  snoozedUntil?: string;
  lastReminderStage?: number;
  lastConfirmationFileId?: string;
  completedAt?: string;
}

export const STAY_READY_CHANGED_EVENT = "stay-ready-changed";

const KEY = "profile.stayReady";

function seed(): TrackedItem[] {
  return byMember({ caterer: catererItems, pack: () => copy.stayReadyItems(samItem) })();
}

function samItem(): TrackedItem {
  return {
    id: "sam",
    kind: "sam",
    name: "SAM.gov registration",
    shortName: "SAM.gov",
    // The story says SAM is active until this date (PERSONA.samActiveUntil).
    dueDate: new Date(`${PERSONA.samActiveUntil}T00:00:00`).toISOString(),
    dfyAvailable: true,
    dfyPriceUSD: 290,
    smsOptIn: true,
    stakes:
      "SAM must stay active to be awarded contracts. If it lapses, you can't win work until it's renewed.",
    govLink: "https://sam.gov",
  };
}

function catererItems(): TrackedItem[] {
  return [
    samItem(),
    {
      id: "health-permit",
      kind: "permit",
      name: "Food establishment health permit",
      shortName: "health permit",
      dueDate: isoDaysFromNow(21, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: true,
      stakes:
        "School and base dining buyers check that your kitchen permit is current. Letting it lapse stops all food work.",
    },
    {
      id: "wosb-cert",
      kind: "wosb-cert",
      name: "WOSB certification",
      shortName: "WOSB cert",
      dueDate: isoDaysFromNow(48, 0),
      dfyAvailable: true,
      dfyPriceUSD: 250,
      smsOptIn: false,
      stakes:
        "Your woman-owned status is how you compete on set-aside work. If it lapses, you lose access to WOSB-only solicitations until you recertify.",
      govLink: "https://certify.sba.gov",
    },
    {
      id: "insurance",
      kind: "insurance",
      name: "General liability insurance",
      shortName: "insurance",
      dueDate: isoDaysFromNow(120, 0),
      dfyAvailable: false,
      dfyPriceUSD: 0,
      smsOptIn: false,
      stakes:
        "Most federal and state solicitations require active liability insurance. An expired policy means you can't submit.",
    },
  ];
}

function items(): TrackedItem[] {
  return readDemoState<TrackedItem[]>(KEY, seed);
}

function commit(fn: (prev: TrackedItem[]) => TrackedItem[]) {
  updateDemoState<TrackedItem[]>(KEY, seed, fn);
}

function daysUntil(iso: string): number {
  return clockDaysUntil(iso);
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
  return new Date(item.snoozedUntil).getTime() > Date.now();
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
  return items();
}

export function getItem(id: string): TrackedItem | undefined {
  return items().find((i) => i.id === id);
}

export function snoozeItem(id: string, days: number) {
  const until = clockDaysFromNow(days).toISOString();
  commit((prev) => prev.map((i) => (i.id === id ? { ...i, snoozedUntil: until } : i)));
}

const SELF_STEPS: Record<ItemKind, string[]> = {
  sam: [
    "Sign in to SAM.gov with your account",
    "Confirm entity info (UEI, CAGE, NAICS)",
    "Update your POCs and banking",
    "Submit your renewal",
  ],
  "wosb-cert": [
    "Sign in to the SBA certification portal",
    "Confirm ownership and control have not changed",
    "Upload any documents that changed",
    "Submit your annual recertification",
  ],
  permit: [
    "Find your renewal notice from the county health department",
    "Confirm your kitchen address and menu type have not changed",
    "Pay the annual permit fee",
    "Submit the renewal and keep the receipt",
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
  commit((prev) =>
    prev.map((it) => {
      if (it.id !== id || it.workflow) return it;
      const steps = mode === "self" ? SELF_STEPS[it.kind] : DFY_STEPS;
      return {
        ...it,
        workflow: {
          mode,
          startedAt: new Date().toISOString(),
          steps: steps.map((label, i) => ({ label, done: mode === "dfy" && i === 0 })),
        },
      };
    }),
  );
}

export function toggleWorkflowStep(id: string, stepIndex: number) {
  commit((prev) =>
    prev.map((it) => {
      if (it.id !== id || !it.workflow) return it;
      const steps = it.workflow.steps.map((s, i) => (i === stepIndex ? { ...s, done: !s.done } : s));
      return { ...it, workflow: { ...it.workflow, steps } };
    }),
  );
}

/** Attach (or clear) the proof file of a renewal that is in progress. */
export function setProofFile(id: string, fileName: string | undefined) {
  commit((prev) =>
    prev.map((it) =>
      it.id === id && it.workflow ? { ...it, workflow: { ...it.workflow, proofFileName: fileName } } : it,
    ),
  );
}

export function completeRenewal(id: string, confirmationNumber: string) {
  const it = getItem(id);
  if (!it?.workflow) return;
  const now = new Date();
  const file = saveRenewalConfirmation({
    itemName: it.name,
    confirmationNumber,
    year: now.getFullYear() + 1,
  });
  const nextDate = new Date(it.dueDate);
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  commit((prev) =>
    prev.map((x) =>
      x.id === id && x.workflow
        ? {
            ...x,
            workflow: {
              ...x.workflow,
              steps: x.workflow.steps.map((s) => ({ ...s, done: true })),
              confirmationNumber,
              completedAt: now.toISOString(),
            },
            completedAt: now.toISOString(),
            dueDate: nextDate.toISOString(),
            lastConfirmationFileId: file.id,
            snoozedUntil: undefined,
          }
        : x,
    ),
  );
}

export function resetItemDemo(_id: string) {
  commit(() => seed());
}

export function resetStayReady(): void {
  commit(() => seed());
}

export function toggleSms(id: string) {
  commit((prev) => prev.map((i) => (i.id === id ? { ...i, smsOptIn: !i.smsOptIn } : i)));
}

export function useStayReady(): TrackedItem[] {
  const [list] = useDemoState<TrackedItem[]>(KEY, seed);
  return list;
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
      headline: `You're current. Next renewal is your ${dueSoon.shortName} in ${d} days.`,
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
    headline: `You're all current. Next renewal is your ${next.shortName} in ${d} days.`,
    tone: "calm",
    urgentCount: 0,
    nextItem: next,
  };
}

export function activeReminders(): TrackedItem[] {
  return items().filter((i) => {
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

// ── text alerts (DEMO: no text is sent; the outbox is kept in the demo store) ──

export interface SmsMessage {
  id: string;
  to: string;
  body: string;
  sentAt: string;
  relatedItemId?: string;
}

const SMS_KEY = "profile.sms";
const EMPTY_SMS: SmsMessage[] = [];

/** Her phone number with the middle digits hidden: (910) ***-0148 */
export const MASKED_PHONE = PERSONA.phone.replace(/(\(\d{3}\)\s)\d{3}(-\d{4})/, "$1***$2");

export function sendReminderText(body: string, relatedItemId?: string): SmsMessage {
  const msg: SmsMessage = {
    id: `sms_${Date.now()}`,
    to: MASKED_PHONE,
    body,
    sentAt: new Date().toISOString(),
    relatedItemId,
  };
  updateDemoState<SmsMessage[]>(SMS_KEY, EMPTY_SMS, (prev) => [msg, ...prev]);
  return msg;
}

export function useSmsOutbox(): SmsMessage[] {
  const [list] = useDemoState<SmsMessage[]>(SMS_KEY, EMPTY_SMS);
  return list;
}
