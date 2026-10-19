// DEMO: the sample TasksPayload for the Tasks page.
//
// Production builds this on the server (src/lib/tasks/read.ts) from the member's
// task rows. The demo builds it from the story's TASKS (workspace.ts): the title,
// the reason, the due date, the done state and the place its button goes. What
// the visitor does (tick, dismiss, snooze, restore) is kept in the demo store.
// Booking the quarterly targeting call on the Roadmap, or from here, ticks its task.

import { avaSentAt, cumberlandCertificatesIn } from "@/demo/ava/progress";
import type {
  BookingStepView,
  MemberTaskSection,
  TaskSourceView,
  TaskView,
  TasksPayload,
} from "@sc/lib/tasks/read";
import { displaySource } from "@sc/lib/tasks/read";
import { PROGRAM_TZ } from "@sc/lib/businessProfile/deadline";
import { CALL_STEP_IDS } from "@sc/lib/callStepIds";
import { OPPORTUNITIES } from "@/demo/story/opportunities";
import { KEY_PARTNER, MENTOR } from "@/demo/story/persona";
import { MENTOR_REVIEWS, TASKS, type StoryTask } from "@/demo/story/workspace";
import { isoDaysFromNow } from "@/demo/story/clock";
import { readDemoState, updateDemoState } from "@/demo/runtime/store";
import {
  CALL_PRICE,
  DONE_DATES,
  POSITIONING_CALL_DAYS_AGO,
  TARGETING_STEP_ID,
} from "../roadmap/model";
import { bookingForCall } from "../roadmap/state";

// ── What the visitor changed ───────────────────────────────────────────────

interface TaskChange {
  status?: "open" | "done" | "dismissed";
  doneAt?: string | null;
  doneBy?: string | null;
  dismissedReason?: string | null;
  snoozedUntil?: string | null;
}

const KEY = "tasks.changes";
const getChanges = () => readDemoState<Record<string, TaskChange>>(KEY, {});

export function changeTask(id: string, patch: TaskChange): void {
  updateDemoState<Record<string, TaskChange>>(KEY, {}, (prev) => ({
    ...prev,
    [id]: { ...prev[id], ...patch },
  }));
}

export function taskExists(id: string): boolean {
  return TASKS.some((t) => t.id === id);
}

// ── How each story task looks on the page ──────────────────────────────────

const ago = (days: number) => isoDaysFromNow(-days, 10);

/** The two lists that show a person's name: the Roadmap list and the Action Plan list. */
function sectionFor(t: StoryTask): MemberTaskSection {
  // Sarah is the person on the other end of these two. Everything else is program work.
  return t.source === "mentor" || t.id === "task-targeting-call" ? "mentor" : "govready";
}

/** Why the deadline is what it is. A date on this page always carries a reason. */
const DUE_REASON: Record<string, string> = {
  "task-ava-mackall": "so Ava can finish the quote",
  "task-certificates": "so Ava can restart the Cumberland County bid",
  "task-read-sarah": "so you can use her notes in your proposal",
  "task-send-reply": "before the notice closes",
  "task-contact-cdg": "so a team bid is still possible",
  "task-targeting-call": "before your next quarter starts",
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: PROGRAM_TZ,
  });
}

