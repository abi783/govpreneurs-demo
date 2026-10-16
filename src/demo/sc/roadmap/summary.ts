// DEMO: the one summary of Amira's roadmap progress that other pages show
// (Success Center home, Tasks). OWNER: the Roadmap agent.
//
// It is computed from the same sample data the Roadmap page renders (model.ts),
// so the percent, the step count, the phase and the next action always agree with
// the page, and they change when she books a call or buys a service.
// Other agents import it and must not change it.

import { nextActionFor } from "@sc/lib/roadmapV3/nextAction";
import { STEP_CONTENT, nextActionPayload } from "./model";

export interface RoadmapSummary {
  /** 0–100, as the Roadmap page shows it. */
  percent: number;
  stepsDone: number;
  stepsTotal: number;
  /** The phase she is in now, in the Roadmap's own words. */
  currentPhaseLabel: string;
  /** The next thing the Roadmap asks her to do. */
  nextAction: { label: string; to: string };
  /** Every phase and sub-step, exactly as the Roadmap page shows them. */
  phases: { label: string; subSteps: { id: string; label: string; done: boolean }[] }[];
}

export function getRoadmapSummary(): RoadmapSummary {
  const payload = nextActionPayload();
  const { roadmap } = payload;
  const subs = roadmap.steps.flatMap((s) => s.subSteps);
  const next = nextActionFor(payload);

  let label = "Open your roadmap";
  let to = "/roadmap";
  if (next) {
    const call = STEP_CONTENT[next.sub.id]?.cardType === "call";
    const name = next.sub.label;
    label = call
      ? `Book your ${name.toLowerCase()}`
      : next.sub.state === "in_progress"
        ? `Continue ${name}`
        : `Start ${name}`;
    to = `/roadmap?step=${next.sub.id}`;
  }

  return {
    percent: roadmap.overallPercent,
    stepsDone: subs.filter((s) => s.state === "done").length,
    stepsTotal: subs.length,
    currentPhaseLabel: roadmap.currentStepLabel,
    nextAction: { label, to },
    phases: roadmap.steps.map((step) => ({
      label: step.label,
      subSteps: step.subSteps.map((sub) => ({ id: sub.id, label: sub.label, done: sub.state === "done" })),
    })),
  };
}
