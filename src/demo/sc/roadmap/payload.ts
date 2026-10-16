// DEMO: the sample V3Payload for the Roadmap page.
//
// Production builds this on the server (src/lib/roadmapV3/payload.ts) from the
// database, the wallet and a YAML file. The demo builds it here from the story
// (Amira, Sarah Mitchell, the wallet) and from what the visitor has done since the
// page opened (bookings, purchases, ticks, checks) in the demo store.
// The progress numbers come from model.ts, the same file Home reads.

import { DIGITAL_COMPLIANCE_FIELDS, internalForm, type FormResult } from "@sc/lib/roadmapV3/forms";
import { DC_GAP_DESCRIPTIONS, DC_ITEMS } from "@sc/lib/digitalCompliance";
import { verifyKeyFor } from "@sc/lib/roadmapV3/programme";
import type { RoadmapSubStep, V3Call, V3Payload } from "@sc/lib/roadmapV3/types";
import { CALL_STEP_IDS } from "@sc/lib/callStepIds";
import { getWalletBalance } from "@/demo/state/wallet";
import { isoDaysFromNow } from "@/demo/story/clock";
import { MENTOR, PERSONA } from "@/demo/story/persona";
import {
  CALL_PRICE,
  DONE_DATES,
  MEMBER_TIME_ZONE,
  STEP_CONTENT,
  SHAPE,
  TARGETING_STEP_ID,
  COMPLIANCE_CALL_DAYS_AGO,
  EARLY_RELEASE,
  POSITIONING_CALL_DAYS_AGO,
  SELF_TICK_IDS,
  MEMBER_SINCE_DAYS,
  computeRoadmap,
  enrollmentSignals,
  itemTicked,
  offerFor,
  offersBySubStep,
  purchasedSlugList,
  receiptNumber,
  VERIFY_STEP,
  type VerifyKey,
} from "./model";
import { bookingForCall, getEnrollments, getForms, getUploads, getVerifications } from "./state";
import { storyVerification } from "./verifyData";

const ago = (days: number) => isoDaysFromNow(-days, 10);

function callFor(stepId: string, kind: "positioning" | "targeting" | "compliance"): V3Call {
  // A call she booked here shows as booked, even when an older call of the same kind was held.
  const booking = bookingForCall(stepId);
  if (booking) {
    return {
      stepId,
      bookable: true,
      price: CALL_PRICE,
      state: "booked",
      startTime: booking.startTime,
      meetingLocation: "Zoom",
    };
  }
  if (kind === "positioning") {
    return {
      stepId,
      bookable: true,
      price: CALL_PRICE,
      state: "completed",
      startTime: ago(POSITIONING_CALL_DAYS_AGO),
      meetingLocation: null,
    };
  }
  if (kind === "compliance") {
    // The first compliance call was free (she earned it with the audit form); another costs the ordinary price.
    return {
      stepId,
      bookable: true,
      price: CALL_PRICE,
      state: "completed",
      startTime: ago(COMPLIANCE_CALL_DAYS_AGO),
      meetingLocation: null,
    };
  }
  return {
    stepId,
    bookable: true,
    price: CALL_PRICE,
    state: "required",
    startTime: null,
    meetingLocation: null,
  };
}

/** The Digital Compliance findings she sees: the audit passed, a few gaps were fixed with her mentor. */
function complianceResults(): FormResult[] {
  const evidence: Record<
    string,
    { status: FormResult["status"]; evidence: string; provided?: string }
  > = {
    websiteCage: {
      status: "pass",
      evidence: `Found your CAGE code ${PERSONA.cage} and your address in the footer.`,
    },
    domainMatch: { status: "pass", evidence: `Your domain matches ${PERSONA.businessShortName}.` },
    professionalEmail: {
      status: "pass",
      evidence: "This address uses your own domain.",
      provided: PERSONA.email,
    },
    businessPhone: {
      status: "pass",
      evidence: "This number is listed on your site.",
      provided: PERSONA.phone,
    },
    a2p: {
      status: "fixed",
      evidence: "Your brand and campaign are registered with the phone carriers.",
    },
    contactConsent: { status: "pass", evidence: "Your contact page has the consent boxes." },
    govLandingCaps: {
      status: "pass",
      evidence: "Your government page lists your codes and links to your capability statement.",
    },
    letterhead: { status: "fixed", evidence: "Your letterhead now matches your site." },
    privacyPolicy: {
      status: "pass",
      evidence: "Your privacy policy is live and linked from every page.",
    },
  };
  return DC_ITEMS.map((item) => {
    const e = evidence[item.key];
    const row: FormResult = { title: item.title, status: e.status, evidence: e.evidence };
    const description = DC_GAP_DESCRIPTIONS[item.key];
    if (description) row.description = description;
    if (e.provided) row.provided = e.provided;
    return row;
  });
}

function verifyLatest(): V3Payload["verify"]["latest"] {
  const out: V3Payload["verify"]["latest"] = {};
  const stored = getVerifications();
  for (const key of Object.keys(VERIFY_STEP) as VerifyKey[]) {
    const mine = stored[key];
    if (mine === null) continue; // reset: nothing on record
    out[key] = mine ?? storyVerification(key, ago(VERIFY_DAYS_AGO[key]));
  }
  return out;
}

/** Days ago each check last ran in the story: the day its step finished. */
const VERIFY_DAYS_AGO = Object.fromEntries(
  (Object.keys(VERIFY_STEP) as VerifyKey[]).map((k) => [k, DONE_DATES[VERIFY_STEP[k]]!.done]),
) as Record<VerifyKey, number>;

