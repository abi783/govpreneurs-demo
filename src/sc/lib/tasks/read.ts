// DEMO: the browser-safe half of sc-main `src/lib/tasks/read.ts`.
// The original also holds `getMemberTasks`, which reads the database with Prisma.
// That part does not come across: the sample payload is built in
// src/demo/sc/tasks/payload.ts. The interfaces below are copied as they are,
// with the Prisma enums written out as string unions.

export type TaskSourceKind = "ROADMAP" | "MEETING" | "ACTION_PLAN" | "ONBOARDING" | "SYSTEM" | "MENTOR";
export type MemberTaskSection = "mentor" | "govready";

export interface TaskFileView {
  id: string | null;
  name: string;
  url: string | null;
}

export interface TaskSourceView {
  kind: TaskSourceKind;
  isPrimary: boolean;
  /** Which origin row this is — the onboarding step id, transcript id, … */
  refId: string | null;
  label: string;
  occurredAt: string | null;
  actorName: string | null;
  excerpt: string | null;
  deepLink: string | null;
}

export interface TaskView {
  id: string;
  title: string;
  body: string | null;
  status: "open" | "done" | "dismissed";
  /** Which of the two member-facing lists this belongs to. Read straight off
   *  the column the adapter declared — never re-derived from `sources` here. */
  section: MemberTaskSection;
  completionMode: "auto" | "manual" | "attested";
  /** True when WE ticked it — the member never gets a checkbox for those. */
  autoDone: boolean;
  isNew: boolean;
  isBlocking: boolean;
  orphaned: boolean;
  snoozedUntil: string | null;
  doneAt: string | null;
  doneBy: string | null;
  dismissedReason: string | null;
  due: { at: string; reason: string; source: string; state: string } | null;
  /** Set only on hand-written tasks: the file and the link the team attached.
   *  `attachmentUrl`/`attachmentName` are the FIRST file; `attachments` is all
   *  of them (several since Sep 2026 — `taskFiles.ts`). */
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachments: TaskFileView[];
  linkUrl: string | null;
  sources: TaskSourceView[];
}

/**
 * What the booking modal needs to open for a milestone call, keyed by step id.
 * Carried on the payload so clicking "Book the call" costs no round-trip —
 * it is four columns off a step we already know the id of.
 */
export interface BookingStepView {
  stepTitle: string;
  bookingTitle: string;
  bookingDescription: string | null;
  bookingPrice: string | null;
}

/**
 * The three lists the page shows, all carrying the same order.
 *
 * `all` is every open task. `strategy` and `program` are its two halves, split
 * on the declared section, so they partition `all` exactly and nothing can be
 * in neither.
 */
export interface TasksPayload {
  sections: {
    all: { tasks: TaskView[] };
    strategy: { tasks: TaskView[] };
    program: { tasks: TaskView[] };
    done: { count: number; tasks: TaskView[] };
    dismissed: { count: number; tasks: TaskView[] };
  };
  counts: {
    open: number;
    done: number;
    dismissed: number;
    /** Open work a mentor asked for — the "Your strategy" half. */
    fromMentor: number;
  };
  /**
   * Why the first row of the All list is first, when we can say it as a fact
   * the member owns. Null is common and correct — see `taskReason`.
   */
  startHere: string | null;
  /** The mentor the open mentor-work came from, when one name dominates it. */
  mentorName: string | null;
  lastVisitAt: string | null;
  /** Booking config for every open milestone call on this page. */
  bookingSteps: Record<string, BookingStepView>;
}

/**
 * Which origin a surviving task is filed under.
 *
 * A task that is both a roadmap step and something a mentor raised is kept for
 * the second reason, so it counts under that one.
 */
export function displaySource<T extends { kind: TaskSourceKind; isPrimary: boolean }>(
  sources: T[],
): T | null {
  const notRoadmap = (s: T) => s.kind !== "ROADMAP";
  return (
    sources.find((s) => s.isPrimary && notRoadmap(s)) ??
    sources.find(notRoadmap) ??
    sources.find((s) => s.isPrimary) ??
    sources[0] ??
    null
  );
}
