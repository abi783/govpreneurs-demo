// Break-it checks for the sales demo. The crawl clicks one thing per fresh load. These tests
// go deeper: whole sequences, saved state, abuse, outside links, console warnings and timing.
//
//   QA_PORT=4351 bunx playwright test qa/flows/break-it.spec.ts
//
// Most tests run with real latency (150 to 400 ms per demo API call), so a spinner that
// hangs or a flicker between states shows up. A test that adds `?fast=1` says so.
// Ava (/ava and /ava/*) is out of scope: another agent builds it.
//
// Two sizes of run:
//   quick (default)   the flows, state, dialogs, links, sizes and timing, a few seeds of the monkey,
//                     and the three page sweeps on the menu pages and the walkthrough pages.
//   QA_BREAK_FULL=1   the three page sweeps (outside links, silly input, dialogs) on every route,
//                     and 24 seeds of the monkey at 200 steps. About 40 minutes with 3 workers.
// React only prints key and prop warnings in a development build. To see them, run these tests
// against `bunx vite dev --port 4352` with a playwright config that has no web server.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { MENU_ROUTES, DEEP_ROUTES } from "../routes";

// ── Shared helpers ─────────────────────────────────────────────────────────

const HOSTS = new Set(["127.0.0.1", "localhost"]);
const FULL = Boolean(process.env.QA_BREAK_FULL);

/** Everything that must stay empty during a run. */
interface Watch {
  problems: string[];
  /** Outside requests that the guard blocked. */
  external: string[];
  popups: string[];
  downloads: string[];
}

/**
 * Lock the network to the app (fonts answered empty), then record every console warning and error,
 * page error, failed request, 4xx/5xx answer, native dialog, popup and outside request.
 */
async function watch(page: Page, context: BrowserContext): Promise<Watch> {
  const w: Watch = { problems: [], external: [], popups: [], downloads: [] };
  // A visitor's browser lets a "Copy" button write to the clipboard. A bare test browser refuses.
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.protocol === "data:" || url.protocol === "blob:" || HOSTS.has(url.hostname)) return route.continue();
    if (url.hostname === "fonts.googleapis.com") return route.fulfill({ status: 200, contentType: "text/css", body: "" });
    if (url.hostname === "fonts.gstatic.com") return route.fulfill({ status: 200, contentType: "font/woff2", body: "" });
    w.external.push(`${request.method()} ${url.href}`);
    w.problems.push(`outside request: ${request.method()} ${url.href}`);
    return route.abort("blockedbyclient");
  });
  context.on("page", (p) => {
    if (p === page) return;
    // A file of this app (a sample PDF) may open in a tab. Anything else may not.
    void p
      .waitForLoadState("domcontentloaded")
      .catch(() => undefined)
      .then(async () => {
        const url = p.url();
        w.popups.push(url);
        let sameApp = false;
        try {
          const u = new URL(url);
          sameApp = HOSTS.has(u.hostname) && /\.(pdf|png|jpe?g|docx?|xlsx?|txt)$/i.test(u.pathname);
        } catch {
          sameApp = false;
        }
        if (!sameApp) w.problems.push(`a new tab opened: ${url}`);
        await p.close().catch(() => undefined);
      });
  });
  const here = () => {
    try {
      return new URL(page.url()).pathname;
    } catch {
      return "";
    }
  };
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") w.problems.push(`console ${m.type()} at ${here()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => w.problems.push(`page error at ${here()}: ${String(e.message).slice(0, 300)}`));
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText ?? "";
    if (!/blockedbyclient|ERR_ABORTED/i.test(f)) w.problems.push(`request failed: ${r.method()} ${r.url()} ${f}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && HOSTS.has(new URL(r.url()).hostname)) w.problems.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  page.on("dialog", (d) => {
    w.problems.push(`native ${d.type()} dialog: ${d.message()}`);
    void d.dismiss().catch(() => undefined);
  });
  page.on("download", (d) => w.downloads.push(d.suggestedFilename()));
  // How long did a spinner or a skeleton stay on the screen without a break? The page keeps the longest run.
  await page.addInitScript(() => {
    const q = window as unknown as { __busyMax?: number; __busyWhat?: string };
    q.__busyMax = 0;
    let since = 0;
    window.setInterval(() => {
      const el = Array.from(document.querySelectorAll<HTMLElement>('.animate-spin, [aria-busy="true"], .animate-pulse, [class*="skeleton" i], [class*="spinner" i], [data-loading="true"]')).find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
      });
      const now = performance.now();
      if (el) {
        if (!since) since = now;
        if (now - since > (q.__busyMax ?? 0)) {
          q.__busyMax = now - since;
          q.__busyWhat = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`;
        }
      } else since = 0;
    }, 100);
  });
  return w;
}

/** Problems the demo's own hooks record: unhandled API calls, handler errors, blocked calls. */
async function demoHooks(page: Page): Promise<string[]> {
  return page
    .evaluate(() => {
      const w = window as unknown as {
        __DEMO_UNHANDLED__?: { method: string; path: string }[];
        __DEMO_ERRORS__?: { method: string; path: string; message: string }[];
        __DEMO_BLOCKED__?: { url: string; method?: string }[];
      };
      return [
        ...(w.__DEMO_UNHANDLED__ ?? []).map((u) => `unhandled API call ${u.method} ${u.path}`),
        ...(w.__DEMO_ERRORS__ ?? []).map((u) => `API handler threw ${u.method} ${u.path}: ${u.message}`),
        ...(w.__DEMO_BLOCKED__ ?? []).map((u) => `blocked network call ${u.method ?? "GET"} ${u.url}`),
      ];
    })
    .catch(() => []);
}

const BAD_TEXT = /something went wrong|unable to sign in|failed to load|\bundefined\b|\[object Object\]|\bNaN\b|\bnull\b(?! (hypothesis))/;

async function bodyText(page: Page): Promise<string> {
  return (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, " ");
}

/** Wait until the demo API is idle and no spinner shows. Fails when that takes longer than `limit` ms. */
async function settle(page: Page, limit = 6000): Promise<number> {
  const t0 = Date.now();
  let quietSince = 0;
  while (Date.now() - t0 < limit) {
    const busy = await page
      .evaluate(() => {
        const w = window as unknown as { __DEMO_INFLIGHT__?: number };
        const sp = document.querySelector('[aria-busy="true"], .animate-spin, [class*="spinner" i], [data-loading="true"]');
        const visible =
          sp &&
          (() => {
            const r = (sp as HTMLElement).getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          })();
        return (w.__DEMO_INFLIGHT__ ?? 0) > 0 || Boolean(visible);
      })
      .catch(() => true);
    if (!busy) {
      if (!quietSince) quietSince = Date.now();
      if (Date.now() - quietSince >= 250) return Date.now() - t0 - 250;
    } else quietSince = 0;
    await page.waitForTimeout(40);
  }
  throw new Error(`the page was still busy after ${limit} ms at ${page.url()}`);
}

/** Pass Grant's introduction when it shows. The page remembers a passed introduction. */
async function passGrantIntro(page: Page): Promise<void> {
  const intro = page.getByRole("button", { name: "Show me the analysis" });
  await expect(main(page)).toContainText(/Show me the analysis|GRANT'S CALL/i);
  if (await intro.count()) {
    await intro.click();
    await settle(page);
  }
}

/** Open a route and wait until it is quiet. Returns the time it took. */
async function open(page: Page, route: string): Promise<number> {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  return settle(page);
}

/** After each step: the page has text, no error words, and the demo hooks are clean. */
async function healthy(page: Page, w: Watch, where: string): Promise<void> {
  const text = await bodyText(page);
  const bad = BAD_TEXT.exec(text);
  expect(bad, `bad text "${bad?.[0]}" on ${where}: …${bad ? text.slice(Math.max(0, bad.index - 40), bad.index + 60) : ""}…`).toBeNull();
  const main = (await page.locator("#demo-main").innerText()).trim();
  expect(main.length, `${where} has almost no text`).toBeGreaterThan(60);
  expect(await demoHooks(page), `demo hooks on ${where}`).toEqual([]);
  const busy = await page.evaluate(() => (window as unknown as { __busyMax?: number; __busyWhat?: string }));
  expect(busy.__busyMax ?? 0, `a spinner (${busy.__busyWhat}) stayed on the screen too long, before ${where}`).toBeLessThan(2500);
  expect(w.problems, `problems on ${where}`).toEqual([]);
}

/** A double-click at a person's speed: the page has time to change between the two clicks. */
async function humanDoubleClick(page: Page, target: ReturnType<Page["locator"]>, gapMs = 140): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error("nothing to double-click");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down({ clickCount: 1 });
  await page.mouse.up({ clickCount: 1 });
  await page.waitForTimeout(gapMs);
  // The second press carries a click count of 2, as a real double-click does.
  await page.mouse.down({ clickCount: 2 });
  await page.mouse.up({ clickCount: 2 });
}

function tempFile(name: string, body: string | Buffer): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "break-it-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  return file;
}

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const menu = (page: Page, name: string) => page.locator(".demo-nav").getByRole("link", { name, exact: true });
const main = (page: Page) => page.locator("#demo-main");

// ── 1. Sequences ───────────────────────────────────────────────────────────

const CAMP_MACKALL = "SP4701-26-Q-0021";
const RESTRICTED = "SP4701-26-R-0078";
const FORT_BRAGG = "W912EE-26-R-0066";

test.describe("Tim's path", () => {
  test("end to end with real latency", async ({ page, context }) => {
    const w = await watch(page, context);

    await open(page, "/");
    await healthy(page, w, "/");

    await menu(page, "Roadmap").click();
    await expect(page).toHaveURL(/\/roadmap$/);
    await settle(page);
    await healthy(page, w, "/roadmap");

    await menu(page, "Opportunities").click();
    await expect(page).toHaveURL(/\/opportunities$/);
    await settle(page);
    await healthy(page, w, "/opportunities");

    // Camp Mackall field meals: pass Grant's introduction, read, ask the rail.
    await page.getByRole("heading", { name: "Field meals for Camp Mackall training rotations" }).click();
    await expect(page).toHaveURL(new RegExp(`/opportunities/${CAMP_MACKALL}`));
    await settle(page);
    await expect(main(page)).toContainText("Show me the analysis");
    await page.getByRole("button", { name: "Show me the analysis" }).click();
    await settle(page);
    await expect(main(page)).toContainText("GRANT'S CALL", { ignoreCase: true });
    await page.getByRole("button", { name: "Show 10 more" }).click();
    await page.getByRole("button", { name: "Expand all" }).click();
    for (const q of ["Can I fix this in time?", "Where am I weak?", "What should my response say?"]) {
      await page.getByRole("button", { name: q }).first().click();
      await expect(page.getByText(q).first()).toBeVisible();
      await settle(page);
    }
    await healthy(page, w, "Camp Mackall analysis");

    // Back to the feed, then the restricted site.
    await page.goBack();
    await expect(page).toHaveURL(/\/opportunities$/);
    await settle(page);
    await page.getByRole("heading", { name: "Dining support at a restricted Camp Mackall site" }).click();
    await expect(page).toHaveURL(new RegExp(`/opportunities/${RESTRICTED}`));
    await settle(page);
    await page.getByRole("button", { name: "Show me the analysis" }).click();
    await settle(page);
    await expect(main(page)).toContainText("No-bid", { ignoreCase: true });
    await healthy(page, w, "restricted site analysis");

    // Fort Bragg dining halls, then its next move.
    await page.goBack();
    await expect(page).toHaveURL(/\/opportunities$/);
    await settle(page);
    await page.getByRole("heading", { name: "Run two Fort Bragg dining halls" }).click();
    await expect(page).toHaveURL(new RegExp(`/opportunities/${FORT_BRAGG}`));
    await settle(page);
    await page.getByRole("button", { name: "Show me the analysis" }).click();
    await settle(page);
    await page.getByRole("link", { name: /See Carolina Dining Group on Partners/ }).click();
    await expect(page).toHaveURL(/\/partners/);
    await settle(page);
    await healthy(page, w, "/partners");

    await menu(page, "Pipeline").click();
    await expect(page).toHaveURL(/\/pipeline/);
    await settle(page);
    await healthy(page, w, "/pipeline");

    await menu(page, "Mentor Reviews").click();
    await expect(page).toHaveURL(/\/mentors/);
    await settle(page);
    // The open thread is the Fayetteville proposal. Camp Mackall is closed, so it has no reply box.
    await expect(page).toHaveURL(/\/mentors\/rev-fayetteville-proposal/);
    await expect(main(page)).toContainText("Sarah");
    await healthy(page, w, "a mentor thread");

    const file = tempFile("Haddad-delivery-plan.pdf", "%PDF-1.4 sample");
    await page.locator("input[type=file]").first().setInputFiles(file);
    await expect(main(page)).toContainText("Haddad-delivery-plan.pdf");
    await page.getByRole("button", { name: "Send reply" }).click();
    await settle(page);
    await expect(main(page)).toContainText("Haddad-delivery-plan.pdf");
    await healthy(page, w, "after a reply with a file");

    await page.goto("/wallet");
    await settle(page);
    await healthy(page, w, "/wallet");
    expect(await demoHooks(page)).toEqual([]);
  });
});

