// DEMO API area: Success Center: Home.
// Owns: the calls that the lifted home cards make (wallet card, next appointment
// card, reschedule, action plan, contact photo and logo, onboarding and strategy
// call booking, the mentor picker). Paths start with /api/portal/:locationId/.
//
// Path scheme (see src/demo/runtime/router.ts): paths for lifted Success Center
// code keep `/api`.
//
// Shared with other areas: the wallet balance and the booking-modal reads
// (`wallet-balance`, `contact-timezone`, `checkout-terms`, `billing-address`).
// The router lets the area registered last win on the same path, and this area
// is registered after the Roadmap, Tasks and My Business areas. The answers
// here are the plain ones: money from src/demo/state/wallet.ts, no terms box,
// no address form, Eastern time.
//
// Keep a visitor's changes in the store (src/demo/sc/home/store.ts).

import { demoResponse, type DemoRequestContext, type DemoRouteDef } from "../runtime/router";
import { getWalletBalance, topUpWallet } from "../state/wallet";
import { BENCH, getBenchMentor, toPortalMentor } from "../sc/mentors/bench";
import { MENTOR, PERSONA } from "../story/persona";
import { decodeDataUrl, MAX_STORED_BYTES, readAsDataUrl, shrinkImage, simplePdf } from "../sc/home/files";
import { freeSlots, isFreeSlot, TEAM_CALENDAR, type SlotCalendar } from "../sc/home/slots";
import {
  addActivity,
  addTeamBooking,
  assignMentor,
  findAppointment,
  freeSessionsLeft,
  getPlaybookState,
  mentorIdFromCalendar,
  rescheduleAppointment,
  setProfileImage,
  setStepChecked,
  setStepUpload,
  TEAM_CALENDAR_ID,
} from "../sc/home/store";
import { CONTACT_TIMEZONE, formatSlot } from "../sc/home/time";
import { getActionPlans, PLAN_ASSIGNMENT_ID, planSeedStatuses } from "../sc/home/actionPlan";

const P = "/api/portal/:locationId";

/** The slot calendar for a calendar id: a mentor's, or the program team's. */
export function calendarFor(calendarId: string): SlotCalendar | null {
  if (calendarId === TEAM_CALENDAR_ID) return TEAM_CALENDAR;
  const mentorId = mentorIdFromCalendar(calendarId);
  const mentor = mentorId ? getBenchMentor(mentorId) : undefined;
  return mentor ? { id: mentor.id, hours: mentor.hours, days: mentor.days, busyShare: mentor.busyShare } : null;
}

function range(query: URLSearchParams) {
  const startMs = Number(query.get("startMs"));
  const endMs = Number(query.get("endMs"));
  const timezone = query.get("timezone") || CONTACT_TIMEZONE;
  return { startMs, endMs, timezone, ok: Number.isFinite(startMs) && Number.isFinite(endMs) };
}

