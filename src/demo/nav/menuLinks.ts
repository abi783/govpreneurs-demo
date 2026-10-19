// DEMO: GoHighLevel (GHL) menu-link ids and the demo route each one opens.
//
// In production each page of the member app was a GHL "custom menu link". Code
// refers to a page by its menu-link id, or builds a URL that holds the id:
//   https://app.govpreneurs.com/v2/location/<locationId>/custom-menu-link/<id>
// In the demo, every id opens a route inside this single-page app.
//
// An id is matched on its first 8 characters, so the short form and the full
// UUID both work.

import { demoNavigate } from "./navigate";

export const MENU_LINK_ROUTES: Record<string, string> = {
  f0b947ba: "/", // Success Center
  "4dbc012e": "/roadmap", // Roadmap
  fd379a59: "/roadmap", // Roadmap (the id that `lib/preview.ts` uses)
  d699ca66: "/tasks", // Tasks
  dba1b23c: "/opportunities", // Opportunities
  "2fa897e4": "/forecasts", // Forecasts
  "480c7b69": "/small-orders", // Small Orders
  e38d4dde: "/partners", // Partners
  c6de8d0d: "/awards", // Awards
  "614a7424": "/my-business", // My Business
  "16ced954": "/find-a-mentor", // Mentors (the mentor directory)
  "0216dbf0": "/mentors", // Mentor Reviews
};

function shortId(id: string): string {
  return id.trim().toLowerCase().slice(0, 8);
}

/** The demo route for a menu-link id, or `null` when the id is not known. */
export function menuLinkPath(id: string): string | null {
  return MENU_LINK_ROUTES[shortId(id)] ?? null;
}

/** Read a menu-link id from a GHL URL, or `null` when the URL has none. */
export function menuLinkIdFromUrl(url: string): string | null {
  const m = /custom-menu-link\/([0-9a-f-]{8,36})/i.exec(url);
  return m ? m[1] : null;
}

/**
 * Open the page that a menu-link id names, inside the app.
 * Returns `true` when the id is known. An unknown id does nothing and logs a warning.
 */
/** `suffix` is an optional query string or hash such as `?tab=docs`. */
export function navigateToMenuLink(id: string, suffix = ""): boolean {
  const to = menuLinkPath(id);
  if (!to) {
    console.warn("[demo] unknown menu link id", id);
    return false;
  }
  demoNavigate(`${to}${suffix}`);
  return true;
}
