// DEMO: the one summary of the My Business record that other pages may show (for
// example the Success Center home, Tasks or Ava). It reads the same store value that
// the My Business page writes, so a number on another page matches the page itself.
// OWNER: the My Business agent. Other agents import it and must not change it.

import { readyScore } from "@sc/lib/businessProfile/score";
import type { HandoffMode } from "@sc/lib/businessProfile/payload";
import { PERSONA } from "../../story/persona";
import { buildPayload } from "./payload";
import { readBusiness } from "./state";

export interface BusinessSummary {
  /** Questions answered, as the score card on the page prints it (for example 47 of 55). */
  settled: number;
  total: number;
  /** The 14 questions a mentor reads before the first call. */
  intakeAnswered: number;
  intakeTotal: number;
  handoff: HandoffMode;
  /** Suggestions (from Hunter, the capability statement or "Tell Hunter") that wait for a yes or a no. */
  suggestionsWaiting: number;
  /** Cooks with a food-handler certificate on file. Adding one on the Papers part raises it. */
  foodHandlerCertificates: number;
  /** Cooks the story says need one (the business has five). */
  cooksTotal: number;
}

export function getBusinessSummary(): BusinessSummary {
  const payload = buildPayload(readBusiness());
  const score = readyScore(payload.fields, undefined, payload.media);
  const cards = payload.fields.find((f) => f.fieldKey === "food_handler_cards");
  return {
    settled: score.settled,
    total: score.total,
    intakeAnswered: payload.counter.answered,
    intakeTotal: payload.counter.total,
    handoff: payload.handoff.mode,
    suggestionsWaiting: payload.proposals.length,
    foodHandlerCertificates: cards?.value.kind === "papers" ? cards.value.papers.length : 0,
    cooksTotal: PERSONA.employeesW2,
  };
}
