// Ava flows, end to end, one per bid. Not part of the crawl: the crawl clicks
// each control once on a fresh page, and cannot walk a flow of many steps.
//
//   QA_PORT=4343 bunx playwright test qa/ava-flow.spec.ts
//
// Each test opens a bid where the story starts it and walks it to its end:
// answer every question (chips, and words typed in the talk box), read the bid,
// download the files, and tell Ava it was sent. It fails on any console error,
// page error, request that leaves the app, or text such as "undefined" and
// "NaN". It checks that a download fires and that the files are real: a PDF
// starts with "%PDF", a Word or Excel file with "PK".

import fs from "node:fs";
import { expect, test, type Download, type Page } from "@playwright/test";

const BAD_TEXT = /\bundefined\b|\bNaN\b|\[object Object\]|something went wrong/i;
const OLD_TEXT =
  /\broof(ing|er)?\b|\bMarcus\b|Diana Potts|\bDEMO-[A-Z]+-\d+|Hay Street (United )?Methodist/i;
const QUIET =
  /not sure|leave it|later|stop working|ask a mentor|i don't have|not yet|take my answer/i;

interface Watch {
  problems: string[];
  downloads: Download[];
}

function watch(page: Page): Watch {
  const w: Watch = { problems: [], downloads: [] };
  page.on("console", (m) => {
    if (m.type() === "error") w.problems.push(`console: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => w.problems.push(`page error: ${e.message.slice(0, 300)}`));
  page.on("download", (d) => w.downloads.push(d));
  page.on("request", (r) => {
    const u = new URL(r.url());
    const local = ["127.0.0.1", "localhost"].includes(u.hostname);
    const inline = /^(data|blob):/.test(u.protocol);
    const fonts = /fonts\.(googleapis|gstatic)\.com/.test(u.hostname);
    if (!local && !inline && !fonts) w.problems.push(`outside request: ${r.url()}`);
  });
  return w;
}

async function noBadText(page: Page, where: string): Promise<void> {
  const text = await page.locator("#demo-main").innerText();
  expect(text, `${where}: bad text`).not.toMatch(BAD_TEXT);
  expect(text, `${where}: old sample text`).not.toMatch(OLD_TEXT);
}

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/ava/${id}?fast=1`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".ava2")).toBeVisible();
}

/** Tick every box in an open dialog and press its main button. */
async function confirmDialog(page: Page): Promise<boolean> {
  const dialog = page.getByRole("dialog");
  if (!(await dialog.isVisible().catch(() => false))) return false;
  for (const box of await dialog.getByRole("checkbox").all()) {
    if (!(await box.isChecked())) await box.check();
  }
  const main = dialog.locator("button.btn-primary:not([disabled])");
  if ((await main.count()) === 0) return false;
  await main.first().click();
  await page.waitForTimeout(150);
  return true;
}

/** Answer questions until Ava says the bid is ready (the "Read my bid" button).
 *  Once, the answer is typed in the talk box instead of tapped. */
async function answerAll(page: Page, typeOnce = false): Promise<number> {
  const ready = page.getByRole("button", { name: "Read my bid" });
  let answered = 0;
  let typed = !typeOnce;
  for (let i = 0; i < 80; i++) {
    if (await ready.isVisible().catch(() => false)) return answered;
    await page.waitForTimeout(150);
    if (await confirmDialog(page)) {
      answered++;
      continue;
    }
    // Boxes to type in (prices, names): fill each empty one, then continue.
    const inputs = page.locator(".ava2-fields input");
    if ((await inputs.count()) > 0) {
      for (const input of await inputs.all()) {
        if (await input.inputValue()) continue;
        // A plausible number for what the box asks for.
        const asks = (
          await input
            .locator("xpath=ancestor::label[1]")
            .innerText()
            .catch(() => "")
        ).toLowerCase();
        await input.fill(
          /meals/.test(asks) ? "400" : /percent|%|contingency|profit/.test(asks) ? "5" : "12",
        );
      }
      const go = page.locator(".ava2-fields button.btn-primary:not([disabled])");
      if ((await go.count()) > 0) {
        await go.first().click();
        answered++;
        continue;
      }
    }
    const area = page.locator(".ava2-talk__scroll .ds-replies").last();
    const buttons = area.locator("button:not([disabled])");
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    if (labels.length === 0) continue;
    // The milestone: leave "Read my bid" for the next step.
    if (labels.includes("Read my bid")) return answered;
    const pick = labels.findIndex((l) => !QUIET.test(l));
    const choice = pick >= 0 ? pick : 0;
    if (!typed && pick >= 0) {
      typed = true;
      const box = page.getByLabel(/Type to Ava/i).first();
      await box.fill(labels[choice]);
      await box.press("Enter");
      await page.waitForTimeout(250);
      answered++;
      continue;
    }
    await buttons.nth(choice).click();
    answered++;
  }
  return answered;
}

/** In her read of the bid, something may still hold the download: a paper to add, or a price to approve
 *  again. Settle each until the download button shows. */
async function settleHolds(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: /Download your (bid|reply)/ });
  for (let i = 0; i < 40; i++) {
    if (await button.isVisible().catch(() => false)) return;
    await page.waitForTimeout(150);
    if (await confirmDialog(page)) continue;
    // A paper: "Add it now", then "Choose a file", then "Yes, that is right".
    const choose = page.getByRole("button", { name: "Choose a file" }).last();
    if (await choose.isVisible().catch(() => false)) {
      const chooser = page.waitForEvent("filechooser");
      await choose.click();
      await (
        await chooser
      ).setFiles({
        name: "paper.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n% a sample paper\n"),
      });
      const yes = page.getByRole("button", { name: /Yes, that is right/ });
      await yes.waitFor({ timeout: 3000 }).catch(() => undefined);
      if (await yes.isVisible().catch(() => false)) await yes.click();
      continue;
    }
    const add = page.getByRole("button", { name: "Add it now" }).first();
    if (await add.isVisible().catch(() => false)) {
      await add.click();
      continue;
    }
    // A price to approve again, or another answer in the chat.
    const replies = page
      .locator(".ava2-read__chat .ds-replies")
      .last()
      .locator("button:not([disabled])");
    const labels = (await replies.allInnerTexts()).map((l) => l.trim());
    const pick = labels.findIndex((l) => /^yes|^approve|^use/i.test(l) && !QUIET.test(l));
    if (pick >= 0) await replies.nth(pick).click();
  }
}

