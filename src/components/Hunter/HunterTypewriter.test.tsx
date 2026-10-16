// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { HunterTypewriter } from "./HunterTypewriter";

let reduceMotion = false;

function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduceMotion,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

describe("HunterTypewriter", () => {
  beforeEach(() => {
    reduceMotion = false;
    mockMatchMedia();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("reveals text progressively and calls onDone when finished", () => {
    const onDone = vi.fn();
    const text = "You're a strong fit for this opportunity.";
    const { container } = render(<HunterTypewriter text={text} onDone={onDone} />);

    expect(container.textContent).toBe(""); // nothing shown before the first frame
    act(() => vi.advanceTimersByTime(16));
    expect(container.textContent!.length).toBeGreaterThan(0);
    expect(container.textContent!.length).toBeLessThan(text.length);

    act(() => vi.advanceTimersByTime(2500));
    expect(container.textContent).toBe(text);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("never takes longer than the ~1.3s ceiling even for a vast reply", () => {
    const onDone = vi.fn();
    const text = "x".repeat(4000);
    const { container } = render(<HunterTypewriter text={text} onDone={onDone} />);

    act(() => vi.advanceTimersByTime(1300)); // the hard ceiling
    expect(container.textContent).toBe(text);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("renders instantly (no animation) under prefers-reduced-motion", () => {
    reduceMotion = true;
    mockMatchMedia();
    const onDone = vi.fn();
    const text = "Instant, please.";
    const { container } = render(<HunterTypewriter text={text} onDone={onDone} />);

    expect(container.textContent).toBe(text); // full text without advancing timers
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
