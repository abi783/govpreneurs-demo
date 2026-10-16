// @vitest-environment jsdom
//
// A failed feed load is our failure, not the member's filters. These tests pin
// the three things that says: the failure is announced (role="alert"), it offers
// a way back (Retry), and it never renders the "loosen your filters" empty state
// underneath — that sentence asserts a finding we did not make. The fourth test
// pins the security half: the backend's own message goes to console.error, never
// to the screen.
//
// The last describe block pins the SAME rule on the second request path. Page 1
// and page 2 fail through different catch handlers, so a page-1 assertion proves
// nothing about the append that infinite scroll fires.
//
// The shared stubs and helpers come from `__testing__/feedHarness`. The
// intersection observer is NOT shared: this file fires it, so it keeps a
// recording stub of its own.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { DiscoverV2ResponseDto } from "../lib/discoverApi";
import type { DiscoverV2OpportunityDto } from "../lib/discoverMapper";
import {
  PAST_DEBOUNCE_MS,
  discoverOpp,
  isoInDays,
  resetFeedTestState,
  settle,
} from "./__testing__/feedHarness";

/** A recognisable fragment of a backend message: an internal path. If this
 *  reaches the DOM, so does everything else the backend chooses to say. */
const BACKEND_DETAIL = "/srv/app/src/opportunity/discover-v2.service.ts:118";

/** As much of the real signature as these tests read. */
type DiscoverFetch = (
  locationId: string,
  opts?: { page?: number },
) => Promise<DiscoverV2ResponseDto>;

const fetchDiscoverV2 = vi.fn<DiscoverFetch>(() =>
  Promise.reject(new Error(`ECONNREFUSED ${BACKEND_DETAIL}`)),
);

const PAGE_ONE_TITLE = "Re-roof of 6 barracks";

/** One opportunity, enough for the feed to render a card and a sentinel. */
function pageOneOpp(): DiscoverV2OpportunityDto {
  return discoverOpp("OPP-1", PAGE_ONE_TITLE, {
    responseDeadline: isoInDays(30),
    postedDate: isoInDays(-10),
    placeOfPerformance: { city: "Raleigh", state: "NC" },
  });
}

/** Page 1 of a two-page feed, so the next-page request is allowed to fire. */
function pageOneOfTwo(): DiscoverV2ResponseDto {
  return {
    data: [pageOneOpp()],
    total: 60,
    page: 1,
    limit: 50,
    totalPages: 2,
    scoringEngine: "v5",
  };
}

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
// test file; stubbing them keeps this one about the failed load.
vi.mock("../components/Hunter/HunterChatOverlay", () => ({ HunterChatOverlay: () => null }));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
vi.mock("../components/Hunter/FiltersDrawer", () => ({ FiltersDrawer: () => null }));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");
const { FEED_LOAD_ERROR_MESSAGE } = await import("../components/Hunter/FeedErrorNotice");

type StubEntry = { isIntersecting: boolean; target: Element };

/** Every observer the route created during a test, oldest first. */
const observers: IntersectionObserverStub[] = [];

class IntersectionObserverStub {
  private readonly targets = new Set<Element>();
  private readonly callback: (entries: StubEntry[]) => void;

  constructor(callback: (entries: StubEntry[]) => void) {
    this.callback = callback;
    observers.push(this);
  }

  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  takeRecords() {
    return [];
  }
  /** True while this observer still watches the element. */
  observing(el: Element) {
    return this.targets.has(el);
  }
  /** Reports the element as scrolled into view. */
  fire(target: Element) {
    this.callback([{ isIntersecting: true, target }]);
  }
}

/** Every argument list `console.error` received during a test. */
const loggedErrors: unknown[][] = [];
let consoleErrorSpy: { mockRestore: () => void };

beforeEach(() => {
  fetchDiscoverV2.mockReset();
  fetchDiscoverV2.mockImplementation(() =>
    Promise.reject(new Error(`ECONNREFUSED ${BACKEND_DETAIL}`)),
  );
  observers.length = 0;
  resetFeedTestState({
    intersectionObserver: IntersectionObserverStub as unknown as typeof IntersectionObserver,
  });
  loggedErrors.length = 0;
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    loggedErrors.push(args);
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  cleanup();
});

