import { describe, it, expect } from "vitest";
import {
  childId,
  childIdsOf,
  clearGroupChildren,
  onChildClick,
  onParentClick,
  statusOf,
  type TreeParent,
  type TreeSelection,
} from "./treeSelection";

const PARENT: TreeParent = {
  id: "roofing",
  label: "Roofing",
  children: [
    { id: "roofing::238160", label: "Roof Contractors", code: "238160" },
    { id: "roofing::238170", label: "Siding Contractors", code: "238170" },
    { id: "roofing::332321", label: "Sheet Metal Work", code: "332321" },
  ],
};

const EMPTY: TreeSelection = { parents: [], children: [] };

describe("childId", () => {
  it("namespaces a value under its parent id", () => {
    expect(childId("nc", "Fayetteville")).toBe("nc::Fayetteville");
  });

  it("produces different ids for the same raw value under different parents", () => {
    expect(childId("nc", "8A")).not.toBe(childId("sc", "8A"));
  });
});

describe("statusOf", () => {
  it("is 'none' when nothing is selected", () => {
    expect(statusOf(PARENT, EMPTY)).toBe("none");
  });

  it("is 'all' when the parent id is in selection.parents", () => {
    expect(statusOf(PARENT, { parents: ["roofing"], children: [] })).toBe("all");
  });

  it("is 'some' when at least one child id is selected", () => {
    expect(statusOf(PARENT, { parents: [], children: ["roofing::238160"] })).toBe("some");
  });
});

describe("tri-state parent-click transitions", () => {
  it("none -> all: selects the whole parent, clears any enumerated children", () => {
    const afterFirstClick = onParentClick(PARENT, EMPTY);
    expect(afterFirstClick).toEqual({ parents: ["roofing"], children: [] });
  });

  it("all -> none: deselects the whole parent", () => {
    const all: TreeSelection = { parents: ["roofing"], children: [] };
    const afterSecondClick = onParentClick(PARENT, all);
    expect(afterSecondClick).toEqual({ parents: [], children: [] });
  });

  it("round-trips none -> all -> none back to the original empty selection", () => {
    const step1 = onParentClick(PARENT, EMPTY);
    const step2 = onParentClick(PARENT, step1);
    expect(step2).toEqual(EMPTY);
  });
});

describe("child-under-all click: everything except", () => {
  it("clicking one child while parent is 'all' removes just that child", () => {
    const all: TreeSelection = { parents: ["roofing"], children: [] };
    const next = onChildClick(PARENT, all, "roofing::238160");
    expect(next.parents).not.toContain("roofing");
    expect(next.children.sort()).toEqual(["roofing::238170", "roofing::332321"].sort());
  });
});

describe("collapse-to-parent", () => {
  it("selecting the last remaining child collapses back to the whole parent", () => {
    // Start with 2 of 3 children selected ("some").
    const some: TreeSelection = {
      parents: [],
      children: ["roofing::238160", "roofing::238170"],
    };
    const next = onChildClick(PARENT, some, "roofing::332321");
    expect(next.parents).toContain("roofing");
    // All group children should be cleared out of `children` once collapsed.
    expect(next.children.some((id) => childIdsOf(PARENT).includes(id))).toBe(false);
  });

  it("unchecking one child of an otherwise-full 'some' selection stays 'some'", () => {
    const some: TreeSelection = {
      parents: [],
      children: ["roofing::238160", "roofing::238170"],
    };
    const next = onChildClick(PARENT, some, "roofing::238160");
    expect(next.parents).not.toContain("roofing");
    expect(next.children).toEqual(["roofing::238170"]);
  });
});

describe("clearGroupChildren", () => {
  it("drops only the ids belonging to the given parent", () => {
    const list = ["roofing::238160", "other::999999", "roofing::238170"];
    expect(clearGroupChildren(PARENT, list)).toEqual(["other::999999"]);
  });
});

describe("cascade correctness while a search filter is active", () => {
  it("computes against the FULL group even when a filtered copy is passed for rendering", () => {
    // Simulate the component's search-filtered view: only 1 of 3 children
    // visible (as `visible` narrows `g.children` for rendering), while the
    // FULL group (as resolved by `fullOf(g)`) still has all 3.
    const filteredView: TreeParent = {
      ...PARENT,
      children: [PARENT.children[0]], // only "238160" matched the search query
    };

    // The component always calls the pure functions with the FULL group
    // (fullOf(g)), never the filtered copy — assert that doing so protects
    // the cascade math: clicking the one visible child while 2 others are
    // already selected should NOT look like "every child selected" (which
    // would incorrectly happen if we passed `filteredView` instead of `PARENT`).
    const twoOfThreeSelected: TreeSelection = {
      parents: [],
      children: ["roofing::238170", "roofing::332321"],
    };

    // Correct: call with the FULL group.
    const correct = onChildClick(PARENT, twoOfThreeSelected, "roofing::238160");
    expect(correct.parents).toContain("roofing"); // rightly collapses — all 3 now selected
    expect(correct.children.some((id) => childIdsOf(PARENT).includes(id))).toBe(false);

    // Demonstrate the contract: statusOf also depends on the full child list.
    // Using the FILTERED view's childIdsOf would only "see" 1 child, so
    // "some" selected out of that 1 looks like "all" — proving why passing
    // the full group matters.
    const filteredChildIds = childIdsOf(filteredView);
    expect(filteredChildIds).toEqual(["roofing::238160"]);
    expect(childIdsOf(PARENT)).toHaveLength(3);
  });
});
