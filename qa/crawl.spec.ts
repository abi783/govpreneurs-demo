// QA crawl. For each route in qa/routes.ts:
//   1. Load the page. Wait until it is quiet (no busy marker, no spinner, no API call in flight).
//   2. Fail on: console errors, page errors, unhandled or failing demo API calls, blocked
//      network calls, requests that leave the app, bad text, a thin main area, horizontal overflow.
//   3. Click sweep. Click each visible, enabled clickable in the menu and the main area, one
//      per fresh load. A click that changes nothing is a "dead click". A click that causes an
//      error condition fails.
//
// Results go to qa/report/routes/<slug>.json. The teardown merges them into crawl.json and crawl.md.

import fs from "node:fs";
import path from "node:path";
import { test, type BrowserContext, type Page, type Request } from "@playwright/test";
import { allKnownRoutes, crawlRoutes } from "./routes";
import type { ClickFailure, ClickRecord, RouteResult } from "./crawlTypes";

const MAX_CLICKS = Number(process.env.QA_MAX_CLICKS ?? 120);
const SETTLE_MS = 500;
const IDLE_TIMEOUT_MS = 12_000;
const BAD_TEXT_PHRASES = /something went wrong|unable to sign in|failed to load|\bundefined\b|\[object Object\]/i;
const BAD_TEXT_NAN = /\bNaN\b/; // case sensitive on purpose: "Finance" is not an error
const MIN_MAIN_CHARS = 80;
const CLICKABLE_SELECTOR = [
  "a[href]",
  "button",
  "[role=button]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=switch]",
  "[role=checkbox]",
  "input[type=checkbox]",
  "input[type=radio]",
  "select",
  "summary",
].join(",");

const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost"]);

interface Probe {
  consoleErrors: string[];
  pageErrors: string[];
  external: string[];
  failedRequests: string[];
  pendingRequests: number;
  popups: number;
  downloads: number;
  nativeDialogs: number;
}

function newProbe(): Probe {
  return {
    consoleErrors: [],
    pageErrors: [],
    external: [],
    failedRequests: [],
    pendingRequests: 0,
    popups: 0,
    downloads: 0,
    nativeDialogs: 0,
  };
}

/** Only allow this app, Google Fonts (answered empty), data: and blob:. Record anything else. */
async function lockNetwork(context: BrowserContext, getPage: () => Page, probe: Probe): Promise<void> {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.protocol === "data:" || url.protocol === "blob:") return route.continue();
    if (ALLOWED_HOSTS.has(url.hostname)) return route.continue();
    if (url.hostname === "fonts.googleapis.com") {
      return route.fulfill({ status: 200, contentType: "text/css", body: "/* qa: fonts skipped */" });
    }
    if (url.hostname === "fonts.gstatic.com") {
      return route.fulfill({ status: 200, contentType: "font/woff2", body: "" });
    }
    // A popup the visitor opened on purpose (target=_blank). It is not an error.
    // For the first request of a new popup the frame does not exist yet, and frame() throws.
    let frame: ReturnType<Request["frame"]> | null = null;
    let page: Page | null = null;
    try {
      frame = request.frame();
      page = frame.page();
    } catch {
      return route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>popup</body></html>" });
    }
    if (page && page !== getPage()) {
      return route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>popup</body></html>" });
    }
    const kind = request.isNavigationRequest() && frame === getPage().mainFrame() ? "navigated away from the app to" : "external request to";
    probe.external.push(`${kind} ${request.url()}`);
    return route.abort("blockedbyclient");
  });
}

async function installInstrumentation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __DEMO_FAST__: boolean }).__DEMO_FAST__ = true;
    const qa = { mutations: 0, clipboard: 0, opened: 0 };
    (window as unknown as { __qa: typeof qa }).__qa = qa;
    const start = () => {
      new MutationObserver((m) => {
        qa.mutations += m.length;
      }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    };
    start();
    try {
      const realWrite = navigator.clipboard?.writeText?.bind(navigator.clipboard);
      if (navigator.clipboard) {
        navigator.clipboard.writeText = async (t: string) => {
          qa.clipboard += 1;
          return realWrite ? realWrite(t).catch(() => undefined) : undefined;
        };
      }
    } catch {
      /* clipboard not available */
    }
  });
}

