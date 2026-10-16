// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { OpportunitiesTabs } from "./OpportunitiesTabs";

afterEach(cleanup);

const noop = () => {};

/** Every tab button in DOM order, read by class — `getByRole("tab")` finds
 *  nothing here, because the strip uses `aria-pressed` buttons. */
function tabButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll(".opps-tab"));
}

describe("OpportunitiesTabs", () => {
  it("labels the three tabs as the prototype does", () => {
    render(
      <OpportunitiesTabs tab="for_you" onChange={noop} openCount={3} allCount={9} savedCount={2} />,
    );
    expect(tabButtons().map((b) => b.querySelector(".opps-tab-label")?.textContent)).toEqual([
      "Opportunities for you",
      "All opportunities",
      "Saved",
    ]);
  });

  it("renders a count badge on all three tabs when every count is a number", () => {
    render(
      <OpportunitiesTabs tab="for_you" onChange={noop} openCount={3} allCount={9} savedCount={2} />,
    );
    expect(tabButtons().map((b) => b.querySelector(".opps-tab-count")?.textContent)).toEqual([
      "3",
      "9",
      "2",
    ]);
  });

  it("renders NO badge for a count that is not known yet — never a zero", () => {
    render(
      <OpportunitiesTabs
        tab="for_you"
        onChange={noop}
        openCount={null}
        allCount={null}
        savedCount={null}
      />,
    );
    expect(document.querySelectorAll(".opps-tab-count")).toHaveLength(0);
    expect(document.body.textContent ?? "").not.toMatch(/\b0\b/);
  });

  it("renders a badge for a real zero — a measured zero is not an unknown", () => {
    render(
      <OpportunitiesTabs tab="all" onChange={noop} openCount={null} allCount={0} savedCount={0} />,
    );
    expect(
      Array.from(document.querySelectorAll(".opps-tab-count")).map((n) => n.textContent),
    ).toEqual(["0", "0"]);
  });

  it("marks only the active tab pressed", () => {
    render(
      <OpportunitiesTabs tab="saved" onChange={noop} openCount={1} allCount={1} savedCount={1} />,
    );
    expect(tabButtons().map((b) => b.getAttribute("aria-pressed"))).toEqual([
      "false",
      "false",
      "true",
    ]);
  });

  it("renders no awarded tab", () => {
    render(
      <OpportunitiesTabs tab="for_you" onChange={noop} openCount={1} allCount={1} savedCount={1} />,
    );
    expect(tabButtons()).toHaveLength(3);
    expect(screen.queryByText(/awarded/i)).toBeNull();
  });
});
