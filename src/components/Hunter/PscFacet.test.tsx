// @vitest-environment jsdom
//
// Feature 12 — the advanced-filters PSC facet, live over GET /psc/search.
//
// The old control listed a clipped copy of the 2,344-code federal taxonomy. The
// three things that must hold now are: what the member sees comes from the
// register, a failed lookup says so instead of inventing rows, and an empty box
// asks nothing of the network.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const { searchPsc } = vi.hoisted(() => ({ searchPsc: vi.fn() }));
vi.mock("../../lib/pscApi", async (orig) => {
  const actual = await orig<typeof import("../../lib/pscApi")>();
  return { ...actual, searchPsc };
});

import { PscFacet } from "./PscFacet";

const ROOFING = { code: "5650", description: "ROOFING AND SIDING MATERIALS" };

beforeEach(() => {
  cleanup();
  searchPsc.mockReset();
  searchPsc.mockResolvedValue([]);
});

function renderFacet(selected: string[] = []) {
  const onChange = vi.fn();
  render(<PscFacet selected={selected} onChange={onChange} />);
  return onChange;
}

const searchBox = () => screen.getByLabelText("Search PSC code");

describe("PscFacet", () => {
  it("shows the register's own words for a typed query", async () => {
    searchPsc.mockResolvedValueOnce([ROOFING]);
    const onChange = renderFacet();

    fireEvent.change(searchBox(), { target: { value: "roof" } });

    await waitFor(() => expect(searchPsc).toHaveBeenCalledWith("roof", expect.anything()));
    const option = await screen.findByRole("option", { name: /ROOFING AND SIDING MATERIALS/ });
    expect(option.textContent).toContain("5650");

    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith(["5650"]);
  });

  it("asks nothing of the network for an empty query", async () => {
    renderFacet();

    fireEvent.change(searchBox(), { target: { value: "  " } });

    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(searchPsc).not.toHaveBeenCalled();
    expect(screen.getByText("Start typing to search PSC codes")).toBeTruthy();
  });

  it("says the lookup failed, and lists nothing, when the request fails", async () => {
    searchPsc.mockRejectedValueOnce(new Error("network"));
    renderFacet();

    fireEvent.change(searchBox(), { target: { value: "roof" } });

    await screen.findByText(/Couldn't load PSC codes/);
    // No invented rows, and no "no matches" wording — an absent answer is not
    // the same claim as an empty one.
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.queryByText("No matching PSC codes")).toBeNull();
    // The control still works: the member can retype or filter another way.
    expect(searchBox()).toBeTruthy();
  });

  it("keeps a picked code listed after the search that surfaced it is cleared", async () => {
    searchPsc.mockResolvedValueOnce([ROOFING]);
    renderFacet(["5650"]);

    fireEvent.change(searchBox(), { target: { value: "roof" } });
    await screen.findByRole("option", { name: /ROOFING AND SIDING MATERIALS/ });
    fireEvent.change(searchBox(), { target: { value: "" } });

    const picked = await screen.findByRole("option", { name: /5650/ });
    expect(picked.getAttribute("aria-selected")).toBe("true");
    expect(picked.textContent).toContain("ROOFING AND SIDING MATERIALS");
  });

  it("shows a selected code it has never resolved as the bare code", () => {
    renderFacet(["Z2AA"]);

    const picked = screen.getByRole("option", { name: /Z2AA/ });
    expect(picked.getAttribute("aria-selected")).toBe("true");
  });
});
