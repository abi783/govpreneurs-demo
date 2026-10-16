// The bids Ava has read in the demo: the four in the story
// (src/demo/story/opportunities.ts, `ava`). Every other opportunity gets the
// Grant handoff and an honest "Ava is reading the buyer's files" state
// (handoff.ts); a state or local one asks for the buyer's files first, since
// the listing gives none for state and local notices (HandoffView.tsx).
//
// Four kinds of bid, on purpose — they are the shapes customers actually bid
// (concept §2): a scored city proposal (Fayetteville), a sealed low-bid
// package with no writing (Cumberland), a federal quote request (Camp
// Mackall) and a reply to a federal sources sought (Fort Bragg): two parts by
// email, no price, nothing to sign.
//
// DEMO: the title, the buyer and the notice number on every bid come from the
// story, so a card, a header and a task can never name the same bid
// differently. The prototype had a fifth bid (Aurora, Illinois). It is gone: an
// 800-mile job does not fit a North Carolina caterer.

import { findOpportunity } from "../../../demo/ava/opportunity";
import { registerSeeds } from "../store";
import type { AvaBid } from "../types";
import { cumberlandBid } from "./cumberland";
import { fayettevilleBid } from "./fayetteville";
import { fortBraggReplyBid } from "./fortBraggReply";
import { mackallBid } from "./mackall";
import { startingState } from "../start";

function withStory(bid: AvaBid): AvaBid {
  const o = findOpportunity(bid.noticeId);
  if (!o) throw new Error(`Ava bid ${bid.noticeId} is not in the story`);
  return { ...bid, officialTitle: o.title, buyer: o.agency, bidNumber: o.noticeId };
}

export const AVA_BIDS: Record<string, AvaBid> = Object.fromEntries(
  [fayettevilleBid, cumberlandBid, mackallBid, fortBraggReplyBid].map((b) => [
    b.noticeId,
    withStory(b),
  ]),
);

registerSeeds(
  Object.fromEntries(Object.keys(AVA_BIDS).map((id) => [id, () => startingState(id)] as const)),
);

export function getAvaBid(noticeId: string): AvaBid | null {
  return AVA_BIDS[noticeId] ?? null;
}
