// DEMO: where Amira stands on the Roadmap, as plain data.
//
// This file is light on purpose: the Success Center Home page imports
// `summary.ts`, which imports this file. The heavy parts (the Digital Compliance
// form, the verification results) live in payload.ts.
//
// The story: Amira joined the program about six months ago. She finished the
// Foundation (LLC, Digital Compliance, SAM.gov, SLED), Visibility & Credibility
// (capability statement, SBA profile, CMMC Level 1) and Search, Save & Send
// (positioning call with Sarah, the AI agents, Send to Mentor, prime
// registration). She is now in Execution: Ava is building her proposals, and
// her next step is the quarterly targeting call with Sarah.
//
// Every date is "days ago" from the demo clock (clock.ts).

import {
  DFY_FOR_SUBSTEP,
  PROGRAMME,
  deriveRoadmap,
  isRepeatableSlug,
  type ProgrammeShape,
  type SubStepOverride,
} from "@sc/lib/roadmapV3/programme";
import type {
  DfySlug,
  EnrollmentSignal,
  Roadmap,
  V3Offer,
  V3Payload,
} from "@sc/lib/roadmapV3/types";
import { nextActionFor } from "@sc/lib/roadmapV3/nextAction";
import { CALL_STEP_IDS } from "@sc/lib/callStepIds";
import { SUB_STEP_DETAIL } from "@sc/components/portal/roadmap-v3/detailContent";
import { isoDaysFromNow } from "@/demo/story/clock";
import { PERSONA } from "@/demo/story/persona";
import {
  COMPLIANCE_CALL_DAYS_AGO,
  FIRST_MENTOR_QUESTION_DAYS_AGO,
  MEMBER_SINCE_DAYS,
  POSITIONING_CALL_DAYS_AGO,
  SAM_CHECKED_DAYS_AGO,
} from "@/demo/sc/timeline";
import { CONTENT, type ContentSub } from "./content";
import {
  getBookings,
  getEnrollments,
  getTicks,
  getVerifications,
  bookingForCall,
  type DemoEnrollment,
} from "./state";

// ── The shape: the production programme plus Amira's quarterly call ─────────

/** The quarterly targeting call. A custom step in Execution, the first one there. */
export const TARGETING_STEP_ID = "p4-quarterly-targeting-call";

export const SHAPE: ProgrammeShape = PROGRAMME.map((phase) =>
  phase.index === 4
    ? {
        ...phase,
        subSteps: [
          { id: TARGETING_STEP_ID, label: "Quarterly Targeting Call", weeks: 1 },
          ...phase.subSteps,
        ],
      }
    : phase,
);

/** Programme content by step id: the production YAML, plus the quarterly call. */
export const STEP_CONTENT: Record<string, ContentSub> = {
  ...Object.fromEntries(CONTENT.map((c) => [c.id, c])),
  [TARGETING_STEP_ID]: {
    id: TARGETING_STEP_ID,
    phase: "p4",
    title: "Quarterly Targeting Call",
    weeks: 1,
    items: ["Book your quarterly targeting call", "Agree your next quarter of bids"],
    why: "Plan your next quarter of bids around Fort Bragg and the VA. Your mentor helps you pick the jobs to chase and what must be ready first.",
    cardType: "call",
    callKey: "targeting",
  },
  // DEMO: Ava is live in this sample, so the line no longer says "Coming Soon!".
  "p4-proposal-building": {
    ...CONTENT.find((c) => c.id === "p4-proposal-building")!,
    items: [
      "Ava - Your Proposal Builder",
      "You correct the work details",
      "Add past performance",
      "Price it",
    ],
  },
};

/** The member's time zone: Fayetteville, NC. */
export const MEMBER_TIME_ZONE = "America/New_York";

/** The price of one mentor call, in dollars. The same as a mentor review. */
export const CALL_PRICE = 97;

// ── Who pays for what ────────────────────────────────────────────────────────

