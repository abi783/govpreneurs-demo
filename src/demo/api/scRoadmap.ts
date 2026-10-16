// DEMO API area: Success Center: Roadmap.
// Owns: the /api/portal/:loc/... calls that the lifted Roadmap v3 code and the
// booking modals make: wallet balance, time zone, booking (availability, book a
// call, book a kickoff call), buying a service (coupon check, enroll, receipts),
// member-run checks (verify, upload, reset, track) and checklist ticks.
//
// Everything a visitor does is kept in the demo store (src/demo/sc/roadmap/state.ts)
// and the wallet (src/demo/state/wallet.ts), so it is still there after a reload and
// shows on Home, Tasks and the wallet page.

import { demoResponse, type DemoRequestContext, type DemoRouteDef } from "../runtime/router";
import { CALL_STEP_IDS } from "@sc/lib/callStepIds";
import { chargeWallet, getWalletBalance } from "../state/wallet";
import { isoDaysFromNow } from "../story/clock";
import { MENTOR, PERSONA } from "../story/persona";
import { freeSlots } from "../sc/roadmap/slots";
import { runVerification } from "../sc/roadmap/verifyData";
import {
  CALL_PRICE,
  MEMBER_TIME_ZONE,
  receiptNumber,
  serviceBySection,
  serviceByStep,
  serviceByTitle,
  type VerifyKey,
} from "../sc/roadmap/model";
import {
  addBooking,
  addEnrollment,
  addExplored,
  getBookings,
  getEnrollments,
  setForm,
  setTick,
  setUpload,
  setVerification,
  updateEnrollment,
  type DemoUpload,
} from "../sc/roadmap/state";

const P = "/api/portal/:loc";

const MENTOR_ID = "mentor-sarah-mitchell";
const VERIFY_KEYS: readonly VerifyKey[] = ["llc", "sam", "sbs", "capability", "sled", "cmmc"];
const COUPONS: Record<string, { name: string; percent: number }> = {
  DEMO10: { name: "Sample 10% off", percent: 10 },
};

const money = (n: number) => Math.round(n * 100) / 100;
const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/** The text of a call step, for the wallet history. */
function callLabel(stepId: string): string {
  if (stepId === CALL_STEP_IDS.targeting) return "Quarterly Targeting Call";
  if (stepId === CALL_STEP_IDS.positioning) return "Positioning Call";
  if (stepId === CALL_STEP_IDS.digitalCompliance) return "Digital Compliance Call";
  return "Mentor call";
}

function walletBody() {
  const balance = getWalletBalance();
  return { balance, paidBalance: balance, promotionalCredit: 0, currency: "USD" };
}

function slotsFor(ctx: DemoRequestContext, seed: string) {
  const startMs = Number(ctx.query.get("startMs"));
  const endMs = Number(ctx.query.get("endMs"));
  if (!startMs || !endMs) return demoResponse(400, { error: "startMs and endMs are required" });
  const taken = getBookings().map((b) => b.startTime);
  return { slots: freeSlots({ startMs, endMs, timezone: ctx.query.get("timezone"), seed, taken }) };
}

/** A kept file: a blob link while the page lives. A reload drops it, and the page then shows no preview link. */
const liveBlobs = new Set<string>();
export function isLiveUpload(url: string | null | undefined): boolean {
  return !!url && (!url.startsWith("blob:") || liveBlobs.has(url));
}

