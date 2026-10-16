// Multi-step flows for the Success Center My Business page. The crawl clicks one thing
// per load, so it cannot check a flow that needs a few steps. These tests do.
//
//   QA_PORT=4345 bunx playwright test qa/flows/my-business.flows.spec.ts
//
// Each test starts with a fresh browser context, so the demo store starts at the seed.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const row = (page: Page, key: string) => page.locator(`#row-${key}`);
const score = async (page: Page) => (await page.locator(".mb-sc__n").first().innerText()).replace(/\s+/g, " ");

async function go(page: Page, route: string) {
  await page.goto(`${route}${route.includes("?") ? "&" : "?"}fast=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".mb-shell");
}

function tempFile(name: string, body: string | Buffer): string {
  const file = path.join(os.tmpdir(), name);
  fs.writeFileSync(file, body);
  return file;
}

test.describe("My Business flows", () => {
  test("edit a field, see it, reload, still there; a bad answer is refused", async ({ page }) => {
    await go(page, "/my-business");
    expect(await score(page)).toMatch(/^47 \/ 55/);
    await row(page, "phone").locator(".mb-row__box").click();
    await row(page, "phone").locator("input").first().fill("(910) 555-0199");
    await row(page, "phone").getByRole("button", { name: "Save" }).click();
    await expect(row(page, "phone")).toContainText("555-0199");
    await page.reload();
    await page.waitForSelector(".mb-shell");
    await expect(row(page, "phone")).toContainText("555-0199");

    await row(page, "phone").locator(".mb-row__box").click();
    await row(page, "phone").locator("input").first().fill("abc");
    await expect(row(page, "phone").locator(".gpds-sublabel").first()).toContainText("phone number");
  });

  test("a new paper moves the score, a suggestion answers yes or no", async ({ page }) => {
    await go(page, "/my-business/papers");
    const before = await score(page);
    await row(page, "licenses").locator(".mb-row__box").click();
    await row(page, "licenses").getByPlaceholder("What it is called").fill("City of Fayetteville business registration");
    await row(page, "licenses").getByPlaceholder("Who issued it").fill("City of Fayetteville");
    await row(page, "licenses").getByRole("button", { name: "Save" }).click();
    await expect(row(page, "licenses")).toContainText("City of Fayetteville business registration");
    expect(await score(page)).not.toBe(before);

    await go(page, "/my-business/capacity");
    const s1 = await score(page);
    await row(page, "max_daily_output").getByRole("button", { name: /Yes, that is right/ }).click();
    await expect(row(page, "max_daily_output")).toContainText("1,100");
    expect(await score(page)).not.toBe(s1);
    await row(page, "equipment").getByRole("button", { name: /No, leave it/ }).click();
    await expect(row(page, "equipment")).not.toContainText("Two refrigerated delivery vans");
  });

  test("an uploaded document is listed and survives a reload", async ({ page }) => {
    const file = tempFile("mb-flow-tax-return.pdf", "%PDF-1.4 sample");
    await go(page, "/my-business/papers");
    await row(page, "doc_tax_returns").locator(".mb-row__box").click();
    await row(page, "doc_tax_returns").locator("input[type=file]").setInputFiles(file);
    await expect(row(page, "doc_tax_returns")).toContainText("mb-flow-tax-return.pdf");
    await page.reload();
    await page.waitForSelector(".mb-shell");
    await expect(row(page, "doc_tax_returns")).toContainText("mb-flow-tax-return.pdf");
  });

  test("the photo upload shows a picture and keeps it", async ({ page }) => {
    const png = tempFile(
      "mb-flow-photo.png",
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"),
    );
    await go(page, "/my-business/business");
    const card = page.locator(".gpds-imgcard").first();
    await card.locator("input[type=file]").setInputFiles(png);
    await expect(card.locator("img")).toHaveCount(1);
    await page.reload();
    await page.waitForSelector(".mb-shell");
    await expect(page.locator(".gpds-imgcard").first().locator("img")).toHaveCount(1);
  });

  test("all four jobs show, and editing one keeps the rest", async ({ page }) => {
    await go(page, "/my-business/jobs");
    const jobs = row(page, "past_performance");
    for (const name of ["Cumberland County Schools", "Carolina Dining Group", "Riverside Fellowship", "Womack"]) {
      await expect(jobs).toContainText(name);
    }
    await expect(jobs).toContainText("performance rating");
    await jobs.locator(".mb-row__box").first().click();
    await expect(jobs.locator('input[placeholder="Who it was for"]')).toHaveCount(4);
    await jobs.locator('input[placeholder="Roughly what it was worth"]').first().fill("$200,000");
    await jobs.getByRole("button", { name: "Save" }).click();
    await expect(jobs).toContainText("$200,000");
    await expect(jobs).toContainText("Janet Reyes");
    await expect(jobs).toContainText("Womack");
  });

  test("Tell Hunter everything turns words into suggestions, and dictation fills the box", async ({ page }) => {
    await go(page, "/my-business");
    await page.getByRole("link", { name: /Tell Hunter everything/ }).first().click();
    await page.fill(
      "#mb-say-box",
      "We can wait 45 days to be paid. We have about $90,000 of our own money to put in. Our insurance is with a local agent. I like the weather.",
    );
    await page.getByRole("button", { name: "Write this down" }).click();
    const said = page.locator(".mb-said");
    await expect(said).toContainText("45 days");
    await expect(said).toContainText("$90,000");
    await expect(said).toContainText("These need you");
    await expect(said).toContainText("I like the weather");
    await page.getByRole("button", { name: /Yes, that is right/ }).first().click();
    await expect(said).toContainText("Added to your record");

    await page.getByRole("button", { name: "Say something else" }).click();
    await page.getByRole("button", { name: /Say it out loud/ }).click();
    await page.getByRole("button", { name: /Stop and write it down/ }).click();
    await expect(page.locator("#mb-say-box")).toHaveValue(/1,100 meals/);
  });

  test("the next question card saves, and the answer shows on its part", async ({ page }) => {
    await go(page, "/my-business");
    const ask = page.locator(".mb-ask");
    await expect(ask).toContainText("tax number");
    await ask.locator("input").fill("12-3456789");
    await ask.getByRole("button", { name: "Save" }).click();
    await expect(page.locator(".mb-ask")).toHaveCount(0);
    await go(page, "/my-business/business");
    await expect(row(page, "ein")).toContainText("12-3456789");
  });

  test("the digital identity audit runs again on new answers", async ({ page }) => {
    await go(page, "/my-business/digital");
    await page.getByPlaceholder("https://yourbiz.com/government").fill("N/A");
    await page.getByPlaceholder("BN…").fill("BN123456");
    await page.getByRole("button", { name: "Check again" }).click();
    const found = page.locator(".mb-di__found");
    await expect(found).toContainText("Not Applicable");
    await expect(found).toContainText("found 1 gap");
    await page.reload();
    await page.waitForSelector(".mb-shell");
    await expect(page.locator(".mb-di__found")).toContainText("Not Applicable");
  });

  test("the pickers load their lists: NAICS search, PSC groups, address lookup", async ({ page }) => {
    await go(page, "/my-business/sell");
    await row(page, "primary_industry").locator(".mb-row__box").click();
    await expect(row(page, "primary_industry")).toContainText("Caterers");
    await row(page, "primary_industry").getByText("Add a code").click();
    await expect(row(page, "primary_industry")).not.toContainText(/roof/i);
    await row(page, "primary_industry").getByText("Search all NAICS codes").click();
    await row(page, "primary_industry").getByPlaceholder("Search any NAICS code or description…").fill("food service");
    await expect(row(page, "primary_industry")).toContainText("722310");

    await go(page, "/my-business/sell");
    await row(page, "psc_codes").locator(".mb-row__box").click();
    await row(page, "psc_codes").getByText("15 codes").click();
    await expect(row(page, "psc_codes")).toContainText("8940");

    await go(page, "/my-business/business");
    await row(page, "home_address").locator(".mb-row__box").click();
    await page.getByPlaceholder("Start typing your address").fill("201 Hay");
    await expect(row(page, "home_address")).toContainText("201 Hay St, Fayetteville, NC 28301");
  });

  test("Basic Info moves from ready to sent when she sends it, and parts lock while filling", async ({ page }) => {
    // The store is written on the first change, so make one before the test edits it.
    await go(page, "/my-business/business");
    await row(page, "dba_name").locator(".mb-row__box").click();
    await row(page, "dba_name").locator("input").first().fill("Haddad Catering");
    await row(page, "dba_name").getByRole("button", { name: "Save" }).click();
    await expect(row(page, "dba_name")).toContainText("You updated this");
    const setSent = (sentAt: string | null, dropGoal = false) =>
      page.evaluate(
        ([at, drop]) => {
          const key = "gp-demo:v1:myBusiness.state";
          const state = JSON.parse(sessionStorage.getItem(key)!);
          state.intakeSentAt = at;
          state.intakeSentMentor = null;
          if (drop) state.rows = state.rows.filter((r: { fieldKey: string }) => r.fieldKey !== "ninety_day_goal");
          sessionStorage.setItem(key, JSON.stringify(state));
        },
        [sentAt, dropGoal] as const,
      );
    await setSent(null);
    await go(page, "/my-business");
    await page.getByRole("button", { name: /send/i }).first().click();
    await expect(page.locator(".mb-main")).toContainText("Sarah Mitchell");

    await setSent(null, true);
    await page.reload();
    await page.waitForSelector(".mb-shell");
    await expect(page.locator(".mb-rail")).toContainText("Locked until Basic Info is done");
    await go(page, "/my-business/sell");
    await expect(page.locator(".mb-main")).toContainText("opens once Basic Info is done");
  });

  test("Reset demo returns the record to the start", async ({ page }) => {
    await go(page, "/my-business/business");
    await row(page, "dba_name").locator(".mb-row__box").click();
    await row(page, "dba_name").locator("input").first().fill("Test DBA Name");
    await row(page, "dba_name").getByRole("button", { name: "Save" }).click();
    await expect(row(page, "dba_name")).toContainText("Test DBA Name");
    await page.getByRole("button", { name: /Reset demo/ }).first().click();
    await page.locator(".demo-dialog").getByRole("button", { name: /Reset demo/ }).click();
    await page.waitForURL((u) => u.pathname === "/");
    await go(page, "/my-business/business");
    await expect(row(page, "dba_name")).not.toContainText("Test DBA Name");
    await go(page, "/my-business");
    expect(await score(page)).toMatch(/^47 \/ 55/);
  });
});
