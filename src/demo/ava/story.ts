// DEMO: what the story says about each bid Ava builds (src/demo/story
// `ava` field), in one place for the list and the starting states.

import {
  AVA_BIDS,
  getOpportunity,
  type AvaState,
  type StoryOpportunity,
} from "../story/opportunities";

export interface AvaStoryBid {
  id: string;
  state: AvaState;
  /** The line the list card shows until the visitor changes the bid. */
  statusLine: string;
  /** "$540K–$780K", or null when the buyer states no value. */
  value: string | null;
}

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

/** "$540K–$780K", "$185K–$235K a year", or null when the buyer states no value. */
export function valueLine(o: StoryOpportunity): string | null {
  return o.valueLow !== null && o.valueHigh !== null
    ? `${money(o.valueLow)}–${money(o.valueHigh)}${o.valueBasis === "per_year" ? " a year" : ""}`
    : null;
}

export function getAvaStory(id: string): AvaStoryBid | null {
  const o = getOpportunity(id);
  if (!o?.ava) return null;
  return { id, state: o.ava, statusLine: o.ava.statusLine, value: valueLine(o) };
}

export const STORY_BIDS: AvaStoryBid[] = AVA_BIDS.map((o) => getAvaStory(o.id)!);
