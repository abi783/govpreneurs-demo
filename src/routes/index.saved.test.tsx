// @vitest-environment jsdom
//
// The Saved tab, rendered. A saved list is a decision the member already made,
// so the feed's facet filters must not run over it again. The search term does
// apply: the member types it to find one bookmark. These tests pin both, the
// sort order, and the lede that tells the member about the filters.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { OpportunityFilters } from "../lib/opportunityFilters";
import type { SavedResponse } from "../lib/saved";
import {
  PAST_DEBOUNCE_MS,
  renderedTitles,
  resetFeedTestState,
  savedOpp,
  settle,
} from "./__testing__/feedHarness";

const SEARCH_LABEL = "Search opportunities";

// Two bookmarks, deliberately handed back CLOSEST-LAST, so a client-side sort
// would show in the rendered order.
const CLOSES_LATER = savedOpp("OPP-LATER", "Re-roof of 6 barracks", 30);
const CLOSES_SOONER = savedOpp("OPP-SOONER", "Paving at Camp Lejeune", 5);

/** The saved feed as the SERVER would answer it. Facet filters select nothing
 *  here, so a request that carries them comes back empty and the member's
 *  bookmarks disappear — that is the regression under test. A search term
 *  matches on the title, as the server's text search does. */
function savedFeedAsTheServerAnswersIt(
  _locationId: string,
  opts?: { filters?: Record<string, unknown>; search?: string },
): Promise<SavedResponse> {
  const filtered = opts?.filters != null && Object.keys(opts.filters).length > 0;
  const term = opts?.search?.toLowerCase();
  const opportunities = filtered
    ? []
    : [CLOSES_LATER, CLOSES_SOONER].filter((o) => !term || o.title.toLowerCase().includes(term));
  return Promise.resolve({ opportunities, page: 1, limit: 50, total: opportunities.length });
}

const fetchSaved = vi.fn(savedFeedAsTheServerAnswersIt);

const fetchWorkspace = vi.fn(() =>
  Promise.resolve({ savedOpps: [CLOSES_LATER.id, CLOSES_SOONER.id], savedSearches: [] }),
);

