// @vitest-environment jsdom
//
// The tab strip counts things. A count is a measurement, so the badge may only
// appear once the feed has answered — before that there is no figure to show,
// and a `0` states that we counted and found none. OpportunitiesTabs already
// suppresses a null count; these tests pin that the feed hands it one.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { DiscoverV2ResponseDto } from "../lib/discoverApi";
import { PAST_DEBOUNCE_MS, resetFeedTestState, settle } from "./__testing__/feedHarness";

/** The whole-set total the feed answers with. */
const MATCH_TOTAL = 42;
const FOR_YOU_TAB = /Opportunities for you/;

/** Held until the test lets the feed answer. Every request waits on this one
 *  gate, so a re-issued request (the filter seeding issues a second) is held
 *  too — otherwise the test would race the route's own refetch. */
let feedAnswers: Promise<void> = Promise.resolve();
let letTheFeedAnswer: () => void = () => {};

/** An empty page carrying the total, which is all the badge reads. */
function emptyPageOf(total: number): DiscoverV2ResponseDto {
  return { data: [], total, page: 1, limit: 50, totalPages: 1, scoringEngine: "v5" };
}

const fetchDiscoverV2 = vi.fn(() => feedAnswers.then(() => emptyPageOf(MATCH_TOTAL)));

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

// Heavy siblings this feature does not exercise. Each is covered by its own
// test file; stubbing them keeps this one about the tab counts.
vi.mock("../components/Hunter/HunterChatOverlay", () => ({ HunterChatOverlay: () => null }));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
vi.mock("../components/Hunter/FiltersDrawer", () => ({ FiltersDrawer: () => null }));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");

beforeEach(() => {
  feedAnswers = new Promise<void>((resolve) => {
    letTheFeedAnswer = resolve;
  });
  fetchDiscoverV2.mockClear();
  resetFeedTestState();
});

afterEach(cleanup);

/** The badge on the "Opportunities for you" tab, or null when none is rendered. */
function forYouBadge(): Element | null {
  return screen.getByRole("button", { name: FOR_YOU_TAB }).querySelector(".opps-tab-count");
}

describe('the "Opportunities for you" badge', () => {
  it("renders no count until the feed has answered, then the real one", async () => {
    render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await settle(PAST_DEBOUNCE_MS);

    // The request is in flight: nothing has been counted yet.
    expect(fetchDiscoverV2).toHaveBeenCalled();
    expect(forYouBadge()).toBeNull();

    await act(async () => {
      letTheFeedAnswer();
    });
    await settle(PAST_DEBOUNCE_MS);

    // Counted: the badge states the figure the feed returned.
    await waitFor(() => expect(forYouBadge()?.textContent).toBe(String(MATCH_TOTAL)));
  });
});
