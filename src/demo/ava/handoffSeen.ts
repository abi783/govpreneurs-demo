// DEMO: the bids that Ava has been handed but not yet read.
//
// Four bids in the story are fully built (src/lib/ava/fixtures). Any other
// opportunity opens Ava's handoff page: she is reading the buyer's files, or
// she needs them. When the visitor opens one, it joins "Bids Ava is building",
// so the list says what the handoff page says ("on your list of bids").
//
// Two keys in the demo store: which handoffs were opened, in order, and what
// the visitor did on each (the files she added, whether Ava should tell her).

import { readDemoState, updateDemoState } from "../runtime/store";

/** What the visitor did on one handoff page. */
export interface HandoffState {
  files: string[];
  notify: boolean;
}

export const NO_HANDOFF: HandoffState = { files: [], notify: false };

/** The store key of `Record<noticeId, HandoffState>`. */
export const HANDOFF_STATE_KEY = "ava.handoff";

/** The store key of the notice numbers whose handoff page was opened. */
export const HANDOFF_SEEN_KEY = "ava.handoffSeen";

/** Remember that this handoff page was opened. */
export function noteHandoff(noticeId: string): void {
  if (readDemoState<string[]>(HANDOFF_SEEN_KEY, []).includes(noticeId)) return;
  updateDemoState<string[]>(HANDOFF_SEEN_KEY, [], (prev) => [...prev, noticeId]);
}
