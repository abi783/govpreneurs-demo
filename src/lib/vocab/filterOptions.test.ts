import { describe, it, expect } from "vitest";
import {
  AGENCY_TREE,
  DUE_WINDOWS,
  NOTICE_TYPES,
  SET_ASIDES,
  VEHICLES,
  agencyLabel,
  dueWindowLabel,
  noticeTypeLabel,
  setAsideLabel,
  vehicleLabel,
  type AgencyNode,
  type Option,
} from "./filterOptions";

const LISTS: [string, Option[], (id: string) => string][] = [
  ["SET_ASIDES", SET_ASIDES, setAsideLabel],
  ["NOTICE_TYPES", NOTICE_TYPES, noticeTypeLabel],
  ["DUE_WINDOWS", DUE_WINDOWS, dueWindowLabel],
  ["VEHICLES", VEHICLES, vehicleLabel],
];

/** Every node in the agency tree, parents and children alike. */
function flattenAgencies(nodes: AgencyNode[]): AgencyNode[] {
  return nodes.flatMap((node) => [node, ...flattenAgencies(node.children ?? [])]);
}

describe("filter option vocabulary", () => {
  it.each(LISTS)("%s holds an id and a label on every entry", (_name, options) => {
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.id).not.toBe("");
      expect(option.label).not.toBe("");
    }
  });

  it.each(LISTS)("%s labels every id it holds", (_name, options, label) => {
    for (const option of options) {
      expect(label(option.id)).toBe(option.label);
      expect(label(option.id)).not.toBe("");
    }
  });

  it.each(LISTS)("%s falls back to the raw id for an id it does not hold", (_name, _o, label) => {
    expect(label("no_such_id")).toBe("no_such_id");
  });

  it("AGENCY_TREE holds an id and a label on every node, at every depth", () => {
    const nodes = flattenAgencies(AGENCY_TREE);
    expect(nodes.length).toBeGreaterThan(AGENCY_TREE.length);
    for (const node of nodes) {
      expect(node.id).not.toBe("");
      expect(node.label).not.toBe("");
    }
  });

  it("agencyLabel names every node in the tree, nested ones included", () => {
    for (const node of flattenAgencies(AGENCY_TREE)) {
      expect(agencyLabel(node.id)).toBe(node.label);
      expect(agencyLabel(node.id)).not.toBe("");
    }
  });

  it("offers no opportunity-type list: the feed holds contracts only", async () => {
    const mod: Record<string, unknown> = await import("./filterOptions");
    expect(mod).not.toHaveProperty("CATEGORIES");
    expect(mod).not.toHaveProperty("categoryLabel");
  });

  it("agencyLabel falls back to the raw id for an agency it does not hold", () => {
    expect(agencyLabel("no_such_agency")).toBe("no_such_agency");
  });
});