function attachProbe(page: Page, context: BrowserContext, probe: Probe): void {
  page.on("console", (msg) => {
    if (msg.type() === "error") probe.consoleErrors.push(msg.text().slice(0, 400));
  });
  page.on("pageerror", (err) => probe.pageErrors.push(String(err.message).slice(0, 400)));
  page.on("request", (r: Request) => {
    if (r.frame() === page.mainFrame()) probe.pendingRequests += 1;
  });
  const done = (r: Request) => {
    if (r.frame() === page.mainFrame()) probe.pendingRequests = Math.max(0, probe.pendingRequests - 1);
  };
  page.on("requestfinished", done);
  page.on("requestfailed", (r) => {
    done(r);
    const f = r.failure()?.errorText ?? "";
    if (!/blockedbyclient|ERR_ABORTED/i.test(f)) probe.failedRequests.push(`${r.method()} ${r.url()} ${f}`);
  });
  page.on("download", () => {
    probe.downloads += 1;
  });
  page.on("dialog", (d) => {
    probe.nativeDialogs += 1;
    void d.dismiss().catch(() => undefined);
  });
  context.on("page", (p) => {
    if (p !== page) {
      probe.popups += 1;
      void p.close().catch(() => undefined);
    }
  });
}

/** Wait until the page is quiet for a short while. Returns a problem text, or null. */
async function waitForIdle(page: Page, probe: Probe): Promise<string | null> {
  const deadline = Date.now() + IDLE_TIMEOUT_MS;
  let quietSince = 0;
  while (Date.now() < deadline) {
    const busy = await page
      .evaluate(() => {
        const w = window as unknown as { __DEMO_INFLIGHT__?: number };
        const spinner = document.querySelector(
          '[aria-busy="true"], .animate-spin, .spinner, [data-spinner], [class*="spinner" i], [data-loading="true"]',
        );
        const visibleSpinner =
          spinner &&
          (() => {
            const r = (spinner as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          })();
        return (w.__DEMO_INFLIGHT__ ?? 0) > 0 || Boolean(visibleSpinner);
      })
      .catch(() => true);
    if (!busy && probe.pendingRequests === 0) {
      if (quietSince === 0) quietSince = Date.now();
      if (Date.now() - quietSince >= 250) return null;
    } else {
      quietSince = 0;
    }
    await page.waitForTimeout(60);
  }
  return "the page is still loading after 12 s (a spinner, a busy marker or an API call did not finish)";
}

interface PageSnapshot {
  unhandled: { method: string; path: string }[];
  errors: { method: string; path: string; message: string }[];
  blocked: { url: string; method?: string }[];
  mainText: string;
  bodyText: string;
  overflow: { doc: number; main: number } | null;
}

async function snapshot(page: Page): Promise<PageSnapshot> {
  return page.evaluate(() => {
    const w = window as unknown as {
      __DEMO_UNHANDLED__?: { method: string; path: string }[];
      __DEMO_ERRORS__?: { method: string; path: string; message: string }[];
      __DEMO_BLOCKED__?: { url: string; method?: string }[];
    };
    const main = document.getElementById("demo-main");
    const doc = document.documentElement;
    const overflowDoc = doc.scrollWidth - doc.clientWidth;
    const overflowMain = main ? main.scrollWidth - main.clientWidth : 0;
    return {
      unhandled: w.__DEMO_UNHANDLED__ ?? [],
      errors: w.__DEMO_ERRORS__ ?? [],
      blocked: w.__DEMO_BLOCKED__ ?? [],
      mainText: (main?.innerText ?? "").replace(/\s+/g, " ").trim(),
      bodyText: (document.body.innerText ?? "").replace(/\s+/g, " ").trim(),
      overflow: overflowDoc > 1 || overflowMain > 1 ? { doc: overflowDoc, main: overflowMain } : null,
    };
  });
}

/** Turn the probe and the page snapshot into a list of problems. */
function problemsFrom(probe: Probe, snap: PageSnapshot, base?: PageSnapshot): string[] {
  const out: string[] = [];
  for (const m of probe.consoleErrors) out.push(`console error: ${m}`);
  for (const m of probe.pageErrors) out.push(`page error: ${m}`);
  // After a click, only the entries added since the page loaded count.
  const skip = (list: unknown[] | undefined) => list?.length ?? 0;
  for (const u of snap.unhandled.slice(skip(base?.unhandled))) out.push(`unhandled API call: ${u.method} ${u.path}`);
  for (const u of snap.errors.slice(skip(base?.errors))) out.push(`API handler threw: ${u.method} ${u.path}: ${u.message}`);
  for (const b of snap.blocked.slice(skip(base?.blocked))) out.push(`blocked network call: ${b.method ?? "GET"} ${b.url}`);
  for (const e of probe.external) out.push(e);
  for (const f of probe.failedRequests) out.push(`request failed: ${f}`);
  const phrase = BAD_TEXT_PHRASES.exec(snap.bodyText) ?? BAD_TEXT_NAN.exec(snap.bodyText);
  const alreadyThere = base ? (BAD_TEXT_PHRASES.exec(base.bodyText) ?? BAD_TEXT_NAN.exec(base.bodyText))?.[0] === phrase?.[0] : false;
  if (phrase && !alreadyThere) {
    const at = snap.bodyText.indexOf(phrase[0]);
    out.push(`visible text matches "${phrase[0]}": …${snap.bodyText.slice(Math.max(0, at - 40), at + 60)}…`);
  }
  return Array.from(new Set(out));
}

interface Clickable {
  index: number;
  role: string;
  name: string;
  selector: string;
  /** href when the element is a link, so a link to the current page is not a dead click. */
  href: string | null;
  /** True for a tab, radio or toggle that is already selected. Clicking it again changes nothing. */
  selected: boolean;
}

/** List the visible, enabled clickables in the menu and the main area. Same order on every load. */
async function collectClickables(page: Page): Promise<Clickable[]> {
  return page.evaluate((selector) => {
    function accessibleName(el: Element): string {
      const h = el as HTMLElement;
      const label = el.getAttribute("aria-label");
      if (label) return label.trim();
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) {
        const t = labelledby
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? "")
          .join(" ")
          .trim();
        if (t) return t;
      }
      const text = (h.innerText ?? "").replace(/\s+/g, " ").trim();
      if (text) return text.slice(0, 60);
      const img = el.querySelector("img[alt]");
      if (img?.getAttribute("alt")) return img.getAttribute("alt")!.trim();
      const title = el.getAttribute("title");
      if (title) return title.trim();
      const ph = el.getAttribute("placeholder");
      if (ph) return ph;
      if (el instanceof HTMLInputElement && el.id) {
        const lab = document.querySelector(`label[for="${el.id}"]`);
        if (lab?.textContent) return lab.textContent.trim().slice(0, 60);
      }
      return "(no name)";
    }
    function shortSelector(el: Element): string {
      const parts: string[] = [];
      let cur: Element | null = el;
      for (let i = 0; cur && i < 3 && cur !== document.body; i++) {
        let s = cur.tagName.toLowerCase();
        if (cur.id) {
          s += `#${cur.id}`;
          parts.unshift(s);
          break;
        }
        const cls = (cur.getAttribute("class") ?? "").split(/\s+/).filter(Boolean).slice(0, 2).join(".");
        if (cls) s += `.${cls}`;
        parts.unshift(s);
        cur = cur.parentElement;
      }
      return parts.join(" > ");
    }
    const roots = [document.querySelector(".demo-menu"), document.getElementById("demo-main")].filter(Boolean) as Element[];
    const seen = new Set<Element>();
    const list: Clickable[] = [];
    for (const root of roots) {
      for (const el of Array.from(root.querySelectorAll(selector))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const h = el as HTMLElement;
        if (el.closest("[data-qa-skip]")) continue;
        if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") continue;
        const style = getComputedStyle(h);
        if (style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none") continue;
        const r = h.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        // inside a closed <details> (other than the summary itself)
        const details = el.closest("details");
        if (details && !details.open && el.tagName !== "SUMMARY" && !el.closest("summary")) continue;
        const role = el.getAttribute("role") ?? (el.tagName === "A" ? "link" : el.tagName.toLowerCase());
        const cls = ` ${el.getAttribute("class") ?? ""} `;
        const selected =
          el.getAttribute("aria-selected") === "true" ||
          el.getAttribute("aria-pressed") === "true" ||
          (role === "radio" && el.getAttribute("aria-checked") === "true") ||
          (el instanceof HTMLInputElement && el.type === "radio" && el.checked) ||
          el.hasAttribute("aria-current") ||
          (role === "tab" && el.getAttribute("data-state") === "active") ||
          /\s(is-active|is-on|is-selected|is-current|active|selected)\s/.test(cls);
        list.push({
          index: list.length,
          selected,
          role,
          name: accessibleName(el),
          selector: shortSelector(el),
          href: el.tagName === "A" ? (el as HTMLAnchorElement).href : null,
        });
      }
    }
    return list;
  }, CLICKABLE_SELECTOR) as Promise<Clickable[]>;
}

