// Tasks — the cross-cutting action inbox.
// Tasks are DERIVED from the other surfaces (bids, mentors, roadmap, business, wallet).
// Local overrides (read/done/snoozed) live in-memory and reset on reload.

import { CLOSING_WINDOW_DAYS } from "./closingWindow";
import { NOW } from "./format";
import { listBids } from "./mock/bids";
import { getMentorReviewsSnapshot } from "./mentorReviewsApi";
import {
  currentMember,
  currentRoadmap,
  findNextSubStep,
} from "./mock/currentMember";
import { activeReminders, computeStatus, formatDueLine } from "./stayReady";
import { listPendingRefresh } from "./capStatementFreshness";
import { isLow as walletIsLow } from "./wallet";
import { bus } from "./eventBus";


export type TaskSource = "roadmap" | "bids" | "mentors" | "business" | "wallet" | "forecast" | "stay-ready";
export type TaskUrgency = "do_next" | "soon" | "whenever";
export type TaskStatus = "open" | "done" | "snoozed";

export interface Task {
  id: string;
  source: TaskSource;
  title: string;
  body?: string;
  urgency: TaskUrgency;
  action: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  status: TaskStatus;
  unread: boolean;
  createdAt: string;
}

// Retained for backwards-compat (legacy listeners may still reference it).
export const TASKS_CHANGED_EVENT = "tasks-changed";

type Override = { status?: TaskStatus; readAt?: string };
type Overrides = Record<string, Override>;

let overrides: Overrides = {};
let reads: Record<string, true> = {};

function readOverrides(): Overrides { return overrides; }
function writeOverrides(o: Overrides) { overrides = o; publishChange(); }
function readReads(): Record<string, true> { return reads; }
function writeReads(r: Record<string, true>) { reads = r; publishChange(); }

function publishChange() {
  bus.publish("tasks");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
  }
}

export function resetTasks(): void {
  overrides = {};
  reads = {};
  publishChange();
}

// ── Base derivation (no overrides applied) ───────────────────────────────

type BaseTask = Omit<Task, "status" | "unread"> & {
  defaultUnread: boolean;
};

function safeBlock(label: string, fn: () => void) {
  try {
    fn();
  } catch (e) {
    console.warn(`tasks: derive block "${label}" failed`, e);
  }
}

