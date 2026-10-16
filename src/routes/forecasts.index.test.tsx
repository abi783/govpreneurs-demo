// @vitest-environment jsdom
//
// /forecasts on server pages (ledger feature 8), with the real Hunter overlay.
//
// The list request (`fetchForecastList`) and the chat transport are the network
// stubs. The route, the paged hook, the overlay, the stage store, the stage card,
// the Hunter mapping and the tracked-forecast store are the real modules. The
// router is a small stub that keeps the search in memory: the URL IS the list's
// state, and the URL drives the request, so the tests read both.
//
// The card-tier and count rules (ARCHITECTURE-forecasts-paginated.md, section 9)
// are asserted here on the rendered page: the view badges read `viewCounts`, the
// capture tabs read `captureCounts`, "N more in All forecasts" is
// `viewCounts.all - viewCounts.for_you`, the drawer reads `facets`, and a card's
// fit chip is its match row's tier, with none for a card with no row.
import { useSyncExternalStore, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type {
  DiscoveryPayload,
  HunterTurnResponse,
  MatchesPayload,
  SaveOpportunityPayload,
} from "../lib/hunterChat";
import type {
  ForecastListResponseDto,
  ForecastListRowDto,
  ForecastMatchRead,
  ForecastMemberDto,
} from "../lib/forecastsApi";
import type { ForecastsSearch } from "../lib/forecasts/search";

// ── The router: the search lives in memory, and navigate writes it. ──────────
let urlSearch: ForecastsSearch = {};
const listeners = new Set<() => void>();

function setUrlSearch(next: ForecastsSearch): void {
  urlSearch = next;
  listeners.forEach((l) => l());
}

function useUrlSearch(): ForecastsSearch {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => urlSearch,
  );
}

type SearchArg = ForecastsSearch | ((prev: ForecastsSearch) => ForecastsSearch);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: object) => ({ ...config, useSearch: useUrlSearch }),
  useNavigate: () => (opts: { search: SearchArg }) => {
    setUrlSearch(typeof opts.search === "function" ? opts.search(urlSearch) : opts.search);
  },
  Link: ({
    children,
    to,
    params,
    className,
    onClick,
    ...rest
  }: {
    children?: ReactNode;
    to?: string;
    params?: Record<string, string>;
    className?: string;
    onClick?: (e: { currentTarget: { blur: () => void } }) => void;
    "data-verdict"?: string;
  }) => {
    const href = Object.entries(params ?? {}).reduce(
      (path, [k, v]) => path.replace(`$${k}`, v),
      to ?? "",
    );
    return (
      <a href={href} className={className} onClick={onClick} data-verdict={rest["data-verdict"]}>
        {children}
      </a>
    );
  },
}));

// ── The list request, the takes, the transport and the member. ───────────────
const fetchForecastList =
  vi.fn<(params: URLSearchParams, signal?: AbortSignal) => Promise<ForecastListResponseDto>>();
vi.mock("../lib/forecastsApi", async (orig) => ({
  ...(await orig<typeof import("../lib/forecastsApi")>()),
  fetchForecastList: (params: URLSearchParams, signal?: AbortSignal) =>
    fetchForecastList(params, signal),
}));

/** The ids each render handed to the AI takes, in order. */
const takeIds: string[][] = [];
vi.mock("../lib/forecasts/useForecastCardTakes", () => ({
  useForecastCardTakes: (ids: string[]) => {
    takeIds.push(ids);
    return { takes: new Map<string, string>(), sentinelIndex: -1, sentinelRef: () => {} };
  },
}));

const postHunterMessage = vi.fn<(...args: unknown[]) => Promise<HunterTurnResponse>>();