export interface ServiceDef {
  slug: DfySlug;
  sectionId: string;
  stepId: string;
  title: string;
  price: string;
  options?: { id: string; label: string; price: string; description?: string }[];
  turnaround: string;
}

/** The done-for-you catalog. Prices follow the prototype's catalog (dfyServices.ts). */
export const SERVICES: Record<DfySlug, ServiceDef> = {
  "llc-application": {
    slug: "llc-application",
    sectionId: "sec-llc-application",
    stepId: "step-llc-application",
    title: "LLC Application",
    price: "$600",
    turnaround: "3–5 days",
  },
  "govcompliant-digital-setup": {
    slug: "govcompliant-digital-setup",
    sectionId: "sec-digital-setup",
    stepId: "step-digital-setup",
    title: "GovCompliant Digital Setup",
    price: "$397",
    options: [
      {
        id: "basic",
        label: "Basic",
        price: "$397",
        description: "Domain, email, phone and a one-page site.",
      },
      {
        id: "premium",
        label: "Premium",
        price: "$2,499",
        description: "Everything in Basic, plus the government page and A2P texting.",
      },
    ],
    turnaround: "5–7 days",
  },
  "sam-registration": {
    slug: "sam-registration",
    sectionId: "sec-sam",
    stepId: "step-sam",
    title: "SAM.gov Registration",
    price: "$2,997",
    turnaround: "8–10 weeks",
  },
  "sbs-visibility-setup": {
    slug: "sbs-visibility-setup",
    sectionId: "sec-sbs",
    stepId: "step-sbs",
    title: "SBS Visibility Setup",
    price: "$997",
    turnaround: "3 days",
  },
  "capability-statement": {
    slug: "capability-statement",
    sectionId: "sec-capability",
    stepId: "step-capability",
    title: "Capability Statement",
    price: "$2,000",
    turnaround: "3 days",
  },
  "sled-enrollment": {
    slug: "sled-enrollment",
    sectionId: "sec-sled",
    stepId: "step-sled",
    title: "SLED Enrollment",
    price: "$2,497",
    turnaround: "1–2 weeks",
  },
  // DEMO: the prototype catalog has no price for these two. Sample prices.
  "cmmc-level-1": {
    slug: "cmmc-level-1",
    sectionId: "sec-cmmc",
    stepId: "step-cmmc",
    title: "CMMC 2.0 Level 1",
    price: "$497",
    turnaround: "2 weeks",
  },
  "prime-contractor-registration": {
    slug: "prime-contractor-registration",
    sectionId: "sec-prime",
    stepId: "step-prime",
    title: "Prime Contractor Registration",
    price: "$197",
    turnaround: "1–2 weeks",
  },
};

export function serviceByTitle(title: string): ServiceDef | undefined {
  return Object.values(SERVICES).find((s) => s.title === title);
}

export function serviceBySection(sectionId: string): ServiceDef | undefined {
  return Object.values(SERVICES).find((s) => s.sectionId === sectionId);
}

export function serviceByStep(stepId: string): ServiceDef | undefined {
  return Object.values(SERVICES).find((s) => s.stepId === stepId);
}

export function offerFor(slug: DfySlug): V3Offer {
  const s = SERVICES[slug];
  return {
    slug,
    stepId: s.stepId,
    sectionId: s.sectionId,
    serviceTitle: s.title,
    price: s.price,
    priceOptions: s.options ?? null,
    // DEMO: no outside intake forms. The sample never sends her off the site.
    intakeFormLink: null,
    turnaround: s.turnaround,
  };
}

/** The offer shown on each step: production's default service for it. */
export function offersBySubStep(): Partial<Record<string, V3Offer>> {
  const out: Partial<Record<string, V3Offer>> = {};
  for (const phase of SHAPE) {
    for (const sub of phase.subSteps) {
      const cfg = STEP_CONTENT[sub.id];
      if (cfg?.cardType && cfg.cardType !== "dfy") continue;
      const slug = (cfg?.dfySlug ?? DFY_FOR_SUBSTEP[sub.id]) as DfySlug | undefined;
      if (slug) out[sub.id] = offerFor(slug);
    }
  }
  return out;
}

