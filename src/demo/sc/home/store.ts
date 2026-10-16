// DEMO: what the visitor changes on the Success Center home and the Mentors page.
//
// Everything lives in the demo store (src/demo/runtime/store.ts), so it is still
// there after a reload and on every other page. Money does not live here: a
// charge goes through `chargeWallet` in src/demo/state/wallet.ts.
//
// Store keys, all under `scHome.`:
//   appointments   the member's calls: sample history plus every booking made in the demo
//   freeSessions   complimentary mentor sessions left (the plan gives none in the demo)
//   mentorId       the assigned mentor
//   messages       messages sent to a mentor
//   playbooks      ticked action-plan steps and uploaded files
//   profile        a new contact photo or company logo

import { readDemoState, updateDemoState, writeDemoState } from "@/demo/runtime/store";
import { getRoadmapSummary } from "@/demo/sc/roadmap/summary";
import { MENTOR } from "@/demo/story/persona";
import { SARAH_ID, getBenchMentor, type BenchMentor } from "@/demo/sc/mentors/bench";
import { chargeWallet } from "@/demo/state/wallet";
import { easternInstant } from "./time";
import type { GHLAppointment } from "./types";
import { PROGRAM_SPECIALIST } from "./people";

// ── Appointments ───────────────────────────────────────────────────────────

const APPOINTMENTS = "scHome.appointments";
const ACTIVITY = "scHome.activity";

/** The calendar id of a mentor. The availability handler reads the mentor back from it. */
export function calendarIdFor(mentorId: string): string {
  return `cal-${mentorId}`;
}

export function mentorIdFromCalendar(calendarId: string): string | null {
  return calendarId.startsWith("cal-mentor-") ? calendarId.slice(4) : null;
}

/** The calendar of the program team (onboarding and strategy calls). */
export const TEAM_CALENDAR_ID = "cal-program-team";

const MEETING_PLACE = "Video call · link sent by email";

function slot(daysFromNow: number, hour: number, minute: number, minutes: number) {
  const start = easternInstant(daysFromNow, hour, minute);
  return {
    startTime: start.toISOString(),
    endTime: new Date(start.getTime() + minutes * 60_000).toISOString(),
  };
}

function initialAppointments(): GHLAppointment[] {
  const list: GHLAppointment[] = [
    {
      id: "appt-onboarding",
      title: "Onboarding call",
      ...slot(-98, 11, 0, 45),
      calendarId: TEAM_CALENDAR_ID,
      calendarName: "Onboarding",
      assignedUserName: PROGRAM_SPECIALIST.name,
      appointmentStatus: "showed",
      address: MEETING_PLACE,
    },
    {
      id: "appt-positioning",
      title: `Positioning call with ${MENTOR.name}`,
      ...slot(-24, 14, 0, 30),
      calendarId: calendarIdFor(SARAH_ID),
      calendarName: "Mentor consultation",
      assignedUserName: MENTOR.name,
      appointmentStatus: "showed",
      address: MEETING_PLACE,
    },
  ];
  // The roadmap's next action decides whether the targeting call is booked yet.
  // If the Roadmap says "Book your targeting call", nothing is booked, and the
  // visitor can book it. Any other next action means the call is on the calendar.
  const next = getRoadmapSummary().nextAction.label.toLowerCase();
  const stillToBook = next.includes("book") && next.includes("call");
  if (!stillToBook) {
    list.push({
      id: "appt-targeting",
      title: `Quarterly targeting call with ${MENTOR.name}`,
      ...slot(3, 10, 30, 30),
      calendarId: calendarIdFor(SARAH_ID),
      calendarName: "Mentor consultation",
      assignedUserName: MENTOR.name,
      appointmentStatus: "confirmed",
      address: MEETING_PLACE,
    });
  }
  return list;
}

export function getAppointments(): GHLAppointment[] {
  return readDemoState<GHLAppointment[]>(APPOINTMENTS, initialAppointments);
}

export function findAppointment(id: string): GHLAppointment | undefined {
  return getAppointments().find((a) => a.id === id);
}

const INACTIVE = new Set(["cancelled", "canceled", "noshow", "no-show", "invalid"]);

