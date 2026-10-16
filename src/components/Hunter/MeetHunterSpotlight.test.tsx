// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { MeetHunterSpotlight } from "./MeetHunterSpotlight";

const HUNTER_NAME = "Hunter, your discovery agent";

beforeEach(() => {
  cleanup();
});

describe("MeetHunterSpotlight portrait", () => {
  it("renders the 96px Hunter portrait with its accessible name", () => {
    render(<MeetHunterSpotlight onDismiss={vi.fn()} />);

    // `getByRole` skips an `aria-hidden` subtree, so this also proves the
    // avatar cell no longer hides the portrait from assistive technology.
    const portrait = screen.getByRole("img", { name: HUNTER_NAME });
    expect(portrait.classList.contains("agent-avatar--96")).toBe(true);
  });
});

describe("MeetHunterSpotlight portrait styles", () => {
  const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

  it("carries an .agent-avatar--96 rule that is 96px wide and 96px high", () => {
    expect(css).toMatch(/^\.agent-avatar--96\s*\{[^}]*width:\s*96px[^}]*height:\s*96px/m);
  });
});
