// @vitest-environment jsdom
//
// A member opens an opportunity and comes back. The feed route unmounts on the
// way out, so without a memory the member lands on "Opportunities for you" with
// their filters reseeded from the profile and their search gone. These tests
// pin that the tab, the filters and the search survive that round trip.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { OpportunityFilters } from "../lib/opportunityFilters";
import {
  LOCATION_ID,
  PAST_DEBOUNCE_MS,
  resetFeedTestState,
  settle,
} from "./__testing__/feedHarness";

const ALL_TAB = /All opportunities/;
const SEARCH_TEXT = "roofing";
const PROFILE_STATE = "NC";
const APPLIED_STATE = "TX";
const APPLY_TEXAS = "Apply Texas";

const fetchAll = vi.fn((_locationId: string, _opts: { filters: { search?: string } }) =>
  Promise.resolve({ opportunities: [], page: 1, limit: 50, total: 0 }),
);
const fetchDiscoverV2 = vi.fn(
  (_locationId: string, _opts: { filters?: { location?: { states?: string[] } } }) =>
    Promise.resolve({ data: [], total: 0, page: 1, limit: 50, totalPages: 1, scoringEngine: "v5" }),
);
const fetchFilterDefaults = vi.fn(() =>
  Promise.resolve({
    naics: [],
    setAsides: [],
    states: [PROFILE_STATE],
    cities: [],
    hasCapabilityStatement: true,
  }),
);

vi.mock("../lib/saved", async () => (await import("./__testing__/feedHarness")).savedStub());
vi.mock("../lib/workspace", async () =>
  (await import("./__testing__/feedHarness")).workspaceStub(),
);
vi.mock("../lib/all", async () =>
  (await import("./__testing__/feedHarness")).allStub({ fetchAll }),
);
vi.mock("../lib/discoverApi", async (orig) =>
  (await import("./__testing__/feedHarness")).discoverApiStub(orig, {
    fetchDiscoverV2,
    fetchFilterDefaults,
  }),
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

// Heavy siblings this feature does not exercise.
vi.mock("../components/Hunter/HunterChatOverlay", () => ({ HunterChatOverlay: () => null }));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
// The drawer is reduced to one control that applies a state filter the way the
// real drawer does: through `onSetFilters`, on top of the current filters.
vi.mock("../components/Hunter/FiltersDrawer", () => ({
  FiltersDrawer: (p: {
    filters: OpportunityFilters;
    onSetFilters: (f: OpportunityFilters) => void;
  }) => (
    <button type="button" onClick={() => p.onSetFilters({ ...p.filters, states: [APPLIED_STATE] })}>
      {APPLY_TEXAS}
    </button>
  ),
}));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");
const { rememberFeedView, recallFeedView } = await import("../lib/feedViewMemory");

beforeEach(() => {
  fetchAll.mockClear();
  fetchDiscoverV2.mockClear();
  fetchFilterDefaults.mockClear();
  resetFeedTestState();
});

afterEach(cleanup);

/** Mounts the feed, lets the profile seed and the first fetch land, and
 *  returns the unmount that stands in for "open an opportunity". */
async function mountFeed(): Promise<() => void> {
  const { unmount } = render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  await settle(PAST_DEBOUNCE_MS);
  return unmount;
}

function searchInput(): HTMLInputElement {
  return screen.getByLabelText("Search opportunities") as HTMLInputElement;
}

describe("returning to the feed", () => {
  it("restores the last tab and its search", async () => {
    const leave = await mountFeed();
    fireEvent.click(screen.getByRole("button", { name: ALL_TAB }));
    fireEvent.change(searchInput(), { target: { value: SEARCH_TEXT } });
    await settle(PAST_DEBOUNCE_MS);
    act(leave);

    fetchAll.mockClear();
    await mountFeed();

    expect(screen.getByRole("button", { name: ALL_TAB }).getAttribute("aria-pressed")).toBe("true");
    expect(searchInput().value).toBe(SEARCH_TEXT);
    await waitFor(() => expect(fetchAll.mock.calls.at(-1)?.[1].filters.search).toBe(SEARCH_TEXT));
  });

  it("keeps the filters the member applied, after the profile seed lands again", async () => {
    const leave = await mountFeed();
    fireEvent.click(screen.getByRole("button", { name: APPLY_TEXAS }));
    await settle(PAST_DEBOUNCE_MS);
    expect(screen.getByRole("button", { name: "Remove Texas" })).toBeTruthy();
    act(leave);

    fetchDiscoverV2.mockClear();
    await mountFeed();

    // The profile seed ran on this mount too, and must not have wiped the filter.
    expect(fetchFilterDefaults).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Remove Texas" })).toBeTruthy();
    expect(fetchDiscoverV2.mock.calls.at(-1)?.[1].filters?.location?.states).toEqual([
      APPLIED_STATE,
    ]);
  });
});

describe("feedViewMemory", () => {
  it("does not hand one location's view to another", () => {
    rememberFeedView(LOCATION_ID, { tab: "all" } as never);
    expect(recallFeedView("another-location")).toBeNull();
    expect(recallFeedView(LOCATION_ID)).toEqual({ tab: "all" });
  });
});
