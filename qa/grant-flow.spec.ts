// Click-through flows on the opportunity page, the ones the crawl cannot do alone.
//
//   QA_PORT=4342 bunx playwright test qa/grant-flow.spec.ts
//
// 1. Camp Mackall field meals: pass the introduction, read Grant's take, ask two
//    questions in the rail, click the recommended next move.
// 2. Send to mentor, end to end, and see the wallet and the status pill change.
// 3. Save, reload, and see the bookmark kept.
// 4. Download a reference document and check it is a PDF.
// 5. Fort Bragg dining: answer Grant's open question and see the take change.
// 6. The restricted site: the roadmap, a "Have us do it" request, the way back.
// 7. The retired awarded-contract page and an unknown id do not dead-end.

import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";

const FIELD_MEALS = "SP4701-26-Q-0021";

// A step that cannot find its element must fail in seconds, not wait for the run limit.
test.setTimeout(90_000);

async function boot(page: Page, path: string): Promise<string[]> {
  page.setDefaultTimeout(12_000);
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console error: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => errors.push(`page error: ${String(e.message).slice(0, 300)}`));
  await page.addInitScript(() => {
    (window as unknown as { __DEMO_FAST__: boolean }).__DEMO_FAST__ = true;
  });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  return errors;
}

const settle = (page: Page) =>
  page.waitForFunction(() => ((window as unknown as { __DEMO_INFLIGHT__?: number }).__DEMO_INFLIGHT__ ?? 0) === 0, undefined, { timeout: 10_000 });

async function demoFailures(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window as unknown as {
      __DEMO_UNHANDLED__?: { method: string; path: string }[];
      __DEMO_ERRORS__?: { method: string; path: string; message: string }[];
    };
    return [...(w.__DEMO_UNHANDLED__ ?? []).map((u) => `unhandled ${u.method} ${u.path}`), ...(w.__DEMO_ERRORS__ ?? []).map((e) => `threw ${e.path}: ${e.message}`)];
  });
}

const lastGrantReply = (page: Page) => page.locator(".grant-dock__thread .grant-msg--agent").last();

