// DEMO API area: Success Center: Mentors (mentor directory).
// Owns: the calls that the Mentors page and its booking modal make: a mentor's
// free slots, booking a call, and a message to a mentor. Paths start with
// /api/portal/:locationId/.
//
// Path scheme (see src/demo/runtime/router.ts): paths for lifted Success Center
// code keep `/api`.
//
// A paid call charges the demo wallet (src/demo/state/wallet.ts `chargeWallet`).
// The booking goes in the store (src/demo/sc/home/store.ts), so it shows on the
// Success Center home (Next Appointment card, Booking History) and on the
// Mentors page, and it is still there after a reload.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { getWalletBalance } from "../state/wallet";
import { getBenchMentor } from "../sc/mentors/bench";
import { SALES_ADVISOR } from "../sc/home/people";
import { freeSlots, isFreeSlot } from "../sc/home/slots";
import {
  addActivity,
  addMentorBooking,
  addSentMessage,
} from "../sc/home/store";
import { CONTACT_TIMEZONE, formatSlot } from "../sc/home/time";
import { calendarFor } from "./scHome";

const P = "/api/portal/:locationId";

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: `${P}/mentor-availability`,
    handler: ({ query }) => {
      const mentor = getBenchMentor(query.get("mentorId") ?? "");
      const startMs = Number(query.get("startMs"));
      const endMs = Number(query.get("endMs"));
      if (!mentor || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return demoResponse(400, { error: "mentorId, startMs, endMs required" });
      }
      const timezone = query.get("timezone") || CONTACT_TIMEZONE;
      const calendar = calendarFor(`cal-${mentor.id}`)!;
      return { slots: freeSlots(calendar, startMs, endMs, timezone), price: mentor.price, currency: "USD" };
    },
  },
  {
    method: "POST",
    path: `${P}/book-mentor`,
    handler: ({ body }) => {
      const mentor = getBenchMentor(String(body?.mentorId ?? ""));
      const startTime = String(body?.startTime ?? "");
      const endTime = String(body?.endTime ?? "");
      if (!mentor || !startTime || !endTime) {
        return demoResponse(400, { error: "mentorId, startTime, endTime required" });
      }
      if (!isFreeSlot(calendarFor(`cal-${mentor.id}`)!, startTime)) {
        return demoResponse(409, { error: "That time was just taken. Pick another time." });
      }
      // DEMO: every booking is a free call with the sales advisor, who sets up
      // the mentor (feedback, 25 Oct 2026). Nothing comes out of the wallet.
      const price = 0;
      const appt = addMentorBooking({ mentor, startTime, endTime, paid: price });
      addActivity({
        kind: "booking",
        title: `You booked a call with ${SALES_ADVISOR.name}`,
        detail: `${formatSlot(startTime)} · free · he sets up your call with ${mentor.name}`,
        to: "/",
      });
      return {
        ok: true,
        appointmentId: appt.id,
        bookingId: `booking-${appt.id}`,
        balance: getWalletBalance(),
        currency: "USD",
        startTime,
        endTime,
      };
    },
  },
  {
    method: "POST",
    path: `${P}/mentor-message`,
    handler: ({ body }) => {
      const mentor = getBenchMentor(String(body?.mentorId ?? ""));
      const message = String(body?.message ?? "").trim();
      if (!mentor) return demoResponse(404, { error: "Mentor not found" });
      if (!message) return demoResponse(400, { error: "Message is required" });
      if (message.length > 2000) return demoResponse(400, { error: "Message too long (max 2000 characters)" });
      addSentMessage(mentor.id, message);
      addActivity({
        kind: "message",
        title: `You messaged ${mentor.name}`,
        detail: message.length > 90 ? `${message.slice(0, 90)}…` : message,
        to: "/find-a-mentor",
      });
      return { ok: true };
    },
  },
];
