// Roadmap v3 — the frozen programme shape.
//
// FOUR PHASES, updated to prototype PR #42's shape (picked up 2026-09-03):
// Foundation / Visibility & Credibility / Search, Save & Send / Execution.
// Digital Identity merged into Digital Compliance (one service, one step, one
// audit form — see EARLY_RELEASE_CHECKS below for what that merge cost SAM's
// gate), SLED Registration moved into Foundation, and the old Positioning
// review/Targeting-call pair was replaced by Positioning Call → Meet Your AI
// Agents → Send to Mentor. Renaming or reordering a sub-step
// is a change made HERE and only here.
//
// This shape is what every environment renders — it is no longer a fallback
// for an empty table. The per-step CONTENT that fills it (checklists, why,
// card type, mentor) comes from prisma/roadmap-v3-content.yaml, which a test
// holds to the ids, labels and weeks below, so the two cannot drift.
// RoadmapV3Step rows still exist and the sync script still writes them, but
// nothing they hold reaches a member.

import type { DfySlug, Roadmap, RoadmapStep, RoadmapSubStep, SubStepState, V3Signals } from "./types";

export type ShapeStep = { index: number; label: string; subSteps: { id: string; label: string; weeks: number }[] };
export type ProgrammeShape = ShapeStep[];

export const PROGRAMME: ProgrammeShape = [
  {
    index: 1,
    label: "Foundation",
    subSteps: [
      { id: "p1-business-setup", label: "LLC Registration", weeks: 2 },
      { id: "p1-digital-compliance", label: "Digital Compliance", weeks: 2 },
      { id: "p1-federal-registration", label: "Federal Registration", weeks: 10 },
      { id: "p1-sled-registration", label: "SLED Registration", weeks: 5 },
    ],
  },
  {
    index: 2,
    label: "Visibility & Credibility",
    subSteps: [
      { id: "p2-capability-statement", label: "Capability Statement", weeks: 2 },
      { id: "p2-sbs-registration", label: "SBS Registration", weeks: 1 },
      { id: "p2-cmmc-level-1", label: "CMMC 2.0 Level 1", weeks: 2 },
    ],
  },
  {
    index: 3,
    label: "Search, Save & Send",
    subSteps: [
      { id: "p3-positioning-call", label: "Positioning Call", weeks: 1 },
      { id: "p3-planned-pursuit", label: "Meet Your AI Agents", weeks: 1 },
      { id: "p3-send-to-mentor", label: "Send to Mentor", weeks: 1 },
      { id: "p3-prime-registration", label: "Prime Registration", weeks: 1 },
    ],
  },
  {
    index: 4,
    label: "Execution",
    subSteps: [
      { id: "p4-proposal-building", label: "Proposal Building", weeks: 3 },
      { id: "p4-review-submit", label: "Review & Submit", weeks: 1 },
    ],
  },
];

export const ALL_SUB_STEP_IDS = PROGRAMME.flatMap((s) => s.subSteps.map((x) => x.id));

