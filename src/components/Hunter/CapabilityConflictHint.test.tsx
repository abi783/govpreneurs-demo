// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import { UIStateProvider } from "@/lib/uiState";

// The hint reads its own endpoint on mount; stub the client so no network is
// touched and each case can choose what the read returns.
vi.mock("../../lib/hunterChat", () => ({
  fetchProfileConflicts: vi.fn(),
  resolveProfileConflict: vi.fn(),
}));

import { CapabilityConflictHint } from "./CapabilityConflictHint";
import { fetchProfileConflicts, resolveProfileConflict } from "../../lib/hunterChat";

const fetchMock = vi.mocked(fetchProfileConflicts);
const resolveMock = vi.mocked(resolveProfileConflict);

const HINT = {
  field: "capability_summary",
  label: "Capability summary",
  heardValue: "Residential roofing only",
  observedAt: "2026-07-29T10:00:00.000Z",
};

function renderHint() {
  return render(
    <UIStateProvider>
      <CapabilityConflictHint />
    </UIStateProvider>,
  );
}

beforeEach(() => {
  cleanup();
  fetchMock.mockReset();
  resolveMock.mockReset();
  resolveMock.mockResolvedValue(true);
});

describe("CapabilityConflictHint", () => {
  it("names the field and what Hunter heard, and says nothing changed", async () => {
    fetchMock.mockResolvedValue([HINT]);

    renderHint();

    expect(await screen.findByText(/doesn't match your capability statement/i)).toBeTruthy();
    expect(screen.getByText(/Capability summary/)).toBeTruthy();
    expect(screen.getByText(/Residential roofing only/)).toBeTruthy();
    expect(screen.getByText(/nothing changed/i)).toBeTruthy();
  });

  it("renders nothing when there is nothing pending", async () => {
    fetchMock.mockResolvedValue([]);

    const { container } = renderHint();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(container.firstChild).toBeNull();
  });

  it("stays gone once dismissed", async () => {
    fetchMock.mockResolvedValue([HINT]);
    const { container } = renderHint();
    const dismiss = await screen.findByLabelText("Dismiss");

    act(() => dismiss.click());

    expect(container.firstChild).toBeNull();
  });

  it("records a retraction and drops the row on ‘go with the document’", async () => {
    fetchMock.mockResolvedValue([HINT]);
    renderHint();
    const btn = await screen.findByRole("button", { name: /go with the document/i });

    await act(async () => {
      btn.click();
    });

    // Keyed by field AND value, so conceding one claim says nothing about the next.
    expect(resolveMock).toHaveBeenCalledWith(
      "capability_summary",
      "Residential roofing only",
      "prefer_document",
    );
    expect(screen.queryByText(/Residential roofing only/)).toBeNull();
  });

  it("tells the member to edit the document on ‘go with the new info’", async () => {
    fetchMock.mockResolvedValue([HINT]);
    renderHint();
    const btn = await screen.findByRole("button", { name: /go with the new info/i });

    await act(async () => {
      btn.click();
    });

    expect(resolveMock).toHaveBeenCalledWith(
      "capability_summary",
      "Residential roofing only",
      "keep_mine",
    );
    // The useful half of this decision: nothing stored changed, so say what does.
    expect(screen.getByText(/update the document/i)).toBeTruthy();
  });

  it("KEEPS the row when the write did not land", async () => {
    // The member's decision is only worth removing the row for once it is
    // recorded — an optimistic removal claims a write that never happened, and
    // the same conflict returns later with no explanation.
    fetchMock.mockResolvedValue([HINT]);
    resolveMock.mockResolvedValue(false);
    renderHint();
    const btn = await screen.findByRole("button", { name: /go with the document/i });

    await act(async () => {
      btn.click();
    });

    expect(screen.getByText(/Residential roofing only/)).toBeTruthy();
  });

  it("settles one row without clearing the others", async () => {
    const other = {
      field: "credentials",
      label: "Credentials",
      heardValue: "8(a) certified",
      observedAt: "2026-07-29T10:00:00.000Z",
    };
    fetchMock.mockResolvedValue([HINT, other]);
    renderHint();
    const [first] = await screen.findAllByRole("button", { name: /go with the document/i });

    await act(async () => {
      first.click();
    });

    expect(screen.queryByText(/Residential roofing only/)).toBeNull();
    expect(screen.getByText(/8\(a\) certified/)).toBeTruthy();
  });
});
