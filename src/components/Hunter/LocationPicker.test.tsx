// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { useState } from "react";
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

// Click-semantics when a whole state is ticked: narrow to just the clicked city.
const city = (id: string) => ({ id, label: id });
const TX_GROUP: StateCityGroup = {
  state: "TX",
  cities: ["Austin", "Houston", "Dallas", "Midlothian"].map(city),
};

function Stateful({
  groups,
  initial,
  onState,
}: {
  groups: StateCityGroup[];
  initial: { states: string[]; cities: string[] };
  onState: (s: { states: string[]; cities: string[] }) => void;
}) {
  const [sel, setSel] = useState(initial);
  onState(sel);
  return (
    <LocationPicker groups={groups} states={sel.states} cities={sel.cities} onChange={setSel} />
  );
}

describe("LocationPicker: clicking a city under a ticked state narrows to that city", () => {
  it("ticket flow: TX ticked, click Austin -> only Austin; other states untouched", () => {
    const { onChange } = renderPicker({
      groups: [TX_GROUP, NC_GROUP],
      states: ["TX", "NC"],
      cities: [],
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Show cities" })[0]);
    fireEvent.click(screen.getByText("Austin"));
    expect(onChange).toHaveBeenCalledWith({ states: ["NC"], cities: ["Austin"] });
  });

  it("keeps unrelated city selections from other states", () => {
    const { onChange } = renderPicker({
      groups: [TX_GROUP, NC_GROUP],
      states: ["TX"],
      cities: ["Raleigh"],
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Show cities" })[0]);
    fireEvent.click(screen.getByText("Austin"));
    expect(onChange).toHaveBeenCalledWith({ states: [], cities: ["Raleigh", "Austin"] });
  });

  it("clicking the narrowed city again unticks it -> nothing selected for TX", () => {
    let latest = { states: [] as string[], cities: [] as string[] };
    render(
      <Stateful
        groups={[TX_GROUP]}
        initial={{ states: ["TX"], cities: [] }}
        onState={(s) => (latest = s)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show cities" }));
    fireEvent.click(screen.getByText("Austin"));
    expect(latest).toEqual({ states: [], cities: ["Austin"] });
    fireEvent.click(screen.getByText("Austin"));
    expect(latest).toEqual({ states: [], cities: [] });
  });

  it("ticking cities one by one in a partial state still collapses to the whole state", () => {
    let latest = { states: [] as string[], cities: [] as string[] };
    render(
      <Stateful
        groups={[TX_GROUP]}
        initial={{ states: [], cities: [] }}
        onState={(s) => (latest = s)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Show cities" }));
    for (const c of ["Austin", "Houston", "Dallas"]) fireEvent.click(screen.getByText(c));
    expect(latest).toEqual({ states: [], cities: ["Austin", "Houston", "Dallas"] });
    fireEvent.click(screen.getByText("Midlothian"));
    expect(latest).toEqual({ states: ["TX"], cities: [] });
  });

  it("ticked state whose cities load lazily: narrowing yields just the city, no collapse", async () => {
    const { fetchCities } = await import("../../lib/discoverApi");
    vi.mocked(fetchCities).mockResolvedValueOnce([
      { state: "TX", cities: ["Austin", "Houston"].map((c) => ({ city: c, count: 1 })) },
    ] as never);
    const { onChange } = renderPicker({
      groups: [{ state: "TX", cities: [] }],
      states: ["TX"],
      cities: [],
    });
    fireEvent.click(screen.getByRole("button", { name: "Show cities" }));
    await waitFor(() => screen.getByText("Austin"));
    fireEvent.click(screen.getByText("Austin"));
    expect(onChange).toHaveBeenCalledWith({ states: [], cities: ["Austin, TX"] });
  });

  it("two states' cities of one name are two choices: picking Houston, TX leaves Houston, MN", async () => {
    const { fetchCities } = await import("../../lib/discoverApi");
    vi.mocked(fetchCities)
      .mockResolvedValueOnce([{ state: "MN", cities: [{ city: "Houston", count: 2 }] }] as never)
      .mockResolvedValueOnce([{ state: "TX", cities: [{ city: "Houston", count: 9 }] }] as never);
    const { onChange } = renderPicker({
      groups: [
        { state: "MN", cities: [] },
        { state: "TX", cities: [] },
      ],
      states: [],
      cities: ["Houston, TX"],
    });
    for (const b of screen.getAllByRole("button", { name: "Show cities" })) fireEvent.click(b);
    await waitFor(() => expect(screen.getAllByText("Houston")).toHaveLength(2));

    const [mn, tx] = screen.getAllByText("Houston").map((el) => el.closest("button")!);
    expect(mn.getAttribute("aria-selected")).toBe("false");
    expect(tx.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getAllByText("Houston")[0]);
    expect(onChange).toHaveBeenLastCalledWith({
      states: ["MN"],
      cities: ["Houston, TX"],
    });
  });

  it("search-truncated group: narrowing resolves against the full group and clears hidden cities", () => {
    const { onChange } = renderPicker({
      groups: [TX_GROUP],
      states: ["TX"],
      cities: ["Houston"], // stale/hidden selection inside the ticked state
    });
    fireEvent.change(screen.getByPlaceholderText("Search a state or city…"), {
      target: { value: "aus" },
    });
    expect(screen.queryByText("Houston")).toBeNull();
    fireEvent.click(screen.getByText("Austin"));
    expect(onChange).toHaveBeenCalledWith({ states: [], cities: ["Austin"] });
  });
});