vi.mock("../lib/hunterChat", async (orig) => ({
  ...(await orig<typeof import("../lib/hunterChat")>()),
  postHunterMessage: (...args: unknown[]) => postHunterMessage(...args),
  resetHunterSession: vi.fn(() => Promise.resolve()),
}));
vi.mock("../lib/workspace", () => ({
  fetchWorkspace: vi.fn(() => Promise.resolve({ savedOpps: [], savedSearches: [] })),
  addSavedOpp: vi.fn(() => Promise.resolve()),
  removeSavedOpp: vi.fn(() => Promise.resolve()),
}));
vi.mock("../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { locationId: "LOC1" }, loading: false }),
}));
vi.mock("../lib/businessProfile", () => ({
  useBusinessProfile: () => ({ profile: null, loading: false }),
  naicsLabel: () => null,
}));
vi.mock("../lib/useNaicsDescriptions", () => ({
  useNaicsDescriptionMap: () => new Map<string, string>(),
}));

// ── Overlay parts that this file does not test. ──────────────────────────────
vi.mock("../components/Hunter/EnrichmentJourney", () => ({ EnrichmentJourney: () => null }));
vi.mock("../components/Hunter/CapabilityConflictHint", () => ({
  CapabilityConflictHint: () => null,
}));
vi.mock("../components/Hunter/HunterMessageFeedback", () => ({
  HunterMessageFeedback: () => null,
}));
vi.mock("../components/Companion/AgentAvatar", () => ({ AgentAvatar: () => null }));
vi.mock("../components/Hunter/HunterTypewriter", () => ({
  // Show the reply at once, so what sits under it shows at once too.
  HunterTypewriter: ({ text, onDone }: { text: string; onDone?: () => void }) => {
    onDone?.();
    return <span>{text}</span>;
  },
}));

const { Route } = await import("./forecasts.index");
const { HUNTER_FILTER_NOTE, FILTERS, FIT_CHIP, LIST_COPY, TAB_NOTE } =
  await import("../lib/forecasts/copy");
const { HIGHERGOV_FORECASTS } = await import("../lib/forecasts/__fixtures__/forecastRecords");
const { firmFromMember, scoreLive } = await import("../lib/forecasts/live");
const { hydrateTrackedForecasts } = await import("../lib/trackedForecasts");
const { resetLoadedForecasts } = await import("../lib/forecasts/loadedForecasts");

const ForecastsPage = (Route as unknown as { component: () => ReactNode }).component;

// ── The server's answers. ────────────────────────────────────────────────────
const PAGE_SIZE = 20;
const BASE = HIGHERGOV_FORECASTS[0];
const MEMBER: ForecastMemberDto = {
  naics: ["722310"],
  states: ["GA"],
  certs: [],
  certsKnown: true,
  isSmall: true,
  registration: { status: "active", endsOn: "2028-01-31" },
  biggestPastJob: 3_000_000,
  smallestTarget: null,
  businessName: "Peach State Meals LLC",
  address: null,
};
const VIEW_COUNTS = { for_you: 45, all: 900, saved: 2 };
const CAPTURE_COUNTS = { all: 45, act_now: 1, start_capture: 2, position_early: 3, watch: 39 };
const FACETS = {
  states: [
    { value: "GA", count: 30 },
    { value: "TX", count: 15 },
  ],
  cities: [],
  naics: [],
};

function row(id: string, match: ForecastMatchRead | null = null): ForecastListRowDto {
  return {
    ...BASE,
    id,
    oppKey: id,
    hunter: { plainTitle: `Forecast ${id}`, semanticFit: 0.8, categoryFit: null },
    match,
  };
}

const rowsOf = (prefix: string, from: number, n: number) =>
  Array.from({ length: n }, (_, i) => row(`${prefix}-${from + i}`));

function answer(
  forecasts: ForecastListRowDto[],
  opts: { page?: number; hasMore?: boolean; total?: number } = {},
): ForecastListResponseDto {
  const page = opts.page ?? 1;
  return {
    member: MEMBER,
    forecasts,
    page,
    limit: PAGE_SIZE,
    hasMore: opts.hasMore ?? false,
    ...(page === 1
      ? {
          total: opts.total ?? forecasts.length,
          captureCounts: CAPTURE_COUNTS,
          viewCounts: VIEW_COUNTS,
          facets: FACETS,
        }
      : {}),
  };
}

