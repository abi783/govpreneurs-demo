// DEMO SHIM. Do not overwrite this file when you lift Success Center code.
// The real file posts messages to the GoHighLevel parent frame to change pages.
// Here every move goes through the app router (src/demo/nav/navigate.ts).

import { demoNavigate } from "../../demo/nav/navigate";
import { menuLinkPath } from "../../demo/nav/menuLinks";

export const PLAN_CTA_ENABLED = false;
export const PARENT_ORIGIN = "https://app.govpreneurs.com";
export const ROADMAP_PAGE_KEY = "roadmap";

/** My Business, as an in-app path. */
export function myBusinessUrl(_locationId?: string): string {
  return menuLinkPath("614a7424") ?? "/my-business";
}

/** Always false: the demo is never inside a GoHighLevel frame. */
export function isFramed(): boolean {
  return false;
}

export function portalNavigate(path: string): void {
  demoNavigate(path);
}

const PAGE_KEY_TO_PATH: Record<string, string> = {
  roadmap: "/roadmap",
  tasks: "/tasks",
  opportunities: "/opportunities",
  mentors: "/mentors",
  partners: "/partners",
  awards: "/awards",
  "small-orders": "/small-orders",
  forecasts: "/forecasts",
};

/** Open a page by its GoHighLevel page key. An unknown key does nothing. */
export function requestGhlPage(page: string): void {
  const to = PAGE_KEY_TO_PATH[page];
  if (to) demoNavigate(to);
}
