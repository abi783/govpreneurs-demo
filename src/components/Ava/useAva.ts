// One hook for every Ava view: the fixture, the member's state, Grant's read,
// and the effective bid (Grant's results laid on, every received addendum
// applied). Views never build their own.

import { useMemo } from "react";
import { useLiveSlice } from "../../lib/eventBus";
import { grantFacts } from "../../demo/ava/grantFacts";
import { effectiveBid } from "../../lib/ava/derive";
import { getAvaBid } from "../../lib/ava/fixtures";
import { withGrantFor, type GrantView } from "../../lib/ava/grant";
import { getBidState, type BidState } from "../../lib/ava/store";
import type { AvaBid } from "../../lib/ava/types";

export interface AvaContext {
  /** The bid as Ava first read it, with Grant's results laid on. */
  fixture: AvaBid;
  /** The bid as the current files define it (addenda applied). Render this. */
  bid: AvaBid;
  /** The member's state, with the answers they already gave Grant. */
  s: BidState;
  id: string;
  /** Grant's read of this bid. Null when Grant has not read it yet. */
  grant: GrantView | null;
}

export function useAvaState(noticeId: string): BidState {
  return useLiveSlice("ava", () => getBidState(noticeId));
}

export function useAva(noticeId: string): AvaContext | null {
  const raw = useAvaState(noticeId);
  const told = useLiveSlice("ava", () => grantFacts(noticeId));
  const base = getAvaBid(noticeId);
  return useMemo(() => {
    if (!base) return null;
    const { fixture, s, grant } = withGrantFor(noticeId, base, raw, told);
    return { fixture, bid: effectiveBid(fixture, s), s, id: noticeId, grant };
  }, [base, raw, told, noticeId]);
}
