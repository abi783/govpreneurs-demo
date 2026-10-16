// @vitest-environment jsdom
//
// The intro is where a member learns the three words the rest of the page uses.
// Two properties are asserted here, and both are the feature:
//
//   1. The figure is real or it is absent (V2(b)). A count we do not hold yet
//      is never a zero, a dash, or a rounded claim.
//   2. Bid, Review and No Bid each resolve a gloss (V2(c)). `GlossTerm` renders
//      a bare span when the lookup misses, so the three `LABEL_GLOSS` entries
//      are load-bearing rather than decorative.
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { FeedIntro } from "./feedIntroCopy";
import { glossFor } from "../../lib/filterGlosses";

afterEach(cleanup);

/** A count the Explore feed could really report. Not the prototype's figure. */
const LOADED_COUNT = 41207;
/** The three verdict words the sentence teaches. */
const VERDICT_TERMS = ["Bid", "Review", "No Bid"];

describe("FeedIntro", () => {
  it("puts a loaded count in the mono treatment the rest of the page uses", () => {
    const { container } = render(<FeedIntro count={LOADED_COUNT} />);

    expect(container.querySelector(".of-num")?.textContent).toBe("41,207");
    expect(container.textContent).toContain("Hunter scans");
  });

  it("omits the figure entirely when the count is not known — no zero, no dash", () => {
    const { container } = render(<FeedIntro count={null} />);
    const text = container.textContent ?? "";

    expect(container.querySelector(".of-num")).toBeNull();
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/[—–]/);
    expect(text).toContain("Hunter reads every federal and state/local (SLED) opportunity");
  });

  it("teaches Bid, Review and No Bid in both states", () => {
    for (const count of [LOADED_COUNT, null]) {
      const { container } = render(<FeedIntro count={count} />);
      const terms = Array.from(container.querySelectorAll(".gloss-term")).map(
        (el) => el.textContent,
      );

      expect(terms).toEqual(VERDICT_TERMS);
      cleanup();
    }
  });

  it("resolves a non-empty gloss for each of the three verdict words", () => {
    // A GlossTerm with no gloss renders a plain span and teaches nothing, so
    // the lookup is the feature and not the markup.
    for (const term of VERDICT_TERMS) {
      expect(glossFor(term) ?? "").not.toBe("");
    }
  });
});
