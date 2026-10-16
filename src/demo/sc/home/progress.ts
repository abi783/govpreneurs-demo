// DEMO: the roadmap numbers that the Success Center home shows.
//
// The Roadmap agent owns the numbers (src/demo/sc/roadmap/summary.ts). This file
// only turns that summary into the two shapes that the lifted home components
// read: the "Overall Progress" rows (production `homeProgressSteps`) and the
// "Enrollment List" rows (production `homeEnrollmentRows`). Both read the
// roadmap's own phases and step names (lib/roadmapV3/programme.ts), so the home
// and the Roadmap page name every step the same way.
//
// The headline percent is always the summary's `percent`. Rows follow it:
// `percent` of the steps count as done, in the order a member like Amira
// finishes them. If the summary later carries its own `phases`, the rows use
// those instead and the order list below is not used.

import { DFY_FOR_SUBSTEP, PROGRAMME } from "@sc/lib/roadmapV3/programme";
import type { EnrolledService } from "@sc/components/portal/RoadmapEnrollmentList";
import { getRoadmapSummary, type RoadmapSummary } from "@/demo/sc/roadmap/summary";
import type { MainStepProgress } from "./types";

/** The order in which Amira finishes the steps. The first `n` are done. */
const COMPLETION_ORDER = [
  "p1-business-setup",
  "p1-digital-compliance",
  "p1-federal-registration",
  "p1-sled-registration",
  "p2-capability-statement",
  "p2-sbs-registration",
  "p3-positioning-call",
  "p3-planned-pursuit",
  "p3-send-to-mentor",
  "p2-cmmc-level-1",
  "p3-prime-registration",
  "p4-proposal-building",
  "p4-review-submit",
];

/** A paid service she has bought and our team is working on. */
const BOUGHT_AND_STARTED = new Set(["p3-prime-registration"]);

/** The shape a future `RoadmapSummary.phases` field would have. */
interface SummaryPhase {
  label: string;
  subSteps: { id: string; label: string; done: boolean }[];
}
type SummaryWithPhases = RoadmapSummary & { phases?: SummaryPhase[] };

function phasesOf(summary: SummaryWithPhases): SummaryPhase[] {
  if (summary.phases && summary.phases.length > 0) return summary.phases;
  const total = PROGRAMME.reduce((n, p) => n + p.subSteps.length, 0);
  const doneCount = Math.max(0, Math.min(total, Math.round((summary.percent / 100) * total)));
  const done = new Set(COMPLETION_ORDER.slice(0, doneCount));
  return PROGRAMME.map((p) => ({
    label: p.label,
    subSteps: p.subSteps.map((s) => ({ id: s.id, label: s.label, done: done.has(s.id) })),
  }));
}

const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

export interface HomeProgress {
  percent: number;
  mainSteps: MainStepProgress[];
  enrollment: EnrolledService[];
  currentPhaseLabel: string;
}

export function getHomeProgress(): HomeProgress {
  const summary = getRoadmapSummary() as SummaryWithPhases;
  const phases = phasesOf(summary);

  const mainSteps: MainStepProgress[] = phases.map((phase, i) => {
    const doneCount = phase.subSteps.filter((s) => s.done).length;
    return {
      id: `v3-phase-${i + 1}`,
      title: phase.label,
      sortOrder: i + 1,
      completedCount: doneCount,
      totalCount: phase.subSteps.length,
      percentage: pct(doneCount, phase.subSteps.length),
      excluded: false,
      subSteps: phase.subSteps.map((s, j) => ({
        id: s.id,
        title: s.label,
        sortOrder: j,
        completedCount: s.done ? 1 : 0,
        totalCount: 1,
        percentage: s.done ? 100 : 0,
        excluded: false,
      })),
    };
  });

  // One Enrollment List row for each step that sells a done-for-you service.
  const enrollment: EnrolledService[] = [];
  for (const phase of phases) {
    for (const step of phase.subSteps) {
      if (!(step.id in DFY_FOR_SUBSTEP)) continue;
      enrollment.push({
        title: step.label,
        status: step.done ? "Completed" : BOUGHT_AND_STARTED.has(step.id) ? "Started" : "Not Enrolled",
        intakeFormLink: null,
      });
    }
  }

  return { percent: summary.percent, mainSteps, enrollment, currentPhaseLabel: summary.currentPhaseLabel };
}
