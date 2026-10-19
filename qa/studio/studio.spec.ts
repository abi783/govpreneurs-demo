// Studio browser checks: per route x state x viewport, writes
//   STUDIO_OUT/<route-slug>__<state>__<viewport>.json  (+ PNG tiles beside it)
//   { route, state, viewport, axe: {id, impact, nodes}[], tiles: string[], labels: {role, text}[] }
// Env: STUDIO=1, STUDIO_URL, STUDIO_ROUTES, STUDIO_STATES, STUDIO_VIEWPORTS, STUDIO_OUT, STUDIO_MAX_TILES.

import fs from "node:fs";
import path from "node:path";
import { test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.skip(!process.env.STUDIO, "set STUDIO=1 to run Studio checks");

const list = (v: string | undefined, d: string[]) => {
  const a = (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return a.length ? a : d;
};
const ROUTES = list(process.env.STUDIO_ROUTES, ["/"]);
const STATES = list(process.env.STUDIO_STATES, [""]); // "" = default scenario
const VIEWPORTS = list(process.env.STUDIO_VIEWPORTS, ["1440x900", "1366x768"]);
const OUT = process.env.STUDIO_OUT ?? path.join(process.cwd(), "studio-out");
const MAX_TILES = Number(process.env.STUDIO_MAX_TILES ?? 6);
if (process.env.STUDIO && (!Number.isInteger(MAX_TILES) || MAX_TILES < 1))
  throw new Error(
    `STUDIO_MAX_TILES must be an integer >= 1, got "${process.env.STUDIO_MAX_TILES}"`,
  );
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";

/** Scroll the page by one viewport; the app scrolls #demo-main, not the window. Returns true if it moved. */
async function scrollOne(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const h = window.innerHeight;
    const cands = [document.getElementById("demo-main"), document.scrollingElement].filter(
      Boolean,
    ) as Element[];
    const el =
      cands.find(
        (c) => c.scrollHeight > c.clientHeight + 1 && getComputedStyle(c).overflowY !== "hidden",
      ) ?? document.scrollingElement!;
    const before = el.scrollTop;
    el.scrollTop = before + h;
    return el.scrollTop > before;
  });
}

for (const route of ROUTES)
  for (const state of STATES)
    for (const viewport of VIEWPORTS) {
      test(`studio ${route} [${state || "default"}] ${viewport}`, async ({ page }) => {
        const [w, h] = viewport.split("x").map(Number);
        await page.setViewportSize({ width: w, height: h });
        const url = state
          ? `${route}${route.includes("?") ? "&" : "?"}scenario=${encodeURIComponent(state)}`
          : route;
        const base = `${slug(route)}__${state || "default"}__${viewport}`;
        fs.mkdirSync(OUT, { recursive: true });
        const clean = () => {
          fs.rmSync(path.join(OUT, `${base}.json`), { force: true });
          for (const f of fs.readdirSync(OUT))
            if (f.startsWith(`${base}__`) && f.endsWith(".png"))
              fs.rmSync(path.join(OUT, f), { force: true });
        };
        clean(); // never leave a previous run's output behind
        let ok = false;
        try {
          const pageErrors: string[] = [];
          page.on("pageerror", (e) => pageErrors.push(e.message));
          const response = await page.goto(url);
          if (!response || response.status() >= 400)
            throw new Error(`${url}: HTTP ${response?.status() ?? "no response"}`);
          await page.waitForLoadState("networkidle");

          const results = await new AxeBuilder({ page }).analyze();
          const axe = results.violations
            .filter((v) => v.impact === "serious" || v.impact === "critical")
            .map((v) => ({ id: v.id, impact: v.impact as string, nodes: v.nodes.length }));

          const tiles: string[] = [];
          for (let i = 0; i < MAX_TILES; i++) {
            const file = `${base}__${i + 1}.png`;
            await page.screenshot({ path: path.join(OUT, file) }); // viewport only, not fullPage
            tiles.push(file);
            if (!(await scrollOne(page))) break;
            await page.waitForTimeout(200);
          }

          const labels: { role: string; text: string }[] = [];
          const add = async (role: string, loc: ReturnType<Page["locator"]>) => {
            for (const t of await loc.allInnerTexts()) {
              const text = t.replace(/\s+/g, " ").trim();
              if (text && !labels.some((l) => l.role === role && l.text === text))
                labels.push({ role, text });
            }
          };
          await add("button", page.getByRole("button"));
          await add("link in nav", page.locator("nav").getByRole("link"));
          await add("columnheader", page.getByRole("columnheader"));
          await add("heading", page.getByRole("heading"));
          await add("label", page.locator("label:visible"));

          // The SPA serves HTTP 200 for unknown routes. In the default scenario a "Page not found" heading is a bad route;
          // other states may legitimately show error screens, so they are not checked.
          if (
            !state &&
            labels.some(
              (l) => l.role === "heading" && l.text.trim().toLowerCase() === "page not found",
            )
          )
            throw new Error(`${url}: app shows "Page not found"`);
          if (pageErrors.length) throw new Error(`${url}: uncaught page error: ${pageErrors[0]}`);
          if (!labels.length)
            throw new Error(`${url}: no labels collected (blank page or error boundary?)`);
          fs.writeFileSync(
            path.join(OUT, `${base}.json`),
            JSON.stringify({ route, state, viewport, axe, tiles, labels }, null, 2),
          );
          ok = true;
        } finally {
          if (!ok) clean(); // a failed route leaves neither JSON nor tiles
        }
      });
    }
