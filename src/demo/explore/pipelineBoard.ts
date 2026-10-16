// The Pipeline board for the demo.
//
// Production fills only two stages from real data (saved items and mentor
// reviews). The demo shows Amira's whole work: every story pursuit in its stage
// with the story's note and next move, the closed pursuits, her saved forecasts
// and small orders, and every open mentor review. One rule keeps the board clean:
// a record appears once. If a mentor review is open for it, the review card
// stands for it.

import { isoDaysFromNow } from "@/demo/story/clock";
import { OPPORTUNITIES, getOpportunity, type StoryOpportunity } from "@/demo/story/opportunities";
import { CLOSED_PURSUITS, type ClosedPursuit } from "@/demo/story/workspace";
import { describeSaved } from "@/demo/state/workspace";
import type { Bid } from "@/lib/mock/bids";
import type { MentorReviewSummary } from "@/lib/mentorReviewsApi";
import type { SavedOppDetail } from "@/lib/workspace";
import { savedDetailToBid } from "@/lib/bids/savedDetailToBid";
import { relativeTime } from "@/lib/format";

/** What the demo adds to a card. */
export interface DemoBidExtra {
  /** The card's next move (the story's own words and route). */
  next?: { label: string; to: string };
  /** Ava is building this bid: the tag links to her page. */
  ava?: { to: string };
  /** A closed pursuit whose details open in a dialog. */
  closedId?: string;
}

export type DemoBid = Bid & { demo?: DemoBidExtra };

function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `$${Math.round(n / 1_000)}K`;
}

function valueRange(o: StoryOpportunity): { text?: string; mid: number } {
  if (o.valueLow == null || o.valueHigh == null) return { mid: 0 };
  const text = o.valueLow === o.valueHigh ? money(o.valueHigh) : `${money(o.valueLow)} – ${money(o.valueHigh)}`;
  return { text: o.valueBasis === "per_year" ? `${text} a year` : text, mid: (o.valueLow + o.valueHigh) / 2 };
}

const VERDICT_WORD = { bid: "Bid", review: "Look closer", no_bid: "Don't bid" } as const;

function storyBid(o: StoryOpportunity, stage: Bid["stage"], withPursuit: boolean): DemoBid {
  const value = valueRange(o);
  const pursuit = withPursuit ? o.pursuit : undefined;
  // An outcome card (submitted, won, not awarded, declined) shows no countdown.
  const outcome = ["submitted", "won", "not_awarded", "declined"].includes(stage);
  const deadline = outcome ? null : isoDaysFromNow(o.closesInDays, 17);
  return {
    id: `story_${o.id}`,
    opportunityId: o.id,
    title: o.plainTitle,
    agency: o.agency,
    mode: o.grant.sub === "go" && o.grant.prime === "no_go" ? "partner" : "prime",
    deadline,
    stage,
    ...(pursuit
      ? { contextOverride: pursuit.note }
      : { grantVerdict: { verdict: VERDICT_WORD[o.grant.verdict], oneLine: o.grant.oneLine } }),
    nextAction: { label: pursuit?.next.label ?? "Review with Grant", href: pursuit?.next.to ?? `/opportunities/${o.id}` },
    lastActivityAt: isoDaysFromNow(-(pursuit?.lastActivityDaysAgo ?? 3)),
    daysLeft: outcome ? null : o.closesInDays,
    expired: false,
    valueMidUsd: value.mid,
    ...(value.text ? { value: value.text } : {}),
    scope: o.scope,
    demo: {
      ...(pursuit ? { next: pursuit.next } : {}),
      ...(o.ava ? { ava: { to: `/ava/${o.id}` } } : {}),
    },
  };
}

function closedBid(c: ClosedPursuit): DemoBid {
  return {
    id: `closed_${c.id}`,
    opportunityId: c.id,
    title: c.title,
    agency: c.agency,
    mode: "prime",
    deadline: null,
    stage: c.stage,
    contextOverride: c.note,
    nextAction: { label: c.next.label, href: c.next.to },
    lastActivityAt: isoDaysFromNow(-c.daysAgo),
    daysLeft: null,
    expired: false,
    valueMidUsd: c.value,
    value: money(c.value),
    scope: "fed",
    demo: { next: c.next, closedId: c.id },
  };
}

