// The Grant chat dock on a window 768 to 1199 px wide.
//
// In that range the dock is a fixed overlay: `top: 3px; bottom: 0; height: auto`.
// The base `.grant-dock` rule sets `align-self: flex-start` for the sticky
// column on wide screens. A fixed box obeys `align-self` too, so with
// `flex-start` it takes its content height and sits at the top. A member on a
// 1184 px Safari window saw the chat shrink to the top right with empty page
// under it. The tablet rule must reset `align-self`, so the dock fills the
// space between `top` and `bottom`. jsdom does no layout, so this test reads
// the rule itself.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const TABLET_MEDIA = "@media (max-width: 1199px) and (min-width: 768px)";

describe("the Grant dock between 768 and 1199 px wide", () => {
  it("resets align-self so the fixed dock fills the window height", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/components.css"), "utf8");
    const start = css.indexOf(TABLET_MEDIA);
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf("\n}", start));
    const rule = /\.grant-dock\s*\{([^}]*)\}/.exec(block)?.[1] ?? "";

    expect(rule).toMatch(/position:\s*fixed/);
    expect(rule).toMatch(/align-self:\s*(auto|stretch)/);
  });
});
