// The QA crawl visits every route in this list.
//
// Page agents: append your deep routes to DEEP_ROUTES (for example a real
// `/opportunities/<id>`, `/ava/<id>`, `/my-business/<part>`). A route that is not
// here is not tested.
//
// To test only some routes in a run:   QA_ROUTES=/roadmap,/tasks bun run qa:crawl

/** One route per left-menu item. Keep in step with src/demo/nav/menu.ts. */
export const MENU_ROUTES: string[] = [
  "/",
  "/roadmap",
  "/tasks",
  "/opportunities",
  "/forecasts",
  "/small-orders",
  "/partners",
  "/awards",
  "/my-business",
  "/pipeline",
  "/ava",
  "/find-a-mentor",
  "/mentors",
];

/** Routes that are not in the menu: detail pages, tabs, and so on. */
export const DEEP_ROUTES: string[] = [
  "/my-business/profile",
  "/ava/sample",
];

/** Every route the harness knows, ignoring QA_ROUTES. A click that moves to one of these is judged by that route's own test. */
export function allKnownRoutes(): string[] {
  return [...MENU_ROUTES, ...DEEP_ROUTES];
}

export function crawlRoutes(): string[] {
  const only = process.env.QA_ROUTES?.split(",").map((r) => r.trim()).filter(Boolean);
  return only && only.length > 0 ? only : [...MENU_ROUTES, ...DEEP_ROUTES];
}
