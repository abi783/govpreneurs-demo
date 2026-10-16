// @vitest-environment jsdom
//
// Feature 15 — the CANVAS half of a Hunter turn: the answer that changes the
// FEED, instead of putting a card on the stage.
//
// Nothing here is new behaviour. `applyHunterFilters` in `routes/index.tsx` and
// the `uiPayload.kind` dispatch in `HunterChatOverlay` already do this work.
// This file pins it, so a later change cannot remove it quietly.
//
// The transport is the ONLY stub. The route, the overlay, the stage store and
// the stage card are the real modules, so each turn travels the production path
// from payload to feed. `chatReply` is the model's own text in production and
// is a marker string here only so the test can see the turn land.
//
// The two halves must stay DISJOINT. A payload that moves the feed puts nothing
// on the stage, and a payload that puts an artifact on the stage moves no
// filter. `lib/hunter/stageArtifact.ts` records which kind is which; these
// tests hold the split from both directions.
//
// The shared stubs and helpers come from `__testing__/feedHarness`. The chat
// transport is NOT shared: this file is the one that sends a turn.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ServerFilters } from "../lib/discoverApi";
import type {
  DiscoveryPayload,
  EligibilityPayload,
  HunterTurnResponse,
  SaveOpportunityPayload,
  SwitchTabPayload,
} from "../lib/hunterChat";
import type { OpportunityFilters } from "../lib/opportunityFilters";
import {
  PAST_DEBOUNCE_MS,
  discoverOpp,
  resetFeedTestState,
  settle,
} from "./__testing__/feedHarness";

/** The reply text for every turn. It marks arrival; it asserts nothing. */
const REPLY_MARK = "hunter answered this turn";
const QUESTION = "show me roofing work in North Carolina";

const MATCHES = [discoverOpp("OPP-1", "Re-roof of 6 barracks"), discoverOpp("OPP-2", "Paving")];

/** A readiness answer — the stage half of the split, used to prove disjointness. */
const ELIGIBILITY: EligibilityPayload = {
  oppKey: "OPP-1",
  title: "Re-roof of 6 barracks",
  agency: "USACE",
  verdict: "certify_to_qualify",
  verdictLabel: "Certify to qualify",
  soleSource: false,
  rows: [{ field: "Set-aside", value: "SDVOSB set-aside", status: "fail" }],
  note: "Registering the certification is the one blocker.",
};

/** Serializes the feed's own filter object. `prefilled` is a Set, which
 *  `JSON.stringify` would otherwise write as `{}`. */
function serializeFilters(filters: OpportunityFilters): string {
  return JSON.stringify(filters, (_key: string, value: unknown) =>
    value instanceof Set ? Array.from(value) : value,
  );
}

const postHunterMessage = vi.fn<(...args: unknown[]) => Promise<HunterTurnResponse>>();
const fetchDiscoverV2 = vi.fn((_locationId: string, _opts?: { filters?: ServerFilters }) =>
  Promise.resolve({
    data: MATCHES,
    total: MATCHES.length,
    page: 1,
    limit: 50,
    totalPages: 1,
    scoringEngine: "v5",
  }),
);
const fetchAll = vi.fn(() => Promise.resolve({ opportunities: [], page: 1, limit: 50, total: 0 }));
const fetchWorkspace = vi.fn(() => Promise.resolve({ savedOpps: [], savedSearches: [] }));