// ── What unlocks what ────────────────────────────────────────────────────
// A GRAPH, not a line, and it deliberately crosses phase boundaries —
// Capability Statement opens while Phase 1 is still running. Listing only the
// NEAREST prerequisites keeps this readable; unmetPrereqs() walks the chain.
export const PREREQS: Record<string, string[]> = {
  // Foundation. Federal Registration and Capability Statement both wait on
  // the WHOLE of Digital Compliance (all twelve audit items) — this roadmap
  // has no per-item state, so the old "just Digital Identity's four facts"
  // gate cannot be expressed as a plain edge. See EARLY_RELEASE_CHECKS below
  // for the one exception carved back in.
  "p1-business-setup": [],
  "p1-digital-compliance": [],
  // SAM.gov waits on the LLC only (owner, 29 Sep 2026: "LLC, Positioning
  // Call, Sam.gov, Digital Compliance, Capability Statement, SBS, SLED — this
  // should be the order"). It used to wait on the whole of Digital
  // Compliance too, which put SAM behind it and against that order.
  "p1-federal-registration": ["p1-business-setup"],
  // SLED comes after SAM, full stop — the longest wait on the roadmap,
  // deliberately: Proposal Building waits on this step, so anything that
  // loosens this loosens Phase 4 with it.
  "p1-sled-registration": ["p1-federal-registration"],


  // Visibility & Credibility. Capability Statement opens the same moment
  // Federal Registration does (siblings, not a sequence) — listed below it so
  // findNextSubStep() offers the 10-week registration first. SBS needs a live
  // SAM registration and a UEI to point at.
  "p2-capability-statement": ["p1-business-setup", "p1-digital-compliance"],
  "p2-sbs-registration": ["p1-federal-registration"],
  // CMMC sits last in its phase and opens on Federal Registration, so it is
  // grey at the foot of Visibility & Credibility until SAM lands and then
  // rises into "Now" with everything else that is actionable.
  "p2-cmmc-level-1": ["p1-federal-registration"],

  // Search, Save & Send. Positioning Call and Meet Your AI Agents are both
  // open from day one, deliberately — she books the call and meets the agents
  // before Foundation is under way. The Phase 1/2 gate sits on Send to Mentor,
  // so it opens at exactly the moment it always did.
  "p3-positioning-call": [],
  "p3-planned-pursuit": [],
  // Start Search was hidden (2026-09-04) and its gate moved HERE rather than
  // deleted with it. It carried the whole Phase 1/2 wait, and Send to Mentor
  // reached that wait only THROUGH it — dropping the step without this list
  // would have opened Send to Mentor, and Phase 4 behind it, from day one.
  // Prime Registration sits below Send to Mentor but waits only on Federal
  // Registration — a prime's vendor list wants a live SAM registration, not
  // the rest of Phase 3.
  "p3-prime-registration": ["p1-federal-registration"],
  "p3-send-to-mentor": [
    "p3-planned-pursuit",
    "p1-federal-registration",
    "p1-digital-compliance",
    "p2-sbs-registration",
    "p2-capability-statement",
  ],

  // Execution.
  "p4-proposal-building": ["p3-send-to-mentor", "p1-sled-registration"],
  "p4-review-submit": ["p4-proposal-building"],
};

/**
 * Prerequisites a step can stop waiting on before the prerequisite step
 * itself is fully done — keyed by (gated step, prerequisite) PAIR, not by
 * prerequisite alone, because the same prerequisite can be released for one
 * dependent and not another. Capability Statement also waits on Digital
 * Compliance and is deliberately NOT released here: it wants the whole
 * presence the full step builds, not just the four facts SAM needs.
 *
 * NOTE (29 Sep 2026): Federal Registration no longer waits on Digital
 * Compliance at all (see PREREQS), so the entry below releases an edge that
 * is not there and changes nothing. Kept so the history reads; delete it once
 * nobody expects the old gate back.
 *
 * The one entry today: Federal Registration needs four FACTS out of Digital
 * Compliance's audit form — website, domain, email, phone — not the other
 * eight items. Waiting for the whole step put a 10-week federal registration
 * behind A2P carrier approval and a LinkedIn page.
 */
export const EARLY_RELEASE_CHECKS: Record<string, Record<string, (s: V3Signals) => boolean>> = {
  "p1-federal-registration": {
    "p1-digital-compliance": (s) => s.dcIdentityFactsPresent,
  },
};

/** stepId → prereqId → whether that edge is satisfied early, resolved once
 *  from real signals (server) and handed to the client as plain booleans —
 *  `unmetPrereqs()` reads this rather than raw signals, so it stays pure. */
export type EarlyReleaseMap = Record<string, Record<string, boolean>>;

export function resolveEarlyRelease(s: V3Signals): EarlyReleaseMap {
  const out: EarlyReleaseMap = {};
  for (const [stepId, prereqs] of Object.entries(EARLY_RELEASE_CHECKS)) {
    const resolved: Record<string, boolean> = {};
    for (const [prereqId, check] of Object.entries(prereqs)) resolved[prereqId] = check(s);
    out[stepId] = resolved;
  }
  return out;
}

// Which sub-steps we actually sell a done-for-you service for. A "have us do
// it" CTA may only appear where a real service backs it — a sub-step missing
// from this map gets NO done-for-you panel, rather than an offer we cannot
// fulfil. Values are TaskSection.dfySlug slugs.
export const DFY_FOR_SUBSTEP: Record<string, DfySlug> = {
  "p1-business-setup": "llc-application",
  "p1-digital-compliance": "govcompliant-digital-setup",
  "p1-federal-registration": "sam-registration",
  "p1-sled-registration": "sled-enrollment",
  "p3-prime-registration": "prime-contractor-registration",
  "p2-cmmc-level-1": "cmmc-level-1",
  "p2-sbs-registration": "sbs-visibility-setup",
  "p2-capability-statement": "capability-statement",
};