// The pages Tim visits, in order, as in-app clicks. Each entry opens the next page from the one before.
interface Step {
  name: string;
  url: RegExp;
  go: (page: Page) => Promise<void>;
}

const TIM_STEPS: Step[] = [
  { name: "home", url: /\/$/, go: async () => undefined },
  { name: "roadmap", url: /\/roadmap$/, go: (p) => menu(p, "Roadmap").click() },
  { name: "opportunities", url: /\/opportunities$/, go: (p) => menu(p, "Opportunities").click() },
  {
    name: "camp mackall",
    url: new RegExp(`/opportunities/${CAMP_MACKALL}`),
    go: (p) => p.getByRole("heading", { name: "Field meals for Camp Mackall training rotations" }).click(),
  },
  { name: "pipeline", url: /\/pipeline/, go: (p) => menu(p, "Pipeline").click() },
  { name: "partners", url: /\/partners/, go: (p) => menu(p, "Partners").click() },
  { name: "mentor reviews", url: /\/mentors\/rev-/, go: (p) => menu(p, "Mentor Reviews").click() },
  { name: "mentors", url: /\/find-a-mentor/, go: (p) => menu(p, "Mentors").click() },
];

test.describe("History and reload", () => {
  test("the back and forward buttons walk the same path", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    for (const step of TIM_STEPS.slice(1)) {
      await step.go(page);
      await expect(page).toHaveURL(step.url);
      await settle(page);
      await healthy(page, w, step.name);
    }
    // Back through every page.
    for (const step of [...TIM_STEPS].reverse().slice(1)) {
      await page.goBack();
      await expect(page).toHaveURL(step.url);
      await settle(page);
      await healthy(page, w, `back to ${step.name}`);
    }
    // And forward again.
    for (const step of TIM_STEPS.slice(1)) {
      await page.goForward();
      await expect(page).toHaveURL(step.url);
      await settle(page);
      await healthy(page, w, `forward to ${step.name}`);
    }
    // Rapid back and forward: no hang, no blank page.
    for (let i = 0; i < 6; i++) await page.goBack();
    for (let i = 0; i < 3; i++) await page.goForward();
    await settle(page);
    await healthy(page, w, "after rapid back and forward");
  });

  test("a reload at every step keeps the page", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    for (const step of TIM_STEPS) {
      await step.go(page);
      await expect(page).toHaveURL(step.url);
      await settle(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      await settle(page);
      await expect(page).toHaveURL(step.url);
      await healthy(page, w, `${step.name} after a reload`);
    }
  });

  test("a reload on the Grant analysis keeps the page and does not hang", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, `/opportunities/${CAMP_MACKALL}`);
    await page.getByRole("button", { name: "Show me the analysis" }).click();
    await settle(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    // Either the introduction or the analysis shows. Both are fine. A blank page is not.
    await expect(main(page)).toContainText(/Show me the analysis|GRANT'S CALL/i);
    await healthy(page, w, "Grant after a reload");
  });
});

test.describe("Deep links in a fresh tab", () => {
  // Every route in the crawl list except Ava. Each loads in its own new tab, cold, with real latency.
  const ROUTES = [
    "/",
    "/roadmap",
    "/tasks",
    "/opportunities",
    `/opportunities/${CAMP_MACKALL}`,
    `/opportunities/${CAMP_MACKALL}?met=1`,
    `/opportunities/${RESTRICTED}`,
    `/opportunities/${FORT_BRAGG}`,
    "/forecasts",
    "/small-orders",
    "/small-orders/mp-101",
    "/partners",
    "/awards",
    "/my-business",
    "/pipeline",
    "/find-a-mentor",
    "/mentors",
    "/mentors/rev-fayetteville-proposal",
    "/wallet",
    "/business-profile",
    "/government-buyers",
    "/vehicles",
    "/labor-pricing",
    "/stay-ready",
  ];
  for (const route of ROUTES) {
    test(`opens ${route}`, async ({ context }) => {
      const page = await context.newPage();
      const w = await watch(page, context);
      const ms = await open(page, route);
      expect(ms, `${route} took ${ms} ms to settle`).toBeLessThan(2500);
      await healthy(page, w, route);
    });
  }
});

// ── 2. State ───────────────────────────────────────────────────────────────

const DRILL_WEEKEND = "Drill-weekend meals for the NC National Guard in Hope Mills";

const card = (page: Page, title: string) => page.locator(".opp-summary-head", { hasText: title });
const savedCount = async (page: Page) => {
  const t = await page.locator("button", { hasText: /^Saved\s*\d+$/ }).first().innerText();
  return Number(t.replace(/\D/g, ""));
};

test.describe("State persists", () => {
  test("save and unsave an opportunity: feed, detail, Pipeline, reload", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/opportunities");
    const start = await savedCount(page);

    await card(page, DRILL_WEEKEND).getByRole("button", { name: "Save opportunity" }).click();
    await expect(card(page, DRILL_WEEKEND).getByRole("button", { name: "Remove from saved" })).toBeVisible();
    await expect.poll(() => savedCount(page)).toBe(start + 1);

    // The detail page shows it saved.
    await page.getByRole("heading", { name: DRILL_WEEKEND }).click();
    await settle(page);
    await page.getByRole("button", { name: "Show me the analysis" }).click();
    await settle(page);
    await expect(main(page).getByRole("button", { name: "Unsave", exact: true })).toBeVisible();

    // The Pipeline lists it, and it is still there after a reload.
    await menu(page, "Pipeline").click();
    await settle(page);
    await expect(main(page)).toContainText(DRILL_WEEKEND);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(main(page)).toContainText(DRILL_WEEKEND);

    // Back on the feed it is still saved. Unsave it there.
    await menu(page, "Opportunities").click();
    await settle(page);
    await expect.poll(() => savedCount(page)).toBe(start + 1);
    await card(page, DRILL_WEEKEND).getByRole("button", { name: "Remove from saved" }).click();
    await expect(card(page, DRILL_WEEKEND).getByRole("button", { name: "Save opportunity" })).toBeVisible();
    await expect.poll(() => savedCount(page)).toBe(start);
    await menu(page, "Pipeline").click();
    await settle(page);
    await expect(main(page)).not.toContainText(DRILL_WEEKEND);
    await healthy(page, w, "after save and unsave");
  });

  test("rapid clicks on Save leave one consistent answer", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/opportunities");
    const start = await savedCount(page);
    const save = card(page, DRILL_WEEKEND).locator("button[aria-label='Save opportunity'], button[aria-label='Remove from saved']");
    // Five fast clicks: an odd number, so the opportunity ends saved.
    for (let i = 0; i < 5; i++) await save.click({ delay: 0, noWaitAfter: true });
    await settle(page);
    await expect(card(page, DRILL_WEEKEND).getByRole("button", { name: "Remove from saved" })).toBeVisible();
    await expect.poll(() => savedCount(page)).toBe(start + 1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(card(page, DRILL_WEEKEND).getByRole("button", { name: "Remove from saved" })).toBeVisible();
    await expect.poll(() => savedCount(page)).toBe(start + 1);
    await healthy(page, w, "after rapid saves");
  });
});

const GRAB_AND_GO = "Grab-and-go and snack bar for the Fort Bragg public-works campus";

async function balance(page: Page): Promise<number> {
  await page.goto("/wallet", { waitUntil: "domcontentloaded" });
  await settle(page);
  const text = await main(page).innerText();
  const m = /YOUR BALANCE\s*\$([\d,]+\.\d\d)/i.exec(text);
  expect(m, "the wallet shows a balance").not.toBeNull();
  return Number(m![1].replace(/,/g, ""));
}

