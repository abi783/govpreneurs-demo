// Adversarial E2E for Grant's CANVAS — the take itself (verdict, reads, gate
// strip, real deadline, compliance matrix, evidence pins, CTA). The rail suite
// covers the conversation; this covers the surface the member actually decides
// from, driven with corrupted analyses (harness-hostile.tsx, `canvas-*`).
import { test, expect, type Page } from "@playwright/test";

/** Page errors are the headline signal here: the canvas is the whole take, so an
 *  uncaught render error is a blank decision surface. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

async function open(page: Page, scenario: string): Promise<string[]> {
  const errors = watch(page);
  await page.goto(`e2e/harness-hostile.html?scenario=${scenario}`);
  return errors;
}

const overflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

test("renders with enum values outside every union it keys tables by", async ({ page }) => {
  const errors = await open(page, "canvas-bad-enums");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  expect(errors).toEqual([]);
  // no blank/undefined verdict word leaking into the hero
  await expect(page.locator(".grant-canvas")).not.toContainText("undefined");
});

test("survives NaN / unparseable dates in the deadline inputs", async ({ page }) => {
  const errors = await open(page, "canvas-nan");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  expect(errors).toEqual([]);
  await expect(page.locator(".grant-canvas")).not.toContainText("NaN");
  await expect(page.locator(".grant-canvas")).not.toContainText("Invalid Date");
});

test("a deadline already in the past does not render negative day counts", async ({ page }) => {
  const errors = await open(page, "canvas-past");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  expect(errors).toEqual([]);
  const text = (await page.locator(".grant-canvas").innerText()).replace(/[—–]/g, "");
  expect(text).not.toMatch(/-\d+\s*d\b/); // "-2401d"
  expect(text).not.toMatch(/-\d+\s*days?/); // "-2401 days"
});

test("an empty take (no reads, no compliance rows) still renders", async ({ page }) => {
  const errors = await open(page, "canvas-empty");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  expect(errors).toEqual([]);
});

test("unbounded model text does not push the canvas past the viewport", async ({ page }) => {
  await open(page, "canvas-huge");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  expect(await overflow(page)).toBeLessThanOrEqual(1);
});

test("markup in the verdict and reads is escaped", async ({ page }) => {
  await open(page, "canvas-xss");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__xss ?? 0)).toBe(0);
  expect(await page.locator('img[src="x"]').count()).toBe(0);
});

test("a javascript: provenance ref is not opened from the canvas", async ({ page }) => {
  await open(page, "canvas-evil-pin");
  await page.evaluate(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = ((u: string) => {
      (window as unknown as { __opened: string[] }).__opened.push(u);
      return null;
    }) as unknown as typeof window.open;
  });
  // open every <details> (the pins live inside "See the full analysis"), then
  // activate each pin.
  await page.evaluate(() =>
    document.querySelectorAll("details").forEach((d) => d.setAttribute("open", "")),
  );
  const pins = page.locator(".grant-pin");
  await expect(pins.first()).toBeVisible();
  const n = await pins.count();
  for (let i = 0; i < n; i++) await pins.nth(i).click();
  const opened = await page.evaluate(
    () => (window as unknown as { __opened?: string[] }).__opened ?? [],
  );
  expect(opened.filter((u) => u.startsWith("javascript:"))).toHaveLength(0);
});

test("mobile viewport: the canvas fits", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const errors = await open(page, "canvas-huge");
  await expect(page.locator(".grant-canvas")).toBeVisible();
  expect(errors).toEqual([]);
  expect(await overflow(page)).toBeLessThanOrEqual(1);
});
