// Hunter flow test. Not part of the crawl. It drives /opportunities like a visitor:
//   - types 5 chat questions and checks the reply, the card on the stage and the feed
//   - clicks 3 buttons (one starter, two follow-ups)
//   - applies 3 filters in the drawer and checks that the feed agrees with the drawer
//   - opens the other tabs, changes the buyer lane, sorts, saves a card and a search
//   - checks that no error, no unhandled call and no bad text appears
//
//   QA_PORT=4341 bunx playwright test qa/hunter-flow.spec.ts

import { expect, test, type Page } from "@playwright/test";

test.use({ actionTimeout: 10_000 });

const BAD =
  /something went wrong|undefined|\bNaN\b|\[object Object\]|roof|marcus|williams construction|238160/i;

/** The count in the header. It rolls up like a ticker, so read it with `expect.poll`. */
async function feedCount(page: Page): Promise<number> {
  const text = (await page.locator(".opps-summary__count").first().innerText()).trim();
  return Number(text.match(/^\d+/)?.[0] ?? NaN);
}

async function cardCount(page: Page): Promise<number> {
  return page.locator(".opp-title-compact").count();
}

async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() => (window.__DEMO_INFLIGHT__ ?? 0) === 0);
  await page.waitForTimeout(450);
}

/** The newest reply, once the typewriter has finished writing it. */
async function fullReply(page: Page): Promise<string> {
  const last = page.locator(".hunter-bubble.from-hunter").last();
  let prev = "";
  for (let i = 0; i < 30; i += 1) {
    const now = await last.innerText();
    if (now === prev && now.length > 0) return now;
    prev = now;
    await page.waitForTimeout(350);
  }
  return prev;
}

async function say(page: Page, text: string): Promise<string> {
  const before = await page.locator(".hunter-bubble.from-hunter").count();
  await page.fill('textarea[placeholder^="Ask Hunter"]', text);
  await page.keyboard.press("Enter");
  await expect(page.locator(".hunter-bubble.from-hunter")).toHaveCount(before + 1);
  await settle(page);
  const reply = await fullReply(page);
  expect(reply, text).not.toMatch(BAD);
  expect(reply, text).not.toMatch(/not sure what you mean/);
  return reply;
}