/**
 * Every service a v3 sub-step may be pointed at — the defaults above PLUS the
 * ones that only ever arrive by admin choice (no canonical sub-step binds
 * them). This is the allow-list: the admin picker, the settings API and the
 * payload's section query all read it, so adding a service is one edit here
 * and a TaskSection carrying the slug.
 */
export const ALL_DFY_SLUGS: DfySlug[] = [
  ...new Set<DfySlug>([...Object.values(DFY_FOR_SUBSTEP), "cmmc-level-1"]),
];

// ── Member-ticked steps ──────────────────────────────────────────────────
// Steps with no signal we could ever read — nothing to upload, nothing to buy,
// no call — so the member marks each checklist line done herself ("Click here
// if completed"). Every line ticked finishes the step. Stored in
// RoadmapV3ItemTick; the save route refuses any other step id.
export const SELF_TICK_STEPS = ["p3-planned-pursuit", "p3-prime-registration"] as const;
export function isSelfTickStep(id: string): boolean {
  return (SELF_TICK_STEPS as readonly string[]).includes(id);
}

// Done-for-you services she may buy again once their step is done: one
// purchase registers her with one more prime, one purchase at a time. The
// step's panel follows the NEWEST purchase of these, not the oldest.
export const REPEATABLE_SLUGS: readonly DfySlug[] = ["prime-contractor-registration"];
export function isRepeatableSlug(slug: DfySlug): boolean {
  return REPEATABLE_SLUGS.includes(slug);
}

// ── Member-run verifications ────────────────────────────────────────────
// The five checks a member can trigger from the page (upload + validate).
export const MEMBER_VERIFY_KEYS = ["llc", "sam", "sbs", "capability", "sled", "cmmc"] as const;
export type MemberVerifyKey = (typeof MEMBER_VERIFY_KEYS)[number];

/** Which verification a bound step lets the member run, by default. */
export const VERIFY_KEY_FOR_BINDING: Record<string, MemberVerifyKey> = {
  "p1-business-setup": "llc",
  "p1-federal-registration": "sam",
  "p1-sled-registration": "sled",
  "p2-sbs-registration": "sbs",
  "p2-capability-statement": "capability",
  "p2-cmmc-level-1": "cmmc",
};

/**
 * The verification a step exposes to the member: an admin-attached v2
 * verification wins when it is one of the five member-runnable checks;
 * otherwise the binding's default (if any).
 */
export function verifyKeyFor(effectiveId: string, customKey?: string): MemberVerifyKey | undefined {
  if (customKey && (MEMBER_VERIFY_KEYS as readonly string[]).includes(customKey)) {
    return customKey as MemberVerifyKey;
  }
  return VERIFY_KEY_FOR_BINDING[effectiveId];
}

export type SubStepOverride = Partial<
  Pick<RoadmapSubStep, "state" | "doneOn" | "startedOn" | "awaiting" | "openedAt" | "kickoffOn" | "kickoffNote">
>;

/**
 * Shape from the programme (the static spec by default; the admin-configured
 * /admin/roadmapv3 tree in production — see configShape.ts), state from the
 * overrides, phase state derived — a phase is complete when all its sub-steps
 * are, and "current" is simply the first that is not. Overrides for ids not
 * present in the shape are simply unused, which is what makes rearranging and
 * removing steps safe.
 */
