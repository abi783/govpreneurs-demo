// Text dump for the story and copy review. Not a test of behaviour.
//   QA_TEXT=1 QA_PORT=4361 QA_WORKERS=3 bunx playwright test qa/text-dump.spec.ts
//   QA_TEXT=1 QA_ROUTES=/forecasts,/partners ... (only some routes)
//   QA_TEXT_DEPTH=full|expand   (full clicks every button; expand clicks tabs and expanders only)
//
// For each route it writes qa/report/text/<slug>.txt:
//   the visible text of the page (menu and top strip left out), every placeholder, title,
//   aria-label and alt text, every link that leaves the app, and, after each click on a
//   button, tab or expander, the text that the click added. Every click starts from a fresh
//   load, so one click cannot change the next.

import fs from "node:fs";
import path from "node:path";
import { test, type ElementHandle, type Page } from "@playwright/test";
import { crawlRoutes } from "./routes";
import { OPPORTUNITIES } from "../src/demo/story/opportunities";

test.skip(!process.env.QA_TEXT, "set QA_TEXT=1 to dump page text");

const OUT = path.join(process.cwd(), "qa", "report", "text");
const DEPTH = process.env.QA_TEXT_DEPTH ?? "auto";
const MAX_CLICKS = Number(process.env.QA_MAX_CLICKS ?? 90);

const SELECTOR = [
  "button",
  "[role=button]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=switch]",
  "[role=checkbox]",
  "[role=radio]",
  "[aria-expanded]",
  "[aria-haspopup]",
  "summary",
  "select",
  "input[type=checkbox]",
  "input[type=radio]",
].join(",");

const EXPANDER = /show more|see more|see the full|full analysis|view all|see all|read more|expand|more details|how (it|this) works|why these|details|show all|learn more|view the|open the/i;

function slug(route: string): string {
  return route === "/" ? "_root" : route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
}

function withFast(route: string): string {
  return route + (route.includes("?") ? "&" : "?") + "fast=1";
}

async function load(page: Page, route: string): Promise<void> {
  try {
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  } catch {
    /* first load */
  }
  await page.goto(withFast(route), { waitUntil: "domcontentloaded" });
  await settle(page);
}

async function settle(page: Page): Promise<void> {
  const deadline = Date.now() + 12_000;
  let quietSince = 0;
  while (Date.now() < deadline) {
    const busy = await page
      .evaluate(() => {
        const w = window as unknown as { __DEMO_INFLIGHT__?: number };
        const sp = document.querySelector('[aria-busy="true"], .animate-spin, [class*="spinner" i], [data-loading="true"]');
        return (w.__DEMO_INFLIGHT__ ?? 0) > 0 || Boolean(sp && (sp as HTMLElement).getBoundingClientRect().width > 0);
      })
      .catch(() => true);
    if (!busy) {
      if (quietSince === 0) quietSince = Date.now();
      if (Date.now() - quietSince >= 400) return;
    } else quietSince = 0;
    await page.waitForTimeout(80);
  }
}

/** Wait until the text stops changing, so a chat answer that types out is read in full. */
async function stable(page: Page): Promise<void> {
  let last = "";
  let same = 0;
  for (let i = 0; i < 40 && same < 4; i++) {
    const now = (await readText(page)).join("\n");
    same = now === last ? same + 1 : 0;
    last = now;
    await page.waitForTimeout(150);
  }
}