/** The rows the stub server gives when a request names none of the narrowed keys. */
const DEFAULT_ROWS = rowsOf("fc", 1, 5);
/** The rows the stub server gives when the request carries a drawer key from Hunter. */
const NARROWED_ROWS = [row("narrow-1"), row("narrow-2")];
const NARROWING_KEYS = ["states", "naics", "expected", "q"];

/** The default server: a narrowing key answers the narrowed rows, else the default rows. */
function serveDefault(params: URLSearchParams): Promise<ForecastListResponseDto> {
  const narrowed = NARROWING_KEYS.some((k) => params.has(k));
  return Promise.resolve(answer(narrowed ? NARROWED_ROWS : DEFAULT_ROWS));
}

/** The request of one call to the list. */
const requestOf = (call: number): URLSearchParams => fetchForecastList.mock.calls[call][0];
const lastRequest = (): URLSearchParams => requestOf(fetchForecastList.mock.calls.length - 1);

/** An IntersectionObserver the test drives: `reach()` puts the list's sentinel on screen. */
let observers: IntersectionObserverCallback[] = [];
class TestObserver {
  constructor(public callback: IntersectionObserverCallback) {
    observers.push(callback);
  }
  observe() {}
  unobserve() {}
  disconnect() {
    observers = observers.filter((o) => o !== this.callback);
  }
  takeRecords() {
    return [];
  }
}
function reach(): void {
  act(() => {
    for (const cb of observers) {
      cb(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as unknown as IntersectionObserver,
      );
    }
  });
}

const REPLY = "hunter answered this turn";
const QUESTION = "show me roofing forecasts";

function reply(kind: HunterTurnResponse["uiPayload"]["kind"], data: unknown): HunterTurnResponse {
  return { chatReply: REPLY, uiPayload: { kind, data }, sessionId: "s1", turnId: "t1" };
}

/** The cards on screen, in order: the id from the card's link and its title. */
function renderedCards(): { id: string; title: string }[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>("a.fc-card")).map((a) => ({
    id: a.getAttribute("href")?.replace("/forecasts/", "") ?? "",
    title: a.querySelector(".fc-card__title")?.textContent ?? "",
  }));
}

const ids = (rows: ForecastListRowDto[]) => rows.map((r) => r.id);
const renderedIds = () => renderedCards().map((c) => c.id);

/** Renders the page and waits for page 1. */
async function openPage(): Promise<void> {
  render(<ForecastsPage />);
  await waitFor(() => expect(document.querySelectorAll("a.fc-card").length).toBeGreaterThan(0));
}

/** Types a question into the rail, sends it, and waits for the reply. */
async function ask(response: HunterTurnResponse): Promise<void> {
  postHunterMessage.mockResolvedValueOnce(response);
  const box = screen.getByPlaceholderText(/Ask Hunter/);
  fireEvent.change(box, { target: { value: QUESTION } });
  fireEvent.keyDown(box, { key: "Enter" });
  await screen.findByText(REPLY);
}

