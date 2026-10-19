// DEMO: what the visitor changes on the Roadmap page, kept in the demo store so it
// survives a reload and shows on other pages (the wallet, Tasks, the Home summary).
//
// Keys all start with `roadmap.`. The payload (payload.ts) is rebuilt from the
// story plus these records each time the page refreshes.

import { readDemoState, updateDemoState, writeDemoState } from "@/demo/runtime/store";
import { CALL_STEP_IDS } from "@sc/lib/callStepIds";

/** A call the member booked on the Roadmap or from the Tasks page. */
export interface DemoBooking {
  id: string;
  /** A RoadmapStep id from CALL_STEP_IDS, or the id of a service section (kickoff call). */
  stepId: string;
  kind: "call" | "delivery";
  startTime: string;
  endTime: string;
  /** What the member paid for it, in dollars. */
  paid: number;
  createdAt: string;
}

/** A done-for-you service the member bought. */
export interface DemoEnrollment {
  id: string;
  slug: string;
  serviceTitle: string;
  sectionId: string;
  stepId: string;
  /** Dollars charged to the wallet. */
  amount: number;
  couponCode: string | null;
  enrolledAt: string;
  /** Set when the member booked the kickoff call. */
  deliveryAppointmentAt: string | null;
}

/** The newest result of a member-run check, replacing the story's sample result. */
export interface DemoVerification {
  status: "pass" | "fail" | "needs_input" | "error";
  message: string | null;
  checkedAt: string;
  data: unknown;
}

export interface DemoUpload {
  name: string;
  url: string;
  at: string;
}

const BOOKINGS = "roadmap.bookings";
const ENROLLMENTS = "roadmap.enrollments";
const TICKS = "roadmap.ticks";
const VERIFY = "roadmap.verify";
const UPLOADS = "roadmap.uploads";
const FORMS = "roadmap.forms";
const EXPLORED = "roadmap.explored";

export const getBookings = () => readDemoState<DemoBooking[]>(BOOKINGS, []);
export const getEnrollments = () => readDemoState<DemoEnrollment[]>(ENROLLMENTS, []);
/** `${subStepId}::${itemTitle}` → true (ticked) or false (the member un-ticked a story tick). */
export const getTicks = () => readDemoState<Record<string, boolean>>(TICKS, {});
/** validationKey → the newest result. `null` means the member reset the check, so nothing is verified. */
export const getVerifications = () =>
  readDemoState<Record<string, DemoVerification | null>>(VERIFY, {});
export const getUploads = () => readDemoState<Record<string, DemoUpload>>(UPLOADS, {});
/** validationKey → the answers the member sent. */
export const getForms = () =>
  readDemoState<Record<string, { inputs: Record<string, string>; submittedAt: string }>>(FORMS, {});
export const getExplored = () => readDemoState<string[]>(EXPLORED, []);

export function addBooking(b: DemoBooking): void {
  updateDemoState<DemoBooking[]>(BOOKINGS, [], (prev) => [
    ...prev.filter((x) => !(x.kind === b.kind && x.stepId === b.stepId)),
    b,
  ]);
}

export function addEnrollment(e: DemoEnrollment): void {
  updateDemoState<DemoEnrollment[]>(ENROLLMENTS, [], (prev) => [...prev, e]);
}

export function updateEnrollment(id: string, patch: Partial<DemoEnrollment>): void {
  updateDemoState<DemoEnrollment[]>(ENROLLMENTS, [], (prev) =>
    prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  );
}

export function setTick(key: string, ticked: boolean): void {
  updateDemoState<Record<string, boolean>>(TICKS, {}, (prev) => ({ ...prev, [key]: ticked }));
}

export function setVerification(key: string, v: DemoVerification | null): void {
  updateDemoState<Record<string, DemoVerification | null>>(VERIFY, {}, (prev) => ({
    ...prev,
    [key]: v,
  }));
}

export function setUpload(kind: string, u: DemoUpload): void {
  updateDemoState<Record<string, DemoUpload>>(UPLOADS, {}, (prev) => ({ ...prev, [kind]: u }));
}

export function setForm(
  key: string,
  value: { inputs: Record<string, string>; submittedAt: string },
): void {
  updateDemoState<Record<string, { inputs: Record<string, string>; submittedAt: string }>>(
    FORMS,
    {},
    (prev) => ({ ...prev, [key]: value }),
  );
}

export function addExplored(stepId: string): void {
  updateDemoState<string[]>(EXPLORED, [], (prev) =>
    prev.includes(stepId) ? prev : [...prev, stepId],
  );
}

export function resetRoadmapState(): void {
  for (const k of [BOOKINGS, ENROLLMENTS, TICKS, VERIFY, UPLOADS, FORMS, EXPLORED])
    writeDemoState(k, k === TICKS || k === VERIFY || k === UPLOADS || k === FORMS ? {} : []);
}

/** The booking for one call step, if the member made one. */
export function bookingForCall(stepId: string): DemoBooking | undefined {
  return getBookings().find((b) => b.kind === "call" && b.stepId === stepId);
}

/** True once the member has booked the quarterly targeting call. */
export function targetingCallBooked(): boolean {
  return !!bookingForCall(CALL_STEP_IDS.targeting);
}