/** Start times (ms) that the member already has a call at, so no other slot opens there. */
export function takenStarts(exceptId?: string): Set<number> {
  return new Set(
    getAppointments()
      .filter((a) => a.id !== exceptId && !INACTIVE.has((a.appointmentStatus ?? "").toLowerCase()))
      .map((a) => new Date(a.startTime).getTime()),
  );
}

export interface NewBooking {
  mentor: BenchMentor;
  startTime: string;
  endTime: string;
  /** What the call cost. 0 for a complimentary session. */
  paid: number;
  title?: string;
}

/** Add a booked mentor call. Returns the new appointment. */
export function addMentorBooking(b: NewBooking): GHLAppointment {
  const appt: GHLAppointment = {
    id: `appt-${Date.now().toString(36)}`,
    title: b.title ?? `Consultation with ${b.mentor.name}`,
    startTime: b.startTime,
    endTime: b.endTime,
    calendarId: calendarIdFor(b.mentor.id),
    calendarName: b.mentor.calendarName,
    assignedUserName: b.mentor.name,
    appointmentStatus: "confirmed",
    address: MEETING_PLACE,
    ...(b.paid > 0 ? { amount: b.paid, currency: "USD" } : {}),
  };
  updateDemoState<GHLAppointment[]>(APPOINTMENTS, initialAppointments, (prev) => [...prev, appt]);
  return appt;
}

/** Add a call with the program team (onboarding or strategy call). */
export function addTeamBooking(title: string, startTime: string, endTime: string): GHLAppointment {
  const appt: GHLAppointment = {
    id: `appt-${Date.now().toString(36)}`,
    title,
    startTime,
    endTime,
    calendarId: TEAM_CALENDAR_ID,
    calendarName: title.startsWith("Onboarding") ? "Onboarding" : "Strategy call",
    assignedUserName: PROGRAM_SPECIALIST.name,
    appointmentStatus: "confirmed",
    address: MEETING_PLACE,
  };
  updateDemoState<GHLAppointment[]>(APPOINTMENTS, initialAppointments, (prev) => [...prev, appt]);
  return appt;
}

export function rescheduleAppointment(id: string, startTime: string, endTime: string): GHLAppointment | null {
  let moved: GHLAppointment | null = null;
  updateDemoState<GHLAppointment[]>(APPOINTMENTS, initialAppointments, (prev) =>
    prev.map((a) => {
      if (a.id !== id) return a;
      moved = { ...a, startTime, endTime, appointmentStatus: "confirmed" };
      return moved;
    }),
  );
  return moved;
}

