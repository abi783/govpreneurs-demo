// Multi-step flows on the Roadmap and Tasks pages (the crawl only clicks once per load).
//   QA_PORT=4344 bunx playwright test qa/roadmap-tasks.flows.spec.ts
//
// Each test starts in a new browser context, so the demo store is empty at the start.

import { expect, test, type Page } from "@playwright/test";

const LOC = "demo-haddad-catering";

async function open(page: Page, path: string) {
  await page.addInitScript(() => {
    (window as unknown as { __DEMO_FAST__: boolean }).__DEMO_FAST__ = true;
  });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

const balance = (page: Page) =>
  page.evaluate(async (loc) => (await (await fetch(`/api/portal/${loc}/wallet-balance`)).json()).balance as number, LOC);

const unhandled = (page: Page) =>
  page.evaluate(() => ({
    unhandled: (window as unknown as { __DEMO_UNHANDLED__?: unknown[] }).__DEMO_UNHANDLED__ ?? [],
    errors: (window as unknown as { __DEMO_ERRORS__?: unknown[] }).__DEMO_ERRORS__ ?? [],
  }));

test("the Roadmap shows Amira in Execution with the quarterly call next", async ({ page }) => {
  await open(page, "/roadmap");
  await expect(page.locator(".rm2-next")).toContainText("Quarterly Targeting Call");
  await expect(page.locator(".rm2-steps__bit.is-done")).toHaveCount(11);
  await expect(page.locator(".rm2-steps__bit")).toHaveCount(14);
  await expect(page.locator(".rm2-steps__caption")).toContainText("2 steps need you");
  await expect(page.locator(".rm2-approval")).toContainText("Mentor Approved");
  await expect(page.locator("#rm2-tab-4")).toContainText("You're here");
});

test("book the quarterly call: pick a time, confirm, see it booked, wallet goes down, Tasks agrees", async ({ page }) => {
  await open(page, "/roadmap");
  expect(await balance(page)).toBe(306);
  await page.getByRole("button", { name: /Quarterly Targeting Call/ }).first().click();
  await page.getByRole("button", { name: /Book Your Call/ }).click();
  await page.locator(".mbook__day.is-open").first().click();
  await page.locator(".mbook__slot").first().click();
  await page.getByRole("button", { name: /Confirm this booking/ }).click();
  await expect(page.locator(".mbook")).toHaveCount(0);
  await expect(page.locator(".rm2-mentor")).toContainText("This call is booked for");
  expect(await balance(page)).toBe(209);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".rm2-next")).toContainText("Proposal Building");

  await page.getByRole("link", { name: "Tasks", exact: true }).first().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/4 things need you/)).toBeVisible();
  expect(await unhandled(page)).toEqual({ unhandled: [], errors: [] });
});

test("book the call from the Tasks page", async ({ page }) => {
  await open(page, "/tasks");
  await page.getByRole("link", { name: "Book the call" }).click();
  await page.locator("button:not([disabled]).w-9.h-9").first().click();
  await page.locator("button.px-4.py-3.text-base").first().click();
  await page.getByRole("button", { name: /Confirm & Book/ }).click();
  await expect(page.getByText("Booking confirmed!")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(page.getByText(/4 things need you/)).toBeVisible();
  expect(await balance(page)).toBe(209);
});

test("buy a service with a coupon: the wallet goes down and the step shows the purchase", async ({ page }) => {
  await open(page, "/roadmap?step=p3-prime-registration");
  await page.getByRole("button", { name: /Register with another prime/ }).click();
  await page.getByPlaceholder("Code").fill("DEMO10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/Coupon DEMO10 applied/)).toBeVisible();
  await page.getByRole("button", { name: "Purchase" }).click();
  await page.getByRole("button", { name: /Confirm and pay/ }).click();
  await expect(page.getByText("Your payment is done.")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).last().click();
  expect(await balance(page)).toBeCloseTo(128.7, 2);
  await expect(page.locator(".rm2-detail-right")).toContainText("You bought this");
  // The receipt is a real file.
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "View receipt" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^receipt-INV-\d+\.txt$/);
});

test("a short wallet is topped up in place, then the purchase goes through", async ({ page }) => {
  await open(page, "/roadmap?step=p1-federal-registration");
  await page.evaluate(
    async (loc) => {
      await fetch(`/api/portal/${loc}/verify-reset`, { method: "POST", body: JSON.stringify({ validationKey: "sam" }) });
    },
    LOC,
  );
  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Learn more/ }).click();
  await page.getByRole("button", { name: /Add money to your wallet/ }).click();
  await page.locator(".dfyd a.rm2-btn").click();
  await expect(page.locator(".demo-dialog")).toContainText("added");
  await page.getByRole("button", { name: "OK" }).click();
  await page.getByRole("button", { name: /check again/ }).click();
  await page.getByRole("button", { name: /Go back/ }).click();
  await page.getByRole("button", { name: "Purchase" }).click();
  await page.getByRole("button", { name: /Confirm and pay/ }).click();
  await expect(page.getByText("Your payment is done.")).toBeVisible();
});

test("upload a file on a verify step and the check passes", async ({ page }) => {
  await open(page, "/roadmap?step=p2-capability-statement");
  await page.getByRole("button", { name: /Re-verify/ }).first().click();
  await page.locator("input[type=file]").setInputFiles({ name: "capability.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 sample") });
  await expect(page.locator(".rm3-verify__drop")).toContainText("PDF uploaded");
  await page.getByRole("button", { name: "Verify", exact: true }).click();
  await expect(page.locator(".rm3-verify--pass")).toContainText("verified");
});

test("tick a task, reload, and it is still ticked", async ({ page }) => {
  await open(page, "/tasks");
  await expect(page.getByText(/6 things need you/)).toBeVisible();
  await page.getByRole("button", { name: /I've completed this task/ }).first().click();
  await expect(page.getByText(/5 things need you/)).toBeVisible();
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(/5 things need you/)).toBeVisible();
  await expect(page.locator(".gpds-prog")).toContainText("3 of 8 done");
});

test("a task button opens its page in this app", async ({ page }) => {
  await open(page, "/tasks");
  await page.getByRole("link", { name: "Open", exact: true }).first().click();
  await expect(page).toHaveURL(/\/ava\/SP4701-26-Q-0021/);
});
