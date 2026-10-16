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
  const count = await page
    .locator(".ds-rail__count")
    .first()
    .innerText()
    .catch(() => "");
  const status = await page
    .locator(".ava2-stepbar .sr-only")
    .first()
    .innerText()
    .catch(() => "");
  const tabs = await page.locator(".ava2-tabs [role=tab]").allInnerTexts();
  const tail = (
    await page
      .locator(".ava2-talk__scroll")
      .innerText()
      .catch(() => "")
  )
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
      if (
        await page
          .getByRole("button", { name: "Read my bid" })
          .isVisible()
          .catch(() => false)
      )
        break;
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
    await page
      .getByRole("button", { name: /Build with a mentor|Review with a mentor/ })
      .first()
      .click();
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
    await (
      await c2
    ).setFiles({ name: "IFB.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
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

// ─── Every way into Ava lands on the right bid ───

const TITLES: Record<string, RegExp> = {
  "SP4701-26-Q-0021": /Camp Mackall/,
  "FAYNC-2026-R-08": /Employee Cafe and Event Catering/,
  "CUMCO-2026-014": /Inmate Meal Services/,
  "W912EE-27-S-0004": /Sources Sought/,
  "W912PM-26-Q-0017": /Ceremony and Official Function Catering/,
  "RCSC-2026-09": /Cafeteria Food Service/,
};

async function landedOn(page: Page, id: string): Promise<void> {
  await expect(page, `landed on ${id}`).toHaveURL(new RegExp(`/ava/${id}`));
  await expect(page.locator(".ava2-top h1")).toHaveText(TITLES[id]);
}

test.describe("ways into Ava", () => {
  test("the opportunity page button opens each bid", async ({ page }) => {
    const w = watch(page);
    for (const id of Object.keys(TITLES)) {
      await page.goto(`/opportunities/${id}?fast=1`);
      await page.waitForLoadState("networkidle");
      const intro = page.getByRole("button", { name: /Show me the analysis/ });
      if (await intro.isVisible().catch(() => false)) await intro.click();
      const way = /Build (this bid|the bid|the quote) with Ava|Open (your|the) reply with Ava/i;
      const go = page.getByRole("button", { name: way }).or(page.getByRole("link", { name: way }));
      await expect(go.first(), `a way into Ava on ${id}`).toBeVisible();
      await go.first().click();
      await landedOn(page, id);
    }
    expect(w.problems).toEqual([]);
  });

  test("Grant's next move opens the bid", async ({ page }) => {
    const w = watch(page);
    for (const [id, label] of [
      ["SP4701-26-Q-0021", /Build the quote with Ava/],
      ["CUMCO-2026-014", /with Ava|Ava/],
    ] as const) {
      await page.goto(`/opportunities/${id}?fast=1`);
      await page.waitForLoadState("networkidle");
      const intro = page.getByRole("button", { name: /Show me the analysis/ });
      if (await intro.isVisible().catch(() => false)) await intro.click();
      const next = page
        .getByRole("button", { name: label })
        .or(page.getByRole("link", { name: label }));
      await next.last().scrollIntoViewIfNeeded();
      await next.last().click();
      await landedOn(page, id);
    }
    expect(w.problems).toEqual([]);
  });

  test("the Pipeline tags and next moves open the bid, with the same days left", async ({
    page,
  }) => {
    const w = watch(page);
    const ids = ["FAYNC-2026-R-08", "CUMCO-2026-014", "SP4701-26-Q-0021", "W912EE-27-S-0004"];
    for (const id of ids) {
      await page.goto("/pipeline?fast=1");
      await page.waitForLoadState("networkidle");
      const tag = page.locator(`a[href="/ava/${id}"]`).first();
      const card = tag.locator("xpath=ancestor::*[contains(., 'days left')][1]");
      const days = (await card.innerText()).match(/(\d+) days? left/)?.[1];
      await tag.click();
      await landedOn(page, id);
      expect(await page.locator(".ava2-top__days").innerText(), `days left on ${id}`).toContain(
        days!,
      );
    }
    expect(w.problems).toEqual([]);
  });

  test("Tasks and Success Center open the bid", async ({ page }) => {
    const w = watch(page);
    for (const route of ["/tasks", "/"]) {
      await page.goto(`${route}?fast=1`);
      await page.waitForLoadState("networkidle");
      const hrefs = await page
        .locator('#demo-main a[href^="/ava/"]')
        .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!))]);
      expect(hrefs.length, `Ava links on ${route}`).toBeGreaterThan(0);
      for (const href of hrefs) {
        await page.goto(`${route}?fast=1`);
        await page.waitForLoadState("networkidle");
        await page.locator(`#demo-main a[href="${href}"]`).first().click();
        await landedOn(page, href.replace("/ava/", ""));
      }
    }
    expect(w.problems).toEqual([]);
  });

  test("the list card opens the bid, and the menu opens the list", async ({ page }) => {
    const w = watch(page);
    await page.goto("/?fast=1");
    await page.getByRole("link", { name: "Ava", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bids Ava is building" })).toBeVisible();
    const cards = page.locator(".ava-idx__card");
    await expect(cards).toHaveCount(4);
    for (const id of [
      "FAYNC-2026-R-08",
      "CUMCO-2026-014",
      "SP4701-26-Q-0021",
      "W912EE-27-S-0004",
    ]) {
      await page.goto("/ava?fast=1");
      await page.locator(".ava-idx__card", { hasText: id }).click();
      await landedOn(page, id);
    }
    expect(w.problems).toEqual([]);
  });
});

