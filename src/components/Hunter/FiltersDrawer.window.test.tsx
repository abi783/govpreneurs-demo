// @vitest-environment jsdom
//
// The Opportunities Filters window: one category at a time in the shared
// FilterPanel, typed timing, and saved searches only when no filter is on.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { FiltersDrawer } from "./FiltersDrawer";
import { emptyFilters, type OpportunityFilters } from "../../lib/opportunityFilters";

const CATEGORIES = [
  "What you do",
  "Where",
  "Job size",
  "Timing",
  "Set-aside",
  "Agency",
  "Notice type",
  "Contract vehicle",
];
const SAVED = { id: "s1", name: "Roofing in NC", filters: emptyFilters() };

function renderDrawer(filters: OpportunityFilters, onSetFilters = vi.fn(), keyword = "") {
  render(
    <FiltersDrawer
      open
      onClose={() => {}}
      filters={filters}
      onSetFilters={onSetFilters}
      keyword={keyword}
      smartList={null}
      onSmartListApply={() => {}}
      onSmartListClear={() => {}}
      onSmartListRemoveCondition={() => {}}
      onSmartListSave={() => {}}
      savedLists={[]}
      activeSavedListId={null}
      onApplySaved={() => {}}
      matchCount={3}
      onClearAll={() => {}}
      onSaveSearch={() => {}}
      savedSearches={[SAVED]}
      onRemoveSavedSearch={() => {}}
      opps={[]}
    />,
  );
  return onSetFilters;
}

const nav = () => screen.getByRole("navigation", { name: "Filter categories" });

beforeEach(() => {
  // jsdom has no Element.scrollTo; FilterPanel scrolls a new category to its top.
  Element.prototype.scrollTo = vi.fn();
  // The window fetches per-option counts while it is open; none resolve here.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>(() => {})),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FiltersDrawer — the window", () => {
  it("lists the eight categories in order, with no Opportunity type or Status", () => {
    renderDrawer(emptyFilters());

    const labels = within(nav())
      .getAllByRole("button")
      .map((b) => b.textContent);
    expect(labels).toEqual(CATEGORIES);
    expect(screen.queryByText(/Opportunity type/i)).toBeNull();
    expect(within(nav()).queryByText("Status")).toBeNull();
  });

  it("says the match count on the one apply button", () => {
    renderDrawer(emptyFilters());

    expect(screen.getByRole("button", { name: /Show 3 opportunities/ })).toBeTruthy();
  });

  it("writes a closing shortcut and a typed number of days as within_N", () => {
    const onSetFilters = renderDrawer(emptyFilters());
    fireEvent.click(within(nav()).getByRole("button", { name: "Timing" }));

    fireEvent.click(screen.getByRole("button", { name: "20 days" }));
    expect((onSetFilters.mock.calls[0][0] as OpportunityFilters).dueWindow).toEqual(["within_20"]);

    const box = screen.getByRole("textbox", { name: "Closing date: number of days" });
    fireEvent.change(box, { target: { value: "15" } });
    fireEvent.blur(box);
    expect((onSetFilters.mock.calls[1][0] as OpportunityFilters).dueWindow).toEqual(["within_15"]);
  });

  it("writes a posted shortcut as a number of days", () => {
    const onSetFilters = renderDrawer(emptyFilters());
    fireEvent.click(within(nav()).getByRole("button", { name: "Timing" }));

    fireEvent.click(screen.getByRole("button", { name: "7 days ago" }));
    expect((onSetFilters.mock.calls[0][0] as OpportunityFilters).postedWithin).toBe(7);
  });

  it("shows saved searches only when no filter is on", () => {
    renderDrawer(emptyFilters());
    expect(screen.getByText(SAVED.name)).toBeTruthy();
    cleanup();

    renderDrawer({ ...emptyFilters(), states: ["NC"] });
    expect(screen.queryByText(SAVED.name)).toBeNull();
    cleanup();

    renderDrawer(emptyFilters(), vi.fn(), "roofing");
    expect(screen.queryByText(SAVED.name)).toBeNull();
  });

  it("lets Escape in the keyword box stay in the box", () => {
    const onClose = vi.fn();
    render(
      <FiltersDrawer
        open
        onClose={onClose}
        filters={emptyFilters()}
        onSetFilters={() => {}}
        keyword=""
        smartList={null}
        onSmartListApply={() => {}}
        onSmartListClear={() => {}}
        onSmartListRemoveCondition={() => {}}
        onSmartListSave={() => {}}
        savedLists={[]}
        activeSavedListId={null}
        onApplySaved={() => {}}
        matchCount={0}
        onClearAll={() => {}}
        onSaveSearch={() => {}}
        savedSearches={[]}
        onRemoveSavedSearch={() => {}}
        opps={[]}
      />,
    );

    fireEvent.click(within(nav()).getByRole("button", { name: "Set-aside" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Search set-asides" }), {
      key: "Escape",
    });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("has no keyword box: the page's search bar is the one opportunity search", () => {
    renderDrawer(emptyFilters());

    expect(screen.queryByRole("textbox", { name: "Keyword" })).toBeNull();
    expect(screen.queryByPlaceholderText(/Keyword/)).toBeNull();
  });

  it("gives every category with a list its own search box", () => {
    renderDrawer(emptyFilters());
    const boxes: [string, string][] = [
      ["What you do", "Search trades or NAICS codes"],
      ["Where", "Search a state or city…"],
      ["Set-aside", "Search set-asides"],
      ["Agency", "Search agencies"],
      ["Notice type", "Search notice types"],
      ["Contract vehicle", "Search contract vehicles"],
    ];
    for (const [category, label] of boxes) {
      fireEvent.click(within(nav()).getByRole("button", { name: category }));
      const box =
        screen.queryByRole("textbox", { name: label }) ?? screen.queryByPlaceholderText(label);
      expect(box, `${category} has its own search`).not.toBeNull();
    }
  });

  it("narrows only the category's list, and changes no filter", () => {
    const onSetFilters = renderDrawer(emptyFilters());
    fireEvent.click(within(nav()).getByRole("button", { name: "Contract vehicle" }));
    expect(screen.getByText("IDIQ")).toBeTruthy();
    expect(screen.getByText("BPA")).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: "Search contract vehicles" }), {
      target: { value: "idiq" },
    });

    expect(screen.getByText("IDIQ")).toBeTruthy();
    expect(screen.queryByText("BPA")).toBeNull();
    expect(onSetFilters).not.toHaveBeenCalled();
  });
});
