// @vitest-environment jsdom
// GOAL.md feature 9 — the expanded code rows read the LIVE taxonomy. The picker
// prints the words the backend returns, and the bare code when it returns none.
// The 28-row hardcoded catalog is gone from this surface.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApiError } from "../../lib/api";
import * as naicsApi from "../../lib/naicsApi";
import { WorkPicker } from "./WorkPicker";

// A real trade bundle, so the test exercises the codes the picker actually asks
// for. "722310" is its first code.
const TRADE_ID = "food_service_and_catering";
const CODE = "722310";
const DESCRIPTION = "Food Service Contractors";

const TRADES = [{ id: TRADE_ID, label: "Food Service & Catering" }];

/** Renders the picker with the trade already selected, then expands its codes. */
function renderExpanded() {
  render(
    <WorkPicker
      trades={TRADES}
      selected={[TRADE_ID]}
      excludedNaics={[]}
      onChangeTrades={() => {}}
      onChangeExcluded={() => {}}
    />,
  );
  fireEvent.click(screen.getByLabelText("Fine-tune codes"));
}

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("WorkPicker — NAICS descriptions", () => {
  it("shows the description the taxonomy resolves for a code", async () => {
    vi.spyOn(naicsApi, "fetchNaicsDescriptions").mockResolvedValue(new Map([[CODE, DESCRIPTION]]));

    renderExpanded();

    expect(await screen.findByText(DESCRIPTION)).toBeTruthy();
    expect(screen.getByText(CODE)).toBeTruthy();
  });

  it("shows the bare code when the taxonomy does not resolve it", async () => {
    vi.spyOn(naicsApi, "fetchNaicsDescriptions").mockResolvedValue(new Map());

    renderExpanded();

    await waitFor(() => expect(screen.getByText(CODE)).toBeTruthy());
    // No invented label: the row carries the code and nothing else.
    expect(screen.queryByText(DESCRIPTION)).toBeNull();
    expect(document.querySelectorAll(".wp-code .of-option__detail")).toHaveLength(0);
  });

  it("shows the bare code when the request fails", async () => {
    vi.spyOn(naicsApi, "fetchNaicsDescriptions").mockRejectedValue(
      new ApiError("Failed to fetch NAICS descriptions", 500),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderExpanded();

    await waitFor(() => expect(warn).toHaveBeenCalledOnce());
    expect(screen.getByText(CODE)).toBeTruthy();
    expect(document.querySelectorAll(".wp-code .of-option__detail")).toHaveLength(0);
  });

  it("asks for the selected trade's codes in ONE batched request", async () => {
    const fetchSpy = vi
      .spyOn(naicsApi, "fetchNaicsDescriptions")
      .mockResolvedValue(new Map([[CODE, DESCRIPTION]]));

    renderExpanded();

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    expect(fetchSpy.mock.calls[0][0]).toContain(CODE);
  });

  it("asks for nothing while no trade is selected", () => {
    const fetchSpy = vi.spyOn(naicsApi, "fetchNaicsDescriptions");

    render(
      <WorkPicker
        trades={TRADES}
        selected={[]}
        excludedNaics={[]}
        onChangeTrades={() => {}}
        onChangeExcluded={() => {}}
      />,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
