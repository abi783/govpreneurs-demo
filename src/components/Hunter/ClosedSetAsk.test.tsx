// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import type { ProfileAsk } from "../../lib/hunterChat";

// The NAICS catalog is the only closed set that reaches the network.
const { searchNaics, fetchNaicsDescriptions } = vi.hoisted(() => ({
  searchNaics: vi.fn().mockResolvedValue([]),
  fetchNaicsDescriptions: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../lib/preview", async (orig) => {
  const actual = await orig<typeof import("../../lib/preview")>();
  return { ...actual, searchNaics, fetchNaicsDescriptions };
});

import { ProfileAskBlock } from "./ProfileAskBlock";

beforeEach(() => {
  cleanup();
  searchNaics.mockClear();
  fetchNaicsDescriptions.mockClear();
});

const statesAsk: ProfileAsk = {
  id: "service_states:open",
  field: "service_states",
  label: "Where you work",
  askType: "open",
  question: "Which states can you perform work in?",
  allowNotSure: false,
};

const setAsideAsk: ProfileAsk = {
  id: "set_asides:open",
  field: "set_asides",
  label: "Set-asides you hold",
  askType: "open",
  question: "Which set-aside certifications do you hold?",
  allowNotSure: false,
};

const naicsAsk: ProfileAsk = {
  id: "naics_codes:open",
  field: "naics_codes",
  label: "What you do (NAICS)",
  askType: "open",
  question: "Which NAICS codes best describe the work you do?",
  allowNotSure: false,
};

const renderAsk = (ask: ProfileAsk, initialValue?: string) => {
  const answer = vi.fn().mockResolvedValue({ written: true });
  render(
    <ProfileAskBlock
      asks={[ask]}
      handlers={{ answer, skip: vi.fn() }}
      elicitShape="multi_select"
      initialValue={initialValue}
    />,
  );
  return answer;
};

describe("a fixed-value field is picked, never typed", () => {
  it("renders no free-text answer box for states", () => {
    renderAsk(statesAsk);
    // The only input is the picker's SEARCH field — there is no box whose
    // contents become the answer, which is what made "North Carolin" possible.
    expect(screen.queryByRole("textbox", { name: "Where you work" })).toBeNull();
    expect(screen.getByLabelText("Search a state")).toBeTruthy();
    expect(screen.getByRole("option", { name: /Texas/ })).toBeTruthy();
  });

  it("submits the picked states as the comma-joined token string", async () => {
    const answer = renderAsk(statesAsk);
    fireEvent.click(screen.getByRole("option", { name: /Texas/ }));
    fireEvent.click(screen.getByRole("option", { name: /North Carolina/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save Where you work" }));

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith(
        expect.objectContaining({ field: "service_states", value: "TX, NC" }),
      ),
    );
  });

  it("multi-selects and de-selects — a second click removes the state", async () => {
    const answer = renderAsk(statesAsk);
    fireEvent.click(screen.getByRole("option", { name: /Texas/ }));
    fireEvent.click(screen.getByRole("option", { name: /Georgia/ }));
    fireEvent.click(screen.getByRole("option", { name: /Texas/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save Where you work" }));

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith(expect.objectContaining({ value: "GA" })),
    );
  });

  it("cannot be saved empty", () => {
    renderAsk(statesAsk);
    const save = screen.getByRole("button", { name: "Save Where you work" });
    expect((save as HTMLButtonElement).disabled).toBe(true);
  });

  it("pre-selects what is already on file and extends it", async () => {
    const answer = renderAsk(statesAsk, "TX, NC");
    expect(screen.getByRole("option", { name: /Texas/ }).getAttribute("aria-selected")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("option", { name: /Georgia/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save Where you work" }));

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith(expect.objectContaining({ value: "TX, NC, GA" })),
    );
  });

  it("offers the set-aside chips and submits their ids", async () => {
    const answer = renderAsk(setAsideAsk);
    expect(screen.queryByRole("option", { name: /Full and Open/ })).toBeNull();

    fireEvent.click(screen.getByRole("option", { name: "HUBZone" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Set-asides you hold" }));

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith(
        expect.objectContaining({ field: "set_asides", value: "HUBZone" }),
      ),
    );
  });
});

describe("the NAICS ask is a typeahead over the existing search endpoint", () => {
  it("queries /naics/search as the member types and submits the picked codes", async () => {
    searchNaics.mockResolvedValueOnce([{ code: "238160", description: "Roofing Contractors" }]);
    const answer = renderAsk(naicsAsk);

    // Nothing is listed until there is a query — the taxonomy is too large to ship.
    expect(screen.queryByRole("option")).toBeNull();

    fireEvent.change(screen.getByLabelText(/Search a trade/), {
      target: { value: "roof" },
    });

    await waitFor(() => expect(searchNaics).toHaveBeenCalledWith("roof"));
    const option = await screen.findByRole("option", { name: /Roofing Contractors/ });
    fireEvent.click(option);
    fireEvent.click(screen.getByRole("button", { name: "Save What you do (NAICS)" }));

    await waitFor(() =>
      expect(answer).toHaveBeenCalledWith(
        expect.objectContaining({ field: "naics_codes", value: "238160" }),
      ),
    );
  });

  it("keeps a picked code visible after the search that surfaced it is cleared", async () => {
    searchNaics.mockResolvedValueOnce([{ code: "238160", description: "Roofing Contractors" }]);
    renderAsk(naicsAsk);

    fireEvent.change(screen.getByLabelText(/Search a trade/), {
      target: { value: "roof" },
    });
    fireEvent.click(await screen.findByRole("option", { name: /Roofing Contractors/ }));
    fireEvent.change(screen.getByLabelText(/Search a trade/), { target: { value: "" } });

    // Still listed (and still selected), so it can be un-picked — a selection
    // that vanishes with the query is a selection the member cannot undo.
    const picked = await screen.findByRole("option", { name: /238160/ });
    expect(picked.getAttribute("aria-selected")).toBe("true");
  });

  it("degrades to an empty list when the lookup fails — never a broken card", async () => {
    searchNaics.mockRejectedValueOnce(new Error("network"));
    renderAsk(naicsAsk);

    fireEvent.change(screen.getByLabelText(/Search a trade/), {
      target: { value: "roof" },
    });

    await waitFor(() => expect(searchNaics).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Save What you do (NAICS)" })).toBeTruthy();
  });
});
