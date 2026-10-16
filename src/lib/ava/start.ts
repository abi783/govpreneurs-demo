// Where each of the four bids starts in the demo: the story's `ava` field
// (src/demo/story/opportunities.ts), played out as real answers.
//
//   Camp Mackall field meals   "answer my questions": 3 questions wait on her.
//   Fayetteville cafe          "read": phase 2, with Sarah Mitchell's review done.
//   Cumberland detention meals "check you can bid": paused, 2 of 5 cooks have no certificate.
//   Fort Bragg reply           "ready": built, ready to read and send.
//
// Each start lives in its own file under starts/. A start is a function, so
// it is built the first time the bid is read, not when the page loads.

import type { BidState } from "./store";
import { cumberlandStart } from "./starts/cumberland";
import { fayettevilleStart } from "./starts/fayetteville";
import { fortBraggStart } from "./starts/fortBragg";
import { mackallStart } from "./starts/mackall";

const STARTS: Record<string, () => Partial<BidState>> = {
  "SP4701-26-Q-0021": mackallStart,
  "FAYNC-2026-R-08": fayettevilleStart,
  "CUMCO-2026-014": cumberlandStart,
  "W912EE-27-S-0004": fortBraggStart,
};

export function startingState(id: string): Partial<BidState> {
  return (STARTS[id] ?? (() => ({ started: true, briefConfirmed: true })))();
}
