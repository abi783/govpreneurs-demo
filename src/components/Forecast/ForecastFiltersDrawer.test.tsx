// @vitest-environment jsdom
//
// The forecast Filters drawer. The state, city and NAICS options and their counts are
// the server's page-1 `facets`; the fixed-choice groups show no counts; the Show
// button reads the server's `total` (ARCHITECTURE-forecasts-paginated.md, section 9).
// The words must describe a forecast date as the date the buyer expects to post,
// never as a deadline.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { ForecastFiltersDrawer } from "./ForecastFiltersDrawer";
import { FILTERS } from "../../lib/forecasts/copy";
import {
  EMPTY_FILTERS,
  EXPECTED_WINDOWS,
  POSTED_WITHIN_CHOICES,
  WHO_KINDS,
  WORK_KINDS,
  type ForecastFilters,
} from "../../lib/forecasts/filters";
import type { ForecastFacetsDto } from "../../lib/forecastsApi";
import type { ForecastFacetsState } from "../../lib/forecasts/useForecastList";

// The taxonomy lookup is a network call. The drawer test holds it to one known code,
// so a code the lookup does not resolve shows as the code alone.
const ROOFING_WORDS = "Roofing Contractors";
vi.mock("../../lib/useNaicsDescriptions", () => ({
  useNaicsDescriptionMap: () => new Map([["238160", ROOFING_WORDS]]),
}));

/** Words that make a forecast's date sound like a date bids close on. */
const DEADLINE_WORDS = /\b(deadline|due|closes?)\b/i;

const FACETS: ForecastFacetsDto = {
  states: [
    { value: "OK", count: 1 },
    { value: "TX", count: 2 },
  ],
  cities: [
    { value: "Dallas", count: 1 },
    { value: "Houston", count: 1 },
  ],
  naics: [
    { value: "236220", count: 1 },
    { value: "238160", count: 2 },
  ],
};

function renderDrawer(
  filters: ForecastFilters,
  opts: {
    facets?: ForecastFacetsDto | null;
    facetsState?: ForecastFacetsState;
    total?: number | null;
    open?: boolean;
  } = {},
  onChange = vi.fn(),
) {
  const view = render(
    <ForecastFiltersDrawer
      open={opts.open ?? true}
      onClose={() => {}}
      facets={opts.facets === undefined ? FACETS : opts.facets}
      facetsState={opts.facetsState ?? "current"}
      total={opts.total === undefined ? 3 : opts.total}
      filters={filters}
      onChange={onChange}
    />,
  );
  return { onChange, rerender: view.rerender };
}

const group = (name: string) => screen.getByRole("group", { name });

afterEach(cleanup);

describe("ForecastFiltersDrawer: fixed-choice groups", () => {
  it("shows no counts on work, who may bid or the expected posting date", () => {
    renderDrawer(EMPTY_FILTERS);
    const pills = [
      ...WORK_KINDS.map((k) => [FILTERS.labels.work, FILTERS.work[k]]),
      ...WHO_KINDS.map((k) => [FILTERS.labels.who, FILTERS.who[k]]),
      ...EXPECTED_WINDOWS.map((w) => [FILTERS.labels.expected, FILTERS.expected[w]]),
    ];
    for (const [groupName, label] of pills) {
      const pill = within(group(groupName)).getByRole("button", { name: label });
      expect(pill.textContent).toBe(label);
    }
  });

  it("shows no counts on place, size, posted, bought before or status", () => {
    renderDrawer(EMPTY_FILTERS);
    expect(document.querySelectorAll(".of-seg__count")).toHaveLength(0);
    expect(document.querySelectorAll(".fd-pill__count")).toHaveLength(0);
  });
});

