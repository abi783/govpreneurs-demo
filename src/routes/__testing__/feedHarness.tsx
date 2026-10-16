// The setup every `routes/index.*.test.tsx` file shares, in one place.
//
// The feed route pulls in eleven modules that a unit test has no business
// reaching — the API clients, the session, the router. Each test file stubbed
// all eleven itself, so the same ~70 lines stood six times and a change to one
// module's shape meant six edits.
//
// HOW THE STUBS REACH A `vi.mock` FACTORY. Vitest hoists every `vi.mock` call
// above the file's imports, so a top-level import of this module is NOT in
// scope inside a factory. The factory therefore imports it dynamically:
//
//   vi.mock("../lib/workspace", async () =>
//     (await import("./__testing__/feedHarness")).workspaceStub());
//
// The factory body runs late — when the route first imports the stubbed module
// — so a caller may also hand a stub its own `vi.fn`, declared as a plain
// top-level `const`. That const is initialised by then.
//
// What belongs here: setup that is IDENTICAL across files, or differs by one
// value that a parameter carries. A detail only one file needs stays in that
// file.
import { act } from "@testing-library/react";
import type { MouseEventHandler, ReactNode } from "react";
import { vi } from "vitest";
import type { DiscoverV2OpportunityDto } from "../../lib/discoverMapper";
import type { PreviewOpportunityDto } from "../../lib/preview";
import { clearFeedSnapshot } from "../../lib/feedSnapshot";
import { clearFeedView } from "../../lib/feedViewMemory";

/** The GoHighLevel location every feed test signs in as. */
export const LOCATION_ID = "loc-1";

/** Longer than SEARCH_DEBOUNCE_MS (250) in the route, so a refetch that WOULD
 *  fire has fired by the time the assertion runs. */
export const PAST_DEBOUNCE_MS = 400;

/** What a `vi.mock` factory hands back: the module's exports, stubbed. */
type ModuleStub = Record<string, unknown>;

/** Vitest's `importOriginal` callback, as the stubs below use it. */
type ImportOriginal = <T>() => Promise<T>;

const DAY_MS = 86_400_000;

/** An ISO timestamp `days` from now. A negative `days` is in the past. */
export function isoInDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

/** One scored opportunity as `/discover/v2` returns it. Pass only what differs. */
export function discoverOpp(
  id: string,
  title: string,
  over: Partial<DiscoverV2OpportunityDto> = {},
): DiscoverV2OpportunityDto {
  return {
    id,
    title,
    scope: "fed",
    geminiPlainEnglishTitle: null,
    agency: { name: "USACE" },
    noticeType: "Solicitation",
    responseDeadline: isoInDays(20),
    postedDate: isoInDays(-4),
    setAside: "SDVOSBC",
    naicsCode: "238160",
    valEstLow: null,
    valEstHigh: null,
    placeOfPerformance: { city: "Fayetteville", state: "NC" },
    status: "active",
    quickSummary: null,
    relevanceScore: 80,
    tier: "priority",
    matchReasons: [],
    matchBreakdown: { eligible: true },
    scoreBreakdown: { businessCategoryMatch: 30, certificationMatch: 25, locationMatch: 20 },
    ...over,
  };
}

/** One unscored opportunity as the Saved and preview feeds return it. */
export function savedOpp(id: string, title: string, closesInDays: number): PreviewOpportunityDto {
  return {
    id,
    title,
    scope: "fed",
    agency: { name: "USACE" },
    noticeType: "Solicitation",
    responseDeadline: isoInDays(closesInDays),
    postedDate: isoInDays(-10),
    setAside: "",
    naicsCode: "238160",
    classificationCode: "Z2AA",
    placeOfPerformance: { state: "NC", city: "Fayetteville" },
    valEstLow: 100_000,
    valEstHigh: 200_000,
    quickSummary: null,
  };
}

/** An empty page, which is what a feed answers when the test does not care. */
function emptyPage(): ModuleStub {
  return { data: [], total: 0, page: 1, limit: 50, totalPages: 1, scoringEngine: "v5" };
}

/** Stubs `lib/saved`. The member has bookmarked nothing unless the caller says so. */
export function savedStub(over: ModuleStub = {}): ModuleStub {
  return {
    fetchSaved: vi.fn(() => Promise.resolve({ opportunities: [], page: 1, limit: 50, total: 0 })),
    ...over,
  };
}

/** Stubs `lib/workspace`: an empty workspace whose writes all succeed. */
export function workspaceStub(over: ModuleStub = {}): ModuleStub {
  return {
    fetchWorkspace: vi.fn(() => Promise.resolve({ savedOpps: [], savedSearches: [] })),
    addSavedOpp: vi.fn(() => Promise.resolve()),
    removeSavedOpp: vi.fn(() => Promise.resolve()),
    addSavedSearch: vi.fn(() => Promise.resolve({ id: "s1", name: "n", filters: {} })),
    removeSavedSearch: vi.fn(() => Promise.resolve()),
    ...over,
  };
}