function renderFeed() {
  return render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
}

/** The infinite-scroll sentinel: the 1px, aria-hidden div at the foot of the list. */
function loadMoreSentinel(): Element {
  const el = Array.from(document.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')).find(
    (node) => node.style.height === "1px",
  );
  if (!el) throw new Error("the infinite-scroll sentinel is not on screen");
  return el;
}

/** Scrolls the sentinel into view, which is what asks for the next page. */
async function scrollToNextPage() {
  const sentinel = loadMoreSentinel();
  const observer = [...observers].reverse().find((o) => o.observing(sentinel));
  if (!observer) throw new Error("nothing observes the infinite-scroll sentinel");
  await act(async () => {
    observer.fire(sentinel);
  });
  await settle(0);
}

/** Renders the feed and waits for the failed-load alert. */
async function renderFailedFeed() {
  const view = renderFeed();
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  await settle(PAST_DEBOUNCE_MS);
  return view;
}

describe("a failed feed load does not read as the member's mistake", () => {
  it("announces the failure and offers Retry, which re-issues exactly one request", async () => {
    await renderFailedFeed();

    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(FEED_LOAD_ERROR_MESSAGE)).toBeTruthy();

    const callsBefore = fetchDiscoverV2.mock.calls.length;
    fireEvent.click(within(alert).getByRole("button", { name: /retry/i }));
    await settle(PAST_DEBOUNCE_MS);

    expect(fetchDiscoverV2.mock.calls.length).toBe(callsBefore + 1);
  });

  it("does not blame the member's filters for a server failure", async () => {
    const { container } = await renderFailedFeed();

    expect(screen.queryByText(/loosening/i)).toBeNull();
    expect(container.textContent).not.toMatch(/loosen/i);
    // The alert is the whole story on screen: no second, contradicting card.
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("shows the member a fixed sentence and sends the backend's own message to the log", async () => {
    await renderFailedFeed();

    expect(document.body.textContent).not.toContain(BACKEND_DETAIL);
    expect(document.body.textContent).not.toContain("ECONNREFUSED");
    const logged = loggedErrors.some((args) =>
      args.some((arg) => String(arg instanceof Error ? arg.message : arg).includes(BACKEND_DETAIL)),
    );
    expect(logged).toBe(true);
  });

  it("keeps a slow load distinguishable from a failed one", async () => {
    fetchDiscoverV2.mockImplementation(() => new Promise(() => {}));
    const { container } = renderFeed();
    await settle(PAST_DEBOUNCE_MS);

    expect(container.querySelector(".feed-loading")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("a failed NEXT page is held to the same rule", () => {
  it("shows the fixed sentence and sends the backend's own message to the log", async () => {
    fetchDiscoverV2.mockImplementation((_locationId, opts) =>
      (opts?.page ?? 1) === 1
        ? Promise.resolve(pageOneOfTwo())
        : Promise.reject(new Error(`ECONNREFUSED ${BACKEND_DETAIL}`)),
    );

    renderFeed();
    await settle(PAST_DEBOUNCE_MS);
    await waitFor(() => expect(screen.getByText(PAGE_ONE_TITLE)).toBeTruthy());

    await scrollToNextPage();

    // The append really was attempted — otherwise the assertions below pass on
    // a request that never happened.
    expect(fetchDiscoverV2.mock.calls.some(([, opts]) => opts?.page === 2)).toBe(true);

    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(within(alert).getByText(FEED_LOAD_ERROR_MESSAGE)).toBeTruthy();
    expect(document.body.textContent).not.toContain(BACKEND_DETAIL);
    expect(document.body.textContent).not.toContain("ECONNREFUSED");

    const logged = loggedErrors.some((args) =>
      args.some((arg) => String(arg instanceof Error ? arg.message : arg).includes(BACKEND_DETAIL)),
    );
    expect(logged).toBe(true);
  });
});