export const routes: DemoRouteDef[] = [
  // ── Reads that the booking modals and cards make when they open ──────────
  // (wallet-balance, contact-timezone, checkout-terms and billing-address are
  // answered once for every page in scShared.ts)
  { method: "GET", path: `${P}/free-sessions`, handler: () => ({ left: freeSessionsLeft() }) },

  // ── Wallet ───────────────────────────────────────────────────────────────
  {
    // The Add funds dialog (src/demo/sc/home/addFunds.tsx).
    method: "POST",
    path: `${P}/wallet-topup`,
    handler: ({ body }) => {
      const amount = Number(body?.amount);
      if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
        return demoResponse(400, { error: "Choose an amount between $1 and $5,000." });
      }
      topUpWallet(amount);
      addActivity({
        kind: "wallet",
        title: `You added $${amount.toLocaleString("en-US")} to your wallet`,
        detail: `Your balance is now $${getWalletBalance().toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
        to: "/wallet",
      });
      return { ok: true, balance: getWalletBalance(), currency: "USD" };
    },
  },
  { method: "POST", path: `${P}/collect-owed`, handler: () => ({ owed: 0, collected: 0 }) },

  // ── The mentor picker (shown when no mentor is assigned) ─────────────────
  { method: "GET", path: `${P}/mentors`, handler: () => ({ mentors: BENCH.map(toPortalMentor) }) },
  {
    method: "POST",
    path: `${P}/assign-mentor`,
    handler: ({ body }) => {
      const mentor = getBenchMentor(String(body?.mentorId ?? ""));
      if (!mentor) return demoResponse(404, { error: "Mentor not found" });
      assignMentor(mentor.id);
      return { ok: true, mentor: { id: mentor.id, name: mentor.name, title: mentor.title, avatarUrl: mentor.avatarUrl } };
    },
  },

  // ── Next Appointment card: reschedule ────────────────────────────────────
  {
    method: "GET",
    path: `${P}/calendar-availability`,
    handler: ({ query }) => {
      const { startMs, endMs, timezone, ok } = range(query);
      const calendar = calendarFor(query.get("calendarId") ?? "");
      if (!ok) return demoResponse(400, { error: "calendarId, startMs, endMs required" });
      if (!calendar) return demoResponse(403, { error: "Unknown calendar" });
      return { slots: freeSlots(calendar, startMs, endMs, timezone, query.get("appointmentId") ?? undefined) };
    },
  },
  {
    method: "POST",
    path: `${P}/reschedule-appointment`,
    handler: ({ body }) => {
      const id = String(body?.appointmentId ?? "");
      const startTime = String(body?.startTime ?? "");
      const endTime = String(body?.endTime ?? "");
      const appt = findAppointment(id);
      if (!appt) return demoResponse(404, { error: "This appointment no longer exists." });
      const calendar = calendarFor(appt.calendarId ?? "");
      if (calendar && !isFreeSlot(calendar, startTime, id)) {
        return demoResponse(409, { error: "That time was just taken. Pick another time." });
      }
      rescheduleAppointment(id, startTime, endTime);
      addActivity({
        kind: "reschedule",
        title: `You moved ${appt.title ?? "your call"}`,
        detail: `New time: ${formatSlot(startTime)}.`,
        to: "/",
      });
      return { ok: true };
    },
  },

  // ── Onboarding call and strategy call booking ────────────────────────────
  {
    method: "GET",
    path: `${P}/onboarding-availability`,
    handler: ({ query }) => {
      const { startMs, endMs, timezone, ok } = range(query);
      if (!ok) return demoResponse(400, { error: "startMs and endMs required" });
      return { slots: freeSlots(TEAM_CALENDAR, startMs, endMs, timezone) };
    },
  },
  {
    method: "POST",
    path: `${P}/book-onboarding`,
    handler: ({ body }) => {
      const startTime = String(body?.startTime ?? "");
      const endTime = String(body?.endTime ?? "");
      if (!startTime || !endTime) return demoResponse(400, { error: "startTime, endTime required" });
      if (!isFreeSlot(TEAM_CALENDAR, startTime)) return demoResponse(409, { error: "That time was just taken. Pick another time." });
      const appt = addTeamBooking("Onboarding call", startTime, endTime);
      addActivity({ kind: "booking", title: "You booked your onboarding call", detail: formatSlot(startTime), to: "/" });
      return { ok: true, appointmentId: appt.id };
    },
  },
  {
    method: "GET",
    path: `${P}/strategy-call-mentors`,
    handler: () => ({
      mentors: [BENCH[0]].map((m) => ({
        id: m.id,
        name: m.name,
        title: m.title,
        bio: m.bio,
        avatarUrl: m.avatarUrl,
        ghlUserId: null,
      })),
      bookingUseAssignedMentor: true,
      assignedMentorId: BENCH[0].id,
    }),
  },
  {
    method: "GET",
    path: `${P}/strategy-call-availability`,
    handler: ({ query }) => {
      const { startMs, endMs, timezone, ok } = range(query);
      if (!ok) return demoResponse(400, { error: "startMs and endMs required" });
      return { slots: freeSlots(TEAM_CALENDAR, startMs, endMs, timezone) };
    },
  },
  {
    method: "POST",
    path: `${P}/book-strategy-call`,
    handler: ({ body }) => {
      const startTime = String(body?.startTime ?? "");
      const endTime = String(body?.endTime ?? "");
      if (!startTime || !endTime) return demoResponse(400, { error: "startTime, endTime required" });
      if (!isFreeSlot(TEAM_CALENDAR, startTime)) return demoResponse(409, { error: "That time was just taken. Pick another time." });
      const appt = addTeamBooking(`Strategy call with ${MENTOR.name}`, startTime, endTime);
      addActivity({ kind: "booking", title: "You booked your strategy call", detail: formatSlot(startTime), to: "/" });
      return { ok: true, appointmentId: appt.id };
    },
  },

  // ── Contact photo and company logo ───────────────────────────────────────

  // ── Action plan ──────────────────────────────────────────────────────────
  {
    method: "POST",
    path: `${P}/playbooks`,
    handler: ({ body }) => {
      const assignmentId = String(body?.assignmentId ?? "");
      const stepId = String(body?.stepId ?? "");
      const plan = getActionPlans().find((p) => p.assignmentId === assignmentId);
      if (!plan) return demoResponse(404, { error: "Not found" });
      if (!plan.steps.some((s) => s.id === stepId)) return demoResponse(400, { error: "step not in this playbook" });
      const seed = assignmentId === PLAN_ASSIGNMENT_ID ? planSeedStatuses() : {};
      const stepStatuses = setStepChecked(assignmentId, stepId, Boolean(body?.checked), seed);
      return { stepStatuses, currentStepIndex: 0, subStepCompleted: false };
    },
  },
  {
    method: "POST",
    path: `${P}/playbook-upload`,
    handler: async ({ body }) => {
      const form = body as FormData | null;
      const assignmentId = String(form?.get?.("assignmentId") ?? "");
      const stepId = String(form?.get?.("stepId") ?? "");
      const file = form?.get?.("file");
      if (!assignmentId || !stepId) return demoResponse(400, { error: "assignmentId and stepId are required" });
      if (!(file instanceof File)) return demoResponse(400, { error: "file missing" });
      const plan = getActionPlans().find((p) => p.assignmentId === assignmentId);
      const step = plan?.steps.find((s) => s.id === stepId);
      if (!plan || !step) return demoResponse(404, { error: "Step not found on this plan" });
      if (!step.allowMemberUpload) return demoResponse(403, { error: "Uploads are not enabled for this step" });
      const name = (file.name || "upload.pdf").slice(0, 200);
      const dataUrl = file.size <= MAX_STORED_BYTES ? await readAsDataUrl(file) : null;
      const uploadedAt = new Date().toISOString();
      setStepUpload(assignmentId, stepId, { name, uploadedAt, dataUrl, type: file.type || "application/pdf" });
      const url = `/api/portal/${PERSONA.locationId}/playbook-file/${assignmentId}/${stepId}`;
      const stepUploads = Object.fromEntries(
        Object.entries(getPlaybookState().uploads[assignmentId] ?? {}).map(([id, u]) => [
          id,
          { url, name: u.name, uploadedAt: u.uploadedAt },
        ]),
      );
      return { ok: true, url, name, stepUploads };
    },
  },
  {
    // The "Your upload" link. The link guard turns a click on it into a file download.
    method: "GET",
    path: `${P}/playbook-file/:assignmentId/:stepId`,
    handler: ({ params }) => {
      const upload = getPlaybookState().uploads[params.assignmentId]?.[params.stepId];
      if (!upload) return demoResponse(404, { error: "File not found" });
      const decoded = upload.dataUrl ? decodeDataUrl(upload.dataUrl) : null;
      const bytes = decoded?.bytes ?? simplePdf([upload.name, "Uploaded to your Success Center.", "The sample demo keeps a small copy only."]);
      const type = decoded?.type ?? "application/pdf";
      return new Response(bytes as BlobPart, {
        status: 200,
        headers: {
          "Content-Type": type,
          "Content-Disposition": `attachment; filename="${upload.name.replace(/"/g, "")}"`,
        },
      });
    },
  },
];


/** Contact photo and company logo uploads. Dispatched from scShared.ts. */
export const homeUpload = async ({ body }: DemoRequestContext) => {
      const form = body as FormData | null;
      const type = form?.get?.("type");
      const file = form?.get?.("file");
      if (type !== "contact" && type !== "logo") return demoResponse(400, { error: "That file type is not used on this page." });
      if (!(file instanceof Blob)) return demoResponse(400, { error: "file missing" });
      if (!file.type.startsWith("image/")) return demoResponse(400, { error: "Choose a picture (PNG, JPG, WebP or GIF)." });
      const url = await shrinkImage(file);
      setProfileImage(type, url);
      return { url };
    };