/** Stubs `lib/all`: the All tab answers empty. */
export function allStub(over: ModuleStub = {}): ModuleStub {
  return {
    fetchAll: vi.fn(() => Promise.resolve({ opportunities: [], page: 1, limit: 50, total: 0 })),
    ...over,
  };
}

/** Stubs the two network calls in `lib/discoverApi`, keeping the pure helpers real. */
export async function discoverApiStub(
  orig: ImportOriginal,
  over: ModuleStub = {},
): Promise<ModuleStub> {
  return {
    ...(await orig<ModuleStub>()),
    fetchDiscoverV2: vi.fn(() => Promise.resolve(emptyPage())),
    fetchFilterDefaults: vi.fn(() =>
      Promise.resolve({
        naics: [],
        setAsides: [],
        states: [],
        cities: [],
        hasCapabilityStatement: true,
      }),
    ),
    ...over,
  };
}

/** Stubs `lib/preview`: no stored wizard answers, so the preview feed is empty. */
export async function previewStub(orig: ImportOriginal): Promise<ModuleStub> {
  return {
    ...(await orig<ModuleStub>()),
    fetchPreview: vi.fn(() =>
      Promise.resolve({ opportunities: [], previewReady: false, page: 1, limit: 50, total: 0 }),
    ),
    fetchPreviewAnswers: vi.fn(() => Promise.resolve(null)),
  };
}

/** Stubs `lib/huntersTakeApi`: no take on any row. */
export function huntersTakeApiStub(): ModuleStub {
  return { fetchHuntersTakes: vi.fn(() => Promise.resolve([])) };
}

/** Stubs `lib/hunterChat` for a test that never sends a turn. */
export function hunterChatStub(): ModuleStub {
  return { resetHunterSession: vi.fn() };
}

/** Stubs `lib/useNaicsDescriptions`: the hook passes its cards straight through. */
export function naicsDescriptionsStub(): ModuleStub {
  return { useNaicsDescriptions: <T,>(cards: T) => cards };
}

/** Stubs `lib/ghlUser`: signed in as {@link LOCATION_ID}, never loading. */
export function ghlUserStub(): ModuleStub {
  return {
    useGhlUser: () => ({ session: { locationId: LOCATION_ID, productId: null }, loading: false }),
  };
}

/** Stubs the `lib/businessProfile` hook, keeping the module's helpers real. */
export async function businessProfileStub(orig: ImportOriginal): Promise<ModuleStub> {
  return {
    ...(await orig<ModuleStub>()),
    useBusinessProfile: () => ({ profile: null, loading: false, error: null }),
  };
}

/** The router is not mounted in a unit test, so `useRouter` and `Link` are
 *  stubbed to their rendered shape. */
export function routerStub(): ModuleStub {
  return {
    createFileRoute: () => (config: unknown) => config,
    useRouter: () => ({ subscribe: () => () => {} }),
    Link: ({
      children,
      to,
      className,
      onClick,
      ...rest
    }: {
      children?: ReactNode;
      to?: string;
      className?: string;
      onClick?: MouseEventHandler<HTMLAnchorElement>;
      "data-opp-key"?: string;
    }) => (
      <a href={to} className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    ),
  };
}

/** An observer that records nothing: the route may build one, no test fires it. */
class InertIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

/** Answers every media query, reporting reduced motion only when asked to. */
function stubMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

/**
 * Clears the state a feed test would otherwise inherit from its predecessor.
 *
 * The return-visit snapshot and the remembered view are module scope by design,
 * so they outlive an unmount — and would replay the previous test's rows, tab
 * and filters into the next one. Call this from
 * `beforeEach`.
 *
 * Pass `reducedMotion` to make `CountTicker` and the stage card render their
 * final state at once. Pass `intersectionObserver` to watch what the route
 * observes; the default records nothing.
 */
export function resetFeedTestState(
  opts: { reducedMotion?: boolean; intersectionObserver?: typeof IntersectionObserver } = {},
): void {
  window.sessionStorage.clear();
  window.localStorage.clear();
  clearFeedSnapshot();
  clearFeedView();
  globalThis.IntersectionObserver =
    opts.intersectionObserver ??
    (InertIntersectionObserver as unknown as typeof IntersectionObserver);
  stubMatchMedia(opts.reducedMotion ?? false);
}

/** Lets React and every pending timer shorter than `ms` run to completion. */
export async function settle(ms: number): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/** The titles of the opportunity cards on screen, in rendered order. */
export function renderedTitles(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("h3.opp-title-compact")).map(
    (h) => h.textContent ?? "",
  );
}