async function openSendDialog(page: Page, title: string) {
  await open(page, "/opportunities");
  await page.getByRole("heading", { name: title }).click();
  await settle(page);
  await passGrantIntro(page);
  await page.getByRole("button", { name: "Review with Mentor" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Send to a mentor");
  return dialog;
}

test.describe("Send to a mentor", () => {
  test("one click, one charge, one review, everywhere", async ({ page, context }) => {
    const w = await watch(page, context);
    const before = await balance(page);
    expect(before).toBe(306);

    const dialog = await openSendDialog(page, GRAB_AND_GO);
    const send = dialog.getByRole("button", { name: /^Send for/ });
    // Empty form: the button does nothing (it is disabled or the form says why).
    await send.click({ force: true, noWaitAfter: true }).catch(() => undefined);
    await expect(dialog).toBeVisible();
    expect(await balance(page)).toBe(before);

    // Back to the dialog and fill it in.
    const dlg = await openSendDialog(page, GRAB_AND_GO);
    await dlg.getByLabel(/I've read the scope of work/).check();
    await dlg.getByLabel("Should I bid on this?").check();
    await dlg.locator("textarea").fill("I cook 1,100 meals a day for a school district. Does my past work count for this snack bar?");
    const sendBtn = dlg.getByRole("button", { name: /^Send for/ });
    await expect(sendBtn).toBeEnabled();
    // Two fast clicks. Only one review and one charge may result.
    await sendBtn.dblclick({ noWaitAfter: true });
    await settle(page);
    await page.waitForTimeout(800);
    await settle(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    expect(await balance(page)).toBe(before - 97);

    // One new review, not two.
    await page.goto("/mentors", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(main(page).locator("a[href^='/mentors/']", { hasText: GRAB_AND_GO })).toHaveCount(1);
    await expect(main(page).locator("a[href^='/mentors/']")).toHaveCount(4);

    // The Pipeline shows it with the mentor.
    await menu(page, "Pipeline").click();
    await settle(page);
    await expect(main(page)).toContainText(GRAB_AND_GO);
    expect((await main(page).innerText()).split(GRAB_AND_GO).length - 1, "the Pipeline lists the opportunity once").toBe(1);

    // A reload keeps the charge.
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    expect(await balance(page)).toBe(before - 97);

    // The opportunity page now shows that a review is with the mentor (no second send offered).
    await open(page, "/opportunities");
    await page.getByRole("heading", { name: GRAB_AND_GO }).click();
    await settle(page);
    await passGrantIntro(page);
    await expect(main(page)).toContainText(/Sarah|mentor/i);
    await expect(main(page).getByRole("button", { name: "Review with Mentor" })).toHaveCount(0);
    await healthy(page, w, "after sending to the mentor");
  });
});

test.describe("Book a call", () => {
  test("one booking, one charge, shown on the Success Center and Tasks", async ({ page, context }) => {
    const w = await watch(page, context);
    const before = await balance(page);
    await open(page, "/");
    const homeBefore = await main(page).innerText();

    await open(page, "/roadmap");
    await page.getByRole("button", { name: /Quarterly Targeting Call/ }).first().click();
    await page.getByRole("button", { name: "Book Your Call" }).click();
    const dialog = page.getByRole("dialog");
    // Escape closes it. Open it again.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: "Book Your Call" }).click();
    await dialog.locator("button:not([disabled])", { hasText: /^20$/ }).click();
    await dialog.getByRole("button", { name: "10:00 AM" }).click();
    const confirm = dialog.getByRole("button", { name: "Confirm this booking" });
    await confirm.dblclick({ noWaitAfter: true });
    await settle(page);
    await page.waitForTimeout(800);
    await settle(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(main(page)).toContainText(/booked|scheduled|Tue.*20|20 Oct/i);

    // One charge.
    expect(await balance(page)).toBe(before - 97);

    // Success Center home shows the call, and it is not on the first visit.
    await open(page, "/");
    const homeAfter = await main(page).innerText();
    expect(homeAfter).not.toEqual(homeBefore);
    expect(homeAfter).toMatch(/Targeting|Sarah/i);
    expect(homeAfter.match(/10:00/g)?.length ?? 0, "the call shows once on home").toBeGreaterThan(0);

    // Tasks shows it, and a reload keeps it.
    await open(page, "/tasks");
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await healthy(page, w, "/tasks after a booking");
    // The roadmap does not offer a second booking for the same step.
    await open(page, "/roadmap");
    await page.getByRole("button", { name: /Quarterly Targeting Call/ }).first().click();
    await expect(main(page)).toContainText(/booked|scheduled|Tuesday|20 Oct|Oct 20/i);
    await healthy(page, w, "/roadmap after a booking");
  });
});

// ── 3. Abuse: dialogs ──────────────────────────────────────────────────────

interface DialogCase {
  name: string;
  route: string;
  open: (page: Page) => Promise<void>;
  /** A confirm dialog may refuse a click outside. Escape must still close it. */
  outsideCloses?: boolean;
}

const openDialogs = (page: Page) => page.locator('[role="dialog"], [role="alertdialog"]').filter({ visible: true });

const DIALOGS: DialogCase[] = [
  { name: "Hunter filters", route: "/opportunities", open: (p) => p.getByRole("button", { name: "Filters" }).first().click() },
  { name: "Save this search", route: "/opportunities", open: (p) => p.getByRole("button", { name: "Save this search" }).click() },
  { name: "Forecast filters", route: "/forecasts", open: (p) => p.getByRole("button", { name: "Filters" }).first().click() },
  { name: "Small Orders narrow sheet", route: "/small-orders", open: (p) => p.getByRole("button", { name: "Narrow this down" }).click() },
  { name: "Wallet add funds", route: "/wallet", open: (p) => p.getByRole("button", { name: "Add funds" }).click() },
  { name: "Pipeline debrief", route: "/pipeline", open: (p) => p.getByRole("button", { name: "Read the debrief notes" }).click() },
  { name: "Pipeline submission", route: "/pipeline", open: (p) => p.getByRole("button", { name: "See what you sent" }).click() },
  {
    name: "Booking sheet",
    route: "/roadmap",
    open: async (p) => {
      if (!(await p.getByRole("button", { name: "Book Your Call" }).count())) await p.getByRole("button", { name: /Quarterly Targeting Call/ }).first().click();
      await p.getByRole("button", { name: "Book Your Call" }).click();
    },
  },
  {
    name: "Send to a mentor",
    route: `/opportunities/${CAMP_MACKALL}`,
    open: async (p) => {
      await passGrantIntro(p);
      await p.getByRole("button", { name: /Send to Sarah for a second opinion|Review with Mentor/ }).first().click();
    },
  },
  { name: "Command palette", route: "/", open: (p) => p.locator(".demo-search").click() },
  { name: "Reset demo", route: "/", open: (p) => p.getByRole("button", { name: "Reset demo" }).click(), outsideCloses: false },
];

test.describe("Dialogs close and leave the page usable", () => {
  for (const d of DIALOGS) {
    test(d.name, async ({ page, context }) => {
      const w = await watch(page, context);
      await open(page, d.route);
      const usable = async () => {
        const body = await page.evaluate(() => ({ events: getComputedStyle(document.body).pointerEvents, overflow: getComputedStyle(document.body).overflow }));
        expect(body.events, `${d.name}: the page must take clicks after the dialog closes`).not.toBe("none");
        await menu(page, "Tasks").click();
        await expect(page).toHaveURL(/\/tasks/);
        await menu(page, "Roadmap").click();
        await expect(page).toHaveURL(/\/roadmap/);
        await page.goto(d.route, { waitUntil: "domcontentloaded" });
        await settle(page);
      };

      // Escape.
      await d.open(page);
      await expect(openDialogs(page).first(), `${d.name} opens`).toBeVisible();
      await page.waitForTimeout(500); // let the opening animation end before measuring
      // The box sits inside the window. A box inside an animated parent can end up cut off.
      const box = await openDialogs(page).first().boundingBox();
      const view = page.viewportSize()!;
      expect(box, `${d.name} has a box`).not.toBeNull();
      expect(box!.y, `${d.name} is cut off at the top`).toBeGreaterThanOrEqual(-1);
      expect(box!.y + box!.height, `${d.name} is cut off at the bottom`).toBeLessThanOrEqual(view.height + 1);
      expect(box!.x, `${d.name} is cut off on the left`).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width, `${d.name} is cut off on the right`).toBeLessThanOrEqual(view.width + 1);
      await page.keyboard.press("Escape");
      await expect(openDialogs(page), `${d.name} closes on Escape`).toHaveCount(0);
      await usable();

      // A click outside.
      await d.open(page);
      await expect(openDialogs(page).first()).toBeVisible();
      await page.waitForTimeout(500); // a dialog takes a moment to listen for a click outside
      // The scrim of a hand-built dialog covers only the main area, so try a few spots outside the box.
      for (const [x, y] of [[8, 420], [1272, 792], [700, 796]]) {
        if ((await openDialogs(page).count()) === 0) break;
        await page.mouse.click(x, y);
        await page.waitForTimeout(250);
      }
      if (d.outsideCloses === false) await expect(openDialogs(page).first()).toBeVisible();
      else await expect(openDialogs(page), `${d.name} closes on a click outside`).toHaveCount(0);
      if (d.outsideCloses === false) await page.keyboard.press("Escape");
      await usable();
      await healthy(page, w, d.name);
    });
  }
});

// ── 2 (continued). State: tasks, My Business, photo, forecast, order, partner ─

test.describe("More state persists", () => {
  test("ticking a task, with a reload", async ({ page, context }) => {
    const w = await watch(page, context);
    // Fast mode: the list changes at once, as it does for a quick double-click on a slow call.
    await open(page, "/tasks?fast=1");
    const tick = page.getByRole("button", { name: "I've completed this task" });
    const before = await tick.count();
    expect(before).toBeGreaterThan(2);
    const firstTitle = (await main(page).locator("li, article").filter({ has: tick.first() }).first().innerText().catch(() => "")).split("\n")[1] ?? "";
    // A double-click ticks one task. The list moves up after the first click, and the second click must not tick the next one.
    await humanDoubleClick(page, tick.first());
    await settle(page);
    await page.waitForTimeout(500);
    await expect(tick).toHaveCount(before - 1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(tick).toHaveCount(before - 1);
    // The Success Center home counts the same tasks.
    await open(page, "/");
    await healthy(page, w, `/ after ticking "${firstTitle}"`);
  });

  test("editing a My Business field, with a reload", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/my-business");
    await page.waitForSelector(".mb-shell");
    const row = page.locator("#row-phone");
    await row.locator(".mb-row__box").click();
    await row.locator("input").first().fill("(910) 555-0123");
    await row.getByRole("button", { name: "Save" }).dblclick();
    await expect(row).toContainText("555-0123");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mb-shell");
    await expect(page.locator("#row-phone")).toContainText("555-0123");
    // The same phone shows on the Success Center home.
    await open(page, "/");
    await expect(main(page)).toContainText("555-0123");
    await healthy(page, w, "My Business edit");
  });

  test("uploading a photo on the Success Center home, with a reload", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    await page.locator("input[type=file]").first().setInputFiles(tempFile("amira.png", PNG));
    await expect(main(page).locator("img[src^='data:image/png']")).toHaveCount(1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(main(page).locator("img[src^='data:image/png']")).toHaveCount(1);
    // It shows in My Business too.
    await open(page, "/my-business/business");
    await page.waitForSelector(".mb-shell");
    await expect(page.locator(".gpds-imgcard img").first()).toBeVisible();
    await healthy(page, w, "photo upload");
  });

  test("tracking a forecast shows it as saved and keeps it", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/forecasts");
    const track = page.getByRole("button", { name: "Track this forecast" });
    const total = await track.count();
    await track.nth(2).click();
    await expect(page.getByRole("button", { name: "Stop tracking this forecast" })).toHaveCount(1);
    await expect(track).toHaveCount(total - 1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(page.getByRole("button", { name: "Stop tracking this forecast" })).toHaveCount(1);
    // The Saved tab and the Pipeline list it.
    await page.goto("/forecasts?view=saved", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(page.getByRole("button", { name: "Stop tracking this forecast" })).toHaveCount(1);
    await menu(page, "Pipeline").click();
    await settle(page);
    await healthy(page, w, "tracked forecast");
  });

  test("saving a small order shows on the order, the board and the Pipeline", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/small-orders/mp-101");
    await main(page).getByRole("button", { name: "Save", exact: true }).click();
    await expect(main(page).getByRole("button", { name: /^Saved$|Unsave|Remove/ }).first()).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(main(page).getByRole("button", { name: /^Saved$|Unsave|Remove/ }).first()).toBeVisible();
    await menu(page, "Pipeline").click();
    await settle(page);
    await expect(main(page)).toContainText("Ground coffee, 2-lb bags");
    await healthy(page, w, "saved small order");
  });

  test("saving a partner puts it under My partners and keeps it", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/partners");
    await page.getByRole("button", { name: "Save Palmetto Mess Management", exact: true }).click();
    await expect(page.getByRole("button", { name: "Remove Palmetto Mess Management", exact: true })).toBeVisible();
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(page.getByRole("button", { name: "Remove Palmetto Mess Management", exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "My partners" }).click();
    await settle(page);
    await expect(main(page)).toContainText("Palmetto Mess Management");
    await healthy(page, w, "saved partner");
  });
});

// ── 2 (end). Reset demo ────────────────────────────────────────────────────

test.describe("Reset demo", () => {
  test("every change goes back to the start, and the app lands on the Success Center", async ({ page, context }) => {
    const w = await watch(page, context);

    // The start.
    const startBalance = await balance(page);
    await open(page, "/opportunities");
    const startSaved = await savedCount(page);
    await open(page, "/tasks");
    const startTasks = await page.getByRole("button", { name: "I've completed this task" }).count();
    await open(page, "/mentors");
    const startThreads = await main(page).locator("a[href^='/mentors/']").count();

    // Change many things.
    await open(page, "/opportunities");
    await card(page, DRILL_WEEKEND).getByRole("button", { name: "Save opportunity" }).click();
    await open(page, "/tasks");
    await page.getByRole("button", { name: "I've completed this task" }).first().click();
    await settle(page);
    await open(page, "/forecasts");
    await page.getByRole("button", { name: "Track this forecast" }).nth(1).click();
    await open(page, "/partners");
    await page.getByRole("button", { name: "Save Palmetto Mess Management", exact: true }).click();
    await open(page, "/");
    await page.locator("input[type=file]").first().setInputFiles(tempFile("amira.png", PNG));
    await expect(main(page).locator("img[src^='data:image/png']")).toHaveCount(1);
    await open(page, "/my-business");
    await page.waitForSelector(".mb-shell");
    await page.locator("#row-phone .mb-row__box").click();
    await page.locator("#row-phone input").first().fill("(910) 555-0123");
    await page.locator("#row-phone").getByRole("button", { name: "Save" }).click();
    await expect(page.locator("#row-phone")).toContainText("555-0123");
    const dialog = await openSendDialog(page, GRAB_AND_GO);
    await dialog.getByLabel(/I've read the scope of work/).check();
    await dialog.getByLabel("Should I bid on this?").check();
    await dialog.locator("textarea").fill("I cook 1,100 meals a day for a school district. Does my past work count for this snack bar?");
    await dialog.getByRole("button", { name: /^Send for/ }).click();
    await settle(page);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await balance(page)).toBe(startBalance - 97);

    // Reset from a deep page. Escape first: the dialog must close and nothing must change.
    await open(page, `/opportunities/${CAMP_MACKALL}`);
    await page.getByRole("button", { name: "Reset demo" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(CAMP_MACKALL));
    await page.getByRole("button", { name: "Reset demo" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).dblclick({ noWaitAfter: true });
    await page.waitForURL((u) => u.pathname === "/", { timeout: 15000 });
    await settle(page);

    // Everything is back.
    await expect(main(page)).toContainText("Welcome To Your Success Center", { ignoreCase: true });
    await expect(main(page).locator("img[src^='data:image/png']")).toHaveCount(0);
    expect(await balance(page)).toBe(startBalance);
    await open(page, "/opportunities");
    expect(await savedCount(page)).toBe(startSaved);
    await expect(card(page, DRILL_WEEKEND).getByRole("button", { name: "Save opportunity" })).toBeVisible();
    await open(page, "/tasks");
    await expect(page.getByRole("button", { name: "I've completed this task" })).toHaveCount(startTasks);
    await open(page, "/mentors");
    await expect(main(page).locator("a[href^='/mentors/']")).toHaveCount(startThreads);
    await open(page, "/forecasts");
    await expect(page.getByRole("button", { name: "Stop tracking this forecast" })).toHaveCount(0);
    await open(page, "/partners");
    await expect(page.getByRole("button", { name: "Save Palmetto Mess Management", exact: true })).toBeVisible();
    await open(page, "/my-business");
    await page.waitForSelector(".mb-shell");
    await expect(page.locator("#row-phone")).toContainText("555-0148");
    await open(page, "/pipeline");
    await expect(main(page)).not.toContainText(DRILL_WEEKEND);
    await healthy(page, w, "after Reset demo");
  });
});

// ── 4. Links: nothing opens an outside site ───────────────────────────────

/** A notice dialog: the link guard's own, or one that a page shows for its link (it has one OK button). */
const notice = (page: Page) => page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "OK", exact: true }) });

async function dismissNotice(page: Page): Promise<void> {
  const n = notice(page);
  await expect(n).toBeVisible();
  await n.getByRole("button", { name: "OK" }).click();
  await expect(notice(page)).toHaveCount(0);
}

test.describe("Outside links stay inside the demo", () => {
  const CASES: { route: string; link: string | RegExp; host?: string }[] = [
    { route: "/small-orders", link: "Go to DIBBS", host: "dibbs.bsm.dla.mil" },
    { route: "/forecasts/047c3c8aa5dc76e7ccacc984bdff9848", link: "Open SAM.gov", host: "sam.gov" },
    { route: "/forecasts/a55390c2bf8b53c9bc7ec54a19b56116", link: "Open the forecast", host: "apfs-cloud.dhs.gov" },
    { route: "/forecasts/3f95972fa7a051b296e0e902f0a2ccc0", link: "Open the purchase record", host: "logi.cgieva.com" },
    { route: "/roadmap?step=p3-planned-pursuit", link: "Watch the course" },
    { route: "/roadmap?step=p4-review-submit", link: "Use the resources" },
  ];
  for (const c of CASES) {
    test(`${c.link} on ${c.route} shows a notice`, async ({ page, context }) => {
      const w = await watch(page, context);
      await open(page, c.route);
      await page.getByRole("link", { name: c.link }).first().click();
      await expect(notice(page)).toBeVisible();
      if (c.host) await expect(notice(page)).toContainText(c.host);
      expect(w.external).toEqual([]);
      expect(w.popups).toEqual([]);
      await dismissNotice(page);
      expect(new URL(page.url()).pathname).toBe(c.route.split("?")[0]);
      await healthy(page, w, c.route);
    });
  }

  test("a link to a page in the GoHighLevel product opens the matching demo page", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/roadmap?step=p3-planned-pursuit");
    await page.getByRole("link", { name: "See what Hunter found" }).click();
    await expect(page).toHaveURL(/\/opportunities/);
    await settle(page);
    expect(w.external).toEqual([]);
    await open(page, "/roadmap?step=p1-business-setup");
    await page.getByRole("link", { name: "here", exact: true }).first().click();
    await settle(page);
    // Either the matching page opened or a notice shows. Never the outside site.
    expect(w.external).toEqual([]);
    expect(w.popups).toEqual([]);
    await healthy(page, w, "GoHighLevel link");
  });

  test("email and phone links become a notice, also with the middle button and Shift", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/government-buyers?buyer=bragg-micc&focus=people");
    const mail = main(page).locator("a[href^='mailto:']").first();
    const tel = main(page).locator("a[href^='tel:']").first();
    await expect(mail).toBeVisible();
    await mail.click();
    await dismissNotice(page);
    await tel.click();
    await dismissNotice(page);
    await mail.click({ modifiers: ["Shift"] });
    await dismissNotice(page);
    await mail.click({ button: "middle" });
    await dismissNotice(page);
    expect(w.external).toEqual([]);
    expect(w.popups).toEqual([]);
    await healthy(page, w, "mailto and tel");
  });

  test("window.open to an outside site shows a notice and opens nothing", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    const opened = await page.evaluate(() => window.open("https://sam.gov/", "_blank"));
    expect(opened).toBeNull();
    await dismissNotice(page);
    expect(w.popups).toEqual([]);
    expect(w.external).toEqual([]);
  });
});

