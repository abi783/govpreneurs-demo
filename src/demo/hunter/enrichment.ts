// DEMO (Hunter): the profile-setup journey, and the small profile helpers of the chat.
//
// In the demo, Amira's profile is complete. So the rail says every step is done,
// the ranking is `hybrid` (the full ranking), and no question waits. The calls
// still answer, so nothing in the rail can fail:
//   - `enter` and `next` say that there is nothing left to ask.
//   - `answer`, `skip`, `pause`, `back` and `checkpoint` all return a valid result.

import type {
  CompletePayload,
  EnrichmentStatePayload,
  MilestoneRailItem,
  PayoffDelta,
} from "../../lib/enrichment";
import { MILESTONE_LABEL, MILESTONE_ORDER } from "../../lib/enrichment";

const ANSWERED: Record<string, number> = {
  A_work_and_where: 3,
  B_how_you_win: 4,
  C_readiness: 3,
  D_sharpen: 2,
};

const NO_PAYOFF: PayoffDelta = { unlocked: 0, sharpened: 0 };

/** Four steps, every question answered. */
export function completeRail(): MilestoneRailItem[] {
  return MILESTONE_ORDER.map((milestone) => ({
    milestone,
    label: MILESTONE_LABEL[milestone],
    status: "done" as const,
    answered: ANSWERED[milestone],
    total: ANSWERED[milestone],
  }));
}

export function enrichmentState(
  patch: Partial<EnrichmentStatePayload> = {},
): EnrichmentStatePayload {
  return {
    posture: "NORMAL",
    active: false,
    paused: false,
    atCheckpoint: false,
    milestone: null,
    rail: completeRail(),
    payoffDelta: NO_PAYOFF,
    scoringMode: "hybrid",
    embedReady: true,
    ...patch,
  };
}

export function completePayload(): CompletePayload {
  return { kind: "complete", rail: completeRail(), totalPayoff: NO_PAYOFF };
}