describe("ForecastFiltersDrawer: expected posting date", () => {
  it("adds and removes a window, and marks the ones chosen", () => {
    const { onChange } = renderDrawer({ ...EMPTY_FILTERS, expected: ["this_week"] });
    const expected = group(FILTERS.labels.expected);
    const week = within(expected).getByRole("button", { name: /7 days/ });
    expect(week.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(within(expected).getByRole("button", { name: /60 days/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FILTERS,
      expected: ["this_week", "60_plus"],
    });
    fireEvent.click(week);
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, expected: [] });
  });

  it("calls the date the expected posting date, never a deadline", () => {
    renderDrawer(EMPTY_FILTERS);
    const words = [
      FILTERS.labels.expected,
      FILTERS.expectedGloss,
      FILTERS.sections.timing.sub,
      ...Object.values(FILTERS.expected),
      group(FILTERS.labels.expected).textContent ?? "",
    ];
    for (const text of words) expect(text).not.toMatch(DEADLINE_WORDS);
    expect(FILTERS.labels.expected).toBe("Expected posting date");
  });
});

describe("ForecastFiltersDrawer: exact value range", () => {
  const rangeGroup = () => group(FILTERS.labels.valueRange);

  it("writes whole dollars for the minimum and the maximum when the member leaves a box", () => {
    const { onChange } = renderDrawer(EMPTY_FILTERS);
    const [min, max] = within(rangeGroup()).getAllByRole("textbox");

    fireEvent.change(min, { target: { value: "$500,000" } });
    fireEvent.blur(min);
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, valueMin: 500_000 });

    fireEvent.change(max, { target: { value: "2m" } });
    fireEvent.blur(max);
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FILTERS,
      valueMin: 500_000,
      valueMax: 2_000_000,
    });
  });

  it("shows the range it holds, and an empty box clears its bound", () => {
    const { onChange } = renderDrawer({ ...EMPTY_FILTERS, valueMin: 250_000, valueMax: null });
    const [min, max] = within(rangeGroup()).getAllByRole<HTMLInputElement>("textbox");
    expect(min.value).toBe("$250,000");
    expect(max.value).toBe("");

    fireEvent.change(min, { target: { value: "" } });
    fireEvent.blur(min);
    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FILTERS);
  });

  it("says on the page that a forecast with no estimate is not shown, and that both value filters apply", () => {
    renderDrawer(EMPTY_FILTERS);
    const note = within(rangeGroup()).getByText(FILTERS.valueRangeNote);
    expect(note.textContent).toMatch(/no estimate is not shown/);
    expect(note.textContent).toContain(FILTERS.labels.size);
  });
});

describe("ForecastFiltersDrawer: states and cities from the server's facets", () => {
  it("offers the facet states by name, with the server's count", () => {
    renderDrawer(EMPTY_FILTERS);
    const states = group(FILTERS.labels.states);
    expect(within(states).getByRole("option", { name: /Texas/ }).textContent).toContain(
      FILTERS.forecastCount(2),
    );
    expect(within(states).getByRole("option", { name: /Oklahoma/ }).textContent).toContain(
      FILTERS.forecastCount(1),
    );
  });

  it("writes the USPS code when the member picks a state", () => {
    const { onChange } = renderDrawer(EMPTY_FILTERS);
    fireEvent.click(within(group(FILTERS.labels.states)).getByRole("option", { name: /Oklahoma/ }));
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, states: ["OK"] });
  });

  it("offers exactly the facet cities, and writes the city name", () => {
    const { onChange } = renderDrawer({ ...EMPTY_FILTERS, states: ["TX"] });
    const cities = group(FILTERS.labels.cities);
    const names = within(cities)
      .getAllByRole("option")
      .map((o) => o.textContent ?? "");
    expect(names).toHaveLength(FACETS.cities.length);
    fireEvent.click(within(cities).getByRole("option", { name: /Houston/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FILTERS,
      states: ["TX"],
      cities: ["Houston"],
    });
  });

  it("says on the page that a forecast with no place is not shown, and how the place filters apply", () => {
    renderDrawer(EMPTY_FILTERS);
    const note = screen.getByText(FILTERS.placeNote);
    expect(note.textContent).toMatch(/names no place is not shown/);
    expect(note.textContent).toContain(FILTERS.place.served);
  });
});