vi.mock("../lib/saved", async () =>
  (await import("./__testing__/feedHarness")).savedStub({ fetchSaved }),
);
vi.mock("../lib/workspace", async () =>
  (await import("./__testing__/feedHarness")).workspaceStub({ fetchWorkspace }),
);
vi.mock("../lib/all", async () => (await import("./__testing__/feedHarness")).allStub());
vi.mock("../lib/discoverApi", async (orig) =>
  (await import("./__testing__/feedHarness")).discoverApiStub(orig),
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
// test file; stubbing them keeps this one about the saved feed.
vi.mock("../components/Hunter/HunterChatOverlay", () => ({ HunterChatOverlay: () => null }));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
// The drawer stub exposes one control: narrow the feed to a state nothing in the
// saved fixture matches. That is a facet filter applied while the member is on
// the Saved tab.
vi.mock("../components/Hunter/FiltersDrawer", () => ({
  FiltersDrawer: ({
    filters,
    onSetFilters,
  }: {
    filters: OpportunityFilters;
    onSetFilters: (f: OpportunityFilters) => void;
  }) => (
    <button type="button" onClick={() => onSetFilters({ ...filters, states: ["AK"] })}>
      stub-narrow-to-AK
    </button>
  ),
}));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");

beforeEach(() => {
  // Reset the implementation too, not only the call log: a test that answers
  // with an empty list must not leak that answer into the next one.
  fetchSaved.mockReset();
  fetchSaved.mockImplementation(savedFeedAsTheServerAnswersIt);
  fetchWorkspace.mockClear();
  resetFeedTestState();
});

afterEach(() => cleanup());

/** Renders the feed and switches to the Saved tab, waiting for both bookmarks. */
async function renderSavedTab() {
  const view = render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  const savedTab = Array.from(view.container.querySelectorAll("button.opps-tab")).find((b) =>
    b.textContent?.startsWith("Saved"),
  );
  expect(savedTab).toBeTruthy();
  await act(async () => {
    fireEvent.click(savedTab!);
  });
  await waitFor(() => expect(screen.getByText(CLOSES_SOONER.title)).toBeTruthy());
  return view;
}

/** True for the Saved badge's own request: the list's question with `limit: 1`. */
const isCountCall = (opts: unknown): boolean =>
  (opts as { limit?: number } | undefined)?.limit === 1;

// The unmount writes a snapshot of the Saved rows. A return must not show it.
describe("a return to a remembered Saved tab", () => {
  it("asks the server again on a return to the Saved tab, never replaying old rows", async () => {
    const { unmount } = await renderSavedTab();
    await settle(PAST_DEBOUNCE_MS);
    unmount();

    // A bookmark was removed elsewhere while the member was away.
    fetchSaved.mockReset();
    fetchSaved.mockImplementation((_l, opts) =>
      Promise.resolve({
        opportunities: isCountCall(opts) ? [] : [CLOSES_LATER],
        page: 1,
        limit: 50,
        total: 1,
      }),
    );

    const view = render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    // Before the new answer lands, the removed bookmark is not replayed from
    // the snapshot the unmount wrote.
    await act(async () => {});
    expect(renderedTitles(view.container)).not.toContain(CLOSES_SOONER.title);
    await settle(PAST_DEBOUNCE_MS);
    expect(fetchSaved.mock.calls.some((c) => !isCountCall(c[1]))).toBe(true);
    await waitFor(() => expect(renderedTitles(view.container)).toEqual([CLOSES_LATER.title]));
    await waitFor(() => expect(savedBadge(view.container)).toBe("1"));
  });
});

describe("the Saved tab searches but does not filter the member's own bookmarks", () => {
  it("narrows to the bookmark that the search term matches", async () => {
    const { container } = await renderSavedTab();
    expect(renderedTitles(container)).toHaveLength(2);

    fireEvent.change(screen.getByLabelText(SEARCH_LABEL), { target: { value: "  paving " } });
    // `settle` applies the search field's own debounce. The feed then waits its
    // search debounce before it asks the server, so wait for the answer.
    await settle(PAST_DEBOUNCE_MS);
    await waitFor(() => expect(renderedTitles(container)).toEqual([CLOSES_SOONER.title]));
    expect(fetchSaved.mock.calls.at(-1)?.[1]?.search).toBe("paving");
    // The search term travels alone. No request carries the facet filters.
    for (const call of fetchSaved.mock.calls) {
      expect(call[1]?.filters).toBeUndefined();
    }
  });

  it("says that no bookmark matches, not that nothing is saved", async () => {
    await renderSavedTab();

    fireEvent.change(screen.getByLabelText(SEARCH_LABEL), {
      target: { value: "nothing-here-matches-this" },
    });
    await settle(PAST_DEBOUNCE_MS);

    await waitFor(() =>
      expect(screen.getByText("None of your saved opportunities match your search.")).toBeTruthy(),
    );
    expect(screen.queryByText(/You haven't saved anything yet/)).toBeNull();
  });

  it("keeps both bookmarks on screen under a facet filter that matches neither", async () => {
    const { container } = await renderSavedTab();

    fireEvent.click(screen.getByText("stub-narrow-to-AK"));
    await settle(PAST_DEBOUNCE_MS);

    expect(renderedTitles(container)).toHaveLength(2);
  });

  it("asks the server for most recently saved first and keeps the server's order", async () => {
    const { container } = await renderSavedTab();

    expect(fetchSaved.mock.calls.at(-1)?.[1]?.sort).toEqual({ field: "saved", order: "desc" });
    // The server owns the order, so the screen shows the rows as they came back.
    expect(renderedTitles(container)).toEqual([CLOSES_LATER.title, CLOSES_SOONER.title]);
  });

  it("offers the six Saved orders and refetches when the member picks one", async () => {
    const { container } = await renderSavedTab();

    fireEvent.click(container.querySelector("button.opps-sort-menu__trigger")!);
    const options = Array.from(container.querySelectorAll("button.opps-sort-menu__item")).map(
      (b) => b.textContent,
    );
    expect(options).toEqual([
      "Closing soonest",
      "Most time left",
      "Biggest first",
      "Smallest first",
      "Best match",
      "Recently saved",
    ]);

    fireEvent.click(screen.getByText("Most time left"));
    await settle(PAST_DEBOUNCE_MS);

    expect(fetchSaved.mock.calls.at(-1)?.[1]?.sort).toEqual({ field: "deadline", order: "desc" });
    expect(container.querySelector(".opps-saved-lede")?.textContent).toBe(
      "Latest closing date first. Your filters do not touch this list.",
    );
  });

  it("says so above the list", async () => {
    const { container } = await renderSavedTab();

    const lede = container.querySelector(".opps-saved-lede");
    expect(lede?.textContent).toBe(
      "Most recently saved first. Your filters do not touch this list.",
    );
    // Above the first card, not below it.
    const firstCard = container.querySelector("h3.opp-title-compact");
    expect(lede!.compareDocumentPosition(firstCard!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("renders no lede when there is nothing saved, and blames no filter", async () => {
    fetchSaved.mockResolvedValue({ opportunities: [], page: 1, limit: 50, total: 0 });
    const view = render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    const savedTab = Array.from(view.container.querySelectorAll("button.opps-tab")).find((b) =>
      b.textContent?.startsWith("Saved"),
    );
    await act(async () => {
      fireEvent.click(savedTab!);
    });
    await waitFor(() => expect(screen.getByText(/You haven't saved anything yet/)).toBeTruthy());

    expect(view.container.querySelector(".opps-saved-lede")).toBeNull();
    // The one thing this sentence may not do is blame the member's filters for
    // an empty list they cannot empty. (The retired string itself is not quoted
    // here — the acceptance check for it is a zero-grep over `src/`.)
    const empty = screen.getByText(/You haven't saved anything yet/);
    expect(empty.textContent).not.toMatch(/filter/i);
  });
});

/** The badge on the Saved tab, or null when none is rendered. */
function savedBadge(container: HTMLElement): string | null {
  const tab = Array.from(container.querySelectorAll("button.opps-tab")).find((b) =>
    b.textContent?.startsWith("Saved"),
  );
  return tab?.querySelector(".opps-tab-count")?.textContent ?? null;
}

describe("the Saved counts equal the rows the Saved list shows", () => {
  it("the badge is the server's count, not the raw bookmark list", async () => {
    // The raw list also holds a forecast, a small order and a dead key. The
    // Saved list shows two rows, so the badge says 2, never 5.
    fetchWorkspace.mockResolvedValueOnce({
      savedOpps: [CLOSES_LATER.id, CLOSES_SOONER.id, "FORECAST-1", "DIBBS-1", "GONE-1"],
      savedSearches: [],
    });
    const { container } = render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await waitFor(() => expect(savedBadge(container)).toBe("2"));
    // The count asked the list's own question: no search, no filters.
    const countCall = fetchSaved.mock.calls.find((c) => isCountCall(c[1]));
    expect(countCall?.[1]).toEqual({ page: 1, limit: 1 });
  });

  it("shows no badge while the count is unknown, whatever the raw list holds", async () => {
    fetchSaved.mockImplementation((l, opts) =>
      isCountCall(opts)
        ? Promise.reject(new Error("down"))
        : savedFeedAsTheServerAnswersIt(l, opts),
    );
    const { container } = render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await settle(PAST_DEBOUNCE_MS);
    expect(savedBadge(container)).toBeNull();
  });

  it("moves by one when the member unsaves a card on this page", async () => {
    const { container } = await renderSavedTab();
    await waitFor(() => expect(savedBadge(container)).toBe("2"));

    fireEvent.click(screen.getAllByRole("button", { name: "Remove from saved" })[0]);
    await waitFor(() => expect(savedBadge(container)).toBe("1"));
  });

  it("asks again when the page becomes visible", async () => {
    const { container } = render(
      <StageStoreProvider>
        <OpportunitiesFeed />
      </StageStoreProvider>,
    );
    await waitFor(() => expect(savedBadge(container)).toBe("2"));

    // A save made on another page: the server now counts three.
    fetchSaved.mockImplementation((l, opts) =>
      isCountCall(opts)
        ? Promise.resolve({ opportunities: [], page: 1, limit: 1, total: 3 })
        : savedFeedAsTheServerAnswersIt(l, opts),
    );
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitFor(() => expect(savedBadge(container)).toBe("3"));
  });

  it("words a searched total as a search result, not as the saved total", async () => {
    const { container } = await renderSavedTab();
    await waitFor(() =>
      expect(container.querySelector(".opps-summary__count")?.textContent).toMatch(/2\s*saved/),
    );

    fireEvent.change(screen.getByLabelText(SEARCH_LABEL), { target: { value: "paving" } });
    await settle(PAST_DEBOUNCE_MS);
    await waitFor(() =>
      expect(container.querySelector(".opps-summary__count")?.textContent).toMatch(
        /1\s*match your search/,
      ),
    );
    await waitFor(() =>
      expect(container.querySelector(".load-more-count")?.textContent).toMatch(
        /1 match your search/,
      ),
    );
  });
});
