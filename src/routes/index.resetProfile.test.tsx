// @vitest-environment jsdom
//
// Feature V5 — the route's half of "Reset to my profile".
//
// "My profile" has exactly one meaning here: `applyProfileDefaults(emptyFilters(),
// defaults)`, the expression the route already runs on mount. The test builds its
// expectation from that same expression, so a reimplementation on either side
// fails rather than agreeing with itself.
//
// Two properties beyond the value:
//   - the reset costs NO request. The route resets from the defaults it fetched
//     on mount, so `fetchFilterDefaults` stays at one call and `fetch` is untouched.
//   - the action is ABSENT when the profile seeded nothing. A reset to nothing
//     is indistinguishable from a broken one.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { OpportunityFilters } from "../lib/opportunityFilters";
import { resetFeedTestState } from "./__testing__/feedHarness";

const RESET_LABEL = "Reset to my profile";
const NARROW_LABEL = "stub-narrow";
/** What the member's Success Center profile holds. */
const DEFAULTS = {
  naics: ["238160"],
  setAsides: ["WOSB"],
  states: ["NC"],
  cities: [],
  hasCapabilityStatement: true,
};
/** A profile that seeds no facet at all — the (d) case. */
const NO_FACETS = {
  naics: [],
  setAsides: [],
  states: [],
  cities: [],
  hasCapabilityStatement: true,
};

const fetchFilterDefaults = vi.fn(() => Promise.resolve(DEFAULTS));

vi.mock("../lib/saved", async () => (await import("./__testing__/feedHarness")).savedStub());
vi.mock("../lib/workspace", async () =>
  (await import("./__testing__/feedHarness")).workspaceStub(),
);
vi.mock("../lib/all", async () => (await import("./__testing__/feedHarness")).allStub());
vi.mock("../lib/discoverApi", async (orig) =>
  (await import("./__testing__/feedHarness")).discoverApiStub(orig, { fetchFilterDefaults }),
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

vi.mock("../components/Hunter/HunterChatOverlay", () => ({ HunterChatOverlay: () => null }));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));

// The last filters and keyword the route handed the drawer. The drawer's own
// footer button is covered by FiltersDrawer.reset.test.tsx; this stub exposes
// the route's side — the handler it passes, and the state that handler produces.
const handed: { filters: OpportunityFilters | null; keyword: string } = {
  filters: null,
  keyword: "",
};

// Two controls: one narrows the feed the way a member would (facets their
// profile does NOT hold, plus a keyword), the other is the footer action, which
// the stub renders only when the route supplies a handler.
vi.mock("../components/Hunter/FiltersDrawer", () => ({
  FiltersDrawer: ({
    filters,
    onSetFilters,
    keyword,
    onKeyword,
    onResetToProfile,
  }: {
    filters: OpportunityFilters;
    onSetFilters: (f: OpportunityFilters) => void;
    keyword: string;
    onKeyword: (v: string) => void;
    onResetToProfile?: () => void;
  }) => {
    handed.filters = filters;
    handed.keyword = keyword;
    return (
      <>
        <button
          type="button"
          onClick={() => {
            onSetFilters({ ...filters, states: ["AK"], noticeTypes: ["sources_sought"] });
            onKeyword("bridge deck");
          }}
        >
          {NARROW_LABEL}
        </button>
        {onResetToProfile && (
          <button type="button" onClick={onResetToProfile}>
            {RESET_LABEL}
          </button>
        )}
      </>
    );
  },
}));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");
const { applyProfileDefaults, emptyFilters } = await import("../lib/opportunityFilters");

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchFilterDefaults.mockClear();
  fetchFilterDefaults.mockImplementation(() => Promise.resolve(DEFAULTS));
  handed.filters = null;
  handed.keyword = "";
  resetFeedTestState();
  fetchSpy = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Renders the feed and waits until the profile defaults have seeded the filters. */
async function renderSeededFeed() {
  const view = render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  await waitFor(() => expect(handed.filters?.prefilled.has("naics:238160")).toBe(true));
  return view;
}

/** Narrows the filters and the keyword the way a member would, then resets. */
async function narrowThenReset() {
  await act(async () => {
    fireEvent.click(screen.getByText(NARROW_LABEL));
  });
  await waitFor(() => expect(handed.filters?.states).toEqual(["AK"]));
  await act(async () => {
    fireEvent.click(screen.getByText(RESET_LABEL));
  });
}

describe("Reset to my profile", () => {
  it("restores exactly applyProfileDefaults(emptyFilters(), defaults) and clears the keyword", async () => {
    await renderSeededFeed();
    await narrowThenReset();

    expect(handed.filters).toEqual(applyProfileDefaults(emptyFilters(), DEFAULTS));
    expect(handed.keyword).toBe("");
  });

  it("clears the facets the member set that their profile does not hold", async () => {
    await renderSeededFeed();
    await narrowThenReset();

    // Back to their profile, not to everything they had typed.
    expect(handed.filters?.states).toEqual([]);
    expect(handed.filters?.noticeTypes).toEqual([]);
    // And the profile's own facets are still tagged, still not pre-selected.
    expect(handed.filters?.prefilled.has("states:NC")).toBe(true);
    expect(handed.filters?.setAsides).toEqual([]);
    expect(handed.filters?.prefilled.has("setAsides:WOSB")).toBe(true);
  });

  it("fires no request — the defaults come from the fetch the mount already made", async () => {
    await renderSeededFeed();
    expect(fetchFilterDefaults).toHaveBeenCalledTimes(1);
    const fetchCallsBefore = fetchSpy.mock.calls.length;

    await narrowThenReset();

    expect(fetchFilterDefaults).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls.length).toBe(fetchCallsBefore);
  });

  it("offers no action at all when the profile seeded nothing", async () => {
    fetchFilterDefaults.mockImplementation(() => Promise.resolve(NO_FACETS));
    render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await waitFor(() => expect(fetchFilterDefaults).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(NARROW_LABEL)).toBeTruthy());

    expect(screen.queryByText(RESET_LABEL)).toBeNull();
  });

  it("offers no action when the defaults fetch failed", async () => {
    fetchFilterDefaults.mockImplementation(() => Promise.reject(new Error("500")));
    render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await waitFor(() => expect(fetchFilterDefaults).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText(NARROW_LABEL)).toBeTruthy());

    expect(screen.queryByText(RESET_LABEL)).toBeNull();
  });
});