// Every outside link on every page: click it, and nothing may leave the app.
const ALL_ROUTES = [...MENU_ROUTES, ...DEEP_ROUTES].filter((r) => !r.startsWith("/ava"));
/** The routes that a page sweep visits: all of them in a full run, the menu and the walkthrough in a quick run. */
const SWEEP_SET = FULL
  ? ALL_ROUTES
  : [
      ...MENU_ROUTES.filter((r) => !r.startsWith("/ava")),
      `/opportunities/${CAMP_MACKALL}?met=1`,
      `/opportunities/${FORT_BRAGG}?met=1`,
      `/opportunities/${RESTRICTED}?met=1`,
      "/small-orders/mp-101",
      "/forecasts/80e9e92fd343cd7549f92d15374c2885",
      "/forecasts/047c3c8aa5dc76e7ccacc984bdff9848",
      "/government-buyers?buyer=bragg-micc&focus=people",
      "/roadmap?step=p3-planned-pursuit",
    ];

test.describe("Every outside link on every page", () => {
  for (const route of SWEEP_SET) {
    test(route, async ({ page, context }) => {
      const w = await watch(page, context);
      const fast = route + (route.includes("?") ? "&" : "?") + "fast=1";
      await open(page, fast);
      const outside = await page.evaluate(() => {
        const here = window.location.origin;
        return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((a, i) => ({ i, href: a.href, target: a.getAttribute("target") }))
          .filter((a) => {
            if (/^(mailto|tel|sms):/i.test(a.href)) return true;
            try {
              return new URL(a.href).origin !== here;
            } catch {
              return false;
            }
          });
      });
      for (const link of outside) {
        const handle = page.locator("a[href]").nth(link.i);
        await handle.scrollIntoViewIfNeeded().catch(() => undefined);
        await handle.click({ force: true, timeout: 3000 }).catch(() => undefined);
        await page.waitForTimeout(150);
        // A GoHighLevel link may move the app to a demo page. Anything else shows a notice.
        const url = new URL(page.url());
        expect(HOSTS.has(url.hostname), `${link.href} took the browser to ${url.href}`).toBe(true);
        if (await notice(page).count()) await notice(page).getByRole("button", { name: "OK" }).click();
        if (new URL(page.url()).pathname + new URL(page.url()).search !== new URL(fast, page.url()).pathname + new URL(fast, page.url()).search) {
          await open(page, fast);
        }
      }
      expect(w.external, `outside requests on ${route}`).toEqual([]);
      expect(w.popups, `new tabs on ${route}`).toEqual([]);
      await healthy(page, w, route);
    });
  }
});

// ── 3 (continued). Abuse: silly input in every text box on every page ─────

const NASTY: { name: string; text: string }[] = [
  { name: "emoji and other scripts", text: "🥗🍽️ catering 👩🏽‍🍳 日本語 العربية Zażółć gęślą" },
  { name: "script tag", text: `<script>window.__xss=1</script><img src=x onerror="window.__xss=1">` },
  { name: "2,000 characters", text: `${"x".repeat(1200)} ${"word ".repeat(160)}` },
  { name: "code-like text", text: "'; DROP TABLE users; -- {{7*7}} ${7*7} %s %d \\ \\u0000" },
  { name: "only spaces", text: "     " },
  { name: "numbers", text: "-99999999999999999999.5e999" },
];

const TEXT_BOX = [
  "input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=submit]):not([type=button]):not([type=range]):not([type=color]):not([type=date])",
  "textarea",
  "[contenteditable=true]",
].join(",");

/** The text boxes in the main area and in any open dialog, in page order. */
async function textBoxes(page: Page): Promise<{ i: number; label: string }[]> {
  return page.evaluate((sel) => {
    return Array.from(document.querySelectorAll<HTMLElement>(sel))
      .map((el, i) => ({ el, i }))
      .filter(({ el }) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && !(el as HTMLInputElement).disabled && !(el as HTMLInputElement).readOnly;
      })
      .map(({ el, i }) => ({
        i,
        label: (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || el.id || el.tagName).slice(0, 50),
      }));
  }, TEXT_BOX);
}

