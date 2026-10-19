// DEMO: keep every link and every `window.open` inside the app.
//
// Production pages opened GoHighLevel (GHL) pages in a new tab or in the parent
// frame. In the demo a click must never load another site's page by mistake, and
// it must never reload the app (a reload drops in-memory state). This guard runs
// after the app's own click handlers and applies these rules to a clicked <a>:
//
//   1. The app handled the click already (`defaultPrevented`): do nothing.
//   2. The link goes to a GHL page (app.govpreneurs.com custom-menu-link, or
//      scv2.govpreneurs.com): open the matching demo route. If there is no
//      matching route, show a notice.
//   3. The link is on this origin and is a page (not a file download): move with
//      the router, even when the anchor says `target="_blank"`.
//   4. The link points at the demo API (`/__demo_api/...` or `/api/...`), such as a
//      document download: ask the router for the answer, then save the body as a
//      file. The handler returns a `Response` with a body and a content type.
//   5. A link to a file on this origin (a PDF in /demo-files): leave the browser to it.
//   6. DEMO: any other link (sam.gov, DIBBS, a mailto: or tel: address) never leaves the app. The
//      guard shows a notice that says where the live product would go. It also stops a
//      middle-click and a Ctrl- or Cmd-click, which would open the outside page in a new tab.
//
// `window.open` follows the same rules for the URL it receives.

import { demoNavigate } from "./navigate";
import { menuLinkIdFromUrl, menuLinkPath } from "./menuLinks";
import { showDemoNotice } from "../ui/notice";

const GHL_HOSTS = new Set(["app.govpreneurs.com", "scv2.govpreneurs.com"]);
const FILE_EXT = /\.(pdf|docx?|xlsx?|csv|zip|png|jpe?g|gif|svg|webp|txt|json|xml|mp4|mp3)$/i;

type Decision =
  | { path: string }
  | { notice: true }
  | { download: string }
  | { outside: { title: string; message: string } };

/** DEMO: the notice for a link that points outside the app. */
function outsideNotice(url: URL): { title: string; message: string } {
  if (url.protocol === "mailto:") {
    const to = decodeURIComponent(url.pathname).trim();
    return {
      title: "No email in this demo",
      message: `In the live product, this link starts an email${to ? ` to ${to}` : ""}. This sample does not send email.`,
    };
  }
  if (url.protocol === "tel:" || url.protocol === "sms:") {
    const to = decodeURIComponent(url.pathname).trim();
    return {
      title: "No calls in this demo",
      message: `In the live product, this link starts a call${to ? ` to ${to}` : ""}. This sample does not place calls.`,
    };
  }
  const host = url.hostname.replace(/^www\./, "");
  return {
    title: "This link leaves the demo",
    message: `In the live product, this link opens ${host}. This sample does not open outside sites.`,
  };
}

/** What to do with a URL: a demo path to open, a notice to show, or leave it alone. */
function decide(href: string): Decision | null {
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (url.protocol === "mailto:" || url.protocol === "tel:" || url.protocol === "sms:") {
    return { outside: outsideNotice(url) };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  if (GHL_HOSTS.has(url.hostname)) {
    const id = menuLinkIdFromUrl(url.href);
    const path = id ? menuLinkPath(id) : url.hostname === "scv2.govpreneurs.com" ? "/" : null;
    return path ? { path } : { notice: true };
  }

  if (url.origin === window.location.origin) {
    if (url.pathname.startsWith("/__demo_api/") || url.pathname.startsWith("/api/")) {
      return { download: url.href };
    }
    if (FILE_EXT.test(url.pathname)) return null;
    return { path: `${url.pathname}${url.search}${url.hash}` };
  }
  return { outside: outsideNotice(url) };
}

function fileNameFrom(res: Response, url: URL): string {
  const disposition = res.headers.get("content-disposition") ?? "";
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return url.searchParams.get("fileName") ?? (url.pathname.split("/").filter(Boolean).pop() || "document");
}

/** Ask the router for a file and save it. A failed answer shows a notice. */
async function downloadFromApi(href: string): Promise<void> {
  try {
    const res = await window.fetch(href);
    if (!res.ok) throw new Error(`status ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileNameFrom(res, new URL(href));
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  } catch {
    showDemoNotice({
      title: "File not available",
      message: "This sample file is not part of the demo.",
    });
  }
}

function act(result: Decision): void {
  if ("path" in result) demoNavigate(result.path);
  else if ("download" in result) void downloadFromApi(result.download);
  else if ("outside" in result) showDemoNotice(result.outside);
  else openNotice();
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
    const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    const raw = anchor.getAttribute("href") ?? "";
    if (raw === "" || raw.startsWith("#")) return; // in-page anchors stay with the browser
    const result = decide(raw);
    if (!result) return;
    // A click with a modifier key opens a new tab. A page of this app may open that way. Nothing else may.
    if ((e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && "path" in result) return;
    // A `download` link to a file stays with the browser. A `download` link to the demo API does not.
    if (anchor.hasAttribute("download") && !("download" in result) && !("outside" in result)) return;
    e.preventDefault();
    act(result);
  });

  // DEMO: a middle-click on an outside link would open it in a new tab. Show the notice instead.
  document.addEventListener("auxclick", (e) => {
    if (e.defaultPrevented || e.button !== 1) return;
    const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    const raw = anchor.getAttribute("href") ?? "";
    if (raw === "" || raw.startsWith("#")) return;
    const result = decide(raw);
    if (result && "outside" in result) {
      e.preventDefault();
      act(result);
    }
  });

  const realOpen = window.open.bind(window);
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (url == null || String(url) === "") return realOpen(url as undefined, target, features);
    const result = decide(String(url));
    if (!result) return realOpen(url, target, features);
    act(result);
    return null;
  }) as typeof window.open;
}