/** The next call that has not started, and the full list, for the home cards. */
export function appointmentsForHome(): { featured: GHLAppointment | null; all: GHLAppointment[] } {
  const all = [...getAppointments()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const now = Date.now();
  const upcoming = all.filter((a) => new Date(a.startTime).getTime() >= now && !INACTIVE.has((a.appointmentStatus ?? "").toLowerCase()));
  const past = all.filter((a) => new Date(a.startTime).getTime() < now).reverse();
  return { featured: upcoming[0] ?? past[0] ?? null, all };
}

// ── Free sessions and the assigned mentor ──────────────────────────────────

const FREE = "scHome.freeSessions";
const MENTOR_KEY = "scHome.mentorId";

export function freeSessionsLeft(): number {
  return readDemoState<number>(FREE, 0);
}

export function consumeFreeSession(): void {
  updateDemoState<number>(FREE, 0, (n) => Math.max(0, n - 1));
}

export function assignedMentorId(): string {
  return readDemoState<string>(MENTOR_KEY, SARAH_ID);
}

export function assignMentor(id: string): void {
  writeDemoState(MENTOR_KEY, id);
}

// ── Messages to a mentor ───────────────────────────────────────────────────

export interface SentMessage {
  id: string;
  mentorId: string;
  mentorName: string;
  message: string;
  at: string;
}

const MESSAGES = "scHome.messages";

export function getSentMessages(): SentMessage[] {
  return readDemoState<SentMessage[]>(MESSAGES, []);
}

export function addSentMessage(mentorId: string, message: string): SentMessage {
  const mentor = getBenchMentor(mentorId);
  const entry: SentMessage = {
    id: `msg-${Date.now().toString(36)}`,
    mentorId,
    mentorName: mentor?.name ?? "your mentor",
    message,
    at: new Date().toISOString(),
  };
  updateDemoState<SentMessage[]>(MESSAGES, [], (prev) => [...prev, entry]);
  return entry;
}

// ── Action plan ────────────────────────────────────────────────────────────

export interface StoredUpload {
  name: string;
  uploadedAt: string;
  /** The file as a data URL, so it can be downloaded again after a reload. */
  dataUrl: string | null;
  type: string;
}

interface PlaybookState {
  statuses: Record<string, Record<string, string>>;
  uploads: Record<string, Record<string, StoredUpload>>;
}

const PLAYBOOKS = "scHome.playbooks";

export function getPlaybookState(): PlaybookState {
  return readDemoState<PlaybookState>(PLAYBOOKS, { statuses: {}, uploads: {} });
}

export function setStepChecked(assignmentId: string, stepId: string, checked: boolean, seed: Record<string, string>): Record<string, string> {
  let result = seed;
  updateDemoState<PlaybookState>(PLAYBOOKS, { statuses: {}, uploads: {} }, (prev) => {
    const current = { ...(prev.statuses[assignmentId] ?? seed) };
    if (checked) current[stepId] = "completed";
    else delete current[stepId];
    result = current;
    return { ...prev, statuses: { ...prev.statuses, [assignmentId]: current } };
  });
  return result;
}

export function setStepUpload(assignmentId: string, stepId: string, upload: StoredUpload): Record<string, StoredUpload> {
  let result: Record<string, StoredUpload> = {};
  updateDemoState<PlaybookState>(PLAYBOOKS, { statuses: {}, uploads: {} }, (prev) => {
    const current = { ...(prev.uploads[assignmentId] ?? {}), [stepId]: upload };
    result = current;
    return { ...prev, uploads: { ...prev.uploads, [assignmentId]: current } };
  });
  return result;
}

// ── Contact photo and company logo ─────────────────────────────────────────

export interface ProfileImages {
  contactPhoto: string | null;
  companyLogo: string | null;
}

const PROFILE = "scHome.profile";

export function getProfileImages(): ProfileImages {
  return readDemoState<ProfileImages>(PROFILE, { contactPhoto: null, companyLogo: null });
}

export function setProfileImage(kind: "contact" | "logo", url: string): void {
  updateDemoState<ProfileImages>(PROFILE, { contactPhoto: null, companyLogo: null }, (prev) =>
    kind === "contact" ? { ...prev, contactPhoto: url } : { ...prev, companyLogo: url },
  );
}

// ── The names of the stores, for the page to listen to ────────────────────

export const HOME_STATE_KEYS = [
  APPOINTMENTS,
  FREE,
  MENTOR_KEY,
  MESSAGES,
  PLAYBOOKS,
  PROFILE,
  ACTIVITY,
  "wallet.entries",
  "mentorReviews",
] as const;

/** Charge the wallet for a paid mentor call. */
export function chargeForCall(mentor: BenchMentor, price: number): void {
  chargeWallet(`Mentor call — ${mentor.name}`, price);
}


// ── Activity the visitor causes ────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  kind: "booking" | "message" | "wallet" | "reschedule";
  title: string;
  detail: string;
  at: string;
  to: string;
}

export function getActivity(): ActivityEntry[] {
  return readDemoState<ActivityEntry[]>(ACTIVITY, []);
}

export function addActivity(entry: Omit<ActivityEntry, "id" | "at">): void {
  updateDemoState<ActivityEntry[]>(ACTIVITY, [], (prev) => [
    ...prev,
    { ...entry, id: `act-${Date.now().toString(36)}-${prev.length}`, at: new Date().toISOString() },
  ]);
}

// ── For other pages ────────────────────────────────────────────────────────

/**
 * The next mentor call that is on the member's calendar, or null. The Roadmap and
 * Tasks pages can read it, so "Book your targeting call" goes away once a call is booked.
 */
export function upcomingMentorCall(): GHLAppointment | null {
  const now = Date.now();
  return (
    getAppointments()
      .filter(
        (a) =>
          mentorIdFromCalendar(a.calendarId ?? "") !== null &&
          !INACTIVE.has((a.appointmentStatus ?? "").toLowerCase()) &&
          new Date(a.startTime).getTime() >= now,
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null
  );
}