describe("ForecastFiltersDrawer: NAICS codes from the server's facets", () => {
  it("offers the facet codes with the taxonomy's words and the server's count", () => {
    renderDrawer(EMPTY_FILTERS);
    const roofing = within(group(FILTERS.labels.naics)).getByRole("option", { name: /238160/ });
    expect(roofing.textContent).toContain(ROOFING_WORDS);
    expect(roofing.textContent).toContain(FILTERS.forecastCount(2));
  });

  it("shows a code the taxonomy does not resolve as the code alone", () => {
    renderDrawer(EMPTY_FILTERS);
    const housing = within(group(FILTERS.labels.naics)).getByRole("option", { name: /236220/ });
    expect(housing.textContent).toBe(`236220${FILTERS.forecastCount(1)}`);
  });

  it("writes the code when the member picks one", () => {
    const { onChange } = renderDrawer(EMPTY_FILTERS);
    fireEvent.click(within(group(FILTERS.labels.naics)).getByRole("option", { name: /236220/ }));
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, naics: ["236220"] });
  });

  it("says on the page that a forecast with no code is not shown, and that Kind of work also applies", () => {
    renderDrawer(EMPTY_FILTERS);
    const note = within(group(FILTERS.labels.naics)).getByText(FILTERS.naicsNote);
    expect(note.textContent).toMatch(/no industry code is not shown/);
    expect(note.textContent).toContain(FILTERS.labels.work);
    expect(note.textContent).toMatch(/exact/i);
  });

  it("offers no option while the page-1 counts are not back", () => {
    renderDrawer(EMPTY_FILTERS, { facets: null, facetsState: "pending" });
    expect(within(group(FILTERS.labels.naics)).queryAllByRole("option")).toHaveLength(0);
    expect(within(group(FILTERS.labels.states)).queryAllByRole("option")).toHaveLength(0);
  });
});