async function download(page: Page, w: Watch): Promise<void> {
  const before = w.downloads.length;
  await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
  await expect.poll(() => w.downloads.length, { timeout: 30_000 }).toBeGreaterThan(before);
  await page.waitForTimeout(1200);
}

async function readAndDownload(page: Page, w: Watch): Promise<void> {
  const read = page.getByRole("button", { name: "Read my bid" });
  await expect(read).toBeVisible();
  await read.click();
  await settleHolds(page);
  await expect(page.getByRole("button", { name: /Download your (bid|reply)/ })).toBeVisible();
  // Every part of the bid opens.
  for (const tab of await page.locator(".ava2-tabs [role=tab]").all()) {
    await tab.click();
    await page.waitForTimeout(80);
  }
  await download(page, w);
}

async function checkFiles(w: Watch): Promise<void> {
  expect(w.downloads.length).toBeGreaterThan(0);
  for (const d of w.downloads) {
    const path = await d.path();
    const head = fs.readFileSync(path).subarray(0, 4).toString("latin1");
    const name = d.suggestedFilename();
    if (/\.pdf$/i.test(name)) expect(head, name).toBe("%PDF");
    else if (/\.(docx|xlsx)$/i.test(name)) expect(head.slice(0, 2), name).toBe("PK");
    expect(fs.statSync(path).size, name).toBeGreaterThan(800);
  }
}

async function sendIt(page: Page): Promise<void> {
  const sent = page.getByRole("button", { name: "I sent it" });
  await sent.scrollIntoViewIfNeeded();
  await expect(sent).toBeEnabled();
  await sent.click();
  await expect(page.getByText(/You told Ava you sent it/)).toBeVisible();
}

