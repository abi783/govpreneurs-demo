// DEMO (presenter control C3): the 11 segments of the 10-minute story, and the
// jump that puts the whole demo at a segment's starting point.
//
// A jump wipes every store, writes what that segment needs (Ava's draft read,
// the hero bid sent), then loads the segment's page. It is for recovering from
// a mis-click and for resetting the booth between visitors, not the main path:
// on a call Tim clicks through the real screens.

import { avaDemo } from "@/lib/ava/store";
import { ready, reading } from "@/lib/ava/play";
import { readDemoState, wipeDemoStorage, writeDemoState } from "@/demo/runtime/store";
import { HERO_IDS } from "@/demo/story/opportunities";
import { MEMBER_KEY, type MemberId } from "@/demo/member";

export interface Segment {
  n: number;
  label: string;
  to: string;
  /** State the segment starts from, written after the wipe. */
  seed?: () => void;
}

const HERO = HERO_IDS.hero;

/** Ava has built the hero bid and she is reading it. */
function heroDrafted(): void {
  avaDemo.load(HERO, reading(ready(HERO)));
}

export const SEGMENTS: Segment[] = [
  { n: 1, label: "Open", to: "/pipeline" },
  { n: 2, label: "My Business", to: "/my-business" },
  { n: 3, label: "Find", to: "/opportunities" },
  { n: 4, label: "Say no", to: `/opportunities/${HERO_IDS.twin}` },
  { n: 5, label: "Decide", to: `/opportunities/${HERO}` },
  { n: 6, label: "Mentor", to: `/opportunities/${HERO}` },
  { n: 7, label: "Ava asks", to: `/ava/${HERO}` },
  { n: 8, label: "Send", to: `/ava/${HERO}`, seed: heroDrafted },
  {
    n: 9,
    label: "Win",
    to: "/pipeline",
    seed: () => avaDemo.load(HERO, { ...reading(ready(HERO)), sentAt: new Date().toISOString() }),
  },
  { n: 10, label: "4 ways in", to: "/small-orders" },
  { n: 11, label: "Close", to: "/" },
];

/** Where the booth rests between visitors: Hunter's feed explains itself. */
export const IDLE_ROUTE = "/opportunities";

const BOOTH_KEY = "presenter.booth";

export function boothModeOn(): boolean {
  return readDemoState<boolean>(BOOTH_KEY, false);
}

export function setBoothMode(on: boolean): void {
  writeDemoState(BOOTH_KEY, on);
}

/** Switch the sample member: wipe the demo and start the story again on Success Center. */
export function switchMember(id: MemberId): void {
  const booth = boothModeOn();
  wipeDemoStorage();
  window.sessionStorage.setItem(MEMBER_KEY, id);
  if (booth) setBoothMode(true);
  window.location.assign("/");
}

/** Wipe the demo, seed this segment, and load its page. Booth mode survives the wipe. */
export function jumpTo(segment: Segment | null, route = segment?.to ?? IDLE_ROUTE): void {
  const booth = boothModeOn();
  const fast = new URLSearchParams(window.location.search).get("fast") === "1";
  wipeDemoStorage();
  segment?.seed?.();
  if (booth) setBoothMode(true);
  window.location.assign(fast ? `${route}${route.includes("?") ? "&" : "?"}fast=1` : route);
}