beforeEach(async () => {
  sessionStorage.clear();
  postHunterMessage.mockReset();
  fetchForecastList.mockReset();
  fetchForecastList.mockImplementation(serveDefault);
  takeIds.length = 0;
  observers = [];
  vi.stubGlobal("IntersectionObserver", TestObserver);
  resetLoadedForecasts();
  setUrlSearch({});
  await hydrateTrackedForecasts();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("/forecasts mounts the real Hunter overlay", () => {
  it("(a) sends the forecasts on screen and the forecasts surface", async () => {
    await openPage();
    await ask(reply("none", null));

    const cards = renderedCards();
    expect(cards.map((c) => c.id)).toEqual(ids(DEFAULT_ROWS));
    const [, visibleOpps, tab, surface] = postHunterMessage.mock.calls[0];
    expect(surface).toBe("forecasts");
    expect(tab).toBe("for_you");
    const firm = firmFromMember(MEMBER);
    expect(visibleOpps).toEqual(
      DEFAULT_ROWS.map((r) => {
        const f = scoreLive(r, firm);
        return { oppKey: r.id, title: f.facts.title, location: f.place.label ?? undefined };
      }),
    );
  });

  it("(b) a discovery reply writes the search words and the lane into the URL, and the URL into the request", async () => {
    await openPage();
    const discovery: DiscoveryPayload = {
      filters: { search: "roof", scope: { fed: true, sled: false } },
      note: null,
    };
    await ask(reply("discovery", discovery));

    expect(urlSearch.q).toBe("roof");
    expect(urlSearch.lane).toBe("federal");
    await waitFor(() => expect(lastRequest().get("q")).toBe("roof"));
    expect(lastRequest().get("lane")).toBe("federal");
    expect(lastRequest().get("page")).toBe("1");
  });

  it("(c) a filter the list cannot use leaves the list alone and names it under the reply", async () => {
    await openPage();
    const before = renderedCards();
    const discovery: DiscoveryPayload = { filters: { noticeTypes: ["rfp"] }, note: null };
    await ask(reply("discovery", discovery));

    expect(renderedCards()).toEqual(before);
    const line = HUNTER_FILTER_NOTE.line([{ key: "noticeTypes", value: ["rfp"] }]);
    const notes = document.querySelectorAll(".hunter-msg__filter-note");
    expect(notes).toHaveLength(1);
    expect(notes[0].textContent).toBe(line);
    // The line sits in the reply's own row, under Hunter's words.
    expect(notes[0].closest(".hunter-msg-row")?.textContent).toContain(REPLY);
  });

  it("(c) the Using row names only the filters the list applied", async () => {
    await openPage();
    const discovery: DiscoveryPayload = {
      filters: { states: ["Texas", "Atlantis"], noticeTypes: ["rfp"] },
      note: null,
    };
    await ask(reply("discovery", discovery));

    const chips = Array.from(document.querySelectorAll(".hunter-msg__restate-chip")).map(
      (n) => n.textContent,
    );
    // Texas applied, so the row names it. The list did not apply the notice type
    // or the unknown state, so the row does not claim them.
    expect(chips).toContain("Texas");
    expect(chips.some((c) => c?.includes("rfp") || c?.includes("Atlantis"))).toBe(false);
    // The note still names what the list did not apply.
    const note = document.querySelector(".hunter-msg__filter-note")?.textContent ?? "";
    expect(note).toContain("Notice type: request for proposal");
    expect(note).toContain("Atlantis");
  });

  it("(c) a turn that applies nothing shows no Using row", async () => {
    await openPage();
    await ask(reply("discovery", { filters: { noticeTypes: ["rfp"] }, note: null }));
    expect(document.querySelectorAll(".hunter-msg--restate")).toHaveLength(0);
    expect(document.querySelector(".hunter-msg__filter-note")?.textContent).toContain(
      "Notice type",
    );
  });

  it("(c) vehicles from Hunter still show the line", async () => {
    await openPage();
    const before = renderedCards();
    await ask(reply("discovery", { filters: { vehicles: ["idiq"] }, note: null }));

    expect(renderedCards()).toEqual(before);
    const notes = document.querySelectorAll(".hunter-msg__filter-note");
    expect(notes).toHaveLength(1);
    expect(notes[0].textContent).toBe(
      HUNTER_FILTER_NOTE.line([{ key: "vehicles", value: ["idiq"] }]),
    );
  });

  it.each<[string, DiscoveryPayload["filters"], string, string]>([
    ["states (Texas)", { states: ["Texas"] }, "states", "TX"],
    ["naics", { naics: ["236220"] }, "naics", "236220"],
    ["dueWindow", { dueWindow: ["60_plus"] }, "expected", "60_plus"],
  ])(
    "(c) %s from Hunter goes into the URL, the URL into the request, and the list shows the answer",
    async (_, filters, key, value) => {
      setUrlSearch({ view: "all" });
      await openPage();
      expect(renderedIds()).toEqual(ids(DEFAULT_ROWS));

      await ask(reply("discovery", { filters, note: null }));

      await waitFor(() => expect(renderedIds()).toEqual(ids(NARROWED_ROWS)));
      const request = lastRequest();
      expect(request.get(key)).toBe(value);
      expect(request.get("view")).toBe("all");
      expect(request.get("page")).toBe("1");
      expect(document.querySelectorAll(".hunter-msg__filter-note")).toHaveLength(0);
    },
  );

  it("(c) a discovery reply that every filter applies carries no line", async () => {
    await openPage();
    await ask(reply("discovery", { filters: { search: "roof" }, note: null }));
    expect(document.querySelectorAll(".hunter-msg__filter-note")).toHaveLength(0);
  });

  it("(d) a save reply shows that card as tracked", async () => {
    await openPage();
    const [first] = renderedCards();
    const card = () => document.querySelector(`a.fc-card[href="/forecasts/${first.id}"]`);
    expect(card()?.querySelector("button.opp-bookmark")?.getAttribute("aria-pressed")).toBe(
      "false",
    );

    const save: SaveOpportunityPayload = { saved: [first.id], unsaved: [] };
    await ask(reply("save", save));

    await waitFor(() =>
      expect(card()?.querySelector("button.opp-bookmark")?.getAttribute("aria-pressed")).toBe(
        "true",
      ),
    );
  });

  it("(e) a matches reply puts a card on the stage", async () => {
    await openPage();
    expect(document.querySelector(".stage-card")).toBeNull();
    const [first] = renderedCards();
    const matches: MatchesPayload = {
      rows: [
        {
          oppKey: first.id,
          title: first.title,
          tier: "strong",
          matchReasons: ["Your NAICS code"],
          dueDate: null,
          agency: "Department of the Army",
          sourceType: "forecast",
        },
      ],
    };
    await ask(reply("matches", matches));

    expect(document.querySelector(".stage-card")).not.toBeNull();
  });

  it("(f) a reset reply clears the search words, the lane and the drawer filters", async () => {
    setUrlSearch({ view: "all", q: "roof", lane: "federal", who: "small", size: "under_250k" });
    await openPage();
    await ask(reply("reset", null));

    expect(urlSearch.q).toBeUndefined();
    expect(urlSearch.lane).toBeUndefined();
    expect(urlSearch.who).toBeUndefined();
    expect(urlSearch.size).toBeUndefined();
    expect(urlSearch.view).toBe("all");
  });

  it("switches the view when Hunter switches the tab", async () => {
    await openPage();
    await ask(reply("switch_tab", { tab: "saved" }));
    expect(urlSearch.view).toBe("saved");
    await waitFor(() => expect(lastRequest().get("view")).toBe("saved"));
  });
});

describe("/forecasts reads the server's counts", () => {
  const viewBadge = (label: string) =>
    screen.getByRole("button", { name: new RegExp(label) }).querySelector(".opps-tab-count")
      ?.textContent;

  it("shows viewCounts on the three view tabs", async () => {
    await openPage();
    expect(viewBadge(LIST_COPY.views.forYou)).toBe("45");
    expect(viewBadge(LIST_COPY.views.all)).toBe("900");
    expect(viewBadge(LIST_COPY.views.saved)).toBe("2");
  });

  it("shows captureCounts on the capture tabs", async () => {
    await openPage();
    const count = (cls: string) =>
      document.querySelector(`.fc-tab--${cls} .fc-tab__count`)?.textContent;
    expect(count("all")).toBe("45");
    expect(count("act_now")).toBe("1");
    expect(count("start_capture")).toBe("2");
    expect(count("position_early")).toBe("3");
    expect(count("watch")).toBe("39");
  });

  it("says how many more are in All forecasts: viewCounts.all minus viewCounts.for_you", async () => {
    await openPage();
    expect(screen.getByText(new RegExp(LIST_COPY.moreInAll(855)))).toBeTruthy();
  });

  it("names no more-in-All count on the All view", async () => {
    setUrlSearch({ view: "all" });
    await openPage();
    expect(screen.queryByText(/more forecasts? (are|is) in All forecasts/)).toBeNull();
  });

  it("offers the drawer's states from the page-1 facets", async () => {
    await openPage();
    fireEvent.click(screen.getByRole("button", { name: FILTERS.open }));
    const states = screen.getByRole("group", { name: FILTERS.labels.states });
    expect(within(states).getByRole("option", { name: /Georgia/ }).textContent).toContain(
      FILTERS.forecastCount(30),
    );
    expect(within(states).getAllByRole("option")).toHaveLength(FACETS.states.length);
  });

  it("names no count while page 1 is loading", async () => {
    fetchForecastList.mockImplementation(() => new Promise(() => {}));
    render(<ForecastsPage />);
    expect(document.querySelectorAll(".fc-tab__count")).toHaveLength(0);
    expect(document.querySelectorAll(".opps-tab-count")).toHaveLength(0);
    expect(screen.getByText(LIST_COPY.loading)).toBeTruthy();
  });
});

describe("/forecasts card tier", () => {
  it("shows each card's match row as its chip, and no chip for a card with no row", async () => {
    fetchForecastList.mockImplementation(() =>
      Promise.resolve(
        answer([
          row("m-strong", { tier: "strong", finalScore: 70 }),
          row("m-stretch", { tier: "stretch", finalScore: 50 }),
          row("m-none", null),
        ]),
      ),
    );
    setUrlSearch({ view: "all" });
    await openPage();
    const chipOf = (id: string) =>
      document.querySelector(`a.fc-card[href="/forecasts/${id}"] .fc-fit`)?.textContent ?? null;
    expect(chipOf("m-strong")).toBe(FIT_CHIP.bid);
    expect(chipOf("m-stretch")).toBe(FIT_CHIP.lean);
    expect(chipOf("m-none")).toBeNull();
  });
});

describe("/forecasts sort menu", () => {
  const sortSelect = () =>
    screen.getByRole("combobox", { name: FILTERS.sortAria }) as HTMLSelectElement;
  const optionValues = () => Array.from(sortSelect().options).map((o) => o.value);

  it("offers Best match on For you, and sends no sort for it", async () => {
    await openPage();
    expect(optionValues()).toContain("match");
    expect(sortSelect().value).toBe("match");
    expect(requestOf(0).has("sort")).toBe(false);
  });

  it("does not offer Best match on All or Saved, which open soonest first", async () => {
    for (const view of ["all", "saved"] as const) {
      setUrlSearch({ view });
      await openPage();
      expect(optionValues()).not.toContain("match");
      expect(sortSelect().value).toBe("soonest");
      expect(lastRequest().has("sort")).toBe(false);
      cleanup();
    }
  });

  it("writes a chosen sort to the URL and the request, and keeps the view's default absent", async () => {
    setUrlSearch({ view: "all" });
    await openPage();
    fireEvent.change(sortSelect(), { target: { value: "newest" } });
    expect(urlSearch.sort).toBe("newest");
    await waitFor(() => expect(lastRequest().get("sort")).toBe("newest"));

    fireEvent.change(sortSelect(), { target: { value: "soonest" } });
    expect(urlSearch.sort).toBeUndefined();
  });

  it("drops a sort from the URL when it is the default of the view she moves to", async () => {
    setUrlSearch({ sort: "soonest" });
    await openPage();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(LIST_COPY.views.all) }));
    expect(urlSearch.view).toBe("all");
    expect(urlSearch.sort).toBeUndefined();
    await waitFor(() => expect(lastRequest().get("view")).toBe("all"));
    expect(lastRequest().has("sort")).toBe(false);
    expect(lastRequest().get("page")).toBe("1");
  });
});

