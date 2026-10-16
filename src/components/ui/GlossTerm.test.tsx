// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { glossFor } from "../../lib/filterGlosses";
import { GlossTerm } from "./GlossTerm";

// The ResizeObserver stub Radix needs lives in src/test/vitest.setup.ts.

// "Notice type" is a LABEL_GLOSS key. "Weekly pizza" is not a term this app knows.
const GLOSSED_TERM = "Notice type";
const PLAIN_TERM = "Weekly pizza";

/** Renders the component and returns the trigger element, which may be plain. */
function renderTerm(term: string) {
  const { container } = render(<GlossTerm term={term} />);
  return container;
}

beforeEach(() => {
  cleanup();
});

describe("GlossTerm", () => {
  it("marks a term that has a gloss as a focusable, described trigger", async () => {
    const container = renderTerm(GLOSSED_TERM);
    const trigger = container.querySelector(".gloss-term");

    expect(trigger).toBeInstanceOf(HTMLElement);
    expect((trigger as HTMLElement).tabIndex).toBe(0);
    const describedBy = trigger?.getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");

    // The description only exists while the tooltip is open, so open it and
    // check that the id the trigger points at is the tooltip's own id.
    fireEvent.focus(trigger as HTMLElement);
    await waitFor(() => expect(document.getElementById(describedBy)).not.toBeNull());
    expect(document.getElementById(describedBy)?.textContent).toContain(glossFor(GLOSSED_TERM));
  });

  it("renders a term that has no gloss as plain text", () => {
    const container = renderTerm(PLAIN_TERM);

    expect(glossFor(PLAIN_TERM)).toBeUndefined();
    expect(container.querySelector(".gloss-term")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect(screen.getByText(PLAIN_TERM)).toBeInstanceOf(HTMLElement);
  });

  it("reveals the gloss when the keyboard focuses the trigger", async () => {
    const gloss = glossFor(GLOSSED_TERM) ?? "";
    expect(gloss).not.toBe("");
    const container = renderTerm(GLOSSED_TERM);
    const trigger = container.querySelector(".gloss-term") as HTMLElement;

    expect(document.body.textContent).not.toContain(gloss);
    fireEvent.focus(trigger);

    await waitFor(() => expect(screen.getAllByText(gloss).length).toBeGreaterThan(0));
  });

  it("reveals the gloss when a touch pointer taps the trigger", async () => {
    const gloss = glossFor(GLOSSED_TERM) ?? "";
    const container = renderTerm(GLOSSED_TERM);
    const trigger = container.querySelector(".gloss-term") as HTMLElement;

    fireEvent.pointerDown(trigger, { pointerType: "touch" });
    fireEvent.click(trigger);

    await waitFor(() => expect(screen.getAllByText(gloss).length).toBeGreaterThan(0));
  });

  it("renders the given children in place of the term", () => {
    render(
      <GlossTerm term={GLOSSED_TERM}>
        <span>Notice</span>
      </GlossTerm>,
    );

    expect(screen.getByText("Notice")).toBeInstanceOf(HTMLElement);
  });
});

describe("gloss term styles", () => {
  // Vitest resolves the project root as the working directory.
  const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

  it("carries a .gloss-term rule and a .gloss-term:focus-visible rule", () => {
    expect(css).toMatch(/^\.gloss-term\s*\{/m);
    expect(css).toMatch(/^\.gloss-term:focus-visible\s*\{/m);
  });
});
