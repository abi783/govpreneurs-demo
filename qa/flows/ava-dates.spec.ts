// Ava on another day. The demo counts every date from the day it opens, so
// each bid lands on a different weekday each day: a due date on a Sunday, a
// holiday, a clock change. Each day below opens every Ava page and walks one
// bid, and must show no error, no "NaN", and the same days left as the
// opportunity page.
//
//   QA_PORT=4371 bunx playwright test -c qa/ava.config.ts qa/flows/ava-dates.spec.ts

import { expect, test } from "@playwright/test";
import { BIDS, answerAll, cleanText, open, settleHolds, watch } from "../ava-helpers";

// A spread of days: every weekday, the end of a month, the clock changes of
// November 2026 and March 2027, a leap-year-free February, and the new year.
const DAYS = [
  "2026-10-16T09:00:00",
  "2026-10-17T09:00:00",
  "2026-10-18T09:00:00",
  "2026-10-19T09:00:00",
  "2026-10-20T09:00:00",
  "2026-10-21T09:00:00",
  "2026-10-22T09:00:00",
  "2026-10-31T23:30:00",
  "2026-11-01T01:30:00",
  "2026-11-02T00:10:00",
  "2026-12-31T23:59:00",
  "2027-01-01T00:01:00",
  "2027-02-28T12:00:00",
  "2027-03-13T23:00:00",
  "2027-03-14T03:30:00",
];

test.describe("Ava on other days", () => {
  test.setTimeout(120_000);
  for (const day of DAYS) {
    test(`opens on ${day}`, async ({ page }) => {
      await page.clock.install({ time: new Date(day) });
      const w = watch(page);
      await page.goto("/ava?fast=1");
      await page.waitForLoadState("networkidle");
      const list = await cleanText(page, `day-${day.slice(0, 10)}-list`);
      expect(list).toMatch(/Bids Ava is building/);
      for (const id of Object.values(BIDS)) {
        await open(page, id);
        await cleanText(page, `day-${day.slice(0, 10)}-${id}`);
        // The days left in the header are the days left on the list.
        const header = await page.locator(".ava2-top__days").innerText();
        const left = header.match(/(\d+)/)?.[1];
        expect(list, `${id} on ${day}`).toContain(`${left} days left`);
      }
      expect(w.problems).toEqual([]);
    });
  }

  test("Cumberland walks to the end on a Saturday and on a Monday", async ({ browser }) => {
    for (const day of ["2026-10-17T10:00:00", "2026-10-19T10:00:00"]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.clock.install({ time: new Date(day) });
      const w = watch(page);
      await page.goto(`/ava/${BIDS.cumberland}?fast=1`);
      await page.waitForLoadState("networkidle");
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: /Upload the certificates/i }).click();
      await (
        await chooser
      ).setFiles({ name: "c.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
      await answerAll(page);
      await page.getByRole("button", { name: "Read my bid" }).click();
      await settleHolds(page);
      await cleanText(page, `day-${day.slice(0, 10)}-cumberland-read`);
      expect(w.problems, day).toEqual([]);
      await ctx.close();
    }
  });
});