test("field meals: intro, read the take, two rail questions, the next move", async ({ page }) => {
  const errors = await boot(page, `/opportunities/${FIELD_MEALS}?fast=1`);

  // The introduction comes first.
  await expect(page.getByRole("heading", { name: /^Grant/ })).toBeVisible();
  await expect(page.locator(".gt-call")).toHaveCount(0);
  await page.getByRole("button", { name: "Show me the analysis" }).click();

  // The take: Bid, four dots of confidence, prime and subcontract both go.
  await expect(page.locator(".gt-call__word .grant-chip")).toHaveText(/Bid/);
  await expect(page.locator(".gt-conf__dot.is-on")).toHaveCount(4);
  await expect(page.locator(".gt-path--go")).toHaveCount(2);
  await expect(page.locator(".gt-call__summary")).toContainText("only woman-owned firms can bid");
  await expect(page.locator(".gt-col--neg .gt-cell")).toHaveCount(4);
  await expect(page.locator(".gt-next__title")).toHaveText("Build the quote with Ava");

  // The full analysis opens, and a read opens to its reasoning.
  await page.locator(".grant-full > summary").click();
  await expect(page.locator(".grant-gates")).toBeVisible();
  await page.locator(".grant-read__d", { hasText: "Can you do the work?" }).locator("summary").click();
  await expect(page.locator(".grant-read__dossier").first()).toContainText("Food-handler certificates");

  // Source chip opens a real passage.
  await page.locator(".grant-read__d", { hasText: "Can you do the work?" }).locator(".grant-pin").first().click();
  await expect(page.getByRole("dialog")).toContainText("food-handler certificate");
  await page.keyboard.press("Escape");

  // Rail: the briefing, a chip, and a typed question.
  const rail = page.locator(".grant-dock");
  await expect(rail).toContainText("I read the quote request, the work statement and the wage determination.");
  await rail.getByRole("button", { name: "Can I fix this in time?" }).click();
  await expect(lastGrantReply(page)).toContainText("A food-handler course takes one day");
  await page.getByRole("textbox", { name: "Ask Grant" }).fill("What is my biggest weakness here?");
  await page.keyboard.press("Enter");
  await expect(lastGrantReply(page)).toContainText("Womack is your only federal prime");
  await settle(page);

  // The conversation is kept after a reload.
  await page.reload();
  await page.getByRole("button", { name: "Show me the analysis" }).click().catch(() => undefined);
  await expect(page.locator(".grant-dock__thread")).toContainText("A food-handler course takes one day");

  // The recommended next move goes to Ava.
  await page.getByRole("link", { name: /Build the quote with Ava/ }).click();
  await expect(page).toHaveURL(new RegExp(`/ava/${FIELD_MEALS}`));

  expect(await demoFailures(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("send to mentor charges $97, adds a pending review and updates the pill", async ({ page }) => {
  const id = "VA247-26-R-0112";
  const errors = await boot(page, `/opportunities/${id}?met=1&fast=1`);
  await settle(page);
  const balance = () => page.evaluate(async () => (await (await fetch("/__demo_api/wallet/balance")).json()).balance as number);
  const before = await balance();

  await page.getByRole("button", { name: /Review with Mentor/ }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("What I'm sending");
  await expect(dialog).toContainText("Grant's take: Bid");
  await dialog.getByLabel(/I've read the scope of work/).check();
  await dialog.getByLabel("Should I bid on this?").check();
  await dialog.getByLabel(/Your question for the mentor/).fill("Does the Womack job count as direct proof, and should I ask for the rating first?");
  await dialog.getByRole("button", { name: /Send for \$97/ }).click();

  await expect(page.locator(".mentor-status-pill--pending")).toContainText("Mentor reviewing");
  await expect(dialog).toHaveCount(0);
  await settle(page);
  expect(await balance()).toBe(before - 97);

  // It survives a reload, and the pill opens Diana's thread.
  await page.reload();
  await page.getByRole("button", { name: "Show me the analysis" }).click().catch(() => undefined);
  await expect(page.locator(".mentor-status-pill--pending")).toContainText("Mentor reviewing");
  await page.locator(".mentor-status-pill--pending").click();
  await expect(page).toHaveURL(/\/mentors\/rev-/);
  await expect(page.locator("body")).toContainText("Diana Potts");

  expect(await demoFailures(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("the bookmark saves, and stays after a reload", async ({ page }) => {
  const id = "NCNG-2026-21"; // not saved in the story
  const errors = await boot(page, `/opportunities/${id}?met=1&fast=1`);
  await settle(page);
  const save = page.locator(".opp-sticky__actions").getByRole("button", { name: /^(Save|Saved|Unsave)$/ });
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await save.click();
  await expect(save).toHaveAttribute("aria-pressed", "true");
  await settle(page);
  await page.reload();
  await expect(page.locator(".opp-sticky__actions").getByRole("button", { name: /^(Save|Saved|Unsave)$/ })).toHaveAttribute("aria-pressed", "true");
  expect(await demoFailures(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("a reference document downloads as a real PDF", async ({ page }) => {
  const errors = await boot(page, `/opportunities/${FIELD_MEALS}?met=1&fast=1`);
  await settle(page);
  const link = page.locator(".ref-doc__link", { hasText: "Wage-Determination" });
  const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
  expect(download.suggestedFilename()).toBe(`${FIELD_MEALS}_Wage-Determination.pdf`);
  const path = await download.path();
  const head = fs.readFileSync(path).subarray(0, 5).toString("latin1");
  expect(head).toBe("%PDF-");
  expect(fs.statSync(path).size).toBeGreaterThan(1500);
  expect(errors).toEqual([]);
});

test("Fort Bragg dining: answer Grant's question and the take changes", async ({ page }) => {
  const errors = await boot(page, `/opportunities/W912EE-26-R-0066?met=1&fast=1`);
  await settle(page);
  await expect(page.locator(".gt-call__word .grant-chip")).toHaveText(/Bid/);
  const paths = page.locator(".gt-path");
  await expect(paths.nth(0)).toContainText("No-go");
  await expect(paths.nth(1)).toContainText("Go");
  await expect(page.locator(".gt-conf__dot.is-on")).toHaveCount(3);
  await expect(page.locator(".gt-next__title")).toContainText("Partners");

  const card = page.locator(".grant-oq");
  await expect(card).toContainText("Have you talked with Carolina Dining Group");
  await card.getByRole("button", { name: "Yes" }).click();
  await expect(lastGrantReply(page)).toContainText("subcontract path is a plan now");
  await expect(page.locator(".gt-conf__dot.is-on")).toHaveCount(4);
  await expect(page.locator(".grant-answered")).toContainText("Yes");
  await settle(page);

  // The next move goes to Partners. (The Partners page has its own checks.)
  expect(await demoFailures(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.getByRole("link", { name: /on Partners/ }).first().click();
  await expect(page).toHaveURL(/\/partners/);
});

test("restricted site: No-bid, the roadmap, a service request, and the way back", async ({ page }) => {
  const errors = await boot(page, `/opportunities/SP4701-26-R-0078?met=1&fast=1`);
  await settle(page);
  await expect(page.locator(".gt-call__word .grant-chip")).toHaveText(/No-bid/);
  await expect(page.locator(".gt-conf__dot.is-on")).toHaveCount(5);
  await expect(page.locator(".gt-path--no-go")).toHaveCount(2);
  const roadmap = page.locator(".gt-roadmap");
  await expect(roadmap).toContainText("Bid on Camp Mackall field meals");
  await expect(roadmap.locator(".gt-roadmap__item")).toHaveCount(4);

  // "Have us do it" ends in a success that is kept.
  await roadmap.getByRole("button", { name: /Have us do it/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Confirm/ }).click();
  await expect(dialog).toContainText("Request received");
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(roadmap).toContainText("Requested");

  expect(await demoFailures(page)).toEqual([]);
  expect(errors).toEqual([]);
  await page.getByRole("link", { name: /Go to Camp Mackall field meals/ }).click();
  await expect(page).toHaveURL(new RegExp(`/opportunities/${FIELD_MEALS}`));
  // Each opportunity starts with Grant's introduction.
  await expect(page.getByRole("button", { name: "Show me the analysis" })).toBeVisible();
});

test("the awarded-contract page redirects and an unknown id says so", async ({ page }) => {
  // The pages these go to (Awards, the feed) belong to other areas, so only the URL is checked.
  const errors = await boot(page, `/opportunities/awarded/C-1001?fast=1`);
  await expect(page).toHaveURL(/\/awards/);
  errors.length = 0;
  await page.goto(`/opportunities/NOT-AN-ID?fast=1`);
  await expect(page.getByRole("heading", { name: "Opportunity not found" })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __DEMO_ERRORS__?: unknown[] }).__DEMO_ERRORS__ ?? [])).toEqual([]);
  expect(errors.filter((e) => !/\b50[01]\b|Failed to load resource/.test(e))).toEqual([]);
  await page.getByRole("link", { name: "See your opportunities" }).click();
  await expect(page).toHaveURL(/\/opportunities$/);
});
