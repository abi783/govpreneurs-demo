// @vitest-environment jsdom
//
// How to win it with Grant's take: each counted figure shows with its basis line and a
// source line resolved through the public-record pattern. A fact that was not checked
// shows nothing, and a derived comparison carries Our read.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import { ForecastGrantTake } from "./ForecastGrantTake";
import type { ScoredForecast } from "../../lib/forecasts/engine";
import { SCORED_FORECASTS } from "../../lib/forecasts/__fixtures__/scored";
import { readForecast } from "../../lib/forecasts/grant";
import { PROGRAM_PATHS, TAKE_COPY, WIN } from "../../lib/forecasts/grantCopy";
import type { ForecastTakeResponse } from "../../lib/forecasts/grantTakeApi";
import type { WatchCopyState } from "../../lib/forecasts/watch";
import { WATCH_PROMISE } from "../../lib/forecasts/watchCopy";
import { emptyTakeFixture, takeFixture } from "../../lib/forecasts/take.fixture";

const FORBIDDEN = /deadline|due|closes|higher\s*gov/i;

/** A federal forecast whose read is Prepare or Needs review, so How to win it shows. */
const f = SCORED_FORECASTS.find(
  (x) =>
    x.lane === "federal" &&
    x.record.valLow != null &&
    ["prepare", "review"].includes(readForecast(x).call),
) as ScoredForecast;

function renderTake(take: ForecastTakeResponse | null) {
  return render(
    <ForecastGrantTake
      read={readForecast(f, {}, take)}
      asks={false}
      canRaise={false}
      tracked={false}
      watchState="off"
      onAnswerGrant={() => undefined}
    />,
  );
}

/** The How to win it row whose label is `label`, or null. */
function winRow(label: string): HTMLElement | null {
  const term = screen.queryByText(label, { selector: "dt" });
  return term?.parentElement ?? null;
}

afterEach(cleanup);

describe("How to win it with Grant's take", () => {
  it("has a forecast this case needs", () => {
    expect(f).toBeDefined();
  });

  it("shows each figure with its basis line and its public source", () => {
    renderTake(takeFixture(f.id));

    const paid = winRow(WIN.rows.paid);
    expect(paid).not.toBeNull();
    const inPaid = within(paid as HTMLElement);
    expect(inPaid.getByText("$170K")).toBeTruthy();
    expect(inPaid.getByText(/^186 awards counted\. Matched on: NAICS 722310/)).toBeTruthy();
    expect(inPaid.getByText(/^Source: Federal award records, /)).toBeTruthy();
    expect(inPaid.getByText(TAKE_COPY.note.awards)).toBeTruthy();

    const won = within(winRow(WIN.rows.won) as HTMLElement);
    expect(won.getByText("31 firms")).toBeTruthy();
    expect(won.getByText(/^31 firms counted\./)).toBeTruthy();

    const office = within(winRow(WIN.rows.office) as HTMLElement);
    expect(office.getByText("22 of 40")).toBeTruthy();
    expect(winRow("What work like this was worth")).not.toBeNull();
    expect(winRow("What work like this paid")).toBeNull();
    expect(office.getByText(/^Source: Contracting office award history, /)).toBeTruthy();
    expect(office.getByText(/^Source: Agency forecast, /)).toBeTruthy();
    expect(office.getByText(`${TAKE_COPY.note.setAside} ${TAKE_COPY.note.forecasts}`)).toBeTruthy();
    expect(office.queryByText(TAKE_COPY.note.awards)).toBeNull();
  });

  it("marks the estimate comparison Our read", () => {
    renderTake(takeFixture(f.id));
    const paid = winRow(WIN.rows.paid) as HTMLElement;
    expect(within(paid).getAllByText("Our read").length).toBeGreaterThan(0);
  });

  it("shows none of the take's rows when nothing was checked, and never a zero", () => {
    const { container } = renderTake(emptyTakeFixture(f.id));
    for (const label of [WIN.rows.won, WIN.rows.paid, WIN.rows.office])
      expect(winRow(label)).toBeNull();
    expect(container.textContent).not.toMatch(/\b0 (awards|firms|forecasts)\b/);
    expect(container.textContent).not.toContain("not over this forecast");
  });

  it("renders the same page with a failed take as with none", () => {
    const none = renderTake(null).container.innerHTML;
    cleanup();
    expect(renderTake(emptyTakeFixture(f.id)).container.innerHTML).toBe(none);
  });

  it("renders a firm name as text, never as markup", () => {
    const take = takeFixture(f.id);
    const winners = take.counted.marketWinners;
    if (winners.state !== "counted" || !winners.source.provenance.tally) throw new Error("fixture");
    winners.source.provenance.tally.firms = [
      { name: "<img src=x onerror=alert(1)>", awards: 2, totalValue: null },
    ];
    const { container } = renderTake(take);
    expect(container.querySelector(".fc-win img[src='x']")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)> (2)");
  });

  it("holds no deadline word and never names the vendor", () => {
    const { container } = renderTake(takeFixture(f.id));
    expect(container.textContent).not.toMatch(FORBIDDEN);
  });
});