// ─── The mentor button ───

async function walletBalance(page: Page): Promise<string> {
  await page.goto("/wallet?fast=1");
  await page.waitForLoadState("networkidle");
  const text = await page.locator("#demo-main").innerText();
  return text.match(/\$[0-9,]+\.\d\d/)![0];
}

test.describe("the mentor button", () => {
  test.setTimeout(60_000);
  test("a double press sends one $97 review; the review shows in Mentors; the button reads that Sarah is reviewing", async ({
    page,
  }) => {
    const w = watch(page);
    expect(await walletBalance(page)).toBe("$306.00");
    await open(page, BIDS.mackall);
    await page.getByRole("button", { name: "Build with a mentor" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Send to Sarah Mitchell")).toBeVisible();
    await expect(dialog).toContainText("$97.00");
    await expect(dialog).toContainText("Your wallet has $306.00");
    await dialog.getByRole("button", { name: "Send for $97.00" }).dblclick();
    // The receipt stays on screen: the second press must not close it.
    await page.waitForTimeout(300);
    await expect(dialog).toContainText("Sent to Sarah Mitchell.");
    await expect(dialog).toContainText("$97.00 was charged to your wallet.");
    await page.waitForTimeout(600);
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toHaveCount(0);
    const sarah = page.getByRole("link", { name: "Sarah is reviewing" });
    await expect(sarah).toBeVisible();
    await expect(page.getByRole("button", { name: /Build with a mentor/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("link", { name: "Sarah is reviewing" })).toBeVisible();
    expect(await walletBalance(page)).toBe("$209.00");
    await page.goto("/mentors?fast=1");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Review my bid: Field Feeding Support").first()).toBeVisible();
    expect(
      await page.getByText("Review my bid: Field Feeding Support").count(),
      "one review, once in the list and once in the thread",
    ).toBeLessThanOrEqual(2);
    // The link on the Ava page opens that review.
    await open(page, BIDS.mackall);
    await page.getByRole("link", { name: "Sarah is reviewing" }).click();
    await expect(page).toHaveURL(/\/mentors\/rev-/);
    expect(w.problems).toEqual([]);
  });

  test("phase 2 and the paused bid send the same way, once each", async ({ page }) => {
    const w = watch(page);
    // Phase 2: the card in the chat.
    await open(page, BIDS.reply);
    await page.getByRole("button", { name: "Read my bid" }).click();
    await page.getByRole("button", { name: /Send to (a mentor|Sarah)/ }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Send for $97.00" }).dblclick();
    await page.waitForTimeout(900);
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("link", { name: "Sarah is reviewing" })).toBeVisible();
    // The paused bid.
    await open(page, BIDS.cumberland);
    await page.getByRole("button", { name: /Ask a mentor/ }).click();
    const d2 = page.getByRole("dialog");
    await expect(d2).toContainText("The rule you cannot meet");
    await d2.getByRole("button", { name: "Send for $97.00" }).dblclick();
    await page.waitForTimeout(900);
    await d2.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText(/With Sarah since/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Ask a mentor/ })).toHaveCount(0);
    expect(await walletBalance(page)).toBe("$112.00");
    expect(w.problems).toEqual([]);
  });
});

// ─── The prototype controls ───

test.describe("prototype controls", () => {
  test("are hidden in a fresh session, on every Ava page, and Shift+Alt+A shows and hides them", async ({
    page,
  }) => {
    const w = watch(page);
    for (const route of [
      "/ava",
      ...Object.values(BIDS).map((id) => `/ava/${id}`),
      "/ava/W912PM-26-Q-0017",
      "/ava/RCSC-2026-09",
      "/ava/SP4701-26-R-0078",
      "/ava/NOT-A-BID-123",
    ]) {
      await page.goto(`${route}?fast=1`);
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".ava-demo"), `controls on ${route}`).toHaveCount(0);
      await expect(page.getByText(/Prototype controls/i)).toHaveCount(0);
    }
    await open(page, BIDS.mackall);
    await page.keyboard.press("Shift+Alt+KeyA");
    await expect(page.locator(".ava-demo")).toHaveCount(1);
    await page.reload();
    await expect(page.locator(".ava-demo"), "the choice survives a reload").toHaveCount(1);
    await page.getByRole("button", { name: "Reset demo" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset demo" }).click();
    await page.waitForURL(/\/(\?|$)/);
    await open(page, BIDS.mackall);
    await expect(page.locator(".ava-demo"), "Reset demo hides them again").toHaveCount(0);
    expect(w.problems).toEqual([]);
  });
});

import { CASES } from "../../src/lib/ava/cases";

test.describe("prototype screens open without a problem", () => {
  test.setTimeout(120_000);
  const chunks = 4;
  for (let k = 0; k < chunks; k++) {
    test(`screens, part ${k + 1} of ${chunks}`, async ({ page }) => {
      const w = watch(page);
      const mine = CASES.filter((_, i) => i % chunks === k);
      for (const c of mine) {
        await page.goto(`/ava/${c.noticeId}?case=${c.id}&fast=1`);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(250);
        const text = await cleanText(page, `case-${c.id}`);
        expect(text.trim().length, `${c.id} is not empty`).toBeGreaterThan(40);
        expect(w.problems, `after ${c.id}`).toEqual([]);
      }
    });
  }
});

// ─── Odd text in the boxes and the talk box ───

test.describe("odd text", () => {
  test.setTimeout(90_000);

  /** Walk Cumberland, after the certificates, to the next box that asks for one thing. */
  async function toBox(page: Page, label: RegExp): Promise<void> {
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Upload the certificates/i }).click();
    await (
      await chooser
    ).setFiles({ name: "c.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(120);
      if (await confirmDialog(page)) continue;
      const inputs = page.locator(".ava2-fields input");
      if ((await inputs.count()) > 0) {
        const first = await inputs.first().locator("xpath=ancestor::label[1]").innerText();
        if (label.test(first)) return;
        for (const input of await inputs.all()) {
          const asks = (await input.locator("xpath=ancestor::label[1]").innerText()).toLowerCase();
          await input.fill(
            /meals/.test(asks)
              ? "400"
              : /email/.test(asks)
                ? "ref@example.com"
                : /phone/.test(asks)
                  ? "(910) 555-0100"
                  : /percent|%|contingency|profit/.test(asks)
                    ? "5"
                    : "Dana Reyes",
          );
        }
        await page.locator(".ava2-fields button.btn-primary:not([disabled])").first().click();
        continue;
      }
      const buttons = page
        .locator(".ava2-talk__scroll .ds-replies")
        .last()
        .locator("button:not([disabled])");
      const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
      if (labels.length === 0) continue;
      const pick = labels.findIndex((l) => !QUIET_WORDS.test(l));
      await buttons.nth(Math.max(pick, 0)).click();
    }
    throw new Error(`never reached the box ${label}`);
  }
  const QUIET_WORDS = /not sure|not yet|I can't|No, I can't|Stop|Ask a mentor|See Grant|Take my/i;

  test("a box that asks for a number refuses words, minus signs and huge numbers", async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, BIDS.cumberland);
    await toBox(page, /Contingency/i);
    const box = page.locator(".ava2-fields input").first();
    for (const bad of ["abc", "-5", "1e9", "5.5.5", "🙂", "101", "99999999999999999999", "five"]) {
      await box.fill(bad);
      await expect(
        page.getByRole("alert").filter({ hasText: "needs a number" }),
        bad,
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Save it" }), bad).toHaveCount(0);
    }
    // The talk box takes numbers only, too, and says what the box needs.
    const talk = page.getByLabel(/Type to Ava/i).first();
    await talk.fill("lots");
    await talk.press("Enter");
    await expect(page.getByText(/needs a number, like 5\./).last()).toBeVisible();
    await box.fill("5%");
    await page.getByRole("button", { name: "Save it" }).click();
    await expect(page.getByText(/Profit, as a percent/)).toBeVisible();
    await cleanText(page, "odd-numbers");
    expect(w.problems).toEqual([]);
  });

  test("a phone box and an email box refuse a bare number", async ({ page }) => {
    const w = watch(page);
    await open(page, BIDS.cumberland);
    await toBox(page, /Meals a day at Womack/i);
    const inputs = page.locator(".ava2-fields input");
    for (const input of await inputs.all()) await input.fill("12");
    await expect(page.getByRole("alert").first()).toContainText(/needs/);
    const text = await page.locator(".ava2-fields").innerText();
    expect(text).toMatch(/phone number|email address/);
    await expect(page.getByRole("button", { name: "Save it" })).toHaveCount(0);
    expect(w.problems).toEqual([]);
  });

  test("odd words in the talk box on a question with answers: empty, emoji, numbers, 2,000 characters", async ({
    page,
  }) => {
    const w = watch(page);
    await open(page, BIDS.mackall);
    const talk = page.getByLabel(/Type to Ava/i).first();
    const long = "word ".repeat(400).trim();
    for (const t of [
      "",
      "   ",
      "🙂🙂🙂",
      "12345",
      "$%^&*<script>alert(1)</script>",
      "x".repeat(2000),
      long,
    ]) {
      await talk.fill(t);
      await talk.press("Enter");
      await page.waitForTimeout(120);
    }
    const text = await cleanText(page, "odd-talk");
    expect(text).toContain("I cannot use words for this question yet");
    expect(await layoutProblems(page)).toEqual([]);
    // The question is still there, and an answer typed in words still works.
    await talk.fill("they apply after award");
    await talk.press("Enter");
    await expect(page.getByText(/If you win, you promise this/).last()).toBeVisible();
    expect(w.problems).toEqual([]);
  });
});