/** The opportunity a task's button opens, when it opens one. */
function opportunityFor(to: string) {
  const id = /^\/ava\/([^/?#]+)/.exec(to)?.[1];
  return id ? OPPORTUNITIES.find((o) => o.id === id) : undefined;
}

/** When a finished roadmap task was finished: the day its roadmap step was. */
function finishedDaysAgo(t: StoryTask): number {
  return t.id === "task-positioning-call"
    ? POSITIONING_CALL_DAYS_AGO
    : DONE_DATES["p2-capability-statement"]!.done;
}

function sourcesFor(t: StoryTask, open: boolean): TaskSourceView[] {
  const base = { occurredAt: null, actorName: null, excerpt: null, deepLink: null };
  const out: TaskSourceView[] = [];

  if (t.source === "ava") {
    const opp = opportunityFor(t.to);
    out.push({
      ...base,
      kind: "SYSTEM",
      isPrimary: true,
      refId: `ava:${opp?.id ?? t.id}`,
      label: `Ava · ${opp?.plainTitle ?? "your bid"}`,
      actorName: "Ava",
      occurredAt: ago(0),
    });
  } else if (t.source === "mentor") {
    const review = MENTOR_REVIEWS.find((r) => t.to.endsWith(r.id));
    out.push({
      ...base,
      kind: "MENTOR",
      isPrimary: true,
      refId: `mentor:${review?.id ?? t.id}`,
      label: `${MENTOR.name} · ${review?.title ?? "Your review"}`,
      actorName: MENTOR.name,
      occurredAt: ago(review?.lastMessageDaysAgo ?? 0),
    });
  } else if (t.source === "grant" || t.source === "partners") {
    out.push({
      ...base,
      kind: "SYSTEM",
      isPrimary: true,
      refId: `grant:${t.id}`,
      label: `Grant · ${KEY_PARTNER.name}`,
      actorName: "Grant",
      occurredAt: ago(1),
    });
  } else {
    // A roadmap task. The quarterly call books in place; the finished ones are labels.
    if (t.id === "task-targeting-call") {
      out.push({
        ...base,
        kind: "ROADMAP",
        isPrimary: true,
        refId: `call:${CALL_STEP_IDS.targeting}`,
        label: "Your roadmap · Quarterly Targeting Call",
        actorName: MENTOR.name,
        deepLink: `/roadmap?step=${TARGETING_STEP_ID}`,
        occurredAt: ago(0),
      });
      // Where Sarah raised it: the positioning call. Opens as a quote sheet.
      out.push({
        ...base,
        kind: "MEETING",
        isPrimary: false,
        refId: "meeting:positioning-call",
        label: `${MENTOR.name} · Positioning call · ${shortDate(ago(POSITIONING_CALL_DAYS_AGO))}`,
        actorName: MENTOR.name,
        occurredAt: ago(POSITIONING_CALL_DAYS_AGO),
        excerpt:
          "Let's set up a targeting call every quarter, so we plan your next bids around Fort Bragg and the VA.",
      });
    } else {
      const step = t.id === "task-positioning-call" ? "Positioning Call" : "Capability Statement";
      out.push({
        ...base,
        kind: "ROADMAP",
        isPrimary: true,
        refId: null,
        label: `Your roadmap · ${step}`,
        occurredAt: ago(finishedDaysAgo(t)),
      });
    }
  }

  // The button. An open task gets one "Open" button to its page in this app.
  // It rides on a source the card draws as a button and not as a chip.
  if (open && t.id !== "task-targeting-call") {
    out.push({
      ...base,
      kind: "ONBOARDING",
      isPrimary: false,
      refId: "open",
      label: "Open",
      deepLink: t.to,
    });
  }
  return out;
}

function viewFor(t: StoryTask, now: Date): TaskView {
  const change = getChanges()[t.id] ?? {};
  const booked = t.id === "task-targeting-call" && !!bookingForCall(CALL_STEP_IDS.targeting);
  // DEMO: tasks that Ava finishes when Tim does the step in Ava during a call.
  const doneInAva =
    (t.id === "task-send-reply" && !!avaSentAt("W912EE-27-S-0004")) ||
    (t.id === "task-certificates" && cumberlandCertificatesIn());

  const status: TaskView["status"] = change.status ?? (t.done || booked || doneInAva ? "done" : "open");
  const auto = t.source === "roadmap";
  const open = status === "open";

  let doneAt: string | null = null;
  let doneBy: string | null = null;
  if (status === "done") {
    if (change.status === "done") {
      doneAt = change.doneAt ?? now.toISOString();
      doneBy = change.doneBy ?? "member";
    } else if (doneInAva) {
      doneAt = now.toISOString();
      doneBy = "auto:ava";
    } else if (booked) {
      doneAt = bookingForCall(CALL_STEP_IDS.targeting)!.createdAt;
      doneBy = "auto:booking";
    } else {
      doneAt = ago(finishedDaysAgo(t));
      doneBy = auto ? "auto:roadmap" : "member";
    }
  }

  const dueAt = t.dueInDays != null ? isoDaysFromNow(t.dueInDays, 17) : null;
  const dueDays = dueAt
    ? Math.ceil((new Date(dueAt).getTime() - now.getTime()) / 86_400_000)
    : null;
  const due =
    dueAt && DUE_REASON[t.id]
      ? {
          at: dueAt,
          reason: DUE_REASON[t.id]!,
          source: "derived",
          state: dueDays! < 0 ? "overdue" : dueDays! <= 7 ? "soon" : "calm",
        }
      : null;

  return {
    id: t.id,
    title: t.title,
    body: t.why,
    status,
    section: sectionFor(t),
    completionMode: t.id === "task-targeting-call" || t.source === "roadmap" ? "auto" : "manual",
    autoDone: status === "done" && !!doneBy?.startsWith("auto:"),
    isNew: t.id === "task-read-sarah" && open,
    isBlocking: false,
    orphaned: false,
    snoozedUntil: change.snoozedUntil ?? null,
    doneAt,
    doneBy,
    dismissedReason: status === "dismissed" ? (change.dismissedReason ?? null) : null,
    due,
    attachmentUrl: null,
    attachmentName: null,
    attachments: [],
    linkUrl: null,
    sources: sourcesFor(t, open),
  };
}

// ── Order: the same rules as production (priority.ts) ─────────────────────

const PRESSING_DAYS = 7;
const NO_DATE = Number.MAX_SAFE_INTEGER;

function compareForList(a: TaskView, b: TaskView, now: Date): number {
  const road = (t: TaskView) => t.section === "govready";
  if (road(a) !== road(b)) return road(a) ? -1 : 1;
  const days = (t: TaskView) =>
    t.due ? Math.ceil((new Date(t.due.at).getTime() - now.getTime()) / 86_400_000) : null;
  const press = (t: TaskView) => days(t) !== null && days(t)! <= PRESSING_DAYS;
  if (press(a) !== press(b)) return press(a) ? -1 : 1;
  const at = (t: TaskView) => (t.due ? new Date(t.due.at).getTime() : NO_DATE);
  return at(a) - at(b);
}

/** Why the first row is first, said as a fact she can check (reason.ts). */
function startHereFor(open: TaskView[], now: Date): string | null {
  const lead = open[0];
  if (!lead?.due) return null;
  const days = Math.ceil((new Date(lead.due.at).getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return "This one has been waiting the longest";
  if (days > PRESSING_DAYS) return null;
  const primary = displaySource(lead.sources);
  const human =
    primary?.kind === "MENTOR" || primary?.kind === "MEETING" || primary?.kind === "ACTION_PLAN";
  if (human && primary?.actorName) return `${primary.actorName} is waiting on this one`;
  if (days === 0) return "This one is due today";
  // The list puts program work above mentor work, so the first row is not always the earliest due date.
  const earliest = Math.min(...open.filter((t) => t.due).map((t) => new Date(t.due!.at).getTime()));
  return new Date(lead.due.at).getTime() === earliest ? "This one is due first" : "This one is due soon";
}

export function buildTasksPayload(): TasksPayload {
  const now = new Date();
  const views = TASKS.map((t) => viewFor(t, now));

  const snoozed = (v: TaskView) =>
    !!v.snoozedUntil && new Date(v.snoozedUntil).getTime() > now.getTime();
  const open = views
    .filter((v) => v.status === "open" && !snoozed(v))
    .sort((a, b) => compareForList(a, b, now));
  const done = views
    .filter((v) => v.status === "done")
    .sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
  const dismissed = views.filter((v) => v.status === "dismissed");

  const mentorNames = open
    .filter((t) => t.section === "mentor")
    .map((t) => displaySource(t.sources)?.actorName)
    .filter((n): n is string => !!n);
  const mentorName = new Set(mentorNames).size === 1 ? mentorNames[0]! : null;

  const bookingSteps: Record<string, BookingStepView> = {
    [CALL_STEP_IDS.targeting]: {
      stepTitle: "Quarterly Targeting Call",
      bookingTitle: "Book your quarterly targeting call",
      bookingDescription: "Plan your next quarter of bids around Fort Bragg and the VA.",
      bookingPrice: `$${CALL_PRICE}`,
    },
  };

  return {
    sections: {
      all: { tasks: open },
      strategy: { tasks: open.filter((t) => t.section === "mentor") },
      program: { tasks: open.filter((t) => t.section === "govready") },
      done: { count: done.length, tasks: done },
      dismissed: { count: dismissed.length, tasks: dismissed },
    },
    counts: {
      open: open.length,
      done: done.length,
      dismissed: dismissed.length,
      fromMentor: open.filter((t) => t.section === "mentor").length,
    },
    startHere: startHereFor(open, now),
    mentorName,
    lastVisitAt: null,
    bookingSteps,
  };
}
