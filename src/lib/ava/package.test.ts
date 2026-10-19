// Page 3, "Build and submit": the package model. The page is the files she
// sends, every spot sits where it lands, and the top number is the page 2 count.

import { describe, expect, test } from "vitest";
import { effectiveBid, sectionParagraphs, visibleAsks } from "./derive";
import { AVA_BIDS } from "./fixtures";
import { cumberlandBid } from "./fixtures/cumberland";
import {
  bidModel,
  decisionCount,
  locate,
  nextSpot,
  notInFiles,
  packageParts,
  partLabel,
  partSpots,
  tally,
  topState,
} from "./package";
import { complianceItems, needsYouNow } from "./pages";
import { decisionKey, emptyState, type BidState } from "./store";
import { completeState } from "./testLab";
import type { AvaBid } from "./types";

const BIDS = Object.values(AVA_BIDS);

function confirmed(): BidState {
  return { ...emptyState(), started: true, briefConfirmed: true };
}

/** Every other visible ask answered, as the lab would. */
function halfway(bid: AvaBid): BidState {
  const full = completeState(bid);
  const s = confirmed();
  const answers: BidState["answers"] = {};
  visibleAsks(bid, s).forEach((a, i) => {
    if (i % 2 === 0 && full.answers[a.id]) answers[a.id] = full.answers[a.id];
  });
  return { ...s, answers };
}

function model(fixture: AvaBid, s: BidState) {
  const bid = effectiveBid(fixture, s);
  const m = bidModel(bid, s);
  return { bid, m, top: topState(fixture, bid, s, m) };
}

