// @vitest-environment jsdom
//
// The backdrop sits behind the Pilot upsell blur. It used to render twelve mock
// `OpportunityCard`s — invented agencies, titles, values and deadlines shown to
// a paying member. Two properties are asserted here, and both are the feature:
//
//   1. Nothing it renders can be read as a contract (feature 7(b)).
//   2. Mounting it fires no request (feature 7(c)). That guarantee was a comment
//      in the module header; a comment does not fail when somebody adds a hook.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { LockedOpportunitiesBackdrop } from "./LockedOpportunitiesBackdrop";

/** A dollar figure: `$` followed by a digit, with or without grouping. */
const MONEY_RE = /\$\s?\d/;
/** A date a member could read as a deadline — numeric, ISO, or month-name. */
const DEADLINE_RE =
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2})\b/;
/** Agency words the mock dataset puts on every card. */
const AGENCY_RE = /\b(Department|Agency|Administration|Bureau|Command|Corps|GSA|VA|DLA|USDA)\b/;

describe("LockedOpportunitiesBackdrop", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn(() => Promise.reject(new Error("the backdrop must not fetch")));
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders no agency name, dollar figure or deadline", () => {
    const { container } = render(<LockedOpportunitiesBackdrop />);
    const text = container.textContent ?? "";

    expect(text).not.toMatch(AGENCY_RE);
    expect(text).not.toMatch(MONEY_RE);
    expect(text).not.toMatch(DEADLINE_RE);
  });

  it("gives the placeholder rows no text at all", () => {
    // Geometry only. A row that grew a label would be a fabricated one.
    const { container } = render(<LockedOpportunitiesBackdrop />);
    const rows = container.querySelectorAll(".locked-backdrop__row");

    expect(rows.length).toBe(12);
    for (const row of rows) {
      expect(row.textContent).toBe("");
      expect(row.querySelectorAll(".locked-backdrop__bar").length).toBeGreaterThan(1);
    }
  });

  it("hides the whole backdrop from assistive technology", () => {
    // It is decoration behind a gate. The upsell panel carries the accessible
    // content; twelve empty bars announced to a screen reader are noise.
    const { container } = render(<LockedOpportunitiesBackdrop />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows no tab badge, because it has counted nothing", () => {
    const { container } = render(<LockedOpportunitiesBackdrop />);
    expect(container.querySelectorAll(".opps-tab-count").length).toBe(0);
  });

  it("fires no network request when it mounts", () => {
    render(<LockedOpportunitiesBackdrop />);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
