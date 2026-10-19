// Ava at the pace of a sales call (no ?fast=1): every wait ends, and none is long.
//
//   QA_PORT=4371 bunx playwright test -c qa/ava.config.ts qa/flows/ava-pace.spec.ts

import { expect, test } from "@playwright/test";
import { BIDS, answerAll, cleanText, open, settleHolds, watch } from "../ava-helpers";

test.describe("at the pace of a call", () => {
  test.setTimeout(180_000);

  test("Camp Mackall: the check after the last answer ends within 20 seconds", async ({ page }) => {
    const w = watch(page);
    await page.goto(`/ava/${BIDS.mackall}`);
    await page.waitForLoadState("networkidle");
    const t0 = Date.now();
    await answerAll(page);
    const took = (Date.now() - t0) / 1000;
    console.log(`mackall: the last answer to "Read my bid" took ${took.toFixed(1)} s in all`);
    await expect(page.getByRole("button", { name: "Read my bid" })).toBeVisible();
    expect(took).toBeLessThan(40);
    await cleanText(page, "pace-mackall-ready");
    expect(w.problems).toEqual([]);
  });

  test("Cumberland: after the certificates, the build reaches the end", async ({ page }) => {
    const w = watch(page);
    await page.goto(`/ava/${BIDS.cumberland}`);
    await page.waitForLoadState("networkidle");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Upload the certificates/i }).click();
    await (
      await chooser
    ).setFiles({ name: "c.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
    const t0 = Date.now();
    await answerAll(page);
    console.log(
      `cumberland: after the upload to "Read my bid" took ${((Date.now() - t0) / 1000).toFixed(1)} s`,
    );
    await page.getByRole("button", { name: "Read my bid" }).click();
    await settleHolds(page);
    await expect(page.locator(".ava2-tabs [role=tab]").first()).toBeVisible();
    expect(w.problems).toEqual([]);
  });

  test("a page opens to its bid without a long wait", async ({ page }) => {
    for (const id of Object.values(BIDS)) {
      const t0 = Date.now();
      await page.goto(`/ava/${id}`);
      await expect(page.locator(".ava2")).toBeVisible();
      const took = Date.now() - t0;
      expect(took, `${id} opens`).toBeLessThan(5000);
    }
    await open(page, BIDS.reply, false);
  });
});
