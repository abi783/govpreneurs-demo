// DEMO: in-app navigation from code that is not a React component.
//
// Old GoHighLevel (GHL) code asked the parent frame to switch pages. In the
// demo there is no parent. `ghlNav.ts`, `preview.ts` and the Success Center
// shims call `demoNavigate(path)` and the SPA router moves to that path.
//
// This file must not import the router. The router imports the route tree, and
// the route tree imports this file. `src/router.tsx` calls `registerNavigator`
// once, after it creates the router.

import { PERSONA } from "../story/persona";

type Navigator = (to: string, opts?: { replace?: boolean }) => void;

let navigator: Navigator | null = null;

export function registerNavigator(fn: Navigator): void {
  navigator = fn;
}

// Success Center pages live under `/<locationId>/...`. The demo has no such
// prefix. Lifted code that builds `/${locationId}/tasks` is rewritten here.
const SC_SEGMENT_TO_DEMO: Record<string, string> = {
  "": "/",
  roadmap: "/roadmap",
  tasks: "/tasks",
  "tasks-v1": "/tasks",
  business: "/my-business",
  mentors: "/find-a-mentor",
  onboarding: "/",
  "digital-compliance": "/my-business",
};

/**
 * Turn `/<locationId>/<page>/...` into the demo path. Any other path is
 * returned as it is, so frontend-v2 paths such as `/mentors` are never changed.
 */
export function rewriteScPath(to: string): string {
  const prefix = `/${PERSONA.locationId}`;
  if (to !== prefix && !to.startsWith(`${prefix}/`) && !to.startsWith(`${prefix}?`) && !to.startsWith(`${prefix}#`)) {
    return to;
  }
  const rest = to.slice(prefix.length); // "", "/tasks", "/business/team?x=1", "?x=1"
  const m = /^\/?([^/?#]*)(.*)$/.exec(rest) ?? [];
  const segment = m[1] ?? "";
  const tail = m[2] ?? "";
  const base = SC_SEGMENT_TO_DEMO[segment];
  if (base === undefined) return to; // an unknown page: leave it; the 404 page shows
  // The rest of the path after the first segment (for example /business/team) is kept.
  const out = `${base === "/" ? "" : base}${tail}`;
  return out.startsWith("/") ? out : `/${out}`;
}

/**
 * Move to an app path such as `/opportunities/123?tab=docs`.
 * If the router is not ready yet, it does a normal page load.
 */
export function demoNavigate(to: string, opts?: { replace?: boolean }): void {
  const path = rewriteScPath(to.startsWith("/") ? to : `/${to}`);
  if (navigator) navigator(path, opts);
  else if (opts?.replace) window.location.replace(path);
  else window.location.assign(path);
}