describe("/forecasts on server pages", () => {
  it("asks page 2 at the sentinel, appends it, and hands every loaded id to the takes in order", async () => {
    const first = rowsOf("p", 1, PAGE_SIZE);
    const second = rowsOf("p", 21, 5);
    fetchForecastList.mockImplementation((params) =>
      Promise.resolve(
        params.get("page") === "1"
          ? answer(first, { hasMore: true, total: 25 })
          : answer(second, { page: 2 }),
      ),
    );
    await openPage();
    expect(renderedIds()).toEqual(ids(first));

    reach();
    await waitFor(() => expect(renderedIds()).toHaveLength(25));
    const page2 = lastRequest();
    expect(page2.get("page")).toBe("2");
    expect(page2.get("view")).toBe("for_you");
    expect(renderedIds()).toEqual([...ids(first), ...ids(second)]);
    expect(takeIds.at(-1)).toEqual([...ids(first), ...ids(second)]);
  });

  it("shows the error notice when page 1 fails, and Retry asks page 1 again", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchForecastList.mockRejectedValueOnce(new Error("offline"));
    render(<ForecastsPage />);
    await screen.findByText(LIST_COPY.loadError);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(renderedIds()).toEqual(ids(DEFAULT_ROWS)));
    expect(lastRequest().get("page")).toBe("1");
  });

  it("keeps the rows when a later page fails, and Retry asks that page again", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const first = rowsOf("p", 1, PAGE_SIZE);
    let failNext = true;
    fetchForecastList.mockImplementation((params) => {
      if (params.get("page") === "1") return Promise.resolve(answer(first, { hasMore: true }));
      if (failNext) {
        failNext = false;
        return Promise.reject(new Error("offline"));
      }
      return Promise.resolve(answer(rowsOf("p", 21, 2), { page: 2 }));
    });
    await openPage();
    reach();
    await screen.findByText(LIST_COPY.moreError);
    expect(renderedIds()).toEqual(ids(first));

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(renderedIds()).toHaveLength(22));
    expect(lastRequest().get("page")).toBe("2");
    expect(screen.queryByText(LIST_COPY.moreError)).toBeNull();
  });
});