function reviewBid(review: MentorReviewSummary): DemoBid {
  const now = new Date();
  const story = review.oppKey ? getOpportunity(review.oppKey) : undefined;
  const saved = review.oppKey ? describeSaved(review.oppKey) : null;
  const value = story ? valueRange(story) : { mid: 0 };
  const lastMentorLine = review.unread
    ? `Mentor replied ${relativeTime(review.lastMessageAt, now)}.`
    : review.lastMessageAuthor === "mentor"
      ? `Mentor reviewing — replied ${relativeTime(review.lastMessageAt, now)}.`
      : "Mentor reviewing — awaiting reply.";
  return {
    id: `mentor_${review.id}`,
    opportunityId: review.oppKey ?? review.id,
    title: story?.plainTitle ?? review.title,
    agency: story?.agency ?? saved?.agency ?? "",
    mode: "prime",
    deadline: story ? isoDaysFromNow(story.closesInDays, 17) : null,
    stage: "with_mentor",
    nextAction: { label: review.unread ? "Read reply" : "Open thread", href: `/mentors/${review.id}` },
    lastActivityAt: review.lastMessageAt,
    daysLeft: story ? story.closesInDays : null,
    expired: false,
    valueMidUsd: value.mid,
    ...(value.text ? { value: value.text } : {}),
    ...(story ? { scope: story.scope } : {}),
    contextOverride: lastMentorLine,
    mentorActionOverride: {
      label: review.unread ? "Read reply" : "Open thread",
      reviewId: review.id,
      primary: review.unread,
    },
    demo: story?.ava ? { ava: { to: `/ava/${story.id}` } } : undefined,
  };
}

/** Every card on the board, each record once. */
export function buildDemoBoard(input: {
  saved: SavedOppDetail[];
  reviews: MentorReviewSummary[];
}): DemoBid[] {
  const savedKeys = new Set(input.saved.map((d) => d.oppKey));
  const openReviews = input.reviews.filter((r) => r.status !== "closed");
  const reviewed = new Set(openReviews.map((r) => r.oppKey).filter((k): k is string => Boolean(k)));
  const bids: DemoBid[] = [];

  // The story's pursuits.
  for (const o of OPPORTUNITIES) {
    if (!o.pursuit) continue;
    if (reviewed.has(o.id)) continue; // the review card stands for it
    // A pursuit still at "saved" leaves the board when she un-saves it.
    if (o.pursuit.stage === "saved" && !savedKeys.has(o.id)) continue;
    bids.push(storyBid(o, o.pursuit.stage, true));
  }

  for (const c of CLOSED_PURSUITS) bids.push(closedBid(c));

  // Everything else she saved: story opportunities with no pursuit, forecasts, small orders.
  const pursuitIds = new Set(OPPORTUNITIES.filter((o) => o.pursuit).map((o) => o.id));
  for (const d of input.saved) {
    if (pursuitIds.has(d.oppKey) || reviewed.has(d.oppKey)) continue;
    const story = getOpportunity(d.oppKey);
    bids.push(story ? storyBid(story, "saved", false) : savedDetailToBid(d));
  }

  for (const r of openReviews) bids.push(reviewBid(r));
  return bids;
}

/** The Hunter line above the board: the nearest bid that no mentor has seen, in the next two weeks. */
export function pickDemoNudge(
  bids: DemoBid[],
): { message: string; cta?: { label: string; href: string } } | null {
  const horizon = 14;
  const open = bids
    .filter((b) => b.daysLeft != null && b.daysLeft >= 0 && b.daysLeft <= horizon)
    .filter((b) => b.stage === "saved" || b.stage === "reviewing" || b.stage === "drafting")
    .filter((b) => !b.forecast && !b.smallOrder)
    .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number));
  const b = open[0];
  if (!b) return null;
  const short = b.title.split(" — ")[0];
  const d = b.daysLeft as number;
  return {
    message: `${short} is due in ${d} ${d === 1 ? "day" : "days"} and no mentor has read it yet. Want Sarah to look at it now?`,
    cta: { label: "Send to a mentor", href: `/opportunities/${b.opportunityId}` },
  };
}