// ── What is true about her checks ────────────────────────────────────────────

export type VerifyKey = "llc" | "sam" | "sbs" | "capability" | "sled" | "cmmc";

/** The step each member-run check finishes. */
export const VERIFY_STEP: Record<VerifyKey, string> = {
  llc: "p1-business-setup",
  sam: "p1-federal-registration",
  sled: "p1-sled-registration",
  capability: "p2-capability-statement",
  sbs: "p2-sbs-registration",
  cmmc: "p2-cmmc-level-1",
};

/** True when the check has a passing result. The story starts with all six passing. */
export function verifyPasses(key: VerifyKey): boolean {
  const stored = getVerifications()[key];
  if (stored === undefined) return true; // the story's own result
  return stored?.status === "pass";
}

// ── Days ago, and the done dates ─────────────────────────────────────────────

const ago = (days: number) => isoDaysFromNow(-days, 10);

/**
 * When she started and finished each step the story marks done (days ago).
 * SAM.gov finished 183 days ago, which is a year before PERSONA.samActiveUntil
 * (a SAM registration lasts one year).
 */
export const DONE_DATES: Record<string, { started?: number; done: number }> = {
  "p1-business-setup": { started: 218, done: 210 },
  "p1-digital-compliance": { started: 212, done: 196 },
  "p1-federal-registration": { started: 205, done: SAM_CHECKED_DAYS_AGO },
  "p1-sled-registration": { started: 183, done: 170 },
  "p2-capability-statement": { started: 168, done: 160 },
  "p2-sbs-registration": { started: 160, done: 158 },
  "p2-cmmc-level-1": { started: 158, done: 154 },
  "p3-positioning-call": { done: POSITIONING_CALL_DAYS_AGO },
  "p3-planned-pursuit": { done: 148 },
  "p3-prime-registration": { done: 144 },
  "p3-send-to-mentor": { done: FIRST_MENTOR_QUESTION_DAYS_AGO },
};

// The dates of the calls and of the SAM check live in ../timeline.ts, so every page tells the same history.
export { COMPLIANCE_CALL_DAYS_AGO, MEMBER_SINCE_DAYS, POSITIONING_CALL_DAYS_AGO };

/** Lines she ticked herself on the member-ticked steps. The story has all of them ticked. */
export function itemTicked(subId: string, title: string): boolean {
  const stored = getTicks()[`${subId}::${title}`];
  return stored ?? true;
}

export const SELF_TICK_IDS = ["p3-planned-pursuit", "p3-prime-registration"] as const;

function selfTickDone(subId: string): boolean {
  return (STEP_CONTENT[subId]?.items ?? []).every((t) => itemTicked(subId, t));
}

// ── The Roadmap ──────────────────────────────────────────────────────────────