describe("ForecastFiltersDrawer: options while the counts are not known", () => {
  const multiSelects = [FILTERS.labels.naics, FILTERS.labels.states, FILTERS.labels.cities];
  const emptyTexts = [FILTERS.noNaics, FILTERS.noStates, FILTERS.noCities];

  it("shows a loading line, never the no-option words, before the first counts come", () => {
    renderDrawer(EMPTY_FILTERS, { facets: null, facetsState: "pending" });
    for (const name of multiSelects) {
      expect(within(group(name)).getByText(FILTERS.optionsPending)).toBeTruthy();
    }
    for (const text of emptyTexts) expect(screen.queryByText(text)).toBeNull();
  });

  it("keeps the last options and the ones she chose, with no count, while page 1 reloads", () => {
    renderDrawer(
      { ...EMPTY_FILTERS, states: ["TX", "GA"], naics: ["238160"] },
      { facets: FACETS, facetsState: "pending", total: null },
    );
    const states = within(group(FILTERS.labels.states));
    const names = states.getAllByRole("option").map((o) => o.textContent ?? "");
    expect(names).toEqual(["Oklahoma", "Texas", "Georgia"]);
    expect(states.getByRole("option", { name: /Georgia/ }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(states.getByText(FILTERS.optionsPending)).toBeTruthy();
    // A count for the old choices is not a count for the new ones.
    const roofing = within(group(FILTERS.labels.naics)).getByRole("option", { name: /238160/ });
    expect(roofing.textContent).toBe(`238160${ROOFING_WORDS}`);
    for (const text of emptyTexts) expect(screen.queryByText(text)).toBeNull();
  });

  it("says the counts did not load, and never the no-option words, when page 1 failed", () => {
    renderDrawer({ ...EMPTY_FILTERS, cities: ["Dallas"] }, { facets: null, facetsState: "failed" });
    for (const name of multiSelects) {
      expect(within(group(name)).getByText(FILTERS.optionsFailed)).toBeTruthy();
    }
    expect(
      within(group(FILTERS.labels.cities)).getByRole("option", { name: /Dallas/ }).textContent,
    ).toBe("Dallas");
    for (const text of emptyTexts) expect(screen.queryByText(text)).toBeNull();
  });

  it("still says no forecast names a state when the current counts hold none", () => {
    renderDrawer(EMPTY_FILTERS, { facets: { states: [], cities: [], naics: [] } });
    expect(screen.getByText(FILTERS.noStates)).toBeTruthy();
    expect(screen.queryByText(FILTERS.optionsPending)).toBeNull();
  });
});

describe("ForecastFiltersDrawer: posted within N days", () => {
  const posted = () => screen.getByRole("radiogroup", { name: FILTERS.labels.postedWithin });
  const radio = (label: string) =>
    within(posted()).getByRole("radio", { name: new RegExp(`^${label}`) });

  it("offers any date and each preset, with no count", () => {
    renderDrawer(EMPTY_FILTERS);
    const radios = within(posted()).getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual([
      FILTERS.postedWithin.any,
      ...POSTED_WITHIN_CHOICES.map(FILTERS.postedWithin.days),
    ]);
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
  });

  it("writes the day count when the member picks a choice, and null for any date", () => {
    const { onChange } = renderDrawer({ ...EMPTY_FILTERS, postedWithin: 30 });
    fireEvent.click(radio(FILTERS.postedWithin.days(7)));
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FILTERS, postedWithin: 7 });
    fireEvent.click(radio(FILTERS.postedWithin.any));
    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FILTERS);
  });

  it("shows a day count from the URL that is not a preset, so the filter is never hidden", () => {
    renderDrawer({ ...EMPTY_FILTERS, postedWithin: 45 });
    expect(radio(FILTERS.postedWithin.days(45)).getAttribute("aria-checked")).toBe("true");
    expect(within(posted()).getAllByRole("radio")).toHaveLength(POSTED_WITHIN_CHOICES.length + 2);
  });

  it("says on the page that a forecast with no posted date is not shown, and never calls it a deadline", () => {
    renderDrawer(EMPTY_FILTERS);
    const note = screen.getByText(FILTERS.postedWithinNote);
    expect(note.textContent).toMatch(/no posted date is not shown/);
    const words = [
      FILTERS.labels.postedWithin,
      FILTERS.postedWithinGloss,
      FILTERS.postedWithinNote,
      FILTERS.postedWithin.any,
      ...POSTED_WITHIN_CHOICES.map(FILTERS.postedWithin.days),
    ];
    for (const text of words) expect(text).not.toMatch(DEADLINE_WORDS);
  });
});

describe("ForecastFiltersDrawer: the Show button", () => {
  it("names the server's total for the current choices", () => {
    renderDrawer(EMPTY_FILTERS, { total: 12 });
    expect(screen.getByRole("button", { name: FILTERS.show(12) })).toBeTruthy();
  });

  it("names no number while the total is not back", () => {
    renderDrawer(EMPTY_FILTERS, { total: null });
    expect(screen.getByRole("button", { name: FILTERS.showPending })).toBeTruthy();
  });
});

describe("ForecastFiltersDrawer: open and close", () => {
  it("opens and closes without a change in the order of its hooks", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const drawer = (open: boolean) => (
      <ForecastFiltersDrawer
        open={open}
        onClose={() => {}}
        facets={FACETS}
        facetsState="current"
        total={3}
        filters={EMPTY_FILTERS}
        onChange={() => {}}
      />
    );
    const { rerender } = render(drawer(false));
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(drawer(true));
    expect(screen.getByRole("dialog")).toBeTruthy();

    rerender(drawer(false));
    expect(screen.queryByRole("dialog")).toBeNull();

    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
