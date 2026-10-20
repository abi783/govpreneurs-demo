// DEMO (presenter control C2): the award on a bid she sent during the call.
//
// In the product the buyer decides weeks after the due date. On a call, Tim
// plays that time forward: a "Three weeks later" card, then the bid she sent
// moves to Won or Not awarded on the Pipeline, with the same award dialog the
// story's closed pursuits use.

import { readDemoState, updateDemoState } from "@/demo/runtime/store";
import { valueLine } from "@/demo/ava/story";
import { getOpportunity } from "@/demo/story/opportunities";
import type { ClosedPursuit } from "@/demo/story/workspace";

export type AwardOutcome = "won" | "not_awarded";

const KEY = "presenter.awards";

export function awardOutcome(id: string): AwardOutcome | null {
  return readDemoState<Record<string, AwardOutcome>>(KEY, {})[id] ?? null;
}

export function setAwardOutcome(id: string, outcome: AwardOutcome): void {
  updateDemoState<Record<string, AwardOutcome>>(KEY, {}, (prev) => ({ ...prev, [id]: outcome }));
}

/** The Pipeline note and next move for a decided bid. */
export function outcomeCard(id: string, outcome: AwardOutcome): { note: string; next: { label: string; to: string } } {
  return outcome === "won"
    ? { note: "Won. The award came in today.", next: { label: "Add it to My Business", to: "/my-business" } }
    : { note: "Not awarded. Ask for a debrief: it shows where you lost points.", next: { label: "Read the debrief notes", to: "/pipeline" } };
}

/** A decided story bid in the shape the award dialog reads, or null. */
export function outcomePursuit(id: string): ClosedPursuit | null {
  const outcome = awardOutcome(id);
  const o = getOpportunity(id);
  if (!outcome || !o) return null;
  const card = outcomeCard(id, outcome);
  return {
    id,
    title: o.plainTitle,
    agency: o.agency,
    stage: outcome,
    value: o.valueLow != null && o.valueHigh != null ? Math.round((o.valueLow + o.valueHigh) / 2) : 0,
    note: card.note,
    daysAgo: 0,
    next: card.next,
  };
}

/** What the award dialog says about a decided story bid. */
export function outcomeDetail(id: string): {
  heading: string;
  lead: string;
  points: string[];
  link?: { label: string; to: string };
} | null {
  const outcome = awardOutcome(id);
  const o = getOpportunity(id);
  if (!outcome || !o) return null;
  const value = valueLine(o);
  if (outcome === "won") {
    return {
      heading: "Award",
      lead: `You won this contract.${value ? ` The value is ${value}.` : ""}`,
      points: [
        "Ava kept what you sent, so the paperwork is in one place.",
        "Ask the contracting officer when work starts and who your day-to-day contact is.",
        "Add the job to My Business, so Hunter and Grant can use it as past performance.",
      ],
      link: { label: "Add it to My Business", to: "/my-business" },
    };
  }
  return {
    heading: "Debrief notes",
    lead: "The buyer chose another firm. Ask the contracting officer for a debrief: it shows where you lost points.",
    points: [
      "Write down your price and your technical score from the debrief.",
      "Grant uses what you learn on your next bid for this buyer.",
      "Check Forecasts: this buyer's next contract may already be planned.",
    ],
    link: { label: "See forecasts", to: "/forecasts" },
  };
}