/** Visible text of everything except the left menu and the sample-data strip. */
async function readText(page: Page): Promise<string[]> {
  const text = await page.evaluate(() => {
    const hide = [document.querySelector(".demo-menu"), document.querySelector(".demo-strip")] as (HTMLElement | null)[];
    const prev = hide.map((el) => el?.style.display ?? "");
    hide.forEach((el) => el && (el.style.display = "none"));
    const t = document.body.innerText;
    hide.forEach((el, i) => el && (el.style.display = prev[i]));
    return t;
  });
  return text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

async function readAttrs(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const menu = document.querySelector(".demo-menu");
    for (const el of Array.from(document.querySelectorAll("[placeholder],[title],[aria-label],img[alt],input[value]"))) {
      if (menu?.contains(el)) continue;
      for (const a of ["placeholder", "title", "aria-label", "alt"]) {
        const v = el.getAttribute(a);
        if (v && v.trim()) out.push(`${a}: ${v.trim()}`);
      }
      if (el instanceof HTMLInputElement && el.value && !["checkbox", "radio", "hidden"].includes(el.type)) out.push(`value: ${el.value}`);
    }
    return Array.from(new Set(out));
  });
}

async function readLinks(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") ?? "";
      const label = ((a as HTMLElement).innerText || a.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60);
      const outside = !href.startsWith("/") && !href.startsWith("#") && !href.startsWith("?");
      const blank = a.getAttribute("target") === "_blank";
      if (outside || blank) out.push(`${outside ? "OUTSIDE" : "new tab"}: ${href} — ${label}`);
    }
    return Array.from(new Set(out));
  });
}

interface Item {
  index: number;
  role: string;
  name: string;
}

const LIST_FN = `(() => {
  const SELECTOR = ${JSON.stringify(SELECTOR)};
  const menu = document.querySelector(".demo-menu");
  const strip = document.querySelector(".demo-strip");
  const seen = new Set();
  const list = [];
  for (const el of Array.from(document.querySelectorAll(SELECTOR))) {
    if (seen.has(el)) continue;
    seen.add(el);
    if (menu && menu.contains(el)) continue;
    if (strip && strip.contains(el)) continue;
    if (el.closest("[data-qa-skip]")) continue;
    if (el.disabled || el.getAttribute("aria-disabled") === "true") continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none" || st.pointerEvents === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (el.tagName === "A") continue;
    const label = el.getAttribute("aria-label") || (el.innerText || "").replace(/\\s+/g, " ").trim() || el.getAttribute("title") || el.getAttribute("placeholder") || "(no name)";
    list.push({ el, role: el.getAttribute("role") || el.tagName.toLowerCase(), name: label.slice(0, 70) });
  }
  return list;
})()`;

async function listItems(page: Page): Promise<Item[]> {
  return page.evaluate(`${LIST_FN}.map((x, i) => ({ index: i, role: x.role, name: x.name }))`) as Promise<Item[]>;
}