function deriveBaseTasks(): BaseTask[] {
  const out: BaseTask[] = [];
  const now = NOW.toISOString();

  // 1) Bids — closes soon + not with a mentor yet
  safeBlock("bids", () => {
    for (const bid of listBids() ?? []) {
      if (
        bid?.deadline &&
        bid.stage === "reviewing" &&
        !bid.mentorReviewId
      ) {
        const d = Math.ceil(
          (new Date(bid.deadline).getTime() - NOW.getTime()) / 86_400_000,
        );
        // Inside the closing window a mentor send is refused, so never suggest it.
        if (d > CLOSING_WINDOW_DAYS && d <= 7) {
          const dayWord = d === 1 ? "day" : "days";
          out.push({
            id: `bids:${bid.id}:send-to-mentor`,
            source: "bids",
            title: `${shortTitle(bid.title ?? "Your bid")} closes in ${d} ${dayWord}`,
            body: "Send it to a mentor before you run out of runway.",
            urgency: "do_next",
            action: {
              label: "Send to mentor",
              href: `/opportunities/${bid.opportunityId}`,
            },
            secondaryAction: { label: "View bid", href: "/pipeline" },
            createdAt: bid.lastActivityAt ?? now,
            defaultUnread: true,
          });
        }
      }
    }
  });

  // 2) Mentors — unread mentor reply (real /mentors data, not mock)
  safeBlock("mentors", () => {
    for (const r of getMentorReviewsSnapshot() ?? []) {
      if (!r || !r.title || !r.unread) continue;
      out.push({
        id: `mentors:${r.id}:reply`,
        source: "mentors",
        title: `${r.mentorName ?? "Your mentor"} replied on your ${shortTitle(r.title)}`,
        body: "Read the reply and decide your next move.",
        urgency: "soon",
        action: { label: "Read reply", href: `/mentors/${r.id}` },
        createdAt: r.lastMessageAt ?? now,
        defaultUnread: true,
      });
    }
  });

  // 3) Roadmap — next sub-step (focus on Capability Statement here)
  safeBlock("roadmap", () => {
    if (!currentRoadmap) return;
    const next = findNextSubStep(currentRoadmap);
    if (next && next.subStep.id === "capability") {
      out.push({
        id: "roadmap:capability",
        source: "roadmap",
        title: "Finish your Capability Statement",
        body: "Unlocks more matches and lets you bid.",
        urgency: "soon",
        action: { label: "Add it now", href: "/business-profile" },
        secondaryAction: {
          label: "Want us to build it for you?",
          href: "/business-profile",
        },
        createdAt: now,
        defaultUnread: false,
      });
    }
  });

  // 4) Business — EIN
  safeBlock("business", () => {
    if (!currentMember?.einProvided) {
      out.push({
        id: "business:ein",
        source: "business",
        title: "Add your EIN",
        body: "Required for federal payments and most prime contracts.",
        urgency: "whenever",
        action: { label: "Add", href: "/business-profile" },
        createdAt: now,
        defaultUnread: false,
      });
    }
  });

  // 5) Wallet — low balance
  safeBlock("wallet", () => {
    if (walletIsLow()) {
      out.push({
        id: "wallet:low",
        source: "wallet",
        title: "Your wallet is low",
        body: "Top up so mentor reviews and DFY services don't get blocked.",
        urgency: "soon",
        action: { label: "Top up", href: "/wallet" },
        createdAt: now,
        defaultUnread: false,
      });
    }
  });

  // 6) Stay Ready — staged renewal reminders
  safeBlock("stay-ready", () => {
    for (const it of activeReminders() ?? []) {
      if (!it?.shortName) continue;
      const due = formatDueLine(it);
      if (!due) continue;
      const status = computeStatus(it);
      const urgency: TaskUrgency =
        status === "overdue" || status === "urgent" ? "do_next" : "soon";
      out.push({
        id: `stay-ready:${it.id}`,
        source: "stay-ready",
        title: `Your ${it.shortName} ${due}.`,
        body: it.stakes,
        urgency,
        action: {
          label: "Renew it myself",
          href: `/stay-ready/${it.id}?mode=self`,
        },
        secondaryAction: it.dfyAvailable
          ? {
              label: `Have us do it — $${it.dfyPriceUSD}`,
              href: `/stay-ready/${it.id}`,
            }
          : undefined,
        createdAt: now,
        defaultUnread: true,
      });
    }
  });

  // 7) Cap-statement freshness — knowledge-triggered refresh prompts
  safeBlock("cap-refresh", () => {
    for (const p of listPendingRefresh() ?? []) {
      if (!p?.id) continue;
      out.push({
        id: `stay-ready:refresh:${p.id}`,
        source: "stay-ready",
        title: `You just added ${p.triggerLabel}. Refresh your capability statement?`,
        body: "An up-to-date capability statement wins more work — buyers see the new credential the moment you share it.",
        urgency: "soon",
        action: {
          label: "Update it now",
          href: `/cap-statement/builder?refresh=${p.id}`,
        },
        createdAt: p.createdAt ?? now,
        defaultUnread: true,
      });
    }
  });

  return out;
}

function shortTitle(t: string): string {
  const i = t.indexOf(" — ");
  return i > 0 ? t.slice(0, i) : t;
}

// ── Public API ────────────────────────────────────────────────────────────

export function listTasks(): Task[] {
  let base: BaseTask[] = [];
  try {
    base = deriveBaseTasks();
  } catch (e) {
    console.warn("tasks: deriveBaseTasks failed", e);
    return [];
  }
  const overrides = readOverrides();
  const reads = readReads();

  // Cap do_next at 2 — spillover demotes to soon
  let doNextCount = 0;
  const ranked: Task[] = [];
  for (const b of base) {
    const ov = overrides[b.id] ?? {};
    let urgency: TaskUrgency = b.urgency;
    if (urgency === "do_next") {
      if (doNextCount >= 2) urgency = "soon";
      else doNextCount += 1;
    }
    const status: TaskStatus = ov.status ?? "open";
    const unread = b.defaultUnread && !reads[b.id] && status === "open";
    ranked.push({
      id: b.id,
      source: b.source,
      title: b.title,
      body: b.body,
      urgency,
      action: b.action,
      secondaryAction: b.secondaryAction,
      status,
      unread,
      createdAt: b.createdAt,
    });
  }
  return ranked;
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  const o = readOverrides();
  o[id] = { ...(o[id] ?? {}), status };
  writeOverrides(o);
}

export function markRead(id: string): void {
  const reads = readReads();
  if (reads[id]) return;
  reads[id] = true;
  writeReads(reads);
}

export function countOpenUnread(): number {
  return listTasks().filter((t) => t.status === "open" && t.unread).length;
}


