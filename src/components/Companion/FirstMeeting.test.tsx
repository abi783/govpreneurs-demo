// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { HUNTER_OPENERS, HunterStrip, MeetHunter } from "./FirstMeeting";
import { useLiveSlice } from "../../lib/eventBus";
import { clearOnboarding, MET_HUNTER_KEY, readFlag, writeFlag } from "../../lib/onboardingStorage";

const HUNTER_NAME = "Hunter, your discovery agent";

/** Mirrors the gate in `routes/index.tsx`, so the round trip is under test. */
function FeedHead({ onAsk }: { onAsk: (q: string) => void }) {
  const metHunter = useLiveSlice("onboarding", () => readFlag(MET_HUNTER_KEY));
  return metHunter ? (
    <HunterStrip onAsk={onAsk} />
  ) : (
    <MeetHunter
      memberName="Dana"
      count={5}
      onAsk={onAsk}
      onDismiss={() => writeFlag(MET_HUNTER_KEY, true)}
    />
  );
}

beforeEach(() => {
  cleanup();
  clearOnboarding();
});

describe("MeetHunter disclosure", () => {
  it("discloses that Hunter is an AI in the first frame", () => {
    render(<MeetHunter memberName="Dana" count={5} onAsk={vi.fn()} onDismiss={vi.fn()} />);

    const heading = screen.getByRole("heading", { name: /Hunter/ });
    const badge = heading.querySelector(".meet__isai");
    expect(badge?.textContent).toBe("AI");
  });

  it("renders the 96px Hunter portrait with its accessible name", () => {
    render(<MeetHunter memberName="Dana" count={5} onAsk={vi.fn()} onDismiss={vi.fn()} />);

    const portrait = screen.getByRole("img", { name: HUNTER_NAME });
    expect(portrait.classList.contains("agent-avatar--96")).toBe(true);
  });

  it("says what Hunter cannot do before any verdict", () => {
    const { container } = render(
      <MeetHunter memberName="Dana" count={5} onAsk={vi.fn()} onDismiss={vi.fn()} />,
    );

    const bounds = container.querySelector(".meet__bounds");
    expect(bounds?.textContent).toContain("I am not the one who decides whether to bid");
    expect(bounds?.textContent).toContain("Grant");
    expect(bounds?.textContent).toContain("I get things wrong");
  });

  it("names the real count when the feed supplies one", () => {
    const { container } = render(
      <MeetHunter memberName="Dana" count={1234} onAsk={vi.fn()} onDismiss={vi.fn()} />,
    );

    expect(container.querySelector(".meet__say")?.textContent).toContain("about 1,234 of them");
  });

  it("omits the number rather than inventing one when no count is known", () => {
    const { container } = render(
      <MeetHunter memberName="Dana" count={null} onAsk={vi.fn()} onDismiss={vi.fn()} />,
    );

    const say = container.querySelector(".meet__say")?.textContent ?? "";
    expect(say).toContain("published overnight and put the ones");
    expect(say).not.toContain("about");
  });
});

describe("MeetHunter openers", () => {
  it("renders the three openers and asks the tapped one", () => {
    const onAsk = vi.fn();
    render(<MeetHunter memberName="Dana" count={5} onAsk={onAsk} onDismiss={vi.fn()} />);

    expect(HUNTER_OPENERS).toHaveLength(3);
    HUNTER_OPENERS.forEach((question) => {
      onAsk.mockClear();
      fireEvent.click(screen.getByRole("button", { name: question }));
      expect(onAsk).toHaveBeenCalledWith(question);
    });
  });
});

describe("MeetHunter dismissal", () => {
  it("writes the met-Hunter flag and collapses to the strip", () => {
    render(<FeedHead onAsk={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /Hunter/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(readFlag(MET_HUNTER_KEY)).toBe(true);
    expect(screen.queryByRole("heading", { name: /Hunter/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Ask Hunter" })).toBeTruthy();
  });

  it("renders the strip instead of the hero once the flag is already set", () => {
    writeFlag(MET_HUNTER_KEY, true);
    const onAsk = vi.fn();
    render(<FeedHead onAsk={onAsk} />);

    expect(screen.queryByRole("heading", { name: /Hunter/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Ask Hunter" }));
    expect(onAsk).toHaveBeenCalledWith(HUNTER_OPENERS[0]);
  });
});
