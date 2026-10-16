// Roadmap v3 — the QA fixtures, ported from the frozen prototype's
// roadmapScenarios.ts (minus its in-memory event bus — here a scenario is
// applied server-side and REPLACES the member's real state entirely).
//
// A scenario says ONLY what differs from "nothing has happened yet"; the
// programme shape stays in programme.ts so the two can never drift. Reached
// via ?scenario=<id>; the client disables all commerce while one is active.

import { deriveRoadmap, type ProgrammeShape, type SubStepOverride } from "./programme";
import type { DfySlug, Roadmap } from "./types";

export type RoadmapScenario = {
  id: string;
  name: string;
  note: string;
  purchased?: DfySlug[];
  steps: Record<string, SubStepOverride>;
};

const P1 = ["p1-business-setup", "p1-digital-compliance", "p1-federal-registration", "p1-sled-registration"];
const P2 = ["p2-capability-statement", "p2-sbs-registration", "p2-cmmc-level-1"];
const P3 = ["p3-positioning-call", "p3-planned-pursuit", "p3-send-to-mentor", "p3-prime-registration"];
const P4 = ["p4-proposal-building", "p4-review-submit"];

function done(ids: string[], on: string): Record<string, SubStepOverride> {
  return Object.fromEntries(ids.map((id) => [id, { state: "done" as const, doneOn: on }]));
}

export const SCENARIOS: RoadmapScenario[] = [
  {
    id: "mid-program",
    name: "Mid-programme (default)",
    note: "Phase 1 on its last step and bought from us, Phase 2 running. Shows the completed record panel, a third-party wait and a step our team is on, all at once.",
    purchased: ["llc-application", "sam-registration", "capability-statement"],
    steps: {
      "p1-business-setup": { state: "done", startedOn: "2026-04-21", doneOn: "2026-05-12" },
      "p1-digital-compliance": { state: "done", startedOn: "2026-05-19", doneOn: "2026-06-02" },
      "p1-federal-registration": { state: "done", startedOn: "2026-06-02", doneOn: "2026-08-04" },
      "p2-sbs-registration": {
        state: "in_progress",
        awaiting: {
          who: "them",
          what: "your UEI number to be checked",
          from: "the Small Business Administration",
          eta: "2026-09-15",
        },
      },
      "p2-capability-statement": {
        state: "in_progress",
        awaiting: { who: "us", eta: "2026-09-08" },
      },
    },
  },
  {
    id: "day-one",
    name: "Day one",
    note: "Nothing started, nothing bought. LLC Registration and Digital Compliance are open; everything else is blocked.",
    steps: {},
  },
  {
    id: "waiting-on-her",
    name: "Waiting on her",
    note: "A step in flight that we cannot finish until she sends something. The loud state: red circle, red pill, pulsing Tasks link.",
    steps: {
      "p1-business-setup": { state: "done", doneOn: "2026-06-02" },
      "p1-digital-compliance": { state: "in_progress", awaiting: { who: "you" } },
    },
  },
  {
    id: "past-grace",
    name: "Past the grace period",
    note: "A step that has been hers for over a week and has not been started. The only state where the exclamation mark turns red.",
    steps: {
      "p1-business-setup": { state: "done", doneOn: "2026-06-02" },
      "p1-digital-compliance": {
        state: "in_progress",
        awaiting: { who: "you" },
        openedAt: "2026-07-25",
      },
    },
  },
  {
    id: "waiting-on-us",
    name: "Waiting on our team",
    note: "Bought and in flight. Amber pill with a date, and the done-for-you panel showing the scope our team is working through.",
    purchased: ["llc-application"],
    steps: {
      "p1-business-setup": {
        state: "in_progress",
        awaiting: { who: "us", eta: "2026-09-04" },
        kickoffOn: "2026-08-14",
        kickoffNote: "Your form gave us the LLC name and the state to file in.",
      },
    },
  },
  {
    id: "waiting-third-party",
    name: "Waiting on an agency",
    note: "Out of everyone's hands. Clock instead of a dot, and the wait names the agency and the date.",
    purchased: ["sam-registration"],
    steps: {
      ...done(["p1-business-setup", "p1-digital-compliance"], "2026-06-02"),
      "p1-federal-registration": {
        state: "in_progress",
        awaiting: {
          who: "them",
          what: "your registration to clear entity validation",
          from: "SAM.gov",
          eta: "2026-11-02",
        },
        kickoffOn: "2026-06-09",
        kickoffNote: "Your form matched your IRS letter, so we filed it.",
      },
    },
  },
  {
    id: "dfy-record",
    name: "Done-for-you finished",
    note: "Every Phase 1 service bought and delivered. The right column shows the record our team produced, read out of the live profile.",
    purchased: ["llc-application", "sam-registration", "govcompliant-digital-setup"],
    steps: done(P1, "2026-07-20"),
  },
  {
    id: "not-bought",
    name: "Finished it herself",
    note: "Phase 1 done with nothing purchased. Same green steps, but the right column still offers done-for-you rather than a record.",
    steps: done(P1, "2026-07-20"),
  },
  {
    id: "execution",
    name: "Bidding",
    note: "Phases 2 and 3 finished, Phase 1 on its last step with our team, and Proposal Building waiting on her.",
    purchased: ["llc-application", "sam-registration", "capability-statement", "sled-enrollment"],
    steps: {
      ...done(P1, "2026-06-30"),
      ...done(P2, "2026-08-11"),
      ...done(P3, "2026-09-22"),
      "p1-sled-registration": { state: "in_progress", awaiting: { who: "us", eta: "2026-10-27" } },
      "p4-proposal-building": { state: "in_progress", awaiting: { who: "you" } },
    },
  },
  {
    id: "complete",
    name: "Programme finished",
    note: "Every step done. All four phases green, the bar full, and no red anywhere.",
    purchased: ["llc-application", "sam-registration", "capability-statement", "sled-enrollment"],
    steps: {
      ...done(P1, "2026-06-30"),
      ...done(P2, "2026-08-11"),
      ...done(P3, "2026-09-22"),
      ...done(P4, "2026-11-10"),
    },
  },
];

export function scenarioById(id: string | undefined | null): RoadmapScenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

/** A fixture applied: state built from all-todo (on the configured shape), real signals ignored. */
export function applyScenario(
  sc: RoadmapScenario,
  shape?: ProgrammeShape,
): { roadmap: Roadmap; purchased: DfySlug[] } {
  return { roadmap: deriveRoadmap(sc.steps, shape), purchased: sc.purchased ?? [] };
}