/** Hours between the member's choice and the moment the page asks. Used for "now". */
export function computeRoadmap(): Roadmap {
  const overrides: Record<string, SubStepOverride> = {};

  const markDone = (id: string, doneOn?: string) => {
    const d = DONE_DATES[id];
    overrides[id] = {
      state: "done",
      ...(d?.started != null && !doneOn ? { startedOn: ago(d.started) } : {}),
      doneOn: doneOn ?? (d ? ago(d.done) : ago(60)),
    };
  };

  // Steps a member-run check finishes: done while the check passes.
  for (const key of Object.keys(VERIFY_STEP) as VerifyKey[]) {
    const id = VERIFY_STEP[key];
    if (!verifyPasses(key)) continue;
    const stored = getVerifications()[key];
    markDone(id, stored?.status === "pass" ? stored.checkedAt : undefined);
  }

  // Digital Compliance, the positioning call: part of the story, no member-run check.
  markDone("p1-digital-compliance");
  markDone("p3-positioning-call");

  // Steps the member ticks line by line.
  for (const id of SELF_TICK_IDS) {
    if (selfTickDone(id)) markDone(id);
  }
  markDone("p3-send-to-mentor");

  // Execution.
  const targeting = bookingForCall(CALL_STEP_IDS.targeting);
  if (targeting)
    overrides[TARGETING_STEP_ID] = { state: "in_progress", kickoffOn: targeting.startTime };
  overrides["p4-proposal-building"] = {
    state: "in_progress",
    awaiting: { who: "you" },
    openedAt: ago(2),
  };

  // A service she bought moves its step on, as production does (mapping.ts enrollmentState):
  // our team is working on it. A step that starts with a call waits for her to book it.
  for (const phase of SHAPE) {
    for (const sub of phase.subSteps) {
      const slug = DFY_FOR_SUBSTEP[sub.id];
      if (!slug || isRepeatableSlug(slug) || overrides[sub.id]?.state === "done") continue;
      const bought = getEnrollments()
        .filter((e) => e.slug === slug)
        .at(-1);
      if (!bought) continue;
      const callFirst =
        SUB_STEP_DETAIL[sub.id]?.handoff === "call" && !bought.deliveryAppointmentAt;
      const held =
        bought.deliveryAppointmentAt &&
        new Date(bought.deliveryAppointmentAt).getTime() < Date.now();
      overrides[sub.id] = callFirst
        ? { state: "in_progress", awaiting: { who: "you" }, openedAt: bought.enrolledAt }
        : { state: "in_progress", ...(held ? { kickoffOn: bought.deliveryAppointmentAt! } : {}) };
    }
  }

  return deriveRoadmap(overrides, SHAPE);
}

/** The service purchases as the Roadmap reads them. */
export function enrollmentSignals(): Partial<Record<DfySlug, EnrollmentSignal>> {
  const out: Partial<Record<DfySlug, EnrollmentSignal>> = {};
  for (const e of getEnrollments()) {
    const slug = e.slug as DfySlug;
    // The newest purchase of a service she may buy again is the one shown.
    out[slug] = signalFor(e);
  }
  return out;
}

export function receiptNumber(e: Pick<DemoEnrollment, "id" | "enrolledAt">): string {
  let n = 0;
  for (const ch of e.id) n = (n * 31 + ch.charCodeAt(0)) % 9000;
  return `INV-${1000 + n}`;
}

function signalFor(e: DemoEnrollment): EnrollmentSignal {
  return {
    deliveryStatus: e.deliveryAppointmentAt ? "booked" : "enrolled",
    intakeSubmittedAt: null,
    hasIntakeForm: false,
    enrolledAt: e.enrolledAt,
    deliveryAppointmentAt: e.deliveryAppointmentAt,
    receipt: {
      state: "ready",
      number: receiptNumber(e),
      url: `/api/portal/${PERSONA.locationId}/receipts/${encodeURIComponent(e.id)}`,
    },
  };
}

export function purchasedSlugList(): DfySlug[] {
  return [...new Set(getEnrollments().map((e) => e.slug as DfySlug))];
}

/** Resolved early releases: the audit form gave her website, domain, email and phone. */
export const EARLY_RELEASE: V3Payload["earlyRelease"] = {
  "p1-federal-registration": { "p1-digital-compliance": true },
};

// ── The pieces "Do this next" reads ──────────────────────────────────────────

export function nextActionPayload() {
  return {
    roadmap: computeRoadmap(),
    earlyRelease: EARLY_RELEASE,
    offers: offersBySubStep(),
    purchasedSlugs: purchasedSlugList(),
  };
}

export function nextStepNow() {
  return nextActionFor(nextActionPayload());
}

/** The booking, if any, that moves the quarterly call out of "to do". */
export function allBookings() {
  return getBookings();
}
