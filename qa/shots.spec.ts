// Screenshots for a human (or the lead agent) to look at. Not a test.
//   QA_SHOTS=1 QA_ROUTES=/,/opportunities bunx playwright test qa/shots.spec.ts
// Images go to qa/report/shots/<slug>.png (full page, 1440 wide).

import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { crawlRoutes } from "./routes";

const OUT = path.join(process.cwd(), "qa", "report", "shots");

test.skip(!process.env.QA_SHOTS, "set QA_SHOTS=1 to take screenshots");

for (const route of crawlRoutes()) {
  test(`shot ${route}`, async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true });
    await page.setViewportSize({ width: Number(process.env.QA_SHOT_WIDTH ?? 1440), height: 900 });
    await page.goto(`${route}${route.includes("?") ? "&" : "?"}fast=1`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(Number(process.env.QA_SHOT_WAIT ?? 1200));
    const slug = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
    // The main area scrolls, not the window: grow the viewport to the main area's height.
    const h = await page.evaluate(() => {
      const m = document.getElementById("demo-main");
      return m ? m.scrollHeight + 60 : document.body.scrollHeight;
    });
    await page.setViewportSize({ width: Number(process.env.QA_SHOT_WIDTH ?? 1440), height: Math.min(Math.max(h, 900), 6000) });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${slug}.png`), fullPage: true });
  });
}