test.describe("Ava, one full flow per bid", () => {
  test("Camp Mackall field meals: answer, check, read, download, send", async ({ page }) => {
    const w = watch(page);
    await open(page, "SP4701-26-Q-0021");
    await expect(page.getByText("Answer Ava's questions").first()).toBeVisible();
    await noBadText(page, "mackall start");
    expect(await answerAll(page, true)).toBeGreaterThanOrEqual(3);
    await noBadText(page, "mackall ready");
    await readAndDownload(page, w);
    await checkFiles(w);
    await sendIt(page);
    await noBadText(page, "mackall sent");
    expect(w.problems).toEqual([]);
  });

  test("Fayetteville cafe: Sarah's review, read, download, send", async ({ page }) => {
    const w = watch(page);
    await open(page, "FAYNC-2026-R-08");
    const review = page.getByRole("link", { name: /Read Sarah Mitchell's review/ });
    await expect(review).toBeVisible();
    await expect(review).toHaveAttribute("href", /\/mentors\/rev-fayetteville-proposal/);
    await noBadText(page, "fayetteville start");
    await expect(page.locator(".ava2-tabs [role=tab]").first()).toBeVisible();
    for (const tab of await page.locator(".ava2-tabs [role=tab]").all()) {
      await tab.click();
      await page.waitForTimeout(80);
    }
    await download(page, w);
    await checkFiles(w);
    await sendIt(page);
    await noBadText(page, "fayetteville sent");
    expect(w.problems).toEqual([]);
  });

  test("Cumberland detention meals: paused, upload the certificates, build, read, download, send", async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, "CUMCO-2026-014");
    await expect(page.getByText(/3 of 5/).first()).toBeVisible();
    await noBadText(page, "cumberland paused");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Upload the certificates/i }).click();
    await (
      await chooser
    ).setFiles({
      name: "Food-handler-certificates.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% a sample certificate\n"),
    });
    await expect(page.getByRole("button", { name: /Upload the certificates/i })).toHaveCount(0);
    await answerAll(page, true);
    await noBadText(page, "cumberland ready");
    await readAndDownload(page, w);
    await checkFiles(w);
    await sendIt(page);
    expect(w.problems).toEqual([]);
  });

  test("Fort Bragg sources-sought reply: read, download, send", async ({ page }) => {
    const w = watch(page);
    await open(page, "W912EE-27-S-0004");
    await noBadText(page, "reply start");
    await readAndDownload(page, w);
    await checkFiles(w);
    await sendIt(page);
    await noBadText(page, "reply sent");
    expect(w.problems).toEqual([]);
  });

  test("a bid keeps what she did after a reload, and Reset demo starts it again", async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, "W912EE-27-S-0004");
    await page.getByRole("button", { name: "Read my bid" }).click();
    await expect(page.locator(".ava2-tabs [role=tab]").first()).toBeVisible();
    await page.reload();
    await expect(page.locator(".ava2-tabs [role=tab]").first()).toBeVisible();
    await page.getByRole("button", { name: "Reset demo" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).click();
    await page.waitForURL(/\/(\?|$)/);
    await open(page, "W912EE-27-S-0004");
    await expect(page.getByRole("button", { name: "Read my bid" })).toBeVisible();
    expect(w.problems).toEqual([]);
  });

  test("the prototype controls stay hidden until Shift+Alt+A", async ({ page }) => {
    await open(page, "SP4701-26-Q-0021");
    await expect(page.locator(".ava-demo")).toHaveCount(0);
    await page.keyboard.press("Shift+Alt+KeyA");
    await expect(page.locator(".ava-demo")).toHaveCount(1);
    await page.keyboard.press("Shift+Alt+KeyA");
    await expect(page.locator(".ava-demo")).toHaveCount(0);
  });

  test("an opportunity Ava has not read shows her handoff, and a bad number is not found", async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, "RCSC-2026-09");
    await expect(page.getByText(/I need the county's files first. Public Schools/)).toBeVisible();
    const chooser = page.waitForEvent("filechooser");
    await page.getByText(/Add the county's files/).click();
    await (
      await chooser
    ).setFiles({
      name: "IFB.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nx\n"),
    });
    await expect(page.getByText(/I am reading 1 file now/)).toBeVisible();
    await page.getByRole("button", { name: "Tell me when you are ready" }).click();
    await expect(page.getByText(/I will tell you here/)).toBeVisible();
    await page.goto("/ava/NOT-A-BID-123?fast=1");
    await expect(page.getByRole("heading", { name: "Ava cannot find this bid" })).toBeVisible();
    await page.getByRole("link", { name: "See the bids Ava is building" }).click();
    await expect(page.getByRole("heading", { name: "Bids Ava is building" })).toBeVisible();
    expect(w.problems.filter((p) => !/unhandled API call/.test(p))).toEqual([]);
  });
});