/** Any element holding typed text that spills out of its own box (and does not scroll). */
async function spillOver(page: Page, needle: string): Promise<string[]> {
  return page.evaluate((needle) => {
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth - doc.clientWidth > 1) out.push(`the page is ${doc.scrollWidth - doc.clientWidth}px wider than the window`);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    const seen = new Set<Element>();
    while ((node = walker.nextNode())) {
      if (!node.textContent || !node.textContent.includes(needle)) continue;
      let el: Element | null = node.parentElement;
      for (let depth = 0; el && depth < 6 && el !== document.body; depth++, el = el.parentElement) {
        if (seen.has(el) || el.matches("input, textarea, [contenteditable]")) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        const scrolls = cs.overflowX === "auto" || cs.overflowX === "scroll";
        if (!scrolls && el.scrollWidth - el.clientWidth > 2) {
          out.push(`<${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 40)}"> content is ${el.scrollWidth - el.clientWidth}px wider than its box`);
        }
      }
    }
    return out;
  }, needle);
}

const SWEEP_ROUTES = SWEEP_SET.filter((r) => !r.startsWith("/small-orders/mp-") && !r.startsWith("/forecasts/") && !r.startsWith("/awards/") && !r.startsWith("/stay-ready/"));

test.describe("Silly input in every text box", () => {
  for (const route of Array.from(new Set([...SWEEP_ROUTES, `/opportunities/${CAMP_MACKALL}?met=1`, "/forecasts/80e9e92fd343cd7549f92d15374c2885", "/small-orders/mp-101", "/pipeline"]))) {
    test(route, async ({ page, context }) => {
      test.setTimeout(240_000);
      const w = await watch(page, context);
      const fast = route + (route.includes("?") ? "&" : "?") + "fast=1";
      await open(page, fast);
      // A Grant analysis hides its chat box until the introduction is passed.
      if (await page.getByRole("button", { name: "Show me the analysis" }).count()) {
        await page.getByRole("button", { name: "Show me the analysis" }).click();
        await settle(page);
      }
      const boxes = await textBoxes(page);
      for (const box of boxes) {
        for (const s of NASTY) {
          // The box can disappear when the page moves on. Look it up fresh each time.
          const handle = page.locator(TEXT_BOX).nth(box.i);
          if ((await handle.count()) === 0 || !(await handle.isVisible().catch(() => false))) break;
          const where = `${route} > "${box.label}" > ${s.name}`;
          try {
            const isEditor = await handle.evaluate((el) => (el as HTMLElement).isContentEditable);
            if (isEditor) {
              await handle.click({ timeout: 2000 });
              await page.keyboard.insertText(s.text);
            } else {
              await handle.fill(s.text, { timeout: 2000 });
            }
            await handle.press("Enter", { timeout: 2000 }).catch(() => undefined);
          } catch {
            continue; // a number box refuses letters: that is fine
          }
          await page.waitForTimeout(120);
          await settle(page, 8000);
          expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `${where}: a script ran`).toBeUndefined();
          expect(HOSTS.has(new URL(page.url()).hostname), `${where}: left the app`).toBe(true);
          await healthy(page, w, where);
          const needle = s.text.trim().slice(0, 30);
          if (needle.length >= 8) expect(await spillOver(page, needle), `${where}: typed text spills out`).toEqual([]);
          // A dialog that the Enter key opened is closed again, so the next box is reachable.
          if (await page.locator('[role="dialog"]').filter({ visible: true }).count()) {
            const typedInDialog = await page.locator('[role="dialog"]').filter({ visible: true }).locator(TEXT_BOX).count();
            if (!typedInDialog) await page.keyboard.press("Escape");
          }
        }
      }
    });
  }
});

// ── 3 (continued). Abuse: window sizes ─────────────────────────────────────

const SIZES = [
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

// A spread of pages: every menu page, a Grant analysis, a forecast, an order, a mentor thread.
const SIZE_ROUTES = [
  ...MENU_ROUTES.filter((r) => !r.startsWith("/ava")),
  `/opportunities/${CAMP_MACKALL}?met=1`,
  `/opportunities/${FORT_BRAGG}?met=1`,
  `/opportunities/${RESTRICTED}?met=1`,
  "/forecasts/80e9e92fd343cd7549f92d15374c2885",
  "/small-orders/mp-101",
  "/small-orders/restricted",
  "/mentors/rev-fayetteville-proposal",
  "/wallet",
  "/business-profile",
  "/government-buyers",
  "/partners?view=find&company=4001",
];

test.describe("Window sizes", () => {
  for (const size of SIZES) {
    test(`${size.width} x ${size.height}: no sideways scroll, the menu and the page are reachable`, async ({ page, context }) => {
      test.setTimeout(300_000);
      const w = await watch(page, context);
      await page.setViewportSize(size);
      const problems: string[] = [];
      for (const route of SIZE_ROUTES) {
        await open(page, route + (route.includes("?") ? "&" : "?") + "fast=1");
        await page.waitForTimeout(250);
        const m = await page.evaluate(() => {
          const doc = document.documentElement;
          const mainEl = document.getElementById("demo-main");
          const menuEl = document.querySelector<HTMLElement>(".demo-menu");
          const last = Array.from(document.querySelectorAll<HTMLElement>(".demo-nav a")).pop();
          const lastRect = last?.getBoundingClientRect();
          const menuScrolls = menuEl ? menuEl.scrollHeight > menuEl.clientHeight + 1 && ["auto", "scroll"].includes(getComputedStyle(menuEl).overflowY) : false;
          // Wide elements: anything that sticks out past the right edge of the main area.
          const mainRect = mainEl?.getBoundingClientRect();
          const wide: string[] = [];
          if (mainEl && mainRect) {
            for (const el of Array.from(mainEl.querySelectorAll<HTMLElement>("*"))) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue;
              if (r.right > mainRect.right + 2 && getComputedStyle(el).position !== "fixed") {
                // Inside a scroller or hidden overflow is fine.
                let p: HTMLElement | null = el.parentElement;
                let clipped = false;
                while (p && p !== mainEl) {
                  const o = getComputedStyle(p);
                  if (["auto", "scroll", "hidden", "clip"].includes(o.overflowX)) {
                    clipped = true;
                    break;
                  }
                  p = p.parentElement;
                }
                if (!clipped) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} +${Math.round(r.right - mainRect.right)}px`);
              }
              if (wide.length >= 3) break;
            }
          }
          return {
            docOverflow: doc.scrollWidth - doc.clientWidth,
            mainOverflow: mainEl ? mainEl.scrollWidth - mainEl.clientWidth : 0,
            lastBottom: lastRect ? Math.round(lastRect.bottom) : 0,
            vh: window.innerHeight,
            menuScrolls,
            wide,
          };
        });
        if (m.docOverflow > 1) problems.push(`${route}: the page scrolls sideways by ${m.docOverflow}px`);
        if (m.mainOverflow > 1) problems.push(`${route}: the main area scrolls sideways by ${m.mainOverflow}px`);
        if (m.wide.length) problems.push(`${route}: sticks out of the page: ${m.wide.join(", ")}`);
        if (m.lastBottom > m.vh && !m.menuScrolls) problems.push(`${route}: the last menu item is below the window (${m.lastBottom} > ${m.vh}) and the menu does not scroll`);
      }
      expect(problems).toEqual([]);
      // The last menu item can be clicked.
      await open(page, "/");
      await menu(page, "Mentor Reviews").click();
      await expect(page).toHaveURL(/\/mentors/);
      await healthy(page, w, `${size.width}x${size.height}`);
    });
  }
});

// ── 3 (continued). Abuse: forms in dialogs ─────────────────────────────────

test.describe("Forms in dialogs take silly input", () => {
  test("Add funds: odd amounts never charge the wrong sum, a double click adds once", async ({ page, context }) => {
    const w = await watch(page, context);
    const start = await balance(page);
    await page.getByRole("button", { name: "Add funds" }).click();
    const dialog = page.getByRole("dialog");
    const other = dialog.getByPlaceholder("Other amount");
    const add = dialog.getByRole("button", { name: /^Add / });
    for (const odd of ["-50", "0", "abc", "1e9", "0.004", "99999999999", "12.345", ""]) {
      await other.fill(odd).catch(() => undefined);
      const label = (await add.innerText()).trim();
      const disabled = await add.isDisabled();
      // Either the button refuses, or the label shows a plain dollar sum (no NaN, no exponent).
      expect(disabled || /^Add \$[\d,]+(\.\d\d)?$/.test(label), `amount "${odd}" gives the button "${label}"`).toBe(true);
    }
    await other.fill("");
    await dialog.getByRole("button", { name: "$50", exact: true }).click();
    await expect(add).toHaveText("Add $50.00");
    await add.dblclick({ noWaitAfter: true });
    await settle(page);
    await expect(dialog).toContainText("Funds added");
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(main(page)).toContainText(`$${(start + 50).toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
    expect(await balance(page)).toBe(start + 50);
    await healthy(page, w, "Add funds");
  });

  test("a double click on a dialog button does not open the card under it", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/opportunities?fast=1");
    await page.getByRole("button", { name: "Save this search" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/Name it/).fill("Fort Bragg catering");
    await humanDoubleClick(page, dialog.getByRole("button", { name: "Save", exact: true }));
    await page.waitForTimeout(800);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(new URL(page.url()).pathname, "the second click opened a page under the dialog").toBe("/opportunities");
    await healthy(page, w, "double click on Save");
  });

  test("a double click on an opportunity card opens it without passing Grant's introduction", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/opportunities?fast=1");
    await humanDoubleClick(page, page.getByRole("heading", { name: "Run two Fort Bragg dining halls" }));
    await expect(page).toHaveURL(new RegExp(`/opportunities/${FORT_BRAGG}`));
    await settle(page);
    await page.waitForTimeout(500);
    // The introduction is still there: the second click did not press "Show me the analysis".
    await expect(page.getByRole("button", { name: "Show me the analysis" })).toBeVisible();
    await healthy(page, w, "double click on a card");
  });

  test("Save this search: empty and odd names", async ({ page, context }) => {
    const w = await watch(page, context);
    for (const s of NASTY) {
      // A saved search turns the button into "Saved", so each name starts from a clean demo.
      await open(page, "/opportunities");
      await page.evaluate(() => sessionStorage.clear());
      await open(page, "/opportunities");
      await page.getByRole("button", { name: "Save this search" }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByPlaceholder(/Name it/).fill(s.text);
      // An empty or spaces-only name keeps the button off. Anything else saves.
      const save = dialog.getByRole("button", { name: "Save", exact: true });
      if (await save.isEnabled()) await save.dblclick({ noWaitAfter: true, timeout: 3000 });
      else expect(s.text.trim(), `"${s.name}" must be a valid name`).toBe("");
      await page.waitForTimeout(400);
      if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
      await settle(page);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `${s.name}: a script ran`).toBeUndefined();
      await healthy(page, w, `save search: ${s.name}`);
    }
  });

  test("the command palette takes any text and Enter on nothing does nothing bad", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    for (const s of NASTY) {
      await page.locator(".demo-search").click();
      const input = page.getByRole("dialog").locator("input").first();
      await input.fill(s.text);
      await page.waitForTimeout(250);
      await input.press("Enter");
      await page.waitForTimeout(250);
      if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
      await settle(page);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `${s.name}: a script ran`).toBeUndefined();
      await healthy(page, w, `palette: ${s.name}`);
    }
    // A real search opens the page.
    await page.locator(".demo-search").click();
    await page.getByRole("dialog").locator("input").first().fill("Forecasts");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/forecasts/);
  });

  test("Send to a mentor: a short or odd question is refused, a long one is sent once", async ({ page, context }) => {
    const w = await watch(page, context);
    const before = await balance(page);
    const dialog = await openSendDialog(page, GRAB_AND_GO);
    const send = dialog.getByRole("button", { name: /^Send for/ });
    await dialog.getByLabel(/I've read the scope of work/).check();
    await dialog.getByLabel("Pricing").check();
    for (const s of [NASTY[4], { name: "short", text: "Is it ok?" }]) {
      await dialog.locator("textarea").fill(s.text);
      await expect(send, `a question of "${s.name}" must not send`).toBeDisabled();
    }
    // A strange file is accepted or refused with words, never a crash.
    await dialog.locator("input[type=file]").setInputFiles(tempFile("empty.pdf", ""));
    await page.waitForTimeout(300);
    await dialog.locator("textarea").fill(`${NASTY[0].text} ${NASTY[2].text}`.slice(0, 1900));
    await expect(send).toBeEnabled();
    expect(await spillOver(page, "xxxxxxxxxxxxxxxxxxxx"), "the dialog holds the long text").toEqual([]);
    await send.click();
    await settle(page);
    await page.waitForTimeout(600);
    await healthy(page, w, "odd mentor question");
    expect(await balance(page)).toBe(before - 97);
  });

  test("a mentor reply takes odd text, an empty file and a big file", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/mentors/rev-fayetteville-proposal");
    const send = page.getByRole("button", { name: "Send reply" });
    // Nothing typed: the button refuses.
    await expect(send).toBeDisabled();
    const editor = page.locator(".reply-composer__editor");
    await editor.click();
    await page.keyboard.insertText("     ");
    await expect(send).toBeDisabled();
    for (const s of [NASTY[0], NASTY[1], NASTY[2], NASTY[3]]) {
      await editor.click();
      await page.keyboard.insertText(s.text);
      await send.click();
      await settle(page);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `${s.name}: a script ran`).toBeUndefined();
      expect(await spillOver(page, s.text.trim().slice(0, 30)), `${s.name}: the thread holds the text`).toEqual([]);
      await healthy(page, w, `reply: ${s.name}`);
    }
    await page.locator("input[type=file]").first().setInputFiles([tempFile("empty.pdf", ""), tempFile("big.pdf", Buffer.alloc(12 * 1024 * 1024, 1))]);
    await send.click();
    await settle(page);
    await healthy(page, w, "reply with files");
  });

  test("Booking: confirm needs a day and a time", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/roadmap");
    await page.getByRole("button", { name: /Quarterly Targeting Call/ }).first().click();
    await page.getByRole("button", { name: "Book Your Call" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Pick a day" })).toBeDisabled();
    await dialog.locator("button:not([disabled])", { hasText: /^20$/ }).click();
    await expect(dialog.getByRole("button", { name: "Pick a time" })).toBeDisabled();
    // Past days and weekends cannot be picked.
    await expect(dialog.locator("button[disabled]", { hasText: /^16$/ })).toHaveCount(1);
    await healthy(page, w, "booking needs a day and time");
  });
});

// ── 3 (continued). Abuse: quick switching of tabs and filters ──────────────

test.describe("Quick switching", () => {
  test("Hunter tabs, buyer filter and search settle on what the last click chose", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/opportunities");
    const tab = (name: RegExp) => page.locator("button", { hasText: name }).first();
    for (let round = 0; round < 4; round++) {
      await tab(/^All opportunities/).click({ noWaitAfter: true });
      await tab(/^Saved\s*\d+/).click({ noWaitAfter: true });
      await tab(/^Opportunities for you/).click({ noWaitAfter: true });
      await page.getByRole("radio", { name: "Federal" }).or(page.locator("button", { hasText: /^Federal$/ })).first().click({ noWaitAfter: true });
      await page.locator("button", { hasText: /^State and local$/ }).first().click({ noWaitAfter: true });
      await page.locator("button", { hasText: /^All buyers$/ }).first().click({ noWaitAfter: true });
    }
    await tab(/^Saved\s*\d+/).click();
    await settle(page);
    // The last click was Saved with All buyers: the list shows saved cards only.
    const saved = await savedCount(page);
    await expect(main(page).locator(".opp-summary-head")).toHaveCount(saved);
    await tab(/^Opportunities for you/).click();
    await settle(page);
    await expect(main(page).locator(".opp-summary-head").first()).toBeVisible();
    // Type into the search box and clear it while the answer is still on its way.
    const search = page.getByPlaceholder(/Catering under/);
    for (const q of ["cat", "catering", "", "fort", "zzzz", ""]) await search.fill(q);
    await settle(page);
    await expect(main(page).locator(".opp-summary-head").first()).toBeVisible();
    await healthy(page, w, "quick switching on the feed");
  });

  test("Forecasts tabs and view switches end on the last choice", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/forecasts");
    for (let i = 0; i < 3; i++) {
      for (const t of [/^All\s*\d+/, /^Act now/, /^Start capture/, /^Position early/, /^Watch/]) {
        await page.getByRole("tab", { name: t }).click({ noWaitAfter: true });
      }
      await page.getByRole("button", { name: /^All forecasts/ }).click({ noWaitAfter: true });
      await page.getByRole("button", { name: /^Forecasts for you/ }).click({ noWaitAfter: true });
      await page.getByRole("button", { name: /^Saved/ }).click({ noWaitAfter: true });
    }
    await page.getByRole("button", { name: /^All forecasts/ }).click();
    await page.getByRole("tab", { name: /^All\s*\d+/ }).click();
    await settle(page);
    await expect(page.getByRole("button", { name: "Track this forecast" }).first()).toBeVisible();
    await healthy(page, w, "quick switching on forecasts");
  });

  test("Small Orders and Partners tabs end on the last choice", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/small-orders");
    for (let i = 0; i < 3; i++) {
      for (const t of ["All orders", "Saved", "Orders for you"]) await page.locator("button", { hasText: new RegExp(`^${t}`) }).first().click({ noWaitAfter: true });
    }
    await settle(page);
    await expect(main(page)).toContainText(/Shelf-stable entree|Ground coffee|Dry spaghetti/);
    await open(page, "/partners");
    for (let i = 0; i < 3; i++) {
      for (const t of ["Who’s winning", "My partners", "Find partners"]) await page.getByRole("tab", { name: t }).click({ noWaitAfter: true });
    }
    await settle(page);
    await expect(main(page)).toContainText("Carolina Dining Group");
    await healthy(page, w, "quick switching on orders and partners");
  });
});

