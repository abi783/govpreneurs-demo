// Grant decides, Ava builds — the rules the hand-over promises.
//
//   bun test src/lib/ava
//
// Ava shows Grant's checks, warnings and real deadline as his; a rule Grant
// judged takes his result; an answer the member gave Grant is never asked
// again; a rule the member cannot meet reaches Grant, and the call is his.

import { afterEach, describe, expect, test } from "vitest";
import {
  grantFacts,
  PROOF_FACT,
  resetGrantFacts,
  tellGrant,
  tellGrantCantMeet,
} from "../../demo/ava/grantFacts";
import { dueDay, effectiveBid } from "./derive";
import { AVA_BIDS } from "./fixtures";
import { cumberlandBid } from "./fixtures/cumberland";
import { fayettevilleBid } from "./fixtures/fayetteville";
import { mackallBid, mackallSeed } from "./fixtures/mackall";
import { NO_GRANT_KEY, grantView, withGrantFor } from "./grant";
import { complianceItems, needsYouNow } from "./pages";
import { buildingItems } from "./status";
import { emptyState, type BidState } from "./store";
import { completeState } from "./testLab";
import type { AvaBid } from "./types";

const BIDS = Object.values(AVA_BIDS);

function confirmed(): BidState {
  return { ...emptyState(), started: true, briefConfirmed: true };
}

/** The bid every page reads: Grant's results laid on, addenda applied. */
function onPages(bid: AvaBid, s: BidState) {
  const g = withGrantFor(bid.noticeId, bid, s);
  return { ...g, bid: effectiveBid(g.fixture, g.s) };
}

afterEach(() => {
  for (const bid of BIDS) resetGrantFacts(bid.noticeId);
});

describe("Grant's read, shown as his", () => {
  test("every sample bid has Grant's call, checks, warnings and real deadline", () => {
    for (const bid of BIDS) {
      const g = grantView(bid.noticeId, confirmed(), grantFacts(bid.noticeId));
      expect(g).not.toBeNull();
      // The story's call on each of the four bids is Bid (for the sources sought,
      // "Reply": Grant's call is still Bid, and the card says what to do).
      expect(g!.call).toBe("Bid");
      expect(g!.checks.length).toBeGreaterThan(0);
      // A reply carries no bid risk, so Grant may have no warnings for it.
      if (bid.kind !== "reply") expect(g!.warnings.length).toBeGreaterThan(0);
      // One deadline, Grant's: before the due date by the time the bid takes.
      expect(g!.realDeadline.getTime()).toBeLessThan(dueDay(bid).getTime());
      expect(g!.takes.length).toBeGreaterThan(0);
    }
  });

  test("Ava's sample bids carry no Mentor advice of their own", () => {
    for (const bid of BIDS) {
      expect(bid.mentor.recommended).toBe(false);
      expect(bid.mentor.reasons).toEqual([]);
    }
  });

  test("every rule tied to Grant names a row Grant really checks", () => {
    for (const bid of BIDS) {
      const g = grantView(bid.noticeId, confirmed(), grantFacts(bid.noticeId))!;
      for (const r of bid.hardRequirements.filter((x) => x.grantRow)) {
        expect(g.checks.map((c) => c.id)).toContain(r.grantRow!);
      }
    }
  });

  test("a rule Grant checks, with nothing to collect, takes his result and his words", () => {
    const { bid } = onPages(mackallBid, { ...emptyState(), ...mackallSeed } as BidState);
    const sam = bid.hardRequirements.find((r) => r.id === "mk-r-sam")!;
    expect(sam.initial).toBe("meets");
    // DEMO: the SAM end date is relative to today (persona.ts samActiveUntil).
    expect(sam.evidence).toMatch(/^Grant checked this: Active until \d{1,2} [A-Z][a-z]+ \d{4}\.$/);
  });

  test("with no read from Grant, Ava judges nothing it would have taken from him", () => {
    const s = {
      ...emptyState(),
      ...mackallSeed,
      fixes: { [NO_GRANT_KEY]: true as const },
    } as BidState;
    const g = withGrantFor(mackallBid.noticeId, mackallBid, s);
    expect(g.grant).toBeNull();
    const sam = g.fixture.hardRequirements.find((r) => r.id === "mk-r-sam")!;
    expect(sam.initial).toBe("confirm");
    expect(sam.evidence).toBe("Grant has not checked this yet.");
  });
});

describe("never asked twice", () => {
  test("an answer the member gave Grant answers the same ask in Ava", () => {
    tellGrant(fayettevilleBid.noticeId, "fy-site", "Yes");
    const { s } = onPages(fayettevilleBid, confirmed());
    expect(s.answers["ask-site-visit"]?.fromGrant).toBe("Yes");
    const { bid } = onPages(fayettevilleBid, confirmed());
    const row = complianceItems(bid, s).find((i) => i.id === "ask:ask-site-visit")!;
    expect(row.status).not.toBe("need");
    expect(row.grantNote).toBe("You told Grant: Yes.");
  });

  test("an ask that needs a file keeps asking, and says what the member told Grant", () => {
    tellGrant(cumberlandBid.noticeId, "cc-deposit", "Yes");
    const { bid, s } = onPages(cumberlandBid, confirmed());
    const row = complianceItems(bid, s).find((i) => i.id === "ask:ask-bid-bond")!;
    expect(row.status).toBe("need");
    expect(row.grantNote).toBe("You told Grant: Yes.");
  });

  test("the one count holds with Grant's results laid on", () => {
    tellGrant(fayettevilleBid.noticeId, "fy-site", "Yes");
    for (const bid of BIDS) {
      for (const raw of [confirmed(), completeState(bid)]) {
        const p = onPages(bid, raw);
        expect(needsYouNow(complianceItems(p.bid, p.s)).length).toBe(buildingItems(p.bid, p.s));
      }
    }
  });
});

describe("the call stays Grant's", () => {
  test("a rule the member cannot meet reaches Grant, and he says No Bid", () => {
    tellGrantCantMeet(fayettevilleBid.noticeId, "Mandatory site visit, 11 May 2026 at 10:00 AM");
    const g = grantView(
      fayettevilleBid.noticeId,
      confirmed(),
      grantFacts(fayettevilleBid.noticeId),
    )!;
    expect(g.call).toBe("No Bid");
    expect(g.cantMeet).toEqual(["Mandatory site visit, 11 May 2026 at 10:00 AM"]);
    tellGrantCantMeet(fayettevilleBid.noticeId, null);
    const back = grantView(
      fayettevilleBid.noticeId,
      confirmed(),
      grantFacts(fayettevilleBid.noticeId),
    )!;
    expect(back.call).toBe("Bid");
  });

  test("proof the member gives Ava settles Grant's row", () => {
    tellGrant(cumberlandBid.noticeId, `${PROOF_FACT}gc-permit`, "Your permit, uploaded to Ava");
    const g = grantView(cumberlandBid.noticeId, confirmed(), grantFacts(cumberlandBid.noticeId))!;
    const permit = g.checks.find((c) => c.id === "gc-permit")!;
    expect(permit.status).toBe("have");
    expect(permit.found).toBe("Your permit, uploaded to Ava");
  });
});
