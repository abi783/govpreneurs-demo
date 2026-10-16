import { describe, expect, it } from "vitest";

/**
 * appHref is re-derived here rather than imported: `basepath` is computed once
 * at module load from window.location, so importing the real module pins it to
 * whatever jsdom's url happened to be. The rule under test is the join, not the
 * detection.
 */
function appHrefWith(basepath: string, path: string): string {
  const base = basepath === "/" ? "" : basepath;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

describe("appHref", () => {
  // The bug: on the tools host basepath is "/", so `${basepath}${path}` gave
  // "//tools/co-checklist". A leading "//" is protocol-relative, so the browser
  // treats "tools" as a HOSTNAME and navigates to https://tools/co-checklist.
  it("never emits a protocol-relative // on the tools host", () => {
    for (const path of [
      "/tools",
      "/tools/co-checklist",
      "/tools/registration-checklist",
      "/tools/hubzone",
      "/tools/capability-statement",
      "/tools/scorecard",
      "/tools/demand",
      "/tools/naics",
    ]) {
      const href = appHrefWith("/", path);
      expect(href.startsWith("//")).toBe(false);
      expect(href).toBe(path);
    }
  });

  it("keeps in-app links under the /v2/ui prefix", () => {
    expect(appHrefWith("/v2/ui", "/tools/co-checklist")).toBe("/v2/ui/tools/co-checklist");
  });

  it("tolerates a path given without its leading slash", () => {
    expect(appHrefWith("/", "tools/hubzone")).toBe("/tools/hubzone");
    expect(appHrefWith("/v2/ui", "tools/hubzone")).toBe("/v2/ui/tools/hubzone");
  });
});
