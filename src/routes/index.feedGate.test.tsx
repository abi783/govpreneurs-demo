// @vitest-environment jsdom
//
// The For You gate: which members see the preview wizard, and what an embedded
// member with no open match sees instead.
//
//   - no live match and no profile vector → the preview wizard;
//   - a live match → the ranked feed, with or without a vector;
//   - a profile vector but no live match → the ranked feed's honest empty state,
//     never the preview as a fallback, and never a sentence that blames filters.
//
// The shared stubs and helpers come from `__testing__/feedHarness`.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PAST_DEBOUNCE_MS, resetFeedTestState, settle } from "./__testing__/feedHarness";

const NO_MATCHES_NOW = /There are no matches for you right now/;
const WIZARD = "stub-warm-start-wizard";

type Gate = { hasLiveMatches: boolean | null; hasProfileVector: boolean };

let gate: Gate = { hasLiveMatches: false, hasProfileVector: false };
const fetchFilterDefaults = vi.fn(() =>
  Promise.resolve({
    naics: [],
    setAsides: [],
    states: [],
    cities: [],
    hasCapabilityStatement: false,
    ...gate,
  }),
);

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
// A marker, so a test can see the preview's answer step.
vi.mock("../components/Hunter/WarmStartWizard", () => ({
  WarmStartWizard: () => <div data-testid={WIZARD} />,
}));
vi.mock("../components/Hunter/Stage/StageCard", () => ({ StageCardMount: () => null }));
vi.mock("../components/Hunter/FiltersDrawer", () => ({ FiltersDrawer: () => null }));

const { OpportunitiesFeed } = await import("./index");
const { StageStoreProvider } = await import("../lib/hunter/stageStore");

beforeEach(() => {
  fetchFilterDefaults.mockClear();
  resetFeedTestState();
});

afterEach(() => {
  cleanup();
});

/** Renders the feed with the given gate facts and waits for it to settle. */
async function renderWithGate(next: Gate) {
  gate = next;
  render(
    <StageStoreProvider>
      <OpportunitiesFeed />
    </StageStoreProvider>,
  );
  await settle(0);
  await settle(PAST_DEBOUNCE_MS);
}

describe("For You gate", () => {
  it("shows the preview wizard to a member with no live match and no vector", async () => {
    await renderWithGate({ hasLiveMatches: false, hasProfileVector: false });

    expect(screen.queryByTestId(WIZARD)).not.toBeNull();
    expect(screen.queryByText(NO_MATCHES_NOW)).toBeNull();
  });

  it("tells an embedded member with no live match the truth, never the preview", async () => {
    await renderWithGate({ hasLiveMatches: false, hasProfileVector: true });

    expect(screen.queryByTestId(WIZARD)).toBeNull();
    expect(screen.queryByText(NO_MATCHES_NOW)).not.toBeNull();
    expect(screen.queryByText(/loosening your filters/)).toBeNull();
  });

  it("shows the ranked feed to a member with a live match and no vector", async () => {
    await renderWithGate({ hasLiveMatches: true, hasProfileVector: false });

    expect(screen.queryByTestId(WIZARD)).toBeNull();
    expect(screen.queryByText(NO_MATCHES_NOW)).toBeNull();
  });

  it("does not show the preview when the live-match read failed", async () => {
    await renderWithGate({ hasLiveMatches: null, hasProfileVector: false });

    expect(screen.queryByTestId(WIZARD)).toBeNull();
  });
});