describe("page 3: the package", () => {
  test("a file name reads as the part she sends", () => {
    // DEMO: the member on stage's name closes the file name.
    const name = BIDS[0].samLegalName.replace(/\s+LLC$/, "").replace(/[^A-Za-z]/g, "");
    expect(partLabel(BIDS[0], `1_Proposal_${name}.pdf`)).toBe("Proposal");
    expect(partLabel(BIDS[0], `4_Certificates_${name}.pdf`)).toBe("Certificates");
  });

  test("copies of the original are not parts of their own", () => {
    const parts = packageParts(cumberlandBid);
    const names = parts.map((p) => p.file.name);
    expect(names.some((n) => /copy/i.test(n))).toBe(false);
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length);
  });

  test("one answer is one paper slot", () => {
    for (const bid of BIDS) {
      for (const pc of packageParts(bid).flatMap((p) => p.pieces)) {
        const asks = (pc.papers ?? []).map((x) => x.askId);
        expect(new Set(asks).size).toBe(asks.length);
      }
    }
  });

  test("no piece appears in two parts", () => {
    for (const bid of BIDS) {
      const ids = packageParts(bid).flatMap((p) => p.pieces.map((pc) => pc.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("page 3: the count and the spots", () => {
  for (const bid of BIDS) {
    for (const [label, make] of [
      ["nothing answered", confirmed],
      ["halfway", () => halfway(bid)],
    ] as const) {
      test(`${bid.noticeId}, ${label}: the top number is the page 2 count`, () => {
        const s = make();
        const { m, top } = model(bid, s);
        const count = needsYouNow(complianceItems(effectiveBid(bid, s), s)).length;
        expect(count).toBeGreaterThan(0);
        expect(top.kind).toBe("building");
        if (top.kind === "building") expect(top.answers).toBe(count);
        expect(m.items.length).toBeGreaterThan(0);
      });

      test(`${bid.noticeId}, ${label}: every open answer is on the page or named as not in the files`, () => {
        const s = make();
        const { m } = model(bid, s);
        const open = new Set(
          Object.values(m.spots)
            .flat()
            .filter((x) => x.open)
            .map((x) => x.key),
        );
        const away = new Set(notInFiles(m).map((i) => i.id));
        for (const it of needsYouNow(m.items)) {
          const key = it.commitmentId
            ? `promise:${it.commitmentId}`
            : it.id === "price"
              ? "price"
              : it.askId
                ? `ask:${it.askId}`
                : null;
          expect(open.has(key ?? "") || away.has(it.id)).toBe(true);
        }
      });

      test(`${bid.noticeId}, ${label}: the next spot is open, and none is due sooner`, () => {
        const s = make();
        const { m, top } = model(bid, s);
        const next = nextSpot(m, false);
        expect(next).not.toBeNull();
        expect(next!.spot.open).toBe(true);
        if (top.kind === "building") expect(top.next?.spot.key).toBe(next!.spot.key);
        const due = next!.spot.decideBy?.getTime();
        if (due !== undefined) {
          for (const sp of Object.values(m.spots).flat()) {
            if (!sp.open || sp.kind === "finding" || sp.kind === "reviewer") continue;
            if (sp.decideBy) expect(sp.decideBy.getTime()).toBeGreaterThanOrEqual(due);
          }
        }
        // The top button goes to the piece the spot is at home on.
        expect(locate(m, next!.spot.key)?.pieceId).toBe(next!.pieceId);
      });

      test(`${bid.noticeId}, ${label}: the parts and "not in the files" add up to the top number`, () => {
        const s = make();
        const { m, top } = model(bid, s);
        // A shared answer counts in each part it fills, so count each once here.
        const keys = new Set(
          m.parts.flatMap((part) =>
            partSpots(m, part)
              .filter(
                (x) =>
                  x.open && x.kind !== "finding" && x.kind !== "reviewer" && x.kind !== "decision",
              )
              .map((x) => x.key),
          ),
        );
        const perPart = m.parts.map((part) => tally(partSpots(m, part)).answers);
        expect(perPart.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(keys.size);
        if (top.kind === "building") expect(keys.size + notInFiles(m).length).toBe(top.answers);
      });
    }
  }

  test("with every answer in, the top line is about fixes or sending", () => {
    for (const bid of BIDS) {
      const s = { ...completeState(bid), started: true, briefConfirmed: true };
      const { top } = model(bid, s);
      expect(["fixing", "ready"]).toContain(top.kind);
    }
  });
});

describe("the final build: Ava's decisions", () => {
  /** Every answer in, nothing fixed, nothing decided: the demo's "Reviewing". */
  const reviewing = (bid: AvaBid): BidState => ({
    ...completeState(bid),
    fixes: {},
    checklist: {},
    decisions: {},
  });
  const seeded = BIDS.filter((b) => b.sections.some((x) => (x.decisions ?? []).length > 0));

  test("some sample bids have decisions to show", () => {
    expect(seeded.length).toBeGreaterThan(0);
  });

  for (const fixture of seeded) {
    test(`${fixture.noticeId}: every decision's words are in its paragraph, as a spot`, () => {
      const s = reviewing(fixture);
      const { m } = model(fixture, s);
      for (const sec of fixture.sections) {
        for (const d of sec.decisions ?? []) {
          const words = sectionParagraphs(s, sec)
            [d.paragraphIndex].filter((sp) => sp.decisionId === d.id)
            .map((sp) => sp.text)
            .join("");
          expect(words).toBe(d.choice);
          const spot = m.spots[`sec:${sec.id}`]?.find(
            (x) => x.key === `decision:${decisionKey(sec.id, d.id)}`,
          );
          expect(spot?.open).toBe(true);
        }
      }
    });

    test(`${fixture.noticeId}: the other words, or her own, take the place of Ava's`, () => {
      const sec = fixture.sections.find((x) => (x.decisions ?? []).length > 0)!;
      const d = sec.decisions![0];
      const key = decisionKey(sec.id, d.id);
      const read = (s: BidState) =>
        sectionParagraphs(s, sec)
          [d.paragraphIndex].map((sp) => sp.text)
          .join("");
      const base = reviewing(fixture);
      expect(read(base)).toContain(d.choice);
      const other = read({ ...base, decisions: { [key]: { pick: "other", at: "" } } });
      expect(other).toContain(d.other);
      expect(other).not.toContain(d.choice);
      const own = read({
        ...base,
        decisions: { [key]: { pick: "own", text: "We cook every meal fresh.", at: "" } },
      });
      expect(own).toContain("We cook every meal fresh.");
      expect(own).not.toContain(d.choice);
    });
  }

  for (const fixture of BIDS) {
    test(`${fixture.noticeId}: deciding and fixing move the count to done, never out of it`, () => {
      let s = reviewing(fixture);
      const first = model(fixture, s);
      const start = decisionCount(first.bid, s, first.m);
      expect(start.done).toBeLessThanOrEqual(start.total);
      // Make every decision, apply every fix, approve the price: the lab's
      // finished state, with every risk left as it is.
      s = completeState(fixture);
      const end = model(fixture, s);
      const after = decisionCount(end.bid, s, end.m);
      expect(after.total).toBe(start.total);
      expect(after.done).toBeGreaterThanOrEqual(start.done);
      for (const sec of fixture.sections) {
        for (const d of sec.decisions ?? []) {
          const spot = end.m.spots[`sec:${sec.id}`]?.find(
            (x) => x.key === `decision:${decisionKey(sec.id, d.id)}`,
          );
          expect(spot?.open).toBe(false);
        }
      }
    });

    test(`${fixture.noticeId}: the next decision is open, and the price comes last`, () => {
      const s = reviewing(fixture);
      const { bid, m } = model(fixture, s);
      const c = decisionCount(bid, s, m);
      if (c.done === c.total) {
        expect(c.next).toBeNull();
        return;
      }
      expect(c.next?.spot.open).toBe(true);
      const others = Object.values(m.spots)
        .flat()
        .filter((x) => x.open && x.kind !== "price" && x.kind !== "ask" && x.kind !== "promise");
      if (others.length > 0) expect(c.next?.spot.kind).not.toBe("price");
    });
  }
});
