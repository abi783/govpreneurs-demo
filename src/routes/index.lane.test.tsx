// @vitest-environment jsdom
//
// The buyer switch on the opportunities page: "All buyers", "Federal" and
// "State and local". The server applies the lane (`filters.scopes`) on every
// tab, so these tests pin the wiring: each request carries the lane, every
// badge is counted again under it, an answer for an old lane never reaches the
// screen, and a return to the feed restores the lane.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DiscoveryPayload } from "../lib/hunterChat";
import type { DiscoverV2ResponseDto } from "../lib/discoverApi";
import {
  discoverOpp,
  PAST_DEBOUNCE_MS,
  renderedTitles,
  resetFeedTestState,
  settle,
} from "./__testing__/feedHarness";

type Scoped = { filters?: { scopes?: string[] }; limit?: number };

/** The scopes a request carried, or null when it carried none. */
function scopesOf(opts: Scoped | undefined): string[] | null {
  return opts?.filters?.scopes ?? null;
}

/** A discover answer with one titled row per id and the given total. */
function discoverPage(total: number, titles: string[] = []): DiscoverV2ResponseDto {
  return {
    data: titles.map((t) => discoverOpp(t, t)),
    total,
    page: 1,
    limit: 50,
    totalPages: 1,
    scoringEngine: "v5",
  } as DiscoverV2ResponseDto;
}

/** The totals each lane answers with, per feed. */
const TOTALS: Record<string, { forYou: number; all: number; saved: number }> = {
  all: { forYou: 12, all: 300, saved: 9 },
  fed: { forYou: 8, all: 200, saved: 6 },
  sled: { forYou: 4, all: 100, saved: 3 },
};
const laneKey = (opts: Scoped | undefined) => scopesOf(opts)?.[0] ?? "all";

const fetchDiscoverV2 = vi.fn((_loc: string, opts?: Scoped) =>
  Promise.resolve(discoverPage(TOTALS[laneKey(opts)].forYou)),
);
const fetchAll = vi.fn((_loc: string, opts?: Scoped) =>
  Promise.resolve({ opportunities: [], page: 1, limit: 50, total: TOTALS[laneKey(opts)].all }),
);
const fetchSaved = vi.fn((_loc: string, opts?: Scoped) =>
  Promise.resolve({ opportunities: [], page: 1, limit: 50, total: TOTALS[laneKey(opts)].saved }),
);

/** Hunter's filter callback, captured from the stubbed overlay. */
let applyHunterFilters: ((p: DiscoveryPayload) => void) | null = null;

vi.mock("../lib/saved", async () =>
  (await import("./__testing__/feedHarness")).savedStub({ fetchSaved }),
);
vi.mock("../lib/workspace", async () =>
  (await import("./__testing__/feedHarness")).workspaceStub(),
);
vi.mock("../lib/all", async () =>
  (await import("./__testing__/feedHarness")).allStub({ fetchAll }),
);
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

vi.mock("../components/Hunter/HunterChatOverlay", () => ({
  HunterChatOverlay: (p: { onApplyFilters: (d: DiscoveryPayload) => void }) => {
    applyHunterFilters = p.onApplyFilters;
    return null;
  },
}));
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
vi.mock("../components/Hunter/FiltersDrawer", () => ({ FiltersDrawer: () => null }));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");

beforeEach(() => {
  fetchDiscoverV2.mockClear();
  fetchAll.mockClear();
  fetchSaved.mockClear();
  applyHunterFilters = null;
  resetFeedTestState();
});

afterEach(cleanup);

async function mountFeed(): Promise<() => void> {
  const { unmount } = render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  await settle(PAST_DEBOUNCE_MS);
  return unmount;
}

function lane(name: string): HTMLElement {
  return screen.getByRole("radio", { name });
}

async function pickLane(name: string): Promise<void> {
  fireEvent.click(lane(name));
  await settle(PAST_DEBOUNCE_MS);
}

function badge(tab: RegExp): string | null {
  return (
    screen.getByRole("button", { name: tab }).querySelector(".opps-tab-count")?.textContent ?? null
  );
}

