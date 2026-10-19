// @vitest-environment jsdom
// The presenter controls change only shared state, so every page agrees:
// C1 (Sarah answers), C2 (award) and C3 (jump to a segment).
import { beforeEach, describe, expect, it } from "vitest";
import { wipeDemoStorage } from "@/demo/runtime/store";
import { answerReview, createReview, getMentorReviewThread, pendingReviews } from "@/demo/state/mentorReviews";
import { awardOutcome, outcomeDetail, setAwardOutcome } from "@/demo/state/outcomes";
import { buildDemoBoard } from "@/demo/explore/pipelineBoard";
import { HERO_IDS, getOpportunity } from "@/demo/story/opportunities";
import { avaDemo } from "@/lib/ava/store";
import { ready, reading } from "@/lib/ava/play";
import { SEGMENTS } from "./segments";
import { byMember } from "@/demo/member";

const HERO = HERO_IDS.hero;
/** An opportunity with Sarah's written reply, and a word from it, per member. */
const LIVE_REVIEW = byMember({
  caterer: { oppKey: "VA247-26-R-0112", word: "Womack" },
  pack: { oppKey: "MWR-FB-27-0006", word: "posters" },
});

beforeEach(() => wipeDemoStorage());

describe("C1: Sarah answers", () => {
  it("turns a pending review into her reply, with the verdict", () => {
    const sent = createReview({ oppKey: LIVE_REVIEW.oppKey, title: "A live review", message: "Should I bid?" });
    expect(pendingReviews().map((r) => r.id)).toContain(sent.id);

    const answered = answerReview(sent.id, "pursue");
    expect(answered?.status).toBe("responded");
    expect(answered?.recommendation).toBe("pursue");
    expect(answered?.unread).toBe(true);
    expect(pendingReviews().map((r) => r.id)).not.toContain(sent.id);

    const thread = getMentorReviewThread(sent.id)!;
    const last = thread.messages[thread.messages.length - 1];
    expect(last.author).toBe("mentor");
    expect(last.bodyHtml).toContain(LIVE_REVIEW.word);
  });

  it("writes a sensible reply for an opportunity with no written one", () => {
    const sent = createReview({ oppKey: "SOME-OTHER-ID", title: "Something", message: "?" });
    const answered = answerReview(sent.id, "pass");
    expect(answered?.recommendation).toBe("pass");
    expect(getMentorReviewThread(sent.id)!.messages.at(-1)!.bodyHtml).toContain("pass");
  });
});

describe("C2: award", () => {
  it("moves a sent bid to Won on the Pipeline, with the award dialog", () => {
    avaDemo.load(HERO, { ...reading(ready(HERO)), sentAt: new Date().toISOString() });
    const before = buildDemoBoard({ saved: [], reviews: [] }).find((b) => b.opportunityId === HERO);
    expect(before?.stage).toBe("submitted");

    setAwardOutcome(HERO, "won");
    expect(awardOutcome(HERO)).toBe("won");
    const after = buildDemoBoard({ saved: [], reviews: [] }).find((b) => b.opportunityId === HERO);
    expect(after?.stage).toBe("won");
    expect(after?.demo?.closedId).toBe(HERO);
    expect(outcomeDetail(HERO)?.link?.to).toBe("/my-business");
  });

  it("leaves a bid nobody sent alone", () => {
    setAwardOutcome(HERO, "won");
    const card = buildDemoBoard({ saved: [], reviews: [] }).find((b) => b.opportunityId === HERO);
    expect(card?.stage).not.toBe("won");
  });
});

describe("C3: segments", () => {
  it("covers the 11 segments of the story, in order", () => {
    expect(SEGMENTS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("points every opportunity and Ava segment at a real story record", () => {
    for (const s of SEGMENTS) {
      const id = /^\/(?:opportunities|ava)\/(.+)$/.exec(s.to)?.[1];
      if (id) expect(getOpportunity(id), s.label).toBeTruthy();
    }
  });

  it("starts the Win segment with the hero bid sent", () => {
    SEGMENTS.find((s) => s.label === "Win")!.seed!();
    const card = buildDemoBoard({ saved: [], reviews: [] }).find((b) => b.opportunityId === HERO);
    expect(card?.stage).toBe("submitted");
  });
});