test("Hunter: chat, chips, filters, tabs and saves work with no error", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

  await page.goto("/opportunities?fast=1");
  await expect(page.locator(".opp-title-compact").first()).toBeVisible();
  await settle(page);
  await expect.poll(() => feedCount(page)).toBe(14);

  // ── Three buttons: a starter, then two follow-ups ─────────────────────────
  await page.locator(".hunter-suggestion-chip").first().click(); // Why does the ... match me?
  await expect(page.locator(".hunter-bubble.from-hunter")).toHaveCount(2);
  await settle(page);
  await expect(page.locator(".stage-card")).toBeVisible();
  await expect(page.locator(".hunter-bubble.from-hunter").last()).toContainText("722310");
  await expect(page.locator(".hunter-bubble.from-hunter").last()).toContainText("45 miles");

  await page.locator(".hunter-suggestion-chip").first().click(); // Am I ready to bid the ...?
  await expect(page.locator(".hunter-bubble.from-hunter")).toHaveCount(3);
  await settle(page);
  await expect(page.locator(".scorecard")).toBeVisible();
  await expect(page.locator(".hunter-act")).toHaveCount(0); // the act card shows in the thread, not here

  await page.locator(".hunter-suggestion-chip").nth(1).click(); // Compare my top 3
  await expect(page.locator(".hunter-bubble.from-hunter")).toHaveCount(4);
  await settle(page);
  await expect(page.locator(".hunter-compare")).toBeVisible();

  // ── Five typed questions ──────────────────────────────────────────────────
  let reply = await say(page, "Show only woman-owned set-asides");
  await expect.poll(() => cardCount(page)).toBe(3);
  expect(reply).toMatch(/3 matches fit/);
  await expect.poll(() => feedCount(page)).toBe(3);

  reply = await say(page, "start over");
  await expect.poll(() => cardCount(page)).toBe(14);

  reply = await say(page, "under $500K");
  const stated = Number(reply.match(/(\d+) matches fit/)?.[1]);
  await expect.poll(() => cardCount(page)).toBe(stated);
  await expect.poll(() => feedCount(page)).toBe(stated);

  reply = await say(page, "work in VA");
  // Nothing on For You is in Virginia (or her filters leave none), so Hunter opens another list.
  await expect.poll(() => cardCount(page)).toBeGreaterThan(0);
  expect(reply).toMatch(/Virginia/);

  reply = await say(page, "what do you know about my business");
  await expect(page.locator(".hunter-profile")).toBeVisible();
  await say(page, "start over");

  // ── Three filters in the drawer ───────────────────────────────────────────
  await page.getByRole("button", { name: /Opportunities for you/ }).click();
  await settle(page);
  await page.getByRole("button", { name: "Open filters" }).click();
  const done = page.locator(".fd-foot__done");
  const shown = async () => Number((await done.innerText()).match(/\d+/)?.[0]);
  await expect.poll(shown).toBe(await feedCount(page));

  await page.locator(".fd-panel .of-option", { hasText: "WOSB / EDWOSB" }).click();
  await expect.poll(shown).toBe(3);
  await page.locator(".fd-panel .wp-trade__main", { hasText: "North Carolina" }).click();
  await expect.poll(shown).toBe(3);
  await page.locator(".fd-panel .of-value__bucket", { hasText: "$100K–$500K" }).click();
  await expect.poll(shown).toBe(2);
  const drawerCount = await shown();
  await done.click();
  await settle(page);
  await expect.poll(() => feedCount(page)).toBe(drawerCount);
  expect(await cardCount(page)).toBe(drawerCount);
  await expect(page.locator(".fd-active-chips__row")).toContainText("WOSB");

  // A chip's remove button changes the feed.
  await page
    .getByRole("button", { name: /^Remove / })
    .first()
    .click();
  await settle(page);
  await expect.poll(() => feedCount(page)).toBeGreaterThanOrEqual(drawerCount);
  await page.getByRole("button", { name: "Clear all" }).click();
  await settle(page);
  await expect.poll(() => feedCount(page)).toBe(14);

  // ── Search, lane, sort ────────────────────────────────────────────────────
  await page.getByRole("searchbox", { name: "Search opportunities" }).fill("Mackall");
  await expect.poll(() => cardCount(page)).toBe(2);
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect.poll(() => cardCount(page)).toBe(14);

  await page.getByRole("radio", { name: "State and local" }).click();
  await settle(page);
  await expect.poll(() => feedCount(page)).toBe(5);
  await page.getByRole("radio", { name: "Federal" }).click();
  await settle(page);
  await expect.poll(() => feedCount(page)).toBe(9);
  await page.getByRole("radio", { name: "All buyers" }).click();
  await settle(page);

  await page.getByRole("button", { name: /Sort/ }).click();
  await page.getByRole("button", { name: "Closing soonest", exact: true }).click();
  await settle(page);
  const first = await page.locator(".opp-title-compact").first().innerText();
  expect(first).toBe("Mess-attendant staff for 12 Camp Lejeune dining facilities"); // closes in 9 days
  await page.getByRole("button", { name: /Sort/ }).click();
  await page.getByRole("button", { name: "Best match", exact: true }).click();

  // ── Tabs, saves ───────────────────────────────────────────────────────────
  await page.getByRole("button", { name: /All opportunities/ }).click();
  await settle(page);
  expect(await cardCount(page)).toBe(43);
  await expect(page.locator(".opp-why-block")).toHaveCount(0);

  await page.getByRole("button", { name: /^Saved/ }).click();
  await settle(page);
  expect(await cardCount(page)).toBe(8);
  await page.getByRole("button", { name: "Remove from saved" }).first().click();
  await settle(page);
  expect(await cardCount(page)).toBe(7);

  await page.getByRole("button", { name: /Opportunities for you/ }).click();
  await settle(page);
  await page.getByRole("button", { name: "Save opportunity" }).first().click();
  await settle(page);
  await page.getByRole("button", { name: /^Saved/ }).click();
  await settle(page);
  expect(await cardCount(page)).toBe(8);

  // A search the member saves comes back in the drawer.
  await page.getByRole("button", { name: /Opportunities for you/ }).click();
  await page.getByRole("button", { name: "Save this search" }).first().click();
  await page.locator(".ssp__input").fill("Fort Bragg catering");
  await page.locator(".ssp__input").press("Enter");
  await settle(page);
  await page.getByRole("button", { name: "Open filters" }).click();
  await expect(page.locator(".fd-panel")).toContainText("Fort Bragg catering");
  await page.keyboard.press("Escape");

  // ── Nothing broke ─────────────────────────────────────────────────────────
  const unhandled = await page.evaluate(() => JSON.stringify(window.__DEMO_UNHANDLED__ ?? []));
  const errors = await page.evaluate(() => JSON.stringify(window.__DEMO_ERRORS__ ?? []));
  expect(unhandled).toBe("[]");
  expect(errors).toBe("[]");
  expect(await page.locator("main, body").first().innerText()).not.toMatch(BAD);
  expect(problems).toEqual([]);
});