function textFile(name: string, body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` },
  });
}

export const routes: DemoRouteDef[] = [
  // ── Small reads that every checkout and calendar makes ──────────────────────
  { method: "GET", path: `${P}/wallet-balance`, handler: () => walletBody() },
  { method: "GET", path: `${P}/contact-timezone`, handler: () => ({ timezone: MEMBER_TIME_ZONE }) },
  { method: "GET", path: `${P}/checkout-terms`, handler: () => ({ showTerms: false }) },
  { method: "GET", path: `${P}/billing-address`, handler: () => ({ needsAddress: false }) },
  { method: "POST", path: `${P}/track`, handler: () => ({ ok: true }) },

  // ── Booking ────────────────────────────────────────────────────────────────
  {
    method: "GET",
    path: `${P}/booking-mentors`,
    handler: () => ({
      mentors: [
        { id: MENTOR_ID, name: MENTOR.name, title: MENTOR.title, bio: MENTOR.bio, avatarUrl: null, ghlUserId: "ghl-sarah-mitchell" },
      ],
      bookingUseAssignedMentor: true,
      assignedMentorId: MENTOR_ID,
      freeSessionsLeft: 0,
    }),
  },
  {
    method: "GET",
    path: `${P}/booking-availability`,
    handler: (ctx) => slotsFor(ctx, ctx.query.get("stepId") ?? "call"),
  },
  {
    method: "GET",
    path: `${P}/delivery-availability`,
    handler: (ctx) => slotsFor(ctx, ctx.query.get("sectionId") ?? "delivery"),
  },
  {
    method: "POST",
    path: `${P}/book-call`,
    handler: (ctx) => {
      const b = ctx.body as { stepId?: string; startTime?: string; endTime?: string } | null;
      const known = Object.values(CALL_STEP_IDS) as string[];
      if (!b?.stepId || !b.startTime || !b.endTime) {
        return demoResponse(400, { error: "stepId, startTime, endTime required" });
      }
      if (!known.includes(b.stepId)) return demoResponse(400, { error: "Step has no booking calendar" });

      const mine = getBookings().filter((x) => x.kind === "call" && x.stepId === b.stepId);
      const sameSlot = mine.some((x) => new Date(x.startTime).getTime() === new Date(b.startTime!).getTime());
      // Moving a call she already booked costs nothing more.
      const pays = mine.length === 0 && !sameSlot ? CALL_PRICE : 0;
      if (pays > 0) {
        const balance = getWalletBalance();
        if (balance < pays) {
          return demoResponse(402, { error: "Insufficient wallet balance", balance, total: pays, currency: "USD" });
        }
        chargeWallet(`Mentor call — ${callLabel(b.stepId)} with ${MENTOR.name}`, pays);
      }
      const booking = {
        id: newId("booking"),
        stepId: b.stepId,
        kind: "call" as const,
        startTime: new Date(b.startTime).toISOString(),
        endTime: new Date(b.endTime).toISOString(),
        paid: pays,
        createdAt: new Date().toISOString(),
      };
      if (!sameSlot) addBooking(booking);
      return {
        ok: true,
        appointmentId: booking.id,
        bookingId: booking.id,
        balance: getWalletBalance(),
        currency: "USD",
        startTime: booking.startTime,
        endTime: booking.endTime,
        usedFreeSession: false,
        freeSessionsLeft: 0,
      };
    },
  },
  {
    method: "POST",
    path: `${P}/book-delivery`,
    handler: (ctx) => {
      const b = ctx.body as { sectionId?: string; serviceTitle?: string; startTime?: string; endTime?: string } | null;
      if (!b?.sectionId || !b.startTime || !b.endTime) {
        return demoResponse(400, { error: "sectionId, startTime, endTime required" });
      }
      const svc = serviceBySection(b.sectionId);
      const enrolled = getEnrollments().filter((e) => e.sectionId === b.sectionId);
      const latest = enrolled[enrolled.length - 1];
      if (!svc || !latest) return demoResponse(400, { error: "Buy this service first, then book your call." });
      updateEnrollment(latest.id, { deliveryAppointmentAt: new Date(b.startTime).toISOString() });
      addBooking({
        id: newId("booking"),
        stepId: b.sectionId,
        kind: "delivery",
        startTime: new Date(b.startTime).toISOString(),
        endTime: new Date(b.endTime).toISOString(),
        paid: 0,
        createdAt: new Date().toISOString(),
      });
      return { ok: true, appointmentId: newId("appt") };
    },
  },

  // ── Buying a service ──────────────────────────────────────────────────────
  {
    method: "POST",
    path: `${P}/coupon-check`,
    handler: (ctx) => {
      const code = String((ctx.body as { code?: string } | null)?.code ?? "").trim().toUpperCase();
      if (!code) return demoResponse(400, { valid: false, reason: "Enter a coupon code." });
      const coupon = COUPONS[code];
      if (!coupon) return { valid: false, reason: "That code is not valid." };
      return {
        valid: true,
        code,
        name: coupon.name,
        discountType: "percent",
        discountValue: coupon.percent,
        expiresAt: isoDaysFromNow(30),
        usesLeft: 5,
      };
    },
  },
  {
    method: "POST",
    path: `${P}/enroll`,
    handler: (ctx) => {
      const b = ctx.body as {
        stepId?: string;
        serviceTitles?: string[];
        priceOptionIds?: Record<string, string>;
        couponCode?: string;
      } | null;
      if (!b?.stepId || !Array.isArray(b.serviceTitles) || b.serviceTitles.length === 0) {
        return demoResponse(400, { error: "stepId and serviceTitles[] required" });
      }
      const title = b.serviceTitles[0]!;
      const svc = serviceByTitle(title) ?? serviceByStep(b.stepId);
      if (!svc) return demoResponse(400, { error: "No matching services" });

      const owned = getEnrollments().filter((e) => e.slug === svc.slug);
      if (owned.length > 0 && svc.slug !== "prime-contractor-registration") {
        return demoResponse(409, { error: "You already own this service." });
      }
      if (owned.length > 0 && svc.slug === "prime-contractor-registration") {
        return demoResponse(409, { error: "Our team is still working on your newest registration." });
      }

      const optionId = b.priceOptionIds?.[title];
      const option = svc.options?.find((o) => o.id === optionId) ?? svc.options?.[0];
      const list = Number(String((option ?? svc).price).replace(/[^0-9.]/g, "")) || 0;
      let discount = 0;
      let couponCode: string | null = null;
      if (b.couponCode) {
        const coupon = COUPONS[String(b.couponCode).trim().toUpperCase()];
        if (!coupon) return demoResponse(400, { error: "That code is not valid.", couponInvalid: true });
        discount = money(list * (coupon.percent / 100));
        couponCode = String(b.couponCode).trim().toUpperCase();
      }
      const total = money(list - discount);
      const balance = getWalletBalance();
      if (balance < total) {
        return demoResponse(402, { error: "Insufficient wallet balance", balance, total, currency: "USD" });
      }
      if (total > 0) chargeWallet(svc.title, total);
      const id = newId("enr");
      addEnrollment({
        id,
        slug: svc.slug,
        serviceTitle: svc.title,
        sectionId: svc.sectionId,
        stepId: svc.stepId,
        amount: total,
        couponCode,
        enrolledAt: new Date().toISOString(),
        deliveryAppointmentAt: null,
      });
      return {
        ok: true,
        charged: total,
        discount,
        couponCode,
        chargeStatus: "charged",
        balance: getWalletBalance(),
        currency: "USD",
        enrolledTitles: [svc.title],
        enrollmentId: id,
      };
    },
  },
  {
    method: "GET",
    path: `${P}/purchases/:enrollmentId/receipt`,
    handler: (ctx) => {
      const e = getEnrollments().find((x) => x.id === ctx.params.enrollmentId);
      if (!e) return { receipt: { state: "unavailable" } };
      return {
        receipt: {
          state: "ready",
          number: receiptNumber(e),
          url: `/api/portal/${PERSONA.locationId}/receipts/${encodeURIComponent(e.id)}`,
        },
      };
    },
  },
  {
    method: "GET",
    path: `${P}/receipts/:id`,
    handler: (ctx) => {
      const e = getEnrollments().find((x) => x.id === ctx.params.id);
      if (!e) return demoResponse(404, { error: "Receipt not found" });
      const lines = [
        "GovPreneurs",
        `Receipt ${receiptNumber(e)}`,
        "",
        `Billed to: ${PERSONA.businessName}`,
        `Date: ${new Date(e.enrolledAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        "",
        `${e.serviceTitle}${e.couponCode ? ` (coupon ${e.couponCode})` : ""}`,
        `Paid from your wallet: $${e.amount.toFixed(2)}`,
        "",
        "This is a sample receipt from the GovPreneurs demo.",
      ];
      return textFile(`receipt-${receiptNumber(e)}.txt`, lines.join("\n"));
    },
  },

  // ── Member-run checks ─────────────────────────────────────────────────────
  {
    method: "POST",
    path: `${P}/upload`,
    handler: (ctx) => {
      const form = ctx.body as FormData | null;
      const file = form instanceof FormData ? form.get("file") : null;
      const type = form instanceof FormData ? String(form.get("type") ?? "capability") : "capability";
      if (!(file instanceof File)) return demoResponse(400, { error: "Choose a file first." });
      const url = URL.createObjectURL(file);
      liveBlobs.add(url);
      const kind = type === "articles" ? "articles" : type === "cmmc" ? "cmmc" : "capability";
      const saved: DemoUpload = { name: file.name, url, at: new Date().toISOString() };
      setUpload(kind, saved);
      return { url, name: file.name };
    },
  },
  {
    method: "POST",
    path: `${P}/verify`,
    handler: (ctx) => {
      const b = ctx.body as { validationKey?: string; inputs?: Record<string, unknown>; action?: string } | null;
      const key = b?.validationKey ?? "";
      if (key === "digital_compliance_intake") {
        const inputs = Object.fromEntries(Object.entries(b?.inputs ?? {}).map(([k, v]) => [k, String(v ?? "")]));
        setForm(key, { inputs, submittedAt: new Date().toISOString() });
        return { result: { status: "pass", message: "We have your answers.", data: {} } };
      }
      if (!VERIFY_KEYS.includes(key as VerifyKey)) return demoResponse(400, { error: "Unknown check." });
      const result = runVerification(key as VerifyKey, b?.inputs ?? {});
      setVerification(key, result);
      return { result: { status: result.status, message: result.message, data: result.data } };
    },
  },
  {
    method: "POST",
    path: `${P}/verify-reset`,
    handler: (ctx) => {
      const key = (ctx.body as { validationKey?: string } | null)?.validationKey ?? "";
      if (!VERIFY_KEYS.includes(key as VerifyKey)) return demoResponse(400, { error: "Unknown check." });
      setVerification(key, null);
      return { ok: true };
    },
  },

  // ── Small writes ──────────────────────────────────────────────────────────
  {
    method: "POST",
    path: `${P}/roadmap-v3/item-tick`,
    handler: (ctx) => {
      const b = ctx.body as { subStepId?: string; itemTitle?: string; ticked?: boolean } | null;
      if (!b?.subStepId || !b.itemTitle) return demoResponse(400, { error: "Unknown checklist line" });
      setTick(`${b.subStepId}::${b.itemTitle}`, b.ticked !== false);
      return { ok: true };
    },
  },
  {
    method: "POST",
    path: `${P}/dfy-explored`,
    handler: (ctx) => {
      const id = (ctx.body as { roadmapStepId?: string } | null)?.roadmapStepId;
      if (!id) return demoResponse(400, { error: "roadmapStepId required" });
      addExplored(id);
      return { ok: true };
    },
  },
];