// ── 6. Timing: no long spinner, no flicker ─────────────────────────────────

/**
 * Watch the main area for `ms` after `action`. Returns the text length every 40 ms. A page that
 * fills, empties and fills again flickers.
 */
async function sampleMain(page: Page, action: () => Promise<unknown>, ms = 3500): Promise<number[]> {
  await page.evaluate((ms) => {
    const w = window as unknown as { __samples?: number[]; __sampler?: number };
    w.__samples = [];
    window.clearInterval(w.__sampler);
    const t0 = performance.now();
    w.__sampler = window.setInterval(() => {
      w.__samples!.push((document.getElementById("demo-main")?.innerText ?? "").length);
      if (performance.now() - t0 > ms) window.clearInterval(w.__sampler);
    }, 40);
  }, ms);
  await action();
  await page.waitForTimeout(ms);
  return page.evaluate(() => (window as unknown as { __samples: number[] }).__samples);
}

/** True when the series climbs above half of its final size, falls under a sixth of it, and climbs back. */
function flickers(series: number[]): boolean {
  const final = series[series.length - 1] ?? 0;
  const high = Math.max(300, final / 2);
  let seenHigh = false;
  let seenDrop = false;
  for (const n of series) {
    if (n >= high && !seenHigh) seenHigh = true;
    else if (seenHigh && n < high / 3) seenDrop = true;
    else if (seenDrop && n >= high) return true;
  }
  return false;
}

/** Milliseconds until the text stops changing (the last change, 40 ms per sample). */
function settledAfter(series: number[]): number {
  const final = series[series.length - 1] ?? 0;
  let last = -1;
  series.forEach((n, i) => {
    if (n !== final) last = i;
  });
  return (last + 1) * 40;
}

test.describe("Timing", () => {
  const MENU_PAGES = ["Roadmap", "Tasks", "Opportunities", "Forecasts", "Small Orders", "Partners", "Awards", "My Business", "Pipeline", "Mentors", "Mentor Reviews", "Success Center"];

  test("each menu page fills in under 2.5 s and does not flicker", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    const slow: string[] = [];
    for (const name of MENU_PAGES) {
      const t0 = Date.now();
      const series = await sampleMain(page, () => menu(page, name).click());
      const ms = (series[series.length - 1] ?? 0) < 300 ? Infinity : settledAfter(series);
      if (ms > 2500) slow.push(`${name} took ${ms} ms to finish filling in`);
      expect(flickers(series), `${name} flickers: ${series.filter((_, i) => i % 4 === 0).join(",")}`).toBe(false);
      expect(Date.now() - t0).toBeGreaterThan(0);
    }
    expect(slow).toEqual([]);
    await healthy(page, w, "menu timing");
  });

  test("a Grant analysis, a forecast and an order fill in under 2.5 s and do not flicker", async ({ page, context }) => {
    const w = await watch(page, context);
    // A full page load starts a new document, so the sampler is installed at document start.
    await page.addInitScript(() => {
      const w2 = window as unknown as { __samples: number[] };
      w2.__samples = [];
      const t0 = performance.now();
      const id = window.setInterval(() => {
        w2.__samples.push((document.getElementById("demo-main")?.innerText ?? "").length);
        if (performance.now() - t0 > 3500) window.clearInterval(id);
      }, 40);
    });
    for (const route of [`/opportunities/${CAMP_MACKALL}`, `/opportunities/${FORT_BRAGG}?met=1`, "/forecasts/80e9e92fd343cd7549f92d15374c2885", "/small-orders/mp-101", "/mentors/rev-fayetteville-proposal", "/partners?view=find&company=4001"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(3600);
      const series = await page.evaluate(() => (window as unknown as { __samples: number[] }).__samples);
      expect(series[series.length - 1] ?? 0, `${route} has text`).toBeGreaterThan(300);
      expect(settledAfter(series), `${route} is still filling in after 2.5 s`).toBeLessThanOrEqual(2500);
      expect(flickers(series), `${route} flickers: ${series.filter((_, i) => i % 4 === 0).join(",")}`).toBe(false);
    }
    await healthy(page, w, "detail page timing");
  });
});

// ── 3 (continued). Abuse: a monkey that clicks and types at random ─────────
//
// Each seed gives the same walk every time, so a failure can be replayed:
//   QA_PORT=4351 bunx playwright test qa/flows/break-it.spec.ts -g "Monkey seed 3"

