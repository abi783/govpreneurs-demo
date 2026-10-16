// @vitest-environment jsdom
//
// Stretch mode, rendered. The stretch list is empty, so the summary row may not
// put a figure above it. This test pins that the row counts the list it renders
// and drops the headline clause when there is nothing to count.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import {
  discoverOpp,
  isoInDays,
  renderedTitles,
  resetFeedTestState,
} from "./__testing__/feedHarness";

/** The figure the route used to hardcode for stretch mode. */
const FABRICATED_COUNT = "47";

// Two real matches, and a total the default feed can honestly claim. Neither
// number is 47, so a 47 on screen can only be invented.
const POSTED = { postedDate: isoInDays(-40) };
const MATCHES = [
  discoverOpp("OPP-1", "Re-roof of 6 barracks", POSTED),
  discoverOpp("OPP-2", "Paving", POSTED),
];
const REAL_TOTAL = 12;

const fetchDiscoverV2 = vi.fn(() =>
  Promise.resolve({
    data: MATCHES,
    total: REAL_TOTAL,
    page: 1,
    limit: 50,
    totalPages: 1,
    scoringEngine: "v5",
  }),
);

vi.mock("../lib/saved", async () => (await import("./__testing__/feedHarness")).savedStub());
vi.mock("../lib/workspace", async () =>
  (await import("./__testing__/feedHarness")).workspaceStub(),
);
vi.mock("../lib/all", async () => (await import("./__testing__/feedHarness")).allStub());
vi.mock("../lib/discoverApi", async (orig) =>
  (await import("./__testing__/feedHarness")).discoverApiStub(orig, { fetchDiscoverV2 }),
);
vi.mock("../lib/preview", async (orig) =>
  (await import("./__testing__/feedHarness")).previewStub(orig),
);
vi.mock("../lib/huntersTakeApi", async () =>
  (await import("./__testing__/feedHarness")).huntersTakeApiStub(),
);
vi.mock("../lib/hunterChat", async () =>
  (await import("./__testing__/feedHarness")).hunterChatStub(),
);
vi.mock("../lib/useNaicsDescriptions", async () =>
  (await import("./__testing__/feedHarness")).naicsDescriptionsStub(),
);
vi.mock("../lib/ghlUser", async () => (await import("./__testing__/feedHarness")).ghlUserStub());
vi.mock("../lib/businessProfile", async (orig) =>
  (await import("./__testing__/feedHarness")).businessProfileStub(orig),
);
vi.mock("@tanstack/react-router", async () =>
  (await import("./__testing__/feedHarness")).routerStub(),
);

// The chat is the one way into stretch mode: Hunter offers "Show me
// opportunities I'd team up for" and the overlay calls back. The stub exposes
// that single callback and nothing else.
vi.mock("../components/Hunter/HunterChatOverlay", () => ({
  HunterChatOverlay: ({ onEnterStretches }: { onEnterStretches?: () => void }) => (
    <button type="button" onClick={() => onEnterStretches?.()}>
      stub-enter-stretches
    </button>
  ),
}));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
vi.mock("../components/Hunter/FiltersDrawer", () => ({ FiltersDrawer: () => null }));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");

beforeEach(() => {
  // Reduced motion, so `CountTicker` shows its final value at once. This test is
  // about WHICH number the row is given, not about the roll — and a 500 ms
  // animation read under a loaded suite is a flaky assertion.
  resetFeedTestState({ reducedMotion: true });
});

afterEach(() => cleanup());

function summaryText(container: HTMLElement): string {
  return container.querySelector(".opps-summary__count")?.textContent ?? "";
}

/** Renders the feed, waits for the matches, then enters stretch mode. */
async function renderStretchMode() {
  const view = render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  await waitFor(() => expect(renderedTitles(view.container)).toHaveLength(MATCHES.length));
  await act(async () => {
    fireEvent.click(view.getByText("stub-enter-stretches"));
  });
  return view;
}

describe("stretch mode counts the list it renders", () => {
  it("puts no figure of 47 anywhere on the page", async () => {
    const { container } = await renderStretchMode();

    expect(container.querySelector(".mode-chip-banner")).toBeTruthy();
    expect(container.textContent).not.toContain(FABRICATED_COUNT);
  });

  it("renders no stretch cards, and asserts no headline count above them", async () => {
    const { container } = await renderStretchMode();

    expect(renderedTitles(container)).toHaveLength(0);
    // The "Showing N stretches." override is dropped rather than filled, the
    // same rule the first-meeting opener follows when it has no count to give.
    expect(summaryText(container)).not.toMatch(/showing/i);
    expect(summaryText(container)).not.toMatch(/stretches/i);
  });

  it("leaves the count ticker on the real 0, not on the total it came from", async () => {
    const { container } = await renderStretchMode();

    expect(container.querySelector(".opps-summary__count-num")?.textContent).toBe("0");
    expect(summaryText(container).trim()).toBe("0 matches");
  });

  it("still shows the real total in the default mode it came from", async () => {
    const view = render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await waitFor(() => expect(renderedTitles(view.container)).toHaveLength(MATCHES.length));

    await waitFor(() =>
      expect(view.container.querySelector(".opps-summary__count-num")?.textContent).toBe(
        String(REAL_TOTAL),
      ),
    );
  });
});
