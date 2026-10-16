// The backend mounts this build under /v2/ui in production, but serves it at
// the true root in local dev and on the tools host. The basepath has to follow
// whichever prefix the page actually loaded under so in-app navigation stays
// under that prefix. (Assets are always fetched from /v2/ui/assets/... via
// Vite's `base`, independent of the router basepath.)
//
// Lives here, not in router.tsx: components inside the route tree that need
// the basepath (e.g. ToolShell's plain anchors) would otherwise import the
// router module, which imports the route tree, which imports them — a cycle
// that surfaces as "Cannot access 'basepath' before initialization".
const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
export const basepath = pathname === "/v2/ui" || pathname.startsWith("/v2/ui/") ? "/v2/ui" : "/";

/**
 * Build an in-app href. ALWAYS use this instead of `${basepath}${path}`.
 *
 * On the tools host the basepath is "/", so plain concatenation produced
 * "//tools/co-checklist" — and a leading "//" is a PROTOCOL-RELATIVE url, so
 * the browser reads "tools" as the hostname and navigates to
 * https://tools/co-checklist. Every nav tab and cross-link on
 * tools.govpreneurs.com was dead this way, while /v2/ui (basepath "/v2/ui")
 * looked fine — which is why it survived review.
 */
export function appHref(path: string): string {
  const base = basepath === "/" ? "" : basepath;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