/** A small seeded random number generator (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONKEY_CLICKABLE = "a[href], button, [role=button], [role=tab], [role=switch], [role=checkbox], [role=radio], summary, select, input[type=checkbox], input[type=radio]";

for (const seed of FULL ? Array.from({ length: 24 }, (_, i) => i + 1) : [1, 2, 3]) {
  test(`Monkey seed ${seed}`, async ({ page, context }) => {
    test.setTimeout(420_000);
    const w = await watch(page, context);
    const next = rng(seed);
    const trail: string[] = [];
    let stuck = 0;
    await open(page, "/");

    const STEPS = Number(process.env.QA_MONKEY_STEPS ?? (FULL ? 200 : 120));
    for (let step = 0; step < STEPS; step++) {
      // Stay out of Ava: another agent builds it.
      if (new URL(page.url()).pathname.startsWith("/ava")) {
        trail.push("(left Ava)");
        await page.goBack().catch(() => undefined);
        if (new URL(page.url()).pathname.startsWith("/ava")) await open(page, "/");
      }
      const dialogOpen = (await page.locator('[role="dialog"], [role="alertdialog"]').filter({ visible: true }).count()) > 0;
      const roll = next();
      if (dialogOpen && roll < 0.35) {
        trail.push("Escape");
        await page.keyboard.press("Escape");
      } else if (roll < 0.12) {
        // Type something silly into a random text box.
        const boxes = await textBoxes(page);
        if (boxes.length) {
          const box = boxes[Math.floor(next() * boxes.length)];
          const s = NASTY[Math.floor(next() * NASTY.length)];
          const handle = page.locator(TEXT_BOX).nth(box.i);
          trail.push(`type "${s.name}" into "${box.label}"`);
          try {
            if (await handle.evaluate((el) => (el as HTMLElement).isContentEditable)) {
              await handle.click({ timeout: 1500 });
              await page.keyboard.insertText(s.text);
            } else await handle.fill(s.text, { timeout: 1500 });
            if (next() < 0.7) await handle.press("Enter", { timeout: 1500 }).catch(() => undefined);
          } catch {
            /* the box moved or refuses this text */
          }
        }
      } else {
        // Click a random thing. Skip Reset demo and links that go to Ava.
        const names = await page.evaluate((sel) => {
          const shown = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]')).find((d) => {
            const r = d.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          });
          const scope = shown ?? document.body;
          return Array.from(scope.querySelectorAll<HTMLElement>(sel))
            .map((el, i) => ({ el, i }))
            .filter(({ el }) => {
              const r = el.getBoundingClientRect();
              const cs = getComputedStyle(el);
              if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.pointerEvents === "none") return false;
              if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return false;
              if (r.bottom < 0 || r.top > window.innerHeight) return false;
              const text = (el.innerText || el.getAttribute("aria-label") || "").trim();
              if (/^reset demo$/i.test(text) || el.closest(".demo-strip")) return false;
              const href = el.getAttribute("href") ?? "";
              if (/^\/ava(\/|$)/.test(href)) return false;
              return true;
            })
            .map(({ el, i }) => ({ i, name: (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40) }));
        }, MONKEY_CLICKABLE);
        if (names.length === 0) {
          await open(page, "/");
          continue;
        }
        const pick = names[Math.floor(next() * names.length)];
        trail.push(`click "${pick.name}"${next() < 0.15 ? " twice" : ""}`);
        const scope = dialogOpen ? page.locator('[role="dialog"], [role="alertdialog"]').filter({ visible: true }).first() : page.locator("body");
        const target = scope.locator(MONKEY_CLICKABLE).nth(pick.i);
        try {
          if (trail[trail.length - 1].endsWith("twice")) await target.dblclick({ timeout: 1500, noWaitAfter: true });
          else await target.click({ timeout: 1500, noWaitAfter: true });
          stuck = 0;
        } catch (e) {
          // It moved or got covered: that is what a visitor sees too. The trail says so.
          trail[trail.length - 1] += ` (not clicked: ${String((e as Error).message).split("\n")[0].slice(0, 60)})`;
          stuck += 1;
          // Something covers the page (a panel that has no dialog role). A visitor presses Escape, then reloads.
          if (stuck === 2) {
            trail.push("Escape (the page does not take clicks)");
            await page.keyboard.press("Escape");
          } else if (stuck >= 4) {
            trail.push("reload / (the page still does not take clicks)");
            await open(page, "/");
            stuck = 0;
          }
        }
      }
      await page.waitForTimeout(180);
      // A page that never fills is a failure. A file chooser or a new tab is closed by the watch.
      try {
        await settle(page, 9000);
      } catch (e) {
        throw new Error(`step ${step}: ${(e as Error).message}\nTrail:\n  ${trail.slice(-15).join("\n  ")}`);
      }
      const where = `step ${step} at ${new URL(page.url()).pathname}`;
      try {
        const text = await bodyText(page);
        const bad = BAD_TEXT.exec(text);
        expect(bad, `bad text "${bad?.[0]}"`).toBeNull();
        expect((await page.locator("#demo-main").innerText()).trim().length, "the page is blank").toBeGreaterThan(30);
        expect(await demoHooks(page), "demo hooks").toEqual([]);
        expect(w.problems, "problems").toEqual([]);
        const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(sideways, "sideways scroll").toBeLessThanOrEqual(1);
      } catch (e) {
        throw new Error(`${where}: ${(e as Error).message}\nTrail (last 15):\n  ${trail.slice(-15).join("\n  ")}`);
      }
      if (process.env.QA_MONKEY_TRAIL) console.log(`seed ${seed} step ${step} ${new URL(page.url()).pathname}: ${trail[trail.length - 1] ?? ""}`);
    }
  });
}

test.describe("The help chat", () => {
  test("opens from Need Help, takes silly text, wraps it and closes on Escape", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/");
    await page.getByRole("button", { name: /Need Help/ }).click();
    const chat = page.getByRole("dialog", { name: "Chat with the GovPreneurs team" });
    await expect(chat).toBeVisible();
    const box = chat.locator("textarea, input[type=text], input:not([type])").first();
    for (const s of NASTY) {
      await box.fill(s.text);
      await box.press("Enter");
      await page.waitForTimeout(250);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `${s.name}: a script ran`).toBeUndefined();
      const needle = s.text.trim().slice(0, 30);
      if (needle.length >= 8) expect(await spillOver(page, needle), `${s.name}: the chat holds the text`).toEqual([]);
    }
    await page.waitForTimeout(1000);
    await expect(chat).toContainText("GovPreneurs team will answer");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Chat with the GovPreneurs team" })).toHaveCount(0);
    await healthy(page, w, "help chat");
  });
});

test.describe("Buy a done-for-you service", () => {
  test("a silly coupon is refused, DEMO10 takes 10% off, a double click buys once", async ({ page, context }) => {
    const w = await watch(page, context);
    const before = await balance(page);
    await open(page, "/roadmap?step=p3-prime-registration");
    await page.getByRole("button", { name: "Register with another prime" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("$197");
    const code = dialog.getByPlaceholder("Code");
    for (const s of NASTY) {
      await code.fill(s.text);
      await dialog.getByRole("button", { name: "Apply" }).click({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss), `${s.name}: a script ran`).toBeUndefined();
      await expect(dialog).toContainText("$197");
    }
    await code.fill("DEMO10");
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).toContainText("$177.30");
    // A quick double-click on Purchase moves to the check step. It must not also press "Confirm and pay".
    await humanDoubleClick(page, dialog.getByRole("button", { name: "Purchase" }));
    await expect(dialog).toContainText("Check this before you pay");
    await page.waitForTimeout(600);
    await expect(dialog).toContainText("Check this before you pay");
    // Confirm with a double-click: one charge.
    const pay = dialog.getByRole("button", { name: /^Confirm and pay/ });
    await humanDoubleClick(page, pay);
    await settle(page);
    await page.waitForTimeout(1000);
    await settle(page);
    await healthy(page, w, "after buying a service");
    expect(await balance(page)).toBeCloseTo(before - 177.3, 2);
  });
});

test.describe("Drawers on the Success Center home", () => {
  for (const [button, heading] of [
    ["Booking History", "Booking History"],
    [/Usage History/, "Wallet Usage"],
  ] as [string | RegExp, string][]) {
    test(`${heading} closes on Escape, on the close button and on a click outside`, async ({ page, context }) => {
      const w = await watch(page, context);
      await open(page, "/");
      const drawerHeading = page.locator("div.fixed.inset-0").getByText(heading, { exact: true }).first();
      const opens = async () => {
        await page.getByRole("button", { name: button }).first().click();
        await expect(drawerHeading).toBeVisible();
        await page.waitForTimeout(400);
      };
      await opens();
      await page.keyboard.press("Escape");
      await expect(drawerHeading).toHaveCount(0);
      await opens();
      await page.mouse.click(120, 450);
      await expect(drawerHeading).toHaveCount(0);
      await opens();
      await page.locator("div.fixed.inset-0").getByRole("button", { name: /close/i }).first().click();
      await expect(drawerHeading).toHaveCount(0);
      // The page takes clicks again.
      await menu(page, "Tasks").click();
      await expect(page).toHaveURL(/\/tasks/);
      await healthy(page, w, `${heading} drawer`);
    });
  }
});

test.describe("My Business pickers", () => {
  test("the set-aside picker shows each section header once and no React key warning", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/my-business");
    await page.waitForSelector(".mb-shell");
    await page.locator("button", { hasText: /Small business · SAM.gov/ }).first().click();
    await page.waitForTimeout(600);
    const headers = await page.locator(".otp-section").allInnerTexts();
    expect(new Set(headers).size, `section headers repeat: ${headers.join(" | ")}`).toBe(headers.length);
    await healthy(page, w, "the set-aside picker");
  });
});

// ── 1 (continued). Every internal link leads to a real page ────────────────

const NOT_FOUND = /not found|couldn.?t find|could not find|no longer (here|available)|doesn.?t exist|does not exist|404|isn.?t here|is not here/i;

test.describe("Every internal link leads to a real page", () => {
  test("links on the menu pages and the three walkthrough opportunities", async ({ page, context }) => {
    test.setTimeout(900_000);
    const w = await watch(page, context);
    const sources = [
      ...MENU_ROUTES.filter((r) => !r.startsWith("/ava")),
      `/opportunities/${CAMP_MACKALL}?met=1`,
      `/opportunities/${FORT_BRAGG}?met=1`,
      `/opportunities/${RESTRICTED}?met=1`,
      "/small-orders/mp-101",
      "/forecasts/80e9e92fd343cd7549f92d15374c2885",
      "/mentors/rev-fayetteville-proposal",
      "/government-buyers",
      "/awards/W91247-19-C-0021",
    ];
    const seen = new Set<string>();
    const targets: { href: string; from: string }[] = [];
    for (const src of sources) {
      await open(page, src + (src.includes("?") ? "&" : "?") + "fast=1");
      await page.waitForTimeout(300);
      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((a) => a.getAttribute("href") ?? "")
          .filter((h) => h.startsWith("/") && !h.startsWith("//")),
      );
      for (const h of hrefs) {
        const path = h.split("#")[0];
        if (/^\/(ava|__demo_api|api|demo-files)(\/|$)/.test(path) || /\.(pdf|png|jpg|docx?|xlsx?)$/i.test(path)) continue;
        if (seen.has(path)) continue;
        seen.add(path);
        targets.push({ href: path, from: src });
      }
    }
    expect(targets.length, "the sources have links").toBeGreaterThan(40);
    const broken: string[] = [];
    for (const t of targets) {
      await page.goto(t.href + (t.href.includes("?") ? "&" : "?") + "fast=1", { waitUntil: "domcontentloaded" });
      try {
        await settle(page, 8000);
      } catch {
        broken.push(`${t.href} (from ${t.from}) never finished loading`);
        continue;
      }
      const text = (await main(page).innerText()).trim();
      if (text.length < 60) broken.push(`${t.href} (from ${t.from}) is nearly empty`);
      else if (NOT_FOUND.test(text.slice(0, 400))) broken.push(`${t.href} (from ${t.from}) says it is not found: ${text.slice(0, 80).replace(/\s+/g, " ")}`);
    }
    expect(broken).toEqual([]);
    await healthy(page, w, "the link walk");
  });
});