for (const route of (() => {
  const base = crawlRoutes();
  if (process.env.QA_ROUTES) return base;
  const extra = OPPORTUNITIES.map((o) => `/opportunities/${o.id}?met=1`);
  return Array.from(new Set([...base, ...extra]));
})()) {
  test(`text ${route}`, async ({ browser }) => {
    fs.mkdirSync(OUT, { recursive: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const external: string[] = [];
    await context.route("**/*", async (r) => {
      const url = new URL(r.request().url());
      if (["127.0.0.1", "localhost"].includes(url.hostname) || url.protocol === "data:" || url.protocol === "blob:") return r.continue();
      if (url.hostname === "fonts.googleapis.com") return r.fulfill({ status: 200, contentType: "text/css", body: "" });
      if (url.hostname === "fonts.gstatic.com") return r.fulfill({ status: 200, contentType: "font/woff2", body: "" });
      external.push(url.toString());
      return r.abort("blockedbyclient");
    });
    await page.addInitScript(() => {
      (window as unknown as { __DEMO_FAST__: boolean }).__DEMO_FAST__ = true;
    });
    page.on("dialog", (d) => void d.dismiss().catch(() => undefined));
    context.on("page", (p) => {
      if (p !== page) void p.close().catch(() => undefined);
    });

    const lines: string[] = [`# ROUTE ${route}`];
    try {
      await load(page, route);
      const startPath = new URL(page.url()).pathname + new URL(page.url()).search.replace(/[?&]fast=1/, "");
      lines.push(`# FINAL URL ${startPath}`);
      const base = await readText(page);
      lines.push("", "## TEXT", ...base);
      const attrs = await readAttrs(page);
      lines.push("", "## ATTRIBUTES", ...attrs);
      const links = await readLinks(page);
      lines.push("", "## LINKS THAT LEAVE THE APP OR OPEN A NEW TAB", ...(links.length ? links : ["(none)"]));

      const items = await listItems(page);
      const heroLike = /^\/(opportunities\/(SP4701-26-Q-0021|W912EE-26-R-0066|SP4701-26-R-0078|FAYNC|CUMCO|W912EE-27))/.test(route);
      const full = DEPTH === "full" || (DEPTH === "auto" && (heroLike || !/^\/(opportunities\/|forecasts\/|small-orders\/|awards\/)/.test(route)));
      const chosen = items.filter((i) => full || i.role === "tab" || EXPANDER.test(i.name)).slice(0, MAX_CLICKS);
      lines.push("", `## CLICKABLES: ${items.length} found, ${chosen.length} clicked (${full ? "full" : "expand"})`);
      const baseSet = new Set(base);

      for (const item of chosen) {
        await load(page, route);
        const handle = await page.evaluateHandle(`${LIST_FN}[${item.index}]?.el ?? null`);
        const el = handle.asElement() as ElementHandle<HTMLElement> | null;
        if (!el) continue;
        const before = page.url();
        try {
          await el.click({ timeout: 3000 });
        } catch {
          lines.push("", `### CLICK ${item.role} "${item.name}": could not click`);
          continue;
        }
        await page.waitForTimeout(450);
        await stable(page);
        if (new URL(page.url()).pathname !== new URL(before).pathname) {
          lines.push("", `### CLICK ${item.role} "${item.name}": goes to ${new URL(page.url()).pathname}`);
          continue;
        }
        const after = await readText(page);
        const added = after.filter((l) => !baseSet.has(l));
        const afterAttrs = (await readAttrs(page)).filter((a) => !attrs.includes(a));
        const afterLinks = (await readLinks(page)).filter((a) => !links.includes(a));
        if (added.length || afterAttrs.length || afterLinks.length) {
          lines.push("", `### CLICK ${item.role} "${item.name}"`, ...added, ...afterAttrs.map((a) => `[attr] ${a}`), ...afterLinks.map((a) => `[link] ${a}`));
        }
      }
    } finally {
      if (external.length) lines.push("", "## REQUESTS THAT LEFT THE APP", ...Array.from(new Set(external)));
      fs.writeFileSync(path.join(OUT, `${slug(route)}.txt`), lines.join("\n") + "\n");
      await context.close().catch(() => undefined);
    }
  });
}

test("text: search palette", async ({ browser }) => {
  fs.mkdirSync(OUT, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    (window as unknown as { __DEMO_FAST__: boolean }).__DEMO_FAST__ = true;
  });
  await load(page, "/");
  const lines: string[] = ["# SEARCH PALETTE"];
  const open = async () => {
    await page.locator(".demo-search").click();
    await page.waitForTimeout(400);
  };
  const dialogText = async () =>
    (await page.evaluate(() => (document.querySelector('[role="dialog"]') as HTMLElement | null)?.innerText ?? "(no dialog)"))
      .split("\n")
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  await open();
  lines.push("", "## EMPTY QUERY", ...(await dialogText()));
  for (const q of ["fort", "bragg", "mackall", "ava", "diana", "mentor", "pipeline", "carolina", "womack", "va ", "cafe", "catering", "wosb", "wallet", "capability", "cumberland", "zzzz", "roof", "sam", "naics", "partner", "forecast", "award", "small order", "task", "roadmap"]) {
    const input = page.locator('[role=dialog] input, [cmdk-input], input[placeholder]').first();
    await input.fill(q);
    await page.waitForTimeout(350);
    lines.push("", `## QUERY "${q}"`, ...(await dialogText()));
  }
  fs.writeFileSync(path.join(OUT, "_palette.txt"), lines.join("\n") + "\n");
  await context.close();
});