export function deriveRoadmap(
  overrides: Record<string, SubStepOverride>,
  shape: ProgrammeShape = PROGRAMME,
): Roadmap {
  const steps: RoadmapStep[] = shape.map((s) => ({
    index: s.index,
    label: s.label,
    state: "locked" as const,
    subSteps: s.subSteps.map((sub) => ({
      ...sub,
      state: "todo" as SubStepState,
      ...(overrides[sub.id] ?? {}),
    })),
  }));

  let seenCurrent = false;
  for (const step of steps) {
    const allDone = step.subSteps.every((sub) => sub.state === "done");
    if (allDone) step.state = "complete";
    else if (!seenCurrent) {
      step.state = "current";
      seenCurrent = true;
    } else step.state = "locked";
  }

  const subs = steps.flatMap((s) => s.subSteps);
  // An in-progress sub-step counts as half so the figure moves when she
  // starts something, not only when she finishes it.
  const weightedDone = subs.reduce(
    (n, s) => n + (s.state === "done" ? 1 : s.state === "in_progress" ? 0.5 : 0),
    0,
  );
  const currentStep = steps.find((s) => s.state === "current") ?? steps[steps.length - 1]!;

  return {
    overallPercent: Math.round((weightedDone / subs.length) * 100),
    currentStepIndex: currentStep.index,
    currentStepLabel: currentStep.label,
    currentStepSub: {
      complete: currentStep.subSteps.filter((s) => s.state === "done").length,
      total: currentStep.subSteps.length,
    },
    estWeeksRemaining: subs.reduce((n, s) => n + (s.state === "done" ? 0 : s.weeks), 0),
    steps,
  };
}

export type Blocker = { phaseIndex: number; phaseLabel: string; subId: string; label: string };

/**
 * Everything still standing between her and this sub-step, walked through
 * the whole chain and returned in roadmap order.
 *
 * `earlyRelease` (from resolveEarlyRelease(), carried on the payload) skips an
 * edge whose partial-facts release fired — see EARLY_RELEASE_CHECKS. Absent
 * defaults to no early releases, which is every call site before this existed.
 */
export function unmetPrereqs(roadmap: Roadmap, subId: string, earlyRelease: EarlyReleaseMap = {}): Blocker[] {
  const stateById = new Map<string, string>();
  roadmap.steps.forEach((step) => step.subSteps.forEach((sub) => stateById.set(sub.id, sub.state)));

  const found = new Set<string>();
  const walk = (id: string) => {
    for (const prereq of PREREQS[id] ?? []) {
      if (earlyRelease[id]?.[prereq]) continue;
      if (stateById.get(prereq) === "done" || found.has(prereq)) continue;
      if (!stateById.has(prereq)) continue;
      found.add(prereq);
      walk(prereq);
    }
  };
  walk(subId);

  return roadmap.steps.flatMap((step) =>
    step.subSteps
      .filter((sub) => found.has(sub.id))
      .map((sub) => ({
        phaseIndex: step.index,
        phaseLabel: step.label,
        subId: sub.id,
        label: sub.label,
      })),
  );
}

export function findNextSubStep(
  roadmap: Roadmap,
): { stepIndex: number; stepLabel: string; subStep: RoadmapSubStep } | null {
  for (const step of roadmap.steps) {
    for (const sub of step.subSteps) {
      if (sub.state !== "done") return { stepIndex: step.index, stepLabel: step.label, subStep: sub };
    }
  }
  return null;
}

/**
 * The "Do it yourself" card's wording when a step sets none of its own.
 *
 * Exported so the admin editor can show these as its placeholders: a
 * placeholder that has drifted from the real default tells the admin the card
 * says something it does not.
 */
export const DIY_CARD_DEFAULTS = {
  title: "Do it yourself",
  description: "Use the resources to complete this on your own.",
} as const;

/**
 * Should the "Do it yourself" card render on this sub-step?
 *
 * Pure, and exported, because this rule failed silently once: the card used to
 * be suppressed whenever the other column held a call, the Hunter panel or
 * nothing, so an admin could tick "Show the Do it yourself card", save, and see
 * no change ("Send Opportunities to Mentor", a `pursuit` step, 2026-08-28).
 * The tick box is now the only thing that decides whether it is WANTED; the
 * three conditions below are about whether it still MAKES SENSE.
 */
export function showDiyCard(s: {
  /** The admin tick box. Absent = shown, how every step behaved before it existed. */
  diyEnabled?: boolean;
  /** A pre-purchase form is outstanding — there is nothing to do yet. */
  pendingForm: boolean;
  /** She bought the service; doing it herself is no longer the question. */
  dfyBought: boolean;
  /** The work has not started. Once it has, self-serve resources are noise. */
  notStarted: boolean;
}): boolean {
  if (s.diyEnabled === false) return false;
  return !s.pendingForm && !s.dfyBought && s.notStarted;
}
