// DEMO: in-app navigation from code that is not a React component.
//
// Old GoHighLevel (GHL) code asked the parent frame to switch pages. In the
// demo there is no parent. `ghlNav.ts`, `preview.ts` and the Success Center
// shims call `demoNavigate(path)` and the SPA router moves to that path.
//
// This file must not import the router. The router imports the route tree, and
// the route tree imports this file. `src/router.tsx` calls `registerNavigator`
// once, after it creates the router.

type Navigator = (to: string, opts?: { replace?: boolean }) => void;

let navigator: Navigator | null = null;

export function registerNavigator(fn: Navigator): void {
  navigator = fn;
}

/**
 * Move to an app path such as `/opportunities/123?tab=docs`.
 * If the router is not ready yet, it does a normal page load.
 */
export function demoNavigate(to: string, opts?: { replace?: boolean }): void {
  const path = to.startsWith("/") ? to : `/${to}`;
  if (navigator) navigator(path, opts);
  else if (opts?.replace) window.location.replace(path);
  else window.location.assign(path);
}
