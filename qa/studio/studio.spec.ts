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
  const a = (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return a.length ? a : d;
};
const ROUTES = list(process.env.STUDIO_ROUTES, ["/"]);
const STATES = (process.env.STUDIO_STATES ?? "").split(",").map((s) => s.trim()); // "" = default scenario
if (!STATES.length) STATES.push("");
const VIEWPORTS = list(process.env.STUDIO_VIEWPORTS, ["1440x900", "1366x768"]);
const OUT = process.env.STUDIO_OUT ?? path.join(process.cwd(), "studio-out");
const MAX_TILES = Number(process.env.STUDIO_MAX_TILES ?? 6);
const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";

/** Scroll the page by one viewport; the app scrolls #demo-main, not the window. Returns true if it moved. */
async function scrollOne(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const h = window.innerHeight;
    const cands = [document.getElementById("demo-main"), document.scrollingElement].filter(Boolean) as Element[];
    const el = cands.find((c) => c.scrollHeight > c.clientHeight + 1 && getComputedStyle(c).overflowY !== "hidden") ?? document.scrollingElement!;
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
        const url = state ? `${route}${route.includes("?") ? "&" : "?"}scenario=${encodeURIComponent(state)}` : route;
        await page.goto(url);
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page }).analyze();
        const axe = results.violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => ({ id: v.id, impact: v.impact as string, nodes: v.nodes.length }));

        const base = `${slug(route)}__${state || "default"}__${viewport}`;
        fs.mkdirSync(OUT, { recursive: true });
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
            if (text) labels.push({ role, text });
          }
        };
        await add("button", page.getByRole("button"));
        await add("link in nav", page.locator("nav").getByRole("link"));
        await add("columnheader", page.getByRole("columnheader"));
        await add("heading", page.getByRole("heading"));
        await add("label", page.locator("label"));

        fs.writeFileSync(path.join(OUT, `${base}.json`), JSON.stringify({ route, state, viewport, axe, tiles, labels }, null, 2));
      });
    }
