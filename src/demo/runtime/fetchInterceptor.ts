// DEMO: nothing the demo does may leave the browser.
//
// `installFetchInterceptor()` runs first in `src/main.tsx`. It wraps four
// network doors: `fetch`, `XMLHttpRequest`, `navigator.sendBeacon` and
// `window.open` (the last one lives in `src/demo/nav/linkGuard.ts`).
//
// Rules for `fetch`:
//   1. A path that starts with `/__demo_api/` (frontend-v2 code) or `/api/`
//      (code lifted from the Success Center) goes to the router in `router.ts`.
//   2. A same-origin GET or HEAD for a static file (fonts, images, JSON) goes
//      through.
//   3. Google Fonts goes through.
//   4. `data:` and `blob:` URLs go through.
//   5. Anything else is blocked. The call is recorded in `window.__DEMO_BLOCKED__`,
//      logged with `console.error("[demo] blocked network call", url)`, and the
//      promise rejects with a `TypeError`, the same as a real network failure.

import { handleDemoRequest } from "./router";

export const DEMO_API_PREFIX = "/__demo_api";
const SC_API_PREFIX = "/api";

const PASS_HOSTS = new Set(["fonts.googleapis.com", "fonts.gstatic.com"]);

type RouteDecision =
  | { kind: "api"; routePath: string }
  | { kind: "pass" }
  | { kind: "block" };

/** Decide what happens to a request URL. Exported for the QA harness. */
export function classifyUrl(url: URL, method: string): RouteDecision {
  if (url.protocol === "data:" || url.protocol === "blob:") return { kind: "pass" };
  if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "block" };
  if (PASS_HOSTS.has(url.hostname)) return { kind: "pass" };
  if (url.origin !== window.location.origin) return { kind: "block" };

  const p = url.pathname;
  if (p === DEMO_API_PREFIX || p.startsWith(`${DEMO_API_PREFIX}/`)) {
    return { kind: "api", routePath: p.slice(DEMO_API_PREFIX.length) || "/" };
  }
  if (p === SC_API_PREFIX || p.startsWith(`${SC_API_PREFIX}/`)) {
    return { kind: "api", routePath: p };
  }
  if (method === "GET" || method === "HEAD") return { kind: "pass" };
  return { kind: "block" };
}

function recordBlocked(url: string, method?: string): void {
  console.error("[demo] blocked network call", url);
  (window.__DEMO_BLOCKED__ ??= []).push({ url, method });
}

let installed = false;

export function installFetchInterceptor(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let request: Request | null = null;
    let href: string;
    if (typeof input === "string") href = input;
    else if (input instanceof URL) href = input.href;
    else {
      request = input;
      href = input.url;
    }
    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      recordBlocked(href);
      throw new TypeError("Failed to fetch");
    }
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const decision = classifyUrl(url, method);
    if (decision.kind === "api") return handleDemoRequest(decision.routePath, url, init, request);
    if (decision.kind === "pass") return realFetch(input as RequestInfo, init);
    recordBlocked(url.href, method);
    throw new TypeError("Failed to fetch");
  };

  // navigator.sendBeacon: nothing may be sent. Report false, as a browser does on failure.
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon = (url: string | URL): boolean => {
      try {
        const u = new URL(String(url), window.location.href);
        const d = classifyUrl(u, "POST");
        if (d.kind === "block" || d.kind === "api") recordBlocked(u.href, "BEACON");
      } catch {
        recordBlocked(String(url), "BEACON");
      }
      return false;
    };
  }

  // XMLHttpRequest: same-origin GET for static files is fine. Everything else fails like a network error.
  const proto = XMLHttpRequest.prototype;
  const realOpen = proto.open;
  const realSend = proto.send;
  type DemoXhr = XMLHttpRequest & { __demoBlocked?: { url: string; method: string } };
  proto.open = function (this: DemoXhr, method: string, url: string | URL, ...rest: unknown[]) {
    try {
      const u = new URL(String(url), window.location.href);
      const d = classifyUrl(u, method.toUpperCase());
      this.__demoBlocked = d.kind === "pass" ? undefined : { url: u.href, method: method.toUpperCase() };
    } catch {
      this.__demoBlocked = { url: String(url), method: method.toUpperCase() };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (realOpen as any).call(this, method, url, ...rest);
  } as typeof proto.open;
  proto.send = function (this: DemoXhr, body?: Document | XMLHttpRequestBodyInit | null) {
    if (this.__demoBlocked) {
      const { url, method } = this.__demoBlocked;
      recordBlocked(url, method);
      setTimeout(() => {
        this.dispatchEvent(new ProgressEvent("error"));
        this.dispatchEvent(new ProgressEvent("loadend"));
      }, 0);
      return;
    }
    return realSend.call(this, body);
  };
}