function slug(route: string): string {
  return route === "/" ? "_root" : route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
}

function withFast(route: string): string {
  return route + (route.includes("?") ? "&" : "?") + "fast=1";
}

async function freshLoad(page: Page, route: string, probe: Probe): Promise<string | null> {
  try {
    await page.evaluate(() => {
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* the page may not be loaded yet */
  }
  await page.goto(withFast(route), { waitUntil: "domcontentloaded" });
  return waitForIdle(page, probe);
}

function resetProbe(probe: Probe): void {
  probe.consoleErrors.length = 0;
  probe.pageErrors.length = 0;
  probe.external.length = 0;
  probe.failedRequests.length = 0;
  probe.popups = 0;
  probe.downloads = 0;
  probe.nativeDialogs = 0;
}

const routes = crawlRoutes();

for (const route of routes) {
  test(`crawl ${route}`, async ({ browser }) => {
    const started = Date.now();
    const result: RouteResult = {
      route,
      ok: true,
      ms: 0,
      clicks: 0,
      errors: [],
      deadClicks: [],
      clickFailures: [],
      warnings: [],
    };
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const probe = newProbe();
    await lockNetwork(context, () => page, probe);
    await installInstrumentation(page);
    attachProbe(page, context, probe);

    try {
      // ── 1. Load and check ────────────────────────────────────────────────
      const idleProblem = await freshLoad(page, route, probe);
      if (idleProblem) result.errors.push(idleProblem);
      await page.waitForTimeout(150);
      let snap = await snapshot(page);
      result.errors.push(...problemsFrom(probe, snap));
      if (snap.mainText.length < MIN_MAIN_CHARS) {
        result.errors.push(`the main area has ${snap.mainText.length} characters of text (needs ${MIN_MAIN_CHARS})`);
      }
      if (snap.overflow) {
        result.errors.push(`horizontal overflow at 1280 px (page ${snap.overflow.doc} px, main ${snap.overflow.main} px)`);
      }
      // Overflow at 1024 px. The page does not load again; it is resized.
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.waitForTimeout(250);
      snap = await snapshot(page);
      if (snap.overflow) {
        result.errors.push(`horizontal overflow at 1024 px (page ${snap.overflow.doc} px, main ${snap.overflow.main} px)`);
      }
      await page.setViewportSize({ width: 1280, height: 800 });

      // ── 2. Click sweep ───────────────────────────────────────────────────
      const recheck = await freshLoad(page, route, probe);
      if (recheck) result.warnings.push(`reload: ${recheck}`);
      const all = await collectClickables(page);
      const clickables = all.slice(0, MAX_CLICKS);
      if (all.length > MAX_CLICKS) {
        result.warnings.push(`${all.length} clickables found; only the first ${MAX_CLICKS} were clicked`);
      }

      const knownPaths = new Set(allKnownRoutes().map((r) => r.split("?")[0]));

      for (const item of clickables) {
        resetProbe(probe);
        // Reset the demo error lists with the fresh load.
        const loadProblem = await freshLoad(page, route, probe);
        if (loadProblem) {
          result.warnings.push(`reload before click ${item.index}: ${loadProblem}`);
        }
        const list = await collectClickables(page);
        let target = list[item.index];
        if (!target || target.name !== item.name || target.role !== item.role) {
          target = list.find((c) => c.name === item.name && c.role === item.role && c.selector === item.selector) as Clickable;
        }
        if (!target) {
          result.warnings.push(`${item.role} "${item.name}" was not on the page after reload; skipped`);
          continue;
        }
        resetProbe(probe);

        // Measure how noisy the page is with no click.
        await page.evaluate(() => {
          (window as unknown as { __qa: { mutations: number } }).__qa.mutations = 0;
        });
        await page.waitForTimeout(150);
        const baseline = await page.evaluate(() => (window as unknown as { __qa: { mutations: number } }).__qa.mutations);

        const baseSnap = await snapshot(page);
        const before = await page.evaluate(() => {
          const sc = document.getElementById("demo-main");
          const ae = document.activeElement as HTMLElement | null;
          return {
            url: location.href,
            scroll: [window.scrollY, sc?.scrollTop ?? 0],
            active: ae ? `${ae.tagName}#${ae.id}` : "",
          };
        });
        await page.evaluate(() => {
          const q = (window as unknown as { __qa: { mutations: number; clipboard: number } }).__qa;
          q.mutations = 0;
          q.clipboard = 0;
        });

        const handle = await page.evaluateHandle(
          ({ selector, index }) => {
            const roots = [document.querySelector(".demo-menu"), document.getElementById("demo-main")].filter(Boolean) as Element[];
            const seen = new Set<Element>();
            let i = 0;
            for (const root of roots) {
              for (const el of Array.from(root.querySelectorAll(selector))) {
                if (seen.has(el)) continue;
                seen.add(el);
                if (el.closest("[data-qa-skip]")) continue;
                if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") continue;
                const h = el as HTMLElement;
                const style = getComputedStyle(h);
                if (style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none") continue;
                const r = h.getBoundingClientRect();
                if (r.width < 1 || r.height < 1) continue;
                const details = el.closest("details");
                if (details && !details.open && el.tagName !== "SUMMARY" && !el.closest("summary")) continue;
                if (i === index) return el;
                i++;
              }
            }
            return null;
          },
          { selector: CLICKABLE_SELECTOR, index: target.index },
        );
        const element = handle.asElement();
        if (!element) {
          result.warnings.push(`${item.role} "${item.name}" could not be found for the click; skipped`);
          continue;
        }

        result.clicks += 1;
        try {
          await element.click({ timeout: 4000 });
        } catch (err) {
          const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
          result.warnings.push(`${item.role} "${item.name}" (${item.selector}) could not be clicked: ${msg}`);
          continue;
        }
        await page.waitForTimeout(SETTLE_MS);

        const after = await page
          .evaluate(() => {
            const q = (window as unknown as { __qa: { mutations: number; clipboard: number } }).__qa;
            const sc = document.getElementById("demo-main");
            const ae = document.activeElement as HTMLElement | null;
            const editable = ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable);
            const opened = document.querySelector(
              '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], dialog[open], [popover]:popover-open',
            );
            return {
              url: location.href,
              mutations: q.mutations,
              clipboard: q.clipboard,
              scroll: [window.scrollY, sc?.scrollTop ?? 0],
              active: ae ? `${ae.tagName}#${ae.id}` : "",
              editable: Boolean(editable),
              opened: Boolean(opened),
            };
          })
          .catch(() => null);

        // A click that moved to another crawled route is judged by that route's own test.
        const movedPath = after ? new URL(after.url).pathname : null;
        const movedToKnownRoute =
          after && after.url !== before.url && movedPath !== null && movedPath !== new URL(before.url).pathname && knownPaths.has(movedPath);

        const noisy = baseline > 2;
        const mutated = after ? after.mutations > (noisy ? baseline * 3 + 4 : 0) : true;
        const urlChanged = Boolean(after && after.url !== before.url);
        // A link to the page you are on (the harness adds ?fast=1, so ignore a missing query).
        const selfLink = (() => {
          if (!target.href) return false;
          const to = new URL(target.href);
          const here = new URL(before.url);
          return to.pathname === here.pathname && !to.hash && (to.search === "" || to.search === here.search);
        })();
        const scrolled = Boolean(after && (after.scroll[0] !== before.scroll[0] || after.scroll[1] !== before.scroll[1]));
        const focusInput = Boolean(after && after.editable && after.active !== before.active);

        const effect =
          urlChanged ||
          mutated ||
          scrolled ||
          focusInput ||
          Boolean(after?.opened) ||
          Boolean(after && after.clipboard > 0) ||
          probe.popups > 0 ||
          probe.downloads > 0 ||
          probe.nativeDialogs > 0 ||
          selfLink ||
          target.selected;

        if (!after) {
          // The page reloaded or closed under us. That is an effect.
          continue;
        }

        if (!movedToKnownRoute) {
          const snapAfter = await snapshot(page);
          const problems = problemsFrom(probe, snapAfter, baseSnap);
          if (problems.length > 0) {
            const failure: ClickFailure = { role: item.role, name: item.name, selector: item.selector, error: problems.slice(0, 3).join(" | ") };
            result.clickFailures.push(failure);
            continue;
          }
        } else {
          // Only leaving the app counts as an error for a move to another route.
          const leftApp = probe.external.filter((e) => e.startsWith("navigated away"));
          if (leftApp.length > 0) {
            result.clickFailures.push({ role: item.role, name: item.name, selector: item.selector, error: leftApp[0] });
            continue;
          }
        }

        if (!effect) {
          const dead: ClickRecord = { role: item.role, name: item.name, selector: item.selector };
          result.deadClicks.push(dead);
        }
      }
    } finally {
      await context.close().catch(() => undefined);
    }

    result.ms = Date.now() - started;
    result.ok = result.errors.length === 0 && result.deadClicks.length === 0 && result.clickFailures.length === 0;
    fs.writeFileSync(path.resolve(process.cwd(), "qa", "report", "routes", `${slug(route)}.json`), JSON.stringify(result, null, 2));

    const summary = [
      ...result.errors.map((e) => `error: ${e}`),
      ...result.deadClicks.map((d) => `dead click: ${d.role} "${d.name}" (${d.selector})`),
      ...result.clickFailures.map((c) => `click error: ${c.role} "${c.name}": ${c.error}`),
    ];
    if (summary.length > 0) {
      const short = summary.slice(0, 6).map((l) => (l.length > 260 ? `${l.slice(0, 260)}…` : l));
      throw new Error(
        `${route}: ${summary.length} problem(s). The first ones:\n${short.map((l) => `  - ${l.split("\n")[0]}`).join("\n")}\nFull list: qa/report/crawl.md`,
      );
    }
  });
}
