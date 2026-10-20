// The QA crawl visits every route in this list.
//
// Page agents: append your deep routes to your own file in qa/area-routes/.
// A route that is not listed is not tested.
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
  "/government-buyers",
  "/vehicles",
  "/labor-pricing",
];

import { ROUTES as HUNTER } from "./area-routes/hunter";
import { ROUTES as GRANT } from "./area-routes/grant";
import { ROUTES as AVA } from "./area-routes/ava";
import { ROUTES as ROADMAP_TASKS } from "./area-routes/roadmap-tasks";
import { ROUTES as MY_BUSINESS } from "./area-routes/my-business";
import { ROUTES as SC_HOME_MENTORS } from "./area-routes/sc-home-mentors";
import { ROUTES as EXPLORE } from "./area-routes/explore";

/** Routes that are not in the menu: detail pages, tabs, and so on. Each page
 *  agent owns one file in qa/area-routes/ — append there, not here. */
export const DEEP_ROUTES: string[] = [
  ...HUNTER,
  ...GRANT,
  ...AVA,
  ...ROADMAP_TASKS,
  ...MY_BUSINESS,
  ...SC_HOME_MENTORS,
  ...EXPLORE,
];

/** Every route the harness knows, ignoring QA_ROUTES. A click that moves to one of these is judged by that route's own test. */
export function allKnownRoutes(): string[] {
  return [...MENU_ROUTES, ...DEEP_ROUTES];
}

export function crawlRoutes(): string[] {
  const only = process.env.QA_ROUTES?.split(",").map((r) => r.trim()).filter(Boolean);
  // A route in both lists (the Know Your Market pages are) is crawled once:
  // Playwright refuses two tests with one title.
  return only && only.length > 0 ? only : [...new Set([...MENU_ROUTES, ...DEEP_ROUTES])];
}