describe("the buyer switch", () => {
  it("renders three lanes in a named radio group, with All buyers on", async () => {
    await mountFeed();
    const group = screen.getByRole("radiogroup", { name: "Who is buying?" });
    expect(Array.from(group.querySelectorAll('[role="radio"]')).map((r) => r.textContent)).toEqual([
      "All buyers",
      "Federal",
      "State and local",
    ]);
    expect(lane("All buyers").getAttribute("aria-checked")).toBe("true");
    // All buyers sends no scopes at all.
    expect(fetchDiscoverV2.mock.calls.every(([, o]) => scopesOf(o) === null)).toBe(true);
  });

  it("refetches page 1 of the tab with the lane, and counts every badge again", async () => {
    await mountFeed();
    fetchDiscoverV2.mockClear();

    await pickLane("State and local");

    expect(lane("State and local").getAttribute("aria-checked")).toBe("true");
    expect(scopesOf(fetchDiscoverV2.mock.calls.at(-1)?.[1])).toEqual(["sled"]);
    expect(fetchAll.mock.calls.some(([, o]) => o?.limit === 1 && laneKey(o) === "sled")).toBe(true);
    expect(fetchSaved.mock.calls.some(([, o]) => o?.limit === 1 && laneKey(o) === "sled")).toBe(
      true,
    );
    await waitFor(() => {
      expect(badge(/Opportunities for you/)).toBe(String(TOTALS.sled.forYou));
      expect(badge(/All opportunities/)).toBe(String(TOTALS.sled.all));
      expect(badge(/Saved/)).toBe(String(TOTALS.sled.saved));
    });
  });

  it("keeps the lane across tabs, and each tab asks with it", async () => {
    await mountFeed();
    await pickLane("Federal");

    fireEvent.click(screen.getByRole("button", { name: /All opportunities/ }));
    await settle(PAST_DEBOUNCE_MS);
    expect(lane("Federal").getAttribute("aria-checked")).toBe("true");
    expect(scopesOf(fetchAll.mock.calls.at(-1)?.[1])).toEqual(["fed"]);

    fireEvent.click(screen.getByRole("button", { name: /Saved/ }));
    await settle(PAST_DEBOUNCE_MS);
    const savedPage = fetchSaved.mock.calls.filter(([, o]) => o?.limit !== 1).at(-1)?.[1];
    expect(scopesOf(savedPage)).toEqual(["fed"]);
    await waitFor(() => expect(badge(/Saved/)).toBe(String(TOTALS.fed.saved)));
  });

  it("drops an answer for the old lane that lands after the new one", async () => {
    await mountFeed();
    let answerOld: (r: DiscoverV2ResponseDto) => void = () => {};
    fetchDiscoverV2.mockImplementationOnce(
      () => new Promise<DiscoverV2ResponseDto>((resolve) => (answerOld = resolve)),
    );
    await pickLane("Federal");
    fetchDiscoverV2.mockImplementation((_loc, opts) =>
      Promise.resolve(
        laneKey(opts) === "sled"
          ? discoverPage(1, ["A state job"])
          : discoverPage(TOTALS[laneKey(opts)].forYou),
      ),
    );
    await pickLane("State and local");
    await waitFor(() => expect(renderedTitles(document.body)).toEqual(["A state job"]));

    await act(async () => answerOld(discoverPage(1, ["A federal job"])));
    await settle(PAST_DEBOUNCE_MS);
    expect(renderedTitles(document.body)).toEqual(["A state job"]);
    expect(badge(/Opportunities for you/)).toBe("1");
    fetchDiscoverV2.mockImplementation((_loc, opts) =>
      Promise.resolve(discoverPage(TOTALS[laneKey(opts)].forYou)),
    );
  });

  it("restores the lane when the member comes back to the feed", async () => {
    const leave = await mountFeed();
    await pickLane("State and local");
    act(leave);

    fetchDiscoverV2.mockClear();
    await mountFeed();

    expect(lane("State and local").getAttribute("aria-checked")).toBe("true");
    await waitFor(() => expect(scopesOf(fetchDiscoverV2.mock.calls.at(-1)?.[1])).toEqual(["sled"]));
  });

  it("moves when Hunter's discovery names a scope, and stays when it names none", async () => {
    await mountFeed();
    expect(applyHunterFilters).not.toBeNull();

    await act(async () =>
      applyHunterFilters!({ filters: { scope: { fed: true, sled: false } } } as DiscoveryPayload),
    );
    await settle(PAST_DEBOUNCE_MS);
    expect(lane("Federal").getAttribute("aria-checked")).toBe("true");
    expect(scopesOf(fetchDiscoverV2.mock.calls.at(-1)?.[1])).toEqual(["fed"]);

    await act(async () => applyHunterFilters!({ filters: { states: ["TX"] } } as DiscoveryPayload));
    await settle(PAST_DEBOUNCE_MS);
    expect(lane("Federal").getAttribute("aria-checked")).toBe("true");
  });
});
