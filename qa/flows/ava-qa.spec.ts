// Ava's QA for a live sales call. Not part of the crawl.
//
//   bunx vite build --outDir .qa-dist/4371 --emptyOutDir
//   bunx vite preview --outDir .qa-dist/4371 --port 4371 --strictPort &
//   QA_PORT=4371 bunx playwright test -c qa/ava.config.ts qa/flows/ava-qa.spec.ts
//
// Each test walks one path to its end, writes the visible text of every state
// to qa/report/text/ava-*.txt, and fails on a console warning or error, a page
// error, a request that leaves the app, and text that must not show.

import { expect, test, type Page } from "@playwright/test";
import {
  BIDS,
  answerAll,
  cleanText,
  confirmDialog,
  dump,
  expectValidFiles,
  filesOf,
  inputReachable,
  layoutProblems,
  open,
  saveDownloads,
  settleHolds,
  watch,
} from "../ava-helpers";

/** Open the checklist rail (the menu button on the left) and read it. */
async function openRail(page: Page): Promise<void> {
  const fold = page.getByRole("button", { name: /^Fold: What the / });
  if (!(await fold.isVisible().catch(() => false)))
    await page.getByRole("button", { name: /^Open: What the / }).click();
  await expect(fold).toBeVisible();
}

/** Show every earlier message in the chat. */
async function showEarlier(page: Page): Promise<void> {
  const more = page.locator(".ava2-earlier");
  if (await more.isVisible().catch(() => false)) await more.click();
}