export function buildRoadmapPayload(): V3Payload {
  const roadmap = computeRoadmap();
  const walletBalance = getWalletBalance();
  const offers = offersBySubStep();
  const enrollments = enrollmentSignals();
  const purchased = purchasedSlugList();
  const uploads = getUploads();
  const form = internalForm("digital_compliance_audit")!;
  const submittedForm = getForms()[form.verificationKey];
  const subs = roadmap.steps.flatMap((s) => s.subSteps);
  const subById = (id: string): RoadmapSubStep | undefined => subs.find((s) => s.id === id);

  // ── Per-step detail: the programme content, plus what the member has done ──
  const detail: V3Payload["detail"] = {};
  for (const phase of SHAPE) {
    for (const sub of phase.subSteps) {
      const cfg = STEP_CONTENT[sub.id];
      const d: V3Payload["detail"][string] = {};
      if (cfg?.items) d.items = cfg.items.map((title) => ({ title }));
      if (cfg?.why) d.why = cfg.why;
      if (cfg?.cardType) d.cardType = cfg.cardType;
      if (cfg?.callKey) d.callKey = cfg.callKey;
      if (cfg?.diyEnabled === false) d.diyEnabled = false;
      if (cfg?.diyLink) d.diyLink = cfg.diyLink;

      if (cfg?.formKey === form.key) {
        d.form = {
          title: form.label,
          description: form.blurb,
          buttonLabel: "Open the form",
          validationKey: form.verificationKey,
          fields: DIGITAL_COMPLIANCE_FIELDS,
          prefill: {
            businessLegalName: PERSONA.businessName,
            email: PERSONA.email,
            website: PERSONA.website,
            phone: PERSONA.phone,
            ...(submittedForm?.inputs ?? {}),
          },
          submitted: true,
          results: complianceResults(),
        };
      }

      if ((SELF_TICK_IDS as readonly string[]).includes(sub.id) && cfg?.items) {
        d.selfTick = true;
        d.items = cfg.items.map((title) => ({ title, done: itemTicked(sub.id, title) }));
      }

      // Proposal Building is under way, so the Do it yourself card is gone. Ava does the
      // work here, so the right column points at her. `selfServe` is the step setting the
      // page already reads ("her mentor's own plan, not a course"); an address that starts
      // with http is opened as a plain link, and the link guard keeps this one in the app.
      if (sub.id === "p4-proposal-building") {
        (d as Record<string, unknown>).selfServe = {
          title: "Build your proposals with Ava",
          desc: "Ava writes the first draft of each bid. You answer her questions and check the work.",
          cta: "Open Ava",
          href: `${typeof window !== "undefined" ? window.location.origin : ""}/ava`,
          icon: "plan",
        };
      }

      const vk = verifyKeyFor(sub.id);
      if (vk) d.verifyKey = vk;

      if (Object.keys(d).length > 0) detail[sub.id] = d;
    }
  }

  // Prime registration may be bought again: the count, and whether the newest one is still running.
  const prime = subById("p3-prime-registration");
  if (prime?.state === "done") {
    const bought = getEnrollments().filter((e) => e.slug === "prime-contractor-registration");
    detail["p3-prime-registration"] = {
      ...detail["p3-prime-registration"],
      repeat: {
        // She finished the step herself: that is one registration. Each purchase after it adds one.
        count: Math.max(bought.length, 1),
        inProgress: bought.length > 0,
        ...(bought.length > 0
          ? {
              working: {
                state: "in_progress" as const,
                openedAt: bought[bought.length - 1]!.enrolledAt,
              },
            }
          : {}),
      },
    };
  }

  const verifyPrefill: V3Payload["verify"]["prefill"] = {
    legalName: PERSONA.businessName,
    mailingZip: /\b(\d{5})\b/.exec(PERSONA.mailingAddress)?.[1] ?? null,
    dsbsProfileUrl: null,
    articlesUrl: uploads.articles?.url ?? null,
    capabilityUrl: uploads.capability?.url ?? PERSONA.capabilityStatementFile,
    cmmcUrl: uploads.cmmc?.url ?? null,
    sledRegistrations: [
      { registryType: "State", state: "NC", businessName: PERSONA.businessName },
      { registryType: "County", state: "NC", businessName: PERSONA.businessName },
      { registryType: "Education", state: "NC", businessName: PERSONA.businessName },
    ],
  };

  return {
    roadmap,
    scenarioId: null,
    previewMode: false,
    detail,
    stepMentors: {},
    offers,
    intake: null,
    purchasedSlugs: purchased,
    enrollmentsBySlug: enrollments,
    wallet: {
      balance: walletBalance,
      paidBalance: walletBalance,
      promotionalCredit: 0,
      currency: "USD",
    },
    mentor: { name: MENTOR.name, title: MENTOR.title, email: null, avatarUrl: null },
    calls: {
      positioning: callFor(CALL_STEP_IDS.positioning, "positioning"),
      compliance: callFor(CALL_STEP_IDS.digitalCompliance, "compliance"),
      targeting: callFor(CALL_STEP_IDS.targeting, "targeting"),
    },
    record: {
      legalName: PERSONA.businessName,
      ein: null,
      uei: PERSONA.uei,
      cage: PERSONA.cage,
      website: PERSONA.website,
      phone: PERSONA.phone,
      email: PERSONA.email,
      sledStates: ["NC"],
    },
    verify: { prefill: verifyPrefill, latest: verifyLatest() },
    freeSessionsLeft: 0,
    walletRechargeVideoUrl: null,
    purchaseConfirmation: false,
    iframeOnly: false,
    timeZone: MEMBER_TIME_ZONE,
    earlyRelease: EARLY_RELEASE,
  };
}

export { MEMBER_SINCE_DAYS, TARGETING_STEP_ID, offerFor, receiptNumber };
