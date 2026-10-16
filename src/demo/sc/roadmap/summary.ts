// DEMO: the one summary of Amira's roadmap progress that other pages show
// (Success Center home, Tasks). OWNER: the Roadmap agent, who replaces the body
// so it is computed from the same sample payload the Roadmap page renders.
// Other agents import it and must not change it.

export interface RoadmapSummary {
  /** 0–100, as the Roadmap page shows it. */
  percent: number;
  stepsDone: number;
  stepsTotal: number;
  /** The phase she is in now, in the Roadmap's own words. */
  currentPhaseLabel: string;
  /** The next thing the Roadmap asks her to do. */
  nextAction: { label: string; to: string };
}

export function getRoadmapSummary(): RoadmapSummary {
  return {
    percent: 62,
    stepsDone: 13,
    stepsTotal: 21,
    currentPhaseLabel: "Start bidding",
    nextAction: { label: "Book your targeting call", to: "/roadmap" },
  };
}
