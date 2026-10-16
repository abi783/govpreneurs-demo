// @vitest-environment jsdom
//
// Feature V5 — the drawer's half of "Reset to my profile".
//
// The drawer owns two decisions and no data: it renders the footer action under
// an accessible name, and it renders it ONLY when the route hands it a handler.
// The route withholds that handler when the member's profile seeded nothing, so
// a reset that would reset to nothing is absent rather than present-and-silent.
//
// The reset itself reads no network — the route resets from the defaults it
// already fetched — so the click must add no `fetch` call.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { FiltersDrawer } from "./FiltersDrawer";
import { applyProfileDefaults, emptyFilters } from "../../lib/opportunityFilters";

const RESET_LABEL = "Reset to my profile";

const DEFAULTS = { naics: ["238160"], setAsides: ["WOSB"], states: ["NC"], cities: [] };

/** Renders the drawer open, with only the props this feature exercises varied. */
function renderDrawer(onResetToProfile?: () => void) {
  return render(
    <FiltersDrawer
      open
      onClose={() => {}}
      filters={applyProfileDefaults(emptyFilters(), DEFAULTS)}
      onSetFilters={() => {}}
      keyword=""
      onKeyword={() => {}}
      smartList={null}
      onSmartListApply={() => {}}
      onSmartListClear={() => {}}
      onSmartListRemoveCondition={() => {}}
      onSmartListSave={() => {}}
      savedLists={[]}
      activeSavedListId={null}
      onApplySaved={() => {}}
      matchCount={12}
      onClearAll={() => {}}
      onSaveSearch={() => {}}
      onResetToProfile={onResetToProfile}
      savedSearches={[]}
      onRemoveSavedSearch={() => {}}
      opps={[]}
    />,
  );
}

let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  cleanup();
  fetchSpy = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FiltersDrawer — Reset to my profile", () => {
  it("renders the footer action under its accessible name and calls the handler once", () => {
    const onResetToProfile = vi.fn();
    renderDrawer(onResetToProfile);

    const button = screen.getByRole("button", { name: RESET_LABEL });
    fireEvent.click(button);

    expect(onResetToProfile).toHaveBeenCalledTimes(1);
  });

  it("makes no network call of its own when the action is clicked", () => {
    renderDrawer(() => {});

    const before = fetchSpy.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: RESET_LABEL }));

    expect(fetchSpy.mock.calls.length).toBe(before);
  });

  it("omits the action entirely when the route hands it no handler", () => {
    renderDrawer(undefined);

    expect(screen.queryByRole("button", { name: RESET_LABEL })).toBeNull();
  });
});