describe("/forecasts empty states", () => {
  const empty = () => fetchForecastList.mockImplementation(() => Promise.resolve(answer([])));

  it("tells her how to save one when her saved list is empty", async () => {
    empty();
    setUrlSearch({ view: "saved" });
    render(<ForecastsPage />);
    await screen.findByText(LIST_COPY.noSaved);
  });

  it("offers to clear the filters when the filters leave nothing", async () => {
    empty();
    setUrlSearch({ view: "all", who: "small" });
    render(<ForecastsPage />);
    await screen.findByText(FILTERS.noMatch);
    fireEvent.click(screen.getByRole("button", { name: FILTERS.clearAll }));
    expect(urlSearch.who).toBeUndefined();
  });

  it("offers to clear the search when the search leaves nothing", async () => {
    empty();
    setUrlSearch({ view: "all", q: "zzz" });
    render(<ForecastsPage />);
    await screen.findByText(LIST_COPY.noResults);
  });

  it("offers every forecast when a capture tab is empty", async () => {
    empty();
    setUrlSearch({ view: "all", tab: "act_now" });
    render(<ForecastsPage />);
    await screen.findByText(TAB_NOTE.emptyTab);
    fireEvent.click(screen.getByRole("button", { name: TAB_NOTE.showAll }));
    expect(urlSearch.tab).toBeUndefined();
  });
});
