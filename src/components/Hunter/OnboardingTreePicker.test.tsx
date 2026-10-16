// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { OnboardingTreePicker } from "./OnboardingTreePicker";
import type { TreeParent, TreeSelection } from "../../lib/treeSelection";

beforeEach(() => cleanup());

const LAZY_GROUPS: TreeParent[] = [{ id: "nc", label: "North Carolina", children: [] }];

function Harness({
  loadChildren,
}: {
  loadChildren: (parentId: string) => Promise<{ id: string; label: string }[]>;
}) {
  const selection: TreeSelection = { parents: [], children: [] };
  return (
    <OnboardingTreePicker
      groups={LAZY_GROUPS}
      selection={selection}
      onChange={() => {}}
      loadChildren={loadChildren}
    />
  );
}

describe("OnboardingTreePicker lazy loadChildren", () => {
  it("calls loadChildren once on first expand and shows a loading row", async () => {
    let resolveFn!: (v: { id: string; label: string }[]) => void;
    const loadChildren = vi.fn(
      () =>
        new Promise<{ id: string; label: string }[]>((resolve) => {
          resolveFn = resolve;
        }),
    );
    render(<Harness loadChildren={loadChildren} />);

    fireEvent.click(screen.getByRole("button", { name: "Show details" }));

    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(loadChildren).toHaveBeenCalledWith("nc");
    // Loading state renders in both the parent's inline detail text and the
    // expanded loading row — scope to the "group" (the wp-codes <ul>) to
    // avoid ambiguity between the two "loading" texts.
    const group = screen.getByRole("group");
    expect(within(group).getByText(/loading/i)).toBeTruthy();

    resolveFn([{ id: "nc::Fayetteville", label: "Fayetteville" }]);
    await waitFor(() => expect(screen.getByText("Fayetteville")).toBeTruthy());
  });

  it("caches results — collapsing and re-expanding does not call loadChildren again", async () => {
    const loadChildren = vi.fn().mockResolvedValue([{ id: "nc::Raleigh", label: "Raleigh" }]);
    render(<Harness loadChildren={loadChildren} />);

    const expandBtn = () => screen.getByRole("button", { name: /show details|hide details/i });

    fireEvent.click(expandBtn()); // expand → loads
    await waitFor(() => expect(screen.getByText("Raleigh")).toBeTruthy());
    expect(loadChildren).toHaveBeenCalledTimes(1);

    fireEvent.click(expandBtn()); // collapse
    fireEvent.click(expandBtn()); // re-expand
    await waitFor(() => expect(screen.getByText("Raleigh")).toBeTruthy());
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it("shows a retry affordance on failure, and retry calls loadChildren again", async () => {
    const loadChildren = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce([{ id: "nc::Durham", label: "Durham" }]);
    render(<Harness loadChildren={loadChildren} />);

    fireEvent.click(screen.getByRole("button", { name: /show details|hide details/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /retry/i })).toBeTruthy());
    expect(loadChildren).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    await waitFor(() => expect(screen.getByText("Durham")).toBeTruthy());
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });

  it("parent stays selectable via the parent-row click regardless of load state", () => {
    const onChange = vi.fn();
    const loadChildren = vi.fn(() => new Promise<{ id: string; label: string }[]>(() => {}));
    const selection: TreeSelection = { parents: [], children: [] };
    render(
      <OnboardingTreePicker
        groups={LAZY_GROUPS}
        selection={selection}
        onChange={onChange}
        loadChildren={loadChildren}
      />,
    );

    // Click the parent row itself (not the expand chevron) — should select
    // the whole parent without needing children loaded.
    fireEvent.click(screen.getByText("North Carolina"));
    expect(onChange).toHaveBeenCalledWith({ parents: ["nc"], children: [] });
  });

  it("does not lazy-load a parent that already has children populated", () => {
    const loadChildren = vi.fn().mockResolvedValue([]);
    const groups: TreeParent[] = [
      {
        id: "roofing",
        label: "Roofing",
        children: [{ id: "roofing::238160", label: "Roof Contractors" }],
      },
    ];
    const selection: TreeSelection = { parents: [], children: [] };
    render(
      <OnboardingTreePicker
        groups={groups}
        selection={selection}
        onChange={() => {}}
        loadChildren={loadChildren}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /show details|hide details/i }));
    expect(screen.getByText("Roof Contractors")).toBeTruthy();
    expect(loadChildren).not.toHaveBeenCalled();
  });
});
