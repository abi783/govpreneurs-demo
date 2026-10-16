// "Do this next" — the one step the roadmap asks her to do now. Pure and
// client-safe: the roadmap page (RoadmapV3Client.tsx) and the member task
// adapter (lib/tasks/adapters/nextStep.ts) both call it, so the button and the
// task can never name two different steps.

import { DFY_FOR_SUBSTEP, unmetPrereqs, type EarlyReleaseMap } from "./programme";
import type { Roadmap, RoadmapSubStep, V3Payload } from "./types";

/** The Digital Compliance sub-step. It waits for the Positioning Call. */
export const DC_STEP_ID = "p1-digital-compliance";
/** The Positioning Call sub-step. */
export const POSITIONING_STEP_ID = "p3-positioning-call";

/** She owes us input on a step that has started. */
export function owesUsInput(sub: RoadmapSubStep): boolean {
  return sub.state === "in_progress" && sub.awaiting?.who === "you";
}

/**
 * DIGITAL COMPLIANCE WAITS FOR THE POSITIONING CALL — a SOFT wait (owner,
 * 28–29 Sep 2026). Until the Positioning Call step is done, the Digital
 * Compliance row sits in "Next" with the same lock and "Opens once …"
 * note as a gated step, and "Do this next" does not point at it. Unlike a
 * gate it still opens, its form still sends and its call still books ("they
 * should still be able to expand and book, we are just adding a warning").
 * A Digital Compliance step our team or an agency is already working on
 * stays where it is — that is not hers to hold back.
 */
export function waitsForPositioning(roadmap: Roadmap, sub: RoadmapSubStep): boolean {
  if (sub.id !== DC_STEP_ID || sub.state === "done") return false;
  if (sub.state === "in_progress" && sub.awaiting?.who !== "you") return false;
  const pos = roadmap.steps.flatMap((p) => p.subSteps).find((x) => x.id === POSITIONING_STEP_ID);
  return !!pos && pos.state !== "done";
}

/** A step she has not started, with nothing in front of it. */
export function readyToStart(roadmap: Roadmap, sub: RoadmapSubStep, earlyRelease: EarlyReleaseMap = {}): boolean {
  return sub.state === "todo" && !waitsForPositioning(roadmap, sub) && unmetPrereqs(roadmap, sub.id, earlyRelease).length === 0;
}

/** The step is hers to act on now. */
export function needsHer(roadmap: Roadmap, sub: RoadmapSubStep, earlyRelease: EarlyReleaseMap = {}): boolean {
  if (waitsForPositioning(roadmap, sub)) return false;
  return owesUsInput(sub) || readyToStart(roadmap, sub, earlyRelease);
}

/**
 * THE ORDER "DO THIS NEXT" WALKS (owner, 29 Sep 2026): "LLC, Positioning Call,
 * Sam.gov, Digital Compliance, Capability Statement, SBS, SLED". Not the
 * roadmap's own order — the Positioning Call is in phase 3 but comes second
 * here, and Digital Compliance waits for it. Steps not listed follow in
 * roadmap order.
 */
export const NEXT_ORDER: readonly string[] = [
  "p1-business-setup",
  POSITIONING_STEP_ID,
  "p1-federal-registration",
  DC_STEP_ID,
  "p2-capability-statement",
  "p2-sbs-registration",
  "p1-sled-registration",
];

/** The step "Do this next" names, and the phase it sits in. */
export type NextAction = { phaseIndex: number; sub: RoadmapSubStep };

/**
 * The one thing to do today, across the WHOLE roadmap — the first step in
 * NEXT_ORDER (then roadmap order) that needs her. A step she BOUGHT is skipped
 * whether or not it is verified yet: "if they bought a package we can skip
 * that step" — it is ours to deliver, not hers to start.
 */
export function nextAction(
  roadmap: Roadmap,
  earlyRelease: EarlyReleaseMap = {},
  bought: (sub: RoadmapSubStep) => boolean = () => false,
): NextAction | null {
  const all = roadmap.steps.flatMap((step) => step.subSteps.map((sub) => ({ phaseIndex: step.index, sub })));
  const rank = (id: string) => {
    const i = NEXT_ORDER.indexOf(id);
    return i === -1 ? NEXT_ORDER.length : i;
  };
  /* A stable sort: listed steps first in the owner's order, the rest keep
     their roadmap order behind them. */
  const ordered = all.map((x, i) => ({ ...x, i })).sort((a, b) => rank(a.sub.id) - rank(b.sub.id) || a.i - b.i);
  for (const { phaseIndex, sub } of ordered) {
    if (bought(sub)) continue;
    if (needsHer(roadmap, sub, earlyRelease)) return { phaseIndex, sub };
  }
  return null;
}

/** The payload fields that "Do this next" reads. */
export type NextActionPayload = Pick<V3Payload, "roadmap" | "earlyRelease" | "offers" | "purchasedSlugs">;

/**
 * "Do this next" for one roadmap payload. Bought = she owns the service behind
 * the step (the step's own offer, else the default service for it).
 */
export function nextActionFor(payload: NextActionPayload): NextAction | null {
  return nextAction(payload.roadmap, payload.earlyRelease, (sub) => {
    const slug = payload.offers[sub.id]?.slug ?? DFY_FOR_SUBSTEP[sub.id];
    return !!slug && payload.purchasedSlugs.includes(slug);
  });
}