test.describe("Ava tours (text dumps)", () => {
  for (const [name, id] of Object.entries(BIDS)) {
    test(`${name}: first screen, chat, rail`, async ({ page }) => {
      const w = watch(page);
      await open(page, id);
      await showEarlier(page);
      await cleanText(page, `${name}-start-full-chat`);
      await openRail(page);
      await cleanText(page, `${name}-start-rail`);
      expect(w.problems).toEqual([]);
    });
  }

  test("mackall: walk with chips, then read, tabs, download, send", async ({ page }) => {
    const w = watch(page);
    await open(page, BIDS.mackall);
    const steps = await answerAll(page, { typeEvery: 2 });
    console.log("mackall steps", JSON.stringify(steps, null, 1));
    await showEarlier(page);
    await cleanText(page, "mackall-ready-full-chat");
    await page.getByRole("button", { name: "Read my bid" }).click();
    await cleanText(page, "mackall-read");
    await settleHolds(page);
    for (const [i, tab] of (await page.locator(".ava2-tabs [role=tab]").all()).entries()) {
      await tab.click();
      await page.waitForTimeout(100);
      await cleanText(page, `mackall-tab-${i}`);
    }
    await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
    await expect.poll(() => w.downloads.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    expectValidFiles(await filesOf(w));
    await saveDownloads(w, "mackall");
    await cleanText(page, "mackall-sent-step");
    expect(w.problems).toEqual([]);
  });

  test("fayetteville: read, tabs, download, send", async ({ page }) => {
    const w = watch(page);
    await open(page, BIDS.fayetteville);
    for (const [i, tab] of (await page.locator(".ava2-tabs [role=tab]").all()).entries()) {
      await tab.click();
      await page.waitForTimeout(100);
      await cleanText(page, `fayetteville-tab-${i}`);
    }
    await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
    await expect.poll(() => w.downloads.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    expectValidFiles(await filesOf(w));
    await saveDownloads(w, "fayetteville");
    await cleanText(page, "fayetteville-sent-step");
    expect(w.problems).toEqual([]);
  });

  test("cumberland: paused, upload, walk, read, download", async ({ page }) => {
    const w = watch(page);
    await open(page, BIDS.cumberland);
    await showEarlier(page);
    await cleanText(page, "cumberland-paused-full-chat");
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
    await cleanText(page, "cumberland-after-upload");
    const steps = await answerAll(page, { typeEvery: 3 });
    console.log("cumberland steps", JSON.stringify(steps, null, 1));
    await showEarlier(page);
    await cleanText(page, "cumberland-ready-full-chat");
    await page.getByRole("button", { name: "Read my bid" }).click();
    await settleHolds(page);
    for (const [i, tab] of (await page.locator(".ava2-tabs [role=tab]").all()).entries()) {
      await tab.click();
      await page.waitForTimeout(100);
      await cleanText(page, `cumberland-tab-${i}`);
    }
    await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
    await expect.poll(() => w.downloads.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    expectValidFiles(await filesOf(w));
    await saveDownloads(w, "cumberland");
    await cleanText(page, "cumberland-sent-step");
    expect(w.problems).toEqual([]);
  });

  test("reply: read, tabs, download, send", async ({ page }) => {
    const w = watch(page);
    await open(page, BIDS.reply);
    await showEarlier(page);
    await cleanText(page, "reply-full-chat");
    await page.getByRole("button", { name: "Read my bid" }).click();
    await settleHolds(page);
    for (const [i, tab] of (await page.locator(".ava2-tabs [role=tab]").all()).entries()) {
      await tab.click();
      await page.waitForTimeout(100);
      await cleanText(page, `reply-tab-${i}`);
    }
    await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
    await expect.poll(() => w.downloads.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    expectValidFiles(await filesOf(w));
    await saveDownloads(w, "reply");
    await cleanText(page, "reply-sent-step");
    await dump(page, "reply-final");
    expect(w.problems).toEqual([]);
    void confirmDialog;
  });
});


// ─── Layout at four widths ───

const WIDTHS = [1024, 1280, 1440, 1920] as const;

for (const width of WIDTHS) {
  test.describe(`layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    const states: { name: string; go: (page: Page) => Promise<void> }[] = [
      { name: "list", go: (p) => p.goto("/ava?fast=1").then(() => undefined) },
      { name: "mackall questions", go: (p) => open(p, BIDS.mackall) },
      { name: "fayetteville read", go: (p) => open(p, BIDS.fayetteville) },
      { name: "cumberland paused", go: (p) => open(p, BIDS.cumberland) },
      { name: "reply ready", go: (p) => open(p, BIDS.reply) },
      {
        name: "reply read",
        go: async (p) => {
          await open(p, BIDS.reply);
          await p.getByRole("button", { name: "Read my bid" }).click();
          await expect(p.locator(".ava2-tabs [role=tab]").first()).toBeVisible();
        },
      },
      { name: "handoff federal", go: (p) => open(p, "W912PM-26-Q-0017") },
      { name: "handoff county", go: (p) => open(p, "RCSC-2026-09") },
      { name: "no bid", go: (p) => open(p, "SP4701-26-R-0078") },
      { name: "not found", go: (p) => p.goto("/ava/NOT-A-BID-123?fast=1").then(() => undefined) },
    ];

    for (const st of states) {
      test(st.name, async ({ page }) => {
        const w = watch(page);
        await st.go(page);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(300);
        expect(await layoutProblems(page), `${st.name} at ${width}`).toEqual([]);
        if (!/list|not found|no bid/.test(st.name))
          expect(
            await inputReachable(page, { scroll: width < 1100 && /read/.test(st.name) }),
            `${st.name} at ${width}`,
          ).toBeNull();
        expect(w.problems).toEqual([]);
      });
    }
  });
}


// ─── State persists across a reload, and Reset demo restores the start ───

/** What a person sees of the bid's state: the count on the checklist strip, the days left, the step. */
async function stateOf(page: Page): Promise<string> {
  const count = await page.locator(".ds-rail__count").first().innerText().catch(() => "");
  const status = await page.locator('.ava2-stepbar .sr-only').first().innerText().catch(() => "");
  const tabs = await page.locator(".ava2-tabs [role=tab]").allInnerTexts();
  const tail = (await page.locator(".ava2-talk__scroll").innerText().catch(() => ""))
    .split("\n")
    .filter(Boolean)
    .slice(-6)
    .join(" / ");
  return JSON.stringify({ count, status, tabs, tail });
}

test.describe("reload keeps the state", () => {
  test("mackall: after every answer, a reload shows the same state", async ({ page }) => {
    const w = watch(page);
    await open(page, BIDS.mackall);
    let before = await stateOf(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(await stateOf(page), "reload before any answer").toBe(before);
    for (let i = 0; i < 12; i++) {
      if (await page.getByRole("button", { name: "Read my bid" }).isVisible().catch(() => false)) break;
      await answerAll(page, { max: 2 });
      await page.waitForTimeout(250);
      before = await stateOf(page);
      await page.reload();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(250);
      expect(await stateOf(page), `reload after answer ${i + 1}`).toBe(before);
    }
    // Phase 2: the read, the download, the send.
    await page.getByRole("button", { name: "Read my bid" }).click();
    await settleHolds(page);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /Download your (bid|reply)/ })).toBeVisible();
    await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
    await expect.poll(() => w.downloads.length, { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1200);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/You downloaded your whole bid on/)).toBeVisible();
    const sent = page.getByRole("button", { name: "I sent it" });
    await sent.scrollIntoViewIfNeeded();
    await sent.click();
    await expect(page.getByText(/You told Ava you sent it/)).toBeVisible();
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/You told Ava you sent it/)).toBeVisible();
    expect(w.problems).toEqual([]);
  });

  test("Reset demo puts every bid back exactly as it started", async ({ page }) => {
    const w = watch(page);
    const ids = [...Object.values(BIDS), "W912PM-26-Q-0017", "RCSC-2026-09"];
    const first: Record<string, string> = {};
    for (const id of ["list", ...ids]) {
      await page.goto(id === "list" ? "/ava?fast=1" : `/ava/${id}?fast=1`);
      await page.waitForLoadState("networkidle");
      first[id] = await page.locator("#demo-main").innerText();
    }
    // Change a lot: answer, download, send, ask the mentor, add files, open the rail.
    await open(page, BIDS.mackall);
    await answerAll(page);
    await page.getByRole("button", { name: /Build with a mentor|Review with a mentor/ }).first().click();
    await page.getByRole("button", { name: /Send for/ }).click();
    await page.getByRole("button", { name: "Done" }).click({ delay: 800 });
    await openRail(page);
    await open(page, BIDS.reply);
    await page.getByRole("button", { name: "Read my bid" }).click();
    await page.getByRole("button", { name: /Download your (bid|reply)/ }).click();
    await page.waitForTimeout(1200);
    const sent = page.getByRole("button", { name: "I sent it" });
    await sent.scrollIntoViewIfNeeded();
    await sent.click();
    await open(page, BIDS.cumberland);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Upload the certificates/i }).click();
    await (
      await chooser
    ).setFiles({ name: "c.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
    await open(page, "W912PM-26-Q-0017");
    await page.getByRole("button", { name: "Tell me when you are ready" }).click();
    await open(page, "RCSC-2026-09");
    const c2 = page.waitForEvent("filechooser");
    await page.getByText(/Add the county's files/).click();
    await (await c2).setFiles({ name: "IFB.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
    await page.goto("/ava?fast=1");
    await expect(page.locator(".ava-idx__card")).toHaveCount(6);
    // Reset.
    await page.getByRole("button", { name: "Reset demo" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).click();
    await page.waitForURL(/\/(\?|$)/);
    for (const id of ["list", ...ids]) {
      await page.goto(id === "list" ? "/ava?fast=1" : `/ava/${id}?fast=1`);
      await page.waitForLoadState("networkidle");
      expect(await page.locator("#demo-main").innerText(), `after reset: ${id}`).toBe(first[id]);
    }
    expect(w.problems).toEqual([]);
  });
});