// This file's own transport stub: it keeps the module's real helpers and swaps
// only the two calls a turn travels through.
vi.mock("../lib/hunterChat", async (orig) => ({
  ...(await orig<typeof import("../lib/hunterChat")>()),
  postHunterMessage: (...args: unknown[]) => postHunterMessage(...args),
  resetHunterSession: vi.fn(() => Promise.resolve()),
}));
vi.mock("../lib/saved", async () => (await import("./__testing__/feedHarness")).savedStub());
vi.mock("../lib/workspace", async () =>
  (await import("./__testing__/feedHarness")).workspaceStub({ fetchWorkspace }),
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

// The drawer is the feed's own window onto its filter state — the route already
// hands it `filters` and `keyword`. The stub prints both and offers two ways to
// prime them, so no test seam is added to production code.
vi.mock("../components/Hunter/FiltersDrawer", () => ({
  FiltersDrawer: ({
    filters,
    onSetFilters,
    keyword,
    onKeyword,
  }: {
    filters: OpportunityFilters;
    onSetFilters: (f: OpportunityFilters) => void;
    keyword: string;
    onKeyword: (v: string) => void;
  }) => (
    <div>
      <pre data-testid="feed-filters">{serializeFilters(filters)}</pre>
      <pre data-testid="feed-keyword">{keyword}</pre>
      <button
        type="button"
        onClick={() => onSetFilters({ ...filters, states: ["AK"], setAsides: ["8A"] })}
      >
        stub-prime-filters
      </button>
      <button type="button" onClick={() => onKeyword("barracks")}>
        stub-prime-search
      </button>
    </div>
  ),
}));

// Heavy siblings of the chat that this feature does not exercise. Each has its
// own test file; stubbing them keeps this one about the canvas half.
vi.mock("../components/Hunter/WarmStartWizard", () => ({ WarmStartWizard: () => null }));
vi.mock("../components/Hunter/EnrichmentJourney", () => ({ EnrichmentJourney: () => null }));
vi.mock("../components/Hunter/CapabilityConflictHint", () => ({
  CapabilityConflictHint: () => null,
}));
vi.mock("../components/Hunter/HunterMessageFeedback", () => ({
  HunterMessageFeedback: () => null,
}));
vi.mock("../components/Companion/AgentAvatar", () => ({ AgentAvatar: () => null }));
vi.mock("../components/Hunter/HunterTypewriter", () => ({
  // The reveal animation is not what this file is about. Render the text at
  // once and report done, so the turn lands synchronously.
  HunterTypewriter: ({ text, onDone }: { text: string; onDone?: () => void }) => {
    onDone?.();
    return <span>{text}</span>;
  },
}));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");

beforeEach(() => {
  postHunterMessage.mockReset();
  fetchDiscoverV2.mockClear();
  fetchAll.mockClear();
  fetchWorkspace.mockClear();
  // Reduced motion, so the stage card reveals its rows with no timers.
  resetFeedTestState({ reducedMotion: true });
});

afterEach(() => cleanup());

/** Renders the feed and waits for both matches to arrive. */
async function renderFeed() {
  const view = render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  await waitFor(() =>
    expect(view.container.querySelectorAll("[data-opp-key]").length).toBe(MATCHES.length),
  );
  return view;
}

/** Applies two facets and a search term, the way the member would. */
async function primeFilters() {
  fireEvent.click(screen.getByText("stub-prime-filters"));
  fireEvent.click(screen.getByText("stub-prime-search"));
  await settle(PAST_DEBOUNCE_MS);
  expect(feedFilters().states).toEqual(["AK"]);
  expect(feedKeyword()).toBe("barracks");
}

function turn(kind: HunterTurnResponse["uiPayload"]["kind"], data: unknown): HunterTurnResponse {
  return { chatReply: REPLY_MARK, uiPayload: { kind, data }, sessionId: "s1", turnId: "t1" };
}

/**
 * Asks Hunter the way the command bar does — the route opens the rail and the
 * overlay submits the question, so the turn runs the production path.
 */
async function ask(reply: HunterTurnResponse) {
  postHunterMessage.mockResolvedValue(reply);
  await act(async () => {
    window.dispatchEvent(new CustomEvent("commandbar:ask-hunter", { detail: { text: QUESTION } }));
  });
  await waitFor(() => expect(screen.getAllByText(REPLY_MARK).length).toBeGreaterThan(0));
}

/** The feed's filter object, read off the drawer the route already feeds. */
function feedFilters(): OpportunityFilters {
  return JSON.parse(screen.getByTestId("feed-filters").textContent ?? "{}") as OpportunityFilters;
}

function feedKeyword(): string {
  return screen.getByTestId("feed-keyword").textContent ?? "";
}

function activeTabLabel(container: HTMLElement): string {
  const active = container.querySelector("button.opps-tab[aria-pressed='true']");
  return active?.querySelector(".opps-tab-label")?.textContent ?? "";
}

describe("a discovery payload changes the feed's filters", () => {
  it("replaces them wholesale and clears the search when the turn is fresh", async () => {
    await renderFeed();
    await primeFilters();

    const fresh: DiscoveryPayload = { filters: { naics: ["238160"] }, note: null, fresh: true };
    await ask(turn("discovery", fresh));

    // Everything the member had narrowed to is gone; only what Hunter sent
    // survives. A fresh query is a new question, not a refinement.
    const filters = feedFilters();
    expect(filters.naics).toEqual(["238160"]);
    expect(filters.states).toEqual([]);
    expect(filters.setAsides).toEqual([]);
    expect(feedKeyword()).toBe("");
  });

  it("merges onto the current set when the turn is not fresh", async () => {
    await renderFeed();
    await primeFilters();

    const refine: DiscoveryPayload = { filters: { naics: ["238160"] }, note: null };
    await ask(turn("discovery", refine));

    // The facets Hunter did not name are untouched, and so is the search.
    const filters = feedFilters();
    expect(filters.naics).toEqual(["238160"]);
    expect(filters.states).toEqual(["AK"]);
    expect(filters.setAsides).toEqual(["8A"]);
    expect(feedKeyword()).toBe("barracks");
  });

  it("ignores categories from Hunter: the feed has no opportunity-type filter", async () => {
    await renderFeed();

    await ask(
      turn("discovery", {
        filters: { categories: ["grant", "forecast"], states: ["NC"] },
        note: null,
        fresh: true,
      } as DiscoveryPayload),
    );
    await settle(PAST_DEBOUNCE_MS);

    expect(feedFilters()).not.toHaveProperty("categories");
    expect(feedFilters().states).toEqual(["NC"]);
    const sent = fetchDiscoverV2.mock.calls.at(-1)?.[1]?.filters;
    expect(sent).not.toHaveProperty("categories");
    expect(sent?.location?.states).toEqual(["NC"]);
  });

  it("re-filters the feed in place — the page is never remounted", async () => {
    const { container } = await renderFeed();
    const sectionBefore = container.querySelector("section");
    const summaryBefore = container.querySelector("#hunter-lead-anchor");
    const tabsBefore = container.querySelector(".opps-tabs");

    await ask(turn("discovery", { filters: { states: ["NC"] }, note: null } as DiscoveryPayload));
    await settle(PAST_DEBOUNCE_MS);

    // Same nodes, still on screen: the filter change re-ran the query, it did
    // not tear the page down and build a new one. A remount would also re-run
    // the mount-scoped workspace fetch. (The ROWS are swapped for the loading
    // state while the new answer is in flight — that is the feed re-filtering,
    // and the assertions below read the state after it settles.)
    expect(container.querySelector("section")).toBe(sectionBefore);
    expect(container.querySelector("#hunter-lead-anchor")).toBe(summaryBefore);
    expect(container.querySelector(".opps-tabs")).toBe(tabsBefore);
    expect(fetchWorkspace).toHaveBeenCalledTimes(1);

    // The list is alive underneath, answering the new filters.
    expect(container.querySelectorAll("[data-opp-key]").length).toBe(MATCHES.length);
    // `toServerFilters` nests the states under `location`; that is the request
    // the new filter produced.
    expect(fetchDiscoverV2.mock.calls.at(-1)?.[1]?.filters?.location?.states).toEqual(["NC"]);
  });
});

describe("the other feed-changing payloads", () => {
  it("switch_tab moves the feed to the tab Hunter named", async () => {
    const { container } = await renderFeed();
    expect(activeTabLabel(container)).toBe("Opportunities for you");

    await ask(turn("switch_tab", { tab: "all" } as SwitchTabPayload));

    expect(activeTabLabel(container)).toBe("All opportunities");
  });

  it("save marks the opportunity saved on the feed", async () => {
    const { container } = await renderFeed();
    const card = container.querySelector("[data-opp-key='OPP-1']") as HTMLElement;
    expect(card.querySelector(".opp-bookmark")?.getAttribute("aria-label")).toBe(
      "Save opportunity",
    );

    const payload: SaveOpportunityPayload = { saved: ["OPP-1"], unsaved: [] };
    await ask(turn("save", payload));

    // The bookmark the member sees is the feed's own saved set — Hunter's tool
    // persisted the save server-side, and this is the display catching up.
    const saved = container.querySelector("[data-opp-key='OPP-1']") as HTMLElement;
    expect(saved.querySelector(".opp-bookmark")?.getAttribute("aria-label")).toBe(
      "Remove from saved",
    );
    expect(container.querySelector("[data-opp-key='OPP-2'] .opp-bookmark")).toBeTruthy();
    expect(
      container.querySelector("[data-opp-key='OPP-2'] .opp-bookmark")?.getAttribute("aria-label"),
    ).toBe("Save opportunity");
  });

  it("save asks the server for the Saved count again, and does not count the keys", async () => {
    const { fetchSaved } = await import("../lib/saved");
    const count = vi.mocked(fetchSaved);
    const { container } = await renderFeed();
    const savedTabButton = Array.from(container.querySelectorAll("button.opps-tab")).find((b) =>
      b.textContent?.startsWith("Saved"),
    )!;
    await waitFor(() =>
      expect(savedTabButton.querySelector(".opps-tab-count")?.textContent).toBe("0"),
    );

    // Hunter saved two keys, and the Saved list shows one of them (the other
    // is a type the list does not show). The badge takes the server's word.
    count.mockResolvedValue({ opportunities: [], page: 1, limit: 1, total: 1 });
    const payload: SaveOpportunityPayload = { saved: ["OPP-1", "FORECAST-1"], unsaved: [] };
    await ask(turn("save", payload));

    await waitFor(() =>
      expect(savedTabButton.querySelector(".opps-tab-count")?.textContent).toBe("1"),
    );
    expect(count.mock.calls.at(-1)?.[1]).toEqual({ page: 1, limit: 1 });
  });
});

describe("the feed half and the stage half are disjoint", () => {
  it("an artifact payload takes the stage and leaves every filter alone", async () => {
    const { container } = await renderFeed();
    await primeFilters();
    const before = serializeFilters(feedFilters());
    const queriesBefore = fetchDiscoverV2.mock.calls.length;

    await ask(turn("eligibility", ELIGIBILITY));
    await settle(PAST_DEBOUNCE_MS);

    expect(container.querySelectorAll(".stage-card")).toHaveLength(1);
    // The list is alive underneath the card, with the filters it already had.
    expect(container.querySelectorAll("[data-opp-key]").length).toBe(MATCHES.length);
    expect(serializeFilters(feedFilters())).toBe(before);
    expect(feedKeyword()).toBe("barracks");
    // No filter moved, so the feed asked the server nothing new.
    expect(fetchDiscoverV2.mock.calls.length).toBe(queriesBefore);
  });

  // The kinds `stageArtifact.ts` records as producing no artifact. Each one
  // changes the feed instead, so a stage card here would be an artifact the
  // contract says does not exist.
  const FEED_KINDS: { kind: HunterTurnResponse["uiPayload"]["kind"]; data: unknown }[] = [
    { kind: "discovery", data: { filters: { states: ["NC"] }, note: null } },
    { kind: "switch_tab", data: { tab: "all" } },
    { kind: "save", data: { saved: [], unsaved: [] } },
    { kind: "reset", data: null },
    { kind: "none", data: null },
  ];

  for (const feedKind of FEED_KINDS) {
    it(`${feedKind.kind} puts nothing on the stage`, async () => {
      const { container } = await renderFeed();

      await ask(turn(feedKind.kind, feedKind.data));
      await settle(PAST_DEBOUNCE_MS);

      expect(container.querySelectorAll(".stage-card")).toHaveLength(0);
    });
  }
});
