// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LocationPicker } from "./LocationPicker";
import type { StateCityGroup } from "../../lib/mock/govTaxonomy";

// LocationPicker lazily fetches cities on expand/search via discoverApi.fetchCities.
// Tests below seed `groups` with cities already populated, so fetchCities should
// never actually be needed — but it's mocked defensively since the component's
// search effect calls it unconditionally once a query is typed.
vi.mock("../../lib/discoverApi", () => ({
  fetchCities: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => cleanup());

// NC has 3 cities; a search for "fay" should match only Fayetteville, leaving
// Raleigh and Charlotte hidden — this is the scenario that exposed the cascade
// bug (handlers received the search-truncated group instead of the full one).
const NC_GROUP: StateCityGroup = {
  state: "NC",
  cities: [
    { id: "Fayetteville", label: "Fayetteville" },
    { id: "Raleigh", label: "Raleigh" },
    { id: "Charlotte", label: "Charlotte" },
  ],
};

function renderPicker(props: Partial<React.ComponentProps<typeof LocationPicker>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <LocationPicker
      groups={[NC_GROUP]}
      states={props.states ?? []}
      cities={props.cities ?? []}
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange, ...utils };
}

describe("LocationPicker cascade bug (full group vs search-filtered group)", () => {
  it("clicking the state parent while a city search is active selects the WHOLE state (from a fully-unselected state), not just the visible city subset", () => {
    const { onChange } = renderPicker({
      states: [],
      cities: [],
    });

    // Activate a search that only matches Fayetteville, hiding Raleigh/Charlotte.
    fireEvent.change(screen.getByPlaceholderText("Search a state or city…"), {
      target: { value: "fay" },
    });

    // Only Fayetteville should be visible under NC now.
    expect(screen.getByText("Fayetteville")).toBeTruthy();
    expect(screen.queryByText("Raleigh")).toBeNull();
    expect(screen.queryByText("Charlotte")).toBeNull();

    // Click the state parent row (North Carolina). With the bug, statusOf would
    // have been computed off the search-truncated group (still "none" here
    // either way), but the resulting state selection is what matters — the
    // bug's mutation site was `onStateClick(g)` receiving the filtered group.
    fireEvent.click(screen.getByText("North Carolina"));

    // Whole-state select — not scoped to the single visible city.
    expect(onChange).toHaveBeenCalledWith({ states: ["NC"], cities: [] });
  });

  it("clicking the state parent while a city search is active and a HIDDEN city is pre-selected clears ALL city selections (including the hidden one), not just the visible subset", () => {
    const { onChange } = renderPicker({
      states: [],
      cities: ["Raleigh"], // a hidden (not-matching-search) city is pre-selected → status "some"
    });

    fireEvent.change(screen.getByPlaceholderText("Search a state or city…"), {
      target: { value: "fay" },
    });
    expect(screen.getByText("Fayetteville")).toBeTruthy();
    expect(screen.queryByText("Raleigh")).toBeNull();

    // Parent click on a "some" state clears the whole group back to "none".
    // With the bug, `clearGroupCities` would only strip cities in the
    // search-filtered group (just Fayetteville), leaving the hidden "Raleigh"
    // selection as a phantom entry. The fix must clear it too.
    fireEvent.click(screen.getByText("North Carolina"));

    expect(onChange).toHaveBeenCalledWith({ states: [], cities: [] });
  });

  it("selecting all *visible* cities of a partially-shown state does NOT collapse to whole-state", () => {
    const { onChange } = renderPicker({
      states: [],
      cities: [], // nothing selected yet
    });

    // Search narrows the visible city list to just Fayetteville, but Raleigh
    // and Charlotte still exist in the full group and are unselected.
    fireEvent.change(screen.getByPlaceholderText("Search a state or city…"), {
      target: { value: "fay" },
    });

    expect(screen.getByText("Fayetteville")).toBeTruthy();

    // Click the only visible city — this selects 100% of the *visible* set,
    // but only 1 of 3 cities in the FULL group.
    fireEvent.click(screen.getByText("Fayetteville"));

    // Must NOT collapse to whole-state ({ states: ["NC"], cities: [] }) —
    // only Fayetteville should be selected.
    expect(onChange).toHaveBeenCalledWith({ states: [], cities: ["Fayetteville"] });
  });

  it("clicking the state parent with no search active and nothing selected selects the whole state (baseline, unaffected by the fix)", () => {
    const { onChange } = renderPicker({ states: [], cities: [] });

    fireEvent.click(screen.getByText("North Carolina"));

    expect(onChange).toHaveBeenCalledWith({ states: ["NC"], cities: [] });
  });

  it("selecting the true last remaining city (no search active) collapses to whole-state (baseline, unaffected by the fix)", () => {
    const { onChange } = renderPicker({ states: [], cities: ["Raleigh", "Charlotte"] });

    // Expand to see cities (no search needed).
    fireEvent.click(screen.getByRole("button", { name: "Show cities" }));
    fireEvent.click(screen.getByText("Fayetteville"));

    // All 3 NC cities now selected → collapses to whole-state.
    expect(onChange).toHaveBeenCalledWith({ states: ["NC"], cities: [] });
  });
});
