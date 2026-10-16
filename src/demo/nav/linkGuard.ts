// DEMO: keep every link and every `window.open` inside the app.
//
// Production pages opened GoHighLevel (GHL) pages in a new tab or in the parent
// frame. In the demo a click must never load another site's page by mistake, and
// it must never reload the app (a reload drops in-memory state). This guard runs
// after the app's own click handlers and applies four rules to a clicked <a>:
//
//   1. The app handled the click already (`defaultPrevented`): do nothing.
//   2. The link goes to a GHL page (app.govpreneurs.com custom-menu-link, or
//      scv2.govpreneurs.com): open the matching demo route. If there is no
//      matching route, show a notice.
//   3. The link is on this origin and is a page (not a file download): move with
//      the router, even when the anchor says `target="_blank"`.
//   4. Any other link (sam.gov, mailto:, a file): leave the browser to it.
//
// `window.open` follows the same rules for the URL it receives.

import { demoNavigate } from "./navigate";
import { menuLinkIdFromUrl, menuLinkPath } from "./menuLinks";
import { showDemoNotice } from "../ui/notice";

const GHL_HOSTS = new Set(["app.govpreneurs.com", "scv2.govpreneurs.com"]);
const FILE_EXT = /\.(pdf|docx?|xlsx?|csv|zip|png|jpe?g|gif|svg|webp|txt|json|xml|mp4|mp3)$/i;

/** What to do with a URL: a demo path to open, a notice to show, or leave it alone. */
function decide(href: string): { path: string } | { notice: true } | null {
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  if (GHL_HOSTS.has(url.hostname)) {
    const id = menuLinkIdFromUrl(url.href);
    const path = id ? menuLinkPath(id) : url.hostname === "scv2.govpreneurs.com" ? "/" : null;
    return path ? { path } : { notice: true };
  }

  if (url.origin === window.location.origin) {
    if (FILE_EXT.test(url.pathname)) return null;
    if (url.pathname.startsWith("/__demo_api/") || url.pathname.startsWith("/api/")) return null;
    return { path: `${url.pathname}${url.search}${url.hash}` };
  }
  return null;
}

function openNotice(): void {
  showDemoNotice({
    title: "Not part of this demo",
    message:
      "That link opens a page in the live GovPreneurs product. It is not part of this sample.",
  });
}

let installed = false;

export function installLinkGuard(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor || anchor.hasAttribute("download")) return;
    const raw = anchor.getAttribute("href") ?? "";
    if (raw === "" || raw.startsWith("#")) return; // in-page anchors stay with the browser
    const result = decide(raw);
    if (!result) return;
    e.preventDefault();
    if ("path" in result) demoNavigate(result.path);
    else openNotice();
  });

  const realOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (url == null || String(url) === "") return realOpen(url as undefined, target, features);
    const result = decide(String(url));
    if (!result) return realOpen(url, target, features);
    if ("path" in result) demoNavigate(result.path);
    else openNotice();
    return null;
  }) as typeof window.open;
}
