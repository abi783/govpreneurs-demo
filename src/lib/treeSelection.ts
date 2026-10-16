// Pure tri-state cascade logic for the two-level onboarding tree picker
// (OnboardingTreePicker.tsx). Extracted from the component so the cascade
// math can be unit-tested without any component-rendering infrastructure,
// and so it is trivially reusable by any future consumer.
//
// Tri-state parent (the LocationPicker model):
//   all  → parent id in `selection.parents`; every child implicitly covered.
//   some → at least one child id in `selection.children`; box shows a dash.
//   none → neither; empty box.
//
// Clicking a parent: none/some → all (select everything, drop any enumerated
// children); all → none (deselect everything). Clicking a child of an "all"
// parent removes the parent and enumerates "everything except" that child;
// filling every remaining child back in collapses back to "all".
//
// IMPORTANT: every function here must be called with the FULL (unfiltered)
// parent — i.e. `parent.children` must be the complete child list, never a
// search-narrowed subset. Passing a filtered copy would make "one matched
// child selected" look like "every child selected" and wrongly collapse the
// whole group. Callers (e.g. the picker component) are responsible for
// resolving the full group before invoking these — see `fullOf()` in
// OnboardingTreePicker.tsx.

export type TreeChild = {
  id: string;
  label: string;
  /** Muted subline (e.g. a NAICS description or "Set-Aside"/"Sole-Source"). */
  detail?: string;
  /** Mono code chip shown next to the label (e.g. "238160", "SDVOSBC"). */
  code?: string;
  /** Extra text folded into search (synonyms, the code). */
  keywords?: string;
};

export type TreeParent = {
  id: string;
  label: string;
  detail?: string;
  /** Section header this parent sits under (optional grouping). */
  section?: string;
  keywords?: string;
  children: TreeChild[];
};

export type TreeSelection = { parents: string[]; children: string[] };

export type TreeStatus = "all" | "some" | "none";

/** Namespaces a level-2 value under its parent id, e.g. `childId("nc", "Fayetteville") === "nc::Fayetteville"`. */
export function childId(parentId: string, value: string): string {
  return `${parentId}::${value}`;
}

/** All child ids of a (full, unfiltered) parent. */
export function childIdsOf(parent: TreeParent): string[] {
  return parent.children.map((c) => c.id);
}

/** Tri-state status of a (full, unfiltered) parent against the current selection. */
export function statusOf(parent: TreeParent, selection: TreeSelection): TreeStatus {
  if (selection.parents.includes(parent.id)) return "all";
  return childIdsOf(parent).some((id) => selection.children.includes(id)) ? "some" : "none";
}

/** Drops every child id belonging to `parent` out of `list` (a children-id array). */
export function clearGroupChildren(parent: TreeParent, list: string[]): string[] {
  const ids = childIdsOf(parent);
  return list.filter((id) => !ids.includes(id));
}

/**
 * Handles a click on the parent row. `parent` MUST be the full (unfiltered) group.
 *   all        → none (deselect everything under this parent)
 *   some/none  → all  (select everything; drop any enumerated children)
 */
export function onParentClick(parent: TreeParent, selection: TreeSelection): TreeSelection {
  if (statusOf(parent, selection) === "all") {
    return {
      parents: selection.parents.filter((p) => p !== parent.id),
      children: clearGroupChildren(parent, selection.children),
    };
  }
  return {
    parents: [...selection.parents, parent.id],
    children: clearGroupChildren(parent, selection.children),
  };
}

/**
 * Handles a click on one child row. `parent` MUST be the full (unfiltered) group.
 *   parent status "all" → "everything except this child": parent id removed,
 *     every OTHER child of this parent enumerated into `children`.
 *   otherwise → toggle the child id in `children`; if every child of the
 *     parent ends up present, collapse back to "all" (parent id, no children).
 */
export function onChildClick(
  parent: TreeParent,
  selection: TreeSelection,
  childIdToToggle: string,
): TreeSelection {
  if (statusOf(parent, selection) === "all") {
    return {
      parents: selection.parents.filter((p) => p !== parent.id),
      children: [
        ...selection.children,
        ...childIdsOf(parent).filter((id) => id !== childIdToToggle),
      ],
    };
  }

  let nextChildren = selection.children.includes(childIdToToggle)
    ? selection.children.filter((id) => id !== childIdToToggle)
    : [...selection.children, childIdToToggle];

  const ids = childIdsOf(parent);
  if (ids.length > 0 && ids.every((id) => nextChildren.includes(id))) {
    // Every child now selected → collapse back to the whole parent.
    nextChildren = clearGroupChildren(parent, nextChildren);
    return { parents: [...selection.parents, parent.id], children: nextChildren };
  }
  return { parents: selection.parents, children: nextChildren };
}
