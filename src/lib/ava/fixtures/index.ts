// The bids Ava has read in the demo: the four in the caterer's story and the
// one in the agency's (src/demo/story/opportunities.ts, `ava`). Every other
// opportunity gets the Grant handoff and an honest "Ava is reading the buyer's
// files" state (handoff.ts); a state or local one asks for the buyer's files
// first, since the listing gives none for state and local notices
// (HandoffView.tsx).
//
// Four kinds of bid, on purpose — they are the shapes customers actually bid
// (concept §2): a scored city proposal (Fayetteville), a sealed low-bid
// package with no writing (Cumberland), a federal quote request (Camp
// Mackall) and a reply to a federal sources sought (Fort Bragg): two parts by
// email, no price, nothing to sign. The agency's Family Advocacy quote is a
// federal quote request too, judged on best value.
//
// DEMO: the title, the buyer and the notice number on every bid come from the
// story, so a card, a header and a task can never name the same bid
// differently. The prototype had a fifth bid (Aurora, Illinois). It is gone: an
// 800-mile job does not fit a North Carolina caterer.
//
// DEMO: two members (src/demo/member.ts). AVA_BIDS is the member on stage's
// bids, the story's own list. Every bid of both members can still be opened by
// its number (getAvaBid, ALL_AVA_BIDS), as the story's lookups allow, so
// content written for one member loads while the other is on stage.

import { findOpportunity } from "../../../demo/ava/opportunity";
import { AVA_BIDS as STORY_AVA_BIDS } from "../../../demo/story/opportunities";
import { registerSeeds, type AskAnswer } from "../store";
import type { AvaBid } from "../types";
import { cumberlandBid } from "./cumberland";
import { fayettevilleBid } from "./fayetteville";
import { fortBraggReplyBid } from "./fortBraggReply";
import { mackallBid } from "./mackall";
import { startingState } from "../start";

// Every pack member's hero bid (src/demo/members/<id>/ava/index.ts).
const PACK_AVA = Object.values(
  import.meta.glob<typeof import("../../../demo/members/agency/ava")>("/src/demo/members/*/ava/index.ts", { eager: true }),
);

function withStory(bid: AvaBid): AvaBid {
  const o = findOpportunity(bid.noticeId);
  if (!o) throw new Error(`Ava bid ${bid.noticeId} is not in the story`);
  return { ...bid, officialTitle: o.title, buyer: o.agency, bidNumber: o.noticeId };
}

/** Every member's sample bids, by notice number. */
export const ALL_AVA_BIDS: Record<string, AvaBid> = Object.fromEntries(
  [fayettevilleBid, cumberlandBid, mackallBid, fortBraggReplyBid, ...PACK_AVA.map((p) => p.HERO_BID)].map((b) => [
    b.noticeId,
    withStory(b),
  ]),
);

/** The member on stage's sample bids: the story's own list. */
export const AVA_BIDS: Record<string, AvaBid> = Object.fromEntries(
  STORY_AVA_BIDS.flatMap((o) => (ALL_AVA_BIDS[o.id] ? [[o.id, ALL_AVA_BIDS[o.id]] as const] : [])),
);

registerSeeds(
  Object.fromEntries(Object.keys(ALL_AVA_BIDS).map((id) => [id, () => startingState(id)] as const)),
);

export function getAvaBid(noticeId: string): AvaBid | null {
  return ALL_AVA_BIDS[noticeId] ?? null;
}

/** DEMO: the answers the member really gave, for a bid whose fixture keeps
 *  them, so a bid played forward (play.ts: the presenter's jump to a segment)
 *  reads as hers. Only the pack members' bids are here: the caterer's bids play with
 *  the sample answers they always used. */
export const MEMBER_ANSWERS: Record<string, Record<string, AskAnswer>> = Object.fromEntries(
  PACK_AVA.map((p) => [p.HERO_BID.noticeId, p.HERO_ANSWERS]),
);
