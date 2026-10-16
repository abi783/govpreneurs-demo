// @vitest-environment jsdom
//
// Feature 10: the change marker on a tracked forecast. One marker, with the count
// of unseen changes, on the /forecasts card, on the My Bids row and on the feed's
// Saved-tab card. Text and an icon, never colour alone, with an accessible name.
// A failed read, watching off, seen changes and non-forecast rows show nothing.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to: _to,
    params: _params,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: string;
    params?: unknown;
    children?: ReactNode;
  }) => <a {...rest}>{children}</a>,
}));

const apiFetch = vi.fn();
vi.mock("../../lib/api", () => ({
  API_BASE_URL: "http://api.test",
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

import { WatchMarker } from "./WatchMarker";
import { ForecastCard } from "./ForecastCard";
import { BidCard } from "../Bids/BidCard";
import { OpportunityCard } from "../Hunter/OpportunityCard";
import { savedDetailToBid } from "../../lib/bids/savedDetailToBid";
import { loadForecastWatch, resetForecastWatch } from "../../lib/forecasts/watch";
import type { ScoredForecast } from "../../lib/forecasts/engine";
import type { CardOpportunity } from "../../lib/mock/opportunities";

const KEY = "a223debe377d5d02af89f2c6512e49fc";
const OTHER = "b000000000000000000000000000000b";

function event(id: string, seenAt: string | null) {
  return {
    id,
    kind: "date_moved",
    field: "expectedOn",
    before: "2026-10-01",
    after: "2027-01-01",
    decided: null,
    notice: null,
    observedAt: "2026-09-20T12:00:00.000Z",
    seenAt,
  };
}

function body(opts: { watching?: boolean; unseen?: number } = {}) {
  const unseen = opts.unseen ?? 2;
  return {
    watching: opts.watching ?? true,
    notify: false,
    forecasts: [
      {
        oppKey: KEY,
        startedAt: "2026-09-01T00:00:00.000Z",
        unseen,
        events: [
          ...Array.from({ length: unseen }, (_, i) => event(`e${i}`, null)),
          event("seen", "2026-09-21T00:00:00.000Z"),
        ],
      },
      {
        oppKey: OTHER,
        startedAt: "2026-09-01T00:00:00.000Z",
        unseen: 0,
        events: [event("seen2", "2026-09-21T00:00:00.000Z")],
      },
    ],
  };
}

function answer(status: number, json: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => json } as Response;
}

/** Loads the watch before rendering, so each card reads a settled store. */
async function withWatch(response: Response | Error) {
  if (response instanceof Error) apiFetch.mockRejectedValue(response);
  else apiFetch.mockResolvedValue(response);
  await act(async () => {
    await loadForecastWatch();
  });
}

const FORECAST_ROW = {
  oppKey: KEY,
  title: "Mobile Surveillance Maintenance for CBP",
  agency: "CBP Office of Information and Technology",
  dueDate: null,
  sourceType: "forecast",
};

function forecastCard(id: string): ScoredForecast {
  return {
    id,
    lane: "federal",
    lifecycle: "open",
    fit: "good",
    facts: { title: "Mobile Surveillance Maintenance", why: "It fits." },
    record: { agencyName: "CBP" },
    value: null,
    place: { label: null, ourRead: false },
    timing: { label: "Q1 2027", ourRead: false },
    whoMayBid: { kind: "not_shared", text: "Not shared" },
    boughtBefore: { text: "Not shared" },
    foundIn: null,
  } as unknown as ScoredForecast;
}

function feedCard(overrides: Partial<CardOpportunity> = {}): CardOpportunity {
  return {
    id: KEY,
    title: "Mobile Surveillance Maintenance",
    agency: "CBP",
    agencyAbbrev: "CBP",
    workType: "Forecast",
    value: "$1.2M",
    location: "Austin, TX",
    closeDateAbsolute: "2027-01-01",
    daysUntilClose: 90,
    matchTier: "good",
    matchScore: 70,
    hunterReasoning: null,
    mode: "prime",
    scope: "fed",
    category: "forecast",
    noticeType: "Forecast",
    ...overrides,
  };
}

const MARKER = /unseen change/;

beforeEach(() => {
  apiFetch.mockReset();
  resetForecastWatch();
});
afterEach(cleanup);

describe("WatchMarker", () => {
  it("shows the unseen count as text and an icon, with an accessible name", async () => {
    await withWatch(answer(200, body({ unseen: 2 })));
    const { container } = render(<WatchMarker oppKey={KEY} />);

    const marker = screen.getByRole("img", { name: "2 unseen changes to this forecast" });
    expect(marker.textContent).toBe("2 changes");
    expect(marker.querySelector("svg")).not.toBeNull();
    expect(container.querySelectorAll(".fw-marker")).toHaveLength(1);
  });

  it("says 1 change for one", async () => {
    await withWatch(answer(200, body({ unseen: 1 })));
    render(<WatchMarker oppKey={KEY} />);
    expect(screen.getByRole("img", { name: "1 unseen change to this forecast" }).textContent).toBe(
      "1 change",
    );
  });

  it("does not count an unseen suggestion: the count is the server's unseen", async () => {
    const suggested = {
      ...event("s1", null),
      kind: "notice_suggested",
      field: null,
      before: null,
      after: null,
      notice: {
        oppKey: "OPP_7",
        target: "opportunity",
        title: "Hangar roof",
        agencyName: "Navy",
        noticeType: "Solicitation",
        postedOn: "2026-09-25",
        held: true,
        basis: {
          kind: "suggested",
          office: "same",
          officeName: null,
          overlap: "strong",
          naicsGroupSame: null,
        },
      },
    };
    const base = body({ unseen: 1 });
    const [tracked, other] = base.forecasts;
    const withSuggestion = {
      ...base,
      forecasts: [{ ...tracked, events: [...tracked.events, suggested] }, other],
    };
    await withWatch(answer(200, withSuggestion));
    render(<WatchMarker oppKey={KEY} />);
    expect(screen.getByRole("img", { name: "1 unseen change to this forecast" }).textContent).toBe(
      "1 change",
    );
  });

  it("shows nothing when every change is seen", async () => {
    await withWatch(answer(200, body()));
    const { container } = render(<WatchMarker oppKey={OTHER} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows nothing while watching is off", async () => {
    await withWatch(answer(200, body({ watching: false })));
    const { container } = render(<WatchMarker oppKey={KEY} />);
    expect(container.innerHTML).toBe("");
  });

  it.each([
    ["a non-2xx answer", answer(500, { message: "down" })],
    ["a network failure", new Error("offline")],
    ["a body that is not the watch", answer(200, { nope: true })],
  ])("shows no marker and no error card after %s", async (_label, response) => {
    await withWatch(response);
    const { container } = render(<WatchMarker oppKey={KEY} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows nothing before the read answers", () => {
    apiFetch.mockReturnValue(new Promise(() => undefined));
    const { container } = render(<WatchMarker oppKey={KEY} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("the marker on the /forecasts card", () => {
  it("shows once on a tracked forecast with unseen changes", async () => {
    await withWatch(answer(200, body()));
    render(<ForecastCard forecast={forecastCard(KEY)} tracked onToggleTracked={vi.fn()} />);
    expect(screen.getAllByRole("img", { name: MARKER })).toHaveLength(1);
    expect(screen.getByText("2 changes")).toBeTruthy();
  });

  it("shows none on a forecast whose changes are seen", async () => {
    await withWatch(answer(200, body()));
    render(<ForecastCard forecast={forecastCard(OTHER)} tracked onToggleTracked={vi.fn()} />);
    expect(screen.queryByRole("img", { name: MARKER })).toBeNull();
  });

  it("shows none once she stops tracking it", async () => {
    await withWatch(answer(200, body()));
    render(<ForecastCard forecast={forecastCard(KEY)} tracked={false} onToggleTracked={vi.fn()} />);
    expect(screen.queryByRole("img", { name: MARKER })).toBeNull();
  });
});

describe("the marker on the My Bids row", () => {
  it("shows once on a tracked forecast row, with no countdown", async () => {
    await withWatch(answer(200, body()));
    const soon = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const { container } = render(
      <BidCard bid={savedDetailToBid({ ...FORECAST_ROW, dueDate: soon })} />,
    );
    expect(screen.getAllByRole("img", { name: MARKER })).toHaveLength(1);
    expect(screen.getByText("2 changes")).toBeTruthy();
    expect(container.querySelector(".bid-card__deadline")).toBeNull();
  });

  it("shows none on a row that is not a forecast", async () => {
    await withWatch(answer(200, body()));
    render(<BidCard bid={savedDetailToBid({ ...FORECAST_ROW, sourceType: "sam" })} />);
    expect(screen.queryByRole("img", { name: MARKER })).toBeNull();
  });

  it("shows none after a failed read", async () => {
    await withWatch(answer(503, {}));
    const { container } = render(<BidCard bid={savedDetailToBid(FORECAST_ROW)} />);
    expect(screen.queryByRole("img", { name: MARKER })).toBeNull();
    expect(container.textContent).not.toMatch(/could not|failed|error/i);
  });
});

describe("the marker on the feed's Saved-tab card", () => {
  it("shows once on a saved forecast with unseen changes", async () => {
    await withWatch(answer(200, body()));
    render(
      <OpportunityCard
        opp={feedCard()}
        saved
        onToggleSaved={vi.fn()}
        hideHuntersTake
        feedTab="saved"
      />,
    );
    expect(screen.getAllByRole("img", { name: MARKER })).toHaveLength(1);
    expect(screen.getByText("2 changes")).toBeTruthy();
  });

  it("shows none on a card that is not a forecast", async () => {
    await withWatch(answer(200, body()));
    render(
      <OpportunityCard
        opp={feedCard({ category: "contract" })}
        saved
        onToggleSaved={vi.fn()}
        hideHuntersTake
        feedTab="saved"
      />,
    );
    expect(screen.queryByRole("img", { name: MARKER })).toBeNull();
  });

  it("shows none on a saved forecast whose changes are seen", async () => {
    await withWatch(answer(200, body()));
    render(
      <OpportunityCard
        opp={feedCard({ id: OTHER })}
        saved
        onToggleSaved={vi.fn()}
        hideHuntersTake
        feedTab="saved"
      />,
    );
    expect(screen.queryByRole("img", { name: MARKER })).toBeNull();
  });

  it("does not read the watch for a card that is not a saved forecast", () => {
    render(
      <OpportunityCard
        opp={feedCard({ category: "contract" })}
        saved
        onToggleSaved={vi.fn()}
        hideHuntersTake
        feedTab="saved"
      />,
    );
    render(
      <OpportunityCard opp={feedCard()} saved={false} onToggleSaved={vi.fn()} feedTab="for_you" />,
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