describe("the note under the path tiles", () => {
  const renderRead = (read: ReturnType<typeof readForecast>) =>
    render(
      <ForecastGrantTake
        read={read}
        asks={false}
        canRaise={false}
        tracked={false}
        watchState="off"
        onAnswerGrant={() => undefined}
      />,
    );

  it("shows the read's paths note under the tiles", () => {
    const { container } = renderRead({ ...readForecast(f), pathsNote: PROGRAM_PATHS.note });
    expect(container.querySelector(".fc-paths__note")?.textContent).toBe(PROGRAM_PATHS.note);
  });

  it("shows no note when the read has none", () => {
    const { container } = renderRead({ ...readForecast(f), pathsNote: undefined });
    expect(container.querySelector(".fc-paths__note")).toBeNull();
  });
});

describe("Still unknown, per watch state (feature 12)", () => {
  const PROMISE = /\bwatched\b|hear when|\btell you\b|get told/i;
  /** A forecast whose read holds an unknown that settles by a watch. */
  const watched = SCORED_FORECASTS.find((x) =>
    readForecast(x).unknowns.some((u) => u.how === "watch"),
  ) as ScoredForecast;

  const renderState = (watchState: WatchCopyState, tracked: boolean) =>
    render(
      <ForecastGrantTake
        read={readForecast(watched)}
        asks={false}
        canRaise={false}
        tracked={tracked}
        watchState={watchState}
        onAnswerGrant={() => undefined}
      />,
    );

  const unknownBox = (container: HTMLElement) =>
    container.querySelector(".fc-unknown") as HTMLElement;

  it("has a forecast this case needs", () => {
    expect(watched).toBeDefined();
  });

  it("promises no watch while watching is off, tracked or not", () => {
    for (const tracked of [false, true]) {
      const { container } = renderState("off", tracked);
      const box = unknownBox(container);
      expect(box.textContent).not.toMatch(PROMISE);
      expect(box.querySelector(".fc-unknown__track")).toBeNull();
      expect(box.querySelector(".fc-how--watch")).toBeNull();
      cleanup();
    }
  });

  it("shows the watch chip and the track line while watching is on", () => {
    const { container } = renderState("inApp", false);
    const box = unknownBox(container);
    expect(within(box).getAllByText("Watched once you track it").length).toBeGreaterThan(0);
    expect(box.querySelector(".fc-unknown__track")?.textContent).toBe(
      WATCH_PROMISE.inApp.trackLine,
    );
  });

  it("shows Watched and no track line once she tracks it", () => {
    const { container } = renderState("inApp", true);
    const box = unknownBox(container);
    expect(within(box).getAllByText("Watched").length).toBeGreaterThan(0);
    expect(box.querySelector(".fc-unknown__track")).toBeNull();
  });
});
