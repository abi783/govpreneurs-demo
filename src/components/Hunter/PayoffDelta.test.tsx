// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PayoffDelta } from "./PayoffDelta";

afterEach(cleanup);

describe("PayoffDelta", () => {
  it("shows the unlocked gain and the sharpened count when both are present", () => {
    render(<PayoffDelta delta={{ unlocked: 9, sharpened: 4 }} />);
    expect(screen.getByText("+9 unlocked")).toBeTruthy();
    expect(screen.getByText("4 got stronger")).toBeTruthy();
  });

  it("omits the sharpened clause entirely when nothing moved up a tier", () => {
    render(<PayoffDelta delta={{ unlocked: 3, sharpened: 0 }} />);
    expect(screen.getByText("+3 unlocked")).toBeTruthy();
    expect(screen.queryByText(/got stronger/)).toBeNull();
  });

  it("states the plain fact on a zero delta — never a hollow '+0 unlocked'", () => {
    render(<PayoffDelta delta={{ unlocked: 0, sharpened: 0 }} />);
    expect(screen.getByText(/no new matches opened/i)).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/\+0 unlocked/);
    // Still no fabricated total — the original guarantee.
    expect(document.body.textContent ?? "").not.toMatch(/was/);
  });

  it("does not overclaim a benefit on a zero delta", () => {
    render(<PayoffDelta delta={{ unlocked: 0, sharpened: 0 }} />);
    // A gate answer that matched nothing gained nothing — do not tell the member
    // it 'sharpened' anything.
    expect(document.body.textContent ?? "").not.toMatch(/sharpen/i);
  });
});
