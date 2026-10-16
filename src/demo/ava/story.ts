// DEMO: what the story says about each bid Ava builds (src/demo/story
// `ava` field), in one place for the list and the starting states.

import { AVA_BIDS, getOpportunity, type AvaState } from "../story/opportunities";

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

export function getAvaStory(id: string): AvaStoryBid | null {
  const o = getOpportunity(id);
  if (!o?.ava) return null;
  const value =
    o.valueLow !== null && o.valueHigh !== null
      ? `${money(o.valueLow)}–${money(o.valueHigh)}${o.valueBasis === "per_year" ? " a year" : ""}`
      : null;
  return { id, state: o.ava, statusLine: o.ava.statusLine, value };
}

export const STORY_BIDS: AvaStoryBid[] = AVA_BIDS.map((o) => getAvaStory(o.id)!);