test.describe("Wrong addresses", () => {
  for (const route of [
    "/does-not-exist",
    "/opportunities/",
    "/opportunities/XYZ-123",
    "/opportunities/awarded/NOPE",
    "/mentors/unknown-id",
    "/forecasts/zzz",
    "/awards/zzz",
    "/small-orders/zzz",
    "/stay-ready/zzz",
    "/my-business/zzz",
    "/roadmap?step=zzz",
    "/partners?view=find&company=zzz",
    "/government-buyers?buyer=zzz",
    "/tasks/anything",
  ]) {
    test(`${route} shows a page with a way back`, async ({ page, context }) => {
      const w = await watch(page, context);
      await open(page, route);
      // The production code logs "not found" for an unknown id and then shows its own not-found page.
      w.problems = w.problems.filter((p) => !/console error .*(not found|cannot find|Review not found)/i.test(p));
      const text = (await page.locator("body").innerText()).trim();
      expect(text.length, `${route} is blank`).toBeGreaterThan(40);
      // The menu is still there, so the visitor can go on.
      await expect(page.locator(".demo-nav")).toBeVisible();
      await menu(page, "Success Center").click();
      await expect(page).toHaveURL(/\/$/);
      await settle(page);
      await healthy(page, w, route);
    });
  }
});

// ── 3 (continued). Abuse: every dialog that any button opens ──────────────
//
// Click each button on a page, one per fresh load. When something covers the page (a dialog, a
// drawer, a panel with no dialog role), Escape must close it and a click outside must close it,
// and the page must take clicks again.

/** Count the things that cover most of the window: dialogs, scrims, drawers. */
async function covers(page: Page): Promise<number> {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let n = 0;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width >= vw * 0.9 && r.height >= vh * 0.9 && Number(cs.opacity) > 0.05 && cs.pointerEvents !== "none") n += 1;
    }
    return n;
  });
}

const COVER_ROUTES = [
  "/",
  "/roadmap",
  "/tasks",
  "/opportunities",
  `/opportunities/${CAMP_MACKALL}?met=1`,
  `/opportunities/${FORT_BRAGG}?met=1`,
  `/opportunities/${RESTRICTED}?met=1`,
  "/forecasts",
  "/forecasts/80e9e92fd343cd7549f92d15374c2885",
  "/small-orders",
  "/small-orders/mp-101",
  "/small-orders/restricted",
  "/partners",
  "/partners?view=find&company=4001",
  "/awards",
  "/awards/W91247-19-C-0021",
  "/my-business",
  "/my-business/papers",
  "/pipeline",
  "/find-a-mentor",
  "/mentors/rev-fayetteville-proposal",
  "/wallet",
  "/government-buyers?buyer=bragg-micc&focus=people",
  "/business-profile",
  "/stay-ready/health-permit",
];

test.describe("Every dialog on every page closes", () => {
  for (const route of FULL ? COVER_ROUTES : COVER_ROUTES.slice(0, 7)) {
    test(route, async ({ page, context }) => {
      test.setTimeout(600_000);
      const w = await watch(page, context);
      const fast = route + (route.includes("?") ? "&" : "?") + "fast=1";
      await open(page, fast);
      const total = await page.locator(MONKEY_CLICKABLE).count();
      const opened: string[] = [];
      let reload = false;
      for (let i = 0; i < Math.min(total, 160); i++) {
        // A fresh load now and then, and after a click that moved the page or changed it for good.
        if (reload || i % 12 === 0) {
          await open(page, fast);
          reload = false;
        }
        const base = await covers(page);
        const info = await page.evaluate(
          ([sel, i]) => {
            const el = Array.from(document.querySelectorAll<HTMLElement>(sel as string))[i as number];
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.pointerEvents === "none" || el.closest(".demo-strip")) return null;
            const text = (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
            const href = el.getAttribute("href") ?? "";
            const blocked = /^reset demo$/i.test(text) || /^\/ava(\/|$)/.test(href) || /^(mailto|tel):/.test(href) || (el as HTMLButtonElement).disabled;
            return { text, blocked };
          },
          [MONKEY_CLICKABLE, i] as [string, number],
        );
        if (!info || info.blocked) continue;
        const handle = page.locator(MONKEY_CLICKABLE).nth(i);
        try {
          await handle.click({ timeout: 1500, noWaitAfter: true });
        } catch {
          reload = true;
          continue;
        }
        await page.waitForTimeout(350);
        if (new URL(page.url()).pathname !== new URL(fast, page.url()).pathname) {
          reload = true; // it moved to another page
          continue;
        }
        if ((await covers(page)) <= base) continue; // nothing opened
        opened.push(info.text);
        // Escape.
        await page.keyboard.press("Escape");
        await page.waitForTimeout(450);
        if ((await covers(page)) > base) {
          // A confirm dialog may need a second Escape. Anything still covering the page is a problem.
          await page.keyboard.press("Escape");
          await page.waitForTimeout(450);
        }
        expect(await covers(page), `"${info.text}" on ${route} opened something that Escape does not close`).toBeLessThanOrEqual(base);
        expect(await page.evaluate(() => getComputedStyle(document.body).pointerEvents), `"${info.text}" on ${route} left the page without clicks`).not.toBe("none");
        // A click outside.
        await handle.click({ timeout: 1500, noWaitAfter: true }).catch(() => undefined);
        await page.waitForTimeout(500);
        if ((await covers(page)) > base) {
          for (const [x, y] of [[8, 420], [120, 450], [1272, 792], [700, 796], [8, 790]]) {
            if ((await covers(page)) <= base) break;
            await page.mouse.click(x, y);
            await page.waitForTimeout(250);
          }
          if ((await covers(page)) > base) {
            // Some confirm boxes keep a click outside on purpose. They must still close with Escape.
            await page.keyboard.press("Escape");
            await page.waitForTimeout(400);
            expect(await covers(page), `"${info.text}" on ${route} cannot be closed`).toBeLessThanOrEqual(base);
          }
        }
        expect(await demoHooks(page), `demo hooks after "${info.text}"`).toEqual([]);
        expect(w.problems, `problems after "${info.text}" on ${route}`).toEqual([]);
        reload = true;
      }
      test.info().annotations.push({ type: "dialogs opened", description: opened.join(" | ") });
      // The last click may have moved the page (to Ava, for example). Check the page itself.
      await open(page, fast);
      await healthy(page, w, route);
    });
  }
});

// ── Downloads are real files ───────────────────────────────────────────────

test.describe("Downloads", () => {
  test("every document link gives a real PDF or file, never a 404", async ({ page, context }) => {
    test.setTimeout(600_000);
    const w = await watch(page, context);
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const route of SWEEP_SET) {
      await open(page, route + (route.includes("?") ? "&" : "?") + "fast=1");
      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
          .map((a) => a.getAttribute("href") ?? "")
          .filter((h) => /\/documents\?|\/demo-files\/|\.pdf($|\?)|\.docx?($|\?)|\.xlsx?($|\?)|\.csv($|\?)|\/download/i.test(h)),
      );
      for (const href of hrefs) {
        if (seen.has(href)) continue;
        seen.add(href);
        const res = await page.evaluate(async (h) => {
          const r = await fetch(h);
          const buf = new Uint8Array(await r.arrayBuffer());
          return { ok: r.ok, status: r.status, type: r.headers.get("content-type") ?? "", size: buf.length, head: String.fromCharCode(...buf.slice(0, 5)) };
        }, href);
        if (!res.ok) bad.push(`${href}: status ${res.status}`);
        else if (res.size < 100) bad.push(`${href}: only ${res.size} bytes`);
        else if (/pdf/i.test(res.type) && !res.head.startsWith("%PDF")) bad.push(`${href}: says PDF but starts with "${res.head}"`);
        else if (/html/i.test(res.type)) bad.push(`${href}: gave an HTML page, not a file`);
      }
    }
    expect(seen.size, "the pages offer documents").toBeGreaterThan(10);
    expect(bad).toEqual([]);
    await healthy(page, w, "downloads");
  });

  test("a Download button gives a file with a name", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/small-orders/mp-101");
    const link = main(page).getByRole("link", { name: /Read the order paper/ });
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), link.click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    await healthy(page, w, "order paper download");
  });
});

test.describe("One message per send", () => {
  test("a double-click on Send reply and on a chat send posts once", async ({ page, context }) => {
    const w = await watch(page, context);
    await open(page, "/mentors/rev-fayetteville-proposal");
    const mine = () => main(page).locator(".mentors-msg--member");
    const before = await mine().count();
    await page.locator(".reply-composer__editor").click();
    await page.keyboard.insertText("Thank you, Sarah. I will move my event work to the top.");
    await humanDoubleClick(page, page.getByRole("button", { name: "Send reply" }));
    await settle(page);
    await page.waitForTimeout(800);
    await expect(mine()).toHaveCount(before + 1);
    // Hunter's chat: Enter twice, quickly.
    await open(page, "/opportunities");
    const box = page.getByPlaceholder(/Ask Hunter/);
    await box.fill("What is closing soonest?");
    await box.press("Enter");
    await box.press("Enter");
    await page.waitForTimeout(800);
    await expect(page.locator(".hunter-bubble.from-user", { hasText: "What is closing soonest?" })).toHaveCount(1);
    await healthy(page, w, "one message per send");
  });
});

test.describe("The Back button with a dialog open", () => {
  for (const d of DIALOGS) {
    test(d.name, async ({ page, context }) => {
      const w = await watch(page, context);
      // A page to go back to, then the page that holds the dialog.
      await open(page, "/tasks");
      await menu(page, d.route === "/" ? "Success Center" : "Roadmap").click().catch(() => undefined);
      await page.goto(d.route, { waitUntil: "domcontentloaded" });
      await settle(page);
      await d.open(page);
      await expect(openDialogs(page).first()).toBeVisible();
      await page.goBack();
      await settle(page);
      await page.waitForTimeout(500);
      // A dialog of the shell (the search box, Reset demo) may stay open over the new page. Escape closes it.
      // Whatever the dialog did, the page takes clicks and shows no cover after that.
      if (await openDialogs(page).count()) {
        await page.keyboard.press("Escape");
        await expect(openDialogs(page)).toHaveCount(0);
      }
      expect(await page.evaluate(() => getComputedStyle(document.body).pointerEvents), "the page must take clicks").not.toBe("none");
      await menu(page, "Tasks").click();
      await expect(page).toHaveURL(/\/tasks/);
      await menu(page, "Roadmap").click();
      await expect(page).toHaveURL(/\/roadmap/);
      await healthy(page, w, `Back with ${d.name} open`);
    });
  }
});
